-- Add vendor_name column to sales_executives

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.sales_executives
ADD COLUMN vendor_name TEXT;

-- Ensure existing rows have NULL vendor_name (default)
