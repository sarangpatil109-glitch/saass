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
