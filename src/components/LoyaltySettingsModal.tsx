import React, { useState } from 'react';
import {
  X,
  Award,
  Sparkles,
  Gift,
  Coins,
  Settings,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  TrendingUp,
  Save,
  Percent,
} from 'lucide-react';
import { Tenant, LoyaltyProgramConfig, LoyaltyRewardCoupon, CustomerLoyaltyProfile } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getTenantLoyaltyConfig,
  getStoredLoyaltyCustomers,
  getTierColorAndLabel,
} from '../lib/loyaltyUtils';

interface LoyaltySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onSaveConfig: (updatedConfig: LoyaltyProgramConfig) => void;
}

export const LoyaltySettingsModal: React.FC<LoyaltySettingsModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSaveConfig,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'COUPONS' | 'CUSTOMERS'>('SETTINGS');
  const [config, setConfig] = useState<LoyaltyProgramConfig>(() => getTenantLoyaltyConfig(tenant));
  const [customers, setCustomers] = useState<CustomerLoyaltyProfile[]>(() =>
    getStoredLoyaltyCustomers(tenant.id)
  );

  // New Coupon Form state
  const [newCouponTitle, setNewCouponTitle] = useState('');
  const [newCouponPointsCost, setNewCouponPointsCost] = useState(50);
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED' | 'FREE_ITEM'>('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponFreeItem, setNewCouponFreeItem] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(config);
    alert(isAr ? 'تم حفظ إعدادات برنامج الولاء والكاش باك بنجاح!' : 'Loyalty program settings saved successfully!');
    onClose();
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponTitle.trim()) return;

    const newCoupon: LoyaltyRewardCoupon = {
      id: `coup_${Date.now()}`,
      title: newCouponTitle.trim(),
      titleAr: newCouponTitle.trim(),
      pointsCost: Number(newCouponPointsCost),
      discountType: newCouponType,
      discountValue: Number(newCouponValue),
      freeProductName: newCouponFreeItem.trim() || undefined,
      isActive: true,
    };

    setConfig((prev) => ({
      ...prev,
      coupons: [...(prev.coupons || []), newCoupon],
    }));

    setNewCouponTitle('');
    setNewCouponPointsCost(50);
    setNewCouponValue(10);
    setNewCouponFreeItem('');
  };

  const handleDeleteCoupon = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      coupons: (prev.coupons || []).filter((c) => c.id !== id),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>{isAr ? 'إدارة برنامج الولاء والكاش باك للمطعم' : 'Loyalty & Cashback Management'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {tenant.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'تهيئة نقاط الكاش باك، الكوبونات والمكافآت، ومتابعة أعضاء VIP'
                  : 'Configure points ratio, cashback vouchers, and audit active VIP members'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'SETTINGS'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{isAr ? 'إعدادات النقاط والكاش باك' : 'Points Rules'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COUPONS')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'COUPONS'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>{isAr ? 'كتالوج الكوبونات والقسائم' : 'Coupons & Cashback Vouchers'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REFERRAL')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'REFERRAL'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{isAr ? 'برنامج كود الإحالة (Referral)' : 'Referral Commission'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CUSTOMERS'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {isAr ? `أعضاء الولاء المسجلين (${customers.length})` : `Members (${customers.length})`}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-5">
          {activeTab === 'SETTINGS' && (
            <div className="space-y-4">
              {/* Program Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {isAr ? 'تفعيل برنامج الولاء والكاش باك للمطعم' : 'Enable Loyalty & Cashback Program'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'منح العملاء نقاط كاش باك تلقائياً عند الدفع واستبدالها في الـ POS و QR'
                      : 'Automatically reward customers points on completed orders'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                  className={`px-4 py-2 rounded-2xl font-black text-xs transition-all duration-300 flex items-center gap-2 border shadow-md cursor-pointer ${
                    config.enabled
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full transition-all ${config.enabled ? 'bg-slate-950' : 'bg-slate-500'}`} />
                  <span>
                    {config.enabled
                      ? (isAr ? 'مفعل ✓' : 'ACTIVE ✓')
                      : (isAr ? 'غير مفعل ✕' : 'INACTIVE ✕')}
                  </span>
                </button>
              </div>

              {/* Earn Ratio & Cashback Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    {isAr ? 'عدد النقاط المكتسبة لكل 1 وحدة عملة' : 'Points per 1 Currency Spent'}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={config.pointsPerCurrencyUnit}
                    onChange={(e) =>
                      setConfig({ ...config, pointsPerCurrencyUnit: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    {isAr ? `مثال: عند شراء بـ 100 ${tenant.currency} يكسب العميل ${100 * config.pointsPerCurrencyUnit} نقطة` : `Example: 100 spent = ${100 * config.pointsPerCurrencyUnit} pts`}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    {isAr ? 'القيمة النقدية لكل نقطة (Cashback Value)' : 'Cashback Currency Value per Point'}
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.01"
                    value={config.currencyValuePerPoint}
                    onChange={(e) =>
                      setConfig({ ...config, currencyValuePerPoint: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    {isAr ? `مثال: 100 نقطة تساوي خصم ${(100 * config.currencyValuePerPoint).toFixed(2)} ${tenant.currency}` : `Example: 100 pts = ${(100 * config.currencyValuePerPoint).toFixed(2)} ${tenant.currency}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    {isAr ? 'نقاط الترحيب التلقائية للعميل الجديد' : 'New Customer Welcome Bonus'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.welcomeBonusPoints || 50}
                    onChange={(e) =>
                      setConfig({ ...config, welcomeBonusPoints: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'تُمنح تلقائياً عند تسجيل رقم العميل لأول مرة' : 'Granted immediately upon joining'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    {isAr ? 'الحد الأدنى لاستبدال النقاط' : 'Minimum Redemption Threshold'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.minRedemptionPoints}
                    onChange={(e) =>
                      setConfig({ ...config, minRedemptionPoints: Number(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'يشترط امتلاك هذا الحد لاستبدال النقاط' : 'Min points required to redeem'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'COUPONS' && (
            <div className="space-y-4">
              {/* Add New Coupon Form */}
              <form onSubmit={handleAddCoupon} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'إضافة كوبون / مكافأة ولاء جديدة' : 'Add New Loyalty Coupon'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      {isAr ? 'عنوان الكوبون:' : 'Coupon Title:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'مثال: كوبون خصم 15%' : 'e.g. 15% OFF Coupon'}
                      value={newCouponTitle}
                      onChange={(e) => setNewCouponTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      {isAr ? 'تلفة النقاط المطلوب استبدالها:' : 'Points Required:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newCouponPointsCost}
                      onChange={(e) => setNewCouponPointsCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      {isAr ? 'نوع الخصم:' : 'Discount Type:'}
                    </label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    >
                      <option value="PERCENTAGE">{isAr ? 'خصم نسبة مئوية (%)' : 'Percentage Discount (%)'}</option>
                      <option value="FIXED">{isAr ? 'خصم مبلغ ثابت' : 'Fixed Currency Discount'}</option>
                      <option value="CASHBACK_VOUCHER">{isAr ? 'قسيمة كاش باك نقدية (Cashback Credit)' : 'Cashback Credit Voucher'}</option>
                      <option value="FREE_ITEM">{isAr ? 'صنف مجاني' : 'Free Product Item'}</option>
                    </select>
                  </div>

                  {newCouponType !== 'FREE_ITEM' ? (
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                        {isAr ? 'قيمة الخصم:' : 'Discount Value:'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newCouponValue}
                        onChange={(e) => setNewCouponValue(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                        {isAr ? 'اسم الصنف المجاني:' : 'Free Item Name:'}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? 'مثال: شيشة فاخر / عصير' : 'e.g. Free Drink'}
                        value={newCouponFreeItem}
                        onChange={(e) => setNewCouponFreeItem(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition"
                >
                  {isAr ? 'إضافة الكوبون إلى القائمة' : 'Add Coupon to Catalog'}
                </button>
              </form>

              {/* Coupons List */}
              <div className="space-y-2">
                {(config.coupons || []).map((coup) => (
                  <div
                    key={coup.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-white">{coup.titleAr || coup.title}</h5>
                        <span className="text-[10px] text-amber-400 font-mono font-bold block mt-0.5">
                          {coup.pointsCost} {isAr ? 'نقطة' : 'pts'} •{' '}
                          {coup.discountType === 'PERCENTAGE'
                            ? `${coup.discountValue}% OFF`
                            : coup.discountType === 'FIXED'
                            ? `${coup.discountValue} ${tenant.currency} OFF`
                            : `FREE ITEM (${coup.freeProductName || ''})`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coup.id)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
                      title={isAr ? 'حذف الكوبون' : 'Delete coupon'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'REFERRAL' && (
            <div className="space-y-4">
              {/* Referral Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>{isAr ? 'تفعيل برنامج الإحالات ومكافأة جلب العملاء الجدد' : 'Enable Customer Referral Commission Program'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'منح العميل الحالي عمولة كاش باك عندما يجلب عميلاً جديداً للمطعم بقيد كود الإحالة'
                      : 'Reward existing customers cashback when their referred friends place orders'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      referralConfig: {
                        ...(config.referralConfig || {
                          enabled: true,
                          referrerRewardType: 'PERCENTAGE',
                          referrerRewardValue: 5,
                          newCustomerRewardType: 'PERCENTAGE',
                          newCustomerRewardValue: 10,
                        }),
                        enabled: !config.referralConfig?.enabled,
                      },
                    })
                  }
                  className={`px-4 py-2 rounded-2xl font-black text-xs transition-all duration-300 flex items-center gap-2 border shadow-md cursor-pointer ${
                    config.referralConfig?.enabled
                      ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full transition-all ${config.referralConfig?.enabled ? 'bg-white' : 'bg-slate-500'}`} />
                  <span>
                    {config.referralConfig?.enabled
                      ? (isAr ? 'برنامج الإحالة مفعل ✓' : 'ACTIVE ✓')
                      : (isAr ? 'غير مفعل ✕' : 'INACTIVE ✕')}
                  </span>
                </button>
              </div>

              {/* Referrer Reward Rules */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400">
                  {isAr ? '1. عمولة العميل المُحيل (الذي جلب الزبون الجديد)' : '1. Referrer Commission Reward'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      {isAr ? 'نوع عمولة الكاش باك للمُحيل:' : 'Referrer Reward Type:'}
                    </label>
                    <select
                      value={config.referralConfig?.referrerRewardType || 'PERCENTAGE'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          referralConfig: {
                            ...(config.referralConfig || {
                              enabled: true,
                              referrerRewardType: 'PERCENTAGE',
                              referrerRewardValue: 5,
                              newCustomerRewardType: 'PERCENTAGE',
                              newCustomerRewardValue: 10,
                            }),
                            referrerRewardType: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    >
                      <option value="PERCENTAGE">{isAr ? 'نسبة مئوية (%) من الفاتورة' : 'Percentage (%) of Order'}</option>
                      <option value="FIXED">{isAr ? 'مبلغ كاش باك ثابت' : 'Fixed Cashback Amount'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      {isAr ? 'قيمة العمولة الكاش باك:' : 'Commission Value:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.referralConfig?.referrerRewardValue ?? 5}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          referralConfig: {
                            ...(config.referralConfig || {
                              enabled: true,
                              referrerRewardType: 'PERCENTAGE',
                              referrerRewardValue: 5,
                              newCustomerRewardType: 'PERCENTAGE',
                              newCustomerRewardValue: 10,
                            }),
                            referrerRewardValue: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-purple-300 font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isAr
                    ? `مثال: عند إتمام العميل الجديد طلب بقيمة 100 ${tenant.currency}، يحصل العميل صاحب كود الإحالة على ${config.referralConfig?.referrerRewardType === 'PERCENTAGE' ? `${config.referralConfig?.referrerRewardValue || 5}% كاش باك (أي ${100 * ((config.referralConfig?.referrerRewardValue || 5) / 100)} ${tenant.currency})` : `${config.referralConfig?.referrerRewardValue || 5} ${tenant.currency} كاش باك`} تضاف لرصيده.`
                    : 'Referrer gets rewarded when referee places order.'}
                </p>
              </div>

              {/* New Customer Referral Bonus */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400">
                  {isAr ? '2. خصم الترحيب للعميل الجديد عند استخدام كود الإحالة' : '2. New Customer Signup Discount'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      {isAr ? 'نوع خصم العميل الجديد:' : 'New Customer Discount Type:'}
                    </label>
                    <select
                      value={config.referralConfig?.newCustomerRewardType || 'PERCENTAGE'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          referralConfig: {
                            ...(config.referralConfig || {
                              enabled: true,
                              referrerRewardType: 'PERCENTAGE',
                              referrerRewardValue: 5,
                              newCustomerRewardType: 'PERCENTAGE',
                              newCustomerRewardValue: 10,
                            }),
                            newCustomerRewardType: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    >
                      <option value="PERCENTAGE">{isAr ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                      <option value="FIXED">{isAr ? 'خصم مبلغ ثابت' : 'Fixed Currency Discount'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      {isAr ? 'قيمة خصم الترحيب:' : 'New Customer Discount Value:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.referralConfig?.newCustomerRewardValue ?? 10}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          referralConfig: {
                            ...(config.referralConfig || {
                              enabled: true,
                              referrerRewardType: 'PERCENTAGE',
                              referrerRewardValue: 5,
                              newCustomerRewardType: 'PERCENTAGE',
                              newCustomerRewardValue: 10,
                            }),
                            newCustomerRewardValue: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CUSTOMERS' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full ltr:text-left rtl:text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold text-[10px] uppercase">
                      <th className="py-2.5 px-3">{isAr ? 'اسم العميل' : 'Customer'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'رقم الهاتف' : 'Phone'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'المستوى' : 'Tier'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'رصيد النقاط' : 'Points'}</th>
                      <th className="py-2.5 px-3 ltr:text-right rtl:text-left">{isAr ? 'إجمالي المشتريات' : 'Total Spent'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          {isAr ? 'لا يوجد أعضاء ولاء مسجلون بعد.' : 'No loyalty members found.'}
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => {
                        const tier = getTierColorAndLabel(c.tier, isAr);
                        return (
                          <tr key={c.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-3 font-bold text-white">{c.customerName}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{c.customerPhone}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${tier.badgeBg}`}>
                                {tier.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold font-mono text-amber-400">
                              {c.pointsBalance}
                            </td>
                            <td className="py-2.5 px-3 ltr:text-right rtl:text-left font-mono font-bold text-emerald-400">
                              {(c.totalSpent || 0).toFixed(2)} {tenant.currency}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>{isAr ? 'حفظ إعدادات الولاء' : 'Save Loyalty Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
