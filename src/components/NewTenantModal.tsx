import React, { useState } from 'react';
import { Store, Plus, Sparkles, Building2 } from 'lucide-react';
import { Tenant } from '../types/restaurant';

interface NewTenantModalProps {
  onClose: () => void;
  onTenantCreated: (tenant: Tenant) => void;
}

export const NewTenantModal: React.FC<NewTenantModalProps> = ({
  onClose,
  onTenantCreated,
}) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [country, setCountry] = useState('SA');
  const [taxName, setTaxName] = useState('VAT (ZATCA)');
  const [taxRatePct, setTaxRatePct] = useState(15);
  const [branchName, setBranchName] = useState('Downtown Flagship');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          currency,
          country,
          taxName,
          taxRatePct: Number(taxRatePct),
          branchName,
        }),
      });

      if (res.ok) {
        const createdTenant = await res.json();
        onTenantCreated(createdTenant);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Create New Restaurant (SaaS)</h3>
              <p className="text-xs text-slate-400">Multi-tenant provisioning</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Restaurant Brand Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Damascus Grill, Pizza Roma"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  if (e.target.value === 'SAR') {
                    setTaxName('VAT (ZATCA)');
                    setTaxRatePct(15);
                  } else if (e.target.value === 'AED') {
                    setTaxName('VAT (FTA)');
                    setTaxRatePct(5);
                  } else if (e.target.value === 'USD') {
                    setTaxName('Sales Tax');
                    setTaxRatePct(8.5);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="SAR">SAR (Saudi Riyal)</option>
                <option value="AED">AED (Emirati Dirham)</option>
                <option value="KWD">KWD (Kuwaiti Dinar)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Tax Label / Authority</label>
            <input
              type="text"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Initial Main Branch Name</label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Provisioning...' : 'Create Restaurant Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
