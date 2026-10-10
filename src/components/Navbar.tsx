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
  Lock,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { Tenant, Branch, Shift, StaffUser } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isModuleAllowedForRole } from '../lib/rbac';

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
  onGoToLanding?: () => void;
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
  onGoToLanding,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      if (onGoToLanding) onGoToLanding();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Multi-Restaurant Plan check for tenant creation
  const isMultiRestaurantPlan =
    activeTenant?.plan === 'MULTI_RESTAURANT' || currentUser?.role === 'SUPER_ADMIN';

  // Strict Tenant Visibility Isolation:
  // SUPER_ADMIN -> Can view all platform tenants
  // Regular Owner/Staff -> Can ONLY view their assigned tenant or restaurants owned by their registered email
  const visibleTenants = tenants.filter((t) => {
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    if (!currentUser) return t.id === activeTenant?.id;

    const userEmailClean = currentUser.email?.trim().toLowerCase();
    const ownerEmailClean = t.ownerEmail?.trim().toLowerCase();

    const isDirectTenantMatch = t.id === currentUser.tenantId;
    const isOwnerEmailMatch = Boolean(userEmailClean && ownerEmailClean && userEmailClean === ownerEmailClean);
    const isActiveTenantMatch = Boolean(activeTenant && t.id === activeTenant.id);

    return isDirectTenantMatch || isOwnerEmailMatch || isActiveTenantMatch;
  });

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
  const modules = allModules.filter((m) => isModuleAllowedForRole(m.id, currentUser?.role));

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      {/* Top Bar: Brand, Tenant Switcher, Branch Switcher, Shift Drawer */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* LEFT ZONE: Logo, Tenant/Branch Location & Shift */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo & SaaS Brand */}
          <div
            onClick={() => onGoToLanding && onGoToLanding()}
            className={`flex items-center gap-2.5 ${onGoToLanding ? 'cursor-pointer group' : ''}`}
            title={onGoToLanding ? 'Back to SaaS Portal / Main Landing' : undefined}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition shrink-0">
              <ChefHat className="w-4 h-4 text-slate-950" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-amber-400 transition">
                  {t('nav.brandTitle')}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t('nav.saasBadge')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">{t('nav.subtitle')}</p>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Unified Location & Branch Container */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800/90 rounded-xl px-2.5 py-1 text-xs text-slate-300 shadow-inner">
            <div className="flex items-center gap-1 text-slate-400">
              <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] text-slate-500 font-medium hidden lg:inline">{t('nav.group')}:</span>
            </div>

            {/* Tenant Selector */}
            {visibleTenants.length > 1 ? (
              <select
                value={activeTenant?.id || ''}
                onChange={(e) => {
                  const found = tenants.find((t) => t.id === e.target.value);
                  if (found) onSelectTenant(found);
                }}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
              >
                {visibleTenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.currency})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-white font-semibold text-xs whitespace-nowrap">
                {activeTenant?.name || 'panyas'}
              </span>
            )}

            <span className="text-slate-700 font-normal">|</span>

            {/* Branch Selector */}
            {branches.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                {branches.length > 1 ? (
                  <select
                    value={activeBranch?.id || ''}
                    onChange={(e) => {
                      const found = branches.find((b) => b.id === e.target.value);
                      if (found) onSelectBranch(found);
                    }}
                    className="bg-transparent text-amber-300 font-semibold outline-none cursor-pointer text-xs"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-amber-300 font-semibold text-xs whitespace-nowrap">
                    {activeBranch?.name || branches[0]?.name}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Shift Status Indicator */}
          <button
            onClick={onOpenShiftModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition shrink-0 ${
              activeShift?.status === 'OPEN'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">
              {t('nav.shift')}{' '}
              {activeShift?.status === 'OPEN' ? t('nav.shiftOpen') : t('nav.shiftClosed')}
            </span>
            <span className="lg:hidden">
              {activeShift?.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}
            </span>
          </button>
        </div>

        {/* RIGHT ZONE: User Terminal, System Preferences & Isolated Far Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Current Staff User / Switcher */}
          <button
            id="staff-switch-navbar-btn"
            type="button"
            onClick={onOpenStaffModal}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 text-white transition shadow-sm"
            title={language === 'ar' ? 'تبديل الموظف الحالي عبر رمز PIN' : 'Switch Active Staff User / PIN Terminal Login'}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser?.name ? currentUser.name.slice(0, 1).toUpperCase() : '👤'}
            </div>
            <div className="flex flex-col text-left rtl:text-right">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-amber-300 leading-tight truncate max-w-[140px]">
                  {currentUser?.name || (language === 'ar' ? 'تسجيل دخول' : 'Log In')}
                </span>
                {currentUser?.role && (
                  <span className="text-[9px] font-bold px-1 rounded bg-slate-800 text-slate-400 uppercase">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-amber-400/90 font-semibold flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-amber-400" />
                {language === 'ar' ? 'تبديل الموظف (رمز PIN)' : 'Switch User (PIN)'}
              </span>
            </div>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* System Language Toggle */}
          <button
            id="system-language-toggle-btn"
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-slate-800 transition"
            title={language === 'en' ? 'التبديل إلى الواجهة العربية' : 'Switch to English interface'}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-xs">
              {language === 'en' ? 'العربية' : 'English'}
            </span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
              isDark
                ? 'bg-slate-950/80 text-amber-300 border-slate-800 hover:bg-slate-900'
                : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline font-semibold">{language === 'ar' ? 'فاتح' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline font-semibold text-slate-800">{language === 'ar' ? 'داكن' : 'Dark'}</span>
              </>
            )}
          </button>

          {/* Divider Line Before Isolated Logout */}
          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Isolated Far-Away Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 hover:border-rose-500/50 transition shadow-sm"
            title={language === 'ar' ? 'تسجيل الخروج النهائي' : 'Log Out Account'}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold">{language === 'ar' ? 'خروج' : 'Logout'}</span>
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

