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

export const DEFAULT_STATIONS: StationConfig[] = [
  { id: 'st-grill', name: 'Grill Station', code: 'GRILL', color: '#f97316', description: 'Burgers, Steaks, Buns & Hot Line' },
  { id: 'st-fryer', name: 'Fryer Station', code: 'FRYER', color: '#eab308', description: 'Loaded Fries, Wings, Crispy Tenders' },
  { id: 'st-cold', name: 'Cold Prep & Salad', code: 'COLD', color: '#10b981', description: 'Fresh Salads, Cold Starters, Pickles' },
  { id: 'st-drinks', name: 'Beverages & Bar', code: 'DRINKS', color: '#06b6d4', description: 'Soft Drinks, Mojitos, Specialty Coffee' },
  { id: 'st-oven', name: 'Oven & Bakery', code: 'OVEN', color: '#a855f7', description: 'Fresh Breads, Molten Cakes, Pizzas' },
];

// In-Memory Multi-Tenant Restaurant Database Store
class RestaurantDatabase {
  public tenants: Tenant[] = [
    {
      id: 'tenant-sultan',
      name: 'Sultan Burger & Smokehouse',
      legalName: 'Sultan Hospitality Group LLC',
      slug: 'sultan-burger',
      country: 'Saudi Arabia',
      currency: 'SAR',
      currencySymbol: '﷼',
      taxRatePct: 15,
      taxName: 'ZATCA VAT 15%',
      serviceChargePct: 0,
      voidPassword: '1234',
      stations: [...DEFAULT_STATIONS],
      phone: '+966 11 456 7890',
      address: 'King Fahd Road, Al Olaya District, Riyadh',
      createdAt: '2025-01-15T08:00:00Z',
    },
    {
      id: 'tenant-zaatar',
      name: 'Zaatar & Olive Bistro',
      legalName: 'Zaatar & Olive F&B LLC',
      slug: 'zaatar-olive',
      country: 'United Arab Emirates',
      currency: 'AED',
      currencySymbol: 'د.إ',
      taxRatePct: 5,
      taxName: 'UAE FTA VAT 5%',
      serviceChargePct: 5,
      voidPassword: '1234',
      stations: [...DEFAULT_STATIONS],
      phone: '+971 4 399 1234',
      address: 'Marina Walk, Dubai Marina, Dubai',
      createdAt: '2025-02-10T09:00:00Z',
    },
  ];

  public staffUsers: StaffUser[] = [
    {
      id: 'staff-sultan-admin',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      name: 'Sultan Al-Otaibi',
      email: 'sultan@sultanburger.sa',
      phone: '+966 50 123 4567',
      role: 'OWNER',
      pinCode: '1111',
      isActive: true,
      createdAt: '2025-01-15T08:00:00Z',
    },
    {
      id: 'staff-sultan-mgr',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      name: 'Layla Al-Khatib',
      email: 'layla.mgr@sultanburger.sa',
      phone: '+966 55 987 6543',
      role: 'MANAGER',
      pinCode: '2222',
      isActive: true,
      createdAt: '2025-01-16T08:00:00Z',
    },
    {
      id: 'staff-sultan-cashier',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      name: 'Ahmad Cashier',
      email: 'ahmad@sultanburger.sa',
      phone: '+966 54 333 4444',
      role: 'CASHIER',
      pinCode: '3333',
      isActive: true,
      createdAt: '2025-01-18T08:00:00Z',
    },
    {
      id: 'staff-sultan-waiter',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      name: 'Tariq Mansoor',
      email: 'tariq@sultanburger.sa',
      phone: '+966 56 555 6666',
      role: 'WAITER',
      pinCode: '4444',
      isActive: true,
      createdAt: '2025-01-19T08:00:00Z',
    },
    {
      id: 'staff-sultan-kitchen',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      name: 'Chef Marco',
      email: 'marco.kitchen@sultanburger.sa',
      phone: '+966 59 777 8888',
      role: 'KITCHEN',
      assignedStation: 'GRILL',
      pinCode: '5555',
      isActive: true,
      createdAt: '2025-01-20T08:00:00Z',
    },
    {
      id: 'staff-sultan-accountant',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      name: 'Fatima Al-Hassan',
      email: 'fatima.fin@sultanburger.sa',
      phone: '+966 53 111 2222',
      role: 'ACCOUNTANT',
      pinCode: '6666',
      isActive: true,
      createdAt: '2025-01-22T08:00:00Z',
    },
    // zaatar staff
    {
      id: 'staff-zaatar-admin',
      tenantId: 'tenant-zaatar',
      branchId: 'branch-dubai',
      name: 'Ziad Al-Nuaimi',
      email: 'ziad@zaatarolive.ae',
      phone: '+971 50 111 2233',
      role: 'OWNER',
      pinCode: '1111',
      isActive: true,
      createdAt: '2025-02-10T09:00:00Z',
    },
    {
      id: 'staff-zaatar-cashier',
      tenantId: 'tenant-zaatar',
      branchId: 'branch-dubai',
      name: 'Rami Cashier',
      email: 'rami@zaatarolive.ae',
      phone: '+971 50 333 4455',
      role: 'CASHIER',
      pinCode: '3333',
      isActive: true,
      createdAt: '2025-02-11T09:00:00Z',
    },
  ];

  public branches: Branch[] = [
    {
      id: 'branch-olaya',
      tenantId: 'tenant-sultan',
      name: 'Riyadh - Al Olaya Flagship',
      code: 'RUH-01',
      city: 'Riyadh',
      address: 'King Fahd Road, Al Olaya District',
      phone: '+966 11 456 7890',
      isActive: true,
    },
    {
      id: 'branch-jeddah',
      tenantId: 'tenant-sultan',
      name: 'Jeddah - Waterfront Corniche',
      code: 'JED-02',
      city: 'Jeddah',
      address: 'Corniche Rd, Ash Shati District',
      phone: '+966 12 654 3210',
      isActive: true,
    },
    {
      id: 'branch-dubai',
      tenantId: 'tenant-zaatar',
      name: 'Dubai - Marina Promenade',
      code: 'DXB-01',
      city: 'Dubai',
      address: 'Marina Walk, Dubai Marina',
      phone: '+971 4 399 1234',
      isActive: true,
    },
  ];

  public categories: Category[] = [
    { id: 'cat-burgers', tenantId: 'tenant-sultan', name: 'Gourmet Burgers', icon: 'Beef', displayOrder: 1 },
    { id: 'cat-combos', tenantId: 'tenant-sultan', name: 'Signature Combos', icon: 'Flame', displayOrder: 2 },
    { id: 'cat-sides', tenantId: 'tenant-sultan', name: 'Loaded Sides', icon: 'Utensils', displayOrder: 3 },
    { id: 'cat-drinks', tenantId: 'tenant-sultan', name: 'Craft Beverages', icon: 'Coffee', displayOrder: 4 },
    { id: 'cat-desserts', tenantId: 'tenant-sultan', name: 'Sweet Desserts', icon: 'Cake', displayOrder: 5 },
  ];

  public ingredients: Ingredient[] = [
    {
      id: 'ing-patty-angus',
      tenantId: 'tenant-sultan',
      name: 'Black Angus Beef Patty (150g)',
      category: 'Meat & Poultry',
      uom: 'pcs',
      minStockThreshold: 50,
      costPerUnit: 8.5,
      currentStock: { 'branch-olaya': 142, 'branch-jeddah': 88 },
    },
    {
      id: 'ing-bun-brioche',
      tenantId: 'tenant-sultan',
      name: 'Golden Brioche Bun',
      category: 'Bakery',
      uom: 'pcs',
      minStockThreshold: 60,
      costPerUnit: 1.8,
      currentStock: { 'branch-olaya': 180, 'branch-jeddah': 120 },
    },
    {
      id: 'ing-truffle-mayo',
      tenantId: 'tenant-sultan',
      name: 'Black Truffle Aioli',
      category: 'Sauces',
      uom: 'ml',
      minStockThreshold: 1000,
      costPerUnit: 0.08,
      currentStock: { 'branch-olaya': 4500, 'branch-jeddah': 2800 },
    },
    {
      id: 'ing-cheddar',
      tenantId: 'tenant-sultan',
      name: 'Aged Cheddar Cheese Slice',
      category: 'Dairy',
      uom: 'pcs',
      minStockThreshold: 80,
      costPerUnit: 1.2,
      currentStock: { 'branch-olaya': 220, 'branch-jeddah': 140 },
    },
    {
      id: 'ing-potatoes',
      tenantId: 'tenant-sultan',
      name: 'Skin-on Russet Fries',
      category: 'Frozen/Produce',
      uom: 'g',
      minStockThreshold: 5000,
      costPerUnit: 0.015,
      currentStock: { 'branch-olaya': 24000, 'branch-jeddah': 15000 },
    },
    {
      id: 'ing-parmesan',
      tenantId: 'tenant-sultan',
      name: 'Shaved Parmigiano-Reggiano',
      category: 'Dairy',
      uom: 'g',
      minStockThreshold: 500,
      costPerUnit: 0.12,
      currentStock: { 'branch-olaya': 1800, 'branch-jeddah': 950 },
    },
    {
      id: 'ing-soda-syrup',
      tenantId: 'tenant-sultan',
      name: 'Fountain Soda Concentrate',
      category: 'Beverages',
      uom: 'ml',
      minStockThreshold: 2000,
      costPerUnit: 0.008,
      currentStock: { 'branch-olaya': 8500, 'branch-jeddah': 6200 },
    },
    {
      id: 'ing-lemon-mint',
      tenantId: 'tenant-sultan',
      name: 'Fresh Mint & Meyer Lemons',
      category: 'Produce',
      uom: 'g',
      minStockThreshold: 600,
      costPerUnit: 0.025,
      currentStock: { 'branch-olaya': 1200, 'branch-jeddah': 750 },
    },
  ];

  public products: Product[] = [
    {
      id: 'prod-truffle-angus',
      tenantId: 'tenant-sultan',
      categoryId: 'cat-burgers',
      name: 'Truffle Angus Burger',
      description: 'Charbroiled 150g Angus beef, aged cheddar, caramelised onions & black truffle aioli in a toasted brioche bun.',
      price: 48,
      costPrice: 13.9,
      isCombo: false,
      is86d: false,
      station: 'GRILL',
      recipe: [
        { ingredientId: 'ing-patty-angus', ingredientName: 'Black Angus Beef Patty (150g)', quantity: 1, uom: 'pcs', unitCost: 8.5 },
        { ingredientId: 'ing-bun-brioche', ingredientName: 'Golden Brioche Bun', quantity: 1, uom: 'pcs', unitCost: 1.8 },
        { ingredientId: 'ing-cheddar', ingredientName: 'Aged Cheddar Cheese Slice', quantity: 1, uom: 'pcs', unitCost: 1.2 },
        { ingredientId: 'ing-truffle-mayo', ingredientName: 'Black Truffle Aioli', quantity: 30, uom: 'ml', unitCost: 0.08 },
      ],
      modifierGroups: [
        {
          id: 'mod-cheese',
          name: 'Cheese Level',
          minSelection: 0,
          maxSelection: 1,
          options: [
            { id: 'opt-double-cheese', name: 'Double Cheddar', priceDelta: 5 },
            { id: 'opt-no-cheese', name: 'No Cheese', priceDelta: 0 },
          ],
        },
        {
          id: 'mod-custom',
          name: 'Special Request',
          minSelection: 0,
          maxSelection: 2,
          options: [
            { id: 'opt-no-onion', name: 'No Caramelized Onions', priceDelta: 0 },
            { id: 'opt-extra-truffle', name: 'Extra Truffle Aioli (+20ml)', priceDelta: 6 },
          ],
        },
      ],
    },
    {
      id: 'prod-brisket-burger',
      tenantId: 'tenant-sultan',
      categoryId: 'cat-burgers',
      name: '14-Hr Smoked Brisket Burger',
      description: 'Slow-smoked prime brisket slices, crunchy pickles, smoky BBQ glaze and melted Monterey Jack.',
      price: 54,
      costPrice: 16.5,
      isCombo: false,
      is86d: false,
      station: 'GRILL',
      recipe: [
        { ingredientId: 'ing-patty-angus', ingredientName: 'Black Angus Beef Patty (150g)', quantity: 1, uom: 'pcs', unitCost: 8.5 },
        { ingredientId: 'ing-bun-brioche', ingredientName: 'Golden Brioche Bun', quantity: 1, uom: 'pcs', unitCost: 1.8 },
        { ingredientId: 'ing-cheddar', ingredientName: 'Aged Cheddar Cheese Slice', quantity: 1, uom: 'pcs', unitCost: 1.2 },
      ],
    },
    {
      id: 'prod-truffle-combo',
      tenantId: 'tenant-sultan',
      categoryId: 'cat-combos',
      name: 'Truffle Master Combo Meal',
      description: 'Truffle Angus Burger served with hot Truffle Parmesan Fries and refillable craft fountain soda.',
      price: 68,
      costPrice: 18.2,
      isCombo: true,
      is86d: false,
      station: 'GRILL',
      recipe: [
        { ingredientId: 'ing-patty-angus', ingredientName: 'Black Angus Beef Patty (150g)', quantity: 1, uom: 'pcs', unitCost: 8.5 },
        { ingredientId: 'ing-bun-brioche', ingredientName: 'Golden Brioche Bun', quantity: 1, uom: 'pcs', unitCost: 1.8 },
        { ingredientId: 'ing-cheddar', ingredientName: 'Aged Cheddar Cheese Slice', quantity: 1, uom: 'pcs', unitCost: 1.2 },
        { ingredientId: 'ing-truffle-mayo', ingredientName: 'Black Truffle Aioli', quantity: 30, uom: 'ml', unitCost: 0.08 },
        { ingredientId: 'ing-potatoes', ingredientName: 'Skin-on Russet Fries', quantity: 180, uom: 'g', unitCost: 0.015 },
        { ingredientId: 'ing-soda-syrup', ingredientName: 'Fountain Soda Concentrate', quantity: 50, uom: 'ml', unitCost: 0.008 },
      ],
    },
    {
      id: 'prod-parm-fries',
      tenantId: 'tenant-sultan',
      categoryId: 'cat-sides',
      name: 'Truffle Parmesan Fries',
      description: 'Crisp golden russet fries tossed in black truffle oil, freshly shaved parmesan & fresh rosemary.',
      price: 24,
      costPrice: 5.6,
      isCombo: false,
      is86d: false,
      station: 'FRYER',
      recipe: [
        { ingredientId: 'ing-potatoes', ingredientName: 'Skin-on Russet Fries', quantity: 220, uom: 'g', unitCost: 0.015 },
        { ingredientId: 'ing-parmesan', ingredientName: 'Shaved Parmigiano-Reggiano', quantity: 20, uom: 'g', unitCost: 0.12 },
      ],
    },
    {
      id: 'prod-lemonade-mint',
      tenantId: 'tenant-sultan',
      categoryId: 'cat-drinks',
      name: 'Fresh Mint Lemonade',
      description: 'Handcrafted crushed Meyer lemons with bruised wild garden mint and pure cane syrup.',
      price: 18,
      costPrice: 3.2,
      isCombo: false,
      is86d: false,
      station: 'DRINKS',
      recipe: [
        { ingredientId: 'ing-lemon-mint', ingredientName: 'Fresh Mint & Meyer Lemons', quantity: 80, uom: 'g', unitCost: 0.025 },
      ],
    },
  ];

  public tables: RestaurantTable[] = [
    { id: 'tbl-1', tenantId: 'tenant-sultan', branchId: 'branch-olaya', number: 'T-01', section: 'MAIN_HALL', capacity: 4, status: 'FREE' },
    { id: 'tbl-2', tenantId: 'tenant-sultan', branchId: 'branch-olaya', number: 'T-02', section: 'MAIN_HALL', capacity: 2, status: 'OCCUPIED', activeOrderId: 'ord-101', assignedWaiter: 'Tariq Mansoor' },
    { id: 'tbl-3', tenantId: 'tenant-sultan', branchId: 'branch-olaya', number: 'T-03', section: 'MAIN_HALL', capacity: 6, status: 'BILL_REQUESTED', activeOrderId: 'ord-102', assignedWaiter: 'Fahad Al-Harbi' },
    { id: 'tbl-4', tenantId: 'tenant-sultan', branchId: 'branch-olaya', number: 'T-04', section: 'MAIN_HALL', capacity: 4, status: 'DIRTY' },
    { id: 'tbl-5', tenantId: 'tenant-sultan', branchId: 'branch-olaya', number: 'P-01', section: 'OUTDOOR_TERRACE', capacity: 4, status: 'FREE' },
    { id: 'tbl-6', tenantId: 'tenant-sultan', branchId: 'branch-olaya', number: 'P-02', section: 'OUTDOOR_TERRACE', capacity: 4, status: 'OCCUPIED', activeOrderId: 'ord-103', assignedWaiter: 'Tariq Mansoor' },
    { id: 'tbl-7', tenantId: 'tenant-sultan', branchId: 'branch-olaya', number: 'VIP-1', section: 'VIP_LOUNGE', capacity: 8, status: 'FREE' },
  ];

  public orders: Order[] = [
    {
      id: 'ord-101',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4081',
      type: 'DINE_IN',
      tableId: 'tbl-2',
      tableName: 'T-02',
      customerName: 'Sultan Al-Otaibi',
      status: 'PREPARING',
      waiterName: 'Tariq Mansoor',
      cashierName: 'Ahmad Cashier',
      subtotal: 96,
      taxAmount: 14.4,
      discountAmount: 0,
      total: 110.4,
      items: [
        {
          id: 'item-1',
          productId: 'prod-truffle-angus',
          productName: 'Truffle Angus Burger',
          quantity: 2,
          unitPrice: 48,
          costPrice: 13.9,
          station: 'GRILL',
          modifiers: [{ groupId: 'mod-cheese', optionId: 'opt-double-cheese', name: 'Double Cheddar', price: 5 }],
          notes: 'Medium well, extra napkins',
          status: 'COOKING',
        },
      ],
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-102',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4080',
      type: 'DINE_IN',
      tableId: 'tbl-3',
      tableName: 'T-03',
      customerName: 'Khalid & Family',
      status: 'READY',
      waiterName: 'Fahad Al-Harbi',
      cashierName: 'Ahmad Cashier',
      subtotal: 116,
      taxAmount: 15.9,
      discountAmount: 10,
      total: 121.9,
      items: [
        {
          id: 'item-2',
          productId: 'prod-truffle-combo',
          productName: 'Truffle Master Combo Meal',
          quantity: 1,
          unitPrice: 68,
          costPrice: 18.2,
          station: 'GRILL',
          modifiers: [],
          status: 'READY',
        },
        {
          id: 'item-3',
          productId: 'prod-parm-fries',
          productName: 'Truffle Parmesan Fries',
          quantity: 2,
          unitPrice: 24,
          costPrice: 5.6,
          station: 'FRYER',
          modifiers: [],
          status: 'READY',
        },
      ],
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-100',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4079',
      type: 'DINE_IN',
      tableId: 'tbl-1',
      tableName: 'T-01',
      customerName: 'Yazeed Al-Rajhi',
      status: 'PAID',
      paymentMethod: 'MADA',
      waiterName: 'Tariq Mansoor',
      cashierName: 'Ahmad Cashier',
      subtotal: 90,
      discountAmount: 10,
      taxAmount: 12,
      total: 92,
      items: [
        {
          id: 'item-100-1',
          productId: 'prod-truffle-angus',
          productName: 'Truffle Angus Burger',
          quantity: 1,
          unitPrice: 48,
          costPrice: 13.9,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-100-2',
          productId: 'prod-lemonade',
          productName: 'Fresh Mint Lemonade',
          quantity: 1,
          unitPrice: 18,
          costPrice: 2.4,
          station: 'DRINKS',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-100-3',
          productId: 'prod-parm-fries',
          productName: 'Truffle Parmesan Fries',
          quantity: 1,
          unitPrice: 24,
          costPrice: 5.6,
          station: 'FRYER',
          modifiers: [],
          status: 'SERVED',
        },
      ],
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-99',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4078',
      type: 'TAKEAWAY',
      customerName: 'Sami Al-Harbi',
      status: 'PAID',
      paymentMethod: 'CASH',
      waiterName: 'Ahmad Cashier',
      cashierName: 'Ahmad Cashier',
      subtotal: 122,
      discountAmount: 0,
      taxAmount: 18.3,
      total: 140.3,
      items: [
        {
          id: 'item-99-1',
          productId: 'prod-smoked-brisket',
          productName: '14-Hr Smoked Brisket Burger',
          quantity: 1,
          unitPrice: 54,
          costPrice: 16.5,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-99-2',
          productId: 'prod-truffle-combo',
          productName: 'Truffle Master Combo Meal',
          quantity: 1,
          unitPrice: 68,
          costPrice: 18.2,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
      ],
      createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-98',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4077',
      type: 'DINE_IN',
      tableId: 'tbl-4',
      tableName: 'T-04',
      customerName: 'Noura Al-Dosari',
      status: 'PAID',
      paymentMethod: 'VISA',
      waiterName: 'Fahad Al-Harbi',
      cashierName: 'Ahmad Cashier',
      subtotal: 192,
      discountAmount: 20,
      taxAmount: 25.8,
      total: 197.8,
      items: [
        {
          id: 'item-98-1',
          productId: 'prod-truffle-angus',
          productName: 'Truffle Angus Burger',
          quantity: 2,
          unitPrice: 48,
          costPrice: 13.9,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-98-2',
          productId: 'prod-truffle-combo',
          productName: 'Truffle Master Combo Meal',
          quantity: 1,
          unitPrice: 68,
          costPrice: 18.2,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-98-3',
          productId: 'prod-water',
          productName: 'San Pellegrino Sparkling Water',
          quantity: 2,
          unitPrice: 14,
          costPrice: 3.0,
          station: 'DRINKS',
          modifiers: [],
          status: 'SERVED',
        },
      ],
      createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-97',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4076',
      type: 'TAKEAWAY',
      customerName: 'Omar Farooq',
      status: 'PAID',
      paymentMethod: 'APPLE_PAY',
      waiterName: 'Ahmad Cashier',
      cashierName: 'Ahmad Cashier',
      subtotal: 128,
      discountAmount: 0,
      taxAmount: 19.2,
      total: 147.2,
      items: [
        {
          id: 'item-97-1',
          productId: 'prod-truffle-angus',
          productName: 'Truffle Angus Burger',
          quantity: 2,
          unitPrice: 48,
          costPrice: 13.9,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-97-2',
          productId: 'prod-molten',
          productName: 'Salted Caramel Molten Cake',
          quantity: 1,
          unitPrice: 32,
          costPrice: 7.8,
          station: 'OVEN',
          modifiers: [],
          status: 'SERVED',
        },
      ],
      createdAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-96',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4075',
      type: 'DINE_IN',
      tableId: 'tbl-5',
      tableName: 'T-05',
      customerName: 'Rakan Al-Ghamdi',
      status: 'PAID',
      paymentMethod: 'CASH',
      waiterName: 'Tariq Mansoor',
      cashierName: 'Ahmad Cashier',
      subtotal: 84,
      discountAmount: 0,
      taxAmount: 12.6,
      total: 96.6,
      items: [
        {
          id: 'item-96-1',
          productId: 'prod-smash-burger',
          productName: 'Double Smash Cheeseburger',
          quantity: 1,
          unitPrice: 42,
          costPrice: 11.4,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-96-2',
          productId: 'prod-parm-fries',
          productName: 'Truffle Parmesan Fries',
          quantity: 1,
          unitPrice: 24,
          costPrice: 5.6,
          station: 'FRYER',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-96-3',
          productId: 'prod-lemonade',
          productName: 'Fresh Mint Lemonade',
          quantity: 1,
          unitPrice: 18,
          costPrice: 2.4,
          station: 'DRINKS',
          modifiers: [],
          status: 'SERVED',
        },
      ],
      createdAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-95',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      orderNumber: '#4074',
      type: 'QR_SELF_ORDER',
      tableId: 'tbl-6',
      tableName: 'T-06',
      customerName: 'Bandar Al-Otaibi',
      status: 'PAID',
      paymentMethod: 'MADA',
      waiterName: 'Tariq Mansoor',
      cashierName: 'Ahmad Cashier',
      subtotal: 150,
      discountAmount: 10,
      taxAmount: 21,
      total: 161,
      items: [
        {
          id: 'item-95-1',
          productId: 'prod-truffle-combo',
          productName: 'Truffle Master Combo Meal',
          quantity: 2,
          unitPrice: 68,
          costPrice: 18.2,
          station: 'GRILL',
          modifiers: [],
          status: 'SERVED',
        },
        {
          id: 'item-95-2',
          productId: 'prod-water',
          productName: 'San Pellegrino Sparkling Water',
          quantity: 1,
          unitPrice: 14,
          costPrice: 3.0,
          station: 'DRINKS',
          modifiers: [],
          status: 'SERVED',
        },
      ],
      createdAt: new Date(Date.now() - 230 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 215 * 60 * 1000).toISOString(),
    },
  ];

  public suppliers: Supplier[] = [
    {
      id: 'sup-almarai',
      tenantId: 'tenant-sultan',
      name: 'Almarai Foodservice & Dairy',
      contactPerson: 'Ziad Nabil',
      phone: '+966 11 234 5678',
      email: 'orders@almarai-b2b.sa',
      category: 'Dairy & Cheese',
    },
    {
      id: 'sup-gourmet-meat',
      tenantId: 'tenant-sultan',
      name: 'Najd Prime Meat Wholesalers',
      contactPerson: 'Bandar Al-Shehri',
      phone: '+966 11 889 0011',
      email: 'sales@najdmeat.com',
      category: 'Halal Beef & Poultry',
    },
    {
      id: 'sup-bakery',
      tenantId: 'tenant-sultan',
      name: 'L’Artisan Artisan Bakery B2B',
      contactPerson: 'Marc Antoine',
      phone: '+966 11 999 4433',
      email: 'buns@lartisan.sa',
      category: 'Buns & Pastries',
    },
  ];

  public purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-1001',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      supplierId: 'sup-gourmet-meat',
      supplierName: 'Najd Prime Meat Wholesalers',
      poNumber: 'PO-2026-081',
      date: '2026-09-05',
      status: 'RECEIVED',
      items: [
        {
          ingredientId: 'ing-patty-angus',
          ingredientName: 'Black Angus Beef Patty (150g)',
          quantity: 100,
          uom: 'pcs',
          unitCost: 8.5,
          total: 850,
        },
      ],
      totalAmount: 850,
      receivedAt: '2026-09-06T14:30:00Z',
    },
  ];

  public journalEntries: JournalEntry[] = [
    {
      id: 'je-init-1',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'INV-4079',
      description: 'POS Sales Receipt #4079 via Mada Card',
      lines: [
        { accountCode: '1020', accountName: 'Mada / Card Bank Clearing', debit: 92.0, credit: 0 },
        { accountCode: '4010', accountName: 'Food & Beverage Revenue', debit: 0, credit: 80.0 },
        { accountCode: '2200', accountName: 'ZATCA Output VAT 15%', debit: 0, credit: 12.0 },
      ],
    },
    {
      id: 'je-cogs-1',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'COGS-4079',
      description: 'Automatic COGS Depletion for #4079',
      lines: [
        { accountCode: '5010', accountName: 'Cost of Goods Sold (BOM Food Cost)', debit: 21.9, credit: 0 },
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: 21.9 },
      ],
    },
    {
      id: 'je-init-2',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'INV-4078',
      description: 'POS Sales Receipt #4078 via Cash',
      lines: [
        { accountCode: '1010', accountName: 'Cash in Register Till', debit: 140.3, credit: 0 },
        { accountCode: '4010', accountName: 'Food & Beverage Revenue', debit: 0, credit: 122.0 },
        { accountCode: '2200', accountName: 'ZATCA Output VAT 15%', debit: 0, credit: 18.3 },
      ],
    },
    {
      id: 'je-cogs-2',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'COGS-4078',
      description: 'Automatic COGS Depletion for #4078',
      lines: [
        { accountCode: '5010', accountName: 'Cost of Goods Sold (BOM Food Cost)', debit: 34.7, credit: 0 },
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: 34.7 },
      ],
    },
    {
      id: 'je-init-3',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'INV-4077',
      description: 'POS Sales Receipt #4077 via Visa Card',
      lines: [
        { accountCode: '1020', accountName: 'Visa Merchant Clearing', debit: 197.8, credit: 0 },
        { accountCode: '4010', accountName: 'Food & Beverage Revenue', debit: 0, credit: 172.0 },
        { accountCode: '2200', accountName: 'ZATCA Output VAT 15%', debit: 0, credit: 25.8 },
      ],
    },
    {
      id: 'je-cogs-3',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'COGS-4077',
      description: 'Automatic COGS Depletion for #4077',
      lines: [
        { accountCode: '5010', accountName: 'Cost of Goods Sold (BOM Food Cost)', debit: 52.0, credit: 0 },
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: 52.0 },
      ],
    },
    {
      id: 'je-init-4',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'INV-4076',
      description: 'POS Sales Receipt #4076 via Apple Pay',
      lines: [
        { accountCode: '1020', accountName: 'Apple Pay Clearing', debit: 147.2, credit: 0 },
        { accountCode: '4010', accountName: 'Food & Beverage Revenue', debit: 0, credit: 128.0 },
        { accountCode: '2200', accountName: 'ZATCA Output VAT 15%', debit: 0, credit: 19.2 },
      ],
    },
    {
      id: 'je-cogs-4',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'COGS-4076',
      description: 'Automatic COGS Depletion for #4076',
      lines: [
        { accountCode: '5010', accountName: 'Cost of Goods Sold (BOM Food Cost)', debit: 35.6, credit: 0 },
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: 35.6 },
      ],
    },
    {
      id: 'je-init-5',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'INV-4075',
      description: 'POS Sales Receipt #4075 via Cash',
      lines: [
        { accountCode: '1010', accountName: 'Cash in Register Till', debit: 96.6, credit: 0 },
        { accountCode: '4010', accountName: 'Food & Beverage Revenue', debit: 0, credit: 84.0 },
        { accountCode: '2200', accountName: 'ZATCA Output VAT 15%', debit: 0, credit: 12.6 },
      ],
    },
    {
      id: 'je-cogs-5',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'COGS-4075',
      description: 'Automatic COGS Depletion for #4075',
      lines: [
        { accountCode: '5010', accountName: 'Cost of Goods Sold (BOM Food Cost)', debit: 19.4, credit: 0 },
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: 19.4 },
      ],
    },
    {
      id: 'je-init-6',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'INV-4074',
      description: 'POS Sales Receipt #4074 via Mada Card',
      lines: [
        { accountCode: '1020', accountName: 'Mada / Card Bank Clearing', debit: 161.0, credit: 0 },
        { accountCode: '4010', accountName: 'Food & Beverage Revenue', debit: 0, credit: 140.0 },
        { accountCode: '2200', accountName: 'ZATCA Output VAT 15%', debit: 0, credit: 21.0 },
      ],
    },
    {
      id: 'je-cogs-6',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      date: '2026-09-07',
      reference: 'COGS-4074',
      description: 'Automatic COGS Depletion for #4074',
      lines: [
        { accountCode: '5010', accountName: 'Cost of Goods Sold (BOM Food Cost)', debit: 39.4, credit: 0 },
        { accountCode: '1100', accountName: 'Raw Ingredient Inventory Asset', debit: 0, credit: 39.4 },
      ],
    },
  ];

  public shifts: Shift[] = [
    {
      id: 'shift-current',
      tenantId: 'tenant-sultan',
      branchId: 'branch-olaya',
      cashierName: 'Ahmad Cashier',
      openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      startingFloat: 500,
      openingFloat: 500,
      cashSalesCollected: 236.9,
      expectedCash: 736.9,
      status: 'OPEN',
      totalSales: 834.9,
      orderCount: 6,
    },
  ];

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

    // If assigned to a table, update table status
    if (newOrder.tableId) {
      const table = this.tables.find((t) => t.id === newOrder.tableId);
      if (table) {
        table.status = 'OCCUPIED';
        table.activeOrderId = newOrder.id;
        table.assignedWaiter = newOrder.waiterName;
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

    // Free table if dine in
    if (order.tableId) {
      const tbl = this.tables.find((t) => t.id === order.tableId);
      if (tbl) {
        tbl.status = 'DIRTY';
        tbl.activeOrderId = undefined;
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
    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      tenantId,
      branchId: data.branchId || this.branches.find((b) => b.tenantId === tenantId)?.id,
      name: data.name?.trim() || 'Staff Member',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      role: data.role || 'WAITER',
      pinCode: data.pinCode?.trim() || '1234',
      assignedStation: data.assignedStation || undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
    };
    this.staffUsers.push(newStaff);
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
      (s) => s.tenantId === tenantId && s.pinCode === pinCode.trim() && s.isActive
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

    return tenant;
  }

  // Create new tenant (SaaS multi-tenant onboarding)
  public createTenant(name: string, country: string, currency: string, taxRatePct: number, branchName: string): Tenant {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tenantId = `tenant-${Date.now()}`;
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
    };
    this.tenants.push(newTenant);

    const branchId = `branch-${Date.now()}`;
    this.branches.push({
      id: branchId,
      tenantId,
      name: branchName,
      code: `${country.slice(0, 3).toUpperCase()}-01`,
      city: 'Capital City',
      address: 'Main Commercial Avenue',
      phone: '+966 50 000 0000',
      isActive: true,
    });

    // Seed default categories and tables for the new tenant
    this.categories.push(
      { id: `cat-${Date.now()}-1`, tenantId, name: 'Main Courses', icon: 'Utensils', displayOrder: 1 },
      { id: `cat-${Date.now()}-2`, tenantId, name: 'Beverages', icon: 'Coffee', displayOrder: 2 }
    );

    for (let i = 1; i <= 6; i++) {
      this.tables.push({
        id: `tbl-${Date.now()}-${i}`,
        tenantId,
        branchId,
        number: `T-${i < 10 ? '0' + i : i}`,
        section: i <= 4 ? 'MAIN_HALL' : 'OUTDOOR_TERRACE',
        capacity: i % 2 === 0 ? 4 : 2,
        status: 'FREE',
      });
    }

    // Seed initial Owner / Manager staff member for this tenant
    this.staffUsers.push({
      id: `staff-${tenantId}-owner`,
      tenantId,
      branchId,
      name: 'Restaurant Admin',
      email: `admin@${slug}.com`,
      phone: '+966 50 000 0001',
      role: 'OWNER',
      pinCode: '1111',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return newTenant;
  }
}

export const db = new RestaurantDatabase();
