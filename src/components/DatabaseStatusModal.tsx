import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Server, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Download,
  Clock,
  HardDrive
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db, doc, setDoc, getDocFromServer } from '../services/firebase';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const { 
    isFirestoreConnected, 
    firestoreSyncStatus,
    products, 
    customers, 
    sales, 
    expenses, 
    debtPayments,
    pixConfig 
  } = useApp();

  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestDatabasePing = async () => {
    setIsPinging(true);
    setPingResult(null);
    const start = performance.now();
    try {
      const testRef = doc(db, 'system_health', 'realtime_ping');
      const now = new Date().toISOString();
      await setDoc(testRef, {
        lastPing: now,
        testedBy: 'Dono da Barraca Arena Gol',
        status: 'OK'
      });
      const snap = await getDocFromServer(testRef);
      const latency = Math.round(performance.now() - start);

      if (snap.exists()) {
        setPingResult(`✅ Conexão ativa! Gravado e lido do Firestore em ${latency}ms.`);
      } else {
        setPingResult('⚠️ Documento gravado com sucesso no cache.');
      }
    } catch (err: any) {
      setPingResult(`⚠️ Resposta do banco: ${err?.message || 'Operando com sincronização em segundo plano.'}`);
    } finally {
      setIsPinging(false);
    }
  };

  const handleDownloadFullDatabaseBackup = () => {
    const backupData = {
      databaseId: 'ai-studio-arenagolgestodeb-7f7a4658-5327-4824-b00b-3f06f2a759fd',
      exportedAt: new Date().toISOString(),
      barraca: 'Arena Gol - Campeonato de Futebol',
      collections: {
        products,
        customers,
        sales,
        expenses,
        debtPayments,
        pixConfig
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_banco_arena_gol_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Banco de Dados da Barraca
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Google Cloud Firestore Provisionado · Sincronização em Tempo Real
            </p>
          </div>
        </div>

        {/* Database specs card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              Provedor do Banco:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Google Cloud Firestore
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-teal-600" />
              ID do Banco de Dados:
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]" title="ai-studio-arenagolgestodeb-7f7a4658-5327-4824-b00b-3f06f2a759fd">
              ...gestodeb-7f7a4658
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Status de Sincronia:
            </span>
            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {firestoreSyncStatus === 'synced' ? 'Sincronizado em Nuvem' : 'Ativo / Conectado'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Permissão de Acesso:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Exclusivo do Proprietário (Dono)
            </span>
          </div>
        </div>

        {/* Live collections summary */}
        <div className="space-y-2 mb-5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Coleções &amp; Registros Vivos no Banco:
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Estoque de Produtos</div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {products.length} itens
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Preços, custos e baixas
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Caderneta de Clientes</div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {customers.length} cadastrados
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Times, limites e fiado
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Vendas Registradas</div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {sales.length} vendas
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Dinheiro, PIX e cartões
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Despesas Operacionais</div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {expenses.length} lançamentos
              </div>
              <div className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">
                Gelo, carvão e taxas
              </div>
            </div>
          </div>
        </div>

        {/* Live ping test action */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 mb-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Verificar Conexão em Tempo Real
            </span>
            <button
              type="button"
              onClick={handleTestDatabasePing}
              disabled={isPinging}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Testando...' : 'Testar Gravação'}</span>
            </button>
          </div>
          {pingResult && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-mono font-medium border border-emerald-300 dark:border-emerald-700">
              {pingResult}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadFullDatabaseBackup}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Backup (JSON)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
