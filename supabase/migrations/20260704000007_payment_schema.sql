-- Order Management Schema

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  cashfree_order_id TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_version TEXT,
  amount NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('Pending','Success','Failed','Cancelled','Refunded')) DEFAULT 'Pending',
  order_status TEXT CHECK (order_status IN ('Pending','Awaiting Payment','Paid','Failed','Cancelled','Refunded','Expired')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  cashfree_payment_id TEXT UNIQUE,
  payment_reference TEXT,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('Pending','Success','Failed','Cancelled','Refunded')) DEFAULT 'Pending',
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payload JSONB,
  verified BOOLEAN,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  details TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  gst_number TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  payment_reference TEXT,
  invoice_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('Pending','Paid','Cancelled','Refunded')) DEFAULT 'Pending',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  message TEXT,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refund_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  refund_reference TEXT,
  reason TEXT,
  refund_date TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (admin only)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access orders" ON orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access payments" ON payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access invoices" ON invoices FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access payment_webhooks" ON payment_webhooks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access payment_timeline" ON payment_timeline FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access payment_logs" ON payment_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access refund_history" ON refund_history FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Triggers for timestamps
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
