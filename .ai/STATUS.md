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

- [x] **Navegação & Painel de Configurações Unificado**:
  - [x] Barra superior com 3 seções principais: **Dashboard**, **Lançamentos** e **Configurações**.
  - [x] Painel de **Configurações & Cadastros** com 9 abas integradas:
    - `Categorias` (Gestão de categorias planas com classificação de essencialidade/natureza)
    - `Itens` (Cadastro de itens rápidos com valores sugeridos para lançamentos)
    - `Contas & Carteiras` (Contas correntes, poupanças, investimentos e caixas)
    - `Contatos` (Clientes, fornecedores, colaboradores e favorecidos com CPF/CNPJ e anotações)
    - `Dívidas & Passivos` (Controle de passivos com barra de amortização progressiva)
    - `Orçamentos & Metas` (Tetos mensais por categoria com alertas de consumo normal, atenção e estourado)
    - `Sincronização Nuvem` (Configuração e espelhamento em 8 abas no Google Sheets)
    - `Gestão de Usuários` (Cadastro seguro de novos usuários e controle de acesso)
    - `Aparência & Temas` (Alternância de tema claro/escuro global e tema da tela de login)
  - [x] **Ordenação Alfabética Obrigatória (A a Z)** aplicada a todas as listagens e menus suspensos (Categorias, Itens, Contas, Contatos, Dívidas, Orçamentos e Usuários).

- [x] **Gestão Financeira & Lançamentos**:
  - [x] Dashboard com KPIs de Realizado, A Vencer, Projeção Final do Mês e maiores despesas por categoria.
  - [x] Tela de Lançamentos com **Sistema Dinâmico de Períodos** (Presets: Mês, Hoje, Esta Semana, Próx. 7/30 Dias, Ano Todo, Todas as Datas, Personalizado) e navegador de meses (`<` e `>`).
  - [x] **Atalhos Inteligentes & Alerta de Contas Atrasadas**: Banner dinâmico com valor pendente e filtro em 1 clique para todas as contas vencidas na história.
  - [x] **Busca Textual Global Instantânea**: Filtragem live por descrição, categoria, conta bancária, contato, valor e anotações.
  - [x] **Filtros Multi-Critério**: Status (`Todos`, `Abertas`, `Liquidadas`, `Atrasadas`), Tipo (`Despesas`, `Receitas`), Conta/Carteira e Categoria com ordenação A-Z e botão para limpar filtros.
  - [x] **Entrada e Exibição de Datas em Formato Brasileiro (`DD/MM/AAAA`)**:
    - [x] Input de vencimento no modal de lançamentos com máscara progressiva `dd/mm/aaaa`, validação estrita de calendário e seletor nativo de calendário integrado.
    - [x] Exibição formatada em `DD/MM/AAAA` na tabela de lançamentos.
  - [x] Lançamentos Únicos, Parcelados (em N vezes com badges `1/12`) e Recorrentes mensais.

- [x] **Sincronização Nuvem com Google Sheets (Espelho Integral & Base do App Mobile)**:
  - [x] **Detecção e Indicador Inteligente de Alterações Pendentes**:
    - [x] Endpoint `GET /api/v1/sync/status` calculando pendências de envio (`pending_send`), recebimento da fila (`pending_receive`) e total.
    - [x] Botão dinâmico no cabeçalho com badges visuais (`↑ Envio`, `↓ Recebimento`), indicador pulsante de atenção e estado de sincronização.
    - [x] Menu / Popover interativo com detalhamento de dados locais vs. fila móvel, horário da última sincronização e atalhos rápidos (*Sincronizar Tudo*, *Apenas Enviar*, *Apenas Receber*).
    - [x] Painel de status em tempo real com cartões de envio/recebimento na aba **Configurações > Sincronização Nuvem**.
    - [x] Atualização automática após criação, liquidação, edição e exclusão de transações.
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
  - [x] **Guia Interativo Passo a Passo de Configuração & Tutorial**:
    - [x] Modal interativo [SyncSetupGuideModal.tsx](file:///home/jsilvaneto/projetos/wallet/frontend/src/components/SyncSetupGuideModal.tsx) com 4 passos visuais (Criação de Service Account, Ativação das APIs Sheets & Drive, Criação e Compartilhamento da Planilha Google, e Conexão no Wallet).
    - [x] Botões com links diretos para ativação da Google Sheets API, Google Drive API e Google Cloud Console.
    - [x] Cópia em 1 clique do e-mail da Service Account e banner informativo na aba **Configurações > Sincronização Nuvem**.

- [x] **Gestão de Comprovantes & Armazenamento em Diretório Customizado (Local-First)**:
  - [x] **Armazenamento Local Primário Instantâneo com Diretório Customizável**:
    - [x] Modelo `Attachment` no SQLite WAL com particionamento inteligente em disco: `{storage_dir}/{profile}/{ano}/{mes}/`.
    - [x] Suporte a definição de qualquer diretório base (disco local, HD externo, pasta na rede ou sincronizada) persistido em `SystemConfig("storage_directory")`.
    - [x] Endpoints `GET /api/v1/attachments/storage-dir`, `POST /api/v1/attachments/storage-dir` e `POST /api/v1/attachments/storage-dir/reset`.
    - [x] Migração e cópia automática em lote de comprovantes existentes ao alternar o diretório, com validação de permissões de escrita e cálculo de espaço livre em disco.
    - [x] Fallback inteligente para o diretório padrão original caso algum arquivo antigo não tenha sido migrado.
    - [x] Suporte completo a fotos (JPG, PNG, WEBP, HEIC) e documentos fiscais/recibos em PDF até 15MB.
    - [x] Resposta de upload e leitura ultrarrápida (< 50ms).
  - [x] **Interface do Usuário (Frontend)**:
    - [x] Painel de **Armazenamento de Anexos & Comprovantes** na aba **Configurações > Sincronização Nuvem**:
      - [x] Indicador de diretório ativo com badge de gravação (`✓ Gravável & Ativo`).
      - [x] Indicador de `Diretório Padrão` vs. `Diretório Personalizado`.
      - [x] Métricas de contagem total de arquivos, espaço ocupado e espaço livre na partição do disco.
      - [x] Formulário para alteração de diretório com checkbox de migração automática e botão para restaurar o diretório padrão.
    - [x] Modal e lightbox interativo [AttachmentViewerModal.tsx](file:///home/jsilvaneto/projetos/wallet/frontend/src/components/AttachmentViewerModal.tsx) com zoom, rotação, visualizador embutido de PDF, download direto e exclusão.
    - [x] Área de upload no modal de lançamentos [TransactionModal.tsx](file:///home/jsilvaneto/projetos/wallet/frontend/src/components/TransactionModal.tsx) com miniaturas dos comprovantes carregados antes de salvar.
    - [x] Indicador de clipe 📎 com contagem na tabela de lançamentos [Transactions.tsx](file:///home/jsilvaneto/projetos/wallet/frontend/src/pages/Transactions.tsx) e abertura instantânea do visualizador.

- [x] **Ambiente WSL & Scripts**:
  - [x] Script [start.sh](file:///home/jsilvaneto/projetos/wallet/start.sh) automatizado para validação de ambiente e execução paralela com encerramento limpo.

---

### Fase 2: Aplicativo Mobile Android (Planejado)

- [ ] Arquitetura offline-first para registro rápido de despesas e receitas em campo.
- [ ] Envio de lançamentos pendentes para a aba `Fila_Mobile` do Google Sheets.
- [ ] Consulta de saldo e limites de orçamentos consolidados.
- [ ] Documentação de requisitos detalhada em [.ai/ANDROID_APP.md](file:///home/jsilvaneto/projetos/wallet/.ai/ANDROID_APP.md).
