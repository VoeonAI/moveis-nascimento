import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Role } from '@/constants/domain';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  allowedRoles,
  children,
  fallback = (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-md">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>
          Seu perfil não tem permissão para acessar esta página.
        </AlertDescription>
      </Alert>
    </div>
  ),
}) => {
  const { profile } = useAuth();

  if (!profile) {
    return <>{fallback}</>;
  }

  const hasPermission = allowedRoles.includes(profile.role);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
