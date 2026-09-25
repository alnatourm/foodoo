import React, { useState } from 'react';
import { ShieldCheck, X, ArrowRight, Lock, Mail } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface ProviderLoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const ProviderLoginModal: React.FC<ProviderLoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const { language } = useLanguage();
  const { login } = useAuth();
  const isAr = language === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // First check system authentication endpoint
      try {
        const res = await apiFetch('/api/tenants/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (res && res.success) {
          onLoginSuccess();
          onClose();
          return;
        }
      } catch (apiErr) {
        // Fallback to Firebase auth
      }

      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Provider auth error:', err);

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError(
          isAr
            ? 'بيانات الاعتماد غير صالحة. يرجى التأكد من البريد وكلمة المرور.'
            : 'Invalid credentials. Please check your admin username and password.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          isAr
            ? 'خطأ: تسجيل الدخول بالبريد الإلكتروني غير مفعل في Firebase Console.'
            : 'Firebase Error: Email/Password login is not enabled in your project settings.'
        );
      } else {
        setError(isAr ? 'اسم المستخدم أو كلمة المرور غير صحيحة.' : 'Invalid username or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-purple-500/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-slate-100">
              {isAr ? 'تسجيل دخول مزود الخدمة (الإدارة)' : 'SaaS Provider Admin Login'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div
              className={`p-4 rounded-xl text-xs font-medium text-center border animate-in slide-in-from-top-2 ${
                error.includes('Firebase Console')
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {isAr ? 'البريد الإلكتروني للإدارة' : 'Admin Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    placeholder="admin@resto-os.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {isAr ? 'كلمة المرور' : 'Master Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-purple-900/20"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isAr ? 'دخول المسؤول' : 'Provider Email Login'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
            {isAr ? 'مخول فقط لموظفي Resto-OS' : 'Authorized Resto-OS Personnel Only'}
          </p>
        </div>
      </div>
    </div>
  );
};
