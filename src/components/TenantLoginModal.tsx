import React, { useState } from 'react';
import { Building2, X, ArrowRight, Lock, Mail, User, Phone, Store, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { StaffUser, Tenant } from '../types/restaurant';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface TenantLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: StaffUser) => void;
  onTenantCreated?: (tenant: Tenant) => void;
  initialMode?: 'login' | 'register';
}

export const TenantLoginModal: React.FC<TenantLoginModalProps> = ({
  onClose,
  onLoginSuccess,
  onTenantCreated,
  initialMode = 'login',
}) => {
  const { language } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration form state
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPin, setRegisterPin] = useState('1111');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [plan, setPlan] = useState<'SINGLE_RESTAURANT' | 'MULTI_RESTAURANT'>('SINGLE_RESTAURANT');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Handle Tenant Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      // First try restaurant database authentication
      const res = await apiFetch('/api/tenants/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res && res.success) {
        if (res.tenant && res.tenant.id) {
          localStorage.setItem('activeTenantId', res.tenant.id);
        }
        onLoginSuccess(res.user || ({} as StaffUser));
        onClose();
        return;
      }
    } catch (apiErr: any) {
      // Fallback to Firebase auth if requested
      try {
        await login(email, password);
        onLoginSuccess({} as StaffUser);
        onClose();
        return;
      } catch (err: any) {
        console.error('Login error:', err);
        setError(
          isAr
            ? 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور/الرمز.'
            : apiErr.message || 'Login failed. Please check your credentials.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login / Auto-Registration check
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const googleUser = await loginWithGoogle();
      const userEmail = googleUser?.user?.email;
      const userName = googleUser?.user?.displayName || '';

      // Check if user already belongs to a tenant
      if (userEmail) {
        try {
          const tenants: Tenant[] = await apiFetch('/api/tenants');
          const matchedTenant = tenants.find(
            (t) => t.ownerEmail?.toLowerCase() === userEmail.toLowerCase()
          );

          if (matchedTenant) {
            localStorage.setItem('activeTenantId', matchedTenant.id);
            onLoginSuccess({
              id: `owner-${matchedTenant.id}`,
              tenantId: matchedTenant.id,
              name: matchedTenant.ownerName || userName || 'Restaurant Owner',
              email: matchedTenant.ownerEmail,
              role: 'OWNER',
              pinCode: '1111',
              isActive: true,
              createdAt: new Date().toISOString(),
            });
            onClose();
            return;
          }
        } catch (fetchErr) {
          console.error('Tenant lookup error:', fetchErr);
        }

        // If no matching tenant found, switch to register mode prefilled with Google info!
        setRegisterEmail(userEmail);
        if (userName) setOwnerName(userName);
        if (!restaurantName) {
          setRestaurantName(userName ? `${userName} Bistro` : '');
        }
        setMode('register');
        setInfoMessage(
          isAr
            ? 'مرحباً بك! لا يوجد مطعم مسجل بهذا البريد. يرجى كتابة اسم مطعمك الجديد وتحديد الخطة لإنشاء حسابك والخروج من لوحة العرض:'
            : 'Welcome! No restaurant account was found for this email. Please enter your new restaurant name and select a plan to create your account:'
        );
      } else {
        setError(
          isAr
            ? 'تعذر جلب البريد الإلكتروني من حساب جوجل. يرجى المحاولة مرة أخرى.'
            : 'Could not retrieve email from Google account. Please try again.'
        );
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(isAr ? 'فشل تسجيل الدخول عبر جوجل.' : 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle New Restaurant Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) {
      setError(isAr ? 'يرجى إدخال اسم المطعم' : 'Please enter restaurant name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const createdTenant = await apiFetch('/api/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: restaurantName,
          country: 'Saudi Arabia',
          currency: 'SAR',
          taxRatePct: 15,
          branchName: `${restaurantName} - الفرع الرئيسي`,
          plan,
          billingCycle: 'YEARLY',
          ownerName: ownerName || `${restaurantName} Owner`,
          ownerEmail: registerEmail || `owner@${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
          ownerPhone: ownerPhone || '+966 50 123 4567',
          ownerPin: registerPin || '1111',
          subscriptionStatus: 'ACTIVE',
          paymentStatus: 'PAID',
        }),
      });

      if (createdTenant && createdTenant.id) {
        localStorage.setItem('activeTenantId', createdTenant.id);
        if (onTenantCreated) {
          onTenantCreated(createdTenant);
        }

        const ownerUser: StaffUser = {
          id: `owner-${createdTenant.id}`,
          tenantId: createdTenant.id,
          name: createdTenant.ownerName || ownerName || 'Restaurant Owner',
          email: createdTenant.ownerEmail || registerEmail,
          role: 'OWNER',
          pinCode: registerPin || '1111',
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        onLoginSuccess(ownerUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Tenant creation error:', err);
      setError(
        isAr
          ? 'فشل إنشاء حساب المطعم. يرجى المحاولة مرة أخرى.'
          : err.message || 'Failed to create restaurant account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-800">
              {mode === 'login'
                ? isAr
                  ? 'تسجيل دخول المطعم'
                  : 'Restaurant Login'
                : isAr
                ? 'إنشاء حساب مطعم جديد'
                : 'Create Restaurant Account'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-100">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setInfoMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setInfoMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'إنشاء حساب جديد' : 'Register Restaurant'}</span>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {infoMessage && (
            <div className="p-3.5 rounded-xl text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700 animate-in slide-in-from-top-2">
              {infoMessage}
            </div>
          )}

          {error && (
            <div
              className={`p-4 rounded-xl text-xs font-medium text-center border animate-in slide-in-from-top-2 ${
                error.includes('Firebase Console')
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-red-50 border-red-100 text-red-600'
              }`}
            >
              {error}
            </div>
          )}

          {/* Quick Google Sign In / Registration */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            <span>
              {mode === 'login'
                ? isAr
                  ? 'الدخول السريع عبر جوجل (موصى به)'
                  : 'Quick Login with Google'
                : isAr
                ? 'التسجيل السريع عبر جوجل'
                : 'Quick Register with Google'}
            </span>
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">
                {isAr ? 'أو أدخل البيانات' : 'OR FILL DETAILS'}
              </span>
            </div>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'البريد الإلكتروني للمالك' : 'Owner Email Address'}
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
                      placeholder="owner@restaurant.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'كلمة المرور / הرمز' : 'Password / PIN'}
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
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-70 shadow"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isAr ? 'تسجيل دخول المالك' : 'Restaurant Owner Login'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'اسم المطعم / العلامة التجارية *' : 'Restaurant Name *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-semibold"
                    placeholder={isAr ? 'مثال: مطعم شاورما البركة' : 'e.g. Damascus Grill'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'اسم المالك' : 'Owner Name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder={isAr ? 'طارق منصور' : 'Tariq Mansoor'}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'رمز الدخول (4 أرقام)' : 'PIN Code (4 digits)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      value={registerPin}
                      onChange={(e) => setRegisterPin(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'البريد الإلكتروني للحساب' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="owner@restaurant.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'خطة الاشتراك' : 'Subscription Plan'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlan('SINGLE_RESTAURANT')}
                    className={`p-2.5 rounded-xl border text-left flex items-start justify-between transition ${
                      plan === 'SINGLE_RESTAURANT'
                        ? 'border-amber-500 bg-amber-50 text-slate-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{isAr ? 'مطعم واحد' : 'Single Bistro'}</div>
                      <div className="text-[10px] text-slate-500">$79 / {isAr ? 'شهر' : 'mo'}</div>
                    </div>
                    {plan === 'SINGLE_RESTAURANT' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlan('MULTI_RESTAURANT')}
                    className={`p-2.5 rounded-xl border text-left flex items-start justify-between transition ${
                      plan === 'MULTI_RESTAURANT'
                        ? 'border-amber-500 bg-amber-50 text-slate-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{isAr ? 'سلسلة فروع' : 'Multi-Branch'}</div>
                      <div className="text-[10px] text-slate-500">$199 / {isAr ? 'شهر' : 'mo'}</div>
                    </div>
                    {plan === 'MULTI_RESTAURANT' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-amber-500/20"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isAr ? 'إنشاء حساب المطعم والبدء فوراً' : 'Create Restaurant Account & Launch'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle Switch Prompt at Bottom */}
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setInfoMessage(null);
                }}
                className="text-xs text-slate-600 hover:text-amber-600 font-semibold underline"
              >
                {isAr
                  ? 'ليس لديك حساب مطعم بعد؟ أنشئ حسابك الآن'
                  : "Don't have a restaurant account? Register now"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setInfoMessage(null);
                }}
                className="text-xs text-slate-600 hover:text-amber-600 font-semibold underline"
              >
                {isAr
                  ? 'لديك حساب مطعم بالفعل؟ تسجيل الدخول'
                  : 'Already have a restaurant account? Sign In'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            {isAr
              ? 'هذه البوابة مخصصة لملاك ومدراء المطاعم لاستخدام نظام التشغيل.'
              : 'This portal is for restaurant owners and managers.'}
          </p>
        </div>
      </div>
    </div>
  );
};
