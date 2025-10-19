import React, { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";
import { useSettings } from "../context/SettingsContext.jsx";
import { useAuth, getToken } from "../context/AuthContext.jsx";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useBudgets } from "../context/BudgetsContext.jsx";

export default function Settings() {
  const { settings, setTheme, setLanguage, setCurrency, allCurrencies = [], t } = useSettings();
  const { clearAll: clearTx } = useTransactions();
  const { clearAll: clearCats, reload: reloadCats } = useCategories();
  const { clearAll: clearBudgets } = useBudgets();
  const { refresh, changePassword, requestPasswordReset, user } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailState, setResetEmailState] = useState({ success: false, error: "" });

  const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    setResetEmailState({ success: false, error: "" });

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t("settings.password_required"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.password_mismatch"));
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err.message || t("settings.password_error"));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    setResetEmailState({ success: false, error: "" });
    if (!user?.email) {
      setResetEmailState({ success: false, error: t("settings.reset_email_missing") });
      return;
    }

    try {
      setSendingResetEmail(true);
      const result = await requestPasswordReset({ email: user.email });
      if (result?.emailSupported === false) {
        setResetEmailState({ success: false, error: t("auth.reset_email_disabled") });
        return;
      }
      setResetEmailState({ success: true, error: "" });
    } catch (err) {
      setResetEmailState({
        success: false,
        error: err.message || t("settings.reset_email_error"),
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  return (
    <>
      <h1 className="mb-4">{t("settings.title")}</h1>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title className="mb-3">{t("settings.appearance")}</Card.Title>

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

      <Card className="mb-4">
        <Card.Body>
          <Card.Title className="mb-3">{t("settings.password_section")}</Card.Title>
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3" controlId="settings-current-password">
              <Form.Label>{t("settings.current_password")}</Form.Label>
              <Form.Control
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="settings-new-password">
              <Form.Label>{t("settings.new_password")}</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="settings-confirm-password">
              <Form.Label>{t("settings.confirm_password")}</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </Form.Group>

            {passwordError ? <div className="text-danger mb-3">{passwordError}</div> : null}
            {passwordSuccess ? (
              <div className="text-success mb-3">{t("settings.password_success")}</div>
            ) : null}

            <Button type="submit" variant="primary" disabled={changingPassword}>
              {changingPassword ? t("common.loading") : t("settings.change_password")}
            </Button>

            <hr className="my-4" />

            <h6 className="mb-2">{t("settings.reset_email_title")}</h6>
            <p className="text-muted">
              {t("settings.reset_email_hint", { email: user?.email || "—" })}
            </p>
            {resetEmailState.success ? (
              <div className="text-success mb-2">{t("auth.reset_email_sent")}</div>
            ) : null}
            {resetEmailState.error ? (
              <div className="text-danger mb-2">{resetEmailState.error}</div>
            ) : null}
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleSendResetEmail}
              disabled={sendingResetEmail}
            >
              {sendingResetEmail ? t("common.loading") : t("settings.reset_email_button")}
            </Button>
          </Form>
        </Card.Body>
      </Card>

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
                await reloadCats().catch(() => undefined);

                window.alert(t("settings.reset_success"));
              } catch (e) {
                console.error(e);
                window.alert(t("settings.reset_failed"));
              }
            }}
          >
            {t("settings.reset_all")}
          </Button>
        </Card.Body>
      </Card>
    </>
  );
}
