import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Category, Contact } from "../types";
import { X, Calendar, DollarSign, Tag, User as ContactIcon, FileText } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "UNICO" | "PARCELADO" | "RECORRENTE";

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useApp();
  const [mode, setMode] = useState<Mode>("UNICO");
  const [type, setType] = useState<"DESPESA" | "RECEITA">("DESPESA");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [contactId, setContactId] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [installments, setInstallments] = useState("2");
  const [dueDay, setDueDay] = useState(String(new Date().getDate()));
  const [notes, setNotes] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadDependencies = async () => {
      try {
        const [catRes, conRes] = await Promise.all([
          api.get("/categories", { params: { profile, type } }),
          api.get("/contacts", { params: { profile } }),
        ]);
        setCategories(catRes.data);
        setContacts(conRes.data);
        if (catRes.data.length > 0) {
          setCategoryId(catRes.data[0].id);
        } else {
          setCategoryId("");
        }
      } catch (err) {
        console.error("Erro ao carregar categorias/contatos:", err);
      }
    };
    loadDependencies();
  }, [isOpen, profile, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const amountFloat = parseFloat(amountStr.replace(",", "."));
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError("Informe um valor válido maior que zero.");
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setError("Informe uma descrição para o lançamento.");
      setLoading(false);
      return;
    }

    if (!categoryId) {
      setError("Selecione ou crie uma categoria antes de prosseguir.");
      setLoading(false);
      return;
    }

    const amountCents = Math.round(amountFloat * 100);

    try {
      if (mode === "UNICO") {
        await api.post("/transactions", {
          profile,
          type,
          description,
          amount_cents: amountCents,
          category_id: categoryId,
          contact_id: contactId || null,
          due_date: dueDate,
          notes: notes || null,
          status: "PENDENTE",
        });
      } else {
        await api.post("/schedules", {
          profile,
          type,
          description,
          amount_cents: amountCents,
          category_id: categoryId,
          contact_id: contactId || null,
          schedule_type: mode === "PARCELADO" ? "PARCELADA" : "RECORRENTE_CONTINUA",
          frequency: "MENSAL",
          total_installments: mode === "PARCELADO" ? parseInt(installments, 10) : null,
          start_date: dueDate,
          due_day: parseInt(dueDay, 10),
        });
      }

      // Reset form
      setDescription("");
      setAmountStr("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Falha ao salvar lançamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>Novo Lançamento</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-lg">
              {error}
            </div>
          )}

          {/* Type Selector (Despesa vs Receita) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => setType("DESPESA")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === "DESPESA"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Despesa (A Pagar)
            </button>
            <button
              type="button"
              onClick={() => setType("RECEITA")}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === "RECEITA"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Receita (A Receber)
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            {(["UNICO", "PARCELADO", "RECORRENTE"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  mode === m
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {m === "UNICO" ? "Único" : m === "PARCELADO" ? "Parcelado" : "Recorrente"}
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Descrição</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Supermercado, Fatura..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{mode === "PARCELADO" ? "Valor Parcela (R$)" : "Valor (R$)"}</span>
              </label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{mode === "UNICO" ? "Vencimento" : "1º Vencimento"}</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Installment Controls */}
          {mode === "PARCELADO" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nº de Parcelas
                </label>
                <input
                  type="number"
                  min="2"
                  max="120"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Dia do Mês
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* Recurrent Controls */}
          {mode === "RECORRENTE" && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Dia Fixo de Vencimento todo Mês (1 a 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-emerald-500 font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          {/* Category & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Categoria</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
              >
                {categories.length === 0 && <option value="">Nenhuma categoria encontrada</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <ContactIcon className="w-3.5 h-3.5" />
                <span>Contato / Favorecido</span>
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
              >
                <option value="">Nenhum (Opcional)</option>
                {contacts.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} ({ct.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Anotações complementares..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Lançamento"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
