import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, AlertTriangle, Clock, RefreshCw, ArrowRight } from 'lucide-react';
import { ProductRadar } from '@/services/productsIntelligenceService';

interface ProductsRadarProps {
  radar: ProductRadar;
  loading: boolean;
  onRefresh: () => void;
}

export const ProductsRadar: React.FC<ProductsRadarProps> = ({ radar, loading, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Radar de Produtos</h2>
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Radar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Produto em Alta */}
        {radar.hotProduct ? (
          <Link to="/app/products-dashboard">
            <Card className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-orange-700">
                  <div className="flex items-center gap-2">
                    <Flame size={20} className="text-orange-500" />
                    Produto em Alta
                  </div>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="font-semibold text-lg mb-1">{radar.hotProduct.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{radar.hotProduct.category_name}</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {radar.hotProduct.sales_count} venda{radar.hotProduct.sales_count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">no período</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-orange-200 bg-orange-50 opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Flame size={20} className="text-orange-500" />
                Produto em Alta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                Nenhuma venda no período
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alta Procura / Baixa Conversão */}
        {radar.highDemandLowConversion ? (
          <Link to={`/app/crm?product=${radar.highDemandLowConversion.id}`}>
            <Card className="border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-yellow-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-yellow-500" />
                    Alta Procura
                  </div>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="font-semibold text-lg mb-1">{radar.highDemandLowConversion.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{radar.highDemandLowConversion.category_name}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Oportunidades:</span>
                      <span className="font-medium">{radar.highDemandLowConversion.opportunities_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Vendas:</span>
                      <span className="font-medium">{radar.highDemandLowConversion.sales_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conversão:</span>
                      <span className="font-bold text-red-600">
                        {radar.highDemandLowConversion.conversion_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50 opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle size={20} className="text-yellow-500" />
                Alta Procura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                Nenhum produto com alta procura e baixa conversão
              </div>
            </CardContent>
          </Card>
        )}

        {/* Produto Parado */}
        {radar.stagnantProduct ? (
          <Link to="/app/catalog?filter=stagnant">
            <Card className="border-gray-200 bg-gray-50 hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-gray-500" />
                    Produto Parado
                  </div>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="font-semibold text-lg mb-1">{radar.stagnantProduct.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{radar.stagnantProduct.category_name}</div>
                  <div className="text-sm text-gray-500">
                    Sem movimentação comercial
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="border-gray-200 bg-gray-50 opacity-60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Clock size={20} className="text-gray-500" />
                Produto Parado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                Todos os produtos têm movimentação
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};