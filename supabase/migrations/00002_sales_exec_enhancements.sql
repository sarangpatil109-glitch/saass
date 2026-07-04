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
