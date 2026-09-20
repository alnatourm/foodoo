import React, { useState } from 'react';
import { Store, Sparkles, Building2, ShieldCheck, CheckCircle2, User, CreditCard } from 'lucide-react';
import { Tenant } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { apiFetch } from '../lib/api';

interface NewTenantModalProps {
  onClose: () => void;
  onTenantCreated: (tenant: Tenant) => void;
}

export const NewTenantModal: React.FC<NewTenantModalProps> = ({
  onClose,
  onTenantCreated,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [country, setCountry] = useState('Saudi Arabia');
  const [taxName, setTaxName] = useState('VAT (ZATCA)');
  const [taxRatePct, setTaxRatePct] = useState(15);
  const [branchName, setBranchName] = useState('Main Branch');
  const [plan, setPlan] = useState<'SINGLE_RESTAURANT' | 'MULTI_RESTAURANT'>('SINGLE_RESTAURANT');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPin, setOwnerPin] = useState('1111');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      const createdTenant = await apiFetch('/api/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name,
          currency,
          country,
          taxName,
          taxRatePct: Number(taxRatePct),
          branchName,
          plan,
          billingCycle,
          ownerName: ownerName || `${name} Owner`,
          ownerEmail: ownerEmail || `owner@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.sa`,
          ownerPhone: ownerPhone || '+966 50 123 4567',
          ownerPin,
          subscriptionStatus: 'PENDING_APPROVAL',
          paymentStatus: 'WIRE_CONFIRMED',
        }),
      });

      onTenantCreated(createdTenant);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t('saas.modalTitle', 'Register New Restaurant / Tenant (SaaS Portal)')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('saas.modalSubtitle', 'Select Plan, Configure Owner Account & SaaS Approval Status')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Plan Selector Cards */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              1. {t('saas.selectPlan', 'Select Subscription Plan')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setPlan('SINGLE_RESTAURANT')}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all relative ${
                  plan === 'SINGLE_RESTAURANT'
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>{t('saas.singlePlanTitle', 'Single Restaurant')}</span>
                  </div>
                  {plan === 'SINGLE_RESTAURANT' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-2">
                  {t('saas.singlePlanDesc', 'Independent Bistro / Single Location. Max 1 Branch.')}
                </p>
                <div className="font-mono text-amber-400 font-bold text-xs">
                  {billingCycle === 'YEARLY' ? '$790 / year ($65/mo)' : '$79 / month'}
                </div>
              </div>

              <div
                onClick={() => setPlan('MULTI_RESTAURANT')}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all relative ${
                  plan === 'MULTI_RESTAURANT'
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>{t('saas.multiPlanTitle', 'Multi-Restaurant Enterprise')}</span>
                  </div>
                  {plan === 'MULTI_RESTAURANT' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mb-2">
                  {t('saas.multiPlanDesc', 'Group of Restaurants / Chain. Unlimited Branches & HQ Accounting.')}
                </p>
                <div className="font-mono text-purple-400 font-bold text-xs">
                  {billingCycle === 'YEARLY' ? '$1,990 / year ($165/mo)' : '$199 / month'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <span className="text-[11px] text-slate-400">{t('saas.billingCycle', 'Billing Cycle:')}</span>
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {t('saas.monthly', 'Monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  billingCycle === 'YEARLY'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {t('saas.yearly', 'Yearly (2 Months Free)')}
              </button>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <span className="block text-slate-300 font-bold">2. {t('saas.restaurantInfo', 'Restaurant Profile')}</span>
            
            <div>
              <label className="block text-slate-400 mb-1">{t('saas.restaurantName', 'Restaurant Brand Name')} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Damascus Grill, Smokehouse Burger"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">{t('saas.currency', 'Currency')}</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    if (e.target.value === 'SAR') {
                      setCountry('Saudi Arabia');
                      setTaxName('VAT (ZATCA)');
                      setTaxRatePct(15);
                    } else if (e.target.value === 'AED') {
                      setCountry('United Arab Emirates');
                      setTaxName('VAT (FTA)');
                      setTaxRatePct(5);
                    } else if (e.target.value === 'USD') {
                      setCountry('United States');
                      setTaxName('Sales Tax');
                      setTaxRatePct(8.5);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="SAR">SAR (Saudi Arabia)</option>
                  <option value="AED">AED (UAE)</option>
                  <option value="KWD">KWD (Kuwait)</option>
                  <option value="USD">USD (United States)</option>
                  <option value="EUR">EUR (Europe)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('saas.initialBranch', 'Initial Branch Name')}</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
          </div>

          {/* Owner Account Details */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <span className="block text-slate-300 font-bold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              3. {t('saas.ownerInfo', 'Restaurant Owner Credentials (System Owner)')}
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">{t('saas.ownerName', 'Owner Full Name')}</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Tariq Mansoor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('saas.ownerEmail', 'Owner Email Login')}</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('saas.ownerPhone', 'Owner Mobile')}</label>
                <input
                  type="text"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('saas.ownerPin', 'Initial Login PIN (4 Digits)')}</label>
                <input
                  type="text"
                  maxLength={4}
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center tracking-widest font-bold"
                />
              </div>
            </div>
          </div>

          {/* SaaS Admin Mandatory Approval Requirement */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="block text-slate-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              4. {t('saas.approvalStatus', 'SaaS Platform Admin Approval Flow')}
            </span>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-white text-xs">
                  {t('saas.pendingApprovalNoteTitle', 'بانتظار موافقة المسؤول بعد مراجعة تأكيد الدفع')}
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {t(
                    'saas.pendingApprovalNoteDesc',
                    'يتطلب تفعيل الاشتراك مراجعة الدفع والاعتماد يدويًا من قبل مدير النظام (SaaS Admin) عبر لوحة التحكم قبل إتاحة الدخول للمالك.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {isSubmitting
                ? t('common.saving', 'Saving...')
                : t('saas.submitRegister', 'Provision Tenant & Create Owner Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
