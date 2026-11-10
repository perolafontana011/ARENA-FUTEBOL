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
  const { activeTab, isAdmin, resetToMockData } = useApp();

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200 font-sans transition-colors duration-200">
      {/* Top Matchday Operational Strip */}
      <div className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 py-1.5 px-4 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-[10px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SISTEMA DA BARRACA
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">Copa dos Campeões 2026</span>
            <span className="hidden md:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">Final da Rodada no Estádio Municipal</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className={`flex items-center gap-1.5 font-bold ${isAdmin ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAdmin ? 'Modo Administrador (Acesso Total Liberado)' : 'Modo Operador de Balcão (Apenas Vendas)'}
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
