import React, { useState } from 'react';
import { X, Users, ArrowRight, UserPlus, CheckCircle } from 'lucide-react';
import { Order, OrderItem, Tenant } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface SplitBillModalProps {
  order: Order;
  tenant: Tenant;
  onClose: () => void;
  onConfirm: (guestSplits: OrderItem[][]) => Promise<void>;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  order,
  tenant,
  onClose,
  onConfirm,
}) => {
  const { language, t, formatCurrency, tCatalog } = useLanguage();
  const isAr = language === 'ar';
  const [unassignedItems, setUnassignedItems] = useState<OrderItem[]>(order.items);
  const [guests, setGuests] = useState<OrderItem[][]>([[], []]); // Start with 2 guests
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addGuest = () => {
    setGuests([...guests, []]);
  };

  const moveToGuest = (item: OrderItem, fromUnassigned: boolean, guestIndex: number) => {
    if (fromUnassigned) {
      setUnassignedItems(unassignedItems.filter(i => i.id !== item.id));
      const newGuests = [...guests];
      newGuests[guestIndex] = [...newGuests[guestIndex], item];
      setGuests(newGuests);
    }
  };

  const moveToUnassigned = (item: OrderItem, guestIndex: number) => {
    const newGuests = [...guests];
    newGuests[guestIndex] = newGuests[guestIndex].filter(i => i.id !== item.id);
    setGuests(newGuests);
    setUnassignedItems([...unassignedItems, item]);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(guests);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">{t('waiter.splitBill', 'Split Bill')} - {order.tableName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Unassigned Items */}
          <div className="w-full md:w-1/3 border-r border-slate-800 p-4 overflow-y-auto flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-3">{t('waiter.unassignedItems', 'Unassigned Items')}</h3>
            <div className="space-y-2 flex-1">
              {unassignedItems.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-4">{isAr ? 'تم توزيع جميع الأصناف' : 'All items assigned'}</div>
              )}
              {unassignedItems.map(item => (
                <div key={item.id} className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-white">
                    <span>{item.quantity}x {tCatalog(item.productName)}</span>
                    <span className="font-mono">{formatCurrency(item.unitPrice * item.quantity, tenant.currency)}</span>
                  </div>
                  {guests.length > 0 && (
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                      {guests.map((_, gIdx) => (
                        <button
                          key={gIdx}
                          onClick={() => moveToGuest(item, true, gIdx)}
                          className="px-2 py-1 text-[10px] bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 whitespace-nowrap"
                        >
                          {isAr ? `الضيف ${gIdx + 1}` : `Guest ${gIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-3 mt-3 border-t border-slate-800 ltr:text-right rtl:text-left">
              <span className="text-xs text-slate-400">{isAr ? 'إجمالي المتبقي:' : 'Total Unassigned:'} </span>
              <span className="text-sm font-bold text-white">{formatCurrency(calculateTotal(unassignedItems), tenant.currency)}</span>
            </div>
          </div>

          {/* Guests */}
          <div className="flex-1 p-4 overflow-x-auto bg-slate-950 flex gap-4">
            {guests.map((guestItems, gIdx) => (
              <div key={gIdx} className="min-w-[250px] flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col">
                <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">{isAr ? `الضيف ${gIdx + 1}` : `Guest ${gIdx + 1}`}</h3>
                  <span className="text-xs font-mono text-indigo-400">{formatCurrency(calculateTotal(guestItems), tenant.currency)}</span>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {guestItems.length === 0 && (
                    <div className="text-center text-slate-500 text-xs py-4">{isAr ? 'لا توجد أصناف' : 'No items'}</div>
                  )}
                  {guestItems.map(item => (
                    <div key={item.id} className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center text-xs group">
                      <div className="text-slate-300">
                        {item.quantity}x {tCatalog(item.productName)}
                      </div>
                      <button
                        onClick={() => moveToUnassigned(item, gIdx)}
                        className="text-rose-400 hover:text-rose-300 p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add Guest Button */}
            <div className="min-w-[200px] border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center">
              <button
                onClick={addGuest}
                className="flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-400 transition"
              >
                <div className="p-2 bg-slate-800 rounded-full"><UserPlus className="w-5 h-5" /></div>
                <span className="text-xs font-bold">{isAr ? 'إضافة ضيف +' : 'Add Guest'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={unassignedItems.length > 0 || isSubmitting}
            className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isSubmitting ? (isAr ? 'جاري المعالجة...' : 'Processing...') : (isAr ? 'تأكيد تقسيم الفاتورة' : 'Confirm Split')}
          </button>
        </div>
      </div>
    </div>
  );
};
