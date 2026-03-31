import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RefreshCw, Users, Plus, Loader2 } from 'lucide-react';
import { installersService } from '@/services/installersService';
import { showSuccess, showError } from '@/utils/toast';

export default function Installers() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
  });
  const [saving, setSaving] = useState(false);

  const loadInstallers = async () => {
    setLoading(true);
    try {
      const data = await installersService.getActiveInstallers();
      setInstallers(data);
    } catch (error) {
      console.error('[Installers] Erro ao carregar:', error);
      showError('Erro ao carregar montadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstallers();
  }, []);

  const handleOpenModal = () => {
    setFormData({ name: '', phone: '', city: '' });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({ name: '', phone: '', city: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Nome é obrigatório');
      return;
    }
    
    if (!formData.phone.trim()) {
      showError('Telefone é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await installersService.createInstaller({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim() || undefined,
      });
      
      showSuccess('Montador cadastrado com sucesso');
      setModalOpen(false);
      setFormData({ name: '', phone: '', city: '' });
      await loadInstallers();
    } catch (error: any) {
      console.error('[Installers] Erro ao salvar:', error);
      showError(error.message || 'Erro ao cadastrar montador');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await installersService.toggleInstallerStatus(id, false);
      showSuccess('Montador desativado com sucesso');
      await loadInstallers();
    } catch (error: any) {
      console.error('[Installers] Erro ao desativar:', error);
      showError(error.message || 'Erro ao desativar montador');
    }
  };
  
  return (
    
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Montadores</h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie os montadores cadastrados no sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadInstallers} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleOpenModal}>
            <Plus size={16} className="mr-2" />
            Novo Montador
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Montadores Cadastrados
              </CardTitle>
              <CardDescription>
                {installers.length} montador{installers.length !== 1 ? 'es' : ''} cadastrado{installers.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : installers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum montador cadastrado.
            </div>
          ) : (
            <div className="space-y-3">
              {installers.map((installer) => (
                <div key={installer.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold text-gray-900">{installer.name}</div>
                        <Badge variant={installer.active ? "default" : "secondary"}>
                          {installer.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="text-gray-500">Telefone:</span> {installer.phone}
                      </div>
                      {installer.city && (
                        <div className="text-sm text-gray-600">
                          <span className="text-gray-500">Cidade:</span> {installer.city}
                        </div>
                      )}
                    </div>
                    {installer.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(installer.id)}
                      >
                        Desativar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cadastro */}
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Montador</DialogTitle>
            <DialogDescription>
              Cadastre um novo montador no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="installer_name">Nome *</Label>
              <Input
                id="installer_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do montador"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installer_phone">Telefone *</Label>
              <Input
                id="installer_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installer_city">Cidade</Label>
              <Input
                id="installer_city"
                value={formData.city}
                onChange={((e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: São Paulo"
                disabled={saving}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}