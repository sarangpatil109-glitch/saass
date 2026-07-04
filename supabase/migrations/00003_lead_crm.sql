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
