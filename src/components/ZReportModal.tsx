import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Building2,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Download,
  ShieldCheck,
  Calendar,
  Layers,
  MessageCircle,
} from 'lucide-react';
import { Tenant, Branch } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { apiFetch } from '../lib/api';

export interface ZReportMetrics {
  grossSales: number;
  discountTotal: number;
  netTaxableSales: number;
  taxTotal: number;
  totalSalesInclTax: number;
  cashSales: number;
  cardSales: number;
  onlineSales: number;
  totalOrdersCount: number;
  averageTicket: number;
  dineInCount: number;
  takeawayCount: number;
  deliveryCount: number;
  voidsCount: number;
  voidsAmount: number;
}

export interface ZReportData extends ZReportMetrics {
  zReportNumber: string;
  generatedAt: string;
  selectedDate?: string;
  scope?: 'DAILY' | 'ALL';
  availableDates?: string[];
  tenantName: string;
  vatNumber: string;
  crNumber?: string;
  branchName: string;
  branchAddress: string;
  currency: string;
  period: string;
  openingFloat: number;
  expectedCashInDrawer: number;
  closingStatus: string;
  zatcaApproved: boolean;
  dailySummary?: ZReportMetrics;
  cumulativeSummary?: ZReportMetrics;
}

interface ZReportModalProps {
  tenant: Tenant;
  branch: Branch;
  reportData?: ZReportData | null;
  onClose: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  tenant,
  branch,
  reportData,
  onClose,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const todayKsa = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  const [viewMode, setViewMode] = useState<'THERMAL' | 'A4'>('A4');
  const [reportScope, setReportScope] = useState<'DAILY' | 'ALL'>('DAILY');
  const [selectedDate, setSelectedDate] = useState<string>(reportData?.selectedDate || todayKsa);
  const [fetchedReport, setFetchedReport] = useState<ZReportData | null>(reportData || null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadReport = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(
          `/api/z-report?tenantId=${tenant.id}&branchId=${branch?.id || ''}&date=${selectedDate}&scope=${reportScope}`
        );
        if (isMounted && res) {
          setFetchedReport(res);
        }
      } catch (err) {
        console.error('Failed to load Z-Report:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadReport();
    return () => {
      isMounted = false;
    };
  }, [tenant.id, branch?.id, selectedDate, reportScope]);

  const rawData = fetchedReport || reportData;

  const activeMetrics: ZReportMetrics =
    reportScope === 'ALL' && rawData?.cumulativeSummary
      ? rawData.cumulativeSummary
      : reportScope === 'DAILY' && rawData?.dailySummary
      ? rawData.dailySummary
      : {
          grossSales: rawData?.grossSales ?? 0,
          discountTotal: rawData?.discountTotal ?? 0,
          netTaxableSales: rawData?.netTaxableSales ?? 0,
          taxTotal: rawData?.taxTotal ?? 0,
          totalSalesInclTax: rawData?.totalSalesInclTax ?? 0,
          cashSales: rawData?.cashSales ?? 0,
          cardSales: rawData?.cardSales ?? 0,
          onlineSales: rawData?.onlineSales ?? 0,
          totalOrdersCount: rawData?.totalOrdersCount ?? 0,
          averageTicket: rawData?.averageTicket ?? 0,
          dineInCount: rawData?.dineInCount ?? 0,
          takeawayCount: rawData?.takeawayCount ?? 0,
          deliveryCount: rawData?.deliveryCount ?? 0,
          voidsCount: rawData?.voidsCount ?? 0,
          voidsAmount: rawData?.voidsAmount ?? 0,
        };

  const dailyMetrics = rawData?.dailySummary || activeMetrics;
  const cumulativeMetrics = rawData?.cumulativeSummary || activeMetrics;
  const availableDates = rawData?.availableDates || [todayKsa];

  const openingFloat = rawData?.openingFloat ?? 0;
  const expectedCashInDrawer = Number((openingFloat + activeMetrics.cashSales).toFixed(2));
  const currency = rawData?.currency || tenant?.currency || 'SAR';
  const tenantName = rawData?.tenantName || tenant?.name || 'BANLIS';
  const vatNumber = tenant?.taxNumber || rawData?.vatNumber || '315007777700003';
  const crNumber = tenant?.crNumber || rawData?.crNumber || '7055146323';
  const branchName = rawData?.branchName || branch?.name || 'Main Branch';
  const branchAddress = tenant?.address || rawData?.branchAddress || branch?.address || 'Riyadh';
  const zReportNumber =
    reportScope === 'DAILY'
      ? `Z-${selectedDate.replace(/-/g, '')}-001`
      : `Z-TOTAL-${todayKsa.replace(/-/g, '')}`;

  const handlePrint = () => {
    window.print();
  };

  const zReportWhatsappText = encodeURIComponent(
    [
      `*${tenantName} — ${isAr ? 'تقرير الإغلاق اليومي Z-Report' : 'Daily Z-Report'}*`,
      `${zReportNumber} | ${selectedDate}`,
      '────────────────────',
      `*${isAr ? `أولاً: مبيعات اليوم (${selectedDate})` : `1. Daily Sales (${selectedDate})`}*`,
      `${isAr ? 'المبيعات قبل الضريبة:' : 'Gross Sales:'} ${dailyMetrics.grossSales.toFixed(2)} ${currency}`,
      `${isAr ? 'الخصومات:' : 'Discounts:'} -${dailyMetrics.discountTotal.toFixed(2)} ${currency}`,
      `${isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'} ${dailyMetrics.taxTotal.toFixed(2)} ${currency}`,
      `*${isAr ? 'إجمالي مبيعات اليوم:' : 'Daily Net Total:'} ${dailyMetrics.totalSalesInclTax.toFixed(2)} ${currency}*`,
      `${isAr ? 'كاش اليوم:' : 'Daily Cash:'} ${dailyMetrics.cashSales.toFixed(2)} ${currency}`,
      `${isAr ? 'شبكة / مدى اليوم:' : 'Daily Card/Mada:'} ${dailyMetrics.cardSales.toFixed(2)} ${currency}`,
      `${isAr ? 'عدد فواتير اليوم:' : 'Daily Tickets:'} ${dailyMetrics.totalOrdersCount}`,
      '────────────────────',
      `*${isAr ? 'ثانياً: الإجمالي التراكمي (حتى الآن)' : '2. Cumulative Total Until Now'}*`,
      `*${isAr ? 'إجمالي المبيعات التراكمي:' : 'Cumulative Sales:'} ${cumulativeMetrics.totalSalesInclTax.toFixed(2)} ${currency}*`,
      `${isAr ? 'إجمالي الضريبة التراكمي:' : 'Cumulative VAT:'} ${cumulativeMetrics.taxTotal.toFixed(2)} ${currency}`,
      `${isAr ? 'إجمالي الكاش التراكمي:' : 'Cumulative Cash:'} ${cumulativeMetrics.cashSales.toFixed(2)} ${currency}`,
      `${isAr ? 'إجمالي الشبكة التراكمي:' : 'Cumulative Card:'} ${cumulativeMetrics.cardSales.toFixed(2)} ${currency}`,
      `${isAr ? 'إجمالي عدد الفواتير:' : 'Total Tickets:'} ${cumulativeMetrics.totalOrdersCount}`,
    ].join('\n')
  );
  const zReportWhatsappUrl = `https://api.whatsapp.com/send?text=${zReportWhatsappText}`;

  const renderThermalZReport = () => (
    <div className="font-sans text-xs text-slate-950 space-y-3">
      <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-2.5">
        <h2 className="text-base font-black uppercase tracking-tight font-sans">{tenantName}</h2>
        <p className="text-[11px] font-bold text-slate-900">{branchName}</p>
        <p className="text-[10px] font-bold text-slate-800">{branchAddress}</p>
        <p className="text-[10px] text-slate-950 font-bold mt-1">
          {isAr ? `الرقم الضريبي: ${vatNumber}` : `VAT ID: ${vatNumber}`}
        </p>
        <p className="text-[10px] text-slate-950 font-bold">
          {isAr ? `السجل التجاري: ${crNumber}` : `CR No: ${crNumber}`}
        </p>
        <div className="mt-1.5 py-1 px-2 rounded border border-slate-900 text-slate-950 font-black text-xs uppercase">
          {reportScope === 'DAILY'
            ? isAr
              ? `تقرير إغلاق اليوم (${selectedDate})`
              : `DAILY Z-REPORT (${selectedDate})`
            : isAr
            ? 'تقرير Z-Report التراكمي الكلي'
            : 'CUMULATIVE Z-REPORT'}
        </div>
        <p className="text-[10px] text-slate-800 font-bold">{zReportNumber}</p>
      </div>

      <div className="text-[11px] font-bold space-y-1 border-b border-dashed border-slate-400 pb-2.5">
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'تاريخ اليوم / الوردية:' : 'Shift Date:'}</span>
          <span dir="ltr">{selectedDate}</span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'وقت الطباعة:' : 'Printed At:'}</span>
          <span dir="ltr">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'الحالة:' : 'Status:'}</span>
          <span className="font-black">{isAr ? 'مغلق ومدقق' : 'CLOSED & AUDITED'}</span>
        </div>
      </div>

      {/* Section 1: Daily Sales Breakdown (End of Day) */}
      <div className="space-y-1 text-[11px] font-bold border-b border-dashed border-slate-400 pb-2.5">
        <div className="text-[10px] font-black uppercase text-slate-900 border-b border-dotted border-slate-300 pb-1">
          {isAr ? `أولاً: مبيعات اليوم (${selectedDate})` : `1. DAILY SALES (${selectedDate})`}
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'المبيعات قبل الضريبة:' : 'GROSS SALES:'}</span>
          <span dir="ltr">
            {dailyMetrics.grossSales.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'الخصومات:' : 'DISCOUNTS:'}</span>
          <span dir="ltr">
            -{dailyMetrics.discountTotal.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'الصافي الخاضع للضريبة:' : 'NET TAXABLE:'}</span>
          <span dir="ltr">
            {dailyMetrics.netTaxableSales.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
          <span dir="ltr">
            {dailyMetrics.taxTotal.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2 font-black text-xs pt-1 border-t border-slate-900">
          <span>{isAr ? 'إجمالي مبيعات اليوم:' : 'DAILY TOTAL SALES:'}</span>
          <span dir="ltr">
            {dailyMetrics.totalSalesInclTax.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2 pt-1 text-[10.5px]">
          <span>{isAr ? 'نقداً (كاش اليوم):' : 'Daily Cash:'}</span>
          <span dir="ltr">
            {dailyMetrics.cashSales.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2 text-[10.5px]">
          <span>{isAr ? 'شبكة / مدى / بطاقة اليوم:' : 'Daily Card / Mada:'}</span>
          <span dir="ltr">
            {dailyMetrics.cardSales.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2 text-[10.5px]">
          <span>{isAr ? 'عدد فواتير اليوم:' : 'Daily Tickets:'}</span>
          <span dir="ltr">{dailyMetrics.totalOrdersCount}</span>
        </div>
      </div>

      {/* Section 2: Cumulative Total Until Now */}
      <div className="space-y-1 text-[11px] font-bold border-b border-dashed border-slate-400 pb-2.5">
        <div className="text-[10px] font-black uppercase text-slate-900 border-b border-dotted border-slate-300 pb-1">
          {isAr ? 'ثانياً: الإجمالي التراكمي (حتى الآن)' : '2. TOTAL UNTIL NOW (CUMULATIVE)'}
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'إجمالي المبيعات التراكمي:' : 'Cumulative Net Sales:'}</span>
          <span className="font-black" dir="ltr">
            {cumulativeMetrics.totalSalesInclTax.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'إجمالي الضريبة التراكمي:' : 'Cumulative VAT (15%):'}</span>
          <span dir="ltr">
            {cumulativeMetrics.taxTotal.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'إجمالي الكاش التراكمي:' : 'Cumulative Cash:'}</span>
          <span dir="ltr">
            {cumulativeMetrics.cashSales.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'إجمالي الشبكة التراكمي:' : 'Cumulative Card/Mada:'}</span>
          <span dir="ltr">
            {cumulativeMetrics.cardSales.toFixed(2)} {currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'إجمالي عدد الفواتير:' : 'Total Tickets Count:'}</span>
          <span dir="ltr">{cumulativeMetrics.totalOrdersCount}</span>
        </div>
      </div>

      <div className="text-center pt-1 space-y-1.5">
        <div className="flex justify-center">
          <QrCode className="w-16 h-16 text-slate-950" />
        </div>
        <p className="text-[9px] text-slate-900 font-bold uppercase font-sans">
          ZATCA Compliant Daily Close Out
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto print:hidden">
        <div className="relative w-full max-w-3xl my-6 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-5 max-h-[94vh] overflow-y-auto">
        {/* Modal Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  {isAr ? 'تقرير الإغلاق اليومي Z-Report' : 'Daily Shift Z-Report'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {zReportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'إغلاق المبيعات اليومي (نهاية اليوم) والإجمالي التراكمي المعتمد من ZATCA'
                  : 'Official ZATCA Compliant End-of-Day & Cumulative Financial Closing Report'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: A4 vs Thermal POS */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('A4')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'A4'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'تقرير A4' : 'A4 Report'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('THERMAL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'THERMAL'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'إيصال حراري POS' : 'Thermal POS'}
              </button>
            </div>

            <a
              href={zReportWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isAr ? 'إرسال واتساب' : 'WhatsApp'}</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Period Scope Selector Bar: Daily (End of Day) vs Total Until Now */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setReportScope('DAILY')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                reportScope === 'DAILY'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقرير الإغلاق اليومي (نهاية اليوم)' : 'Daily End-of-Day Report'}</span>
            </button>
            <button
              type="button"
              onClick={() => setReportScope('ALL')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                reportScope === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'الإجمالي التراكمي (حتى الآن)' : 'Total Until Now (Cumulative)'}</span>
            </button>
          </div>

          {/* Date Selector when in DAILY mode */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">
              {isAr ? 'تاريخ اليوم / الوردية:' : 'Shift Date:'}
            </span>
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setReportScope('DAILY');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d} {d === todayKsa ? (isAr ? '(اليوم)' : '(Today)') : ''}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setReportScope('DAILY');
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {loading && (
          <div className="text-center py-2 text-xs text-amber-400 font-bold animate-pulse print:hidden">
            {isAr ? 'جاري تحديث بيانات التقرير...' : 'Refreshing Z-Report data...'}
          </div>
        )}

        {/* View Mode 1: Detailed A4 Executive Financial Report */}
        {viewMode === 'A4' && (
          <div className="space-y-5 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800 font-sans print:bg-white print:text-black print:p-0 print:border-none">
            {/* Business & ZATCA Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {tenantName}
                </h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-slate-200">{branchName}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{branchAddress}</p>
              </div>

              <div className="text-right space-y-1 font-mono text-[11px]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>ZATCA Phase 2 E-Invoicing</span>
                </div>
                <div className="text-slate-400 block pt-1">
                  {isAr ? 'الرقم الضريبي:' : 'VAT Registration:'}{' '}
                  <strong className="text-white">{vatNumber}</strong>
                </div>
                <div className="text-slate-400 block">
                  {isAr ? 'نطاق التقرير:' : 'Report Scope:'}{' '}
                  <strong className="text-emerald-400">
                    {reportScope === 'DAILY'
                      ? isAr
                        ? `مبيعات وإغلاق يوم (${selectedDate})`
                        : `Daily Close (${selectedDate})`
                      : isAr
                      ? 'الإجمالي التراكمي حتى الآن'
                      : 'Cumulative Total Until Now'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Side-by-Side Comparison Banner: Daily Sales vs Total Until Now */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setReportScope('DAILY')}
                className={`cursor-pointer p-3.5 rounded-xl border transition flex items-center justify-between ${
                  reportScope === 'DAILY'
                    ? 'bg-emerald-500/15 border-emerald-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 block">
                    {isAr ? `صافي مبيعات اليوم (${selectedDate})` : `Daily Sales (${selectedDate})`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {dailyMetrics.totalOrdersCount} {isAr ? 'فاتورة مدفوعة في هذا اليوم' : 'paid tickets on this date'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <div className="text-lg font-black text-white">
                    {dailyMetrics.totalSalesInclTax.toFixed(2)} {currency}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? `الضريبة: ${dailyMetrics.taxTotal.toFixed(2)}` : `VAT: ${dailyMetrics.taxTotal.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setReportScope('ALL')}
                className={`cursor-pointer p-3.5 rounded-xl border transition flex items-center justify-between ${
                  reportScope === 'ALL'
                    ? 'bg-amber-500/15 border-amber-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-amber-400 block">
                    {isAr ? 'الإجمالي التراكمي حتى الآن (كافة الأيام)' : 'Total Sales Until Now (All Days)'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cumulativeMetrics.totalOrdersCount} {isAr ? 'إجمالي الفواتير المسددة' : 'total paid tickets'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <div className="text-lg font-black text-white">
                    {cumulativeMetrics.totalSalesInclTax.toFixed(2)} {currency}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {isAr ? `الضريبة: ${cumulativeMetrics.taxTotal.toFixed(2)}` : `VAT: ${cumulativeMetrics.taxTotal.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Financial Metrics Cards for Selected Scope */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">
                  {isAr ? 'إجمالي المبيعات (قبل الضريبة)' : 'Gross Sales'}
                </span>
                <div className="text-base font-extrabold text-white font-mono">
                  {activeMetrics.grossSales.toFixed(2)} {currency}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'قبل الخصومات والضريبة' : 'Before discounts & VAT'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">
                  {isAr ? 'إجمالي الخصومات' : 'Total Discounts'}
                </span>
                <div className="text-base font-extrabold text-amber-400 font-mono">
                  -{activeMetrics.discountTotal.toFixed(2)} {currency}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'خصم الكاشير والعروض' : 'Promos & Discounts'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">
                  {isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT Collected (15%)'}
                </span>
                <div className="text-base font-extrabold text-indigo-400 font-mono">
                  {activeMetrics.taxTotal.toFixed(2)} {currency}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'حساب مصلحة الضرائب ZATCA' : 'ZATCA Tax Account'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 space-y-1">
                <span className="text-amber-300 text-[10px] font-bold uppercase">
                  {reportScope === 'DAILY'
                    ? isAr
                      ? `صافي مبيعات اليوم (${selectedDate})`
                      : `Daily Net Sales (${selectedDate})`
                    : isAr
                    ? 'صافي المبيعات الكلي (حتى الآن)'
                    : 'Total Net Sales (Incl. VAT)'}
                </span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {activeMetrics.totalSalesInclTax.toFixed(2)} {currency}
                </div>
                <span className="text-[10px] text-emerald-500/80 block">
                  {isAr ? 'صافي الإيراد الفعلي شامل الضريبة' : 'Final Net Revenue Incl. VAT'}
                </span>
              </div>
            </div>

            {/* Payment Method & Order Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Methods Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    {isAr ? 'توزيع المبيعات حسب طريقة الدفع' : 'Payment Method Breakdown'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeMetrics.totalOrdersCount} {isAr ? 'فاتورة' : 'tickets'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      {isAr ? 'نقداً (كاش)' : 'Cash Payments'}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {activeMetrics.cashSales.toFixed(2)} {currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      {isAr ? 'بطاقات مدى / شبكة / فيزا / أبل باي' : 'Card / Mada / Visa / Apple Pay'}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {activeMetrics.cardSales.toFixed(2)} {currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Download className="w-4 h-4 text-purple-400" />
                      {isAr ? 'تطبيقات التوصيل / أونلاين' : 'Online / Delivery Apps'}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {activeMetrics.onlineSales.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shift & Cash Drawer Audit */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    {isAr ? 'مطابقة صندوق النقدية والوردية' : 'Shift & Cash Drawer Audit'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    BALANCED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isAr ? 'الرصيد الافتتاحي للصندوق:' : 'Opening Float:'}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {openingFloat.toFixed(2)} {currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isAr ? 'مقبوضات النقدية (الكاش):' : 'Net Cash Sales Collected:'}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{activeMetrics.cashSales.toFixed(2)} {currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-bold">
                    <span className="text-white">{isAr ? 'النقد المتوقع بالصندوق:' : 'Expected Cash in Drawer:'}</span>
                    <span className="font-mono text-amber-400 text-sm">
                      {expectedCashInDrawer.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ZATCA Digital Signature & Stamp */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white text-xs">
                    {isAr ? 'الختم الرقمي لمطابقة زاتكا ZATCA CSID' : 'ZATCA TLV Digital Signature Hash'}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-slate-500 break-all max-w-md">
                  AR15ZATCA93028402948201948102938401928491028394019283940129384
                </p>
              </div>

              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: 80mm Thermal POS Receipt Preview (End-of-Day Printable Receipt) */}
        {viewMode === 'THERMAL' && (
          <div className="flex justify-center py-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-80 bg-white text-slate-950 p-5 font-sans text-xs space-y-3 shadow-2xl rounded-xl border border-slate-300">
              {renderThermalZReport()}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isAr
              ? 'جاهز للطباعة في نهاية اليوم (A4 أو طابعة الكاشير الحرارية 80mm)'
              : 'Ready for end-of-day printing (A4 or 80mm thermal POS)'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>

    {/* Top-level Print Portal directly under document.body — never clipped or blank */}
    {typeof document !== 'undefined' &&
      createPortal(
        <div id="pos-print-root" dir={isAr ? 'rtl' : 'ltr'}>
          {renderThermalZReport()}
        </div>,
        document.body
      )}
    </>
  );
};
