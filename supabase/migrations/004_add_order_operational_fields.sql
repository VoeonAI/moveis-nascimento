-- Add operational fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to describe new fields
COMMENT ON COLUMN orders.delivery_address IS 'Endereço de entrega do pedido';
COMMENT ON COLUMN orders.order_number IS 'Número de referência do pedido (ex: PED-0001)';
COMMENT ON COLUMN orders.notes IS 'Observações adicionais sobre o pedido';