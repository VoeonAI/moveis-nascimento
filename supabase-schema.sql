-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'gestor' CHECK (role IN ('master', 'gestor', 'estoque')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Anyone can view public products" ON products FOR SELECT USING (is_public = true);
CREATE POLICY "Only authenticated users can view all products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only masters can manage products" ON products FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'master'
);

-- LEADS
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Authenticated users can view leads" ON leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can create a lead" ON leads FOR INSERT WITH CHECK (true);

-- OPPORTUNITIES
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  stage TEXT NOT NULL CHECK (stage IN ('new_interest', 'talking_ai', 'talking_human', 'proposal_sent', 'won', 'lost')),
  estimated_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Authenticated users can view opportunities" ON opportunities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create opportunities" ON opportunities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update opportunities" ON opportunities FOR UPDATE USING (auth.role() = 'authenticated');

-- ORDERS
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  opportunity_id UUID REFERENCES opportunities(id),
  stage TEXT NOT NULL CHECK (stage IN ('order_created', 'production_or_purchase', 'quality_check', 'ready_to_ship', 'shipped', 'delivered', 'canceled')),
  total_value NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Authenticated users can view orders" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Roles can manage orders" ON orders FOR ALL USING (
  auth.role() = 'authenticated' AND 
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('master', 'gestor', 'estoque')
);

-- ORDER_EVENTS
CREATE TABLE order_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  triggered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Authenticated users can view order events" ON order_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can create order events" ON order_events FOR INSERT WITH CHECK (true);

-- WEBHOOK_ENDPOINTS
CREATE TABLE webhook_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Only masters can view webhooks" ON webhook_endpoints FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'master'
);
CREATE POLICY "Only masters can manage webhooks" ON webhook_endpoints FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'master'
);

-- WEBHOOK_LOGS
CREATE TABLE webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint_id UUID REFERENCES webhook_endpoints(id),
  payload JSONB,
  status_code INTEGER,
  response_body TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE POLICY "Only masters can view webhook logs" ON webhook_logs FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'master'
);
CREATE POLICY "System can create logs" ON webhook_logs FOR INSERT WITH CHECK (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'gestor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();