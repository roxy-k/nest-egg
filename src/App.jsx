import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container, Alert } from "react-bootstrap";
import { useAuth } from "./context/AuthContext.jsx";

import AppNavbar from "./components/AppNavbar.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Transactions = lazy(() => import("./pages/Transactions.jsx"));
const Categories = lazy(() => import("./pages/Categories.jsx"));
const Budgets = lazy(() => import("./pages/Budgets.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const OAuth = lazy(() => import("./pages/OAuth.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="text-center p-5">Loading…</div>;
  }
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading, error, clearError } = useAuth();

  return (
    <>
   
             <AppNavbar />
       <Container className="py-4">
        {error ? (
          <Alert variant="warning" dismissible onClose={clearError} className="mb-3">
            {error}
          </Alert>
        ) : null}
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
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </Container>
    </>
  );
}
