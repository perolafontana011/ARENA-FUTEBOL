import React, { useState } from 'react';
import { Shield, Bell, Lock, Sun, Moon, Database, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminPinModal } from './AdminPinModal';
import { NotificationCenter } from './NotificationCenter';
import { DatabaseStatusModal } from './DatabaseStatusModal';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isAdmin, 
    lockAdmin, 
    unreadNotificationCount,
    theme,
    toggleTheme,
    isFirestoreConnected,
    firestoreSyncStatus
  } = useApp();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [targetTabPending, setTargetTabPending] = useState<'cashflow' | 'reports' | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleNavClick = (tab: 'pos' | 'customers' | 'cashflow' | 'inventory' | 'reports') => {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single element brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/20">
              <span className="text-lg select-none">⚽</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  Arena Gol
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase font-mono border border-emerald-300 dark:border-emerald-800">
                  Painel do Dono
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDbModalOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer text-left"
                title="Ver detalhes do banco de dados em tempo real"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] uppercase">
                  {isFirestoreConnected ? 'Banco Firestore Ativo' : 'Modo Offline Ativo'}
                </span>
              </button>
            </div>
          </div>

          {/* Zone 2: Single-line clean text navigation links */}
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
              Estoque &amp; Custos
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'cashflow'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Controle de Caixa
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Relatórios Mensais
            </button>
          </nav>

          {/* Zone 3: Primary Action block */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Database indicator pill */}
            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all shadow-2xs group"
              title="Clique para inspecionar o status do Banco de Dados Firestore"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Firestore</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notification trigger button */}
            <button
              type="button"
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
              title="Notificações e Cobranças"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Owner badge button with optional screen lock */}
            <button
              type="button"
              onClick={handleAdminToggle}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 border cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border-amber-300'
              }`}
              title={isAdmin ? 'Painel do Dono Ativo (Clique para trancar a tela se sair)' : 'Destrancar tela'}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAdmin ? 'Proprietário' : 'Destrancar'}</span>
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
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'cashflow' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Caixa
          </button>
          <button
            onClick={() => handleNavClick('reports')}
            className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Relatórios
          </button>
        </div>
      </header>

      {/* Admin PIN Entry Modal (Disponível caso o dono decida trancar a tela temporariamente) */}
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
        targetFeatureName="o Painel do Proprietário"
      />

      {/* Notification Drawer */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Database Status Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </>
  );
};
