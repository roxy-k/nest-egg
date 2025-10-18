import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx"

export default function OAuth() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { t } = useSettings();

  useEffect(() => {
    let canceled = false;
    (async () => {
const m = (window.location.hash || "").match(/token=([^&]+)/);
     if (m && m[1]) {
       try {
         localStorage.setItem("jwt", m[1]);
       } catch {}
       window.history.replaceState(null, "", window.location.pathname + window.location.search);
       navigate("/dashboard", { replace: true });
       return; 
     }
     try {
       const user = await refresh({ silent: true });
       if (!canceled) {
         if (user) {
           navigate("/dashboard", { replace: true });
         } else {
           navigate("/login?err=oauth", { replace: true });
         }
       }
     } catch {
       if (!canceled) navigate("/login?err=oauth", { replace: true });
     }
    })();
    return () => {
      canceled = true;
    };
  }, [refresh, navigate]);

return <div className="text-center py-5">{t("auth.signing_in")}</div>;}
