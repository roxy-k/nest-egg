import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext();
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const REFRESH_TIMEOUT_MS = Number(import.meta.env.VITE_AUTH_TIMEOUT_MS || 8000);

async function fetchWithTimeout(resource, options = {}, timeoutMs = REFRESH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
  const [error, setError] = useState(null);
  const userRef = useRef(null);

  const normalizeUser = (d) => (d && typeof d === "object" && "user" in d ? d.user : d);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetchWithTimeout(`${BASE}/auth/me`, {
          credentials: "include",
          cache: "no-store",
          headers,
        });
        if (res.status === 401) {
          clearToken();
          setUser(null);
          userRef.current = null;
          return null;
        }
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
        if (!silent) {
          const msg =
            err?.name === "AbortError"
              ? "Server is taking too long to respond. It may be waking up—please try again in a few seconds."
              : err?.message || "Failed to contact server.";
          setError(msg);
        }
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
    setError(null);
    const res = await fetchWithTimeout(`${BASE}/auth/login`, {
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
    setError(null);
    const res = await fetchWithTimeout(`${BASE}/auth/register`, {
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
    setError(null);
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetchWithTimeout(`${BASE}/auth/change-password`, {
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
    setError(null);
    const res = await fetchWithTimeout(`${BASE}/auth/request-reset`, {
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
    setError(null);
    const res = await fetchWithTimeout(`${BASE}/auth/reset-password`, {
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
      setError(null);
      await fetchWithTimeout(`${BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearToken();
      setUser(null);
      userRef.current = null;
    }
  };

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refresh,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearError,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
