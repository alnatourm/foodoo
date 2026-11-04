import {
  Tenant,
  LoyaltyProgramConfig,
  CustomerLoyaltyProfile,
  LoyaltyRewardCoupon,
  ReferralProgramConfig,
} from '../types/restaurant';

export const DEFAULT_REFERRAL_CONFIG: ReferralProgramConfig = {
  enabled: true,
  referrerRewardType: 'PERCENTAGE',
  referrerRewardValue: 5, // 5% cashback awarded to referrer on order
  newCustomerRewardType: 'PERCENTAGE',
  newCustomerRewardValue: 10, // 10% discount for new customer entering code
};

export const DEFAULT_LOYALTY_CONFIG: LoyaltyProgramConfig = {
  enabled: true,
  pointsPerCurrencyUnit: 1, // 1 Point per 1 SAR/JOD/IQD
  currencyValuePerPoint: 0.05, // 100 points = 5 SAR/JOD/IQD => 1 pt = 0.05
  cashbackRatioPct: 5, // 5% Cashback
  minRedemptionPoints: 20, // Min 20 points to redeem
  welcomeBonusPoints: 50, // 50 points on joining
  tiers: {
    bronzeMinPoints: 0,
    silverMinPoints: 150,
    goldMinPoints: 500,
    vipMinPoints: 1200,
  },
  coupons: [
    {
      id: 'coup_10pct',
      title: '10% Discount Coupon',
      titleAr: 'كوبون خصم 10%',
      pointsCost: 50,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      isActive: true,
    },
    {
      id: 'coup_cashback_voucher_50',
      title: '50 SAR Cashback Credit Voucher',
      titleAr: 'قسيمة كاش باك بقيمة 50 ريال',
      pointsCost: 100,
      discountType: 'CASHBACK_VOUCHER',
      discountValue: 50,
      isActive: true,
    },
    {
      id: 'coup_free_shisha',
      title: 'Free Shisha / Drink Voucher',
      titleAr: 'قسيمة شيشة أو عصير مجاني',
      pointsCost: 100,
      discountType: 'FREE_ITEM',
      discountValue: 0,
      freeProductName: 'شيشة فاخر / عصير طازج',
      isActive: true,
    },
    {
      id: 'coup_20_fixed',
      title: 'Cash Voucher (20 Currency Off)',
      titleAr: 'قسيمة نقدية (خصم 20 قيمة عملة)',
      pointsCost: 150,
      discountType: 'FIXED',
      discountValue: 20,
      isActive: true,
    },
  ],
  referralConfig: DEFAULT_REFERRAL_CONFIG,
};

export function getTenantLoyaltyConfig(tenant: Tenant): LoyaltyProgramConfig {
  if (tenant.loyaltyConfig) {
    return {
      ...DEFAULT_LOYALTY_CONFIG,
      ...tenant.loyaltyConfig,
      coupons:
        tenant.loyaltyConfig.coupons && tenant.loyaltyConfig.coupons.length > 0
          ? tenant.loyaltyConfig.coupons
          : DEFAULT_LOYALTY_CONFIG.coupons,
      referralConfig: {
        ...DEFAULT_REFERRAL_CONFIG,
        ...(tenant.loyaltyConfig.referralConfig || {}),
      },
    };
  }
  return DEFAULT_LOYALTY_CONFIG;
}

export function calculateCustomerTier(
  totalPointsEarned: number,
  config: LoyaltyProgramConfig = DEFAULT_LOYALTY_CONFIG
): 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP' {
  const tiers = config.tiers || DEFAULT_LOYALTY_CONFIG.tiers!;
  if (totalPointsEarned >= tiers.vipMinPoints) return 'VIP';
  if (totalPointsEarned >= tiers.goldMinPoints) return 'GOLD';
  if (totalPointsEarned >= tiers.silverMinPoints) return 'SILVER';
  return 'BRONZE';
}

export function getTierColorAndLabel(tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP', isAr: boolean) {
  switch (tier) {
    case 'VIP':
      return {
        label: isAr ? 'عضوية كبار الشخصيات (VIP)' : 'VIP Member',
        badgeBg: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white',
        border: 'border-purple-400',
        colorText: 'text-purple-400',
      };
    case 'GOLD':
      return {
        label: isAr ? 'العضوية الذهبية' : 'Gold Member',
        badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950 font-black',
        border: 'border-amber-400',
        colorText: 'text-amber-400',
      };
    case 'SILVER':
      return {
        label: isAr ? 'العضوية الفضية' : 'Silver Member',
        badgeBg: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 font-bold',
        border: 'border-slate-300',
        colorText: 'text-slate-300',
      };
    case 'BRONZE':
    default:
      return {
        label: isAr ? 'العضوية البرونزية' : 'Bronze Member',
        badgeBg: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white font-black',
        border: 'border-amber-400',
        colorText: 'text-amber-300',
      };
  }
}

const STORAGE_KEY_PREFIX = 'foodoo_loyalty_customers_';

export function getStoredLoyaltyCustomers(tenantId: string): CustomerLoyaltyProfile[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tenantId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse loyalty customers', e);
  }
  // Return dummy initial demo loyalty profile if empty
  return [
    {
      id: '0550403004',
      tenantId,
      customerName: 'محمد العبدالله (عميل مميز)',
      customerPhone: '0550403004',
      customerEmail: 'm.alabdullah@example.com',
      pointsBalance: 240,
      totalPointsEarned: 350,
      totalPointsRedeemed: 110,
      totalSpent: 1250,
      tier: 'GOLD',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      lastVisitAt: new Date().toISOString(),
    },
    {
      id: '0791234567',
      tenantId,
      customerName: 'سارة خالد',
      customerPhone: '0791234567',
      pointsBalance: 85,
      totalPointsEarned: 85,
      totalPointsRedeemed: 0,
      totalSpent: 420,
      tier: 'SILVER',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      lastVisitAt: new Date().toISOString(),
    },
  ];
}

export function saveStoredLoyaltyCustomers(tenantId: string, customers: CustomerLoyaltyProfile[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${tenantId}`, JSON.stringify(customers));
  } catch (e) {
    console.error('Failed to save loyalty customers', e);
  }
}

export function findOrCreateCustomerLoyalty(
  tenantId: string,
  phone: string,
  name?: string,
  config: LoyaltyProgramConfig = DEFAULT_LOYALTY_CONFIG
): CustomerLoyaltyProfile {
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const list = getStoredLoyaltyCustomers(tenantId);
  let matched = list.find((c) => c.customerPhone === cleanPhone || c.id === cleanPhone);

  if (!matched) {
    const welcomePts = config.welcomeBonusPoints || 50;
    matched = {
      id: cleanPhone,
      tenantId,
      customerName: name?.trim() || `عميل (${cleanPhone.slice(-4)})`,
      customerPhone: cleanPhone,
      pointsBalance: welcomePts,
      totalPointsEarned: welcomePts,
      totalPointsRedeemed: 0,
      totalSpent: 0,
      tier: calculateCustomerTier(welcomePts, config),
      createdAt: new Date().toISOString(),
      lastVisitAt: new Date().toISOString(),
    };
    list.push(matched);
    saveStoredLoyaltyCustomers(tenantId, list);
  } else if (name && name.trim() && matched.customerName.startsWith('عميل')) {
    matched.customerName = name.trim();
    saveStoredLoyaltyCustomers(tenantId, list);
  }

  return matched;
}

export function awardLoyaltyPoints(
  tenantId: string,
  phone: string,
  spentAmount: number,
  config: LoyaltyProgramConfig = DEFAULT_LOYALTY_CONFIG,
  customerName?: string
): { customer: CustomerLoyaltyProfile; pointsEarned: number } {
  const cleanPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
  if (!cleanPhone) {
    return { customer: null as any, pointsEarned: 0 };
  }
  const list = getStoredLoyaltyCustomers(tenantId);
  let customer = list.find((c) => c.customerPhone === cleanPhone || c.id === cleanPhone);

  const pointsEarned = Math.floor(spentAmount * (config.pointsPerCurrencyUnit || 1));

  if (!customer) {
    const welcomePts = config.welcomeBonusPoints || 50;
    const initialPts = welcomePts + pointsEarned;
    customer = {
      id: cleanPhone,
      tenantId,
      customerName: customerName?.trim() || `عميل (${cleanPhone.slice(-4)})`,
      customerPhone: cleanPhone,
      pointsBalance: initialPts,
      totalPointsEarned: initialPts,
      totalPointsRedeemed: 0,
      totalSpent: spentAmount,
      tier: calculateCustomerTier(initialPts, config),
      createdAt: new Date().toISOString(),
      lastVisitAt: new Date().toISOString(),
    };
    list.push(customer);
  } else {
    customer.pointsBalance += pointsEarned;
    customer.totalPointsEarned += pointsEarned;
    customer.totalSpent = (customer.totalSpent || 0) + spentAmount;
    customer.tier = calculateCustomerTier(customer.totalPointsEarned, config);
    customer.lastVisitAt = new Date().toISOString();
    if (customerName && customerName.trim() && customer.customerName.startsWith('عميل')) {
      customer.customerName = customerName.trim();
    }
  }

  saveStoredLoyaltyCustomers(tenantId, list);
  return { customer, pointsEarned };
}

export function redeemLoyaltyPoints(
  tenantId: string,
  phone: string,
  pointsToRedeem: number,
  config: LoyaltyProgramConfig = DEFAULT_LOYALTY_CONFIG
): { success: boolean; discountAmount: number; updatedCustomer?: CustomerLoyaltyProfile; error?: string } {
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const list = getStoredLoyaltyCustomers(tenantId);
  const customer = list.find((c) => c.customerPhone === cleanPhone || c.id === cleanPhone);

  if (!customer) {
    return { success: false, discountAmount: 0, error: 'العميل غير مسجل برقم الهاتف المرفق' };
  }

  if (customer.pointsBalance < pointsToRedeem) {
    return { success: false, discountAmount: 0, error: 'رصيد نقاط العميل غير كافٍ للاستبدال' };
  }

  if (pointsToRedeem < (config.minRedemptionPoints || 10)) {
    return { success: false, discountAmount: 0, error: `الحد الأدنى لاستبدال النقاط هو ${config.minRedemptionPoints || 10} نقطة` };
  }

  const discountAmount = Number((pointsToRedeem * (config.currencyValuePerPoint || 0.05)).toFixed(2));
  customer.pointsBalance -= pointsToRedeem;
  customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + pointsToRedeem;

  saveStoredLoyaltyCustomers(tenantId, list);
  return { success: true, discountAmount, updatedCustomer: customer };
}

export function getReferralCodeForCustomer(customerPhone: string): string {
  const digits = customerPhone.replace(/\D/g, '');
  return `REF-${digits.slice(-6) || 'FOOD'}`;
}

export function validateReferralCode(
  tenantId: string,
  referralCodeOrPhone: string,
  orderSubtotal: number,
  config: LoyaltyProgramConfig = DEFAULT_LOYALTY_CONFIG
): {
  valid: boolean;
  referrerPhone?: string;
  referrerName?: string;
  discountAmount: number;
  message?: string;
} {
  if (!referralCodeOrPhone || !referralCodeOrPhone.trim()) {
    return { valid: false, discountAmount: 0, message: 'يرجى إدخال كود الإحالة' };
  }

  const clean = referralCodeOrPhone.trim().toLowerCase();
  const list = getStoredLoyaltyCustomers(tenantId);

  const referrer = list.find(
    (c) =>
      c.customerPhone.toLowerCase() === clean ||
      c.id.toLowerCase() === clean ||
      (c.referralCode && c.referralCode.toLowerCase() === clean) ||
      clean.includes(c.customerPhone.slice(-6))
  );

  if (!referrer) {
    return { valid: false, discountAmount: 0, message: 'كود الإحالة غير صحيح أو غير مسجل' };
  }

  const refConfig = config.referralConfig || DEFAULT_REFERRAL_CONFIG;
  let discountAmount = 0;

  if (refConfig.newCustomerRewardType === 'PERCENTAGE') {
    discountAmount = Number(((orderSubtotal * (refConfig.newCustomerRewardValue || 10)) / 100).toFixed(2));
  } else {
    discountAmount = refConfig.newCustomerRewardValue || 10;
  }

  return {
    valid: true,
    referrerPhone: referrer.customerPhone,
    referrerName: referrer.customerName,
    discountAmount,
    message: `كود إحالة معتمد من العميل (${referrer.customerName})!`,
  };
}

export function processReferralCommission(
  tenantId: string,
  referralCodeOrPhone: string,
  orderTotal: number,
  config: LoyaltyProgramConfig = DEFAULT_LOYALTY_CONFIG
): { success: boolean; referrerName?: string; cashbackEarned: number } {
  if (!referralCodeOrPhone || !referralCodeOrPhone.trim()) {
    return { success: false, cashbackEarned: 0 };
  }

  const clean = referralCodeOrPhone.trim().toLowerCase();
  const list = getStoredLoyaltyCustomers(tenantId);

  const referrer = list.find(
    (c) =>
      c.customerPhone.toLowerCase() === clean ||
      c.id.toLowerCase() === clean ||
      (c.referralCode && c.referralCode.toLowerCase() === clean) ||
      clean.includes(c.customerPhone.slice(-6))
  );

  if (!referrer) {
    return { success: false, cashbackEarned: 0 };
  }

  const refConfig = config.referralConfig || DEFAULT_REFERRAL_CONFIG;
  let cashbackAmount = 0;

  if (refConfig.referrerRewardType === 'PERCENTAGE') {
    cashbackAmount = Number(((orderTotal * (refConfig.referrerRewardValue || 5)) / 100).toFixed(2));
  } else {
    cashbackAmount = refConfig.referrerRewardValue || 10;
  }

  // Convert cashback currency value to points equivalent
  const pointsVal = config.currencyValuePerPoint || 0.05;
  const pointsAwarded = Math.floor(cashbackAmount / pointsVal);

  referrer.pointsBalance += pointsAwarded;
  referrer.totalPointsEarned += pointsAwarded;
  referrer.referralEarnings = (referrer.referralEarnings || 0) + cashbackAmount;

  saveStoredLoyaltyCustomers(tenantId, list);

  return {
    success: true,
    referrerName: referrer.customerName,
    cashbackEarned: cashbackAmount,
  };
}
