
const DICTS = import.meta.glob("./translations/*.json", { eager: true });

// "./translations/en.json" -> "en"
const MAP = Object.fromEntries(
  Object.entries(DICTS).map(([path, mod]) => {
    const code = path.split("/").pop().replace(".json", "");
    return [code, mod.default || mod];
  })
);

// safe get by "a.b.c"
function get(obj, path) {
  return String(path)
    .split(".")
    .reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
}

// interpolate {var}
function interpolate(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? vars[k] : `{${k}}`
  );
}

export function createI18n(lang) {
  const norm = String(lang || "en");
  const [base] = norm.split("-"); // fr-CA -> fr

  const exact = MAP[norm];
  const basic = MAP[base];
  const en = MAP["en"];

  function t(path, vars) {
    let v =
      (exact && get(exact, path)) ??
      (basic && get(basic, path)) ??
      (en && get(en, path));
    if (v == null) return path;
    return typeof v === "string" ? interpolate(v, vars) : String(v);
  }

  return {
    t,
    available: Object.keys(MAP),
    has: (code) => !!MAP[code],
  };
}
