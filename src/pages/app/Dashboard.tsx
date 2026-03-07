import React, { useEffect, useState } from 'react';
import { dashboardService, DashboardMetrics, OpportunityFunnel, OrdersPipeline, EvolutionData } from '@/services/dashboardService';
import { LayoutDashboard, Users, TrendingUp, TrendingDown, Package, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalActiveProducts: 0,
    leadsByStatus: {},
    ordersByStage: {},
    leadsInPeriod: 0,
    activeOpportunities: 0,
    wonInPeriod: 0,
    lostInPeriod: 0,
    deliveredInPeriod: 0,
  });
  const [opportunityFunnel, setOpportunityFunnel] = useState<OpportunityFunnel[]>([]);
  const [ordersPipeline, setOrdersPipeline] = useState<OrdersPipeline[]>([]);
  const [evolution, setEvolution] = useState<EvolutionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, funnelData, pipelineData, evolutionData] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getOpportunityFunnel(),
        dashboardService.getOrdersPipeline(),
        dashboardService.getEvolutionByPeriod(),
      ]);
      setMetrics(metricsData);
      setOpportunityFunnel(funnelData);
      setOrdersPipeline(pipelineData);
      setEvolution(evolutionData);
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const wonLostData = [
    { name: 'Ganhos', value: metrics.wonInPeriod, color: COLORS.success },
    { name: 'Perdidas', value: metrics.lostInPeriod, color: COLORS.danger },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads (30 dias)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leadsInPeriod}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeOpportunities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos (30 dias)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.wonInPeriod}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdidas (30 dias)</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.lostInPeriod}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues (30 dias)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.deliveredInPeriod}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Funil de Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunityFunnel.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={opportunityFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ganhos vs Perdidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ganhos vs Perdidas (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.wonInPeriod === 0 && metrics.lostInPeriod === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={wonLostData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {wonLostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersPipeline.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ordersPipeline} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.info} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Evolução por Período */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {evolution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke={COLORS.primary} name="Leads" strokeWidth={2} />
                  <Line type="monotone" dataKey="ordersDelivered" stroke={COLORS.success} name="Entregues" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;