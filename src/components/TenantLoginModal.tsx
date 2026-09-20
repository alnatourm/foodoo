import React, { useState } from 'react';
import { Building2, X, ArrowRight, Lock, Mail } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { StaffUser } from '../types/restaurant';
import { useAuth } from '../context/AuthContext';

interface TenantLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: StaffUser) => void;
}

export const TenantLoginModal: React.FC<TenantLoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const { language } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  const isAr = language === 'ar';
  
  const [email, setEmail] = useState('admin@resto.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      onLoginSuccess({} as StaffUser); 
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(isAr 
          ? 'خطأ: تسجيل الدخول بالبريد الإلكتروني غير مفعل. يرجى الذهاب إلى Firebase Console > Authentication > Sign-in method وتفعيل "Email/Password". أو استخدم جوجل.' 
          : 'Firebase Error: Email/Password login is not enabled in your project. Go to Firebase Console > Authentication > Sign-in method and enable "Email/Password". Alternatively, use Google Login below.');
      } else {
        setError(isAr ? 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.' : 'Login failed. Please check your credentials.');
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
      onLoginSuccess({} as StaffUser);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(isAr ? 'فشل تسجيل الدخول عبر جوجل.' : 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-800">
              {isAr ? 'تسجيل دخول المطعم' : 'Restaurant Login'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className={`p-4 rounded-xl text-xs font-medium text-center border animate-in slide-in-from-top-2 ${
              error.includes('Firebase Console') 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : 'bg-red-50 border-red-100 text-red-600'
            }`}>
              {error}
            </div>
          )}

          {/* Primary Recommended Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            <span>{isAr ? 'الدخول السريع عبر جوجل (موصى به)' : 'Quick Login with Google (Recommended)'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">{isAr ? 'أو عبر البريد' : 'OR VIA EMAIL'}</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    placeholder="admin@restaurant.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isAr ? 'تسجيل دخول المالك' : 'Restaurant Owner Login'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            {isAr ? 'هذه البوابة مخصصة لملاك ومدراء المطاعم.' : 'This portal is for restaurant owners and managers.'}
          </p>
        </div>
      </div>
    </div>
  );
};
