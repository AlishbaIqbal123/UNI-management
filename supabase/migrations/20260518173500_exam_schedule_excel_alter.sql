-- Migration to alter exam schedule entries and add missing columns for Excel importing
-- Created at 2026-05-18 17:35:00

ALTER TABLE exam_schedule_entries ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE exam_schedule_entries ADD COLUMN IF NOT EXISTS exam_date_label TEXT;
ALTER TABLE exam_schedule_entries ADD COLUMN IF NOT EXISTS instructor TEXT;
ALTER TABLE exam_schedule_entries ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE exam_schedule_entries ADD COLUMN IF NOT EXISTS strength TEXT;
