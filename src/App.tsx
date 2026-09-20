import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveModule } from './components/Navbar';
import { PosCashier } from './components/PosCashier';
import { WaiterApp } from './components/WaiterApp';
import { KitchenDisplay } from './components/KitchenDisplay';
import { FloorManagement } from './components/FloorManagement';
import { QrSelfOrder } from './components/QrSelfOrder';
import { MenuAndRecipes } from './components/MenuAndRecipes';
import { InventoryView } from './components/InventoryView';
import { PurchasingView } from './components/PurchasingView';
import { AccountingView } from './components/AccountingView';
import { AnalyticsView } from './components/AnalyticsView';
import { RestaurantSetupView } from './components/RestaurantSetupView';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { ShiftDrawerModal } from './components/ShiftDrawerModal';
import { NewTenantModal } from './components/NewTenantModal';
import { StaffSwitchModal } from './components/StaffSwitchModal';
import { SaasLandingPage } from './components/SaasLandingPage';
import { SaasAdminPanel } from './components/SaasAdminPanel';
import { TenantLoginModal } from './components/TenantLoginModal';
import { ProviderLoginModal } from './components/ProviderLoginModal';
import {
  Tenant,
  Branch,
  Category,
  Product,
  RestaurantTable,
  Order,
  Ingredient,
  Supplier,
  PurchaseOrder,
  JournalEntry,
  Shift,
  StaffUser,
} from './types/restaurant';

const INITIAL_TENANT: Tenant = {
  id: 'tenant-sultan',
  name: 'Sultan Burger & Smokehouse',
  slug: 'sultan-burger',
  country: 'Saudi Arabia',
  currency: 'SAR',
  taxRatePct: 15,
  taxName: 'ZATCA VAT 15%',
  createdAt: '2025-01-15T08:00:00Z',
};

const INITIAL_BRANCH: Branch = {
  id: 'branch-olaya',
  tenantId: 'tenant-sultan',
  name: 'Riyadh - Al Olaya Flagship',
  code: 'RUH-01',
  city: 'Riyadh',
  address: 'King Fahd Road, Al Olaya District',
  phone: '+966 11 456 7890',
  isActive: true,
};

export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>([INITIAL_TENANT]);
  const [activeTenant, setActiveTenant] = useState<Tenant>(INITIAL_TENANT);
  const [branches, setBranches] = useState<Branch[]>([INITIAL_BRANCH]);
  const [activeBranch, setActiveBranch] = useState<Branch>(INITIAL_BRANCH);

  const [activeModule, setActiveModule] = useState<ActiveModule>('POS');
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  // Domain state
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Emergency Staff Fetch
  useEffect(() => {
    fetch('/api/staff?tenantId=tenant-sultan')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStaffUsers(data);
        }
      })
      .catch(err => console.error('Emergency staff fetch failed', err));
  }, []);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<(Ingredient & { branchStock: number; isLowStock: boolean })[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [accountingSummary, setAccountingSummary] = useState({
    grossSales: 0,
    taxCollected: 0,
    cogs: 0,
    grossProfit: 0,
    foodCostPct: 0,
    orderCount: 0,
  });
  const [analyticsData, setAnalyticsData] = useState({
    branchesData: [] as any[],
    topProducts: [] as any[],
    hourlySales: [] as any[],
  });

  // Modals state
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isTenantLoginModalOpen, setIsTenantLoginModalOpen] = useState(false);
  const [isProviderLoginModalOpen, setIsProviderLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'APP' | 'LANDING' | 'SAAS_ADMIN'>('LANDING');

  // 1. Fetch Tenants on mount
  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        const data: Tenant[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTenants(data);
          const currentInList = data.find((t) => t.id === activeTenant.id);
          if (!currentInList) {
            setActiveTenant(data[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load tenants', e);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // 2. Fetch Branches when activeTenant changes
  useEffect(() => {
    if (!activeTenant) return;
    const fetchBranches = async () => {
      try {
        const res = await fetch(`/api/branches?tenantId=${activeTenant.id}`);
        if (res.ok) {
          const data: Branch[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setBranches(data);
            const currentInList = data.find((b) => b.id === activeBranch?.id);
            if (!currentInList) {
              setActiveBranch(data[0]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load branches', e);
      }
    };
    fetchBranches();
  }, [activeTenant.id]);

  // 3. Load full restaurant data for activeTenant and activeBranch
  const reloadRestaurantData = useCallback(async () => {
    if (!activeTenant || !activeBranch) return;

    try {
      const [
        staffRes,
        menuRes,
        tablesRes,
        ordersRes,
        inventoryRes,
        poRes,
        journalsRes,
        shiftsRes,
        summaryRes,
        analyticsRes,
      ] = await Promise.allSettled([
        fetch(`/api/staff?tenantId=${activeTenant.id}`),
        fetch(`/api/menu?tenantId=${activeTenant.id}`),
        fetch(`/api/tables?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        fetch(`/api/orders?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        fetch(`/api/inventory?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        fetch(`/api/purchasing?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        fetch(`/api/accounting/journals?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        fetch(`/api/shifts/active?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        fetch(`/api/accounting/summary?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        fetch(`/api/analytics?tenantId=${activeTenant.id}`),
      ]);

      if (staffRes.status === 'fulfilled' && staffRes.value.ok) {
        const staffData = await staffRes.value.json();
        console.log('Fetched staff:', staffData);
        setStaffUsers(staffData);
      } else {
        console.error('Failed to fetch staff:', staffRes);
      }
      if (menuRes.status === 'fulfilled' && menuRes.value.ok) {
        const menuData = await menuRes.value.json();
        setCategories(menuData.categories || []);
        setProducts(menuData.products || []);
      }
      if (tablesRes.status === 'fulfilled' && tablesRes.value.ok) {
        setTables(await tablesRes.value.json());
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        setOrders(await ordersRes.value.json());
      }
      if (inventoryRes.status === 'fulfilled' && inventoryRes.value.ok) {
        setIngredients(await inventoryRes.value.json());
      }
      if (poRes.status === 'fulfilled' && poRes.value.ok) {
        const poData = await poRes.value.json();
        setSuppliers(poData.suppliers || []);
        setPurchaseOrders(poData.purchaseOrders || []);
      }
      if (journalsRes.status === 'fulfilled' && journalsRes.value.ok) {
        setJournals(await journalsRes.value.json());
      }
      if (shiftsRes.status === 'fulfilled' && shiftsRes.value.ok) {
        setActiveShift(await shiftsRes.value.json());
      }
      if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
        setAccountingSummary(await summaryRes.value.json());
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        setAnalyticsData(await analyticsRes.value.json());
      }
    } catch (err) {
      console.error('Failed loading restaurant state', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant.id, activeBranch.id]);

  useEffect(() => {
    if (activeTenant && activeBranch) {
      reloadRestaurantData();
    }
  }, [activeTenant.id, activeBranch.id, reloadRestaurantData]);

  // Order created handler
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    reloadRestaurantData();
  };

  // Table status updated
  const handleTableStatusChange = (tableId: string, status: any) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
  };

  // KDS bump status
  const handleBumpStatus = async (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'SERVED') => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 86'd product toggle
  const handleToggle86 = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/86`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const kdsCount = orders.filter((o) => o.status === 'NEW' || o.status === 'PREPARING').length;

  if (viewMode === 'LANDING') {
    return (
      <>
        <SaasLandingPage
          onOpenRegister={() => setIsNewTenantModalOpen(true)}
          onOpenTenantLogin={() => setIsTenantLoginModalOpen(true)}
          onOpenProviderLogin={() => setIsProviderLoginModalOpen(true)}
        />
        
        {isTenantLoginModalOpen && (
          <TenantLoginModal
            onClose={() => setIsTenantLoginModalOpen(false)}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setIsTenantLoginModalOpen(false);
              setViewMode('APP');
            }}
          />
        )}
        
        {isProviderLoginModalOpen && (
          <ProviderLoginModal
            onClose={() => setIsProviderLoginModalOpen(false)}
            onLoginSuccess={() => {
              setIsProviderLoginModalOpen(false);
              setViewMode('SAAS_ADMIN');
            }}
          />
        )}

        {isNewTenantModalOpen && (
          <NewTenantModal
            onClose={() => setIsNewTenantModalOpen(false)}
            onTenantCreated={(newTenant) => {
              setTenants((prev) => [...prev, newTenant]);
              setActiveTenant(newTenant);
              setIsNewTenantModalOpen(false);
              fetchTenants();
              setViewMode('APP');
            }}
          />
        )}
      </>
    );
  }

  if (viewMode === 'SAAS_ADMIN') {
    return (
      <>
        <SaasAdminPanel
          tenants={tenants}
          onRefreshTenants={fetchTenants}
          onSelectTenant={(t) => {
            setActiveTenant(t);
            setViewMode('APP');
          }}
          onOpenNewTenantModal={() => setIsNewTenantModalOpen(true)}
          onBackToApp={() => setViewMode('APP')}
        />
        {isNewTenantModalOpen && (
          <NewTenantModal
            onClose={() => setIsNewTenantModalOpen(false)}
            onTenantCreated={(newTenant) => {
              setTenants((prev) => [...prev, newTenant]);
              setActiveTenant(newTenant);
              fetchTenants();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Bar */}
      <Navbar
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={(t) => setActiveTenant(t)}
        branches={branches}
        activeBranch={activeBranch}
        onSelectBranch={(b) => setActiveBranch(b)}
        activeModule={activeModule}
        onSelectModule={(m) => setActiveModule(m)}
        onOpenNewTenantModal={() => setIsNewTenantModalOpen(true)}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        activeShift={activeShift}
        kdsCount={kdsCount}
        currentUser={currentUser}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
      />

      {/* Main View Area based on Active Module */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeModule === 'POS' && (
          <PosCashier
            tenant={activeTenant}
            branch={activeBranch}
            categories={categories}
            products={products}
            tables={tables}
            onOrderCreated={handleOrderCreated}
            onShowReceipt={(order) => setReceiptOrder(order)}
            currentUser={currentUser}
          />
        )}

        {activeModule === 'WAITER' && (
          <WaiterApp
            tenant={activeTenant}
            branch={activeBranch}
            tables={tables}
            products={products}
            categories={categories}
            orders={orders}
            onOrderCreated={handleOrderCreated}
            onTableStatusChange={handleTableStatusChange}
            onOrderUpdated={(updated) => {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
              reloadRestaurantData();
            }}
            currentUser={currentUser}
          />
        )}

        {activeModule === 'KDS' && (
          <KitchenDisplay
            tenant={activeTenant}
            orders={orders}
            onBumpStatus={handleBumpStatus}
            currentUser={currentUser}
          />
        )}

        {activeModule === 'SETUP' && (
          <RestaurantSetupView
            tenant={activeTenant}
            branches={branches}
            products={products}
            currentUser={currentUser}
            onTenantUpdated={(updated) => {
              setActiveTenant(updated);
              setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            }}
            onRefreshAll={reloadRestaurantData}
            onSelectUser={(user) => {
              setCurrentUser(user);
            }}
          />
        )}

        {activeModule === 'FLOOR' && (
          <FloorManagement
            tenant={activeTenant}
            tables={tables}
            orders={orders}
            onSelectTableForOrder={(table) => {
              setActiveModule('POS');
            }}
            onTableStatusChange={handleTableStatusChange}
          />
        )}

        {activeModule === 'QR_ORDER' && (
          <QrSelfOrder
            tenant={activeTenant}
            branch={activeBranch}
            tables={tables}
            products={products}
            categories={categories}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {activeModule === 'MENU_RECIPES' && (
          <MenuAndRecipes
            tenant={activeTenant}
            categories={categories}
            products={products}
            ingredients={ingredients}
            onToggle86={handleToggle86}
            onRefresh={reloadRestaurantData}
          />
        )}

        {activeModule === 'INVENTORY' && (
          <InventoryView
            tenant={activeTenant}
            branch={activeBranch}
            ingredients={ingredients}
            onRefresh={reloadRestaurantData}
          />
        )}

        {activeModule === 'PURCHASING' && (
          <PurchasingView
            tenant={activeTenant}
            branch={activeBranch}
            suppliers={suppliers}
            ingredients={ingredients}
            purchaseOrders={purchaseOrders}
            onRefresh={reloadRestaurantData}
          />
        )}

        {activeModule === 'ACCOUNTING' && (
          <AccountingView
            tenant={activeTenant}
            branch={activeBranch}
            journals={journals}
            summary={accountingSummary}
            orders={orders}
            onRefresh={reloadRestaurantData}
            onViewReceipt={(order) => setReceiptOrder(order)}
          />
        )}

        {activeModule === 'ANALYTICS' && (
          <AnalyticsView
            tenant={activeTenant}
            branches={branches}
            products={products}
            analytics={analyticsData}
          />
        )}
      </main>

      {/* Modals */}
      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          tenant={activeTenant}
          branch={activeBranch}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {isShiftModalOpen && (
        <ShiftDrawerModal
          tenant={activeTenant}
          branch={activeBranch}
          activeShift={activeShift}
          onClose={() => setIsShiftModalOpen(false)}
          onShiftUpdated={reloadRestaurantData}
        />
      )}

      {isNewTenantModalOpen && (
        <NewTenantModal
          onClose={() => setIsNewTenantModalOpen(false)}
          onTenantCreated={(newTenant) => {
            setTenants((prev) => [...prev, newTenant]);
            setActiveTenant(newTenant);
          }}
        />
      )}

      {/* Staff Login / Switch Modal */}
      {(isStaffModalOpen || !currentUser) && (
        <StaffSwitchModal
          staffList={staffUsers}
          currentUser={currentUser}
          onClose={() => setIsStaffModalOpen(false)}
          cancellable={!!currentUser}
          onOpenSaaS={() => setViewMode('LANDING')}
          onSelectUser={(user) => {
            setCurrentUser(user);
            setIsStaffModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
