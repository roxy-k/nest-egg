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
  const { t } = useSettings(); // <— добавили переводчик

  const catNameById = (id) => {
    const c = categories.find((x) => (x._id || x.id) === id || x.id === id);
    return c ? c.name : id;
  };

  const onExport = () => {
    // избегаем конфликта имён: используем tx вместо t
    const rows = transactions.map((tx) => ({
      // если нет таких ключей в переводах, можешь оставить англ. строки
      [t("common.date") || "Date"]: tx.date || "",
      [t("common.category") || "Category"]: catNameById(tx.categoryId),
      [t("common.type") || "Type"]:
        tx.type === "income" ? t("transactions.type_income") || "Income"
                             : t("transactions.type_expense") || "Expense",
      [t("common.amount") || "Amount"]: Number(tx.amount || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `${t("reports.transactions") || "transactions"}_${stamp}.xlsx`;

    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  };

  return (
    <Button variant="outline-primary" onClick={onExport}>
      {t("common.export_excel") || "Export Excel"}
    </Button>
  );
}
