import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { CategoriesProvider } from "./context/CategoriesContext.jsx";
import { BudgetsProvider } from "./context/BudgetsContext.jsx";
import { TransactionsProvider } from "./context/TransactionsContext.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SettingsProvider>
        <CategoriesProvider>
          <BudgetsProvider>
            <TransactionsProvider>
              <App />
            </TransactionsProvider>
          </BudgetsProvider>
        </CategoriesProvider>
      </SettingsProvider>
    </AuthProvider>
  </BrowserRouter>
);
