import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, LogOut, User, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, loading, profile, error, profileError, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [copied, setCopied] = useState(false);

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
            <AlertTitle>Tempo limite excedido</AlertTitle>
            <AlertDescription className="mb-4">
              Não foi possível conectar ao servidor de autenticação.
            </AlertDescription>
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
                  navigate('/login');
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
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    // Mostrar user.id para facilitar debug (sem dados sensíveis)
    const userIdShort = user.id.slice(0, 8);
    
    // Determinar mensagem técnica baseada no erro
    const technicalReason = profileError?.details?.category || 
      (profileError?.code === 'PGRST116' ? 'Perfil não existe no banco de dados' : 
      profileError?.message || 'Erro desconhecido');

    // Criar objeto de diagnóstico para cópia
    const diagnosticData = {
      userId: user.id,
      errorCode: profileError?.code || 'UNKNOWN',
      errorMessage: profileError?.message || 'No error details',
      category: profileError?.details?.category || 'unknown',
    };

    const copyDiagnostics = async () => {
      const diagnosticText = JSON.stringify(diagnosticData, null, 2);
      await navigator.clipboard.writeText(diagnosticText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <User className="h-4 w-4" />
            <AlertTitle>Perfil não configurado</AlertTitle>
            <AlertDescription className="mt-2">
              {loadingTimeout 
                ? 'Tempo limite excedido. Recarregue a página.'
                : 'Seu usuário não possui um perfil configurado no sistema.'}
            </AlertDescription>
            
            {/* Motivo técnico */}
            {profileError && (
              <AlertDescription className="mt-3 text-xs font-mono bg-red-950/30 p-2 rounded">
                <span className="text-red-400">Motivo técnico:</span> {technicalReason}
              </AlertDescription>
            )}

            {/* ID do usuário */}
            <AlertDescription className="text-xs mt-2 font-mono">
              ID do usuário: ...{userIdShort}
            </AlertDescription>

            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} className="mr-2" />
                Recarregar
              </Button>
              
              {/* Botão de copiar diagnóstico */}
              {profileError && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={copyDiagnostics}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="mr-2" />
                      Copiar diagnóstico
                    </>
                  )}
                </Button>
            )}
            
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                await signOut();
                navigate('/login');
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

  return <>{children}</>;
};