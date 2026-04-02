import { OpportunityStage, OrderStage, Role } from '@/constants/domain';

export interface Profile {
  id: string;
  email?: string;
  role: Role;
  created_at: string;
  name?: string;
  is_active?: boolean;
  must_change_password?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_public: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  product_id: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  lead_id: string;
  stage: OpportunityStage;
  estimated_value?: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  lead_id?: string;
  opportunity_id?: string;
  stage: OrderStage;
  total_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  from_stage: OrderStage | null;
  to_stage: OrderStage;
  triggered_by: string; // user_id
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  event_type: string; // e.g., 'lead.created', 'order.stage_changed'
  is_active: boolean;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  endpoint_id: string;
  payload: Record<string, any>;
  status_code: number;
  response_body?: string;
  attempted_at: string;
}