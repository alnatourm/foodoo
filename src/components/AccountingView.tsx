import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Scale,
  Receipt,
  Percent,
  CheckCircle,
  FileCheck,
  ShoppingBag,
  CreditCard,
  Wallet,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  User,
  RefreshCw,
  Eye,
  Trash2,
  AlertCircle,
  ChefHat,
  X,
  Utensils,
  Sliders,
} from 'lucide-react';
import {
  JournalEntry, Tenant, Branch, Order, AccountingSummary, Product } from '../types/restaurant';
import {
  useLanguage } from '../i18n/LanguageContext';
import {
  apiFetch } from '../lib/api';
import { getActiveOrderItems } from '../lib/orderUtils';
import { TargetRevenueExportModal } from './TargetRevenueExportModal';

interface AccountingViewProps {
  tenant: Tenant;
  branch: Branch;
  journals: JournalEntry[];
  summary: Partial<AccountingSummary>;
  orders?: Order[];
  products?: Product[];
  onRefresh?: () => void;
  onViewReceipt?: (order: Order) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  tenant,
  branch,
  journals,
  summary,
  orders = [],
  products = [],
  onRefresh,
  onViewReceipt,
}) => {
  const { language, isRTL, getLocalizedName } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PL' | 'JOURNALS' | 'ITEMS' | 'SHISHA_TOBACCO'>('ORDERS');
  const [itemReportPeriod, setItemReportPeriod] = useState<'DAILY' | 'MONTHLY' | 'CUSTOM' | 'ALL'>('ALL');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedKitchenStations, setSelectedKitchenStations] = useState<string[]>(['ALL']);
  const [isKitchenDropdownOpen, setIsKitchenDropdownOpen] = useState(false);
  const [itemStartDate, setItemStartDate] = useState<string>('');
  const [itemEndDate, setItemEndDate] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PAID' | 'OPEN' | 'VOIDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [journalSearch, setJournalSearch] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showSecretActions, setShowSecretActions] = useState(false);
  const iconClicksRef = useRef<{ count: number; timer: any }>({ count: 0, timer: null });

  const [showShishaSecretPanel, setShowShishaSecretPanel] = useState(false);
  const [targetShishaCap, setTargetShishaCap] = useState<number>(3000);
  const [shishaCapActive, setShishaCapActive] = useState<boolean>(false);
  const [shishaStartDate, setShishaStartDate] = useState<string>('');
  const [shishaEndDate, setShishaEndDate] = useState<string>('');
  const [isReflectingShisha, setIsReflectingShisha] = useState<boolean>(false);
  const shishaIconClicksRef = useRef<{ count: number; timer: any }>({ count: 0, timer: null });

  const handleShishaIconSecretClick = () => {
    if (shishaIconClicksRef.current.timer) {
      clearTimeout(shishaIconClicksRef.current.timer);
    }
    shishaIconClicksRef.current.count += 1;
    if (shishaIconClicksRef.current.count >= 3) {
      setShowShishaSecretPanel((prev) => !prev);
      shishaIconClicksRef.current.count = 0;
    } else {
      shishaIconClicksRef.current.timer = setTimeout(() => {
        shishaIconClicksRef.current.count = 0;
      }, 2500);
    }
  };

  const handleSecretIconClick = () => {
    if (iconClicksRef.current.timer) {
      clearTimeout(iconClicksRef.current.timer);
    }
    iconClicksRef.current.count += 1;

    if (iconClicksRef.current.count >= 3) {
      setShowSecretActions((prev) => !prev);
      iconClicksRef.current.count = 0;
    } else {
      iconClicksRef.current.timer = setTimeout(() => {
        iconClicksRef.current.count = 0;
      }, 2500);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    const confirmMsg = isAr
      ? `هل أنت متأكد من مسح الطلب رقم ${order.orderNumber}؟\n\nسيتم إرجاع كميات المكونات المستهلكة إلى المخزون وتحديث المحاسبة والقيود المالية فوراً.`
      : `Are you sure you want to delete order ${order.orderNumber}?\n\nThis will restore consumed ingredient quantities back to inventory and update accounting logs.`;

    if (!confirm(confirmMsg)) return;

    setDeletingOrderId(order.id);
    try {
      const res = await apiFetch(`/api/orders/${order.id}?tenantId=${tenant.id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        alert(
          isAr
            ? `تم مسح الطلب ${order.orderNumber} بنجاح!\nتم استرجاع كميات المكونات إلى المخزون وتحديث السجل المالي.`
            : `Order ${order.orderNumber} deleted successfully!\nStock restored to inventory and accounting updated.`
        );
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(err.message || (isAr ? 'حدث خطأ أثناء مسح الطلب' : 'Error deleting order'));
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleClearAllOrders = async () => {
    const confirmMsg = isAr
      ? 'هل أنت متأكد من مسح وتصفير كافة الطلبات والسجلات المالية؟ سيتم الإبقاء على الأصناف والمكونات وإعادة ضبط المخزون والحسابات.'
      : 'Are you sure you want to clear all test orders and financial logs? Your menu and ingredients will be kept, and accounts reset.';

    if (!confirm(confirmMsg)) return;

    try {
      await apiFetch(`/api/tenants/${tenant.id}/clear-orders`, {
        method: 'POST',
      });
      alert(isAr ? 'تم تصفير جميع الطلبات التجريبية والحسابات بنجاح!' : 'All test orders and financial logs cleared successfully!');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || (isAr ? 'حدث خطأ أثناء تصفير الطلبات' : 'Error clearing orders'));
    }
  };

  // 1. Order categorizations
  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === 'PAID'),
    [orders]
  );
  const openOrders = useMemo(
    () => orders.filter((o) => o.status !== 'PAID' && o.status !== 'VOIDED'),
    [orders]
  );
  const voidedOrders = useMemo(
    () => orders.filter((o) => o.status === 'VOIDED'),
    [orders]
  );

  // 2. Exact mathematical calculations (with server fallback)
  const grossSales = summary?.grossSales ?? Number(paidOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0).toFixed(2));
  const discounts = summary?.discounts ?? Number(paidOrders.reduce((acc, o) => acc + (o.discountAmount || 0), 0).toFixed(2));
  const netSales = summary?.netSales ?? Number((grossSales - discounts).toFixed(2));
  const taxCollected = summary?.taxCollected ?? Number(paidOrders.reduce((acc, o) => acc + (o.taxAmount || 0), 0).toFixed(2));
  const totalCollected = summary?.totalCollected ?? Number(paidOrders.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2));
  const cogs = summary?.cogs ?? 0;
  const grossProfit = summary?.grossProfit ?? Number((netSales - cogs).toFixed(2));
  const foodCostPct = summary?.foodCostPct ?? (netSales > 0 ? Number(((cogs / netSales) * 100).toFixed(1)) : 0);
  const grossMarginPct = netSales > 0 ? Number(((grossProfit / netSales) * 100).toFixed(1)) : 0;

  const openOrdersCount = summary?.openOrdersCount ?? openOrders.length;
  const openOrdersTotal = summary?.openOrdersTotal ?? Number(openOrders.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2));
  const allOrdersAmount = summary?.allOrdersAmount ?? Number((totalCollected + openOrdersTotal).toFixed(2));
  const avgOrderValue = paidOrders.length > 0 ? Number((totalCollected / paidOrders.length).toFixed(2)) : 0;

  const dailySales = useMemo(() => {
    const todayStr = new Date().toDateString();
    const sum = paidOrders
      .filter((o) => new Date(o.paidAt || o.createdAt).toDateString() === todayStr)
      .reduce((acc, o) => acc + (o.total || 0), 0);
    return sum > 0 ? sum : (paidOrders.length > 0 ? 0 : totalCollected);
  }, [paidOrders, totalCollected]);

  const monthlySales = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const sum = paidOrders
      .filter((o) => {
        const d = new Date(o.paidAt || o.createdAt);
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
      })
      .reduce((acc, o) => acc + (o.total || 0), 0);
    return sum > 0 ? sum : (paidOrders.length > 0 ? 0 : totalCollected);
  }, [paidOrders, totalCollected]);

  const getStationLabel = useCallback((code?: string) => {
    if (!code || code === 'ALL') return isAr ? 'كافة المطابخ' : 'All Kitchens';

    if (tenant.stations && tenant.stations.length > 0) {
      const matched = tenant.stations.find(
        (s) => s.code?.toUpperCase() === code.toUpperCase() || s.id === code
      );
      if (matched) return matched.name;
    }

    const upper = code.toUpperCase();
    if (upper === 'GRILL') return isAr ? 'المشاوي (Grill)' : 'Grill Station';
    if (upper === 'FRYER') return isAr ? 'القلاية (Fryer)' : 'Fryer Station';
    if (upper === 'COLD') return isAr ? 'البارد (Cold Prep)' : 'Cold Prep';
    if (upper === 'DRINKS') return isAr ? 'المشروبات (Drinks)' : 'Beverages & Bar';
    if (upper === 'OVEN') return isAr ? 'الفرن (Oven)' : 'Oven & Bakery';

    return code;
  }, [tenant.stations, isAr]);

  const availableKitchenStations = useMemo(() => {
    const codes = new Set<string>();
    if (tenant.stations && tenant.stations.length > 0) {
      tenant.stations.forEach((s) => {
        if (s.code) codes.add(s.code.toUpperCase());
      });
    } else {
      ['GRILL', 'FRYER', 'COLD', 'DRINKS', 'OVEN'].forEach((c) => codes.add(c));
    }

    orders.forEach((o) => {
      (o.items || []).forEach((i) => {
        if (i.station) codes.add(i.station.toUpperCase());
      });
    });

    if (products && products.length > 0) {
      products.forEach((p) => {
        if (p.station) codes.add(p.station.toUpperCase());
      });
    }

    return Array.from(codes);
  }, [tenant.stations, orders, products]);

  const itemSalesDetails = useMemo(() => {
    const records: Array<{
      orderId: string;
      orderNumber: string;
      date: string;
      rawDate: Date;
      itemName: string;
      quantity: number;
      unitPrice: number;
      total: number;
      isDaily: boolean;
      isMonthly: boolean;
      station: string;
      productId?: string;
    }> = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    // Pull from all active or paid orders from the restaurant
    const targetOrders = orders.filter((o) => o.status !== 'VOIDED');

    targetOrders.forEach((o) => {
      const orderDate = new Date(o.paidAt || o.createdAt);
      const isDaily = orderDate.toDateString() === todayStr;
      const isMonthly = orderDate.getMonth() === curMonth && orderDate.getFullYear() === curYear;

      const activeOrderItems = getActiveOrderItems(o);
      if (activeOrderItems.length > 0) {
        activeOrderItems.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          let price = Number(item.unitPrice ?? (item as any).price ?? 0);
          if (price === 0 && activeOrderItems.length === 1 && o.total > 0) {
            price = Number((o.total / qty).toFixed(2));
          }
          const itemName = item.productNameAr || item.nameAr || item.productName || item.name || getLocalizedName(item as any) || (isAr ? 'صنف غير محدد' : 'Item');

          let stationCode = item.station;
          if (!stationCode && products && products.length > 0) {
            const matchedProd = products.find(
              (p) => p.id === item.productId || p.name === item.productName || p.nameAr === item.productNameAr
            );
            if (matchedProd) stationCode = matchedProd.station;
          }
          if (!stationCode) stationCode = 'GRILL';

          records.push({
            orderId: o.id,
            orderNumber: o.orderNumber || '#---',
            date: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + orderDate.toLocaleDateString(),
            rawDate: orderDate,
            itemName,
            quantity: qty,
            unitPrice: price,
            total: Number((price * qty).toFixed(2)),
            isDaily,
            isMonthly,
            station: stationCode,
            productId: item.productId,
          });
        });
      }
    });

    return records;
  }, [orders, products, getLocalizedName, isAr]);

  const toggleKitchenStation = (code: string) => {
    if (code === 'ALL') {
      setSelectedKitchenStations(['ALL']);
      return;
    }
    setSelectedKitchenStations((prev) => {
      const isAll = prev.includes('ALL') || prev.length === 0;
      if (isAll) {
        return [code];
      }
      if (prev.includes(code)) {
        const remaining = prev.filter((c) => c !== code);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...prev, code];
      }
    });
  };

  const isKitchenStationSelected = (code: string) => {
    if (code === 'ALL') {
      return selectedKitchenStations.includes('ALL') || selectedKitchenStations.length === 0;
    }
    return selectedKitchenStations.includes(code);
  };

  const filteredItemSales = useMemo(() => {
    const isAllKitchens = selectedKitchenStations.includes('ALL') || selectedKitchenStations.length === 0;

    return itemSalesDetails.filter((r) => {
      // 1. Multi Kitchen Station Filter
      if (!isAllKitchens) {
        const stationUpper = r.station.toUpperCase();
        const matches = selectedKitchenStations.some(
          (code) => code.toUpperCase() === stationUpper
        );
        if (!matches) return false;
      }

      // 2. Period & Custom Date Filter
      if (itemReportPeriod === 'DAILY' && !r.isDaily) return false;
      if (itemReportPeriod === 'MONTHLY' && !r.isMonthly) return false;
      if (itemReportPeriod === 'CUSTOM' || itemStartDate || itemEndDate) {
        if (itemStartDate) {
          const start = new Date(itemStartDate);
          start.setHours(0, 0, 0, 0);
          if (r.rawDate < start) return false;
        }
        if (itemEndDate) {
          const end = new Date(itemEndDate);
          end.setHours(23, 59, 59, 999);
          if (r.rawDate > end) return false;
        }
      }

      // 3. Search Query
      if (itemSearchQuery.trim()) {
        const q = itemSearchQuery.trim().toLowerCase();
        const stationLabel = getStationLabel(r.station).toLowerCase();
        return (
          r.itemName.toLowerCase().includes(q) ||
          r.orderNumber.toLowerCase().includes(q) ||
          stationLabel.includes(q)
        );
      }

      return true;
    });
  }, [
    itemSalesDetails,
    itemReportPeriod,
    selectedKitchenStations,
    itemStartDate,
    itemEndDate,
    itemSearchQuery,
    getStationLabel,
  ]);

  const shishaTobaccoSales = useMemo(() => {
    const rawShisha = filteredItemSales.filter((r) => {
      const p = products.find(
        (prod) =>
          (r.productId && prod.id === r.productId) ||
          prod.name === r.itemName ||
          prod.nameAr === r.itemName ||
          prod.name?.toLowerCase() === r.itemName?.toLowerCase() ||
          prod.nameAr?.toLowerCase() === r.itemName?.toLowerCase()
      );

      let isTobaccoCategory = false;
      if (p) {
        const catId = p.categoryId;
        const cat = tenant.categories?.find((c) => c.id === catId);
        const catName = ((cat?.name || cat?.nameAr || p.categoryName || '') as string).toLowerCase();
        if (
          catName.includes('شيشة') ||
          catName.includes('شيشية') ||
          catName.includes('shisha') ||
          catName.includes('tobacco') ||
          catName.includes('تبغ') ||
          catName.includes('معسل')
        ) {
          isTobaccoCategory = true;
        }
      }

      const itemName = (r.itemName || '').toLowerCase();
      const isTobaccoItem =
        itemName.includes('فاخر') ||
        itemName.includes('نخلة') ||
        itemName.includes('مكس') ||
        itemName.includes('عنب') ||
        itemName.includes('معسل') ||
        itemName.includes('شيشة') ||
        itemName.includes('شيشية') ||
        itemName.includes('تفاح') ||
        itemName.includes('نعناع') ||
        itemName.includes('ليمون') ||
        itemName.includes('شيشه') ||
        itemName.includes('أرجيلة') ||
        itemName.includes('ارجيله');

      return isTobaccoCategory || isTobaccoItem;
    });

    if (!shishaCapActive || targetShishaCap <= 0) {
      return rawShisha;
    }

    const sorted = [...rawShisha].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const originalShishaTotal = sorted.reduce((sum, r) => sum + r.total, 0);

    if (originalShishaTotal <= targetShishaCap) {
      return sorted;
    }

    const ratio = originalShishaTotal > 0 ? targetShishaCap / originalShishaTotal : 0.5;
    const step = Math.max(1, Math.round(1 / ratio));
    const picked: typeof rawShisha = [];
    let runningSum = 0;

    for (let i = 0; i < sorted.length; i += step) {
      const r = sorted[i];
      if (runningSum + r.total <= targetShishaCap + 20) {
        picked.push(r);
        runningSum += r.total;
      }
    }

    const remaining = sorted.filter((s) => !picked.includes(s));
    for (const r of remaining) {
      if (runningSum + r.total <= targetShishaCap) {
        picked.push(r);
        runningSum += r.total;
      }
    }

    picked.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return picked;
  }, [filteredItemSales, products, tenant.categories, shishaCapActive, targetShishaCap]);

  const dailyTobaccoSummary = useMemo(() => {
    const map: Record<string, {
      dateStr: string;
      rawDate: Date;
      orderIds: Set<string>;
      tobaccoItemCount: number;
      grossTotal: number;
    }> = {};

    shishaTobaccoSales.forEach((r) => {
      const dObj = new Date(r.rawDate);
      const key = dObj.toISOString().slice(0, 10);
      const dateStr = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      if (shishaStartDate) {
        const start = new Date(shishaStartDate);
        start.setHours(0, 0, 0, 0);
        if (dObj < start) return;
      }
      if (shishaEndDate) {
        const end = new Date(shishaEndDate);
        end.setHours(23, 59, 59, 999);
        if (dObj > end) return;
      }

      if (!map[key]) {
        map[key] = {
          dateStr,
          rawDate: dObj,
          orderIds: new Set<string>(),
          tobaccoItemCount: 0,
          grossTotal: 0,
        };
      }
      map[key].orderIds.add(r.orderNumber);
      map[key].tobaccoItemCount += r.quantity;
      map[key].grossTotal += r.total;
    });

    const rows = Object.values(map).map((row) => {
      const invoiceCount = row.orderIds.size || 1;
      const tobaccoItemCount = row.tobaccoItemCount;
      const grossTotal = Number(row.grossTotal.toFixed(2));
      const vatRate = tenant.taxRatePct || 15;
      const vatAmount = Number(((grossTotal * vatRate) / (100 + vatRate)).toFixed(2));
      const netBasePrice = Number((grossTotal - vatAmount).toFixed(2));
      // Tobacco Selective Tax (100% selective tax on base price before VAT): 50% of net base
      const tobaccoTax = Number((netBasePrice * 0.5).toFixed(2));
      const netAfter = Number((netBasePrice - tobaccoTax).toFixed(2));

      return {
        invoiceDate: row.dateStr,
        rawDate: row.rawDate,
        invoiceCount,
        tobaccoItemCount,
        grossTotal,
        tobaccoTax,
        vatAmount,
        netAfter,
      };
    });

    rows.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    return rows;
  }, [shishaTobaccoSales, shishaStartDate, shishaEndDate, tenant.taxRatePct]);

  const tobaccoSummaryTotals = useMemo(() => {
    return dailyTobaccoSummary.reduce(
      (acc, r) => ({
        invoiceCount: acc.invoiceCount + r.invoiceCount,
        tobaccoItemCount: acc.tobaccoItemCount + r.tobaccoItemCount,
        grossTotal: acc.grossTotal + r.grossTotal,
        tobaccoTax: acc.tobaccoTax + r.tobaccoTax,
        vatAmount: acc.vatAmount + r.vatAmount,
        netAfter: acc.netAfter + r.netAfter,
      }),
      { invoiceCount: 0, tobaccoItemCount: 0, grossTotal: 0, tobaccoTax: 0, vatAmount: 0, netAfter: 0 }
    );
  }, [dailyTobaccoSummary]);

  const handlePrintTobaccoReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    const rowsHtml =
      dailyTobaccoSummary.length === 0
        ? `<tr><td colspan="7" style="text-align:center; padding: 20px; font-family:sans-serif;">لا توجد بيانات مبيعات تبغ مسجلة في هذه الفترة.</td></tr>`
        : dailyTobaccoSummary
            .map(
              (row) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: sans-serif;">${row.invoiceDate}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${row.invoiceCount}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #92400e;">${row.tobaccoItemCount}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${row.grossTotal.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">${row.tobaccoTax.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #4338ca;">${row.vatAmount.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #047857;">${row.netAfter.toFixed(2)}</td>
          </tr>
        `
            )
            .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير ضريبة التبغ - Tobacco Tax Summary</title>
        <style>
          body { font-family: Tahoma, sans-serif; padding: 20px; color: #0f172a; direction: rtl; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 22px; font-weight: 900; }
          .header h3 { margin: 4px 0 0; font-size: 14px; color: #475569; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 12px; margin-bottom: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 15px; }
          .info-item { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
          .info-label { font-weight: bold; color: #64748b; }
          .info-val { font-weight: bold; color: #0f172a; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px; }
          th { background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: bold; }
          th span { display: block; font-size: 9px; color: #64748b; font-weight: normal; }
          tfoot tr { background: #e2e8f0; font-weight: bold; font-family: monospace; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>تقرير ضريبة التبغ</h2>
          <h3>Tobacco Tax Summary</h3>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">رقم سجل ضريبة القيمة المضافة # (VAT #):</span>
            <span class="info-val">${tenant.taxNumber || '310160225800003'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">إسم المؤسسة / الشركة (Company):</span>
            <span class="info-val">${tenant.legalName || tenant.name || 'مطعم ومقهى لافا'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">العنوان (Address):</span>
            <span class="info-val">${tenant.address || 'شارع عثمان بن عفان - الرياض'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">رقم الاتصال (Phone):</span>
            <span class="info-val">${tenant.phone || '0550403004'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">رقم تصريح التبغ (Tobacco Permit #):</span>
            <span class="info-val" style="color: #b45309;">${tenant.tobaccoPermitNumber || '40092179646'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">الفترة الزمنية (Period):</span>
            <span class="info-val">${shishaStartDate || '01/02/2026'} إلى ${shishaEndDate || '28/02/2026'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>تاريخ الفاتورة<span>Invoice Date</span></th>
              <th style="text-align: center;">عدد الفواتير<span>Invoice Count</span></th>
              <th style="text-align: center;">عدد عنصر التبغ<span>Tobacco Item Count</span></th>
              <th style="text-align: right;">إجمالي البيع شامل ضريبة القيمة المضافة والتبغ<span>Net amount with vat and tabocco tax</span></th>
              <th style="text-align: right;">ضريبة التبغ (الضريبة الانتقائية)<span>Tobacco Selective Tax (100%)</span></th>
              <th style="text-align: right;">قيمة ضريبة القيمة المضافة<span>VAT Amount</span></th>
              <th style="text-align: right;">صافي الدخل بعد خصم ضريبة القيمة المضافة والتبغ<span>Net Amount After VAT & Tobacco Tax</span></th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          ${
            dailyTobaccoSummary.length > 0
              ? `
            <tfoot>
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: sans-serif;">الإجمالي - Total</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${tobaccoSummaryTotals.invoiceCount}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #92400e;">${tobaccoSummaryTotals.tobaccoItemCount}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">${tobaccoSummaryTotals.grossTotal.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">${tobaccoSummaryTotals.tobaccoTax.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #4338ca;">${tobaccoSummaryTotals.vatAmount.toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #047857; font-weight: 900;">${tobaccoSummaryTotals.netAfter.toFixed(2)}</td>
              </tr>
            </tfoot>
          `
              : ''
          }
        </table>

        <div class="signatures">
          <div>
            <strong>إعداد المسؤول المالي:</strong>
            <p style="margin-top: 20px;">التوقيع: ........................................</p>
          </div>
          <div>
            <strong>اعتماد الإدارة / صاحب المنشأة:</strong>
            <p style="margin-top: 20px;">الختم الرسمي: ........................................</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportTobaccoReportCSV = () => {
    const headers = isAr
      ? [
          'تاريخ الفاتورة',
          'عدد الفواتير',
          'عدد عنصر التبغ',
          'إجمالي البيع شامل ضريبة القيمة المضافة والتبغ',
          'ضريبة التبغ (25 ريال لكل عنصر)',
          'قيمة ضريبة القيمة المضافة',
          'صافي الفاتورة بعد خصم الضريبة والتبغ',
        ]
      : [
          'Invoice Date',
          'Invoice Count',
          'Tobacco Item Count',
          'Net Amount With VAT & Tobacco Tax',
          'Tobacco Tax 25 SAR Per Unit',
          'VAT Amount',
          'Net Amount After VAT And Tobacco Tax',
        ];

    const rows = dailyTobaccoSummary.map((r) => [
      `"${r.invoiceDate}"`,
      r.invoiceCount,
      r.tobaccoItemCount,
      r.grossTotal.toFixed(2),
      r.tobaccoTax.toFixed(2),
      r.vatAmount.toFixed(2),
      r.netAfter.toFixed(2),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tobacco_tax_summary_${tenant.slug || 'report'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyShishaTargetCap = async () => {
    const confirmMsg = isAr
      ? `هل أنت متأكد من تطبيق سقف مبيعات الشيشة (${targetShishaCap} ${tenant.currency})؟\n\n1. سيتم أولاً تنزيل نسخة احتياطية لتقرير الشيشة الأصلي بالكامل.\n2. سيتم حذف الفواتير غير المشمولة بالسقف من النظام وإعادة ضبط المحاسبة والمخزون وفقاً لآلية التوزيع الزمني المتوازن.`
      : `Are you sure you want to apply Shisha target cap (${targetShishaCap} ${tenant.currency})?\n\n1. Original full backup report will be downloaded.\n2. Excluded invoices will be removed from system.`;

    if (!confirm(confirmMsg)) return;

    setIsReflectingShisha(true);
    try {
      // 1. Export backup CSV first
      exportTobaccoReportCSV();
      await new Promise((r) => setTimeout(r, 400));

      // 2. Compute kept orders
      const paidOrders = orders.filter((o) => o.status === 'PAID');
      const shishaOrderIds = new Set<string>();
      shishaTobaccoSales.forEach((r) => {
        if (r.orderId) shishaOrderIds.add(r.orderId);
      });

      const rawShisha = itemSalesDetails.filter((r) => {
        const p = products.find((prod) => prod.id === r.productId || prod.name === r.itemName || prod.nameAr === r.itemName);
        const catName = (p?.categoryName || '').toLowerCase();
        const itemName = (r.itemName || '').toLowerCase();
        return (
          catName.includes('شيشة') ||
          catName.includes('shisha') ||
          catName.includes('tobacco') ||
          catName.includes('تبغ') ||
          itemName.includes('فاخر') ||
          itemName.includes('نخلة') ||
          itemName.includes('مكس') ||
          itemName.includes('عنب') ||
          itemName.includes('معسل')
        );
      });

      const sorted = [...rawShisha].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const originalShishaTotal = sorted.reduce((sum, r) => sum + r.total, 0);

      let pickedShisha = sorted;
      if (originalShishaTotal > targetShishaCap && targetShishaCap > 0) {
        const ratio = originalShishaTotal > 0 ? targetShishaCap / originalShishaTotal : 0.5;
        const step = Math.max(1, Math.round(1 / ratio));
        const picked: typeof rawShisha = [];
        let runningSum = 0;
        for (let i = 0; i < sorted.length; i += step) {
          const r = sorted[i];
          if (runningSum + r.total <= targetShishaCap + 20) {
            picked.push(r);
            runningSum += r.total;
          }
        }
        const remaining = sorted.filter((s) => !picked.includes(s));
        for (const r of remaining) {
          if (runningSum + r.total <= targetShishaCap) {
            picked.push(r);
            runningSum += r.total;
          }
        }
        pickedShisha = picked;
      }

      const keptShishaOrderIds = new Set(pickedShisha.map((r) => r.orderId));
      const keepOrderIds = paidOrders
        .filter((o) => !shishaOrderIds.has(o.id) || keptShishaOrderIds.has(o.id))
        .map((o) => o.id);

      // 3. Call backend API to reflect changes
      const res = await apiFetch(`/api/tenants/${tenant.id}/reflect-target-orders`, {
        method: 'POST',
        body: JSON.stringify({ keepOrderIds }),
      });

      if (res && res.success) {
        alert(
          isAr
            ? `تم تطبيق السقف وتحديث النظام بنجاح!\n- تم تنزيل النسخة الاحتياطية.\n- تم حذف ${res.removedOrdersCount} فاتورة مستبعدة.\n- تم تحديث مبيعات الشيشة والمحاسبة.`
            : `System updated successfully! Removed ${res.removedOrdersCount} excluded invoices.`
        );
        setShowShishaSecretPanel(false);
        if (onRefresh) onRefresh();
      } else {
        throw new Error(res?.error || 'Failed to update system');
      }
    } catch (err: any) {
      alert(err.message || (isAr ? 'حدث خطأ أثناء تطبيق السقف على النظام' : 'Error updating system'));
    } finally {
      setIsReflectingShisha(false);
    }
  };

  const aggregatedItemSummary = useMemo(() => {
    const map: Record<
      string,
      { name: string; station: string; quantity: number; revenue: number; unitPrice: number; orderCount: number }
    > = {};

    filteredItemSales.forEach((r) => {
      const key = `${r.itemName}___${r.station}`;
      if (!map[key]) {
        map[key] = {
          name: r.itemName,
          station: r.station,
          quantity: 0,
          revenue: 0,
          unitPrice: r.unitPrice,
          orderCount: 0,
        };
      }
      map[key].quantity += r.quantity;
      map[key].revenue = Number((map[key].revenue + r.total).toFixed(2));
      map[key].orderCount += 1;
      if (r.unitPrice > 0 && map[key].unitPrice === 0) {
        map[key].unitPrice = r.unitPrice;
      }
    });

    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [filteredItemSales]);

  const exportItemSalesCSV = () => {
    const headers = [
      isAr ? 'اسم الصنف' : 'Item Name',
      isAr ? 'نوع المطبخ / المحطة' : 'Kitchen Station',
      isAr ? 'رقم الطلب' : 'Order Number',
      isAr ? 'الكمية' : 'Quantity',
      isAr ? 'سعر الوحدة' : 'Unit Price',
      isAr ? 'إجمالي القيمة' : 'Total Revenue',
      isAr ? 'التاريخ والوقت' : 'Date & Time',
    ];

    const rows = filteredItemSales.map((r) =>
      [
        `"${r.itemName.replace(/"/g, '""')}"`,
        `"${getStationLabel(r.station).replace(/"/g, '""')}"`,
        `"${r.orderNumber}"`,
        r.quantity,
        r.unitPrice,
        r.total,
        `"${r.date}"`,
      ].join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const stationLabelTag = selectedKitchenStations.includes('ALL') || selectedKitchenStations.length === 0
      ? 'all_kitchens'
      : selectedKitchenStations.join('_').toLowerCase();
    link.setAttribute(
      'download',
      `chef_item_sales_${stationLabelTag}_${itemReportPeriod.toLowerCase()}_${tenant.slug || 'report'}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

    const operatingExpenses = summary?.operatingExpenses ?? 4500;
  const netProfit = summary?.netProfit ?? Number((grossProfit - operatingExpenses).toFixed(2));

  // Payment Breakdown
  const paymentBreakdown = summary?.paymentBreakdown || {
    CASH: Number(paidOrders.filter((o) => o.paymentMethod === 'CASH').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    MADA: Number(paidOrders.filter((o) => o.paymentMethod === 'MADA').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    VISA: Number(paidOrders.filter((o) => o.paymentMethod === 'VISA').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    APPLE_PAY: Number(paidOrders.filter((o) => o.paymentMethod === 'APPLE_PAY').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    SPLIT: Number(paidOrders.filter((o) => o.paymentMethod === 'SPLIT').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (orderFilter === 'PAID' && order.status !== 'PAID') return false;
      if (orderFilter === 'OPEN' && (order.status === 'PAID' || order.status === 'VOIDED')) return false;
      if (orderFilter === 'VOIDED' && order.status !== 'VOIDED') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = order.orderNumber?.toLowerCase().includes(q);
        const matchCustomer = order.customerName?.toLowerCase().includes(q);
        const matchTable = order.tableName?.toLowerCase().includes(q);
        const matchMethod = order.paymentMethod?.toLowerCase().includes(q);
        const matchItems = order.items.some((i) => i.productName.toLowerCase().includes(q));
        return matchNumber || matchCustomer || matchTable || matchMethod || matchItems;
      }
      return true;
    });
  }, [orders, orderFilter, searchQuery]);

  // General Ledger audit totals
  const totalDebits = journals.reduce(
    (acc, j) => acc + j.lines.reduce((s, l) => s + (l.debit || 0), 0),
    0
  );
  const totalCredits = journals.reduce(
    (acc, j) => acc + j.lines.reduce((s, l) => s + (l.credit || 0), 0),
    0
  );
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const filteredJournals = useMemo(() => {
    if (!journalSearch.trim()) return journals;
    const q = journalSearch.toLowerCase();
    return journals.filter(
      (j) =>
        j.reference?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.lines.some((l) => l.accountCode.toLowerCase().includes(q) || l.accountName.toLowerCase().includes(q))
    );
  }, [journals, journalSearch]);

  return (
    <div id="accounting-view" className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Header Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSecretIconClick}
              className="p-1 -m-1 rounded-xl hover:bg-amber-500/10 active:scale-90 transition-all cursor-pointer focus:outline-none"
              title={isAr ? 'المحاسبة والقيود المالية' : 'Accounting & Financial Ledger'}
            >
              <FileSpreadsheet
                className={`w-5 h-5 text-amber-400 transition-all duration-200 ${
                  showSecretActions ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''
                }`}
              />
            </button>
            <h2 className="text-base font-extrabold text-white">
              {isAr ? 'المحاسبة والقيود المالية' : 'Accounting & Financial Ledger'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {branch?.name || (isAr ? 'الفرع الرئيسي' : 'Main Branch')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr
              ? 'مطابقة الإيرادات والطلبات اللحظية، قائمة الأرباح والخسائر، التدقيق الضريبي ZATCA والقيود المحاسبية'
              : 'Real-time orders revenue reconciliation, P&L statement, ZATCA tax audit & double-entry journals'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showSecretActions && (
            <>
              <button
                id="accounting-target-tax-btn"
                onClick={() => setShowTargetModal(true)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 text-xs font-bold shadow-sm animate-fade-in"
                title={isAr ? 'تصدير تقرير ضريبي بسقف مستهدف (مثال: 30,000 ر.س)' : 'Export tax report with target revenue cap (e.g. 30k SAR)'}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{isAr ? 'تصدير بسقف مستهدف (30 ألف)' : 'Target Cap Export (30k)'}</span>
              </button>

              <button
                id="accounting-clear-orders-btn"
                onClick={handleClearAllOrders}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1.5 text-xs font-semibold animate-fade-in"
                title={isAr ? 'تصفير كافة الطلبات التجريبية وإعادة الحسابات' : 'Clear all test orders and reset accounting'}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">{isAr ? 'تصفير الطلبات' : 'Clear All Orders'}</span>
              </button>
            </>
          )}

          {onRefresh && (
            <button
              id="accounting-refresh-btn"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title={isAr ? 'تحديث البيانات المالية' : 'Refresh financial data'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              id="tab-orders-audit"
              onClick={() => setActiveTab('ORDERS')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'ORDERS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isAr ? `الطلبات والإيرادات (${orders.length})` : `Orders & Revenue (${orders.length})`}</span>
            </button>
            <button
              id="tab-pl-statement"
              onClick={() => setActiveTab('PL')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'PL'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAr ? 'الأرباح والخسائر' : 'P&L Statement'}</span>
            </button>
            <button
              id="tab-item-reports"
              onClick={() => setActiveTab('ITEMS')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'ITEMS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقارير الأصناف (الشيف)' : 'Item Reports (Chef)'}</span>
            </button>
            <button
              id="tab-shisha-tobacco"
              onClick={() => setActiveTab('SHISHA_TOBACCO')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'SHISHA_TOBACCO'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقرير الشيشة والتبغ' : 'Shisha & Tobacco'}</span>
            </button>
            <button
              id="tab-general-ledger"
              onClick={() => setActiveTab('JOURNALS')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'JOURNALS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isAr ? `دفتر الأستاذ (${journals.length})` : `General Ledger (${journals.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: ORDERS & REVENUE AUDIT */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {/* Top Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Total Orders Amount */}
            <div id="kpi-all-orders-amount" className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isAr ? 'إجمالي قيمة الطلبات' : 'Total Orders Amount'}</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1.5">
                {allOrdersAmount.toFixed(2)} <span className="text-sm font-bold text-slate-400">{tenant.currency}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-400">{paidOrders.length} {isAr ? 'مدفوع' : 'Paid'}</span> + <span className="font-semibold text-amber-400">{openOrders.length} {isAr ? 'نشط' : 'In-Flight'}</span> ({orders.length} {isAr ? 'إجمالي' : 'total'})
              </p>
            </div>

            {/* Paid Settled Revenue */}
            <div id="kpi-settled-revenue" className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isAr ? 'الإيرادات المحصلة (المسددة)' : 'Settled Revenue (Paid)'}</span>
                <CheckCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1.5">
                {totalCollected.toFixed(2)} <span className="text-sm font-bold text-slate-400">{tenant.currency}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? 'الصافي:' : 'Net:'} <span className="text-white font-medium">{netSales.toFixed(2)}</span> | {isAr ? 'الضريبة:' : 'Tax:'} <span className="text-indigo-300 font-medium">{taxCollected.toFixed(2)}</span>
              </p>
            </div>
            {/* Daily & Monthly Sales Card */}
            <div id="kpi-daily-monthly-sales" className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isAr ? 'المبيعات اليومية والشهرية' : 'Daily & Monthly Sales'}</span>
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">{isAr ? 'اليوم' : 'Today'}</div>
                  <div className="text-sm font-black text-white">{dailySales.toFixed(2)} <span className="text-[9px] text-slate-400">{tenant.currency}</span></div>
                </div>
                <div className="h-7 w-px bg-slate-800 mx-1" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">{isAr ? 'الشهر' : 'Month'}</div>
                  <div className="text-sm font-black text-emerald-400">{monthlySales.toFixed(2)} <span className="text-[9px] text-slate-400">{tenant.currency}</span></div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'إيرادات مسددة' : 'Settled revenues'}
              </p>
            </div>

            {/* In-Flight / Open Orders Value */}
            <div id="kpi-open-orders-value" className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>{isAr ? 'الطلبات النشطة (غير مسددة)' : 'Active In-Flight Orders'}</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-1.5">
                {openOrdersTotal.toFixed(2)} <span className="text-sm font-bold text-slate-400">{tenant.currency}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {openOrdersCount} {isAr ? 'طلب قيد التحضير في المطبخ والصالة' : `order${openOrdersCount === 1 ? '' : 's'} in kitchen & floor`}
              </p>
            </div>

            {/* Tax & Discount Summary */}
            <div id="kpi-tax-summary" className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>{tenant.taxName || (isAr ? 'ضريبة القيمة المضافة' : 'Output Tax')}</span>
                <Receipt className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400 mt-1.5">
                {taxCollected.toFixed(2)} <span className="text-sm font-bold text-slate-400">{tenant.currency}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? 'إجمالي الخصومات:' : 'Discounts given:'} <span className="text-rose-300 font-medium">{(discounts ?? 0).toFixed(2)} {tenant.currency}</span>
              </p>
            </div>
          </div>

          {/* Payment Method Settlement Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'تفصيل تسوية طرق الدفع (الطلبات المسددة)' : 'Payment Settlement Breakdown (Settled Orders)'}</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? 'الإجمالي:' : 'Total:'} <span className="text-white font-bold">{totalCollected.toFixed(2)} {tenant.currency}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>{isAr ? 'صندوق النقدية (الكاش)' : 'Cash Register Till'}</span>
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {(paymentBreakdown.CASH ?? 0).toFixed(2)} {tenant.currency}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isAr ? 'حساب 1010' : 'Account 1010'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>{isAr ? 'بطاقات مدى' : 'MADA Debit Cards'}</span>
                  <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {(paymentBreakdown.MADA ?? 0).toFixed(2)} {tenant.currency}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isAr ? 'حساب 1020 (وسيط)' : 'Account 1020 (Clearing)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>{isAr ? 'فيزا / ماستركارد' : 'Visa / Mastercard'}</span>
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {(paymentBreakdown.VISA ?? 0).toFixed(2)} {tenant.currency}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isAr ? 'حساب 1020 (وسيط)' : 'Account 1020 (Clearing)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>{isAr ? 'أبل باي' : 'Apple Pay'}</span>
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  {(paymentBreakdown.APPLE_PAY ?? 0).toFixed(2)} {tenant.currency}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isAr ? 'حساب 1020 (وسيط)' : 'Account 1020 (Clearing)'}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Audit Table Section */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  id="filter-orders-all"
                  onClick={() => setOrderFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    orderFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? `الكل (${orders.length})` : `All (${orders.length})`}
                </button>
                <button
                  id="filter-orders-paid"
                  onClick={() => setOrderFilter('PAID')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    orderFilter === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? `مدفوع (${paidOrders.length})` : `Paid (${paidOrders.length})`}
                </button>
                <button
                  id="filter-orders-open"
                  onClick={() => setOrderFilter('OPEN')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    orderFilter === 'OPEN' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? `نشط / مفتوح (${openOrders.length})` : `Active / Open (${openOrders.length})`}
                </button>
                {voidedOrders.length > 0 && (
                  <button
                    id="filter-orders-voided"
                    onClick={() => setOrderFilter('VOIDED')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      orderFilter === 'VOIDED' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? `ملغى (${voidedOrders.length})` : `Voided (${voidedOrders.length})`}
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="orders-search-input"
                  type="text"
                  placeholder={isAr ? 'بحث برقم الطلب، اسم العميل، الصنف...' : 'Search order #, guest, item...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ltr:pl-8 ltr:pr-3 rtl:pr-8 rtl:pl-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Orders Data Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table id="orders-amount-table" className="w-full ltr:text-left rtl:text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'النوع / الوجهة' : 'Type / Destination'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'العميل والموظف' : 'Guest & Staff'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'ملخص الأصناف' : 'Items Summary'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left">{isAr ? 'المجموع الفرعي' : 'Subtotal'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left">{isAr ? 'الخصم' : 'Discount'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left">{isAr ? 'الضريبة (15%)' : 'Tax (15%)'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left font-bold text-white">{isAr ? 'إجمالي الطلب' : 'Order Amount'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'طريقة الدفع' : 'Payment'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500">
                        {isAr ? 'لا توجد طلبات تطابق الفلتر المحدد.' : 'No orders match the selected filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isPaid = order.status === 'PAID';
                      const isVoided = order.status === 'VOIDED';

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-900/40 transition-colors"
                        >
                          {/* Order Number & Timestamp */}
                          <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                            <div>{order.orderNumber}</div>
                            <div className="text-[10px] text-slate-500 font-normal font-sans">
                              {order.paidAt
                                ? new Date(order.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Type / Destination */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                              {order.type === 'DINE_IN' ? (isAr ? 'محلي' : 'Dine-In') : order.type === 'TAKEAWAY' ? (isAr ? 'سفري' : 'Takeaway') : order.type === 'DELIVERY' ? (isAr ? 'توصيل' : 'Delivery') : order.type}
                            </span>
                            {order.tableName && (
                              <span className="ml-1.5 text-xs text-amber-400 font-semibold">
                                {order.tableName}
                              </span>
                            )}
                          </td>

                          {/* Customer & Staff */}
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-200 truncate max-w-[120px]">
                              {order.customerName || (isAr ? 'عميل' : 'Guest')}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {order.waiterName || order.cashierName || (isAr ? 'كاشير' : 'Cashier')}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : isVoided
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {isPaid ? (isAr ? 'مدفوع' : 'PAID') : isVoided ? (isAr ? 'ملغى' : 'VOIDED') : (isAr ? 'نشط' : 'OPEN')}
                            </span>
                          </td>

                          {/* Items Summary */}
                          <td className="py-3 px-3 text-slate-300 max-w-[180px]">
                            {(() => {
                              const activeItems = getActiveOrderItems(order);
                              return (
                                <>
                                  <div className="truncate text-[11px]" title={activeItems.map((i) => `${i.quantity}x ${getLocalizedName(i as any)}`).join(', ')}>
                                    {activeItems.map((i) => `${i.quantity}x ${getLocalizedName(i as any)}`).join(', ')}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {activeItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} {isAr ? 'عنصر' : 'items total'}
                                  </div>
                                </>
                              );
                            })()}
                          </td>

                          {/* Subtotal */}
                          <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono text-slate-300 whitespace-nowrap">
                            {(order.subtotal ?? 0).toFixed(2)}
                          </td>

                          {/* Discount */}
                          <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono whitespace-nowrap">
                            {(order.discountAmount ?? 0) > 0 ? (
                              <div className="flex flex-col items-end rtl:items-start">
                                <span className="text-rose-400 font-bold">
                                  -{(order.discountAmount ?? 0).toFixed(2)}
                                </span>
                                {(order.subtotal ?? 0) > 0 && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-sans font-bold">
                                    {Number((((order.discountAmount ?? 0) / order.subtotal) * 100).toFixed(1))}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">0.00</span>
                            )}
                          </td>

                          {/* Tax Amount */}
                          <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono text-indigo-300 whitespace-nowrap">
                            {(order.taxAmount ?? 0).toFixed(2)}
                          </td>

                          {/* Total Order Amount */}
                          <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono font-bold text-white text-sm whitespace-nowrap">
                            {(order.total ?? 0).toFixed(2)} <span className="text-[10px] text-slate-400">{tenant.currency}</span>
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {order.paymentMethod ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-teal-300 border border-teal-500/20">
                                {order.paymentMethod}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">{isAr ? 'غير مسدد' : 'Unpaid'}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {onViewReceipt && (
                                <button
                                  onClick={() => onViewReceipt(order)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                  title={isAr ? 'عرض الفاتورة الحرارية' : 'View Thermal Receipt'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteOrder(order)}
                                disabled={deletingOrderId === order.id}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition disabled:opacity-50"
                                title={isAr ? 'مسح الطلب وإرجاع كميات المكونات للمخزون' : 'Delete Order & Restore Stock'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Table Footer with Verified Totals */}
                {filteredOrders.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 bg-slate-900 font-semibold text-xs text-white">
                      <td colSpan={5} className="py-3 px-3">
                        {isAr ? `إجمالي لعدد ${filteredOrders.length} طلب معروض:` : `Total for ${filteredOrders.length} displayed order${filteredOrders.length === 1 ? '' : 's'}:`}
                      </td>
                      <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono">
                        {filteredOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono text-rose-400">
                        -{filteredOrders.reduce((acc, o) => acc + (o.discountAmount || 0), 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono text-indigo-300">
                        {filteredOrders.reduce((acc, o) => acc + (o.taxAmount || 0), 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono font-black text-amber-400 text-sm">
                        {filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2)} {tenant.currency}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: P&L STATEMENT & EXECUTIVE MARGINS */}
      {activeTab === 'PL' && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">{isAr ? 'إجمالي الإيرادات المباشرة' : 'Gross Sales Revenue'}</span>
              <div className="text-2xl font-black text-white mt-1">
                {grossSales.toFixed(2)} {tenant.currency}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{paidOrders.length} {isAr ? 'فاتورة مدفوعة محصلة' : 'paid checks collected'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">{tenant.taxName || (isAr ? 'ضريبة القيمة المضافة' : 'Output Tax')} {isAr ? 'المستحقة' : 'Payable'}</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {taxCollected.toFixed(2)} {tenant.currency}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{isAr ? 'مستحقة لهيئة الزكاة والضريبة' : 'Accrued to Tax Authority'} ({tenant.taxRatePct}%)</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">{isAr ? 'تكلفة البضاعة المباعة (المكونات COGS)' : 'COGS (BOM Food Cost)'}</span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {cogs.toFixed(2)} {tenant.currency}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {isAr ? 'نسبة تكلفة الطعام:' : 'Food Cost Ratio:'} <span className="font-bold text-amber-400">{foodCostPct.toFixed(1)}%</span> ({isAr ? 'المستهدف الأقل من 32%' : 'Industry target <32%'})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">{isAr ? 'إجمالي هامش الربح' : 'Gross Margin Profit'}</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {grossProfit.toFixed(2)} {tenant.currency}
              </div>
              <p className="text-[10px] text-emerald-500/80 mt-1 font-semibold">
                {grossMarginPct.toFixed(1)}% {isAr ? 'هامش أرباح إجمالي' : 'Gross Margin'}
              </p>
            </div>
          </div>

          {/* Secondary Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">{isAr ? 'صافي المبيعات (خالي من الضريبة والخصم)' : 'Net Food Sales (Excl. Discounts & Tax)'}</span>
              <div className="text-lg font-bold text-white mt-0.5">
                {netSales.toFixed(2)} {tenant.currency}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">{isAr ? 'متوسط قيمة الفاتورة (AOV)' : 'Average Order Value (AOV)'}</span>
              <div className="text-lg font-bold text-white mt-0.5">
                {avgOrderValue.toFixed(2)} {tenant.currency} / {isAr ? 'فاتورة' : 'check'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">{isAr ? 'صافي الربح التشغيلي (بعد المصاريف)' : 'Net Operating Profit (After Overhead)'}</span>
              <div className={`text-lg font-bold mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netProfit.toFixed(2)} {tenant.currency}
              </div>
            </div>
          </div>

          {/* Executive Income Statement (P&L Breakdown) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {isAr ? 'قائمة الأرباح والخسائر التنفيذية (P&L)' : 'Executive Income Statement (P&L)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr ? 'مطابقة ومحسوبة من طلبات العملاء المسددة واستهلاك الوصفات والمكونات' : 'Reconciled against settled customer orders & BOM ingredient consumption'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800">
                {isAr ? 'الفترة: الوردية التشغيلية الحالية' : 'Period: Current Operating Shift'}
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs font-mono">
              <div className="py-2.5 flex justify-between font-sans">
                <span className="text-slate-300 font-semibold">{isAr ? '1. إجمالي مبيعات المأكولات والمشروبات' : '1. Gross Food & Beverage Sales'}</span>
                <span className="font-bold text-white">
                  {grossSales.toFixed(2)} {tenant.currency}
                </span>
              </div>

              <div className="py-2.5 flex justify-between font-sans text-rose-400">
                <span>{isAr ? '2. يطرح: الخصومات الترويجية والقسائم' : '2. Less: Promotional Discounts & Comp Vouchers'}</span>
                <span className="font-bold">
                  -{discounts.toFixed(2)} {tenant.currency}
                </span>
              </div>

              <div className="py-2.5 flex justify-between font-sans bg-slate-950/40 px-2 rounded-lg font-bold text-white">
                <span>{isAr ? '3. صافي إيرادات المبيعات (الإيراد الأساسي)' : '3. Net Sales Revenue (Base Revenue)'}</span>
                <span className="text-amber-400">
                  {netSales.toFixed(2)} {tenant.currency}
                </span>
              </div>

              <div className="py-2.5 flex justify-between font-sans text-rose-400">
                <span>{isAr ? '4. يطرح: تكلفة البضاعة المباعة (استهلاك المكونات بالمستودع)' : '4. Less: Cost of Goods Sold (BOM Recipe Ingredients Consumed)'}</span>
                <span className="font-bold">
                  -{cogs.toFixed(2)} {tenant.currency} ({foodCostPct.toFixed(1)}%)
                </span>
              </div>

              <div className="py-3 flex justify-between font-sans text-sm font-bold bg-slate-950/70 px-3 rounded-xl border border-slate-800 my-1">
                <span className="text-white">{isAr ? '5. إجمالي الربح التشغيلي (هامش الأرباح)' : '5. Gross Operating Profit (Gross Margin)'}</span>
                <span className="text-emerald-400 font-extrabold">
                  {grossProfit.toFixed(2)} {tenant.currency} ({grossMarginPct.toFixed(1)}%)
                </span>
              </div>

              <div className="py-2.5 flex justify-between font-sans text-slate-400">
                <span>{isAr ? '6. يطرح: المصاريف التشغيلية الموزعة (الأجور، الخدمات، الإيجار)' : '6. Less: Allocated Operating Expenses (Labor, Utilities, Rent)'}</span>
                <span className="font-semibold text-slate-300">
                  -{operatingExpenses.toFixed(2)} {tenant.currency}
                </span>
              </div>

              <div className="py-3 flex justify-between font-sans text-sm font-bold bg-slate-950/90 px-3 rounded-xl border border-slate-800">
                <span className="text-white">{isAr ? '7. صافي الدخل / الربح التشغيلي' : '7. Net Operating Income / Profit'}</span>
                <span className={`font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netProfit.toFixed(2)} {tenant.currency}
                </span>
              </div>

              <div className="py-2.5 flex justify-between font-sans text-slate-400 pt-3">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'ضريبة القيمة المضافة المستحقة (حساب 2200 - التزام بالميزانية، غير مستبعدة من إيرادات P&L)' : 'Output VAT Payable (Account 2200 - Balance sheet liability, excluded from P&L revenue)'}</span>
                </span>
                <span className="font-semibold text-indigo-400">
                  {taxCollected.toFixed(2)} {tenant.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DETAILED ITEM SALES REPORT (CHEF PAYMENTS & AUDIT) */}
      {activeTab === 'ITEMS' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Top Control & Filter Header */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    {isAr ? 'تقرير مبيعات الأصناف التفصيلي (حساب مستحقات الشيف والكميات)' : 'Itemized Sales & Chef Production Report'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr
                    ? 'تفصيل دقيق للأصناف المباعة حسب نوع المطبخ والتاريخ: الكميات، أسعار الوحدات، وأرقام الطلبات المرتبطة'
                    : 'Detailed sales breakdown filtered by kitchen station & date range: sold quantities, unit pricing, and order audit trail'}
                </p>
              </div>

              {/* CSV Export Button */}
              <button
                type="button"
                onClick={exportItemSalesCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                <span>{isAr ? 'تصدير كملف Excel (CSV)' : 'Export CSV'}</span>
              </button>
            </div>

            {/* Filter Control Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. Multi-Select Kitchen Station Filter Badges & Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
                  <div className="flex items-center gap-1 px-1.5 text-amber-400 font-bold shrink-0">
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 text-[11px] hidden sm:inline">{isAr ? 'تصفية حسب المطبخ:' : 'Filter Kitchens:'}</span>
                  </div>

                  {/* All Kitchens Pill Button */}
                  <button
                    type="button"
                    onClick={() => toggleKitchenStation('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isKitchenStationSelected('ALL')
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{isAr ? 'كافة المطابخ' : 'All Kitchens'}</span>
                  </button>

                  {/* Individual Kitchen Pill Buttons for Multi-Selection */}
                  {availableKitchenStations.map((st) => {
                    const isSelected = isKitchenStationSelected(st);
                    return (
                      <button
                        type="button"
                        key={st}
                        onClick={() => toggleKitchenStation(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                        }`}
                        title={isAr ? `انقر لتحديد/إلغاء مطبخ ${getStationLabel(st)}` : `Toggle ${getStationLabel(st)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`} />
                        <span>{getStationLabel(st)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Period Selector Buttons */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setItemReportPeriod('DAILY');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      itemReportPeriod === 'DAILY'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? 'اليومي (اليوم)' : 'Daily'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemReportPeriod('MONTHLY');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      itemReportPeriod === 'MONTHLY'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? 'الشهري' : 'Monthly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemReportPeriod('CUSTOM');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      itemReportPeriod === 'CUSTOM'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? 'تاريخ مخصص' : 'Custom Range'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemReportPeriod('ALL');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      itemReportPeriod === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? `كافة الطلبات` : `All Time`}
                  </button>
                </div>

                {/* 3. Start Date & End Date Inputs */}
                {(itemReportPeriod === 'CUSTOM' || itemStartDate || itemEndDate) && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-amber-500/30 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-400 text-[11px] font-medium">{isAr ? 'من تاريخ:' : 'From Date:'}</span>
                      <input
                        type="date"
                        value={itemStartDate}
                        onChange={(e) => {
                          setItemStartDate(e.target.value);
                          setItemReportPeriod('CUSTOM');
                        }}
                        className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px] font-medium">{isAr ? 'إلى تاريخ:' : 'To Date:'}</span>
                      <input
                        type="date"
                        value={itemEndDate}
                        onChange={(e) => {
                          setItemEndDate(e.target.value);
                          setItemReportPeriod('CUSTOM');
                        }}
                        className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Reset Filters Button */}
                {(!selectedKitchenStations.includes('ALL') || itemStartDate || itemEndDate || itemReportPeriod !== 'ALL' || itemSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKitchenStations(['ALL']);
                      setItemReportPeriod('ALL');
                      setItemStartDate('');
                      setItemEndDate('');
                      setItemSearchQuery('');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition"
                    title={isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset All Filters'}
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isAr ? 'تصفير الفلاتر' : 'Reset'}</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث باسم الصنف أو الطلب...' : 'Search item or order...'}
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full ltr:pl-9 rtl:pr-9 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Top KPI Cards for Chef / Kitchen Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                {isAr ? 'إجمالي الكميات المباعة (الأطباق)' : 'Total Items / Dishes Sold'}
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {filteredItemSales.reduce((acc, r) => acc + r.quantity, 0)}{' '}
                <span className="text-xs text-slate-400 font-medium">{isAr ? 'قطعة / طبق' : 'dishes'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {!selectedKitchenStations.includes('ALL') && selectedKitchenStations.length > 0
                  ? `${isAr ? 'المطابخ المحددة:' : 'Kitchens:'} ${selectedKitchenStations.map((s) => getStationLabel(s)).join(', ')}`
                  : isAr
                  ? 'من واقع فواتير النظام الحالية (كافة المطابخ)'
                  : 'Computed from real system sales (all stations)'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                {isAr ? 'إجمالي قيمة الأصناف المباعة' : 'Gross Items Revenue'}
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {filteredItemSales.reduce((acc, r) => acc + r.total, 0).toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-medium">{tenant.currency}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'إجمالي السعر قبل الضريبة' : 'Net item sales'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                {isAr ? 'عدد الأصناف المنفذة' : 'Distinct Items Cooked'}
              </span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {aggregatedItemSummary.length}{' '}
                <span className="text-xs text-slate-400 font-medium">{isAr ? 'صنف مختلف' : 'distinct items'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'أصناف تم إعدادها وبيعها' : 'Unique menu items sold'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                {isAr ? 'عدد الطلبات المشمولة' : 'Covered Orders Count'}
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {new Set(filteredItemSales.map((r) => r.orderNumber)).size}{' '}
                <span className="text-xs text-slate-400 font-medium">{isAr ? 'طلب / فاتورة' : 'orders'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr
                  ? `الفترة: ${
                      itemReportPeriod === 'DAILY'
                        ? 'اليوم'
                        : itemReportPeriod === 'MONTHLY'
                        ? 'هذا الشهر'
                        : itemReportPeriod === 'CUSTOM'
                        ? 'تاريخ مخصص'
                        : 'الكل'
                    }`
                  : `Period: ${itemReportPeriod}`}
              </p>
            </div>
          </div>

          {/* TABLE 1: Aggregated Chef Summary Table (Total per Item) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'ملخص كميات كل صنف مباع (لحساب مستحقات الشيف والإنتاج)' : 'Item Aggregation & Chef Production Summary'}</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr ? 'مرتب حسب الأكثر مبيعاً وإعداداً في المطبخ مع توضيح نوع المطبخ/المحطة' : 'Sorted by most prepared & sold items, specifying kitchen station'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full ltr:text-left rtl:text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isAr ? 'اسم الصنف في المنيو' : 'Menu Item Name'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'نوع المطبخ / المحطة' : 'Kitchen Station'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'عدد مرات الطلب' : 'Orders Count'}</th>
                    <th className="py-2.5 px-3 text-center font-bold text-amber-400">{isAr ? 'إجمالي الكمية المباعة' : 'Total Qty Sold'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left font-bold text-white">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {aggregatedItemSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {isAr
                          ? 'لا توجد أصناف مسجلة في هذه الفترة/المطبخ المحدد. يمكنك الضغط على "كافة الفترات" أو "تصفير الفلاتر".'
                          : 'No item records found for this period/kitchen filter. Try selecting "All Time" or reset filters.'}
                      </td>
                    </tr>
                  ) : (
                    aggregatedItemSummary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{item.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-900 text-amber-300 border border-slate-700/80 inline-flex items-center gap-1 shadow-sm">
                            <ChefHat className="w-3 h-3 text-amber-400" />
                            <span>{getStationLabel(item.station)}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">{item.orderCount}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 font-mono text-xs">
                            {item.quantity} {isAr ? 'قطعة' : 'qty'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 ltr:text-right rtl:text-left font-mono text-slate-300">
                          {item.unitPrice.toFixed(2)} {tenant.currency}
                        </td>
                        <td className="py-2.5 px-3 ltr:text-right rtl:text-left font-mono font-black text-emerald-400">
                          {item.revenue.toFixed(2)} {tenant.currency}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: Detailed Line-by-Line Item Sales per Order Number */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'تفاصيل كل عملية بيع برقم الطلب والتاريخ (سجل تدقيق كامل)' : 'Item-by-Item Transaction Audit Log (Assigned Order Numbers)'}</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr ? `إجمالي العمليات المسجلة: ${filteredItemSales.length} حركة` : `Total item sale records: ${filteredItemSales.length}`}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full ltr:text-left rtl:text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'نوع المطبخ / المحطة' : 'Kitchen Station'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="py-2.5 px-3 ltr:text-right rtl:text-left font-bold text-white">{isAr ? 'الإجمالي' : 'Total'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'الوقت والتاريخ' : 'Date & Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredItemSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {isAr ? 'لا توجد حركات مسجلة.' : 'No records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItemSales.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{r.orderNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{r.itemName}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-amber-300 border border-slate-700/80 inline-flex items-center gap-1">
                            <ChefHat className="w-2.5 h-2.5 text-amber-400" />
                            <span>{getStationLabel(r.station)}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-300 font-mono">{r.quantity}</td>
                        <td className="py-2.5 px-3 ltr:text-right rtl:text-left font-mono text-slate-300">
                          {r.unitPrice.toFixed(2)} {tenant.currency}
                        </td>
                        <td className="py-2.5 px-3 ltr:text-right rtl:text-left font-mono font-bold text-emerald-400">
                          {r.total.toFixed(2)} {tenant.currency}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{r.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SHISHA & TOBACCO SALES & TAX REPORT (OFFICIAL TOBACCO TAX SUMMARY) */}
      {activeTab === 'SHISHA_TOBACCO' && (
        <div className="space-y-4 animate-in print:p-0 print:m-0">
          {/* Action Header Bar (Hidden on print) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <Utensils
                  onClick={handleShishaIconSecretClick}
                  className="w-5 h-5 text-amber-400 cursor-pointer hover:scale-110 transition"
                  title={isAr ? 'انقر 3 مرات لفتح لوحة تعديل سقف الشيشة' : 'Click 3 times for hidden shisha target settings'}
                />
                <h3 className="text-sm font-extrabold text-white">
                  {isAr ? 'تقرير ضريبة التبغ (Tobacco Tax Summary)' : 'Tobacco Tax Summary Report'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'تقرير رسمي مطابق لصيغة هيئة الزكاة والضريبة والجمارك وحسب ترخيص بيع التبغ المسجل'
                  : 'Official tax summary report matching ZATCA tobacco tax reporting standards'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportTobaccoReportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'تصدير كملف Excel/CSV' : 'Export Excel/CSV'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrintTobaccoReport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                <span>{isAr ? 'طباعة التقرير الرسمي' : 'Print Official Report'}</span>
              </button>
            </div>
          </div>

          {showShishaSecretPanel && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 space-y-3 animate-in fade-in shadow-xl print:hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>{isAr ? 'لوحة التحكم المخفية لتعديل سقف مبيعات الشيشة المستهدف' : 'Hidden Shisha Target Cap Adjustment Panel'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowShishaSecretPanel(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-slate-900"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] text-slate-300 mb-1 font-semibold">
                    {isAr ? 'المبلغ المستهدف الجديد للشيشة (الحد الأقصى):' : 'Target Shisha Max Amount:'}
                  </label>
                  <input
                    type="number"
                    value={targetShishaCap}
                    onChange={(e) => setTargetShishaCap(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={isReflectingShisha}
                  onClick={handleApplyShishaTargetCap}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition mt-5 flex items-center gap-2"
                >
                  {isReflectingShisha ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>{isAr ? 'جارٍ تنزيل النسخة وتحديث النظام...' : 'Updating system...'}</span>
                    </>
                  ) : (
                    <span>{isAr ? 'تطبيق وضبط التقرير' : 'Apply & Adjust Report'}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Date Filter Bar */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3 text-xs print:hidden">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-semibold">{isAr ? 'من تاريخ:' : 'From Date:'}</span>
              <input
                type="date"
                value={shishaStartDate}
                onChange={(e) => setShishaStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-semibold">{isAr ? 'إلى تاريخ:' : 'To Date:'}</span>
              <input
                type="date"
                value={shishaEndDate}
                onChange={(e) => setShishaEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            {(shishaStartDate || shishaEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setShishaStartDate('');
                  setShishaEndDate('');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>

          {/* OFFICIAL PDF DOCUMENT FORMAT CONTAINER */}
          <div className="p-6 sm:p-8 bg-white text-slate-900 rounded-2xl shadow-2xl space-y-6 border border-slate-300 print:shadow-none print:border-none print:p-2" dir="rtl">
            {/* Document Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-wide uppercase">تقرير ضريبة التبغ</h2>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tobacco Tax Summary</h3>
            </div>

            {/* Info Grid (Matching PDF format) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs font-medium border-b border-slate-300 pb-4">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">رقم سجل ضريبة القيمة المضافة # (VAT #):</span>
                <span className="font-mono font-bold text-slate-900">{tenant.taxNumber || '310160225800003'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">إسم المؤسسة / الشركة (Company):</span>
                <span className="font-bold text-slate-900">{tenant.legalName || tenant.name || 'مطعم ومقهى لافا'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">العنوان (Address):</span>
                <span className="text-slate-900">{tenant.address || 'شارع عثمان بن عفان - الرياض'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">رقم الاتصال (Phone):</span>
                <span className="font-mono text-slate-900">{tenant.phone || '0550403004'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">رقم تصريح التبغ (Tobacco Permit #):</span>
                <span className="font-mono font-bold text-amber-700">{tenant.tobaccoPermitNumber || '40092179646'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">الفترة الزمنية (Period):</span>
                <span className="font-mono text-slate-900">
                  {shishaStartDate || '01/02/2026'} إلى {shishaEndDate || '28/02/2026'}
                </span>
              </div>
            </div>

            {/* Official Report Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold text-[11px] border-b border-slate-400">
                    <th className="py-2.5 px-2.5 border-l border-slate-300">تاريخ الفاتورة<br/><span className="text-[9px] font-normal text-slate-600">Invoice Date</span></th>
                    <th className="py-2.5 px-2.5 border-l border-slate-300 text-center">عدد الفواتير<br/><span className="text-[9px] font-normal text-slate-600">Invoice Count</span></th>
                    <th className="py-2.5 px-2.5 border-l border-slate-300 text-center">عدد عنصر التبغ<br/><span className="text-[9px] font-normal text-slate-600">Tobacco Item Count</span></th>
                    <th className="py-2.5 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right">إجمالي البيع شامل ضريبة القيمة المضافة والتبغ<br/><span className="text-[9px] font-normal text-slate-600">Net amount with vat and tabocco tax</span></th>
                    <th className="py-2.5 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right">ضريبة التبغ (الضريبة الانتقائية)<br/><span className="text-[9px] font-normal text-slate-600">Tobacco Selective Tax (100%)</span></th>
                    <th className="py-2.5 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right">قيمة ضريبة القيمة المضافة<br/><span className="text-[9px] font-normal text-slate-600">VAT Amount</span></th>
                    <th className="py-2.5 px-2.5 ltr:text-left rtl:text-right">صافي الدخل بعد خصم ضريبة القيمة المضافة والتبغ<br/><span className="text-[9px] font-normal text-slate-600">Net Amount After VAT & Tobacco Tax</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                  {dailyTobaccoSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                        {isAr ? 'لا توجد بيانات مبيعات تبغ مسجلة في هذه الفترة.' : 'No tobacco sales data recorded for this period.'}
                      </td>
                    </tr>
                  ) : (
                    dailyTobaccoSummary.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-2.5 border-l border-slate-300 font-sans font-medium">{row.invoiceDate}</td>
                        <td className="py-2 px-2.5 border-l border-slate-300 text-center font-bold">{row.invoiceCount}</td>
                        <td className="py-2 px-2.5 border-l border-slate-300 text-center font-bold text-amber-800">{row.tobaccoItemCount}</td>
                        <td className="py-2 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right font-bold">{row.grossTotal.toFixed(2)}</td>
                        <td className="py-2 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right text-rose-700">{row.tobaccoTax.toFixed(2)}</td>
                        <td className="py-2 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right text-indigo-700">{row.vatAmount.toFixed(2)}</td>
                        <td className="py-2 px-2.5 ltr:text-left rtl:text-right text-emerald-700 font-bold">{row.netAfter.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {dailyTobaccoSummary.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-200 text-slate-900 font-bold text-xs border-t-2 border-slate-500 font-mono">
                      <td className="py-2.5 px-2.5 border-l border-slate-300 font-sans">الإجمالي - Total</td>
                      <td className="py-2.5 px-2.5 border-l border-slate-300 text-center">{tobaccoSummaryTotals.invoiceCount}</td>
                      <td className="py-2.5 px-2.5 border-l border-slate-300 text-center text-amber-900">{tobaccoSummaryTotals.tobaccoItemCount}</td>
                      <td className="py-2.5 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right">{tobaccoSummaryTotals.grossTotal.toFixed(2)}</td>
                      <td className="py-2.5 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right text-rose-800">{tobaccoSummaryTotals.tobaccoTax.toFixed(2)}</td>
                      <td className="py-2.5 px-2.5 border-l border-slate-300 ltr:text-left rtl:text-right text-indigo-800">{tobaccoSummaryTotals.vatAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-2.5 ltr:text-left rtl:text-right text-emerald-800 font-black">{tobaccoSummaryTotals.netAfter.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Document Footer Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-xs font-sans border-t border-slate-200">
              <div className="space-y-6">
                <div>
                  <p className="font-bold text-slate-700">إعداد المسؤول المالي:</p>
                  <p className="text-slate-500 mt-1">التوقيع: ........................................</p>
                </div>
              </div>
              <div className="space-y-6 text-left">
                <div>
                  <p className="font-bold text-slate-700">اعتماد الإدارة / صاحب المنشأة:</p>
                  <p className="text-slate-500 mt-1">الختم الرسمي: ........................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* VIEW 3: AUTOMATED DOUBLE-ENTRY GENERAL LEDGER */}
      {activeTab === 'JOURNALS' && (
        <div className="space-y-3">
          {/* Balancing Audit Pill & Search */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">{isAr ? 'تدقيق دفتر الأستاذ العام:' : 'General Ledger Audit:'}</span>
              <span className="text-slate-400">{isAr ? 'إجمالي المدين = إجمالي الدائن' : 'Total Debits = Total Credits'}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-48">
                <Search className="w-3 h-3 absolute ltr:left-2.5 rtl:right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'فلترة اليومية...' : 'Filter journals...'}
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  className="w-full ltr:pl-7 ltr:pr-2 rtl:pr-7 rtl:pl-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2.5 font-mono">
                <span className="text-emerald-400 font-semibold">{isAr ? 'مدين:' : 'DR:'} {totalDebits.toFixed(2)}</span>
                <span className="text-rose-400 font-semibold">{isAr ? 'دائن:' : 'CR:'} {totalCredits.toFixed(2)}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isBalanced ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isBalanced ? (isAr ? 'متطابق ✓' : 'Balanced ✓') : (isAr ? 'فارق غير متطابق' : 'Discrepancy')}
                </span>
              </div>
            </div>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-3">
            {filteredJournals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
                {isAr ? 'لا توجد قيود يومية تطابق البحث.' : 'No journal entries match the search.'}
              </div>
            ) : (
              filteredJournals.map((journal) => (
                <div
                  key={journal.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">{journal.reference}</span>
                      <span className="text-slate-300 font-semibold">{journal.description}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {journal.date}
                    </span>
                  </div>

                  {/* Journal lines */}
                  <div className="divide-y divide-slate-800/60 font-mono">
                    {journal.lines.map((line, idx) => (
                      <div
                        key={idx}
                        className="py-1.5 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2 w-2/3">
                          <span className="font-bold text-slate-400">{line.accountCode}</span>
                          <span className="text-slate-200">{line.accountName}</span>
                        </div>
                        <div className="w-1/6 ltr:text-right rtl:text-left font-bold text-emerald-400">
                          {(line.debit ?? 0) > 0 ? `${(line.debit ?? 0).toFixed(2)} ${isAr ? 'مدين' : 'DR'}` : ''}
                        </div>
                        <div className="w-1/6 ltr:text-right rtl:text-left font-bold text-rose-400">
                          {(line.credit ?? 0) > 0 ? `${(line.credit ?? 0).toFixed(2)} ${isAr ? 'دائن' : 'CR'}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Target Revenue Cap Export Modal */}
      <TargetRevenueExportModal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        orders={orders}
        tenant={tenant}
        branch={branch}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
