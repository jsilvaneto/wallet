import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { 
  Category, Item, Account, AccountType, Contact, Debt, Budget, 
  User, SyncConfig, SyncLog, SyncTestResult, SyncResultResponse,
  AttachmentStats, DriveSyncTriggerResponse
} from "../types";
import { formatCurrency } from "../utils/format";
import { 
  Settings as SettingsIcon, Palette, Users, Cloud, 
  Sun, Moon, Eye, EyeOff, UserPlus, Trash2, ShieldCheck, 
  CheckCircle2, AlertCircle, RefreshCw, Upload, FileJson, 
  ExternalLink, Copy, Check, ArrowUpRight, ArrowDownRight, Key, HelpCircle,
  ShieldAlert, Lock, User as UserIcon, FileSpreadsheet, FolderTree,
  Package, CreditCard, Scale, Target, Smartphone, Database, Layers,
  Plus, Pencil, X, Loader2, Search, DollarSign, Calendar,
  Building2, Landmark, PiggyBank, Percent, ChevronLeft, ChevronRight,
  Info, Coins, Wallet, CircleDollarSign, ArrowUp, ArrowDown,
  HardDrive, Paperclip
} from "lucide-react";

export type SettingsTab = 
  | "CATEGORIAS" 
  | "ITENS" 
  | "CONTAS" 
  | "CONTATOS" 
  | "DIVIDAS" 
  | "ORCAMENTOS" 
  | "SYNC" 
  | "USUARIOS" 
  | "APARENCIA";

interface SettingsProps {
  initialTab?: SettingsTab;
}

export const Settings: React.FC<SettingsProps> = ({ initialTab = "CATEGORIAS" }) => {
  const { 
    profile, isDark, toggleTheme, hideValues, toggleHideValues, 
    loginTheme, setLoginTheme, syncStatus, refreshSyncStatus 
  } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // 1. ESTADOS DE CATEGORIAS
  // ==========================================
  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [catNature, setCatNature] = useState<"NENHUM" | "OBRIGATORIO" | "NECESSARIO" | "DESEJO">("NENHUM");
  const [catFilterType, setCatFilterType] = useState<"TODOS" | "RECEITA" | "DESPESA">("TODOS");
  const [catFilterNature, setCatFilterNature] = useState<string>("TODOS");
  const [creatingCat, setCreatingCat] = useState(false);

  // Modal de Edição de Categoria
  const [editModalCat, setEditModalCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatType, setEditCatType] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [editCatNature, setEditCatNature] = useState<"NENHUM" | "OBRIGATORIO" | "NECESSARIO" | "DESEJO">("NENHUM");
  const [editCatSaving, setEditCatSaving] = useState(false);
  const [editCatError, setEditCatError] = useState<string | null>(null);

  // ==========================================
  // 2. ESTADOS DE ITENS
  // ==========================================
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemCatId, setItemCatId] = useState("");
  const [itemAmountStr, setItemAmountStr] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemFilterCatId, setItemFilterCatId] = useState("TODAS");
  const [creatingItem, setCreatingItem] = useState(false);

  // Modal de Edição de Item
  const [editModalItem, setEditModalItem] = useState<Item | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemCatId, setEditItemCatId] = useState("");
  const [editItemAmountStr, setEditItemAmountStr] = useState("");
  const [editItemSaving, setEditItemSaving] = useState(false);
  const [editItemError, setEditItemError] = useState<string | null>(null);

  // ==========================================
  // 3. ESTADOS DE CONTAS
  // ==========================================
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<AccountType>("CORRENTE");
  const [accSearch, setAccSearch] = useState("");
  const [accFilterType, setAccFilterType] = useState<string>("TODOS");
  const [creatingAcc, setCreatingAcc] = useState(false);

  // Modal de Edição de Conta
  const [editModalAcc, setEditModalAcc] = useState<Account | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccType, setEditAccType] = useState<AccountType>("CORRENTE");
  const [editAccSaving, setEditAccSaving] = useState(false);
  const [editAccError, setEditAccError] = useState<string | null>(null);

  // ==========================================
  // 4. ESTADOS DE CONTATOS
  // ==========================================
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conName, setConName] = useState("");
  const [conType, setConType] = useState<"FORNECEDOR" | "CLIENTE" | "FUNCIONARIO" | "OUTRO">("FORNECEDOR");
  const [conDoc, setConDoc] = useState("");
  const [conNotes, setConNotes] = useState("");
  const [conSearch, setConSearch] = useState("");
  const [conFilterType, setConFilterType] = useState<string>("TODOS");
  const [creatingCon, setCreatingCon] = useState(false);

  // Modal de Edição de Contato
  const [editModalCon, setEditModalCon] = useState<Contact | null>(null);
  const [editConName, setEditConName] = useState("");
  const [editConType, setEditConType] = useState<"FORNECEDOR" | "CLIENTE" | "FUNCIONARIO" | "OUTRO">("FORNECEDOR");
  const [editConDoc, setEditConDoc] = useState("");
  const [editConNotes, setEditConNotes] = useState("");
  const [editConSaving, setEditConSaving] = useState(false);
  const [editConError, setEditConError] = useState<string | null>(null);

  // ==========================================
  // 5. ESTADOS DE DÍVIDAS
  // ==========================================
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtTitle, setDebtTitle] = useState("");
  const [debtTotalStr, setDebtTotalStr] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtContactId, setDebtContactId] = useState("");
  const [creatingDebt, setCreatingDebt] = useState(false);

  // Modal de Amortização de Dívida
  const [amortizeModalDebt, setAmortizeModalDebt] = useState<Debt | null>(null);
  const [amortizeAmountStr, setAmortizeAmountStr] = useState("");
  const [amortizeSaving, setAmortizeSaving] = useState(false);
  const [amortizeError, setAmortizeError] = useState<string | null>(null);

  // ==========================================
  // 6. ESTADOS DE ORÇAMENTOS
  // ==========================================
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetCatId, setBudgetCatId] = useState("");
  const [budgetLimitStr, setBudgetLimitStr] = useState("");
  const currentDate = new Date();
  const [budgetMonth, setBudgetMonth] = useState(currentDate.getMonth() + 1);
  const [budgetYear, setBudgetYear] = useState(currentDate.getFullYear());
  const [creatingBudget, setCreatingBudget] = useState(false);

  // Modal de Edição de Orçamento
  const [editModalBudget, setEditModalBudget] = useState<Budget | null>(null);
  const [editBudgetLimitStr, setEditBudgetLimitStr] = useState("");
  const [editBudgetSaving, setEditBudgetSaving] = useState(false);
  const [editBudgetError, setEditBudgetError] = useState<string | null>(null);

  // ==========================================
  // 7. ESTADOS DE SINCRONIZAÇÃO GOOGLE SHEETS
  // ==========================================
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loadingSyncConfig, setLoadingSyncConfig] = useState(false);
  const [loadingSyncLogs, setLoadingSyncLogs] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [testingSync, setTestingSync] = useState(false);
  const [exportingSync, setExportingSync] = useState(false);
  const [importingSync, setImportingSync] = useState(false);
  const [syncingFull, setSyncingFull] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [attachmentStats, setAttachmentStats] = useState<AttachmentStats | null>(null);
  const [savingSyncConfig, setSavingSyncConfig] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error"; message: string; details?: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // ==========================================
  // 8. ESTADOS DE USUÁRIOS
  // ==========================================
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [userFeedback, setUserFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ==========================================
  // CARREGAMENTO DE DADOS CONFORME ABA ATIVA
  // ==========================================
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
          setItemCatId(catRes.data[0].id);
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
      } else if (activeTab === "USUARIOS") {
        setLoadingUsers(true);
        const res = await api.get<User[]>("/auth/users");
        setUsers(res.data);
        setLoadingUsers(false);
      } else if (activeTab === "SYNC") {
        setLoadingSyncConfig(true);
        setLoadingSyncLogs(true);
        const [cfgRes, logRes, attRes] = await Promise.all([
          api.get<SyncConfig>("/sync/config"),
          api.get<SyncLog[]>("/sync/logs"),
          api.get<AttachmentStats>("/attachments/stats", { params: { profile } }).catch(() => ({ data: null })),
        ]);
        setSyncConfig(cfgRes.data);
        if (cfgRes.data.spreadsheet_id) {
          setSpreadsheetId(cfgRes.data.spreadsheet_id);
        }
        setSyncLogs(logRes.data);
        if (attRes && attRes.data) {
          setAttachmentStats(attRes.data);
        }
        setLoadingSyncConfig(false);
        setLoadingSyncLogs(false);
      }
    } catch (err) {
      console.error("Erro ao carregar dados em Configurações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile, activeTab, budgetMonth, budgetYear]);

  // ==========================================
  // LISTAS ORDENADAS EM ORDEM ALFABÉTICA (A a Z)
  // ==========================================
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [categories]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [items]);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [accounts]);

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }, [contacts]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }));
  }, [debts]);

  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => (a.category_name || "").localeCompare(b.category_name || "", "pt-BR", { sensitivity: "base" }));
  }, [budgets]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.username.localeCompare(b.username, "pt-BR", { sensitivity: "base" }));
  }, [users]);

  // ==========================================
  // HANDLERS: CATEGORIAS
  // ==========================================
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
      });
      setCatName("");
      setCatNature("NENHUM");
      loadData();
    } catch (err: any) {
      console.error("Erro ao criar categoria:", err);
      alert(err.response?.data?.detail || "Erro ao criar categoria.");
    } finally {
      setCreatingCat(false);
    }
  };

  const openEditCategory = (cat: Category) => {
    setEditModalCat(cat);
    setEditCatName(cat.name);
    setEditCatType(cat.type);
    setEditCatNature(cat.nature);
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

  // ==========================================
  // HANDLERS: ITENS
  // ==========================================
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
        default_amount_cents: defaultAmount,
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
    setEditItemAmountStr(item.default_amount_cents ? (item.default_amount_cents / 100).toFixed(2).replace(".", ",") : "");
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
        name: editItemName.trim(),
        category_id: editItemCatId,
        default_amount_cents: defaultAmount,
      });
      setEditModalItem(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao editar item:", err);
      setEditItemError(err.response?.data?.detail || "Erro ao salvar alterações no item.");
    } finally {
      setEditItemSaving(false);
    }
  };

  // ==========================================
  // HANDLERS: CONTAS
  // ==========================================
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
      console.error("Erro ao criar conta:", err);
      alert(err.response?.data?.detail || "Erro ao criar conta.");
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

  // ==========================================
  // HANDLERS: CONTATOS
  // ==========================================
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conName.trim()) return;
    setCreatingCon(true);
    try {
      await api.post("/contacts", {
        profile,
        name: conName.trim(),
        type: conType,
        document: conDoc.trim() || null,
        notes: conNotes.trim() || null,
      });
      setConName("");
      setConDoc("");
      setConNotes("");
      loadData();
    } catch (err: any) {
      console.error("Erro ao criar contato:", err);
      alert(err.response?.data?.detail || "Erro ao criar contato.");
    } finally {
      setCreatingCon(false);
    }
  };

  const openEditContact = (con: Contact) => {
    setEditModalCon(con);
    setEditConName(con.name);
    setEditConType(con.type);
    setEditConDoc(con.document || "");
    setEditConNotes(con.notes || "");
    setEditConError(null);
    setEditConSaving(false);
  };

  const closeEditContact = () => {
    setEditModalCon(null);
    setEditConError(null);
  };

  const handleSaveEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalCon || !editConName.trim()) return;
    setEditConSaving(true);
    setEditConError(null);
    try {
      await api.put(`/contacts/${editModalCon.id}`, {
        name: editConName.trim(),
        type: editConType,
        document: editConDoc.trim() || null,
        notes: editConNotes.trim() || null,
      });
      setEditModalCon(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao editar contato:", err);
      setEditConError(err.response?.data?.detail || "Erro ao salvar alterações no contato.");
    } finally {
      setEditConSaving(false);
    }
  };

  // ==========================================
  // HANDLERS: DÍVIDAS
  // ==========================================
  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtTitle.trim() || !debtTotalStr.trim()) return;
    setCreatingDebt(true);
    try {
      const totalCents = Math.round(parseFloat(debtTotalStr.replace(",", ".")) * 100);
      await api.post("/debts", {
        profile,
        title: debtTitle.trim(),
        total_amount_cents: totalCents,
        contact_id: debtContactId || null,
        due_date: debtDueDate || null,
      });
      setDebtTitle("");
      setDebtTotalStr("");
      setDebtDueDate("");
      setDebtContactId("");
      loadData();
    } catch (err: any) {
      console.error("Erro ao criar dívida:", err);
      alert(err.response?.data?.detail || "Erro ao criar dívida.");
    } finally {
      setCreatingDebt(false);
    }
  };

  const openAmortizeDebt = (debt: Debt) => {
    setAmortizeModalDebt(debt);
    setAmortizeAmountStr("");
    setAmortizeError(null);
    setAmortizeSaving(false);
  };

  const closeAmortizeDebt = () => {
    setAmortizeModalDebt(null);
    setAmortizeError(null);
  };

  const handleSaveAmortizeDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amortizeModalDebt || !amortizeAmountStr.trim()) return;
    setAmortizeSaving(true);
    setAmortizeError(null);
    try {
      const amountCents = Math.round(parseFloat(amortizeAmountStr.replace(",", ".")) * 100);
      await api.post(`/debts/${amortizeModalDebt.id}/amortize`, {
        amount_cents: amountCents,
      });
      setAmortizeModalDebt(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao amortizar dívida:", err);
      setAmortizeError(err.response?.data?.detail || "Erro ao registrar amortização.");
    } finally {
      setAmortizeSaving(false);
    }
  };

  // ==========================================
  // HANDLERS: ORÇAMENTOS
  // ==========================================
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCatId || !budgetLimitStr.trim()) return;
    setCreatingBudget(true);
    try {
      const limitCents = Math.round(parseFloat(budgetLimitStr.replace(",", ".")) * 100);
      await api.post("/budgets", {
        profile,
        category_id: budgetCatId,
        month: budgetMonth,
        year: budgetYear,
        limit_amount_cents: limitCents,
      });
      setBudgetLimitStr("");
      loadData();
    } catch (err: any) {
      console.error("Erro ao definir orçamento:", err);
      alert(err.response?.data?.detail || "Erro ao definir orçamento.");
    } finally {
      setCreatingBudget(false);
    }
  };

  const openEditBudget = (b: Budget) => {
    setEditModalBudget(b);
    setEditBudgetLimitStr((b.limit_amount_cents / 100).toFixed(2).replace(".", ","));
    setEditBudgetError(null);
    setEditBudgetSaving(false);
  };

  const closeEditBudget = () => {
    setEditModalBudget(null);
    setEditBudgetError(null);
  };

  const handleSaveEditBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalBudget || !editBudgetLimitStr.trim()) return;
    setEditBudgetSaving(true);
    setEditBudgetError(null);
    try {
      const limitCents = Math.round(parseFloat(editBudgetLimitStr.replace(",", ".")) * 100);
      await api.put(`/budgets/${editModalBudget.id}`, {
        limit_amount_cents: limitCents,
      });
      setEditModalBudget(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao atualizar orçamento:", err);
      setEditBudgetError(err.response?.data?.detail || "Erro ao atualizar teto de orçamento.");
    } finally {
      setEditBudgetSaving(false);
    }
  };

  // ==========================================
  // HANDLER GENÉRICO DE EXCLUSÃO
  // ==========================================
  const handleDeleteItem = async (endpoint: string, id: string) => {
    if (!window.confirm("Deseja realmente excluir este cadastro?")) return;
    try {
      await api.delete(`/${endpoint}/${id}`);
      loadData();
    } catch (err: any) {
      console.error("Erro ao excluir:", err);
      alert(err.response?.data?.detail || "Erro ao excluir registro.");
    }
  };

  // ==========================================
  // HANDLERS: USUÁRIOS
  // ==========================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFeedback(null);
    setCreatingUser(true);
    try {
      await api.post("/auth/register", {
        username: newUsername.trim(),
        password: newPassword,
      });
      setUserFeedback({
        type: "success",
        message: `Usuário "${newUsername}" cadastrado com sucesso!`,
      });
      setNewUsername("");
      setNewPassword("");
      loadData();
    } catch (err: any) {
      setUserFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao cadastrar usuário.",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) return;
    try {
      await api.delete(`/auth/users/${user.id}`);
      setUserFeedback({
        type: "success",
        message: `Usuário "${user.username}" excluído com sucesso!`,
      });
      loadData();
    } catch (err: any) {
      setUserFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao excluir usuário.",
      });
    }
  };

  // ==========================================
  // HANDLERS: SINCRONIZAÇÃO GOOGLE SHEETS
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        JSON.parse(text); // Validação de sintaxe JSON
        setCredentialsJson(text);
        setSyncFeedback({
          type: "success",
          message: "Arquivo de credenciais JSON carregado com sucesso!",
        });
      } catch (err) {
        setSyncFeedback({
          type: "error",
          message: "O arquivo selecionado não contém um JSON válido.",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSyncConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSyncConfig(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncConfig>("/sync/config", {
        spreadsheet_id: spreadsheetId.trim(),
        credentials_json: credentialsJson.trim() || undefined,
      });
      setSyncConfig(res.data);
      setCredentialsJson("");
      setShowJsonInput(false);
      setSyncFeedback({
        type: "success",
        message: "Configuração de sincronização salva com sucesso!",
      });
      loadData();
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao salvar configurações de sync.",
      });
    } finally {
      setSavingSyncConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingSync(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncTestResult>("/sync/test");
      if (res.data.success) {
        setSyncFeedback({
          type: "success",
          message: `Conexão estabelecida com sucesso! Planilha: "${res.data.spreadsheet_title || "OK"}"`,
        });
      } else {
        setSyncFeedback({
          type: "error",
          message: res.data.message,
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao testar conexão com o Google Sheets.",
      });
    } finally {
      setTestingSync(false);
    }
  };

  const handleExportToMirror = async () => {
    setExportingSync(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncResultResponse>("/sync/export");
      setSyncFeedback({
        type: "success",
        message: `Exportação concluída! ${res.data.exported_to_mirror || 0} registros enviados para as 8 abas espelho no Google Sheets.`,
      });
      loadData();
      await refreshSyncStatus(true);
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao exportar dados para a planilha.",
      });
    } finally {
      setExportingSync(false);
    }
  };

  const handleImportFromMobile = async () => {
    setImportingSync(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncResultResponse>("/sync/import");
      setSyncFeedback({
        type: "success",
        message: `Importação concluída! ${res.data.imported_from_queue || 0} lançamentos processados da aba Fila_Mobile.`,
      });
      loadData();
      await refreshSyncStatus(true);
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao importar dados da fila mobile.",
      });
    } finally {
      setImportingSync(false);
    }
  };

  const handleFullSync = async () => {
    setSyncingFull(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncResultResponse>("/sync/full");
      setSyncFeedback({
        type: "success",
        message: `Sincronização completa realizada! ${res.data.imported_from_queue || 0} importados da fila e ${res.data.exported_to_mirror || 0} exportados para as 8 abas espelho.`,
      });
      loadData();
      await refreshSyncStatus(true);
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao sincronizar com Google Sheets.",
      });
    } finally {
      setSyncingFull(false);
    }
  };

  const handleSyncAllDrive = async () => {
    setSyncingDrive(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<DriveSyncTriggerResponse>("/attachments/sync-drive");
      setSyncFeedback({
        type: res.data.success ? "success" : "error",
        message: res.data.message,
      });
      loadData();
      await refreshSyncStatus(true);
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao sincronizar comprovantes com o Google Drive.",
      });
    } finally {
      setSyncingDrive(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // ==========================================
  // HELPERS DE FORMATAÇÃO E ESTILO
  // ==========================================
  const getNatureStyle = (nature: string) => {
    switch (nature) {
      case "OBRIGATORIO": return "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/70";
      case "NECESSARIO": return "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/70";
      case "DESEJO": return "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/70";
      default: return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  const getNatureLabel = (nature: string) => {
    switch (nature) {
      case "OBRIGATORIO": return "Obrigatório";
      case "NECESSARIO": return "Necessário";
      case "DESEJO": return "Desejo";
      default: return "Nenhum";
    }
  };

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case "CORRENTE": return <Landmark className="w-4 h-4 text-emerald-500" />;
      case "POUPANCA": return <PiggyBank className="w-4 h-4 text-amber-500" />;
      case "INVESTIMENTO": return <CircleDollarSign className="w-4 h-4 text-indigo-500" />;
      case "CAIXA": return <Wallet className="w-4 h-4 text-blue-500" />;
      default: return <CreditCard className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case "CORRENTE": return "Conta Corrente";
      case "POUPANCA": return "Poupança";
      case "INVESTIMENTO": return "Investimento";
      case "CAIXA": return "Carteira / Caixa Físico";
      default: return "Outro";
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Configuração das 9 Abas de Configurações
  const SETTINGS_TABS = [
    { id: "CATEGORIAS", label: "Categorias", icon: FolderTree },
    { id: "ITENS", label: "Itens", icon: Package },
    { id: "CONTAS", label: "Contas & Carteiras", icon: Landmark },
    { id: "CONTATOS", label: "Contatos", icon: Users },
    { id: "DIVIDAS", label: "Dívidas", icon: Scale },
    { id: "ORCAMENTOS", label: "Orçamentos", icon: PiggyBank },
    { id: "SYNC", label: "Sincronização Nuvem", icon: Cloud },
    { id: "USUARIOS", label: "Usuários", icon: ShieldCheck },
    { id: "APARENCIA", label: "Aparência", icon: Palette },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-500" />
            <span>Configurações & Cadastros</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Painel unificado de cadastros mestres, metas orçamentárias, sincronização e preferências ({profile})
          </p>
        </div>

        {/* Indicador de Perfil Ativo */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm self-start sm:self-auto">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Perfil Atual: <strong>{profile}</strong>
          </span>
        </div>
      </div>

      {/* Barra de Navegação das 9 Abas */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* ABA 1: CATEGORIAS                          */}
      {/* ========================================== */}
      {activeTab === "CATEGORIAS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form de Criação */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Nova Categoria</span>
              </h3>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alimentação, Moradia, Salário, Freelas..."
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
                  <span>Cadastrar Categoria</span>
                )}
              </button>
            </form>
          </div>

          {/* Listagem de Categorias (Ordenada A a Z) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Categorias Cadastradas
                </h3>
                <p className="text-xs text-zinc-400">
                  {sortedCategories.length} categorias em ordem alfabética (A a Z) • {profile}
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={catFilterType}
                  onChange={(e: any) => setCatFilterType(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  <option value="TODOS">Todos os Fluxos</option>
                  <option value="DESPESA">Apenas Despesas</option>
                  <option value="RECEITA">Apenas Receitas</option>
                </select>

                <select
                  value={catFilterNature}
                  onChange={(e) => setCatFilterNature(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  <option value="TODOS">Todas as Naturezas</option>
                  <option value="OBRIGATORIO">Obrigatório</option>
                  <option value="NECESSARIO">Necessário</option>
                  <option value="DESEJO">Desejo</option>
                  <option value="NENHUM">Nenhum</option>
                </select>
              </div>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhuma categoria cadastrada.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {sortedCategories
                  .filter((c) => catFilterType === "TODOS" || c.type === catFilterType)
                  .filter((c) => catFilterNature === "TODOS" || c.nature === catFilterNature)
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-1.5 rounded-xl text-xs font-bold shadow-sm ${
                          cat.type === "RECEITA"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                            : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                        }`}>
                          {cat.type === "RECEITA" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {cat.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getNatureStyle(cat.nature)}`}>
                              {getNatureLabel(cat.nature)}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {cat.type === "RECEITA" ? "Receita" : "Despesa"} • {items.filter(it => it.category_id === cat.id).length} item(ns)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("ITENS");
                            setItemCatId(cat.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg transition-all"
                          title="Criar Item nesta Categoria"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Item</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditCategory(cat)}
                          className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all"
                          title="Editar Categoria"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem("categories", cat.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 2: ITENS                               */}
      {/* ========================================== */}
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
                  placeholder="Ex: Aluguel Residencial, Netflix, Supermercado..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria Vinculada
                </label>
                <select
                  required
                  value={itemCatId}
                  onChange={(e) => setItemCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                >
                  {sortedCategories.length === 0 && <option value="">Nenhuma categoria cadastrada</option>}
                  {sortedCategories.map((c) => {
                    const getNat = (n?: string) => (n && n !== "NENHUM" ? ` [${n.charAt(0) + n.slice(1).toLowerCase()}]` : "");
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name}{getNat(c.nature)} ({c.type})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Selecione a categoria à qual este item pertence.
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
                  Se preenchido, esse valor será sugerido automaticamente ao selecionar o item nos lançamentos.
                </p>
              </div>

              <button
                type="submit"
                disabled={creatingItem}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all mt-2"
              >
                Cadastrar Item
              </button>
            </form>
          </div>

          {/* Listagem de Itens (Ordenada A a Z) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Itens Cadastrados
                </h3>
                <p className="text-xs text-zinc-400">
                  {sortedItems.length} itens em ordem alfabética (A a Z) • {profile}
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
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 max-w-[160px] truncate font-medium"
                >
                  <option value="TODAS">Todas as Categorias</option>
                  {sortedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {sortedItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum item cadastrado ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
                {sortedItems
                  .filter((item) => {
                    if (itemFilterCatId !== "TODAS" && item.category_id !== itemFilterCatId) return false;
                    if (itemSearch.trim()) {
                      const q = itemSearch.toLowerCase();
                      const matchName = item.name.toLowerCase().includes(q);
                      const matchCat = item.category_name?.toLowerCase().includes(q) || false;
                      return matchName || matchCat;
                    }
                    return true;
                  })
                  .map((item) => (
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
                            {item.category_name || "Categoria"}
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
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 3: CONTAS E CARTEIRAS                  */}
      {/* ========================================== */}
      {activeTab === "CONTAS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Nova Conta / Carteira</span>
              </h3>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Instituição / Carteira
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Itaú PJ, Carteira Dinheiro, XP..."
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Modalidade / Tipo
                </label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  <option value="CORRENTE">Conta Corrente</option>
                  <option value="POUPANCA">Poupança</option>
                  <option value="INVESTIMENTO">Investimento / Aplicação</option>
                  <option value="CAIXA">Carteira / Caixa Físico</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingAcc}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {creatingAcc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Cadastrar Conta</span>
                )}
              </button>
            </form>
          </div>

          {/* Listagem de Contas (Ordenada A a Z) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Contas & Carteiras Cadastradas
                </h3>
                <p className="text-xs text-zinc-400">
                  {sortedAccounts.length} contas em ordem alfabética (A a Z) • {profile}
                </p>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Buscar conta..."
                    value={accSearch}
                    onChange={(e) => setAccSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 w-36 sm:w-44 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={accFilterType}
                  onChange={(e) => setAccFilterType(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  <option value="TODOS">Todas Modalidades</option>
                  <option value="CORRENTE">Conta Corrente</option>
                  <option value="POUPANCA">Poupança</option>
                  <option value="INVESTIMENTO">Investimento</option>
                  <option value="CAIXA">Caixa Físico</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
            </div>

            {sortedAccounts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhuma conta bancária cadastrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {sortedAccounts
                  .filter((acc) => {
                    if (accFilterType !== "TODOS" && acc.type !== accFilterType) return false;
                    if (accSearch.trim()) {
                      return acc.name.toLowerCase().includes(accSearch.toLowerCase());
                    }
                    return true;
                  })
                  .map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 shrink-0">
                          {getAccountTypeIcon(acc.type)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={acc.name}>
                            {acc.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 block truncate">
                            {getAccountTypeLabel(acc.type)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditAccount(acc)}
                          className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all"
                          title="Editar Conta"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem("accounts", acc.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="Excluir Conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 4: CONTATOS & FAVORECIDOS              */}
      {/* ========================================== */}
      {activeTab === "CONTATOS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Novo Contato</span>
              </h3>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Contato
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva, Locatário XP, Enel..."
                  value={conName}
                  onChange={(e) => setConName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo de Relação
                </label>
                <select
                  value={conType}
                  onChange={(e: any) => setConType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  <option value="FORNECEDOR">Fornecedor / Prestador</option>
                  <option value="CLIENTE">Cliente / Pagador</option>
                  <option value="FUNCIONARIO">Colaborador / Equipe</option>
                  <option value="OUTRO">Outro / Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  CPF / CNPJ (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  value={conDoc}
                  onChange={(e) => setConDoc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Anotações / Chave PIX (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Chave PIX, dados bancários, telefone..."
                  value={conNotes}
                  onChange={(e) => setConNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCon}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {creatingCon ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Cadastrar Contato</span>
                )}
              </button>
            </form>
          </div>

          {/* Listagem de Contatos (Ordenada A a Z) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Contatos & Favorecidos
                </h3>
                <p className="text-xs text-zinc-400">
                  {sortedContacts.length} contatos em ordem alfabética (A a Z) • {profile}
                </p>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Buscar contato..."
                    value={conSearch}
                    onChange={(e) => setConSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 w-36 sm:w-44 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={conFilterType}
                  onChange={(e) => setConFilterType(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  <option value="TODOS">Todos os Tipos</option>
                  <option value="FORNECEDOR">Fornecedores</option>
                  <option value="CLIENTE">Clientes</option>
                  <option value="FUNCIONARIO">Funcionários</option>
                  <option value="OUTRO">Outros</option>
                </select>
              </div>
            </div>

            {sortedContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum contato cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {sortedContacts
                  .filter((c) => {
                    if (conFilterType !== "TODOS" && c.type !== conFilterType) return false;
                    if (conSearch.trim()) {
                      const q = conSearch.toLowerCase();
                      return c.name.toLowerCase().includes(q) || (c.document && c.document.includes(q));
                    }
                    return true;
                  })
                  .map((con) => (
                    <div
                      key={con.id}
                      className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={con.name}>
                            {con.name}
                          </h4>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {con.type}
                          </span>
                        </div>
                        {con.document && (
                          <p className="text-[10px] font-mono text-zinc-400">
                            Doc: {con.document}
                          </p>
                        )}
                        {con.notes && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                            "{con.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditContact(con)}
                          className="p-1.5 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all"
                          title="Editar Contato"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem("contacts", con.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="Excluir Contato"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 5: DÍVIDAS & PASSIVOS                  */}
      {/* ========================================== */}
      {activeTab === "DIVIDAS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Nova Dívida / Passivo</span>
              </h3>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Título da Dívida
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empréstimo Bancário, Financiamento Carro..."
                  value={debtTitle}
                  onChange={(e) => setDebtTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor Total do Passivo (R$)
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
                  Credor / Contato Vinculado (Opcional)
                </label>
                <select
                  value={debtContactId}
                  onChange={(e) => setDebtContactId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  <option value="">[Nenhum Credor Selecionado]</option>
                  {sortedContacts.map((con) => (
                    <option key={con.id} value={con.id}>
                      {con.name} ({con.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Data de Vencimento Final (Opcional)
                </label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={creatingDebt}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {creatingDebt ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Cadastrar Dívida</span>
                )}
              </button>
            </form>
          </div>

          {/* Listagem de Dívidas (Ordenada A a Z) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Acompanhamento de Passivos & Amortizações
              </h3>
              <p className="text-xs text-zinc-400">
                {sortedDebts.length} dívidas em ordem alfabética (A a Z) • {profile}
              </p>
            </div>

            {sortedDebts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhuma dívida registrada.
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {sortedDebts.map((debt) => {
                  const paid = debt.total_amount_cents - debt.remaining_amount_cents;
                  const pct = Math.min(100, Math.round((paid / debt.total_amount_cents) * 100));

                  return (
                    <div
                      key={debt.id}
                      className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {debt.title}
                            </h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              debt.status === "QUITADA"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60"
                                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/60"
                            }`}>
                              {debt.status}
                            </span>
                          </div>
                          {debt.contact_id && (
                            <p className="text-[11px] text-zinc-400">
                              Credor: <strong>{contacts.find(c => c.id === debt.contact_id)?.name || "Contato"}</strong>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {debt.status !== "QUITADA" && (
                            <button
                              type="button"
                              onClick={() => openAmortizeDebt(debt)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg transition-all"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>Amortizar</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem("debts", debt.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Excluir Dívida"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Barra de Progresso de Amortização */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <span>Pago: {hideValues ? "••••••" : formatCurrency(paid)} ({pct}%)</span>
                          <span>Restante: {hideValues ? "••••••" : formatCurrency(debt.remaining_amount_cents)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
                          <div
                            className={`h-full transition-all rounded-full ${
                              pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
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

      {/* ========================================== */}
      {/* ABA 6: ORÇAMENTOS & METAS                  */}
      {/* ========================================== */}
      {activeTab === "ORCAMENTOS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Definir Teto Orçamentário</span>
              </h3>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria de Despesa
                </label>
                <select
                  required
                  value={budgetCatId}
                  onChange={(e) => setBudgetCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  {sortedCategories
                    .filter((c) => c.type === "DESPESA")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Limite Mensal Máximo (R$)
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

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-500">
                O teto será aplicado ao mês selecionado: <strong>{monthNames[budgetMonth - 1]} / {budgetYear}</strong>
              </div>

              <button
                type="submit"
                disabled={creatingBudget}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {creatingBudget ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Limite Mensal</span>
                )}
              </button>
            </form>
          </div>

          {/* Listagem de Orçamentos (Ordenada A a Z) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Tetos & Consumo Mensal
                </h3>
                <p className="text-xs text-zinc-400">
                  {sortedBudgets.length} categorias monitoradas em ordem alfabética (A a Z) • {profile}
                </p>
              </div>

              {/* Seletor de Mês/Ano */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (budgetMonth === 1) {
                      setBudgetMonth(12);
                      setBudgetYear(budgetYear - 1);
                    } else {
                      setBudgetMonth(budgetMonth - 1);
                    }
                  }}
                  className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-2 text-zinc-800 dark:text-zinc-200 min-w-[110px] text-center">
                  {monthNames[budgetMonth - 1]} / {budgetYear}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (budgetMonth === 12) {
                      setBudgetMonth(1);
                      setBudgetYear(budgetYear + 1);
                    } else {
                      setBudgetMonth(budgetMonth + 1);
                    }
                  }}
                  className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {sortedBudgets.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum orçamento configurado para este mês.
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {sortedBudgets.map((b) => {
                  const pct = b.percentage_used || 0;
                  const isOver = pct > 100;
                  const isWarning = pct >= 80 && pct <= 100;

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {b.category_name}
                          </h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            isOver
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/60"
                              : isWarning
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/60"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60"
                          }`}>
                            {isOver ? "ESTOURADO" : isWarning ? "ATENÇÃO" : "NORMAL"} ({pct}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditBudget(b)}
                            className="p-1 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all"
                            title="Editar Teto"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem("budgets", b.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Excluir Orçamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progresso de Gastos */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <span>Gasto Real: {hideValues ? "••••••" : formatCurrency(b.spent_amount_cents || 0)}</span>
                          <span>Teto: {hideValues ? "••••••" : formatCurrency(b.limit_amount_cents)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
                          <div
                            className={`h-full transition-all rounded-full ${
                              isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
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

      {/* ========================================== */}
      {/* ABA 7: SINCRONIZAÇÃO NUVEM (GOOGLE SHEETS) */}
      {/* ========================================== */}
      {activeTab === "SYNC" && (
        <div className="space-y-6 animate-fade-in">
          {/* Feedback Alertas */}
          {syncFeedback && (() => {
            const urlMatch = (syncFeedback.message + " " + (syncFeedback.details || "")).match(/https:\/\/[^\s]+/);
            const actionUrl = urlMatch ? urlMatch[0] : null;

            return (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
                syncFeedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200"
              }`}>
                {syncFeedback.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="text-xs font-semibold break-words">{syncFeedback.message}</p>
                  {syncFeedback.details && (
                    <p className="text-[11px] font-mono opacity-80 break-words">{syncFeedback.details}</p>
                  )}
                  {actionUrl && (
                    <div className="pt-1">
                      <a
                        href={actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ativar Google Drive API no Console Google Cloud</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Card das 8 Abas Integradas */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Espelho Integral da Base de Dados (8 Abas)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Sincronização bidirecional entre o SQLite e a Planilha Google
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: "Transacoes", desc: "Lançamentos", icon: FileSpreadsheet },
                { name: "Categorias", desc: "Categorias & Natureza", icon: FolderTree },
                { name: "Itens", desc: "Catálogo de Itens", icon: Package },
                { name: "Contas", desc: "Contas & Carteiras", icon: Landmark },
                { name: "Contatos", desc: "Favorecidos", icon: Users },
                { name: "Dividas", desc: "Passivos", icon: Scale },
                { name: "Orcamentos", desc: "Metas Mensais", icon: PiggyBank },
                { name: "Fila_Mobile", desc: "Buffer Mobile", icon: Smartphone },
              ].map((sheet) => {
                const Icon = sheet.icon;
                return (
                  <div
                    key={sheet.name}
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center gap-2.5"
                  >
                    <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{sheet.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{sheet.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuração de Conexão e Ações de Sincronização */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de Configuração */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-500" />
                <span>Credenciais do Google Sheets</span>
              </h3>

              <form onSubmit={handleSaveSyncConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    ID da Planilha Google (Spreadsheet ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1BxiMVs0XRX5nZy1W4Xg8X..."
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Encontre o ID na URL da sua planilha: docs.google.com/spreadsheets/d/<strong>[ID_AQUI]</strong>/edit
                  </p>
                </div>

                {/* Upload de JSON */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Arquivo de Conta de Serviço (credentials.json)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-600 dark:text-zinc-300 transition-all">
                      <Upload className="w-4 h-4 text-zinc-400" />
                      <span>{credentialsJson ? "Arquivo Selecionado ✓" : "Carregar Arquivo .json"}</span>
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowJsonInput(!showJsonInput)}
                      className="px-3 py-2.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {showJsonInput ? "Ocultar Texto" : "Colar JSON"}
                    </button>
                  </div>
                </div>

                {showJsonInput && (
                  <div>
                    <textarea
                      rows={5}
                      placeholder="Cole aqui o conteúdo do credentials.json..."
                      value={credentialsJson}
                      onChange={(e) => setCredentialsJson(e.target.value)}
                      className="w-full p-3 text-[11px] font-mono bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 resize-none"
                    />
                  </div>
                )}

                {/* Email do Service Account */}
                {syncConfig?.service_account_email && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-1">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Compartilhe sua planilha com o e-mail:
                    </p>
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <code className="text-[11px] text-emerald-800 dark:text-emerald-300 truncate">
                        {syncConfig.service_account_email}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(syncConfig.service_account_email!)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-emerald-700 dark:text-emerald-300 shrink-0"
                        title="Copiar e-mail"
                      >
                        {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingSyncConfig}
                    className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {savingSyncConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Salvar Configuração</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingSync || !syncConfig?.has_credentials || !spreadsheetId}
                    className="px-4 py-2.5 text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 disabled:opacity-50 text-zinc-700 dark:text-zinc-200 rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    {testingSync ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Testar Conexão</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Ações Manuais e Auditoria */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-500" />
                  <span>Ações & Status de Sincronização</span>
                </h3>

                <button
                  type="button"
                  onClick={() => refreshSyncStatus(true)}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Atualizar Status</span>
                </button>
              </div>

              {/* Status de Pendências (Cards de Envio e Recebimento) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-xl border transition-all ${
                  (syncStatus?.pending_send || 0) > 0
                    ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100"
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Para Enviar</span>
                    </span>
                    <span className="text-xs font-black font-mono px-2 py-0.5 bg-white dark:bg-zinc-900 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {syncStatus?.pending_send || 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {(syncStatus?.pending_send || 0) === 0 ? "Sem alterações locais pendentes." : `${syncStatus?.pending_send} registros prontos no SQLite.`}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border transition-all ${
                  (syncStatus?.pending_receive || 0) > 0
                    ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100"
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Para Receber</span>
                    </span>
                    <span className="text-xs font-black font-mono px-2 py-0.5 bg-white dark:bg-zinc-900 rounded-md border border-indigo-200 dark:border-indigo-800">
                      {syncStatus?.pending_receive || 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {(syncStatus?.pending_receive || 0) === 0 ? "Fila móvel vazia na planilha." : `${syncStatus?.pending_receive} lançamento(s) na Fila_Mobile.`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleFullSync}
                  disabled={syncingFull || !syncConfig?.has_credentials}
                  className="col-span-full py-3 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingFull ? "animate-spin" : ""}`} />
                  <span>Sincronização Completa (Bidirecional)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportToMirror}
                  disabled={exportingSync || !syncConfig?.has_credentials}
                  className="p-3 text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 rounded-xl transition-all flex items-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Exportar para Planilha</p>
                    <p className="text-[10px] font-normal text-zinc-400">SQLite &gt; 8 Abas Espelho</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleImportFromMobile}
                  disabled={importingSync || !syncConfig?.has_credentials}
                  className="p-3 text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 rounded-xl transition-all flex items-center gap-2"
                >
                  <ArrowDownRight className="w-4 h-4 text-sky-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Importar Fila Mobile</p>
                    <p className="text-[10px] font-normal text-zinc-400">Fila_Mobile &gt; SQLite</p>
                  </div>
                </button>
              </div>

              {/* Logs de Auditoria */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Histórico de Sincronizações
                </h4>
                {syncLogs.length === 0 ? (
                  <p className="text-[11px] text-zinc-400">Nenhum registro de sincronização ainda.</p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {syncLogs.slice(0, 10).map((log) => (
                      <div
                        key={log.id}
                        className="p-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            log.status === "SUCESSO" ? "bg-emerald-500" : "bg-rose-500"
                          }`} />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {log.action}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {(log.items_imported || 0) + (log.items_exported || 0)} itens • {log.created_at.slice(11, 16)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Backup de Comprovantes no Google Drive */}
            <div className="col-span-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Backup de Comprovantes no Google Drive</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Local-First
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Os arquivos são salvos instantaneamente no disco local e sincronizados de forma segura no Google Drive da sua conta de serviço.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncAllDrive}
                  disabled={syncingDrive || !syncConfig?.has_credentials}
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingDrive ? "animate-spin" : ""}`} />
                  <span>Sincronizar Comprovantes com o Drive</span>
                </button>
              </div>

              {/* Métricas de Comprovantes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Total de Arquivos</span>
                    </span>
                  </div>
                  <p className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
                    {attachmentStats?.total_count || 0}
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Armazenamento Local</span>
                    </span>
                  </div>
                  <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {attachmentStats?.formatted_total_size || "0 B"}
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Cloud className="w-3.5 h-3.5 text-sky-500" />
                      <span>No Google Drive</span>
                    </span>
                  </div>
                  <p className="text-lg font-black font-mono text-sky-600 dark:text-sky-400">
                    {attachmentStats?.synced_count || 0}
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border transition-all ${
                  (attachmentStats?.pending_count || 0) > 0
                    ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Backup Pendente</span>
                    </span>
                  </div>
                  <p className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                    {attachmentStats?.pending_count || 0}
                  </p>
                </div>
              </div>

              {/* Informações da Estrutura de Pastas */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Pasta no Google Drive: <strong className="text-zinc-800 dark:text-zinc-200">Wallet - Comprovantes / {profile}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  Tipos suportados: Fotos (JPG, PNG, WEBP) e Documentos (PDF) até 15MB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 8: GESTÃO DE USUÁRIOS                  */}
      {/* ========================================== */}
      {activeTab === "USUARIOS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Novo Usuário</span>
              </h3>
            </div>

            {userFeedback && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                userFeedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
              }`}>
                {userFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{userFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome de Usuário (Login)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: financeiro, joao, gestor..."
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Senha Inicial
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {creatingUser ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Cadastrar Usuário</span>
                )}
              </button>
            </form>
          </div>

          {/* Listagem de Usuários (Ordenada A a Z) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Usuários do Sistema
              </h3>
              <p className="text-xs text-zinc-400">
                {sortedUsers.length} usuários cadastrados em ordem alfabética (A a Z)
              </p>
            </div>

            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Carregando usuários...</span>
              </div>
            ) : sortedUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum usuário cadastrado.
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {u.username}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          ID: {u.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA 9: APARÊNCIA & TEMAS                   */}
      {/* ========================================== */}
      {activeTab === "APARENCIA" && (
        <div className="max-w-2xl space-y-6 animate-fade-in">
          {/* Modo Claro / Escuro Global */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-500" />
              <span>Tema do Sistema</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Escolha a interface visual para navegação e relatórios diários.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  isDark
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Modo Escuro (Dark)</p>
                  <p className="text-[11px] text-zinc-400">Visual moderno de alto contraste</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  !isDark
                    ? "border-emerald-500 bg-emerald-50/20 text-emerald-700 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Modo Claro (Light)</p>
                  <p className="text-[11px] text-zinc-400">Visual limpo e brilhante</p>
                </div>
              </button>
            </div>
          </div>

          {/* Tema Inicial da Tela de Login */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Tema da Tela de Login</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Defina se a tela inicial de login deve abrir por padrão em modo escuro ou claro.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLoginTheme("dark")}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  loginTheme === "dark"
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                <Moon className="w-5 h-4 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Login Dark</p>
                  <p className="text-[10px] text-zinc-400">Fundo escuro profundo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLoginTheme("light")}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  loginTheme === "light"
                    ? "border-emerald-500 bg-emerald-50/20 text-emerald-700 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                <Sun className="w-5 h-4 text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Login Light</p>
                  <p className="text-[10px] text-zinc-400">Fundo claro suave</p>
                </div>
              </button>
            </div>
          </div>

          {/* Ocultar Valores Monetários */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {hideValues ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-emerald-500" />}
                <span>Privacidade de Valores (Ocultação)</span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Oculta todos os saldos e valores em tela para ambientes públicos ou compartilhados.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleHideValues}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                hideValues
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {hideValues ? "Valores Ocultos" : "Valores Visíveis"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAIS DE EDIÇÃO                           */}
      {/* ========================================== */}

      {/* 1. Modal de Edição de Categoria */}
      {editModalCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Editar Categoria
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Perfil {profile} • Atualize nome, fluxo e essencialidade
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

            <form onSubmit={handleSaveEditCategory} className="p-5 space-y-4">
              {editCatError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editCatError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo de Fluxo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCatType("DESPESA")}
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
                    onClick={() => setEditCatType("RECEITA")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      editCatType === "RECEITA"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

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
                  {editCatSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal de Edição de Item */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
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
                    Perfil {profile} • Atualize nome, categoria vinculada ou valor sugerido
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
                  Categoria Vinculada
                </label>
                <select
                  required
                  value={editItemCatId}
                  onChange={(e) => setEditItemCatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  {sortedCategories.map((c) => {
                    const getNat = (n?: string) => (n && n !== "NENHUM" ? ` [${n.charAt(0) + n.slice(1).toLowerCase()}]` : "");
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name}{getNat(c.nature)} ({c.type})
                      </option>
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
                  {editItemSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal de Edição de Conta */}
      {editModalAcc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Editar Conta / Carteira
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Perfil {profile} • Atualize o nome e o tipo da conta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditAccount}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAccount} className="p-5 space-y-4">
              {editAccError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editAccError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Instituição / Carteira
                </label>
                <input
                  type="text"
                  required
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Modalidade / Tipo
                </label>
                <select
                  value={editAccType}
                  onChange={(e) => setEditAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  <option value="CORRENTE">Conta Corrente</option>
                  <option value="POUPANCA">Poupança</option>
                  <option value="INVESTIMENTO">Investimento / Aplicação</option>
                  <option value="CAIXA">Carteira / Caixa Físico</option>
                  <option value="OUTRO">Outro</option>
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
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
                >
                  {editAccSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal de Edição de Contato */}
      {editModalCon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Editar Contato
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Perfil {profile} • Atualize os dados do favorecido
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditContact}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditContact} className="p-5 space-y-4">
              {editConError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editConError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Contato
                </label>
                <input
                  type="text"
                  required
                  value={editConName}
                  onChange={(e) => setEditConName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo de Relação
                </label>
                <select
                  value={editConType}
                  onChange={(e: any) => setEditConType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 font-medium"
                >
                  <option value="FORNECEDOR">Fornecedor / Prestador</option>
                  <option value="CLIENTE">Cliente / Pagador</option>
                  <option value="FUNCIONARIO">Colaborador / Equipe</option>
                  <option value="OUTRO">Outro / Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  CPF / CNPJ (Opcional)
                </label>
                <input
                  type="text"
                  value={editConDoc}
                  onChange={(e) => setEditConDoc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Anotações / Chave PIX (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={editConNotes}
                  onChange={(e) => setEditConNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeEditContact}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editConSaving}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
                >
                  {editConSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal de Amortização de Dívida */}
      {amortizeModalDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Amortizar Dívida
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {amortizeModalDebt.title} • Saldo Restante: {formatCurrency(amortizeModalDebt.remaining_amount_cents)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAmortizeDebt}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAmortizeDebt} className="p-5 space-y-4">
              {amortizeError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{amortizeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor Pago / Amortizado (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amortizeAmountStr}
                  onChange={(e) => setAmortizeAmountStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono font-bold text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeAmortizeDebt}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={amortizeSaving}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  {amortizeSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirmar Pagamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal de Edição de Orçamento */}
      {editModalBudget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Ajustar Teto Orçamentário
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {editModalBudget.category_name} • {monthNames[editModalBudget.month - 1]} / {editModalBudget.year}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditBudget}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBudget} className="p-5 space-y-4">
              {editBudgetError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editBudgetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Novo Teto Mensal Máximo (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={editBudgetLimitStr}
                  onChange={(e) => setEditBudgetLimitStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-sky-500 font-mono font-bold text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeEditBudget}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editBudgetSaving}
                  className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
                >
                  {editBudgetSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Salvar Limite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
