-- ==========================================
-- FILE: 00000_initial_schema.sql
-- ==========================================

-- Create roles enum
CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'sales_executive', 'customer');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Vendors table
CREATE TABLE public.vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Sales Executives table
CREATE TABLE public.sales_executives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    region TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sales_executives ENABLE ROW LEVEL SECURITY;

-- Products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL, -- e.g., Gym, Swimming, Tuition, Salon, Clinic
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Customers table
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Sales table
CREATE TABLE public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Commissions table
CREATE TABLE public.commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Licenses table
CREATE TABLE public.licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    license_key TEXT UNIQUE NOT NULL,
    valid_until TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Generated ZIPs table
CREATE TABLE public.generated_zips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'ready',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.generated_zips ENABLE ROW LEVEL SECURITY;

-- Delivery History table
CREATE TABLE public.delivery_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zip_id UUID REFERENCES public.generated_zips(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    delivery_status TEXT DEFAULT 'sent',
    delivered_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.delivery_history ENABLE ROW LEVEL SECURITY;

-- Activity Logs table
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Settings table
CREATE TABLE public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Basic setup, to be refined based on exact requirements)

-- Profiles: Users can read their own profile. Admins can read all.
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Vendors: Vendors can read their own vendor record. Admins can read all.
CREATE POLICY "Vendors can read own record" ON public.vendors FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admins can read all vendors" ON public.vendors FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sales Executives: Sales execs can read their own record. Admins can read all.
CREATE POLICY "Sales execs can read own record" ON public.sales_executives FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admins can read all sales execs" ON public.sales_executives FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Products: Everyone can read active products. Admins can manage all.
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Customers: Vendors/Sales execs can read their own customers. Admins can read all.
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- Note: Further granular policies needed for vendors/sales based on relations.

-- Sales: Vendors/Sales execs see their own sales.
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Sales Execs see own sales" ON public.sales FOR SELECT USING (sales_executive_id IN (SELECT id FROM public.sales_executives WHERE profile_id = auth.uid()));
CREATE POLICY "Vendors see own sales" ON public.sales FOR SELECT USING (vendor_id IN (SELECT id FROM public.vendors WHERE profile_id = auth.uid()));

-- Set up triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sales_executives_updated_at BEFORE UPDATE ON public.sales_executives FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==========================================
-- FILE: 00001_vendor_enhancements.sql
-- ==========================================

-- Add new fields to the vendors table
ALTER TABLE public.vendors
ADD COLUMN vendor_code TEXT UNIQUE,
ADD COLUMN owner_name TEXT,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT,
ADD COLUMN profile_image TEXT,
ADD COLUMN notes TEXT;

-- Update the profiles table to ensure 'status' is managed. We'll add it there to apply system-wide blocks.
ALTER TABLE public.profiles
ADD COLUMN status TEXT DEFAULT 'active'; -- 'active', 'inactive', 'suspended', 'deleted'

-- We can keep the vendors status column in sync or just rely on profiles.status for login access.
-- The prompt specifies Vendor status, so we'll maintain the vendors.status as the primary source of truth for the Vendor entity.

-- Function to generate a unique vendor code
CREATE OR REPLACE FUNCTION generate_vendor_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    is_unique BOOLEAN := false;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate a code like VND-XXXXX
        new_code := 'VND-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
        
        -- Check if it exists
        IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE vendor_code = new_code) THEN
            is_unique := true;
        END IF;
    END LOOP;
    
    NEW.vendor_code := new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign vendor code if not provided
CREATE TRIGGER assign_vendor_code
BEFORE INSERT ON public.vendors
FOR EACH ROW
WHEN (NEW.vendor_code IS NULL)
EXECUTE PROCEDURE generate_vendor_code();


-- ==========================================
-- FILE: 00002_sales_exec_enhancements.sql
-- ==========================================

-- Add new fields to the sales_executives table
ALTER TABLE public.sales_executives
ADD COLUMN full_name TEXT,
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN country TEXT,
ADD COLUMN profile_photo TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
ADD COLUMN vendor_code TEXT;

-- Enforce strict vendor linking. We can't set NOT NULL immediately if there's existing bad data, but since it's a new setup:
ALTER TABLE public.sales_executives ALTER COLUMN vendor_id SET NOT NULL;

-- Customer Foundation: Each customer belongs to one Sales Executive
ALTER TABLE public.customers
ADD COLUMN sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL;

-- Function to ensure vendor_code stays perfectly synchronized with vendor_id
CREATE OR REPLACE FUNCTION sync_sales_exec_vendor_code()
RETURNS TRIGGER AS $$
DECLARE
    v_code TEXT;
BEGIN
    SELECT vendor_code INTO v_code FROM public.vendors WHERE id = NEW.vendor_id;
    IF v_code IS NULL THEN
        RAISE EXCEPTION 'Invalid Vendor ID or Vendor has no code.';
    END IF;
    NEW.vendor_code := v_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate and validate vendor_code on insert or vendor_id update
CREATE TRIGGER trg_sync_vendor_code
BEFORE INSERT OR UPDATE OF vendor_id ON public.sales_executives
FOR EACH ROW
EXECUTE PROCEDURE sync_sales_exec_vendor_code();


-- ==========================================
-- FILE: 00003_lead_crm.sql
-- ==========================================

-- Create Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    interested_product_id UUID REFERENCES public.products(id),
    source TEXT NOT NULL, -- Website, Phone Call, WhatsApp, Facebook, Instagram, Referral, Walk-in, Manual, Other
    priority TEXT NOT NULL, -- Low, Medium, High, Urgent
    stage TEXT NOT NULL DEFAULT 'New Lead', -- New Lead, Contacted, Demo Scheduled, Demo Completed, Follow-up, Payment Pending, Won, Lost, Archived
    notes TEXT,
    expected_closing_date DATE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mobile),
    UNIQUE(email)
);

-- Create Lead Followups Table
CREATE TABLE public.lead_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    followup_date DATE NOT NULL,
    followup_time TIME,
    type TEXT NOT NULL, -- Phone, WhatsApp, Meeting, Visit, Email
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Completed, Missed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Lead Timeline Table
CREATE TABLE public.lead_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Customers Table
-- customers table already exists but let's ensure it has necessary CRM fields
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS source_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT;

-- Function to auto-populate vendor_id on lead based on sales_executive_id
CREATE OR REPLACE FUNCTION set_lead_vendor_id()
RETURNS TRIGGER AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT vendor_id INTO v_id FROM public.sales_executives WHERE id = NEW.sales_executive_id;
    NEW.vendor_id := v_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_lead_vendor_id
BEFORE INSERT OR UPDATE OF sales_executive_id ON public.leads
FOR EACH ROW
EXECUTE PROCEDURE set_lead_vendor_id();

-- Indexes for performance
CREATE INDEX idx_leads_sales_exec ON public.leads(sales_executive_id);
CREATE INDEX idx_leads_vendor ON public.leads(vendor_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_lead_followups_lead ON public.lead_followups(lead_id);
CREATE INDEX idx_lead_followups_status ON public.lead_followups(status);

-- We would setup RLS here, but we will handle logic via server actions leveraging service role or via RLS policies.
-- In this demo, we'll enforce the isolation heavily in the Server Actions using context.


-- ==========================================
-- FILE: 00004_commission_engine.sql
-- ==========================================

-- 1. Commission Settings Table (Single Row Configuration)
CREATE TABLE public.commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_exec_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    vendor_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the default single row
INSERT INTO public.commission_settings (sales_exec_percentage, vendor_percentage) VALUES (10.00, 10.00);

-- 2. Sales Table (Foundation to trigger commissions)
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT,
    price NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed', -- Completed, Refunded
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Commissions Table
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT,
    product_price NUMERIC(12,2) NOT NULL,
    sales_exec_percentage NUMERIC(5,2) NOT NULL,
    vendor_percentage NUMERIC(5,2) NOT NULL,
    sales_exec_amount NUMERIC(12,2) NOT NULL,
    vendor_amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Paid, Cancelled, Reversed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sale_id) -- Prevent duplicate commissions for the same sale
);

-- 4. Automatic Commission Calculation Trigger
CREATE OR REPLACE FUNCTION calculate_and_insert_commission()
RETURNS TRIGGER AS $$
DECLARE
    settings RECORD;
    se_amount NUMERIC(12,2);
    v_amount NUMERIC(12,2);
BEGIN
    IF NEW.status = 'Completed' THEN
        -- Fetch current settings
        SELECT * INTO settings FROM public.commission_settings LIMIT 1;
        
        -- Formula implementation
        -- Sales Exec Commission = Price * (Sales Exec % / 100)
        se_amount := ROUND((NEW.price * (settings.sales_exec_percentage / 100.0)), 2);
        
        -- Vendor Commission = Sales Exec Commission * (Vendor % / 100)
        v_amount := ROUND((se_amount * (settings.vendor_percentage / 100.0)), 2);
        
        -- Insert Commission Record
        INSERT INTO public.commissions (
            sale_id,
            sales_executive_id,
            vendor_id,
            product_price,
            sales_exec_percentage,
            vendor_percentage,
            sales_exec_amount,
            vendor_amount
        ) VALUES (
            NEW.id,
            NEW.sales_executive_id,
            NEW.vendor_id,
            NEW.price,
            settings.sales_exec_percentage,
            settings.vendor_percentage,
            se_amount,
            v_amount
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_calculate_commission
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE PROCEDURE calculate_and_insert_commission();

-- Indexes
CREATE INDEX idx_commissions_se ON public.commissions(sales_executive_id);
CREATE INDEX idx_commissions_vendor ON public.commissions(vendor_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_sales_se ON public.sales(sales_executive_id);
CREATE INDEX idx_sales_vendor ON public.sales(vendor_id);


-- ==========================================
-- FILE: 00005_product_management.sql
-- ==========================================

-- 1. Product Categories Table
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Categories
INSERT INTO public.product_categories (name) VALUES 
('Gym'), ('Swimming'), ('Tuition'), ('Salon'), ('Clinic');

-- 2. Expand Products Table
-- Assuming `products` exists with id, name, description, price, status, created_at, updated_at
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS full_description TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id),
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'Hidden', -- Public, Hidden
ADD COLUMN IF NOT EXISTS demo_url TEXT,
ADD COLUMN IF NOT EXISTS demo_status TEXT NOT NULL DEFAULT 'Disabled', -- Enabled, Disabled
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS is_one_time_payment BOOLEAN NOT NULL DEFAULT true;

-- Update Status constraint (if any) or just rely on application logic for Draft, Published, Hidden, Archived, Disabled
-- For migration safety, we will just use TEXT for status.

-- Set Gym category for existing products
UPDATE public.products SET category_id = (SELECT id FROM public.product_categories WHERE name = 'Gym' LIMIT 1) WHERE category_id IS NULL;

-- 3. Product Versions Table
CREATE TABLE public.product_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    version_string TEXT NOT NULL,
    major INT NOT NULL DEFAULT 1,
    minor INT NOT NULL DEFAULT 0,
    patch INT NOT NULL DEFAULT 0,
    release_notes TEXT,
    is_current_stable BOOLEAN NOT NULL DEFAULT false,
    release_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one stable version per product
CREATE UNIQUE INDEX idx_single_stable_version ON public.product_versions (product_id) WHERE is_current_stable = true;

-- Function to handle setting a version as stable (unsets others automatically)
CREATE OR REPLACE FUNCTION set_stable_product_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current_stable = true THEN
        UPDATE public.product_versions
        SET is_current_stable = false
        WHERE product_id = NEW.product_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_stable_version
BEFORE INSERT OR UPDATE OF is_current_stable ON public.product_versions
FOR EACH ROW
EXECUTE PROCEDURE set_stable_product_version();

-- Indexes for performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_product_versions_product ON public.product_versions(product_id);


-- ==========================================
-- FILE: 00006_zip_generator.sql
-- ==========================================

-- 1. Generated ZIPs Table
CREATE TABLE public.generated_zips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_version_id UUID REFERENCES public.product_versions(id) ON DELETE RESTRICT,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'Generating', -- Generating, Completed, Downloaded, Delivered, Failed, Archived
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    download_count INT NOT NULL DEFAULT 0,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Delivery History Table
CREATE TABLE public.delivery_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_id UUID REFERENCES public.generated_zips(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    delivery_method TEXT,
    delivered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Delivered, Failed
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generated_zips_customer ON public.generated_zips(customer_id);
CREATE INDEX idx_generated_zips_product ON public.generated_zips(product_id);
CREATE INDEX idx_generated_zips_status ON public.generated_zips(status);
CREATE INDEX idx_delivery_history_zip ON public.delivery_history(zip_id);
CREATE INDEX idx_delivery_history_status ON public.delivery_history(status);


-- ==========================================
-- FILE: 00007_license_management.sql
-- ==========================================

-- 1. Licenses Table
CREATE TABLE public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_version_id UUID REFERENCES public.product_versions(id) ON DELETE RESTRICT,
    zip_id UUID REFERENCES public.generated_zips(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Active, Suspended, Revoked, Expired
    max_activations INT NOT NULL DEFAULT 1,
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. License Devices Table (Registered Devices)
CREATE TABLE public.license_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    os TEXT,
    browser TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    first_activation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(license_id, device_id)
);

-- 3. License History Table (Audit Trail)
CREATE TABLE public.license_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- Activation, Reactivation, Verification, Reset, Suspension, Revocation
    device_id TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Automated Generation Trigger on ZIP Completion
CREATE OR REPLACE FUNCTION generate_license_on_zip_completion()
RETURNS TRIGGER AS $$
DECLARE
    new_license_key TEXT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        -- Generate a simple mock unique key (e.g. XXXX-XXXX-XXXX-XXXX)
        -- In a real scenario you might want cryptographically secure strings, but for this demo:
        new_license_key := substring(md5(random()::text) from 1 for 4) || '-' ||
                           substring(md5(random()::text) from 5 for 4) || '-' ||
                           substring(md5(random()::text) from 9 for 4) || '-' ||
                           substring(md5(random()::text) from 13 for 4);
                           
        new_license_key := upper(new_license_key);

        INSERT INTO public.licenses (
            license_key,
            customer_id,
            product_id,
            product_version_id,
            zip_id,
            status,
            generated_by
        ) VALUES (
            new_license_key,
            NEW.customer_id,
            NEW.product_id,
            NEW.product_version_id,
            NEW.id,
            'Pending',
            NEW.generated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_license_on_zip
AFTER UPDATE ON public.generated_zips
FOR EACH ROW
EXECUTE PROCEDURE generate_license_on_zip_completion();

-- Indexes
CREATE INDEX idx_licenses_customer ON public.licenses(customer_id);
CREATE INDEX idx_licenses_zip ON public.licenses(zip_id);
CREATE INDEX idx_licenses_key ON public.licenses(license_key);
CREATE INDEX idx_license_devices_license ON public.license_devices(license_id);
CREATE INDEX idx_license_history_license ON public.license_history(license_id);


-- ==========================================
-- FILE: 00008_payment_system.sql
-- ==========================================

-- 1. Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_version_id UUID REFERENCES public.product_versions(id) ON DELETE RESTRICT,
    business_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Success, Failed, Cancelled, Refunded
    cashfree_order_id TEXT UNIQUE,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Payments Table (Webhook Logs)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invoices Table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Paid',
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Refund History Table
CREATE TABLE public.refund_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Refunded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to Auto-generate Invoice on Order Success
CREATE OR REPLACE FUNCTION generate_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    new_invoice_number TEXT;
    calc_tax NUMERIC(10, 2);
    calc_total NUMERIC(10, 2);
BEGIN
    IF NEW.status = 'Success' AND OLD.status != 'Success' THEN
        -- Generate Invoice Number (e.g. INV-2026-XXXX)
        new_invoice_number := 'INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || substring(md5(random()::text) from 1 for 6);
        new_invoice_number := upper(new_invoice_number);

        -- Basic Tax Mock (18% GST for example)
        calc_tax := NEW.amount * 0.18;
        calc_total := NEW.amount + calc_tax;

        INSERT INTO public.invoices (
            invoice_number,
            order_id,
            customer_id,
            business_name,
            amount,
            tax,
            grand_total
        ) VALUES (
            new_invoice_number,
            NEW.id,
            NEW.customer_id,
            NEW.business_name,
            NEW.amount,
            calc_tax,
            calc_total
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE generate_invoice_on_payment();

-- Indexes
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_invoices_order ON public.invoices(order_id);
CREATE INDEX idx_refunds_order ON public.refund_history(order_id);


-- ==========================================
-- FILE: 20260704000000_products_schema.sql
-- ==========================================

-- Product Management Module Schema
-- Extends the existing Supabase setup

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default Categories Seed
INSERT INTO product_categories (name, slug) VALUES
  ('Gym', 'gym'),
  ('Swimming Pool', 'swimming-pool'),
  ('Tuition', 'tuition'),
  ('Salon', 'salon'),
  ('Clinic', 'clinic'),
  ('Restaurant', 'restaurant'),
  ('Retail', 'retail')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  full_description TEXT,
  category_id UUID REFERENCES product_categories(id),
  version TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  billing_type TEXT CHECK (billing_type IN ('One-time', 'Monthly', 'Yearly')),
  status TEXT CHECK (status IN ('Draft', 'Published', 'Archived', 'Disabled')) DEFAULT 'Draft',
  demo_url TEXT,
  logo_url TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Support for soft deletes
);

CREATE TABLE IF NOT EXISTS product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  major INT NOT NULL DEFAULT 1,
  minor INT NOT NULL DEFAULT 0,
  patch INT NOT NULL DEFAULT 0,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  release_notes TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access policy (assume we check auth.uid() against profiles or similar, here is a generic true for authenticated to simplify if using server-side admin client)
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Enable all access for admin users" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable read access for categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Enable all access for admin users on categories" ON product_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on versions" ON product_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on logs" ON product_activity_logs FOR ALL TO authenticated USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE
ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==========================================
-- FILE: 20260704000001_vendors_schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260704000002_sales_executives_schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260704000003_crm_schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260704000004_commission_schema.sql
-- ==========================================

-- Commission Engine Schema

CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_exec_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  vendor_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- Represents % of the Sales Exec's commission
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial settings row
INSERT INTO commission_settings (sales_exec_percent, vendor_percent) VALUES (10.00, 10.00);

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_price NUMERIC(15, 2) NOT NULL,
  sales_exec_id UUID REFERENCES sales_executives(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  exec_commission_percent NUMERIC(5, 2) NOT NULL,
  exec_commission_amount NUMERIC(15, 2) NOT NULL,
  vendor_commission_percent NUMERIC(5, 2) NOT NULL,
  vendor_commission_amount NUMERIC(15, 2) NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Approved', 'Paid', 'Rejected', 'Cancelled', 'Reversed')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('Sales Executive', 'Vendor')),
  entity_id UUID NOT NULL,
  available_balance NUMERIC(15, 2) DEFAULT 0,
  pending_balance NUMERIC(15, 2) DEFAULT 0,
  paid_balance NUMERIC(15, 2) DEFAULT 0,
  lifetime_earnings NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES commission_wallets(id) ON DELETE CASCADE,
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  transaction_type TEXT CHECK (transaction_type IN ('Credit', 'Debit', 'Adjustment')),
  amount NUMERIC(15, 2) NOT NULL,
  reference TEXT NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Completed', 'Failed', 'Reversed')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- NO updated_at FOR IMMUTABILITY
);

CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES commission_wallets(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  method TEXT CHECK (method IN ('Bank', 'UPI', 'Other')),
  reference TEXT,
  status TEXT CHECK (status IN ('Pending', 'Paid', 'Failed')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access policy 
CREATE POLICY "Enable all access for admin users on commission_settings" ON commission_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commissions" ON commissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_wallets" ON commission_wallets FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_ledger" ON commission_ledger FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_payouts" ON commission_payouts FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_activity_logs" ON commission_activity_logs FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON commission_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commission_wallets_updated_at BEFORE UPDATE ON commission_wallets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commission_payouts_updated_at BEFORE UPDATE ON commission_payouts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==========================================
-- FILE: 20260704000005_generator_schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260704000006_license_schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260704000007_payment_schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260705000000_update_products.sql
-- ==========================================

-- Add new columns to products table to match the updated PRD requirements

ALTER TABLE products
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS price_monthly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS zip_template TEXT;

-- Update the status check constraint to ensure it supports Draft, Published, Archived
-- (It already supports these in the previous migration, but just in case)
-- We will leave it as is if it's already defined, or we can drop and recreate the constraint if needed.
-- But standardizing it:
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('Draft', 'Published', 'Archived', 'Disabled'));

-- Create storage bucket for product files (logos, zip templates)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product_files', 'product_files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'product_files' );

CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'product_files' );

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'product_files' );

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'product_files' );


-- ==========================================
-- FILE: 20260705000001_update_vendors.sql
-- ==========================================

-- Update Vendors Table to match PRD

ALTER TABLE vendors
RENAME COLUMN company_name TO business_name;

ALTER TABLE vendors
RENAME COLUMN company_logo TO logo_url;

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_discount_type TEXT CHECK (coupon_discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS coupon_discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_max_uses INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_used_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS coupon_status TEXT CHECK (coupon_status IN ('Active', 'Expired', 'Disabled')) DEFAULT 'Active';

-- Create vendor_products junction table
CREATE TABLE IF NOT EXISTS vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, product_id)
);

ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for admin users on vendor_products" ON vendor_products FOR ALL TO authenticated USING (true);

-- Create storage bucket for vendor logos if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor_files', 'vendor_files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Vendor Files" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'vendor_files' );

CREATE POLICY "Admin Upload Access Vendor Files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'vendor_files' );

CREATE POLICY "Admin Update Access Vendor Files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'vendor_files' );

CREATE POLICY "Admin Delete Access Vendor Files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'vendor_files' );


-- ==========================================
-- FILE: 20260705000002_update_sales_executives.sql
-- ==========================================

-- Update Sales Executives Table to match requirements

ALTER TABLE sales_executives RENAME COLUMN employee_id TO employee_code;
ALTER TABLE sales_executives RENAME COLUMN role TO designation;

ALTER TABLE sales_executives
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS target_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_target NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5, 2) DEFAULT 10.00;


-- ==========================================
-- FILE: 20260705000003_update_leads.sql
-- ==========================================

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


-- ==========================================
-- FILE: 20260705000004_update_commissions.sql
-- ==========================================

-- 20260705000004_update_commissions.sql

ALTER TABLE commission_settings RENAME COLUMN sales_exec_percent TO sales_commission_percentage;
ALTER TABLE commission_settings RENAME COLUMN vendor_percent TO vendor_commission_percentage;

ALTER TABLE commissions RENAME COLUMN sales_exec_id TO sales_executive_id;
ALTER TABLE commissions RENAME COLUMN exec_commission_percent TO sales_percentage;
ALTER TABLE commissions RENAME COLUMN exec_commission_amount TO sales_commission;
ALTER TABLE commissions RENAME COLUMN vendor_commission_percent TO vendor_percentage;
ALTER TABLE commissions RENAME COLUMN vendor_commission_amount TO vendor_commission;

ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

ALTER TABLE commission_wallets RENAME COLUMN entity_type TO user_type;
ALTER TABLE commission_wallets RENAME COLUMN entity_id TO user_id;
ALTER TABLE commission_wallets ADD COLUMN IF NOT EXISTS monthly_earnings NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE commission_ledger RENAME COLUMN reference TO remarks;
ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS balance_after NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE commission_payouts RENAME COLUMN reference TO reference_number;
ALTER TABLE commission_payouts RENAME COLUMN paid_date TO paid_at;
ALTER TABLE commission_payouts RENAME COLUMN created_at TO requested_at;
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS upi TEXT;
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS account_number TEXT;


-- ==========================================
-- FILE: 20260705000005_orders_customers_schema.sql
-- ==========================================

-- 20260705000005_orders_customers_schema.sql

-- 1. Update Customers Table
ALTER TABLE public.customers RENAME COLUMN name TO customer_name;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_code TEXT UNIQUE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Generate customer codes for existing records if null
UPDATE public.customers SET customer_code = 'CUST-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)) WHERE customer_code IS NULL;

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    payment_id TEXT,
    invoice_id TEXT, -- Connecting to invoice string/ID
    license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    zip_generation_id UUID REFERENCES public.generated_zips(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    order_status TEXT DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Awaiting Payment', 'Paid', 'Completed', 'Cancelled', 'Refunded', 'Expired', 'Renewed')),
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Success', 'Failed', 'Cancelled', 'Refunded')),
    payment_method TEXT,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    renewal_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for admin users on orders" ON public.orders FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Vendors see own orders" ON public.orders FOR SELECT TO authenticated USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);

CREATE POLICY "Sales execs see own orders" ON public.orders FOR SELECT TO authenticated USING (
    sales_executive_id IN (SELECT id FROM public.sales_executives WHERE user_id = auth.uid())
);

-- Trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==========================================
-- FILE: 20260705000006_update_licenses.sql
-- ==========================================

-- 20260705000006_update_licenses.sql

ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS product_version TEXT;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMPTZ;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS last_verification TIMESTAMPTZ;
ALTER TABLE public.licenses RENAME COLUMN issued_by TO generated_by;

-- Update license_devices
ALTER TABLE public.license_devices ADD COLUMN IF NOT EXISTS machine_fingerprint TEXT;
ALTER TABLE public.license_devices ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.license_devices RENAME COLUMN os_info TO os_name;
ALTER TABLE public.license_devices RENAME COLUMN registered_date TO activated_at;

-- Allow license_devices machine_fingerprint to be populated from device_id if needed,
-- but the objective says device_id and machine_fingerprint both exist.
-- If device_id was used as fingerprint before, copy it.
UPDATE public.license_devices SET machine_fingerprint = device_id WHERE machine_fingerprint IS NULL;

-- Update license_activity_logs (remarks instead of details)
ALTER TABLE public.license_activity_logs RENAME COLUMN details TO remarks;

-- Update orders to have license_id relation if not already
-- (already handled in 20260705000005_orders_customers_schema.sql, but licenses didn't exist then. Wait, licenses existed since 20260704000006).

-- Vendors read-only policy for their customers' licenses
CREATE POLICY "Vendors can read licenses of their orders" ON public.licenses FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.orders WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
);

-- Sales Execs read-only policy for their customers' licenses
CREATE POLICY "Sales execs can read licenses of their orders" ON public.licenses FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.orders WHERE sales_executive_id IN (SELECT id FROM public.sales_executives WHERE user_id = auth.uid()))
);


-- ==========================================
-- FILE: 20260705000008_update_generator.sql
-- ==========================================

-- Add order_id to product_instances
ALTER TABLE public.product_instances ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- Also add license_id if it's generated later? Or we can query the license via order_id.
-- Let's add license_id to zip_generations? Or just rely on order_id.
ALTER TABLE public.zip_generations ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;


