import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, loading, profile, error, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout de 3 segundos para loading infinito (fallback)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Handle timeout error do AuthProvider
  if (error === 'timeout') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mb-4">Tempo limite excedido</AlertDescription>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw size={14} className="mr-2" />
                Recarregar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={async () => {
                  await signOut();
                  navigate('/app/login');
                }}
              >
                <LogOut size={14} className="mr-2" />
                Sair
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/login" replace />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mb-2">
              {loadingTimeout 
                ? 'Tempo limite excedido. Recarregue a página.'
                : 'Perfil não configurado. Contate o administrador.'}
            </AlertDescription>
            {!loadingTimeout && (
              <AlertDescription className="text-xs font-mono mt-2">
                ID do usuário: {user.id}
              </AlertDescription>
            )}
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};