import React from "react";
import { Card, Form,Button } from "react-bootstrap";
import { useSettings } from "../context/SettingsContext.jsx";
import { useAuth, getToken } from "../context/AuthContext.jsx";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useBudgets } from "../context/BudgetsContext.jsx";

export default function Settings() {
  const {
    settings,
    setTheme,
    setLanguage,
    setCurrency,
    allCurrencies = [],
    t
  } = useSettings();


const { clearAll: clearTx } = useTransactions();
const { clearAll: clearCats, reload: reloadCats } = useCategories();
const { clearAll: clearBudgets } = useBudgets();
const { refresh } = useAuth();



  const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

  return (
    <>
      <h1 className="mb-4">{t("settings.title")}</h1>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title className="mb-3">{t("settings.appearance")}</Card.Title>

          {/* Theme */}
          <Form.Group className="mb-3">
            <Form.Label>{t("settings.theme")}</Form.Label>
            <Form.Select
              value={settings.theme || "light"}
              onChange={(e) => setTheme(e.target.value)}
            >
               <option value="light">{t("settings.light")}</option>
             <option value="dark">{t("settings.dark")}</option>
            </Form.Select>
          </Form.Group>

         <Form.Group className="mb-3">
 <Form.Label>{t("settings.language")}</Form.Label>
  <Form.Select
    value={settings.language || "en"}
    onChange={(e) => setLanguage(e.target.value)}
  >
    <option value="en">English</option>
    <option value="fr">Français</option>
  </Form.Select>
</Form.Group>


          {/* Currency — ONE select with ALL currencies */}
          <Form.Group className="mb-3">
            <Form.Label>{t("settings.currency")}</Form.Label>
            <Form.Select
              value={settings.currency || "USD"}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {(allCurrencies || []).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Danger Zone */}
<Card className="border-danger mt-4 shadow-sm">
  <Card.Body>

<Card.Title className="text-danger fw-bold">{t("settings.reset_section")}</Card.Title>
<Card.Text className="text-muted mb-3">{t("settings.reset_hint")}</Card.Text>


 

<Button
  variant="danger"
  onClick={async () => {
    const msg = t("settings.reset_confirm");
    if (!window.confirm(msg)) return;

    try {
      const token = getToken();
      const res = await fetch(`${BASE}/reset`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.status === 401) {
        await refresh({ silent: true }).catch(() => null);
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "reset_failed");

      localStorage.removeItem("transactions");
      localStorage.removeItem("categories");
      localStorage.removeItem("budgets");
      clearTx();
      clearCats();
      clearBudgets();
      await reloadCats().catch(() => {});

      window.alert(t("settings.reset_success"));
    } catch (e) {
      console.error(e);
      window.alert(t("settings.reset_failed"));
    }
  }}
>
{t("settings.reset_all")}</Button>


  </Card.Body>
</Card>

    </>
  );
}
