-- Add delivered_at timestamp to orders table
ALTER TABLE orders 
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;