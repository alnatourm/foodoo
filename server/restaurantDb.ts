import {
  Tenant,
  Branch,
  Category,
  Product,
  Ingredient,
  RestaurantTable,
  Order,
  PurchaseOrder,
  Supplier,
  JournalEntry,
  Shift,
  KitchenStation,
  StaffUser,
  StationConfig,
} from '../src/types/restaurant';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export const DEFAULT_STATIONS: StationConfig[] = [
  { id: 'st-grill', name: 'Grill Station', code: 'GRILL', color: '#f97316', description: 'Burgers, Steaks, Buns & Hot Line' },
  { id: 'st-fryer', name: 'Fryer Station', code: 'FRYER', color: '#eab308', description: 'Loaded Fries, Wings, Crispy Tenders' },
  { id: 'st-cold', name: 'Cold Prep & Salad', code: 'COLD', color: '#10b981', description: 'Fresh Salads, Cold Starters, Pickles' },
  { id: 'st-drinks', name: 'Beverages & Bar', code: 'DRINKS', color: '#06b6d4', description: 'Soft Drinks, Mojitos, Specialty Coffee' },
  { id: 'st-oven', name: 'Oven & Bakery', code: 'OVEN', color: '#a855f7', description: 'Fresh Breads, Molten Cakes, Pizzas' },
];

import { getDb } from './firebase';

// In-Memory Multi-Tenant Restaurant Database Store with Firestore Persistence
class RestaurantDatabase {
  private firestore = getDb();
  public tenants: Tenant[] = [];
  public staffUsers: StaffUser[] = [];
  public branches: Branch[] = [];
  public categories: Category[] = [];
  public ingredients: Ingredient[] = [];
  public products: Product[] = [];
  public tables: RestaurantTable[] = [];
  public orders: Order[] = [];
  public suppliers: Supplier[] = [];
  public purchaseOrders: PurchaseOrder[] = [];
  public journalEntries: JournalEntry[] = [];
  public shifts: Shift[] = [];

  private readyPromise: Promise<void>;
  private isReady = false;

  constructor() {
    this.readyPromise = this.initSync();
  }

  public async waitUntilReady() {
    return this.readyPromise;
  }

  private backupFilePath = path.join(process.cwd(), 'data-db-backup.json');

  private loadLocalBackup() {
    try {
      if (fs.existsSync(this.backupFilePath)) {
        const raw = fs.readFileSync(this.backupFilePath, 'utf8');
        const data = JSON.parse(raw);
        if (data.tenants && Array.isArray(data.tenants)) this.tenants = data.tenants;
        if (data.staffUsers && Array.isArray(data.staffUsers)) this.staffUsers = data.staffUsers;
        if (data.branches && Array.isArray(data.branches)) this.branches = data.branches;
        if (data.categories && Array.isArray(data.categories)) this.categories = data.categories;
        if (data.ingredients && Array.isArray(data.ingredients)) this.ingredients = data.ingredients;
        if (data.products && Array.isArray(data.products)) this.products = data.products;
        if (data.tables && Array.isArray(data.tables)) this.tables = data.tables;
        if (data.orders && Array.isArray(data.orders)) this.orders = data.orders;
        if (data.suppliers && Array.isArray(data.suppliers)) this.suppliers = data.suppliers;
        if (data.purchaseOrders && Array.isArray(data.purchaseOrders)) this.purchaseOrders = data.purchaseOrders;
        if (data.journalEntries && Array.isArray(data.journalEntries)) this.journalEntries = data.journalEntries;
        if (data.shifts && Array.isArray(data.shifts)) this.shifts = data.shifts;
      }
    } catch (e) {
      console.error('Failed to load local backup file:', e);
    }
  }

  public saveLocalBackup() {
    try {
      const state = {
        tenants: this.tenants,
        staffUsers: this.staffUsers,
        branches: this.branches,
        categories: this.categories,
        ingredients: this.ingredients,
        products: this.products,
        tables: this.tables,
        orders: this.orders,
        suppliers: this.suppliers,
        purchaseOrders: this.purchaseOrders,
        journalEntries: this.journalEntries,
        shifts: this.shifts,
      };
      fs.writeFileSync(this.backupFilePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save local backup file:', e);
    }
  }

  private async initSync() {
    this.loadLocalBackup();

    const collections = [
      { name: 'tenants', target: this.tenants },
      { name: 'staff', target: this.staffUsers },
      { name: 'branches', target: this.branches },
      { name: 'categories', target: this.categories },
      { name: 'ingredients', target: this.ingredients },
      { name: 'products', target: this.products },
      { name: 'tables', target: this.tables },
      { name: 'orders', target: this.orders },
      { name: 'suppliers', target: this.suppliers },
      { name: 'purchase_orders', target: this.purchaseOrders },
      { name: 'journal_entries', target: this.journalEntries },
      { name: 'shifts', target: this.shifts },
    ];

    const promises = collections.map(({ name, target }) => {
      return new Promise<void>((resolve) => {
        let firstLoad = true;
        this.firestore.collection(name).onSnapshot((snap) => {
          if (snap && snap.docs && snap.docs.length > 0) {
            target.length = 0;
            snap.forEach((doc) => {
              target.push(doc.data() as any);
            });
            this.saveLocalBackup();
          }
          if (firstLoad) {
            firstLoad = false;
            resolve();
          }
        }, (err) => {
          console.warn(`Firestore sync note for ${name}: using persistent local database engine.`);
          if (firstLoad) {
            firstLoad = false;
            resolve();
          }
        });
      });
    });

    await Promise.all(promises);
    this.isReady = true;
  }

  private async persist(colName: string, id: string, data: any) {
    this.saveLocalBackup();
    try {
      await this.firestore.collection(colName).doc(id).set(data);
    } catch (err) {
      // Ignore cloud firestore warning since local JSON storage persists seamlessly
    }
  }

  private async remove(colName: string, id: string) {
    this.saveLocalBackup();
    try {
      await this.firestore.collection(colName).doc(id).delete();
    } catch (err) {
      // Ignore cloud firestore warning
    }
  }

  // Helper Methods
  public getTenant(id: string): Tenant | undefined {
    return this.tenants.find((t) => t.id === id);
  }

  public getBranchesByTenant(tenantId: string): Branch[] {
    return this.branches.filter((b) => b.tenantId === tenantId);
  }

  public getProducts(tenantId: string): Product[] {
    return this.products.filter((p) => p.tenantId === tenantId);
  }

  public getIngredients(tenantId: string): Ingredient[] {
    return this.ingredients.filter((i) => i.tenantId === tenantId);
  }

  public getTables(tenantId: string, branchId: string): RestaurantTable[] {
    return this.tables.filter((t) => t.tenantId === tenantId && t.branchId === branchId);
  }

  public getOrders(tenantId: string, branchId: string): Order[] {
    return this.orders.filter((o) => o.tenantId === tenantId && o.branchId === branchId);
  }

  // Create new Order with Recipe BOM auto-deduction
  public createOrder(tenantId: string, branchId: string, payload: Partial<Order>): Order {
    const orderNumber = `#${4000 + this.orders.length + 1}`;
    const items = (payload.items || []).map((item, idx) => {
      let costPrice = item.costPrice;
      if (!costPrice) {
        const prod = this.products.find(p => p.id === item.productId);
        costPrice = prod?.costPrice || 0;
      }
      return {
        ...item,
        id: item.id || `item-${Date.now()}-${idx}`,
        costPrice,
        quantity: item.quantity || 1,
        unitPrice: Number((item.unitPrice || 0).toFixed(2)),
      };
    });

    const calculatedSubtotal = Number(
      items.reduce((acc, i) => acc + (i.unitPrice || 0) * (i.quantity || 1), 0).toFixed(2)
    );
    const subtotal = payload.subtotal !== undefined ? Number(Number(payload.subtotal).toFixed(2)) : calculatedSubtotal;
    const discountAmount = Number((payload.discountAmount || 0).toFixed(2));
    const tenant = this.getTenant(tenantId);
    const taxRate = tenant?.taxRatePct ?? 15;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const calculatedTax = Number(((taxableAmount * taxRate) / 100).toFixed(2));
    const taxAmount = payload.taxAmount !== undefined ? Number(Number(payload.taxAmount).toFixed(2)) : calculatedTax;
    const calculatedTotal = Number((taxableAmount + taxAmount).toFixed(2));
    const total = payload.total !== undefined ? Number(Number(payload.total).toFixed(2)) : calculatedTotal;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenantId,
      branchId,
      orderNumber,
      type: payload.type || 'DINE_IN',
      tableId: payload.tableId,
      tableName: payload.tableName,
      customerName: payload.customerName || 'Guest Customer',
      status: payload.status || 'NEW',
      items,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      notes: payload.notes,
      waiterName: payload.waiterName || (payload.createdByUserRole === 'WAITER' ? 'Waiter' : undefined),
      cashierName: payload.cashierName || (payload.createdByUserRole === 'CASHIER' ? 'Cashier' : undefined),
      createdByUserId: payload.createdByUserId,
      createdByUserRole: payload.createdByUserRole,
      createdAt: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);
    this.persist('orders', newOrder.id, newOrder);

    // If assigned to a table, update table status
    if (newOrder.tableId) {
      const table = this.tables.find((t) => t.id === newOrder.tableId);
      if (table) {
        table.status = 'OCCUPIED';
        table.activeOrderId = newOrder.id;
        table.assignedWaiter = newOrder.waiterName;
        this.persist('tables', table.id, table);
      }
    }

    // Automatically trigger recipe BOM inventory deduction
    this.deductInventoryForOrder(newOrder, branchId);

    return newOrder;
  }

  // Deduct ingredient inventory based on recipe BOM
  private deductInventoryForOrder(order: Order, branchId: string): number {
    let totalCogs = 0;

    for (const item of order.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product || !product.recipe) continue;

      for (const recipeItem of product.recipe) {
        const ing = this.ingredients.find((i) => i.id === recipeItem.ingredientId);
        if (ing) {
          const qtyNeeded = recipeItem.quantity * item.quantity;
          const current = ing.currentStock[branchId] || 0;
          ing.currentStock[branchId] = Math.max(0, current - qtyNeeded);
          this.persist('ingredients', ing.id, ing);
          totalCogs += recipeItem.unitCost * qtyNeeded;
        }
      }
    }

    return totalCogs;
  }

  // Pay Order & Generate Accounting Journal
  public payOrder(
    orderId: string,
    paymentMethod: 'CASH' | 'MADA' | 'VISA' | 'APPLE_PAY' | 'SPLIT',
    paymentBreakdown?: Record<string, number>
  ): { success: boolean; order?: Order; journalEntry?: JournalEntry } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false };

    order.status = 'PAID';
    order.paymentMethod = paymentMethod;
    order.paymentBreakdown = paymentBreakdown;
    order.paidAt = new Date().toISOString();
    this.persist('orders', order.id, order);

    // Free table if dine in
    if (order.tableId) {
      const tbl = this.tables.find((t) => t.id === order.tableId);
      if (tbl) {
        tbl.status = 'DIRTY';
        tbl.activeOrderId = undefined;
        this.persist('tables', tbl.id, tbl);
      }
    }

    // Generate Double-Entry Accounting Journal
    const tenant = this.getTenant(order.tenantId);
    const accountCode = paymentMethod === 'CASH' ? '1010' : '1020';
    const accountName = paymentMethod === 'CASH' ? 'Cash in Register Till' : `${paymentMethod} Merchant Clearing`;

    const netSales = Number((order.subtotal - (order.discountAmount || 0)).toFixed(2));
    const salesEntry: JournalEntry = {
      id: `je-sale-${Date.now()}`,
      tenantId: order.tenantId,
      branchId: order.branchId,
      date: new Date().toISOString().split('T')[0],
      reference: `RCPT-${order.orderNumber}`,
      description: `Sale Receipt for ${order.orderNumber} via ${paymentMethod}`,
      lines: [
        { accountCode, accountName, debit: order.total, credit: 0 },
        { accountCode: '4010', accountName: 'Food & Beverage Sales Revenue', debit: 0, credit: netSales },
        { accountCode: '2200', accountName: `${tenant?.taxName || 'Output Tax'} Payable`, debit: 0, credit: order.taxAmount },
      ],
    };
    this.journalEntries.unshift(salesEntry);
    this.persist('journal_entries', salesEntry.id, salesEntry);

    // Calculate COGS and generate COGS inventory depletion entry
    let totalCogs = 0;
    order.items.forEach((item) => {
      totalCogs += (item.costPrice || 0) * (item.quantity || 1);
    });
    totalCogs = Number(totalCogs.toFixed(2));
    if (totalCogs > 0) {
      const cogsEntry: JournalEntry = {
        id: `je-cogs-${Date.now()}`,
        tenantId: order.tenantId,
        branchId: order.branchId,
        date: new Date().toISOString().split('T')[0],
        reference: `COGS-${order.orderNumber}`,
        description: `Automatic COGS Depletion for ${order.orderNumber}`,
        lines: [
          { accountCode: '5010', accountName: 'Cost of Goods Sold (BOM Food Cost)', debit: totalCogs, credit: 0 },
          { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: totalCogs },
        ],
      };
      this.journalEntries.unshift(cogsEntry);
    }

    // Also update shift
    const openShift = this.shifts.find((s) => s.branchId === order.branchId && s.status === 'OPEN');
    if (openShift) {
      openShift.totalSales = Number((openShift.totalSales + order.total).toFixed(2));
      openShift.orderCount += 1;
      if (paymentMethod === 'CASH') {
        openShift.expectedCash = Number((openShift.expectedCash + order.total).toFixed(2));
        openShift.cashSalesCollected = Number(((openShift.cashSalesCollected || 0) + order.total).toFixed(2));
      }
    }

    return { success: true, order, journalEntry: salesEntry };
  }

  // Bump KDS Order or Item
  public bumpOrderStatus(orderId: string, nextStatus: 'PREPARING' | 'READY' | 'SERVED'): Order | undefined {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return undefined;
    order.status = nextStatus;
    // update items status as well
    order.items.forEach((item) => {
      if (nextStatus === 'PREPARING') item.status = 'COOKING';
      if (nextStatus === 'READY') item.status = 'READY';
      if (nextStatus === 'SERVED') item.status = 'SERVED';
    });
    return order;
  }

  // Receive Purchase Order into Inventory
  public receivePurchaseOrder(poId: string): PurchaseOrder | undefined {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status === 'RECEIVED') return po;

    po.status = 'RECEIVED';
    po.receivedAt = new Date().toISOString();

    // Automatically increase stock
    for (const item of po.items) {
      const ing = this.ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        const current = ing.currentStock[po.branchId] || 0;
        ing.currentStock[po.branchId] = current + item.quantity;
      }
    }

    // Journal Entry for Inventory Receipt & Accounts Payable
    this.journalEntries.unshift({
      id: `je-grn-${Date.now()}`,
      tenantId: po.tenantId,
      branchId: po.branchId,
      date: new Date().toISOString().split('T')[0],
      reference: `GRN-${po.poNumber}`,
      description: `Goods Received Note: ${po.supplierName}`,
      lines: [
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: po.totalAmount, credit: 0 },
        { accountCode: '2010', accountName: `Accounts Payable - ${po.supplierName}`, debit: 0, credit: po.totalAmount },
      ],
    });

    return po;
  }

  // --- STAFF & RBAC METHODS ---
  public getStaff(tenantId?: string): StaffUser[] {
    const tId = tenantId || this.tenants[0]?.id;
    return this.staffUsers.filter((u) => u.tenantId === tId);
  }

  public createStaff(tenantId: string, data: Partial<StaffUser>): StaffUser {
    const salt = bcrypt.genSaltSync(10);
    const hashedPin = bcrypt.hashSync(data.pinCode?.trim() || '1234', salt);

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      tenantId,
      branchId: data.branchId || this.branches.find((b) => b.tenantId === tenantId)?.id,
      name: data.name?.trim() || 'Staff Member',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      role: data.role || 'WAITER',
      pinCode: hashedPin,
      assignedStation: data.assignedStation || undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
    };
    this.staffUsers.push(newStaff);
    this.persist('staff', newStaff.id, newStaff);
    return newStaff;
  }

  public updateStaff(staffId: string, data: Partial<StaffUser>): StaffUser | undefined {
    const staff = this.staffUsers.find((s) => s.id === staffId);
    if (!staff) return undefined;

    if (data.name !== undefined) staff.name = data.name.trim();
    if (data.email !== undefined) staff.email = data.email.trim();
    if (data.phone !== undefined) staff.phone = data.phone.trim();
    if (data.role !== undefined) staff.role = data.role;
    if (data.pinCode !== undefined) staff.pinCode = data.pinCode.trim();
    if (data.assignedStation !== undefined) staff.assignedStation = data.assignedStation;
    if (data.isActive !== undefined) staff.isActive = data.isActive;
    if (data.branchId !== undefined) staff.branchId = data.branchId;

    return staff;
  }

  public deleteStaff(staffId: string): boolean {
    const index = this.staffUsers.findIndex((s) => s.id === staffId);
    if (index === -1) return false;
    this.staffUsers.splice(index, 1);
    return true;
  }

  public authenticateStaffByPin(tenantId: string, pinCode: string): StaffUser | undefined {
    return this.staffUsers.find(
      (s) => s.tenantId === tenantId && s.isActive && bcrypt.compareSync(pinCode.trim(), s.pinCode)
    );
  }

  // --- KITCHEN STATIONS METHODS ---
  public getTenantStations(tenantId?: string): StationConfig[] {
    const tenant = this.getTenant(tenantId || this.tenants[0]?.id);
    if (!tenant) return DEFAULT_STATIONS;
    if (!tenant.stations || tenant.stations.length === 0) {
      tenant.stations = [...DEFAULT_STATIONS];
    }
    return tenant.stations;
  }

  public addTenantStation(tenantId: string, data: Partial<StationConfig>): StationConfig {
    const tenant = this.getTenant(tenantId);
    if (!tenant) throw new Error('Tenant not found');
    if (!tenant.stations) tenant.stations = [...DEFAULT_STATIONS];

    const code = (data.code || data.name || 'STATION')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .slice(0, 16);

    const newStation: StationConfig = {
      id: `st-${Date.now()}`,
      name: data.name?.trim() || 'New Station',
      code,
      color: data.color || '#f59e0b',
      description: data.description?.trim() || '',
      displayOrder: tenant.stations.length + 1,
    };

    tenant.stations.push(newStation);
    return newStation;
  }

  public updateTenantStation(tenantId: string, stationId: string, data: Partial<StationConfig>): StationConfig | undefined {
    const tenant = this.getTenant(tenantId);
    if (!tenant || !tenant.stations) return undefined;
    const station = tenant.stations.find((s) => s.id === stationId || s.code === stationId);
    if (!station) return undefined;

    if (data.name !== undefined) station.name = data.name.trim();
    if (data.color !== undefined) station.color = data.color;
    if (data.description !== undefined) station.description = data.description.trim();
    if (data.code !== undefined) {
      station.code = data.code.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    }
    if (data.displayOrder !== undefined) station.displayOrder = Number(data.displayOrder);

    return station;
  }

  public deleteTenantStation(tenantId: string, stationId: string): { success: boolean; error?: string } {
    const tenant = this.getTenant(tenantId);
    if (!tenant || !tenant.stations) return { success: false, error: 'Tenant not found' };

    const index = tenant.stations.findIndex((s) => s.id === stationId || s.code === stationId);
    if (index === -1) return { success: false, error: 'Station not found' };

    const station = tenant.stations[index];
    // Check if any product is assigned to this station code
    const assignedProducts = this.products.filter(
      (p) => p.tenantId === tenantId && (p.station === station.code || p.station === station.id)
    );
    if (assignedProducts.length > 0) {
      return {
        success: false,
        error: `Cannot delete station "${station.name}" because ${assignedProducts.length} menu item(s) are assigned to it. Reassign those items first.`,
      };
    }

    tenant.stations.splice(index, 1);
    return { success: true };
  }

  // --- TENANT SETTINGS UPDATE ---
  public updateTenantSettings(tenantId: string, data: Partial<Tenant>): Tenant | undefined {
    const tenant = this.getTenant(tenantId);
    if (!tenant) return undefined;

    if (data.name !== undefined && data.name.trim()) tenant.name = data.name.trim();
    if (data.legalName !== undefined) tenant.legalName = data.legalName.trim();
    if (data.country !== undefined && data.country.trim()) tenant.country = data.country.trim();
    if (data.currency !== undefined && data.currency.trim()) tenant.currency = data.currency.trim().toUpperCase();
    if (data.currencySymbol !== undefined) tenant.currencySymbol = data.currencySymbol.trim();
    if (data.taxRatePct !== undefined) tenant.taxRatePct = Math.max(0, Number(data.taxRatePct));
    if (data.taxName !== undefined) tenant.taxName = data.taxName.trim();
    if (data.serviceChargePct !== undefined) tenant.serviceChargePct = Math.max(0, Number(data.serviceChargePct));
    if (data.voidPassword !== undefined && data.voidPassword.trim()) tenant.voidPassword = data.voidPassword.trim();
    if (data.phone !== undefined) tenant.phone = data.phone.trim();
    if (data.address !== undefined) tenant.address = data.address.trim();
    if (data.plan !== undefined) {
      tenant.plan = data.plan;
      tenant.maxBranches = data.plan === 'MULTI_RESTAURANT' ? 99 : 1;
    }
    if (data.subscriptionStatus !== undefined) tenant.subscriptionStatus = data.subscriptionStatus;
    if (data.paymentStatus !== undefined) tenant.paymentStatus = data.paymentStatus;
    if (data.billingCycle !== undefined) tenant.billingCycle = data.billingCycle;
    if (data.maxBranches !== undefined) tenant.maxBranches = data.maxBranches;
    if (data.ownerName !== undefined) tenant.ownerName = data.ownerName;
    if (data.ownerEmail !== undefined) tenant.ownerEmail = data.ownerEmail;
    if (data.ownerPhone !== undefined) tenant.ownerPhone = data.ownerPhone;
    if (data.ownerPassword !== undefined) {
      tenant.ownerPassword = data.ownerPassword;
    }

    this.persist('tenants', tenant.id, tenant);
    return tenant;
  }

  public deleteTenant(tenantId: string): boolean {
    const idx = this.tenants.findIndex((t) => t.id === tenantId);
    if (idx === -1) return false;
    this.tenants.splice(idx, 1);
    this.branches = this.branches.filter((b) => b.tenantId !== tenantId);
    this.staffUsers = this.staffUsers.filter((s) => s.tenantId !== tenantId);
    this.remove('tenants', tenantId);
    return true;
  }

  // Create new tenant (SaaS multi-tenant onboarding)
  public createTenant(
    name: string,
    country: string,
    currency: string,
    taxRatePct: number,
    branchName: string,
    options?: {
      plan?: 'SINGLE_RESTAURANT' | 'MULTI_RESTAURANT';
      billingCycle?: 'MONTHLY' | 'YEARLY';
      ownerName?: string;
      ownerEmail?: string;
      ownerPhone?: string;
      ownerPin?: string;
      subscriptionStatus?: 'PENDING_APPROVAL' | 'ACTIVE';
      paymentStatus?: 'UNPAID' | 'PAID' | 'WIRE_CONFIRMED';
    }
  ): Tenant {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tenantId = `tenant-${Date.now()}`;
    const plan = options?.plan || 'SINGLE_RESTAURANT';
    const maxBranches = plan === 'MULTI_RESTAURANT' ? 99 : 1;
    const subStatus = options?.subscriptionStatus || 'PENDING_APPROVAL';

    const newTenant: Tenant = {
      id: tenantId,
      name,
      legalName: `${name} Ltd.`,
      slug,
      country,
      currency,
      currencySymbol: currency === 'SAR' ? '﷼' : currency === 'AED' ? 'د.إ' : '$',
      taxRatePct,
      taxName: `${country} VAT ${taxRatePct}%`,
      serviceChargePct: 0,
      voidPassword: '1234',
      stations: [...DEFAULT_STATIONS],
      createdAt: new Date().toISOString(),
      plan,
      maxBranches,
      subscriptionStatus: subStatus,
      paymentStatus: options?.paymentStatus || 'WIRE_CONFIRMED',
      billingCycle: options?.billingCycle || 'YEARLY',
      ownerName: options?.ownerName || 'Restaurant Owner',
      ownerEmail: options?.ownerEmail || `owner@${slug}.com`,
    };
    this.tenants.push(newTenant);
    this.persist('tenants', newTenant.id, newTenant);

    const branchId = `branch-${Date.now()}`;
    const newBranch = {
      id: branchId,
      tenantId,
      name: branchName,
      code: `${country.slice(0, 3).toUpperCase()}-01`,
      city: 'Capital City',
      address: 'Main Commercial Avenue',
      phone: options?.ownerPhone || '+966 50 000 0000',
      isActive: true,
    };
    this.branches.push(newBranch);
    this.persist('branches', newBranch.id, newBranch);

    // Auto-create Owner Staff Account for this Tenant
    const salt = bcrypt.genSaltSync(10);
    const hashedPin = bcrypt.hashSync(options?.ownerPin || '1111', salt);

    const ownerStaff: StaffUser = {
      id: `staff-${tenantId}-owner`,
      tenantId,
      branchId,
      name: options?.ownerName || `${name} Owner`,
      email: options?.ownerEmail || `owner@${slug}.com`,
      phone: options?.ownerPhone || '+966 50 000 0000',
      role: 'OWNER',
      pinCode: hashedPin,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.staffUsers.push(ownerStaff);
    this.persist('staff', ownerStaff.id, ownerStaff);

    // Seed default categories and tables for the new tenant
    const cat1 = { id: `cat-${Date.now()}-1`, tenantId, name: 'Main Courses', icon: 'Utensils', displayOrder: 1 };
    const cat2 = { id: `cat-${Date.now()}-2`, tenantId, name: 'Beverages', icon: 'Coffee', displayOrder: 2 };
    this.categories.push(cat1, cat2);
    this.persist('categories', cat1.id, cat1);
    this.persist('categories', cat2.id, cat2);

    for (let i = 1; i <= 6; i++) {
      const table = {
        id: `tbl-${Date.now()}-${i}`,
        tenantId,
        branchId,
        number: `T-${i < 10 ? '0' + i : i}`,
        section: i <= 4 ? 'MAIN_HALL' : 'OUTDOOR_TERRACE' as any,
        capacity: i % 2 === 0 ? 4 : 2,
        status: 'FREE' as any,
      };
      this.tables.push(table);
      this.persist('tables', table.id, table);
    }

    return newTenant;
  }
}

export const db = new RestaurantDatabase();
