import React, { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetFeatureName?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetFeatureName = 'esta área restrita do Administrador',
}) => {
  const { unlockAdmin, adminPin } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg('');
      if (nextPin.length === adminPin.length) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (code: string) => {
    const success = unlockAdmin(code);
    if (success) {
      setPinInput('');
      setErrorMsg('');
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg('Senha incorreta. Tente novamente.');
      setPinInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPin(pinInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Acesso Restrito ao Administrador
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
            Digite o PIN de 4 dígitos para visualizar {targetFeatureName}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PIN display dots */}
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                    isFilled
                      ? 'bg-emerald-400 border-emerald-300 scale-110 shadow-sm shadow-emerald-500/50'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 text-center font-medium animate-shake">
              {errorMsg}
            </p>
          )}

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleDigit(n)}
                className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-lg font-semibold text-white transition-colors border border-slate-700/60 active:scale-95 flex items-center justify-center"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPinInput('')}
              className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-400 transition-colors border border-slate-800 flex items-center justify-center"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-lg font-semibold text-white transition-colors border border-slate-700/60 active:scale-95 flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-400 transition-colors border border-slate-800 flex items-center justify-center"
            >
              ⌫
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Senha padrão de demonstração: <strong className="text-emerald-400">1234</strong>
            </span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/40"
            >
              <ShieldCheck className="w-4 h-4" />
              Liberar Painel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
