-- Product Instance Generator Schema

CREATE TABLE IF NOT EXISTS product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  template_version TEXT NOT NULL,
  status TEXT CHECK (status IN ('Published', 'Archived', 'Draft')) DEFAULT 'Draft',
  base_files_url TEXT, -- Path in storage to the raw unbranded codebase
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  template_id UUID REFERENCES product_templates(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  logo_url TEXT,
  license_placeholder TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zip_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES product_instances(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Queued', 'Generating', 'Completed', 'Failed', 'Cancelled')) DEFAULT 'Queued',
  generator_version TEXT NOT NULL DEFAULT '1.0.0',
  zip_url TEXT,
  checksum TEXT,
  error_message TEXT,
  generated_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zip_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_id UUID REFERENCES zip_generations(id) ON DELETE CASCADE,
  downloaded_by UUID REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zip_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  zip_id UUID REFERENCES zip_generations(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access product_templates" ON product_templates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access product_instances" ON product_instances FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access zip_generations" ON zip_generations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access zip_downloads" ON zip_downloads FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access zip_activity_logs" ON zip_activity_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Triggers
CREATE TRIGGER update_product_templates_updated_at BEFORE UPDATE ON product_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_product_instances_updated_at BEFORE UPDATE ON product_instances FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_zip_generations_updated_at BEFORE UPDATE ON zip_generations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
