import asyncio
import sys
import os
from datetime import date

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database import AsyncSessionLocal, engine, Base
from app.models import CreditCard, Account, Category, Transaction, Schedule
from app.main import migrate_database_schema, seed_initial_data
from app.schemas.schedule import ScheduleCreate
from app.schemas.credit_card import CreditCardInvoiceSettleRequest
from app.services.credit_card_service import (
    calculate_invoice_period_and_due_date,
    calculate_card_limits,
    get_card_invoices_summary,
    get_invoice_detail,
    settle_card_invoice,
    unsettle_card_invoice
)
from app.services.schedule_service import create_schedule_with_transactions

async def run_tests():
    print("Iniciando validação do módulo de Cartões de Crédito e Faturas...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await migrate_database_schema()
    await seed_initial_data()

    async with AsyncSessionLocal() as db:
        # 1. Teste de cálculo de ciclo e vencimento
        # Compra dia 15/08 com fechamento 20 e vencimento 27 -> cai na fatura 08/2026 vencendo em 27/08/2026
        m, y, start, end, due = calculate_invoice_period_and_due_date(date(2026, 8, 15), 20, 27)
        assert (m, y) == (8, 2026), f"Esperado (8, 2026), obtido ({m}, {y})"
        assert due == "2026-08-27", f"Esperado 2026-08-27, obtido {due}"
        print("✓ Cálculo de compra antes do fechamento (15/08) correto: Fatura 08/2026, vence 27/08/2026")

        # Compra dia 22/08 com fechamento 20 e vencimento 27 ("melhor dia") -> cai na fatura 09/2026 vencendo em 27/09/2026
        m2, y2, start2, end2, due2 = calculate_invoice_period_and_due_date(date(2026, 8, 22), 20, 27)
        assert (m2, y2) == (9, 2026), f"Esperado (9, 2026), obtido ({m2}, {y2})"
        assert due2 == "2026-09-27", f"Esperado 2026-09-27, obtido {due2}"
        print("✓ Cálculo de compra após o fechamento (22/08) correto: Fatura 09/2026, vence 27/09/2026")

        # 2. Cria conta bancária para teste
        acc = Account(profile="PESSOAL", name="Conta Teste Itaú", type="CORRENTE")
        db.add(acc)
        await db.commit()
        await db.refresh(acc)

        # 3. Cria cartão de crédito para teste
        card = CreditCard(
            profile="PESSOAL",
            name="Nubank Black Teste",
            limit_cents=1000000, # R$ 10.000,00
            closing_day=20,
            due_day=27,
            color="purple",
            brand="MASTERCARD",
            account_id=acc.id
        )
        db.add(card)
        await db.commit()
        await db.refresh(card)
        print(f"✓ Cartão criado: {card.name} (Limite: R$ {card.limit_cents / 100:.2f})")

        # 4. Busca uma categoria de despesa
        from sqlalchemy import select
        cat = (await db.execute(select(Category).where(Category.profile == "PESSOAL", Category.type == "DESPESA"))).scalars().first()
        assert cat is not None, "Categoria não encontrada"

        # 5. Cria compra parcelada em 3x de R$ 200,00 no cartão
        sched_in = ScheduleCreate(
            profile="PESSOAL",
            type="DESPESA",
            account_id=acc.id,
            credit_card_id=card.id,
            category_id=cat.id,
            description="Smartphone Teste",
            schedule_type="PARCELADA",
            frequency="MENSAL",
            amount_cents=20000, # R$ 200,00 por parcela = R$ 600,00 total
            total_installments=3,
            start_date="2026-08-15",
            due_day=27
        )
        sched = await create_schedule_with_transactions(db, sched_in)
        print("✓ Parcelamento de 3x criado com sucesso")

        # 6. Verifica limites do cartão
        used, avail, cur_inv = await calculate_card_limits(db, card)
        assert used == 60000, f"Esperado limite usado 60000, obtido {used}"
        assert avail == 940000, f"Esperado limite disponível 940000, obtido {avail}"
        print(f"✓ Limites calculados: Usado = R$ {used/100:.2f}, Disponível = R$ {avail/100:.2f}")

        # 7. Verifica faturas geradas
        summaries = await get_card_invoices_summary(db, card)
        print(f"✓ Faturas encontradas: {len(summaries)}")
        for s in summaries:
            print(f"   -> Fatura {s.month:02d}/{s.year}: Total = R$ {s.total_cents/100:.2f}, Status = {s.status}")

        # 8. Detalhe da fatura 08/2026
        inv_detail = await get_invoice_detail(db, card, 2026, 8)
        assert inv_detail.total_cents == 20000, f"Esperado 20000 na fatura 08/2026, obtido {inv_detail.total_cents}"
        assert len(inv_detail.items) == 1
        print(f"✓ Detalhe fatura 08/2026: 1 item de R$ {inv_detail.total_cents/100:.2f} ({inv_detail.items[0].description})")

        # 9. Liquidação da fatura 08/2026
        settle_req = CreditCardInvoiceSettleRequest(
            account_id=acc.id,
            payment_date="2026-08-27",
            amount_cents=20000,
            notes="Pagamento teste fatura 08/2026"
        )
        settle_res = await settle_card_invoice(db, card, 2026, 8, settle_req)
        assert settle_res.total_settled_cents == 20000
        print(f"✓ Fatura 08/2026 liquidada com sucesso! Transação bancária ID: {settle_res.bank_transaction_id}")

        # 10. Verifica se o limite disponível foi recomposto
        used_after, avail_after, _ = await calculate_card_limits(db, card)
        assert used_after == 40000, f"Esperado usado 40000 após pagar 1 parcela, obtido {used_after}"
        assert avail_after == 960000, f"Esperado disponível 960000, obtido {avail_after}"
        print(f"✓ Limite recomposto após pagamento da fatura: Usado = R$ {used_after/100:.2f}, Disponível = R$ {avail_after/100:.2f}")

        # 11. Teste de estorno/reabertura da fatura
        unsettle_res = await unsettle_card_invoice(db, card, 2026, 8)
        used_reopen, avail_reopen, _ = await calculate_card_limits(db, card)
        assert used_reopen == 60000
        print(f"✓ Fatura reaberta com sucesso: Limite usado retornou para R$ {used_reopen/100:.2f}")

        # Cleanup
        await db.delete(card)
        await db.delete(acc)
        from sqlalchemy import delete
        await db.execute(delete(Transaction).where(Transaction.schedule_id == sched.id))
        await db.delete(sched)
        await db.commit()
        print("✓ Limpeza de dados de teste concluída.")

    print("\n✓ TODOS OS TESTES BACKEND DE CARTÕES DE CRÉDITO E FATURAS PASSARAM COM 100% DE SUCESSO!")

if __name__ == "__main__":
    asyncio.run(run_tests())
