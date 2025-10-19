const monthKey = (iso) => iso?.slice(0, 7); // "YYYY-MM"

export function buildSpentMap(transactions) {
  const map = new Map();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = `${t.categoryId}:${monthKey(t.date)}`;
    map.set(key, (map.get(key) || 0) + Number(t.amount || 0));
  }
  return map;
}
