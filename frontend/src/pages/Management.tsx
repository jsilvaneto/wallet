import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Category, Item, Account, Contact, Debt, Budget, AccountType } from "../types";
import { formatCurrency } from "../utils/format";
import { 
  FolderTree, Package, Users, CreditCard, PiggyBank, 
  Plus, Trash2, ArrowUpRight, ArrowDownRight, 
  AlertCircle, CheckCircle2, ShieldAlert, Tag, Search, DollarSign, Pencil, X, Info, Layers, Loader2,
  Landmark, Wallet, CircleDollarSign, Banknote
} from "lucide-react";

type ManagementTab = "CATEGORIAS" | "ITENS" | "CONTAS" | "CONTATOS" | "DIVIDAS" | "ORCAMENTOS";

export const Management: React.FC = () => {
  const { profile, hideValues } = useApp();
  const [activeTab, setActiveTab] = useState<ManagementTab>("CATEGORIAS");
  const [loading, setLoading] = useState(false);

  // Estados de dados
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Estados de Formulários de Criação
  // 1. Categoria Criação
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [catNature, setCatNature] = useState<"NENHUM" | "OBRIGATORIO" | "NECESSARIO" | "DESEJO">("NENHUM");
  const [catParentId, setCatParentId] = useState<string>("");
  const [catFilterType, setCatFilterType] = useState<"TODOS" | "RECEITA" | "DESPESA">("TODOS");
  const [catFilterNature, setCatFilterNature] = useState<string>("TODOS");
  const [creatingCat, setCreatingCat] = useState(false);

  // 1.1 Modal de Edição de Categoria / Subcategoria
  const [editModalCat, setEditModalCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatType, setEditCatType] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [editCatNature, setEditCatNature] = useState<"NENHUM" | "OBRIGATORIO" | "NECESSARIO" | "DESEJO">("NENHUM");
  const [editCatParentId, setEditCatParentId] = useState<string>("");
  const [editCatSaving, setEditCatSaving] = useState(false);
  const [editCatError, setEditCatError] = useState<string | null>(null);

  // 2. Item Form (Criação e Edição)
  const [itemName, setItemName] = useState("");
  const [itemCatId, setItemCatId] = useState("");
  const [itemAmountStr, setItemAmountStr] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemFilterCatId, setItemFilterCatId] = useState("TODAS");
  const [creatingItem, setCreatingItem] = useState(false);

  // 2.1 Modal de Edição de Item
  const [editModalItem, setEditModalItem] = useState<Item | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemCatId, setEditItemCatId] = useState("");
  const [editItemAmountStr, setEditItemAmountStr] = useState("");
  const [editItemSaving, setEditItemSaving] = useState(false);
  const [editItemError, setEditItemError] = useState<string | null>(null);

  // 2.2 Contas Form (Criação e Edição)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<AccountType>("CORRENTE");
  const [accSearch, setAccSearch] = useState("");
  const [accFilterType, setAccFilterType] = useState<string>("TODOS");
  const [creatingAcc, setCreatingAcc] = useState(false);

  // 2.3 Modal de Edição de Conta
  const [editModalAcc, setEditModalAcc] = useState<Account | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccType, setEditAccType] = useState<AccountType>("CORRENTE");
  const [editAccSaving, setEditAccSaving] = useState(false);
  const [editAccError, setEditAccError] = useState<string | null>(null);

  // 3. Contato Form
  const [conName, setConName] = useState("");
  const [conType, setConType] = useState<"FORNECEDOR" | "CLIENTE" | "FUNCIONARIO" | "OUTRO">("FORNECEDOR");
  const [conDoc, setConDoc] = useState("");

  // 4. Dívida Form
  const [debtTitle, setDebtTitle] = useState("");
  const [debtTotalStr, setDebtTotalStr] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtContactId, setDebtContactId] = useState("");

  // 5. Orçamento Form
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
      } else if (activeTab === "ITENS") {
        const [itemsRes, catRes] = await Promise.all([
          api.get("/items", { params: { profile } }),
          api.get("/categories", { params: { profile } }),
        ]);
        setItems(itemsRes.data);
        setCategories(catRes.data);
        if (catRes.data.length > 0 && !itemCatId) {
          const firstSub = catRes.data.find((c: Category) => c.parent_id);
          setItemCatId(firstSub ? firstSub.id : catRes.data[0].id);
        }
      } else if (activeTab === "CONTAS") {
        const res = await api.get("/accounts", { params: { profile } });
        setAccounts(res.data);
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

  // Handlers de Categorias (Criação)
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCreatingCat(true);
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
    } finally {
      setCreatingCat(false);
    }
  };

  // Handlers do Modal de Edição de Categoria / Subcategoria
  const openEditCategory = (cat: Category) => {
    setEditModalCat(cat);
    setEditCatName(cat.name);
    setEditCatType(cat.type);
    setEditCatNature(cat.nature);
    setEditCatParentId(cat.parent_id || "");
    setEditCatError(null);
    setEditCatSaving(false);
  };

  const closeEditCategory = () => {
    setEditModalCat(null);
    setEditCatError(null);
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalCat || !editCatName.trim()) return;
    setEditCatSaving(true);
    setEditCatError(null);
    try {
      await api.put(`/categories/${editModalCat.id}`, {
        name: editCatName.trim(),
        type: editCatType,
        nature: editCatNature,
        parent_id: editCatParentId ? editCatParentId : null,
      });
      setEditModalCat(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao editar categoria:", err);
      setEditCatError(err.response?.data?.detail || "Erro ao salvar alterações na categoria.");
    } finally {
      setEditCatSaving(false);
    }
  };

  // Handlers de Itens (Criação & Edição)
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCatId) return;
    setCreatingItem(true);
    try {
      const defaultAmount = itemAmountStr.trim()
        ? Math.round(parseFloat(itemAmountStr.replace(",", ".")) * 100)
        : null;

      await api.post("/items", {
        profile,
        category_id: itemCatId,
        name: itemName.trim(),
        default_amount_cents: defaultAmount && defaultAmount > 0 ? defaultAmount : null,
      });
      setItemName("");
      setItemAmountStr("");
      loadData();
    } catch (err: any) {
      console.error("Erro ao criar item:", err);
      alert(err.response?.data?.detail || "Erro ao criar item.");
    } finally {
      setCreatingItem(false);
    }
  };

  const openEditItem = (item: Item) => {
    setEditModalItem(item);
    setEditItemName(item.name);
    setEditItemCatId(item.category_id);
    setEditItemAmountStr(
      item.default_amount_cents ? (item.default_amount_cents / 100).toFixed(2).replace(".", ",") : ""
    );
    setEditItemError(null);
    setEditItemSaving(false);
  };

  const closeEditItem = () => {
    setEditModalItem(null);
    setEditItemError(null);
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem || !editItemName.trim() || !editItemCatId) return;
    setEditItemSaving(true);
    setEditItemError(null);
    try {
      const defaultAmount = editItemAmountStr.trim()
        ? Math.round(parseFloat(editItemAmountStr.replace(",", ".")) * 100)
        : null;

      await api.put(`/items/${editModalItem.id}`, {
        category_id: editItemCatId,
        name: editItemName.trim(),
        default_amount_cents: defaultAmount && defaultAmount > 0 ? defaultAmount : null,
      });
      setEditModalItem(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao atualizar item:", err);
      setEditItemError(err.response?.data?.detail || "Erro ao salvar alterações no item.");
    } finally {
      setEditItemSaving(false);
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
    } catch (err: any) {
      console.error("Erro ao remover registro:", err);
      alert(err.response?.data?.detail || "Erro ao excluir registro.");
    }
  };

  const getNatureStyle = (nat?: string | null) => {
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

  const getNatureLabel = (nat?: string | null) => {
    switch (nat) {
      case "OBRIGATORIO": return "Obrigatório";
      case "NECESSARIO": return "Necessário";
      case "DESEJO": return "Desejo";
      default: return "Nenhum";
    }
  };

  // Categoria pai selecionada no form de criação rápida
  const selectedParentCat = categories.find((c) => c.id === catParentId);

  // Verificações para o Modal de Edição de Categoria
  const editModalCatHasChildren = editModalCat ? categories.some((c) => c.parent_id === editModalCat.id) : false;
  const editModalCatChildCount = editModalCat ? categories.filter((c) => c.parent_id === editModalCat.id).length : 0;

  // Handlers de Contas (Criação & Edição)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    setCreatingAcc(true);
    try {
      await api.post("/accounts", {
        profile,
        name: accName.trim(),
        type: accType,
      });
      setAccName("");
      setAccType("CORRENTE");
      loadData();
    } catch (err: any) {
      console.error("Erro ao cadastrar conta:", err);
      alert(err.response?.data?.detail || "Erro ao cadastrar conta.");
    } finally {
      setCreatingAcc(false);
    }
  };

  const openEditAccount = (acc: Account) => {
    setEditModalAcc(acc);
    setEditAccName(acc.name);
    setEditAccType(acc.type);
    setEditAccError(null);
    setEditAccSaving(false);
  };

  const closeEditAccount = () => {
    setEditModalAcc(null);
    setEditAccError(null);
  };

  const handleSaveEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAcc || !editAccName.trim()) return;
    setEditAccSaving(true);
    setEditAccError(null);
    try {
      await api.put(`/accounts/${editModalAcc.id}`, {
        name: editAccName.trim(),
        type: editAccType,
      });
      setEditModalAcc(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao editar conta:", err);
      setEditAccError(err.response?.data?.detail || "Erro ao salvar alterações na conta.");
    } finally {
      setEditAccSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a conta "${name}"?`)) return;
    try {
      await api.delete(`/accounts/${id}`);
      loadData();
    } catch (err: any) {
      console.error("Erro ao excluir conta:", err);
      alert(err.response?.data?.detail || "Erro ao excluir conta.");
    }
  };

  const getAccountTypeInfo = (t: AccountType) => {
    switch (t) {
      case "CORRENTE":
        return {
          label: "Conta Corrente",
          badge: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50",
          icon: Landmark,
          desc: "Movimentação diária, recebimentos e pagamentos"
        };
      case "POUPANCA":
        return {
          label: "Poupança",
          badge: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/50",
          icon: PiggyBank,
          desc: "Reserva financeira e rendimento básico"
        };
      case "INVESTIMENTO":
        return {
          label: "Investimentos",
          badge: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/50",
          icon: CircleDollarSign,
          desc: "Aplicações, corretoras, CDBs e ações"
        };
      case "CAIXA":
        return {
          label: "Dinheiro / Caixa",
          badge: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/50",
          icon: Wallet,
          desc: "Dinheiro físico, carteira e numerário em espécie"
        };
      case "OUTRO":
      default:
        return {
          label: "Outro / Cartão",
          badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
          icon: CreditCard,
          desc: "Cartões de benefício, vales e outras contas"
        };
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
            Gerenciamento de categorias, itens, contas bancárias, contatos, dívidas e orçamentos ({profile})
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
            onClick={() => setActiveTab("ITENS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "ITENS"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Itens</span>
          </button>

          <button
            onClick={() => setActiveTab("CONTAS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "CONTAS"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Contas</span>
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
          {/* Form de Criação */}
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
                  className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
                >
                  Criar Raiz
                </button>
              )}
            </div>

            {selectedParentCat && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">↳</span>
                  <span>
                    Subcategoria de: <strong>{selectedParentCat.name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCatParentId("")}
                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md transition-all"
                  title="Desvincular e criar como Categoria Principal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da {catParentId ? "Subcategoria" : "Categoria"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={catParentId ? "Ex: Restaurante, Supermercado, Farmácia..." : "Ex: Alimentação, Moradia, Salário..."}
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
                    ? "Esta subcategoria será vinculada à categoria pai selecionada."
                    : "Deixe vazio para cadastrar como categoria principal."}
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
                disabled={creatingCat}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {creatingCat ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>{catParentId ? "Cadastrar Subcategoria" : "Cadastrar Categoria"}</span>
                )}
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

                    return (
                      <div
                        key={parentCat.id}
                        className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700/80 shadow-sm overflow-hidden transition-all"
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
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg transition-all"
                              title="Adicionar Subcategoria nesta Categoria"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Subcategoria</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditCategory(parentCat)}
                              className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all"
                              title="Editar Categoria"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
                                className="flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all shadow-sm"
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

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab("ITENS");
                                      setItemCatId(sub.id);
                                    }}
                                    className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded transition-all flex items-center gap-0.5"
                                    title="Criar Item nesta Subcategoria"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Item</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditCategory(sub)}
                                    className="p-1 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded transition-all"
                                    title="Editar Subcategoria"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteItem("categories", sub.id)}
                                    className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all"
                                    title="Excluir Subcategoria"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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

      {/* MODAL DE EDIÇÃO DE CATEGORIA / SUBCATEGORIA */}
      {editModalCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {editModalCat.parent_id ? "Editar Subcategoria" : "Editar Categoria Principal"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Perfil {profile} • Atualize nome, fluxo, hierarquia e essencialidade
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditCategory}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditCategory} className="p-5 space-y-4">
              {editCatError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editCatError}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da {editModalCat.parent_id ? "Subcategoria" : "Categoria"}
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Tipo de Fluxo */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo de Fluxo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCatType("DESPESA");
                      if (editModalCat.parent_id) {
                        const curParent = categories.find((c) => c.id === editCatParentId);
                        if (curParent && curParent.type !== "DESPESA") {
                          setEditCatParentId("");
                        }
                      }
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      editCatType === "DESPESA"
                        ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-600 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditCatType("RECEITA");
                      if (editModalCat.parent_id) {
                        const curParent = categories.find((c) => c.id === editCatParentId);
                        if (curParent && curParent.type !== "RECEITA") {
                          setEditCatParentId("");
                        }
                      }
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      editCatType === "RECEITA"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    Receita
                  </button>
                </div>
                {editModalCatHasChildren && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Ao alterar o fluxo desta categoria raiz, suas {editModalCatChildCount} subcategorias serão atualizadas em cascata.</span>
                  </p>
                )}
              </div>

              {/* Categoria Pai (Hierarquia) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hierarquia (Categoria Pai)
                </label>
                {editModalCatHasChildren ? (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                      <Layers className="w-4 h-4 text-sky-500" />
                      <span>Categoria Principal (Possui {editModalCatChildCount} subcategorias)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Esta categoria não pode ser convertida em subcategoria enquanto tiver subcategorias filhas vinculadas.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={editCatParentId}
                      onChange={(e) => setEditCatParentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="">[Nenhuma - Categoria Principal (Raiz)]</option>
                      {categories
                        .filter((c) => !c.parent_id && c.type === editCatType && c.id !== editModalCat.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            ↳ Subcategoria de: {c.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {editCatParentId
                        ? "Esta categoria passará a pertencer como subcategoria da categoria selecionada acima."
                        : "Esta categoria será tratada como uma Categoria Principal (Raiz)."}
                    </p>
                  </>
                )}
              </div>

              {/* Natureza da Categoria */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Natureza da Categoria
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditCatNature("NENHUM")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      editCatNature === "NENHUM"
                        ? "border-zinc-800 bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30"
                    }`}
                  >
                    Nenhum
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditCatNature("OBRIGATORIO")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      editCatNature === "OBRIGATORIO"
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                        : "border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
                    }`}
                  >
                    Obrigatório
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditCatNature("NECESSARIO")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      editCatNature === "NECESSARIO"
                        ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                        : "border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20"
                    }`}
                  >
                    Necessário
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditCatNature("DESEJO")}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border text-left transition-all ${
                      editCatNature === "DESEJO"
                        ? "border-purple-500 bg-purple-500 text-white shadow-sm"
                        : "border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20"
                    }`}
                  >
                    Desejo
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeEditCategory}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editCatSaving}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
                >
                  {editCatSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ITENS VINCULADOS A SUBCATEGORIAS */}
      {activeTab === "ITENS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Novo Item</span>
              </h3>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Item
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel Residencial, Netflix, Conta de Luz..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Subcategoria Vinculada
                </label>
                <select
                  required
                  value={itemCatId}
                  onChange={(e) => setItemCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  {categories.length === 0 && <option value="">Nenhuma subcategoria cadastrada</option>}
                  {categories
                    .filter((c) => !c.parent_id)
                    .map((parentCat) => {
                      const subs = categories.filter((s) => s.parent_id === parentCat.id);
                      const getNat = (n?: string) => (n && n !== "NENHUM" ? ` [${n.charAt(0) + n.slice(1).toLowerCase()}]` : "");

                      if (subs.length === 0) {
                        return (
                          <option key={parentCat.id} value={parentCat.id}>
                            {parentCat.name}{getNat(parentCat.nature)} ({parentCat.type})
                          </option>
                        );
                      }

                      return (
                        <optgroup key={parentCat.id} label={`${parentCat.name} (${parentCat.type})`}>
                          <option value={parentCat.id}>
                            {parentCat.name} (Principal){getNat(parentCat.nature)}
                          </option>
                          {subs.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              ↳ {sub.name}{getNat(sub.nature)}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Selecione a subcategoria à qual este item pertence.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor Padrão Sugerido (R$ - Opcional)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={itemAmountStr}
                  onChange={(e) => setItemAmountStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Se preenchido, esse valor será preenchido automaticamente ao selecionar o item nos lançamentos.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all mt-2"
              >
                Cadastrar Item
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Itens Cadastrados
                </h3>
                <p className="text-xs text-zinc-400">
                  {items.length} itens cadastrados ({profile})
                </p>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Buscar item..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 w-36 sm:w-44 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={itemFilterCatId}
                  onChange={(e) => setItemFilterCatId(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 max-w-[160px] truncate"
                >
                  <option value="TODAS">Todas Subcategorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? `↳ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum item cadastrado ainda. Cadastre itens vinculados às subcategorias para agilizar seus lançamentos.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
                {items
                  .filter((item) => {
                    if (itemFilterCatId !== "TODAS" && item.category_id !== itemFilterCatId) return false;
                    if (itemSearch.trim()) {
                      const q = itemSearch.toLowerCase();
                      const matchName = item.name.toLowerCase().includes(q);
                      const matchCat = item.category_name?.toLowerCase().includes(q) || false;
                      const matchParent = item.parent_category_name?.toLowerCase().includes(q) || false;
                      return matchName || matchCat || matchParent;
                    }
                    return true;
                  })
                  .map((item) => {
                    const getNatureStyle = (nat?: string | null) => {
                      switch (nat) {
                        case "OBRIGATORIO":
                          return "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/70";
                        case "NECESSARIO":
                          return "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/70";
                        case "DESEJO":
                          return "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/70";
                        default:
                          return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
                      }
                    };

                    const getNatureLabel = (nat?: string | null) => {
                      switch (nat) {
                        case "OBRIGATORIO": return "Obrigatório";
                        case "NECESSARIO": return "Necessário";
                        case "DESEJO": return "Desejo";
                        default: return "Nenhum";
                      }
                    };

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded-md text-[10px] font-bold ${
                              item.category_type === "RECEITA"
                                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                            }`}>
                              {item.category_type === "RECEITA" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            </span>

                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={item.name}>
                              {item.name}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                            <span>
                              {item.parent_category_name ? `${item.parent_category_name} > ` : ""}
                              {item.category_name || "Subcategoria"}
                            </span>
                            {item.category_nature && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${getNatureStyle(item.category_nature)}`}>
                                {getNatureLabel(item.category_nature)}
                              </span>
                            )}
                          </div>

                          {item.default_amount_cents && item.default_amount_cents > 0 ? (
                            <p className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              Padrão: {hideValues ? "••••••" : formatCurrency(item.default_amount_cents)}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditItem(item)}
                            className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all"
                            title="Editar Item"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem("items", item.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Excluir Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE ITEM */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Editar Item
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Perfil {profile} • Atualize nome, subcategoria vinculada ou valor sugerido
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditItem}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditItem} className="p-5 space-y-4">
              {editItemError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editItemError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Item
                </label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Subcategoria Vinculada
                </label>
                <select
                  required
                  value={editItemCatId}
                  onChange={(e) => setEditItemCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                >
                  {categories
                    .filter((c) => !c.parent_id)
                    .map((parentCat) => {
                      const subs = categories.filter((s) => s.parent_id === parentCat.id);
                      const getNat = (n?: string) => (n && n !== "NENHUM" ? ` [${n.charAt(0) + n.slice(1).toLowerCase()}]` : "");

                      if (subs.length === 0) {
                        return (
                          <option key={parentCat.id} value={parentCat.id}>
                            {parentCat.name}{getNat(parentCat.nature)} ({parentCat.type})
                          </option>
                        );
                      }

                      return (
                        <optgroup key={parentCat.id} label={`${parentCat.name} (${parentCat.type})`}>
                          <option value={parentCat.id}>
                            {parentCat.name} (Principal){getNat(parentCat.nature)}
                          </option>
                          {subs.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              ↳ {sub.name}{getNat(sub.nature)}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor Padrão Sugerido (R$ - Opcional)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={editItemAmountStr}
                  onChange={(e) => setEditItemAmountStr(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeEditItem}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editItemSaving}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
                >
                  {editItemSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTAS BANCÁRIAS E CARTEIRAS */}
      {/* ========================================================================= */}
      {activeTab === "CONTAS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form de Criação */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Nova Conta / Carteira</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                {profile}
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cadastre contas correntes, poupanças, corretoras de investimento ou caixas físicos para vincular aos lançamentos.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Nome da Conta / Instituição</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Itaú PJ, XP Investimentos, Carteira..."
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Tipo de Conta</span>
                </label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="CORRENTE">Conta Corrente (Bancos e Fintechs)</option>
                  <option value="POUPANCA">Poupança (Reserva)</option>
                  <option value="INVESTIMENTO">Investimentos (Corretoras, CDB, Ações)</option>
                  <option value="CAIXA">Dinheiro em Espécie (Caixa / Carteira)</option>
                  <option value="OUTRO">Outro (Cartão Benefício, Vales)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creatingAcc}
                  className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {creatingAcc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Conta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Listagem de Contas */}
          <div className="lg:col-span-2 space-y-4">
            {/* KPI Cards Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-1">
                <span className="text-[11px] text-zinc-400 font-semibold block">Total de Contas</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {accounts.length}
                </span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-1">
                <span className="text-[11px] text-zinc-400 font-semibold block">Correntes</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {accounts.filter((a) => a.type === "CORRENTE").length}
                </span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-1">
                <span className="text-[11px] text-zinc-400 font-semibold block">Investimentos</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                  {accounts.filter((a) => a.type === "INVESTIMENTO").length}
                </span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-1">
                <span className="text-[11px] text-zinc-400 font-semibold block">Caixa / Espécie</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {accounts.filter((a) => a.type === "CAIXA").length}
                </span>
              </div>
            </div>

            {/* Main List Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar contas..."
                    value={accSearch}
                    onChange={(e) => setAccSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {["TODOS", "CORRENTE", "POUPANCA", "INVESTIMENTO", "CAIXA", "OUTRO"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAccFilterType(t)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap ${
                        accFilterType === t
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/60"
                      }`}
                    >
                      {t === "TODOS" ? "Todos" : t === "CORRENTE" ? "Corrente" : t === "POUPANCA" ? "Poupança" : t === "INVESTIMENTO" ? "Investimento" : t === "CAIXA" ? "Caixa" : "Outro"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listagem em Cards */}
              {loading && accounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Carregando contas...
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Nenhuma conta cadastrada no perfil {profile}.
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Utilize o formulário ao lado para cadastrar suas contas bancárias e carteiras.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accounts
                    .filter((a) => {
                      const matchSearch = a.name.toLowerCase().includes(accSearch.toLowerCase());
                      const matchType = accFilterType === "TODOS" || a.type === accFilterType;
                      return matchSearch && matchType;
                    })
                    .map((acc) => {
                      const info = getAccountTypeInfo(acc.type);
                      const Icon = info.icon;

                      return (
                        <div
                          key={acc.id}
                          className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-800 dark:text-zinc-200">
                                <Icon className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  {acc.name}
                                </h4>
                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${info.badge}`}>
                                  {info.label}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditAccount(acc)}
                                title="Editar Conta"
                                className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                title="Excluir Conta"
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                            <span>{info.desc}</span>
                            <span className="font-mono">
                              {new Date(acc.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CONTA */}
      {editModalAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Editar Conta Bancária / Carteira
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Perfil {profile}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditAccount}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAccount} className="p-6 space-y-4">
              {editAccError && (
                <div className="p-3 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editAccError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Conta / Instituição
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Nubank, Itaú PJ, Carteira Dinheiro..."
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo de Conta
                </label>
                <select
                  value={editAccType}
                  onChange={(e) => setEditAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="CORRENTE">Conta Corrente (Bancos e Fintechs)</option>
                  <option value="POUPANCA">Poupança (Reserva)</option>
                  <option value="INVESTIMENTO">Investimentos (Corretoras, CDB, Ações)</option>
                  <option value="CAIXA">Dinheiro em Espécie (Caixa / Carteira)</option>
                  <option value="OUTRO">Outro (Cartão Benefício, Vales)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeEditAccount}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editAccSaving}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  {editAccSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: CONTATOS */}
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
