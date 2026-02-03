Pedido">
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmService } from '@/services/crmService';
import { ordersService } from '@/services/ordersService';
import { Lead, Opportunity } from '@/types';
import { OpportunityStage } from '@/constants/domain';
import { useAuth } from '@/core/auth/AuthProvider';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Clock, User, Phone, MessageSquare } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const CRM = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<{ lead: Lead; opportunities: Opportunity[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await crmService.listLeads();
      setLeads(data);
    } catch (error) {
      console.error('[CRM] Failed to load leads', error);
      showError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = async (leadId: string) => {
    setSelectedLeadId(leadId);
    try {
      const details = await crmService.getLeadWithOpportunities(leadId);
      setLeadDetails(details);
    } catch (error) {
      console.error('[CRM] Failed to load lead details', error);
      showError('Erro ao carregar detalhes do lead');
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    if (!user) return;
    
    setUpdatingStage(opportunityId);
    try {
      await crmService.updateOpportunityStage(opportunityId, newStage as OpportunityStage);
      showSuccess('Estágio atualizado com sucesso');
      
      // Refresh details
      if (selectedLeadId) {
        await handleSelectLead(selectedLeadId);
      }
    } catch (error) {
      console.error('[CRM] Failed to update stage', error);
      showError('Erro ao atualizar estágio');
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleMarkAsWon = async (opportunityId: string) => {
    if (!user) return;

    if (!confirm('Deseja marcar esta oportunidade como ganha e criar o pedido?')) {
      return;
    }

    setUpdatingStage(opportunityId);
    try {
      // 1. Update stage to WON
      await crmService.updateOpportunityStage(opportunityId, OpportunityStage.WON);
      
      // 2. Create Order (idempotent)
      const order = await ordersService.createOrderFromOpportunity(opportunityId);
      
      showSuccess('Pedido criado com sucesso!');
      
      // 3. Redirect to Pipeline
      navigate('/app/pipeline');
    } catch (error) {
      console.error('[CRM] Failed to mark as won', error);
      showError('Erro ao criar pedido');
    } finally {
      setUpdatingStage(null);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case OpportunityStage.NEW_INTEREST: return 'bg-blue-100 text-blue-800';
      case OpportunityStage.TALKING_AI: return 'bg-purple-100 text-purple-800';
      case OpportunityStage.TALKING_HUMAN: return 'bg-orange-100 text-orange-800';
      case OpportunityStage.PROPOSAL_SENT: return 'bg-yellow-100 text-yellow-800';
      case OpportunityStage.WON: return 'bg-green-100 text-green-800';
      case OpportunityStage.LOST: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-8">Carregando CRM...</div>;
  }

  if (!selectedLeadId) {
    // List View
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Gestão de Leads</h1>
        
        {leads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Nenhum lead encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <Card 
                key={lead.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectLead(lead.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-gray-500" />
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                  </div>
                  {lead.phone && (
                    <CardDescription className="flex items-center gap-2">
                      <Phone size={14} />
                      {lead.phone}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {lead.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Detail View
  return (
    <div className="p-8">
      <Button 
        variant="ghost" 
        onClick={() => {
          setSelectedLeadId(null);
          setLeadDetails(null);
        }}
        className="mb-6"
      >
        <ArrowLeft size={16} className="mr-2" />
        Voltar para Lista
      </Button>

      {leadDetails && (
        <div className="space-y-6">
          {/* Lead Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                {leadDetails.lead.name}
              </CardTitle>
              {leadDetails.lead.phone && (
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Phone size={16} />
                  {leadDetails.lead.phone}
                </CardDescription>
              )}
            </CardHeader>
            {leadDetails.lead.notes && (
              <CardContent>
                <div className="flex items-start gap-2">
                  <MessageSquare size={16} className="text-gray-500 mt-1" />
                  <p className="text-sm text-gray-700">{leadDetails.lead.notes}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Opportunities */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Oportunidades</h2>
            
            {leadDetails.opportunities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  Nenhuma oportunidade associada.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {leadDetails.opportunities.map((opp) => (
                  <Card key={opp.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-500">
                              Criada em {new Date(opp.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">Estágio:</span>
                            <Badge className={getStageColor(opp.stage)}>
                              {opp.stage.replace(/_/g, ' ')}
                            </Badge>
                          </div>

                          {opp.estimated_value > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-500">Valor estimado: </span>
                              <span className="font-semibold text-green-600">
                                R$ {opp.estimated_value.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <Select
                            value={opp.stage}
                            onValueChange={(value) => handleStageChange(opp.id, value)}
                            disabled={updatingStage === opp.id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Mudar estágio" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={OpportunityStage.NEW_INTEREST}>Novo Interesse</SelectItem>
                              <SelectItem value={OpportunityStage.TALKING_AI}>Falando com IA</SelectItem>
                              <SelectItem value={OpportunityStage.TALKING_HUMAN}>Falando com Humano</SelectItem>
                              <SelectItem value={OpportunityStage.PROPOSAL_SENT}>Proposta Enviada</SelectItem>
                              <SelectItem value={OpportunityStage.WON}>Ganho</SelectItem>
                              <SelectItem value={OpportunityStage.LOST}>Perdido</SelectItem>
                            </SelectContent>
                          </Select>

                          {opp.stage !== OpportunityStage.WON && opp.stage !== OpportunityStage.LOST && (
                            <Button
                              onClick={() => handleMarkAsWon(opp.id)}
                              disabled={updatingStage === opp.id}
                              className="w-full"
                              size="sm"
                            >
                              <CheckCircle size={16} className="mr-2" />
                              {updatingStage === opp.id ? 'Processando...' : 'Venda Concluída'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;