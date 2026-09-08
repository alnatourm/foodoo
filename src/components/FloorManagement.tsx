import React, { useState } from 'react';
import {
  LayoutGrid,
  Users,
  Clock,
  Sparkles,
  Receipt,
  UserCheck,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { RestaurantTable, TableStatus, Order, Tenant } from '../types/restaurant';

interface FloorManagementProps {
  tenant: Tenant;
  tables: RestaurantTable[];
  orders: Order[];
  onSelectTableForOrder: (table: RestaurantTable) => void;
  onTableStatusChange: (tableId: string, status: TableStatus) => void;
}

export const FloorManagement: React.FC<FloorManagementProps> = ({
  tenant,
  tables,
  orders,
  onSelectTableForOrder,
  onTableStatusChange,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  const filteredTables = tables.filter((t) => {
    if (selectedSection === 'ALL') return true;
    return t.section === selectedSection;
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

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Floor Overview Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">Floor & Table Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time dining room occupancy & table turns
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setSelectedSection('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSection === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Sections ({tables.length})
          </button>
          <button
            onClick={() => setSelectedSection('MAIN_HALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSection === 'MAIN_HALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Main Dining Hall
          </button>
          <button
            onClick={() => setSelectedSection('OUTDOOR_TERRACE')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSection === 'OUTDOOR_TERRACE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Outdoor Terrace
          </button>
          <button
            onClick={() => setSelectedSection('VIP_LOUNGE')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedSection === 'VIP_LOUNGE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            VIP Lounge
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-400">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-slate-400">Bill Requested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-400">Needs Cleaning</span>
          </div>
        </div>
      </div>

      {/* Visual Floor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const activeOrder = orders.find(
            (o) => o.tableId === table.id && o.status !== 'PAID' && o.status !== 'VOIDED'
          );

          return (
            <div
              key={table.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-48 relative ${getStatusColor(
                table.status
              )}`}
            >
              {/* Table Top Row */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">{table.number}</h3>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {table.section.replace('_', ' ')}
                  </span>
                </div>
                <span
                  className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${getStatusBadge(
                    table.status
                  )}`}
                >
                  {table.status.replace('_', ' ')}
                </span>
              </div>

              {/* Table Body: Capacity / Server / Order Info */}
              <div className="my-2 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>Seating Capacity: {table.capacity} guests</span>
                </div>

                {table.assignedWaiter && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Server: {table.assignedWaiter}</span>
                  </div>
                )}

                {activeOrder && (
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 pt-1">
                    <span>Order {activeOrder.orderNumber} ({activeOrder.items?.length ?? 0} items)</span>
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
                    + Open Ticket
                  </button>
                )}

                {table.status === 'OCCUPIED' && (
                  <>
                    <button
                      onClick={() => onSelectTableForOrder(table)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                    >
                      Add Items
                    </button>
                    <button
                      onClick={() => onTableStatusChange(table.id, 'BILL_REQUESTED')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 font-bold transition"
                    >
                      Print Check
                    </button>
                  </>
                )}

                {table.status === 'BILL_REQUESTED' && (
                  <button
                    onClick={() => onTableStatusChange(table.id, 'DIRTY')}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
                  >
                    Mark Paid & Reset
                  </button>
                )}

                {table.status === 'DIRTY' && (
                  <button
                    onClick={() => onTableStatusChange(table.id, 'FREE')}
                    className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Table Bus & Cleaned</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
