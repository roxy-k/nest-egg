export function sanitizeAmount(raw) {
  let v = String(raw).replace(/[^\d.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  v = v.replace(/^0+(?=\d)/, "");
  const [i, d] = v.split(".");
  return d ? `${i}.${d.slice(0, 2)}` : i;
}
