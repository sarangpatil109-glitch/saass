-- Sales Executive Management Module Schema

CREATE TABLE IF NOT EXISTS sales_executives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  vendor_id UUID REFERENCES vendors(id) ON DELETE RESTRICT,
  vendor_code TEXT NOT NULL,
  vendor_coupon_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  profile_photo TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  role TEXT DEFAULT 'Sales Executive',
  notes TEXT,
  status TEXT CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Archived', 'Deleted')) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_exec_id UUID UNIQUE REFERENCES sales_executives(id) ON DELETE CASCADE,
  preferred_language TEXT,
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_exec_id UUID REFERENCES sales_executives(id) ON DELETE CASCADE,
  period TEXT CHECK (period IN ('Monthly', 'Quarterly', 'Yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  completed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

CREATE TABLE IF NOT EXISTS sales_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_exec_id UUID REFERENCES sales_executives(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE sales_executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access policy 
CREATE POLICY "Enable all access for admin users on sales_executives" ON sales_executives FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on sales_profiles" ON sales_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on sales_targets" ON sales_targets FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on sales_activity_logs" ON sales_activity_logs FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_sales_executives_updated_at BEFORE UPDATE
ON sales_executives FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sales_profiles_updated_at BEFORE UPDATE
ON sales_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE
ON sales_targets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
