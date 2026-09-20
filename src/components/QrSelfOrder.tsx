import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  Download,
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
import { apiFetch } from '../lib/api';

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

      const created = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          orderData: orderPayload,
        }),
      });

      onOrderCreated(created);
      setOrderSuccess(created);
      setCart([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Table Selector & QR Generator Info */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
        
        {/* Actual QR Code Display */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative p-3 bg-white rounded-2xl shadow-2xl">
            <QRCodeSVG 
              value={`https://${tenant.slug}.restoos.app/order/${branch.id}/${activeTableId}`}
              size={120}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/logo.png", // Fallback if exists
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-lg shadow-lg">
            <QrCode className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>QR Code Self-Ordering Simulator</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-sm text-slate-400">
              Customers scan this dynamic QR code at their table to browse the menu and order directly from their mobile devices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">Select Table</span>
              <select
                value={activeTableId}
                onChange={(e) => {
                  setActiveTableId(e.target.value);
                  setOrderSuccess(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-amber-400 outline-none cursor-pointer hover:border-amber-500/50 transition"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.number} ({t.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 ml-1">Actions</span>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition border border-slate-700"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download for Print</span>
              </button>
            </div>
          </div>
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
          <h2 className="text-base font-black text-white mt-0.5">{tenant?.name || 'Restaurant'}</h2>
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
