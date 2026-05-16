-- Migration to add fee_payments and update financials table
-- Created at 2026-05-16 14:45:00

-- Add total_fee and semester to financials if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financials' AND column_name='total_fee') THEN
        ALTER TABLE financials ADD COLUMN total_fee NUMERIC(10, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financials' AND column_name='semester') THEN
        ALTER TABLE financials ADD COLUMN semester TEXT;
    END IF;
END $$;

-- Add unique constraint to student_id for upsert logic
ALTER TABLE financials DROP CONSTRAINT IF EXISTS financials_student_id_key;
ALTER TABLE financials ADD CONSTRAINT financials_student_id_key UNIQUE (student_id);

-- Create fee_payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL, -- Storing university_id / Reg No
  amount_paid NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
