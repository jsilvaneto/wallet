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
  const [catNature, setCatNature] = useState<"NENHUM" | "OBRIGATORIO" | "NECESSARIO" | "DESEJO">("NENHUM");
  const [catParentId, setCatParentId] = useState<string>("");
  const [catFilterType, setCatFilterType] = useState<"TODOS" | "RECEITA" | "DESPESA">("TODOS");
  const [catFilterNature, setCatFilterNature] = useState<string>("TODOS");

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
        name: catName.trim(),
        type: catType,
        nature: catNature,
        parent_id: catParentId ? catParentId : null,
      });
      setCatName("");
      setCatParentId("");
      setCatNature("NENHUM");
      loadData();
    } catch (err: any) {
      console.error("Erro ao criar categoria:", err);
      alert(err.response?.data?.detail || "Erro ao criar categoria.");
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

      {/* TAB 1: CATEGORIAS E SUBCATEGORIAS */}
      {activeTab === "CATEGORIAS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{catParentId ? "Nova Subcategoria" : "Nova Categoria"}</span>
              </h3>
              {catParentId && (
                <button
                  type="button"
                  onClick={() => setCatParentId("")}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
                >
                  Criar Categoria Raiz
                </button>
              )}
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da {catParentId ? "Subcategoria" : "Categoria"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={catParentId ? "Ex: Restaurante, Supermercado..." : "Ex: Alimentação, Moradia, Salário..."}
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
                    onClick={() => { setCatType("DESPESA"); setCatParentId(""); }}
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
                    onClick={() => { setCatType("RECEITA"); setCatParentId(""); }}
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

              {/* Categoria Pai (Vínculo de Subcategoria) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria Pai (Opcional)
                </label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">[Nenhuma - Categoria Principal]</option>
                  {categories
                    .filter((c) => !c.parent_id && c.type === catType)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {catParentId
                    ? "Esta categoria será cadastrada como subcategoria da categoria selecionada."
                    : "Deixe vazio para criar uma categoria principal."}
                </p>
              </div>

              {/* Natureza da Categoria */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Natureza da Categoria
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCatNature("NENHUM")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      catNature === "NENHUM"
                        ? "border-zinc-800 bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30"
                    }`}
                  >
                    Nenhum
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatNature("OBRIGATORIO")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      catNature === "OBRIGATORIO"
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                        : "border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
                    }`}
                  >
                    Obrigatório
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatNature("NECESSARIO")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      catNature === "NECESSARIO"
                        ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                        : "border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20"
                    }`}
                  >
                    Necessário
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatNature("DESEJO")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      catNature === "DESEJO"
                        ? "border-purple-500 bg-purple-500 text-white shadow-sm"
                        : "border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20"
                    }`}
                  >
                    Desejo
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Classificação para controle de gastos essenciais (Obrigatório / Necessário) e supérfluos (Desejo).
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all mt-2"
              >
                {catParentId ? "Cadastrar Subcategoria" : "Cadastrar Categoria"}
              </button>
            </form>
          </div>

          {/* List & Tree */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Categorias & Subcategorias
                </h3>
                <p className="text-xs text-zinc-400">
                  {categories.length} categorias cadastradas ({categories.filter(c => !c.parent_id).length} principais, {categories.filter(c => c.parent_id).length} subcategorias)
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={catFilterType}
                  onChange={(e: any) => setCatFilterType(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300"
                >
                  <option value="TODOS">Todos os Fluxos</option>
                  <option value="DESPESA">Apenas Despesas</option>
                  <option value="RECEITA">Apenas Receitas</option>
                </select>

                <select
                  value={catFilterNature}
                  onChange={(e) => setCatFilterNature(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300"
                >
                  <option value="TODOS">Todas as Naturezas</option>
                  <option value="OBRIGATORIO">Obrigatório</option>
                  <option value="NECESSARIO">Necessário</option>
                  <option value="DESEJO">Desejo</option>
                  <option value="NENHUM">Nenhum</option>
                </select>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhuma categoria cadastrada.
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {categories
                  .filter((c) => !c.parent_id) // Categorias Principais
                  .filter((c) => catFilterType === "TODOS" || c.type === catFilterType)
                  .filter((c) => catFilterNature === "TODOS" || c.nature === catFilterNature || categories.some(sub => sub.parent_id === c.id && sub.nature === catFilterNature))
                  .map((parentCat) => {
                    const subcategories = categories.filter((sub) => sub.parent_id === parentCat.id);
                    
                    const getNatureStyle = (nat: string) => {
                      switch (nat) {
                        case "OBRIGATORIO":
                          return "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/70 shadow-sm shadow-amber-500/5";
                        case "NECESSARIO":
                          return "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/70 shadow-sm shadow-sky-500/5";
                        case "DESEJO":
                          return "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/70 shadow-sm shadow-purple-500/5";
                        default:
                          return "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80";
                      }
                    };

                    const getNatureLabel = (nat: string) => {
                      switch (nat) {
                        case "OBRIGATORIO": return "Obrigatório";
                        case "NECESSARIO": return "Necessário";
                        case "DESEJO": return "Desejo";
                        default: return "Nenhum";
                      }
                    };

                    return (
                      <div
                        key={parentCat.id}
                        className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700/80"
                      >
                        {/* Parent Row */}
                        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-zinc-100/80 via-zinc-50/50 to-white dark:from-zinc-800/80 dark:via-zinc-800/40 dark:to-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/80">
                          <div className="flex items-center gap-3">
                            <span className={`p-1.5 rounded-xl text-xs font-bold shadow-sm ${
                              parentCat.type === "RECEITA"
                                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                                : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                            }`}>
                              {parentCat.type === "RECEITA" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </span>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                  {parentCat.name}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getNatureStyle(parentCat.nature)}`}>
                                  {getNatureLabel(parentCat.nature)}
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                {subcategories.length > 0 ? `${subcategories.length} subcategoria(s)` : "Categoria principal"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCatParentId(parentCat.id);
                                setCatType(parentCat.type);
                                setCatNature(parentCat.nature || "NENHUM");
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg transition-all"
                              title="Adicionar Subcategoria nesta Categoria"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Subcategoria</span>
                            </button>

                            <button
                              onClick={() => handleDeleteItem("categories", parentCat.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                              title="Excluir Categoria"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Subcategories List */}
                        {subcategories.length > 0 && (
                          <div className="bg-zinc-50/40 dark:bg-zinc-950/60 p-3 space-y-1.5 border-t border-zinc-100/80 dark:border-zinc-800/60">
                            {subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all shadow-sm"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-emerald-500 dark:text-emerald-400 font-mono text-xs font-bold">↳</span>
                                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                    {sub.name}
                                  </span>
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${getNatureStyle(sub.nature)}`}>
                                    {getNatureLabel(sub.nature)}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleDeleteItem("categories", sub.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all"
                                  title="Excluir Subcategoria"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
