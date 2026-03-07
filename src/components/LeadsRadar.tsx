import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Calendar, RefreshCw, Phone, User, ArrowRight } from 'lucide-react';
import { LeadsRadar } from '@/services/leadsIntelligenceService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadsRadarProps {
  radar: LeadsRadar;
  loading: boolean;
  onRefresh: () => void;
}

export const LeadsRadar: React.FC<LeadsRadarProps> = ({ radar, loading, onRefresh }) => {
  const formatDaysInactive = (days: number) => {
    if (days === 1) return '1 dia';
    if (days < 7) return `${days} dias`;
    if (days < 30) return `${Math.floor(days / 7)} semanas`;
    return `${Math.floor(days / 30)} meses`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Radar de Leads</h2>
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Radar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leads Quentes */}
        <Link to="/app/crm?filter=hot">
          <Card className="border-orange-200 bg-orange-50 hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-orange-700">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-orange-500" />
                  Leads Quentes
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {radar.hotLeadsCount}
              </div>
              <p className="text-xs text-gray-600 mb-3">com atividade recente</p>
              {radar.hotLeads.length > 0 && (
                <div className="space-y-2">
                  {radar.hotLeads.slice(0, 2).map((lead) => (
                    <div key={lead.id} className="text-sm">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-gray-600">
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Leads Parados */}
        <Link to="/app/crm?filter=stagnant">
          <Card className="border-gray-200 bg-gray-50 hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-gray-700">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-gray-500" />
                  Leads Parados
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600 mb-2">
                {radar.stagnantLeadsCount}
              </div>
              <p className="text-xs text-gray-600 mb-3">sem atividade há 30+ dias</p>
              {radar.stagnantLeads.length > 0 && (
                <div className="space-y-2">
                  {radar.stagnantLeads.slice(0, 2).map((lead) => (
                    <div key={lead.id} className="text-sm">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-gray-600">
                        há {formatDaysInactive(lead.days_inactive)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Follow-ups Hoje */}
        <Link to="/app/crm?filter=followup">
          <Card className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-blue-700">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  Follow-ups Hoje
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {radar.followUpLeadsCount}
              </div>
              <p className="text-xs text-gray-600 mb-3">hoje ou atrasados</p>
              {radar.followUpLeads.length > 0 && (
                <div className="space-y-2">
                  {radar.followUpLeads.slice(0, 2).map((lead) => (
                    <div key={lead.id} className="text-sm">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        {lead.is_overdue && (
                          <span className="text-red-600 font-medium">Atrasado</span>
                        )}
                        <span>{format(new Date(lead.follow_up_at), 'dd/MM')}</span>
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