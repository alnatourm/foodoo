import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  PackageCheck,
  Building,
  FileText,
  Trash2,
  UserPlus,
  DollarSign,
  Package,
  X,
} from 'lucide-react';
import {
  PurchaseOrder,
  Supplier,
  Ingredient,
  Tenant,
  Branch,
} from '../types/restaurant';
import { apiFetch } from '../lib/api';

interface PurchasingViewProps {
  tenant: Tenant;
  branch: Branch;
  suppliers: Supplier[];
  ingredients: Ingredient[];
  purchaseOrders: PurchaseOrder[];
  onRefresh: () => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({
  tenant,
  branch,
  suppliers,
  ingredients,
  purchaseOrders,
  onRefresh,
}) => {
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  
  // New Supplier Form State
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [isSubmittingSup, setIsSubmittingSup] = useState(false);

  // New Raw Ingredient / Item Form State
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('Meat & Poultry');
  const [newIngUom, setNewIngUom] = useState('kg');
  const [newIngCost, setNewIngCost] = useState('15');
  const [newIngMin, setNewIngMin] = useState('5');
  const [newIngStock, setNewIngStock] = useState('50');
  const [isSubmittingIng, setIsSubmittingIng] = useState(false);

  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poLines, setPoLines] = useState<
    { ingredientId: string; quantity: number; unitCost: number }[]
  >([{ ingredientId: ingredients[0]?.id || '', quantity: 10, unitCost: ingredients[0]?.costPerUnit || 10 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLine = () => {
    setPoLines([
      ...poLines,
      { ingredientId: ingredients[0]?.id || '', quantity: 10, unitCost: ingredients[0]?.costPerUnit || 10 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (poLines.length === 1) return;
    setPoLines(poLines.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return poLines.reduce((acc, line) => acc + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0), 0);
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
          contactPerson: newSupContact.trim() || 'Sales Manager',
          phone: newSupPhone.trim() || '+966 50 000 0000',
          email: newSupEmail.trim() || 'sales@supplier.com',
        }),
      });
      setIsAddingSupplier(false);
      setNewSupName('');
      setNewSupContact('');
      setNewSupPhone('');
      setNewSupEmail('');
      onRefresh();
      if (created && created.id) {
        setSelectedSupplierId(created.id);
      }
    } catch (e) {
      console.error('Failed to create supplier', e);
    } finally {
      setIsSubmittingSup(false);
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;
    setIsSubmittingIng(true);
    try {
      const created = await apiFetch('/api/inventory/ingredients', {
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
      setIsAddingIngredient(false);
      setNewIngName('');
      onRefresh();
      if (created && created.id) {
        // Auto add or update last line item
        const updated = [...poLines];
        if (updated.length > 0 && !updated[updated.length - 1].ingredientId) {
          updated[updated.length - 1] = {
            ingredientId: created.id,
            quantity: 10,
            unitCost: Number(newIngCost) || 10,
          };
        } else {
          updated.push({
            ingredientId: created.id,
            quantity: 10,
            unitCost: Number(newIngCost) || 10,
          });
        }
        setPoLines(updated);
      }
    } catch (err) {
      console.error('Failed to create ingredient', err);
    } finally {
      setIsSubmittingIng(false);
    }
  };

  const handleCreatePO = async () => {
    setIsSubmitting(true);
    try {
      const selectedSup = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
      const items = poLines.map((line) => {
        const ing = ingredients.find((i) => i.id === line.ingredientId);
        return {
          ingredientId: line.ingredientId,
          ingredientName: ing?.name || 'Raw Ingredient',
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
          totalCost: Number(line.quantity) * Number(line.unitCost),
          uom: ing?.uom || 'kg',
        };
      });

      const totalAmount = items.reduce((acc, i) => acc + i.totalCost, 0);

      await apiFetch('/api/purchasing/orders', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          poData: {
            supplierId: selectedSupplierId || selectedSup?.id,
            supplierName: selectedSup?.name || 'General Supplier',
            status: 'SENT',
            items,
            totalAmount,
          },
        }),
      });

      setIsCreatingPO(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivePO = async (poId: string) => {
    try {
      await apiFetch(`/api/purchasing/orders/${poId}/receive`, {
        method: 'POST',
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">Purchasing & Vendor Management</h2>
          </div>
          <p className="text-xs text-slate-400">
            Automated Goods Receipt (GRN) to Inventory & Accounts Payable Double-Entry Posting
          </p>
        </div>

        <button
          onClick={() => setIsCreatingPO(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order (PO)</span>
        </button>
      </div>

      {/* PO Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Date Created</th>
                <th className="p-3.5">Items Ordered</th>
                <th className="p-3.5 text-right">Total Cost</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {purchaseOrders.map((po) => {
                const isReceived = po.status === 'RECEIVED';
                return (
                  <tr key={po.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono font-bold text-white">{po.poNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-200">{po.supplierName}</td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {po.items.map((i) => `${i.quantity} ${i.uom} ${i.ingredientName}`).join(', ')}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-amber-400">
                      {(po.totalAmount ?? 0).toFixed(2)} {tenant.currency}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isReceived
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isReceived ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {!isReceived ? (
                        <button
                          onClick={() => handleReceivePO(po.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 mx-auto shadow transition"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive Goods (GRN)</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Restocked into {branch?.name || 'Branch'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New PO Modal */}
      {isCreatingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  <span>Create Purchase Order (PO)</span>
                </h3>
                <p className="text-xs text-slate-400">Destination Branch: <span className="text-amber-400 font-semibold">{branch?.name || 'Main Branch'}</span></p>
              </div>
              <button onClick={() => setIsCreatingPO(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Supplier Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span>Select Vendor / Supplier</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingSupplier(true)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-xs hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add New Supplier</span>
                  </button>
                </div>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold text-xs focus:ring-2 focus:ring-amber-500/50 outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Contact: {s.contactPerson} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Line Items */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-extrabold flex items-center gap-1.5 text-sm">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Order Line Items</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingIngredient(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create Raw Item</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                {/* Table Field Labels / Header */}
                <div className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-bold text-[11px] text-amber-400 uppercase tracking-wider">
                  <div className="col-span-5">Ingredient / Item Name</div>
                  <div className="col-span-2 text-center">Order Qty</div>
                  <div className="col-span-2 text-right">Unit Cost ({tenant.currency})</div>
                  <div className="col-span-2 text-right">Line Total ({tenant.currency})</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                {ingredients.length === 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-2">
                    <p className="font-semibold">No raw ingredients or items found in inventory master list.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddingIngredient(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition"
                    >
                      + Create First Raw Item
                    </button>
                  </div>
                )}

                {/* Line Rows */}
                <div className="space-y-2">
                  {poLines.map((line, idx) => {
                    const lineSubtotal = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0);
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                        {/* Ingredient Dropdown */}
                        <div className="col-span-5">
                          <select
                            value={line.ingredientId}
                            onChange={(e) => {
                              const updated = [...poLines];
                              updated[idx].ingredientId = e.target.value;
                              const ing = ingredients.find((i) => i.id === e.target.value);
                              if (ing) updated[idx].unitCost = ing.costPerUnit;
                              setPoLines(updated);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500"
                          >
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.uom})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Field */}
                        <div className="col-span-2">
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => {
                                const updated = [...poLines];
                                updated[idx].quantity = Number(e.target.value);
                                setPoLines(updated);
                              }}
                              className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-center font-mono text-xs font-bold focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        {/* Unit Cost Field */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitCost}
                            onChange={(e) => {
                              const updated = [...poLines];
                              updated[idx].unitCost = Number(e.target.value);
                              setPoLines(updated);
                            }}
                            className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 text-right font-mono text-xs font-bold focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="col-span-2 text-right font-mono font-extrabold text-slate-100 text-xs px-1">
                          {lineSubtotal.toFixed(2)}
                        </div>

                        {/* Remove Action */}
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            disabled={poLines.length === 1}
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total PO Cost Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Estimated Total PO Amount:</span>
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  {calculateTotal().toFixed(2)} {tenant.currency}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingPO(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreatePO}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Order...' : 'Send PO to Supplier'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Supplier Modal */}
      {isAddingSupplier && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Add New Supplier</h3>
              </div>
              <button onClick={() => setIsAddingSupplier(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="e.g. Fresh Poultry Co."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                  placeholder="e.g. Mohammed Al-Otaibi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    placeholder="sales@vendor.com"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSup || !newSupName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {isSubmittingSup ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add New Raw Ingredient / Item Modal */}
      {isAddingIngredient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Create New Raw Ingredient / Item</h3>
              </div>
              <button onClick={() => setIsAddingIngredient(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ingredient / Raw Item Name *</label>
                <input
                  type="text"
                  required
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="e.g. Premium Beef Ribeye, Olive Oil, Fresh Milk"
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
                  onClick={() => setIsAddingIngredient(false)}
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
