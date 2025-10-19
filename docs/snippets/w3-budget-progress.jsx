import { ProgressBar } from "react-bootstrap";

export function BudgetProgress({ used = 0, limit = 0 }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const variant = pct < 70 ? "success" : pct < 100 ? "warning" : "danger";
  return <ProgressBar now={pct} label={`${pct}%`} variant={variant} />;
}
