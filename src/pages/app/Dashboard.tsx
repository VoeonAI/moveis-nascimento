import React, { useEffect, useState } from 'react';
import { dashboardService, DashboardMetrics } from '@/services/dashboardService';
import { LayoutDashboard, Users, ArrowRightLeft, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalActiveProducts: 0,
    leadsByStatus: {},
    ordersByStage: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getMetrics()
      .then(setMetrics)
      .catch(() => {
        // Keep default values on error
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalLeads = Object.values(metrics.leadsByStatus).reduce((a, b) => a + b, 0);
  const totalOrders = Object.values(metrics.ordersByStage).reduce((a, b) => a + b, 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActiveProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.leadsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{status.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {Object.keys(metrics.leadsByStatus).length === 0 && (
                <p className="text-sm text-gray-500">Nenhum lead ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.ordersByStage).map(([stage, count]) => (
                <div key={stage} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{stage.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {Object.keys(metrics.ordersByStage).length === 0 && (
                <p className="text-sm text-gray-500">Nenhum pedido ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;