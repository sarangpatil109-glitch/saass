-- 20260705000003_update_leads.sql

ALTER TABLE leads RENAME COLUMN owner_name TO customer_name;
ALTER TABLE leads RENAME COLUMN mobile TO phone;
ALTER TABLE leads RENAME COLUMN whatsapp TO whatsapp_number;
ALTER TABLE leads RENAME COLUMN vendor_id TO assigned_vendor_id;
ALTER TABLE leads RENAME COLUMN sales_exec_id TO assigned_sales_executive_id;
ALTER TABLE leads RENAME COLUMN current_stage TO pipeline_stage;
ALTER TABLE leads RENAME COLUMN expected_closing_date TO expected_close_date;
ALTER TABLE leads RENAME COLUMN estimated_deal_value TO expected_value;

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS lead_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'Open',
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS won_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lost_reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- For interested_product to product_id mapping if needed, skipping data migration for now.

-- Followups Table
CREATE TABLE IF NOT EXISTS lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  followup_date TIMESTAMPTZ NOT NULL,
  followup_type TEXT CHECK (followup_type IN ('Call', 'WhatsApp', 'Meeting', 'Video Call', 'Email')),
  status TEXT CHECK (status IN ('Pending', 'Completed', 'Rescheduled', 'Missed')) DEFAULT 'Pending',
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes Table
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for admin users on lead_followups" ON lead_followups FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on lead_notes" ON lead_notes FOR ALL TO authenticated USING (true);
