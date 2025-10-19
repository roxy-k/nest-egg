import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

export default function SettingsProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("light");
  const [currency, setCurrency] = useState("USD");

  const dictionaries = useMemo(
    () => ({
      en: { "app.title": "NestEgg", "settings.language": "Language" },
      fr: { "app.title": "NestEgg", "settings.language": "Langue" }
    }),
    []
  );

  const t = (key) => dictionaries[language]?.[key] ?? key;

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const value = {
    settings: { language, theme, currency },
    setLanguage,
    setTheme,
    setCurrency,
    t
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
