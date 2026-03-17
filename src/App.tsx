import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/core/auth/AuthProvider";
import { RouteGuard } from "@/core/guards/RouteGuard";
import { PermissionGate } from "@/core/guards/PermissionGate";
import { Role } from "@/constants/domain";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/app/Login";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/app/Dashboard";
import Catalog from "./pages/app/Catalog";
import CRM from "./pages/app/CRM";
import Pipeline from "./pages/app/Pipeline";
import Users from "./pages/app/Users";
import Settings from "./pages/app/Settings";
import ProductsDashboard from "./pages/app/ProductsDashboard";
import NotFound from "./pages/NotFound";
import HomeNew from "./pages/HomeNew";
import About from "./pages/About";
import HomeHeroAdmin from "./pages/app/HomeHeroAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <route path="/catalog" element={<Index />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/sobre" element={<About />} />
            
            {/* NOVA HOME EM PARALELO - para visualização */}
            <Route path="/new-home" element={<HomeNew />} />
            
            {/* Login Route Alias */}
            <Route path="/login" element={<Navigate to="/app/login" replace />} />
            
            {/* Internal Routes */}
            <Route path="/app/login" element={<Login />} />
            
            {/* Protected Routes with AppShell */}
            <Route
              path="/app/*"
              element={
                <RouteGuard>
                  <AppShell />
                </RouteGuard>
              }
            >
              <Route path="dashboard" element={
                <PermissionGate allowedRoles={[Role.MASTER, Role.GESTOR]}>
                  <Dashboard />
                </PermissionGate>
              } />
              
              <Route path="catalog" element={
                <PermissionGate allowedRoles={[Role.MASTER, Role.GESTOR]}>
                  <Catalog />
                </PermissionGate>
              } />
              
              <Route path="crm" element={
                <PermissionGate allowedRoles={[Role.MASTER, Role.GESTOR]}>
                  <CRM />
                </PermissionGate>
              } />
              
              <Route path="pipeline" element={
                <HomeHeroAdmin />
              } />
              
              <Route path="products-dashboard" element={
                <PermissionGate allowedRoles={[Role.MASTER, Role.GIDOR]}>
                  <ProductsDashboard />
                </PermissionGate>
              } />
              
              <Route path="users" element={
                <PermissionGate allowedRoles={[Role.MASTER]}>
                  <Users />
                </PermissionGate>
              } />
              
              <Route path="settings" element={
                <PermissionGate allowedRoles={[Role.MASTER]}>
                  <Settings />
                </PermissionGate>
              } />
              
              {/* Default redirect for /app */}
              <Route index element={<Navigate to="/app/dashboard" replace />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="navigation" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;