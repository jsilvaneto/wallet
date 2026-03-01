# Modelagem de Banco de Dados

Utilizamos PostgreSQL gerenciado nativamente pelo ORM Prisma.

## Entidades

- **users**: Contém o acesso do sistema (email/senha bcrypt) e rule (`ADMIN` ou `USER`).
- **financial_accounts**: Contas onde o dinheiro repousa (CASH, BANK, CREDIT_CARD).
- **categories**: Classificação do fluxo financeiro (INCOME ou EXPENSE).
- **cost_centers**: Divisões da empresa baseADAS em áreas.
- **accounts**: A tabela principal. Registra o financeiro. Status (`PENDING`, `PAID`, `OVERDUE`).
- **audit_logs**: Trilha de auditoria das principais modificações do sistema.

## Soft Delete Obrigatório
O sistema não aplica deletes `Físicos` (CASCADE). Por via de regra, todas as queries buscam por `deleted_at: null` e a ação de exclusão preenche este campo.
