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
  Trophy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/pix';
import { AdminPinModal } from './AdminPinModal';

export const ReportsView: React.FC = () => {
  const { 
    isAdmin, 
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
      <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-950/40">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Acesso Restrito ao Administrador
        </h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Os Relatórios Mensais de Vendas e Inadimplência são confidenciais e exigem autenticação do proprietário.
        </p>
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
        >
          Digitar Senha do Administrador (Padrão: 1234)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
            Auditoria &amp; Inteligência Financeira
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Relatórios Mensais de Vendas &amp; Inadimplência
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cálculo automatizado de fechamento mensal, curva de devedores e lucratividade real.
          </p>
        </div>

        {/* Month Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white shadow-xs">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              {availableReportMonths.map((m) => {
                const [y, mo] = m.split('-');
                const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const label = `${names[parseInt(mo, 10) - 1]} / ${y}`;
                return (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Copiar resumo formatado para WhatsApp"
          >
            <Copy className="w-3.5 h-3.5 text-teal-400" />
            <span>{copiedSummary ? 'Copiado!' : 'Copiar Resumo'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Dados</span>
          </button>
        </div>
      </div>

      {/* Main KPI Strip for Selected Month */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block font-medium">Vendas Totais do Mês</span>
          <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
            {formatBRL(report.totalSales)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {report.salesCount} pedidos no balcão
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block font-medium">Recebido à Vista</span>
          <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1 block">
            {formatBRL(report.cashSales + report.pixSales + report.cardSales)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            PIX, Dinheiro &amp; Cartão
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block font-medium">Lucro Líquido Real</span>
          <span
            className={`text-2xl font-black font-mono tabular-nums mt-1 block ${
              report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatBRL(report.netProfit)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Margem Líquida: {report.profitMargin.toFixed(1)}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-[11px] text-slate-400 block font-medium">Taxa de Inadimplência</span>
          <span
            className={`text-2xl font-black font-mono tabular-nums mt-1 block ${
              report.delinquencyRate > 15 ? 'text-rose-400' : 'text-amber-400'
            }`}
          >
            {report.delinquencyRate.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {formatBRL(report.totalDelinquentDebt)} em aberto
          </span>
        </div>
      </div>

      {/* Two Column Layout: Inadimplência Deep Dive on Left (7 cols), Sales Breakdown on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Inadimplência & Devedores */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Relatório Automatizado de Inadimplência &amp; Fiado
                </h2>
              </div>
              <span className="text-xs text-rose-400 font-mono font-bold">
                {criticalDelinquent.length} devedor(es) crítico(s)
              </span>
            </div>

            {/* Envelhecimento da Dívida (Debt Aging Breakdown) */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Recente (0-7 dias)
                </span>
                <span className="text-sm sm:text-base font-black text-slate-200 font-mono mt-1 block">
                  {formatBRL(currentMonthCustomers.reduce((a, b) => a + b.totalDebt, 0))}
                </span>
                <span className="text-[10px] text-emerald-400 mt-0.5 block font-medium">Dentro da rodada</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Atenção (8-15 dias)
                </span>
                <span className="text-sm sm:text-base font-black text-amber-400 font-mono mt-1 block">
                  {formatBRL(attentionCustomers.reduce((a, b) => a + b.totalDebt, 0))}
                </span>
                <span className="text-[10px] text-amber-400 mt-0.5 block font-medium">Requer lembrete</span>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Crítico (+15 dias)
                </span>
                <span className="text-sm sm:text-base font-black text-rose-400 font-mono mt-1 block">
                  {formatBRL(criticalDelinquent.reduce((a, b) => a + b.totalDebt, 0))}
                </span>
                <span className="text-[10px] text-rose-400 mt-0.5 block font-medium">Comanda suspensa</span>
              </div>
            </div>

            {/* Inadimplentes List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Time / Camisa</th>
                    <th className="py-2.5 px-3 text-right">Saldo Devedor</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {overdueCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        🎉 Nenhuma inadimplência registrada! Todos os clientes estão em dia.
                      </td>
                    </tr>
                  ) : (
                    overdueCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white">
                          {c.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]">
                          {c.teamOrShirt}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          {formatBRL(c.totalDebt)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.status === 'inadimplente'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-amber-500/15 text-amber-400'
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

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              💡 <strong>Regra de Controle:</strong> Comandas com mais de 15 dias de vencimento devem permanecer travadas no sistema até que o cliente realize o pagamento via PIX.
            </p>
          </div>
        </div>

        {/* Right: Revenue Breakdown & Top Products */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sales Breakdown by Payment Channel */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white tracking-tight pb-2 border-b border-slate-800">
              Origem da Receita em {report.monthLabel}
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-300 font-medium">Pagamentos em PIX</span>
                <span className="font-mono font-bold text-teal-400">
                  {formatBRL(report.pixSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-300 font-medium">Dinheiro em Espécie</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatBRL(report.cashSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-300 font-medium">Cartão Maquininha</span>
                <span className="font-mono font-bold text-blue-400">
                  {formatBRL(report.cardSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span className="text-slate-300 font-medium">Vendas na Caderneta (Fiado)</span>
                <span className="font-mono font-bold text-amber-400">
                  {formatBRL(report.fiadoSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span className="font-medium">Quitações de Fiado Antigo</span>
                <span className="font-mono font-bold">
                  +{formatBRL(report.debtCollected)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Products Ranking */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
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
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-[11px] text-emerald-400 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 font-bold truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="text-right font-mono shrink-0 pl-2">
                      <span className="text-emerald-400 font-bold block">{formatBRL(p.revenue)}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{p.quantity} un</span>
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
