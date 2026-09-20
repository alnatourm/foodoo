import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Utensils,
  ToggleLeft,
  ToggleRight,
  Scale,
  X,
  Check,
  Search,
  DollarSign,
  Package,
  Info,
  Flame,
  FolderPlus,
  Layers,
  Coffee,
  Beef,
  Cake,
  AlertTriangle,
} from 'lucide-react';
import { Product, Category, Tenant, Ingredient, RecipeItem, KitchenStation } from '../types/restaurant';

import { useLanguage } from '../i18n/LanguageContext';
import { apiFetch } from '../lib/api';

interface MenuAndRecipesProps {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  ingredients?: (Ingredient & { branchStock?: number; isLowStock?: boolean })[];
  onToggle86: (productId: string) => void;
  onRefresh?: () => void;
}

const STATIONS: { value: KitchenStation; label: string }[] = [
  { value: 'GRILL', label: 'Grill Station' },
  { value: 'FRYER', label: 'Fryer Station' },
  { value: 'COLD', label: 'Cold Prep & Salad' },
  { value: 'DRINKS', label: 'Beverages & Bar' },
  { value: 'OVEN', label: 'Oven & Bakery' },
];

export const MenuAndRecipes: React.FC<MenuAndRecipesProps> = ({
  tenant,
  categories,
  products,
  ingredients = [],
  onToggle86,
  onRefresh,
}) => {
  const { t, isRTL, tCatalog } = useLanguage();
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(products[0] || null);

  // Modal State for Add / Edit Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Category Management Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [newCatOrder, setNewCatOrder] = useState<number>(categories.length + 1);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategorySaving, setIsCategorySaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formStation, setFormStation] = useState<KitchenStation>('GRILL');
  const [formIsCombo, setFormIsCombo] = useState(false);
  const [formRecipe, setFormRecipe] = useState<RecipeItem[]>([]);
  const [formModifierGroups, setFormModifierGroups] = useState<any[]>([]);

  // Ingredient Picker within Recipe BOM
  const [pickerIngredientId, setPickerIngredientId] = useState('');
  const [pickerQty, setPickerQty] = useState<number | string>(1);

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'ALL' || p.categoryId === selectedCat;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Open modal in "Add" mode
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || 'cat-burgers');
    setFormDescription('');
    setFormPrice('');
    setFormStation('GRILL');
    setFormIsCombo(false);
    setFormRecipe([]);
    setFormModifierGroups([]);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open modal in "Edit" mode
  const handleOpenEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFormName(product.name);
    setFormCategoryId(product.categoryId);
    setFormDescription(product.description || '');
    setFormPrice(product.price);
    setFormStation(product.station || 'GRILL');
    setFormIsCombo(product.isCombo || false);
    setFormRecipe(
      (product.recipe || []).map((r) => ({
        ingredientId: r.ingredientId,
        ingredientName: r.ingredientName,
        quantity: r.quantity,
        uom: r.uom,
        unitCost: r.unitCost,
      }))
    );
    setFormModifierGroups(product.modifierGroups ? JSON.parse(JSON.stringify(product.modifierGroups)) : []);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Add ingredient to current recipe
  const handleAddIngredientToRecipe = () => {
    if (!pickerIngredientId) return;
    const ing = ingredients.find((i) => i.id === pickerIngredientId);
    if (!ing) return;

    const qty = Number(pickerQty);
    if (isNaN(qty) || qty <= 0) return;

    // Check if ingredient already exists in recipe
    const existingIndex = formRecipe.findIndex((r) => r.ingredientId === ing.id);
    if (existingIndex >= 0) {
      setFormRecipe((prev) =>
        prev.map((r, i) =>
          i === existingIndex ? { ...r, quantity: Number((r.quantity + qty).toFixed(3)) } : r
        )
      );
    } else {
      setFormRecipe((prev) => [
        ...prev,
        {
          ingredientId: ing.id,
          ingredientName: ing.name,
          quantity: qty,
          uom: ing.uom,
          unitCost: ing.costPerUnit,
        },
      ]);
    }

    setPickerIngredientId('');
    setPickerQty(1);
  };

  // Remove ingredient from recipe
  const handleRemoveIngredientFromRecipe = (index: number) => {
    setFormRecipe((prev) => prev.filter((_, i) => i !== index));
  };

  // Update ingredient quantity in recipe
  const handleUpdateRecipeQty = (index: number, newQty: number) => {
    if (isNaN(newQty) || newQty <= 0) return;
    setFormRecipe((prev) =>
      prev.map((r, i) => (i === index ? { ...r, quantity: newQty } : r))
    );
  };

  // Modifier Group Helpers
  const addModifierGroup = () => {
    setFormModifierGroups([
      ...formModifierGroups,
      { id: `grp-${Date.now()}`, name: '', minSelection: 0, maxSelection: 1, options: [] },
    ]);
  };
  const updateModifierGroup = (index: number, field: string, value: any) => {
    const updated = [...formModifierGroups];
    updated[index] = { ...updated[index], [field]: value };
    setFormModifierGroups(updated);
  };
  const removeModifierGroup = (index: number) => {
    setFormModifierGroups((prev) => prev.filter((_, i) => i !== index));
  };
  const addModifierOption = (groupIndex: number) => {
    const updated = [...formModifierGroups];
    updated[groupIndex].options.push({
      id: `opt-${Date.now()}-${Math.random()}`,
      name: '',
      priceDelta: 0,
    });
    setFormModifierGroups(updated);
  };
  const updateModifierOption = (groupIndex: number, optIndex: number, field: string, value: any) => {
    const updated = [...formModifierGroups];
    updated[groupIndex].options[optIndex] = { ...updated[groupIndex].options[optIndex], [field]: value };
    setFormModifierGroups(updated);
  };
  const removeModifierOption = (groupIndex: number, optIndex: number) => {
    const updated = [...formModifierGroups];
    updated[groupIndex].options = updated[groupIndex].options.filter((_: any, i: number) => i !== optIndex);
    setFormModifierGroups(updated);
  };

  // Computed recipe cost & food cost in modal
  const computedBOMCost = formRecipe.reduce(
    (acc, r) => acc + (r.quantity || 0) * (r.unitCost || 0),
    0
  );
  const parsedPrice = Number(formPrice) || 0;
  const computedProfit = parsedPrice - computedBOMCost;
  const computedFoodCostPct = parsedPrice > 0 ? (computedBOMCost / parsedPrice) * 100 : 0;

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('Please enter a product name.');
      return;
    }
    if (isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      setErrorMessage('Please enter a valid selling price.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      tenantId: tenant.id,
      name: formName.trim(),
      categoryId: formCategoryId,
      description: formDescription.trim(),
      price: Number(Number(formPrice).toFixed(2)),
      costPrice: Number(computedBOMCost.toFixed(2)),
      station: formStation,
      isCombo: formIsCombo,
      recipe: formRecipe,
      modifierGroups: formModifierGroups,
    };

    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const resData = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      setIsModalOpen(false);

      if (onRefresh) {
        onRefresh();
      }

      setInspectingProduct(resData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving product');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (product: Product) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove "${product.name}" from the menu?`
    );
    if (!confirmDelete) return;

    try {
      await apiFetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (onRefresh) onRefresh();
      if (inspectingProduct?.id === product.id) {
        setInspectingProduct(products.find((p) => p.id !== product.id) || null);
      }
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  // --- Category CRUD Handlers ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCategoryError('Category name is required.');
      return;
    }

    setIsCategorySaving(true);
    setCategoryError(null);

    try {
      await apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          name: newCatName.trim(),
          icon: newCatIcon,
          displayOrder: Number(newCatOrder) || categories.length + 1,
        }),
      });

      setNewCatName('');
      setNewCatOrder(categories.length + 2);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setCategoryError(err.message || 'Error creating category');
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleUpdateCategory = async (catId: string) => {
    if (!editingCatName.trim()) {
      setCategoryError('Category name cannot be empty.');
      return;
    }

    setIsCategorySaving(true);
    setCategoryError(null);

    try {
      await apiFetch(`/api/categories/${catId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingCatName.trim() }),
      });

      setEditingCatId(null);
      setEditingCatName('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setCategoryError(err.message || 'Error updating category');
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const count = products.filter((p) => p.categoryId === category.id).length;
    if (count > 0) {
      setCategoryError(
        `Cannot delete "${category.name}" because ${count} menu item(s) are assigned to it. Reassign or delete those items first.`
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete category "${category.name}"?`
    );
    if (!confirmDelete) return;

    try {
      await apiFetch(`/api/categories/${category.id}`, { method: 'DELETE' });

      if (selectedCat === category.id) {
        setSelectedCat('ALL');
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setCategoryError(err.message || 'Failed to delete category');
    }
  };

  return (
    <div id="menu-recipes-view" className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)] overflow-hidden">
      {/* Left: Products Catalog & 86'd Toggle */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-extrabold text-white">{t('menu.title', 'Menu & Recipes (BOM)')}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {products.length} items
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live recipe bill of materials, unit economics, food cost % and out-of-stock (86) controls
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Manage Categories Button */}
            <button
              id="manage-categories-btn"
              onClick={() => {
                setCategoryError(null);
                setNewCatOrder(categories.length + 1);
                setIsCategoryModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 shadow-md transition"
              title="Add or edit menu categories"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>Categories ({categories.length})</span>
            </button>

            {/* Add New Item Button */}
            <button
              id="add-menu-item-btn"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              id="filter-category-all"
              onClick={() => setSelectedCat('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedCat === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <button
                  key={c.id}
                  id={`filter-category-${c.id}`}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedCat === c.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.name} ({count})
                </button>
              );
            })}

            {/* Quick-add category pill */}
            <button
              id="quick-add-category-btn"
              onClick={() => {
                setCategoryError(null);
                setNewCatOrder(categories.length + 1);
                setIsCategoryModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-400 hover:text-amber-300 bg-slate-900 border border-amber-500/30 hover:border-amber-500 transition flex items-center gap-1 whitespace-nowrap"
              title="Add new category"
            >
              <Plus className="w-3 h-3" />
              <span>Category</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="menu-search-input"
              type="text"
              placeholder="Search dishes or recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No menu items match your search or filter.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const margin = product.price - product.costPrice;
              const foodCostPct = product.price > 0 ? (product.costPrice / product.price) * 100 : 0;
              const isSelected = inspectingProduct?.id === product.id;

              return (
                <div
                  key={product.id}
                  id={`product-row-${product.id}`}
                  onClick={() => setInspectingProduct(product)}
                  className={`p-3 rounded-xl border transition flex flex-wrap items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{product.name}</h4>
                      {product.isCombo && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Combo
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {product.station}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {product.description || 'No description provided.'}
                    </p>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {product.recipe?.length || 0} recipe ingredients linked
                    </div>
                  </div>

                  {/* Price, Cost & Margin Metrics */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block font-sans">Selling Price</span>
                      <span className="font-extrabold text-amber-400">
                        {(product.price ?? 0).toFixed(2)} {tenant.currency}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block font-sans">BOM Cost</span>
                      <span className="font-bold text-slate-300">
                        {(product.costPrice ?? 0).toFixed(2)} {tenant.currency}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block font-sans">Food Cost %</span>
                      <span
                        className={`font-bold ${
                          foodCostPct > 35 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {(foodCostPct ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions & 86'd Toggle */}
                  <div
                    className="flex items-center gap-2 border-l border-slate-800 pl-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Edit Button */}
                    <button
                      id={`edit-product-${product.id}`}
                      onClick={() => handleOpenEditModal(product)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Edit Item & Recipe BOM"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      id={`delete-product-${product.id}`}
                      onClick={() => handleDeleteProduct(product)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 86 Toggle */}
                    <div className="flex items-center gap-1 ml-1">
                      <span
                        className={`text-[10px] font-bold ${
                          product.is86d ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {product.is86d ? "86'd" : 'Live'}
                      </span>
                      <button
                        id={`toggle-86-${product.id}`}
                        onClick={() => onToggle86(product.id)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Toggle 86 availability in POS and QR menu"
                      >
                        {product.is86d ? (
                          <ToggleLeft className="w-5 h-5 text-rose-500" />
                        ) : (
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Recipe / BOM Inspector */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {inspectingProduct ? (
          <>
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Recipe & Bill of Materials (BOM)
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {inspectingProduct.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Station: <span className="font-semibold text-slate-200">{inspectingProduct.station}</span>
                </p>
              </div>

              <button
                id="edit-inspecting-btn"
                onClick={() => handleOpenEditModal(inspectingProduct)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit BOM</span>
              </button>
            </div>

            {/* Recipe Ingredients Breakdown */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ingredient Composition ({inspectingProduct.recipe?.length || 0})
                </span>

                {inspectingProduct.recipe && inspectingProduct.recipe.length > 0 ? (
                  inspectingProduct.recipe.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{r.ingredientName}</div>
                        <div className="text-[11px] text-slate-400">
                          Usage: <span className="text-amber-400 font-bold">{r.quantity} {r.uom}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-300 font-mono font-bold">
                          {((r.unitCost ?? 0) * (r.quantity ?? 0)).toFixed(2)} {tenant.currency}
                        </span>
                        <span className="text-[10px] block text-slate-500">
                          @{r.unitCost}/{r.uom}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-slate-500">
                    No recipe ingredients linked yet. Click "Edit BOM" to assign raw materials.
                  </div>
                )}
              </div>

              {/* Financial Unit Economics Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Unit Economics Breakdown
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Selling Price:</span>
                  <span className="font-bold text-white">
                    {(inspectingProduct.price ?? 0).toFixed(2)} {tenant.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Ingredient Cost (BOM):</span>
                  <span className="font-bold text-rose-400">
                    -{(inspectingProduct.costPrice ?? 0).toFixed(2)} {tenant.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Food Cost Ratio:</span>
                  <span className="font-bold text-amber-400">
                    {inspectingProduct.price > 0
                      ? (((inspectingProduct.costPrice ?? 0) / inspectingProduct.price) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-emerald-400 font-bold">
                  <span>Gross Profit Margin:</span>
                  <span>
                    +{((inspectingProduct.price ?? 0) - (inspectingProduct.costPrice ?? 0)).toFixed(2)}{' '}
                    {tenant.currency}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center p-6 text-slate-500 text-xs text-center">
            Select an item from the menu to inspect its Recipe BOM and economics.
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT MENU ITEM & RECIPE BOM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  {editingProductId ? 'Edit Menu Item & Recipe BOM' : 'Add New Menu Item'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {/* 1. Basic Product Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Item Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Item Name *</label>
                  <input
                    id="form-product-name"
                    type="text"
                    required
                    placeholder="e.g., Truffle Angus Burger"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase">Category *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryModalOpen(true);
                        setCategoryError(null);
                      }}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      + New Category
                    </button>
                  </div>
                  <select
                    id="form-product-category"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selling Price (Fixed: step="any" min="0" allows any price without constraint errors) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    Selling Price ({tenant.currency}) *
                  </label>
                  <input
                    id="form-product-price"
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>

                {/* Kitchen Station */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Kitchen Station</label>
                  <select
                    id="form-product-station"
                    value={formStation}
                    onChange={(e) => setFormStation(e.target.value as KitchenStation)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                  >
                    {STATIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description & Combo Flag */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">Description</label>
                <textarea
                  id="form-product-description"
                  rows={2}
                  placeholder="Ingredients highlights, preparation notes, allergen advice..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="form-product-iscombo"
                  type="checkbox"
                  checked={formIsCombo}
                  onChange={(e) => setFormIsCombo(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="form-product-iscombo" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Meal Combo (Includes sides and beverage)
                </label>
              </div>

              {/* 2. Recipe Bill of Materials (BOM) Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Recipe Bill of Materials (BOM)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Raw materials deducted on order payment
                  </span>
                </div>

                {/* Add Ingredient Row - Fixed step="any" min="0" so 1, 2, 0.5, etc. are 100% valid! */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                  <select
                    id="picker-ingredient-select"
                    value={pickerIngredientId}
                    onChange={(e) => setPickerIngredientId(e.target.value)}
                    className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Raw Ingredient --</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.uom}) - {ing.costPerUnit} {tenant?.currency || 'SAR'}/{ing.uom}
                      </option>
                    ))}
                  </select>

                  <div className="w-24 flex items-center gap-1">
                    <input
                      id="picker-ingredient-qty"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Qty"
                      value={pickerQty}
                      onChange={(e) => setPickerQty(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    id="btn-add-ingredient-to-recipe"
                    onClick={handleAddIngredientToRecipe}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to BOM</span>
                  </button>
                </div>

                {/* Recipe Ingredients List - Fixed step="any" min="0" */}
                <div className="space-y-2 pt-2">
                  {formRecipe.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">
                      No raw ingredients assigned to this recipe yet. Select an ingredient above to link it.
                    </p>
                  ) : (
                    formRecipe.map((item, idx) => {
                      const lineCost = (item.quantity || 0) * (item.unitCost || 0);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80"
                        >
                          <div className="flex-1 min-w-[140px]">
                            <span className="font-semibold text-white block text-xs">
                              {item.ingredientName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              @{item.unitCost} {tenant.currency} / {item.uom}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Qty:</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleUpdateRecipeQty(idx, Number(e.target.value))}
                              className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                            <span className="text-[11px] text-slate-400 w-8">{item.uom}</span>
                          </div>

                          <div className="w-20 text-right font-mono font-bold text-slate-200 text-xs">
                            {lineCost.toFixed(2)} {tenant.currency}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientFromRecipe(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Remove ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Real-time Economic Margins Preview */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Total BOM Cost
                    </span>
                    <span className="font-bold text-rose-400 font-mono">
                      {computedBOMCost.toFixed(2)} {tenant.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Gross Profit
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {computedProfit >= 0 ? `+${computedProfit.toFixed(2)}` : computedProfit.toFixed(2)}{' '}
                      {tenant.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Food Cost %
                    </span>
                    <span
                      className={`font-bold font-mono ${
                        computedFoodCostPct > 35 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {computedFoodCostPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Item Modifiers & Options */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-500" />
                      Item Modifiers & Options
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Add customizable options like size, add-ons, or special requests.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addModifierGroup}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Group
                  </button>
                </div>

                {formModifierGroups.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic text-center py-2">
                    No modifiers configured for this item.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formModifierGroups.map((group, gIdx) => (
                      <div key={group.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Group Name *</label>
                              <input
                                type="text"
                                required
                                value={group.name}
                                onChange={(e) => updateModifierGroup(gIdx, 'name', e.target.value)}
                                placeholder="e.g. Cheese Level"
                                className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Min Select</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={group.minSelection}
                                  onChange={(e) => updateModifierGroup(gIdx, 'minSelection', Number(e.target.value))}
                                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Max Select</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={group.maxSelection}
                                  onChange={(e) => updateModifierGroup(gIdx, 'maxSelection', Number(e.target.value))}
                                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeModifierGroup(gIdx)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition border border-slate-800"
                            title="Remove Group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Options */}
                        <div className="pl-2 border-l-2 border-slate-800 space-y-2 mt-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Options</label>
                          {group.options.length > 0 && (
                            <div className="flex items-center gap-2 px-1">
                              <span className="flex-1 text-[10px] text-slate-500 uppercase font-bold">Option Name</span>
                              <span className="w-24 text-[10px] text-slate-500 uppercase font-bold">Extra Price</span>
                              <span className="w-7"></span>
                            </div>
                          )}
                          {group.options.map((opt: any, oIdx: number) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                required
                                value={opt.name}
                                onChange={(e) => updateModifierOption(gIdx, oIdx, 'name', e.target.value)}
                                placeholder="Option Name"
                                className="flex-1 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                              />
                              <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-bold">+</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={opt.priceDelta}
                                  onChange={(e) => updateModifierOption(gIdx, oIdx, 'priceDelta', Number(e.target.value))}
                                  className="w-full pl-5 pr-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeModifierOption(gIdx, oIdx)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addModifierOption(gIdx)}
                            className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-1"
                          >
                            <Plus className="w-3 h-3" /> Add Option
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-menu-item-submit-btn"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : editingProductId ? 'Update Item' : 'Add Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATEGORY MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Menu Categories Management</h3>
                  <p className="text-[11px] text-slate-400">
                    Add new categories, edit names, or manage display order
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs">
              {/* Error Message */}
              {categoryError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{categoryError}</span>
                </div>
              )}

              {/* Form: Add New Category */}
              <form onSubmit={handleCreateCategory} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Create New Category
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Category Name *</label>
                    <input
                      id="new-category-name-input"
                      type="text"
                      required
                      placeholder="e.g., Appetizers, Artisan Pizzas, Desserts..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Display Order</label>
                    <input
                      id="new-category-order-input"
                      type="number"
                      step="1"
                      min="1"
                      value={newCatOrder}
                      onChange={(e) => setNewCatOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    id="submit-new-category-btn"
                    disabled={isCategorySaving}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isCategorySaving ? 'Adding...' : 'Add Category'}</span>
                  </button>
                </div>
              </form>

              {/* List: Existing Categories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Active Categories ({categories.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Live across POS, QR code & Kitchen KDS
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
                  {categories.map((cat) => {
                    const itemCount = products.filter((p) => p.categoryId === cat.id).length;
                    const isEditing = editingCatId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/40 transition"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500 text-white text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCategory(cat.id)}
                              className="p-1 rounded bg-amber-500 text-slate-950 font-bold"
                              title="Save name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{cat.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Rename category"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
