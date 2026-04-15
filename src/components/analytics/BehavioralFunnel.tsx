import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BehavioralFunnel } from '@/services/dashboardService';
import { ChevronRight, Percent } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

interface BehavioralFunnelProps {
  funnelData: BehavioralFunnel[];
  loading?: boolean;
}

const BehavioralFunnelComponent: React.FC<BehavioralFunnelProps> = ({ funnelData, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil Comportamental</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-gray-200 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (funnelData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil Comportamental</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Sem dados
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular taxas de conversão entre etapas
  const conversionRates = funnelData.map((stage, index) => {
    if (index === 0) return { ...stage, rate: 100 }; // Primeira etapa = 100%
    const previousCount = funnelData[index - 1].count;
    const rate = previousCount > 0 ? (stage.count / previousCount) * 100 : 0;
    return { ...stage, rate };
  });

  // Calcular taxa de conversão global (última etapa / primeira etapa)
  const firstStageCount = funnelData[0].count;
  const lastStageCount = funnelData[funnelData.length - 1].count;
  const globalConversionRate = firstStageCount > 0
    ? (lastStageCount / firstStageCount) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Funil Comportamental
          {globalConversionRate > 0 && (
            <span className="text-sm font-normal text-gray-600">
              (Conversão Global: {globalConversionRate.toFixed(1)}%)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversionRates.map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              {/* Barra de progresso */}
              <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-all duration-500"
                  style={{
                    width: `${Math.min((stage.count / (firstStageCount || 1)) * 100, 100)}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">{stage.count}</span>
                    <span className="text-sm font-medium text-white">{stage.label}</span>
                  </div>
                </div>
              </div>

              {/* Seta e taxa de conversão */}
              {index < conversionRates.length - 1 && (
                <div className="flex items-center gap-2 pl-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 flex-1">
                    <ChevronRight className="h-4 w-4" />
                    <Percent className="h-3 w-3" />
                    <span className="font-medium">
                      {stage.rate.toFixed(1)}% de conversão
                    </span>
                    <span className="text-gray-500">
                      ({stage.count} → {conversionRates[index + 1].count})
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {firstStageCount}
              </div>
              <div className="text-xs text-gray-600">Total Cliques</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {lastStageCount}
              </div>
              <div className="text-xs text-gray-600">Conversões</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {globalConversionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Taxa Global</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BehavioralFunnelComponent;