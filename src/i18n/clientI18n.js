// src/i18n/clientI18n.js
import en from "./translation/en.json";
import fr from "./translation/fr.json";

const DICTS = { en, fr };

// Нормализует коды вроде en-CA → en, FR → fr
function normalizeLang(lang) {
  if (!lang) return "en";
  const base = String(lang).split(/[-_]/)[0].toLowerCase();
  return base === "fr" ? "fr" : "en";
}

export function createI18n(lang = "en") {
  const key = normalizeLang(lang);
  const dict = DICTS[key] || DICTS.en;
  const available = Object.keys(DICTS);

  const t = (fullKey, vars = {}) => {
    // поддержка ключей вида "namespace.key"
    const [ns, k] = fullKey.includes(".")
      ? fullKey.split(".")
      : ["common", fullKey];

    const raw = dict?.[ns]?.[k];
    if (raw == null) return fullKey; // нет перевода — вернуть ключ

    // подстановка переменных вида {limit}, {used} и т.п.
    return String(raw).replace(/\{(\w+)\}/g, (_, v) =>
      Object.prototype.hasOwnProperty.call(vars, v) ? vars[v] : `{${v}}`
    );
  };

  return { t, available };
}
