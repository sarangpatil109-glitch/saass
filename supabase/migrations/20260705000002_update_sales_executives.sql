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
