import React, { useEffect, useState } from 'react';
import { dashboardService, DashboardMetrics, SystemOverview, OpportunityFunnel, OrdersPipeline, EvolutionData, PeriodType } from '@/services/dashboardService';
import { productsIntelligenceService, MostWorkedProduct, ProductWithoutActivity, CategoryDistribution, ProductsOverview, BestSellingProduct, ProductConversion, SalesOverview } from '@/services/productsIntelligenceService';
import { LayoutDashboard, Users, TrendingUp, TrendingDown, Package, CheckCircle, XCircle, RefreshCw, Box, UserCheck, Target, Calendar as CalendarIcon, AlertTriangle, BarChart3, ShoppingCart, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodType>('last_30_days');
  
  const [overview, setOverview] = useState<SystemOverview>({
    totalProducts: 0,
    totalLeads: 0,
    totalOpportunities: 0,
    totalUsers: 0,
    totalDelivered: 0,
  });
  
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

  // Products Intelligence State
  const [productsOverview, setProductsOverview] = useState<ProductsOverview>({
    totalActiveProducts: 0,
    productsWithOpportunities: 0,
    productsWithoutActivity: 0,
  });
  const [salesOverview, setSalesOverview] = useState<SalesOverview>({
    totalSales: 0,
    averageConversionRate: 0,
  });
  const [mostWorkedProducts, setMostWorkedProducts] = useState<MostWorkedProduct[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
  const [productConversions, setProductConversions] = useState<ProductConversion[]>([]);
  const [productsWithoutActivity, setProductsWithoutActivity] = useState<ProductWithoutActivity[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, metricsData, funnelData, pipelineData, evolutionData] = await Promise.all([
        dashboardService.getSystemOverview(),
        dashboardService.getMetrics(period),
        dashboardService.getOpportunityFunnel(period),
        dashboardService.getOrdersPipeline(period),
        dashboardService.getEvolutionByPeriod(period),
      ]);
      setOverview(overviewData);
      setMetrics(metricsData);
      setOpportunityFunnel(funnelData);
      setOrdersPipeline(pipelineData);
      setEvolution(evolutionData);
      
      // Load products intelligence data
      await loadProductsData();
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsData = async () => {
    try {
      const [
        overviewData,
        salesData,
        mostWorkedData,
        bestSellingData,
        conversionData,
        withoutActivityData,
        distributionData
      ] = await Promise.all([
        productsIntelligenceService.getOverview(),
        productsIntelligenceService.getSalesOverview(),
        productsIntelligenceService.getMostWorkedProducts(10),
        productsIntelligenceService.getBestSellingProducts(10),
        productsIntelligenceService.getConversionByProduct(),
        productsIntelligenceService.getProductsWithoutActivity(),
        productsIntelligenceService.getCategoryDistribution(),
      ]);
      setProductsOverview(overviewData);
      setSalesOverview(salesData);
      setMostWorkedProducts(mostWorkedData);
      setBestSellingProducts(bestSellingData);
      setProductConversions(conversionData);
      setProductsWithoutActivity(withoutActivityData);
      setCategoryDistribution(distributionData);
    } catch (error) {
      console.error('[Dashboard] Failed to load products data:', error);
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

  const periodLabels: Record<PeriodType, string> = {
    today: 'Hoje',
    last_7_days: 'Últimos 7 dias',
    last_30_days: 'Últimos 30 dias',
    current_month: 'Mês atual',
    last_month: 'Mês anterior',
    last_6_months: 'Últimos 6 meses',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="current_month">Mês atual</SelectItem>
              <SelectItem value="last_month">Mês anterior</SelectItem>
              <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalOpportunities}</div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalDelivered}</div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Period KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leadsInPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">{periodLabels[period]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeOpportunities}</div>
            <p className="text-xs text-muted-foreground mt-1">Em aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.wonInPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">{periodLabels[period]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdidas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.lostInPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">{periodLabels[period]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.deliveredInPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">{periodLabels[period]}</p>
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
            <CardTitle>Ganhos vs Perdidas</CardTitle>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <CardTitle>Evolução</CardTitle>
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

      {/* INTELIGÊNCIA DE PRODUTOS */}
      <div className="mt-8 pt-8 border-t">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={24} />
            Inteligência de Produtos
          </h2>
          <Button onClick={loadProductsData} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
        </div>

        {/* KPIs de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productsOverview.totalActiveProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Oportunidades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productsOverview.productsWithOpportunities}</div>
              <p className="text-xs text-muted-foreground mt-1">Produtos trabalhados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Movimentação</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{productsOverview.productsWithoutActivity}</div>
              <p className="text-xs text-muted-foreground mt-1">Produtos inativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{salesOverview.totalSales}</div>
              <p className="text-xs text-muted-foreground mt-1">Pedidos entregues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão Média</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{salesOverview.averageConversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Média por produto</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Top 10 Produtos Mais Trabalhados */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Mais Trabalhados</CardTitle>
            </CardHeader>
            <CardContent>
              {mostWorkedProducts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Sem dados
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mostWorkedProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={150} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} oportunidades`, 'Volume']}
                    />
                    <Bar dataKey="opportunity_count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top 10 Produtos Mais Vendidos */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {bestSellingProducts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Sem dados
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bestSellingProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={150} 
                      tick={{ fontSize: 12 }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} vendas`, 'Volume']}
                    />
                    <Bar dataKey="sales_count" fill={COLORS.success} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversão por Produto */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversão por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            {productConversions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Sem dados de conversão
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Oportunidades</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Taxa de Conversão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productConversions.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category_name}</TableCell>
                        <TableCell className="text-right">{product.opportunities_count}</TableCell>
                        <TableCell className="text-right">{product.sales_count}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            product.conversion_rate >= 50 ? 'text-green-600' :
                            product.conversion_rate >= 20 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {product.conversion_rate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produtos Sem Movimentação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-500" />
              Produtos Sem Movimentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsWithoutActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Todos os produtos ativos têm oportunidades associadas
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsWithoutActivity.map((product) => (
                  <div 
                    key={product.id}
                    className="border rounded-lg p-4 bg-orange-50 border-orange-200"
                  >
                    <div className="font-medium text-sm mb-1">{product.name}</div>
                    <div className="text-xs text-gray-600">{product.category_name}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;