-- ==========================================
-- SAASS - CLEAN PRODUCTION SCHEMA
-- Idempotent, Safe for multiple runs.
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'sales_executive', 'customer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- DROP EXISTING POLICIES & TRIGGERS
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    FOR r IN (SELECT trigger_schema, event_object_table, trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', r.trigger_name, r.trigger_schema, r.event_object_table);
    END LOOP;
END $$;

-- MODULE 1: AUTH & PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 2: VENDORS
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code TEXT UNIQUE NOT NULL,
    coupon_code TEXT UNIQUE,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    address TEXT, city TEXT, state TEXT, country TEXT DEFAULT 'India',
    logo_url TEXT, notes TEXT,
    commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.vendor_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'vendor_admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, user_id)
);
CREATE TABLE IF NOT EXISTS public.vendor_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    action TEXT NOT NULL, details TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.vendor_coupon_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true, deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    product_id UUID, -- References products, added below
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, product_id)
);

-- MODULE 3: SALES EXECUTIVES
CREATE TABLE IF NOT EXISTS public.sales_executives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    vendor_code TEXT, vendor_coupon_code TEXT,
    employee_code TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL, last_name TEXT NOT NULL, full_name TEXT,
    email TEXT UNIQUE NOT NULL, phone TEXT,
    designation TEXT DEFAULT 'Sales Executive', joining_date DATE,
    monthly_target NUMERIC DEFAULT 0, target_amount NUMERIC DEFAULT 0,
    commission_percentage NUMERIC DEFAULT 10,
    whatsapp_number TEXT, address TEXT, city TEXT, state TEXT, country TEXT DEFAULT 'India',
    profile_photo TEXT, notes TEXT, status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.sales_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
    action TEXT NOT NULL, details TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sales_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
    period TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
    target_amount NUMERIC DEFAULT 0, achieved_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 4: PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL, is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Fix vendor_products foreign key now that products exists
ALTER TABLE public.vendor_products DROP CONSTRAINT IF EXISTS vendor_products_product_id_fkey;
ALTER TABLE public.vendor_products ADD CONSTRAINT vendor_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.product_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    version_number TEXT NOT NULL, release_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.product_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.product_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    action TEXT NOT NULL, details TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.product_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 5: CRM (LEADS & CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    name TEXT NOT NULL, business_name TEXT, email TEXT, phone TEXT,
    requirement TEXT, status TEXT DEFAULT 'New', value NUMERIC DEFAULT 0,
    expected_close_date DATE, assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT UNIQUE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    source_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL, business_name TEXT, business_type TEXT,
    email TEXT, phone TEXT, whatsapp TEXT, address TEXT, city TEXT, state TEXT, country TEXT DEFAULT 'India',
    gst_number TEXT, status TEXT DEFAULT 'Active', notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.lead_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    action TEXT NOT NULL, notes TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.lead_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL, notes TEXT, status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    note TEXT NOT NULL, created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    followup_date TIMESTAMPTZ NOT NULL, status TEXT DEFAULT 'Scheduled', notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.crm_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, details TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, description TEXT, due_date TIMESTAMPTZ, status TEXT DEFAULT 'Pending',
    assigned_to UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 6: LICENSES
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'Standard', status TEXT DEFAULT 'Active', expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.license_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.license_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_identifier TEXT NOT NULL, last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.license_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL, activated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.license_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    action TEXT NOT NULL, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.license_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, details TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 7: ZIP GENERATOR
CREATE TABLE IF NOT EXISTS public.zips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, file_url TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.zip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pending', requested_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.generated_zips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL, version TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.zip_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Completed', file_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.zip_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_id UUID REFERENCES public.zips(id) ON DELETE CASCADE,
    downloaded_by UUID REFERENCES auth.users(id), downloaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.zip_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, details TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 8: ORDERS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    payment_id TEXT, invoice_id TEXT,
    license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    zip_generation_id UUID REFERENCES public.generated_zips(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax NUMERIC(15,2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Pending', payment_status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.delivery_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL, delivery_status TEXT DEFAULT 'Delivered',
    delivered_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL, payment_method TEXT,
    status TEXT DEFAULT 'Completed', transaction_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL, amount NUMERIC(15,2) NOT NULL, status TEXT DEFAULT 'Issued',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.refund_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL, reason TEXT, status TEXT DEFAULT 'Processed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL, processed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payment_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    status TEXT NOT NULL, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    action TEXT NOT NULL, details TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 9: COMMISSIONS
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0, status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    default_percentage NUMERIC DEFAULT 10, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.commission_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL, status TEXT DEFAULT 'Paid', paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.commission_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
    balance NUMERIC(15,2) DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.commission_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.commission_wallets(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('credit', 'debit')), amount NUMERIC(15,2) NOT NULL, description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.commission_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) DEFAULT 0, status TEXT DEFAULT 'Pending', recipient_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.commission_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, details TEXT, performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE 10: GENERAL LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ENABLE RLS & CREATE POLICIES
-- ==========================================
DO $$ 
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('CREATE POLICY "Enable all access for authenticated users on %I" ON public.%I FOR ALL TO authenticated USING (true);', t, t);
    END LOOP;
END $$;

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'updated_at' LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', t, t);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION sync_sales_exec_vendor_code()
RETURNS TRIGGER AS $$
DECLARE v_code TEXT;
BEGIN
    SELECT vendor_code INTO v_code FROM public.vendors WHERE id = NEW.vendor_id;
    IF v_code IS NOT NULL THEN NEW.vendor_code := v_code; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_vendor_code
BEFORE INSERT OR UPDATE OF vendor_id ON public.sales_executives
FOR EACH ROW EXECUTE PROCEDURE sync_sales_exec_vendor_code();

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor_files', 'vendor_files', true), ('product_files', 'product_files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Vendor Files" ON storage.objects FOR SELECT USING ( bucket_id = 'vendor_files' OR bucket_id = 'product_files' );
CREATE POLICY "Admin Upload Access Vendor Files" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'vendor_files' OR bucket_id = 'product_files' );
CREATE POLICY "Admin Update Access Vendor Files" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'vendor_files' OR bucket_id = 'product_files' );
CREATE POLICY "Admin Delete Access Vendor Files" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'vendor_files' OR bucket_id = 'product_files' );
