import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { DashboardSummary } from "../types";
import { formatCurrency } from "../utils/format";
import { 
  ArrowUpRight, ArrowDownRight, AlertCircle, Clock, 
  TrendingUp, CheckCircle2, ChevronLeft, ChevronRight,
  PieChart as PieChartIcon
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { profile, hideValues } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await api.get("/dashboard/summary", {
          params: {
            profile,
            month: selectedMonth,
            year: selectedYear,
          },
        });
        setSummary(res.data);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [profile, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Painel Geral
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Visão consolidada do fluxo de caixa e projeções financeiras ({profile})
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-3 text-zinc-800 dark:text-zinc-200 min-w-[120px] text-center">
            {monthNames[selectedMonth - 1]} / {selectedYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-all"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Carregando indicadores financeiros...
        </div>
      ) : !summary ? (
        <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <p className="text-sm text-zinc-500">Nenhum dado encontrado para o período selecionado.</p>
        </div>
      ) : (
        <>
          {/* Urgent Alerts (Overdue & Due Today) */}
          {(summary.overdue_count > 0 || summary.due_today_count > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-6">
              {summary.overdue_count > 0 && (
                <div className="flex items-center justify-between p-4.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                        {summary.overdue_count} {summary.overdue_count === 1 ? "Conta Atrasada" : "Contas Atrasadas"}
                      </h4>
                      <p className="text-xs text-rose-700/80 dark:text-rose-400/80">Exigem quitação imediata</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-rose-700 dark:text-rose-300">
                      {formatCurrency(summary.overdue_amount_cents, hideValues)}
                    </span>
                  </div>
                </div>
              )}

              {summary.due_today_count > 0 && (
                <div className="flex items-center justify-between p-4.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        {summary.due_today_count} {summary.due_today_count === 1 ? "Conta Vence Hoje" : "Contas Vencem Hoje"}
                      </h4>
                      <p className="text-xs text-amber-700/80 dark:text-amber-400/80">Previsão de pagamento hoje</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
                      {formatCurrency(summary.due_today_amount_cents, hideValues)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 xl:gap-6">
            
            {/* Card 1: Realizado (Liquidado) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 xl:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Realizado (Liquidado)
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Recebido:
                  </span>
                  <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.income_realized_cents, hideValues)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Pago:
                  </span>
                  <span className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                    {formatCurrency(summary.expense_realized_cents, hideValues)}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Resultado Caixa:</span>
                  <span className={`text-base font-bold font-mono ${
                    summary.net_realized_cents >= 0 ? "text-zinc-900 dark:text-zinc-100" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {formatCurrency(summary.net_realized_cents, hideValues)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Pendente (A Vencer) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 xl:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Pendente (A Vencer)
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> A Receber:
                  </span>
                  <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.income_pending_cents, hideValues)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> A Pagar:
                  </span>
                  <span className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                    {formatCurrency(summary.expense_pending_cents, hideValues)}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Pendente Líquido:</span>
                  <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(summary.net_pending_cents, hideValues)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Projeção Final do Mês */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-800 text-white rounded-2xl p-5 xl:p-6 shadow-md space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Projeção Final do Mês
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>

                <div>
                  <span className="text-xs text-zinc-400 block mb-1">Saldo Final Projetado</span>
                  <div className={`text-2xl font-black font-mono tracking-tight ${
                    summary.projected_net_cents >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {formatCurrency(summary.projected_net_cents, hideValues)}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400/90 leading-tight">
                Considera receitas e despesas realizadas somadas aos lançamentos previstos até o fim do mês.
              </p>
            </div>

          </div>

          {/* Top Expense Categories Breakdown */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                <span>Maiores Despesas por Categoria no Mês</span>
              </h3>
              <span className="text-xs text-zinc-400">
                {summary.top_expense_categories.length} categorias
              </span>
            </div>

            {summary.top_expense_categories.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                Nenhuma despesa registrada para este perfil no mês selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-3.5 pt-2">
                {summary.top_expense_categories.map((cat) => (
                  <div key={cat.category_id} className="space-y-1.5 p-2 rounded-xl hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cat.category_name}</span>
                      <span className="font-mono text-zinc-600 dark:text-zinc-400">
                        {formatCurrency(cat.amount_cents, hideValues)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
