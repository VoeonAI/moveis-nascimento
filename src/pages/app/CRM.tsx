import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmService, Opportunity, TimelineEvent } from '@/services/crmService';
import { ordersService } from '@/services/ordersService';
import { Lead } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, CheckCircle, Clock, User, Phone, MessageSquare, Package, 
  Calendar as CalendarIcon, RefreshCw, Plus, Bell, AlertCircle,
  Archive, ArchiveRestore, Trash2, MoreHorizontal, X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';

type FilterType = 'all' | 'new' | 'followup' | 'status';

const CRM = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<{ lead: Lead; opportunities: (Opportunity & { products?: { id: string; name: string } })[]; timeline: TimelineEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Note & Follow-up
  const [noteText, setNoteText] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();

  // Check if user is master
  const isMaster = profile?.role === 'master';

  useEffect(() => {
    loadLeads();
  }, [showArchived]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...leads];

    // Filter by type
    if (filter === 'new') {
      filtered = filtered.filter(l => (l.unread_interest_count || 0) > 0);
    } else if (filter === 'followup') {
      filtered = filtered.filter(l => l.follow_up_needed);
    } else if (filter === 'status' && statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    // Sort: 1) unread desc, 2) follow_up_needed desc, 3) created_at desc (fallback)
    filtered.sort((a, b) => {
      const aUnread = a.unread_interest_count || 0;
      const bUnread = b.unread_interest_count || 0;
      if (aUnread !== bUnread) return bUnread - aUnread;

      const aFollowUp = a.follow_up_needed ? 1 : 0;
      const bFollowUp = b.follow_up_needed ? 1 : 0;
      if (aFollowUp !== bFollowUp) return bFollowUp - aFollowUp;

      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });

    setFilteredLeads(filtered);
  }, [leads, filter, statusFilter]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await crmService.listLeads(showArchived);
      setLeads(data);
    } catch (err: any) {
      console.error('[CRM] Failed to load leads', err);
      const errorMessage = err?.message || err?.details || 'Erro desconhecido ao carregar leads';
      setError(errorMessage);
      showError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setStatusFilter('all');
  };

  const handleSelectLead = async (leadId: string) => {
    setSelectedLeadId(leadId);
    try {
      const details = await crmService.getLeadDetail(leadId);
      
      console.log('[CRM Detail] opportunities', details.opportunities);
      
      setLeadDetails(details);
      
      await crmService.markLeadAsSeen(leadId);
      
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, unread_interest_count: 0 } : l
      ));

      setFollowUpNeeded(details.lead.follow_up_needed || false);
      setFollowUpDate(details.lead.follow_up_at ? new Date(details.lead.follow_up_at) : undefined);
    } catch (err) {
      console.error('[CRM] Failed to load lead details', err);
      showError('Erro ao carregar detalhes do lead');
    }
  };

  const handleArchiveLead = async (leadId: string, archived: boolean) => {
    try {
      await crmService.archiveLead(leadId, archived, user?.id);
      showSuccess(archived ? 'Lead arquivado' : 'Lead restaurado');
      await loadLeads();
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
        setLeadDetails(null);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to archive lead', error);
      showError(error.message || 'Erro ao arquivar lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead permanentemente?')) {
      return;
    }

    try {
      await crmService.deleteLead(leadId);
      showSuccess('Lead excluído permanentemente');
      await loadLeads();
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
        setLeadDetails(null);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to delete lead', error);
      showError(error.message || 'Erro ao excluir lead');
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    if (!user || !selectedLeadId) return;
    
    setUpdatingStage(opportunityId);
    try {
      await crmService.updateOpportunityStage(opportunityId, newStage as OpportunityStage, selectedLeadId);
      showSuccess('Estágio atualizado com sucesso');
      
      await handleSelectLead(selectedLeadId);
      await loadLeads();
    } catch (error) {
      console.error('[CRM] Failed to update stage', error);
      showError('Erro ao atualizar estágio');
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleMarkAsWon = async (opportunityId: string) => {
    if (!user || !selectedLeadId) return;

    if (!confirm('Deseja marcar esta oportunidade como ganha e criar o pedido?')) {
      return;
    }

    setUpdatingStage(opportunityId);
    try {
      await crmService.updateOpportunityStage(opportunityId, OpportunityStage.WON, selectedLeadId);
      const order = await ordersService.createOrderFromOpportunity(opportunityId);
      showSuccess('Pedido criado com sucesso!');
      navigate('/app/pipeline');
    } catch (error) {
      console.error('[CRM] Failed to mark as won', error);
      showError('Erro ao criar pedido');
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleArchiveOpportunity = async (opportunityId: string, archived: boolean) => {
    if (!selectedLeadId) return;

    try {
      await crmService.archiveOpportunity(opportunityId, archived, selectedLeadId, user?.id);
      showSuccess(archived ? 'Oportunidade arquivada' : 'Oportunidade restaurada');
      await handleSelectLead(selectedLeadId);
      await loadLeads();
    } catch (error: any) {
      console.error('[CRM] Failed to archive opportunity', error);
      showError(error.message || 'Erro ao arquivar oportunidade');
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oportunidade permanentemente?')) {
      return;
    }

    try {
      await crmService.deleteOpportunity(opportunityId);
      showSuccess('Oportunidade excluída permanentemente');
      await handleSelectLead(selectedLeadId);
      await loadLeads();
    } catch (error: any) {
      console.error('[CRM] Failed to delete opportunity', error);
      showError(error.message || 'Erro ao excluir oportunidade');
    }
  };

  const handleSaveNote = async () => {
    if (!user || !selectedLeadId || !noteText.trim()) return;

    setSavingNote(true);
    try {
      await crmService.addLeadNote(selectedLeadId, noteText, user.id);
      showSuccess('Nota salva');
      setNoteText('');
      await handleSelectLead(selectedLeadId);
    } catch (error) {
      console.error('[CRM] Failed to save note', error);
      showError('Erro ao salvar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleFollowUpChange = async (needed: boolean) => {
    if (!selectedLeadId) return;
    
    try {
      await crmService.setFollowUp(selectedLeadId, needed, needed ? followUpDate : undefined);
      setFollowUpNeeded(needed);
      if (!needed) {
        setFollowUpDate(undefined);
      }
      showSuccess(needed ? 'Follow-up ativado' : 'Follow-up desativado');
      await loadLeads();
    } catch (error) {
      console.error('[CRM] Failed to update follow-up', error);
      showError('Erro ao atualizar follow-up');
    }
  };

  const handleFollowUpDateChange = async (date: Date | undefined) => {
    if (!selectedLeadId) return;
    
    if (date) {
      try {
        await crmService.setFollowUp(selectedLeadId, true, date);
        setFollowUpDate(date);
        setFollowUpNeeded(true);
        showSuccess('Data de follow-up atualizada');
        await loadLeads();
      } catch (error) {
        console.error('[CRM] Failed to update follow-up date', error);
        showError('Erro ao atualizar data');
      }
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

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'note': return <MessageSquare size={16} className="text-blue-500" />;
      case 'opportunity_created': return <Package size={16} className="text-green-500" />;
      case 'opportunity_stage_changed': return <ArrowLeft size={16} className="text-orange-500 rotate-180" />;
      case 'followup_set': return <CalendarIcon size={16} className="text-purple-500" />;
      case 'lead_archived': return <Archive size={16} className="text-gray-500" />;
      case 'lead_restored': return <ArchiveRestore size={16} className="text-blue-500" />;
      case 'opportunity_archived': return <Archive size={16} className="text-gray-500" />;
      case 'opportunity_restored': return <ArchiveRestore size={16} className="text-blue-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getTimelineMessage = (event: TimelineEvent) => {
    switch (event.type) {
      case 'note':
        return event.message;
      case 'opportunity_created':
        return `Novo interesse em "${event.meta.product_name}"`;
      case 'opportunity_stage_changed':
        return `Oportunidade movida de "${event.meta.from}" para "${event.meta.to}"`;
      case 'followup_set':
        return event.meta.follow_up_at 
          ? `Follow-up agendado para ${format(new Date(event.meta.follow_up_at), 'dd/MM/yyyy')}`
          : 'Follow-up marcado como pendente';
      case 'lead_archived':
      case 'lead_restored':
      case 'opportunity_archived':
      case 'opportunity_restored':
        return event.message || 'Atividade registrada';
      default:
        return event.message || 'Atividade registrada';
    }
  };

  if (loading) {
    return <div className="p-8">Carregando CRM...</div>;
  }

  if (!selectedLeadId) {
    // List View
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Gestão de Leads</h1>
          <div className="flex gap-2">
            {isMaster && (
              <Button
                onClick={() => setShowArchived(!showArchived)}
                variant={showArchived ? "default" : "outline"}
                size="sm"
              >
                <Archive size={16} className="mr-2" />
                {showArchived ? 'Ocultar Arquivados' : 'Ver Arquivados'}
              </Button>
            )}
            <Button onClick={loadLeads} variant="outline" size="sm">
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">Todos ({leads.length})</TabsTrigger>
              <TabsTrigger value="new">Novos ({leads.filter(l => (l.unread_interest_count || 0) > 0).length})</TabsTrigger>
              <TabsTrigger value="followup">Follow-up ({leads.filter(l => l.follow_up_needed).length})</TabsTrigger>
              <TabsTrigger value="status">Por Status</TabsTrigger>
            </TabsList>
          </Tabs>

          {(filter !== 'all' || statusFilter !== 'all') && (
            <Button onClick={clearFilters} variant="ghost" size="sm">
              <X size={14} className="mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>

        {filter === 'status' && (
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="new_interest">Novo Interesse</SelectItem>
                <SelectItem value="talking_ai">Falando com IA</SelectItem>
                <SelectItem value="talking_human">Falando com Humano</SelectItem>
                <SelectItem value="proposal_sent">Proposta Enviada</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Error Banner with Retry */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span>{error}</span>
              <Button onClick={loadLeads} variant="outline" size="sm" className="ml-4">
                <RefreshCw size={14} className="mr-1" />
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {filteredLeads.length === 0 && !error ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Nenhum lead encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <Card 
                key={lead.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${lead.archived ? 'opacity-60' : ''}`}
                onClick={() => handleSelectLead(lead.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      {(lead.unread_interest_count || 0) > 0 && (
                        <Badge className="bg-blue-600 text-white">
                          <Bell size={12} className="mr-1" />
                          Novo ({lead.unread_interest_count})
                        </Badge>
                      )}
                      {lead.archived && (
                        <Badge variant="outline" className="text-gray-500">
                          <Archive size={12} className="mr-1" />
                          Arquivado
                        </Badge>
                      )}
                    </div>
                  </div>
                  {lead.phone && (
                    <CardDescription className="flex items-center gap-2">
                      <Phone size={14} />
                      {lead.phone}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {lead.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(lead.created_at), 'dd/MM')}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock size={12} />
                    Criado em: {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                  </div>

                  {lead.follow_up_needed && (
                    <div className="text-xs text-orange-600 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} />
                      {lead.follow_up_at 
                        ? `Follow-up: ${format(new Date(lead.follow_up_at), 'dd/MM')}`
                        : 'Follow-up: pendente'
                      }
                    </div>
                  )}
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
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            setSelectedLeadId(null);
            setLeadDetails(null);
          }}
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Lista
        </Button>
        
        {leadDetails && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {leadDetails.lead.archived ? (
                <DropdownMenuItem onClick={() => handleArchiveLead(leadDetails.lead.id, false)}>
                  <ArchiveRestore size={16} className="mr-2" />
                  Restaurar Lead
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleArchiveLead(leadDetails.lead.id, true)}>
                  <Archive size={16} className="mr-2" />
                  Arquivar Lead
                </DropdownMenuItem>
              )}
              {isMaster && (
                <DropdownMenuItem 
                  onClick={() => handleDeleteLead(leadDetails.lead.id)}
                  className="text-red-600"
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir Permanentemente
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {leadDetails && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                {leadDetails.lead.name}
                {leadDetails.lead.archived && (
                  <Badge variant="outline" className="ml-2">
                    <Archive size={12} className="mr-1" />
                    Arquivado
                  </Badge>
                )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anotações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Adicione uma nota sobre este lead..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                  {savingNote ? 'Salvando...' : 'Salvar Nota'}
                </Button>
              </CardContent>
## Etapa 3 (Continuação): Patch Completo na UI `CRM.tsx`

<dyad-write path="src/pages/app/CRM.tsx" description="Update CRM UI to display product name">
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmService, Opportunity, TimelineEvent } from '@/services/crmService';
import { ordersService } from '@/services/ordersService';
import { Lead } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, CheckCircle, Clock, User, Phone, MessageSquare, Package, 
  Calendar as CalendarIcon, RefreshCw, Plus, Bell, AlertCircle,
  Archive, ArchiveRestore, Trash2, MoreHorizontal, X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';

type FilterType = 'all' | 'new' | 'followup' | 'status';

const CRM = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<{ lead: Lead; opportunities: (Opportunity & { products?: { id: string; name: string } })[]; timeline: TimelineEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Note & Follow-up
  const [noteText, setNoteText] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();

  // Check if user is master
  const isMaster = profile?.role === 'master';

  useEffect(() => {
    loadLeads();
  }, [showArchived]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...leads];

    // Filter by type
    if (filter === 'new') {
      filtered = filtered.filter(l => (l.unread_interest_count || 0) > 0);
    } else if (filter === 'followup') {
      filtered = filtered.filter(l => l.follow_up_needed);
    } else if (filter === 'status' && statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    // Sort: 1) unread desc, 2) follow_up_needed desc, 3) created_at desc (fallback)
    filtered.sort((a, b) => {
      const aUnread = a.unread_interest_count || 0;
      const bUnread = b.unread_interest_count || 0;
      if (aUnread !== bUnread) return bUnread - aUnread;

      const aFollowUp = a.follow_up_needed ? 1 : 0;
      const bFollowUp = b.follow_up_needed ? 1 : 0;
      if (aFollowUp !== bFollowUp) return bFollowUp - aFollowUp;

      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });

    setFilteredLeads(filtered);
  }, [leads, filter, statusFilter]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await crmService.listLeads(showArchived);
      setLeads(data);
    } catch (err: any) {
      console.error('[CRM] Failed to load leads', err);
      const errorMessage = err?.message || err?.details || 'Erro desconhecido ao carregar leads';
      setError(errorMessage);
      showError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setStatusFilter('all');
  };

  const handleSelectLead = async (leadId: string) => {
    setSelectedLeadId(leadId);
    try {
      const details = await crmService.getLeadDetail(leadId);
      
      console.log('[CRM Detail] opportunities', details.opportunities);
      
      setLeadDetails(details);
      
      await crmService.markLeadAsSeen(leadId);
      
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, unread_interest_count: 0 } : l
      ));

      setFollowUpNeeded(details.lead.follow_up_needed || false);
      setFollowUpDate(details.lead.follow_up_at ? new Date(details.lead.follow_up_at) : undefined);
    } catch (err) {
      console.error('[CRM] Failed to load lead details', err);
      showError('Erro ao carregar detalhes do lead');
    }
  };

  const handleArchiveLead = async (leadId: string, archived: boolean) => {
    try {
      await crmService.archiveLead(leadId, archived, user?.id);
      showSuccess(archived ? 'Lead arquivado' : 'Lead restaurado');
      await loadLeads();
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
        setLeadDetails(null);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to archive lead', error);
      showError(error.message || 'Erro ao arquivar lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead permanentemente?')) {
      return;
    }

    try {
      await crmService.deleteLead(leadId);
      showSuccess('Lead excluído permanentemente');
      await loadLeads();
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
        setLeadDetails(null);
      }
    } catch (error: any) {
      console.error('[CRM] Failed to delete lead', error);
      showError(error.message || 'Erro ao excluir lead');
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    if (!user || !selectedLeadId) return;
    
    setUpdatingStage(opportunityId);
    try {
      await crmService.updateOpportunityStage(opportunityId, newStage as OpportunityStage, selectedLeadId);
      showSuccess('Estágio atualizado com sucesso');
      
      await handleSelectLead(selectedLeadId);
      await loadLeads();
    } catch (error) {
      console.error('[CRM] Failed to update stage', error);
      showError('Erro ao atualizar estágio');
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleMarkAsWon = async (opportunityId: string) => {
    if (!user || !selectedLeadId) return;

    if (!confirm('Deseja marcar esta oportunidade como ganha e criar o pedido?')) {
      return;
    }

    setUpdatingStage(opportunityId);
    try {
      await crmService.updateOpportunityStage(opportunityId, OpportunityStage.WON, selectedLeadId);
      const order = await ordersService.createOrderFromOpportunity(opportunityId);
      showSuccess('Pedido criado com sucesso!');
      navigate('/app/pipeline');
    } catch (error) {
      console.error('[CRM] Failed to mark as won', error);
      showError('Erro ao criar pedido');
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleArchiveOpportunity = async (opportunityId: string, archived: boolean) => {
    if (!selectedLeadId) return;

    try {
      await crmService.archiveOpportunity(opportunityId, archived, selectedLeadId, user?.id);
      showSuccess(archived ? 'Oportunidade arquivada' : 'Oportunidade restaurada');
      await handleSelectLead(selectedLeadId);
      await loadLeads();
    } catch (error: any) {
      console.error('[CRM] Failed to archive opportunity', error);
      showError(error.message || 'Erro ao arquivar oportunidade');
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oportunidade permanentemente?')) {
      return;
    }

    try {
      await crmService.deleteOpportunity(opportunityId);
      showSuccess('Oportunidade excluída permanentemente');
      await handleSelectLead(selectedLeadId);
      await loadLeads();
    } catch (error: any) {
      console.error('[CRM] Failed to delete opportunity', error);
      showError(error.message || 'Erro ao excluir oportunidade');
    }
  };

  const handleSaveNote = async () => {
    if (!user || !selectedLeadId || !noteText.trim()) return;

    setSavingNote(true);
    try {
      await crmService.addLeadNote(selectedLeadId, noteText, user.id);
      showSuccess('Nota salva');
      setNoteText('');
      await handleSelectLead(selectedLeadId);
    } catch (error) {
      console.error('[CRM] Failed to save note', error);
      showError('Erro ao salvar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleFollowUpChange = async (needed: boolean) => {
    if (!selectedLeadId) return;
    
    try {
      await crmService.setFollowUp(selectedLeadId, needed, needed ? followUpDate : undefined);
      setFollowUpNeeded(needed);
      if (!needed) {
        setFollowUpDate(undefined);
      }
      showSuccess(needed ? 'Follow-up ativado' : 'Follow-up desativado');
      await loadLeads();
    } catch (error) {
      console.error('[CRM] Failed to update follow-up', error);
      showError('Erro ao atualizar follow-up');
    }
  };

  const handleFollowUpDateChange = async (date: Date | undefined) => {
    if (!selectedLeadId) return;
    
    if (date) {
      try {
        await crmService.setFollowUp(selectedLeadId, true, date);
        setFollowUpDate(date);
        setFollowUpNeeded(true);
        showSuccess('Data de follow-up atualizada');
        await loadLeads();
      } catch (error) {
        console.error('[CRM] Failed to update follow-up date', error);
        showError('Erro ao atualizar data');
      }
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

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'note': return <MessageSquare size={16} className="text-blue-500" />;
      case 'opportunity_created': return <Package size={16} className="text-green-500" />;
      case 'opportunity_stage_changed': return <ArrowLeft size={16} className="text-orange-500 rotate-180" />;
      case 'followup_set': return <CalendarIcon size={16} className="text-purple-500" />;
      case 'lead_archived': return <Archive size={16} className="text-gray-500" />;
      case 'lead_restored': return <ArchiveRestore size={16} className="text-blue-500" />;
      case 'opportunity_archived': return <Archive size={16} className="text-gray-500" />;
      case 'opportunity_restored': return <ArchiveRestore size={16} className="text-blue-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getTimelineMessage = (event: TimelineEvent) => {
    switch (event.type) {
      case 'note':
        return event.message;
      case 'opportunity_created':
        return `Novo interesse em "${event.meta.product_name}"`;
      case 'opportunity_stage_changed':
        return `Oportunidade movida de "${event.meta.from}" para "${event.meta.to}"`;
      case 'followup_set':
        return event.meta.follow_up_at 
          ? `Follow-up agendado para ${format(new Date(event.meta.follow_up_at), 'dd/MM/yyyy')}`
          : 'Follow-up marcado como pendente';
      case 'lead_archived':
      case 'lead_restored':
      case 'opportunity_archived':
      case 'opportunity_restored':
        return event.message || 'Atividade registrada';
      default:
        return event.message || 'Atividade registrada';
    }
  };

  if (loading) {
    return <div className="p-8">Carregando CRM...</div>;
  }

  if (!selectedLeadId) {
    // List View
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Gestão de Leads</h1>
          <div className="flex gap-2">
            {isMaster && (
              <Button
                onClick={() => setShowArchived(!showArchived)}
                variant={showArchived ? "default" : "outline"}
                size="sm"
              >
                <Archive size={16} className="mr-2" />
                {showArchived ? 'Ocultar Arquivados' : 'Ver Arquivados'}
              </Button>
            )}
            <Button onClick={loadLeads} variant="outline" size="sm">
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">Todos ({leads.length})</TabsTrigger>
              <TabsTrigger value="new">Novos ({leads.filter(l => (l.unread_interest_count || 0) > 0).length})</TabsTrigger>
              <TabsTrigger value="followup">Follow-up ({leads.filter(l => l.follow_up_needed).length})</TabsTrigger>
              <TabsTrigger value="status">Por Status</TabsTrigger>
            </TabsList>
          </Tabs>

          {(filter !== 'all' || statusFilter !== 'all') && (
            <Button onClick={clearFilters} variant="ghost" size="sm">
              <X size={14} className="mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>

        {filter === 'status' && (
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="new_interest">Novo Interesse</SelectItem>
                <SelectItem value="talking_ai">Falando com IA</SelectItem>
                <SelectItem value="talking_human">Falando com Humano</SelectItem>
                <SelectItem value="proposal_sent">Proposta Enviada</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Error Banner with Retry */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span>{error}</span>
              <Button onClick={loadLeads} variant="outline" size="sm" className="ml-4">
                <RefreshCw size={14} className="mr-1" />
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {filteredLeads.length === 0 && !error ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              Nenhum lead encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <Card 
                key={lead.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${lead.archived ? 'opacity-60' : ''}`}
                onClick={() => handleSelectLead(lead.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      {(lead.unread_interest_count || 0) > 0 && (
                        <Badge className="bg-blue-600 text-white">
                          <Bell size={12} className="mr-1" />
                          Novo ({lead.unread_interest_count})
                        </Badge>
                      )}
                      {lead.archived && (
                        <Badge variant="outline" className="text-gray-500">
                          <Archive size={12} className="mr-1" />
                          Arquivado
                        </Badge>
                      )}
                    </div>
                  </div>
                  {lead.phone && (
                    <CardDescription className="flex items-center gap-2">
                      <Phone size={14} />
                      {lead.phone}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {lead.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(lead.created_at), 'dd/MM')}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock size={12} />
                    Criado em: {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                  </div>

                  {lead.follow_up_needed && (
                    <div className="text-xs text-orange-600 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} />
                      {lead.follow_up_at 
                        ? `Follow-up: ${format(new Date(lead.follow_up_at), 'dd/MM')}`
                        : 'Follow-up: pendente'
                      }
                    </div>
                  )}
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
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            setSelectedLeadId(null);
            setLeadDetails(null);
          }}
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Lista
        </Button>
        
        {leadDetails && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {leadDetails.lead.archived ? (
                <DropdownMenuItem onClick={() => handleArchiveLead(leadDetails.lead.id, false)}>
                  <ArchiveRestore size={16} className="mr-2" />
                  Restaurar Lead
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleArchiveLead(leadDetails.lead.id, true)}>
                  <Archive size={16} className="mr-2" />
                  Arquivar Lead
                </DropdownMenuItem>
              )}
              {isMaster && (
                <DropdownMenuItem 
                  onClick={() => handleDeleteLead(leadDetails.lead.id)}
                  className="text-red-600"
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir Permanentemente
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {leadDetails && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                {leadDetails.lead.name}
                {leadDetails.lead.archived && (
                  <Badge variant="outline" className="ml-2">
                    <Archive size={12} className="mr-1" />
                    Arquivado
                  </Badge>
                )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anotações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Adicione uma nota sobre este lead..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                  {savingNote ? 'Salvando...' : 'Salvar Nota'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-orange-500" />
                    <span className="font-medium">Precisa de follow-up?</span>
                  </div>
                  <Switch
                    checked={followUpNeeded}
                    onCheckedChange={handleFollowUpChange}
                  />
                </div>

                {followUpNeeded && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data do follow-up</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon size={16} className="mr-2" />
                          {followUpDate ? format(followUpDate, 'dd/MM/yyyy') : 'Selecione uma data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={followUpDate}
                          onSelect={handleFollowUpDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {leadDetails.timeline.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Sem histórico ainda</p>
              ) : (
                <div className="space-y-4">
                  {leadDetails.timeline.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="mt-1">
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{getTimelineMessage(event)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                          {/* PATCH: Exibir nome do produto com fallback */}
                          {opp.products?.name ? (
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-gray-500" />
                              <span className="font-medium">{opp.products.name}</span>
                            </div>
                          ) : opp.product_id ? (
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-gray-500" />
                              <span className="font-medium text-gray-600">Produto removido (ID: {opp.product_id.slice(0, 8)}...)</span>
                            </div>
                          ) : null}

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

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleArchiveOpportunity(opp.id, !opp.archived)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Archive size={14} className="mr-1" />
                              {opp.archived ? 'Restaurar' : 'Arquivar'}
                            </Button>
                            {isMaster && (
                              <Button
                                onClick={() => handleDeleteOpportunity(opp.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
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