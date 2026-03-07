import React, { useEffect, useState } from 'react';
import { productsIntelligenceService, MostWorkedProduct, ProductWithoutActivity, CategoryDistribution, ProductsOverview } from '@/services/productsIntelligenceService';
import { Package, TrendingUp, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  primary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

const ProductsDashboard = () => {
  const [overview, setOverview] = useState<ProductsOverview>({
    totalActiveProducts: 0,
    productsWithOpportunities: 0,
    productsWithoutActivity: 0,
  });
  
  const [mostWorkedProducts, setMostWorkedProducts] = useState<MostWorkedProduct[]>([]);
  const [productsWithoutActivity, setProductsWithoutActivity] = useState<ProductWithoutActivity[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, mostWorkedData, withoutActivityData, distributionData] = await Promise.all([
        productsIntelligenceService.getOverview(),
        productsIntelligenceService.getMostWorkedProducts(10),
        productsIntelligenceService.getProductsWithoutActivity(),
        productsIntelligenceService.getCategoryDistribution(),
      ]);
      setOverview(overviewData);
      setMostWorkedProducts(mostWorkedData);
      setProductsWithoutActivity(withoutActivityData);
      setCategoryDistribution(distributionData);
    } catch (error) {
      console.error('[ProductsDashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inteligência de Produtos</h1>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalActiveProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Oportunidades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.productsWithOpportunities}</div>
            <p className="text-xs text-muted-foreground mt-1">Produtos trabalhados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Movimentação</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overview.productsWithoutActivity}</div>
            <p className="text-xs text-muted-foreground mt-1">Produtos inativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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

        {/* Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="category_name" 
                    type="category" 
                    width={150} 
                    tick={{ fontSize: 12 }} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} oportunidades`, 'Volume']}
                  />
                  <Bar dataKey="opportunity_count" fill={COLORS.info} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

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
  );
};

export default ProductsDashboard;