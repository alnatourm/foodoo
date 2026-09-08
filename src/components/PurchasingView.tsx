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
} from 'lucide-react';
import {
  PurchaseOrder,
  Supplier,
  Ingredient,
  Tenant,
  Branch,
} from '../types/restaurant';

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
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poLines, setPoLines] = useState<
    { ingredientId: string; quantity: number; unitCost: number }[]
  >([{ ingredientId: ingredients[0]?.id || '', quantity: 20, unitCost: ingredients[0]?.costPerUnit || 10 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLine = () => {
    setPoLines([
      ...poLines,
      { ingredientId: ingredients[0]?.id || '', quantity: 10, unitCost: ingredients[0]?.costPerUnit || 10 },
    ]);
  };

  const handleCreatePO = async () => {
    setIsSubmitting(true);
    try {
      const selectedSup = suppliers.find((s) => s.id === selectedSupplierId);
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

      const res = await fetch('/api/purchasing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          poData: {
            supplierId: selectedSupplierId,
            supplierName: selectedSup?.name || 'Supplier',
            status: 'SENT',
            items,
            totalAmount,
          },
        }),
      });

      if (res.ok) {
        setIsCreatingPO(false);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivePO = async (poId: string) => {
    try {
      const res = await fetch(`/api/purchasing/orders/${poId}/receive`, {
        method: 'POST',
      });
      if (res.ok) {
        onRefresh();
      }
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
                          Restocked into {branch.name}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Create Purchase Order (PO)</h3>
                <p className="text-xs text-slate-400">Destination: {branch.name}</p>
              </div>
              <button onClick={() => setIsCreatingPO(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-semibold">Order Line Items</label>
                  <button
                    onClick={handleAddLine}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    + Add Ingredient
                  </button>
                </div>

                {poLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={line.ingredientId}
                      onChange={(e) => {
                        const updated = [...poLines];
                        updated[idx].ingredientId = e.target.value;
                        const ing = ingredients.find((i) => i.id === e.target.value);
                        if (ing) updated[idx].unitCost = ing.costPerUnit;
                        setPoLines(updated);
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.uom})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...poLines];
                        updated[idx].quantity = Number(e.target.value);
                        setPoLines(updated);
                      }}
                      placeholder="Qty"
                      className="w-20 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-right text-xs"
                    />

                    <input
                      type="number"
                      value={line.unitCost}
                      onChange={(e) => {
                        const updated = [...poLines];
                        updated[idx].unitCost = Number(e.target.value);
                        setPoLines(updated);
                      }}
                      placeholder="Cost"
                      className="w-20 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-right text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingPO(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleCreatePO}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send PO to Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
