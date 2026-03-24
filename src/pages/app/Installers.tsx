import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Phone, MapPin, Users } from 'lucide-react';
import { installerService } from '@/services/installersService';
import { showError } from '@/utils/toast';

export default function Installers() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInstallers = async () => {
    setLoading(true);
    try {
      const data = await installerService.getActiveInstallers();
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Montadores</h1>
          <p className="text-gray-600 text-sm mt-1">Lista de montadores ativos</p>
        </div>
        <Button onClick={loadInstallers} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Montadores Cadastrados
          </CardTitle>
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
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{installer.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone size={14} />
                          {installer.phone}
                        </div>
                        {installer.city && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            {installer.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}