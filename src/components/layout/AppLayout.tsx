import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthProvider";
import { Role } from "@/constants/domain";
import { PermissionGate } from "@/core/guards/PermissionGate";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
} from "lucide-react";

export default function AppLayout() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMaster = profile?.role === Role.MASTER;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/leads", label: "Leads", icon: Users },
    { path: "/products", label: "Produtos", icon: Package },
    { path: "/site", label: "Site", icon: Settings },
    ...(isMaster ? [{ path: "/admin/montadores", label: "Montadores", icon: Wrench }] : []),
    { path: "/settings", label: "Configurações", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Móveis Nascimento</h1>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t">
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-900">
                {profile?.name || "Usuário"}
              </div>
              <div className="text-xs text-gray-500">
                {profile?.role === Role.MASTER ? "Administrador" : "Vendedor"}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b">
          <h1 className="text-lg font-bold text-gray-900">Móveis Nascimento</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>
        </div>

        {/* Page content */}
        <div className="p-4 lg:p-8">
          <React.Suspense fallback={<div>Carregando...</div>}>
            <Outlet />
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}