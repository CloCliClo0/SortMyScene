import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Language, translations } from './translations';

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'sms_lang';

function getInitialLanguage(): Language {
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (fromStorage === 'fr' || fromStorage === 'en') {
    return fromStorage;
  }
  return 'fr';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
  };

  const value = useMemo(() => {
    const t = (key: string) => translations[lang][key] ?? key;
    return { lang, setLang, t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used inside LanguageProvider');
  }
  return context;
}
