import React, { useState } from 'react';
import { Shield, ShieldAlert, Bell, Lock, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPinModal } from './AdminPinModal';
import { NotificationCenter } from './NotificationCenter';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isAdmin, 
    lockAdmin, 
    unreadNotificationCount 
  } = useApp();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [targetTabPending, setTargetTabPending] = useState<'cashflow' | 'reports' | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleNavClick = (tab: 'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports') => {
    if ((tab === 'cashflow' || tab === 'reports') && !isAdmin) {
      setTargetTabPending(tab);
      setIsPinModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      lockAdmin();
    } else {
      setTargetTabPending(null);
      setIsPinModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single element brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/30">
              <span className="text-base select-none">⚽</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white leading-tight">
                Arena Gol
              </span>
              <span className="text-[10px] font-medium text-emerald-400/90 tracking-wide uppercase">
                Barraca Oficial
              </span>
            </div>
          </div>

          {/* Zone 2: 4–5 single-line clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleNavClick('pos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              Vendas (PDV)
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('inventory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              Estoque
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('customers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'customers'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              Clientes &amp; Fiado
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('cashflow')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'cashflow'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              Fluxo de Caixa
              {!isAdmin && <Lock className="w-3 h-3 text-slate-500" />}
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              Relatórios Mensais
              {!isAdmin && <Lock className="w-3 h-3 text-slate-500" />}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action block */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Notification trigger button */}
            <button
              type="button"
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              title="Notificações e Disparos"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              )}
            </button>

            {/* Admin Toggle button */}
            <button
              type="button"
              onClick={handleAdminToggle}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-2 border ${
                isAdmin
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800/90 text-slate-200 border-slate-800'
              }`}
            >
              {isAdmin ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Ativo</span>
                  <span className="text-[10px] text-slate-400 hover:text-white">✕ Sair</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Área Admin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-900 px-3 py-2 bg-slate-950 overflow-x-auto text-xs font-medium gap-1">
          <button
            onClick={() => handleNavClick('pos')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'pos' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vendas
          </button>
          <button
            onClick={() => handleNavClick('inventory')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'inventory' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Estoque
          </button>
          <button
            onClick={() => handleNavClick('customers')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'customers' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => handleNavClick('cashflow')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'cashflow' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Caixa
            {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-500" />}
          </button>
          <button
            onClick={() => handleNavClick('reports')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Relatórios
            {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Admin PIN Entry Modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setTargetTabPending(null);
        }}
        onSuccess={() => {
          if (targetTabPending) {
            setActiveTab(targetTabPending);
          }
        }}
        targetFeatureName={
          targetTabPending === 'cashflow'
            ? 'o Fluxo de Caixa, Despesas e Lucro'
            : targetTabPending === 'reports'
            ? 'os Relatórios de Vendas e Inadimplência'
            : 'as funções do Administrador'
        }
      />

      {/* Notification Drawer */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  );
};
