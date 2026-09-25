import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Package,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Search,
  Plus,
  X,
  Building,
  Download,
  FileSpreadsheet,
  Check,
  Trash2,
  Info,
} from 'lucide-react';
import { Ingredient, Tenant, Branch, Supplier } from '../types/restaurant';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../i18n/LanguageContext';

interface InventoryViewProps {
  tenant: Tenant;
  branch: Branch;
  ingredients: (Ingredient & { branchStock: number; isLowStock: boolean })[];
  suppliers?: Supplier[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  tenant,
  branch,
  ingredients,
  suppliers = [],
  onRefresh,
}) => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [wasteModalIng, setWasteModalIng] = useState<Ingredient | null>(null);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('Expired / Overcooked');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Ingredient Modal State
  const [isAddingIng, setIsAddingIng] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngNameAr, setNewIngNameAr] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('Meat & Poultry');
  const [newIngUom, setNewIngUom] = useState('kg');
  const [newIngCost, setNewIngCost] = useState('15');
  const [newIngMin, setNewIngMin] = useState('5');
  const [newIngStock, setNewIngStock] = useState('50');
  const [newIngSupplierId, setNewIngSupplierId] = useState('');
  const [isSubmittingIng, setIsSubmittingIng] = useState(false);

  // Quick Add Supplier Modal State
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [isSubmittingSup, setIsSubmittingSup] = useState(false);

  // Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRawItems, setParsedRawItems] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // 1. Download Excel Template for Raw Materials
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'اسم المادة الخام (عربي)': 'لحم بلاك أنجوس مفروم',
        'Raw Material Name (English)': 'Black Angus Ground Beef',
        'الفئة / Category': 'Meat & Poultry',
        'وحدة القياس / UOM': 'kg',
        'تكلفة الوحدة / Unit Cost (SAR)': 45.00,
        'حد التنبيه / Min Threshold': 10,
        'الرصيد الابتدائي / Initial Stock': 100,
        'المورد / Supplier': 'شركة اللحوم الوطنية'
      },
      {
        'اسم المادة الخام (عربي)': 'جبنة شيدر معتقة',
        'Raw Material Name (English)': 'Aged Cheddar Cheese Block',
        'الفئة / Category': 'Dairy & Cheese',
        'وحدة القياس / UOM': 'kg',
        'تكلفة الوحدة / Unit Cost (SAR)': 32.50,
        'حد التنبيه / Min Threshold': 5,
        'الرصيد الابتدائي / Initial Stock': 40,
        'المورد / Supplier': 'مؤسسة الألبان الطازجة'
      },
      {
        'اسم المادة الخام (عربي)': 'زيت قالي نباتي نقي',
        'Raw Material Name (English)': 'Pure Frying Vegetable Oil',
        'الفئة / Category': 'Spices & Oils',
        'وحدة القياس / UOM': 'Liter',
        'تكلفة الوحدة / Unit Cost (SAR)': 12.00,
        'حد التنبيه / Min Threshold': 20,
        'الرصيد الابتدائي / Initial Stock': 150,
        'المورد / Supplier': 'المورد المعتمد'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Raw Materials Template');

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 30 },
      { wch: 22 },
      { wch: 18 },
      { wch: 26 },
      { wch: 22 },
      { wch: 24 },
      { wch: 25 }
    ];

    XLSX.writeFile(workbook, 'raw_materials_import_template.xlsx');
  };

  // 2. Parse Excel File for Raw Materials
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
          setImportError(language === 'ar' ? 'الملف فارغ أو لا يحتوي على بيانات أسطر' : 'The selected file is empty.');
          return;
        }

        const parsedItems: any[] = [];

        data.forEach((row, index) => {
          const keys = Object.keys(row);
          const getVal = (keywords: string[]) => {
            const matchedKey = keys.find((k) => keywords.some((kw) => k.toLowerCase().includes(kw)));
            return matchedKey ? String(row[matchedKey]).trim() : '';
          };

          let nameAr = '';
          let nameEn = '';

          keys.forEach((k) => {
            const kLower = k.toLowerCase();
            if (kLower.includes('عربي') || kLower.includes('arabic') || kLower.includes('(ar)')) {
              nameAr = String(row[k] || '').trim();
            } else if (kLower.includes('english') || kLower.includes('إنجليزي') || kLower.includes('raw material name') || kLower.includes('(en)')) {
              nameEn = String(row[k] || '').trim();
            }
          });

          if (!nameAr) nameAr = getVal(['اسم المادة', 'المادة الخام']);
          if (!nameEn) nameEn = getVal(['ingredient', 'raw material']);

          if (nameAr && nameEn && nameAr !== nameEn) {
            if (nameAr.toLowerCase().startsWith(nameEn.toLowerCase())) {
              nameAr = nameAr.substring(nameEn.length).trim();
            } else if (nameAr.toLowerCase().endsWith(nameEn.toLowerCase())) {
              nameAr = nameAr.substring(0, nameAr.length - nameEn.length).trim();
            }
          }

          const categoryRaw = getVal(['الفئة', 'category', 'cat', 'قسم']);
          const uomRaw = getVal(['وحدة القياس', 'وحدة', 'uom', 'unit']);
          const costRaw = getVal(['تكلفة الوحدة', 'تكلفة', 'unit cost', 'cost']);
          const minRaw = getVal(['حد التنبيه', 'الحد الأدنى', 'threshold', 'min']);
          const stockRaw = getVal(['الرصيد الابتدائي', 'الكمية', 'initial stock', 'stock', 'qty']);
          const supRaw = getVal(['المورد', 'supplier', 'sup']);

          const name = nameEn || nameAr;
          if (!name) return;

          let category = 'General Raw Items';
          const catLower = categoryRaw.toLowerCase();
          if (catLower.includes('meat') || catLower.includes('لحم') || catLower.includes('دواجن')) category = 'Meat & Poultry';
          else if (catLower.includes('dairy') || catLower.includes('جبن') || catLower.includes('ألبان')) category = 'Dairy & Cheese';
          else if (catLower.includes('produce') || catLower.includes('خضار') || catLower.includes('فواكه')) category = 'Produce & Vegetables';
          else if (catLower.includes('bakery') || catLower.includes('خبز') || catLower.includes('طحين')) category = 'Bakery & Flour';
          else if (catLower.includes('spice') || catLower.includes('زيت') || catLower.includes('بهار')) category = 'Spices & Oils';
          else if (catLower.includes('beverage') || catLower.includes('مشروب') || catLower.includes('عصير')) category = 'Beverages & Syrups';
          else if (catLower.includes('pack') || catLower.includes('تغليف') || catLower.includes('ورق')) category = 'Packaging & Paper';

          let uom = 'kg';
          const uomLower = uomRaw.toLowerCase().trim();
          if (uomLower === 'g' || uomLower === 'gram' || uomLower === 'grams' || uomLower.includes('جرام') || uomLower.includes('غرام') || uomLower.includes('غم') || uomLower === 'غ') {
            uom = 'g';
          } else if (uomLower === 'kg' || uomLower === 'kilo' || uomLower === 'kilogram' || uomLower.includes('كجم') || uomLower.includes('كيلو')) {
            uom = 'kg';
          } else if (uomLower === 'ml' || uomLower.includes('مل')) {
            uom = 'ml';
          } else if (uomLower === 'liter' || uomLower === 'l' || uomLower.includes('لتر')) {
            uom = 'Liter';
          } else if (uomLower.includes('pc') || uomLower.includes('حبة') || uomLower.includes('قطعة')) {
            uom = 'pcs';
          } else if (uomLower.includes('box') || uomLower.includes('صندوق') || uomLower.includes('كرتون')) {
            uom = 'Box';
          } else if (uomLower.includes('bag') || uomLower.includes('كيس')) {
            uom = 'Bag';
          }

          const cleanCostStr = String(costRaw).replace(/[^0-9\.]/g, '');
          const parsedCost = parseFloat(cleanCostStr);
          const costPerUnit = !isNaN(parsedCost) ? parsedCost : 0;

          parsedItems.push({
            id: `import-ing-${index}`,
            name,
            nameAr: nameAr || undefined,
            category,
            uom,
            costPerUnit,
            minStockThreshold: !isNaN(parseFloat(minRaw)) ? parseFloat(minRaw) : 5,
            initialStock: !isNaN(parseFloat(stockRaw)) ? parseFloat(stockRaw) : 50,
            supplierName: supRaw || undefined,
          });
        });

        if (parsedItems.length === 0) {
          setImportError(language === 'ar' ? 'لم يتم التعرف على مواد خام صالحة في الملف.' : 'No valid raw material rows found in file.');
          return;
        }

        setParsedRawItems(parsedItems);
        setIsImportModalOpen(true);
      } catch (err: any) {
        console.error(err);
        setImportError(language === 'ar' ? 'خطأ أثناء قراءة ملف Excel' : 'Failed to parse Excel file: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 3. Confirm Bulk Import
  const handleConfirmImport = async () => {
    if (parsedRawItems.length === 0) return;
    setIsImporting(true);
    setImportError(null);

    try {
      const response = await apiFetch('/api/inventory/ingredients/bulk', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          items: parsedRawItems,
        }),
      });

      if (response.success) {
        const totalCount =
          (response.createdCount || 0) + (response.updatedCount || 0) ||
          response.ingredients?.length ||
          parsedRawItems.length;

        setImportSuccessMsg(
          language === 'ar'
            ? `تم استيراد وتحديث ${totalCount} مادة خام بنجاح!`
            : `Successfully imported and updated ${totalCount} raw materials!`
        );

        if (onRefresh) onRefresh();

        setTimeout(() => {
          setIsImportModalOpen(false);
          setIsAddingIng(false);
          setImportSuccessMsg(null);
          setParsedRawItems([]);
        }, 1200);
      }
    } catch (err: any) {
      setImportError(err.message || (language === 'ar' ? 'فشل استيراد المواد الخام' : 'Failed to import raw materials'));
    } finally {
      setIsImporting(false);
    }
  };

  const categories = [
    'Meat & Poultry',
    'Dairy & Cheese',
    'Produce & Vegetables',
    'Bakery & Flour',
    'Spices & Oils',
    'Beverages & Syrups',
    'Packaging & Paper',
    'General Raw Items',
  ];

  const uoms = ['kg', 'g', 'Liter', 'ml', 'pcs', 'Box', 'Bag'];

  const getCategoryTranslation = (cat: string) => {
    return t(`inventory.categories.${cat}`, cat);
  };

  const getUomTranslation = (uomVal: string) => {
    return t(`inventory.uoms.${uomVal}`, uomVal);
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;
    setIsSubmittingIng(true);
    try {
      await apiFetch('/api/inventory/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          branchId: branch.id,
          name: newIngName.trim(),
          nameAr: newIngNameAr.trim() || undefined,
          category: newIngCategory,
          uom: newIngUom,
          costPerUnit: Number(newIngCost) || 0,
          minStockThreshold: Number(newIngMin) || 5,
          initialStock: Number(newIngStock) || 50,
          supplierId: newIngSupplierId || undefined,
        }),
      });
      setIsAddingIng(false);
      setNewIngName('');
      setNewIngNameAr('');
      setNewIngSupplierId('');
      onRefresh();
    } catch (err) {
      console.error('Failed to create ingredient', err);
    } finally {
      setIsSubmittingIng(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    setIsSubmittingSup(true);
    try {
      const created = await apiFetch('/api/purchasing/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: tenant.id,
          name: newSupName.trim(),
          contactPerson: newSupContact.trim() || 'Sales Representative',
          phone: newSupPhone.trim() || '+966 50 000 0000',
          email: newSupEmail.trim() || `${newSupName.toLowerCase().replace(/\s+/g, '')}@supplier.com`,
          category: newIngCategory,
        }),
      });
      setIsAddingSupplier(false);
      setNewSupName('');
      setNewSupContact('');
      setNewSupPhone('');
      setNewSupEmail('');
      onRefresh();
      if (created && created.id) {
        setNewIngSupplierId(created.id);
      }
    } catch (e) {
      console.error('Failed to create supplier', e);
    } finally {
      setIsSubmittingSup(false);
    }
  };

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.nameAr && i.nameAr.toLowerCase().includes(search.toLowerCase())) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const [isClearAllIngsOpen, setIsClearAllIngsOpen] = useState(false);
  const [isClearingIngs, setIsClearingIngs] = useState(false);

  const handleClearAllIngredients = async () => {
    setIsClearingIngs(true);
    try {
      await apiFetch(`/api/inventory/ingredients/clear/all?tenantId=${tenant.id}`, { method: 'DELETE' });
      setIsClearAllIngsOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearingIngs(false);
    }
  };

  const handleLogWaste = async () => {
    if (!wasteModalIng || !wasteQty) return;
    setIsSubmitting(true);

    try {
      await apiFetch('/api/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          ingredientId: wasteModalIng.id,
          branchId: branch.id,
          delta: -Math.abs(Number(wasteQty)),
          reason: `waste - ${wasteReason}`,
        }),
      });

      setWasteModalIng(null);
      setWasteQty('');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">
              {t('inventory.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {t('nav.branch', 'Branch')}: <span className="text-white font-semibold">{branch?.name || 'Main Branch'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inventory.searchPlaceholder')}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            id="download-raw-materials-template-btn"
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 shadow-md transition"
            title={language === 'ar' ? 'تحميل نموذج Excel لتعبئة المواد الخام' : 'Download Excel template to fill raw materials'}
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? 'نموذج Excel' : 'Template .xlsx'}</span>
          </button>

          <label
            id="import-raw-materials-btn"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
            title={language === 'ar' ? 'استيراد المواد الخام من ملف Excel' : 'Import raw materials from Excel file'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{language === 'ar' ? 'استيراد من Excel' : 'Import Excel'}</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {ingredients.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearAllIngsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-800/50 shadow-md transition"
              title={language === 'ar' ? 'مسح جميع المواد الخام' : 'Clear all raw materials'}
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>{language === 'ar' ? 'مسح المواد' : 'Clear Raw Materials'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingIng(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{t('inventory.addRawItem')}</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Live Stock"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ingredients Inventory Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">{t('inventory.ingredientCol')}</th>
                <th className="p-3.5">{t('inventory.categoryCol')}</th>
                <th className="p-3.5 text-center">{t('inventory.unitCol')}</th>
                <th className="p-3.5 text-right">{t('inventory.unitCostCol')}</th>
                <th className="p-3.5 text-right">{t('inventory.thresholdCol')}</th>
                <th className="p-3.5 text-right">{t('inventory.stockCol')}</th>
                <th className="p-3.5 text-center">{t('inventory.statusCol')}</th>
                <th className="p-3.5 text-center">{t('common.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((item) => {
                const isLow = item.isLowStock;
                const supplierObj = suppliers.find((s) => s.id === item.supplierId);
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition font-sans">
                    <td className="p-3.5 flex flex-col gap-0.5">
                      <span className="font-bold text-white">
                        {language === 'ar' ? (item.nameAr || item.name) : item.name}
                      </span>
                      {((language === 'ar' && item.nameAr && item.name !== item.nameAr) ||
                        (language !== 'ar' && item.nameAr && item.nameAr !== item.name)) && (
                        <span className="text-[11px] font-semibold text-amber-400 font-sans">
                          {language === 'ar' ? item.name : item.nameAr}
                        </span>
                      )}
                      {supplierObj && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal mt-0.5">
                          <Building className="w-3 h-3 text-amber-400" />
                          {supplierObj.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 font-normal">
                      {getCategoryTranslation(item.category)}
                    </td>
                    <td className="p-3.5 text-center font-mono uppercase font-bold text-slate-400">
                      {getUomTranslation(item.uom)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">
                      {(item.costPerUnit ?? 0).toFixed(2)} {tenant.currency}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400">
                      {item.minStockThreshold} {getUomTranslation(item.uom)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-sm text-white">
                      {item.branchStock} {getUomTranslation(item.uom)}
                    </td>
                    <td className="p-3.5 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          {t('inventory.lowStock')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('inventory.optimal')}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setWasteModalIng(item)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        {t('inventory.logWasteBtn')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Waste & Spoilage Modal */}
      {wasteModalIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{t('inventory.logWasteTitle')}</h3>
                <p className="text-xs text-slate-400">{wasteModalIng.name}</p>
              </div>
              <button onClick={() => setWasteModalIng(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  {t('inventory.qtyToWriteOff')} ({getUomTranslation(wasteModalIng.uom)})
                </label>
                <input
                  type="number"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(e.target.value)}
                  placeholder={`e.g. 5`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('inventory.reasonForLoss')}</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="Expired / Past Shelf Life">{language === 'ar' ? 'منتهي الصلاحية / تالف' : 'Expired / Past Shelf Life'}</option>
                  <option value="Kitchen Overcooking / Burnt">{language === 'ar' ? 'خطأ في الطهي / احتراق' : 'Kitchen Overcooking / Burnt'}</option>
                  <option value="Dropped / Contaminated">{language === 'ar' ? 'سقوط أو تلوث المواد' : 'Dropped / Contaminated'}</option>
                  <option value="Prep Trim Spoilage">{language === 'ar' ? 'هدر تجهيز وقص' : 'Prep Trim Spoilage'}</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                {t('inventory.wasteNotice')}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setWasteModalIng(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                disabled={!wasteQty || isSubmitting}
                onClick={handleLogWaste}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
              >
                {isSubmitting ? t('inventory.logging') : t('inventory.confirmWriteOff')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Raw Ingredient Modal */}
      {isAddingIng && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">{t('inventory.createRawItemTitle')}</h3>
              </div>
              <button onClick={() => setIsAddingIng(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-3.5 text-xs">
              {/* Quick Bulk Import Banner */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {language === 'ar' ? 'أو يمكنك استيراد عدة مواد من Excel:' : 'Or import raw materials from Excel:'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold flex items-center gap-1 transition border border-amber-500/20"
                    title={language === 'ar' ? 'تحميل نموذج Excel للمواد الخام' : 'Download Excel Template'}
                  >
                    <Download className="w-3 h-3" />
                    <span>{language === 'ar' ? 'النموذج' : 'Template'}</span>
                  </button>
                  <label className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow">
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>{language === 'ar' ? 'رفع Excel' : 'Upload'}</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{language === 'ar' ? 'اسم المادة (إنجليزي)' : 'Name (English)'}</label>
                  <input
                    type="text"
                    required
                    value={newIngName}
                    onChange={(e) => setNewIngName(e.target.value)}
                    placeholder={t('inventory.ingredientNamePlaceholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{language === 'ar' ? 'اسم المادة (عربي)' : 'Name (Arabic)'}</label>
                  <input
                    type="text"
                    value={newIngNameAr}
                    onChange={(e) => setNewIngNameAr(e.target.value)}
                    placeholder={language === 'ar' ? 'مثل: حمص حب جاف' : 'e.g. حمص حب جاف'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.categoryLabel')}</label>
                  <select
                    value={newIngCategory}
                    onChange={(e) => setNewIngCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryTranslation(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.uomLabel')}</label>
                  <select
                    value={newIngUom}
                    onChange={(e) => setNewIngUom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    {uoms.map((u) => (
                      <option key={u} value={u}>
                        {getUomTranslation(u)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Supplier Selection + Quick Add Supplier Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">{t('inventory.supplierLabel')}</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingSupplier(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t('inventory.addSupplierBtn')}</span>
                  </button>
                </div>
                <select
                  value={newIngSupplierId}
                  onChange={(e) => setNewIngSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="">{t('inventory.selectSupplierPlaceholder')}</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.unitCostLabel')} ({tenant.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newIngCost}
                    onChange={(e) => setNewIngCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.initialStockLabel')}</label>
                  <input
                    type="number"
                    value={newIngStock}
                    onChange={(e) => setNewIngStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('inventory.minThresholdLabel')}</label>
                  <input
                    type="number"
                    value={newIngMin}
                    onChange={(e) => setNewIngMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingIng(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIng || !newIngName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {isSubmittingIng ? t('inventory.creating') : t('inventory.saveIngredient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Supplier Modal */}
      {isAddingSupplier && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">{t('purchasing.createSupplierTitle')}</h3>
              </div>
              <button onClick={() => setIsAddingSupplier(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.supplierNameLabel')}</label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder={t('purchasing.supplierNamePlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.contactPersonLabel')}</label>
                <input
                  type="text"
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                  placeholder="e.g. Ahmed Al-Otaibi (Sales Rep)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.phoneLabel')}</label>
                  <input
                    type="text"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">{t('purchasing.emailLabel')}</label>
                  <input
                    type="email"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    placeholder="sales@supplier.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingSupplier(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSup || !newSupName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
                >
                  {isSubmittingSup ? t('purchasing.creatingSupplier') : t('purchasing.saveSupplierBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EXCEL IMPORT PREVIEW MODAL FOR RAW MATERIALS */}
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
                    {language === 'ar' ? 'معاينة واستيراد المواد الخام من Excel' : 'Import Raw Materials from Excel'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {importFileName} • {parsedRawItems.length} {language === 'ar' ? 'مادة خام تم التعرف عليها' : 'raw items parsed'}
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
                    {language === 'ar' ? 'إجمالي المواد الخام' : 'Total Raw Items'}
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {parsedRawItems.length}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {language === 'ar' ? 'الفرع المحدد' : 'Target Branch'}
                  </span>
                  <div className="text-sm font-bold text-slate-200 mt-2 truncate">
                    {branch?.name || 'Main Branch'}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {language === 'ar' ? 'حالة الاستيراد' : 'Import Status'}
                  </span>
                  <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ar' ? 'جاهز للحفظ في المخزون' : 'Ready to Commit'}</span>
                  </div>
                </div>
              </div>

              {/* Items Preview Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {language === 'ar' ? 'جدول معاينة المواد الخام' : 'Parsed Raw Materials Preview'}
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">{language === 'ar' ? 'اسم المادة الخام' : 'Raw Material Name'}</th>
                        <th className="p-3">{language === 'ar' ? 'الفئة' : 'Category'}</th>
                        <th className="p-3">{language === 'ar' ? 'الوحدة' : 'UOM'}</th>
                        <th className="p-3">{language === 'ar' ? 'تكلفة الوحدة' : 'Unit Cost'}</th>
                        <th className="p-3">{language === 'ar' ? 'حد التنبيه' : 'Min Threshold'}</th>
                        <th className="p-3">{language === 'ar' ? 'الرصيد الابتدائي' : 'Initial Stock'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-200 font-mono">
                      {parsedRawItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold text-white font-sans">
                            <div>{language === 'ar' ? (item.nameAr || item.name) : item.name}</div>
                            {((language === 'ar' && item.nameAr && item.name !== item.nameAr) ||
                              (language !== 'ar' && item.nameAr && item.nameAr !== item.name)) && (
                              <div className="text-[10px] text-amber-400 font-medium">
                                {language === 'ar' ? item.name : item.nameAr}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-sans">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-300 font-semibold text-[10px]">
                              {getCategoryTranslation(item.category)}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-300 uppercase">{item.uom}</td>
                          <td className="p-3 font-bold text-amber-400">{(item.costPerUnit || 0).toFixed(2)} SAR</td>
                          <td className="p-3 text-slate-400">{item.minStockThreshold}</td>
                          <td className="p-3 font-bold text-emerald-400">{item.initialStock}</td>
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
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || parsedRawItems.length === 0}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition"
              >
                {isImporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>{language === 'ar' ? 'جاري الاستيراد والحفظ...' : 'Importing...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {language === 'ar'
                        ? `تأكيد واستيراد (${parsedRawItems.length} مادة خام)`
                        : `Confirm & Import (${parsedRawItems.length} Raw Items)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CLEAR ALL RAW MATERIALS MODAL */}
      {isClearAllIngsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">
                  {language === 'ar' ? 'تأكيد مسح جميع المواد الخام' : 'Confirm Clear All Raw Materials'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearAllIngsOpen(false)}
                disabled={isClearingIngs}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-200 text-sm">
                {language === 'ar' ? (
                  <>
                    هل أنت متأكد من مسح جميع المواد الخام الحالية (<span className="font-bold text-rose-400">{ingredients.length} مادة</span>) من المخزون؟
                  </>
                ) : (
                  <>
                    Are you sure you want to delete all <span className="font-bold text-rose-400">{ingredients.length} raw materials</span>?
                  </>
                )}
              </p>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  {language === 'ar'
                    ? 'سيؤدي هذا الإجراء إلى مسح كافة المواد الخام الحالية لإعادة رفع ملف المواد الخام الجديد بنقاء ودقة.'
                    : 'This will clear all current raw materials so you can upload a clean raw materials sheet.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearAllIngsOpen(false)}
                disabled={isClearingIngs}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleClearAllIngredients}
                disabled={isClearingIngs}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                {isClearingIngs ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{language === 'ar' ? 'جاري المسح...' : 'Clearing...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'مسح المواد الآن' : 'Clear All Raw Items'}</span>
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
