import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  ChefHat,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  Utensils,
} from 'lucide-react';
import { StationConfig, Product, Tenant } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { apiFetch } from '../lib/api';

interface BulkStationTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: StationConfig[];
  products: Product[];
  tenant: Tenant;
  initialFromStationCode?: string;
  onTransferred: () => void;
}

export const BulkStationTransferModal: React.FC<BulkStationTransferModalProps> = ({
  isOpen,
  onClose,
  stations,
  products,
  tenant,
  initialFromStationCode,
  onTransferred,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [fromStationCode, setFromStationCode] = useState<string>(
    initialFromStationCode || stations[0]?.code || 'COLD'
  );
  const [toStationCode, setToStationCode] = useState<string>('');
  const [transferMode, setTransferMode] = useState<'ALL' | 'SELECTED'>('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // When initialFromStationCode or modal opens, initialize
  useEffect(() => {
    if (initialFromStationCode) {
      setFromStationCode(initialFromStationCode);
    } else if (stations.length > 0 && !fromStationCode) {
      setFromStationCode(stations[0].code);
    }
  }, [initialFromStationCode, stations]);

  // Set default toStationCode (different from fromStationCode)
  useEffect(() => {
    const candidate = stations.find((s) => s.code !== fromStationCode);
    if (candidate) {
      setToStationCode(candidate.code);
    } else {
      setToStationCode('');
    }
    // Reset selected items when source station changes
    setSelectedProductIds([]);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [fromStationCode, stations]);

  // Products belonging to the selected fromStationCode
  const sourceProducts = useMemo(() => {
    return products.filter((p) => {
      const pStation = (p.station || '').toUpperCase();
      const targetStation = fromStationCode.toUpperCase();
      return pStation === targetStation;
    });
  }, [products, fromStationCode]);

  // Filtered source products for search
  const filteredSourceProducts = useMemo(() => {
    if (!searchQuery.trim()) return sourceProducts;
    const q = searchQuery.toLowerCase().trim();
    return sourceProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [sourceProducts, searchQuery]);

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filteredSourceProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredSourceProducts.map((p) => p.id));
    }
  };

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  // Find source & dest station details
  const fromStation = stations.find((s) => s.code === fromStationCode);
  const toStation = stations.find((s) => s.code === toStationCode);

  const countToTransfer =
    transferMode === 'ALL' ? sourceProducts.length : selectedProductIds.length;

  const handleExecuteTransfer = async () => {
    if (!fromStationCode || !toStationCode) {
      setErrorMsg(isAr ? 'يرجى اختيار محطة المصدر والوجهة' : 'Please select both source and destination stations');
      return;
    }

    if (fromStationCode === toStationCode) {
      setErrorMsg(
        isAr
          ? 'محطة المصدر ومحطة الوجهة متطابقتان! اختر محطة مختلفة'
          : 'Source and destination stations cannot be the same!'
      );
      return;
    }

    if (countToTransfer === 0) {
      setErrorMsg(
        isAr
          ? 'لا توجد أصناف محددة للنقل'
          : 'No items selected to transfer'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        tenantId: tenant.id,
        fromStationCode,
        toStationCode,
        productIds: transferMode === 'SELECTED' ? selectedProductIds : undefined,
      };

      const res = await apiFetch('/api/stations/transfer-items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMsg(
        isAr
          ? `تم بنجاح نقل ${res.count} صنف إلى محطة "${toStation?.name || toStationCode}"!`
          : `Successfully transferred ${res.count} item(s) to "${toStation?.name || toStationCode}"!`
      );

      onTransferred();

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'فشل نقل الأصناف' : 'Failed to transfer items'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAr ? 'نقل الأصناف بين محطات المطبخ' : 'Bulk Transfer Items Between Stations'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'إعادة توجيه الأصناف وقوائم التحضير من محطة مطبخ إلى أخرى بسهولة وبشكل جماعي'
                  : 'Reassign menu preparation tickets from one kitchen station to another in bulk'}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Station Selection Cards (Source -> Destination) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Station */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {isAr ? '1. المحطة المصدر (النقل من):' : '1. From Station (Source):'}
              </label>
              <select
                value={fromStationCode}
                onChange={(e) => setFromStationCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              >
                {stations.map((st) => {
                  const count = products.filter(
                    (p) => (p.station || '').toUpperCase() === st.code.toUpperCase()
                  ).length;
                  return (
                    <option key={st.id} value={st.code}>
                      {st.name} ({st.code}) — {count} {isAr ? 'صنف' : 'items'}
                    </option>
                  );
                })}
              </select>

              {fromStation && (
                <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                  <span>{isAr ? 'الأصناف المتوفرة حالياً:' : 'Current Items:'}</span>
                  <span className="font-bold font-mono text-amber-400">
                    {sourceProducts.length} {isAr ? 'صنف' : 'Items'}
                  </span>
                </div>
              )}
            </div>

            {/* To Station */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {isAr ? '2. المحطة الوجهة (النقل إلى):' : '2. To Station (Destination):'}
              </label>
              <select
                value={toStationCode}
                onChange={(e) => setToStationCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">{isAr ? '-- اختر المحطة المستهدفة --' : '-- Select Target Station --'}</option>
                {stations
                  .filter((st) => st.code !== fromStationCode)
                  .map((st) => {
                    const count = products.filter(
                      (p) => (p.station || '').toUpperCase() === st.code.toUpperCase()
                    ).length;
                    return (
                      <option key={st.id} value={st.code}>
                        {st.name} ({st.code}) — {count} {isAr ? 'صنف حالي' : 'current items'}
                      </option>
                    );
                  })}
              </select>

              {toStation && (
                <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                  <span>{isAr ? 'اللون ورمز المحطة:' : 'Station Code:'}</span>
                  <span
                    className="font-bold font-mono px-2 py-0.5 rounded text-[11px] text-slate-950"
                    style={{ backgroundColor: toStation.color || '#10b981' }}
                  >
                    {toStation.code}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              {isAr ? '3. نطاق النقل:' : '3. Transfer Scope:'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransferMode('ALL')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  transferMode === 'ALL'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>
                  {isAr
                    ? `نقل جميع الأصناف (${sourceProducts.length})`
                    : `Transfer All Items (${sourceProducts.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTransferMode('SELECTED')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  transferMode === 'SELECTED'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>
                  {isAr
                    ? `تحديد أصناف معينة (${selectedProductIds.length})`
                    : `Select Specific Items (${selectedProductIds.length})`}
                </span>
              </button>
            </div>
          </div>

          {/* If Mode is SELECTED: Show search and product checklist */}
          {transferMode === 'SELECTED' && (
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 rtl:right-3 ltr:left-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث في أصناف المحطة المصدر...' : 'Search items in source station...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs whitespace-nowrap transition"
                >
                  {selectedProductIds.length === filteredSourceProducts.length
                    ? isAr
                      ? 'إلغاء تحديد الكل'
                      : 'Deselect All'
                    : isAr
                    ? 'تحديد الكل'
                    : 'Select All'}
                </button>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                {filteredSourceProducts.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">
                    {isAr ? 'لا توجد أصناف مطابقة في هذه المحطة' : 'No matching items in this station'}
                  </p>
                ) : (
                  filteredSourceProducts.map((prod) => {
                    const isChecked = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProduct(prod.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                          isChecked ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-amber-400">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">
                              {isAr ? prod.nameAr || prod.name : prod.name}
                            </span>
                            {prod.nameAr && prod.name && (
                              <span className="text-[10px] text-slate-400">
                                {isAr ? prod.name : prod.nameAr}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right rtl:text-left">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            {prod.price} {tenant.currency}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Transfer Preview / Confirmation Banner */}
          {toStation && countToTransfer > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  {countToTransfer}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isAr
                      ? `سيتم نقل ${countToTransfer} صنف:`
                      : `Transferring ${countToTransfer} item(s):`}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-indigo-300 mt-0.5">
                    <span className="font-bold">{fromStation?.name || fromStationCode}</span>
                    {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span className="font-bold text-emerald-400">{toStation?.name || toStationCode}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                {isAr ? 'جاهز للتنفيذ' : 'Ready'}
              </span>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleExecuteTransfer}
            disabled={isSubmitting || countToTransfer === 0 || !toStationCode || fromStationCode === toStationCode}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              {isSubmitting
                ? isAr
                  ? 'جاري النقل...'
                  : 'Transferring...'
                : isAr
                ? `تأكيد نقل (${countToTransfer}) صنف الآن`
                : `Confirm Transfer (${countToTransfer}) Items`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
