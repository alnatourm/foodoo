import React, { useState, useEffect } from 'react';
import { Clock, Unlock, Lock } from 'lucide-react';
import { Shift, Tenant, Branch, StaffUser } from '../types/restaurant';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';

interface ShiftDrawerModalProps {
  tenant: Tenant;
  branch: Branch;
  activeShift: Shift | null;
  currentUser?: StaffUser | null;
  onClose: () => void;
  onShiftUpdated: () => void;
}

export const ShiftDrawerModal: React.FC<ShiftDrawerModalProps> = ({
  tenant,
  branch,
  activeShift,
  currentUser,
  onClose,
  onShiftUpdated,
}) => {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';

  const [openingFloat, setOpeningFloat] = useState<string>('0');
  const [cashierName, setCashierName] = useState<string>(currentUser?.name || (isAr ? 'الكاشير' : 'Cashier'));
  const [closingCash, setClosingCash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isOpen = activeShift?.status === 'OPEN';

  const shiftOpeningFloat = activeShift?.openingFloat ?? activeShift?.startingFloat ?? 0;
  const shiftCashSales = activeShift?.cashSalesCollected ?? 0;
  const expectedCash = activeShift?.expectedCash ?? (shiftOpeningFloat + shiftCashSales);

  // When shift is open, pre-fill closing cash count with expected cash so user can close with 1 click
  useEffect(() => {
    if (isOpen && activeShift) {
      setClosingCash(expectedCash.toString());
    }
  }, [isOpen, activeShift?.id, expectedCash]);

  const handleOpenShift = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch('/api/shifts/open', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          cashierName: cashierName.trim() || currentUser?.name || (isAr ? 'الكاشير' : 'Cashier'),
          openingFloat: Number(openingFloat) || 0,
        }),
      });

      onShiftUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/shifts/${activeShift.id}/close`, {
        method: 'POST',
        body: JSON.stringify({
          actualCashCount: Number(closingCash) || 0,
        }),
      });

      onShiftUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variance = closingCash !== '' ? Number(closingCash) - expectedCash : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                {t('shift.title', 'إدارة وردية الكاشير ودرج النقدية')}
              </h3>
              <p className="text-xs text-slate-400">{branch?.name || (isAr ? 'الفرع الرئيسي' : 'Main Branch')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {isOpen && activeShift ? (
          /* Active Shift Details & Closing */
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Unlock className="w-4 h-4 shrink-0" />
              <span>
                {isAr ? (
                  <>الوردية مفتوحة بواسطة <strong>{activeShift.cashierName}</strong> منذ {new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                ) : (
                  <>Shift actively open by <strong>{activeShift.cashierName}</strong> since {new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                )}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">{t('shift.startingFloat', 'العهدة النقدية الافتتاحية')}:</span>
                <span className="font-bold text-white">
                  {shiftOpeningFloat.toFixed(2)} {tenant.currency}
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">{t('shift.cashSales', 'المبيعات النقدية')}:</span>
                <span className="font-bold text-emerald-400">
                  +{shiftCashSales.toFixed(2)} {tenant.currency}
                </span>
              </div>
              <div className="flex justify-between font-sans border-t border-slate-800 pt-1.5">
                <span className="text-slate-300 font-semibold">{t('shift.expectedCash', 'النقد المتوقع في الدرج')}:</span>
                <span className="font-extrabold text-amber-400">
                  {expectedCash.toFixed(2)} {tenant.currency}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-semibold">
                  {t('shift.countedCash', 'النقد الفعلي المعدود')}:
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setClosingCash(expectedCash.toString())}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700 font-bold"
                  >
                    {isAr ? 'مطابق تماماً' : 'Exact'} ({expectedCash.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClosingCash('0')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-rose-300 px-2 py-0.5 rounded-lg border border-slate-700 font-bold"
                  >
                    0.00
                  </button>
                </div>
              </div>

              <input
                type="number"
                step="0.01"
                min="0"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-amber-500"
              />
            </div>

            {closingCash !== '' && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
                  Math.abs(variance) < 0.01
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : variance > 0
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <span>{t('shift.variance', 'الفارق (عجز / زيادة)')}:</span>
                <span className="font-extrabold">
                  {variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)}{' '}
                  {tenant.currency} ({Math.abs(variance) < 0.01 ? (isAr ? 'متطابق' : 'Exact Match') : variance > 0 ? (isAr ? 'فائض' : 'Over') : (isAr ? 'عجز' : 'Short')})
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-white">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button
                disabled={closingCash === '' || isSubmitting}
                onClick={handleCloseShift}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? (isAr ? 'جاري الإغلاق...' : 'Closing...') : t('shift.closeShiftBtn', 'إغلاق الوردية ومطابقة النقدية')}
              </button>
            </div>
          </div>
        ) : (
          /* Open New Shift Form */
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'الوردية مغلقة حالياً. أدخل العهدة النقدية للبدء في استقبال الطلبات.' : 'Shift is currently closed. Enter starting float to start taking orders.'}</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">{t('shift.currentCashier', 'الكاشير المسؤول')}</label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                {t('shift.startingFloat', 'العهدة النقدية الافتتاحية')} ({tenant.currency})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold font-mono text-base focus:outline-none focus:border-amber-500"
              />

              {/* Quick Float Preset Buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                {[0, 100, 200, 500].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setOpeningFloat(num.toString())}
                    className={`flex-1 py-1 text-xs rounded-lg font-bold border transition ${
                      openingFloat === num.toString()
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {num} {tenant.currency}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-white">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button
                disabled={openingFloat === '' || isSubmitting}
                onClick={handleOpenShift}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? (isAr ? 'جاري الفتح...' : 'Opening...') : t('shift.openShiftBtn', 'فتح وردية جديدة')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
