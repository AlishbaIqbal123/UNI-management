-- Harmonize Financials and Fee Payments Schema
-- Created at 2026-05-16 16:55:00

-- Ensure financials table has all required columns
DO $$ 
BEGIN
    -- Rename amount_due to due_amount if it exists (harmonizing with code)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financials' AND column_name='amount_due') THEN
        ALTER TABLE financials RENAME COLUMN amount_due TO due_amount;
    END IF;

    -- Add due_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financials' AND column_name='due_amount') THEN
        ALTER TABLE financials ADD COLUMN due_amount NUMERIC(10, 2) DEFAULT 0.00;
    END IF;

    -- Add fee_type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financials' AND column_name='fee_type') THEN
        ALTER TABLE financials ADD COLUMN fee_type TEXT DEFAULT 'Tuition';
    END IF;

    -- Ensure total_fee exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financials' AND column_name='total_fee') THEN
        ALTER TABLE financials ADD COLUMN total_fee NUMERIC(10, 2) DEFAULT 0.00;
    END IF;

    -- Ensure semester exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financials' AND column_name='semester') THEN
        ALTER TABLE financials ADD COLUMN semester TEXT;
    END IF;
END $$;

-- fee_payments table should already be correct from previous migration, 
-- but we ensure the names match what FinanceManagement.jsx uses.
-- amount_paid, payment_date, reference are already in 20260516144500.
