import React, { useMemo } from "react";
import { Row, Col, Card, ProgressBar, Badge, ListGroup } from "react-bootstrap";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useBudgets } from "../context/BudgetsContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const monthKey = (iso) => iso?.slice(0, 7);
const now = new Date();
const CURRENT_MONTH = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

function StatCard({ title, value, sub }) {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="text-muted mb-2">{title}</div>
        <div className="display-6 fw-semibold">{value}</div>
        {sub && <div className="text-muted mt-1">{sub}</div>}
      </Card.Body>
    </Card>
  );
}

export default function Dashboard() {
 const { transactions, loading: txLoading } = useTransactions();
const { budgets, loading: bLoading } = useBudgets();
 const { categories, loading: cLoading } = useCategories();
 const loadingAll = txLoading || bLoading || cLoading;
const { t, formatCurrency } = useSettings()

  const { incomeTotal, expenseTotal, balance } = useMemo(() => {
    let income = 0,
      expense = 0;
    for (const t of transactions) {
      const n = Number(t.amount) || 0;
      if (t.type === "income") income += n;
      else expense += n;
    }
    return { incomeTotal: income, expenseTotal: expense, balance: income - expense };
  }, [transactions]);

  const monthExpense = useMemo(() => {
    let sum = 0;
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (monthKey(t.date) === CURRENT_MONTH) sum += Number(t.amount) || 0;
    }
    return sum;
  }, [transactions]);

  const { totalLimit, totalUsed, totalPct } = useMemo(() => {
    let limit = 0,
      used = 0;
    const usedMap = new Map();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const key = `${t.categoryId}:${monthKey(t.date)}`;
      usedMap.set(key, (usedMap.get(key) || 0) + (Number(t.amount) || 0));
    }
    for (const b of budgets) {
      if (b.month !== CURRENT_MONTH) continue;
      limit += Number(b.limit) || 0;
      used += usedMap.get(`${b.categoryId}:${b.month}`) || 0;
    }
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return { totalLimit: limit, totalUsed: used, totalPct: pct };
  }, [budgets, transactions]);

  const budgetVariant = totalPct < 70 ? "success" : totalPct < 100 ? "warning" : "danger";

  const last6 = useMemo(() => {
    const labels = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      labels.push(key);
    }
    const sums = Object.fromEntries(labels.map((m) => [m, 0]));
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const mk = monthKey(t.date);
      if (mk && mk in sums) sums[mk] += Number(t.amount) || 0;
    }
    return labels.map((m) => ({ month: m, value: sums[m] }));
  }, [transactions]);

  const topCats = useMemo(() => {
    const map = new Map(); 
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (monthKey(t.date) !== CURRENT_MONTH) continue;
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + (Number(t.amount) || 0));
    }
    const items = [...map.entries()]
      .map(([id, sum]) => {
        const c = categories.find((x) => (x._id || x.id) === id);

        return { id, name: c ? c.name : id, sum };
      })
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 5);
    return items;
  }, [transactions, categories]);

  return (
    <>
<h1 className="mb-4">{t("dashboard.title")}</h1>
 {loadingAll && <div className="text-muted mb-3">{t("common.loading")}</div>}
      <Row className="g-3">
        <Col md={4}>
          <StatCard
            title={t("dashboard.balance")}
            value={formatCurrency(balance)}
 sub={`${t("dashboard.income")}: ${formatCurrency(incomeTotal)} • ${t("dashboard.expense")}: ${formatCurrency(expenseTotal)}`}          />
        </Col>
        <Col md={4}>
          <StatCard
            title={`${t("dashboard.monthly_spend")} (${CURRENT_MONTH})`}
            value={formatCurrency(monthExpense)}
            sub={t("dashboard.monthly_spend_sub")}
          />
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="text-muted mb-2">{t("dashboard.budgets_current")}</div>
<div className="fw-semibold mb-2">
  {t("dashboard.used_of", {
    used: formatCurrency(totalUsed),
    limit: formatCurrency(totalLimit)
  })}
</div>

              <ProgressBar now={totalPct} label={`${totalPct}%`} variant={budgetVariant} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col md={7}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
<Card.Title className="mb-3">{t("dashboard.expense_trend")}</Card.Title>             
 {last6.every((d) => d.value === 0) ? (
                <div className="text-muted">{t("dashboard.no_data")}</div>
              ) : (
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <AreaChart data={last6} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
         <Area type="monotone" dataKey="value" name={t("dashboard.chart_expenses")} fill="#82ca9d" stroke="#82ca9d" fillOpacity={0.15}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
<Card.Title className="mb-3">{t("dashboard.top_categories", { month: CURRENT_MONTH })}</Card.Title>
{topCats.length === 0 ? (
                <div className="text-muted">{t("dashboard.no_data")}</div>
                 ) : (
                <ListGroup variant="flush">
                  {topCats.map((c, i) => (
                    <ListGroup.Item
                      key={c.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <Badge bg="secondary" className="me-2">
                          {i + 1}
                        </Badge>
                        {c.name}
                      </div>
                      <strong>{formatCurrency(c.sum)}</strong>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
