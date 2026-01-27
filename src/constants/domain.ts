export enum OpportunityStage {
  NEW_INTEREST = 'new_interest',
  TALKING_AI = 'talking_ai',
  TALKING_HUMAN = 'talking_human',
  PROPOSAL_SENT = 'proposal_sent',
  WON = 'won',
  LOST = 'lost',
}

export enum OrderStage {
  ORDER_CREATED = 'order_created',
  PRODUCTION_OR_PURCHASE = 'production_or_purchase',
  QUALITY_CHECK = 'quality_check',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

export enum Role {
  MASTER = 'master',
  GESTOR = 'gestor',
  ESTOQUE = 'estoque',
}

export const ORDER_STAGES_FLOW: OrderStage[] = [
  OrderStage.ORDER_CREATED,
  OrderStage.PRODUCTION_OR_PURCHASE,
  OrderStage.QUALITY_CHECK,
  OrderStage.READY_TO_SHIP,
  OrderStage.SHIPPED,
  OrderStage.DELIVERED,
];