import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmService } from '@/services/crmService';
import { ordersService } from '@/services/ordersService';
import { OpportunityStage } from '@/constants/domain';
import { OPPORTUNITY_STAGE_LABELS, TIMELINE_EVENT_LABELS } from '@/constants/labels';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/core/auth/AuthProvider';
import { Role } from '@/constants/domain';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HardDeleteConfirmDialog } from '@/components/HardDeleteConfirmDialog';
import { CompleteSaleDialog, CompleteSaleData } from '@/components/CRM/CompleteSaleDialog';
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  Package, 
  TrendingUp, 
  Calendar,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  RefreshCw,
  Search,
  Filter,
  Plus,
  MessageCircle,
  User,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { settingsService } from '@/services/settingsService';
import { Opportunity } from '@/types';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  channel: string;
  status: string;
  notes?: string;
  archived: boolean;
  follow_up_needed: boolean;
  follow_up_at?: string;
  last_activity_at: string;
  created_at: string;
  unread_interest_count?: number;
}

interface OpportunityWithProduct extends Opportunity {
  products?: { id: string; name: string };
}

type LeadPriorityStatus = 'overdue' | 'today' | 'followup' | 'new' | 'open' | 'normal';

const getLeadPriorityStatus = (lead: Lead, hasActiveOpportunity: boolean): LeadPriorityStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Atrasado
  if (lead.follow_up_needed && lead.follow_up_at) {
    const followUpDate = new Date(lead.follow_up_at);
    followUpDate.setHours(0, 0, 0, 0);
    if (followUpDate < today) {
      return 'overdue';
    }
  }

  // 2. Follow Hoje
  if (lead.follow_up_needed && lead.follow_up_at) {
    const followUpDate = new Date(lead.follow_up_at);
    followUpDate.setHours(0, 0, 0, 0);
    if (followUpDate.getTime() === today.getTime()) {
      return 'today';
    }
  }

  // 3. Follow-up
  if (lead.follow_up_needed && lead.follow_up_at) {
    const followUpDate = new Date(lead.follow_up_at);
    followUpDate.setHours(0, 0, 0, 0);
    if (followUpDate > today) {
      return 'followup';
    }
  }

  // 4. Novo Interesse (não lido)
  if (lead.unread_interest_count && lead.unread_interest_count > 0) {
    return 'new';
  }

  // 5. Aberto (tem oportunidade ativa)
  if (hasActiveOpportunity) {
    return 'open';
  }

  return 'normal';
};

const getPriorityBadgeInfo = (status: LeadPriorityStatus) => {
  switch (status) {
    case 'overdue':
      return {
        label: 'Atrasado',
        className: 'bg-red-100 text-red-800 border-red-200',
      };
    case 'today':
      return {
        label: 'Follow Hoje',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      };
    case 'followup':
      return {
        label: 'Follow-up',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    case 'new':
      return {
        label: 'Novo Interesse',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'open':
      return {
        label: 'Aberto',
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    default:
      return null;
  }
};

const CRM = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMaster = profile?.role === Role.MASTER;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadData, setSelectedLeadData] = useState<{
    lead: Lead;
    opportunities: OpportunityWithProduct[];
    timeline: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [archivedFilter, setArchivedFilter] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [completeSaleModalOpen, setCompleteSaleModalOpen] = useState(false);
  const [opportunityToComplete, setOpportunityToComplete] = useState<OpportunityWithProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [leadToAction, setLeadToAction] = useState<Lead | null>(null);

  // Add lead form
  const [addLeadForm, setAddLeadForm] = useState({
    name: '',
    phone: '',
    channel: 'manual',
    notes: '',
    createOpportunity: false,
  });

  // WhatsApp config
  const [storeWhatsApp, setStoreWhatsApp] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
    loadStoreWhatsApp();
  }, [archivedFilter]);

  const loadStoreWhatsApp = async () => {
    try {
      const wa = await settingsService.getStoreWhatsApp();
      setStoreWhatsApp(wa);
    } catch (error) {
      console.error('[CRM] Failed to load store WhatsApp:', error);
    }
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await crmService.listLeads(archivedFilter);
      setLeads(data);
    } catch (error) {
      console.error('[CRM] Failed to load leads:', error);
      showError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const loadLeadDetail = async (leadId: string) => {
    try {
      const data = await crmService.getLeadDetail(leadId);
      setSelectedLeadData(data);
    } catch (error) {
      console.error('[CRM] Failed to load lead detail:', error);
      showError('Erro ao carregar detalhes do lead');
    }
  };

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    loadLeadDetail(leadId);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addLeadForm.name.trim()) {
      showError('Nome é obrigatório');
      return;
    }

    setUpdating(true);
    try {
      await crmService.createManualLead({
        name: addLeadForm.name,
        phone: addLeadForm.phone,
        channel: addLeadForm.channel,
        notes: addLeadForm.notes,
        createOpportunity: addLeadForm.createOpportunity,
        userId: user?.id || '',
      });
      
      showSuccess('Lead criado com sucesso');
      setAddLeadModalOpen(false);
      setAddLeadForm({
        name: '',
        phone: '',
        channel: 'manual',
        notes: '',
        createOpportunity: false,
      });
      await loadLeads();
    } catch (error: any) {
      console.error('[CRM] Failed to create lead:', error);
      showError(error.message || 'Erro ao criar lead');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteSale = async (data: CompleteSaleData) => {
    if (!opportunityToComplete || !selectedLeadData) return;

    setUpdating(true);
    try {
      await ordersService.createOrderFromSale(
        opportunityToComplete.id,
        selectedLeadData.lead.id,
        {
          delivery_address: data.delivery_address,
          internal_code: data.internal_code,
          notes: data.notes,
          customer_name: selectedLeadData.lead.name,
          customer_phone: selectedLeadData.lead.phone,
        },
        user?.id
      );

      showSuccess('Venda finalizada com sucesso');
      setCompleteSaleModalOpen(false);
      setOpportunityToComplete(null);
      await loadLeads();
      if (selectedLeadId) {
        await loadLeadDetail(selectedLeadId);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to complete sale:', error);
      showError(error.message || 'Erro ao finalizar venda');
    } finally {
      setUpdating(false);
    }
  };

  const handleArchiveLead = async (lead: Lead, archived: boolean) => {
    try {
      await crmService.archiveLead(lead.id, archived, user?.id);
      showSuccess(archived ? 'Lead arquivado' : 'Lead restaurado');
      setArchiveDialogOpen(false);
      setLeadToAction(null);
      await loadLeads();
      if (selectedLeadId === lead.id) {
        setSelectedLeadId(null);
        setSelectedLeadData(null);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to archive lead:', error);
      showError(error.message || 'Erro ao arquivar lead');
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!isMaster) return;

    try {
      await crmService.deleteLead(lead.id);
      showSuccess('Lead excluído com sucesso');
      setDeleteDialogOpen(false);
      setLeadToAction(null);
      await loadLeads();
      if (selectedLeadId === lead.id) {
        setSelectedLeadId(null);
        setSelectedLeadData(null);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to delete lead:', error);
      showError(error.message || 'Erro ao excluir lead');
    }
  };

  const handleHardDeleteLead = async (leadId: string) => {
    if (!isMaster) return;

    try {
      const { adminService } = await import('@/services/adminService');
      await adminService.hardDeleteLead(leadId);
      showSuccess('Lead excluído definitivamente com sucesso');
      setDeleteDialogOpen(false);
      setLeadToAction(null);
      await loadLeads();
      if (selectedLeadId === lead.id) {
        setSelectedLeadId(null);
        setSelectedLeadData(null);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to hard delete lead:', error);
      showError(error.message || 'Erro ao excluir lead');
    }
  };

  const handleAddNote = async (message: string) => {
    if (!selectedLeadId || !user?.id) return;

    try {
      await crmService.addLeadNote(selectedLeadId, message, user.id);
      showSuccess('Nota adicionada');
      await loadLeadDetail(selectedLeadId);
    } catch (error: any) {
      console.error('[CRM] Failed to add note:', error);
      showError(error.message || 'Erro ao adicionar nota');
    }
  };

  const handleUpdateOpportunityStage = async (oppId: string, newStage: OpportunityStage) => {
    if (!selectedLeadId) return;

    try {
      await crmService.updateOpportunityStage(oppId, newStage, selectedLeadId);
      showSuccess('Estágio atualizado');
      await loadLeadDetail(selectedLeadId);
    } catch (error: any) {
      console.error('[CRM] Failed to update stage:', error);
      showError(error.message || 'Erro ao atualizar estágio');
    }
  };

  const handleSaveFollowUp = async (leadId: string, needed: boolean, date: string | null) => {
    try {
      await crmService.setFollowUp(leadId, needed, date);
      showSuccess('Follow-up atualizado');
      if (selectedLeadId) {
        await loadLeadDetail(selectedLeadId);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to save follow-up:', error);
      showError(error.message || 'Erro ao salvar follow-up');
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.map(lead => {
      const hasActiveOpportunity = selectedLeadData?.lead.id === lead.id 
        ? selectedLeadData.opportunities.some(opp => 
            opp.stage !== OpportunityStage.WON && opp.stage !== OpportunityStage.LOST
          )
        : false;

      return {
        lead,
        priorityStatus: getLeadPriorityStatus(lead, hasActiveOpportunity),
      };
    }).filter(({ lead, priorityStatus }) => {
      const matchesSearch = !searchQuery || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      const matchesPriority = priorityFilter === 'all' || priorityStatus === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    }).map(({ lead, priorityStatus }) => lead);
  }, [leads, searchQuery, statusFilter, priorityFilter, selectedLeadData]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case OpportunityStage.NEW_INTEREST: return 'bg-blue-100 text-blue-800';
      case OpportunityStage.TALKING_AI: return 'bg-purple-100 text-purple-800';
      case OpportunityStage.TALKING_HUMAN: return 'bg-cyan-100 text-cyan-800';
      case OpportunityStage.PROPOSAL_SENT: return 'bg-yellow-100 text-yellow-800';
      case OpportunityStage.WON: return 'bg-green-100 text-green-800';
      case OpportunityStage.LOST: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new_interest': return 'bg-blue-100 text-blue-800';
      case 'talking': return 'bg-purple-100 text-purple-800';
      case 'proposal': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie leads, oportunidades e vendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLeads} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setAddLeadModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="new_interest">Novo Interesse</SelectItem>
            <SelectItem value="talking">Em Conversa</SelectItem>
            <SelectItem value="proposal">Proposta Enviada</SelectItem>
            <SelectItem value="negotiation">Negociação</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={archivedFilter ? "default" : "outline"}
          onClick={() => setArchivedFilter(!archivedFilter)}
        >
          <Archive size={16} className="mr-2" />
          {archivedFilter ? 'Ver Ativos' : 'Ver Arquivados'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="space-y-3">
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Leads ({filteredLeads.length})
              </CardTitle>
              
              {/* Priority Filters */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant={priorityFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('all')}
                  className="text-xs"
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={priorityFilter === 'new' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('new')}
                  className="text-xs"
                >
                  Novos
                </Button>
                <Button
                  size="sm"
                  variant={priorityFilter === 'followup' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('followup')}
                  className="text-xs"
                >
                  Follow
                </Button>
                <Button
                  size="sm"
                  variant={priorityFilter === 'today' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('today')}
                  className="text-xs"
                >
                  Follow Hoje
                </Button>
                <Button
                  size="sm"
                  variant={priorityFilter === 'overdue' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('overdue')}
                  className="text-xs"
                >
                  Atrasados
                </Button>
                <Button
                  size="sm"
                  variant={priorityFilter === 'open' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('open')}
                  className="text-xs"
                >
                  Abertos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum lead encontrado
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredLeads.map((lead) => {
                  const hasActiveOpportunity = selectedLeadData?.lead.id === lead.id
                    ? selectedLeadData.opportunities.some(opp => 
                        opp.stage !== OpportunityStage.WON && opp.stage !== OpportunityStage.LOST
                      )
                    : false;

                  const priorityStatus = getLeadPriorityStatus(lead, hasActiveOpportunity);
                  const priorityBadge = getPriorityBadgeInfo(priorityStatus);
                  
                  return (
                    <div
                      key={lead.id}
                      onClick={() => handleLeadSelect(lead.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedLeadId === lead.id
                          ? 'bg-green-50 border-green-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold truncate">{lead.name}</p>
                            {lead.archived && (
                              <Archive size={14} className="text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Priority Badge */}
                          {priorityBadge && (
                            <Badge className={priorityBadge.className} variant="secondary" className="text-xs">
                              {priorityBadge.label}
                            </Badge>
                          )}
                          
                          {lead.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone size={12} />
                              {lead.phone}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(lead.status)} variant="secondary">
                              {lead.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(lead.created_at), 'dd/MM')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Detail */}
        <Card className="lg:col-span-2">
          {selectedLeadData ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedLeadData.lead.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      {selectedLeadData.lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {selectedLeadData.lead.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Criado em {format(new Date(selectedLeadData.lead.created_at), 'dd/MM/yyyy')}
                      </span>
                      <Badge className={getStatusColor(selectedLeadData.lead.status)}>
                        {selectedLeadData.lead.status}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setLeadToAction(selectedLeadData.lead);
                          setArchiveDialogOpen(true);
                        }}>
                          <Archive size={14} className="mr-2" />
                          {selectedLeadData.lead.archived ? 'Restaurar' : 'Arquivar'}
                        </DropdownMenuItem>
                        {isMaster && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setLeadToAction(selectedLeadData.lead);
                              setDeleteDialogOpen(true);
                            }}>
                              <Trash2 size={14} className="mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lead Context Card with WhatsApp */}
                <LeadContextCard 
                  lead={selectedLeadData.lead}
                  lastOpportunity={selectedLeadData.opportunities[0]}
                  lastMessage={selectedLeadData.timeline[0]?.message}
                  storeWhatsApp={storeWhatsApp}
                />

                {/* Follow-up Summary */}
                <FollowUpSummary 
                  lead={selectedLeadData.lead} 
                  onSave={handleSaveFollowUp}
                  isSaving={updating}
                />

                {/* Notes */}
                {selectedLeadData.lead.notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={16} className="text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Notas</p>
                    </div>
                    <p className="text-sm text-blue-800">{selectedLeadData.lead.notes}</p>
                  </div>
                )}

                {/* Opportunities */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Oportunidades ({selectedLeadData.opportunities.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedLeadData.opportunities.map((opp) => (
                      <div key={opp.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {opp.products && (
                              <div className="flex items-center gap-2 mb-2">
                                <Package size={16} className="text-gray-500" />
                                <p className="font-medium">{opp.products.name}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className={getStageColor(opp.stage)} variant="secondary">
                                {OPPORTUNITY_STAGE_LABELS[opp.stage as keyof typeof OPPORTUNITY_STAGE_LABELS] || opp.stage}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(opp.created_at), 'dd/MM/yyyy')}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={opp.stage}
                              onValueChange={(value) => handleUpdateOpportunityStage(opp.id, value as OpportunityStage)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(OpportunityStage).map((stage) => (
                                  <SelectItem key={stage} value={stage}>
                                    {OPPORTUNITY_STAGE_LABELS[stage]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {opp.stage === OpportunityStage.TALKING_HUMAN && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setOpportunityToComplete(opp);
                                  setCompleteSaleModalOpen(true);
                                }}
                              >
                                <CheckCircle size={14} className="mr-2" />
                                Finalizar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock size={18} />
                    Timeline
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedLeadData.timeline.map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <div className="w-0.5 h-full bg-gray-200" />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {TIMELINE_EVENT_LABELS[event.type as keyof typeof TIMELINE_EVENT_LABELS] || event.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          {event.message && (
                            <p className="text-sm text-gray-700">{event.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Note */}
                <div className="border-t pt-4">
                  <Label htmlFor="new-note">Adicionar Nota</Label>
                  <div className="flex gap-2 mt-2">
                    <Textarea
                      id="new-note"
                      placeholder="Escreva uma nota..."
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const target = e.target as HTMLTextAreaElement;
                          if (target.value.trim()) {
                            handleAddNote(target.value.trim());
                            target.value = '';
                          }
                        }
                      }}
                    />
                    <Button onClick={() => {
                      const textarea = document.getElementById('new-note') as HTMLTextAreaElement;
                      if (textarea?.value.trim()) {
                        handleAddNote(textarea.value.trim());
                        textarea.value = '';
                      }
                    }}>
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center py-20">
              <div className="text-center text-gray-500">
                <User size={48} className="mx-auto mb-4 opacity-50" />
                <p>Selecione um lead para ver os detalhes</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Add Lead Modal */}
      <Dialog open={addLeadModalOpen} onOpenChange={setAddLeadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>
              Adicione um novo lead ao CRM
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Nome *</Label>
              <Input
                id="lead-name"
                value={addLeadForm.name}
                onChange={(e) => setAddLeadForm({ ...addLeadForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefone</Label>
              <Input
                id="lead-phone"
                value={addLeadForm.phone}
                onChange={(e) => setAddLeadForm({ ...addLeadForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-channel">Canal</Label>
              <Select
                value={addLeadForm.channel}
                onValueChange={(value) => setAddLeadForm({ ...addLeadForm, channel: value })}
              >
                <SelectTrigger id="lead-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-notes">Notas</Label>
              <Textarea
                id="lead-notes"
                value={addLeadForm.notes}
                onChange={(e) => setAddLeadForm({ ...addLeadForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create-opportunity"
                checked={addLeadForm.createOpportunity}
                onChange={(e) => setAddLeadForm({ ...addLeadForm, createOpportunity: e.target.checked })}
              />
              <Label htmlFor="create-opportunity" className="cursor-pointer">
                Criar oportunidade inicial
              </Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddLeadModalOpen(false)}
                disabled={updating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Criando...' : 'Criar Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Sale Modal */}
      <CompleteSaleDialog
        open={completeSaleModalOpen}
        onClose={() => {
          setCompleteSaleModalOpen(false);
          setOpportunityToComplete(null);
        }}
        onConfirm={handleCompleteSale}
        initialCustomerName={selectedLeadData?.lead.name || ''}
      />

      {/* Archive Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {leadToAction?.archived ? 'Restaurar Lead' : 'Arquivar Lead'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {leadToAction?.archived 
                ? 'Deseja restaurar este lead? Ele voltará a aparecer na lista principal.'
                : 'Deseja arquivar este lead? Ele não aparecerá mais na lista principal.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leadToAction && handleArchiveLead(leadToAction, !leadToAction.archived)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>"{leadToAction?.name}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leadToAction && handleDeleteLead(leadToAction)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Dialog for Master */}
      {isMaster && (
        <HardDeleteConfirmDialog
          open={deleteDialogOpen && leadToAction !== null}
          onClose={() => {
            setDeleteDialogOpen(false);
            setLeadToAction(null);
          }}
          onConfirm={() => leadToAction && handleHardDeleteLead(leadToAction.id)}
          entityType="Lead"
          entityName={leadToAction?.name || ''}
        />
      )}
    </div>
  );
};

// LeadContextCard component
const LeadContextCard = ({ lead, lastOpportunity, lastMessage, storeWhatsApp }: {
  lead: Lead;
  lastOpportunity?: OpportunityWithProduct;
  lastMessage?: string;
  storeWhatsApp: string | null;
}) => {
  const openWhatsApp = () => {
    const phone = lead.phone?.replace(/\D/g, '');
    const lastInterestProductName = lastOpportunity?.products?.name || 'Móveis Nascimento';

    const message = `Olá ${lead.name}, tudo bem?

Aqui é da Móveis Nascimento.

Vi que você demonstrou interesse no produto:

"${lastInterestProductName}"

Posso te ajudar com valores ou condições?`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {lastOpportunity?.products && (
              <div className="flex items-center gap-2">
                <Package size={16} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Último Interesse</p>
                  <p className="font-semibold text-gray-900">{lastOpportunity.products.name}</p>
                </div>
              </div>
            )}
            
            {lastMessage && (
              <div className="flex items-start gap-2">
                <MessageSquare size={16} className="text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Última Mensagem</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{lastMessage}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <p className="text-xs text-gray-500">
                Interesse em {lastOpportunity ? format(new Date(lastOpportunity.created_at), 'dd/MM/yyyy') : '-'}
              </p>
            </div>
          </div>

          {lead.phone && (
            <Button
              onClick={openWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MessageCircle size={20} className="mr-2" />
              Abrir WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// FollowUpSummary component
const FollowUpSummary = ({ lead, onSave, isSaving }: {
  lead: Lead;
  onSave: (leadId: string, needed: boolean, date: string | null) => void;
  isSaving: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localNeeded, setLocalNeeded] = useState(lead.follow_up_needed);
  const [localDate, setLocalDate] = useState(
    lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().split('T')[0] : ''
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const followUpDate = lead.follow_up_at ? new Date(lead.follow_up_at) : null;
  const isToday = followUpDate ? followUpDate.toDateString() === today.toDateString() : false;
  const isOverdue = followUpDate ? followUpDate < today : false;

  const getBackgroundColor = () => {
    if (isOverdue) return 'bg-red-50 border-red-200';
    if (isToday) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getIconColor = () => {
    if (isOverdue) return 'text-red-600';
    if (isToday) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const handleSave = () => {
    const dateToSave = localNeeded && localDate ? localDate : null;
    onSave(lead.id, localNeeded, dateToSave);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalNeeded(lead.follow_up_needed);
    setLocalDate(lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().split('T')[0] : '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="bg-white border-2 border-blue-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Follow-up</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localNeeded}
              onChange={(e) => setLocalNeeded(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-700">Precisa de follow-up?</label>
          </div>

          {localNeeded && (
            <div>
              <label className="text-xs text-gray-600 block mb-1">Próximo follow-up:</label>
              <Input
                type="date"
                value={localDate}
                onChange={(e) => setLocalDate(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || (localNeeded && !localDate)}
            >
              {isSaving ? 'Salvando...' : (
                <>
                  <Save size={14} className="mr-1" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={getBackgroundColor()}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className={getIconColor()} />
            <span className="text-sm font-medium text-gray-700">Follow-up</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 px-2 text-xs"
          >
            Editar
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          {lead.follow_up_needed ? (
            <Badge variant="outline" className="text-xs bg-white">
              Necessário
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Não necessário
            </Badge>
          )}
        </div>
        
        {followUpDate && (
          <div className="mt-2 text-sm">
            <span className="text-gray-600">Próximo: </span>
            <span className={`font-medium ${isOverdue ? 'text-red-700' : isToday ? 'text-yellow-700' : 'text-gray-900'}`}>
              {format(followUpDate, 'dd/MM/yyyy')}
            </span>
            {isOverdue && (
              <span className="ml-2 text-xs text-red-600 font-medium">(atrasado)</span>
            )}
            {isToday && !isOverdue && (
              <span className="ml-2 text-xs text-yellow-600 font-medium">(hoje)</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CRM;