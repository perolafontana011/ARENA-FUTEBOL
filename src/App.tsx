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
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 font-sans">
      {/* Top Matchday Operational Strip */}
      <div className="bg-slate-950/90 border-b border-slate-900 py-1.5 px-4 text-[11px] text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SISTEMA DA BARRACA
            </span>
            <span>·</span>
            <span className="text-slate-300">Copa dos Campeões 2026</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline text-slate-400">Final da Rodada no Estádio Municipal</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className={`flex items-center gap-1 font-semibold ${isAdmin ? 'text-emerald-400' : 'text-slate-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAdmin ? 'Modo Administrador (Acesso Total)' : 'Modo Balcão (Apenas Vendas)'}
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
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Arena Gol ⚽ Gestão Completa de Barraca</span>
            <span>·</span>
            <span>Vendas, Estoque em Tempo Real, Fiado &amp; PIX</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja restaurar todos os produtos com fotos reais e dados de demonstração da barraca?')) {
                  resetToMockData();
                }
              }}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
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
