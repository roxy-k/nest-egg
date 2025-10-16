import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const CategoriesContext = createContext(null);
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function CategoriesProvider({ children }) {
  const { user, refresh } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const api = useCallback(async (path, options = {}, attempt = 0) => {
    const { headers, ...rest } = options;
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      ...rest,
    });
    if (!res.ok) {
      if (res.status === 401 && attempt === 0) {
        const info = await refresh({ silent: true }).catch(() => null);
        if (info) {
          return api(path, options, attempt + 1);
        }
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
const text = await res.text();
   try { return text ? JSON.parse(text) : {}; } catch { return {}; }  }, [refresh]);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      return [];
    }
    setLoading(true);
    try {
      const list = await api("/categories");
      setCategories(list);
      return list;
    } catch (e) {
      console.error("❌ Failed to fetch categories:", e.message);
      if (/token/i.test(e.message)) {
        setCategories([]);
      }
      throw e;
    } finally {
      setLoading(false);
    }
  }, [api, user]);

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [fetchCategories]);

  const addCategory = async (c) => {
    const saved = await api("/categories", { method: "POST", body: JSON.stringify(c) });
    setCategories((prev) => {
      const key = saved._id || saved.id;
      const filtered = prev.filter((item) => (item._id || item.id) !== key);
      const next = [...filtered, saved];
      // стабильная сортировка по имени
      return next.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
  };

  const removeCategory = async (id) => {
    await api(`/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c._id !== id && c.id !== id));
  };

  const clearAll = () => setCategories([]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading,
        addCategory,
        removeCategory,
        clearAll,
        reload: fetchCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
