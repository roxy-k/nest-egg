import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth, getToken } from "../context/AuthContext.jsx";

const BudgetsContext = createContext(null);
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function BudgetsProvider({ children }) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);

  async function api(path, options = {}) {
    const { headers, ...rest } = options;
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      ...rest,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  }

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const list = await api("/budgets");
        setBudgets(list);
      } catch (e) {
        console.error("❌ Failed to fetch budgets:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const normalizeBudgetInput = (b = {}) => {
    const m = typeof b.month === "string" ? b.month : "";
    const month = m.includes("-") ? m.slice(0, 7) : m;
    const limit = Number(String(b.limit ?? "").replace(",", "."));
    return {
      categoryId: String(b.categoryId ?? ""),
      month,
      limit,
    };
  };

  const mergeBudget = (saved) => {
    const key = saved._id || saved.id;
    setBudgets((prev) => {
      const exists = prev.some((x) => (x._id || x.id) === key);
      if (exists) {
        return prev.map((x) => ((x._id || x.id) === key ? saved : x));
      }
      return [...prev, saved];
    });
  };

  const mutateBudget = async (path, method, payload) => {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch (err) {
        if (err instanceof Error && err.message) {
          msg = err.message;
        }
      }
      throw new Error(msg);
    }

    const saved = await res.json();
    mergeBudget(saved);
    return saved;
  };

  const addBudget = async (b) => {
    const payload = normalizeBudgetInput(b);
    if (
      !payload.categoryId ||
      !payload.month ||
      !Number.isFinite(payload.limit) ||
      payload.limit < 0.01
    ) {
      throw new Error("Invalid budget payload.");
    }
    try {
      return await mutateBudget("/budgets", "POST", payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/budget already exists/i.test(msg)) {
        const existing = budgets.find(
          (item) => item.categoryId === payload.categoryId && item.month === payload.month
        );
        if (existing) {
          return updateBudget(existing._id || existing.id, payload);
        }
      }
      throw err;
    }
  };

  const updateBudget = async (id, b) => {
    const payload = normalizeBudgetInput(b);
    if (
      !payload.categoryId ||
      !payload.month ||
      !Number.isFinite(payload.limit) ||
      payload.limit < 0.01
    ) {
      throw new Error("Invalid budget payload.");
    }
    const key = String(id || "");
    return mutateBudget(`/budgets/${key}`, "PUT", payload);
  };

  const removeBudget = async (id) => {
    await api(`/budgets/${id}`, { method: "DELETE" });
    setBudgets((prev) => prev.filter((b) => (b._id || b.id) !== id));
  };

  const clearAll = () => setBudgets([]);

  return (
    <BudgetsContext.Provider value={{ budgets, loading, addBudget, updateBudget, removeBudget, clearAll }}>
      {children}
    </BudgetsContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext);
  if (!ctx) throw new Error("useBudgets must be used within BudgetsProvider");
  return ctx;
}
