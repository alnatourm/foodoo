import React, { useState } from 'react';
import {
  Clock,
  Building2,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  PhoneCall,
  Mail,
  Store,
  Sparkles,
} from 'lucide-react';
import { Tenant } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface PendingApprovalViewProps {
  tenant: Tenant;
  onRefreshStatus: () => Promise<void>;
  onLogout: () => void;
  onOpenSaaSAdmin: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  tenant,
  onRefreshStatus,
  onLogout,
  onOpenSaaSAdmin,
}) => {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      await onRefreshStatus();
      setRefreshMessage(
        isAr
          ? 'تم تحديث حالة الاشتراك. إذا تم اعتمادك من المسؤول ستتمكن من الدخول فوراً.'
          : 'Subscription status refreshed. If approved by admin, you will gain full access immediately.'
      );
    } catch (e) {
      console.error(e);
      setRefreshMessage(
        isAr
          ? 'تعذر الاتصال بالخادم للتحديث. يرجى المحاولة لاحقاً.'
          : 'Unable to connect to server. Please try again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Header Icon & Title */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left rtl:sm:text-right border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {isAr ? 'حساب المطعم بانتظار موافقة مدير النظام' : 'Account Pending SaaS Admin Approval'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {isAr ? 'قيد المراجعة' : 'Pending Review'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isAr
                ? 'تم تسجيل بيانات مطعمك بنجاح وسجل الاشتراك في مرحلة التدقيق والاعتماد النهائي.'
                : 'Your restaurant registration is submitted and waiting for SaaS Admin approval.'}
            </p>
          </div>
        </div>

        {/* Tenant Summary Card */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Store className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white text-base">{tenant.name}</span>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
              {tenant.currency} ({tenant.country})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">{isAr ? 'مالك المطعم المسجل:' : 'Registered Owner Name:'}</span>
              <span className="font-semibold text-slate-200">{tenant.ownerName || 'Restaurant Owner'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'البريد الإلكتروني:' : 'Owner Email:'}</span>
              <span className="font-mono text-amber-400 font-semibold">{tenant.ownerEmail || 'owner@restaurant.com'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'خطة الاشتراك المختارة:' : 'Selected Plan:'}</span>
              <span className="font-semibold text-purple-300">
                {tenant.plan === 'MULTI_RESTAURANT'
                  ? isAr
                    ? 'سلسلة مطاعم متعددة الفروع ($199/شهر)'
                    : 'Multi-Branch Chain ($199/mo)'
                  : isAr
                  ? 'فرع فردي مستقل ($79/شهر)'
                  : 'Single Bistro Location ($79/mo)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'حالة تأكيد الدفع:' : 'Payment Wire Status:'}</span>
              <span className="font-semibold text-emerald-400">
                {tenant.paymentStatus === 'WIRE_CONFIRMED'
                  ? isAr
                    ? 'تم تأكيد طلب الدفع (مؤكد)'
                    : 'Wire Transfer / Payment Submitted'
                  : tenant.paymentStatus || 'Submitted'}
              </span>
            </div>
          </div>
        </div>

        {/* Helpful Explanation Note */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'كيف يتم تفعيل الحساب؟' : 'How does activation work?'}</span>
          </div>
          <p>
            {isAr
              ? 'يقوم مدير النظام السحابي (SaaS Admin) بمراجعة تأكيد الاشتراك وتفعيل الحساب. عند التفعيل من قبل المسؤول، اضغط على زر "تحديث حالة التفعيل" أدناه للدخول إلى كافة خصائص النظام (الكاشير POS، المطبخ KDS، المخزون، والتقارير).'
              : 'The SaaS Administrator reviews and approves new account activations. Once approved, click "Refresh Approval Status" below to unlock full access to POS, KDS, inventory, and accounting.'}
          </p>
        </div>

        {refreshMessage && (
          <div className="p-3.5 rounded-xl text-xs font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-300 text-center animate-in fade-in">
            {refreshMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing
                ? isAr
                  ? 'جاري التحقق...'
                  : 'Checking Status...'
                : isAr
                ? 'تحديث حالة التفعيل'
                : 'Refresh Approval Status'}
            </span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenSaaSAdmin}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
              title={isAr ? 'دخول لوحة تحكم المسؤول' : 'SaaS Admin Login'}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>{isAr ? 'دخول المسؤول' : 'SaaS Admin Login'}</span>
            </button>

            <button
              onClick={onLogout}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
