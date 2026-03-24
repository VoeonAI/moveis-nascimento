import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { installerService, } from "@/services/installersService";
import { showError } from "@/utils/toast";

export function InstallersSection() {
  const [installers, setInstallers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInstallers = async () => {
    setLoading(true);
    try {
      const data = await installerService.getActiveInstallers();
      setInstallers(data);
    } catch (e) {
      console.error("[InstallersSection] loadInstallers error", e);
      showError("Erro ao carregar montadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstallers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Montadores</CardTitle>
          <CardDescription>Gerencie os montadores cadastrados no sistema.</CardDescription>
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
  );
}