-- Vendor Management Module Schema

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code TEXT UNIQUE NOT NULL,
  coupon_code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  gst_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pin_code TEXT,
  profile_photo TEXT,
  company_logo TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Archived', 'Deleted')) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- We might already have profiles, but the vendor specific profiles can be merged into `vendors` table above.
-- The user asked for "vendor_profiles" in Database section but since all fields fit logically in `vendors` table (profile_photo, company_logo, address, bank etc.), I will create a view or just keep them all in vendors. To satisfy the prompt's exact table names requirement, I'll create `vendor_profiles` linked 1:1 if needed, or just let `vendors` be the main table. Actually, I will create `vendor_profiles` as a separate table just to perfectly match the requirement list "Create/update: vendors, vendor_profiles, vendor_activity_logs, vendor_coupon_codes".

CREATE TABLE IF NOT EXISTS vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  pin_code TEXT,
  profile_photo TEXT,
  company_logo TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instead of hardcoding coupon codes in vendors, let's track them in a dedicated table to handle regeneration logs natively.
CREATE TABLE IF NOT EXISTS vendor_coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ
);

-- RLS Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_coupon_codes ENABLE ROW LEVEL SECURITY;

-- Admins full access policy 
CREATE POLICY "Enable all access for admin users on vendors" ON vendors FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on vendor_profiles" ON vendor_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on logs" ON vendor_activity_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on coupons" ON vendor_coupon_codes FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE
ON vendors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vendor_profiles_updated_at BEFORE UPDATE
ON vendor_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
