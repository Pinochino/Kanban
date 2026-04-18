import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Language, messages } from "@/i18n/messages";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const STORAGE_KEY = "kanban:language";

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === "vi" || stored === "en") {
    return stored;
  }

  const browser = navigator.language.toLowerCase();
  return browser.startsWith("vi") ? "vi" : "en";
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (nextLanguage: Language) => {
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
  };

  const t = useMemo(
    () =>
      (key: string) => {
        return messages[language][key] ?? messages.en[key] ?? key;
      },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
