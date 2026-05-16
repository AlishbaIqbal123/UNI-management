-- Add storage_path to timetable_uploads
ALTER TABLE timetable_uploads ADD COLUMN IF NOT EXISTS storage_path TEXT;
