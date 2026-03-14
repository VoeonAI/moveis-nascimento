<CardContent className="space-y-6">
                {/* Lead Context Card with WhatsApp */}
                <LeadContextCard 
                  lead={selectedLeadData.lead}
                  lastOpportunity={selectedLeadData.opportunities[0]}
                  lastMessage={selectedLeadData.timeline[0]?.message}
                  storeWhatsApp={storeWhatsApp}
                />

                {/* Follow-up Summary */}
                <FollowUpSummary lead={selectedLeadData.lead} />

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

// ... (restante do componente CRM)

// FollowUpSummary component
const FollowUpSummary = ({ lead }: { lead: Lead }) => {
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

  return (
    <Card className={getBackgroundColor()}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className={getIconColor()} />
            <span className="text-sm font-medium text-gray-700">Follow-up</span>
          </div>
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

// ... (restante do arquivo, incluindo export default CRM)