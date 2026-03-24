import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/core/auth/AuthProvider";
import { Role } from "@/constants/domain";
import { PermissionGate } from "@/core/guards/PermissionGate";

// Pages
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/app/Dashboard";
import Leads from "@/pages/app/Leads";
import Products from "@/pages/app/Products";
import SiteContent from "@/pages/app/SiteContent";
import Settings from "@/pages/app/Settings";
import Montadores from "@/pages/app/admin/Montadores";

// Layout
import AppLayout from "@/components/layout/AppLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="products" element={<Products />} />
            <Route path="site" element={<SiteContent />} />
            <Route path="settings" element={<Settings />} />
            <Route 
              path="admin/montadores" 
              element={
                <PermissionGate allowedRoles={[Role.MASTER]}>
                  <Montadores />
                </PermissionGate>
              } 
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;