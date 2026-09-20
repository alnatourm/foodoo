export const SEED_DATA = {
  tenants: [
    {
      id: "t-1",
      name: "Sultan Burger & Smokehouse",
      slug: "sultan-burger",
      country: "Saudi Arabia",
      currency: "SAR",
      taxRatePct: 15,
      taxName: "VAT",
      createdAt: new Date().toISOString(),
      subscriptionStatus: "ACTIVE",
      plan: "MULTI_RESTAURANT"
    }
  ],
  branches: [
    {
      id: "b-1",
      tenantId: "t-1",
      name: "Riyadh - Al Olaya Flagship",
      code: "OLAYA-01",
      city: "Riyadh",
      isActive: true
    }
  ],
  categories: [
    {
      id: "c-1",
      tenantId: "t-1",
      name: "Gourmet Burgers",
      icon: "Burger",
      displayOrder: 1
    }
  ],
  products: [
    {
      id: "p-1",
      tenantId: "t-1",
      categoryId: "c-1",
      name: "Truffle Angus Burger",
      description: "200g Wagyu beef, black truffle aioli, aged cheddar, caramelized onions, brioche bun.",
      price: 48.00,
      costPrice: 12.50,
      isCombo: false,
      is86d: false,
      station: "GRILL",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "p-2",
      tenantId: "t-1",
      categoryId: "c-1",
      name: "Smokey BBQ Ribs",
      description: "Slow-smoked beef ribs, honey BBQ glaze, house slaw, pickles.",
      price: 85.00,
      costPrice: 28.00,
      isCombo: false,
      is86d: false,
      station: "GRILL",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
    }
  ],
  staff: [
    {
      id: "s-1",
      tenantId: "t-1",
      name: "Layla Al-Khatib",
      role: "OWNER",
      pinCode: "1234",
      isActive: true
    },
    {
      id: "s-2",
      tenantId: "t-1",
      name: "Ahmed Manager",
      role: "MANAGER",
      pinCode: "0000",
      isActive: true
    }
  ],
  tables: [
    {
      id: "tab-1",
      tenantId: "t-1",
      branchId: "b-1",
      number: "T-01",
      section: "MAIN_HALL",
      capacity: 4,
      status: "FREE"
    }
  ]
};
