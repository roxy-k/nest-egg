import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { useAuth } from "./context/AuthContext.jsx";

import AppNavbar from "./components/AppNavbar.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Categories from "./pages/Categories.jsx";
import Budgets from "./pages/Budgets.jsx";
import Settings from "./pages/Settings.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import OAuth from "./pages/OAuth.jsx";
import NotFound from "./pages/NotFound.jsx";
import { lazy, Suspense } from "react";

const Reports = lazy(() => import("./pages/Reports.jsx"));


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="text-center p-5">Loading…</div>;
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <>
   
             <AppNavbar />
       <Container className="py-4">
        <Suspense fallback={<div className="text-center p-5">Loading…</div>}>
          <Routes>
             <Route path="/" element={<Navigate to="/dashboard" replace />} />

           
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <PrivateRoute>
                <Budgets />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />

          <Route path="/oauth" element={<OAuth />} />
          <Route
            path="/login"
            element={loading ? <div className="text-center p-5">Loading…</div> : user ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route
            path="/register"
            element={loading ? <div className="text-center p-5">Loading…</div> : user ? <Navigate to="/dashboard" /> : <Register />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </Container>
    </>
  );
}
