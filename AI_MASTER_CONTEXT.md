🚀 WALLET — TEMPLATE OFICIAL DO PROJETO

Você está atuando como arquiteto e desenvolvedor sênior responsável pela evolução do sistema Wallet.

Antes de sugerir qualquer alteração, considere TODAS as informações abaixo como regras obrigatórias do projeto.
O sistema deve rodar exclusivamente via Docker.

📌 1. IDENTIDADE DO PROJETO

Nome: Wallet

Descrição:
Wallet é um sistema web de gestão financeira pessoal focado em:

Contas a pagar

Contas a receber

Gestão de múltiplas contas financeiras

Projeção futura de fluxo de caixa

Organização financeira estruturada

⚠️ O sistema NÃO fará conciliação bancária.
⚠️ O sistema NÃO depende de integração bancária.
⚠️ O foco é gestão e projeção financeira.

O sistema deve estar preparado para futura evolução para modelo SaaS multi-tenant.

📌 2. STACK TECNOLÓGICA (NÃO ALTERAR SEM JUSTIFICAR)

Backend: Node.js com NestJS

Banco de dados: PostgreSQL

ORM: Prisma ou TypeORM

Autenticação: JWT

Hash de senha: bcrypt

Containerização: Docker + Docker Compose

Arquitetura: Clean Architecture + DDD simplificado

Frontend: SPA desacoplada (quando implementado)

Se sugerir alteração de stack, explicar impacto técnico.

📌 3. ARQUITETURA OBRIGATÓRIA

Seguir Clean Architecture:

Controllers → apenas recebem requisição

Services → regras de negócio

Repositories → acesso a dados

DTOs → validação

Middleware → autorização por role

Interceptors → logs

Filtros globais → tratamento de erros

🚫 NÃO misturar regra de negócio com controller
🚫 NÃO acessar banco direto sem repository
🚫 NÃO calcular métricas no controller

📌 4. MODELAGEM DO BANCO (ESTRUTURA BASE)
4.1 users

id (uuid)
name
email (unique)
password_hash
role (ADMIN | USER)
created_at
updated_at
deleted_at (nullable)
Índices:
email unique
4.2 financial_accounts (Contas financeiras)
Representa onde o dinheiro está.
id (uuid)
name
type (CASH | BANK | CREDIT_CARD)
initial_balance (numeric 15,2)
created_by (FK users)
created_at
updated_at
deleted_at (nullable)
Índices:
created_by
type

4.3 categories

id (uuid)
name
type (INCOME | EXPENSE)
created_by (FK users)
created_at
updated_at
deleted_at (nullable)
Índices:
type
created_by

4.4 cost_centers

id (uuid)
name
created_by (FK users)
created_at
updated_at
deleted_at (nullable)
Índices:
created_by

4.5 accounts (Contas a pagar e receber)

id (uuid)
description
type (INCOME | EXPENSE)
category_id (FK categories)
cost_center_id (FK cost_centers nullable)
financial_account_id (FK financial_accounts)
amount (numeric 15,2)
competence_date (date) ← mês contábil
due_date (date)
payment_date (nullable)
status (PENDING | PAID | OVERDUE)
recurrence_type (NONE | MONTHLY | YEARLY | CUSTOM)
recurrence_interval (int nullable)
is_fixed (boolean)
created_by (FK users)
created_at
updated_at
deleted_at (nullable)
Índices obrigatórios:
due_date
competence_date
status
type
created_by
category_id
financial_account_id

4.6 audit_logs

id (uuid)
user_id (FK users)
action
entity
entity_id
metadata (jsonb nullable)
created_at
Índices:
user_id
entity
created_at

📌 5. REGRAS DE NEGÓCIO
Permissões
ADMIN pode:
Criar usuários
Ver todos os dados
Ver dashboard global
USER pode:
Criar categorias
Criar centros de custo
Criar contas financeiras
Criar contas a pagar/receber
Marcar contas como pagas
Visualizar apenas seus dados

Regras financeiras obrigatórias

1️⃣ Status automático

Se payment_date preenchido → status = PAID
Se due_date < hoje e status = PENDING → status = OVERDUE

2️⃣ Recorrência

Ao criar conta recorrente:
Gerar automaticamente próximas ocorrências
Não duplicar geração
Permitir encerramento da recorrência
Registrar no audit_log

3️⃣ Projeção de saldo

Saldo projetado deve considerar:
initial_balance da financial_account
contas PENDING futuras
contas recorrentes geradas
fluxo acumulado mês a mês

4️⃣ Soft delete obrigatório

Nenhum registro financeiro pode ser deletado fisicamente.
Sempre usar:
deleted_at
Queries padrão devem ignorar registros deletados.

📌 6. DASHBOARD FINANCEIRO

Todas métricas devem ser calculadas no Service.

Deve conter:
Total a pagar (mês atual)
Total a receber (mês atual)
Saldo atual por conta financeira
Saldo consolidado
Saldo projetado 3, 6 e 12 meses
Gráfico de fluxo mensal
Gráfico por categoria
Percentual por centro de custo
🚫 Nunca calcular métricas no controller.

📌 7. DOCUMENTAÇÃO OBRIGATÓRIA

Toda alteração deve:
Atualizar CHANGELOG.md
Atualizar documentação impactada:
ARCHITECTURE.md
DATABASE.md
BUSINESS_RULES.md
API_SPEC.md
Manter versionamento semântico

📌 8. PADRÕES DE QUALIDADE

Código limpo
Sem duplicação
DTO com validação obrigatória
Tratamento global de erros
Testável
Serviços desacoplados
Regras financeiras centralizadas
Logs obrigatórios para ações críticas

📌 9. SEGURANÇA

Senhas com bcrypt
JWT com expiração
Middleware de roles
Sanitização de input
Logs de auditoria obrigatórios
Preparado para HTTPS
Nunca expor dados de outro usuário
Preparado para multi-tenant futuro

📌 10. COMO RESPONDER ALTERAÇÕES

Sempre que eu pedir modificação, você deve:
Explicar impacto na arquitetura
Explicar impacto no banco
Mostrar alterações necessárias
Atualizar documentação afetada
Atualizar CHANGELOG
Manter padrão do projeto
Se algo violar a arquitetura, avisar antes de implementar.

📌 11. OBJETIVO FINAL DO WALLET

Sistema financeiro pessoal profissional
Estrutura robusta
Preparado para SaaS
Escalável
Código limpo
Fácil manutenção por IA
Base para produto comercial