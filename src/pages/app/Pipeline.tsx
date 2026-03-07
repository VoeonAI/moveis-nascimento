import React, { useEffect, useState } from 'react';
import { ordersService } from '@/services/ordersService';
import { adminService } from '@/services/adminService';
import { Order } from '@/types';
import { OrderStage, ORDER_STAGES_FLOW } from '@/constants/domain';
import { ORDER_STAGE_LABELS } from '@/constants/labels';
import { useAuth } from '@/core/auth/AuthProvider';
import { AlertCircle, RefreshCw, ArrowRight, Package, Calendar, MoreHorizontal, MapPin, Hash, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { showSuccess, showError } from '@/utils/toast';
import { HardDeleteConfirmDialog } from '@/components/HardDeleteConfirmDialog';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

type DeliveredPeriodType = 'all' | 'today' | 'last_7_days' | 'current_month' | 'last_month' | 'last_3_months';

const Pipeline = () => {
  const [ordersByStage, setOrdersByStage] = useState<Record<OrderStage, any>>({} as Record<OrderStage, any>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movingOrder, setMovingOrder] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const isMaster = profile?.role === 'master';

  // Delivered period filter
  const [deliveredPeriod, setDeliveredPeriod] = useState<DeliveredPeriodType>('all');

  // Hard Delete Modal
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [deletingEntity, setDeletingEntity] = useState<{ type: 'lead' | 'order', id: string, name: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.listOrdersByStage();
      setOrdersByStage(data);
    } catch (err: any) {
      console.error('[Pipeline] Failed to fetch orders:', err);
      const errorMessage = err?.message || err?.details || 'Erro ao carregar pedidos';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMoveStage = async (order: Order, targetStage: OrderStage) => {
    if (!user) return;
    
    setMovingOrder(order.id);
    
    try {
      await ordersService.updateOrderStage(
        order.id, 
        targetStage, 
        user.id, 
        `Movido para ${ORDER_STAGE_LABELS[targetStage]}`
      );
      showSuccess(`Pedido movido para ${ORDER_STAGE_LABELS[targetStage]}`);
      await fetchOrders();
    } catch (error: any) {
      console.error('[Pipeline] Failed to move stage:', error);
      const errorMessage = error?.message || error?.details || 'Erro ao mover pedido';
      showError(errorMessage);
    } finally {
      setMovingOrder(null);
    }
  };

  const handleHardDeleteOrder = (order: any) => {
    if (!isMaster) return;
    setDeletingEntity({ type: 'order', id: order.id, name: `Pedido #${order.id.slice(0, 8)}` });
    setHardDeleteDialogOpen(true);
  };

  const handleConfirmHardDelete = async () => {
    if (!deletingEntity) return;

    try {
      if (deletingEntity.type === 'lead') {
        await adminService.hardDeleteLead(deletingEntity.id);
        showSuccess('Lead excluído definitivamente com sucesso');
      } else if (deletingEntity.type === 'order') {
        await adminService.hardDeleteOrder(deletingEntity.id);
        showSuccess('Pedido excluído definitivamente com sucesso');
      }
      
      setHardDeleteDialogOpen(false);
      setDeletingEntity(null);
      
      // Reload data
      await fetchOrders();
    } catch (error: any) {
      console.error('[Pipeline] Failed to hard delete', error);
      const errorMessage = error?.message || 'Erro ao excluir';
      showError(errorMessage);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case OrderStage.ORDER_CREATED: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStage.PREPARING_ORDER: return 'bg-purple-100 text-purple-800 border-purple-200';
      case OrderStage.ASSEMBLY: return 'bg-orange-100 text-orange-800 border-orange-200';
      case OrderStage.READY_TO_SHIP: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStage.DELIVERY_ROUTE: return 'bg-teal-100 text-teal-800 border-teal-200';
      case OrderStage.DELIVERED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case OrderStage.CANCELED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter delivered orders by period
  const filterDeliveredByPeriod = (orders: any[]) => {
    if (deliveredPeriod === 'all') return orders;

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (deliveredPeriod) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'last_7_days':
        startDate = subDays(now, 7);
        endDate = now;
        break;
      case 'current_month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last_month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last_3_months':
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      default:
        return orders;
    }

    return orders.filter((order) => {
      if (!order.delivered_at) return false;
      const deliveredDate = new Date(order.delivered_at);
      return isWithinInterval(deliveredDate, { start: startDate, end: endDate });
    });
  };

  const getDeliveredPeriodLabel = (period: DeliveredPeriodType) => {
    const labels: Record<DeliveredPeriodType, string> = {
      all: 'Todos',
      today: 'Hoje',
      last_7_days: 'Últimos 7 dias',
      current_month: 'Mês atual',
      last_month: 'Mês anterior',
      last_3_months: 'Últimos 3 meses',
    };
    return labels[period];
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pipeline de Pedidos</h1>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ORDER_STAGES_FLOW.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border flex flex-col max-h-[calc(100vh-140px)]">
            {/* Stage Header */}
            <div className={`p-4 border-b rounded-t-lg ${getStageColor(stage)}`}>
              <h2 className="font-semibold text-center">
                {ORDER_STAGE_LABELS[stage]}
              </h2>
              <div className="text-center text-sm mt-1 opacity-75">
                {ordersByStage[stage]?.length || 0} pedidos
              </div>
              
              {/* Delivered Period Filter - only for Delivered stage */}
              {stage === OrderStage.DELIVERED && (
                <div className="mt-3">
                  <Select value={deliveredPeriod} onValueChange={(value) => setDeliveredPeriod(value as DeliveredPeriodType)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
                      <SelectItem value="current_month">Mês atual</SelectItem>
                      <SelectItem value="last_month">Mês anterior</SelectItem>
                      <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {(stage === OrderStage.DELIVERED 
                ? filterDeliveredByPeriod(ordersByStage[stage] || [])
                : ordersByStage[stage])?.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  Nenhum pedido
                </div>
              ) : (
                (stage === OrderStage.DELIVERED
                  ? filterDeliveredByPeriod(ordersByStage[stage] || [])
                  : ordersByStage[stage])?.map((order: any) => {
                  // Fallback logic for customer name
                  const displayName = order.customer_name ?? order.opportunities?.leads?.name ?? 'Cliente não informado';
                  
                  return (
                    <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        {/* Order Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Hash size={16} className="text-gray-500" />
                            <span className="font-bold text-sm">#{order.id.slice(0, 8)}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            R$ {(order.total_value ?? 0).toFixed(2)}
                          </Badge>
                        </div>

                        {/* Customer Info */}
                        <div className="text-sm">
                          <span className="text-gray-500">Cliente: </span>
                          <span className="font-medium">{displayName}</span>
                        </div>

                        {/* Internal Code */}
                        {order.internal_code && (
                          <div className="text-sm">
                            <span className="text-gray-500">Código: </span>
                            <span className="font-mono text-xs">{order.internal_code}</span>
                          </div>
                        )}

                        {/* Delivery Address */}
                        {order.delivery_address && (
                          <div className="text-sm">
                            <span className="text-gray-500">Entrega: </span>
                            <span className="text-xs line-clamp-1">{order.delivery_address}</span>
                          </div>
                        )}

                        {/* Product Name */}
                        {order.opportunities?.products?.name && (
                          <div className="text-sm">
                            <span className="text-gray-500">Produto: </span>
                            <span className="font-medium truncate block" title={order.opportunities.products.name}>
                              {order.opportunities.products.name}
                            </span>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                            {order.notes}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 items-center justify-between">
                          {stage !== OrderStage.DELIVERED && stage !== OrderStage.CANCELED && (
                            <Button
                              onClick={() => {
                                const currentIndex = ORDER_STAGES_FLOW.indexOf(stage);
                                if (currentIndex !== -1 && currentIndex < ORDER_STAGES_FLOW.length - 1) {
                                  handleMoveStage(order, ORDER_STAGES_FLOW[currentIndex + 1]);
                                }
                              }}
                              disabled={movingOrder === order.id}
                              size="sm"
                              className="flex-1"
                              variant="outline"
                            >
                              {movingOrder === order.id ? (
                                'Movendo...'
                              ) : (
                                <>
                                  Avançar
                                  <ArrowRight size={14} className="ml-2" />
                                </>
                              )}
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={movingOrder === order.id}
                              >
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {ORDER_STAGES_FLOW.map((targetStage) => (
                                targetStage !== stage && (
                                  <DropdownMenuItem
                                    key={targetStage}
                                    onClick={() => handleMoveStage(order, targetStage)}
                                  >
                                    {ORDER_STAGE_LABELS[targetStage]}
                                  </DropdownMenuItem>
                                )
                              ))}
                              {isMaster && (
                                <DropdownMenuItem 
                                  onClick={() => handleHardDeleteOrder(order)}
                                  className="text-red-600 font-semibold"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Excluir Definitivamente
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
      
      <HardDeleteConfirmDialog
        open={hardDeleteDialogOpen}
        onClose={() => setHardDeleteDialogOpen(false)}
        onConfirm={handleConfirmHardDelete}
        entityType={deletingEntity?.type === 'lead' ? 'Lead' : 'Pedido'}
        entityName={deletingEntity?.name}
      />
    </div>
  );
};

export default Pipeline;