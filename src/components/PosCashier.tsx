import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  FileText,
  Utensils,
  Percent,
  Check,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import {
  Tenant,
  Branch,
  Category,
  Product,
  RestaurantTable,
  Order,
  OrderItem,
  SelectedModifier,
  PaymentMethod,
  StaffUser,
} from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { VoidPasswordModal } from './VoidPasswordModal';
import { apiFetch } from '../lib/api';

interface PosCashierProps {
  tenant: Tenant;
  branch: Branch;
  categories: Category[];
  products: Product[];
  tables: RestaurantTable[];
  onOrderCreated: (order: Order) => void;
  onShowReceipt: (order: Order) => void;
  currentUser?: StaffUser | null;
}

export const PosCashier: React.FC<PosCashierProps> = ({
  tenant,
  branch,
  categories,
  products,
  tables,
  onOrderCreated,
  onShowReceipt,
  currentUser,
}) => {
  const { t, tCatalog, getLocalizedName, getLocalizedDesc, formatCurrency, isRTL } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
  const [customerName, setCustomerName] = useState<string>('');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [discountPct, setDiscountPct] = useState<number>(0);

  // Void authorization modal state
  const [voidModalTarget, setVoidModalTarget] = useState<{
    type: 'ITEM' | 'CLEAR_CART';
    item?: OrderItem;
    index?: number;
  } | null>(null);

  // Modifiers selection modal state
  const [modifyingProduct, setModifyingProduct] = useState<Product | null>(null);
  const [activeModifiers, setActiveModifiers] = useState<SelectedModifier[]>([]);
  const [itemSpecialNote, setItemSpecialNote] = useState<string>('');

  // Payment modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('MADA');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const translatedName = tCatalog(p.name);
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      translatedName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });


  const handleProductClick = (product: Product) => {
    if (product.is86d) return;

    // If product has modifier groups, open customizer modal
    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setModifyingProduct(product);
      setActiveModifiers([]);
      setItemSpecialNote('');
      return;
    }

    // Direct add
    addItemToCart(product, [], '');
  };

  const addItemToCart = (product: Product, modifiers: SelectedModifier[], notes: string) => {
    const modifierTotal = modifiers.reduce((acc, m) => acc + m.price, 0);
    const unitPrice = product.price + modifierTotal;

    const existingIndex = cartItems.findIndex(
      (item) =>
        item.productId === product.id &&
        item.notes === notes &&
        JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice,
        costPrice: product.costPrice,
        station: product.station,
        modifiers,
        notes,
        status: 'PENDING',
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const item = cartItems[index];
    if (delta < 0 && item.quantity <= 1) {
      handleRequestVoidItem(item, index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity += delta;
    setCartItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountAmount = (subtotal * discountPct) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (tenant?.taxRatePct ?? 15)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const currentTable = tables.find((t) => t.id === selectedTableId);

  // Send Order to Kitchen (Without Immediate Payment)
  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const orderPayload: Partial<Order> = {
        type: orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
        tableName: orderType === 'DINE_IN' ? currentTable?.number : undefined,
        customerName: customerName.trim() || (orderType === 'DINE_IN' ? `Table ${currentTable?.number}` : 'Takeaway Guest'),
        status: 'NEW',
        items: cartItems,
        subtotal,
        discountAmount,
        taxAmount,
        total: grandTotal,
        notes: orderNotes,
        cashierName: currentUser?.name || 'Cashier',
        createdByUserId: currentUser?.id,
        createdByUserRole: currentUser?.role || 'CASHIER',
      };

      const createdOrder = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          orderData: orderPayload,
        }),
      });

      onOrderCreated(createdOrder);
      setCartItems([]);
      setOrderNotes('');
      setDiscountPct(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete Payment & Print Receipt
  const handleExecutePayment = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      // Step 1: Create Order
      const orderPayload: Partial<Order> = {
        type: orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
        tableName: orderType === 'DINE_IN' ? currentTable?.number : undefined,
        customerName: customerName.trim() || 'Direct Sale',
        status: 'NEW',
        items: cartItems,
        subtotal,
        discountAmount,
        taxAmount,
        total: grandTotal,
        notes: orderNotes,
        cashierName: currentUser?.name || 'Cashier',
        createdByUserId: currentUser?.id,
        createdByUserRole: currentUser?.role || 'CASHIER',
      };

      const createdOrder: Order = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          orderData: orderPayload,
        }),
      });

      // Step 2: Pay Order immediately
      const payData = await apiFetch(`/api/orders/${createdOrder.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const finalizedOrder = payData.order || createdOrder;
      onOrderCreated(finalizedOrder);
      setIsPaymentOpen(false);
      setCartItems([]);
      setCashTendered('');
      setOrderNotes('');
      setDiscountPct(0);
      onShowReceipt(finalizedOrder);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cashChange = Number(cashTendered) > grandTotal ? Number(cashTendered) - grandTotal : 0;

  // Void Protection Handlers (Requires Void Password)
  const handleRequestVoidItem = (item: OrderItem, index: number) => {
    setVoidModalTarget({ type: 'ITEM', item, index });
  };

  const handleRequestClearCart = () => {
    setVoidModalTarget({ type: 'CLEAR_CART' });
  };

  const handleConfirmVoid = () => {
    if (!voidModalTarget) return;
    if (voidModalTarget.type === 'CLEAR_CART') {
      setCartItems([]);
    } else if (voidModalTarget.type === 'ITEM' && voidModalTarget.index !== undefined) {
      setCartItems((prev) => prev.filter((_, i) => i !== voidModalTarget.index));
    }
    setVoidModalTarget(null);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-6rem)] overflow-hidden bg-slate-950 text-slate-100">
      {/* Left: Product Catalog & Category Filter */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800/80 bg-slate-950">
        {/* Search & Order Type Header */}
        <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('pos.searchPlaceholder')}
              className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition`}
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`px-3 py-1.5 rounded-lg transition ${
                orderType === 'DINE_IN'
                  ? 'bg-amber-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('pos.dineIn')}
            </button>
            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                orderType === 'TAKEAWAY'
                  ? 'bg-amber-500 text-slate-950 shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('pos.takeaway')}
            </button>
          </div>

          {orderType === 'DINE_IN' && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400">{t('common.table')}:</span>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
              >
                {tables.map((tItem) => (
                  <option key={tItem.id} value={tItem.id} className="bg-slate-900 text-white">
                    {tItem.number} ({tItem.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Categories Bar */}
        <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-900/20">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-white text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t('common.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-white text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {getLocalizedName(c)}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((p) => {
              const is86d = p.is86d;
              return (
                <button
                  key={p.id}
                  disabled={is86d}
                  onClick={() => handleProductClick(p)}
                  className={`group relative ${isRTL ? 'text-right' : 'text-left'} overflow-hidden rounded-xl border transition-all flex flex-col ${
                    is86d
                      ? 'bg-slate-900/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                      : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/70 hover:bg-slate-850 hover:shadow-lg shadow-black/40'
                  }`}
                >
                  {p.image && (
                    <div className="h-24 w-full overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-400 line-clamp-1">
                          {getLocalizedName(p)}
                        </h4>
                        {p.isCombo && (
                          <span className="text-[9px] font-extrabold uppercase px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Combo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                        {getLocalizedDesc(p)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-extrabold text-amber-400">
                        {formatCurrency(p.price, tenant.currency)}
                      </span>
                      {is86d ? (
                        <span className="text-[10px] font-bold text-rose-400">{t('menu.outOfStock')}</span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Active Ticket Cart & Tender */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900/70 border-l border-slate-800">
        {/* Cart Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{t('pos.currentOrder')}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                {orderType === 'DINE_IN' ? `${t('common.table')} ${currentTable?.number || 'T-01'}` : t('pos.takeaway')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} {t('kds.itemsCount')}
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleRequestClearCart}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
              title={t('pos.clearOrder')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Customer Name or Guest Note */}
        <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/40">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t('pos.walkInGuest')}
            className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Utensils className="w-8 h-8 mb-2 opacity-40 text-amber-500" />
              <p className="text-xs font-medium">{t('pos.emptyCartTitle')}</p>
              <p className="text-[11px] text-slate-600 mt-1">
                {t('pos.emptyCartSubtitle')}
              </p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-slate-100">{tCatalog(item.productName)}</div>
                  <div className="font-bold text-amber-400 whitespace-nowrap">
                    {formatCurrency((item.unitPrice ?? 0) * (item.quantity ?? 1), tenant.currency)}
                  </div>
                </div>

                {item.modifiers.length > 0 && (
                  <div className={`text-[10px] text-slate-400 space-y-0.5 ${isRTL ? 'pr-2 border-r' : 'pl-2 border-l'} border-slate-800`}>
                    {item.modifiers.map((m, mIdx) => (
                      <div key={mIdx} className="flex justify-between">
                        <span>+ {tCatalog(m.name)}</span>
                        {m.price > 0 && <span>+{formatCurrency(m.price, tenant.currency)}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <div className={`text-[10px] text-amber-300 italic ${isRTL ? 'pr-1' : 'pl-1'}`}>
                    "{item.notes}"
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <span className="text-[11px] text-slate-500">
                    {formatCurrency(item.unitPrice, tenant.currency)} {t('pos.each')}
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-white text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Actions Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
          {/* Quick Discounts */}
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-slate-400">{t('common.discount')}:</span>
            <div className="flex items-center gap-1">
              {[0, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPct(pct)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    discountPct === pct
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pct === 0 ? '0%' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>{t('common.subtotal')}:</span>
              <span>{formatCurrency(subtotal, tenant.currency)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>{t('common.discount')} ({discountPct}%):</span>
                <span>-{formatCurrency(discountAmount, tenant?.currency || 'SAR')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{tenant?.taxName || t('common.tax')} ({tenant?.taxRatePct ?? 15}%):</span>
              <span>{formatCurrency(taxAmount, tenant?.currency || 'SAR')}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-1 border-t border-slate-800">
              <span>{t('common.total')}:</span>
              <span className="text-amber-400">{formatCurrency(grandTotal, tenant?.currency || 'SAR')}</span>
            </div>
          </div>

          {/* Action Buttons: Send to KDS or Pay */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              disabled={cartItems.length === 0 || isSubmitting}
              onClick={handleSendToKitchen}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('waiter.sendToKitchen')}</span>
            </button>
            <button
              disabled={cartItems.length === 0 || isSubmitting}
              onClick={() => setIsPaymentOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t('pos.payNow')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modifier Selector Modal */}
      {modifyingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{tCatalog(modifyingProduct.name)}</h3>
                <p className="text-xs text-amber-400 font-semibold">
                  {t('common.price')}: {formatCurrency(modifyingProduct.price, tenant.currency)}
                </p>
              </div>
              <button
                onClick={() => setModifyingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modifier Groups */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {modifyingProduct.modifierGroups?.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{tCatalog(group.name)}</span>
                    <span className="text-[10px] text-slate-500">
                      (Max {group.maxSelection})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.options.map((opt) => {
                      const isSelected = activeModifiers.some(
                        (m) => m.groupId === group.id && m.optionId === opt.id
                      );
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (isSelected) {
                              setActiveModifiers(
                                activeModifiers.filter((m) => !(m.groupId === group.id && m.optionId === opt.id))
                              );
                            } else {
                              // If max 1, remove other options in this group first
                              const filtered = group.maxSelection === 1
                                ? activeModifiers.filter((m) => m.groupId !== group.id)
                                : activeModifiers;
                              setActiveModifiers([
                                ...filtered,
                                {
                                  groupId: group.id,
                                  optionId: opt.id,
                                  name: opt.name,
                                  price: opt.priceDelta,
                                },
                              ]);
                            }
                          }}
                          className={`p-2 rounded-xl text-left border text-xs transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{tCatalog(opt.name)}</span>
                          {opt.priceDelta > 0 ? (
                            <span className="text-[11px] text-amber-400">+{formatCurrency(opt.priceDelta, tenant.currency)}</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">{t('pos.free')}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <label className="text-xs text-slate-400 mb-1 block">{t('common.notes')}</label>
                <input
                  type="text"
                  value={itemSpecialNote}
                  onChange={(e) => setItemSpecialNote(e.target.value)}
                  placeholder="e.g., Dressing on the side, extra crispy..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModifyingProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  addItemToCart(modifyingProduct, activeModifiers, itemSpecialNote);
                  setModifyingProduct(null);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
              >
                {t('common.add')} (
                {formatCurrency(
                  (modifyingProduct.price ?? 0) +
                    activeModifiers.reduce((acc, m) => acc + (m.price ?? 0), 0),
                  tenant.currency
                )}
                )
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Tender Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{t('pos.completePayment')}</h3>
                <p className="text-xs text-slate-400">{t('pos.paymentMethod')}</p>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{t('common.total')}</span>
              <div className="text-2xl font-extrabold text-amber-400 mt-0.5">
                {formatCurrency(grandTotal, tenant.currency)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'MADA' as PaymentMethod, label: t('pos.mada'), icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
                { id: 'APPLE_PAY' as PaymentMethod, label: t('pos.applePay'), icon: <Smartphone className="w-4 h-4 text-slate-200" /> },
                { id: 'VISA' as PaymentMethod, label: t('pos.card'), icon: <CreditCard className="w-4 h-4 text-blue-400" /> },
                { id: 'CASH' as PaymentMethod, label: t('pos.cash'), icon: <Banknote className="w-4 h-4 text-amber-400" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                    selectedPaymentMethod === m.id
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Cash Tender Calculation */}
            {selectedPaymentMethod === 'CASH' && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('pos.amountReceived')}:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={(grandTotal ?? 0).toFixed(2)}
                    className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-right text-white font-bold"
                  />
                </div>
                {/* Quick cash notes */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[50, 100, 200, 500].map((note) => (
                    <button
                      key={note}
                      onClick={() => setCashTendered(String(note))}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-semibold text-[11px] hover:bg-slate-700"
                    >
                      {note} {tenant.currency}
                    </button>
                  ))}
                </div>
                {cashChange > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-bold text-emerald-400">
                    <span>{t('pos.changeDue')}:</span>
                    <span>{formatCurrency(cashChange, tenant.currency)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleExecutePayment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                {isSubmitting ? t('common.loading') : t('pos.completeSale')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Authentication Modal */}
      {voidModalTarget && (
        <VoidPasswordModal
          tenantId={tenant?.id || ''}
          itemName={
            voidModalTarget.type === 'CLEAR_CART'
              ? 'Clear entire order cart'
              : `Remove ${tCatalog(voidModalTarget.item?.productName || '')}`
          }
          onConfirm={handleConfirmVoid}
          onClose={() => setVoidModalTarget(null)}
        />
      )}
    </div>
  );
};
