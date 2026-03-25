import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Users, Package, FileText, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/app',
    icon: Home,
  },
  {
    label: 'Montadores',
    path: '/app/installers',
    icon: Users,
  },
  {
    label: 'Produtos',
    path: '/app/products',
    icon: Package,
  },
  {
    label: 'Pedidos',
    path: '/app/orders',
    icon: FileText,
  },
  {
    label: 'Serviços',
    path: '/app/services',
    icon: Wrench,
  },
  {
    label: 'Configurações',
    path: '/app/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  userRoles?: string[];
}

export default function Sidebar({ userRoles = [] }: SidebarProps) {
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => userRoles.includes(role));
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Admin</h1>
      </div>
      
      <nav className="px-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== '/app' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}