import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  Printer,
  FileDown,
  Building2,
} from 'lucide-react';
import { Tenant, Branch, Product } from '../types/restaurant';

interface AnalyticsViewProps {
  tenant: Tenant;
  branches: Branch[];
  products: Product[];
  analytics: {
    branchesData: {
      branchId: string;
      branchName: string;
      sales: number;
      orderCount: number;
      avgBasket: number;
      occupancyPct: number;
    }[];
    topProducts: {
      productId: string;
      name: string;
      quantitySold: number;
      revenue: number;
    }[];
    hourlySales: { hour: string; sales: number }[];
  };
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tenant,
  branches,
  products,
  analytics,
}) => {
  const maxHourly = Math.max(...analytics.hourlySales.map((h) => h.sales), 1);

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-y-auto space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">
              Executive Analytics & Multi-Branch Benchmarking
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time branch throughput, product velocity & peak hour performance
          </p>
        </div>

        <button
          onClick={handlePrintZReport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Export Daily Z-Report</span>
        </button>
      </div>

      {/* Multi-Branch Comparison Cards */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Multi-Branch Comparative Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {analytics.branchesData.map((b) => (
            <div
              key={b.branchId}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-sm">{b.branchName}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Sales</span>
                  <span className="font-extrabold text-white font-mono text-base">
                    {(b.sales ?? 0).toFixed(0)} {tenant.currency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Avg Check / Basket</span>
                  <span className="font-bold text-amber-400 font-mono text-base">
                    {(b.avgBasket ?? 0).toFixed(1)} {tenant.currency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Order Count</span>
                  <span className="font-semibold text-slate-200">{b.orderCount} tickets</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Table Occupancy</span>
                  <span className="font-semibold text-indigo-400">{b.occupancyPct}% full</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Top Selling Products & Hourly Sales Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Top Menu Item Velocity</h3>
            </div>
            <span className="text-[11px] text-slate-400">By units sold</span>
          </div>

          <div className="space-y-2">
            {analytics.topProducts.map((p, idx) => (
              <div
                key={p.productId}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-slate-400 font-bold flex items-center justify-center text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-[11px] text-slate-400 block">
                      {p.quantitySold} units ordered
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-amber-400">
                  {(p.revenue ?? 0).toFixed(2)} {tenant.currency}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Sales Bar Chart */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Peak Hours Heatmap</h3>
              </div>
              <span className="text-[11px] text-slate-400">Rush period analysis</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Identify staff scheduling & kitchen prep surges
            </p>
          </div>

          <div className="pt-4 flex items-end justify-between gap-2 h-44">
            {analytics.hourlySales.map((h, idx) => {
              const heightPct = Math.max(8, (h.sales / maxHourly) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {h.sales > 0 ? `${(h.sales ?? 0).toFixed(0)}` : ''}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 transition-all hover:brightness-125"
                  ></div>
                  <span className="text-[10px] text-slate-400 font-mono">{h.hour}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
