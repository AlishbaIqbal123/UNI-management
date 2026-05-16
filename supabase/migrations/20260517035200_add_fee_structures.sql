-- Add Fee Structures Table
-- Created at 2026-05-17 03:52:00

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id TEXT NOT NULL,
    semester TEXT NOT NULL,
    total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(department_id, semester)
);
