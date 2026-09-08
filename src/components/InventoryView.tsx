import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  Sliders,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Ingredient, Tenant, Branch } from '../types/restaurant';

interface InventoryViewProps {
  tenant: Tenant;
  branch: Branch;
  ingredients: (Ingredient & { branchStock: number; isLowStock: boolean })[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  tenant,
  branch,
  ingredients,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [wasteModalIng, setWasteModalIng] = useState<Ingredient | null>(null);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('Expired / Overcooked');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogWaste = async () => {
    if (!wasteModalIng || !wasteQty) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: wasteModalIng.id,
          branchId: branch.id,
          delta: -Math.abs(Number(wasteQty)),
          reason: `waste - ${wasteReason}`,
        }),
      });

      if (res.ok) {
        setWasteModalIng(null);
        setWasteQty('');
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">
              Inventory & Real-Time Stock Tracking
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Branch: <span className="text-white font-semibold">{branch.name}</span> • Automatic BOM Depletion on Order Fire
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient or category..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Live Stock"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ingredients Inventory Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Raw Ingredient</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Unit</th>
                <th className="p-3.5 text-right">Unit Cost</th>
                <th className="p-3.5 text-right">Min Threshold</th>
                <th className="p-3.5 text-right">Available Stock</th>
                <th className="p-3.5 text-center">Health Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((item) => {
                const isLow = item.isLowStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition font-sans">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-normal">{item.category}</td>
                    <td className="p-3.5 text-center font-mono uppercase font-bold text-slate-400">
                      {item.uom}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">
                      {(item.costPerUnit ?? 0).toFixed(2)} {tenant.currency}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400">
                      {item.minStockThreshold} {item.uom}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-sm text-white">
                      {item.branchStock} {item.uom}
                    </td>
                    <td className="p-3.5 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Optimal Level
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setWasteModalIng(item)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        Log Waste
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Waste & Spoilage Modal */}
      {wasteModalIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log Kitchen Waste / Spoilage</h3>
                <p className="text-xs text-slate-400">{wasteModalIng.name}</p>
              </div>
              <button onClick={() => setWasteModalIng(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Quantity to Write Off ({wasteModalIng.uom})
                </label>
                <input
                  type="number"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  placeholder={`e.g. 5`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Loss</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="Expired / Past Shelf Life">Expired / Past Shelf Life</option>
                  <option value="Kitchen Overcooking / Burnt">Kitchen Overcooking / Burnt</option>
                  <option value="Dropped / Contaminated">Dropped / Contaminated</option>
                  <option value="Prep Trim Spoilage">Prep Trim Spoilage</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                Notice: Writing off waste automatically posts a debit to <span className="text-amber-400 font-semibold">Account 5020: Spoilage Expense</span> and credits Inventory Asset.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setWasteModalIng(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                disabled={!wasteQty || isSubmitting}
                onClick={handleLogWaste}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Logging...' : 'Confirm Write-Off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
