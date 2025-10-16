import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { createI18n } from "../i18n/clientI18n.js";


const SettingsContext = createContext(null);

// defaults
const DEFAULTS = { theme: "light", language: "en", currency: "USD" };

function migrateCurrencySymbolToISO(curr) {
  const map = { "C$": "CAD", "$": "USD", "€": "EUR", "₴": "UAH", "₽": "RUB" };
  return map[curr] || curr;
}

// all currencies from browser (170+) or fallback
const ALL_CURRENCIES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("currency")
    : ["USD", "CAD", "EUR", "GBP", "JPY", "KRW", "UAH", "RUB"];

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useLocalStorage("ne:settings", DEFAULTS);

  useEffect(() => {
    const iso = migrateCurrencySymbolToISO(settings.currency);
    if (iso !== settings.currency) {
      setSettings((s) => ({ ...s, currency: iso }));
    }
  }, [settings.currency, setSettings]);

  useEffect(() => {
    const theme = settings.theme || "light";
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
  }, [settings.theme]);

  const setTheme = useCallback(
    (theme) => setSettings((s) => ({ ...s, theme })),
    [setSettings]
  );
  const setLanguage = useCallback(
    (language) => setSettings((s) => ({ ...s, language })),
    [setSettings]
  );
  const setCurrency = useCallback(
    (currency) => setSettings((s) => ({ ...s, currency })),
    [setSettings]
  );

  const formatCurrency = useCallback(
    (value) =>
      new Intl.NumberFormat(settings.language || "en-US", {
        style: "currency",
        currency: settings.currency || "USD",
        maximumFractionDigits: 2,
      }).format(Number(value) || 0),
    [settings.language, settings.currency]
  );

  const formatDate = useCallback(
    (iso) =>
      new Intl.DateTimeFormat(settings.language || "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(iso)),
    [settings.language]
  );

  // i18n instance + t()
  const i18n = useMemo(() => createI18n(settings.language), [settings.language]);
  const t = useCallback((key, vars) => i18n.t(key, vars), [i18n]);

  const value = useMemo(
    () => ({
      settings,
      setTheme,
      setLanguage,
      setCurrency,
      formatCurrency,
      formatDate,
      allCurrencies: ALL_CURRENCIES,
      t,
      i18nAvailable: i18n.available,
    }),
    [settings, setTheme, setLanguage, setCurrency, formatCurrency, formatDate, i18n, t]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
