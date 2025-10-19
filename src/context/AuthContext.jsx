import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext();
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const getToken = () => {
  try { return localStorage.getItem("jwt") || ""; } catch { return ""; }
};
const setToken = (t) => { try { if (t) localStorage.setItem("jwt", t); } catch {} };
const clearToken = () => { try { localStorage.removeItem("jwt"); } catch {} };
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);

  const normalizeUser = (d) => (d && typeof d === "object" && "user" in d ? d.user : d);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${BASE}/auth/me`, {
          credentials: "include",
          cache: "no-store",
          headers,
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 304 && userRef.current) {
          return userRef.current;
        }
        if (!res.ok) throw new Error(data.error || "Unauthorized");

        const u = normalizeUser(data);
        setUser(u);
        userRef.current = u;
        return u;
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
    },
    []
  );

  useEffect(() => {
    const ac = new AbortController();
    refresh();
    return () => {
      ac.abort();
    };
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
    if (data.token) {
      setToken(data.token); // Keep Safari in sync
    }
    const u = normalizeUser(data);
    setUser(u);
    userRef.current = u;
    return u;
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
    if (data.token) {
      setToken(data.token);
    }
    const u = normalizeUser(data);
    setUser(u);
    userRef.current = u;
    return u;
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE}/auth/change-password`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Unable to change password");
    }

    if (data.token) {
      setToken(data.token);
    }

    const u = normalizeUser(data);
    if (u) {
      setUser(u);
      userRef.current = u;
    }

    return data;
  };

  const requestPasswordReset = async ({ email }) => {
    const res = await fetch(`${BASE}/auth/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Unable to send reset email");
    }
    return data;
  };

  const resetPassword = async ({ email, token, newPassword }) => {
    const res = await fetch(`${BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, token, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Unable to reset password");
    }
    if (data.token) {
      setToken(data.token);
    }
    const u = normalizeUser(data);
    if (u) {
      setUser(u);
      userRef.current = u;
    }
    return data;
  };

  const logout = async () => {
    try {
      await fetch(`${BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearToken();
      setUser(null);
      userRef.current = null;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
    changePassword,
    requestPasswordReset,
    resetPassword,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
