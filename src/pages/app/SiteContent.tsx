import React from 'react';

const SiteContent = () => {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Conteúdo do Site</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold text-lg">Home Hero</h2>
          <p className="text-sm text-gray-500">Configurar banner principal</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold text-lg">Ambientes</h2>
          <p className="text-sm text-gray-500">Gerenciar ambientes da home</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold text-lg">Banner Promocional</h2>
          <p className="text-sm text-gray-500">Configurar banner promocional</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold text-lg">Montadores</h2>
          <p className="text-sm text-gray-500">Em breve</p>
        </div>
      </div>
    </div>
  );
};

export default SiteContent;