# Wallet - Visão Geral do Produto e Contexto de Negócio (.ai/CONTEXT.md)

## 1. Filosofia e Visão do Produto
O **Wallet** é uma plataforma de gestão financeira pessoal e empresarial orientada ao paradigma **Local-First**, projetada para proporcionar controle financeiro total, privacidade irrestrita, agilidade operacional e resiliência com baixa dependência de infraestrutura em nuvem de terceiros.

O sistema foi concebido para rodar perfeitamente em ambientes locais (WSL2 / Linux / Docker), com banco de dados embutido e espelhamento opcional em nuvem via Google Sheets.

---

## 2. Perfis de Operação (PESSOAL e EMPRESA)
O sistema opera com isolamento rigoroso entre duas entidades financeiras:
- **`PESSOAL`**: Gestão das despesas da pessoa física e familiares (moradia, alimentação, saúde, lazer, investimentos, salários).
- **`EMPRESA`**: Gestão do fluxo de caixa PJ (receitas de clientes, despesas operacionais, fornecedores, folha/pró-labore, impostos fiscais como DAS/GPS).

### Regras Invariáveis dos Perfis:
1. Toda entidade transacional (contas, categorias, itens, contatos, dívidas, orçamentos, lançamentos e agendamentos) possui o campo `profile` obrigatório.
2. Não há mistura de dados em telas, relatórios de dashboard ou agregações financeiras entre os perfis.
3. A alternância de perfil na interface web é instantânea e altera todo o contexto operacional do usuário.

---

## 3. Modelo de Categorias, Subcategorias e Natureza
A categorização financeira do Wallet possui estrutura hierárquica em dois níveis:

### 3.1 Categorias Principais (Raiz) e Subcategorias
- **Categorias Principais (`parent_id = NULL`)**: Grupos macro de despesas ou receitas (ex: *Moradia & Habitação*, *Alimentação*, *Transporte*, *Receitas Operacionais*).
- **Subcategorias (`parent_id = UUID_DA_RAIZ`)**: Especializações de gastos dentro do grupo pai (ex: *Aluguel*, *Condomínio*, *Supermercado*, *Restaurantes*).

### 3.2 Natureza da Categoria (Essencialidade do Gasto)
Cada categoria ou subcategoria possui uma classificação de essencialidade representada pelo enum `CategoryNature`:
- **`NENHUM`**: Neutro / sem classificação (aplicável a receitas ou categorias sem métrica de corte).
- **`OBRIGATORIO`**: Despesas fixas inegociáveis e compromissos legais (aluguel, condomínio, impostos, empréstimos, salários).
- **`NECESSARIO`**: Gastos essenciais do dia a dia com flexibilidade de consumo (alimentação básica, farmácia, transporte, combustível).
- **`DESEJO`**: Gastos discricionários e supérfluos (lazer, restaurantes, compras, viagens, streaming).

---

## 4. Itens Vinculados a Subcategorias
Os **Itens** representam o menor nível de granularidade do gasto/receita e servem como acelerador de lançamentos:
- Todo item pertence a um perfil e a uma subcategoria (`category_id`).
- Pode possuir um **valor padrão sugerido** (`default_amount_cents`).
- Ao selecionar um item na criação de um lançamento:
  1. A subcategoria correspondente é vinculada automaticamente.
  2. A descrição é pré-preenchida com o nome do item.
  3. O valor em R$ é sugerido caso haja valor padrão cadastrado.

---

## 5. Gestão de Dívidas e Orçamentos
- **Dívidas (`Debt`)**: Controle de passivos com valor total, saldo devedor restante e barra de amortização progressiva.
- **Orçamentos (`Budget`)**: Definição de teto de gastos mensais por categoria de despesa, com cálculo do realizado no mês e alertas visuais de consumo (Normal, Atenção e Estourado).

---

## 6. Sincronização Nuvem (Google Sheets Mirror)
O espelhamento com o Google Sheets permite manter uma cópia dos dados em nuvem e receber lançamentos remotos:
- **`Transacoes`**: Aba que espelha os lançamentos do banco local SQLite para conferência e relatórios externos.
- **`Fila_Mobile`**: Aba que recebe lançamentos gerados remotamente para importação e conciliação no banco local.
- **Gestão via Web**: Credenciais (`credentials.json`) e ID da planilha são gerenciados e testados diretamente na interface em **Configurações &gt; Sincronização Nuvem**.
