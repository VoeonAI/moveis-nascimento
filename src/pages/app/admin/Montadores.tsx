import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users } from "lucide-react";
import { installersService, Installer } from "@/services/installersService";
import { showError } from "@/utils/toast";

export default function Montadores() {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInstallers = async () => {
    setLoading(true);
    try {
      const data = await installersService.getActiveInstallers();
      setInstallers(data);
    } catch (e) {
      console.error("[Montadores] loadInstallers error", e);
      showError("Erro ao carregar montadores");
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
          <p className="text-gray-600 text-sm mt-1">Gerencie os montadores cadastrados no sistema</p>
        </div>
        <Button onClick={loadInstallers} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Montadores Cadastrados</CardTitle>
              <CardDescription>Lista de montadores ativos no sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-500 py-8">Carregando montadores...</div>
          ) : installers.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">
              Nenhum montador cadastrado.
            </div>
          ) : (
            <div className="space-y-3">
              {installers.map((installer) => (
                <div key={installer.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold">{installer.name}</div>
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