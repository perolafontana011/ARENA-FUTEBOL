import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  QrCode, 
  Banknote, 
  CreditCard, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  UserCheck,
  ShoppingBag,
  Sparkles,
  Flame,
  Beer,
  UtensilsCrossed,
  GlassWater
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory, PaymentMethod } from '../types';
import { formatBRL } from '../utils/pix';
import { PixModal } from './PixModal';

export const POSView: React.FC = () => {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    cartTotal, 
    makeSale, 
    customers, 
    addCustomer 
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string>('');
  const [saleErrorMessage, setSaleErrorMessage] = useState<string>('');
  const [isPixModalOpen, setIsPixModalOpen] = useState<boolean>(false);
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustTeam, setNewCustTeam] = useState<string>('');

  const categories = [
    { id: 'all', label: 'Cardápio Completo', icon: ShoppingBag },
    { id: 'comidas', label: 'Espetos & Churrasco', icon: Flame },
    { id: 'bebidas_alcoolicas', label: 'Cervejas no Gelo', icon: Beer },
    { id: 'bebidas', label: 'Refrigerantes & Águas', icon: GlassWater },
    { id: 'petiscos_doces', label: 'Pastéis & Porções', icon: UtensilsCrossed },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Cash change calculation
  const cashGivenNumber = parseFloat(cashTendered.replace(',', '.')) || 0;
  const changeDue = Math.max(0, cashGivenNumber - cartTotal);

  const handleCheckoutClick = () => {
    setSaleErrorMessage('');
    if (cart.length === 0) {
      setSaleErrorMessage('Selecione itens no cardápio para montar o pedido.');
      return;
    }

    if (paymentMethod === 'fiado' && !selectedCustomerId) {
      setSaleErrorMessage('Selecione um cliente para registrar na caderneta de fiado.');
      return;
    }

    if (paymentMethod === 'pix') {
      setIsPixModalOpen(true);
      return;
    }

    finalizeSale();
  };

  const finalizeSale = () => {
    const result = makeSale({
      paymentMethod,
      customerId: selectedCustomerId || undefined,
      notes: paymentMethod === 'dinheiro' && cashGivenNumber > 0 
        ? `Recebido R$ ${cashGivenNumber.toFixed(2)}, Troco: R$ ${changeDue.toFixed(2)}` 
        : undefined,
    });

    if (result.success) {
      setSaleSuccessMessage(`Pedido de ${formatBRL(result.sale?.totalAmount || 0)} finalizado com sucesso!`);
      setCashTendered('');
      setSelectedCustomerId('');
      setTimeout(() => setSaleSuccessMessage(''), 4500);
    } else {
      setSaleErrorMessage(result.error || 'Erro ao registrar venda.');
    }
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = addCustomer({
      name: newCustName,
      phone: newCustPhone || '11999999999',
      teamOrShirt: newCustTeam || 'Torcedor',
      creditLimit: 120,
    });

    setSelectedCustomerId(created.id);
    setShowQuickCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustTeam('');
  };

  return (
    <div className="space-y-6">
      {/* Charming, Inviting Matchday Concession Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                ⚽ Balcão Oficial · Rodada do Campeonato
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Atendimento Rápido</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Cardápio da Barraca
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Toque nos espetinhos, pastéis crocantes ou bebidas geladas para lançar na comanda. Baixa imediata no estoque.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-2 rounded-2xl">
              <span className="text-base select-none">🍢</span>
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Grelha</span>
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">Na Brasa</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 px-3.5 py-2 rounded-2xl">
              <span className="text-base select-none">❄️</span>
              <div>
                <span className="text-[10px] text-teal-800 dark:text-teal-300 uppercase font-bold block">Freezer</span>
                <span className="text-xs font-black text-teal-900 dark:text-teal-200">No Gelo Moído</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-3.5 py-2 rounded-2xl">
              <span className="text-base select-none">⚡</span>
              <div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold block">Pagamento</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">PIX no Balcão</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Kiosk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Product Selection (7-8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar espeto, pastel, cerveja, refrigerante..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-8 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid with Food Photography */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {filteredProducts.map((prod) => {
              const cartItem = cart.find((c) => c.product.id === prod.id);
              const inStock = prod.stockQuantity > 0;
              const isLowStock = prod.stockQuantity <= prod.minStockThreshold;

              return (
                <div
                  key={prod.id}
                  className={`group relative rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                    cartItem
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                      : !inStock
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/50'
                  }`}
                >
                  {/* Photo Container */}
                  {prod.imageUrl && (
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                      {/* Stock badge top-right */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`font-mono tabular-nums font-bold text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs border ${
                            !inStock
                              ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                              : isLowStock
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-slate-950/70 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {prod.stockQuantity} {prod.unit}
                        </span>
                      </div>

                      {/* Category tag top-left */}
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/70 text-white border border-white/20 backdrop-blur-md">
                          {prod.category === 'bebidas_alcoolicas'
                            ? '🍺 Cerveja'
                            : prod.category === 'bebidas'
                            ? '🥤 Bebida'
                            : prod.category === 'comidas'
                            ? '🍢 Espeto'
                            : '🍟 Petisco'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2">
                        {prod.name}
                      </h3>
                      {prod.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 leading-normal">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    {/* Footer: Price & Add Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                        {formatBRL(prod.salePrice)}
                      </span>

                      {inStock ? (
                        cartItem ? (
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(prod.id, cartItem.quantity - 1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 dark:text-white w-5 text-center font-mono">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(prod, 1)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(prod, 1)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pedir</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">
                          Esgotado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Modern Comanda Ticket (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 sticky top-20">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Comanda do Balcão
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {cart.length === 0 ? 'Aguardando itens do cliente' : `${cart.reduce((a, b) => a + b.quantity, 0)} itens selecionados`}
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>

          {/* Cart Item Rows */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                Toque nos espetos, pastéis ou bebidas para montar a comanda do jogo.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80"
                >
                  {/* Item Image Thumbnail */}
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 font-bold text-xs">
                      🍢
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.quantity}x {formatBRL(item.product.salePrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                      {formatBRL(item.product.salePrice * item.quantity)}
                    </span>
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 shadow-xs">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subtotal & Total */}
          <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatBRL(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Total a Pagar</span>
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
                {formatBRL(cartTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Forma de Pagamento
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-teal-50 dark:bg-teal-500/20 border-teal-500 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>PIX QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  paymentMethod === 'dinheiro'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Dinheiro Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-800 dark:text-blue-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Cartão Máqu.</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('fiado')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  paymentMethod === 'fiado'
                    ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Fiado / Caderneta</span>
              </button>
            </div>
          </div>

          {/* Cash Change Assistant */}
          {paymentMethod === 'dinheiro' && cartTotal > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Calculadora de Troco</span>
                <span className="font-mono">Valor Entregue</span>
              </div>
              <input
                type="number"
                step="any"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder="Ex: 50.00"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-1.5 pt-1">
                {[20, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCashTendered(String(v))}
                    className="flex-1 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-mono rounded-lg hover:bg-slate-100"
                  >
                    R$ {v}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashTendered(String(cartTotal))}
                  className="flex-1 py-1 bg-emerald-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono rounded-lg font-bold"
                >
                  Exato
                </button>
              </div>
              {cashGivenNumber >= cartTotal && (
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-mono flex justify-between pt-1 font-extrabold border-t border-slate-200 dark:border-slate-800">
                  <span>Troco a Devolver:</span>
                  <span>{formatBRL(changeDue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Fiado Customer Picker */}
          {paymentMethod === 'fiado' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Caderneta / Cliente do Fiado
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(true)}
                  className="text-[11px] text-amber-700 dark:text-amber-400 underline hover:text-amber-900 font-bold"
                >
                  + Novo Cliente
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-lg p-2 focus:outline-none"
              >
                <option value="">Selecione o cliente da barraca...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.teamOrShirt}) — Débito: {formatBRL(c.totalDebt)} / Limite: {formatBRL(c.creditLimit)}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Saldo devedor atual:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatBRL(selectedCustomer.totalDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Após este pedido:</span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                      {formatBRL(selectedCustomer.totalDebt + cartTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Limite disponível:</span>
                    <span className="font-mono">
                      {formatBRL(Math.max(0, selectedCustomer.creditLimit - (selectedCustomer.totalDebt + cartTotal)))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback messages */}
          {saleSuccessMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{saleSuccessMessage}</span>
            </div>
          )}

          {saleErrorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{saleErrorMessage}</span>
            </div>
          )}

          {/* Checkout Action Button */}
          <button
            type="button"
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {paymentMethod === 'pix' ? (
              <>
                <QrCode className="w-5 h-5" />
                Gerar PIX e Concluir Venda
              </>
            ) : paymentMethod === 'fiado' ? (
              <>
                <BookOpen className="w-5 h-5" />
                Registrar na Caderneta
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Finalizar Venda ({formatBRL(cartTotal)})
              </>
            )}
          </button>
        </div>
      </div>

      {/* PIX Modal for POS checkout */}
      <PixModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        amount={cartTotal}
        customerName={selectedCustomer?.name}
        description="Venda na Barraca - Campeonato"
        onPaymentConfirmed={() => {
          finalizeSale();
        }}
      />

      {/* Quick Add Customer Modal */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4">
            <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Cadastrar Cliente Rápido
            </h3>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ex: Paulinho da Zaga"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">WhatsApp (com DDD)</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="Ex: 11987654321"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Time / Camisa / Apelido</label>
                <input
                  type="text"
                  value={newCustTeam}
                  onChange={(e) => setNewCustTeam(e.target.value)}
                  placeholder="Ex: Camisa 8 do Real Madruga"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-xs"
                >
                  Cadastrar e Selecionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
