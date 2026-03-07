import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Truck, Package, RefreshCw, Hash, Clock, ArrowRight } from 'lucide-react';
import { PipelineRadar } from '@/services/pipelineIntelligenceService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ORDER_STAGE_LABELS } from '@/constants/labels';

interface PipelineRadarProps {
  radar: PipelineRadar;
  loading: boolean;
  onRefresh: () => void;
}

export const PipelineRadar: React.FC<PipelineRadarProps> = ({ radar, loading, onRefresh }) => {
  const formatTimeSinceUpdate = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 dia';
    if (diffDays < 7) return `${diffDays} dias`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
    return `${Math.floor(diffDays / 30)} meses`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Radar de Pipeline</h2>
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Radar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pedidos Travados */}
        <Link to="/app/pipeline?stuck=true">
          <Card className="border-red-200 bg-red-50 hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-red-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" />
                  Pedidos Travados
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 mb-2">
                {radar.stuckOrdersCount}
              </div>
              <p className="text-xs text-gray-600 mb-3">muito tempo no mesmo estágio</p>
              {radar.stuckOrders.length > 0 && (
                <div className="space-y-2">
                  {radar.stuckOrders.slice(0, 2).map((order) => (
                    <div key={order.id} className="text-sm">
                      <div className="flex items-center gap-1">
                        <Hash size={10} className="text-gray-500" />
                        <span className="font-medium">
                          {order.internal_code || `#${order.id.slice(0, 8)}`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock size={10} />
                        há {formatTimeSinceUpdate(order.updated_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ORDER_STAGE_LABELS[order.current_stage as keyof typeof ORDER_STAGE_LABELS] || order.current_stage}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Entregas Atrasadas */}
        <Link to="/app/pipeline?stage=delivery_route&delayed=true">
          <Card className="border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-yellow-700">
                <div className="flex items-center gap-2">
                  <Truck size={20} className="text-yellow-500" />
                  Entregas Atrasadas
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {radar.delayedDeliveriesCount}
              </div>
              <p className="text-xs text-gray-600 mb-3">em rota há 2+ dias</p>
              {radar.delayedDeliveries.length > 0 && (
                <div className="space-y-2">
                  {radar.delayedDeliveries.slice(0, 2).map((order) => (
                    <div key={order.id} className="text-sm">
                      <div className="flex items-center gap-1">
                        <Hash size={10} className="text-gray-500" />
                        <span className="font-medium">
                          {order.internal_code || `#${order.id.slice(0, 8)}`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {order.customer_name || 'Cliente não informado'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Pedidos Aguardando Ação */}
        <Link to="/app/pipeline?stage=order_created&pending=true">
          <Card className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-blue-700">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-blue-500" />
                  Pedidos Aguardando
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {radar.pendingOrdersCount}
              </div>
              <p className="text-xs text-gray-600 mb-3">criados há 24+ horas</p>
              {radar.pendingOrders.length > 0 && (
                <div className="space-y-2">
                  {radar.pendingOrders.slice(0, 2).map((order) => (
                    <div key={order.id} className="text-sm">
                      <div className="flex items-center gap-1">
                        <Hash size={10} className="text-gray-500" />
                        <span className="font-medium">
                          {order.internal_code || `#${order.id.slice(0, 8)}`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {order.customer_name || 'Cliente não informado'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};