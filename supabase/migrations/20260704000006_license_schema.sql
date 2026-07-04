-- License Management Schema

CREATE TABLE IF NOT EXISTS license_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  max_devices INTEGER NOT NULL DEFAULT 1,
  offline_grace_period_days INTEGER NOT NULL DEFAULT 7,
  default_expiry_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO license_policies (name, max_devices, offline_grace_period_days, default_expiry_days) VALUES 
('Single Device Annual', 1, 7, 365),
('Multi Device Lifetime', 5, 30, NULL);

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES product_instances(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES license_policies(id),
  license_type TEXT CHECK (license_type IN ('Trial', 'Lifetime', 'Annual', 'Monthly', 'Custom')),
  status TEXT CHECK (status IN ('Pending', 'Active', 'Suspended', 'Revoked', 'Expired', 'Blocked')) DEFAULT 'Pending',
  activation_limit INTEGER NOT NULL DEFAULT 1,
  current_activations INTEGER NOT NULL DEFAULT 0,
  issued_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL, -- Machine Fingerprint
  device_name TEXT,
  os_info TEXT,
  app_version TEXT,
  registered_date TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('Active', 'Deactivated', 'Blocked')) DEFAULT 'Active',
  UNIQUE(license_id, device_id)
);

CREATE TABLE IF NOT EXISTS license_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  device_id UUID REFERENCES license_devices(id) ON DELETE CASCADE,
  ip_address TEXT,
  activation_token TEXT, -- Signed offline token
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS license_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  device_id UUID REFERENCES license_devices(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES auth.users(id), -- Null if system/api
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE license_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access license_policies" ON license_policies FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access licenses" ON licenses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access license_devices" ON license_devices FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access license_activations" ON license_activations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin full access license_activity_logs" ON license_activity_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Triggers
CREATE TRIGGER update_license_policies_updated_at BEFORE UPDATE ON license_policies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
