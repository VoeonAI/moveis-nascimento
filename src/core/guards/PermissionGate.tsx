import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Role } from '@/constants/domain';

interface PermissionGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { profile } = useAuth();

  if (!profile) {
    return <>{fallback}</>;
  }

  const hasPermission = allowedRoles.includes(profile.role);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};