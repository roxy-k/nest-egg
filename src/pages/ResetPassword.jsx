import React, { useMemo, useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

const MIN_LENGTH = 6;

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { t } = useSettings();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const emailParam = params.get("email") || "";
  const tokenParam = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const invalidLink = !emailParam || !tokenParam;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (invalidLink) {
      setError(t("auth.reset_invalid_link"));
      return;
    }

    if (!password || password.length < MIN_LENGTH) {
      setError(
        t("errors.min_length", { n: MIN_LENGTH }) || `Minimum length ${MIN_LENGTH} characters`,
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.reset_password_mismatch"));
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ email: emailParam, token: tokenParam, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message || t("errors.unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <Card.Title className="mb-3">{t("auth.set_new_password")}</Card.Title>
        {invalidLink ? (
          <Alert variant="danger">{t("auth.reset_invalid_link")}</Alert>
        ) : null}
        {success ? <Alert variant="success">{t("auth.reset_success")}</Alert> : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="reset-email">
            <Form.Label>{t("auth.email_label")}</Form.Label>
            <Form.Control type="email" value={emailParam} readOnly plaintext={false} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="reset-password">
            <Form.Label>{t("auth.new_password_label")}</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="reset-password-confirm">
            <Form.Label>{t("auth.confirm_password_label")}</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button type="submit" className="w-100" disabled={loading || invalidLink}>
            {loading ? t("common.loading") : t("auth.reset_password_submit")}
          </Button>
        </Form>

        <div className="mt-3 text-center">
          <Button as={Link} to="/login" variant="link">
            {t("auth.back_to_login")}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
