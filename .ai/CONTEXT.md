# Wallet - Contexto do Projeto e Status

## 1. Visão Geral
O **Wallet** é um sistema de gestão financeira pessoal e empresarial orientado ao paradigma **Local-First**, desenvolvido para oferecer controle total sobre contas a pagar, contas a receber, dívidas/financiamentos, metas orçamentárias e projeções de fluxo de caixa com privacidade, robustez e performance em ambiente local (WSL / Linux / Docker).

---

## 2. Perfis de Operação
O sistema opera com separação estrita e contextual entre dois ambientes:
- **PESSOAL**: Gestão das despesas familiares, investimentos, salários, moradia, saúde, educação e lazer.
- **EMPRESA**: Gestão do fluxo de caixa PJ, prestação de serviços, venda de produtos, fornecedores, folha/pró-labore, impostos (DAS/GPS), software e infraestrutura.

Ambos os perfis compartilham a mesma infraestrutura de banco de dados com isolamento por coluna `profile` em todas as tabelas transacionais.

---

## 3. Status das Fases de Desenvolvimento

### Fase 1: Fundação, Backend, Sincronização e Web App (CONCLUÍDA ✓)
- [x] **Backend FastAPI Assíncrono**:
  - API RESTful completa com SQLAlchemy 2.0 Async e Pydantic v2.
  - Autenticação JWT com hashing nativo `bcrypt` e proteção de rotas.
  - Seed automático no primeiro boot (usuário `admin`/`admin`, 20 categorias padrão e contas).
  - Rotas de Autenticação, Contas, Categorias, Contatos, Dívidas, Lançamentos, Agendamentos, Orçamentos e Dashboard.
- [x] **Banco de Dados SQLite WAL Local-First**:
  - Motor SQLite com `journal_mode=WAL` e `synchronous=NORMAL` via `aiosqlite`.
  - Integridade referencial com `PRAGMA foreign_keys=ON`.
  - Isolamento dos arquivos de banco em `backend/data/wallet.db`.
- [x] **Módulo de Sincronização Google Sheets (Mirror Sync & Web Management)**:
  - Serviço `GoogleSheetsService` para espelhamento e importação de lançamentos via Service Account OAuth2.
  - Interface Web completa na aba **Sincronização Nuvem** para configuração de ID de planilha, upload/edição de `credentials.json`, teste de conexão e ações direcionais:
    - **Envio de Dados (Exportação)**: SQLite -> aba `Transacoes`.
    - **Recebimento de Dados (Importação)**: aba `Fila_Mobile` -> SQLite.
    - **Sincronização Completa (Mirror)**: Recebimento da fila + Envio consolidado.
  - Histórico e logs de auditoria persistentes com detalhes de status, itens processados e mensagens de erro.
- [x] **Frontend Web React 19 + TypeScript + Vite + Tailwind CSS**:
  - Interface moderna, responsiva, com suporte completo a Modo Claro / Escuro (*Dark Mode*).
  - Tela de autenticação direta com suporte a tema **Escuro ou Claro** configurável pelo usuário.
  - Alternador instantâneo de perfis Pessoal e Empresa.
  - Botão de ocultar/exibir valores sensíveis em tela.
  - Painel Geral (Dashboard) com KPIs (Realizado, A Vencer, Projeção Final do Mês), alertas de atraso e maiores despesas por categoria.
  - Gestão de Lançamentos & Contas com filtros por Status, Tipo, Período mensal e liquidação/exclusão.
  - Modal dinâmico para Lançamentos Únicos, Parcelados (em N vezes) e Recorrentes mensais.
  - Módulo de **Cadastros & Metas** com 4 abas financeiras: Categorias, Contatos, Dívidas (com barra de amortização) e Orçamentos (com acompanhamento de teto de gastos e alertas).
  - Módulo de **Configurações do Sistema** com 3 seções completas:
    - **Aparência & Login**: Escolha de tema da tela de login (Clara ou Escura), tema global do sistema e modo privacidade.
    - **Gestão de Usuários**: Cadastro seguro de novos usuários e listagem/exclusão de usuários existentes com proteção do último administrador.
    - **Sincronização Nuvem**: Configuração de credenciais Google Sheets, ações direcionais e auditoria de logs.
- [x] **Ambiente de Execução WSL**:
  - Script automatizado [start.sh](file:///home/jsilvaneto/projetos/wallet/start.sh) para validação de dependências (`venv`, `node_modules`), inicialização paralela e encerramento limpo via `Ctrl + C`.

---

### Fase 2: Aplicativo Mobile Android (PLANEJADA)
- [ ] Aplicativo nativo / multiplataforma para sincronização e controle financeiro offline e mobile.
- [ ] Documentação de requisitos detalhada em [.ai/ANDROID_APP.md](file:///home/jsilvaneto/projetos/wallet/.ai/ANDROID_APP.md).
