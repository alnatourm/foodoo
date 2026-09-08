import React from 'react';
import { Printer, X, CheckCircle, QrCode } from 'lucide-react';
import { Order, Tenant, Branch } from '../types/restaurant';

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
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-200">
        {/* Actions header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Thermal Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Canvas */}
        <div className="p-6 font-mono text-xs text-slate-800 space-y-4 print:p-0 print:m-0" id="receipt-content">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-tight text-slate-950 uppercase font-sans">
              {tenant.name}
            </h2>
            <p className="text-[11px] text-slate-600">{branch.name}</p>
            <p className="text-[10px] text-slate-500">{branch.address}</p>
            <p className="text-[10px] text-slate-500">Tel: {branch.phone}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              VAT ID: 310294857200003
            </p>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="uppercase font-semibold">{order.type.replace('_', ' ')}</span>
            </div>
            {order.tableName && (
              <div className="flex justify-between">
                <span>Table:</span>
                <span className="font-bold">{order.tableName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Server:</span>
              <span>{order.waiterName || 'Cashier'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-2">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Total</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-start text-[11px]">
                  <span className="w-1/2 font-semibold text-slate-900">{item.productName}</span>
                  <span className="w-1/6 text-center">{item.quantity}</span>
                  <span className="w-1/3 text-right font-medium">
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
                  <div className="pl-2 text-[10px] text-amber-700 italic">
                    Note: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{(order.subtotal ?? 0).toFixed(2)} {tenant.currency}</span>
            </div>
            {(order.discountAmount ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span>-{(order.discountAmount ?? 0).toFixed(2)} {tenant.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>{tenant.taxName} ({tenant.taxRatePct}%):</span>
              <span>{(order.taxAmount ?? 0).toFixed(2)} {tenant.currency}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-400 pt-2 text-slate-950">
              <span>TOTAL DUE:</span>
              <span>{(order.total ?? 0).toFixed(2)} {tenant.currency}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-1">
              <span>Paid via:</span>
              <span className="font-semibold uppercase text-slate-900">
                {order.paymentMethod || 'CASH'}
              </span>
            </div>
          </div>

          {/* QR Code Simulation (ZATCA / e-Invoice compliant) */}
          <div className="border-t border-dashed border-slate-300 pt-3 flex flex-col items-center justify-center text-center space-y-1.5">
            <div className="w-24 h-24 p-1.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
              <QrCode className="w-20 h-20 text-slate-800" />
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">
              ZATCA e-Invoice TLV Verified
            </p>
            <p className="text-[10px] text-slate-600 font-semibold">
              Thank you for dining with us!
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs rounded-xl transition"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
