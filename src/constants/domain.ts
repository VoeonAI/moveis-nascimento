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
  PREPARING_ORDER = 'preparing_order',
  ASSEMBLY = 'assembly',
  READY_TO_SHIP = 'ready_to_ship',
  DELIVERY_ROUTE = 'delivery_route',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

export const ORDER_STAGES_FLOW: OrderStage[] = [
  OrderStage.ORDER_CREATED,
  OrderStage.PREPARING_ORDER,
  OrderStage.ASSEMBLY,
  OrderStage.READY_TO_SHIP,
  OrderStage.DELIVERY_ROUTE,
  OrderStage.DELIVERED,
];