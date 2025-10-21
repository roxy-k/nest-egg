import React from "react";
import { Button } from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useTransactions } from "../context/TransactionsContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

export default function TransactionsExportExcel() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { t } = useSettings();

  const label = (key, fallback) => {
    const value = t?.(key);
    return !value || value === key ? fallback : value;
  };

  const catNameById = (id) => {
    const c = categories.find((x) => (x._id || x.id) === id || x.id === id);
    return c ? c.name : id;
  };

  const onExport = () => {
    const rows = transactions.map((tx) => ({
      [label("common.date", "Date")]: tx.date || "",
      [label("common.category", "Category")]: catNameById(tx.categoryId),
      [label("common.type", "Type")]:
        tx.type === "income"
          ? label("transactions.type_income", "Income")
          : label("transactions.type_expense", "Expense"),
      [label("common.amount", "Amount")]: Number(tx.amount || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `${label("reports.transactions", "transactions")}_${stamp}.xlsx`;

    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  };

  return (
    <Button variant="outline-primary" onClick={onExport}>
      {label("common.export_excel", "Export Excel")}
    </Button>
  );
}
