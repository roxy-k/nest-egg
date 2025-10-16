import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { settings, t } = useSettings();
  

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isDark = settings?.theme === "dark";

  return (
    <Navbar
      bg={isDark ? "dark" : "light"}
      variant={isDark ? "dark" : "light"}
      expand="sm"
      className="mb-4 shadow-sm border-bottom"
    >
      <Container>
        <Navbar.Brand as={NavLink} to="/">
          NestEgg
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/transactions">{t ? t("nav.transactions") : "Transactions"}</Nav.Link>
            <Nav.Link as={NavLink} to="/categories">{t ? t("nav.categories") : "Categories"}</Nav.Link>
            <Nav.Link as={NavLink} to="/budgets">{t ? t("nav.budgets") : "Budgets"}</Nav.Link>
            <Nav.Link as={NavLink} to="/reports">{t ? t("nav.reports") : "Reports"}</Nav.Link>
            <Nav.Link as={NavLink} to="/settings">{t ? t("nav.settings") : "Settings"}</Nav.Link>
          </Nav>
          <Nav>
            {!user ? (
              <>
                <Button variant={isDark ? "outline-light" : "outline-primary"} className="me-2" onClick={() => navigate("/login")}>
                  {t ? t("nav.login") : "Log in"}
                </Button>
                <Button variant={isDark ? "light" : "primary"} onClick={() => navigate("/register")}>
                  {t ? t("nav.signup") : "Sign up"}

                </Button>
              </>
            ) : (
              <>
                <Navbar.Text className="me-3">
                 {t ? t("nav.hello") : "Hello"}, <strong>{user?.name}</strong>
                </Navbar.Text>
                <Button variant={isDark ? "outline-light" : "outline-danger"} onClick={handleLogout}>
                  {t ? t("nav.logout") : "Log out"}
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
