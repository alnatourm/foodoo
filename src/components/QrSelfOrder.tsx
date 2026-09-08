import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  Utensils,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle,
  Sparkles,
  Send,
  CreditCard,
  Banknote,
} from 'lucide-react';
import {
  Tenant,
  Branch,
  RestaurantTable,
  Product,
  Category,
  Order,
  OrderItem,
} from '../types/restaurant';

interface QrSelfOrderProps {
  tenant: Tenant;
  branch: Branch;
  tables: RestaurantTable[];
  products: Product[];
  categories: Category[];
  onOrderCreated: (order: Order) => void;
}

export const QrSelfOrder: React.FC<QrSelfOrderProps> = ({
  tenant,
  branch,
  tables,
  products,
  categories,
  onOrderCreated,
}) => {
  const [activeTableId, setActiveTableId] = useState<string>(tables[0]?.id || '');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const activeTable = tables.find((t) => t.id === activeTableId);

  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      setCart(cart.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([
        ...cart,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          costPrice: product.costPrice,
          station: product.station,
          modifiers: [],
          status: 'PENDING',
        },
      ]);
    }
  };

  const updateQty = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) updated.splice(index, 1);
    setCart(updated);
  };

  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const tax = (subtotal * tenant.taxRatePct) / 100;
  const total = subtotal + tax;

  const handleSendSelfOrder = async () => {
    if (cart.length === 0 || !activeTable) return;
    setIsSubmitting(true);

    try {
      const orderPayload: Partial<Order> = {
        type: 'QR_SELF_ORDER',
        tableId: activeTable.id,
        tableName: activeTable.number,
        customerName: `Guest at Table ${activeTable.number}`,
        status: 'NEW',
        items: cart,
        subtotal,
        discountAmount: 0,
        taxAmount: tax,
        total,
        notes: 'Submitted via Dine-In Table QR Scan',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          orderData: orderPayload,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onOrderCreated(created);
        setOrderSuccess(created);
        setCart([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Table Selector & QR Generator Info */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">QR Code Self-Ordering Simulator</h3>
            <p className="text-xs text-slate-400">
              Customers scan this QR code at their table to order from their phones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Previewing Table:</span>
          <select
            value={activeTableId}
            onChange={(e) => {
              setActiveTableId(e.target.value);
              setOrderSuccess(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-amber-400 outline-none cursor-pointer"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                {t.number} ({t.section})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Phone Mockup */}
      <div className="w-full max-w-sm rounded-[36px] bg-slate-900 border-[6px] border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
        {/* Phone Notch */}
        <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-950"></div>
        </div>

        {/* Customer View Header */}
        <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            Dine-In Self Ordering
          </span>
          <h2 className="text-base font-black text-white mt-0.5">{tenant.name}</h2>
          <p className="text-xs text-slate-400">
            Welcome to <span className="text-white font-bold">Table {activeTable?.number}</span>
          </p>
        </div>

        {orderSuccess ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Order Sent to Kitchen!</h3>
            <p className="text-xs text-slate-400">
              Ticket <span className="text-amber-400 font-bold">{orderSuccess.orderNumber}</span> is being prepared right now for Table {activeTable?.number}.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 w-full text-xs text-left space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Items:</span>
                <span className="text-white font-bold">{orderSuccess.items?.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total:</span>
                <span className="text-amber-400 font-extrabold">{(orderSuccess.total ?? 0).toFixed(2)} {tenant.currency}</span>
              </div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Order More Items
            </button>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="p-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950">
              <button
                onClick={() => setSelectedCat('ALL')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                  selectedCat === 'ALL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                    selectedCat === c.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-950">
              {products
                .filter((p) => selectedCat === 'ALL' || p.categoryId === selectedCat)
                .map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {product.description}
                      </p>
                      <div className="text-xs font-extrabold text-amber-400 mt-1">
                        {(product.price ?? 0).toFixed(2)} {tenant.currency}
                      </div>
                    </div>

                    <button
                      disabled={product.is86d}
                      onClick={() => addToCart(product)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-30"
                    >
                      {product.is86d ? 'Sold Out' : '+ Add'}
                    </button>
                  </div>
                ))}
            </div>

            {/* Sticky Cart Drawer */}
            {cart.length > 0 && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {cart.reduce((a, b) => a + (b.quantity ?? 1), 0)} items in your tray
                  </span>
                  <span className="font-extrabold text-amber-400">
                    {(total ?? 0).toFixed(2)} {tenant.currency}
                  </span>
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={handleSendSelfOrder}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Order to Kitchen</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
