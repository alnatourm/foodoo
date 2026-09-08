import React, { useState } from 'react';
import { Lock, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface VoidPasswordModalProps {
  tenantId: string;
  itemName?: string;
  itemQuantity?: number;
  reason?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const VoidPasswordModal: React.FC<VoidPasswordModalProps> = ({
  tenantId,
  itemName,
  itemQuantity,
  reason,
  onConfirm,
  onClose,
}) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError(t('void.enterPassword', 'Please enter void authorization password'));
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/verify-void-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        onConfirm();
      } else {
        setError(data.error || t('void.invalidPassword', 'Invalid password. Default is 1234 or Manager PIN.'));
      }
    } catch (err) {
      // Fallback check if offline or network glitch
      if (password.trim() === '1234' || password.trim() === '1111' || password.trim() === '2222') {
        onConfirm();
      } else {
        setError(t('void.invalidPassword', 'Invalid void password. Default is 1234'));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPassword('');
      setError(null);
    } else if (val === 'BACK') {
      setPassword((prev) => prev.slice(0, -1));
    } else {
      if (password.length < 8) {
        setPassword((prev) => prev + val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {t('void.securityCheck', 'Manager Void Authorization')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('void.protectedAction', 'Protected action requires manager password')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Target Item summary */}
          {itemName && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between font-semibold text-slate-300">
                <span>{t('void.voidTarget', 'Item to Void')}:</span>
                <span className="text-rose-400 font-bold">
                  {itemQuantity ? `${itemQuantity}x ` : ''}{itemName}
                </span>
              </div>
              {reason && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>{t('void.reason', 'Reason')}:</span>
                  <span className="italic">{reason}</span>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('void.enterPasscode', 'Void Password / Manager PIN')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl tracking-widest font-mono text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                {t('void.defaultHint', 'Default system void password: 1234 (or Manager PIN: 2222)')}
              </p>
            </div>

            {/* Quick Touch Keypad for POS Touchscreens */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => {
                    if (k === 'C') handleKeypadPress('CLEAR');
                    else if (k === '⌫') handleKeypadPress('BACK');
                    else handleKeypadPress(k);
                  }}
                  className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-rose-500/20 active:text-rose-300 font-bold text-sm text-slate-200 border border-slate-700/50 transition flex items-center justify-center select-none"
                >
                  {k}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <span>{t('void.verifying', 'Verifying...')}</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('void.authorize', 'Authorize Void')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
