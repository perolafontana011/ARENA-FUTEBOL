import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Lock, 
  Settings, 
  Receipt, 
  X,
  CreditCard,
  Building,
  Filter,
  Wallet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory } from '../types';
import { formatBRL } from '../utils/pix';
import { AdminPinModal } from './AdminPinModal';

export const CashFlowView: React.FC = () => {
  const { 
    isAdmin, 
    cashFlowSummary, 
    expenses, 
    sales, 
    debtPayments, 
    addExpense, 
    pixConfig, 
    setPixConfig 
  } = useApp();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPixSettingsOpen, setIsPixSettingsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

  // New Expense form state
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('gelo_carvao');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'pix' | 'dinheiro' | 'transferencia'>('pix');
  const [expenseNotes, setExpenseNotes] = useState('');

  // PIX Config form state
  const [tempPixKey, setTempPixKey] = useState(pixConfig.key);
  const [tempPixType, setTempPixType] = useState(pixConfig.keyType);
  const [tempMerchantName, setTempMerchantName] = useState(pixConfig.merchantName);
  const [tempMerchantCity, setTempMerchantCity] = useState(pixConfig.merchantCity);

  if (!isAdmin) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Acesso Restrito ao Administrador
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          O Fluxo de Caixa, Despesas Operacionais e Métricas de Lucro são visíveis exclusivamente para o dono da barraca.
        </p>
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          className="mt-6 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
        >
          Digitar PIN do Administrador (Padrão: 1234)
        </button>
        <AdminPinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          targetFeatureName="o Fluxo de Caixa e Lucros"
        />
      </div>
    );
  }

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount.replace(',', '.'));
    if (!expenseDesc.trim() || isNaN(amount) || amount <= 0) return;

    addExpense({
      description: expenseDesc.trim(),
      category: expenseCategory,
      amount,
      paymentMethod: expensePaymentMethod,
      notes: expenseNotes.trim() || undefined,
    });

    setIsExpenseModalOpen(false);
    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseNotes('');
  };

  const handleSavePixConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setPixConfig({
      key: tempPixKey.trim(),
      keyType: tempPixType,
      merchantName: tempMerchantName.trim() || 'ARENA GOL',
      merchantCity: tempMerchantCity.trim() || 'SAO PAULO',
    });
    setIsPixSettingsOpen(false);
  };

  // Compile unified transactions ledger
  const transactions: Array<{
    id: string;
    timestamp: string;
    type: 'sale' | 'debt_payment' | 'expense';
    title: string;
    category?: string;
    amount: number;
    paymentMethod: string;
    isInflow: boolean;
  }> = [];

  sales.forEach((s) => {
    transactions.push({
      id: s.id,
      timestamp: s.timestamp,
      type: 'sale',
      title: s.paymentMethod === 'fiado' 
        ? `Venda na Caderneta (Fiado): ${s.customerName || 'Cliente'}` 
        : `Venda no Balcão (${s.items.length} itens)`,
      amount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      isInflow: s.paymentMethod !== 'fiado',
    });
  });

  debtPayments.forEach((p) => {
    transactions.push({
      id: p.id,
      timestamp: p.timestamp,
      type: 'debt_payment',
      title: `Quitação de Fiado: ${p.customerName}`,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      isInflow: true,
    });
  });

  expenses.forEach((e) => {
    transactions.push({
      id: e.id,
      timestamp: e.timestamp,
      type: 'expense',
      title: e.description,
      category: e.category,
      amount: e.amount,
      paymentMethod: e.paymentMethod,
      isInflow: false,
    });
  });

  transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'in') return t.isInflow;
    if (filterType === 'out') return !t.isInflow;
    return true;
  });

  const categoryNames: Record<string, string> = {
    mercadoria_estoque: 'Reposição de Mercadoria',
    gelo_carvao: 'Gelo & Carvão Churrasqueira',
    aluguel_taxa_campeonato: 'Taxa / Aluguel da Barraca',
    mao_de_obra: 'Mão de Obra & Diárias',
    descartaveis_utensilios: 'Copos, Guardanapos & Utensílios',
    outros: 'Outras Despesas',
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
              Painel do Administrador · Exclusivo
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Tempo Real</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Fluxo de Caixa, Despesas &amp; Lucros
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o faturamento líquido em tempo real, saídas de insumos e saldo disponível.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPixSettingsOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Configurar PIX</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 transition-all shadow-sm whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Despesa</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lucro Líquido Real */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">Lucro Líquido Real</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span
            className={`text-2xl sm:text-3xl font-black font-mono tabular-nums mt-1.5 block tracking-tight ${
              cashFlowSummary.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatBRL(cashFlowSummary.netProfit)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Margem Líquida:</span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
              {cashFlowSummary.profitMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 2: Faturamento Bruto */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">Faturamento Bruto</span>
            <ArrowUpRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1.5 block tracking-tight">
            {formatBRL(cashFlowSummary.totalRevenue)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Lucro Bruto CMV:</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold">{formatBRL(cashFlowSummary.grossProfit)}</span>
          </div>
        </div>

        {/* Card 3: Total Despesas */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">Total de Despesas</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1.5 block tracking-tight">
            {formatBRL(cashFlowSummary.totalExpenses)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Gelo, carvão &amp; taxas</span>
          </div>
        </div>

        {/* Card 4: Saldo a Receber (Fiado) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">Pendente em Fiado</span>
            <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1.5 block tracking-tight">
            {formatBRL(cashFlowSummary.fiadoOutstanding)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>Aguardando quitação</span>
          </div>
        </div>
      </div>

      {/* Payment Channels Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Dinheiro Físico na Gaveta
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Espécie</span>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums block">
            {formatBRL(cashFlowSummary.cashInDrawer)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            Vendas e quitações em notas e moedas no balcão
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="text-teal-600 dark:text-teal-400 font-black">PIX</span>
              Recebido na Conta
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Instantâneo</span>
          </div>
          <span className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono tabular-nums block">
            {formatBRL(cashFlowSummary.pixReceived)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            QR Code no balcão e quitações remotas
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Cartão Máqu. (Débito/Crédito)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Terminal</span>
          </div>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono tabular-nums block">
            {formatBRL(cashFlowSummary.cardReceived)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            Transações processadas via maquininha
          </span>
        </div>
      </div>

      {/* Cash Flow Ledger / Extrato Geral */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Extrato do Fluxo de Caixa da Barraca
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Histórico cronológico de entradas de vendas, quitações e despesas operacionais
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'in' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Saídas
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-950/40">
                <th className="py-3 px-3.5">Data / Hora</th>
                <th className="py-3 px-3.5">Descrição da Movimentação</th>
                <th className="py-3 px-3.5">Canal / Forma</th>
                <th className="py-3 px-3.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Nenhuma movimentação registrada no filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-slate-200">
                      <div>
                        <span>{tx.title}</span>
                        {tx.category && (
                          <span className="text-[11px] text-slate-400 font-normal block">
                            {categoryNames[tx.category] || tx.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-medium">
                        {tx.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3.5 text-right font-mono font-black whitespace-nowrap tabular-nums text-sm ${
                        tx.isInflow ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.isInflow ? `+${formatBRL(tx.amount)}` : `-${formatBRL(tx.amount)}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lançar Despesa */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Lançar Despesa da Barraca
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Saída de caixa para reposição, gelo, taxa ou equipe
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição da Despesa *
                </label>
                <input
                  type="text"
                  required
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ex: 10 sacos de gelo moído, 4 sacos carvão..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Valor Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="90.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="gelo_carvao">Gelo &amp; Carvão</option>
                    <option value="mercadoria_estoque">Estoque / Mercadoria</option>
                    <option value="aluguel_taxa_campeonato">Aluguel / Taxa Campo</option>
                    <option value="mao_de_obra">Mão de Obra / Diária</option>
                    <option value="descartaveis_utensilios">Descartáveis</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pix', 'dinheiro', 'transferencia'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setExpensePaymentMethod(method)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        expensePaymentMethod === method
                          ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações / Fornecedor (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Ex: Fornecedor Gelo Express, nota fiscal 1402..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-xs"
                >
                  Registrar Saída
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configurações PIX */}
      {isPixSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative">
            <button
              onClick={() => setIsPixSettingsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Dados do PIX da Barraca
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure a chave que gera os QR Codes e Copia e Cola
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePixConfig} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  required
                  value={tempPixKey}
                  onChange={(e) => setTempPixKey(e.target.value)}
                  placeholder="CPF, CNPJ, Email, Telefone ou Aleatória"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tipo de Chave
                </label>
                <select
                  value={tempPixType}
                  onChange={(e) => setTempPixType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="telefone">Celular</option>
                  <option value="aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Titular / Razão Social
                </label>
                <input
                  type="text"
                  required
                  value={tempMerchantName}
                  onChange={(e) => setTempMerchantName(e.target.value)}
                  placeholder="Ex: BARRACA ARENA GOL"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white uppercase focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  required
                  value={tempMerchantCity}
                  onChange={(e) => setTempMerchantCity(e.target.value)}
                  placeholder="Ex: SAO PAULO"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white uppercase focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPixSettingsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-black text-white shadow-xs"
                >
                  Salvar Chave PIX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
