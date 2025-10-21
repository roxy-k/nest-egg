import { useCallback, useEffect, useState } from "react";

const isBrowser = typeof window !== "undefined";
const isDev = Boolean(import.meta.env && import.meta.env.DEV);

export function useLocalStorage(key, initialValue) {
  const read = useCallback(() => {
    if (!isBrowser) {
      return initialValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? initialValue : JSON.parse(raw);
    } catch (err) {
      if (isDev) {
        console.warn(`useLocalStorage: failed to read "${key}" from storage`, err);
      }
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState(read);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      if (isDev) {
        console.warn(`useLocalStorage: failed to write "${key}" to storage`, err);
      }
    }
  }, [key, value]);

  useEffect(() => {
    if (!isBrowser) {
      return undefined;
    }
    const onStorage = (e) => {
      if (e.key === key) {
        try {
          const next = e.newValue == null ? initialValue : JSON.parse(e.newValue);
          setValue(next);
        } catch (err) {
          if (isDev) {
            console.warn(`useLocalStorage: failed to parse update for "${key}"`, err);
          }
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, initialValue]);

  return [value, setValue];
}
