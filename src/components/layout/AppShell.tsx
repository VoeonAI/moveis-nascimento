import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import { PermissionGate } from '@/core/guards/PermissionGate';
import { Role } from '@/constants/domain';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  ArrowRightLeft,
  Menu,
  X,
  LogOut,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const sidebarItems = [
  {
    path: '/app/site',
    label: 'Conteúdo do Site',
    icon: LayoutDashboard,
    roles: [Role.MASTER, Role.GESTOR],
  },
  { 
    path: '/app/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    roles: [Role.MASTER, Role.GESTOR]
  },
  { 
    path: '/app/catalog', 
    label: 'Catálogo', 
    icon: Package,
    roles: [Role.MASTER, Role.GESTOR]
  },
  { 
    path: '/app/crm', 
    label: 'CRM', 
    icon: Users,
    roles: [Role.MASTER, Role.GESTOR]
  },
  { 
    path: '/app/pipeline', 
    label: 'Pipeline', 
    icon: ArrowRightLeft,
    roles: [Role.MASTER, Role.GESTOR, Role.ESTOQUE]
  },
  { 
    path: '/app/products-dashboard', 
    label: 'Inteligência de Produtos', 
    icon: BarChart3,
    roles: [Role.MASTER, Role.GESTOR]
  },
  { 
    path: '/app/users', 
    label: 'Usuários', 
    icon: Users,
    roles: [Role.MASTER]
  },
  { 
    path: '/app/installers', 
    label: 'Montadores', 
    icon: Users,
    roles: [Role.MASTER, Role.GESTOR]
  },
  { 
    path: '/app/settings', 
    label: 'Configurações', 
    icon: Settings,
    roles: [Role.MASTER]
  },
];

const AppShell = () => {
  const { profile, signOut, profileLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Painel</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b">
              <img
                src="https://kbpkdnptzvsvoujirfwe.supabase.co/storage/v1/object/public/logo-variacoes/Moveis-nascimento---logo-site.png"
                alt="Móveis Nascimento"
                className="h-12 w-auto"
              />
            </div>

            {/* Profile Warning - só mostra se não está carregando E profile é null */}
            {!profileLoading && !profile && (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Perfil não configurado. Contate o administrador.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {profileLoading ? (
                // Skeleton enquanto carrega profile
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : (
                // Renderiza menu filtrado por role
                <>
                  {sidebarItems.map((item) => (
                    <PermissionGate
                      key={item.path}
                      allowedRoles={item.roles}
                      fallback={null}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg
                          transition-colors
                          ${location.pathname === item.path
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    </PermissionGate>
                  ))}
                  
                  {/* Placeholder quando profile é null (não deve ocorrer com trigger) */}
                  {!profile && (
                    <div className="px-4 py-3 text-sm text-gray-500 italic">
                      Menu indisponível - aguarde configuração
                    </div>
                  )}
                </>
              )}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t">
              {profileLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {profile?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {profile?.role || 'Sem role'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={signOut}
                  >
                    <LogOut size={16} className="mr-2" />
                    Sair
                  </Button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;