import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Transaction, Category, Contact } from "../types";
import { formatCurrency } from "../utils/format";
import { TransactionModal } from "../components/TransactionModal";
import { Plus, Check, Trash2, ArrowUpRight, ArrowDownRight, Filter, AlertCircle } from "lucide-react";

export const Transactions: React.FC = () => {
  const { profile, hideValues } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, catRes, conRes] = await Promise.all([
        api.get("/transactions", {
          params: {
            profile,
            status: statusFilter === "TODOS" ? undefined : statusFilter,
            type: typeFilter === "TODOS" ? undefined : typeFilter,
            start_due_date: `${selectedMonth}-01`,
            end_due_date: `${selectedMonth}-31`,
          },
        }),
        api.get("/categories", { params: { profile } }),
        api.get("/contacts", { params: { profile } }),
      ]);

      setTransactions(transRes.data);

      const catMap: Record<string, string> = {};
      catRes.data.forEach((c: Category) => {
        catMap[c.id] = c.name;
      });
      setCategories(catMap);

      const conMap: Record<string, string> = {};
      conRes.data.forEach((ct: Contact) => {
        conMap[ct.id] = ct.name;
      });
      setContacts(conMap);
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile, statusFilter, typeFilter, selectedMonth]);

  const handleComplete = async (id: string) => {
    try {
      await api.patch(`/transactions/${id}/complete`);
      fetchData();
    } catch (err) {
      console.error("Erro ao liquidar transação:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta transação?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchData();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title + Month & New Transaction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Lançamentos & Contas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Controle de contas a pagar, a receber e quitações financeiras ({profile})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-xl shadow-sm focus:outline-none font-mono"
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        
        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-zinc-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {["TODOS", "PENDENTE", "CONCLUIDO"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {st === "TODOS" ? "Todos" : st === "PENDENTE" ? "Abertas" : "Liquidadas"}
            </button>
          ))}
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-zinc-400 mr-1">Tipo:</span>
          {["TODOS", "DESPESA", "RECEITA"].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === tp
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {tp === "TODOS" ? "Todos" : tp === "DESPESA" ? "Despesas" : "Receitas"}
            </button>
          ))}
        </div>

      </div>

      {/* Transactions Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-zinc-500">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            Carregando lançamentos...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Nenhum lançamento encontrado para o período.
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Utilize o botão "Novo Lançamento" para cadastrar contas a pagar ou a receber.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-3.5 px-4 w-12 text-center">Status</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4">Contato</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-4 w-16 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {transactions.map((t) => {
                  const isCompleted = t.status === "CONCLUIDO";
                  const isOverdue = !isCompleted && t.due_date < new Date().toISOString().split("T")[0];

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Status / Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => !isCompleted && handleComplete(t.id)}
                          title={isCompleted ? "Liquidada" : "Clique para liquidar"}
                          disabled={isCompleted}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isCompleted
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 cursor-default"
                              : "border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-emerald-600 hover:text-emerald-600 hover:scale-105"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                          {t.due_date}
                        </div>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            <AlertCircle className="w-3 h-3" /> Atrasado
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-md ${
                            t.type === "RECEITA"
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                          }`}>
                            {t.type === "RECEITA" ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className={`font-semibold ${isCompleted ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}`}>
                            {t.description}
                          </span>
                        </div>
                        {t.notes && (
                          <p className="text-[11px] text-zinc-400 mt-0.5 ml-7">{t.notes}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                        {categories[t.category_id] || "-"}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {t.contact_id ? contacts[t.contact_id] || "-" : "-"}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`font-mono font-bold text-sm ${
                          t.type === "DESPESA"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {t.type === "DESPESA" ? "-" : "+"} {formatCurrency(t.amount_cents, hideValues)}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(t.id)}
                          title="Excluir Lançamento"
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
