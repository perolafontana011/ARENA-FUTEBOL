import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Lock, 
  Users,
  Copy,
  Receipt,
  Trophy,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/pix';
import { AdminPinModal } from './AdminPinModal';

export const ReportsView: React.FC = () => {
  const { 
    isAdmin, 
    lockAdmin,
    availableReportMonths, 
    getMonthlyReport, 
    customers, 
    pixConfig 
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableReportMonths[0] || '2026-11'
  );
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isAdmin) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Acesso Restrito ao Administrador
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Os Relatórios Mensais de Vendas e Inadimplência são confidenciais e exigem autenticação do proprietário da barraca.
        </p>
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          className="mt-6 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>Digitar Senha do Administrador (Padrão: 1234)</span>
        </button>
        <AdminPinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          targetFeatureName="os Relatórios Mensais de Vendas e Inadimplência"
        />
      </div>
    );
  }

  const report = getMonthlyReport(selectedMonth);

  // Delinquency grouping by aging
  const overdueCustomers = customers.filter((c) => c.totalDebt > 0);
  const criticalDelinquent = customers.filter((c) => c.status === 'inadimplente' && c.totalDebt > 0);
  const attentionCustomers = customers.filter((c) => c.status === 'atencao' && c.totalDebt > 0);
  const currentMonthCustomers = customers.filter((c) => c.status === 'em_dia' && c.totalDebt > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = 
`📊 *RELATÓRIO MENSAL - BARRACA ARENA GOL*
🗓 Mês de Referência: ${report.monthLabel}

💰 *FATURAMENTO:*
• Total de Vendas: ${formatBRL(report.totalSales)}
• Recebido à Vista (Dinheiro/PIX/Cartão): ${formatBRL(report.cashSales + report.pixSales + report.cardSales)}
• Vendas no Fiado (A Receber): ${formatBRL(report.fiadoSales)}
• Quitações de Fiado Antigo Recebidas: ${formatBRL(report.debtCollected)}

📉 *DESPESAS & RESULTADO:*
• Despesas Operacionais: ${formatBRL(report.totalExpenses)}
• Lucro Líquido Real: ${formatBRL(report.netProfit)}
• Margem Líquida: ${report.profitMargin.toFixed(1)}%

⚠️ *INADIMPLÊNCIA:*
• Total em Aberto em Caderneta: ${formatBRL(report.totalDelinquentDebt)}
• Taxa de Inadimplência: ${report.delinquencyRate.toFixed(1)}%
• Devedores Críticos (+15 dias): ${criticalDelinquent.length} clientes

🏆 *PRODUTO MAIS VENDIDO:*
• ${report.topSellingProducts[0]?.name || 'N/A'} (${report.topSellingProducts[0]?.quantity || 0} un)`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `relatorio_barraca_${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400">
              <FileText className="w-3 h-3" />
              Auditoria Financeira
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Fechamento Automático
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Relatórios Mensais de Vendas &amp; Inadimplência
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cálculo automatizado de fechamento mensal, curva de devedores e lucratividade real.
          </p>
        </div>

        {/* Month Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xs">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              {availableReportMonths.map((m) => {
                const [y, mo] = m.split('-');
                const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const label = `${names[parseInt(mo, 10) - 1]} / ${y}`;
                return (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Copiar resumo formatado para WhatsApp"
          >
            {copiedSummary ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            )}
            <span>{copiedSummary ? 'Copiado!' : 'Copiar Resumo'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>

          <button
            type="button"
            onClick={lockAdmin}
            className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Bloquear relatórios e retornar ao balcão"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Bloquear Relatórios</span>
          </button>
        </div>
      </div>

      {/* Main KPI Strip for Selected Month */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vendas Totais do Mês
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1.5 block">
            {formatBRL(report.totalSales)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {report.salesCount} pedidos atendidos no balcão
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recebido à Vista
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1.5 block">
            {formatBRL(report.cashSales + report.pixSales + report.cardSales)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            PIX, Dinheiro &amp; Cartão
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lucro Líquido Real
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              report.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span
            className={`text-2xl font-black font-mono tabular-nums mt-1.5 block ${
              report.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatBRL(report.netProfit)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Margem Líquida: <strong className="font-bold text-slate-700 dark:text-slate-300">{report.profitMargin.toFixed(1)}%</strong>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Taxa de Inadimplência
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              report.delinquencyRate > 15 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <span
            className={`text-2xl font-black font-mono tabular-nums mt-1.5 block ${
              report.delinquencyRate > 15 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {report.delinquencyRate.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {formatBRL(report.totalDelinquentDebt)} em aberto na caderneta
          </span>
        </div>
      </div>

      {/* Two Column Layout: Inadimplência Deep Dive on Left (7 cols), Sales Breakdown on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Inadimplência & Devedores */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Auditoria de Inadimplência &amp; Curva da Caderneta
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Segmentação por idade da dívida e bloqueio automático de comanda
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                {criticalDelinquent.length} devedor(es) crítico(s)
              </span>
            </div>

            {/* Envelhecimento da Dívida (Debt Aging Breakdown) */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-extrabold tracking-wider">
                  Recente (0-7 dias)
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-1 block">
                  {formatBRL(currentMonthCustomers.reduce((a, b) => a + b.totalDebt, 0))}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-bold">Dentro da rodada</span>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 block uppercase font-extrabold tracking-wider">
                  Atenção (8-15 dias)
                </span>
                <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400 font-mono mt-1 block">
                  {formatBRL(attentionCustomers.reduce((a, b) => a + b.totalDebt, 0))}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block font-bold">Requer lembrete</span>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 block uppercase font-extrabold tracking-wider">
                  Crítico (+15 dias)
                </span>
                <span className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-400 font-mono mt-1 block">
                  {formatBRL(criticalDelinquent.reduce((a, b) => a + b.totalDebt, 0))}
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 block font-bold">Comanda suspensa</span>
              </div>
            </div>

            {/* Inadimplentes List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/60">
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Time / Camisa</th>
                    <th className="py-2.5 px-3 text-right">Saldo Devedor</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overdueCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        🎉 Nenhuma inadimplência registrada! Todos os clientes estão em dia.
                      </td>
                    </tr>
                  ) : (
                    overdueCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                          {c.teamOrShirt}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatBRL(c.totalDebt)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.status === 'inadimplente'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                            }`}
                          >
                            {c.status === 'inadimplente' ? 'Atraso Crítico' : 'A Vencer'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
              💡 <strong>Regra da Barraca:</strong> Comandas com mais de 15 dias de atraso ficam com o botão de fiado bloqueado no PDV até que o cliente realize o pagamento via PIX.
            </p>
          </div>
        </div>

        {/* Right: Revenue Breakdown & Top Products */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sales Breakdown by Payment Channel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight pb-2 border-b border-slate-100 dark:border-slate-800">
              Origem da Receita em {report.monthLabel}
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Pagamentos em PIX</span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  {formatBRL(report.pixSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Dinheiro em Espécie (Gaveta)</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBRL(report.cashSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Cartão Maquininha</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatBRL(report.cardSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <span className="text-amber-800 dark:text-amber-300 font-bold">Vendas na Caderneta (Fiado)</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatBRL(report.fiadoSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                <span className="font-bold">Quitações de Fiado Recebidas</span>
                <span className="font-mono font-black">
                  +{formatBRL(report.debtCollected)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Products Ranking */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Campeões de Vendas do Torneio
              </h2>
            </div>

            <div className="space-y-2">
              {report.topSellingProducts.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Sem vendas computadas para este mês.
                </p>
              ) : (
                report.topSellingProducts.map((p, idx) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                        idx === 0 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' 
                          : idx === 1 
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' 
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-slate-800 dark:text-slate-100 font-bold truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="text-right font-mono shrink-0 pl-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block">{formatBRL(p.revenue)}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{p.quantity} un</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

