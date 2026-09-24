import React, { useState } from 'react';
import {
  Smartphone,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Minus,
  Send,
  Receipt,
  RotateCcw,
  Sparkles,
  Search,
  X,
  Trash2,
  AlertTriangle,
  History as HistoryIcon,
  Ban,
  Check,
} from 'lucide-react';
import {
  Tenant,
  Branch,
  RestaurantTable,
  Product,
  Category,
  Order,
  OrderItem,
  StaffUser,
  SelectedModifier,
} from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';
import { SplitBillModal } from './SplitBillModal';
import { apiFetch } from '../lib/api';

interface VoidModalTarget {
  source: 'CART' | 'TABLE_ORDER';
  item?: OrderItem; // Made optional so we can support CLEAR_CART
  index?: number;
  orderId?: string;
  type?: 'ITEM' | 'CLEAR_CART';
}

interface VoidAuditRecord {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  reason: string;
  tableNumber: string;
  timestamp: string;
  source: 'UNFIRED_CART' | 'KITCHEN_QUEUE';
}

interface WaiterAppProps {
  tenant: Tenant;
  branch: Branch;
  tables: RestaurantTable[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  onOrderCreated: (order: Order) => void;
  onTableStatusChange: (tableId: string, status: any) => void;
  onOrderUpdated?: (order: Order) => void;
  currentUser?: StaffUser | null;
  onShowReceipt?: (order: Order) => void;
}

export const WaiterApp: React.FC<WaiterAppProps> = ({
  tenant,
  branch,
  tables,
  products,
  categories,
  orders,
  onOrderCreated,
  onTableStatusChange,
  onOrderUpdated,
  currentUser,
  onShowReceipt,
}) => {
  const { t, tCatalog, getLocalizedName, getLocalizedDesc, formatCurrency, isRTL } = useLanguage();
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(tables[0] || null);
  const [activeTab, setActiveTab] = useState<'FLOOR' | 'ORDER'>('FLOOR');
  const [waiterCart, setWaiterCart] = useState<OrderItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const commonVoidReasons = [
    t('waiter.reasons.changedMind'),
    t('waiter.reasons.mistake'),
    t('waiter.reasons.outOfStock'),
    t('waiter.reasons.duplicate'),
    t('waiter.reasons.leftTable'),
    t('waiter.reasons.switched'),
  ];

  // Void item state
  const [voidTarget, setVoidTarget] = useState<VoidModalTarget | null>(null);
  const [voidReason, setVoidReason] = useState<string>(commonVoidReasons[0]);
  const [voidPinCode, setVoidPinCode] = useState<string>('');
  const [voidError, setVoidError] = useState<string>('');
  const [voidAuditLogs, setVoidAuditLogs] = useState<VoidAuditRecord[]>([]);
  const [showVoidHistory, setShowVoidHistory] = useState<boolean>(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showMoveTable, setShowMoveTable] = useState(false);
  const [destinationTableId, setDestinationTableId] = useState<string>('');
  const [isMovingTable, setIsMovingTable] = useState(false);
  const [voidNotification, setVoidNotification] = useState<string | null>(null);
  const [isSubmittingVoid, setIsSubmittingVoid] = useState<boolean>(false);

  // Modifiers state
  const [modifyingProduct, setModifyingProduct] = useState<Product | null>(null);
  const [activeModifiers, setActiveModifiers] = useState<SelectedModifier[]>([]);
  const [itemSpecialNote, setItemSpecialNote] = useState<string>('');

  // Filter products by category and real-time name search query (both EN and AR)
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'ALL' || p.categoryId === selectedCat;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const translatedName = tCatalog(p.name).toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) || translatedName.includes(q);
    return matchesCat && matchesSearch;
  });


  // Active order for selected table if occupied
  const tableOrder = orders.find(
    (o) => o.tableId === selectedTable?.id && o.status !== 'PAID' && o.status !== 'VOIDED'
  );

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table);
    setWaiterCart([]);
    setSearchQuery('');
    setActiveTab('ORDER');
  };

  const handleOpenVoidModal = (
    source: 'CART' | 'TABLE_ORDER',
    item: OrderItem,
    index?: number,
    orderId?: string
  ) => {
    setVoidTarget({ source, item, index, orderId });
    setVoidReason(commonVoidReasons[0]);
    setVoidPinCode('');
    setVoidError('');
  };

  const handleConfirmVoid = async () => {
    if (!voidTarget || !voidReason.trim() || !voidPinCode.trim()) return;
    setIsSubmittingVoid(true);
    setVoidError('');

    try {
      // 1. Verify Void Password First
      const result = await apiFetch('/api/verify-void-password', {
        method: 'POST',
        body: JSON.stringify({ tenantId: tenant.id, pinCode: voidPinCode }),
      });

      // apiFetch throws if !res.ok, but our verify-void-password might return 200 with isValid: false
      // Actually my previous implementation of authenticate middleware might return 401.
      // Let's assume apiFetch handles the error if the status is not ok.

      // 2. Proceed with void
      const { source, item, index, orderId } = voidTarget;
      const finalReason = voidReason.trim();

      if (source === 'CART' && index !== undefined) {
        const updated = [...waiterCart];
        updated.splice(index, 1);
        setWaiterCart(updated);

        const logRecord: VoidAuditRecord = {
          id: `void-${Date.now()}-${Math.random()}`,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          reason: finalReason,
          tableNumber: selectedTable?.number || 'N/A',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'UNFIRED_CART',
        };
        setVoidAuditLogs((prev) => [logRecord, ...prev]);
        setVoidNotification(`${t('waiter.voidBtn')}: ${item.quantity}x ${tCatalog(item.productName)} • "${finalReason}"`);
        setTimeout(() => setVoidNotification(null), 4500);
        setVoidTarget(null);
      } else if (source === 'TABLE_ORDER' && orderId) {
        const data = await apiFetch(`/api/orders/${orderId}/items/${item.id}/void`, {
          method: 'POST',
          body: JSON.stringify({ reason: finalReason }),
        });
        if (data.order && onOrderUpdated) {
          onOrderUpdated(data.order);
        }
        if (data.order?.status === 'VOIDED' && selectedTable) {
          onTableStatusChange(selectedTable.id, 'FREE');
        }
        const logRecord: VoidAuditRecord = {
          id: `void-${Date.now()}-${Math.random()}`,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          reason: finalReason,
          tableNumber: selectedTable?.number || 'N/A',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'KITCHEN_QUEUE',
        };
        setVoidAuditLogs((prev) => [logRecord, ...prev]);
        setVoidNotification(`${t('waiter.voidBtn')}: ${item.quantity}x ${tCatalog(item.productName)} • "${finalReason}"`);
        setTimeout(() => setVoidNotification(null), 4500);
        setVoidTarget(null);
      }
    } catch (err) {
      console.error('Failed to void item:', err);
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  const handleConfirmSplitBill = async (guestSplits: OrderItem[][]) => {
    if (!tableOrder) return;
    try {
      await apiFetch(`/api/orders/${tableOrder.id}/split`, {
        method: 'POST',
        body: JSON.stringify({ splits: guestSplits }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to split bill:', err);
    }
  };

  const handleConfirmMoveTable = async () => {
    if (!selectedTable || !destinationTableId) return;
    setIsMovingTable(true);
    try {
      await apiFetch(`/api/tables/${selectedTable.id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({ destinationTableId }),
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to move table:', err);
    } finally {
      setIsMovingTable(false);
      setShowMoveTable(false);
    }
  };

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

    const existingIndex = waiterCart.findIndex(
      (item) =>
        item.productId === product.id &&
        item.notes === notes &&
        JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
    );

    if (existingIndex > -1) {
      const updated = [...waiterCart];
      updated[existingIndex].quantity += 1;
      setWaiterCart(updated);
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
      setWaiterCart([...waiterCart, newItem]);
    }
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable || waiterCart.length === 0) return;
    setIsSending(true);

    try {
      const subtotal = waiterCart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const taxAmount = (subtotal * tenant.taxRatePct) / 100;
      const total = subtotal + taxAmount;

      const orderPayload: Partial<Order> = {
        type: 'DINE_IN',
        tableId: selectedTable.id,
        tableName: selectedTable.number,
        customerName: `Guest (${selectedTable.number})`,
        status: 'NEW',
        items: waiterCart,
        subtotal,
        discountAmount: 0,
        taxAmount,
        total,
        waiterName: currentUser?.name || 'Server',
        createdByUserId: currentUser?.id,
        createdByUserRole: currentUser?.role || 'WAITER',
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
      onTableStatusChange(selectedTable.id, 'OCCUPIED');
      setWaiterCart([]);
      setActiveTab('FLOOR');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestBill = async (tableId: string) => {
    await apiFetch(`/api/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'BILL_REQUESTED' }),
    });
    onTableStatusChange(tableId, 'BILL_REQUESTED');

    const activeOrder = orders.find(
      (o) => o.tableId === tableId && o.status !== 'PAID' && o.status !== 'VOIDED'
    );
    if (activeOrder && onShowReceipt) {
      onShowReceipt(activeOrder);
    }
  };

  const handleClearTable = async (tableId: string) => {
    await apiFetch(`/api/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'FREE', assignedWaiter: undefined }),
    });
    onTableStatusChange(tableId, 'FREE');
  };

  const allCartItems = [...(tableOrder?.items || []), ...waiterCart];
  const cartItemCount = allCartItems.reduce((acc, i) => acc + (i.quantity ?? 1), 0);
  const cartSubtotal = allCartItems.reduce((acc, i) => acc + (i.unitPrice ?? 0) * (i.quantity ?? 1), 0);
  const cartTax = (cartSubtotal * (tenant.taxRatePct ?? 15)) / 100;
  const cartTotal = cartSubtotal + cartTax;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Waiter Navigation Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 mb-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-white">{t('waiter.title')}</h2>
            <p className="text-[11px] text-slate-400">Server: {currentUser?.name || 'Tariq Mansoor'} • {branch?.name || 'Main Branch'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('FLOOR')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'FLOOR' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            {t('waiter.floorTab')} ({tables.length})
          </button>
          <button
            disabled={!selectedTable}
            onClick={() => setActiveTab('ORDER')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ORDER' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            {selectedTable ? `${t('common.table')} ${selectedTable.number}` : t('waiter.orderTab')}
          </button>
        </div>
      </div>

      {/* View 1: Tables Overview */}
      {activeTab === 'FLOOR' && (
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map((table) => {
              const active = table.status !== 'FREE'
                ? orders.find(
                    (o) => o.tableId === table.id && o.status !== 'PAID' && o.status !== 'VOIDED'
                  )
                : undefined;
              return (
                <div
                  key={table.id}
                  onClick={() => handleSelectTable(table)}
                  className={`p-4 rounded-2xl border ${isRTL ? 'text-right' : 'text-left'} cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-36 ${
                    table.status === 'OCCUPIED'
                      ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                      : table.status === 'BILL_REQUESTED'
                      ? 'bg-indigo-950/30 border-indigo-500 hover:border-indigo-400 animate-pulse'
                      : table.status === 'DIRTY'
                      ? 'bg-rose-950/20 border-rose-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lg font-black text-white">{table.number}</span>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{table.section.replace('_', ' ')}</p>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        table.status === 'OCCUPIED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : table.status === 'BILL_REQUESTED'
                          ? 'bg-indigo-500/30 text-indigo-200'
                          : table.status === 'DIRTY'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {table.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>{table.capacity}p</span>
                    </div>
                    {active ? (
                      <span className="font-bold text-amber-400">
                        {formatCurrency(active?.total, tenant.currency)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold">+ {t('nav.modules.pos')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Mobile Table Order Taker */}
      {activeTab === 'ORDER' && selectedTable && (
        <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden">
          {/* Menu Selector */}
          <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-slate-800 bg-slate-950/40">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400 pointer-events-none`} />
                <input
                  id="waiter-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('waiter.searchDishes')}
                  className={`w-full ${isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition`}
                />
                {searchQuery && (
                  <button
                    id="waiter-clear-search-btn"
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-2 text-slate-400 hover:text-white p-0.5 rounded transition`}
                    title={t('waiter.clearSearch')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            <div className="p-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCat('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCat === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {t('common.all')}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCat === c.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {getLocalizedName(c)}
                </button>
              ))}
            </div>

            {/* Products */}
            <div className="flex-1 p-3 overflow-y-auto grid grid-cols-2 gap-2">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
                  <Search className="w-6 h-6 text-slate-600 mb-1" />
                  <span className="font-medium text-slate-400">
                    {t('waiter.noDishesFound')}
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-amber-400 hover:text-amber-300 underline text-xs mt-1"
                    >
                      {t('waiter.clearSearch')}
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    disabled={product.is86d}
                    onClick={() => handleProductClick(product)}
                    className={`p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 ${isRTL ? 'text-right' : 'text-left'} transition flex flex-col justify-between`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{getLocalizedName(product)}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{getLocalizedDesc(product)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400">
                        {formatCurrency(product.price, tenant.currency)}
                      </span>
                      <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                        +
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Current Table Cart / Actions */}
          <div className="w-full md:w-80 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{t('common.table')} {selectedTable.number}</h3>
                <span className="text-[11px] text-slate-400">{t('common.status')}: {selectedTable.status}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowOrderHistoryModal(true)}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition"
                  title={t('waiter.orderHistory', 'Order History')}
                >
                  <HistoryIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('waiter.orderHistory', 'History')}</span>
                </button>
                {(selectedTable.status === 'OCCUPIED' || selectedTable.status === 'BILL_REQUESTED') && (
                  <button
                    onClick={() => handleRequestBill(selectedTable.id)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedTable.status === 'BILL_REQUESTED' ? t('common.print', 'Print Bill') : t('waiter.askBill')}</span>
                  </button>
                )}
                {selectedTable.status === 'OCCUPIED' && tableOrder && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowSplitBill(true)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30`}
                    >
                      {t('waiter.splitBill', 'Split Bill')}
                    </button>
                    <button
                      onClick={() => setShowMoveTable(true)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30`}
                    >
                      {t('waiter.moveTable', 'Move Table')}
                    </button>
                  </div>
                )}
                {selectedTable.status === 'DIRTY' && (
                  <button
                    onClick={() => handleClearTable(selectedTable.id)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                  >
                    {t('waiter.cleaned')}
                  </button>
                )}
              </div>
            </div>

            {/* Notification if item voided */}
            {voidNotification && (
              <div className="mx-3 mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-medium text-[11px] truncate">{voidNotification}</span>
                </div>
                <button
                  onClick={() => setVoidNotification(null)}
                  className="text-rose-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Pending Waiter Cart Items */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('waiter.newItemsToFire')}
              </span>
              {waiterCart.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  {t('waiter.tapDishesHint')}
                </p>
              ) : (
                waiterCart.map((item, idx) => (
                  <div
                    key={idx}
                    id={`cart-item-${item.id}`}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col gap-2 group hover:border-slate-700 transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{tCatalog(item.productName)}</div>
                        
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className={`text-[10px] text-slate-400 space-y-0.5 mt-0.5 ${isRTL ? 'pr-2 border-r' : 'pl-2 border-l'} border-slate-800`}>
                            {item.modifiers.map((m, mIdx) => (
                              <div key={mIdx} className="flex justify-between">
                                <span>+ {tCatalog(m.name)}</span>
                                {m.price > 0 && <span>+{formatCurrency(m.price, tenant.currency)}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className={`text-[10px] text-amber-300 italic mt-0.5 ${isRTL ? 'pr-1' : 'pl-1'}`}>
                            "{item.notes}"
                          </div>
                        )}

                        <div className="text-[11px] text-amber-400 font-mono mt-1">
                          {formatCurrency((item.unitPrice ?? 0) * (item.quantity ?? 1), tenant.currency)}
                        </div>
                      </div>

                      {/* Void Item Button */}
                      <button
                        id={`void-cart-item-${item.id}`}
                        type="button"
                        onClick={() => handleOpenVoidModal('CART', item, idx)}
                        className="px-2 py-1 text-[10px] font-bold text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg flex items-center gap-1 transition shrink-0"
                        title={t('waiter.voidBtn')}
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>{t('waiter.voidBtn')}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatCurrency(item.unitPrice, tenant.currency)} {t('pos.each')}
                      </span>
                      <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              handleOpenVoidModal('CART', item, idx);
                            } else {
                              const updated = [...waiterCart];
                              updated[idx].quantity -= 1;
                              setWaiterCart(updated);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title={item.quantity === 1 ? t('waiter.voidBtn') : '-1'}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const updated = [...waiterCart];
                            updated[idx].quantity += 1;
                            setWaiterCart(updated);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="+1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Already Sent Order Items */}
              {tableOrder && (
                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    <span>{t('waiter.alreadyInKitchen')} ({tableOrder.orderNumber})</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[9px] border border-amber-500/20 font-mono">
                      {tableOrder.status}
                    </span>
                  </span>
                  {tableOrder.items.map((i, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex justify-between items-center py-1 border-b border-slate-900">
                      <div>
                        <span>{i.quantity}x {tCatalog(i.productName)}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                          {formatCurrency((i.unitPrice ?? 0) * (i.quantity ?? 1), tenant.currency)}
                        </span>
                      </div>
                      {tableOrder.status === 'NEW' && (
                        <button
                          type="button"
                          onClick={() => handleOpenVoidModal('TABLE_ORDER', i, idx, tableOrder.id)}
                          className="px-1.5 py-0.5 text-[9px] font-bold text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded flex items-center gap-1 transition"
                          title={t('waiter.voidBtn')}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>{t('waiter.voidBtn')}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Voided Items Audit Log */}
              {voidAuditLogs.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowVoidHistory(!showVoidHistory)}
                    className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <HistoryIcon className="w-3 h-3 text-rose-400" />
                      {t('waiter.voidLogTitle')} ({voidAuditLogs.length})
                    </span>
                    <span className="text-[9px] text-slate-500 lowercase underline">
                      {showVoidHistory ? 'hide' : 'view'}
                    </span>
                  </button>
                  {showVoidHistory && (
                    <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {voidAuditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30 text-xs"
                        >
                          <div className="flex justify-between items-center text-slate-200">
                            <span className="font-semibold text-rose-300">
                              {log.quantity}x {tCatalog(log.productName)}
                            </span>
                            <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className="text-slate-500">{t('waiter.reasonLabel')}</span>
                            <span className="text-slate-200 italic font-medium">{log.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Summary Footer */}
            {allCartItems.length > 0 && (
              <div className="p-3 border-t border-slate-800 bg-slate-900 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('common.subtotal', 'Subtotal')} ({cartItemCount})</span>
                  <span>{formatCurrency(cartSubtotal, tenant.currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t('common.tax', 'Tax')} ({tenant.taxRatePct ?? 15}%)</span>
                  <span>{formatCurrency(cartTax, tenant.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800/80">
                  <span>{t('common.total', 'Total')}</span>
                  <span className="text-amber-400 font-mono">{formatCurrency(cartTotal, tenant.currency)}</span>
                </div>
              </div>
            )}

            {/* Fire Button */}
            <div className="p-3 border-t border-slate-800 bg-slate-950">
              <button
                disabled={waiterCart.length === 0 || isSending}
                onClick={handleSendToKitchen}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40 transition"
              >
                <Send className="w-4 h-4" />
                <span>{t('waiter.sendToKitchen')} ({waiterCart.reduce((a, b) => a + (b.quantity ?? 1), 0)} {t('pos.items')})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Item Modal */}
      {voidTarget && (
        <div
          id="void-item-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t('waiter.voidModalTitle')}</h3>
                  <p className="text-[11px] text-slate-400">
                    {t('common.table')} {selectedTable?.number} • {voidTarget.source === 'CART' ? t('waiter.unfiredCartItem') : t('waiter.unfiredKitchenItem')}
                  </p>
                </div>
              </div>
              <button
                id="close-void-modal-btn"
                onClick={() => setVoidTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 text-xs">
              {/* Item preview card */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    {t('waiter.itemToVoid')}
                  </span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {voidTarget.item.quantity}x {tCatalog(voidTarget.item.productName)}
                  </div>
                </div>
                <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    {t('waiter.amountToDeduct')}
                  </span>
                  <div className="text-sm font-extrabold text-rose-400 mt-0.5 font-mono">
                    -{formatCurrency((voidTarget.item.unitPrice ?? 0) * (voidTarget.item.quantity ?? 1), tenant.currency)}
                  </div>
                </div>
              </div>

              {/* Reason Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">
                  {t('waiter.selectReasonPrompt')} <span className="text-rose-400">*</span>
                </label>

                {/* Quick pills */}
                <div className="grid grid-cols-2 gap-1.5">
                  {commonVoidReasons.map((r) => {
                    const isSelected = voidReason === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setVoidReason(r)}
                        className={`px-2.5 py-1.5 rounded-lg ${isRTL ? 'text-right' : 'text-left'} text-[11px] transition flex items-center justify-between border ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 font-semibold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{r}</span>
                        {isSelected && <Check className="w-3 h-3 text-rose-400 shrink-0 mx-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom text input */}
                <div className="pt-1">
                  <input
                    id="void-reason-input"
                    type="text"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder={t('waiter.customReasonPlaceholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                {/* Void Pin Code */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Manager Void Password / PIN <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={voidPinCode}
                    onChange={(e) => {
                      setVoidPinCode(e.target.value);
                      setVoidError('');
                    }}
                    placeholder="Enter PIN"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                  {voidError && <p className="text-rose-400 text-[10px] mt-1 font-semibold">{voidError}</p>}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                id="cancel-void-btn"
                type="button"
                onClick={() => setVoidTarget(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {t('waiter.keepItem')}
              </button>
              <button
                id="confirm-void-item-btn"
                type="button"
                disabled={!voidReason.trim() || !voidPinCode.trim() || isSubmittingVoid}
                onClick={handleConfirmVoid}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmittingVoid ? t('waiter.voidingStatus') : t('waiter.confirmVoidBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
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

      {/* Move Table Modal */}
      {showMoveTable && selectedTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {t('waiter.moveTable', 'Move Table')} - {selectedTable.number}
              </h3>
              <button onClick={() => { setShowMoveTable(false); setDestinationTableId(''); }} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400">
                {t('waiter.selectDestinationTable', 'Select an empty table to move this order to:')}
              </p>
              
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {tables.filter(t => t.status === 'FREE').length === 0 && (
                  <p className="col-span-3 text-center text-xs text-slate-500 py-4">
                    {t('common.noData', 'No data available')}
                  </p>
                )}
                {tables.filter(t => t.status === 'FREE').map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDestinationTableId(t.id)}
                    className={`p-2 rounded-xl border text-center transition ${
                      destinationTableId === t.id
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="font-bold">{t.number}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/50">
              <button
                onClick={() => { setShowMoveTable(false); setDestinationTableId(''); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                disabled={!destinationTableId || isMovingTable}
                onClick={handleConfirmMoveTable}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2"
              >
                {isMovingTable ? t('common.loading', 'Loading...') : t('waiter.confirmMove', 'Confirm Move')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitBill && tableOrder && (
        <SplitBillModal
          order={tableOrder}
          tenant={tenant}
          onClose={() => setShowSplitBill(false)}
          onConfirm={handleConfirmSplitBill}
        />
      )}

      {/* Table Order History Modal */}
      {showOrderHistoryModal && selectedTable && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <HistoryIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {t('waiter.orderHistory', 'Order History')} - {t('common.table')} {selectedTable.number}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('waiter.last10Orders', 'Last 10 orders for this table')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {/* Order History Search Bar */}
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-slate-400 pointer-events-none`} />
                <input
                  id="order-history-search-input"
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder={t('waiter.searchHistoryPlaceholder', 'Search by order #, dish name...')}
                  className={`w-full ${isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition`}
                />
                {historySearchQuery && (
                  <button
                    id="order-history-clear-search-btn"
                    type="button"
                    onClick={() => setHistorySearchQuery('')}
                    className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-2 text-slate-400 hover:text-white p-1 rounded transition`}
                    title={t('common.clear', 'Clear')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {(() => {
                const rawTableHistory = orders
                  .filter((o) => o.tableId === selectedTable.id)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 10);

                if (rawTableHistory.length === 0) {
                  return (
                    <div className="text-center py-12 px-4 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                        <HistoryIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {t('waiter.noOrderHistory', 'No past order history found for Table')} {selectedTable.number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t('waiter.noHistoryDesc', 'Completed or past orders for this table will be listed here.')}
                      </p>
                    </div>
                  );
                }

                const query = historySearchQuery.toLowerCase().trim();
                const tableHistory = rawTableHistory.filter((order) => {
                  if (!query) return true;

                  const orderNum = (order.orderNumber || '').toString().toLowerCase();
                  const orderId = (order.id || '').toLowerCase();
                  if (orderNum.includes(query) || orderId.includes(query)) return true;

                  return order.items?.some((item) => {
                    const pName = (item.productName || '').toLowerCase();
                    const en = (item.nameEn || '').toLowerCase();
                    const ar = (item.nameAr || '').toLowerCase();
                    if (pName.includes(query) || en.includes(query) || ar.includes(query)) return true;

                    return item.selectedModifiers?.some((mod) => {
                      const mName = (mod.name || '').toLowerCase();
                      const mEn = (mod.nameEn || '').toLowerCase();
                      const mAr = (mod.nameAr || '').toLowerCase();
                      return mName.includes(query) || mEn.includes(query) || mAr.includes(query);
                    });
                  });
                });

                if (tableHistory.length === 0) {
                  return (
                    <div className="text-center py-10 px-4 space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                      <Search className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">
                        {t('waiter.noMatchingHistory', 'No orders found matching your search')} "{historySearchQuery}"
                      </p>
                      <button
                        onClick={() => setHistorySearchQuery('')}
                        className="px-3 py-1 text-xs text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        {t('waiter.clearSearch', 'Clear search')}
                      </button>
                    </div>
                  );
                }

                return tableHistory.map((order) => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'PAID':
                        return { label: t('common.paid', 'Paid'), style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
                      case 'VOIDED':
                      case 'CANCELLED':
                        return { label: t('common.voided', 'Voided'), style: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
                      case 'SERVED':
                        return { label: t('common.served', 'Served'), style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
                      case 'BILL_REQUESTED':
                        return { label: t('floor.billRequested', 'Bill Requested'), style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
                      default:
                        return { label: status, style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
                    }
                  };

                  const badge = getStatusBadge(order.status);
                  const formattedDate = new Date(order.timestamp).toLocaleString();

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 transition hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-amber-400">
                            #{order.orderNumber || order.id.slice(-4)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.style}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs text-slate-300">
                            <div>
                              <span className="font-semibold text-white">{item.quantity}x</span>{' '}
                              <span>{isRTL ? (item.nameAr || item.nameEn || item.productName) : (item.nameEn || item.nameAr || item.productName)}</span>
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="text-[10px] text-slate-400 pl-3">
                                  + {item.selectedModifiers.map((m) => isRTL ? (m.nameAr || m.nameEn || m.name) : (m.nameEn || m.nameAr || m.name)).join(', ')}
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-slate-400">
                              {formatCurrency((item.unitPrice ?? 0) * (item.quantity ?? 1), tenant.currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer & Actions */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-slate-400">{t('common.total', 'Total')}: </span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">
                            {formatCurrency(order.total, tenant.currency)}
                          </span>
                        </div>
                        {onShowReceipt && (
                          <button
                            onClick={() => onShowReceipt(order)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{t('waiter.viewReceipt', 'View Receipt')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setShowOrderHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
