import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { 
  Sun, Moon, Eye, EyeOff, RefreshCw, LogOut, 
  User as UserIcon, Building2, Wallet as WalletIcon, Cloud 
} from "lucide-react";

interface HeaderProps {
  onNavigateToSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToSync }) => {
  const { profile, setProfile, isDark, toggleTheme, hideValues, toggleHideValues, setToken } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await api.post("/sync/full");
      setSyncMsg(`Sync concluído: ${res.data.exported_to_mirror || 0} itens exportados.`);
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (err: any) {
      setSyncMsg(err.response?.data?.detail || "Erro ao sincronizar com Google Sheets.");
      setTimeout(() => setSyncMsg(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand + Profile Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">
                Wallet
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Local-First
              </span>
            </div>
          </div>

          {/* Profile Switcher */}
          <div className="bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg flex items-center gap-1 border border-zinc-200/80 dark:border-zinc-700/60">
            <button
              onClick={() => setProfile("PESSOAL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                profile === "PESSOAL"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Pessoal</span>
            </button>
            <button
              onClick={() => setProfile("EMPRESA")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                profile === "EMPRESA"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Empresa</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {syncMsg && (
            <div className="hidden md:flex items-center text-xs font-medium px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 animate-fade-in">
              {syncMsg}
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar com Planilha Google"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-emerald-500" : ""}`} />
            <span className="hidden sm:inline">{syncing ? "Sincronizando..." : "Sincronizar"}</span>
          </button>

          {/* Hide/Show Values */}
          <button
            onClick={toggleHideValues}
            title={hideValues ? "Mostrar Valores" : "Ocultar Valores"}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 shadow-sm transition-all"
          >
            {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Modo Claro" : "Modo Escuro"}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 shadow-sm transition-all"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Logout */}
          <button
            onClick={() => setToken(null)}
            title="Encerrar Sessão"
            className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
