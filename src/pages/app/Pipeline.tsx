import React, { useEffect, useState } from 'react';
import { ordersService } from '@/services/ordersService';
import { Order } from '@/types';
import { OrderStage, ORDER_STAGES_FLOW } from '@/constants/domain';
import { useAuth } from '@/core/auth/AuthProvider';
import { RouteGuard } from '@/core/guards/RouteGuard';
import { PermissionGate } from '@/core/guards/PermissionGate';
import { Role } from '@/constants/domain';

const Pipeline = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    ordersService.listOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMoveStage = async (orderId: string, currentStage: OrderStage) => {
    if (!user) return;
    
    const currentIndex = ORDER_STAGES_FLOW.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= ORDER_STAGES_FLOW.length - 1) return;

    const nextStage = ORDER_STAGES_FLOW[currentIndex + 1];
    
    try {
      await ordersService.moveOrderStage(orderId, nextStage, user.id);
      // Refresh list
      const updated = await ordersService.listOrders();
      setOrders(updated);
    } catch (error) {
      console.error('Failed to move stage:', error);
      alert('Erro ao mover pedido');
    }
  };

  if (loading) return <div className="p-8">Carregando Pipeline...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Pipeline de Pedidos</h1>
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ORDER_STAGES_FLOW.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 border">
            <h2 className="font-semibold mb-4 capitalize text-center border-b pb-2">
              {stage.replace(/_/g, ' ')}
            </h2>
            <div className="space-y-3">
              {orders
                .filter((o) => o.stage === stage)
                .map((order) => (
                  <div key={order.id} className="bg-white p-3 rounded shadow-sm border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm">#{order.id.slice(0, 8)}</span>
                      <span className="text-green-600 font-bold">
                        R$ {order.total_value.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Criado em: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    
                    <PermissionGate 
                      allowedRoles={[Role.MASTER, Role.GESTOR, Role.ESTOQUE]}
                      fallback={<div className="text-xs text-gray-400">Sem permissão</div>}
                    >
                      <button
                        onClick={() => handleMoveStage(order.id, order.stage)}
                        className="w-full bg-blue-50 text-blue-600 text-xs py-1 rounded hover:bg-blue-100"
                      >
                        Avançar →
                      </button>
                    </PermissionGate>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Wrapper to ensure protection
const ProtectedPipeline = () => (
  <RouteGuard>
    <Pipeline />
  </RouteGuard>
);

export default ProtectedPipeline;