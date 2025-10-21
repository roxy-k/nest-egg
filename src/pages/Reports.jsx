import React, { useMemo, useState, lazy, Suspense } from "react";
import { Row, Col, Spinner } from "react-bootstrap";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

const ExpenseByCategorySection = lazy(() => import("../components/reports/ExpenseByCategorySection.jsx"));
const IncomeTrendsSection = lazy(() => import("../components/reports/IncomeTrendsSection.jsx"));

function ChartSpinnerFallback() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center border rounded h-100 text-muted" style={{ minHeight: 280 }}>
      <Spinner animation="border" role="status" aria-live="polite" aria-label="Loading chart" />
      <span className="mt-2">Loading…</span>
    </div>
  );
}

const monthKey = (iso) => iso?.slice(0, 7);

export default function Reports() {
  const { t, formatCurrency } = useSettings();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const availableMonths = useMemo(() => {
    const months = new Set();
    for (const t of transactions) {
      const m = monthKey(t.date);
      if (m) months.add(m);
    }

    if (month) months.add(month);

    return [...months].sort((a, b) => b.localeCompare(a));
  }, [transactions, month]);

  const expenseData = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (monthKey(t.date) !== month) continue;
      const cat = categories.find((c) => (c._id || c.id) === t.categoryId);
      const name = cat ? cat.name : t.categoryId;
      map.set(name, (map.get(name) || 0) + Number(t.amount || 0));
    }

    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, month]);

  const incomeData = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.type !== "income") continue;
      const m = monthKey(t.date);
      map.set(m, (map.get(m) || 0) + Number(t.amount || 0));
    }

    return [...map.entries()]
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  return (
    <>
      <h1 className="mb-4">{t("reports.title")}</h1>

      <Row className="g-4">
        <Col md={6}>
          <Suspense fallback={<ChartSpinnerFallback />}>
            <ExpenseByCategorySection
              t={t}
              month={month}
              onMonthChange={setMonth}
              availableMonths={availableMonths}
              expenseData={expenseData}
              formatCurrency={formatCurrency}
            />
          </Suspense>
        </Col>

        <Col md={6}>
          <Suspense fallback={<ChartSpinnerFallback />}>
            <IncomeTrendsSection
              t={t}
              incomeData={incomeData}
              formatCurrency={formatCurrency}
            />
          </Suspense>
        </Col>
      </Row>
    </>
  );
}
