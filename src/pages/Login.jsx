import React, { useState, useEffect } from "react";
import { Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx"

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const googleSignIn = () => {
  window.location.href = `${BASE}/auth/google`;
};
export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useSettings();

useEffect(() => {
  const m = (window.location.hash || "").match(/token=([^&]+)/);
  if (m && m[1]) {
    localStorage.setItem("jwt", m[1]);    // сохранить токен
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    navigate("/dashboard");
  }
}, [navigate]);


  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
<Card.Title className="mb-3">{t("auth.login")}</Card.Title>
    <Button
  variant="outline-dark"
  className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
  onClick={googleSignIn}
  aria-label={t("auth.google")}
>
  <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden="true">
    <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.7-36.4-5-53.6H272v101.4h146.9c-6.3 34.1-25 63-53.2 82.4v68h86.1c50.4-46.5 81.7-115.1 81.7-198.2z"/>
    <path fill="#34A853" d="M272 544.3c72.7 0 133.7-24.1 178.3-65.2l-86.1-68c-23.9 16.1-54.6 25.7-92.2 25.7-70.9 0-131.0-47.8-152.5-112.1H30.6v70.5C74.9 487.6 167.2 544.3 272 544.3z"/>
    <path fill="#FBBC05" d="M119.5 324.7c-10.4-30.9-10.4-64.1 0-95l.1-70.5H30.6C4.6 204.2-7.2 257.6 1.5 309.4s33.2 99 71.8 133.7l46.2-118.4z"/>
    <path fill="#EA4335" d="M272 106.5c39.5-.6 77.5 13.9 106.6 40.8l79.6-79.6C429.1 25.4 353.6-1.1 272 0 167.2 0 74.9 56.7 30.6 141.1l88.9 70.5C141.1 154.1 201.1 106.5 272 106.5z"/>
  </svg>
  {t("auth.google")}
</Button>

         <div className="text-center text-muted mb-3">{t("auth.or")}</div>
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
           <Button type="submit" className="w-100" disabled={loading}>
            {loading ? t("auth.signing_in") : t("auth.login")}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
