-- Migration: Add auth_user_id to sales_executives to link with Supabase Auth
ALTER TABLE public.sales_executives 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sales_executives_auth_user_id ON public.sales_executives(auth_user_id);
