import React, { useState } from "react";
import { 
  X, ExternalLink, Copy, Check, HelpCircle, ShieldCheck, 
  FileSpreadsheet, Cloud, Key, CheckCircle2, AlertTriangle, 
  ArrowRight, Sparkles, FolderTree, Database, FileJson, Info, BookOpen
} from "lucide-react";

interface SyncSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceAccountEmail?: string | null;
}

export const SyncSetupGuideModal: React.FC<SyncSetupGuideModalProps> = ({
  isOpen,
  onClose,
  serviceAccountEmail,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const steps = [
    {
      id: 1,
      title: "1. Criar Service Account no Google Cloud",
      shortTitle: "Service Account",
      icon: Key,
    },
    {
      id: 2,
      title: "2. Ativar a Google Sheets API",
      shortTitle: "Ativar API Sheets",
      icon: Cloud,
    },
    {
      id: 3,
      title: "3. Criar e Compartilhar a Planilha",
      shortTitle: "Planilha Google",
      icon: FileSpreadsheet,
    },
    {
      id: 4,
      title: "4. Salvar no Wallet e Sincronizar",
      shortTitle: "Conectar e Testar",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Guia Passo a Passo: Sincronização Google Sheets & Drive</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Completo
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tudo o que você precisa saber para habilitar a sincronização bidirecional e o backup em nuvem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso / Seleção de Passos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 shrink-0">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 shadow-sm"
                    : "bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}>
                  {step.id}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{step.shortTitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Conteúdo dos Passos (Scrollable) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* PASSO 1 */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <Key className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Passo 1: Criar Projeto no Google Cloud e Conta de Serviço
                </h3>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                A Conta de Serviço (*Service Account*) é uma identidade segura gerenciada pelo Google que permite ao **Wallet** ler e gravar dados na sua planilha e fazer backup de comprovantes no Drive sem precisar de login manual repetitivo.
              </p>

              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Acesse o Console do Google Cloud</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">Crie um novo projeto ou selecione um projeto existente (ex: <em>"Wallet Financeiro"</em>).</p>
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Google Cloud Console</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Crie a Conta de Serviço (Service Account)</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      No menu lateral, vá em <strong>IAM e Administração &gt; Contas de Serviço</strong> e clique em <strong>+ Criar Conta de Serviço</strong>. Dê um nome como <code>wallet-service</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Gere a Chave Privada em JSON</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Clique na conta de serviço criada &gt; aba <strong>Chaves (Keys)</strong> &gt; <strong>Adicionar Chave &gt; Criar nova chave &gt; Selecione JSON</strong> e clique em Criar.
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      ✓ Um arquivo <code>.json</code> será baixado automaticamente para o seu computador. Guarde esse arquivo!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2 */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Passo 2: Ativar a Google Sheets API
                </h3>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Para que o Google permita o espelhamento das 8 abas de dados financeiros do Wallet com a sua planilha, ative a <strong>Google Sheets API</strong> no seu projeto do Google Cloud:
              </p>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Google Sheets API</h4>
                    <p className="text-[11px] text-zinc-500">Espelhamento das 8 abas (Transações, Metas, Categorias, etc.)</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Permite ao Wallet ler a Fila_Mobile e exportar tabelas financeiras para a planilha Google com segurança.
                </p>
                <a
                  href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ativar Google Sheets API no Console</span>
                </a>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Após clicar em <strong>Ativar</strong>, aguarde cerca de 30 segundos para o Google propagar as permissões.</span>
              </div>
            </div>
          )}

          {/* PASSO 3 */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Passo 3: Criar a Planilha Google e Compartilhar com a Service Account
                </h3>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                O Wallet criará automaticamente as 8 abas necessárias. Você só precisa criar uma planilha vazia e dar permissão de <strong>Editor</strong> ao e-mail da sua Service Account.
              </p>

              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Crie uma nova planilha Google</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">Dê o nome que preferir (ex: <em>"Wallet - Finanças Pessoais e Empresa"</em>).</p>
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Criar Nova Planilha (sheets.new)</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Copie o E-mail da Service Account</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">Este é o e-mail que você deve adicionar no compartilhamento da planilha:</p>
                    
                    {serviceAccountEmail ? (
                      <div className="mt-2 flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-mono text-xs text-zinc-900 dark:text-zinc-100">
                        <span className="truncate mr-2 font-bold">{serviceAccountEmail}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(serviceAccountEmail)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1 shrink-0 font-sans font-semibold transition-all"
                        >
                          {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedEmail ? "Copiado!" : "Copiar"}</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600 font-mono mt-1">
                        (O e-mail da sua Service Account aparecerá aqui assim que você carregar o arquivo JSON no Passo 4).
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Compartilhe a Planilha como "Editor"</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Na planilha Google, clique no botão azul <strong>Compartilhar</strong> (canto superior direito), cole o e-mail da Service Account e garanta que o papel esteja como <strong>Editor</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Copie o ID da Planilha</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Copie a sequência de caracteres na barra de endereços do seu navegador entre <code>/d/</code> e <code>/edit</code>:
                    </p>
                    <p className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                      https://docs.google.com/spreadsheets/d/<span className="text-emerald-600 dark:text-emerald-400 font-bold underline">1BxiMVs0XRX5nZy1W4Xg8Xy...</span>/edit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 4 */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Passo 4: Salvar no Wallet e Iniciar a Sincronização
                </h3>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Agora é só colar o ID da planilha e o arquivo JSON no formulário do Wallet para ativar o fluxo completo.
              </p>

              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Cole o ID da Planilha e Envie o arquivo JSON</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      No formulário da aba <strong>Sincronização Nuvem</strong>, cole o ID da Planilha e clique em <em>Carregar Arquivo .json</em> (o arquivo baixado no Passo 1). Clique em <strong>Salvar Configuração</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Clique em "Testar Conexão"</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      O Wallet fará um ping de teste no Google Sheets para confirmar que a Service Account tem permissão de escrita.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">Clique em "Sincronização Completa (Bidirecional)"</p>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                      O sistema criará automaticamente as 8 abas espelho (<code>Transacoes</code>, <code>Categorias</code>, <code>Itens</code>, <code>Contas</code>, <code>Contatos</code>, <code>Dividas</code>, <code>Orcamentos</code>, <code>Fila_Mobile</code>) e enviará todos os dados existentes no SQLite!
                    </p>
                  </div>
                </div>
              </div>

              {/* Box de Sucesso */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">Tudo pronto!</p>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                    A partir de agora, o botão de sincronização no topo da tela indicará alterações em tempo real (↑ Para Enviar e ↓ Para Receber).
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé com Navegação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.max(prev - 1, 1))}
            disabled={activeStep === 1}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all disabled:opacity-30"
          >
            Voltar
          </button>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            Passo {activeStep} de {steps.length}
          </div>

          {activeStep < 4 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.min(prev + 1, 4))}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Próximo Passo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Concluir e Ir para Configurações</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
