# Status do Projeto (STATUS.md)

Este documento registra o progresso consolidado de desenvolvimento do **Wallet**, os módulos finalizados e o roadmap de evolução.

---

## 🚀 Visão Geral das Fases

| Fase | Escopo | Status |
| :--- | :--- | :--- |
| **Fase 1** | Backend FastAPI + SQLite WAL + Sync Google Sheets + Web App React 19 + Gestão Completa | **100% CONCLUÍDO** |
| **Fase 2** | Aplicativo Mobile Android (Nativo/Multiplataforma) + Controle Offline | **PLANEJADO** |

---

## 📋 Checklist Detalhado de Implementação

### Fase 1: Plataforma Web & Backend (Concluída)

- [x] **Arquitetura Base e Persistência**:
  - [x] Backend assíncrono em FastAPI (Python 3.10+) com documentação Swagger/OpenAPI.
  - [x] Banco de dados SQLite local com `PRAGMA journal_mode = WAL` e suporte a concorrência assíncrona via `aiosqlite`.
  - [x] Modelos de dados completos: `User`, `Account`, `Category`, `Item`, `Contact`, `Goal`, `Debt`, `Budget`, `Transaction`, `Schedule`, `SystemConfig`, `SyncLog`.
  - [x] Valores monetários representados estritamente em centavos inteiros (`amount_cents: int`).
  - [x] Migrações dinâmicas de inicialização e seeds automáticos de categorias e credenciais padrão.

- [x] **Autenticação & Gestão de Usuários**:
  - [x] Autenticação via JWT (OAuth2 Password Bearer) e hash seguro com bcrypt/passlib.
  - [x] Tela de login direto com tema dinâmico (**Modo Escuro** ou **Modo Claro**) configurável.
  - [x] Cadastro e gerenciamento seguro de usuários movido para a aba **Configurações &gt; Gestão de Usuários**.
  - [x] Proteção contra auto-exclusão e contra exclusão do último administrador do sistema.

- [x] **Hierarquia de Categorias, Subcategorias & Natureza**:
  - [x] Categorias principais e subcategorias aninhadas (`parent_id`) com integridade referencial.
  - [x] Classificação financeira por **Natureza da Categoria** nos 4 tipos:
    - `NENHUM`: Neutro / sem classificação específica.
    - `OBRIGATORIO`: Gastos fixos essenciais, moradia, impostos, salários.
    - `NECESSARIO`: Alimentação básica, transporte, saúde e educação.
    - `DESEJO`: Lazer, entretenimento, viagens, restaurantes e supérfluos.
  - [x] Interface em árvore com badges coloridos de alto contraste para o tema escuro.
  - [x] Edição completa via Modal dedicado (`EditCategoryModal`) para renomeação, troca de natureza, tipo e hierarquia com propagação em cascata.

- [x] **Itens Vinculados a Subcategorias**:
  - [x] Cadastro e edição de itens específicos vinculados a subcategorias na aba **Cadastros & Metas > Itens**.
  - [x] Modal de edição rápida (`EditItemModal`) para atualização de nome, subcategoria e valor padrão sugerido.
  - [x] Definição de valor padrão sugerido (R$) por item.
  - [x] Bloco de seleção rápida no modal de lançamentos ([TransactionModal.tsx](file:///home/jsilvaneto/projetos/wallet/frontend/src/components/TransactionModal.tsx)) com auto-preenchimento de subcategoria, descrição e valor sugerido.

- [x] **Contas Bancárias e Carteiras**:
  - [x] Gestão completa na aba **Cadastros & Metas > Contas** com filtros por tipo (`CORRENTE`, `POUPANCA`, `INVESTIMENTO`, `CAIXA`, `OUTRO`) e busca por texto.
  - [x] Modal de edição rápida (`EditAccountModal`) para renomeação e troca de modalidade/tipo.
  - [x] Cards estilizados com KPIs de totais e ícones de cada modalidade financeira.
  - [x] Associação de conta bancária / carteira nos lançamentos únicos, parcelados e recorrentes ([TransactionModal.tsx](file:///home/jsilvaneto/projetos/wallet/frontend/src/components/TransactionModal.tsx)).

- [x] **Gestão Financeira, Dívidas & Orçamentos**:
  - [x] Dashboard com KPIs de Realizado, A Vencer, Projeção Final do Mês e maiores despesas por categoria.
  - [x] Tela de Lançamentos com **Sistema Dinâmico de Períodos** (Presets: Mês, Hoje, Esta Semana, Próx. 7/30 Dias, Ano Todo, Todas as Datas, Personalizado) e navegador de meses (`<` e `>`).
  - [x] **Atalhos Inteligentes & Alerta de Contas Atrasadas**: Banner dinâmico com valor pendente e filtro em 1 clique para todas as contas vencidas na história.
  - [x] **Busca Textual Global Instantânea**: Filtragem live por descrição, categoria, conta bancária, contato, valor e anotações.
  - [x] **Filtros Multi-Critério**: Status (`Todos`, `Abertas`, `Liquidadas`, `Atrasadas`), Tipo (`Despesas`, `Receitas`), Conta/Carteira e Categoria com botão para limpar filtros.
  - [x] Lançamentos Únicos, Parcelados (em N vezes com badges `1/12`) e Recorrentes mensais.
  - [x] Módulo de Dívidas com acompanhamento de amortização e saldo devedor.
  - [x] Módulo de Orçamentos com tetos de gastos mensais e alertas de consumo percentual.

- [x] **Sincronização Nuvem com Google Sheets (Espelho Integral & Base do App Mobile)**:
  - [x] Gerenciamento web das configurações na aba **Configurações > Sincronização Nuvem**.
  - [x] Upload/edição de `credentials.json` (Service Account) e ID da planilha salvos no banco local.
  - [x] Espelhamento automático de **8 abas integradas**:
    - `Transacoes` (Lançamentos consolidados de receitas e despesas com metadados)
    - `Categorias` (Árvore hierárquica, tipo e natureza de essencialidade)
    - `Itens` (Catálogo de itens vinculados a subcategorias e valores padrão sugeridos)
    - `Contas` (Contas bancárias, carteiras e aplicações)
    - `Contatos` (Clientes, fornecedores, colaboradores e favorecidos)
    - `Dividas` (Passivos, credores, valor total/restante e status)
    - `Orcamentos` (Metas e limites de gastos mensais por categoria)
    - `Fila_Mobile` (Buffer para ingestão e reconciliação de lançamentos do app mobile)
  - [x] Ações direcionais em lote (*batchUpdate*) com auditoria detalhada por entidade em `sync_logs`.

- [x] **Ambiente WSL & Scripts**:
  - [x] Script [start.sh](file:///home/jsilvaneto/projetos/wallet/start.sh) automatizado para validação de ambiente e execução paralela com encerramento limpo.

---

### Fase 2: Aplicativo Mobile Android (Planejado)

- [ ] Arquitetura offline-first para registro rápido de despesas e receitas em campo.
- [ ] Envio de lançamentos pendentes para a aba `Fila_Mobile` do Google Sheets.
- [ ] Consulta de saldo e limites de orçamentos consolidados.
- [ ] Documentação de requisitos detalhada em [.ai/ANDROID_APP.md](file:///home/jsilvaneto/projetos/wallet/.ai/ANDROID_APP.md).
