// docs/snippets/w5-test-budgets.js
const { expect } = require("chai");

function validateBudget(b) {
  if (!b) throw new Error("invalid");
  const limit = Number(b.limit);
  if (!Number.isFinite(limit) || limit <= 0) throw new Error("limit_positive");
  if (limit < 0.01) throw new Error("limit_min");
  if (!b.categoryId || !b.month) throw new Error("fill_all_fields");
  return true;
}

function monthKey(iso) {
  return iso?.slice(0, 7);
}

function buildSpentMap(transactions) {
  const map = new Map();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = `${t.categoryId}:${monthKey(t.date)}`;
    map.set(key, (map.get(key) || 0) + Number(t.amount || 0));
  }
  return map;
}

describe("Budgets", () => {
  it("rejects non-positive limit", () => {
    expect(() => validateBudget({ categoryId: "food", month: "2025-02", limit: 0 })).to.throw("limit_positive");
  });

  it("rejects too small limit", () => {
    expect(() => validateBudget({ categoryId: "food", month: "2025-02", limit: 0.001 })).to.throw("limit_min");
  });

  it("accepts valid budget", () => {
    expect(validateBudget({ categoryId: "food", month: "2025-02", limit: 150.25 })).to.equal(true);
  });

  it("aggregates expenses by category and month", () => {
    const txs = [
      { categoryId: "food", type: "expense", amount: 20, date: "2025-02-10" },
      { categoryId: "food", type: "expense", amount: 5.5, date: "2025-02-14" },
      { categoryId: "rent", type: "expense", amount: 300, date: "2025-02-01" },
      { categoryId: "salary", type: "income", amount: 1000, date: "2025-02-01" }
    ];
    const m = buildSpentMap(txs);
    expect(m.get("food:2025-02")).to.equal(25.5);
    expect(m.get("rent:2025-02")).to.equal(300);
    expect(m.get("salary:2025-02")).to.equal(undefined);
  });
});
