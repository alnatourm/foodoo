import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Smartphone,
  Utensils,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle,
  Sparkles,
  Send,
  CreditCard,
  Banknote,
  Download,
  Award,
} from 'lucide-react';
import {
  Tenant,
  Branch,
  RestaurantTable,
  Product,
  Category,
  Order,
  OrderItem,
} from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { CustomerLoyaltyCardModal } from './CustomerLoyaltyCardModal';
import { awardLoyaltyPoints, validateReferralCode, processReferralCommission } from '../lib/loyaltyUtils';
import { apiFetch } from '../lib/api';

interface QrSelfOrderProps {
  tenant: Tenant;
  branch: Branch;
  tables: RestaurantTable[];
  products: Product[];
  categories: Category[];
  onOrderCreated: (order: Order) => void;
}

export const QrSelfOrder: React.FC<QrSelfOrderProps> = ({
  tenant,
  branch,
  tables,
  products,
  categories,
  onOrderCreated,
}) => {
  const { language, t, getLocalizedName, getLocalizedDesc } = useLanguage();
  const [activeTableId, setActiveTableId] = useState<string>(tables[0]?.id || '');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [referralCodeInput, setReferralCodeInput] = useState<string>('');
  const [referralMsg, setReferralMsg] = useState<string | null>(null);
  const [loyaltyTitle, setLoyaltyTitle] = useState<string>('');
  const [showLoyaltyModal, setShowLoyaltyModal] = useState<boolean>(false);

  const activeTable = tables.find((t) => t.id === activeTableId);

  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      setCart(cart.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([
        ...cart,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          productId: product.id,
          productName: product.name,
          productNameAr: product.nameAr,
          name: product.name,
          nameAr: product.nameAr,
          quantity: 1,
          unitPrice: product.price,
          costPrice: product.costPrice,
          station: product.station,
          modifiers: [],
          status: 'PENDING',
        },
      ]);
    }
  };

  const updateQty = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) updated.splice(index, 1);
    setCart(updated);
  };

  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

  const handleApplyReferral = () => {
    setReferralMsg(null);
    if (!referralCodeInput.trim()) return;

    const res = validateReferralCode(tenant.id, referralCodeInput, subtotal, tenant.loyaltyConfig);
    if (res.valid) {
      setReferralDiscount(res.discountAmount);
      setReferralMsg(res.message || (language === 'ar' ? 'تم قبول كود الإحالة وتطبيق الخصم!' : 'Referral discount applied!'));
    } else {
      setReferralDiscount(0);
      setReferralMsg(`⚠️ ${res.message || (language === 'ar' ? 'كود الإحالة غير صحيح' : 'Invalid referral code')}`);
    }
  };

  const totalDiscount = loyaltyDiscount + referralDiscount;
  const discountAmount = Math.min(subtotal, Math.max(0, totalDiscount));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = (taxableAmount * tenant.taxRatePct) / 100;
  const total = taxableAmount + tax;

  const handleSendSelfOrder = async () => {
    if (cart.length === 0 || !activeTable) return;
    setIsSubmitting(true);

    try {
      const orderPayload: Partial<Order> = {
        type: 'QR_SELF_ORDER',
        tableId: activeTable.id,
        tableName: activeTable.number,
        customerName: customerName.trim() || `Guest at Table ${activeTable.number}`,
        customerPhone: customerPhone.trim(),
        status: 'NEW',
        items: cart,
        subtotal,
        discountAmount,
        taxAmount: tax,
        total,
        notes: loyaltyTitle ? `Submitted via QR | ${loyaltyTitle}` : 'Submitted via Dine-In Table QR Scan',
      };

      const created = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          orderData: orderPayload,
        }),
      });

      // Award loyalty points & referral commission
      try {
        if (customerPhone && customerPhone.trim()) {
          awardLoyaltyPoints(tenant.id, customerPhone.trim(), total, tenant.loyaltyConfig, customerName);
        }
        if (referralCodeInput && referralCodeInput.trim()) {
          processReferralCommission(tenant.id, referralCodeInput, total, tenant.loyaltyConfig);
        }
      } catch (lErr) {
        console.error('Failed to award loyalty points or referral commission', lErr);
      }

      onOrderCreated(created);
      setOrderSuccess(created);
      setCart([]);
      setReferralCodeInput('');
      setReferralDiscount(0);
      setReferralMsg(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Table Selector & QR Generator Info */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
        
        {/* Actual QR Code Display */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative p-3 bg-white rounded-2xl shadow-2xl">
            <QRCodeSVG 
              value={`https://${tenant.slug}.foodoo.app/order/${branch.id}/${activeTableId}`}
              size={120}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/logo.png",
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-lg shadow-lg">
            <QrCode className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>{t('qr.simulatorTitle', 'محاكي الطلب الذاتي عبر الرمز QR')}</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-sm text-slate-400">
              {t('qr.simulatorDesc', 'يمسح العملاء هذا الرمز من طاولتهم لتصفح القائمة والطلب مباشرة من هواتفهم المحمولة.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">
                {t('qr.selectTable', 'اختيار الطاولة')}
              </span>
              <select
                value={activeTableId}
                onChange={(e) => {
                  setActiveTableId(e.target.value);
                  setOrderSuccess(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-amber-400 outline-none cursor-pointer hover:border-amber-500/50 transition"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.number} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">
                {t('common.actions', 'إجراءات')}
              </span>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition border border-slate-700"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{t('qr.downloadPrint', 'تنزيل للطباعة')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Phone Mockup */}
      <div className="w-full max-w-sm rounded-[36px] bg-slate-900 border-[6px] border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
        {/* Phone Notch */}
        <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-950"></div>
        </div>

        {/* Customer View Header */}
        <div className="p-3 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 text-center space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {t('qr.selfOrder', 'الطلب الذاتي - محلي')}
            </span>
            <button
              type="button"
              onClick={() => setShowLoyaltyModal(true)}
              className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1 hover:bg-amber-500/30 transition"
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>بطاقة الكاش باك</span>
            </button>
          </div>
          <h2 className="text-base font-black text-white mt-0.5">{getLocalizedName(tenant) || tenant?.name || 'BANLIS'}</h2>
          <p className="text-xs text-slate-400">
            {t('qr.welcomeTable', 'مرحباً بكم في الطاولة')} <span className="text-white font-bold">{activeTable?.number}</span>
          </p>
        </div>

        {orderSuccess ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">{t('qr.orderSent', 'تم إرسال الطلب إلى المطبخ!')}</h3>
            <p className="text-xs text-slate-400">
              {t('qr.ticketPrep', 'جاري تحضير التذكرة رقم')} <span className="text-amber-400 font-bold">{orderSuccess.orderNumber}</span> {t('qr.forTable', 'للطاولة')} {activeTable?.number}.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 w-full text-xs text-left space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>{t('common.quantity', 'الأصناف')}:</span>
                <span className="text-white font-bold">{orderSuccess.items?.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t('common.total', 'الإجمالي')}:</span>
                <span className="text-amber-400 font-extrabold">{(orderSuccess.total ?? 0).toFixed(2)} {tenant.currency}</span>
              </div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              {t('qr.orderMore', 'إضافة المزيد من الطلبات')}
            </button>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="p-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950">
              <button
                onClick={() => setSelectedCat('ALL')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                  selectedCat === 'ALL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {t('common.all', 'الكل')}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                    selectedCat === c.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {getLocalizedName(c)}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-950">
              {products
                .filter((p) => selectedCat === 'ALL' || p.categoryId === selectedCat)
                .map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-start justify-between gap-3"
                  >
                    {product.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                        <img src={product.image} alt={product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">{getLocalizedName(product)}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {getLocalizedDesc(product)}
                      </p>
                      <div className="text-xs font-extrabold text-amber-400 mt-1">
                        {(product.price ?? 0).toFixed(2)} {tenant.currency}
                      </div>
                    </div>

                    <button
                      disabled={product.is86d}
                      onClick={() => addToCart(product)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-30 whitespace-nowrap"
                    >
                      {product.is86d 
                        ? t('qr.soldOut', 'نفذت الكمية') 
                        : t('qr.addBtn', 'إضافة +')}
                    </button>
                  </div>
                ))}
            </div>

            {/* Sticky Cart Drawer */}
            {cart.length > 0 && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                {/* Referral Code Row */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    placeholder={language === 'ar' ? 'كود الإحالة (REF-... أو رقم الداعي)' : 'Referral code or phone...'}
                    className="flex-1 px-2 py-1 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyReferral}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition shrink-0"
                  >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
                {referralMsg && (
                  <div className={`text-[10px] font-bold px-1 ${referralMsg.startsWith('⚠️') ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {referralMsg}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">
                    {cart.reduce((a, b) => a + (b.quantity ?? 1), 0)} {t('qr.itemsInTray', 'أصناف في السلة')}
                  </span>
                  <div className="text-right">
                    {discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-400 block font-semibold">
                        -{discountAmount.toFixed(2)} {tenant.currency} ({language === 'ar' ? 'خصم' : 'Disc.'})
                      </span>
                    )}
                    <span className="font-extrabold text-amber-400">
                      {(total ?? 0).toFixed(2)} {tenant.currency}
                    </span>
                  </div>
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={handleSendSelfOrder}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('qr.sendToKitchen', 'إرسال الطلب إلى المطبخ')}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Digital Loyalty & Cashback Card Modal */}
      <CustomerLoyaltyCardModal
        isOpen={showLoyaltyModal}
        onClose={() => setShowLoyaltyModal(false)}
        tenant={tenant}
        customerPhone={customerPhone}
        customerName={customerName}
        onApplyDiscount={(discountVal, _pts, title) => {
          setLoyaltyDiscount(discountVal);
          if (title) setLoyaltyTitle(title);
        }}
      />
    </div>
  );
};
