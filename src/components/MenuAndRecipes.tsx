import React, { useState } from 'react';
import * as XLSX from 'xlsx';
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
  Download,
  FileSpreadsheet,
  Upload,
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

const STATIONS: { value: KitchenStation; label: string; labelAr: string }[] = [
  { value: 'GRILL', label: 'Grill Station', labelAr: 'محطة الشواء' },
  { value: 'FRYER', label: 'Fryer Station', labelAr: 'محطة القلي' },
  { value: 'COLD', label: 'Cold Prep & Salad', labelAr: 'محطة السلطات والمقبلات' },
  { value: 'DRINKS', label: 'Beverages & Bar', labelAr: 'محطة المشروبات والبار' },
  { value: 'OVEN', label: 'Oven & Bakery', labelAr: 'محطة الفرن والمخبوزات' },
];

export const MenuAndRecipes: React.FC<MenuAndRecipesProps> = ({
  tenant,
  categories,
  products,
  ingredients = [],
  onToggle86,
  onRefresh,
}) => {
  const { language, t, isRTL, tCatalog, getLocalizedName, getLocalizedDesc } = useLanguage();
  const isAr = language === 'ar';
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
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [newCatOrder, setNewCatOrder] = useState<number>(categories.length + 1);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatNameAr, setEditingCatNameAr] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategorySaving, setIsCategorySaving] = useState(false);

  // Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedImportItems, setParsedImportItems] = useState<any[]>([]);
  const [parsedCategoriesToCreate, setParsedCategoriesToCreate] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // 1. Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'اسم الصنف (عربي)': 'برجر أنجوس بالفحم',
        'Item Name (English)': 'Charcoal Angus Burger',
        'القسم / Category': 'Gourmet Burgers',
        'السعر / Price (SAR)': 48.00,
        'التكلفة / Cost Price (SAR)': 14.50,
        'محطة المطبخ / Station': 'GRILL',
        'الوصف (عربي)': 'لحم أنجوس طازج مع جبن شيدر وسوس خاص',
        'Description (English)': 'Fresh Angus beef patty with cheddar cheese & special sauce',
        'رابط الصورة / Image URL': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'
      },
      {
        'اسم الصنف (عربي)': 'بطاطس ودجز بالبهارات',
        'Item Name (English)': 'Spicy Potato Wedges',
        'القسم / Category': 'Sides',
        'السعر / Price (SAR)': 18.00,
        'التكلفة / Cost Price (SAR)': 4.00,
        'محطة المطبخ / Station': 'FRYER',
        'الوصف (عربي)': 'بطاطس مقرمشة متبلة بالأعشاب الحارة',
        'Description (English)': 'Crispy seasoned potato wedges with spicy herbs',
        'رابط الصورة / Image URL': ''
      },
      {
        'اسم الصنف (عربي)': 'موخيتو ليمون ونعناع',
        'Item Name (English)': 'Fresh Lemon Mint Mojito',
        'القسم / Category': 'Beverages',
        'السعر / Price (SAR)': 22.00,
        'التكلفة / Cost Price (SAR)': 3.50,
        'محطة المطبخ / Station': 'DRINKS',
        'الوصف (عربي)': 'عصير ليمون طازج مع النعناع والثلج',
        'Description (English)': 'Fresh lime juice with crushed mint and soda',
        'رابط الصورة / Image URL': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Template');

    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 35 },
      { wch: 45 },
      { wch: 35 }
    ];

    XLSX.writeFile(workbook, 'menu_import_template.xlsx');
  };

  // 2. Parse Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          setImportError(isAr ? 'الملف فارغ أو لا يحتوي على بيانات أسطر' : 'The selected file is empty or has no data rows.');
          return;
        }

        const parsedItems: any[] = [];
        const uniqueCategoriesSet = new Set<string>();

        data.forEach((row, index) => {
          const keys = Object.keys(row);
          const getVal = (keywords: string[]) => {
            const matchedKey = keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
            return matchedKey ? String(row[matchedKey]).trim() : '';
          };

          const nameAr = getVal(['اسم الصنف', 'اسم', 'عربي', 'arabic', 'item name (ar)']);
          const nameEn = getVal(['item name', 'name', 'إنجليزي', 'english', 'product']);
          const catName = getVal(['القسم', 'category', 'cat']);
          const priceRaw = getVal(['السعر', 'price', 'selling price']);
          const costRaw = getVal(['التكلفة', 'cost', 'cost price']);
          const stationRaw = getVal(['محطة', 'station', 'kds']);
          const descAr = getVal(['الوصف (عربي)', 'الوصف', 'desc (ar)', 'arabic desc']);
          const descEn = getVal(['description (english)', 'description', 'desc']);
          const imageRaw = getVal(['رابط الصورة', 'صورة', 'image', 'url', 'photo']);

          const name = nameEn || nameAr;
          const price = parseFloat(priceRaw);

          if (!name || isNaN(price)) {
            return;
          }

          let station: KitchenStation = 'GRILL';
          const stUpper = stationRaw.toUpperCase();
          if (stUpper.includes('FRY') || stUpper.includes('قلي')) station = 'FRYER';
          else if (stUpper.includes('COLD') || stUpper.includes('سلط')) station = 'COLD';
          else if (stUpper.includes('DRINK') || stUpper.includes('مشروب') || stUpper.includes('بار')) station = 'DRINKS';
          else if (stUpper.includes('OVEN') || stUpper.includes('فرن') || stUpper.includes('مخبز')) station = 'OVEN';
          else if (stUpper.includes('GRILL') || stUpper.includes('شواء')) station = 'GRILL';

          const resolvedCategory = catName || (isAr ? 'أطباق رئيسية' : 'Main Dishes');
          uniqueCategoriesSet.add(resolvedCategory);

          parsedItems.push({
            id: `import-${index}`,
            name,
            nameAr: nameAr || undefined,
            categoryName: resolvedCategory,
            price,
            costPrice: !isNaN(parseFloat(costRaw)) ? parseFloat(costRaw) : 0,
            station,
            description: descEn || descAr || '',
            descriptionAr: descAr || undefined,
            image: imageRaw || undefined,
          });
        });

        if (parsedItems.length === 0) {
          setImportError(isAr ? 'لم يتم العثور على أسطر صالحة للاستيراد. يرجى التأكد من اسم الصنف والسعر.' : 'No valid item rows found. Make sure columns contain Item Name and Price.');
          return;
        }

        const categoriesToCreate = Array.from(uniqueCategoriesSet).filter((cName) => {
          const lower = cName.toLowerCase().trim();
          return !categories.some(
            (c) => c.name.toLowerCase().trim() === lower || (c.nameAr && c.nameAr.toLowerCase().trim() === lower)
          );
        }).map((cName) => ({
          name: cName,
          nameAr: cName,
          icon: 'Utensils',
        }));

        setParsedImportItems(parsedItems);
        setParsedCategoriesToCreate(categoriesToCreate);
        setIsImportModalOpen(true);
      } catch (err: any) {
        console.error(err);
        setImportError(isAr ? 'خطأ في قراءة ملف Excel' : 'Failed to read Excel file: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 3. Submit Bulk Import
  const handleConfirmImport = async () => {
    if (parsedImportItems.length === 0) return;
    setIsImporting(true);
    setImportError(null);

    try {
      const response = await apiFetch('/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          categories: parsedCategoriesToCreate,
          items: parsedImportItems,
        }),
      });

      if (response.success) {
        setImportSuccessMsg(
          isAr
            ? `تم استيراد ${response.createdProductsCount} صنفاً و ${response.createdCategoriesCount} قسماً جديداً بنجاح!`
            : `Successfully imported ${response.createdProductsCount} items and ${response.createdCategoriesCount} new categories!`
        );
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportSuccessMsg(null);
          setParsedImportItems([]);
          setParsedCategoriesToCreate([]);
          if (onRefresh) onRefresh();
        }, 1500);
      }
    } catch (err: any) {
      setImportError(err.message || (isAr ? 'فشل استيراد قائمة الطعام' : 'Failed to import menu items'));
    } finally {
      setIsImporting(false);
    }
  };

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDescriptionAr, setFormDescriptionAr] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formImage, setFormImage] = useState('');
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
    const locName = getLocalizedName(p).toLowerCase();
    const locDesc = getLocalizedDesc(p).toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.nameAr && p.nameAr.toLowerCase().includes(query)) ||
      locName.includes(query) ||
      locDesc.includes(query);
    return matchesCat && matchesSearch;
  });

  // Open modal in "Add" mode
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormName('');
    setFormNameAr('');
    setFormCategoryId(categories[0]?.id || 'cat-burgers');
    setFormDescription('');
    setFormDescriptionAr('');
    setFormPrice('');
    setFormImage('');
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
    setFormNameAr(product.nameAr || '');
    setFormCategoryId(product.categoryId);
    setFormDescription(product.description || '');
    setFormDescriptionAr(product.descriptionAr || '');
    setFormPrice(product.price);
    setFormImage(product.image || '');
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
      nameAr: formNameAr.trim() || undefined,
      categoryId: formCategoryId,
      description: formDescription.trim(),
      descriptionAr: formDescriptionAr.trim() || undefined,
      price: Number(Number(formPrice).toFixed(2)),
      costPrice: Number(computedBOMCost.toFixed(2)),
      station: formStation,
      image: formImage.trim() || undefined,
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

  // Delete Confirmation State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'product' | 'category';
    id: string;
    name: string;
    nameAr?: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  // Delete product initiator
  const handleDeleteProduct = (product: Product) => {
    setDeleteModalError(null);
    setDeleteConfirmTarget({
      type: 'product',
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
    });
  };

  // Delete category initiator
  const handleDeleteCategory = (category: Category) => {
    setDeleteModalError(null);
    const count = products.filter((p) => p.categoryId === category.id).length;
    if (count > 0) {
      setCategoryError(
        isAr
          ? `لا يمكن حذف قسم "${category.nameAr || category.name}" لأنه يحتوي على ${count} أصناف. يرجى نقل الأصناف أو حذفها أولاً.`
          : `Cannot delete "${category.name}" because ${count} menu item(s) are assigned to it. Reassign or delete those items first.`
      );
      return;
    }

    setDeleteConfirmTarget({
      type: 'category',
      id: category.id,
      name: category.name,
      nameAr: category.nameAr,
    });
  };

  // Execute deletion via API
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeletingItem(true);
    setDeleteModalError(null);

    try {
      if (deleteConfirmTarget.type === 'product') {
        const prodId = deleteConfirmTarget.id;
        await apiFetch(`/api/products/${prodId}`, { method: 'DELETE' });
        if (inspectingProduct?.id === prodId) {
          setInspectingProduct(products.find((p) => p.id !== prodId) || null);
        }
      } else if (deleteConfirmTarget.type === 'category') {
        const catId = deleteConfirmTarget.id;
        await apiFetch(`/api/categories/${catId}`, { method: 'DELETE' });
        if (selectedCat === catId) {
          setSelectedCat('ALL');
        }
      }

      setDeleteConfirmTarget(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to delete item', err);
      setDeleteModalError(err.message || (isAr ? 'فشل إجراء عملية الحذف' : 'Failed to delete item'));
    } finally {
      setIsDeletingItem(false);
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
          nameAr: newCatNameAr.trim() || undefined,
          icon: newCatIcon,
          displayOrder: Number(newCatOrder) || categories.length + 1,
        }),
      });

      setNewCatName('');
      setNewCatNameAr('');
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
        body: JSON.stringify({
          name: editingCatName.trim(),
          nameAr: editingCatNameAr.trim() || undefined,
        }),
      });

      setEditingCatId(null);
      setEditingCatName('');
      setEditingCatNameAr('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setCategoryError(err.message || 'Error updating category');
    } finally {
      setIsCategorySaving(false);
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
                {products.length} {isAr ? 'أصناف' : 'items'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'قائمة الوصفات الحية، تكلفة الوجبات (BOM)، نسبة تكلفة الأغذية، والتحكم بالنفاد (86)' : 'Live recipe bill of materials, unit economics, food cost % and out-of-stock (86) controls'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Excel Template Button */}
            <button
              id="download-excel-template-btn"
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 shadow-md transition"
              title={isAr ? 'تحميل نموذج Excel جاهز لتعبئة الأصناف' : 'Download Excel template to fill menu items'}
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تحميل نموذج Excel' : 'Template .xlsx'}</span>
            </button>

            {/* Import Excel File Button */}
            <label
              id="import-excel-file-btn"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
              title={isAr ? 'استيراد قائمة الطعام من ملف Excel' : 'Import menu items from Excel file'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'استيراد من Excel' : 'Import Excel'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Manage Categories Button */}
            <button
              id="manage-categories-btn"
              onClick={() => {
                setCategoryError(null);
                setNewCatOrder(categories.length + 1);
                setIsCategoryModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 shadow-md transition"
              title={isAr ? 'إضافة أو تعديل أقسام قائمة الطعام' : 'Add or edit menu categories'}
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>{isAr ? `الأقسام (${categories.length})` : `Categories (${categories.length})`}</span>
            </button>

            {/* Add New Item Button */}
            <button
              id="add-menu-item-btn"
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة صنف جديد' : 'Add Menu Item'}</span>
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
              {isAr ? `الكل (${products.length})` : `All (${products.length})`}
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
                  {getLocalizedName(c)} ({count})
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
              title={isAr ? 'إضافة قسم جديد' : 'Add new category'}
            >
              <Plus className="w-3 h-3" />
              <span>{isAr ? 'قسم جديد' : 'Category'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="menu-search-input"
              type="text"
              placeholder={isAr ? 'ابحث عن صنف أو وصفة...' : 'Search dishes or recipes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ltr:pl-8 ltr:pr-3 rtl:pr-8 rtl:pl-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              const bomCost = product.recipe && product.recipe.length > 0
                ? product.recipe.reduce((acc, r) => acc + (r.quantity || 0) * (r.unitCost || 0), 0)
                : 0;
              const margin = product.price - bomCost;
              const foodCostPct = product.price > 0 ? (bomCost / product.price) * 100 : 0;
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">{getLocalizedName(product)}</h4>
                      {(product.nameAr || tCatalog(product.name) !== product.name) && (
                        <span className="text-[10px] text-amber-400/80 font-medium dir-ltr">
                          ({isRTL ? product.name : (product.nameAr || tCatalog(product.name))})
                        </span>
                      )}
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
                      {getLocalizedDesc(product) || 'No description provided.'}
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
                        {bomCost.toFixed(2)} {tenant.currency}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block font-sans">Food Cost %</span>
                      <span
                        className={`font-bold ${
                          foodCostPct > 35 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {foodCostPct.toFixed(1)}%
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
                  {isAr ? 'الوصفة وتكلفة المكونات (BOM)' : 'Recipe & Bill of Materials (BOM)'}
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {getLocalizedName(inspectingProduct)}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'المحطة:' : 'Station:'} <span className="font-semibold text-slate-200">
                    {STATIONS.find((s) => s.value === inspectingProduct.station)?.[isAr ? 'labelAr' : 'label'] || inspectingProduct.station}
                  </span>
                </p>
              </div>

              <button
                id="edit-inspecting-btn"
                onClick={() => handleOpenEditModal(inspectingProduct)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تعديل الوصفة' : 'Edit BOM'}</span>
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
              {(() => {
                const insBOMCost = inspectingProduct.recipe && inspectingProduct.recipe.length > 0
                  ? inspectingProduct.recipe.reduce((acc, r) => acc + (r.quantity || 0) * (r.unitCost || 0), 0)
                  : 0;
                const insFoodCostPct = inspectingProduct.price > 0 ? (insBOMCost / inspectingProduct.price) * 100 : 0;
                const insMargin = (inspectingProduct.price ?? 0) - insBOMCost;

                return (
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
                        -{insBOMCost.toFixed(2)} {tenant.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Food Cost Ratio:</span>
                      <span className="font-bold text-amber-400">
                        {insFoodCostPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-emerald-400 font-bold">
                      <span>Gross Profit Margin:</span>
                      <span>
                        +{insMargin.toFixed(2)} {tenant.currency}
                      </span>
                    </div>
                  </div>
                );
              })()}
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
                {/* Item Name (English) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Item Name (English) *</label>
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

                {/* Item Name (Arabic) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">اسم الصنف (بالعربية)</label>
                  <input
                    id="form-product-name-ar"
                    type="text"
                    dir="rtl"
                    placeholder="مثال: برجر الأنجوس بالتروفل"
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
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
                        {getLocalizedName(c)} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selling Price */}
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
                <div className="space-y-1 sm:col-span-2">
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

              {/* Description & Arabic Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Description (English)</label>
                  <textarea
                    id="form-product-description"
                    rows={2}
                    placeholder="Ingredients highlights, preparation notes..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">الوصف (بالعربية)</label>
                  <textarea
                    id="form-product-description-ar"
                    rows={2}
                    dir="rtl"
                    placeholder="وصف المكونات والنكهات باللغة العربية..."
                    value={formDescriptionAr}
                    onChange={(e) => setFormDescriptionAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Product Image URL Field */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <span>Product Image URL</span>
                    <span className="text-[10px] text-amber-400 font-normal">(Used in POS grid & QR menu)</span>
                  </label>
                  {formImage && (
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  {/* Thumbnail Preview Box */}
                  <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center text-slate-600">
                    {formImage ? (
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Utensils className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      id="form-product-image"
                      type="url"
                      placeholder="https://images.unsplash.com/... (Direct Image Link)"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                    />

                    {/* Quick Preset Images */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                      <span className="text-slate-500">Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => setFormImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold"
                      >
                        Burger
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold"
                      >
                        Ribs / Steak
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage('https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&q=80&w=800')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold"
                      >
                        Chicken
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage('https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold"
                      >
                        Drink / Mojito
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage('https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800')}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold"
                      >
                        Iced Latte
                      </button>
                    </div>
                  </div>
                </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Category Name (English) *</label>
                    <input
                      id="new-category-name-input"
                      type="text"
                      required
                      placeholder="e.g., Appetizers, Artisan Pizzas..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">اسم التصنيف (بالعربية)</label>
                    <input
                      id="new-category-name-ar-input"
                      type="text"
                      dir="rtl"
                      placeholder="مثال: مقبلات، بيتزا..."
                      value={newCatNameAr}
                      onChange={(e) => setNewCatNameAr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
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
                          <div className="flex-1 flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder="English"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 min-w-[120px] px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500 text-white text-xs focus:outline-none"
                              autoFocus
                            />
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="العربية"
                              value={editingCatNameAr}
                              onChange={(e) => setEditingCatNameAr(e.target.value)}
                              className="flex-1 min-w-[120px] px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500 text-white text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCategory(cat.id)}
                              className="p-1 rounded bg-amber-500 text-slate-950 font-bold"
                              title="Save category"
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
                          <div className="flex-1 flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">{getLocalizedName(cat)}</span>
                            {(cat.nameAr || tCatalog(cat.name) !== cat.name) && (
                              <span className="text-[10px] text-amber-400/80 font-medium dir-ltr">
                                ({isRTL ? cat.name : (cat.nameAr || tCatalog(cat.name))})
                              </span>
                            )}
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
                                setEditingCatNameAr(cat.nameAr || '');
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

      {/* EXCEL IMPORT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {isAr ? 'معاينة واستيراد قائمة الطعام من Excel' : 'Import Menu Items from Excel'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {importFileName} • {parsedImportItems.length} {isAr ? 'صنف تم التعرف عليه' : 'items parsed'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {importError && (
                <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMsg && (
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
                  <Check className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span className="font-bold">{importSuccessMsg}</span>
                </div>
              )}

              {/* Import Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isAr ? 'إجمالي الأصناف' : 'Total Items'}
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {parsedImportItems.length}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isAr ? 'أقسام جديدة ستُنشأ' : 'New Categories'}
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {parsedCategoriesToCreate.length}
                  </div>
                  {parsedCategoriesToCreate.length > 0 && (
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {parsedCategoriesToCreate.map((c) => c.name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isAr ? 'حالة الاستيراد' : 'Import Status'}
                  </span>
                  <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'جاهز للحفظ في النظام' : 'Ready to Commit'}</span>
                  </div>
                </div>
              </div>

              {/* Items Preview Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {isAr ? 'جدول معاينة الأصناف' : 'Parsed Items Preview'}
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                        <th className="p-3">{isAr ? 'القسم' : 'Category'}</th>
                        <th className="p-3">{isAr ? 'السعر' : 'Price'}</th>
                        <th className="p-3">{isAr ? 'التكلفة' : 'Cost'}</th>
                        <th className="p-3">{isAr ? 'المحطة' : 'Station'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-200">
                      {parsedImportItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold text-white">
                            <div>{item.name}</div>
                            {item.nameAr && item.nameAr !== item.name && (
                              <div className="text-[10px] text-amber-400/80">{item.nameAr}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-300 font-semibold text-[10px]">
                              {item.categoryName}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-amber-400">{item.price.toFixed(2)} SAR</td>
                          <td className="p-3 font-medium text-slate-400">{(item.costPrice || 0).toFixed(2)} SAR</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">
                              {item.station}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || parsedImportItems.length === 0}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition"
              >
                {isImporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>{isAr ? 'جاري الاستيراد والحفظ...' : 'Importing...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isAr ? `تأكيد واستيراد (${parsedImportItems.length} صنف)` : `Confirm & Import (${parsedImportItems.length} Items)`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">
                  {isAr ? 'تأكيد الحذف النهائي' : 'Confirm Permanent Deletion'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeletingItem}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteModalError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {deleteModalError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-slate-200 text-sm">
                {deleteConfirmTarget.type === 'product' ? (
                  isAr ? (
                    <>
                      هل أنت متاكد من حذف الصنف <span className="font-bold text-amber-400">"{deleteConfirmTarget.nameAr || deleteConfirmTarget.name}"</span> من قائمة الطعام؟
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete menu item <span className="font-bold text-amber-400">"{deleteConfirmTarget.name}"</span>?
                    </>
                  )
                ) : (
                  isAr ? (
                    <>
                      هل أنت متاكد من حذف قسم <span className="font-bold text-amber-400">"{deleteConfirmTarget.nameAr || deleteConfirmTarget.name}"</span>؟
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete category <span className="font-bold text-amber-400">"{deleteConfirmTarget.name}"</span>?
                    </>
                  )
                )}
              </p>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  {isAr
                    ? 'تحذير: سيتم حذف هذا العنصر نهائياً من قاعدة البيانات ولا يمكن التراجع عن هذه الخطوة.'
                    : 'Warning: This item will be permanently removed from the system. This action cannot be undone.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeletingItem}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeletingItem}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                {isDeletingItem ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{isAr ? 'جاري الحذف...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{isAr ? 'حذف نهائي' : 'Delete Permanently'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
