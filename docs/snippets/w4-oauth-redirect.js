import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function OAuthRedirect() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        await refresh();
        if (!canceled) navigate("/dashboard", { replace: true });
      } catch {
        if (!canceled) navigate("/login", { replace: true });
      }
    })();
    return () => { canceled = true; };
  }, [refresh, navigate]);

  return null;
}
