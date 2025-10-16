import React, { useMemo, useState } from "react";
import { Alert, Form, Row, Col, Card } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Legend } from "recharts";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";



const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00c49f", "#0088fe", "#ffbb28"];

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
          <Card className="h-100">
            <Card.Body>
              <Card.Title>{t("reports.by_category")}</Card.Title>

              <Form.Group className="mb-3">
                <Form.Label>{t("reports.select_month")}</Form.Label>
                <Form.Control
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </Form.Group>
              {expenseData.length === 0 ? (
               <Alert variant="info">{t("reports.empty_month", { month })}</Alert>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                      label
                    >
                      {expenseData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
<Tooltip formatter={(v) => (formatCurrency ? formatCurrency(v) : v)} />                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
             <Card.Title>{t("reports.income_trends")}</Card.Title>
              {incomeData.length === 0 ? (
          <Alert variant="info">{t("dashboard.no_data")}</Alert>              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => (formatCurrency ? formatCurrency(v) : v)} />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" name={t("dashboard.income")} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
