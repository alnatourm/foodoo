import React, { useState, useMemo } from 'react';
import {
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
  AlertCircle,
} from 'lucide-react';
import { JournalEntry, Tenant, Branch, Order, AccountingSummary } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface AccountingViewProps {
  tenant: Tenant;
  branch: Branch;
  journals: JournalEntry[];
  summary: Partial<AccountingSummary>;
  orders?: Order[];
  onRefresh?: () => void;
  onViewReceipt?: (order: Order) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  tenant,
  branch,
  journals,
  summary,
  orders = [],
  onRefresh,
  onViewReceipt,
}) => {
  const { language, isRTL, getLocalizedName } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PL' | 'JOURNALS'>('ORDERS');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PAID' | 'OPEN' | 'VOIDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [journalSearch, setJournalSearch] = useState('');

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
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
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

        <div className="flex items-center gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                            <div className="truncate text-[11px]" title={order.items.map((i) => `${i.quantity}x ${getLocalizedName(i)}`).join(', ')}>
                              {order.items.map((i) => `${i.quantity}x ${getLocalizedName(i)}`).join(', ')}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {order.items.reduce((acc, i) => acc + (i.quantity || 1), 0)} {isAr ? 'عنصر' : 'items total'}
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono text-slate-300 whitespace-nowrap">
                            {(order.subtotal ?? 0).toFixed(2)}
                          </td>

                          {/* Discount */}
                          <td className="py-3 px-3 ltr:text-right rtl:text-left font-mono whitespace-nowrap">
                            {(order.discountAmount ?? 0) > 0 ? (
                              <span className="text-rose-400 font-bold">
                                -{(order.discountAmount ?? 0).toFixed(2)}
                              </span>
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
                            {onViewReceipt && (
                              <button
                                onClick={() => onViewReceipt(order)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title={isAr ? 'عرض الفاتورة الحرارية' : 'View Thermal Receipt'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </div>
  );
};
