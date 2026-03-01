# Regras de Negócio OBRIGATÓRIAS

Este documento unifica o regulamento da aplicação Wallet.

1. **Autenticação**: Apenas Admin e User. Ambos geram logs.
2. **Atualização Automática de Status**:
    - Se a conta receber `payment_date` ela se torna `PAID`.
    - Se `due_date` for no passado e estiver `PENDING`, a consulta de Dashboards e Listagem deverá computar a conta como `OVERDUE`.
3. **Mecanismo de Recorrência**:
    - Toda criação de conta recorrente (`MONTHLY`, `YEARLY`, `CUSTOM`) gera cópias autônomas para até 12 meses futuros através de loops no Service, respeitando os seus cronogramas dinâmicos.
4. **Cálculos de Dashboard e Projeções**:
    - Nenhuma matemática de balanço acontece no Controller. O Dashboard realiza cálculos cruzados de saldos, subtraindo despesas PENDENTES futuras ao `initial_balance` da conta financeira para as visões projetadas (3, 6, 12 meses).
