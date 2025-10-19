import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AppNavbar from "../components/AppNavbar.jsx";

const authState = {
  user: null,
  logout: vi.fn(),
};

const translations = {
  "nav.transactions": "Transactions",
  "nav.categories": "Categories",
  "nav.budgets": "Budgets",
  "nav.reports": "Reports",
  "nav.settings": "Settings",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "nav.logout": "Log out",
  "nav.hello": "Hello",
};

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => authState,
}));

vi.mock("../context/SettingsContext.jsx", () => ({
  useSettings: () => ({
    settings: { theme: "light" },
    t: (key) => translations[key] ?? key,
  }),
}));

describe("AppNavbar", () => {
  beforeEach(() => {
    authState.user = null;
  });

  test("renders guest navigation with auth actions and toggler", () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>,
    );

    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByLabelText(/toggle navigation/i)).toBeInTheDocument();
  });

  test("shows user greeting and logout when authenticated", () => {
    authState.user = { name: "Alice" };

    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Hello/)).toHaveTextContent("Hello, Alice");
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});
