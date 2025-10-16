import React, { useMemo, useState } from "react";
import { Button, Table, Modal, Form, Badge, Row, Col, InputGroup } from "react-bootstrap";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import TransactionsExportExcel from "../components/TransactionsExportExcel.jsx";

function sanitizeAmount(raw) {
  let v = raw.replace(/[^\d.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  v = v.replace(/^0+(?=\d)/, "");
  const [i, d] = v.split(".");
  return d ? `${i}.${d.slice(0, 2)}` : i;
}
const monthKey = (iso) => iso?.slice(0, 7);

export default function Transactions() {
  const { categories } = useCategories();
  const { transactions, addTransaction, removeTransaction, updateTransaction, loading } = useTransactions();
  const { t,formatCurrency } = useSettings();

  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null); 
  const DEFAULT_TYPE = categories.find((c) => c.id === "salary") ? "income" : "expense";
  const [form, setForm] = useState({ date: "", categoryId: "", type: DEFAULT_TYPE, amount: "" });

  // Filters & sorting
  const [q, setQ] = useState("");
  const [fMonth, setFMonth] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fType, setFType] = useState("");
  const [sortBy, setSortBy] = useState({ key: "date", dir: "desc" });

  const openAdd = () => {
    setEditId(null);
    setForm({ date: "", categoryId: "", type: DEFAULT_TYPE, amount: "" });
    setShow(true);
  };
const openEdit = (t) => {
  setEditId(t._id || t.id);
  setForm({
    date: t.date,
    categoryId: String(t.categoryId),
    type: t.type,
    amount: String(t.amount)
  });
  setShow(true);
};

  const close = () => setShow(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "categoryId") {
const selected = categories.find((c) => (c._id || c.id) === value);    
  setForm((p) => ({ ...p, categoryId: value, type: selected ? selected.type : p.type }));
      return;
    }
   if (name === "amount") {
      setForm((p) => ({ ...p, amount: sanitizeAmount(value) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
   };

  const blockNonNumericInput = (event) => {
    const data = event.data ?? "";
    if (event.inputType === "insertText" && data && !/[0-9.,]/.test(data)) {
      event.preventDefault();
    }
  };
  const handleAmountPaste = (event) => {
    const text = event.clipboardData?.getData("text") ?? "";
    if (!text) return;
    event.preventDefault();
    setForm((prev) => ({ ...prev, amount: sanitizeAmount(text) }));
  };
  const save = async () => {
   if (!form.date || !form.categoryId || !form.amount) {
alert(t("errors.fill_all_fields"))
      return;
    }
    const n = Number(form.amount);
    if (Number.isNaN(n) || n <= 0) {
      alert(t("errors.amount_positive"))
      return;
    }
    const payload = { date: form.date, categoryId: form.categoryId, type: form.type, amount: n };

    if (editId == null) {
      await addTransaction(payload);     
    } else {
      await updateTransaction(editId, payload); 
    }

    setEditId(null);
    setForm({ date: "", categoryId: "", type: DEFAULT_TYPE, amount: "" });
    close();
  };

  const amountDisplay = (t) => {
    const sign = t.type === "income" ? "+" : "-";
    return (
      <span className={`fw-semibold ${t.type === "income" ? "text-success" : "text-danger"}`}>
        {sign}{formatCurrency(t.amount)}
      </span>
    );
  };

  const months = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => { const m = monthKey(t.date); if (m) set.add(m); });
    return Array.from(set).sort();
  }, [transactions]);

  const view = useMemo(() => {
    let data = [...transactions];

    if (fMonth) data = data.filter((t) => monthKey(t.date) === fMonth);
    if (fCategory) data = data.filter((t) => t.categoryId === fCategory);
    if (fType) data = data.filter((t) => t.type === fType);

    const ql = q.trim().toLowerCase();
    if (ql) {
      data = data.filter((t) => {
const cat = categories.find((c) => (c._id || c.id) === t.categoryId);        const name = cat ? cat.name : t.categoryId;
        return (
          (t.date || "").toLowerCase().includes(ql) ||
          String(t.amount).toLowerCase().includes(ql) ||
          (name || "").toLowerCase().includes(ql)
        );
      });
    }


    data.sort((a, b) => {
      const dir = sortBy.dir === "asc" ? 1 : -1;
      let av, bv;
      switch (sortBy.key) {
        case "date": av = a.date; bv = b.date; return av === bv ? 0 : (av > bv ? dir : -dir);
        case "category":
av = (categories.find((c) => (c._id || c.id) === a.categoryId)?.name || a.categoryId).toLowerCase();
bv = (categories.find((c) => (c._id || c.id) === b.categoryId)?.name || b.categoryId).toLowerCase();          return av === bv ? 0 : (av > bv ? dir : -dir);
        case "type": av = a.type; bv = b.type; return av === bv ? 0 : (av > bv ? dir : -dir);
        case "amount": av = a.amount; bv = b.amount; return (av - bv) * dir;
        default: return 0;
      }
    });

    return data;
  }, [transactions, q, fMonth, fCategory, fType, sortBy, categories]);

  const toggleSort = (key) => {
    setSortBy((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="m-0">{t("transactions.title")}</h1>
        <div className="d-flex gap-2 flex-wrap">
          <TransactionsExportExcel />
          <Button onClick={openAdd}>{t("transactions.add_title")}</Button>

        </div>
      </div>

      <Row className="g-2 mb-3">
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text>{t("common.search")}</InputGroup.Text>

            <Form.Control
              placeholder=""
              onChange={(e) => setQ(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select value={fMonth} onChange={(e) => setFMonth(e.target.value)}>
            <option value="">{t("transactions.all_months")}</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
  <option value="">{t("transactions.all_categories")}</option>
  {categories.map((c) => (
    <option
      key={String(c._id || c.id)}
      value={String(c._id || c.id)}
    >
      {c.name}
    </option>
  ))}
</Form.Select>

        </Col>
        <Col md={3}>
          <Form.Select value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="">{t("transactions.type_all")}</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Form.Select>
        </Col>
      </Row>

      <Table hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th role="button" onClick={() => toggleSort("date")}>
              {t("common.date")}{sortBy.key === "date" ? (sortBy.dir === "asc" ? "▲" : "▼") : ""}
            </th>
            <th role="button" onClick={() => toggleSort("category")}>
              {t("common.category")}{sortBy.key === "category" ? (sortBy.dir === "asc" ? "▲" : "▼") : ""}
            </th>
            <th role="button" onClick={() => toggleSort("type")}>             
              {t("transactions.type")}{sortBy.key === "type" ? (sortBy.dir === "asc" ? "▲" : "▼") : ""}
            </th>
            <th className="text-end" role="button" onClick={() => toggleSort("amount")}>
              {t("common.amount")}{sortBy.key === "amount" ? (sortBy.dir === "asc" ? "▲" : "▼") : ""}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="text-center text-muted">{t("common.loading")}</td></tr>
          ) : (
            view.map((tx, row) => {
              const cat = categories.find((c) => (c._id || c.id) === tx.categoryId);
              const name = cat ? cat.name : tx.categoryId;
              return (
            <tr key={tx._id || tx.id}>
  <td>{row + 1}</td>
  <td>{tx.date}</td>
  <td>{name}</td>
  <td>
    <Badge bg={tx.type === "income" ? "success" : "secondary"}>
      {tx.type === "income" ? t("transactions.type_income") : t("transactions.type_expense")}
    </Badge>
  </td>
  <td className="text-end">{amountDisplay(tx)}</td>
  <td className="text-end">
    <div className="d-flex justify-content-end gap-2">
      <Button size="sm" variant="outline-secondary" onClick={() => openEdit(tx)}>
        {t("common.edit")}
      </Button>
      <Button size="sm" variant="outline-danger" onClick={() => removeTransaction(tx._id)}>
        {t("common.delete")}
      </Button>
    </div>
  </td>
</tr>

              );
            })
          )}
        </tbody>
      </Table>

      <Modal show={show} onHide={close}>
        <Modal.Header closeButton>
         <Modal.Title>{editId == null ? t("transactions.add_title") : t("transactions.edit_title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("common.date")}</Form.Label>
              <Form.Control type="date" name="date" value={form.date} onChange={onChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("common.category")}</Form.Label>             
               <Form.Select name="categoryId" value={form.categoryId} onChange={onChange}>
            <option value="">{t("transactions.all_categories")}</option>               
             + {categories.map((c) => (
   <option key={c.id} value={c.id}>
     {c.name}
   </option>
 ))}
              </Form.Select>
             <Form.Text className="text-muted">{t("transactions.type")}: {t("transactions.type_income")}/{t("transactions.type_expense")}</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("transactions.type")}</Form.Label>
              <Form.Select name="type" value={form.type} onChange={onChange}>
                <option value="expense">{t("transactions.type_expense")}</option>
                <option value="income">{t("transactions.type_income")}</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("common.amount")}</Form.Label>
              <Form.Control
  name="amount"
  value={form.amount}
  onChange={onChange}
  type="text"
  inputMode="decimal"
  onBeforeInput={blockNonNumericInput}
  onPaste={handleAmountPaste}
/>

            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={save}>{t("common.save")}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
