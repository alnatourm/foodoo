import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Store,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Eye,
  CreditCard,
  Search,
  Sparkles,
  Filter,
  DollarSign,
  TrendingUp,
  XCircle,
  ArrowRight,
  ChevronRight,
  UserCheck,
  Languages,
  Pencil,
  Sun,
  Moon,
} from 'lucide-react';
import { Tenant } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { EditTenantModal } from './EditTenantModal';
import { apiFetch } from '../lib/api';

interface SaasAdminPanelProps {
  tenants: Tenant[];
  onRefreshTenants: () => void;
  onSelectTenant: (tenant: Tenant) => void;
  onOpenNewTenantModal: () => void;
  onBackToApp: () => void;
}

export const SaasAdminPanel: React.FC<SaasAdminPanelProps> = ({
  tenants,
  onRefreshTenants,
  onSelectTenant,
  onOpenNewTenantModal,
  onBackToApp,
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const isAr = language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    onRefreshTenants();
  }, []);

  // Compute platform metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (t) => t.subscriptionStatus === 'ACTIVE' || !t.subscriptionStatus
  ).length;
  const pendingTenants = tenants.filter(
    (t) => t.subscriptionStatus === 'PENDING_APPROVAL'
  ).length;
  const multiTenants = tenants.filter((t) => t.plan === 'MULTI_RESTAURANT').length;
  const singleTenants = totalTenants - multiTenants;

  // Estimated MRR calculation
  const totalMrr = tenants.reduce((acc, t) => {
    if (t.subscriptionStatus === 'SUSPENDED') return acc;
    if (t.plan === 'MULTI_RESTAURANT') return acc + 199;
    return acc + 79;
  }, 0);

  // Filter tenants
  const filteredTenants = tenants.filter((t) => {
    if (!t) return false;
    const matchesSearch =
      (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ownerName && t.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.ownerEmail && t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const status = t.subscriptionStatus || 'ACTIVE';
    const matchesStatus = filterStatus === 'ALL' || status === filterStatus;

    const plan = t.plan || 'SINGLE_RESTAURANT';
    const matchesPlan = filterPlan === 'ALL' || plan === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Action: Approve Tenant
  const handleApprove = async (tenantId: string) => {
    setUpdatingId(tenantId);
    try {
      await apiFetch(`/api/tenants/${tenantId}/approve`, { method: 'POST' });
      onRefreshTenants();
    } catch (e) {
      console.error('Failed to approve tenant', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Action: Update Tenant Plan or Status
  const handleUpdateTenant = async (tenantId: string, updates: Partial<Tenant>) => {
    setUpdatingId(tenantId);
    try {
      await apiFetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      onRefreshTenants();
    } catch (e) {
      console.error('Failed to update tenant', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Action: Delete Tenant
  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!window.confirm(`Are you sure you want to delete client tenant "${tenantName}"?`)) return;
    setUpdatingId(tenantId);
    try {
      await apiFetch(`/api/tenants/${tenantId}`, { method: 'DELETE' });
      onRefreshTenants();
    } catch (e) {
      console.error('Failed to delete tenant', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* SaaS Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                {isAr ? 'لوحة تحكم مدير المنصة (RestoOS Admin)' : 'RestoOS SaaS Platform Admin Panel'}
              </h1>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {isAr ? 'الإدارة العليا HQ' : 'Super Admin HQ'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'إدارة اشتراكات العملاء، اعتماد الحسابات المعلقة، وإدارة باقات النظام'
                : 'Manage Client Subscriptions, Approve Pending Accounts, and Configure SaaS Tiers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl transition ${
              isDark
                ? 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleLanguage}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 transition flex items-center gap-1.5"
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          <button
            onClick={onOpenNewTenantModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء حساب مشترك جديد' : 'Provision New Client Tenant'}</span>
          </button>

          <button
            onClick={onBackToApp}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition flex items-center gap-2"
          >
            <span>{isAr ? 'العودة لتطبيق المطعم' : 'Back to Live Restaurant App'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High Level Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold">{isAr ? 'إجمالي العملاء' : 'Total Clients'}</span>
          <div className="text-2xl font-black text-white font-mono">{totalTenants}</div>
          <span className="text-[10px] text-slate-500">{isAr ? 'حسابات المطاعم المسجلة' : 'Registered SaaS Tenants'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-emerald-400 font-semibold">{isAr ? 'الاشتراكات النشطة' : 'Active Subscriptions'}</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{activeTenants}</div>
          <span className="text-[10px] text-slate-500">{isAr ? 'المطاعم الفعالة' : 'Operational Clients'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-amber-400 font-semibold">{isAr ? 'بانتظار الاعتماد' : 'Pending Approval'}</span>
          <div className="text-2xl font-black text-amber-400 font-mono">{pendingTenants}</div>
          <span className="text-[10px] text-slate-500">{isAr ? 'في انتظار التفعيل' : 'Awaiting Activation'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-purple-400 font-semibold">{isAr ? 'مجموعات الفروع المتعددة' : 'Multi-Restaurant Groups'}</span>
          <div className="text-2xl font-black text-purple-400 font-mono">{multiTenants}</div>
          <span className="text-[10px] text-slate-500">{isAr ? 'باقة 199$ شهرياً' : '$199/mo Tier'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs text-indigo-400 font-semibold">{isAr ? 'الإيرادات الشهرية المتوقعة' : 'Estimated Monthly MRR'}</span>
          <div className="text-2xl font-black text-indigo-400 font-mono">${totalMrr}</div>
          <span className="text-[10px] text-slate-500">{isAr ? 'إيرادات المنصة الدورية' : 'Platform Recurring Rev'}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'البحث بالاسم، المالك، أو البريد الإلكتروني...' : 'Search clients by name, owner or email...'}
            className="bg-transparent text-white outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{isAr ? 'الحالة:' : 'Status:'}</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2 py-1 outline-none"
            >
              <option value="ALL">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="ACTIVE">{isAr ? 'نشط' : 'Active'}</option>
              <option value="PENDING_APPROVAL">{isAr ? 'بانتظار الاعتماد' : 'Pending Approval'}</option>
              <option value="SUSPENDED">{isAr ? 'موقوف' : 'Suspended'}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{isAr ? 'الباقة:' : 'Plan:'}</span>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2 py-1 outline-none"
            >
              <option value="ALL">{isAr ? 'جميع الباقات' : 'All Plans'}</option>
              <option value="SINGLE_RESTAURANT">{isAr ? 'مطعم فردي' : 'Single Restaurant'}</option>
              <option value="MULTI_RESTAURANT">{isAr ? 'سلسلة مطاعم' : 'Multi-Restaurant Enterprise'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients / Tenants SaaS Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>{isAr ? `حسابات المطاعم المسجلة (${filteredTenants.length})` : `Registered SaaS Restaurant Clients (${filteredTenants.length})`}</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300" dir={isAr ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">{isAr ? 'المطعم / المشترك' : 'Restaurant / Tenant'}</th>
                <th className="p-3.5">{isAr ? 'بيانات المالك' : 'Owner Credentials'}</th>
                <th className="p-3.5">{isAr ? 'الباقة' : 'SaaS Plan'}</th>
                <th className="p-3.5">{isAr ? 'حالة الاشتراك' : 'Subscription Status'}</th>
                <th className="p-3.5">{isAr ? 'الدفع' : 'Payment'}</th>
                <th className="p-3.5 text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {isAr ? 'لا يوجد مطاعم مطابقة للبحث.' : 'No restaurant clients match your filter.'}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const status = tenant.subscriptionStatus || 'ACTIVE';
                  const plan = tenant.plan || 'SINGLE_RESTAURANT';
                  const isUpdating = updatingId === tenant.id;

                  return (
                    <tr key={tenant.id} className="hover:bg-slate-800/40 transition">
                      {/* Restaurant info */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{tenant.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {tenant.country} • {tenant.currency} ({tenant.taxRatePct}% VAT)
                        </div>
                      </td>

                      {/* Owner info */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">
                          {tenant.ownerName || (isAr ? 'مالك المطعم' : 'Restaurant Owner')}
                        </div>
                        <div className="text-[11px] text-amber-400 font-mono">
                          {tenant.ownerEmail || `owner@${tenant.slug}.com`}
                        </div>
                      </td>

                      {/* Plan & Cycle */}
                      <td className="p-3.5">
                        {plan === 'MULTI_RESTAURANT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Building2 className="w-3 h-3 text-purple-400" />
                            {isAr ? 'فروع متعددة ($199/ش)' : 'Multi-Restaurant ($199/mo)'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <Store className="w-3 h-3 text-amber-400" />
                            {isAr ? 'فرع واحد ($79/ش)' : 'Single Restaurant ($79/mo)'}
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {tenant.billingCycle === 'YEARLY' 
                            ? (isAr ? 'باقة سنوية' : 'Yearly Plan') 
                            : (isAr ? 'باقة شهرية' : 'Monthly Plan')}
                        </div>
                      </td>

                      {/* Subscription status */}
                      <td className="p-3.5">
                        {status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'نشط' : 'Active'}
                          </span>
                        )}
                        {status === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            <Clock className="w-3 h-3" />
                            {isAr ? 'في انتظار الاعتماد' : 'Pending Admin Approval'}
                          </span>
                        )}
                        {status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            {isAr ? 'موقوف' : 'Suspended'}
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="p-3.5">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                            tenant.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tenant.paymentStatus === 'WIRE_CONFIRMED'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isAr && tenant.paymentStatus === 'PAID' ? 'مدفوع' : isAr && tenant.paymentStatus === 'UNPAID' ? 'غير مدفوع' : isAr && tenant.paymentStatus === 'WIRE_CONFIRMED' ? 'مؤكد حوالة' : (tenant.paymentStatus || 'PAID')}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-right space-x-1.5 flex justify-end gap-1.5">
                        {status === 'PENDING_APPROVAL' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleApprove(tenant.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow transition disabled:opacity-50"
                            title={isAr ? "اعتماد وتفعيل الحساب" : "Approve and activate account"}
                          >
                            {isAr ? 'اعتماد' : 'Approve'}
                          </button>
                        )}

                        {status === 'ACTIVE' ? (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateTenant(tenant.id, { subscriptionStatus: 'SUSPENDED' })}
                            className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition"
                            title={isAr ? "إيقاف حساب المشترك" : "Suspend subscriber access"}
                          >
                            {isAr ? 'إيقاف' : 'Suspend'}
                          </button>
                        ) : (
                          status === 'SUSPENDED' && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleUpdateTenant(tenant.id, { subscriptionStatus: 'ACTIVE' })}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                              title={isAr ? "تفعيل الحساب" : "Reactivate subscriber"}
                            >
                              {isAr ? 'تفعيل' : 'Activate'}
                            </button>
                          )
                        )}

                        {/* Switch Plan Button */}
                        <button
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateTenant(tenant.id, {
                              plan: plan === 'SINGLE_RESTAURANT' ? 'MULTI_RESTAURANT' : 'SINGLE_RESTAURANT',
                            })
                          }
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-semibold transition"
                          title={isAr ? "تبديل الباقة" : "Toggle between Single ($79) and Multi ($199) plan"}
                        >
                          {plan === 'SINGLE_RESTAURANT' ? (isAr ? 'ترقية الباقة' : 'Upgrade Plan') : (isAr ? 'تخفيض الباقة' : 'Downgrade')}
                        </button>

                        {/* Launch app as tenant owner */}
                        <button
                          onClick={() => {
                            onSelectTenant(tenant);
                            onBackToApp();
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition inline-flex items-center gap-1"
                          title={isAr ? "الدخول لصفحة العميل" : "Log into client app"}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isAr ? 'الدخول للمطعم' : 'Open Portal'}</span>
                        </button>

                        <button
                          disabled={isUpdating}
                          onClick={() => setEditingTenant(tenant)}
                          className="p-1 rounded bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-white transition"
                          title={isAr ? "تعديل حساب المشترك" : "Edit client tenant"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                          className="p-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                          title={isAr ? "حذف الحساب" : "Delete client tenant"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onTenantUpdated={() => {
            setEditingTenant(null);
            onRefreshTenants();
          }}
        />
      )}
    </div>
  );
};
