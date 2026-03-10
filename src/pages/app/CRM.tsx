import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmService, Opportunity, TimelineEvent } from '@/services/crmService';
import { ordersService } from '@/services/ordersService';
import { adminService } from '@/services/adminService';
import { productsService, Product } from '@/services/productsService';
import { Lead } from '@/types';
import { OpportunityStage } from '@/constants/domain';
import { OPPORTUNITY_STAGE_LABELS, ORDER_STAGE_LABELS, TIMELINE_EVENT_LABELS } from '@/constants/labels';
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
import { CompleteSaleDialog, CompleteSaleData } from '@/components/CRM/CompleteSaleDialog';
import { HardDeleteConfirmDialog } from '@/components/HardDeleteConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, CheckCircle, Clock, User, Phone, MessageSquare, Package, 
  Calendar as CalendarIcon, RefreshCw, Plus, Bell, AlertCircle,
  Archive, ArchiveRestore, Trash2, MoreHorizontal, X, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';

type FilterType = 'all' | 'new' | 'followup' | 'status';

const CRM = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<(Lead & { last_timeline_event_type?: string | null })[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<(Lead & { last_timeline_event_type?: string | null })[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<{ lead: Lead; opportunities: (Opportunity & { products?: { id: string; name: string } })[]; timeline: TimelineEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which opportunities/leads have linked orders
  const [opportunitiesWithOrders, setOpportunitiesWithOrders] = useState<Set<string>>(new Set());
  const [leadsWithOrders, setLeadsWithOrders] = useState<Set<string>>(new Set());

  // Filters
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Note & Follow-up
  const [noteText, setNoteText] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();

  // Complete Sale Modal
  const [completeSaleModalOpen, setCompleteSaleModalOpen] = useState(false);
  const [finalizingOpportunity, setFinalizingOpportunity] = useState<Opportunity | null>(null);

  // Hard Delete Modal
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [deletingEntity, setDeletingEntity] = useState<{ type: 'lead' | 'order', id: string, name: string } | null>(null);

  // New Lead Manual Modal
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: '',
    phone: '',
    channel: 'manual',
    notes: '',
    product_id: '',
    createOpportunity: false,
  });
  const [creatingLead, setCreatingLead] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Check if user is master
  const isMaster = profile?.role === 'master';

  useEffect(() => {
    loadLeads();
  }, [showArchived]);

  // Load products for manual lead modal
  useEffect(() => {
    if (newLeadModalOpen) {
      productsService.listAllProducts().then(setProducts).catch(err => {
        console.error('[CRM] Failed to load products:', err);
        setProducts([]);
      });
    }
  }, [newLeadModalOpen]);

  // Helper: Check if lead is considered "New" based on business rule
  const isNewLead = (lead: Lead) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return (
      lead.status === 'new_interest' &&
      new Date(lead.created_at) >= threeDaysAgo &&
      !lead.follow_up_needed
    );
  };

  // Helper: Check if lead has new interest based on last timeline event
  const hasNewInterest = (lead: Lead & { last_timeline_event_type?: string | null }) => {
    return lead.last_timeline_event_type === 'opportunity_created';
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...leads];

    // Filter by type
    if (filter === 'new') {
      filtered = filtered.filter(isNewLead);
    } else if (filter === 'followup') {
      filtered = filtered.filter(l => l.follow_up_needed);
    } else if (filter === 'status' && statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    // Sort: 1) new leads first, 2) new interest first, 3) unread desc, 4) follow_up_needed desc, 5) created_at desc (fallback)
    filtered.sort((a, b) => {
      // New leads first
      const aIsNew = isNewLead(a);
      const bIsNew = isNewLead(b);
      if (aIsNew !== bIsNew) return aIsNew ? -1 : 1;

      // New interest second
      const aHasNewInterest = hasNewInterest(a);
      const bHasNewInterest = hasNewInterest(b);
      if (aHasNewInterest !== bHasNewInterest) return aHasNewInterest ? -1 : 1;

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
      
      // Fetch last timeline event type for each lead
      const leadsWithLastEvent = await Promise.all(
        data.map(async (lead) => {
          const timeline = await crmService.listLeadTimeline(lead.id);
          const lastEvent = timeline.length > 0 ? timeline[0] : null;
          return {
            ...lead,
            last_timeline_event_type: lastEvent?.type || null,
          };
        })
      );
      
      setLeads(leadsWithLastEvent);

      // Check which leads have linked orders
      const leadIds = data.map(l => l.id);
      const orderCheckPromises = leadIds.map(leadId => 
        crmService.leadHasLinkedOrders(leadId).then(hasOrder => ({ leadId, hasOrder }))
      );
      
      const results = await Promise.all(orderCheckPromises);
      const leadsWithOrdersSet = new Set<string>();
      results.forEach(({ leadId, hasOrder }) => {
        if (hasOrder) leadsWithOrdersSet.add(leadId);
      });
      setLeadsWithOrders(leadsWithOrdersSet);
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
      
      setLeadDetails(details);
      
      await crmService.markLeadAsSeen(leadId);
      
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, unread_interest_count: 0, last_timeline_event_type: null } : l
      ));

      setFollowUpNeeded(details.lead.follow_up_needed || false);
      setFollowUpDate(details.lead.follow_up_at ? new Date(details.lead.follow_up_at) : undefined);

      // Check which opportunities have linked orders
      const oppIds = details.opportunities.map(o => o.id);
      const oppOrderCheckPromises = oppIds.map(oppId => 
        crmService.opportunityHasLinkedOrder(oppId).then(hasOrder => ({ oppId, hasOrder }))
      );
      
      const oppResults = await Promise.all(oppOrderCheckPromises);
      const oppsWithOrdersSet = new Set<string>();
      oppResults.forEach(({ oppId, hasOrder }) => {
        if (hasOrder) oppsWithOrdersSet.add(oppId);
      });
      setOpportunitiesWithOrders(oppsWithOrdersSet);
    } catch (err) {
      console.error('[CRM] Failed to load lead details', err);
      showError('Erro ao carregar detalhes do lead');
    }
  };

  const handleCreateManualLead = async () => {
    if (!newLeadData.name.trim() || !newLeadData.phone.trim()) {
      showError('Nome e telefone são obrigatórios');
      return;
    }

    setCreatingLead(true);
    try {
      await crmService.createManualLead({
        ...newLeadData,
        userId: user?.id || '',
      });

      showSuccess('Lead criado com sucesso');
      setNewLeadModalOpen(false);
      setNewLeadData({
        name: '',
        phone: '',
        channel: 'manual',
        notes: '',
        product_id: '',
        createOpportunity: false,
      });
      await loadLeads();
    } catch (error: any) {
      console.error('[CRM] Failed to create manual lead:', error);
      showError(error.message || 'Erro ao criar lead');
    } finally {
      setCreatingLead(false);
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

  const handleHardDeleteLead = () => {
    if (!leadDetails) return;
    setDeletingEntity({ type: 'lead', id: leadDetails.lead.id, name: leadDetails.lead.name });
    setHardDeleteDialogOpen(true);
  };

  const handleConfirmHardDelete = async () => {
    if (!deletingEntity) return;

    try {
      if (deletingEntity.type === 'lead') {
        await adminService.hardDeleteLead(deletingEntity.id);
        showSuccess('Lead excluído definitivamente com sucesso');
      } else if (deletingEntity.type === 'order') {
        await adminService.hardDeleteOrder(deletingEntity.id);
        showSuccess('Pedido excluído definitivamente com sucesso');
      }
      
      setHardDeleteDialogOpen(false);
      setDeletingEntity(null);
      
      // If we deleted of current lead, go back to list
      if (deletingEntity.type === 'lead' && selectedLeadId === deletingEntity.id) {
        setSelectedLeadId(null);
        setLeadDetails(null);
      }
      
      // Reload data
      await loadLeads();
    } catch (error: any) {
      console.error('[CRM] Failed to hard delete', error);
      const errorMessage = error?.message || 'Erro ao excluir';
      showError(errorMessage);
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    if (!user || !selectedLeadId) return;
    
    // Check if changing to 'won' - open modal instead of direct update
    if (newStage === OpportunityStage.WON) {
      const opp = leadDetails?.opportunities.find(o => o.id === opportunityId);
      if (opp) {
        setFinalizingOpportunity(opp);
        setCompleteSaleModalOpen(true);
        return;
      }
    }
    
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

  const handleCompleteSale = async (data: CompleteSaleData) => {
    if (!finalizingOpportunity || !user || !selectedLeadId) return;

    setUpdatingStage(finalizingOpportunity.id);
    
    try {
      // 1. Create Order with required fields
      const order = await ordersService.createOrderFromSale(
        finalizingOpportunity.id,
        selectedLeadId,
        {
          delivery_address: data.delivery_address,
          internal_code: data.internal_code,
          notes: data.notes,
          customer_name: leadDetails?.lead.name || '',
          customer_phone: leadDetails?.lead.phone || '',
        },
        user.id
      );

      // 2. Update opportunity stage to WON (explicitly to ensure consistency)
      await crmService.updateOpportunityStage(finalizingOpportunity.id, OpportunityStage.WON, selectedLeadId);

      // 3. Success - navigate to pipeline
      showSuccess('Pedido criado com sucesso!');
      setCompleteSaleModalOpen(false);
      setFinalizingOpportunity(null);
      navigate('/app/pipeline');
    } catch (error: any) {
      console.error('[CRM] Failed to complete sale:', error);
      const errorMessage = error?.message || error?.details || 'Erro ao criar pedido';
      showError(errorMessage);
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
        const fromLabel = OPPORTUNITY_STAGE_LABELS[event.meta.from] || event.meta.from;
        const toLabel = OPPORTUNITY_STAGE_LABELS[event.meta.to] || event.meta.to;
        return `Oportunidade movida de "${fromLabel}" para "${toLabel}"`;
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

  return (
    <div className="p-8">
      {/* Modais globais - fora das condicionais */}
      <CompleteSaleDialog
        open={completeSaleModalOpen}
        onClose={() => {
          setCompleteSaleModalOpen(false);
          setFinalizingOpportunity(null);
        }}
        onConfirm={handleCompleteSale}
        initialCustomerName={leadDetails?.lead.name || ''}
      />

      <HardDeleteConfirmDialog
        open={hardDeleteDialogOpen}
        onClose={() => setHardDeleteDialogOpen(false)}
        onConfirm={handleConfirmHardDelete}
        entityType={deletingEntity?.type === 'lead' ? 'Lead' : 'Pedido'}
        entityName={deletingEntity?.name}
      />

      {/* New Lead Manual Modal */}
      <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Lead Manual</DialogTitle>
            <DialogDescription>
              Cadastre um lead proveniente de outro canal (telefone, loja, etc.)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="lead_name">Nome *</Label>
              <Input
                id="lead_name"
                value={newLeadData.name}
                onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                disabled={creatingLead}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_phone">Telefone *</Label>
              <Input
                id="lead_phone"
                value={newLeadData.phone}
                onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                disabled={creatingLead}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_channel">Origem *</Label>
              <Select
                value={newLeadData.channel}
                onValueChange={(value) => setNewLeadData({ ...newLeadData, channel: value })}
                disabled={creatingLead}
              >
                <SelectTrigger id="lead_channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (CRM)</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="loja">Loja Física</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_notes">Observação</Label>
              <Textarea
                id="lead_notes"
                value={newLeadData.notes}
                onChange={(e) => setNewLeadData({ ...newLeadData, notes: e.target.value })}
                disabled={creatingLead}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_product">Produto de Interesse (opcional)</Label>
              <Select
                value={newLeadData.product_id}
                onValueChange={(value) => setNewLeadData({ ...newLeadData, product_id: value })}
                disabled={creatingLead}
              >
                <SelectTrigger id="lead_product">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create_opportunity"
                checked={newLeadData.createOpportunity}
                onCheckedChange={(checked) => setNewLeadData({ ...newLeadData, createOpportunity: checked })}
                disabled={creatingLead}
              />
              <Label htmlFor="create_opportunity" className="cursor-pointer">
                Criar oportunidade junto (inicia em "Falando com Humano")
              </Label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setNewLeadModalOpen(false)}
                disabled={creatingLead}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateManualLead} disabled={creatingLead}>
                {creatingLead ? 'Criando...' : 'Criar Lead'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!selectedLeadId ? (
        // List View
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Gestão de Leads</h1>
            <div className="flex gap-2">
              <Button onClick={() => setNewLeadModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                Novo Lead
              </Button>
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
                <TabsTrigger value="new">Novos ({leads.filter(isNewLead).length})</TabsTrigger>
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
                        {hasNewInterest(lead) && (
                          <Badge className="bg-blue-600 text-white">
                            <Bell size={12} className="mr-1" />
                            Novo Interesse
                          </Badge>
                        )}
                        {isNewLead(lead) && (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle size={12} className="mr-1" />
                            Novo
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
                        {OPPORTUNITY_STAGE_LABELS[lead.status as OpportunityStage] || lead.status.replace(/_/g, ' ')}
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
      ) : (
        // Detail View
        <div>
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
                  {/* Show delete option only if lead is archived */}
                  {isMaster && leadDetails.lead.archived && !leadsWithOrders.has(leadDetails.lead.id) && (
                    <DropdownMenuItem 
                      onClick={() => handleDeleteLead(leadDetails.lead.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Excluir Permanentemente
                    </DropdownMenuItem>
                  )}
                  {/* Show warning if archived lead has orders */}
                  {isMaster && leadDetails.lead.archived && leadsWithOrders.has(leadDetails.lead.id) && (
                    <div className="px-2 py-1.5 text-sm text-gray-500 flex items-start gap-2">
                      <Info size={14} className="mt-0.5 flex-shrink-0" />
                      <span className="text-xs">
                        Lead arquivado possui pedidos vinculados. Não é possível excluir.
                      </span>
                    </div>
                  )}
                  {/* Show Hard Delete option for Master users (no archived restriction) */}
                  {isMaster && (
                    <DropdownMenuItem 
                      onClick={handleHardDeleteLead}
                      className="text-red-600 font-semibold"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Excluir Definitivamente (Hard Delete)
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
                                  {OPPORTUNITY_STAGE_LABELS[opp.stage as OpportunityStage] || opp.stage.replace(/_/g, ' ')}
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
                                {isMaster && !opportunitiesWithOrders.has(opp.id) && (
                                  <Button
                                    onClick={() => handleDeleteOpportunity(opp.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                )}
                                {isMaster && opportunitiesWithOrders.has(opp.id) && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                    <Info size={12} />
                                    <span>Possui pedido</span>
                                  </div>
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
      )}
    </div>
  );
};

export default CRM;