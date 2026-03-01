# Wallet API Specification

## Endpoints (Resumo)

### Auth
- `POST /auth/login` (Requer `email` e `password`). Retorna `access_token`.

### Users
- `POST /users` (Cria novo usuário).

### Financial Accounts
- `POST /financial-accounts` (Cria conta financeira).
- `GET /financial-accounts`
- `DELETE /financial-accounts/:id`

### Categories & Cost Centers
- `POST /categories`
- `POST /cost-centers`
...

### Accounts
- `POST /accounts` (DTO requires type, times, balance, recurrence, etc.)
- `PATCH /accounts/:id/pay` (Recebe payload `{ payment_date: ISO }` e marca a conta como PAGA).
- `DELETE /accounts/:id` (Aplica a lógica Soft Delete).

### Dashboard
- `GET /dashboard` (Requer JWT. Retorna JSON com os saldos atuais, contas do mês separadas, consolidados e projeções trimestrais, semestrais e anuais).
