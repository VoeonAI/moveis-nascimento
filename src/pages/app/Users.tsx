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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, User as UserIcon, Check, X, RefreshCw, Plus, Eye, EyeOff, AlertTriangle 
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  
  // Temporary state for role changes
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, Role>>({});
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    newRole: Role;
  }>({ open: false, userId: '', userName: '', newRole: Role.GESTOR });

  // Create User Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.GESTOR,
    must_change_password: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.listProfiles();
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
        userName: getUserName(targetUser),
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

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    // Não permitir desativar o próprio usuário
    if (!isActive && isCurrentUser(userId)) {
      showError('Você não pode desativar seu próprio usuário');
      return;
    }

    if (!confirm(`Tem certeza que deseja ${isActive ? 'ativar' : 'desativar'} este usuário?`)) {
      return;
    }

    try {
      await usersService.updateProfileFlags(userId, { is_active: isActive });
      showSuccess(`Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`);
      await loadUsers();
    } catch (error: any) {
      console.error('[Users] Failed to toggle active status', error);
      showError(error.message || 'Erro ao atualizar status');
    }
  };

  const handleForcePasswordChange = async (userId: string) => {
    if (!confirm('Tem certeza que deseja forçar este usuário a alterar a senha no próximo login?')) {
      return;
    }

    try {
      await usersService.updateProfileFlags(userId, { must_change_password: true });
      showSuccess('Usuário precisará alterar a senha no próximo login');
      await loadUsers();
    } catch (error: any) {
      console.error('[Users] Failed to force password change', error);
      showError(error.message || 'Erro ao forçar troca de senha');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.name.trim() || !createFormData.email.trim() || !createFormData.password.trim()) {
      showError('Nome, email e senha são obrigatórios');
      return;
    }

    if (createFormData.password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setCreatingUser(true);
    try {
      await usersService.createUser({
        name: createFormData.name,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role,
        must_change_password: createFormData.must_change_password,
      });

      showSuccess('Usuário criado com sucesso');
      setCreateModalOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: Role.GESTOR,
        must_change_password: true,
      });
      await loadUsers();
    } catch (error: any) {
      console.error('[Users] Failed to create user', error);
      showError(error.message || 'Erro ao criar usuário');
    } finally {
      setCreatingUser(false);
    }
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

  const getUserName = (user: UserProfile) => {
    // Fallback: name → email → id reduzido
    if (user.name) {
      return user.name;
    }
    if (user.email) {
      return user.email;
    }
    return `ID: ${user.id.slice(0, 8)}...`;
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
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Lista de Usuários
            </CardTitle>
            <Button
              onClick={() => setShowInactive(!showInactive)}
              variant={showInactive ? "default" : "outline"}
              size="sm"
            >
              {showInactive ? "Ver Ativos" : "Ver Desativados"}
            </Button>
          </div>
          <CardDescription>
            {showInactive 
              ? `${users.filter(u => u.is_active === false).length} usuários desativados`
              : `${users.filter(u => u.is_active !== false).length} usuários ativos`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const filteredUsers = showInactive 
              ? users.filter(u => u.is_active === false)
              : users.filter(u => u.is_active !== false);

            if (filteredUsers.length === 0) {
              return (
                <div className="text-center py-12 text-gray-500">
                  {showInactive ? 'Nenhum usuário desativado' : 'Nenhum usuário ativo'}
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
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
                            {isCurrentUser(user.id) ? 'Você' : getUserName(user)}
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

                      {/* Status Badges */}
                      <div className="flex gap-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {user.is_active === false && (
                          <Badge variant="destructive" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                        {user.must_change_password && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            Trocar Senha
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {!isCurrentUser(user.id) && (
                        <>
                          {/* Role Selector */}
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

                          {/* Toggle Active */}
                          <Button
                            onClick={() => handleToggleActive(user.id, user.is_active !== false)}
                            disabled={updatingUserId === user.id}
                            size="sm"
                            variant={user.is_active === false ? "default" : "outline"}
                            title={user.is_active === false ? "Ativar usuário" : "Desativar usuário"}
                          >
                            {user.is_active === false ? "Reativar" : "Desativar"}
                          </Button>

                          {/* Force Password Change */}
                          {!user.must_change_password && !showInactive && (
                            <Button
                              onClick={() => handleForcePasswordChange(user.id)}
                              disabled={updatingUserId === user.id}
                              size="sm"
                              variant="ghost"
                              title="Forçar troca de senha"
                            >
                             <AlertTriangle size={14} />
                            </Button>
                          )}
                        </>
                      )}

                      {isCurrentUser(user.id) && (
                        <div className="ml-4 text-sm text-gray-400 italic">
                          Não é possível alterar seus próprios dados
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
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

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário para acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="create_name">Nome *</Label>
              <Input
                id="create_name"
                type="text"
                placeholder="Nome completo"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                disabled={creatingUser}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_email">Email *</Label>
              <Input
                id="create_email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                disabled={creatingUser}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_password">Senha *</Label>
              <div className="relative">
                <Input
                  id="create_password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  disabled={creatingUser}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create_role">Role *</Label>
              <Select
                value={createFormData.role}
                onValueChange={(value) => setCreateFormData({ ...createFormData, role: value as Role })}
                disabled={creatingUser}
              >
                <SelectTrigger id="create_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.GESTOR}>Gestor</SelectItem>
                  <SelectItem value={Role.ESTOQUE}>Estoque</SelectItem>
                  <SelectItem value={Role.MASTER}>Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="must_change_password"
                checked={createFormData.must_change_password}
                onCheckedChange={(checked) => setCreateFormData({ ...createFormData, must_change_password: checked })}
                disabled={creatingUser}
              />
              <Label htmlFor="must_change_password" className="cursor-pointer">
                Exigir troca de senha no primeiro acesso
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={creatingUser}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creatingUser}>
                {creatingUser ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;