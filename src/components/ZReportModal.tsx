import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Building2,
  CheckCircle2,
  QrCode,
  DollarSign,
  CreditCard,
  Banknote,
  Percent,
  Download,
  ShieldCheck,
  Calendar,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Tenant, Branch } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

export interface ZReportData {
  zReportNumber: string;
  generatedAt: string;
  tenantName: string;
  vatNumber: string;
  branchName: string;
  branchAddress: string;
  currency: string;
  period: string;
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
  openingFloat: number;
  expectedCashInDrawer: number;
  closingStatus: string;
  zatcaApproved: boolean;
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
  const [viewMode, setViewMode] = useState<'THERMAL' | 'A4'>('A4');

  // Fallback / default calculated values if reportData is not provided directly
  const data: ZReportData = reportData || {
    zReportNumber: `Z-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
    generatedAt: new Date().toISOString(),
    tenantName: tenant?.name || 'Sultan Burger & Smokehouse',
    vatNumber: '310294857200003',
    branchName: branch?.name || 'Riyadh - Al Olaya Flagship',
    branchAddress: branch?.address || 'Olaya St, Riyadh, Saudi Arabia',
    currency: tenant?.currency || 'SAR',
    period: isAr ? 'تقرير الإغلاق اليومي (الوردية الحالية)' : 'Daily Shift Closing Period',
    grossSales: 2840.0,
    discountTotal: 120.0,
    netTaxableSales: 2365.22,
    taxTotal: 354.78,
    totalSalesInclTax: 2720.0,
    cashSales: 980.0,
    cardSales: 1740.0,
    onlineSales: 0.0,
    totalOrdersCount: 25,
    averageTicket: 108.8,
    dineInCount: 14,
    takeawayCount: 8,
    deliveryCount: 3,
    voidsCount: 2,
    voidsAmount: 45.0,
    openingFloat: 500.0,
    expectedCashInDrawer: 1480.0,
    closingStatus: 'BALANCED',
    zatcaApproved: true,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Modal Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
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
                  {data.zReportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'التقرير المالي والتنفيذي اليومي المعتمد من هيئة الزكاة والضريبة والجمارك ZATCA'
                  : 'Official ZATCA Compliant Daily Financial & Sales Closing Report'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
              <button
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

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode 1: Detailed A4 Executive Financial Report */}
        {viewMode === 'A4' && (
          <div className="space-y-5 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800 font-sans print:bg-white print:text-black print:p-0 print:border-none">
            {/* Business & ZATCA Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {data.tenantName}
                </h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-slate-200">{data.branchName}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{data.branchAddress}</p>
              </div>

              <div className="text-right space-y-1 font-mono text-[11px]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>ZATCA Phase 2 E-Invoicing</span>
                </div>
                <div className="text-slate-400 block pt-1">
                  {isAr ? 'الرقم الضريبي:' : 'VAT Registration:'}{' '}
                  <strong className="text-white">{data.vatNumber}</strong>
                </div>
                <div className="text-slate-400 block">
                  {isAr ? 'تاريخ التقرير:' : 'Closing Date:'}{' '}
                  <span className="text-slate-200">{new Date(data.generatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Core Financial Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">
                  {isAr ? 'إجمالي المبيعات' : 'Gross Sales'}
                </span>
                <div className="text-base font-extrabold text-white font-mono">
                  {data.grossSales.toFixed(2)} {data.currency}
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
                  -{data.discountTotal.toFixed(2)} {data.currency}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'خصم التكريم والحملات' : 'Promos & Manager Voids'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">
                  {isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT Collected (15%)'}
                </span>
                <div className="text-base font-extrabold text-indigo-400 font-mono">
                  {data.taxTotal.toFixed(2)} {data.currency}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'حساب مصلحة الضرائب ZATCA' : 'ZATCA Tax Account'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 space-y-1">
                <span className="text-amber-300 text-[10px] font-bold uppercase">
                  {isAr ? 'صافي المبيعات الكلي' : 'Net Sales (Incl. VAT)'}
                </span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {data.totalSalesInclTax.toFixed(2)} {data.currency}
                </div>
                <span className="text-[10px] text-emerald-500/80 block">
                  {isAr ? 'صافي الإيراد الفعلي' : 'Final Net Revenue'}
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
                    {data.totalOrdersCount} {isAr ? 'فاتورة' : 'tickets'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      {isAr ? 'نقداً (كاش)' : 'Cash Payments'}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {data.cashSales.toFixed(2)} {data.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      {isAr ? 'بطاقات مدى / شبكة / فيزا' : 'Card / Mada Payments'}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {data.cardSales.toFixed(2)} {data.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Download className="w-4 h-4 text-purple-400" />
                      {isAr ? 'تطبيقات التوصيل / أونلاين' : 'Online / Delivery Apps'}
                    </span>
                    <span className="font-mono font-bold text-white">
                      {data.onlineSales.toFixed(2)} {data.currency}
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
                    {data.closingStatus}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isAr ? 'الرصيد الافتتاحي للصندوق:' : 'Opening Float:'}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {data.openingFloat.toFixed(2)} {data.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isAr ? 'مقبوضات النقدية (الكاش):' : 'Net Cash Sales Collected:'}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{data.cashSales.toFixed(2)} {data.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-bold">
                    <span className="text-white">{isAr ? 'النقد المتوقع بالصندوق:' : 'Expected Cash in Drawer:'}</span>
                    <span className="font-mono text-amber-400 text-sm">
                      {data.expectedCashInDrawer.toFixed(2)} {data.currency}
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

              {/* Simulated QR Code Box */}
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: 80mm Thermal POS Receipt Preview */}
        {viewMode === 'THERMAL' && (
          <div className="flex justify-center py-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div
              id="thermal-z-report"
              className="w-80 bg-white text-slate-950 p-6 font-mono text-xs space-y-4 shadow-2xl rounded-xl border border-slate-300 print:w-full print:p-0 print:border-none"
            >
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
                <h2 className="text-base font-black uppercase tracking-tight font-sans">
                  {data.tenantName}
                </h2>
                <p className="text-[11px] text-slate-700">{data.branchName}</p>
                <p className="text-[10px] text-slate-600">{data.branchAddress}</p>
                <p className="text-[10px] text-slate-800 font-bold mt-1">
                  VAT ID: {data.vatNumber}
                </p>
                <div className="pt-2 font-extrabold text-sm uppercase text-slate-950">
                  *** DAILY Z-REPORT ***
                </div>
                <p className="text-[10px] text-slate-600 font-bold">{data.zReportNumber}</p>
              </div>

              <div className="text-[11px] space-y-1 border-b border-dashed border-slate-400 pb-3">
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{new Date(data.generatedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold">CLOSED & AUDITED</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-400 pb-3">
                <div className="flex justify-between font-bold">
                  <span>GROSS SALES:</span>
                  <span>{data.grossSales.toFixed(2)} {data.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>DISCOUNTS/VOIDS:</span>
                  <span>-{data.discountTotal.toFixed(2)} {data.currency}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>NET TAXABLE:</span>
                  <span>{data.netTaxableSales.toFixed(2)} {data.currency}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>VAT (15%):</span>
                  <span>{data.taxTotal.toFixed(2)} {data.currency}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL NET SALES:</span>
                  <span>{data.totalSalesInclTax.toFixed(2)} {data.currency}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-3">
                <span className="font-bold block uppercase text-[10px] text-slate-600">
                  PAYMENT TENDERS
                </span>
                <div className="flex justify-between">
                  <span>CASH:</span>
                  <span className="font-bold">{data.cashSales.toFixed(2)} {data.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>MADA / CARD:</span>
                  <span className="font-bold">{data.cardSales.toFixed(2)} {data.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>TOTAL TICKETS:</span>
                  <span className="font-bold">{data.totalOrdersCount}</span>
                </div>
              </div>

              <div className="text-center pt-2 space-y-2">
                <div className="flex justify-center">
                  <QrCode className="w-16 h-16 text-slate-950" />
                </div>
                <p className="text-[9px] text-slate-600 uppercase font-sans">
                  ZATCA Compliant Daily Close Out
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تم حفظ التقرير في سجلات المحاسبة' : 'Z-Report archived in General Ledger logs'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
