import React, { useState } from 'react';
import { Shield, ShieldAlert, Bell, Lock, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPinModal } from './AdminPinModal';
import { NotificationCenter } from './NotificationCenter';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isAdmin, 
    lockAdmin, 
    unreadNotificationCount,
    theme,
    toggleTheme
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
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single element brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/20">
              <span className="text-lg select-none">⚽</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Arena Gol
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase font-mono">
                Barraca Oficial
              </span>
            </div>
          </div>

          {/* Zone 2: 4–5 single-line clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleNavClick('pos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'pos'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vendas (PDV)
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('inventory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Estoque
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('customers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'customers'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Clientes &amp; Fiado
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('cashflow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'cashflow'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Controle de Caixa</span>
              {!isAdmin && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                  <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  Dono
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Relatórios Mensais</span>
              {!isAdmin && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                  <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  Dono
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action block */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notification trigger button */}
            <button
              type="button"
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:border-slate-700"
              title="Notificações e Disparos"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Admin Toggle button */}
            <button
              type="button"
              onClick={handleAdminToggle}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 border cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 shadow-xs group'
                  : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/50 shadow-xs'
              }`}
              title={
                isAdmin
                  ? 'Clique para bloquear o controle financeiro do Dono e voltar ao balcão'
                  : 'Acesso exclusivo do Dono: Controle de Caixa, Custos, Lucros e Relatórios (PIN: 1234)'
              }
            >
              {isAdmin ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-rose-500" />
                  <span>Dono Conectado</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-rose-600 font-semibold">(Bloquear)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Acesso Dono (PIN)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50 dark:bg-slate-950 overflow-x-auto text-xs font-medium gap-1">
          <button
            onClick={() => handleNavClick('pos')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'pos' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Vendas
          </button>
          <button
            onClick={() => handleNavClick('inventory')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'inventory' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Estoque
          </button>
          <button
            onClick={() => handleNavClick('customers')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'customers' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => handleNavClick('cashflow')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'cashflow' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Caixa
            {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
          </button>
          <button
            onClick={() => handleNavClick('reports')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Relatórios
            {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
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
