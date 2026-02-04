-- Update existing orders to new pipeline stages
-- Mapping:
-- production_or_purchase -> preparing_order
-- quality_check -> assembly
-- shipped -> delivery_route

UPDATE orders 
SET current_stage = 'preparing_order'
WHERE current_stage = 'production_or_purchase';

UPDATE orders 
SET current_stage = 'assembly'
WHERE current_stage = 'quality_check';

UPDATE orders 
SET current_stage = 'delivery_route'
WHERE current_stage = 'shipped';

-- Optional: Add check constraint to ensure valid stages
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_current_stage_check;
-- ALTER TABLE orders ADD CONSTRAINT orders_current_stage_check 
--   CHECK (current_stage IN ('order_created', 'preparing_order', 'assembly', 'ready_to_ship', 'delivery_route', 'delivered', 'canceled'));