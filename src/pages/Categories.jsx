import React, { useState } from "react";
import { ListGroup, Button, Modal, Form, Badge } from "react-bootstrap";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

export default function Categories() {
  const { categories, addCategory, removeCategory } = useCategories();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", id: "", type: "expense" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useSettings();

  const open = () => setShow(true);
  const close = () => {
    setShow(false);
    setForm({ name: "", id: "", type: "expense" });
    setError("");
    setSaving(false);
  };
  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "id") {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, "-")       // пробелы → дефисы
        .replace(/[^a-z0-9_-]/g, ""); // только [a-z0-9_-]
      setForm((p) => ({ ...p, id: slug }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };
const onSave = async () => {
    if (!form.name.trim() || !form.id.trim()) {
      setError(t("errors.name_and_id"));
      return;
    }

    const exists = categories.some((c) => (c.id || "").toLowerCase() === form.id.toLowerCase());
    if (exists) {
      setError(t("errors.slug_in_use"));
      return;
    }

    setSaving(true);
    setError("");
    try {
      await addCategory({ id: form.id.trim(), name: form.name.trim(), type: form.type });
      close();
    } catch (e) {
      console.error("❌ Failed to create category:", e);
      setError(e.message || "Failed to create category.");
      setSaving(false);
    }
};

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">{t("categories.title")}</h1>
        <Button onClick={open}>{t("categories.add_title")}</Button>
      </div>

      <ListGroup>
{categories
  .slice()
  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  .map((c) => (
          <ListGroup.Item key={c._id || c.id} className="d-flex align-items-center justify-content-between">
            <div>
                   <strong>{c.name}</strong>{" "}
              <Badge bg={c.type === "income" ? "success" : "secondary"}>
                {c.type === "income" ? t("transactions.type_income") : t("transactions.type_expense")}
             </Badge>

              <span className="text-muted ms-2">id: {c.id}</span>
            </div>
            <Button variant="outline-danger" size="sm" onClick={() => removeCategory(c._id || c.id)}>{t("common.delete")}</Button>
          </ListGroup.Item>
        ))}
        {categories.length === 0 && (
          <ListGroup.Item className="text-center text-muted">{t("common.empty")}</ListGroup.Item>
        )}
      </ListGroup>

      <Modal show={show} onHide={close}>
        <Modal.Header closeButton><Modal.Title>{t("categories.add_title")}</Modal.Title></Modal.Header>

        <Modal.Body>
          <Form>
            {error && <div className="text-danger mb-2">{error}</div>}
            <Form.Group className="mb-3">
              <Form.Label>{t("common.name")}</Form.Label>
              <Form.Control name="name" placeholder="e.g. Groceries" value={form.name} onChange={onChange}/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("categories.slug")}</Form.Label>
              <Form.Control name="id" placeholder="e.g. groceries" value={form.id} onChange={onChange}/>
              <Form.Text className="text-muted">ID slug is used as category key.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t("categories.type")}</Form.Label>
              <Form.Select name="type" value={form.type} onChange={onChange}>
                <option value="expense">{t("transactions.type_expense")}</option>
                <option value="income">{t("transactions.type_income")}</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
<Button variant="secondary" onClick={close} disabled={saving}>
   {t("common.cancel")}
 </Button>          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
