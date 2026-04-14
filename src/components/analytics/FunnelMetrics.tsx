import React, { useEffect, useState } from 'react';
import { getEventsCountByType, getConversionRate, getEventsByPeriod } from '@/services/funnelTrackingService';
import { TrendingUp, MessageSquare, MousePointer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelData {
  interestClicks: number;
  messageSent: number;
  conversionRate: number;
  last7Days: Record<string, number>;
}

const FunnelMetrics: React.FC = () => {
  const [data, setData] = useState<FunnelData>({
    interestClicks: 0,
    messageSent: 0,
    conversionRate: 0,
    last7Days: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [counts, rate, last7Days] = await Promise.all([
        getEventsCountByType(),
        getConversionRate(),
        getEventsByPeriod(7),
      ]);

      setData({
        interestClicks: counts['interest_click'] || 0,
        messageSent: counts['message_sent'] || 0,
        conversionRate: rate,
        last7Days,
      });
    } catch (error) {
      console.error('[FunnelMetrics] Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cliques de Interesse */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Interesses (Clicou)
            </CardTitle>
            <MousePointer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.interestClicks}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Usuários interessados
            </p>
          </CardContent>
        </Card>

        {/* Mensagens Enviadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mensagens Enviadas
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.messageSent}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leads gerados
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.conversionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Interesses → Mensagens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Últimos 7 Dias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-900">
                {data.last7Days['interest_click'] || 0}
              </div>
              <div className="text-sm text-blue-700">Interesses</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-900">
                {data.last7Days['message_sent'] || 0}
              </div>
              <div className="text-sm text-green-700">Mensagens</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunnelMetrics;
