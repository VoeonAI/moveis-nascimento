import React, { useEffect, useState } from 'react';
import { getFunnelMetrics, getConversionRates, FunnelMetrics as FunnelMetricsType, ConversionRates } from '@/services/funnelTrackingService';
import { TrendingUp, MessageSquare, MousePointer, Bot, Users, Trophy, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FunnelMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<FunnelMetricsType>({
    interestClicks: 0,
    messageSent: 0,
    talkingAi: 0,
    talkingHuman: 0,
    won: 0,
    lost: 0,
    totalOpportunities: 0,
  });
  const [rates, setRates] = useState<ConversionRates>({
    interestToMessage: 0,
    messageToAi: 0,
    aiToHuman: 0,
    humanToWon: 0,
    overallConversion: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [metricsData, ratesData] = await Promise.all([
        getFunnelMetrics(),
        getConversionRates(),
      ]);

      setMetrics(metricsData);
      setRates(ratesData);
    } catch (error) {
      console.error('[FunnelMetrics] Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas - Funil Completo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Interest Clicks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Cliques
            </CardTitle>
            <MousePointer className="h-3.5 w-3.5 text-blue-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.interestClicks}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Interesse inicial
            </p>
          </CardContent>
        </Card>

        {/* 2. Message Sent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Mensagens
            </CardTitle>
            <MessageSquare className="h-3.5 w-3.5 text-green-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.messageSent}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[10px] text-gray-500">Leads</p>
              {rates.interestToMessage > 0 && (
                <span className="text-[10px] font-semibold text-blue-600">
                  ({rates.interestToMessage}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Talking AI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Con. IA
            </CardTitle>
            <Bot className="h-3.5 w-3.5 text-purple-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.talkingAi}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[10px] text-gray-500">Conversando</p>
              {rates.messageToAi > 0 && (
                <span className="text-[10px] font-semibold text-purple-600">
                  ({rates.messageToAi}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Talking Human */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Con. Humano
            </CardTitle>
            <Users className="h-3.5 w-3.5 text-orange-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.talkingHuman}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[10px] text-gray-500">Em negociação</p>
              {rates.aiToHuman > 0 && (
                <span className="text-[10px] font-semibold text-orange-600">
                  ({rates.aiToHuman}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 5. Won */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Ganho
            </CardTitle>
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.won}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[10px] text-gray-500">Vendas</p>
              {rates.humanToWon > 0 && (
                <span className="text-[10px] font-semibold text-yellow-600">
                  ({rates.humanToWon}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 6. Lost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-gray-600">
              Perdido
            </CardTitle>
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.lost}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Não convertido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Taxa de Conversão Global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Taxa de Conversão Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="text-5xl font-bold text-gray-900">
                {rates.overallConversion}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                De cliques até vendas
              </p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Cliques → Mensagens</span>
                <span className="font-semibold text-blue-600">{rates.interestToMessage}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Mensagens → IA</span>
                <span className="font-semibold text-purple-600">{rates.messageToAi}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">IA → Humano</span>
                <span className="font-semibold text-orange-600">{rates.aiToHuman}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Humano → Vendas</span>
                <span className="font-semibold text-yellow-600">{rates.humanToWon}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Resumo do Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-900">
                {metrics.totalOpportunities}
              </div>
              <div className="text-sm text-green-700">Total Opportunities</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-900">
                {metrics.talkingAi + metrics.talkingHuman}
              </div>
              <div className="text-sm text-blue-700">Em Conversa</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-900">
                {((metrics.won / (metrics.won + metrics.lost || 1)) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-yellow-700">Win Rate</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-900">
                {((metrics.talkingAi / (metrics.totalOpportunities || 1)) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-purple-700">IA Engagement</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunnelMetrics;