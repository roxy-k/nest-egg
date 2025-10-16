import React, { useMemo, useState, useEffect } from "react";
import { Table, Button, Modal, Form, ProgressBar, Badge } from "react-bootstrap";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useBudgets } from "../context/BudgetsContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

const monthKey = (isoDate) => isoDate?.slice(0, 7); 

export default function Budgets() {
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const { budgets, addBudget, updateBudget, removeBudget } = useBudgets();
  const { t, formatCurrency, settings } = useSettings();

  function getCurrentYear() {
    return String(new Date().getFullYear());
  }

  function getCurrentMonth() {
    return String(new Date().getMonth() + 1).padStart(2, "0");
  }

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [yy, setYy] = useState(getCurrentYear);
  const [mm, setMm] = useState(getCurrentMonth);
  const [form, setForm] = useState(() => ({
    categoryId: "",
    month: `${getCurrentYear()}-${getCurrentMonth()}`,
    limit: "",
  }));

  useEffect(() => {
    setForm((p) => ({ ...p, month: `${yy}-${mm}` }));
  }, [yy, mm]);

  const open = (budget = null) => {
    if (budget) {
      setEditing(budget);
      const [year, month = ""] = String(budget.month || "").split("-");
      if (year) setYy(year);
      if (month) setMm(month.padStart(2, "0"));
      setForm({
        categoryId: String(budget.categoryId || ""),
        month: budget.month,
        limit:
          typeof budget.limit === "number"
            ? String(budget.limit)
            : String(budget.limit ?? ""),
      });
    } else {
      setEditing(null);
      const year = getCurrentYear();
      const month = getCurrentMonth();
      setYy(year);
      setMm(month);
      setForm({
        categoryId: "",
        month: `${year}-${month}`,
        limit: "",
      });
    }
    setShow(true);
  };

  const close = () => {
    setShow(false);
    setEditing(null);
    const year = getCurrentYear();
    const month = getCurrentMonth();
    setForm({ categoryId: "", month: "", limit: "" });
    setYy(year);
    setMm(month);
  };

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const sanitizeLimit = (value) => {
    const cleaned = String(value ?? "").replace(/[^0-9.,]/g, "");
    let separatorUsed = false;
    const sanitized = cleaned
      .split("")
      .filter((char) => {
        if (char === "." || char === ",") {
          if (separatorUsed) return false;
          separatorUsed = true;
        }
        return true;
      })
      .join("");
    return sanitized.replace(",", ".");
  };

  const handleLimitChange = (e) => {
    setForm((prev) => ({ ...prev, limit: sanitizeLimit(e.target.value) }));
  };

  const handleLimitPaste = (event) => {
    const text = event.clipboardData?.getData("text") ?? "";
    if (!text) return;
    event.preventDefault();
    setForm((prev) => ({ ...prev, limit: sanitizeLimit(text) }));
  };

  const blockNonNumericInput = (event) => {
    const data = event.data ?? "";
    if (event.inputType === "insertText" && data && !/[0-9.,]/.test(data)) {
      event.preventDefault();
    }
  };

  const onSave = async () => {
    if (saving) return;
    if (!form.categoryId || !form.month || !form.limit) {
alert(t("errors.fill_all_fields"))
      return;
    }

    const month = `${yy}-${mm}`;
    const limit = parseFloat(String(form.limit).replace(",", "."));

    if (!isFinite(limit) || limit <= 0) {
alert(t("errors.limit_positive"))
      return;
    }
    if (limit < 0.01) {
alert(t("errors.limit_min"))
      return;
    }

    setSaving(true);
    try {
      const payload = { categoryId: form.categoryId, month, limit };
      if (editing) {
        const id = editing._id || editing.id;
        if (!id) throw new Error("Invalid budget identifier.");
        await updateBudget(id, payload);
      } else {
        await addBudget(payload);
      }
      close();
    } catch (e) {
      alert(e.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const base = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const selectedYear = Number(yy);
    if (Number.isFinite(selectedYear) && !base.includes(selectedYear)) {
      base.push(selectedYear);
    }
    return base.sort((a, b) => a - b);
  }, [yy]);

  const spendByCatMonth = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const key = `${t.categoryId}:${monthKey(t.date)}`;
      map.set(key, (map.get(key) || 0) + (Number(t.amount) || 0));
    }
    return map;
  }, [transactions]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">{t("budgets.title")}</h1>
        <Button onClick={() => open(null)}>{t("budgets.set")}</Button>
      </div>

      <Table hover responsive>
        <thead>
          <tr>
           <th>{t("budgets.category")}</th>
            <th>{t("budgets.month")}</th>
           <th className="text-end">{t("budgets.limit")}</th>
           <th className="text-end">{t("budgets.spent")}</th>
           <th>{t("common.progress")}</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {budgets.length === 0 ? (
            <tr><td colSpan={6} className="text-center text-muted">{t("budgets.empty")}</td></tr>
          ) : budgets.map((b) => {
            const cat = categories.find(
              (c) => c.id === b.categoryId || c._id === b.categoryId
            );
            const used = spendByCatMonth.get(`${b.categoryId}:${b.month}`) || 0;
            const pct = Math.min(100, Math.round((used / b.limit) * 100 || 0));
            const variant = pct < 70 ? "success" : pct < 100 ? "warning" : "danger";
            return (
                  <tr key={b._id || b.id}>
<td>
                   {cat ? cat.name : b.categoryId}{" "}
                    <Badge bg="secondary">
                      {(cat?.type ?? "expense") === "income"
                        ? t("transactions.type_income")
                        : t("transactions.type_expense")}
                    </Badge>
                 </td>                <td>{b.month}</td>
                <td className="text-end">{formatCurrency ? formatCurrency(b.limit) : `$${b.limit.toFixed(2)}`}</td>
                <td className="text-end">{formatCurrency ? formatCurrency(used) : `$${used.toFixed(2)}`}</td>
                <td>
                  <ProgressBar now={pct} label={`${pct}%`} variant={variant} />
                </td>
                <td className="text-end">
                  <div className="d-inline-flex gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => open(b)}>
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => removeBudget(b._id || b.id)}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Modal show={show} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? t("budgets.edit_title") : t("budgets.add_title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("budgets.category")}</Form.Label>
              <Form.Select name="categoryId" value={form.categoryId} onChange={onChange}>
+ <option value="">{t("budgets.select_category")}</option>
  {categories.map((c) => (
    <option
      key={String(c.id || c._id)}
      value={String(c.id || c._id)}
    >
      {c.name}
    </option>
  ))}
</Form.Select>

            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Text muted>{t("budgets.month")}: {form.month}</Form.Text>
              <div className="d-flex gap-2">
                <Form.Select
                  aria-label="Month"
                  value={mm}
                  onChange={(e) => setMm(e.target.value)}
                  style={{ maxWidth: 140 }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const value = String(i + 1).padStart(2, "0");
                    const name = new Date(2000, i, 1).toLocaleString(
                      settings?.language || undefined,
                      { month: "long" }
                    );
                    return (
                      <option key={value} value={value}>
                        {name}
                      </option>
                    );
                  })}
                </Form.Select>

                <Form.Select aria-label="Year"
                  value={yy}
                  onChange={(e) => setYy(e.target.value)}
                  style={{ maxWidth: 120 }}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("budgets.limit")}</Form.Label>
            <Form.Control
              type="text"
              inputMode="decimal"
              value={form.limit}
              name="limit"
              placeholder="0"
              onChange={handleLimitChange}
              onBeforeInput={blockNonNumericInput}
              onPaste={handleLimitPaste}
            />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {t("common.save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
