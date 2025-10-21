import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

const isDev = Boolean(import.meta.env && import.meta.env.DEV);

export default function OAuth() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { t } = useSettings();

  useEffect(() => {
    let canceled = false;

    const persistTokenFromHash = () => {
      const match = (window.location.hash || "").match(/token=([^&]+)/);
      const token = match?.[1];
      if (!token) return null;

      try {
        window.localStorage.setItem("jwt", token);
      } catch (err) {
        if (isDev) {
          console.warn("OAuth: failed to persist token from hash", err);
        }
      }
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      return token;
    };

    (async () => {
      const tokenPersisted = persistTokenFromHash();
      if (tokenPersisted) {
        const ok = await refresh({ silent: true }).catch((err) => {
          if (isDev) {
            console.warn("OAuth: refresh after token persist failed", err);
          }
          return null;
        });
        if (canceled) return;
        if (ok) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login?err=oauth", { replace: true });
        }
        return;
      }

      try {
        const user = await refresh({ silent: true });
        if (canceled) return;
        if (user) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login?err=oauth", { replace: true });
        }
      } catch (err) {
        if (isDev) {
          console.warn("OAuth: refresh without token failed", err);
        }
        if (!canceled) {
          navigate("/login?err=oauth", { replace: true });
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [refresh, navigate]);

  return <div className="text-center py-5">{t("auth.signing_in")}</div>;
}
