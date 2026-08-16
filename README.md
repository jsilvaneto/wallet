# 💼 Wallet - Sistema de Gestão Financeira
 
O **Wallet** é uma plataforma moderna de controle financeiro pessoal e empresarial, desenvolvida para proporcionar total soberania de dados, alta performance e controle granular de receitas, despesas, parcelamentos, dívidas, orçamentos e sincronização em nuvem.

---

## 🚀 Status do Projeto

- **Fase 1 (Backend, SQLite WAL, Sync Google Sheets & Frontend Web)**: **CONCLUÍDA ✓**
- **Fase 2 (Aplicativo Mobile Android)**: *Planejada* (Veja [.ai/ANDROID_APP.md](.ai/ANDROID_APP.md))

---

## ✨ Principais Funcionalidades

- 🌓 **Perfis Contextuais**: Alternância instantânea entre modo **Pessoal** e modo **Empresa (PJ)** com isolamento completo de categorias e relatórios.
- 📊 **Dashboard Completo**: KPIs de receitas e despesas realizadas, a vencer e projeção final do mês com gráfico de consumo por categoria.
- ⚡ **Alertas de Vencimento**: Identificação e destaque automático de contas vencendo hoje e contas atrasadas.
- 💳 **Lançamentos Flexíveis**: Suporte a lançamentos únicos, parcelamentos automáticos em N parcelas e despesas fixas recorrentes.
- 🔒 **Modo Privacidade**: Botão para ocultar/exibir valores na tela em ambientes compartilhados.
- 📂 **Categorias & Subcategorias Hierárquicas**: Criação de categorias principais e subcategorias aninhadas para detalhamento refinado de receitas e despesas.
- 🏷️ **Natureza das Categorias**: Classificação financeira por essencialidade nos 4 tipos: *Obrigatório*, *Necessário*, *Desejo* e *Nenhum*.
- 📦 **Itens Vinculados a Subcategorias**: Cadastro de itens específicos com valor padrão sugerido (R$) e preenchimento instantâneo nos lançamentos únicos, parcelados e recorrentes.
- ⚙️ **Menu de Configurações Centralizado**:
  - **Aparência & Tela de Login**: Escolha se a tela de login inicial deve ser renderizada em **Modo Escuro (Dark)** ou **Modo Claro (Light)**, além do tema global do sistema.
  - **Gestão Segura de Usuários**: Cadastro de novos usuários movido com segurança para dentro do sistema autenticado, com listagem e remoção de contas.
  - **Sincronização Google Sheets**: Configuração de credenciais JSON, teste de conexão, ações direcionais de envio/recebimento e logs de auditoria.

---

## 🛠️ Stack Tecnológica

### Backend
- **FastAPI** (Python 3.10+) com arquitetura assíncrona
- **SQLAlchemy 2.0 Async** + **aiosqlite**
- **SQLite** com modo WAL (`Write-Ahead Logging`) e integridade referencial
- **JWT Auth** com hashing nativo `bcrypt`
- **Pydantic v2**
- **Google Sheets API v4** via Service Account OAuth2

### Frontend
- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS 3.4** + **Lucide React Icons**
- **Axios** com interceptors de autenticação

---

## 🏁 Como Executar o Projeto (WSL / Linux)

### Pré-requisitos
- Python 3.10+
- Node.js 18+ e npm
- WSL2 (caso esteja no Windows)

### Inicialização Rápida

Na raiz do repositório, basta rodar:

```bash
./start.sh
```

O script cuidará automaticamente de:
1. Criar o ambiente virtual `backend/venv` e instalar dependências do `requirements.txt`.
2. Instalar os pacotes `node_modules` no frontend via npm (se necessário).
3. Iniciar o servidor backend na porta **8000**.
4. Iniciar o servidor frontend Vite na porta **5173**.
5. Executar o seed inicial de dados caso o banco esteja novo.

---

## 🔑 Acesso Inicial

Abra no seu navegador:
- **Aplicação Web**: [http://localhost:5173](http://localhost:5173)
  - **Usuário Inicial**: `admin`
  - **Senha Inicial**: `admin`
  *(Você também pode utilizar a aba "Criar Conta" na tela de login para cadastrar novos usuários)*
- **Documentação Interativa da API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Documentação Detalhada (.ai/)

- [.ai/CONTEXT.md](.ai/CONTEXT.md) - Visão geral, objetivos de negócio e status das entregas.
- [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) - Arquitetura detalhada, diagramas e modelos de dados.
- [.ai/ANDROID_APP.md](.ai/ANDROID_APP.md) - Planejamento e especificações do aplicativo móvel para a Fase 2.
