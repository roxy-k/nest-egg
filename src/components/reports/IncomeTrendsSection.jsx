import React from "react";
import { Card, Alert } from "react-bootstrap";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";

function IncomeTooltip({ active, payload, label, t, formatCurrency }) {
  if (!active || !payload?.length) return null;

  const { value } = payload[0];

  return (
    <div className="bg-white border rounded px-3 py-2 shadow-sm">
      <div className="fw-semibold">
        {t("reports.tooltip_month", { month: label })}
      </div>
      <div className="text-muted">
        {t("reports.tooltip_amount", {
          amount: formatCurrency ? formatCurrency(value) : value,
        })}
      </div>
    </div>
  );
}

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
              <Tooltip content={<IncomeTooltip t={t} formatCurrency={formatCurrency} />} />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name={t("dashboard.income")} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
}
