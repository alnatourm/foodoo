import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/restaurantDb.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- TENANTS & SAAS ONBOARDING ---
app.get('/api/tenants', (_req, res) => {
  res.json(db.tenants);
});

app.post('/api/tenants', (req, res) => {
  const { name, country, currency, taxRatePct, branchName } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Restaurant name is required' });
  }
  const newTenant = db.createTenant(
    name,
    country || 'Saudi Arabia',
    currency || 'SAR',
    Number(taxRatePct) || 15,
    branchName || `${name} - Main Branch`
  );
  res.status(201).json(newTenant);
});

app.get('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  const tenant = db.getTenant(id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
});

app.put('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateTenantSettings(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Tenant not found' });
  res.json(updated);
});

app.patch('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateTenantSettings(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Tenant not found' });
  res.json(updated);
});

// --- STAFF & RBAC USERS ---
app.get('/api/staff', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const staff = db.getStaff(tenantId);
  res.json(staff);
});

app.post('/api/staff', (req, res) => {
  const { tenantId, name, role, pinCode, email, phone, assignedStation, branchId } = req.body;
  const tId = tenantId || db.tenants[0]?.id;
  if (!name || !pinCode) {
    return res.status(400).json({ error: 'Staff name and PIN code are required' });
  }
  const created = db.createStaff(tId, {
    name,
    role: role || 'WAITER',
    pinCode,
    email,
    phone,
    assignedStation,
    branchId,
  });
  res.status(201).json(created);
});

app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateStaff(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Staff member not found' });
  res.json(updated);
});

app.delete('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const success = db.deleteStaff(id);
  if (!success) return res.status(404).json({ error: 'Staff member not found' });
  res.json({ success: true });
});

app.post('/api/staff/login-pin', (req, res) => {
  const { tenantId, pinCode } = req.body;
  const tId = tenantId || db.tenants[0]?.id;
  if (!pinCode) return res.status(400).json({ error: 'PIN code is required' });

  const user = db.authenticateStaffByPin(tId, pinCode);
  if (!user) {
    return res.status(401).json({ error: 'Invalid PIN or user account inactive' });
  }
  res.json({ success: true, user });
});

// --- KITCHEN STATIONS ---
app.get('/api/stations', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const stations = db.getTenantStations(tenantId);
  res.json(stations);
});

app.post('/api/stations', (req, res) => {
  const { tenantId, name, code, color, description } = req.body;
  const tId = tenantId || db.tenants[0]?.id;
  if (!name) return res.status(400).json({ error: 'Station name is required' });

  try {
    const station = db.addTenantStation(tId, { name, code, color, description });
    res.status(201).json(station);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create station' });
  }
});

app.put('/api/stations/:id', (req, res) => {
  const { id } = req.params;
  const { tenantId, name, code, color, description, displayOrder } = req.body;
  const tId = tenantId || db.tenants[0]?.id;
  const updated = db.updateTenantStation(tId, id, { name, code, color, description, displayOrder });
  if (!updated) return res.status(404).json({ error: 'Station not found' });
  res.json(updated);
});

app.delete('/api/stations/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = (req.query.tenantId as string) || (req.body?.tenantId as string) || db.tenants[0]?.id;
  const result = db.deleteTenantStation(tenantId, id);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Failed to delete station' });
  }
  res.json({ success: true });
});

// --- SECURITY & VOID PASSWORD VERIFICATION ---
app.post('/api/verify-void-password', (req, res) => {
  const { tenantId, password } = req.body;
  const tId = tenantId || db.tenants[0]?.id;
  const tenant = db.getTenant(tId);

  const expectedPassword = tenant?.voidPassword || '1234';
  const provided = String(password || '').trim();

  // Allow if matches tenant void password, or matches any admin/owner/manager staff PIN
  const matchesVoidPassword = provided === expectedPassword;
  const matchesManagerPin = db.staffUsers.some(
    (s) => s.tenantId === tId && (s.role === 'OWNER' || s.role === 'SUPER_ADMIN' || s.role === 'MANAGER') && s.pinCode === provided
  );

  if (matchesVoidPassword || matchesManagerPin) {
    return res.json({ valid: true });
  }
  return res.status(403).json({ valid: false, error: 'Invalid void authorization password' });
});

// --- BRANCHES ---
app.get('/api/branches', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branches = db.getBranchesByTenant(tenantId);
  res.json(branches);
});

app.get('/api/tenants/:tenantId/branches', (req, res) => {
  const { tenantId } = req.params;
  const branches = db.getBranchesByTenant(tenantId);
  res.json(branches);
});

// --- MENU & PRODUCTS (WITH RECIPES / BOM) ---
app.get('/api/menu', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const categories = db.categories.filter((c) => c.tenantId === tenantId);
  const products = db.getProducts(tenantId);
  res.json({ categories, products });
});

app.post('/api/categories', (req, res) => {
  const { tenantId, name, icon, displayOrder } = req.body;
  const tId = tenantId || db.tenants[0]?.id;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const newCategory = {
    id: `cat-${Date.now()}`,
    tenantId: tId,
    name: String(name).trim(),
    icon: icon ? String(icon).trim() : 'Utensils',
    displayOrder: Number(displayOrder) || (db.categories.length + 1),
  };

  db.categories.push(newCategory);
  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const category = db.categories.find((c) => c.id === id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const { name, icon, displayOrder } = req.body;
  if (name !== undefined) category.name = String(name).trim();
  if (icon !== undefined) category.icon = String(icon).trim();
  if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);

  res.json(category);
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const index = db.categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const category = db.categories[index];
  // Check if products exist in category
  const productsCount = db.products.filter((p) => p.categoryId === id).length;
  if (productsCount > 0) {
    return res.status(400).json({
      error: `Cannot delete category "${category.name}" because it contains ${productsCount} item(s). Reassign or delete those items first.`,
    });
  }

  db.categories.splice(index, 1);
  res.json({ success: true, removedCategory: category });
});

app.post('/api/products', (req, res) => {
  const { tenantId, name, categoryId, description, price, costPrice, isCombo, station, recipe, modifierGroups } = req.body;
  const tId = tenantId || db.tenants[0]?.id;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  // Calculate cost price from recipe if not provided
  let computedCost = Number(costPrice);
  const recipeList = Array.isArray(recipe) ? recipe : [];
  if (isNaN(computedCost) || computedCost <= 0) {
    computedCost = recipeList.reduce((acc: number, r: any) => {
      const ing = db.ingredients.find((i) => i.id === r.ingredientId);
      const unitCost = Number(r.unitCost ?? ing?.costPerUnit ?? 0);
      return acc + (Number(r.quantity) || 0) * unitCost;
    }, 0);
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    tenantId: tId,
    categoryId: categoryId || db.categories[0]?.id || 'cat-burgers',
    name: String(name).trim(),
    description: description ? String(description).trim() : '',
    price: Number(Number(price).toFixed(2)),
    costPrice: Number(Number(computedCost || 0).toFixed(2)),
    isCombo: Boolean(isCombo),
    is86d: false,
    station: station || 'GRILL',
    recipe: recipeList.map((r: any) => {
      const ing = db.ingredients.find((i) => i.id === r.ingredientId);
      return {
        ingredientId: r.ingredientId,
        ingredientName: r.ingredientName || ing?.name || 'Raw Material',
        quantity: Number(r.quantity) || 1,
        uom: r.uom || ing?.uom || 'pcs',
        unitCost: Number(r.unitCost ?? ing?.costPerUnit ?? 0),
      };
    }),
    modifierGroups: Array.isArray(modifierGroups) ? modifierGroups : [],
  };

  db.products.unshift(newProduct as any);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, categoryId, description, price, costPrice, isCombo, is86d, station, recipe, modifierGroups } = req.body;

  if (name !== undefined) product.name = String(name).trim();
  if (categoryId !== undefined) product.categoryId = categoryId;
  if (description !== undefined) product.description = String(description).trim();
  if (price !== undefined) product.price = Number(Number(price).toFixed(2));
  if (isCombo !== undefined) product.isCombo = Boolean(isCombo);
  if (is86d !== undefined) product.is86d = Boolean(is86d);
  if (station !== undefined) product.station = station;
  if (modifierGroups !== undefined && Array.isArray(modifierGroups)) product.modifierGroups = modifierGroups;

  if (Array.isArray(recipe)) {
    product.recipe = recipe.map((r: any) => {
      const ing = db.ingredients.find((i) => i.id === r.ingredientId);
      return {
        ingredientId: r.ingredientId,
        ingredientName: r.ingredientName || ing?.name || 'Raw Material',
        quantity: Number(r.quantity) || 1,
        uom: r.uom || ing?.uom || 'pcs',
        unitCost: Number(r.unitCost ?? ing?.costPerUnit ?? 0),
      };
    });
  }

  if (costPrice !== undefined && !isNaN(Number(costPrice))) {
    product.costPrice = Number(Number(costPrice).toFixed(2));
  } else if (Array.isArray(recipe)) {
    const computedCost = product.recipe.reduce((acc, r) => acc + (r.quantity || 0) * (r.unitCost || 0), 0);
    product.costPrice = Number(Number(computedCost).toFixed(2));
  }

  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const removed = db.products.splice(index, 1)[0];
  res.json({ success: true, removedProduct: removed });
});

const handleToggle86 = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  product.is86d = !product.is86d;
  res.json(product);
};

app.patch('/api/products/:id/toggle-86', handleToggle86);
app.patch('/api/products/:id/86', handleToggle86);

// --- TABLES & FLOOR MANAGEMENT ---
app.get('/api/tables', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const tables = db.getTables(tenantId, branchId);
  res.json(tables);
});

app.patch('/api/tables/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, assignedWaiter } = req.body;
  const table = db.tables.find((t) => t.id === id);
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }
  if (status) table.status = status;
  if (assignedWaiter !== undefined) table.assignedWaiter = assignedWaiter;
  res.json(table);
});

// --- ORDERS & POS / WAITER / QR ---
app.get('/api/orders', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const orders = db.getOrders(tenantId, branchId);
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { tenantId, branchId, orderData } = req.body;
  if (!tenantId || !branchId || !orderData) {
    return res.status(400).json({ error: 'Missing order payload' });
  }
  const created = db.createOrder(tenantId, branchId, orderData);
  res.status(201).json(created);
});

app.post('/api/orders/:id/pay', (req, res) => {
  const { id } = req.params;
  const { paymentMethod, paymentBreakdown } = req.body;
  const result = db.payOrder(id, paymentMethod || 'CASH', paymentBreakdown);
  if (!result.success) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(result);
});

app.post('/api/orders/:id/bump', (req, res) => {
  const { id } = req.params;
  const { nextStatus } = req.body;
  const updated = db.bumpOrderStatus(id, nextStatus);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updated);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = db.bumpOrderStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updated);
});

app.post('/api/orders/:id/void', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  order.status = 'VOIDED';
  order.voidReason = reason || 'Customer cancellation';

  if (order.tableId) {
    const tbl = db.tables.find((t) => t.id === order.tableId);
    if (tbl) {
      tbl.status = 'FREE';
      tbl.activeOrderId = undefined;
    }
  }
  res.json(order);
});

app.post('/api/orders/:id/items/:itemId/void', (req, res) => {
  const { id, itemId } = req.params;
  const { reason } = req.body;
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const itemIndex = order.items.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found in order' });
  }

  const removedItem = order.items.splice(itemIndex, 1)[0];
  removedItem.voidReason = reason || 'Server voided un-fired item';
  removedItem.voidedAt = new Date().toISOString();

  // Recalculate totals
  const subtotal = Number(order.items.reduce((acc, i) => acc + (i.unitPrice ?? 0) * (i.quantity ?? 1), 0).toFixed(2));
  const tenant = db.getTenant(order.tenantId);
  const taxRate = tenant?.taxRatePct ?? 15;
  const discount = Number((order.discountAmount || 0).toFixed(2));
  const taxable = Math.max(0, subtotal - discount);
  order.subtotal = subtotal;
  order.taxAmount = Number(((taxable * taxRate) / 100).toFixed(2));
  order.total = Number((taxable + order.taxAmount).toFixed(2));

  if (order.items.length === 0) {
    order.status = 'VOIDED';
    order.voidReason = `All items voided: ${reason || 'Item voided'}`;
    if (order.tableId) {
      const tbl = db.tables.find((t) => t.id === order.tableId);
      if (tbl) {
        tbl.status = 'FREE';
        tbl.activeOrderId = undefined;
      }
    }
  }

  res.json({ order, removedItem, reason });
});

// --- INVENTORY & RECIPES (BOM) ---
app.get('/api/inventory', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const ingredients = db.getIngredients(tenantId).map((ing) => ({
    ...ing,
    branchStock: ing.currentStock[branchId] ?? 0,
    isLowStock: (ing.currentStock[branchId] ?? 0) <= ing.minStockThreshold,
  }));
  res.json(ingredients);
});

app.post('/api/inventory/adjust', (req, res) => {
  const { ingredientId, branchId, delta, reason } = req.body;
  const ing = db.ingredients.find((i) => i.id === ingredientId);
  if (!ing) return res.status(404).json({ error: 'Ingredient not found' });

  const current = ing.currentStock[branchId] || 0;
  ing.currentStock[branchId] = Math.max(0, current + Number(delta));

  // Log waste/adjustment into accounting if it's waste
  if (Number(delta) < 0 && reason?.toLowerCase().includes('waste')) {
    const cost = Math.abs(Number(delta)) * ing.costPerUnit;
    db.journalEntries.unshift({
      id: `je-waste-${Date.now()}`,
      tenantId: ing.tenantId,
      branchId,
      date: new Date().toISOString().split('T')[0],
      reference: `WASTE-${ing.name.slice(0, 5).toUpperCase()}`,
      description: `Spoilage/Waste: ${Math.abs(Number(delta))} ${ing.uom} of ${ing.name} (${reason})`,
      lines: [
        { accountCode: '5020', accountName: 'Kitchen Spoilage & Waste Expense', debit: cost, credit: 0 },
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: cost },
      ],
    });
  }

  res.json({ success: true, updatedStock: ing.currentStock[branchId] });
});

// --- PURCHASING & SUPPLIERS ---
app.get('/api/purchasing', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const suppliers = db.suppliers.filter((s) => s.tenantId === tenantId);
  const purchaseOrders = db.purchaseOrders.filter((p) => p.tenantId === tenantId && p.branchId === branchId);
  res.json({ suppliers, purchaseOrders });
});

app.post('/api/purchasing/orders', (req, res) => {
  const { tenantId, branchId, poData, supplierId, items } = req.body;
  const sId = supplierId || poData?.supplierId;
  const supplier = db.suppliers.find((s) => s.id === sId);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

  const lineItems = items || poData?.items || [];
  const totalAmount = poData?.totalAmount || lineItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitCost), 0);

  const newPo = {
    id: `po-${Date.now()}`,
    tenantId: tenantId || poData?.tenantId || db.tenants[0]?.id,
    branchId: branchId || poData?.branchId || db.branches[0]?.id,
    supplierId: sId,
    supplierName: supplier.name,
    poNumber: `PO-2026-${String(db.purchaseOrders.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: (poData?.status || 'SENT') as any,
    items: lineItems,
    totalAmount,
  };
  db.purchaseOrders.unshift(newPo);
  res.status(201).json(newPo);
});

app.post('/api/purchasing/orders/:id/receive', (req, res) => {
  const { id } = req.params;
  const received = db.receivePurchaseOrder(id);
  if (!received) return res.status(404).json({ error: 'PO not found' });
  res.json(received);
});

// --- ACCOUNTING & FINANCIALS ---
const getAccountingData = (tenantId: string, branchId: string) => {
  const entries = db.journalEntries.filter((j) => j.tenantId === tenantId && j.branchId === branchId);
  const allBranchOrders = db.orders.filter((o) => o.tenantId === tenantId && o.branchId === branchId);
  const paidOrders = allBranchOrders.filter((o) => o.status === 'PAID');
  const openOrders = allBranchOrders.filter((o) => o.status !== 'PAID' && o.status !== 'VOIDED');
  const voidedOrders = allBranchOrders.filter((o) => o.status === 'VOIDED');

  const grossSales = Number(paidOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0).toFixed(2));
  const discounts = Number(paidOrders.reduce((acc, o) => acc + (o.discountAmount || 0), 0).toFixed(2));
  const netSales = Number((grossSales - discounts).toFixed(2));
  const taxCollected = Number(paidOrders.reduce((acc, o) => acc + (o.taxAmount || 0), 0).toFixed(2));
  const totalCollected = Number(paidOrders.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2));

  let totalCogs = 0;
  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      totalCogs += (item.costPrice || 0) * (item.quantity || 1);
    });
  });
  totalCogs = Number(totalCogs.toFixed(2));

  const grossProfit = Number((netSales - totalCogs).toFixed(2));
  const foodCostPct = netSales > 0 ? Number(((totalCogs / netSales) * 100).toFixed(1)) : 0;

  // Open orders metrics
  const openOrdersCount = openOrders.length;
  const openOrdersSubtotal = Number(openOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0).toFixed(2));
  const openOrdersTax = Number(openOrders.reduce((acc, o) => acc + (o.taxAmount || 0), 0).toFixed(2));
  const openOrdersTotal = Number(openOrders.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2));

  // Grand total orders amount (paid settled + open active)
  const allOrdersAmount = Number((totalCollected + openOrdersTotal).toFixed(2));

  // Payment Breakdown
  const paymentBreakdown = {
    CASH: Number(paidOrders.filter((o) => o.paymentMethod === 'CASH').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    MADA: Number(paidOrders.filter((o) => o.paymentMethod === 'MADA').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    VISA: Number(paidOrders.filter((o) => o.paymentMethod === 'VISA').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    APPLE_PAY: Number(paidOrders.filter((o) => o.paymentMethod === 'APPLE_PAY').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
    SPLIT: Number(paidOrders.filter((o) => o.paymentMethod === 'SPLIT').reduce((acc, o) => acc + o.total, 0).toFixed(2)),
  };

  return {
    journalEntries: entries,
    allOrders: allBranchOrders,
    paidOrders,
    openOrders,
    voidedOrders,
    summary: {
      grossSales,
      discounts,
      netSales,
      taxCollected,
      totalTax: taxCollected,
      totalCollected,
      cogs: totalCogs,
      grossProfit,
      foodCostPct,
      orderCount: paidOrders.length,
      openOrdersCount,
      openOrdersSubtotal,
      openOrdersTax,
      openOrdersTotal,
      allOrdersAmount,
      totalOrdersCount: allBranchOrders.length,
      paymentBreakdown,
      operatingExpenses: 4500,
      netProfit: Number((grossProfit - 4500).toFixed(2)),
    },
  };
};

app.get('/api/accounting', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const data = getAccountingData(tenantId, branchId);
  res.json({
    journalEntries: data.journalEntries,
    pnl: data.summary,
  });
});

app.get('/api/accounting/journals', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const data = getAccountingData(tenantId, branchId);
  res.json(data.journalEntries);
});

app.get('/api/accounting/summary', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const data = getAccountingData(tenantId, branchId);
  res.json(data.summary);
});

// --- SHIFTS & CASH DRAWER ---
const getActiveShiftHandler = (req: express.Request, res: express.Response) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branchId = (req.query.branchId as string) || db.branches[0]?.id;
  const shift = db.shifts.find((s) => s.tenantId === tenantId && s.branchId === branchId && s.status === 'OPEN');
  res.json(shift || null);
};

app.get('/api/shifts/current', getActiveShiftHandler);
app.get('/api/shifts/active', getActiveShiftHandler);

app.post('/api/shifts/open', (req, res) => {
  const { tenantId, branchId, cashierName, openingFloat, startingFloat } = req.body;
  const floatVal = Number(openingFloat ?? startingFloat) || 500;
  const newShift = {
    id: `shift-${Date.now()}`,
    tenantId: tenantId || db.tenants[0]?.id,
    branchId: branchId || db.branches[0]?.id,
    cashierName: cashierName || 'Cashier Ahmed',
    openedAt: new Date().toISOString(),
    openingFloat: floatVal,
    startingFloat: floatVal,
    expectedCash: floatVal,
    cashSalesCollected: 0,
    status: 'OPEN' as const,
    totalSales: 0,
    orderCount: 0,
  };
  db.shifts.unshift(newShift as any);
  res.status(201).json(newShift);
});

app.post('/api/shifts/close', (req, res) => {
  const { shiftId, actualCash, actualCashCount } = req.body;
  const shift = db.shifts.find((s) => s.id === shiftId || s.status === 'OPEN');
  if (!shift) return res.status(404).json({ error: 'Shift not found' });

  const cashCount = Number(actualCash ?? actualCashCount) || 0;
  shift.status = 'CLOSED';
  shift.closedAt = new Date().toISOString();
  shift.actualCash = cashCount;
  (shift as any).actualCashCount = cashCount;
  shift.difference = cashCount - shift.expectedCash;

  res.json(shift);
});

app.post('/api/shifts/:id/close', (req, res) => {
  const { id } = req.params;
  const { actualCash, actualCashCount } = req.body;
  const shift = db.shifts.find((s) => s.id === id);
  if (!shift) return res.status(404).json({ error: 'Shift not found' });

  const cashCount = Number(actualCash ?? actualCashCount) || 0;
  shift.status = 'CLOSED';
  shift.closedAt = new Date().toISOString();
  shift.actualCash = cashCount;
  (shift as any).actualCashCount = cashCount;
  shift.difference = cashCount - shift.expectedCash;

  res.json(shift);
});

// --- MULTI-BRANCH ANALYTICS ---
app.get('/api/analytics', (req, res) => {
  const tenantId = (req.query.tenantId as string) || db.tenants[0]?.id;
  const branches = db.getBranchesByTenant(tenantId);

  const branchesData = branches.map((b) => {
    const bOrders = db.orders.filter((o) => o.tenantId === tenantId && o.branchId === b.id && o.status === 'PAID');
    const sales = bOrders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = bOrders.length;
    const avgBasket = orderCount > 0 ? sales / orderCount : 0;
    const occupiedTables = db.tables.filter((t) => t.branchId === b.id && t.status === 'OCCUPIED').length;
    const totalTables = db.tables.filter((t) => t.branchId === b.id).length || 1;

    return {
      branchId: b.id,
      branchName: b.name,
      city: b.city,
      sales,
      orderCount,
      avgBasket: Number(avgBasket.toFixed(1)),
      occupancyPct: Math.round((occupiedTables / totalTables) * 100),
    };
  });

  // Top products calculation
  const productSalesMap: Record<string, { name: string; quantitySold: number; revenue: number }> = {};
  db.orders
    .filter((o) => o.tenantId === tenantId && o.status === 'PAID')
    .forEach((o) => {
      o.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, quantitySold: 0, revenue: 0 };
        }
        productSalesMap[item.productId].quantitySold += item.quantity;
        productSalesMap[item.productId].revenue += item.quantity * item.unitPrice;
      });
    });

  const topProducts = Object.entries(productSalesMap)
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  // If no orders yet, populate top products from menu items
  const finalTopProducts = topProducts.length > 0
    ? topProducts
    : db.products.filter(p => p.tenantId === tenantId).slice(0, 4).map(p => ({
        productId: p.id,
        name: p.name,
        quantitySold: 18,
        revenue: p.price * 18,
      }));

  const hourlySales = [
    { hour: '12 PM', sales: 420 },
    { hour: '1 PM', sales: 890 },
    { hour: '2 PM', sales: 740 },
    { hour: '3 PM', sales: 310 },
    { hour: '6 PM', sales: 520 },
    { hour: '7 PM', sales: 980 },
    { hour: '8 PM', sales: 1350 },
    { hour: '9 PM', sales: 1120 },
    { hour: '10 PM', sales: 670 },
  ];

  res.json({
    branchesData,
    topProducts: finalTopProducts,
    hourlySales,
  });
});

// Catch-all 404 for any unmatched /api/* route
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RestoOS Server running on http://localhost:${PORT}`);
  });
}

startServer();
