import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Transactions from "../pages/Transactions.jsx";

const categoriesState = [
  { id: "groceries", name: "Groceries", type: "expense" },
  { id: "salary", name: "Salary", type: "income" },
];

const transactionsState = {
  transactions: [
    {
      id: "tx-1",
      date: "2025-01-10",
      categoryId: "groceries",
      type: "expense",
      amount: 45,
    },
  ],
  addTransaction: vi.fn(),
  removeTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  loading: false,
};

const translations = {
  "transactions.title": "Transactions",
  "transactions.add_title": "Add transaction",
  "transactions.edit_title": "Edit transaction",
  "transactions.all_months": "All months",
  "transactions.all_categories": "All categories",
  "transactions.type_all": "All types",
  "transactions.type": "Type",
  "transactions.type_income": "Income",
  "transactions.type_expense": "Expense",
  "categories.add_title": "Add category",
  "transactions.type_income": "Income",
  "transactions.type_expense": "Expense",
  "transactions.type_all": "All types",
  "common.search": "Search",
  "common.date": "Date",
  "common.category": "Category",
  "common.amount": "Amount",
  "common.loading": "Loading…",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.cancel": "Cancel",
  "common.save": "Save",
};

vi.mock("../context/CategoriesContext.jsx", () => ({
  useCategories: () => ({ categories: categoriesState, loading: false }),
}));

vi.mock("../context/TransactionsContext.jsx", () => ({
  useTransactions: () => transactionsState,
}));

vi.mock("../context/SettingsContext.jsx", () => ({
  useSettings: () => ({
    t: (key) => translations[key] ?? key,
    formatCurrency: (value) => `$${Number(value).toFixed(2)}`,
  }),
}));

vi.mock("../components/TransactionsExportExcel.jsx", () => ({
  default: () => <button type="button">Export</button>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("Transactions page", () => {
  beforeEach(() => {
    transactionsState.transactions = [
      {
        id: "tx-1",
        date: "2025-01-10",
        categoryId: "groceries",
        type: "expense",
        amount: 45,
      },
    ];
    window.innerWidth = 480;
  });

  test("renders transaction table with responsive wrapper", () => {
    render(
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>,
    );

    window.dispatchEvent(new Event("resize"));

    expect(screen.getByText("Transactions")).toBeInTheDocument();
    const tableWrapper = document.querySelector(".table-responsive");
    expect(tableWrapper).not.toBeNull();

    const table = within(tableWrapper).getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
    expect(within(table).getByText("Groceries")).toBeInTheDocument();
    expect(within(table).getByText("-$45.00")).toBeInTheDocument();
  });
});
