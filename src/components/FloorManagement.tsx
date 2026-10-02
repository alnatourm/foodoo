import React, { useState } from 'react';
import {
  LayoutGrid,
  Users,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  X,
  UserCheck,
  Printer,
  Search,
  Grid,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import { RestaurantTable, TableStatus, Order, Tenant, StaffUser, Branch } from '../types/restaurant';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';

interface FloorManagementProps {
  tenant: Tenant;
  branch?: Branch | null;
  tables: RestaurantTable[];
  orders: Order[];
  currentUser?: StaffUser | null;
  onSelectTableForOrder: (table: RestaurantTable) => void;
  onTableStatusChange: (tableId: string, status: TableStatus) => void;
  onRefreshTables?: () => void;
  onShowReceipt?: (order: Order) => void;
}

export const FloorManagement: React.FC<FloorManagementProps> = ({
  tenant,
  branch,
  tables,
  orders,
  currentUser,
  onSelectTableForOrder,
  onTableStatusChange,
  onRefreshTables,
  onShowReceipt,
}) => {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [gridDensity, setGridDensity] = useState<'COMPACT' | 'MEDIUM' | 'DETAILED'>(
    tables.length > 25 ? 'COMPACT' : 'MEDIUM'
  );
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'DIRTY'>('ALL');

  // Modal State for Add / Edit Table
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableSection, setTableSection] = useState<'MAIN_HALL' | 'OUTDOOR_TERRACE' | 'VIP_LOUNGE'>('MAIN_HALL');
  const [capacity, setCapacity] = useState<number>(4);
  const [bulkCount, setCapacityBulk] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = !currentUser || currentUser.role === 'OWNER' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MANAGER';

  const countFree = tables.filter((t) => t.status === 'FREE').length;
  const countOccupied = tables.filter((t) => t.status === 'OCCUPIED').length;
  const countBill = tables.filter((t) => t.status === 'BILL_REQUESTED').length;
  const countDirty = tables.filter((t) => t.status === 'DIRTY').length;

  const getSectionLabel = (section: string) => {
    if (isAr) {
      switch (section) {
        case 'MAIN_HALL': return 'الصالة الرئيسية';
        case 'OUTDOOR_TERRACE': return 'التراس الخارجي';
        case 'VIP_LOUNGE': return 'جناح VIP';
        default: return section;
      }
    }
    return section.replace('_', ' ');
  };

  const getStatusLabel = (status: TableStatus) => {
    if (isAr) {
      switch (status) {
        case 'FREE': return 'متاحة';
        case 'OCCUPIED': return 'مشغولة';
        case 'BILL_REQUESTED': return 'تم طلب الحساب';
        case 'DIRTY': return 'تحتاج تنظيف';
        default: return status;
      }
    }
    return status.replace('_', ' ');
  };

  const filteredTables = tables.filter((t) => {
    const matchesSection = selectedSection === 'ALL' || t.section === selectedSection;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const q = tableSearchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      t.number.toLowerCase().includes(q) ||
      (t.assignedWaiter && t.assignedWaiter.toLowerCase().includes(q));
    return matchesSection && matchesStatus && matchesQuery;
  });

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'FREE':
        return 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-400';
      case 'OCCUPIED':
        return 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400';
      case 'BILL_REQUESTED':
        return 'border-indigo-500 bg-indigo-950/30 hover:border-indigo-400 animate-pulse';
      case 'DIRTY':
        return 'border-rose-500/50 bg-rose-950/20 hover:border-rose-400';
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'FREE':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'OCCUPIED':
        return 'bg-amber-500/20 text-amber-300';
      case 'BILL_REQUESTED':
        return 'bg-indigo-500/30 text-indigo-200';
      case 'DIRTY':
        return 'bg-rose-500/20 text-rose-300';
    }
  };

  const handleOpenAddModal = () => {
    setEditingTable(null);
    setTableNumber(`T-${tables.length + 1 < 10 ? '0' + (tables.length + 1) : tables.length + 1}`);
    setTableSection('MAIN_HALL');
    setCapacity(4);
    setErrorMsg(null);
    setIsTableModalOpen(true);
  };

  const handleOpenEditModal = (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTable(table);
    setTableNumber(table.number);
    setTableSection(table.section);
    setCapacity(table.capacity);
    setErrorMsg(null);
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setErrorMsg('Table number / name is required');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        tenantId: tenant.id,
        branchId: branch?.id,
        number: tableNumber.trim(),
        section: tableSection,
        capacity: Number(capacity) || 4,
      };

      if (editingTable) {
        await apiFetch(`/api/tables/${editingTable.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/tables', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsTableModalOpen(false);
      if (onRefreshTables) onRefreshTables();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save table');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTable = async (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
      });
      if (onRefreshTables) onRefreshTables();
    } catch (err: any) {
      console.error('Failed to delete table', err);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Floor Overview Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">{isAr ? 'إدارة الصالة ومخطط الطاولات' : t('floor.title', 'Floor & Table Management')}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-extrabold border border-amber-500/20">
              {tables.length} {isAr ? 'طاولة' : 'Tables'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr ? 'متابعة لحظية لإشغال الصالة وتوزيع الطاولات المتقدم' : t('floor.subtitle', 'Real-time dining room occupancy & seating arrangement')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Section Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedSection('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedSection === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'جميع الأقسام' : t('floor.allSections', 'All Sections')}
            </button>
            <button
              onClick={() => setSelectedSection('MAIN_HALL')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedSection === 'MAIN_HALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'الصالة' : 'Main Hall'}
            </button>
            <button
              onClick={() => setSelectedSection('OUTDOOR_TERRACE')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedSection === 'OUTDOOR_TERRACE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'التراس' : 'Terrace'}
            </button>
            <button
              onClick={() => setSelectedSection('VIP_LOUNGE')}
              className={`px-3 py-1 rounded-lg transition ${
                selectedSection === 'VIP_LOUNGE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'VIP' : 'VIP'}
            </button>
          </div>

          {/* Admin Action: Add Table Button */}
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'طاولة جديدة +' : t('floor.addTable', 'Add Table')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Density, Search & Status Quick Filter Bar */}
      <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={tableSearchQuery}
            onChange={(e) => setTableSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث سريع برقم الطاولة (مثلاً: 120 أو T-50)...' : 'Search table number (e.g. 120 or T-50)...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 rtl:pl-3 rtl:pr-9 font-mono"
          />
          {tableSearchQuery && (
            <button
              onClick={() => setTableSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs p-0.5 rtl:right-auto rtl:left-2.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition ${
              statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({tables.length})
          </button>
          <button
            onClick={() => setStatusFilter('FREE')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              statusFilter === 'FREE' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{isAr ? 'متاحة' : 'Free'} ({countFree})</span>
          </button>
          <button
            onClick={() => setStatusFilter('OCCUPIED')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              statusFilter === 'OCCUPIED' ? 'bg-amber-500 text-slate-950' : 'text-amber-400 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{isAr ? 'مشغولة' : 'Occupied'} ({countOccupied})</span>
          </button>
          <button
            onClick={() => setStatusFilter('BILL_REQUESTED')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              statusFilter === 'BILL_REQUESTED' ? 'bg-indigo-500 text-white' : 'text-indigo-300 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>{isAr ? 'طلب حساب' : 'Bill'} ({countBill})</span>
          </button>
          <button
            onClick={() => setStatusFilter('DIRTY')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              statusFilter === 'DIRTY' ? 'bg-rose-500 text-white' : 'text-rose-400 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>{isAr ? 'تنظيف' : 'Clean'} ({countDirty})</span>
          </button>
        </div>

        {/* Density Mode Toggle Switcher (High Density for 200 tables) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-extrabold">
          <button
            onClick={() => setGridDensity('COMPACT')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              gridDensity === 'COMPACT'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title={isAr ? 'عرض مكثف جداً (لعدد 200+ طاولة بدون سكرول)' : 'Ultra Compact Density (Fits 200+ tables without scrolling)'}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{isAr ? 'مكثّف (200 طاولة)' : 'Compact (200)'}</span>
          </button>
          <button
            onClick={() => setGridDensity('MEDIUM')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              gridDensity === 'MEDIUM'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title={isAr ? 'عرض متوسط' : 'Medium Density Grid'}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'متوسط' : 'Medium'}</span>
          </button>
          <button
            onClick={() => setGridDensity('DETAILED')}
            className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
              gridDensity === 'DETAILED'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title={isAr ? 'عرض بطاقات تفصيلية كبيرة' : 'Detailed Cards'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'مفصل' : 'Cards'}</span>
          </button>
        </div>
      </div>

      {/* Visual Floor Grid */}
      {filteredTables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800 border-dashed rounded-3xl text-center">
          <LayoutGrid className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-slate-300 font-bold text-sm mb-1">{isAr ? 'لا توجد طاولات مطابقة للبحث أو القسم المحدد.' : t('floor.noTables', 'No tables match the current filter/search.')}</p>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              + {isAr ? 'إضافة طاولة جديدة' : t('floor.addTable', 'Add New Table')}
            </button>
          )}
        </div>
      ) : gridDensity === 'COMPACT' ? (
        /* ULTRA COMPACT GRID FOR 200+ TABLES */
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {filteredTables.map((table) => {
            const activeOrder = table.status !== 'FREE'
              ? orders.find(
                  (o) => o.tableId === table.id && o.status !== 'PAID' && o.status !== 'VOIDED'
                )
              : undefined;

            return (
              <div
                key={table.id}
                onClick={() => onSelectTableForOrder(table)}
                className={`p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 flex flex-col justify-between h-20 relative group ${getStatusColor(
                  table.status
                )}`}
                title={`${table.number} - ${getStatusLabel(table.status)} (${table.capacity} guests) ${activeOrder ? '| Total: ' + activeOrder.total + ' ' + tenant.currency : ''}`}
              >
                {/* Admin Quick Edit Control */}
                {isAdmin && (
                  <div className="absolute top-1 ltr:right-1 rtl:left-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition z-10">
                    <button
                      onClick={(e) => handleOpenEditModal(table, e)}
                      title={isAr ? 'تعديل الطاولة' : 'Edit Table'}
                      className="p-1 bg-slate-900/90 text-amber-400 hover:text-white rounded shadow"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between min-w-0">
                  <span className="text-sm font-black text-white truncate tracking-tight">{table.number}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      table.status === 'FREE'
                        ? 'bg-emerald-500'
                        : table.status === 'OCCUPIED'
                        ? 'bg-amber-500'
                        : table.status === 'BILL_REQUESTED'
                        ? 'bg-indigo-500 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>

                <div className="text-[10px] text-slate-300 flex items-center justify-between font-mono pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5 text-amber-400" />
                    {table.capacity}
                  </span>
                  {activeOrder ? (
                    <span className="font-extrabold text-amber-400 truncate max-w-[45px]">
                      {(activeOrder.total ?? 0).toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">{isAr ? 'متاحة' : 'Free'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : gridDensity === 'MEDIUM' ? (
        /* MEDIUM DENSITY GRID (FOR 50-100 TABLES) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredTables.map((table) => {
            const activeOrder = table.status !== 'FREE'
              ? orders.find(
                  (o) => o.tableId === table.id && o.status !== 'PAID' && o.status !== 'VOIDED'
                )
              : undefined;

            return (
              <div
                key={table.id}
                onClick={() => onSelectTableForOrder(table)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between h-32 relative group ${getStatusColor(
                  table.status
                )}`}
              >
                {isAdmin && (
                  <div className="absolute top-2 ltr:right-2 rtl:left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                    <button
                      onClick={(e) => handleOpenEditModal(table, e)}
                      title={isAr ? 'تعديل الطاولة' : 'Edit Table'}
                      className="p-1 bg-slate-900/90 text-amber-400 hover:text-white rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">{table.number}</h3>
                    <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${getStatusBadge(table.status)}`}>
                      {getStatusLabel(table.status)}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5">
                    {getSectionLabel(table.section)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-400" />
                    {table.capacity}p
                  </span>
                  {activeOrder ? (
                    <span className="font-extrabold text-amber-400">
                      {(activeOrder.total ?? 0).toFixed(0)} {tenant.currency}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold">+ {isAr ? 'طلب' : 'Open'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED CARDS MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const activeOrder = table.status !== 'FREE'
              ? orders.find(
                  (o) => o.tableId === table.id && o.status !== 'PAID' && o.status !== 'VOIDED'
                )
              : undefined;

            return (
              <div
                key={table.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-52 relative group ${getStatusColor(
                  table.status
                )}`}
              >
                {/* Admin Quick Edit & Delete Controls */}
                {isAdmin && (
                  <div className="absolute top-3 ltr:right-3 rtl:left-3 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition z-10">
                    <button
                      onClick={(e) => handleOpenEditModal(table, e)}
                      title={isAr ? 'تعديل الطاولة والسعة' : t('floor.editTable', 'Edit Table & Capacity')}
                      className="p-1.5 bg-slate-800/90 hover:bg-amber-500 text-slate-300 hover:text-slate-950 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {table.status === 'FREE' && (
                      <button
                        onClick={(e) => handleDeleteTable(table.id, e)}
                        title={isAr ? 'حذف الطاولة' : t('floor.deleteTable', 'Remove Table')}
                        className="p-1.5 bg-slate-800/90 hover:bg-rose-500 text-slate-300 hover:text-white rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Table Top Row */}
                <div className="flex items-start justify-between ltr:pr-14 rtl:pl-14">
                  <div>
                    <h3 className="text-xl font-black text-white">{table.number}</h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {getSectionLabel(table.section)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-1">
                  <span
                    className={`inline-block text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${getStatusBadge(
                      table.status
                    )}`}
                  >
                    {getStatusLabel(table.status)}
                  </span>
                </div>

                {/* Table Body: Capacity / Server / Order Info */}
                <div className="my-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'السعة الاستيعابية:' : 'Seating Capacity:'} <strong className="text-white font-extrabold">{table.capacity}</strong> {isAr ? 'ضيوف' : 'guests'}</span>
                  </div>

                  {table.assignedWaiter && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isAr ? 'الخادم:' : 'Server:'} {table.assignedWaiter}</span>
                    </div>
                  )}

                  {activeOrder && (
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 pt-1">
                      <span>{isAr ? 'طلب' : 'Order'} #{activeOrder.orderNumber} ({activeOrder.items?.length ?? 0} {isAr ? 'صنف' : 'items'})</span>
                      <span>{(activeOrder.total ?? 0).toFixed(2)} {tenant.currency}</span>
                    </div>
                  )}
                </div>

                {/* Table Quick Actions Bar */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs">
                  {table.status === 'FREE' && (
                    <button
                      onClick={() => onSelectTableForOrder(table)}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-center transition"
                    >
                      + {isAr ? 'فتح طلب' : 'Open Ticket'}
                    </button>
                  )}

                  {table.status === 'OCCUPIED' && (
                    <>
                      <button
                        onClick={() => onSelectTableForOrder(table)}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                      >
                        {isAr ? 'إضافة أصناف' : 'Add Items'}
                      </button>
                      <button
                        onClick={() => {
                          onTableStatusChange(table.id, 'BILL_REQUESTED');
                          const activeOrder = orders.find(
                            (o) => o.tableId === table.id && o.status !== 'PAID' && o.status !== 'VOIDED'
                          );
                          if (activeOrder && onShowReceipt) {
                            onShowReceipt(activeOrder);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 font-bold transition flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'طباعة الحساب' : 'Print Check'}</span>
                      </button>
                    </>
                  )}

                  {table.status === 'BILL_REQUESTED' && (
                    <div className="flex gap-1.5 w-full">
                      <button
                        onClick={() => {
                          const activeOrder = orders.find(
                            (o) => o.tableId === table.id && o.status !== 'PAID' && o.status !== 'VOIDED'
                          );
                          if (activeOrder && onShowReceipt) {
                            onShowReceipt(activeOrder);
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition flex items-center justify-center gap-1 text-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'طباعة الحساب' : 'Print Check'}</span>
                      </button>
                      <button
                        onClick={() => onTableStatusChange(table.id, 'DIRTY')}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs"
                      >
                        {isAr ? 'تسديد وتفريغ الطاولة' : 'Mark Paid & Reset'}
                      </button>
                    </div>
                  )}

                  {table.status === 'DIRTY' && (
                    <button
                      onClick={() => onTableStatusChange(table.id, 'FREE')}
                      className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تم تنظيف الطاولة وجاهزة' : 'Table Bus & Cleaned'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT TABLE MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  {editingTable ? (isAr ? 'تعديل الطاولة وسعة المقاعد' : 'Edit Table & Seat Capacity') : (isAr ? 'إضافة طاولة جديدة لمخطط الصالة' : 'Add New Table to Floor Plan')}
                </h3>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveTable} className="space-y-4">
              {/* Table Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {isAr ? 'رقم / اسم الطاولة' : t('floor.tableNumberLabel', 'Table Number / Name')} *
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder={isAr ? 'مثال: T-01 أو VIP-1' : 'e.g. T-01 or VIP-1'}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Floor Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {isAr ? 'قسم الصالة' : t('floor.sectionLabel', 'Dining Room Section')}
                </label>
                <select
                  value={tableSection}
                  onChange={(e) => setTableSection(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="MAIN_HALL">{isAr ? 'الصالة الرئيسية' : t('floor.mainHall', 'Main Dining Hall')}</option>
                  <option value="OUTDOOR_TERRACE">{isAr ? 'التراس الخارجي' : t('floor.outdoorTerrace', 'Outdoor Terrace')}</option>
                  <option value="VIP_LOUNGE">{isAr ? 'جناح VIP' : t('floor.vipLounge', 'VIP Lounge')}</option>
                </select>
              </div>

              {/* Seating Capacity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {isAr ? 'السعة الاستيعابية (عدد الضيوف)' : t('floor.seatingCapacityLabel', 'Seating Capacity (Number of Guests)')} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base text-amber-400 font-extrabold focus:outline-none focus:border-amber-500 text-center"
                />

                {/* Quick Capacity Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[2, 4, 6, 8, 10, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCapacity(num)}
                      className={`flex-1 py-1 text-xs rounded-lg font-bold border transition ${
                        capacity === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {num} {isAr ? 'مقاعد' : t('floor.seats', 'Seats')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  {isAr ? 'إلغاء' : t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl transition shadow-lg"
                >
                  {isSaving ? (isAr ? 'جاري الحفظ...' : t('common.saving', 'Saving...')) : editingTable ? (isAr ? 'حفظ التغييرات' : t('floor.saveChanges', 'Save Changes')) : (isAr ? 'إنشاء الطاولة' : t('floor.createTable', 'Create Table'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
