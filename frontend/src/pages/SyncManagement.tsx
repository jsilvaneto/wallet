import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { SyncConfig, SyncLog, SyncTestResult } from "../types";
import { 
  Cloud, RefreshCw, Upload, Download, CheckCircle2, 
  AlertCircle, ExternalLink, Copy, Check, Trash2, 
  FileJson, Key, HelpCircle, ArrowUpRight, ArrowDownRight,
  ShieldCheck, ShieldAlert
} from "lucide-react";

export const SyncManagement: React.FC = () => {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form states
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Action states
  const [testing, setTesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingFull, setSyncingFull] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string; details?: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await api.get<SyncConfig>("/sync/config");
      setConfig(res.data);
      if (res.data.spreadsheet_id) {
        setSpreadsheetId(res.data.spreadsheet_id);
      }
    } catch (err: any) {
      console.error("Erro ao carregar configurações de sync:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get<SyncLog[]>("/sync/logs");
      setLogs(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar logs de sync:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  const handleCopyEmail = () => {
    if (!config?.service_account_email) return;
    navigator.clipboard.writeText(config.service_account_email);
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
        // Valida se é JSON válido
        JSON.parse(text);
        setCredentialsJson(text);
        setShowJsonInput(true);
        setFeedback({
          type: "success",
          message: `Arquivo ${file.name} carregado com sucesso. Clique em "Salvar Configurações" para aplicar.`
        });
      } catch (err) {
        setFeedback({
          type: "error",
          message: "O arquivo selecionado não contém um JSON válido."
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setFeedback(null);
    try {
      const payload: any = {
        spreadsheet_id: spreadsheetId.trim(),
      };
      if (credentialsJson.trim()) {
        payload.credentials_json = credentialsJson.trim();
      }

      const res = await api.post<SyncConfig>("/sync/config", payload);
      setConfig(res.data);
      setCredentialsJson("");
      setShowJsonInput(false);
      setFeedback({
        type: "success",
        message: "Configurações de sincronização salvas com sucesso!"
      });
      fetchLogs();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Erro ao salvar configurações."
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await api.post<SyncTestResult>("/sync/test", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });
      setFeedback({
        type: "success",
        message: res.data.message,
        details: `Abas verificadas: ${res.data.sheets_found?.join(", ")}`
      });
      fetchConfig();
      fetchLogs();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Falha ao testar conexão com o Google Sheets."
      });
      fetchLogs();
    } finally {
      setTesting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setFeedback(null);
    try {
      const res = await api.post("/sync/export", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });
      setFeedback({
        type: "success",
        message: res.data.message
      });
      fetchConfig();
      fetchLogs();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Falha ao exportar dados para o Google Sheets."
      });
      fetchLogs();
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setFeedback(null);
    try {
      const res = await api.post("/sync/import", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });
      setFeedback({
        type: "success",
        message: res.data.message,
        details: res.data.errors?.length ? `Erros: ${res.data.errors.join("; ")}` : undefined
      });
      fetchConfig();
      fetchLogs();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Falha ao importar dados da fila."
      });
      fetchLogs();
    } finally {
      setImporting(false);
    }
  };

  const handleFullSync = async () => {
    setSyncingFull(true);
    setFeedback(null);
    try {
      const res = await api.post("/sync/full", {
        spreadsheet_id: spreadsheetId.trim() || undefined
      });
      setFeedback({
        type: "success",
        message: res.data.message,
        details: `Importados da fila: ${res.data.imported_from_queue} | Exportados para espelho: ${res.data.exported_to_mirror}`
      });
      fetchConfig();
      fetchLogs();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Falha na sincronização completa."
      });
      fetchLogs();
    } finally {
      setSyncingFull(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Deseja realmente limpar todo o histórico de logs de sincronização?")) return;
    try {
      await api.delete("/sync/logs");
      setLogs([]);
      setFeedback({
        type: "success",
        message: "Histórico de logs limpo com sucesso."
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Erro ao limpar logs."
      });
    }
  };

  const isConfigured = config?.has_credentials && config?.spreadsheet_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Cloud className="w-6 h-6 text-emerald-500" />
            <span>Sincronização Nuvem (Google Sheets)</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Gerencie credenciais, planilha de espelhamento, envio de dados, importação e logs de auditoria
          </p>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>{showGuide ? "Ocultar Guia de Configuração" : "Guia Passo a Passo"}</span>
        </button>
      </div>

      {/* Guide Card (Collapsible) */}
      {showGuide && (
        <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-teal-50/40 dark:from-indigo-950/20 dark:to-teal-950/10 border border-indigo-200/80 dark:border-indigo-900/40 rounded-2xl space-y-3 animate-fade-in">
          <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Como Configurar a Integração com o Google Planilhas</span>
          </h3>
          <ol className="text-xs text-zinc-700 dark:text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              Acesse o <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">console.cloud.google.com</a>) e crie um projeto (ou use um existente).
            </li>
            <li>
              Ative a <strong>Google Sheets API</strong> e a <strong>Google Drive API</strong> no menu <em>APIs e Serviços &gt; Biblioteca</em>.
            </li>
            <li>
              Vá em <em>APIs e Serviços &gt; Credenciais &gt; Criar Credenciais &gt; Conta de Serviço (Service Account)</em>.
            </li>
            <li>
              Na conta de serviço criada, vá na aba <strong>Chaves (Keys)</strong> &gt; <em>Adicionar Chave &gt; Criar nova chave &gt; JSON</em> e baixe o arquivo de credenciais.
            </li>
            <li>
              Crie uma planilha no Google Sheets (ou abra a existente), clique no botão <strong>Compartilhar</strong> e adicione o <strong>E-mail da Conta de Serviço</strong> com a permissão de <strong>Editor</strong>.
            </li>
            <li>
              Copie o <strong>ID da Planilha</strong> (a parte entre <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">/d/</code> e <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">/edit</code> na URL da planilha) e faça o upload do arquivo JSON abaixo.
            </li>
          </ol>
        </div>
      )}

      {/* Global Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
          feedback.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
            : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="text-xs font-bold">{feedback.message}</p>
            {feedback.details && (
              <p className="text-[11px] opacity-85 font-mono break-all">{feedback.details}</p>
            )}
          </div>
        </div>
      )}

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Status Card 1: Status Conexão */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status da Conexão
            </span>
            {isConfigured ? (
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
            <span className="text-xs text-zinc-400 block mb-1">E-mail da Conta de Serviço:</span>
            {config?.service_account_email ? (
              <div className="flex items-center gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/80 dark:border-zinc-700/60">
                <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate flex-1" title={config.service_account_email}>
                  {config.service_account_email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1 rounded text-zinc-400 hover:text-emerald-500 transition-colors"
                  title="Copiar e-mail para compartilhar no Google Drive"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Credenciais JSON não informadas</p>
            )}
          </div>
        </div>

        {/* Status Card 2: Planilha Vinculada */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Planilha Vinculada
            </span>
            {config?.spreadsheet_url && (
              <a
                href={config.spreadsheet_url}
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
            {config?.spreadsheet_id ? (
              <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 break-all">
                {config.spreadsheet_id}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 italic">Nenhum ID de planilha definido</p>
            )}
          </div>
        </div>

        {/* Status Card 3: Última Sincronização */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Última Sincronização
            </span>
            {config?.last_sync_status && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                config.last_sync_status === "SUCESSO"
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
              }`}>
                {config.last_sync_status}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs text-zinc-400 block mb-1">Data / Hora:</span>
            {config?.last_sync_at ? (
              <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {new Date(config.last_sync_at).toLocaleString("pt-BR")} ({config.last_action})
              </p>
            ) : (
              <p className="text-xs text-zinc-400 italic">Nenhuma execução registrada</p>
            )}
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
          {/* Test Button */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || savingConfig || exporting || importing || syncingFull}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 text-indigo-500 ${testing ? "animate-pulse" : ""}`} />
            <span>{testing ? "Testando..." : "Testar Conexão"}</span>
          </button>

          {/* Export Button (Send) */}
          <button
            type="button"
            onClick={handleExport}
            disabled={testing || savingConfig || exporting || importing || syncingFull}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all shadow-sm disabled:opacity-50"
          >
            <ArrowUpRight className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${exporting ? "animate-bounce" : ""}`} />
            <span>{exporting ? "Enviando..." : "Enviar Dados (Exportar)"}</span>
          </button>

          {/* Import Button (Receive) */}
          <button
            type="button"
            onClick={handleImport}
            disabled={testing || savingConfig || exporting || importing || syncingFull}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/60 transition-all shadow-sm disabled:opacity-50"
          >
            <ArrowDownRight className={`w-4 h-4 text-teal-600 dark:text-teal-400 ${importing ? "animate-bounce" : ""}`} />
            <span>{importing ? "Recebendo..." : "Receber Dados (Importar)"}</span>
          </button>

          {/* Full Sync Button */}
          <button
            type="button"
            onClick={handleFullSync}
            disabled={testing || savingConfig || exporting || importing || syncingFull}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingFull ? "animate-spin" : ""}`} />
            <span>{syncingFull ? "Sincronizando..." : "Sincronização Completa"}</span>
          </button>
        </div>
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-500" />
            <span>Credenciais & Parâmetros do Google Sheets</span>
          </h2>
          <span className="text-xs text-zinc-400">Gravado localmente com segurança</span>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          {/* Spreadsheet ID Field */}
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
            <p className="text-[11px] text-zinc-400 mt-1">
              Copie o ID da sua planilha Google ou cole o link inteiro do navegador.
            </p>
          </div>

          {/* Credentials JSON Upload / Textarea */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Arquivo de Credenciais do Service Account (<code className="font-mono">credentials.json</code>)
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
                  placeholder='Cole aqui o JSON gerado no Google Cloud: { "type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..." }'
                  value={credentialsJson}
                  onChange={(e) => setCredentialsJson(e.target.value)}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {savingConfig ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>

      {/* Sync Logs and History */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Histórico & Logs de Auditoria
            </h2>
            <p className="text-xs text-zinc-400">
              Registro completo de envios, importações e testes realizados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin text-emerald-500" : ""}`} />
              <span>Atualizar</span>
            </button>

            {logs.length > 0 && (
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

        {loadingLogs && logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Carregando registros de logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Nenhuma operação de sincronização registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Operação</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Itens Enviados</th>
                  <th className="py-3 px-3 text-center">Itens Recebidos</th>
                  <th className="py-3 px-3">Detalhes / Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {log.action === "EXPORT" ? "ENVIO (EXPORT)" : log.action === "IMPORT" ? "RECEBIMENTO (IMPORT)" : log.action === "FULL" ? "COMPLETO (FULL)" : "TESTE (TEST)"}
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
                      <p className="text-zinc-800 dark:text-zinc-200 font-medium truncate" title={log.message}>
                        {log.message}
                      </p>
                      {log.details && (
                        <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5" title={log.details}>
                          {log.details}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
