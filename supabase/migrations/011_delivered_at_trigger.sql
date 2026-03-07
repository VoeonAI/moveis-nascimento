-- Create function to update delivered_at when stage changes to 'delivered'
CREATE OR REPLACE FUNCTION public.handle_delivered_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.current_stage = 'delivered' AND (OLD.delivered_at IS NULL OR OLD.current_stage != 'delivered') THEN
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to call the function on order update
DROP TRIGGER IF EXISTS on_order_delivered_timestamp ON orders;
CREATE TRIGGER on_order_delivered_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_delivered_timestamp();