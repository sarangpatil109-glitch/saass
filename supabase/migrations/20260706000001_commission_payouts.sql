-- Migration: Commission Payout Center Support

-- 1. Add amount_paid to commissions to support partial payments natively
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS exec_amount_paid NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_amount_paid NUMERIC(15,2) DEFAULT 0;

-- 2. Create the new commission_payments audit table
CREATE TABLE IF NOT EXISTS public.commission_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID REFERENCES public.commissions(id) ON DELETE SET NULL, -- Nullable for lump sum payments
    sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    payee_type TEXT NOT NULL, -- 'sales_executive' or 'vendor'
    amount NUMERIC(15,2) NOT NULL,
    payment_mode TEXT,
    payment_reference TEXT,
    admin_notes TEXT,
    status TEXT DEFAULT 'Paid',
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trigger for updated_at
CREATE TRIGGER update_commission_payments_updated_at 
BEFORE UPDATE ON public.commission_payments 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Enable RLS and setup basic policies (Admin full access, others read own using email matching)
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission_payments" ON public.commission_payments 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Sales Execs can read own commission_payments" ON public.commission_payments 
FOR SELECT USING (
  sales_exec_id IN (
    SELECT id FROM public.sales_executives WHERE email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Vendors can read own commission_payments" ON public.commission_payments 
FOR SELECT USING (
  vendor_id IN (
    SELECT id FROM public.vendors WHERE email = (auth.jwt() ->> 'email')
  )
);
