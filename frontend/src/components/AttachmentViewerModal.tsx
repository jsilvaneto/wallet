import React, { useState, useRef } from "react";
import { Attachment } from "../types";
import { api } from "../api/client";
import { 
  X, Download, ExternalLink, Trash2, Cloud, HardDrive, 
  FileText, Image as ImageIcon, Plus, RefreshCw, ZoomIn, 
  ZoomOut, RotateCw, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  ShieldCheck, Loader2
} from "lucide-react";

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: Attachment[];
  transactionTitle?: string;
  transactionId?: string;
  profile: "PESSOAL" | "EMPRESA";
  onAttachmentsChanged: () => void;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  attachments,
  transactionTitle = "Comprovantes do Lançamento",
  transactionId,
  profile,
  onAttachmentsChanged,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentAttachment = attachments[currentIndex] || attachments[0];
  const isImage = currentAttachment && (
    currentAttachment.mime_type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(currentAttachment.file_name)
  );
  const isPdf = currentAttachment && (
    currentAttachment.mime_type === "application/pdf" ||
    currentAttachment.file_name.toLowerCase().endsWith(".pdf")
  );

  const handleNext = () => {
    if (currentIndex < attachments.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setActionError(null);
    setActionSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("profile", profile);
    if (transactionId) {
      formData.append("transaction_id", transactionId);
    }

    try {
      await api.post("/attachments/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setActionSuccess("Comprovante anexado com sucesso!");
      onAttachmentsChanged();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Erro ao fazer upload do comprovante.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAttachment) return;
    if (!confirm(`Deseja realmente excluir o comprovante "${currentAttachment.file_name}"?`)) return;

    setIsDeleting(true);
    setActionError(null);
    try {
      await api.delete(`/attachments/${currentAttachment.id}`);
      setActionSuccess("Comprovante excluído com sucesso.");
      onAttachmentsChanged();
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Erro ao excluir comprovante.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.post("/attachments/sync-drive");
      setActionSuccess("Backup no Google Drive iniciado!");
      onAttachmentsChanged();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Erro ao sincronizar com Google Drive.");
    } finally {
      setIsSyncingDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header do Visualizador */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {currentAttachment ? currentAttachment.file_name : transactionTitle}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {transactionTitle} {currentAttachment?.formatted_size ? `• ${currentAttachment.formatted_size}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Input oculto para adicionar novo comprovante */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Adicionar Anexo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback visual de alertas */}
        {actionError && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Área Central: Visualização do Documento ou Estado Vazio */}
        <div className="flex-1 relative bg-zinc-950/90 dark:bg-zinc-950 flex items-center justify-center overflow-hidden">
          {attachments.length === 0 ? (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">Nenhum comprovante anexado a este lançamento</p>
              <p className="text-xs text-zinc-500 max-w-sm">
                Envie fotos de recibos, comprovantes Pix, cupons fiscais ou documentos em PDF.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Anexar Primeiro Comprovante</span>
              </button>
            </div>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={`/api/v1/attachments/${currentAttachment.id}/file`}
                alt={currentAttachment.file_name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full p-2 flex flex-col">
              <iframe
                src={`/api/v1/attachments/${currentAttachment.id}/file`}
                title={currentAttachment.file_name}
                className="w-full h-full rounded-xl border border-zinc-800 bg-white"
              />
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-12 h-12 text-zinc-500 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">{currentAttachment.file_name}</p>
              <a
                href={`/api/v1/attachments/${currentAttachment.id}/download`}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar Arquivo
              </a>
            </div>
          )}

          {/* Controles de Navegação Entre Anexos */}
          {attachments.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 disabled:opacity-30 transition-all backdrop-blur-sm"
                title="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === attachments.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 disabled:opacity-30 transition-all backdrop-blur-sm"
                title="Próximo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Barra de Ferramentas Flutuante para Imagens */}
          {isImage && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl text-white">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white disabled:opacity-30 transition-all"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1.5">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white disabled:opacity-30 transition-all"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition-all"
                title="Girar Imagem"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Rodapé: Metadados, Status de Backup e Ações */}
        {currentAttachment && (
          <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            
            {/* Status de Armazenamento e Google Drive */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">Local-First</span>
              </div>

              <div className="w-px h-3.5 bg-zinc-200 dark:border-zinc-800" />

              {/* Status do Drive */}
              {currentAttachment.sync_status === "SINCRONIZADO" ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Google Drive ✓</span>
                </div>
              ) : currentAttachment.sync_status === "ERRO" ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Falha no Drive</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Backup Pendente</span>
                </div>
              )}

              {attachments.length > 1 && (
                <span className="text-xs font-mono text-zinc-400">
                  {currentIndex + 1} de {attachments.length}
                </span>
              )}
            </div>

            {/* Ações do Arquivo */}
            <div className="flex items-center gap-2">
              {currentAttachment.drive_web_view_link && (
                <a
                  href={currentAttachment.drive_web_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all flex items-center gap-1.5"
                  title="Abrir arquivo no Google Drive"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                  <span>Ver no Drive</span>
                </a>
              )}

              {currentAttachment.sync_status !== "SINCRONIZADO" && (
                <button
                  type="button"
                  onClick={handleSyncDrive}
                  disabled={isSyncingDrive}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="Enviar backup agora para o Google Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? "animate-spin" : ""}`} />
                  <span>Forçar Backup</span>
                </button>
              )}

              <a
                href={`/api/v1/attachments/${currentAttachment.id}/download`}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all flex items-center gap-1.5"
                title="Baixar cópia local do comprovante"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </a>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Excluir comprovante"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Excluir</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
