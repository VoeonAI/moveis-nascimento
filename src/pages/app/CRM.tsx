import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CRM = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">CRM</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Leads e Oportunidades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Módulo de CRM em desenvolvimento. Em breve você poderá:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Visualizar todos os leads</li>
            <li>• Gerenciar oportunidades</li>
            <li>• Mover leads entre estágios</li>
            <li>• Adicionar notas e interações</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRM;