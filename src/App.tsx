import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveModule } from './components/Navbar';
import { ChefHat, Store, Plus } from 'lucide-react';
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
import { useAuth } from './context/AuthContext';
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

import { apiFetch } from './lib/api';
import { getRoleDefaultModule, isModuleAllowedForRole } from './lib/rbac';

export default function App() {
  const { user, loading: authLoading, isAdmin, staffProfile } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);

  const [activeModule, setActiveModule] = useState<ActiveModule>('POS');
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  // Domain state
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Emergency Staff Fetch
  useEffect(() => {
    if (!activeTenant) return;
    apiFetch(`/api/staff?tenantId=${activeTenant.id}`)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStaffUsers(data);
        }
      })
      .catch(err => console.error('Emergency staff fetch failed', err));
  }, [activeTenant?.id]);

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
  const [viewMode, setViewModeState] = useState<'APP' | 'LANDING' | 'SAAS_ADMIN'>(() => {
    const saved = localStorage.getItem('foodoo_viewMode');
    if (saved === 'SAAS_ADMIN' || saved === 'APP' || saved === 'LANDING') return saved;
    return 'LANDING';
  });

  const setViewMode = (mode: 'APP' | 'LANDING' | 'SAAS_ADMIN') => {
    localStorage.setItem('foodoo_viewMode', mode);
    setViewModeState(mode);
  };

  // User switch handler with automatic RBAC default landing module redirect
  const handleSelectUser = (user: StaffUser) => {
    setCurrentUser(user);
    const defaultMod = getRoleDefaultModule(user.role);
    setActiveModule(defaultMod);
  };

  // Sync currentUser with staffProfile from auth
  useEffect(() => {
    if (staffProfile) {
      handleSelectUser(staffProfile);
    }
  }, [staffProfile]);

  // Bind activeTenant to currentUser's tenant when logged in as regular staff/owner
  useEffect(() => {
    if (currentUser && tenants.length > 0 && currentUser.role !== 'SUPER_ADMIN') {
      const userTenant = tenants.find((t) => t.id === currentUser.tenantId);
      if (userTenant && activeTenant?.id !== userTenant.id) {
        setActiveTenant(userTenant);
      }
    }
  }, [currentUser, tenants]);

  // Enforce module RBAC permission: if user is not allowed on activeModule, redirect to default module
  useEffect(() => {
    if (currentUser) {
      if (!isModuleAllowedForRole(activeModule, currentUser.role)) {
        setActiveModule(getRoleDefaultModule(currentUser.role));
      }
    }
  }, [currentUser?.role, activeModule]);

  // 1. Fetch Tenants on mount
  const fetchTenants = async () => {
    try {
      const data: Tenant[] = await apiFetch('/api/tenants');
      if (Array.isArray(data)) {
        setTenants(data);
        if (data.length > 0 && !activeTenant) {
          setActiveTenant(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load tenants', e);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [viewMode]);

  // 2. Fetch Branches when activeTenant changes
  useEffect(() => {
    if (!activeTenant) return;
    const fetchBranches = async () => {
      try {
        const data: Branch[] = await apiFetch(`/api/branches?tenantId=${activeTenant.id}`);
        if (Array.isArray(data)) {
          setBranches(data);
          if (data.length > 0) {
            const currentInList = data.find((b) => b.id === activeBranch?.id);
            if (!currentInList) {
              setActiveBranch(data[0]);
            }
          } else {
            setActiveBranch(null);
          }
        }
      } catch (e) {
        console.error('Failed to load branches', e);
      }
    };
    fetchBranches();
  }, [activeTenant?.id]);

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
        apiFetch(`/api/staff?tenantId=${activeTenant.id}`),
        apiFetch(`/api/menu?tenantId=${activeTenant.id}`),
        apiFetch(`/api/tables?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        apiFetch(`/api/orders?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        apiFetch(`/api/inventory?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        apiFetch(`/api/purchasing?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        apiFetch(`/api/accounting/journals?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        apiFetch(`/api/shifts/active?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        apiFetch(`/api/accounting/summary?tenantId=${activeTenant.id}&branchId=${activeBranch.id}`),
        apiFetch(`/api/analytics?tenantId=${activeTenant.id}`),
      ]);

      if (staffRes.status === 'fulfilled') {
        const staffData = staffRes.value;
        console.log('Fetched staff:', staffData);
        setStaffUsers(staffData);
      } else {
        console.error('Failed to fetch staff:', staffRes.reason);
      }
      if (menuRes.status === 'fulfilled') {
        const menuData = menuRes.value;
        setCategories(menuData.categories || []);
        setProducts(menuData.products || []);
      }
      if (tablesRes.status === 'fulfilled') {
        setTables(tablesRes.value);
      }
      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value);
      }
      if (inventoryRes.status === 'fulfilled') {
        setIngredients(inventoryRes.value);
      }
      if (poRes.status === 'fulfilled') {
        const poData = poRes.value;
        setSuppliers(poData.suppliers || []);
        setPurchaseOrders(poData.purchaseOrders || []);
      }
      if (journalsRes.status === 'fulfilled') {
        setJournals(journalsRes.value);
      }
      if (shiftsRes.status === 'fulfilled') {
        setActiveShift(shiftsRes.value);
      }
      if (summaryRes.status === 'fulfilled') {
        setAccountingSummary(summaryRes.value);
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalyticsData(analyticsRes.value);
      }
    } catch (err) {
      console.error('Failed loading restaurant state', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant?.id, activeBranch?.id]);

  useEffect(() => {
    if (activeTenant && activeBranch) {
      reloadRestaurantData();
    }
  }, [activeTenant?.id, activeBranch?.id, reloadRestaurantData]);

  // Order created handler
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    reloadRestaurantData();
  };

  // Table status updated
  const handleTableStatusChange = async (tableId: string, status: any) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
    try {
      await apiFetch(`/api/tables/${tableId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      reloadRestaurantData();
    } catch (err) {
      console.error('Failed to update table status', err);
    }
  };

  // KDS bump status
  const handleBumpStatus = async (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'SERVED') => {
    try {
      const updated = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e) {
      console.error(e);
    }
  };

  // 86'd product toggle
  const handleToggle86 = async (productId: string) => {
    try {
      const updated = await apiFetch(`/api/products/${productId}/86`, {
        method: 'PATCH',
      });
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    } catch (e) {
      console.error(e);
    }
  };

  const kdsCount = orders.filter((o) => o.status === 'NEW' || o.status === 'PREPARING').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 animate-pulse">
          <ChefHat className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-white font-bold tracking-tight">Foodoo POS</h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

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
              handleSelectUser(user);
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

  if (!activeTenant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="p-8 bg-slate-900/90 rounded-3xl border border-slate-800 text-center space-y-4 max-w-md shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">No Active Restaurant Found</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              No restaurant account is currently selected or configured. Please register a new restaurant or open the SaaS Admin Panel to begin.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => setIsNewTenantModalOpen(true)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Restaurant</span>
            </button>
            <button
              onClick={() => setViewMode('SAAS_ADMIN')}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              Open SaaS Admin Panel
            </button>
            <button
              onClick={() => setViewMode('LANDING')}
              className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 font-medium text-xs border border-slate-800 transition"
            >
              Back to Landing Page
            </button>
          </div>
        </div>

        {isNewTenantModalOpen && (
          <NewTenantModal
            onClose={() => setIsNewTenantModalOpen(false)}
            onTenantCreated={(newTenant) => {
              setTenants((prev) => [...prev, newTenant]);
              setActiveTenant(newTenant);
              setIsNewTenantModalOpen(false);
              fetchTenants();
            }}
          />
        )}
      </div>
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
        onGoToLanding={() => setViewMode('LANDING')}
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
            onShowReceipt={(order) => setReceiptOrder(order)}
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
              reloadRestaurantData();
            }}
            onRefreshAll={reloadRestaurantData}
            onSelectUser={(user) => {
              handleSelectUser(user);
            }}
          />
        )}

        {activeModule === 'FLOOR' && (
          <FloorManagement
            tenant={activeTenant}
            branch={activeBranch}
            tables={tables}
            orders={orders}
            currentUser={currentUser}
            onSelectTableForOrder={(table) => {
              setActiveModule('POS');
            }}
            onTableStatusChange={handleTableStatusChange}
            onRefreshTables={reloadRestaurantData}
            onShowReceipt={(order) => setReceiptOrder(order)}
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
            suppliers={suppliers}
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
          currentUser={currentUser}
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
      {(isStaffModalOpen || (viewMode === 'APP' && !currentUser && staffUsers.length > 0)) && (
        <StaffSwitchModal
          staffList={staffUsers}
          currentUser={currentUser}
          onClose={() => setIsStaffModalOpen(false)}
          cancellable={!!currentUser}
          onOpenSaaS={() => setViewMode('LANDING')}
          onSelectUser={(user) => {
            handleSelectUser(user);
            setIsStaffModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
