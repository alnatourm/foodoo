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
  Plus,
  X,
} from 'lucide-react';
import { Ingredient, Tenant, Branch } from '../types/restaurant';
import { apiFetch } from '../lib/api';

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

  // New Ingredient Modal State
  const [isAddingIng, setIsAddingIng] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('Meat & Poultry');
  const [newIngUom, setNewIngUom] = useState('kg');
  const [newIngCost, setNewIngCost] = useState('15');
  const [newIngMin, setNewIngMin] = useState('5');
  const [newIngStock, setNewIngStock] = useState('50');
  const [isSubmittingIng, setIsSubmittingIng] = useState(false);

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;
    setIsSubmittingIng(true);
    try {
      await apiFetch('/api/inventory/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          name: newIngName.trim(),
          category: newIngCategory,
          uom: newIngUom,
          costPerUnit: Number(newIngCost) || 10,
          minStockThreshold: Number(newIngMin) || 5,
          initialStock: Number(newIngStock) || 50,
        }),
      });
      setIsAddingIng(false);
      setNewIngName('');
      onRefresh();
    } catch (err) {
      console.error('Failed to create ingredient', err);
    } finally {
      setIsSubmittingIng(false);
    }
  };

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogWaste = async () => {
    if (!wasteModalIng || !wasteQty) return;
    setIsSubmitting(true);

    try {
      await apiFetch('/api/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          ingredientId: wasteModalIng.id,
          branchId: branch.id,
          delta: -Math.abs(Number(wasteQty)),
          reason: `waste - ${wasteReason}`,
        }),
      });

      setWasteModalIng(null);
      setWasteQty('');
      onRefresh();
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
            Branch: <span className="text-white font-semibold">{branch?.name || 'Main Branch'}</span> • Automatic BOM Depletion on Order Fire
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
            onClick={() => setIsAddingIng(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Item</span>
          </button>

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
      {/* Add New Raw Ingredient Modal */}
      {isAddingIng && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Create New Raw Ingredient</h3>
              </div>
              <button onClick={() => setIsAddingIng(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ingredient / Item Name *</label>
                <input
                  type="text"
                  required
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="e.g. Fresh Beef Patty, Olive Oil, Arabica Beans"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={newIngCategory}
                    onChange={(e) => setNewIngCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Dairy & Cheese">Dairy & Cheese</option>
                    <option value="Produce & Vegetables">Produce & Vegetables</option>
                    <option value="Bakery & Flour">Bakery & Flour</option>
                    <option value="Spices & Oils">Spices & Oils</option>
                    <option value="Beverages & Syrups">Beverages & Syrups</option>
                    <option value="Packaging & Paper">Packaging & Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={newIngUom}
                    onChange={(e) => setNewIngUom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="Liter">Liters (L)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="Box">Box</option>
                    <option value="Bag">Bag</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unit Cost ({tenant.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newIngCost}
                    onChange={(e) => setNewIngCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newIngStock}
                    onChange={(e) => setNewIngStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={newIngMin}
                    onChange={(e) => setNewIngMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingIng(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIng || !newIngName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {isSubmittingIng ? 'Creating...' : 'Save Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
