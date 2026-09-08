import React, { useState, useEffect } from 'react';
import {
  Store,
  ChefHat,
  Users,
  ShieldCheck,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Coins,
  Receipt,
  Percent,
  MapPin,
  Phone,
  Building,
  KeyRound,
  Crown,
  Smartphone,
  ShoppingCart,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Tenant,
  Branch,
  StationConfig,
  StaffUser,
  UserRole,
  Product,
} from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface RestaurantSetupViewProps {
  tenant: Tenant;
  branches: Branch[];
  products: Product[];
  currentUser: StaffUser | null;
  onTenantUpdated: (updated: Tenant) => void;
  onRefreshAll: () => void;
  onSelectUser: (user: StaffUser) => void;
}

type SettingsTab = 'PROFILE' | 'STATIONS' | 'STAFF' | 'ROLES_MATRIX';

export const RestaurantSetupView: React.FC<RestaurantSetupViewProps> = ({
  tenant,
  branches,
  products,
  currentUser,
  onTenantUpdated,
  onRefreshAll,
  onSelectUser,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');

  // General Form State
  const [restaurantName, setRestaurantName] = useState<string>(tenant.name || '');
  const [legalName, setLegalName] = useState<string>(tenant.legalName || '');
  const [country, setCountry] = useState<string>(tenant.country || 'Saudi Arabia');
  const [currency, setCurrency] = useState<string>(tenant.currency || 'SAR');
  const [currencySymbol, setCurrencySymbol] = useState<string>(tenant.currencySymbol || '﷼');
  const [taxRatePct, setTaxRatePct] = useState<number>(tenant.taxRatePct ?? 15);
  const [taxName, setTaxName] = useState<string>(tenant.taxName || 'ZATCA VAT 15%');
  const [serviceChargePct, setServiceChargePct] = useState<number>(tenant.serviceChargePct ?? 0);
  const [voidPassword, setVoidPassword] = useState<string>(tenant.voidPassword || '1234');
  const [showVoidPassword, setShowVoidPassword] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>(tenant.phone || '');
  const [address, setAddress] = useState<string>(tenant.address || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Stations State
  const [stations, setStations] = useState<StationConfig[]>(tenant.stations || []);
  const [isStationModalOpen, setIsStationModalOpen] = useState<boolean>(false);
  const [editingStation, setEditingStation] = useState<StationConfig | null>(null);
  const [stationName, setStationName] = useState<string>('');
  const [stationCode, setStationCode] = useState<string>('');
  const [stationColor, setStationColor] = useState<string>('#f59e0b');
  const [stationDesc, setStationDesc] = useState<string>('');
  const [stationError, setStationError] = useState<string | null>(null);

  // Staff State
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffRole, setStaffRole] = useState<UserRole>('WAITER');
  const [staffPin, setStaffPin] = useState<string>('1234');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [staffStation, setStaffStation] = useState<string>('');
  const [staffActive, setStaffActive] = useState<boolean>(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [showPinMap, setShowPinMap] = useState<Record<string, boolean>>({});

  // Sync tenant prop changes
  useEffect(() => {
    setRestaurantName(tenant.name || '');
    setLegalName(tenant.legalName || '');
    setCountry(tenant.country || 'Saudi Arabia');
    setCurrency(tenant.currency || 'SAR');
    setCurrencySymbol(tenant.currencySymbol || '﷼');
    setTaxRatePct(tenant.taxRatePct ?? 15);
    setTaxName(tenant.taxName || 'ZATCA VAT 15%');
    setServiceChargePct(tenant.serviceChargePct ?? 0);
    setVoidPassword(tenant.voidPassword || '1234');
    setPhone(tenant.phone || '');
    setAddress(tenant.address || '');
    setStations(tenant.stations || []);
  }, [tenant]);

  // Load staff
  const loadStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const res = await fetch(`/api/staff?tenantId=${tenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [tenant.id]);

  // Handle Save Restaurant Profile & Currency
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const payload: Partial<Tenant> = {
        name: restaurantName.trim(),
        legalName: legalName.trim(),
        country: country.trim(),
        currency: currency.trim().toUpperCase(),
        currencySymbol: currencySymbol.trim(),
        taxRatePct: Number(taxRatePct),
        taxName: taxName.trim(),
        serviceChargePct: Number(serviceChargePct),
        voidPassword: voidPassword.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };

      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onTenantUpdated(updated);
        setProfileSuccessMsg(t('setup.savedSuccess', 'Restaurant settings saved successfully!'));
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Kitchen Station Handlers
  const handleOpenAddStation = () => {
    setEditingStation(null);
    setStationName('');
    setStationCode('');
    setStationColor('#f59e0b');
    setStationDesc('');
    setStationError(null);
    setIsStationModalOpen(true);
  };

  const handleOpenEditStation = (station: StationConfig) => {
    setEditingStation(station);
    setStationName(station.name);
    setStationCode(station.code);
    setStationColor(station.color || '#f59e0b');
    setStationDesc(station.description || '');
    setStationError(null);
    setIsStationModalOpen(true);
  };

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName.trim()) {
      setStationError('Station name is required');
      return;
    }

    try {
      const payload = {
        tenantId: tenant.id,
        name: stationName.trim(),
        code: (stationCode.trim() || stationName.trim()).toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        color: stationColor,
        description: stationDesc.trim(),
      };

      let res: Response;
      if (editingStation) {
        res = await fetch(`/api/stations/${editingStation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const savedStation = await res.json();
        if (editingStation) {
          setStations((prev) => prev.map((s) => (s.id === editingStation.id ? savedStation : s)));
        } else {
          setStations((prev) => [...prev, savedStation]);
        }
        setIsStationModalOpen(false);
        onRefreshAll();
      } else {
        const err = await res.json();
        setStationError(err.error || 'Failed to save station');
      }
    } catch (err: any) {
      setStationError(err.message || 'Error occurred');
    }
  };

  const handleDeleteStation = async (station: StationConfig) => {
    const assigned = products.filter(
      (p) => p.station === station.code || p.station === station.id
    ).length;

    if (assigned > 0) {
      alert(
        `Cannot delete "${station.name}" because ${assigned} menu item(s) are assigned to it. Please reassign those menu items to another station first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete kitchen station "${station.name}"?`)) return;

    try {
      const res = await fetch(`/api/stations/${station.id}?tenantId=${tenant.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStations((prev) => prev.filter((s) => s.id !== station.id));
        onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete station');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Staff Handlers
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffRole('WAITER');
    setStaffPin(String(Math.floor(1000 + Math.random() * 9000)));
    setStaffEmail('');
    setStaffPhone('');
    setStaffStation(stations[0]?.code || '');
    setStaffActive(true);
    setStaffError(null);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffUser) => {
    setEditingStaff(staff);
    setStaffName(staff.name);
    setStaffRole(staff.role);
    setStaffPin(staff.pinCode);
    setStaffEmail(staff.email || '');
    setStaffPhone(staff.phone || '');
    setStaffStation(staff.assignedStation || '');
    setStaffActive(staff.isActive);
    setStaffError(null);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setStaffError('Staff name is required');
      return;
    }
    if (!staffPin.trim() || staffPin.trim().length < 4) {
      setStaffError('A valid 4-digit PIN is required');
      return;
    }

    try {
      const payload = {
        tenantId: tenant.id,
        name: staffName.trim(),
        role: staffRole,
        pinCode: staffPin.trim(),
        email: staffEmail.trim(),
        phone: staffPhone.trim(),
        assignedStation: staffRole === 'KITCHEN' ? staffStation : undefined,
        isActive: staffActive,
      };

      let res: Response;
      if (editingStaff) {
        res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        if (editingStaff) {
          setStaffList((prev) => prev.map((s) => (s.id === editingStaff.id ? saved : s)));
        } else {
          setStaffList((prev) => [...prev, saved]);
        }
        setIsStaffModalOpen(false);
      } else {
        const err = await res.json();
        setStaffError(err.error || 'Failed to save staff');
      }
    } catch (err: any) {
      setStaffError(err.message || 'Error occurred');
    }
  };

  const handleDeleteStaff = async (staff: StaffUser) => {
    if (staffList.length <= 1) {
      alert('You cannot delete the only remaining staff account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete staff account for "${staff.name}"?`)) return;

    try {
      const res = await fetch(`/api/staff/${staff.id}`, { method: 'DELETE' });
      if (res.ok) {
        setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePinVisibility = (staffId: string) => {
    setShowPinMap((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'OWNER':
        return {
          label: 'Admin / Owner',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <Crown className="w-3.5 h-3.5 text-purple-400" />,
        };
      case 'MANAGER':
        return {
          label: 'Manager',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />,
        };
      case 'CASHIER':
        return {
          label: 'POS Cashier',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'WAITER':
        return {
          label: 'Waiter / Server',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <Smartphone className="w-3.5 h-3.5 text-blue-400" />,
        };
      case 'KITCHEN':
        return {
          label: 'Kitchen Station',
          color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          icon: <ChefHat className="w-3.5 h-3.5 text-orange-400" />,
        };
      case 'ACCOUNTANT':
        return {
          label: 'Accountant',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />,
        };
      default:
        return {
          label: role,
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
          icon: <Users className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Store className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  {t('setup.title', 'Restaurant Setup & System Administration')}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                  {tenant.currency} • {tenant.country}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                {t(
                  'setup.subtitle',
                  'Configure restaurant profile, currency, kitchen stations, staff accounts, void passcodes, and role permissions.'
                )}
              </p>
            </div>
          </div>

          {/* Quick Active User Indicator */}
          {currentUser && (
            <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Logged In As
                </span>
                <span className="font-bold text-white">{currentUser.name}</span>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-bold border ${getRoleBadge(currentUser.role).color}`}
              >
                {getRoleBadge(currentUser.role).label}
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'PROFILE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>{t('setup.tabProfile', 'Restaurant & Currency')}</span>
          </button>

          <button
            onClick={() => setActiveTab('STATIONS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'STATIONS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>{t('setup.tabStations', 'Kitchen Stations')}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold text-amber-400">
              {stations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('STAFF')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'STAFF'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('setup.tabStaff', 'Staff & User Accounts')}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold text-amber-400">
              {staffList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ROLES_MATRIX')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'ROLES_MATRIX'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('setup.tabRoles', 'Role Permissions (RBAC)')}</span>
          </button>
        </div>

        {/* TAB 1: RESTAURANT PROFILE, CURRENCY, TAX & VOID PASSWORD */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {profileSuccessMsg && (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-sm animate-in fade-in">
                <Check className="w-5 h-5 shrink-0 text-emerald-400" />
                <span className="font-semibold">{profileSuccessMsg}</span>
              </div>
            )}

            {/* General Identity & Currency Grid */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <Coins className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base text-white">
                  {t('setup.generalInfo', 'Restaurant Identity & Currency Settings')}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Restaurant Brand Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.restaurantName', 'Restaurant Name')} *
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Sultan Burger & Smokehouse"
                  />
                </div>

                {/* Legal Entity Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.legalName', 'Legal Registered Company Name')}
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Sultan Hospitality Group LLC"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.country', 'Country / Jurisdiction')}
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="Saudi Arabia">Saudi Arabia (KSA)</option>
                    <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Bahrain">Bahrain</option>
                    <option value="Oman">Oman</option>
                    <option value="Egypt">Egypt</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>

                {/* Currency Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.currency', 'Primary Currency & Symbol')} *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={currency}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrency(val);
                        // Auto-set symbol
                        if (val === 'SAR') setCurrencySymbol('﷼');
                        else if (val === 'AED') setCurrencySymbol('د.إ');
                        else if (val === 'USD') setCurrencySymbol('$');
                        else if (val === 'EUR') setCurrencySymbol('€');
                        else if (val === 'GBP') setCurrencySymbol('£');
                        else if (val === 'KWD') setCurrencySymbol('KD');
                        else if (val === 'QAR') setCurrencySymbol('QR');
                        else if (val === 'EGP') setCurrencySymbol('E£');
                        else setCurrencySymbol(val);
                      }}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="SAR">SAR - Saudi Riyal (﷼)</option>
                      <option value="AED">AED - UAE Dirham (د.إ)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                      <option value="KWD">KWD - Kuwaiti Dinar (KD)</option>
                      <option value="QAR">QAR - Qatari Riyal (QR)</option>
                      <option value="BHD">BHD - Bahraini Dinar (BD)</option>
                      <option value="OMR">OMR - Omani Rial (RO)</option>
                      <option value="EGP">EGP - Egyptian Pound (E£)</option>
                    </select>

                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      placeholder="Symbol e.g. ﷼"
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-center text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Tax & VAT Configuration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.taxSystem', 'Tax System Name')}
                  </label>
                  <input
                    type="text"
                    value={taxName}
                    onChange={(e) => setTaxName(e.target.value)}
                    placeholder="e.g. ZATCA VAT 15%"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Tax Rate % */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.taxRate', 'Tax / VAT Rate %')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={taxRatePct}
                      onChange={(e) => setTaxRatePct(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                    <Percent className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Service Charge % */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.serviceCharge', 'Service Charge % (Dine-In)')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={serviceChargePct}
                      onChange={(e) => setServiceChargePct(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                    <Percent className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.phone', 'Contact Telephone')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 11 456 7890"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {t('setup.address', 'Headquarters / Main Restaurant Address')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. King Fahd Road, Al Olaya District, Riyadh"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* SECURITY & VOID PASSWORD BOX */}
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-white">
                      {t('setup.voidSecurity', 'Void Password & Operations Protection')}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Required by Cashiers & Waiters when voiding active ticket items or cancelling orders.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-xs font-bold border border-rose-500/20">
                  Audit Protected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {t('setup.voidPasscode', 'Manager Void Password / PIN')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showVoidPassword ? 'text' : 'password'}
                      value={voidPassword}
                      onChange={(e) => setVoidPassword(e.target.value)}
                      required
                      placeholder="e.g. 1234"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVoidPassword(!showVoidPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showVoidPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used to authorize voids in POS Cashier and Waiter Handheld modules.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>How Manager Voids Work:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    When any cashier or server clicks "Void Item" or "Cancel Order", RestoOS requires
                    this Void Password (or any Admin/Manager PIN). Every void is permanently logged in the
                    accounting ledger.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/25 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingProfile ? t('common.saving', 'Saving...') : t('setup.saveChanges', 'Save Restaurant Settings')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: KITCHEN STATIONS MANAGEMENT */}
        {activeTab === 'STATIONS' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t('setup.stationsTitle', 'Kitchen Preparation Stations')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Orders automatically route tickets to their designated kitchen station (KDS displays, hot line, fryers, cold prep, etc.).
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddStation}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t('setup.addStation', 'Add New Station')}</span>
              </button>
            </div>

            {/* Stations Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station) => {
                const assignedProducts = products.filter(
                  (p) => p.station === station.code || p.station === station.id
                );

                return (
                  <div
                    key={station.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 relative group hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 shadow-md"
                          style={{ backgroundColor: station.color || '#f59e0b' }}
                        >
                          <ChefHat className="w-5 h-5 text-slate-950" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{station.name}</h3>
                          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-bold">
                            CODE: {station.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditStation(station)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Station"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStation(station)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                          title="Delete Station"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {station.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {station.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Assigned Menu Items:</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold">
                        {assignedProducts.length} Items
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: STAFF & USER ACCOUNTS (RBAC) */}
        {activeTab === 'STAFF' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t('setup.staffTitle', 'Restaurant Staff & Access Credentials')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track who takes orders, who rings sales at POS, and enforce screen permissions by role.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddStaff}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t('setup.addStaff', 'Add Staff Member')}</span>
              </button>
            </div>

            {/* Staff Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Staff Member</th>
                      <th className="px-4 py-3.5">Role & Permission</th>
                      <th className="px-4 py-3.5">Assigned Station</th>
                      <th className="px-4 py-3.5">Terminal PIN</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {staffList.map((staff) => {
                      const badge = getRoleBadge(staff.role);
                      const isCurrent = currentUser?.id === staff.id;
                      const isPinVisible = showPinMap[staff.id];

                      return (
                        <tr
                          key={staff.id}
                          className={`hover:bg-slate-800/40 transition ${
                            isCurrent ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs">
                                {staff.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-white">
                                  <span>{staff.name}</span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {staff.email || staff.phone || 'No direct contact'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs border ${badge.color}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-slate-300">
                            {staff.assignedStation ? (
                              <span className="font-mono text-amber-300 font-semibold">
                                {staff.assignedStation}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-200">
                                {isPinVisible ? staff.pinCode : '••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePinVisibility(staff.id)}
                                className="text-slate-500 hover:text-slate-300"
                              >
                                {isPinVisible ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            {staff.isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSelectUser(staff)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 text-[11px] font-semibold transition border border-slate-700"
                                title="Switch to this user to test their permissions"
                              >
                                Log In
                              </button>
                              <button
                                onClick={() => handleOpenEditStaff(staff)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title="Edit Staff"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                                title="Delete Staff"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROLES & ACCESS CONTROL MATRIX */}
        {activeTab === 'ROLES_MATRIX' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('setup.rbacTitle', 'Role-Based Access Control (RBAC) Architecture')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each role in RestoOS is strictly scoped to prevent unauthorized access while keeping employee workflows fast.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Admin Card */}
              <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Admin / Owner / Manager</h3>
                    <span className="text-[11px] text-purple-300">Full System Access</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restaurant Setup & System Administration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Point of Sale (POS) Cashier</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Waiter App & Table Ordering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kitchen Display System (KDS)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Menu, Recipes & Inventory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Accounting, Journals, & Multi-Branch P&L</span>
                  </li>
                </ul>
              </div>

              {/* Waiter Card */}
              <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Waiter / Server</h3>
                    <span className="text-[11px] text-blue-300">Table Orders & Floor Only</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Waiter Handheld App</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Table Floor Plan & Table Status</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fire Orders with Waiter Name tagged</span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Blocked from Accounting & Admin Settings</span>
                  </li>
                </ul>
              </div>

              {/* Cashier Card */}
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">POS Cashier</h3>
                    <span className="text-[11px] text-amber-300">Checkout & Shift Drawer</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>POS Terminal Direct Checkout</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Shift Cash Drawer (Float / Reconciliation)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reprint Receipts tagged with Cashier Name</span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Blocked from Menu Recipes & Admin Settings</span>
                  </li>
                </ul>
              </div>

              {/* Kitchen Card */}
              <div className="bg-slate-900/90 border border-orange-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Kitchen Staff</h3>
                    <span className="text-[11px] text-orange-300">Kitchen Display (KDS) Only</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kitchen Display Screen (KDS)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Assigned Station Filter (Grill, Fryer, etc.)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bump & Complete ticket items</span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Blocked from POS, Sales & Financial data</span>
                  </li>
                </ul>
              </div>

              {/* Accountant Card */}
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Accountant</h3>
                    <span className="text-[11px] text-emerald-300">Financials & Reports Only</span>
                  </div>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Accounting & General Ledger</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Profit & Loss (P&L) and COGS Analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sales Performance Analytics</span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Blocked from POS Ordering & Setup editing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT KITCHEN STATION */}
      {isStationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">
              {editingStation ? 'Edit Kitchen Station' : 'Create Kitchen Station'}
            </h3>

            {stationError && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {stationError}
              </div>
            )}

            <form onSubmit={handleSaveStation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Station Name *</label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g. Pizza & Bakery Station"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Station Code (Uppercase slug)
                </label>
                <input
                  type="text"
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  placeholder="e.g. PIZZA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Display Color Tag</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stationColor}
                    onChange={(e) => setStationColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-slate-300">{stationColor}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={stationDesc}
                  onChange={(e) => setStationDesc(e.target.value)}
                  placeholder="e.g. Stone baked pizzas, garlic breads, and calzones"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStationModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">
              {editingStaff ? 'Edit Staff Account' : 'Add New Staff Member'}
            </h3>

            {staffError && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {staffError}
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Tariq Mansoor"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role / Permission *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="OWNER">Admin / Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CASHIER">POS Cashier</option>
                    <option value="WAITER">Waiter / Server</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">4-Digit Login PIN *</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tracking-widest text-center font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {staffRole === 'KITCHEN' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Assigned Kitchen Station
                  </label>
                  <select
                    value={staffStation}
                    onChange={(e) => setStaffStation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="">All Stations</option>
                    {stations.map((st) => (
                      <option key={st.id} value={st.code}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="staff@restaurant.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+966 50 123 4567"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="staff-active-toggle"
                  checked={staffActive}
                  onChange={(e) => setStaffActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500"
                />
                <label htmlFor="staff-active-toggle" className="text-slate-300 font-semibold cursor-pointer">
                  Account is Active
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
