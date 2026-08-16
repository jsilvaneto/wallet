# ADR 002: Estratégia de Espelhamento e Sincronização em Nuvem via Google Sheets API

## Status
**Aceito**

## Contexto
No modelo de operação com SQLite local, os dados primários residem no banco local. No entanto, os usuários necessitam de:
1. Uma cópia de backup / espelho em nuvem para visualização de relatórios analíticos em planilhas.
2. Uma forma de lançar despesas remotamente (ex: em trânsito no celular) sem expor o banco de dados local na internet pública.
3. Total controle sobre credenciais, com histórico de auditoria e logs de execução.

## Decisão
1. **Google Sheets como Ponte em Nuvem**: Utilizar a API oficial do Google Sheets (v4) com autenticação via Service Account OAuth2 (`credentials.json`).
2. **Separação de Papéis por Abas**:
   - **`Transacoes`**: Aba que recebe a exportação consolidada de todas as transações do SQLite local, atuando como espelho analítico de leitura.
   - **`Fila_Mobile`**: Aba que funciona como fila de entrada de lançamentos gerados remotamente. A rotina de importação lê os novos itens da fila, converte-os em transações locais no SQLite e atualiza o status na planilha para `PROCESSADO`.
3. **Ações Direcionais Independentes**:
   - **Exportar (`/sync/export`)**: Envio unidirecional SQLite -&gt; Aba `Transacoes`.
   - **Importar (`/sync/import`)**: Leitura unidirecional Aba `Fila_Mobile` -&gt; SQLite.
   - **Sincronização Completa (`/sync/full`)**: Importa a fila pendente e em seguida reexporta a visão consolidada.
4. **Armazenamento Seguro de Credenciais e Auditoria**:
   - As credenciais de serviço e o ID da planilha são persistidos na tabela `system_configs` do banco de dados local.
   - Cada operação gera um registro na tabela `sync_logs` com status (`SUCESSO`, `FALHA`), contagem de itens importados/exportados, mensagem descritiva e timestamp ISO 8601.

## Consequências

### Positivas
- **Desacoplamento e Segurança**: O backend local não precisa expor portas públicas na internet. A comunicação é sempre originada pelo cliente local para a API do Google via HTTPS.
- **Transparência**: O usuário tem auditoria completa de cada sincronização na interface web em **Configurações &gt; Sincronização Nuvem**.
- **Flexibilidade**: O usuário pode visualizar suas finanças no Google Sheets em qualquer dispositivo sem comprometer a soberania dos dados do SQLite local.

### Negativas / Mitigações
- Limites de taxa de requisições da Google Sheets API (*rate limits*) — mitigados com processamento em lote (*batch update*).
