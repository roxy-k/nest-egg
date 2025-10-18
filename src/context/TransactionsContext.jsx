import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth, getToken } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";

const TransactionsContext = createContext(null);
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function TransactionsProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
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
      setTransactions([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const list = await api("/transactions");
        setTransactions(list);
      } catch (e) {
        console.error("❌ Failed to fetch transactions:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const addTransaction = async (tx) => {
    const saved = await api("/transactions", { method: "POST", body: JSON.stringify(tx) });
    setTransactions((prev) => [saved, ...prev]);
  };

  const removeTransaction = async (id) => {
    await api(`/transactions/${id}`, { method: "DELETE" });
setTransactions(prev => prev.filter(t => (t._id || t.id) !== id));
  };

  const updateTransaction = async (id, tx) => {
    const saved = await api(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(tx),
    });
setTransactions(prev => prev.map(t => ((t._id || t.id) === id ? saved : t)));
  };

  const { categories } = useCategories();
const findCategoryIdByName = (name) => {
  if (!name) return "";
  const n = String(name).trim().toLowerCase();
  const hit = categories.find(c => (c.name||"").trim().toLowerCase() === n);
  return hit ? (hit._id || hit.id) : "";
};
const importTransactions = async (rows) => {
  for (const r of rows) {
    const tx = {
      date: r.Date || r["Date"],
      categoryId: findCategoryIdByName(r.Category),
      type: r.Type.toLowerCase(),
      amount: Number(r.Amount || 0),
    };
    await addTransaction(tx);
  }
};

  const clearAll = () => setTransactions([]);

  return (
    <TransactionsContext.Provider
      value={{ transactions, importTransactions, loading, addTransaction, removeTransaction, updateTransaction, clearAll }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
