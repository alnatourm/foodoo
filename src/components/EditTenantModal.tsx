import React, { useState, useEffect } from 'react';
import { Building2, X } from 'lucide-react';
import { Tenant } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { apiFetch } from '../lib/api';

interface EditTenantModalProps {
  tenant: Tenant;
  onClose: () => void;
  onTenantUpdated: (tenant: Tenant) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  tenant,
  onClose,
  onTenantUpdated,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  
  const [name, setName] = useState(tenant?.name || '');
  const [country, setCountry] = useState(tenant?.country || '');
  const [currency, setCurrency] = useState(tenant?.currency || '');
  const [taxRatePct, setTaxRatePct] = useState(tenant?.taxRatePct || 0);
  const [ownerName, setOwnerName] = useState(tenant?.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(tenant?.ownerEmail || '');
  const [ownerPhone, setOwnerPhone] = useState(tenant?.ownerPhone || '');
  const [ownerPassword, setOwnerPassword] = useState(tenant?.ownerPassword || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatedTenant = await apiFetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          country,
          currency,
          taxRatePct,
          ownerName,
          ownerEmail,
          ownerPhone,
          ownerPassword: ownerPassword.trim() || undefined,
        }),
      });

      onTenantUpdated(updatedTenant);
    } catch (e) {
      console.error('Failed to update tenant', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden border border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'تعديل بيانات العميل' : 'Edit Restaurant Client'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg transition text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Restaurant Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Country</label>
              <input required value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Currency (e.g. SAR)</label>
              <input required value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Tax Rate (%)</label>
              <input type="number" step="0.1" required value={taxRatePct} onChange={e => setTaxRatePct(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500" />
            </div>
            
            <div className="col-span-2 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-amber-500 mb-3">Owner Contact Details</h3>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Owner Name</label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Owner Email</label>
              <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Owner Phone</label>
              <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Owner Password (Optional)</label>
              <input type="text" placeholder="Enter new password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-amber-500 placeholder:text-slate-600" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-bold transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 transition disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
