import React from 'react';
import {
  Store,
  MapPin,
  Plus,
  ShoppingCart,
  Smartphone,
  ChefHat,
  LayoutGrid,
  QrCode,
  BookOpen,
  Package,
  Truck,
  FileSpreadsheet,
  BarChart3,
  Clock,
  Sparkles,
  Languages,
  Settings,
  UserCheck,
  Crown,
} from 'lucide-react';
import { Tenant, Branch, Shift, StaffUser } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

export type ActiveModule =
  | 'POS'
  | 'WAITER'
  | 'KDS'
  | 'FLOOR'
  | 'QR_ORDER'
  | 'MENU_RECIPES'
  | 'INVENTORY'
  | 'PURCHASING'
  | 'ACCOUNTING'
  | 'ANALYTICS'
  | 'SETUP'
  | 'SHIFT';

interface NavbarProps {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  onSelectTenant: (tenant: Tenant) => void;
  branches: Branch[];
  activeBranch: Branch | null;
  onSelectBranch: (branch: Branch) => void;
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  onOpenNewTenantModal: () => void;
  onOpenShiftModal: () => void;
  activeShift: Shift | null;
  kdsCount: number;
  currentUser: StaffUser | null;
  onOpenStaffModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  tenants,
  activeTenant,
  onSelectTenant,
  branches,
  activeBranch,
  onSelectBranch,
  activeModule,
  onSelectModule,
  onOpenNewTenantModal,
  onOpenShiftModal,
  activeShift,
  kdsCount,
  currentUser,
  onOpenStaffModal,
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  const allModules: { id: ActiveModule; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'SETUP', label: t('nav.modules.setup', 'Setup & Settings'), icon: <Settings className="w-4 h-4" /> },
    { id: 'POS', label: t('nav.modules.pos', 'POS Cashier'), icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'WAITER', label: t('nav.modules.waiter', 'Waiter App'), icon: <Smartphone className="w-4 h-4" /> },
    {
      id: 'KDS',
      label: t('nav.modules.kds', 'Kitchen KDS'),
      icon: <ChefHat className="w-4 h-4" />,
      badge: kdsCount > 0 ? kdsCount : undefined,
    },
    { id: 'FLOOR', label: t('nav.modules.floor', 'Floor Plan'), icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'QR_ORDER', label: t('nav.modules.qr', 'QR Menu'), icon: <QrCode className="w-4 h-4" /> },
    { id: 'MENU_RECIPES', label: t('nav.modules.menu', 'Menu & Recipes'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'INVENTORY', label: t('nav.modules.inventory', 'Inventory'), icon: <Package className="w-4 h-4" /> },
    { id: 'PURCHASING', label: t('nav.modules.purchasing', 'Purchasing'), icon: <Truck className="w-4 h-4" /> },
    { id: 'ACCOUNTING', label: t('nav.modules.accounting', 'Accounting'), icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'ANALYTICS', label: t('nav.modules.analytics', 'Analytics'), icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Role-Based Access Control (RBAC):
  // Admin/Owner/Manager -> See All modules
  // Waiter -> See Waiter & Floor only
  // Cashier -> See POS only
  // Kitchen -> See KDS only
  // Accountant -> See Accounting & Analytics only
  const userRole = currentUser?.role || 'OWNER';
  const modules = allModules.filter((m) => {
    if (userRole === 'OWNER' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') {
      return true;
    }
    if (userRole === 'WAITER') {
      return m.id === 'WAITER' || m.id === 'FLOOR';
    }
    if (userRole === 'CASHIER') {
      return m.id === 'POS';
    }
    if (userRole === 'KITCHEN') {
      return m.id === 'KDS';
    }
    if (userRole === 'ACCOUNTANT') {
      return m.id === 'ACCOUNTING' || m.id === 'ANALYTICS';
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      {/* Top Bar: Brand, Tenant Switcher, Branch Switcher, Shift Drawer */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & SaaS Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <ChefHat className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                {t('nav.brandTitle')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t('nav.saasBadge')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{t('nav.subtitle')}</p>
          </div>
        </div>

        {/* Tenant & Branch Switchers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tenant Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 hidden sm:inline">{t('nav.group')}</span>
            <select
              value={activeTenant?.id || ''}
              onChange={(e) => {
                const found = tenants.find((t) => t.id === e.target.value);
                if (found) onSelectTenant(found);
              }}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-1"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.name} ({t.currency})
                </option>
              ))}
            </select>
            <button
              onClick={onOpenNewTenantModal}
              title={t('nav.newGroupTooltip')}
              className="p-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Branch Selector */}
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={activeBranch?.id || ''}
                onChange={(e) => {
                  const found = branches.find((b) => b.id === e.target.value);
                  if (found) onSelectBranch(found);
                }}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-1"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Shift & Cash Drawer Trigger */}
          <button
            onClick={onOpenShiftModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              activeShift?.status === 'OPEN'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {t('nav.shift')}{' '}
              {activeShift?.status === 'OPEN' ? t('nav.shiftOpen') : t('nav.shiftClosed')}
            </span>
          </button>

          {/* Current Staff User / Switcher */}
          <button
            id="staff-switch-navbar-btn"
            type="button"
            onClick={onOpenStaffModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800 text-white transition shadow-sm"
            title="Switch User / PIN Terminal Login"
          >
            <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
              {currentUser ? currentUser.name.slice(0, 1).toUpperCase() : '👤'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-slate-400 font-semibold leading-none">
                {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Staff'}
              </span>
              <span className="text-xs font-bold text-amber-300 leading-tight truncate max-w-[90px]">
                {currentUser?.name || 'Log In'}
              </span>
            </div>
            <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
              PIN ⟳
            </span>
          </button>

          {/* System Arabic / English Language Toggle */}
          <button
            id="system-language-toggle-btn"
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/15 to-amber-600/15 hover:from-amber-500/25 hover:to-amber-600/25 text-amber-300 border border-amber-500/40 transition shadow-sm"
            title={language === 'en' ? 'التبديل إلى الواجهة العربية' : 'Switch to English interface'}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold tracking-wide">
              {language === 'en' ? 'العربية' : 'English'}
            </span>
            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-[10px] font-mono text-amber-200 uppercase">
              {language}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 py-1.5">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
                {m.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {m.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

