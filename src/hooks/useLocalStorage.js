// src/hooks/useLocalStorage.js  (или твой фактический путь)
import { useCallback, useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initialValue : JSON.parse(raw);
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState(read);

  // Пишем в localStorage с try/catch и только если реально изменилось
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // игнор
    }
  }, [key, value]);

  // Синхронизация между вкладками (если откроешь NestEgg в двух окнах)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) {
        try {
          const next = e.newValue == null ? initialValue : JSON.parse(e.newValue);
          setValue(next);
        } catch {
          // игнор
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, initialValue]);

  return [value, setValue];
}
