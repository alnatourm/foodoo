import React, { useState } from 'react';
import {
  ChefHat,
  Sparkles,
  CheckCircle2,
  Store,
  Building2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Zap,
  Globe,
  BarChart3,
  Smartphone,
  LayoutGrid,
  FileSpreadsheet,
  Lock,
  Play,
  Languages,
  UserCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface SaasLandingPageProps {
  onOpenRegister: (initialPlan?: 'SINGLE_RESTAURANT' | 'MULTI_RESTAURANT') => void;
  onOpenTenantLogin: () => void;
  onOpenProviderLogin: () => void;
}

export const SaasLandingPage: React.FC<SaasLandingPageProps> = ({
  onOpenRegister,
  onOpenTenantLogin,
  onOpenProviderLogin,
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');

  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Marketing Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <ChefHat className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">
                {isAr ? 'منصة ريستو أو إس السحابية' : 'RestoOS SaaS'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isAr ? 'منصة مطاعم سحابية' : 'Cloud Restaurant Platform'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'نظام إدارة المطاعم المتقدم ونقاط البيع متعددة الفروع'
                : 'Enterprise Restaurant ERP & Multi-Branch POS'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl transition ${
              isDark
                ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition flex items-center gap-1.5"
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          <button
            onClick={onOpenProviderLogin}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAr ? 'بوابة المزود' : 'Provider Admin'}</span>
          </button>

          <button
            onClick={onOpenTenantLogin}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
          >
            <UserCircle className="w-4 h-4 text-slate-900" />
            <span>{isAr ? 'تسجيل دخول المطعم' : 'Restaurant Login'}</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>
            {isAr
              ? 'الجيل الجديد من أنظمة المطاعم السحابية ونقاط البيع المعتمدة من زاتكا'
              : 'Next-Generation Restaurant SaaS Engine & ZATCA POS'}
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          {isAr ? (
            <>
              نظام موحد يقود <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">المطاعم الفردية</span> و <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">سلاسل الفروع المتعددة</span>
            </>
          ) : (
            <>
              Powering <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Single Bistros</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Multi-Branch Groups</span>
            </>
          )}
        </h1>

        <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'كاشير سحابي متكامل، تطبيق النادل الذكي، شاشات المطبخ KDS، إدارة قائمة الطعام والوصفات، تكاليف المخزون والمستودعات، والمحاسبة الضريبية المعتمدة من زاتكا ZATCA.'
            : 'Complete Cloud POS, Mobile Waiter Ordering, Kitchen Display System (KDS), Master Menu Engineering, Inventory Costing, and Automated ZATCA VAT Accounting in one Unified SaaS platform.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onOpenRegister('SINGLE_RESTAURANT')}
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isAr ? 'اشتراك مطعم فردي ($79/شهرياً)' : 'Order Single Restaurant Plan ($79/mo)'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenRegister('MULTI_RESTAURANT')}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 transition flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>
              {isAr ? 'اشتراك سلسلة مطاعم ($199/شهرياً)' : 'Order Multi-Restaurant Plan ($199/mo)'}
            </span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 text-start">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-white text-sm">
              {isAr ? 'الكاشير وتطبيق النادل' : 'POS & Waiter App'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'شاشات كاشير باللمس تعمل بدون انقطاع وأجهزة أيباد للطلب على الطاولات.'
                : 'Offline-ready cashier touch screens & tablet table ordering.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <ChefHat className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-white text-sm">
              {isAr ? 'شاشات المطبخ الفورية' : 'Real-time KDS'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'توجيه الطلبات لمحطات الشواء، السلطات والمخبوزات مع مؤقت الإعداد.'
                : 'Station routing (Grill, Cold Prep, Bakery) with preparation timers.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">
              {isAr ? 'محاسبة زاتكا الضريبية' : 'ZATCA VAT & Accounting'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'قيود دفتر اليومية الآلية، الإقرارات الضريبية وتقارير الأرباح والخسائر.'
                : 'Automated general ledger, tax filing reports & P&L statements.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <Globe className="w-5 h-5 text-purple-400" />
            <h4 className="font-bold text-white text-sm">
              {isAr ? 'مزامنة الفروع الموحدة' : 'Multi-Branch Sync'}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'تحديثات القائمة المركزية وتحويلات المخزون بين جميع الفروع.'
                : 'Centralized menu updates & stock transfers across branches.'}
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section className="py-16 px-6 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-white">
              {isAr ? 'باقات واضحة وشفافة بدون تكاليف خفية' : 'Transparent SaaS Pricing Plans'}
            </h2>
            <p className="text-sm text-slate-400">
              {isAr
                ? 'اختر الباقة المناسبة لحجم نشاطك، ويمكنك الترقية في أي وقت.'
                : 'Choose the right plan for your business structure. Upgrade anytime.'}
            </p>

            <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  billingCycle === 'MONTHLY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'دفع شهري' : 'Monthly Billing'}
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  billingCycle === 'YEARLY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'دفع سنوي (خصم 20%)' : 'Yearly Billing (Save 20%)'}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan 1: Single Restaurant */}
            <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-8 space-y-6 flex flex-col justify-between hover:border-amber-500/50 transition">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'باقة الفرع الفردي' : 'Single Location Plan'}</span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {isAr ? 'مطعم فردي / كافيه' : 'Single Restaurant'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr
                      ? 'مخصصة للمطاعم المستقلة، المقاهي، عربات الطعام أو المنافذ الفردية.'
                      : 'Designed for independent restaurants, cafes, food trucks, or single-outlet bistros.'}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">
                    {billingCycle === 'YEARLY' ? '$65' : '$79'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    / {isAr ? 'شهرياً' : 'month'}{' '}
                    ({billingCycle === 'YEARLY'
                      ? isAr ? 'تُدفع 790$ سنوياً' : 'Billed $790 annually'
                      : isAr ? 'تُدفع شهرياً' : 'Billed monthly'})
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {isAr ? (
                        <><strong>فرع مطعم واحد نشط</strong> (حد الأقصى للفروع: 1)</>
                      ) : (
                        <><strong>1 Active Restaurant Location</strong> (Branch Limit: 1)</>
                      )}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? 'عدد غير محدود من أجهزة الكاشير والنادل' : 'Unlimited POS Cashier Terminals & Waiter Devices'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? 'شاشات عرض المطبخ KDS' : 'Kitchen KDS Station Displays'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? 'كتالوج المنيو وحساب تكاليف الوصفات' : 'Menu Catalog & Ingredient Recipe Costing'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? 'إدارة المخزون وتسجيل الهادر' : 'Inventory Stock Management & Waste Logging'}</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>{isAr ? 'إضافة فروع جديدة (تتطلب ترقية للباقة المتقدمة)' : 'Multi-Branch Expansion (Requires Enterprise Upgrade)'}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenRegister('SINGLE_RESTAURANT')}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <span>{isAr ? 'اشتراك في الباقة الفردية' : 'Subscribe Single Plan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Plan 2: Multi-Restaurant Enterprise */}
            <div className="relative rounded-3xl bg-slate-900 border-2 border-purple-500/60 p-8 space-y-6 flex flex-col justify-between shadow-2xl shadow-purple-500/10">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-[10px] tracking-wider uppercase shadow">
                {isAr ? 'الموصى بها للسلاسل' : 'Recommended for Chains'}
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>{isAr ? 'باقة السلاسل والمجموعات' : 'Group & Chain Plan'}</span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {isAr ? 'سلسلة مطاعم متكاملة' : 'Multi-Restaurant Enterprise'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr
                      ? 'لمجموعات المطاعم، السلاسل التجارية أو المالكين لأكثر من فرع وعلامة تجارية.'
                      : 'For restaurant groups, chains, or owners managing multiple brands and branches.'}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">
                    {billingCycle === 'YEARLY' ? '$165' : '$199'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    / {isAr ? 'شهرياً' : 'month'}{' '}
                    ({billingCycle === 'YEARLY'
                      ? isAr ? 'تُدفع 1,990$ سنوياً' : 'Billed $1,990 annually'
                      : isAr ? 'تُدفع شهرياً' : 'Billed monthly'})
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span><strong>{isAr ? 'فروع ومواقع مطاعم غير محدودة' : 'Unlimited Restaurant Locations & Branches'}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{isAr ? 'إرسال وتحديث القائمة والأسعار لجميع الفروع بضغطة زر' : 'Centralized Master Menu & Pricing Push across branches'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{isAr ? 'تحويلات المخزون والمشتريات المركزية للمستودع الرئيسي' : 'Inter-Branch Stock Transfers & Central Warehouse Purchasing'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{isAr ? 'تقارير الأرباح والخسائر والضرائب المجمعة للمجموعة' : 'Consolidated Enterprise P&L, COGS & Tax Reporting'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{isAr ? 'رموز PIN للموظفين وصلاحيات إلغاء الأصناف للمدراء' : 'Staff PIN Roles & Cross-Branch Manager Void PINs'}</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onOpenRegister('MULTI_RESTAURANT')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 transition flex items-center justify-center gap-2"
              >
                <span>{isAr ? 'اشتراك في باقة السلاسل' : 'Subscribe Multi-Restaurant Plan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>RestoOS SaaS Cloud Platform © 2026. All rights reserved.</p>
      </footer>
    </div>
  );
};
