import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext();
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await fetch(`${BASE}/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 304 && userRef.current) {
        return userRef.current;
      }
      if (!res.ok) throw new Error(data.error || "Unauthorized");
      setUser(data);
      userRef.current = data;
      return data;
    } catch (err) {
      console.warn("Auth refresh failed:", err.message);
      setUser(null);
      userRef.current = null;
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async ({ email, password }) => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed");
    setUser(data.user);
    userRef.current = data.user;
    return data.user;
  };

  const register = async ({ email, password, name = "" }) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Registration failed");
    setUser(data.user);
    userRef.current = data.user;
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch(`${BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      userRef.current = null;
    }
  };

  const value = { user, loading, login, register, logout, refresh };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
