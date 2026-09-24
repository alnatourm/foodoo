import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, catalogTranslations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, fallback?: string) => string;
  tCatalog: (name: string) => string;
  getLocalizedName: (item: { name: string; nameAr?: string } | undefined | null) => string;
  getLocalizedDesc: (item: { description?: string; descriptionAr?: string } | undefined | null) => string;
  formatCurrency: (amount: number | undefined | null, currency?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('restoos_lang');
    return saved === 'ar' || saved === 'en' ? saved : 'ar';
  });

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    localStorage.setItem('restoos_lang', language);
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  // Safe nested key lookup: e.g. "pos.payNow", "common.confirm"
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if missing in target
        let fallbackEn: any = translations.en;
        for (const fKey of keys) {
          if (fallbackEn && typeof fallbackEn === 'object' && fKey in fallbackEn) {
            fallbackEn = fallbackEn[fKey];
          } else {
            fallbackEn = undefined;
            break;
          }
        }
        return typeof fallbackEn === 'string' ? fallbackEn : fallback ?? path;
      }
    }

    return typeof current === 'string' ? current : fallback ?? path;
  };

  // Translates dish, category, ingredient, and station names if in catalog
  const tCatalog = (name: string): string => {
    if (!name) return '';
    const entry = catalogTranslations[name.trim()];
    if (entry) {
      return language === 'ar' ? entry.ar : entry.en;
    }
    return name;
  };

  const getLocalizedName = (item: { name: string; nameAr?: string } | undefined | null): string => {
    if (!item) return '';
    if (language === 'ar') {
      if (item.nameAr && item.nameAr.trim()) return item.nameAr.trim();
      const translated = tCatalog(item.name);
      if (translated && translated !== item.name) return translated;
    }
    return item.name || item.nameAr || '';
  };

  const getLocalizedDesc = (item: { description?: string; descriptionAr?: string } | undefined | null): string => {
    if (!item) return '';
    if (language === 'ar') {
      if (item.descriptionAr && item.descriptionAr.trim()) return item.descriptionAr.trim();
      if (item.description) {
        const translated = tCatalog(item.description);
        if (translated && translated !== item.description) return translated;
      }
    }
    return item.description || item.descriptionAr || '';
  };

  const formatCurrency = (amount: number | undefined | null, currency: string = 'SAR'): string => {
    const val = (amount ?? 0).toFixed(2);
    if (language === 'ar') {
      if (currency === 'SAR') return `${val} ر.س`;
      if (currency === 'AED') return `${val} د.إ`;
      if (currency === 'USD') return `$${val}`;
      return `${val} ${currency}`;
    }
    return `${val} ${currency}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        dir,
        isRTL,
        setLanguage,
        toggleLanguage,
        t,
        tCatalog,
        getLocalizedName,
        getLocalizedDesc,
        formatCurrency,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
