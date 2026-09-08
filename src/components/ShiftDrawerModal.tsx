import React, { useState } from 'react';
import { Clock, Banknote, CheckCircle, AlertCircle, Lock, Unlock } from 'lucide-react';
import { Shift, Tenant, Branch } from '../types/restaurant';

interface ShiftDrawerModalProps {
  tenant: Tenant;
  branch: Branch;
  activeShift: Shift | null;
  onClose: () => void;
  onShiftUpdated: () => void;
}

export const ShiftDrawerModal: React.FC<ShiftDrawerModalProps> = ({
  tenant,
  branch,
  activeShift,
  onClose,
  onShiftUpdated,
}) => {
  const [openingFloat, setOpeningFloat] = useState<string>('500');
  const [cashierName, setCashierName] = useState<string>('Ahmed Al-Saleh');
  const [closingCash, setClosingCash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isOpen = activeShift?.status === 'OPEN';

  const handleOpenShift = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          cashierName,
          openingFloat: Number(openingFloat),
        }),
      });
      if (res.ok) {
        onShiftUpdated();
        onClose();
      }
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
      const res = await fetch(`/api/shifts/${activeShift.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualCashCount: Number(closingCash),
        }),
      });
      if (res.ok) {
        onShiftUpdated();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shiftOpeningFloat = activeShift?.openingFloat ?? activeShift?.startingFloat ?? 0;
  const shiftCashSales = activeShift?.cashSalesCollected ?? 0;
  const expectedCash = activeShift?.expectedCash ?? (shiftOpeningFloat + shiftCashSales);
  const variance = closingCash !== '' ? Number(closingCash) - expectedCash : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Cash Drawer & Shift Management
              </h3>
              <p className="text-xs text-slate-400">{branch.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {isOpen && activeShift ? (
          /* Active Shift Details & Closing */
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              <span>
                Shift actively open by <strong>{activeShift.cashierName}</strong> since{' '}
                {new Date(activeShift.openedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Opening Cash Float:</span>
                <span className="font-bold text-white">
                  {shiftOpeningFloat.toFixed(2)} {tenant.currency}
                </span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-slate-400">Cash Sales Collected:</span>
                <span className="font-bold text-emerald-400">
                  +{shiftCashSales.toFixed(2)} {tenant.currency}
                </span>
              </div>
              <div className="flex justify-between font-sans border-t border-slate-800 pt-1">
                <span className="text-slate-300 font-semibold">Expected Cash in Drawer:</span>
                <span className="font-extrabold text-amber-400">
                  {expectedCash.toFixed(2)} {tenant.currency}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-slate-300 font-semibold">
                Actual Physical Cash Count:
              </label>
              <input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder={expectedCash.toFixed(2)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
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
                <span>Drawer Cash Variance:</span>
                <span className="font-extrabold">
                  {variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)}{' '}
                  {tenant.currency} ({Math.abs(variance) < 0.01 ? 'Exact Match' : variance > 0 ? 'Over' : 'Short'})
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
              <button
                disabled={closingCash === '' || isSubmitting}
                onClick={handleCloseShift}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Closing...' : 'Close & Lock Drawer Shift'}
              </button>
            </div>
          </div>
        ) : (
          /* Open New Shift Form */
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Shift is currently closed. Enter starting float to start taking orders.</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Cashier Staff Name</label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Opening Cash Float ({tenant.currency})
              </label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
              <button
                disabled={!openingFloat || isSubmitting}
                onClick={handleOpenShift}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Opening...' : 'Open Cash Drawer & Start Shift'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
