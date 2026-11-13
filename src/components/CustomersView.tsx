import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  MessageCircle, 
  QrCode, 
  Send, 
  Banknote, 
  AlertTriangle, 
  CheckCircle, 
  X,
  CreditCard,
  Volume2,
  Phone,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { formatBRL, formatPhone, generatePixCopiaECola } from '../utils/pix';
import { COLLECTION_TEMPLATES, createWhatsAppUrl } from '../utils/messaging';
import { PixModal } from './PixModal';

export const CustomersView: React.FC = () => {
  const { 
    customers, 
    addCustomer, 
    settleCustomerDebt, 
    sendDebtNotice, 
    pixConfig 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'com_debito' | 'inadimplente' | 'em_dia'>('todos');
  
  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedCustomerForNotice, setSelectedCustomerForNotice] = useState<Customer | null>(null);
  const [selectedCustomerForPix, setSelectedCustomerForPix] = useState<Customer | null>(null);
  const [selectedCustomerForCash, setSelectedCustomerForCash] = useState<Customer | null>(null);
  const [cashAmountToSettle, setCashAmountToSettle] = useState<string>('');
  const [cashPayerName, setCashPayerName] = useState<string>('');
  const [cashPayerPhone, setCashPayerPhone] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('amigavel_jogo');

  // Form State for New Customer
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTeam, setFormTeam] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('150');
  const [formNotes, setFormNotes] = useState('');

  // Bulk dispatch feedback
  const [bulkDispatchSuccess, setBulkDispatchSuccess] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teamOrShirt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'com_debito') return c.totalDebt > 0;
    if (statusFilter === 'inadimplente') return c.status === 'inadimplente' && c.totalDebt > 0;
    if (statusFilter === 'em_dia') return c.totalDebt === 0;
    return true;
  });

  // KPI calculations
  const totalDebtSum = customers.reduce((acc, c) => acc + c.totalDebt, 0);
  const delinquentCustomers = customers.filter((c) => c.status === 'inadimplente' && c.totalDebt > 0);
  const delinquentDebtSum = delinquentCustomers.reduce((acc, c) => acc + c.totalDebt, 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    addCustomer({
      name: formName,
      phone: formPhone,
      teamOrShirt: formTeam || 'Torcedor',
      creditLimit: parseFloat(formCreditLimit) || 100,
      notes: formNotes,
    });

    setIsAddCustomerOpen(false);
    setFormName('');
    setFormPhone('');
    setFormTeam('');
    setFormCreditLimit('150');
    setFormNotes('');
  };

  const handleSendWhatsApp = (cust: Customer, messageText: string) => {
    sendDebtNotice({
      customerId: cust.id,
      amount: cust.totalDebt,
      message: messageText,
      type: 'whatsapp',
    });
    const url = createWhatsAppUrl(cust.phone, messageText);
    window.open(url, '_blank');
    setSelectedCustomerForNotice(null);
  };

  const handleSendPushNotice = (cust: Customer) => {
    const message = `Lembrete da Barraca: Olá ${cust.name}, sua conta está em ${formatBRL(cust.totalDebt)}. Quitação rápida via chave PIX: ${pixConfig.key}.`;
    sendDebtNotice({
      customerId: cust.id,
      amount: cust.totalDebt,
      message,
      type: 'push',
    });
  };

  const handleBulkDebtDispatch = () => {
    let count = 0;
    delinquentCustomers.forEach((cust) => {
      sendDebtNotice({
        customerId: cust.id,
        amount: cust.totalDebt,
        message: `Aviso da Barraca: Olá ${cust.name}, consta saldo vencido de ${formatBRL(cust.totalDebt)}. Quitação via PIX ${pixConfig.key}.`,
        type: 'push',
      });
      count++;
    });
    setBulkDispatchSuccess(`Notificação de cobrança disparada com sucesso para ${count} clientes em atraso!`);
    setTimeout(() => setBulkDispatchSuccess(''), 5000);
  };

  const handleSettleCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForCash) return;
    const amount = parseFloat(cashAmountToSettle) || selectedCustomerForCash.totalDebt;
    settleCustomerDebt({
      customerId: selectedCustomerForCash.id,
      amount,
      paymentMethod: 'dinheiro',
      payerName: cashPayerName,
      payerPhone: cashPayerPhone,
      notes: `Recebido em espécie no balcão (${cashPayerName || selectedCustomerForCash.name})`,
    });
    setSelectedCustomerForCash(null);
    setCashAmountToSettle('');
    setCashPayerName('');
    setCashPayerPhone('');
  };

  const selectedTemplate = COLLECTION_TEMPLATES.find((t) => t.id === selectedTemplateId) || COLLECTION_TEMPLATES[0];
  const generatedMessagePreview = selectedCustomerForNotice
    ? selectedTemplate.generate({
        customerName: selectedCustomerForNotice.name,
        amount: selectedCustomerForNotice.totalDebt,
        teamOrShirt: selectedCustomerForNotice.teamOrShirt,
        pixKey: pixConfig.key,
        pixKeyType: pixConfig.keyType.toUpperCase(),
        pixCopiaECola: generatePixCopiaECola(
          pixConfig,
          selectedCustomerForNotice.totalDebt,
          `COB${selectedCustomerForNotice.id.replace(/\D/g, '')}`,
          'Quitacao Fiado'
        ),
        daysOverdue: 14,
      })
    : '';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
              Gestão de Caderneta &amp; Cobrança
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">WhatsApp &amp; PIX</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Clientes do Campeonato &amp; Fiado
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastre clientes, monitore comandas em aberto e dispare mensagens com PIX integrado.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBulkDebtDispatch}
            disabled={delinquentCustomers.length === 0}
            className="px-3.5 py-2.5 rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-40 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            title="Disparar aviso para todos com débito vencido"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Cobrança em Massa ({delinquentCustomers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition-all shadow-sm whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total de Clientes</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
            {customers.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Jogadores, árbitros e torcida
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Saldo Total em Fiado</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1 block">
            {formatBRL(totalDebtSum)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            A receber em comandas abertas
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Débito Vencido (+15 dias)</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1 block">
            {formatBRL(delinquentDebtSum)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {delinquentCustomers.length} devedor(es) em atraso crítico
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Taxa de Adimplência</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1 block">
            {customers.length > 0 
              ? `${Math.round(((customers.length - delinquentCustomers.length) / customers.length) * 100)}%`
              : '100%'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Clientes em situação regular
          </span>
        </div>
      </div>

      {bulkDispatchSuccess && (
        <div className="p-3 bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{bulkDispatchSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, time, camisa ou WhatsApp..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'todos' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('com_debito')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'com_debito' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Com Débito ({customers.filter((c) => c.totalDebt > 0).length})
          </button>
          <button
            onClick={() => setStatusFilter('inadimplente')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'inadimplente' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Inadimplentes ({delinquentCustomers.length})
          </button>
          <button
            onClick={() => setStatusFilter('em_dia')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'em_dia' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Em Dia ({customers.filter((c) => c.totalDebt === 0).length})
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Nenhum cliente encontrado com os filtros aplicados.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const hasDebt = cust.totalDebt > 0;
            const limitUsagePercent = Math.min(100, Math.round((cust.totalDebt / cust.creditLimit) * 100));
            const isOverdue = cust.status === 'inadimplente';

            return (
              <div
                key={cust.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
              >
                <div>
                  {/* Top: Avatar Monogram, Name & Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-slate-800 dark:to-slate-900 border border-emerald-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-emerald-800 dark:text-emerald-400 font-mono shrink-0 shadow-xs">
                      {getInitials(cust.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {cust.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            !hasDebt
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                          }`}
                        >
                          {!hasDebt ? 'Em Dia' : isOverdue ? 'Atrasado' : 'A Vencer'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        {cust.teamOrShirt}
                      </span>
                    </div>
                  </div>

                  {/* Phone & Last Reminder */}
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {formatPhone(cust.phone)}
                    </span>
                    {cust.lastReminderDate && (
                      <span className="text-[10px] text-slate-400">
                        Cobrado {new Date(cust.lastReminderDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {/* Debt Balance Box */}
                  <div className="mt-3.5 p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Saldo Devedor:</span>
                      <span
                        className={`text-lg font-black font-mono tabular-nums ${
                          hasDebt ? (isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400') : 'text-slate-400'
                        }`}
                      >
                        {formatBRL(cust.totalDebt)}
                      </span>
                    </div>

                    {/* Credit Limit Progress */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-mono">
                        <span>Limite: {formatBRL(cust.creditLimit)}</span>
                        <span className="font-bold">{limitUsagePercent}% usado</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            limitUsagePercent > 80
                              ? 'bg-rose-500'
                              : limitUsagePercent > 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${limitUsagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {cust.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-2.5 line-clamp-1">
                      "{cust.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {hasDebt ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerForNotice(cust)}
                        className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                        title="Enviar mensagem amigável de cobrança via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Cobrar Whats</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCustomerForPix(cust)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                        title="Gerar QR Code PIX para quitação"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Quitar PIX</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      Conta zerada · Crédito liberado
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendPushNotice(cust)}
                      className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                      title="Disparar notificação push imediata"
                    >
                      <Send className="w-3 h-3 text-slate-400" />
                      Disparar Push
                    </button>

                    {hasDebt && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerForCash(cust);
                          setCashAmountToSettle(String(cust.totalDebt));
                          setCashPayerName(cust.name);
                          setCashPayerPhone(cust.phone);
                        }}
                        className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Receber Dinheiro
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Cadastrar Novo Cliente */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative">
            <button
              onClick={() => setIsAddCustomerOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Cadastrar Cliente no Campeonato
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Crie a ficha para liberação de comanda e fiado
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo / Apelido *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Paulinho da Zaga"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="11988887777"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Limite de Fiado (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    placeholder="150.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Time / Camisa / Função no Torneio
                </label>
                <input
                  type="text"
                  value={formTeam}
                  onChange={(e) => setFormTeam(e.target.value)}
                  placeholder="Ex: Camisa 7 - Real Madruga FC / Torcedor / Árbitro"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Acerta sempre após o jogo de domingo..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-xs"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enviar Cobrança WhatsApp com templates esportivos */}
      {selectedCustomerForNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCustomerForNotice(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Mandar Mensagem de Cobrança
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCustomerForNotice.name} · Saldo Devedor:{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-mono">
                    {formatBRL(selectedCustomerForNotice.totalDebt)}
                  </strong>
                </p>
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Escolha o Modelo de Mensagem:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {COLLECTION_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-teal-50 dark:bg-teal-500/20 border-teal-500 text-teal-900 dark:text-teal-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">{tmpl.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 line-clamp-2">
                      {tmpl.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Preview styled like WhatsApp */}
            <div className="space-y-1.5 mb-5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Pré-visualização da mensagem no WhatsApp (com Chave e Copia e Cola):
              </span>
              <div className="bg-[#0b141a] border border-[#202c33] p-4 rounded-2xl text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto shadow-inner relative">
                {generatedMessagePreview}
                <div className="text-right text-[10px] text-slate-500 font-mono mt-2 flex items-center justify-end gap-1">
                  <span>Agora</span>
                  <Check className="w-3 h-3 text-teal-400" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomerForNotice(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp(selectedCustomerForNotice, generatedMessagePreview)}
                className="flex-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                Abrir WhatsApp e Enviar Cobrança
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIX Modal for Debt Settlement */}
      {selectedCustomerForPix && (
        <PixModal
          isOpen={true}
          onClose={() => setSelectedCustomerForPix(null)}
          amount={selectedCustomerForPix.totalDebt}
          customerName={selectedCustomerForPix.name}
          customerPhone={selectedCustomerForPix.phone}
          showPayerFields={true}
          description={`Quitacao Comanda ${selectedCustomerForPix.name.slice(0, 15)}`}
          onPaymentConfirmed={(payerInfo) => {
            settleCustomerDebt({
              customerId: selectedCustomerForPix.id,
              amount: selectedCustomerForPix.totalDebt,
              paymentMethod: 'pix',
              payerName: payerInfo?.name,
              payerPhone: payerInfo?.phone,
              notes: 'Quitação integral via PIX no QR Code',
            });
            setSelectedCustomerForPix(null);
          }}
        />
      )}

      {/* Cash Settlement Modal */}
      {selectedCustomerForCash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5 text-emerald-600" />
              Receber Quitação em Dinheiro
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Débito Total na Comanda:{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                {formatBRL(selectedCustomerForCash.totalDebt)}
              </strong>
            </p>

            <form onSubmit={handleSettleCash} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Pessoa *
                </label>
                <input
                  type="text"
                  required
                  value={cashPayerName}
                  onChange={(e) => setCashPayerName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Número / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={cashPayerPhone}
                  onChange={(e) => setCashPayerPhone(e.target.value)}
                  placeholder="Ex: 11987654321"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Valor Recebido (R$)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={cashAmountToSettle}
                  onChange={(e) => setCashAmountToSettle(e.target.value)}
                  max={selectedCustomerForCash.totalDebt}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-base text-emerald-700 dark:text-emerald-400 font-mono font-black focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForCash(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white cursor-pointer"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
