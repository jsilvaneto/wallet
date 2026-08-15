import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Category, Contact, Debt, Budget } from "../types";
import { formatCurrency } from "../utils/format";
import { 
  FolderTree, Users, CreditCard, PiggyBank, 
  Plus, Trash2, ArrowUpRight, ArrowDownRight, 
  AlertCircle, CheckCircle2, ShieldAlert
} from "lucide-react";

type ManagementTab = "CATEGORIAS" | "CONTATOS" | "DIVIDAS" | "ORCAMENTOS";

export const Management: React.FC = () => {
  const { profile, hideValues } = useApp();
  const [activeTab, setActiveTab] = useState<ManagementTab>("CATEGORIAS");
  const [loading, setLoading] = useState(false);

  // Estados de dados
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Estados de Formulários Rápidos
  // 1. Categoria Form
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"RECEITA" | "DESPESA">("DESPESA");

  // 2. Contato Form
  const [conName, setConName] = useState("");
  const [conType, setConType] = useState<"FORNECEDOR" | "CLIENTE" | "FUNCIONARIO" | "OUTRO">("FORNECEDOR");
  const [conDoc, setConDoc] = useState("");

  // 3. Dívida Form
  const [debtTitle, setDebtTitle] = useState("");
  const [debtTotalStr, setDebtTotalStr] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtContactId, setDebtContactId] = useState("");

  // 4. Orçamento Form
  const [budgetCatId, setBudgetCatId] = useState("");
  const [budgetLimitStr, setBudgetLimitStr] = useState("");
  const currentDate = new Date();
  const [budgetMonth, setBudgetMonth] = useState(currentDate.getMonth() + 1);
  const [budgetYear, setBudgetYear] = useState(currentDate.getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "CATEGORIAS") {
        const res = await api.get("/categories", { params: { profile } });
        setCategories(res.data);
      } else if (activeTab === "CONTATOS") {
        const res = await api.get("/contacts", { params: { profile } });
        setContacts(res.data);
      } else if (activeTab === "DIVIDAS") {
        const [debtRes, conRes] = await Promise.all([
          api.get("/debts", { params: { profile } }),
          api.get("/contacts", { params: { profile } }),
        ]);
        setDebts(debtRes.data);
        setContacts(conRes.data);
      } else if (activeTab === "ORCAMENTOS") {
        const [budRes, catRes] = await Promise.all([
          api.get("/budgets", { params: { profile, month: budgetMonth, year: budgetYear } }),
          api.get("/categories", { params: { profile, type: "DESPESA" } }),
        ]);
        setBudgets(budRes.data);
        setCategories(catRes.data);
        if (catRes.data.length > 0 && !budgetCatId) {
          setBudgetCatId(catRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile, activeTab, budgetMonth, budgetYear]);

  // Handlers de Criação
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await api.post("/categories", {
        profile,
        name: catName,
        type: catType,
      });
      setCatName("");
      loadData();
    } catch (err) {
      console.error("Erro ao criar categoria:", err);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conName.trim()) return;
    try {
      await api.post("/contacts", {
        profile,
        name: conName,
        type: conType,
        document: conDoc || null,
      });
      setConName("");
      setConDoc("");
      loadData();
    } catch (err) {
      console.error("Erro ao criar contato:", err);
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalFloat = parseFloat(debtTotalStr.replace(",", "."));
    if (isNaN(totalFloat) || totalFloat <= 0 || !debtTitle.trim()) return;
    try {
      await api.post("/debts", {
        profile,
        title: debtTitle,
        total_amount_cents: Math.round(totalFloat * 100),
        contact_id: debtContactId || null,
        due_date: debtDueDate || null,
      });
      setDebtTitle("");
      setDebtTotalStr("");
      setDebtDueDate("");
      setDebtContactId("");
      loadData();
    } catch (err) {
      console.error("Erro ao criar dívida:", err);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitFloat = parseFloat(budgetLimitStr.replace(",", "."));
    if (isNaN(limitFloat) || limitFloat <= 0 || !budgetCatId) return;
    try {
      await api.post("/budgets", {
        profile,
        category_id: budgetCatId,
        month: budgetMonth,
        year: budgetYear,
        limit_amount_cents: Math.round(limitFloat * 100),
      });
      setBudgetLimitStr("");
      loadData();
    } catch (err) {
      console.error("Erro ao criar orçamento:", err);
    }
  };

  // Handlers de Exclusão
  const handleDeleteItem = async (endpoint: string, id: string) => {
    if (!confirm("Deseja realmente remover este registro?")) return;
    try {
      await api.delete(`/${endpoint}/${id}`);
      loadData();
    } catch (err) {
      console.error("Erro ao remover registro:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Cadastros & Metas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Gerenciamento de categorias, contatos, dívidas e tetos de gastos ({profile})
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab("CATEGORIAS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "CATEGORIAS"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Categorias</span>
          </button>

          <button
            onClick={() => setActiveTab("CONTATOS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "CONTATOS"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contatos</span>
          </button>

          <button
            onClick={() => setActiveTab("DIVIDAS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "DIVIDAS"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Dívidas</span>
          </button>

          <button
            onClick={() => setActiveTab("ORCAMENTOS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "ORCAMENTOS"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Orçamentos</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATEGORIAS */}
      {activeTab === "CATEGORIAS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Nova Categoria</span>
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alimentação, Salário, Marketing..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo de Fluxo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCatType("DESPESA")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      catType === "DESPESA"
                        ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-600 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType("RECEITA")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      catType === "RECEITA"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all mt-2"
              >
                Cadastrar Categoria
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Categorias Cadastradas
              </h3>
              <span className="text-xs text-zinc-400">{categories.length} registros</span>
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhuma categoria cadastrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md text-[10px] font-bold ${
                        c.type === "RECEITA"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                      }`}>
                        {c.type === "RECEITA" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      </span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {c.name}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteItem("categories", c.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded-md transition-all"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONTATOS */}
      {activeTab === "CONTATOS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Novo Contato</span>
            </h3>
            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome / Razão Social
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fornecedor ABC, João Silva..."
                  value={conName}
                  onChange={(e) => setConName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Classificação
                </label>
                <select
                  value={conType}
                  onChange={(e) => setConType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="FORNECEDOR">Fornecedor</option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="FUNCIONARIO">Funcionário</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  CPF / CNPJ (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={conDoc}
                  onChange={(e) => setConDoc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all mt-2"
              >
                Cadastrar Contato
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Contatos Cadastrados
              </h3>
              <span className="text-xs text-zinc-400">{contacts.length} registros</span>
            </div>

            {contacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum contato cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {contacts.map((ct) => (
                  <div
                    key={ct.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {ct.name}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {ct.type} {ct.document && `• ${ct.document}`}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem("contacts", ct.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded-md transition-all"
                      title="Excluir Contato"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DÍVIDAS */}
      {activeTab === "DIVIDAS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Nova Dívida / Passivo</span>
            </h3>
            <form onSubmit={handleCreateDebt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Título / Descrição
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empréstimo Bancário, Financiamento..."
                  value={debtTitle}
                  onChange={(e) => setDebtTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor Total (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={debtTotalStr}
                  onChange={(e) => setDebtTotalStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Credor / Contato (Opcional)
                </label>
                <select
                  value={debtContactId}
                  onChange={(e) => setDebtContactId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Nenhum</option>
                  {contacts.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Data Limite de Quitação (Opcional)
                </label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all mt-2"
              >
                Cadastrar Dívida
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Dívidas & Passivos
              </h3>
              <span className="text-xs text-zinc-400">{debts.length} registros</span>
            </div>

            {debts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhuma dívida ou passivo registrado.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {debts.map((d) => {
                  const paidCents = d.total_amount_cents - d.remaining_amount_cents;
                  const pct = Math.round((paidCents / d.total_amount_cents) * 100) || 0;

                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            {d.title}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              d.status === "QUITADA"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                            }`}>
                              {d.status}
                            </span>
                          </div>
                          {d.due_date && (
                            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                              Vencimento final: {d.due_date}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteItem("debts", d.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded-md transition-all"
                          title="Excluir Dívida"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Amortization Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Abatido: {formatCurrency(paidCents, hideValues)} ({pct}%)
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Resta: {formatCurrency(d.remaining_amount_cents, hideValues)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ORÇAMENTOS */}
      {activeTab === "ORCAMENTOS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Definir Teto de Gastos</span>
            </h3>
            <form onSubmit={handleCreateBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria de Despesa
                </label>
                <select
                  value={budgetCatId}
                  onChange={(e) => setBudgetCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  {categories.length === 0 && <option value="">Nenhuma categoria de despesa</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Limite Mensal (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={budgetLimitStr}
                  onChange={(e) => setBudgetLimitStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mês
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={budgetMonth}
                    onChange={(e) => setBudgetMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={budgetYear}
                    onChange={(e) => setBudgetYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all mt-2"
              >
                Salvar Orçamento
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Tetos de Gastos ({budgetMonth}/{budgetYear})
              </h3>
              <span className="text-xs text-zinc-400">{budgets.length} registros</span>
            </div>

            {budgets.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum orçamento configurado para o mês {budgetMonth}/{budgetYear}.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {budgets.map((b) => {
                  const isOverLimit = b.spent_amount_cents > b.limit_amount_cents;

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {b.category_name}
                          </span>
                          {isOverLimit && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                              <ShieldAlert className="w-3 h-3" /> Limite Estourado
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteItem("budgets", b.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded-md transition-all"
                          title="Excluir Orçamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Limit Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Gasto: <strong className={isOverLimit ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}>{formatCurrency(b.spent_amount_cents, hideValues)}</strong> / Limite: {formatCurrency(b.limit_amount_cents, hideValues)}
                          </span>
                          <span className={`font-bold ${isOverLimit ? "text-rose-600" : "text-emerald-600"}`}>
                            {b.percentage_used}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverLimit ? "bg-rose-500" : b.percentage_used > 80 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, b.percentage_used))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
