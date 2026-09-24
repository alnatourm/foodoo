import React, { useEffect } from "react";
import { Printer, X, ChefHat } from "lucide-react";
import { Order, Tenant } from "../types/restaurant";
import { useLanguage } from "../i18n/LanguageContext";

interface KitchenTicketModalProps {
  order: Order;
  tenant: Tenant;

  onClose: () => void;
  autoPrint?: boolean;
}

export const KitchenTicketModal: React.FC<KitchenTicketModalProps> = ({
  order,
  tenant,

  onClose,
  autoPrint = false,
}) => {
  const { language, getLocalizedName } = useLanguage();
  const isAr = language === 'ar';

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  useEffect(() => {
    const handleAfterPrint = () => {
      if (autoPrint) {
        onClose();
      }
    };
    
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [autoPrint, onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-200">
        {/* Actions header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              {isAr ? 'تذكرة المطبخ' : 'Kitchen Ticket'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              {isAr ? 'طباعة التذكرة' : 'Print Ticket'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Kitchen Ticket Canvas */}
        <div
          className="p-6 font-mono text-xs text-slate-800 space-y-4 print:p-0 print:m-0 printable-receipt"
          id="receipt-content"
        >
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold tracking-tight text-slate-950 uppercase font-sans flex items-center justify-center gap-2">
              <ChefHat className="w-5 h-5" />
              {isAr ? 'تذكرة المطبخ' : 'KITCHEN TICKET'}
            </h2>
            <p className="text-[11px] text-slate-600 uppercase">
              {order.type === 'DINE_IN' ? (isAr ? 'محلي' : 'Dine-In') : order.type === 'TAKEAWAY' ? (isAr ? 'سفري' : 'Takeaway') : order.type === 'DELIVERY' ? (isAr ? 'توصيل' : 'Delivery') : order.type}
            </p>
          </div>

          <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-sm font-bold">
            <div className="flex justify-between">
              <span>{isAr ? 'رقم الطلب:' : 'Order #:'}</span>
              <span className="text-base">{order.orderNumber}</span>
            </div>
            {order.tableName && (
              <div className="flex justify-between">
                <span>{isAr ? 'الطاولة:' : 'Table:'}</span>
                <span className="text-base">{order.tableName}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] font-normal">
              <span>{isAr ? 'التاريخ:' : 'Date:'}</span>
              <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-normal">
              <span>{isAr ? 'الخادم:' : 'Server:'}</span>
              <span>{order.waiterName || (isAr ? 'الكاشير' : 'POS')}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between text-[11px] font-normal">
                <span>{isAr ? 'العميل:' : 'Guest:'}</span>
                <span>{order.customerName}</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="border-t border-b border-solid border-slate-900 py-3 space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-start gap-2 text-sm font-bold text-slate-900">
                  <span className="border-b-2 border-slate-900 min-w-[20px] text-center pb-0.5">
                    {item.quantity}x
                  </span>
                  <span className="leading-tight">{getLocalizedName(item)}</span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="ltr:pl-8 rtl:pr-8 text-[11px] font-medium text-slate-700">
                    {item.modifiers.map((m, mIdx) => (
                      <div key={mIdx}>+ {m.name}</div>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <div className="ltr:pl-8 rtl:pr-8 text-[11px] font-bold text-red-700 italic ltr:border-l-2 rtl:border-r-2 border-red-500">
                    *** {item.notes} ***
                  </div>
                )}
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="pt-2">
              <span className="font-bold uppercase text-[11px] underline">
                {isAr ? 'ملاحظات الطلب:' : 'Order Notes:'}
              </span>
              <p className="font-bold text-xs mt-1 border-2 border-dashed border-slate-800 p-2">
                {order.notes}
              </p>
            </div>
          )}

          <div className="pt-4 text-center text-[10px] text-slate-500 uppercase tracking-wider">
            *** {isAr ? 'نهاية التذكرة' : 'END OF TICKET'} ***
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center print:hidden">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs rounded-xl transition"
          >
            {isAr ? 'إغلاق التذكرة' : 'Close Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};
