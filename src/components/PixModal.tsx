import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Copy, QrCode, Smartphone, Sparkles, Building2, Check, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generatePixCopiaECola, generatePixQrCodeDataUrl, formatBRL } from '../utils/pix';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  description?: string;
  showPayerFields?: boolean;
  onPaymentConfirmed?: (payerInfo?: { name: string; phone: string }) => void;
}

export const PixModal: React.FC<PixModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerName,
  customerPhone,
  description = 'Consumo Barraca do Campeonato',
  showPayerFields = false,
  onPaymentConfirmed,
}) => {
  const { pixConfig } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiaECola, setCopiaECola] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [payerName, setPayerName] = useState<string>(customerName || '');
  const [payerPhone, setPayerPhone] = useState<string>(customerPhone || '');

  useEffect(() => {
    if (isOpen) {
      setPayerName(customerName || '');
      setPayerPhone(customerPhone || '');
    }
  }, [isOpen, customerName, customerPhone]);

  useEffect(() => {
    if (isOpen && amount > 0) {
      const txid = `GOL${Date.now().toString(36).toUpperCase()}`;
      const payload = generatePixCopiaECola(pixConfig, amount, txid, description);
      setCopiaECola(payload);

      generatePixQrCodeDataUrl(payload).then((url) => {
        setQrCodeUrl(url);
      });
      setCopied(false);
      setIsConfirming(false);
    }
  }, [isOpen, amount, pixConfig, description]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (copiaECola) {
      navigator.clipboard.writeText(copiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleConfirmPayment = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      if (onPaymentConfirmed) {
        onPaymentConfirmed({ name: payerName, phone: payerPhone });
      }
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 relative max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PIX Official Style Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 font-mono">
                PIX BACEN
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Quitação Instantânea</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {customerName ? `Quitação de Comanda: ${payerName || customerName}` : 'Pagamento no Balcão'}
            </h3>
          </div>
        </div>

        {/* Payer Name & Phone Fields for Fiado Settlement */}
        {showPayerFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Nome da Pessoa *
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Nome completo"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Número / WhatsApp *
              </label>
              <input
                type="tel"
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                placeholder="Ex: 11987654321"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        )}

        {/* Amount Box */}
        <div className="bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 text-center mb-5 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">
            Valor Total do Recebimento
          </span>
          <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
            {formatBRL(amount)}
          </span>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-slate-700 dark:text-slate-300 font-bold">{pixConfig.merchantName}</span>
            <span>·</span>
            <span className="text-slate-500 dark:text-slate-400">{pixConfig.merchantCity}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center mb-5">
          <div className="bg-white p-4 rounded-3xl shadow-md border-2 border-slate-200 dark:border-teal-500/30 max-w-[270px] transition-transform hover:scale-[1.02]">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code PIX"
                className="w-56 h-56 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs font-mono">
                Gerando código PIX...
              </div>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 flex items-center gap-1.5 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Abra o app do seu banco e aponte a câmera
          </span>
        </div>

        {/* Copia e Cola Section */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Código PIX Copia e Cola
            </span>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono font-medium">
              Chave: {pixConfig.key}
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={copiaECola}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-300 font-mono pr-24 truncate select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`absolute right-1 top-1 bottom-1 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-xs active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/3 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center cursor-pointer"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-xs font-black text-white transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            {isConfirming ? 'Baixando no Caixa...' : 'Confirmar Pagamento PIX'}
          </button>
        </div>
      </div>
    </div>
  );
};
