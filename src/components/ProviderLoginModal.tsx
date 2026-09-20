import React, { useState } from 'react';
import { ShieldCheck, X, ArrowRight, Lock, Mail, UserPlus } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { apiFetch } from '../lib/api';

interface ProviderLoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const ProviderLoginModal: React.FC<ProviderLoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const { language } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  const isAr = language === 'ar';
  
  const [email, setEmail] = useState('superadmin@resto-os.com');
  const [password, setPassword] = useState('superpassword');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isRegisterMode) {
        await createUserWithEmailAndPassword(auth, email, password);
        onLoginSuccess();
        return;
      }

      // First check local system authentication endpoint
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
        setError(isAr 
          ? 'بيانات الاعتماد غير صالحة. يمكنك التسجيل أولاً أو استخدام بريد المالك.' 
          : 'Invalid credentials. You can register an account or use your registered owner email.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(isAr 
          ? 'خطأ: تسجيل الدخول بالبريد الإلكتروني غير مفعل في Firebase Console.' 
          : 'Firebase Error: Email/Password login is not enabled in your project settings.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError(isAr ? 'البريد الإلكتروني مستخدم بالفعل.' : 'Email is already in use.');
      } else {
        setError(err.message || (isAr ? 'فشل العملية.' : 'Operation failed.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(isAr ? 'فشل تسجيل الدخول عبر جوجل.' : 'Google login failed.');
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
              {isAr ? 'تسجيل دخول مزود الخدمة' : 'SaaS Provider Login'}
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
            <div className={`p-4 rounded-xl text-xs font-medium text-center border animate-in slide-in-from-top-2 ${
              error.includes('Firebase Console') 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {error}
            </div>
          )}

          {/* Primary Recommended Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-white border border-slate-700 hover:bg-slate-800 text-slate-900 hover:text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-white/5"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            <span>{isAr ? 'الدخول السريع عبر جوجل (موصى به)' : 'Quick Login with Google (Recommended)'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">{isAr ? 'أو عبر البريد' : 'OR VIA EMAIL'}</span>
            </div>
          </div>

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
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-70 ${
                isRegisterMode 
                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30'
                  : 'bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30'
              }`}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegisterMode ? (
                    <>
                      <span>{isAr ? 'إنشاء حساب المسؤول' : 'Create Admin Account'}</span>
                      <UserPlus className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>{isAr ? 'دخول المسؤول' : 'Provider Email Login'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="w-full text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-tight"
            >
              {isRegisterMode 
                ? (isAr ? 'لديك حساب بالفعل؟ سجل الدخول' : 'Already have an account? Sign In')
                : (isAr ? 'ليس لديك حساب؟ أنشئ حساب مسؤول جديد' : 'No account? Create a new admin account')}
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
