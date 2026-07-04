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
