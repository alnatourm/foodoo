import React, { useState } from 'react';
import {
  ChefHat,
  Flame,
  Clock,
  CheckCircle2,
  Bell,
  Volume2,
  VolumeX,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { Order, Tenant, KitchenStation, StaffUser } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface KitchenDisplayProps {
  tenant: Tenant;
  orders: Order[];
  onBumpStatus: (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'SERVED') => void;
  currentUser?: StaffUser | null;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
  tenant,
  orders,
  onBumpStatus,
  currentUser,
}) => {
  const { t, tCatalog, isRTL } = useLanguage();
  const [selectedStation, setSelectedStation] = useState<KitchenStation | 'ALL'>(
    (currentUser?.assignedStation as KitchenStation) || 'ALL'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Filter only active kitchen orders
  const activeOrders = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'PREPARING' || o.status === 'READY'
  );

  const filteredOrders = activeOrders.filter((o) => {
    if (selectedStation === 'ALL') return true;
    return o.items.some((item) => item.station === selectedStation);
  });

  const getStationLabel = (s: string) => {
    if (s === 'ALL') return isRTL ? 'كل المحطات' : 'All';
    if (s === 'GRILL') return isRTL ? 'المشاوي' : 'Grill';
    if (s === 'FRYER') return isRTL ? 'القلاية' : 'Fryer';
    if (s === 'DRINKS') return isRTL ? 'المشروبات' : 'Drinks';
    if (s === 'COLD') return isRTL ? 'البارد' : 'Cold';
    return s;
  };

  const getStatusLabel = (s: string) => {
    if (s === 'NEW') return isRTL ? 'جديد' : 'NEW';
    if (s === 'PREPARING') return isRTL ? 'قيد التحضير' : 'PREPARING';
    if (s === 'READY') return isRTL ? 'جاهز للتسليم' : 'READY';
    return s;
  };

  // Simple Web Audio API Synthesizer Chime for new kitchen orders
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio autoplay prevented', e);
    }
  };

  const calculateMinutesAgo = (isoString: string) => {
    const elapsedMs = Date.now() - new Date(isoString).getTime();
    return Math.floor(elapsedMs / (1000 * 60));
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-6rem)] overflow-hidden bg-slate-950 text-slate-100">
      {/* KDS Control Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                {t('kds.title')}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isRTL ? 'بث مباشر للمطبخ' : 'Live Kitchen Feed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('kds.avgPrepTime')}: 8-12 min • {filteredOrders.length} {t('kds.activeTickets')}
            </p>
          </div>
        </div>

        {/* Station Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['ALL', 'GRILL', 'FRYER', 'DRINKS', 'COLD'] as const).map((station) => (
            <button
              key={station}
              onClick={() => setSelectedStation(station)}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                selectedStation === station
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {getStationLabel(station)}
            </button>
          ))}
        </div>

        {/* Audio Alert Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{isRTL ? 'تنبيه الجرس' : 'Chime Alerts'}</span>
          </button>
        </div>
      </div>

      {/* Ticket Cards Canvas */}
      <div className="flex-1 p-4 overflow-x-auto overflow-y-auto bg-slate-950">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
            <h3 className="text-base font-bold text-slate-300">{t('kds.noActiveOrders')}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {isRTL
                ? `لا توجد طلبات معلقة حالياً في محطة (${getStationLabel(selectedStation)}). عند إرسال طلب جديد ستظهر التذاكر هنا فوراً.`
                : `There are currently no tickets waiting on the ${getStationLabel(selectedStation)} station. Fire an order from POS or Waiter App to see tickets arrive.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
            {filteredOrders.map((order) => {
              const minutesAgo = calculateMinutesAgo(order.createdAt);
              const isUrgent = minutesAgo > 15;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                    order.status === 'READY'
                      ? 'bg-emerald-950/20 border-emerald-500/60'
                      : order.status === 'PREPARING'
                      ? 'bg-blue-950/20 border-blue-500/60'
                      : 'bg-amber-950/20 border-amber-500/60'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3 flex items-center justify-between border-b text-xs font-bold ${
                      order.status === 'READY'
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        : order.status === 'PREPARING'
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                        : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-extrabold text-white">{order.orderNumber}</span>
                      <span className="mx-2 font-mono text-[11px] opacity-80">
                        {order.tableName || (order.type === 'TAKEAWAY' ? (isRTL ? 'سفري' : 'Takeaway') : (isRTL ? 'محلي' : 'Dine In'))}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span
                        className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                          isUrgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-black/30 text-white'
                        }`}
                      >
                        {minutesAgo}{t('kds.minutesAgo')}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-3 space-y-2.5 flex-1 bg-slate-900/60 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>
                        {isRTL ? 'العميل: ' : 'Guest: '}
                        <span className="text-slate-200 font-semibold">{order.customerName || 'Walk-in'}</span>
                      </span>
                      {(order.waiterName || order.cashierName) && (
                        <span className="text-amber-300 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {order.waiterName ? `Server: ${order.waiterName}` : `POS: ${order.cashierName}`}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 divide-y divide-slate-800/60">
                      {order.items
                        .filter(
                          (item) => selectedStation === 'ALL' || item.station === selectedStation
                        )
                        .map((item, idx) => (
                          <div key={idx} className="pt-2 first:pt-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-white text-sm">
                                <span className="text-amber-400 font-black mx-1">
                                  {item.quantity}x
                                </span>
                                {tCatalog(item.productName)}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {getStationLabel(item.station)}
                              </span>
                            </div>

                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className={`${isRTL ? 'pr-5' : 'pl-5'} text-[11px] text-amber-300 font-medium space-y-0.5 mt-0.5`}>
                                {item.modifiers.map((m, mIdx) => (
                                  <div key={mIdx}>+ {tCatalog(m.name)}</div>
                                ))}
                              </div>
                            )}

                            {item.notes && (
                              <div className={`${isRTL ? 'pr-5' : 'pl-5'} text-[11px] text-rose-300 font-semibold italic mt-0.5`}>
                                {t('kds.notes')}: {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>

                    {order.notes && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
                        {t('kds.notes')}: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Bump Status Action Bar */}
                  <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">
                      {t('common.status')}: <span className="text-white">{getStatusLabel(order.status)}</span>
                    </span>

                    {order.status === 'NEW' && (
                      <button
                        onClick={() => onBumpStatus(order.id, 'PREPARING')}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <span>{t('kds.startCooking')}</span>
                        <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => onBumpStatus(order.id, 'READY')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('kds.readyForPickup')}</span>
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => onBumpStatus(order.id, 'SERVED')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('kds.markServed')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

