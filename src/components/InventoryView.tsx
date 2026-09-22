import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Search,
  Plus,
  X,
  Building,
} from 'lucide-react';
import { Ingredient, Tenant, Branch, Supplier } from '../types/restaurant';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';

interface InventoryViewProps {
  tenant: Tenant;
  branch: Branch;
  ingredients: (Ingredient & { branchStock: number; isLowStock: boolean })[];
  suppliers?: Supplier[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  tenant,
  branch,
  ingredients,
  suppliers = [],
  onRefresh,
}) => {
  const { t, language } = useLanguage();
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
  const [newIngSupplierId, setNewIngSupplierId] = useState('');
  const [isSubmittingIng, setIsSubmittingIng] = useState(false);

  // Quick Add Supplier Modal State
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [isSubmittingSup, setIsSubmittingSup] = useState(false);

  const categories = [
    'Meat & Poultry',
    'Dairy & Cheese',
    'Produce & Vegetables',
    'Bakery & Flour',
    'Spices & Oils',
    'Beverages & Syrups',
    'Packaging & Paper',
    'General Raw Items',
  ];

  const uoms = ['kg', 'g', 'Liter', 'ml', 'pcs', 'Box', 'Bag'];

  const getCategoryTranslation = (cat: string) => {
    return t(`inventory.categories.${cat}`, cat);
  };

  const getUomTranslation = (uomVal: string) => {
    return t(`inventory.uoms.${uomVal}`, uomVal);
  };

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
          supplierId: newIngSupplierId || undefined,
        }),
      });
      setIsAddingIng(false);
      setNewIngName('');
      setNewIngSupplierId('');
      onRefresh();
    } catch (err) {
      console.error('Failed to create ingredient', err);
    } finally {
      setIsSubmittingIng(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    setIsSubmittingSup(true);
    try {
      const created = await apiFetch('/api/purchasing/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          name: newSupName.trim(),
          contactPerson: newSupContact.trim() || 'Sales Representative',
          phone: newSupPhone.trim() || '+966 50 000 0000',
          email: newSupEmail.trim() || `${newSupName.toLowerCase().replace(/\s+/g, '')}@supplier.com`,
          category: newIngCategory,
        }),
      });
      setIsAddingSupplier(false);
      setNewSupName('');
      setNewSupContact('');
      setNewSupPhone('');
      setNewSupEmail('');
      onRefresh();
      if (created && created.id) {
        setNewIngSupplierId(created.id);
      }
    } catch (e) {
      console.error('Failed to create supplier', e);
    } finally {
      setIsSubmittingSup(false);
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
              {t('inventory.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {t('nav.branch', 'Branch')}: <span className="text-white font-semibold">{branch?.name || 'Main Branch'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inventory.searchPlaceholder')}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setIsAddingIng(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{t('inventory.addRawItem')}</span>
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
                <th className="p-3.5">{t('inventory.ingredientCol')}</th>
                <th className="p-3.5">{t('inventory.categoryCol')}</th>
                <th className="p-3.5 text-center">{t('inventory.unitCol')}</th>
                <th className="p-3.5 text-right">{t('inventory.unitCostCol')}</th>
                <th className="p-3.5 text-right">{t('inventory.thresholdCol')}</th>
                <th className="p-3.5 text-right">{t('inventory.stockCol')}</th>
                <th className="p-3.5 text-center">{t('inventory.statusCol')}</th>
                <th className="p-3.5 text-center">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((item) => {
                const isLow = item.isLowStock;
                const supplierObj = suppliers.find((s) => s.id === item.supplierId);
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition font-sans">
                    <td className="p-3.5 font-bold text-white flex flex-col gap-0.5">
                      <span>{item.name}</span>
                      {supplierObj && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                          <Building className="w-3 h-3 text-amber-400" />
                          {supplierObj.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 font-normal">
                      {getCategoryTranslation(item.category)}
                    </td>
                    <td className="p-3.5 text-center font-mono uppercase font-bold text-slate-400">
                      {getUomTranslation(item.uom)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">
                      {(item.costPerUnit ?? 0).toFixed(2)} {tenant.currency}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400">
                      {item.minStockThreshold} {getUomTranslation(item.uom)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-sm text-white">
                      {item.branchStock} {getUomTranslation(item.uom)}
                    </td>
                    <td className="p-3.5 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          {t('inventory.lowStock')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('inventory.optimal')}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setWasteModalIng(item)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        {t('inventory.logWasteBtn')}
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
                <h3 className="text-base font-bold text-white">{t('inventory.logWasteTitle')}</h3>
                <p className="text-xs text-slate-400">{wasteModalIng.name}</p>
              </div>
              <button onClick={() => setWasteModalIng(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  {t('inventory.qtyToWriteOff')} ({getUomTranslation(wasteModalIng.uom)})
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
                <label className="block text-slate-400 mb-1">{t('inventory.reasonForLoss')}</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="Expired / Past Shelf Life">{language === 'ar' ? 'منتهي الصلاحية / تالف' : 'Expired / Past Shelf Life'}</option>
                  <option value="Kitchen Overcooking / Burnt">{language === 'ar' ? 'خطأ في الطهي / احتراق' : 'Kitchen Overcooking / Burnt'}</option>
                  <option value="Dropped / Contaminated">{language === 'ar' ? 'سقوط أو تلوث المواد' : 'Dropped / Contaminated'}</option>
                  <option value="Prep Trim Spoilage">{language === 'ar' ? 'هدر تجهيز وقص' : 'Prep Trim Spoilage'}</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                {t('inventory.wasteNotice')}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setWasteModalIng(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                disabled={!wasteQty || isSubmitting}
                onClick={handleLogWaste}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? t('inventory.logging') : t('inventory.confirmWriteOff')}
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
                <h3 className="text-base font-bold text-white">{t('inventory.createRawItemTitle')}</h3>
              </div>
              <button onClick={() => setIsAddingIng(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t('inventory.ingredientNameLabel')}</label>
                <input
                  type="text"
                  required
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder={t('inventory.ingredientNamePlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.categoryLabel')}</label>
                  <select
                    value={newIngCategory}
                    onChange={(e) => setNewIngCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryTranslation(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.uomLabel')}</label>
                  <select
                    value={newIngUom}
                    onChange={(e) => setNewIngUom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    {uoms.map((u) => (
                      <option key={u} value={u}>
                        {getUomTranslation(u)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Supplier Selection + Quick Add Supplier Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">{t('inventory.supplierLabel')}</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingSupplier(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t('inventory.addSupplierBtn')}</span>
                  </button>
                </div>
                <select
                  value={newIngSupplierId}
                  onChange={(e) => setNewIngSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="">{t('inventory.selectSupplierPlaceholder')}</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.unitCostLabel')} ({tenant.currency})</label>
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
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.initialStockLabel')}</label>
                  <input
                    type="number"
                    value={newIngStock}
                    onChange={(e) => setNewIngStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.minThresholdLabel')}</label>
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
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIng || !newIngName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {isSubmittingIng ? t('inventory.creating') : t('inventory.saveIngredient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Supplier Modal */}
      {isAddingSupplier && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">{t('purchasing.createSupplierTitle')}</h3>
              </div>
              <button onClick={() => setIsAddingSupplier(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.supplierNameLabel')}</label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder={t('purchasing.supplierNamePlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.contactPersonLabel')}</label>
                <input
                  type="text"
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                  placeholder="e.g. Ahmed Al-Otaibi (Sales Rep)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.phoneLabel')}</label>
                  <input
                    type="text"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.emailLabel')}</label>
                  <input
                    type="email"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    placeholder="sales@supplier.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingSupplier(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSup || !newSupName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {isSubmittingSup ? t('purchasing.creatingSupplier') : t('purchasing.saveSupplierBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
