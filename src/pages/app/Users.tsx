import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Users = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Módulo de usuários em desenvolvimento. Em breve você poderá:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>• Listar todos os usuários</li>
            <li>• Criar novos usuários</li>
            <li>• Editar permissões e roles</li>
            <li>• Ativar/desativar contas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;