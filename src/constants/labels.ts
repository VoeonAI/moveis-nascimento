import { OrderStage, OpportunityStage } from './domain';

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  [OpportunityStage.NEW_INTEREST]: 'Novo Interesse',
  [OpportunityStage.TALKING_AI]: 'Falando com IA',
  [OpportunityStage.TALKING_HUMAN]: 'Falando com Humano',
  [OpportunityStage.PROPOSAL_SENT]: 'Proposta Enviada',
  [OpportunityStage.WON]: 'Ganho',
  [OpportunityStage.LOST]: 'Perdido',
};

export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  [OrderStage.ORDER_CREATED]: 'Pedido Criado',
  [OrderStage.PRODUCTION_OR_PURCHASE]: 'Produção/Compra',
  [OrderStage.QUALITY_CHECK]: 'Controle de Qualidade',
  [OrderStage.READY_TO_SHIP]: 'Pronto para Envio',
  [OrderStage.SHIPPED]: 'Enviado',
  [OrderStage.DELIVERED]: 'Entregue',
  [OrderStage.CANCELED]: 'Cancelado',
};

export const TIMELINE_EVENT_LABELS: Record<string, string> = {
  'note': 'Nota adicionada',
  'opportunity_created': 'Nova oportunidade criada',
  'opportunity_stage_changed': 'Estágio alterado',
  'followup_set': 'Follow-up agendado',
  'lead_archived': 'Lead arquivado',
  'lead_restored': 'Lead restaurado',
  'opportunity_archived': 'Oportunidade arquivada',
  'opportunity_restored': 'Oportunidade restaurada',
  'lead_created': 'Lead criado',
};