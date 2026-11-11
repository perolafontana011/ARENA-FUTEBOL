import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { CashFlowView } from './components/CashFlowView';
import { ReportsView } from './components/ReportsView';
import { RotateCcw, ShieldCheck, Flame, Trophy, Volume2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, isAdmin, lockAdmin, resetToMockData } = useApp();

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200 font-sans transition-colors duration-200">
      {/* Top Matchday Operational Strip */}
      <div className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 py-2 px-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider font-mono">
              BARRACA OFICIAL
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">Copa dos Campeões Varzeana 2026</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">Estádio Municipal · Portão Principal</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Painel Exclusivo do Proprietário · Acesso Total</span>
            </span>
          </div>
        </div>
      </div>

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'pos' && <POSView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'customers' && <CustomersView />}
        {activeTab === 'cashflow' && <CashFlowView />}
        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Arena Gol ⚽ Gestão Completa de Barraca</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>Vendas de Balcão, Estoque em Tempo Real, Fiado &amp; PIX</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja restaurar todos os produtos com fotos reais e dados de demonstração da barraca?')) {
                  resetToMockData();
                }
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              title="Restaurar dados padrão com fotos reais"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Dados e Fotos Demo</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
