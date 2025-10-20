import React, { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const { t } = useSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError(t("errors.invalid_email"));
      return;
    }

    try {
      setLoading(true);
      const result = await requestPasswordReset({ email });
      if (result?.emailSupported === false) {
        setError(t("auth.reset_email_disabled"));
        return;
      }
      if (result?.emailSent === false && result?.emailError === "timeout") {
        setError(t("auth.reset_email_timeout"));
        return;
      }
      if (result?.emailSent === false) {
        setError(t("auth.reset_email_failed"));
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || t("errors.unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <Card.Title className="mb-3">{t("auth.reset_password_title")}</Card.Title>
        <Card.Text className="text-muted mb-3">{t("auth.reset_password_hint")}</Card.Text>

        {success ? (
          <Alert variant="success">{t("auth.reset_email_sent")}</Alert>
        ) : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="forgot-email">
            <Form.Label>{t("auth.email_label")}</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={loading}>
            {loading ? t("common.loading") : t("auth.request_link")}
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
