import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, MapPin, Phone, Loader2 } from 'lucide-react';
import { installerService } from '@/services/installersService';

export default function Montadores() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstallers();
  }, []);

  const loadInstallers = async () => {
    setLoading(true);
    try {
      const data = await installerService.getActiveInstallers();
      setInstallers(data);
    } catch (error) {
      console.error('[Montadores] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (phone: string, name: string) => {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}, gostaria de solicitar seus serviços de montagem.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nossos Montadores</h1>
          <p className="text-lg text-gray-600">
            Entre em contato diretamente com nossos montadores parceiros
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : installers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum montador disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {installers.map((installer) => (
              <Card key={installer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {installer.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} />
                        <span>{installer.city || 'Cidade não informada'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={16} />
                      <span>{installer.phone}</span>
                    </div>

                    <Button
                      onClick={() => handleWhatsAppClick(installer.phone, installer.name)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle size={18} className="mr-2" />
                      Chamar no WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}