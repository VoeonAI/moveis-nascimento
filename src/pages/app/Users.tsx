import React, { useEffect, useState } from 'react';
import { usersService, UserProfile } from '@/services/usersService';
import { Role } from '@/constants/domain';
import { useAuth } from '@/core/auth/AuthProvider';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, User as UserIcon, Check, X, RefreshCw } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Temporary state for role changes
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, Role>>({});
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    newRole: Role;
  }>({ open: false, userId: '', userName: '', newRole: Role.GESTOR });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.listAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('[Users] Failed to load users', error);
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, role: Role) => {
    setPendingRoleChanges(prev => ({ ...prev, [userId]: role }));
  };

  const handleSaveRole = async (userId: string) => {
    const newRole = pendingRoleChanges[userId];
    if (!newRole) return;

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Require confirmation for master role
    if (newRole === Role.MASTER) {
      setConfirmDialog({
        open: true,
        userId,
        userName: `ID: ${userId.slice(0, 8)}...`,
        newRole,
      });
      return;
    }

    await executeRoleChange(userId, newRole);
  };

  const executeRoleChange = async (userId: string, role: Role) => {
    setUpdatingUserId(userId);
    try {
      await usersService.setUserRole(userId, role);
      showSuccess(`Role atualizado para ${role}`);
      
      // Clear pending change and refresh
      setPendingRoleChanges(prev => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
      
      await loadUsers();
    } catch (error: any) {
      console.error('[Users] Failed to update role', error);
      showError(error.message || 'Erro ao atualizar role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmMaster = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
    executeRoleChange(confirmDialog.userId, confirmDialog.newRole);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case Role.MASTER: return 'bg-purple-100 text-purple-800';
      case Role.GESTOR: return 'bg-blue-100 text-blue-800';
      case Role.ESTOQUE: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case Role.MASTER: return 'Master';
      case Role.GESTOR: return 'Gestor';
      case Role.ESTOQUE: return 'Estoque';
      default: return role;
    }
  };

  const isCurrentUser = (userId: string) => {
    return currentUser?.id === userId;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie as permissões e roles dos usuários do sistema
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            Total de {users.length} usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon size={20} className="text-gray-500" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {isCurrentUser(user.id) ? 'Você' : `ID: ${user.id.slice(0, 8)}...`}
                        </span>
                        {isCurrentUser(user.id) && (
                          <Badge variant="outline" className="text-xs">
                            Eu
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Criado em {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Current Role */}
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>

                  {/* Role Selector */}
                  {!isCurrentUser(user.id) && (
                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={pendingRoleChanges[user.id] ?? user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Role.GESTOR}>Gestor</SelectItem>
                          <SelectItem value={Role.ESTOQUE}>Estoque</SelectItem>
                          <SelectItem value={Role.MASTER}>Master</SelectItem>
                        </SelectContent>
                      </Select>

                      {pendingRoleChanges[user.id] && pendingRoleChanges[user.id] !== user.role && (
                        <Button
                          onClick={() => handleSaveRole(user.id)}
                          disabled={updatingUserId === user.id}
                          size="sm"
                          variant="default"
                        >
                          {updatingUserId === user.id ? (
                            'Salvando...'
                          ) : (
                            <>
                              <Check size={14} className="mr-1" />
                              Salvar
                            </>
                          )}
                        </Button>
                      )}

                      {pendingRoleChanges[user.id] && pendingRoleChanges[user.id] !== user.role && (
                        <Button
                          onClick={() => handleRoleChange(user.id, user.role)}
                          disabled={updatingUserId === user.id}
                          size="sm"
                          variant="ghost"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  )}

                  {isCurrentUser(user.id) && (
                    <div className="ml-4 text-sm text-gray-400 italic">
                      Não é possível alterar seu próprio role
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Master Role */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar promoção a Master</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a promover o usuário <strong>{confirmDialog.userName}</strong> ao nível de acesso <strong>Master</strong>.
              <br /><br />
              Esta ação concede permissões administrativas completas, incluindo a gestão de outros usuários.
              <br /><br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMaster}>
              Confirmar Promoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;