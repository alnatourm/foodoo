import React, { useState } from 'react';
import { ShieldCheck, X, ArrowRight, Lock, Mail } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ProviderLoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const ProviderLoginModal: React.FC<ProviderLoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  
  const [email, setEmail] = useState('superadmin@resto-os.com');
  const [password, setPassword] = useState('superpassword');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 800);
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

        <form onSubmit={handleLogin} className="p-6 space-y-5">
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
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isAr ? 'الدخول كمسؤول' : 'Login as Provider'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
            {isAr ? 'مخول فقط لموظفي Resto-OS' : 'Authorized Resto-OS Personnel Only'}
          </p>
        </div>
      </div>
    </div>
  );
};
