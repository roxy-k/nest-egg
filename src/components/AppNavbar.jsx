import React, { useRef } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { settings, t } = useSettings();
  const reportsPrefetched = useRef(false);
  

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleReportsHover = () => {
    if (reportsPrefetched.current) return;
    reportsPrefetched.current = true;
    import("../pages/Reports.jsx");
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
        <Navbar.Brand href="/" className="d-flex align-items-center">
          <span
            aria-hidden="true"
            className="me-2 d-inline-flex align-items-center justify-content-center fw-bold"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: isDark ? "#dee2e6" : "#212529",
              color: isDark ? "#212529" : "#ffffff",
              fontSize: "0.75rem"
            }}
          >
            NE
          </span>
          <span className="fw-semibold">Nest Egg</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/transactions">{t ? t("nav.transactions") : "Transactions"}</Nav.Link>
            <Nav.Link as={NavLink} to="/categories">{t ? t("nav.categories") : "Categories"}</Nav.Link>
            <Nav.Link as={NavLink} to="/budgets">{t ? t("nav.budgets") : "Budgets"}</Nav.Link>
            <Nav.Link as={NavLink} to="/reports" onMouseEnter={handleReportsHover}>
              {t ? t("nav.reports") : "Reports"}
            </Nav.Link>
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
                <Button
                  variant={isDark ? "outline-light" : "outline-danger"}
                  size="sm"
                  className="mt-3 mt-sm-0 align-self-start"
                  onClick={handleLogout}
                >
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
