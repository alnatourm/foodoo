export type UserRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'KITCHEN'
  | 'ACCOUNTANT';

export type KitchenStation = 'GRILL' | 'FRYER' | 'COLD' | 'DRINKS' | 'OVEN' | string;

export interface StationConfig {
  id: string;
  name: string;
  code: string; // e.g. 'GRILL', 'FRYER', 'COLD', 'DRINKS', 'OVEN', 'PIZZA', 'BAKERY'
  color?: string; // hex or tailwind color class
  description?: string;
  displayOrder?: number;
}

export interface StaffUser {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  pinCode: string; // 4-digit PIN e.g. '1234'
  assignedStation?: string; // for kitchen staff
  isActive: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  legalName?: string;
  slug: string;
  country: string;
  currency: string;
  currencySymbol?: string;
  taxRatePct: number;
  taxName: string;
  serviceChargePct?: number;
  voidPassword?: string; // Password or PIN required to void orders / items
  stations?: StationConfig[];
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  icon: string;
  displayOrder: number;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  uom: string; // 'g' | 'ml' | 'pcs' | 'kg'
  unitCost: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
  ingredientId?: string;
  ingredientQty?: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  isCombo: boolean;
  is86d: boolean; // Out of stock
  station: KitchenStation;
  image?: string;
  recipe: RecipeItem[];
  modifierGroups?: ModifierGroup[];
}

export interface Ingredient {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  currentStock: Record<string, number>; // branchId -> quantity
  uom: string;
  minStockThreshold: number;
  costPerUnit: number;
}

export type TableStatus = 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'DIRTY';

export interface RestaurantTable {
  id: string;
  tenantId: string;
  branchId: string;
  number: string;
  section: 'MAIN_HALL' | 'OUTDOOR_TERRACE' | 'VIP_LOUNGE';
  capacity: number;
  status: TableStatus;
  activeOrderId?: string;
  assignedWaiter?: string;
}

export type OrderStatus =
  | 'NEW'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'VOIDED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'QR_SELF_ORDER';

export type PaymentMethod = 'CASH' | 'MADA' | 'VISA' | 'APPLE_PAY' | 'SPLIT';

export interface SelectedModifier {
  groupId: string;
  optionId: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  station: KitchenStation;
  modifiers: SelectedModifier[];
  notes?: string;
  status: 'PENDING' | 'COOKING' | 'READY' | 'SERVED';
  voidReason?: string;
  voidedAt?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  type: OrderType;
  tableId?: string;
  tableName?: string;
  customerName?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentBreakdown?: Record<string, number>;
  notes?: string;
  voidReason?: string;
  waiterName?: string;
  cashierName?: string;
  createdByUserId?: string;
  createdByUserRole?: UserRole;
  createdAt: string;
  paidAt?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
}

export interface PurchaseOrderItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  uom: string;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  poNumber: string;
  date: string;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  items: PurchaseOrderItem[];
  totalAmount: number;
  receivedAt?: string;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  branchId: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
}

export interface Shift {
  id: string;
  tenantId: string;
  branchId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  startingFloat: number;
  openingFloat?: number;
  cashSalesCollected?: number;
  expectedCash: number;
  actualCash?: number;
  actualCashCount?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  totalSales: number;
  orderCount: number;
}

export interface AccountingSummary {
  grossSales: number;
  discounts: number;
  netSales: number;
  taxCollected: number;
  totalTax: number;
  totalCollected: number;
  cogs: number;
  grossProfit: number;
  foodCostPct: number;
  orderCount: number;
  openOrdersCount: number;
  openOrdersSubtotal: number;
  openOrdersTax: number;
  openOrdersTotal: number;
  allOrdersAmount: number;
  totalOrdersCount: number;
  paymentBreakdown?: Record<string, number>;
  operatingExpenses: number;
  netProfit: number;
}
