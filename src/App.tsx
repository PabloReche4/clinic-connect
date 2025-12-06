import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import NewInvoice from "./pages/NewInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import Budgets from "./pages/Budgets";
import NewBudget from "./pages/NewBudget";
import BudgetDetail from "./pages/BudgetDetail";
import Treatments from "./pages/Treatments";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Appointments from "./pages/Appointments";
import Revenue from "./pages/Revenue";
import TimeTracking from "./pages/TimeTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/invoices"
              element={
                <DashboardLayout>
                  <Invoices />
                </DashboardLayout>
              }
            />
            <Route
              path="/invoices/new"
              element={
                <DashboardLayout>
                  <NewInvoice />
                </DashboardLayout>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <DashboardLayout>
                  <InvoiceDetail />
                </DashboardLayout>
              }
            />
            <Route
              path="/budgets"
              element={
                <DashboardLayout>
                  <Budgets />
                </DashboardLayout>
              }
            />
            <Route
              path="/budgets/new"
              element={
                <DashboardLayout>
                  <NewBudget />
                </DashboardLayout>
              }
            />
            <Route
              path="/budgets/:id"
              element={
                <DashboardLayout>
                  <BudgetDetail />
                </DashboardLayout>
              }
            />
            <Route
              path="/treatments"
              element={
                <DashboardLayout>
                  <Treatments />
                </DashboardLayout>
              }
            />
            <Route
              path="/patients"
              element={
                <DashboardLayout>
                  <Patients />
                </DashboardLayout>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <DashboardLayout>
                  <PatientDetail />
                </DashboardLayout>
              }
            />
            <Route
              path="/appointments"
              element={
                <DashboardLayout>
                  <Appointments />
                </DashboardLayout>
              }
            />
            <Route
              path="/revenue"
              element={
                <DashboardLayout>
                  <Revenue />
                </DashboardLayout>
              }
            />
            <Route
              path="/time-tracking"
              element={
                <DashboardLayout>
                  <TimeTracking />
                </DashboardLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
