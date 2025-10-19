import React from "react";
import { Card, Form, Alert } from "react-bootstrap";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00c49f", "#0088fe", "#ffbb28"];

export default function ExpenseByCategorySection({ t, month, onMonthChange, expenseData, formatCurrency }) {
  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>{t("reports.by_category")}</Card.Title>
        <Form.Group className="mb-3">
          <Form.Label>{t("reports.select_month")}</Form.Label>
          <Form.Control
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
          />
        </Form.Group>

        {expenseData.length === 0 ? (
          <Alert variant="info">{t("reports.empty_month", { month })}</Alert>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={expenseData} dataKey="value" nameKey="name" outerRadius={120} label>
                {expenseData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(value) : value)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
}
