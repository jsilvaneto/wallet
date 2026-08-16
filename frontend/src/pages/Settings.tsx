import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { User, SyncConfig, SyncLog, SyncTestResult, SyncResultResponse } from "../types";
import { 
  Settings as SettingsIcon, Palette, Users, Cloud, 
  Sun, Moon, Eye, EyeOff, UserPlus, Trash2, ShieldCheck, 
  CheckCircle2, AlertCircle, RefreshCw, Upload, FileJson, 
  ExternalLink, Copy, Check, ArrowUpRight, ArrowDownRight, Key, HelpCircle,
  ShieldAlert, Lock, User as UserIcon, FileSpreadsheet, FolderTree,
  Package, CreditCard, Scale, Target, Smartphone, Database, Layers
} from "lucide-react";

type SettingsTab = "APARENCIA" | "USUARIOS" | "SYNC";

export const Settings: React.FC = () => {
  const { isDark, toggleTheme, hideValues, toggleHideValues, loginTheme, setLoginTheme } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>("APARENCIA");

  // === ESTADOS DE USUÁRIOS ===
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [userFeedback, setUserFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // === ESTADOS DE SINCRONIZAÇÃO ===
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
  const [savingSyncConfig, setSavingSyncConfig] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error"; message: string; details?: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Carrega dados de Usuários
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get<User[]>("/auth/users");
      setUsers(res.data);
    } catch (err: any) {
      console.error("Erro ao listar usuários:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Carrega dados de Sync
  const fetchSyncConfig = async () => {
    setLoadingSyncConfig(true);
    try {
      const res = await api.get<SyncConfig>("/sync/config");
      setSyncConfig(res.data);
      if (res.data.spreadsheet_id) {
        setSpreadsheetId(res.data.spreadsheet_id);
      }
    } catch (err: any) {
      console.error("Erro ao carregar configuração de sync:", err);
    } finally {
      setLoadingSyncConfig(false);
    }
  };

  const fetchSyncLogs = async () => {
    setLoadingSyncLogs(true);
    try {
      const res = await api.get<SyncLog[]>("/sync/logs");
      setSyncLogs(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar logs de sync:", err);
    } finally {
      setLoadingSyncLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "USUARIOS") {
      fetchUsers();
    } else if (activeTab === "SYNC") {
      fetchSyncConfig();
      fetchSyncLogs();
    }
  }, [activeTab]);

  // Handlers de Usuário
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
        message: `Usuário "${newUsername}" criado com sucesso!`
      });
      setNewUsername("");
      setNewPassword("");
      fetchUsers();
    } catch (err: any) {
      setUserFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao cadastrar usuário."
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Deseja realmente excluir o usuário "${username}"?`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setUserFeedback({
        type: "success",
        message: `Usuário "${username}" excluído com sucesso.`
      });
      fetchUsers();
    } catch (err: any) {
      setUserFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao excluir usuário."
      });
    }
  };

  // Handlers de Sincronização
  const handleCopyEmail = () => {
    if (!syncConfig?.service_account_email) return;
    navigator.clipboard.writeText(syncConfig.service_account_email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        JSON.parse(text);
        setCredentialsJson(text);
        setShowJsonInput(true);
        setSyncFeedback({
          type: "success",
          message: `Arquivo ${file.name} pronto para ser salvo.`
        });
      } catch (err) {
        setSyncFeedback({
          type: "error",
          message: "O arquivo selecionado não contém um JSON válido."
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
      const payload: any = {
        spreadsheet_id: spreadsheetId.trim(),
      };
      if (credentialsJson.trim()) {
        payload.credentials_json = credentialsJson.trim();
      }
      const res = await api.post<SyncConfig>("/sync/config", payload);
      setSyncConfig(res.data);
      setCredentialsJson("");
      setShowJsonInput(false);
      setSyncFeedback({
        type: "success",
        message: "Configurações salvas com sucesso!"
      });
      fetchSyncLogs();
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao salvar configurações."
      });
    } finally {
      setSavingSyncConfig(false);
    }
  };

  const handleTestSync = async () => {
    setTestingSync(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncTestResult>("/sync/test", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });
      setSyncFeedback({
        type: "success",
        message: res.data.message,
        details: `Abas verificadas: ${res.data.sheets_found?.join(", ")}`
      });
      fetchSyncConfig();
      fetchSyncLogs();
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Falha na conexão com a planilha."
      });
      fetchSyncLogs();
    } finally {
      setTestingSync(false);
    }
  };

  const handleExportSync = async () => {
    setExportingSync(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncResultResponse>("/sync/export", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });
      
      let countsText = "";
      if (res.data.entity_counts) {
        const ec = res.data.entity_counts;
        countsText = `Tabelas Atualizadas: Transações (${ec.transacoes || 0}), Categorias (${ec.categorias || 0}), Itens (${ec.itens || 0}), Contas (${ec.contas || 0}), Contatos (${ec.contatos || 0}), Dívidas (${ec.dividas || 0}), Orçamentos (${ec.orcamentos || 0})`;
      }

      setSyncFeedback({
        type: "success",
        message: res.data.message,
        details: countsText || undefined
      });
      fetchSyncConfig();
      fetchSyncLogs();
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao exportar dados."
      });
      fetchSyncLogs();
    } finally {
      setExportingSync(false);
    }
  };

  const handleImportSync = async () => {
    setImportingSync(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncResultResponse>("/sync/import", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });
      setSyncFeedback({
        type: "success",
        message: res.data.message,
        details: res.data.errors && res.data.errors.length > 0 ? res.data.errors.join(" | ") : undefined
      });
      fetchSyncConfig();
      fetchSyncLogs();
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao importar dados da fila."
      });
      fetchSyncLogs();
    } finally {
      setImportingSync(false);
    }
  };

  const handleFullSync = async () => {
    setSyncingFull(true);
    setSyncFeedback(null);
    try {
      const res = await api.post<SyncResultResponse>("/sync/full", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });

      let countsText = `Recebidos da Fila: ${res.data.imported_from_queue} | Total Enviados: ${res.data.exported_to_mirror}`;
      if (res.data.entity_counts) {
        const ec = res.data.entity_counts;
        countsText += ` [Transações: ${ec.transacoes || 0}, Categorias: ${ec.categorias || 0}, Itens: ${ec.itens || 0}, Contas: ${ec.contas || 0}, Contatos: ${ec.contatos || 0}, Dívidas: ${ec.dividas || 0}, Orçamentos: ${ec.orcamentos || 0}]`;
      }

      setSyncFeedback({
        type: "success",
        message: res.data.message,
        details: countsText
      });
      fetchSyncConfig();
      fetchSyncLogs();
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro na sincronização completa."
      });
      fetchSyncLogs();
    } finally {
      setSyncingFull(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Deseja realmente limpar todo o histórico de logs?")) return;
    try {
      await api.delete("/sync/logs");
      setSyncLogs([]);
      setSyncFeedback({
        type: "success",
        message: "Histórico de logs limpo com sucesso."
      });
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: "Erro ao limpar logs."
      });
    }
  };

  const isSyncConfigured = syncConfig?.has_credentials && syncConfig?.spreadsheet_id;

  return (
    <div className="space-y-6">
      {/* Top Header & Section Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-emerald-500" />
            <span>Configurações do Sistema</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Aparência, preferência de tema do login, gestão de usuários e integração com Google Sheets
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab("APARENCIA")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "APARENCIA"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Aparência & Login</span>
          </button>

          <button
            onClick={() => setActiveTab("USUARIOS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "USUARIOS"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gestão de Usuários</span>
          </button>

          <button
            onClick={() => setActiveTab("SYNC")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "SYNC"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Sincronização Nuvem</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: APARÊNCIA & LOGIN */}
      {/* ========================================================================= */}
      {activeTab === "APARENCIA" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Card 1: Tema da Tela de Login */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>Tema da Tela de Login</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Defina como a tela de autenticação inicial deve ser renderizada.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Opção Escura */}
              <button
                type="button"
                onClick={() => setLoginTheme("dark")}
                className={`p-4 rounded-xl border text-left transition-all space-y-2 ${
                  loginTheme === "dark"
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-zinc-900 text-white shadow-sm">
                    <Moon className="w-4 h-4 text-indigo-400" />
                  </div>
                  {loginTheme === "dark" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      Ativo
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Modo Escuro (Dark)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Fundo escuro profundo com cartão em alto contraste.
                  </p>
                </div>
              </button>

              {/* Opção Clara */}
              <button
                type="button"
                onClick={() => setLoginTheme("light")}
                className={`p-4 rounded-xl border text-left transition-all space-y-2 ${
                  loginTheme === "light"
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white text-zinc-900 border border-zinc-200 shadow-sm">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </div>
                  {loginTheme === "light" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      Ativo
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Modo Claro (Light)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Fundo cinza suave com visual limpo e minimalista.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Card 2: Preferências Gerais da Aplicação */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-500" />
                <span>Preferências Globais</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Ajustes visuais e de privacidade do ambiente autenticado.
              </p>
            </div>

            <div className="space-y-4">
              {/* Tema Global */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Tema do Sistema</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Atualmente no modo {isDark ? "Escuro" : "Claro"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                >
                  Alternar Tema
                </button>
              </div>

              {/* Ocultar Valores */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {hideValues ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Modo Privacidade</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {hideValues ? "Valores estão ocultos (••••••)" : "Valores visíveis na tela"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleHideValues}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                >
                  {hideValues ? "Mostrar Valores" : "Ocultar Valores"}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: GESTÃO DE USUÁRIOS */}
      {/* ========================================================================= */}
      {activeTab === "USUARIOS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Form: Cadastrar Novo Usuário */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span>Cadastrar Novo Usuário</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              O cadastro de usuários agora é gerenciado internamente com total segurança.
            </p>

            {userFeedback && (
              <div className={`p-3 text-xs font-semibold rounded-xl border flex items-center gap-2 ${
                userFeedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
              }`}>
                {userFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{userFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Nome de Usuário</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: joao, maria..."
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Senha Inicial</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 mt-2"
              >
                {creatingUser ? "Cadastrando..." : "Cadastrar Usuário"}
              </button>
            </form>
          </div>

          {/* List: Usuários Cadastrados */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Usuários com Acesso ao Sistema
                </h2>
                <p className="text-xs text-zinc-400">
                  Lista de contas que possuem autorização de login
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-semibold">{users.length} usuários</span>
            </div>

            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Carregando usuários...
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhum usuário cadastrado.
              </div>
            ) : (
              <div className="space-y-2.5">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase">
                        {u.username.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {u.username}
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          Criado em: {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      title="Excluir Usuário"
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
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

      {/* ========================================================================= */}
      {/* ABA 3: SINCRONIZAÇÃO NUVEM (GOOGLE SHEETS) */}
      {/* ========================================================================= */}
      {activeTab === "SYNC" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Subheader com Botão de Ajuda */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>{showGuide ? "Ocultar Guia Passo a Passo" : "Guia de Configuração Google Cloud"}</span>
            </button>
          </div>

          {/* Guide Card */}
          {showGuide && (
            <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-teal-50/40 dark:from-indigo-950/20 dark:to-teal-950/10 border border-indigo-200/80 dark:border-indigo-900/40 rounded-2xl space-y-3 animate-fade-in">
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Como Configurar a Integração com o Google Planilhas</span>
              </h3>
              <ol className="text-xs text-zinc-700 dark:text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Acesse o <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">console.cloud.google.com</a>) e crie um projeto.
                </li>
                <li>
                  Ative a <strong>Google Sheets API</strong> no menu <em>APIs e Serviços &gt; Biblioteca</em>.
                </li>
                <li>
                  Vá em <em>APIs e Serviços &gt; Credenciais &gt; Criar Credenciais &gt; Conta de Serviço (Service Account)</em>.
                </li>
                <li>
                  Na conta de serviço criada, vá na aba <strong>Chaves</strong> &gt; <em>Adicionar Chave &gt; Criar nova chave &gt; JSON</em> e baixe o arquivo.
                </li>
                <li>
                  Crie uma planilha no Google Sheets, clique em <strong>Compartilhar</strong> e adicione o <strong>E-mail da Conta de Serviço</strong> como <strong>Editor</strong>.
                </li>
                <li>
                  Cole o ID da planilha e o JSON abaixo e clique em <strong>Salvar Configurações</strong>.
                </li>
              </ol>
            </div>
          )}

          {/* Feedback */}
          {syncFeedback && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
              syncFeedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
            }`}>
              {syncFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-xs font-bold">{syncFeedback.message}</p>
                {syncFeedback.details && (
                  <p className="text-[11px] opacity-85 font-mono break-all">{syncFeedback.details}</p>
                )}
              </div>
            </div>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Status da Conexão
                </span>
                {isSyncConfigured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Configurado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="w-3 h-3" /> Pendente
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-zinc-400 block mb-1">E-mail do Service Account:</span>
                {syncConfig?.service_account_email ? (
                  <div className="flex items-center gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/80 dark:border-zinc-700/60">
                    <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate flex-1" title={syncConfig.service_account_email}>
                      {syncConfig.service_account_email}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="p-1 rounded text-zinc-400 hover:text-emerald-500 transition-colors"
                      title="Copiar e-mail"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Credenciais JSON não informadas</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Planilha Vinculada
                </span>
                {syncConfig?.spreadsheet_url && (
                  <a
                    href={syncConfig.spreadsheet_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <span className="text-xs text-zinc-400 block mb-1">ID da Planilha:</span>
                {syncConfig?.spreadsheet_id ? (
                  <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 break-all">
                    {syncConfig.spreadsheet_id}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Nenhum ID definido</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Última Sincronização
                </span>
                {syncConfig?.last_sync_status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    syncConfig.last_sync_status === "SUCESSO"
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                  }`}>
                    {syncConfig.last_sync_status}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-zinc-400 block mb-1">Data / Hora:</span>
                {syncConfig?.last_sync_at ? (
                  <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {new Date(syncConfig.last_sync_at).toLocaleString("pt-BR")} ({syncConfig.last_action})
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Nenhuma execução registrada</p>
                )}
              </div>
            </div>
          </div>

          {/* Abas Gerenciadas na Planilha */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Abas Integradas na Planilha Google (Espelho Completo & App Mobile)</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Todas as tabelas do SQLite são espelhadas automaticamente para consultas e catálogo do app mobile
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                8 Abas Ativas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Transacoes</span>
                </div>
                <p className="text-[10px] text-zinc-400">Lançamentos consolidados</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <FolderTree className="w-3.5 h-3.5 text-blue-500" />
                  <span>Categorias</span>
                </div>
                <p className="text-[10px] text-zinc-400">Hierarquia & Natureza</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Package className="w-3.5 h-3.5 text-purple-500" />
                  <span>Itens</span>
                </div>
                <p className="text-[10px] text-zinc-400">Catálogo com valores</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>Contas</span>
                </div>
                <p className="text-[10px] text-zinc-400">Bancos e carteiras</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Users className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Contatos</span>
                </div>
                <p className="text-[10px] text-zinc-400">Clientes & fornecedores</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Scale className="w-3.5 h-3.5 text-rose-500" />
                  <span>Dividas</span>
                </div>
                <p className="text-[10px] text-zinc-400">Passivos e saldos</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Target className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Orcamentos</span>
                </div>
                <p className="text-[10px] text-zinc-400">Tetos e limites mensais</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fila_Mobile</span>
                </div>
                <p className="text-[10px] text-zinc-400">Ingestão app móvel</p>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Ações de Sincronização
              </h3>
              <span className="text-[11px] text-zinc-400">Execute operações sob demanda</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={handleTestSync}
                disabled={testingSync || savingSyncConfig || exportingSync || importingSync || syncingFull}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm disabled:opacity-50"
              >
                <ShieldCheck className={`w-4 h-4 text-indigo-500 ${testingSync ? "animate-pulse" : ""}`} />
                <span>{testingSync ? "Testando..." : "Testar Conexão"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportSync}
                disabled={testingSync || savingSyncConfig || exportingSync || importingSync || syncingFull}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all shadow-sm disabled:opacity-50"
              >
                <ArrowUpRight className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${exportingSync ? "animate-bounce" : ""}`} />
                <span>{exportingSync ? "Enviando..." : "Enviar Dados (Exportar)"}</span>
              </button>

              <button
                type="button"
                onClick={handleImportSync}
                disabled={testingSync || savingSyncConfig || exportingSync || importingSync || syncingFull}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/60 transition-all shadow-sm disabled:opacity-50"
              >
                <ArrowDownRight className={`w-4 h-4 text-teal-600 dark:text-teal-400 ${importingSync ? "animate-bounce" : ""}`} />
                <span>{importingSync ? "Recebendo..." : "Receber Dados (Importar)"}</span>
              </button>

              <button
                type="button"
                onClick={handleFullSync}
                disabled={testingSync || savingSyncConfig || exportingSync || importingSync || syncingFull}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncingFull ? "animate-spin" : ""}`} />
                <span>{syncingFull ? "Sincronizando..." : "Sincronização Completa"}</span>
              </button>
            </div>
          </div>

          {/* Form de Configuração */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-500" />
                <span>Credenciais & Parâmetros da Planilha</span>
              </h2>
              <span className="text-xs text-zinc-400">Armazenamento local seguro</span>
            </div>

            <form onSubmit={handleSaveSyncConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  ID da Planilha Google (ou URL Completa)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Arquivo de Credenciais (<code className="font-mono">credentials.json</code>)
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all shadow-sm">
                    <FileJson className="w-4 h-4 text-amber-500" />
                    <span>Fazer Upload do Arquivo .json</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowJsonInput(!showJsonInput)}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline font-medium"
                  >
                    {showJsonInput ? "Ocultar Editor de JSON" : "Ou colar o conteúdo do JSON manualmente"}
                  </button>
                </div>

                {showJsonInput && (
                  <div className="pt-2 animate-fade-in">
                    <textarea
                      rows={6}
                      placeholder='Cole aqui o JSON: { "type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..." }'
                      value={credentialsJson}
                      onChange={(e) => setCredentialsJson(e.target.value)}
                      className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSyncConfig}
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {savingSyncConfig ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </form>
          </div>

          {/* Logs */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Histórico & Logs de Auditoria
                </h2>
                <p className="text-xs text-zinc-400">
                  Registro de envios, importações e testes de conexão
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSyncLogs}
                  disabled={loadingSyncLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSyncLogs ? "animate-spin text-emerald-500" : ""}`} />
                  <span>Atualizar</span>
                </button>

                {syncLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Histórico</span>
                  </button>
                )}
              </div>
            </div>

            {loadingSyncLogs && syncLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Carregando logs...
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Nenhuma operação registrada até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <th className="py-3 px-3">Data / Hora</th>
                      <th className="py-3 px-3">Operação</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Enviados</th>
                      <th className="py-3 px-3 text-center">Recebidos</th>
                      <th className="py-3 px-3">Mensagem / Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {syncLogs.map((log) => {
                      let parsedDetails: any = null;
                      if (log.details) {
                        try {
                          parsedDetails = JSON.parse(log.details);
                        } catch {}
                      }

                      return (
                        <tr key={log.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                              {log.action === "EXPORT" ? "ENVIO" : log.action === "IMPORT" ? "RECEBIMENTO" : log.action === "FULL" ? "COMPLETO" : "TESTE"}
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                              log.status === "SUCESSO"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            }`}>
                              {log.status === "SUCESSO" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {log.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {log.items_exported > 0 ? `+${log.items_exported}` : "0"}
                          </td>

                          <td className="py-3 px-3 text-center font-mono font-semibold text-teal-600 dark:text-teal-400">
                            {log.items_imported > 0 ? `+${log.items_imported}` : "0"}
                          </td>

                          <td className="py-3 px-3 max-w-md">
                            <p className="text-zinc-800 dark:text-zinc-200 font-medium" title={log.message}>
                              {log.message}
                            </p>
                            {parsedDetails?.entity_counts ? (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {Object.entries(parsedDetails.entity_counts).map(([ent, count]) => (
                                  <span
                                    key={ent}
                                    className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                  >
                                    {ent}: {count as number}
                                  </span>
                                ))}
                              </div>
                            ) : log.details ? (
                              <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5" title={log.details}>
                                {log.details}
                              </p>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
