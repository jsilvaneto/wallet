import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Management } from "./pages/Management";
import { SyncManagement } from "./pages/SyncManagement";
import { api } from "./api/client";
import { LayoutDashboard, ListFilter, Settings2, Cloud, Wallet as WalletIcon, Lock, User as UserIcon, UserPlus, LogIn, CheckCircle2 } from "lucide-react";

const AuthScreen: React.FC = () => {
  const { setToken } = useApp();
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === "LOGIN") {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        const res = await api.post("/auth/login", formData);
        setToken(res.data.access_token);
      } else {
        await api.post("/auth/register", {
          username,
          password,
        });
        setSuccessMsg("Conta criada com sucesso! Agora você pode entrar.");
        setAuthMode("LOGIN");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Falha na autenticação. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/25">
            <WalletIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Wallet
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sistema Financeiro Pessoal & Empresarial Local-First
          </p>
        </div>

        {/* Tab Selector: Login vs Register */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => { setAuthMode("LOGIN"); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === "LOGIN"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("REGISTER"); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === "REGISTER"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Usuário</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Digite seu usuário"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Senha</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 mt-2"
          >
            {loading
              ? "Processando..."
              : authMode === "LOGIN"
              ? "Entrar no Sistema"
              : "Cadastrar Usuário"}
          </button>
        </form>

        {/* Helper Note */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Acesso padrão inicial: Usuário <strong>admin</strong> e Senha <strong>admin</strong>
          </p>
        </div>

      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { token } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "management" | "sync">("dashboard");

  if (!token) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Header onNavigateToSync={() => setActiveTab("sync")} />

      {/* Main Tab Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "dashboard"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "transactions"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Lançamentos & Contas</span>
          </button>

          <button
            onClick={() => setActiveTab("management")}
            className={`flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "management"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Cadastros & Metas</span>
          </button>

          <button
            onClick={() => setActiveTab("sync")}
            className={`flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "sync"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Sincronização Nuvem</span>
          </button>
        </div>
      </div>

      {/* Page Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "transactions" && <Transactions />}
        {activeTab === "management" && <Management />}
        {activeTab === "sync" && <SyncManagement />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
