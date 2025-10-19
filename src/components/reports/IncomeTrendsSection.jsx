import React from "react";
import { Card, Alert } from "react-bootstrap";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";

export default function IncomeTrendsSection({ t, incomeData, formatCurrency }) {
  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>{t("reports.income_trends")}</Card.Title>

        {incomeData.length === 0 ? (
          <Alert variant="info">{t("dashboard.no_data")}</Alert>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => (formatCurrency ? formatCurrency(value) : value)} />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name={t("dashboard.income")} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
}
