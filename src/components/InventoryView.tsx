import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ArrowUpDown, 
  DollarSign, 
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory } from '../types';
import { formatBRL } from '../utils/pix';

export const InventoryView: React.FC = () => {
  const { products, addProduct, restockProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState('12');
  const [autoRegisterExpense, setAutoRegisterExpense] = useState(true);

  // New Product Form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('bebidas_alcoolicas');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newStockQuantity, setNewStockQuantity] = useState('24');
  const [newMinThreshold, setNewMinThreshold] = useState('12');
  const [newUnit, setNewUnit] = useState('lata');
  const [newDesc, setNewDesc] = useState('');

  // Calculations
  const totalStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalCostValue = products.reduce((acc, p) => acc + p.stockQuantity * p.costPrice, 0);
  const totalRetailValue = products.reduce((acc, p) => acc + p.stockQuantity * p.salePrice, 0);
  const projectedProfit = totalRetailValue - totalCostValue;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockThreshold);

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    
    let matchesStock = true;
    if (stockStatusFilter === 'low') {
      matchesStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockThreshold;
    } else if (stockStatusFilter === 'out') {
      matchesStock = p.stockQuantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(newCostPrice.replace(',', '.')) || 0;
    const sale = parseFloat(newSalePrice.replace(',', '.')) || 0;
    const qty = parseInt(newStockQuantity, 10) || 0;
    const minThreshold = parseInt(newMinThreshold, 10) || 5;

    if (!newName.trim() || sale <= 0) return;

    addProduct({
      name: newName.trim(),
      category: newCategory,
      costPrice: cost,
      salePrice: sale,
      stockQuantity: qty,
      minStockThreshold: minThreshold,
      unit: newUnit.trim() || 'un',
      description: newDesc.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewCostPrice('');
    setNewSalePrice('');
    setNewStockQuantity('24');
    setNewDesc('');
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock) return;
    const qty = parseInt(restockAmount, 10);
    if (isNaN(qty) || qty <= 0) return;

    restockProduct(selectedProductForRestock.id, qty, autoRegisterExpense);
    setSelectedProductForRestock(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
            Controle de Estoque &amp; Insumos
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Banco de Dados do Estoque em Tempo Real
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Baixa automática a cada pedido no balcão, alertas de reposição e margens unitárias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs whitespace-nowrap self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total de Unidades</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
            {totalStockUnits} un
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {products.length} itens cadastrados
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Valor a Preço de Custo</span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-200 font-mono tabular-nums mt-1 block">
            {formatBRL(totalCostValue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Capital estocado na barraca
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Potencial de Venda</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1 block">
            {formatBRL(totalRetailValue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Lucro estocado: {formatBRL(projectedProfit)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Alertas de Reposição</span>
          <span
            className={`text-2xl font-black font-mono tabular-nums mt-1 block ${
              lowStockProducts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {lowStockProducts.length} itens
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lowStockProducts.length > 0 ? 'Exigem reposição urgente' : 'Estoque regular'}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto por nome ou categoria..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none shadow-xs"
          >
            <option value="all">Todas as Categorias</option>
            <option value="comidas">Comidas &amp; Espetos</option>
            <option value="bebidas_alcoolicas">Cervejas Geladas</option>
            <option value="bebidas">Refrigerantes &amp; Águas</option>
            <option value="petiscos_doces">Petiscos &amp; Porções</option>
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none shadow-xs"
          >
            <option value="all">Todos os Status</option>
            <option value="low">Estoque Baixo</option>
            <option value="out">Esgotados</option>
          </select>
        </div>
      </div>

      {/* Real-time Inventory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-950/50">
                <th className="py-3.5 px-4">Produto</th>
                <th className="py-3.5 px-3">Categoria</th>
                <th className="py-3.5 px-3 text-right">Preço de Custo</th>
                <th className="py-3.5 px-3 text-right">Preço de Venda</th>
                <th className="py-3.5 px-3 text-right">Margem Unit.</th>
                <th className="py-3.5 px-3 text-center">Estoque Atual</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOut = prod.stockQuantity === 0;
                  const isLow = prod.stockQuantity <= prod.minStockThreshold && !isOut;
                  const marginUnit = prod.salePrice - prod.costPrice;
                  const marginPercent = prod.salePrice > 0 ? (marginUnit / prod.salePrice) * 100 : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{prod.name}</div>
                            {prod.description && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-normal">
                                {prod.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 capitalize">
                        {prod.category === 'bebidas_alcoolicas'
                          ? 'Cerveja'
                          : prod.category === 'bebidas'
                          ? 'Bebida'
                          : prod.category === 'comidas'
                          ? 'Comida'
                          : 'Petisco'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatBRL(prod.costPrice)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-black">
                        {formatBRL(prod.salePrice)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatBRL(marginUnit)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                          ({marginPercent.toFixed(0)}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums font-bold">
                        <span
                          className={`text-sm ${
                            isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {prod.stockQuantity}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          {prod.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
                            Esgotado
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            Baixo (&le; {prod.minStockThreshold})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductForRestock(prod);
                            setRestockAmount(String(prod.minStockThreshold * 2 || 12));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center gap-1 ml-auto"
                        >
                          <RefreshCw className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>Repor</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Repor Estoque */}
      {selectedProductForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative">
            <button
              onClick={() => setSelectedProductForRestock(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
              Reabastecer Estoque
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Produto: <strong className="text-slate-900 dark:text-white">{selectedProductForRestock.name}</strong>
              <br />
              Estoque atual: {selectedProductForRestock.stockQuantity} {selectedProductForRestock.unit}
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantidade a Adicionar ({selectedProductForRestock.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-base font-bold text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Quick helper buttons */}
              <div className="flex gap-1.5">
                {[6, 12, 24, 48].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setRestockAmount(String(q))}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    +{q}
                  </button>
                ))}
              </div>

              {/* Automatic expense trigger checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRegisterExpense}
                    onChange={(e) => setAutoRegisterExpense(e.target.checked)}
                    className="mt-0.5 rounded border-slate-400 text-teal-600 focus:ring-0"
                  />
                  <span className="text-slate-700 dark:text-slate-300 leading-snug">
                    Lançar automaticamente como <strong>despesa operacional</strong> no Fluxo de Caixa
                  </span>
                </label>
                {autoRegisterExpense && (
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono pl-5 font-bold">
                    Custo total da reposição:{' '}
                    <span>
                      {formatBRL(
                        (parseInt(restockAmount, 10) || 0) * selectedProductForRestock.costPrice
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForRestock(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-black text-white shadow-xs"
                >
                  Confirmar Reposição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Produto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Cadastrar Novo Produto
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adicione item ao cardápio da barraca de futebol
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Espetinho de Linguiça Campeira"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="comidas">Comidas &amp; Espetos</option>
                    <option value="bebidas_alcoolicas">Cervejas Geladas</option>
                    <option value="bebidas">Refrigerantes &amp; Águas</option>
                    <option value="petiscos_doces">Petiscos &amp; Porções</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unidade de Medida
                  </label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="lata, un, espeto, copo"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="5.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    placeholder="12.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 font-mono font-black focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    required
                    value={newStockQuantity}
                    onChange={(e) => setNewStockQuantity(e.target.value)}
                    placeholder="24"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Alerta de Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    required
                    value={newMinThreshold}
                    onChange={(e) => setNewMinThreshold(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Acompanha molho barbecue e farofa..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-xs"
                >
                  Cadastrar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
