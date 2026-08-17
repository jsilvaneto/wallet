import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Sun, Moon, Eye, EyeOff, RefreshCw, LogOut, 
  User as UserIcon, Building2, Wallet as WalletIcon, 
  Cloud, ArrowUp, ArrowDown, CheckCircle2, AlertCircle, 
  Settings as SettingsIcon, ExternalLink, ChevronDown
} from "lucide-react";

interface HeaderProps {
  onNavigateToSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToSync }) => {
  const { 
    profile, setProfile, isDark, toggleTheme, 
    hideValues, toggleHideValues, setToken,
    syncStatus, isSyncing, triggerSync, refreshSyncStatus
  } = useApp();

  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (action: "full" | "export" | "import") => {
    setFeedback(null);
    const res = await triggerSync(action);
    setFeedback({
      type: res.success ? "success" : "error",
      message: res.message,
    });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const formatLastSync = (dateStr?: string | null) => {
    if (!dateStr) return "Nunca sincronizado";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + 
        " (" + d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + ")";
    } catch {
      return dateStr;
    }
  };

  const pendingSend = syncStatus?.pending_send || 0;
  const pendingReceive = syncStatus?.pending_receive || 0;
  const totalPending = syncStatus?.total_pending || 0;
  const hasPending = syncStatus?.has_pending || false;
  const isConfigured = syncStatus?.is_configured || false;

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
          
          {/* Feedback Toast Inline */}
          {feedback && (
            <div className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl border animate-fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
            }`}>
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span className="max-w-[260px] truncate">{feedback.message}</span>
            </div>
          )}

          {/* ========================================== */}
          {/* BOTÃO INTELIGENTE DE SINCRONIZAÇÃO         */}
          {/* ========================================== */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsOpenMenu((prev) => !prev)}
              title={
                !isConfigured
                  ? "Google Sheets não configurado"
                  : hasPending
                  ? `${pendingSend} para enviar, ${pendingReceive} para receber`
                  : "Tudo sincronizado com a planilha Google"
              }
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border shadow-sm transition-all select-none ${
                isSyncing
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                  : hasPending
                  ? "bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-amber-300 dark:border-amber-700/60 text-zinc-900 dark:text-zinc-100 hover:border-amber-400"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60"
              }`}
            >
              {/* Ícone com animação */}
              <div className="relative flex items-center justify-center">
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-500" : hasPending ? "text-amber-500 dark:text-amber-400" : "text-emerald-500"}`} />
                {hasPending && !isSyncing && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>

              {/* Rótulo Principal */}
              <span className="hidden sm:inline font-bold">
                {isSyncing ? "Sincronizando..." : "Sincronizar"}
              </span>

              {/* Badges Dinâmicos de Envio / Recebimento */}
              {!isSyncing && hasPending && (
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  {pendingSend > 0 && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                      <ArrowUp className="w-2.5 h-2.5" />
                      <span>{pendingSend}</span>
                    </span>
                  )}
                  {pendingReceive > 0 && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-300 dark:border-indigo-700">
                      <ArrowDown className="w-2.5 h-2.5" />
                      <span>{pendingReceive}</span>
                    </span>
                  )}
                </div>
              )}

              {!isSyncing && !hasPending && isConfigured && (
                <span className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Atualizado</span>
                </span>
              )}

              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isOpenMenu ? "rotate-180" : ""}`} />
            </button>

            {/* ========================================== */}
            {/* POPOVER / DROPDOWN DE SINCRONIZAÇÃO        */}
            {/* ========================================== */}
            {isOpenMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 space-y-3.5 z-50 animate-fade-in text-zinc-900 dark:text-zinc-100">
                
                {/* Cabeçalho do Popover */}
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    <div>
                      <h4 className="text-xs font-bold">Sincronização Nuvem</h4>
                      <p className="text-[10px] text-zinc-400">Espelhamento Google Sheets</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isConfigured 
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}>
                    {isConfigured ? "Conectado" : "Não Configurado"}
                  </span>
                </div>

                {/* Cards de Status de Alterações Pendentes */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Para Enviar */}
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    pendingSend > 0
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100"
                      : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Para Enviar</span>
                      </span>
                      <span className="text-xs font-bold font-mono px-1.5 py-0.2 bg-white dark:bg-zinc-900 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {pendingSend}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {pendingSend === 0 ? "Nenhuma alteração local pendente." : `${pendingSend} alteração(ões) no SQLite.`}
                    </p>
                  </div>

                  {/* Para Receber */}
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    pendingReceive > 0
                      ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-100"
                      : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span>Para Receber</span>
                      </span>
                      <span className="text-xs font-bold font-mono px-1.5 py-0.2 bg-white dark:bg-zinc-900 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {pendingReceive}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {pendingReceive === 0 ? "Fila móvel vazia." : `${pendingReceive} lançamento(s) na Fila_Mobile.`}
                    </p>
                  </div>
                </div>

                {/* Detalhes da Última Sincronização */}
                <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Última sincronização:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">
                      {formatLastSync(syncStatus?.last_sync_at)}
                    </span>
                  </div>
                  {syncStatus?.spreadsheet_id && (
                    <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                      <span>Planilha ID:</span>
                      <span className="font-mono truncate max-w-[170px]">{syncStatus.spreadsheet_id}</span>
                    </div>
                  )}
                </div>

                {/* Ações de Sincronização */}
                <div className="space-y-1.5 pt-1">
                  {/* Botão Sincronizar Tudo */}
                  <button
                    type="button"
                    disabled={isSyncing || !isConfigured}
                    onClick={() => {
                      setIsOpenMenu(false);
                      handleAction("full");
                    }}
                    className="w-full py-2 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Sincronizando..." : "Sincronizar Tudo (Completo)"}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Apenas Enviar */}
                    <button
                      type="button"
                      disabled={isSyncing || !isConfigured}
                      onClick={() => {
                        setIsOpenMenu(false);
                        handleAction("export");
                      }}
                      className="py-1.5 px-2 text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 rounded-lg transition-all flex items-center justify-center gap-1 border border-zinc-200 dark:border-zinc-700"
                      title="Exporta todas as alterações do SQLite para as 8 abas da planilha"
                    >
                      <ArrowUp className="w-3 h-3 text-emerald-500" />
                      <span>Apenas Enviar</span>
                    </button>

                    {/* Apenas Receber */}
                    <button
                      type="button"
                      disabled={isSyncing || !isConfigured}
                      onClick={() => {
                        setIsOpenMenu(false);
                        handleAction("import");
                      }}
                      className="py-1.5 px-2 text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 rounded-lg transition-all flex items-center justify-center gap-1 border border-zinc-200 dark:border-zinc-700"
                      title="Importa lançamentos pendentes da aba Fila_Mobile para o SQLite"
                    >
                      <ArrowDown className="w-3 h-3 text-indigo-500" />
                      <span>Apenas Receber</span>
                    </button>
                  </div>
                </div>

                {/* Rodapé com Atalho de Configurações */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => refreshSyncStatus(true)}
                    disabled={isSyncing}
                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Verificar agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpenMenu(false);
                      if (onNavigateToSync) onNavigateToSync();
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <SettingsIcon className="w-3 h-3" />
                    <span>Configurar Sync</span>
                  </button>
                </div>

              </div>
            )}
          </div>

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

