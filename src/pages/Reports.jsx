import React, { useMemo, useState, lazy, Suspense } from "react";
import { Row, Col } from "react-bootstrap";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

const ExpenseByCategorySection = lazy(() => import("../components/reports/ExpenseByCategorySection.jsx"));
const IncomeTrendsSection = lazy(() => import("../components/reports/IncomeTrendsSection.jsx"));

const monthKey = (iso) => iso?.slice(0, 7);
export default function Reports() {
const { t, formatCurrency } = useSettings();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const expenseData = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (monthKey(t.date) !== month) continue;
const cat = categories.find(c => (c._id || c.id) === t.categoryId);
      const name = cat ? cat.name : t.categoryId;
      map.set(name, (map.get(name) || 0) + Number(t.amount || 0));
    }
return [...map.entries()]
   .map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value);  }, [transactions, categories, month]);

  const incomeData = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.type !== "income") continue;
      const m = monthKey(t.date);
      map.set(m, (map.get(m) || 0) + Number(t.amount || 0));
    }
return [...map.entries()]
   .map(([month, value]) => ({ month, value }))
   .sort((a, b) => a.month.localeCompare(b.month));  }, [transactions]);

  return (
    <>
      <h1 className="mb-4">{t("reports.title")}</h1>

      <Row className="g-4">
        <Col md={6}>
          <Suspense fallback={<div className="p-5 text-center border rounded h-100">Loading…</div>}>
            <ExpenseByCategorySection
              t={t}
              month={month}
              onMonthChange={setMonth}
              expenseData={expenseData}
              formatCurrency={formatCurrency}
            />
          </Suspense>
        </Col>

        <Col md={6}>
          <Suspense fallback={<div className="p-5 text-center border rounded h-100">Loading…</div>}>
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
