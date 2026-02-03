import React, { useEffect, useState } from 'react';
import { ordersService } from '@/services/ordersService';
import { Order } from '@/types';
import { OrderStage, ORDER_STAGES_FLOW } from '@/constants/domain';
import { useAuth } from '@/core/auth/AuthProvider';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Pipeline = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.listOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('[Pipeline] Failed to fetch orders:', err);
      const message = err?.message || 'Erro ao carregar pedidos';
      
      // Tratamento específico para erros de permissão
      if (message.includes('401') || message.includes('403') || message.includes('permission')) {
        setError('Você não tem permissão para acessar esta página.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMoveStage = async (orderId: string, currentStage: OrderStage) => {
    if (!user) return;
    
    const currentIndex = ORDER_STAGES_FLOW.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= ORDER_STAGES_FLOW.length - 1) return;

    const nextStage = ORDER_STAGES_FLOW[currentIndex + 1];
    
    try {
      await ordersService.moveOrderStage(orderId, nextStage, user.id);
      await fetchOrders();
    } catch (error) {
      console.error('[Pipeline] Failed to move stage:', error);
      alert('Erro ao mover pedido');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mb-4">{error}</AlertDescription>
          <Button size="sm" variant="outline" onClick={fetchOrders}>
            <RefreshCw size={14} className="mr-2" />
            Tentar novamente
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
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
                    <button
                      onClick={() => handleMoveStage(order.id, order.stage)}
                      className="w-full bg-blue-50 text-blue-600 text-xs py-1 rounded hover:bg-blue-100"
                    >
                      Avançar →
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipeline;