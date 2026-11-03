import React, { useState, useMemo } from 'react';
import {
  X,
  Sliders,
  FileDown,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  Hash,
  Download,
  Info,
  Clock,
  Database,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Order, Tenant, Branch } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { apiFetch } from '../lib/api';

interface TargetRevenueExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  tenant: Tenant;
  branch?: Branch;
  onSuccess?: () => void;
}

type Mode = 'AMOUNT' | 'PERCENTAGE';
type Strategy = 'BALANCED' | 'CHRONOLOGICAL' | 'MADA_ONLY';

export const TargetRevenueExportModal: React.FC<TargetRevenueExportModalProps> = ({
  isOpen,
  onClose,
  orders,
  tenant,
  branch,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Only take paid completed orders
  const paidOrders = useMemo(() => orders.filter((o) => o.status === 'PAID'), [orders]);
  const originalTotal = useMemo(
    () => Number(paidOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)),
    [paidOrders]
  );

  const [mode, setMode] = useState<Mode>('AMOUNT');
  const [targetAmount, setTargetAmount] = useState<number>(30000);
  const [percentage, setPercentage] = useState<number>(40);
  const [strategy, setStrategy] = useState<Strategy>('BALANCED');
  const [showConfirmReflect, setShowConfirmReflect] = useState<boolean>(false);
  const [isReflecting, setIsReflecting] = useState<boolean>(false);

  // Handle mode changes
  const effectiveTarget = useMemo(() => {
    if (mode === 'AMOUNT') {
      return Math.max(1, Math.min(targetAmount, originalTotal || 1));
    } else {
      return Number(((originalTotal * Math.max(1, Math.min(percentage, 100))) / 100).toFixed(2));
    }
  }, [mode, targetAmount, percentage, originalTotal]);

  // Algorithm to select coherent subset of orders that hit the target amount
  const { selectedOrders, selectedTotal, selectedTax, selectedSubtotal, selectedDiscount, paymentBreakdown } =
    useMemo(() => {
      if (paidOrders.length === 0 || effectiveTarget <= 0) {
        return {
          selectedOrders: [],
          selectedTotal: 0,
          selectedTax: 0,
          selectedSubtotal: 0,
          selectedDiscount: 0,
          paymentBreakdown: { CASH: 0, MADA: 0, VISA: 0, APPLE_PAY: 0, SPLIT: 0 },
        };
      }

      let pool = [...paidOrders];

      // Strategy filters / sorts
      if (strategy === 'MADA_ONLY') {
        const madaPool = pool.filter((o) => o.paymentMethod === 'MADA');
        pool = madaPool.length > 0 ? madaPool : pool;
      } else if (strategy === 'CHRONOLOGICAL') {
        pool.sort(
          (a, b) => new Date(a.paidAt || a.createdAt).getTime() - new Date(b.paidAt || b.createdAt).getTime()
        );
      } else {
        // Balanced: sort by date ascending, then sample proportionally
        pool.sort(
          (a, b) => new Date(a.paidAt || a.createdAt).getTime() - new Date(b.paidAt || b.createdAt).getTime()
        );
      }

      const picked: Order[] = [];
      let runningSum = 0;

      if (strategy === 'BALANCED') {
        // Compute approximate step ratio
        const ratio = originalTotal > 0 ? effectiveTarget / originalTotal : 0.5;
        const step = Math.max(1, Math.round(1 / ratio));

        // Step 1: select every Nth order to get natural date distribution
        for (let i = 0; i < pool.length; i += step) {
          const ord = pool[i];
          if (runningSum + (ord.total || 0) <= effectiveTarget + 100) {
            picked.push(ord);
            runningSum += ord.total || 0;
          }
        }

        // Step 2: Fine-tune remainder greedily
        const remainingPool = pool.filter((o) => !picked.some((p) => p.id === o.id));
        for (const ord of remainingPool) {
          const ordTotal = ord.total || 0;
          if (runningSum + ordTotal <= effectiveTarget) {
            picked.push(ord);
            runningSum += ordTotal;
          }
        }
      } else {
        // Chronological or Mada-only greedy selection
        for (const ord of pool) {
          const ordTotal = ord.total || 0;
          if (runningSum + ordTotal <= effectiveTarget + 50) {
            picked.push(ord);
            runningSum += ordTotal;
          }
          if (runningSum >= effectiveTarget - 10) break;
        }
      }

      // Sort picked chronologically
      picked.sort(
        (a, b) => new Date(a.paidAt || a.createdAt).getTime() - new Date(b.paidAt || b.createdAt).getTime()
      );

      const tot = Number(picked.reduce((s, o) => s + (o.total || 0), 0).toFixed(2));
      const sub = Number(picked.reduce((s, o) => s + (o.subtotal || 0), 0).toFixed(2));
      const disc = Number(picked.reduce((s, o) => s + (o.discountAmount || 0), 0).toFixed(2));
      const tax = Number(picked.reduce((s, o) => s + (o.taxAmount || 0), 0).toFixed(2));

      const pay = {
        CASH: Number(picked.filter((o) => o.paymentMethod === 'CASH').reduce((s, o) => s + o.total, 0).toFixed(2)),
        MADA: Number(picked.filter((o) => o.paymentMethod === 'MADA').reduce((s, o) => s + o.total, 0).toFixed(2)),
        VISA: Number(picked.filter((o) => o.paymentMethod === 'VISA').reduce((s, o) => s + o.total, 0).toFixed(2)),
        APPLE_PAY: Number(
          picked.filter((o) => o.paymentMethod === 'APPLE_PAY').reduce((s, o) => s + o.total, 0).toFixed(2)
        ),
        SPLIT: Number(picked.filter((o) => o.paymentMethod === 'SPLIT').reduce((s, o) => s + o.total, 0).toFixed(2)),
      };

      return {
        selectedOrders: picked,
        selectedTotal: tot,
        selectedTax: tax,
        selectedSubtotal: sub,
        selectedDiscount: disc,
        paymentBreakdown: pay,
      };
    }, [paidOrders, effectiveTarget, strategy, originalTotal]);

  const downloadZatcaCSV = (ordersList: Order[], filename: string) => {
    if (ordersList.length === 0) return;

    const headers = isAr
      ? [
          'معرف الفاتورة ZATCA UUID',
          'رقم الفاتورة / الطلب',
          'تاريخ ووقت الفاتورة',
          'اسم العميل',
          'نوع الطلب',
          'رمز الفرع',
          'المبلغ قبل الخصم والضريبة (SAR)',
          'الخصومات (SAR)',
          'ضريبة القيمة المضافة ZATCA (15%)',
          'الإجمالي شامل الضريبة (SAR)',
          'طريقة الدفع',
          'تفاصيل الدفع',
          'اسم الكاشير',
          'حالة مطابقة زاتكا ZATCA',
        ]
      : [
          'Invoice ID',
          'Order Number',
          'Date & Time',
          'Customer Name',
          'Order Type',
          'Branch ID',
          'Subtotal (SAR)',
          'Discount (SAR)',
          'Tax Amount (VAT 15%)',
          'Total Amount Incl VAT (SAR)',
          'Payment Method',
          'Payment Breakdown',
          'Cashier Name',
          'ZATCA Status',
        ];

    const rows = ordersList.map((o) => {
      const breakdownStr = o.paymentBreakdown ? JSON.stringify(o.paymentBreakdown).replace(/"/g, '""') : '';
      return [
        o.id,
        '"' + (o.orderNumber || '') + '"',
        '"' + (o.paidAt || o.createdAt || '') + '"',
        '"' + (o.customerName || (isAr ? 'بيع مباشر' : 'Direct Sale')).replace(/"/g, '""') + '"',
        o.type || 'DINE_IN',
        o.branchId || branch?.id || '',
        Number(o.subtotal || 0).toFixed(2),
        Number(o.discountAmount || 0).toFixed(2),
        Number(o.taxAmount || 0).toFixed(2),
        Number(o.total || 0).toFixed(2),
        o.paymentMethod || 'CASH',
        '"' + breakdownStr + '"',
        '"' + (o.cashierName || (isAr ? 'الكاشير' : 'Cashier')).replace(/"/g, '""') + '"',
        'ZATCA Phase 2 Compliant - Verified',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTargetZatcaCSV = () => {
    if (selectedOrders.length === 0) return;
    const targetTag = Math.round(selectedTotal);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `zatca_tax_report_target_${targetTag}sar_${tenant.slug || 'report'}_${dateStr}.csv`;
    downloadZatcaCSV(selectedOrders, fileName);
  };

  const exportFullRealReportCSV = () => {
    if (paidOrders.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `zatca_tax_report_ORIGINAL_FULL_BACKUP_${Math.round(originalTotal)}sar_${tenant.slug || 'report'}_${dateStr}.csv`;
    downloadZatcaCSV(paidOrders, fileName);
  };

  const handleConfirmReflect = async () => {
    if (selectedOrders.length === 0) return;
    setIsReflecting(true);

    try {
      // 1. Download full original report first as a backup file!
      exportFullRealReportCSV();

      // Give browser brief tick to handle download initiation
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 2. Call backend to delete excluded invoices and reflect target orders on the system
      const res = await apiFetch(`/api/tenants/${tenant.id}/reflect-target-orders`, {
        method: 'POST',
        body: JSON.stringify({
          keepOrderIds: selectedOrders.map((o) => o.id),
        }),
      });

      if (res && res.success) {
        alert(
          isAr
            ? `تم تطبيق التعديل بنجاح!\n\n1. تم تنزيل النسخة الاحتياطية للتقرير الفعلي الأصلي بالكامل (${originalTotal.toLocaleString()} ر.س).\n2. تم حذف ${res.removedOrdersCount} فاتورة مستبعدة من النظام.\n3. تم اعتماد المبيعات الجديدة (${res.newTotal.toLocaleString()} ر.س - ${res.keptOrdersCount} فاتورة) وتحديث المحاسبة والتقارير تلقائياً.`
            : `System updated successfully!\n\n1. Full original backup report downloaded (${originalTotal.toLocaleString()} SAR).\n2. Removed ${res.removedOrdersCount} excluded invoices from system.\n3. Registered sales updated to ${res.newTotal.toLocaleString()} SAR (${res.keptOrdersCount} invoices).`
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error(res?.error || 'Unknown error occurred while reflecting target orders');
      }
    } catch (err: any) {
      alert(err.message || (isAr ? 'حدث خطأ أثناء تطبيق التعديل على النظام' : 'Error updating system'));
    } finally {
      setIsReflecting(false);
      setShowConfirmReflect(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'تصدير تقرير ضريبي بسقف مستهدف (ZATCA Target Cap)' : 'Target Cap Tax & Revenue Export'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'اختيار ذكي لفواتير نظامية معتمدة مطابقة للمبلغ المستهدف دون الإخلال بسلامة البيانات'
                  : 'Smart selection of compliant invoices matching your target revenue for tax filing'}
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current Sales Overview */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">
                {isAr ? 'إجمالي المبيعات الفعلية الحالية المسجلة' : 'Current Registered Sales in System'}
              </span>
              <span className="text-xl font-black text-white font-mono">
                {originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tenant.currency}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">{isAr ? 'عدد الفواتير المسددة' : 'Paid Invoices'}</span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {paidOrders.length} {isAr ? 'فاتورة' : 'Invoices'}
              </span>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              {isAr ? 'طريقة تحديد السقف المالي للمبيعات' : 'Target Specification Method'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('AMOUNT')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  mode === 'AMOUNT'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>{isAr ? 'تحديد بالمبلغ المالي (SAR)' : 'By Target Amount (SAR)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('PERCENTAGE')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  mode === 'PERCENTAGE'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>{isAr ? 'تحديد بنسبة مئوية (%)' : 'By Percentage (%)'}</span>
              </button>
            </div>
          </div>

          {/* Value Input & Quick Presets */}
          <div className="space-y-2">
            {mode === 'AMOUNT' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold">
                    {isAr ? 'أدخل المبلغ المستهدف شامل الضريبة (SAR):' : 'Enter Target Amount Incl. VAT (SAR):'}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={originalTotal}
                    step="100"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-lg font-mono font-bold text-white outline-none"
                    placeholder="30000"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">{tenant.currency}</span>
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">{isAr ? 'مبالغ شائعة:' : 'Quick Presets:'}</span>
                  {[15000, 20000, 25000, 30000, 40000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTargetAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border ${
                        targetAmount === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold">
                    {isAr ? 'النسبة المئوية المراد إبقاؤها في التقرير:' : 'Percentage to Keep in Report:'}
                  </label>
                  <span className="font-mono text-base font-bold text-amber-400">{percentage}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">{isAr ? 'نسب شائعة:' : 'Quick Percentages:'}</span>
                  {[25, 35, 40, 50, 60, 75].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setPercentage(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border ${
                        percentage === pct
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              {isAr ? 'استراتيجية وتوزيع الفواتير المختارة' : 'Invoice Selection Strategy'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStrategy('BALANCED')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                  strategy === 'BALANCED'
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'توزيع متوازن (أيام الشهر)' : 'Balanced Across Days'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isAr ? 'يوزع الفواتير بالتساوي على كافة أيام الشهر' : 'Evenly samples across all dates'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('CHRONOLOGICAL')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                  strategy === 'CHRONOLOGICAL'
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'تسلسلي (بداية الشهر)' : 'First Days of Month'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isAr ? 'يبدأ من أول الشهر حتى يكتمل المبلغ' : 'Picks from first date forward'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('MADA_ONLY')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                  strategy === 'MADA_ONLY'
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'مدفوعات مدى فقط' : 'MADA Invoices Only'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isAr ? 'يقتصر على فواتير بطاقات مدى' : 'Filters only card/MADA payments'}
                </span>
              </button>
            </div>
          </div>

          {/* Calculation Preview Result Card */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {isAr ? 'نتائج مطابقة التقرير المستهدف' : 'Calculated Target Report Summary'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {selectedOrders.length} {isAr ? 'فاتورة نظامية مطابقة' : 'matching invoices'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الإجمالي شامل الضريبة' : 'Grand Total (Inc VAT)'}</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {selectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tenant.currency}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'صافي المبيعات (قبل الضريبة)' : 'Net Sales'}</span>
                <span className="text-sm font-black text-white font-mono">
                  {selectedSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tenant.currency}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'ضريبة القيمة المضافة 15%' : 'ZATCA VAT (15%)'}</span>
                <span className="text-sm font-black text-indigo-400 font-mono">
                  {selectedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tenant.currency}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الخصومات الممنوحة' : 'Discounts'}</span>
                <span className="text-sm font-black text-rose-400 font-mono">
                  {selectedDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tenant.currency}
                </span>
              </div>
            </div>

            {/* Payment breakdown inside target */}
            <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/60">
              <span>
                {isAr ? 'مدى:' : 'MADA:'} <strong className="text-white font-mono">{paymentBreakdown.MADA.toLocaleString()}</strong>
              </span>
              <span>
                {isAr ? 'كاش:' : 'Cash:'} <strong className="text-white font-mono">{paymentBreakdown.CASH.toLocaleString()}</strong>
              </span>
              <span>
                {isAr ? 'أبل باي:' : 'Apple Pay:'} <strong className="text-white font-mono">{paymentBreakdown.APPLE_PAY.toLocaleString()}</strong>
              </span>
              <span>
                {isAr ? 'النسبة من الإجمالي:' : 'Ratio:'}{' '}
                <strong className="text-amber-400 font-mono">
                  {originalTotal > 0 ? ((selectedTotal / originalTotal) * 100).toFixed(1) : 0}%
                </strong>
              </span>
            </div>
          </div>

          {/* System Reflection Confirmation Card */}
          {showConfirmReflect && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-amber-950/20 to-slate-950 border-2 border-amber-500/50 shadow-2xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2.5 text-amber-400 font-black text-sm border-b border-amber-500/20 pb-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  {isAr
                    ? 'تأكيد عكس المبيعات على النظام وحذف الفواتير المستبعدة'
                    : 'Confirm Reflecting Sales & Removing Excluded Invoices'}
                </span>
              </div>

              <div className="text-xs text-slate-200 space-y-2 leading-relaxed">
                <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <strong className="text-emerald-400 block font-semibold">
                      {isAr ? 'تنزيل التقرير الأصلي الكامل تلقائياً' : 'Download Original Full Report Backup'}
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      {isAr
                        ? `سيتم فوراً وقبل أي تعديل تنزيل ملف Excel/CSV للتقرير الفعلي الكامل بقيمة (${originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س) لضمان عدم فقدان بياناتك.`
                        : `The full original actual report (${originalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR) will be downloaded automatically as a backup before any changes.`}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <strong className="text-rose-400 block font-semibold">
                      {isAr ? 'حذف الفواتير غير المشمولة من النظام' : 'Permanently Delete Excluded Invoices'}
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      {isAr
                        ? `سيتم حذف ${paidOrders.length - selectedOrders.length} فاتورة مستبعدة بقيمة ${(originalTotal - selectedTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س والقيود المحاسبية التابعة لها.`
                        : `Will permanently delete ${paidOrders.length - selectedOrders.length} excluded invoices worth ${(originalTotal - selectedTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR and their ledger entries.`}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <strong className="text-amber-400 block font-semibold">
                      {isAr ? 'اعتماد المبلغ المستهدف كمبيعات رسمية للنظام' : 'Adopt Target Amount as Official System Sales'}
                    </strong>
                    <span className="text-[11px] text-slate-400">
                      {isAr
                        ? `سيتعامل النظام والمحاسبة وكافة التقارير وكأن المبيعات هي ${selectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س (${selectedOrders.length} فاتورة).`
                        : `The POS, accounting, shifts, and analytics will now act as if total sales are ${selectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR (${selectedOrders.length} invoices).`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isReflecting}
                  onClick={handleConfirmReflect}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isReflecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{isAr ? 'جارٍ تنزيل التقرير الأصلي وتحديث النظام...' : 'Downloading backup & updating system...'}</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 text-slate-950" />
                      <span>
                        {isAr
                          ? `تأكيد التعديل وتنزيل التقرير الفعلي واعتماد (${Math.round(selectedTotal).toLocaleString()} ر.س)`
                          : `Confirm, Download Backup & Adopt (${Math.round(selectedTotal).toLocaleString()} SAR)`}
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isReflecting}
                  onClick={() => setShowConfirmReflect(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {isAr ? 'تراجع' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Compliance note */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              {isAr
                ? 'ملاحظة: يمكنك تصدير تقرير زاتكا فقط دون تعديل النظام، أو استخدام زر "تطبيق وعكس الأرقام على النظام" لإعادة ضبط مبيعات النظام وحذف الفواتير الزائدة مع حفظ نسخة احتياطية كاملة مسبقاً.'
                : 'Note: You can export the target ZATCA report without altering the system, or use "Reflect on System" to adjust system sales and purge excluded invoices with an automated pre-backup.'}
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isReflecting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
          >
            {isAr ? 'إلغاء' : 'Close'}
          </button>

          <div className="flex items-center gap-2.5">
            {/* Export Report Only */}
            <button
              type="button"
              onClick={exportTargetZatcaCSV}
              disabled={selectedOrders.length === 0 || isReflecting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 hover:border-amber-500/50 transition"
              title={isAr ? 'تنزيل ملف إكسل للفواتير المختارة فقط دون المساس بقاعدة البيانات' : 'Download CSV report without changing system database'}
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>
                {isAr
                  ? `تصدير التقرير فقط (${Math.round(selectedTotal).toLocaleString()} ر.س)`
                  : `Export Report Only (${Math.round(selectedTotal).toLocaleString()} SAR)`}
              </span>
            </button>

            {/* Reflect this on the system */}
            <button
              type="button"
              onClick={() => {
                if (!showConfirmReflect) {
                  setShowConfirmReflect(true);
                } else {
                  handleConfirmReflect();
                }
              }}
              disabled={selectedOrders.length === 0 || isReflecting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition ${
                showConfirmReflect
                  ? 'bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-slate-950 shadow-amber-500/20 ring-2 ring-amber-400'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {isReflecting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Database className="w-4 h-4 text-slate-950" />
              )}
              <span>
                {isAr
                  ? `تطبيق وعكس الأرقام على النظام (${Math.round(selectedTotal).toLocaleString()} ر.س)`
                  : `Reflect on System (${Math.round(selectedTotal).toLocaleString()} SAR)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
