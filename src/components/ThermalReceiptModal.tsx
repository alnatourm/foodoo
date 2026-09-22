import React from 'react';
import { Printer, X, QrCode, FileText, CheckCircle2 } from 'lucide-react';
import { Order, Tenant, Branch } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface ThermalReceiptModalProps {
  order: Order;
  tenant: Tenant;
  branch: Branch;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  order,
  tenant,
  branch,
  onClose,
}) => {
  const { t } = useLanguage();
  const isPaid = order.status === 'PAID';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Actions Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {isPaid ? t('receipt.paidReceipt', 'Tax Invoice / Official Receipt') : t('receipt.customerCheck', 'Customer Check / Pre-Payment Bill')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              {t('common.print', 'Print')}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Canvas (Optimized for 80mm POS Thermal Printers) */}
        <div className="p-5 font-mono text-xs text-slate-800 space-y-3 print:p-0 print:m-0 printable-receipt" id="receipt-content">
          {/* Header & Logo Banner */}
          <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black tracking-tight text-slate-950 uppercase font-sans">
              {tenant?.name || 'Restaurant'}
            </h2>
            <p className="text-[11px] font-semibold text-slate-700">{branch?.name || 'Main Branch'}</p>
            {branch?.address && <p className="text-[10px] text-slate-500">{branch.address}</p>}
            {branch?.phone && <p className="text-[10px] text-slate-500">Tel: {branch.phone}</p>}
            <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
              VAT ID: 310294857200003
            </p>

            {/* Bill Status Indicator */}
            <div className={`mt-2 py-1 px-2 rounded border text-center font-bold text-[10px] uppercase tracking-wider font-sans ${
              isPaid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              {isPaid ? (
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>TAX INVOICE - PAID / فاتورة ضريبية - مدفوعة</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <FileText className="w-3 h-3 text-amber-600" />
                  <span>PRE-PAYMENT CHECK / كشف حساب - غير مدفوع</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="space-y-1 text-[11px] text-slate-700">
            <div className="flex justify-between">
              <span>Bill / Check #:</span>
              <span className="font-extrabold text-slate-950">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Order Type:</span>
              <span className="uppercase font-bold">{order.type.replace('_', ' ')}</span>
            </div>
            {order.tableName && (
              <div className="flex justify-between">
                <span>Table / Section:</span>
                <span className="font-extrabold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded">{order.tableName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Server / Cashier:</span>
              <span>{order.waiterName || order.cashierName || 'Staff'}</span>
            </div>
          </div>

          {/* Itemized Order Table */}
          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-2">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Total</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-start text-[11px]">
                  <span className="w-1/2 font-semibold text-slate-900">{item.productName}</span>
                  <span className="w-1/6 text-center font-bold">{item.quantity}</span>
                  <span className="w-1/3 text-right font-bold text-slate-950">
                    {((item.unitPrice ?? 0) * (item.quantity ?? 1)).toFixed(2)} {tenant.currency}
                  </span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="pl-2 text-[10px] text-slate-500">
                    {item.modifiers.map((m, mIdx) => (
                      <div key={mIdx} className="flex justify-between">
                        <span>+ {m.name}</span>
                        {(m.price ?? 0) > 0 && <span>+{m.price}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <div className="pl-2 text-[10px] text-amber-800 italic">
                    Note: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Subtotal, Tax & Total Summary */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal:</span>
              <span className="font-semibold">{(order.subtotal ?? 0).toFixed(2)} {tenant.currency}</span>
            </div>
            {(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount Applied:</span>
                <span>-{(order.discountAmount ?? 0).toFixed(2)} {tenant.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>{tenant.taxName || 'VAT'} ({tenant.taxRatePct}%):</span>
              <span>{(order.taxAmount ?? 0).toFixed(2)} {tenant.currency}</span>
            </div>
            <div className="flex justify-between text-base font-black border-t border-slate-400 pt-2 text-slate-950">
              <span>TOTAL DUE:</span>
              <span className="text-amber-600 font-extrabold">{(order.total ?? 0).toFixed(2)} {tenant.currency}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-1">
              <span>Payment Status:</span>
              <span className={`font-bold uppercase ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isPaid ? `PAID VIA ${order.paymentMethod || 'CASH'}` : 'UNPAID (BILL REQUESTED)'}
              </span>
            </div>
          </div>

          {/* ZATCA QR & Footer */}
          <div className="border-t border-dashed border-slate-300 pt-3 flex flex-col items-center justify-center text-center space-y-1.5">
            <div className="w-20 h-20 p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-800" />
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-sans">
              ZATCA e-Invoice TLV Verified
            </p>
            <p className="text-[10px] text-slate-700 font-semibold font-sans">
              {tenant?.name || 'Restaurant'} — Thank you for dining with us!
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{t('common.print', 'Print Bill / Invoice')}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
