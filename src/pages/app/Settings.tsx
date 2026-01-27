import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Módulo de configurações em desenvolvimento. Em breve você poderá:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Gerenciar webhooks</li>
            <li>• Configurar integrações</li>
            <li>• Ver logs do sistema</li>
            <li>• Configurar tokens de API</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;