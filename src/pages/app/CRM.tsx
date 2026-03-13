const getStatusColor = (status: string) => {
    switch (status) {
      case 'new_interest': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'talking': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'proposal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negotiation': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new_interest': return 'Novo Interesse';
      case 'talking': return 'Em Conversa';
      case 'proposal': return 'Proposta Enviada';
      case 'negotiation': return 'Negociação';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

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
        {/* Leads List - Formato Operacional Compacto */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Leads ({filteredLeads.length})
            </CardTitle>
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
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => handleLeadSelect(lead.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedLeadId === lead.id
                        ? 'bg-green-50 border-green-500 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Nome e Follow-up */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {lead.name}
                        </p>
                      </div>
                      {lead.follow_up_needed && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300 flex-shrink-0">
                          <AlertTriangle size={10} className="mr-1" />
                          Follow-up
                        </Badge>
                      )}
                    </div>

                    {/* Telefone e Data */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          <span className="truncate">{lead.phone}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {format(new Date(lead.created_at), 'dd/MM')}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(lead.status)} text-xs font-medium`} variant="secondary">
                        {getStatusLabel(lead.status)}
                      </Badge>
                      {lead.archived && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Arquivado
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Detail - Mantendo melhorias visuais */}
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
                        {getStatusLabel(selectedLeadData.lead.status)}
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
                {/* Lead Context Card with WhatsApp - MANTIDO */}
                <LeadContextCard 
                  lead={selectedLeadData.lead}
                  lastOpportunity={selectedLeadData.opportunities[0]}
                  lastMessage={selectedLeadData.timeline[0]?.message}
                  storeWhatsApp={storeWhatsApp}
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