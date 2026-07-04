-- Lead CRM & Customer Pipeline Schema

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  interested_product TEXT,
  lead_source TEXT DEFAULT 'Manual',
  vendor_id UUID REFERENCES vendors(id) ON DELETE RESTRICT,
  sales_exec_id UUID REFERENCES sales_executives(id) ON DELETE RESTRICT,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  current_stage TEXT CHECK (current_stage IN ('New Lead', 'Contacted', 'Call Back', 'Interested', 'Demo Scheduled', 'Demo Completed', 'Negotiation', 'Payment Pending', 'Won', 'Lost', 'Archived')) DEFAULT 'New Lead',
  expected_closing_date DATE,
  estimated_deal_value NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  purchased_product TEXT,
  vendor_id UUID REFERENCES vendors(id) ON DELETE RESTRICT,
  sales_exec_id UUID REFERENCES sales_executives(id) ON DELETE RESTRICT,
  status TEXT CHECK (status IN ('Active', 'Inactive', 'Suspended')) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  followup_date DATE NOT NULL,
  followup_time TIME,
  type TEXT CHECK (type IN ('Call', 'WhatsApp', 'Meeting', 'Video Call', 'Visit', 'Email')),
  notes TEXT,
  status TEXT CHECK (status IN ('Pending', 'Completed', 'Missed')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES sales_executives(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  due_date DATE,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  status TEXT CHECK (status IN ('Pending', 'Completed')) DEFAULT 'Pending',
  reminder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  call_date TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0, -- in seconds
  outcome TEXT CHECK (outcome IN ('Interested', 'Not Interested', 'Busy', 'No Answer', 'Other')),
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access policy 
CREATE POLICY "Enable all access for admin users on leads" ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on followups" ON followups FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on tasks" ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on call_logs" ON call_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on lead_timeline" ON lead_timeline FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on crm_activity_logs" ON crm_activity_logs FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_followups_updated_at BEFORE UPDATE ON followups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
