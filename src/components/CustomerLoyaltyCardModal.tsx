import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Sparkles,
  QrCode,
  Gift,
  Coins,
  ChevronRight,
  CheckCircle,
  Copy,
  Clock,
  Zap,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { Tenant, CustomerLoyaltyProfile, LoyaltyRewardCoupon } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getTenantLoyaltyConfig,
  getTierColorAndLabel,
  redeemLoyaltyPoints,
  findOrCreateCustomerLoyalty,
  getReferralCodeForCustomer,
} from '../lib/loyaltyUtils';

function getCardTheme(tier: string) {
  const normalized = (tier || 'BRONZE').toUpperCase();
  switch (normalized) {
    case 'VIP':
      return {
        cardBg: 'bg-gradient-to-br from-purple-950 via-slate-950 to-black border-2 border-amber-400 shadow-2xl text-white',
        headerText: 'text-amber-300 font-mono font-extrabold tracking-widest text-[11px]',
        brandText: 'text-white font-black text-xl drop-shadow-md',
        holderLabel: 'text-amber-300 font-extrabold uppercase tracking-wider text-xs block',
        holderName: 'text-white font-black text-xl drop-shadow-lg block mt-0.5',
        phoneText: 'text-amber-300 font-mono font-black text-sm block mt-0.5',
        tierBadge: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black border-purple-300',
        statBox: 'bg-white text-slate-950 border-2 border-amber-400 p-3.5 rounded-2xl shadow-xl',
        statLabel: 'text-slate-700 font-extrabold text-xs',
        pointsColor: 'text-amber-600 font-black text-2xl',
        cashbackColor: 'text-emerald-600 font-black text-xs',
        referralBox: 'bg-amber-400/20 border border-amber-300/80 text-amber-200 font-bold text-xs p-2.5 rounded-xl',
        refCodeBadge: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm px-4 py-1.5 rounded-xl shadow-md',
        copyBtn: 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition',
      };
    case 'GOLD':
      return {
        cardBg: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-2 border-yellow-300 shadow-2xl text-slate-950',
        headerText: 'text-slate-950 font-mono font-black tracking-widest text-[11px]',
        brandText: 'text-slate-950 font-black text-xl',
        holderLabel: 'text-amber-950 font-black uppercase tracking-wider text-xs block',
        holderName: 'text-slate-950 font-black text-xl block mt-0.5',
        phoneText: 'text-slate-950 font-mono font-black text-sm block mt-0.5',
        tierBadge: 'bg-slate-950 text-amber-400 font-black border-amber-400',
        statBox: 'bg-slate-950 text-white border-2 border-amber-300 p-3.5 rounded-2xl shadow-xl',
        statLabel: 'text-slate-300 font-extrabold text-xs',
        pointsColor: 'text-amber-400 font-black text-2xl',
        cashbackColor: 'text-emerald-400 font-black text-xs',
        referralBox: 'bg-slate-950 border border-slate-800 text-amber-300 font-bold text-xs p-2.5 rounded-xl',
        refCodeBadge: 'bg-slate-950 text-amber-400 font-black text-sm px-4 py-1.5 rounded-xl border border-amber-400/60 shadow-md',
        copyBtn: 'bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition',
      };
    case 'SILVER':
      return {
        cardBg: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-2 border-white shadow-2xl text-slate-950',
        headerText: 'text-slate-950 font-mono font-black tracking-widest text-[11px]',
        brandText: 'text-slate-950 font-black text-xl',
        holderLabel: 'text-slate-900 font-black uppercase tracking-wider text-xs block',
        holderName: 'text-slate-950 font-black text-xl block mt-0.5',
        phoneText: 'text-slate-950 font-mono font-black text-sm block mt-0.5',
        tierBadge: 'bg-slate-900 text-slate-100 font-black border-slate-300',
        statBox: 'bg-slate-900 text-white border-2 border-slate-300 p-3.5 rounded-2xl shadow-xl',
        statLabel: 'text-slate-300 font-extrabold text-xs',
        pointsColor: 'text-white font-black text-2xl',
        cashbackColor: 'text-emerald-400 font-black text-xs',
        referralBox: 'bg-slate-900 border border-slate-800 text-slate-100 font-bold text-xs p-2.5 rounded-xl',
        refCodeBadge: 'bg-slate-900 text-white font-black text-sm px-4 py-1.5 rounded-xl border border-slate-400/60 shadow-md',
        copyBtn: 'bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition',
      };
    case 'BRONZE':
    default:
      return {
        cardBg: 'bg-gradient-to-br from-amber-950 via-stone-900 to-black border-2 border-amber-500 shadow-2xl text-white',
        headerText: 'text-amber-300 font-mono font-extrabold tracking-widest text-[11px]',
        brandText: 'text-white font-black text-xl drop-shadow-md',
        holderLabel: 'text-amber-300 font-extrabold uppercase tracking-wider text-xs block',
        holderName: 'text-white font-black text-xl drop-shadow-lg block mt-0.5',
        phoneText: 'text-amber-300 font-mono font-black text-sm block mt-0.5',
        tierBadge: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white font-black border-amber-400',
        statBox: 'bg-white text-slate-950 border-2 border-amber-400 p-3.5 rounded-2xl shadow-xl',
        statLabel: 'text-slate-700 font-extrabold text-xs',
        pointsColor: 'text-amber-600 font-black text-2xl',
        cashbackColor: 'text-emerald-600 font-black text-xs',
        referralBox: 'bg-amber-400/20 border border-amber-300/80 text-amber-200 font-bold text-xs p-2.5 rounded-xl',
        refCodeBadge: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm px-4 py-1.5 rounded-xl shadow-md',
        copyBtn: 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition',
      };
  }
}

interface CustomerLoyaltyCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  customerPhone?: string;
  customerName?: string;
  onApplyDiscount?: (discountAmount: number, pointsRedeemed: number, couponTitle?: string) => void;
}

export const CustomerLoyaltyCardModal: React.FC<CustomerLoyaltyCardModalProps> = ({
  isOpen,
  onClose,
  tenant,
  customerPhone: initialPhone = '',
  customerName: initialName,
  onApplyDiscount,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [activeCustomer, setActiveCustomer] = useState<CustomerLoyaltyProfile | null>(() => {
    if (initialPhone && initialPhone.trim()) {
      return findOrCreateCustomerLoyalty(tenant.id, initialPhone.trim(), initialName);
    }
    return null;
  });

  const [selectedPointsToRedeem, setSelectedPointsToRedeem] = useState<number>(50);
  const [copiedQr, setCopiedQr] = useState(false);
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoneInput(initialPhone);
      if (initialPhone && initialPhone.trim()) {
        setActiveCustomer(findOrCreateCustomerLoyalty(tenant.id, initialPhone.trim(), initialName));
      } else {
        setActiveCustomer(null);
      }
    }
  }, [isOpen, initialPhone, initialName, tenant.id]);

  const config = getTenantLoyaltyConfig(tenant);
  const currency = tenant.currency || 'SAR';

  if (!isOpen) return null;

  const handleLookupCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setErrorMessage(null);
    setRedeemSuccessMsg(null);
    const profile = findOrCreateCustomerLoyalty(tenant.id, phoneInput.trim(), initialName);
    setActiveCustomer(profile);
  };

  const handleRedeemCashback = (pointsAmount: number) => {
    if (!activeCustomer) return;
    setErrorMessage(null);

    const res = redeemLoyaltyPoints(tenant.id, activeCustomer.customerPhone, pointsAmount, config);
    if (res.success && res.updatedCustomer) {
      setActiveCustomer({ ...res.updatedCustomer });
      const msg = isAr
        ? `تم استبدال ${pointsAmount} نقطة بنجاح واسترداد مبلغ ${res.discountAmount} ${currency} كاش باك!`
        : `Successfully redeemed ${pointsAmount} pts for ${res.discountAmount} ${currency} cashback!`;
      setRedeemSuccessMsg(msg);

      if (onApplyDiscount) {
        onApplyDiscount(res.discountAmount, pointsAmount, isAr ? 'كاش باك ولاء' : 'Loyalty Cashback');
      }
    } else {
      setErrorMessage(res.error || (isAr ? 'تعذر استبدال النقاط' : 'Failed to redeem points'));
    }
  };

  const handleRedeemCoupon = (coupon: LoyaltyRewardCoupon) => {
    if (!activeCustomer) return;
    setErrorMessage(null);

    if (activeCustomer.pointsBalance < coupon.pointsCost) {
      setErrorMessage(
        isAr
          ? `رصيد النقاط غير كافٍ. تحتاج إلى ${coupon.pointsCost} نقطة واستبدال هذا الكوبون`
          : `Insufficient points balance. You need ${coupon.pointsCost} points.`
      );
      return;
    }

    let discountVal = 0;
    if (coupon.discountType === 'FIXED') {
      discountVal = coupon.discountValue;
    } else if (coupon.discountType === 'PERCENTAGE') {
      discountVal = coupon.discountValue; // Will be applied as % discount
    }

    const res = redeemLoyaltyPoints(tenant.id, activeCustomer.customerPhone, coupon.pointsCost, config);
    if (res.success && res.updatedCustomer) {
      setActiveCustomer({ ...res.updatedCustomer });
      const msg = isAr
        ? `تم تفعيل كوبون "${coupon.titleAr || coupon.title}" وخصم ${coupon.pointsCost} نقطة!`
        : `Activated coupon "${coupon.title}" for ${coupon.pointsCost} pts!`;
      setRedeemSuccessMsg(msg);

      if (onApplyDiscount) {
        onApplyDiscount(discountVal, coupon.pointsCost, coupon.titleAr || coupon.title);
      }
    } else {
      setErrorMessage(res.error || (isAr ? 'تعذر تفعيل الكوبون' : 'Failed to activate coupon'));
    }
  };

  const tierInfo = activeCustomer
    ? getTierColorAndLabel(activeCustomer.tier, isAr)
    : getTierColorAndLabel('BRONZE', isAr);

  const cashbackValue = activeCustomer
    ? Number((activeCustomer.pointsBalance * (config.currencyValuePerPoint || 0.05)).toFixed(2))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>{isAr ? 'بطاقة الولاء الكاش باك الرقمية' : 'Digital Loyalty & Cashback Card'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  {tenant.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'بطاقة العضوية الفريدة، استرداد الكاش باك، والكوبونات المتاحة'
                  : 'Customer VIP card, cashback rewards, and redeemable vouchers'}
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

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Customer Lookup Search Bar */}
          <form onSubmit={handleLookupCustomer} className="flex gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={isAr ? 'أدخل رقم جوال العميل (مثال: 0550403004)' : 'Enter customer phone number...'}
              className="flex-1 bg-slate-800/90 border border-slate-700 focus:border-amber-400 focus:bg-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 font-mono outline-none shadow-inner"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
            >
              {isAr ? 'عرض البطاقة' : 'Find Card'}
            </button>
          </form>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fade-in">
              ⚠️ {errorMessage}
            </div>
          )}

          {redeemSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{redeemSuccessMsg}</span>
            </div>
          )}

          {/* HIGH-FIDELITY REALISTIC DIGITAL CREDIT CARD */}
          {activeCustomer && (() => {
            const theme = getCardTheme(activeCustomer.tier);
            const refCode = getReferralCodeForCustomer(activeCustomer.customerPhone);
            return (
              <div className={`loyalty-vip-card relative overflow-hidden rounded-3xl p-6 shadow-2xl space-y-4 ${theme.cardBg} transition-all duration-500`}>
                {/* Metallic Card Sheen overlays */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full filter blur-2xl pointer-events-none -ml-16 -mb-16" />

                {/* Credit Card Top Header: Chip + Wifi + Tier Badge */}
                <div className="relative z-10 flex items-start justify-between border-b border-white/20 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Metallic EMV Chip */}
                    <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-400 to-yellow-200 border border-yellow-600/70 shadow-md relative overflow-hidden flex flex-col justify-center px-1">
                      <div className="w-full h-0.5 bg-yellow-700/40 my-0.5"></div>
                      <div className="w-full h-0.5 bg-yellow-700/40 my-0.5"></div>
                    </div>
                    {/* Contactless Wireless Waves Symbol */}
                    <Wifi className="w-5 h-5 text-amber-300 rotate-90 opacity-90 shrink-0" />
                    <div>
                      <span
                        style={{ color: '#fde047' }}
                        className="text-[10px] font-mono tracking-widest uppercase block text-amber-300 font-extrabold card-gold-label"
                      >
                        VIP LOYALTY CARD
                      </span>
                      <h4
                        style={{ color: '#ffffff' }}
                        className="text-xl font-black text-white drop-shadow-md card-brand-name"
                      >
                        {tenant.name}
                      </h4>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md border ${tierInfo.badgeBg} ${tierInfo.border}`}>
                    {tierInfo.label}
                  </span>
                </div>

                {/* Cardholder Details & High-Contrast Points Stat Box */}
                <div className="relative z-10 grid grid-cols-2 gap-4 items-center">
                  <div>
                    <span
                      style={{ color: '#fde047' }}
                      className="text-[11px] block font-extrabold uppercase tracking-wider text-amber-300 card-gold-label"
                    >
                      {isAr ? 'اسم حامل البطاقة' : 'Cardholder'}
                    </span>
                    <span
                      style={{ color: '#ffffff' }}
                      className="text-xl font-black truncate block mt-0.5 text-white drop-shadow-md card-holder-name"
                    >
                      {activeCustomer.customerName}
                    </span>
                    <span
                      style={{ color: '#ffffff' }}
                      className="text-xs font-mono font-bold block mt-1 text-white card-phone"
                    >
                      {activeCustomer.customerPhone}
                    </span>
                  </div>

                  {/* Stat Highlight Box */}
                  <div className={`card-stat-box ${theme.statBox}`}>
                    <span className={`text-[10px] block ${theme.statLabel}`}>{isAr ? 'رصيد النقاط الكاش باك' : 'Points Balance'}</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-2xl font-black font-mono ${theme.pointsColor}`}>
                        {activeCustomer.pointsBalance}
                      </span>
                      <span className={`text-[10px] font-bold ${theme.statLabel}`}>{isAr ? 'نقطة' : 'Pts'}</span>
                    </div>
                    <div className={`text-[11px] font-mono font-extrabold mt-0.5 ${theme.cashbackColor}`}>
                      ≈ {cashbackValue} {currency} {isAr ? 'رصيد كاش باك' : 'Cashback'}
                    </div>
                  </div>
                </div>

                {/* Referral Code Bar (Formatted like Card Number) */}
                <div className="relative z-10 pt-3 border-t border-white/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <span
                        style={{ color: '#fde047' }}
                        className="text-[11px] font-extrabold block uppercase tracking-wider text-amber-300 card-gold-label"
                      >
                        {isAr ? 'كود الإحالة الخاص بك (REFERRAL CODE)' : 'Your Digital Referral Code'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-xl text-sm font-mono font-black tracking-widest shadow-md ${theme.refCodeBadge}`}>
                          {refCode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(refCode);
                        setCopiedQr(true);
                        setTimeout(() => setCopiedQr(false), 2000);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${theme.copyBtn}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedQr ? (isAr ? 'تم النسخ!' : 'Copied!') : isAr ? 'نسخ كود الإحالة' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <div className={`text-[10px] p-2.5 rounded-xl font-bold flex items-center gap-1.5 ${theme.referralBox}`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                    <span>
                      {isAr
                        ? 'شارك هذا الكود مع أصدقائك للحصول على نسبة عمولة كاش باك فورية على كل طلب تقومون به!'
                        : 'Share this code with friends to earn cashback commission on their orders!'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* REDEEM CASHBACK SECTION */}
          {activeCustomer && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'استبدال الكاش باك المباشر (Cashback Redemption)' : 'Direct Cashback Redemption'}</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  100 {isAr ? 'نقطة' : 'pts'} = {(100 * (config.currencyValuePerPoint || 0.05)).toFixed(2)} {currency}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[20, 50, 100].map((pts) => {
                  const val = Number((pts * (config.currencyValuePerPoint || 0.05)).toFixed(2));
                  const isEnough = activeCustomer.pointsBalance >= pts;

                  return (
                    <button
                      type="button"
                      key={pts}
                      disabled={!isEnough}
                      onClick={() => handleRedeemCashback(pts)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        isEnough
                          ? 'bg-slate-950 border-amber-500/50 hover:bg-amber-500/20 cursor-pointer shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xs font-extrabold text-amber-400 font-mono">
                        {pts} {isAr ? 'نقطة' : 'Pts'}
                      </span>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        {val} {currency}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isEnough ? (isAr ? 'استبدال الآن' : 'Redeem') : isAr ? 'نقاط غير كافية' : 'Not enough'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* REWARD COUPONS CATALOG */}
          {activeCustomer && config.coupons && config.coupons.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Gift className="w-4 h-4 text-purple-400" />
                <span>{isAr ? 'قائمة كوبونات ومكافآت الولاء' : 'Redeemable Reward Vouchers'}</span>
              </h4>

              <div className="space-y-2">
                {config.coupons.map((coupon) => {
                  const isEnough = activeCustomer.pointsBalance >= coupon.pointsCost;

                  return (
                    <div
                      key={coupon.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                        isEnough
                          ? 'bg-slate-950 border-slate-800 hover:border-purple-500/50'
                          : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white">
                            {coupon.titleAr || coupon.title}
                          </h5>
                          <span className="text-[10px] text-amber-400 font-mono font-bold block mt-0.5">
                            {coupon.pointsCost} {isAr ? 'نقطة تقتطع' : 'points required'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!isEnough}
                        onClick={() => handleRedeemCoupon(coupon)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition shrink-0 ${
                          isEnough
                            ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-md cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isAr ? 'استبدال الكوبون' : 'Redeem'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'برنامج ولاء قودو المعتمد للمطعم' : 'Foodoo Certified Restaurant Loyalty'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
