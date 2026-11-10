import React from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Smartphone, 
  Volume2, 
  Info,
  CheckCheck,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerBrowserPushNotification, playNotificationSound } from '../utils/messaging';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    addNotification 
  } = useApp();

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta a API de notificações push nativas.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      addNotification(
        '🔔 Notificações Push Ativadas!',
        'Você agora receberá alertas instantâneos de cobranças e estoque no balcão.',
        'sistema'
      );
    }
  };

  const handleTestNotification = () => {
    playNotificationSound('push');
    triggerBrowserPushNotification(
      '⚽ Arena Gol: Alerta de Cobrança',
      'Cobrança PIX disparada com sucesso para Betão do Camisa 10 (R$ 98,00).'
    );
    addNotification(
      '⚽ Teste de Notificação Push',
      'Disparo de cobrança e alerta sonoro emitidos com sucesso!',
      'cobranca'
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'cobranca':
        return <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'estoque':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'pix':
        return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                Notificações &amp; Cobranças
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Histórico em tempo real de disparos e alertas da barraca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestPushPermission}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Permitir Push
            </button>
            <button
              type="button"
              onClick={handleTestNotification}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Alerta Sonoro
            </button>
          </div>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar lidas
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Nenhuma notificação recente.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
                    : 'bg-white dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">{getIconForType(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Push integrado com Web Notifications API &amp; Web Audio Chimes
          </span>
        </div>
      </div>
    </div>
  );
};

