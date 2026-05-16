-- Migration for Excel Exam Schedule Storage
-- Created at 2026-05-16 19:40:00

-- Stores each uploaded Excel file's metadata
CREATE TABLE IF NOT EXISTS exam_schedule_uploads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name     TEXT NOT NULL,
  upload_type   TEXT NOT NULL CHECK (upload_type IN ('excel', 'pdf')),
  file_url      TEXT,              -- for PDF uploads (Supabase storage)
  semester      TEXT NOT NULL,     -- e.g. "Spring 2026"
  uploaded_by   TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- Stores each parsed exam entry from Excel sheets
CREATE TABLE IF NOT EXISTS exam_schedule_entries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id     UUID REFERENCES exam_schedule_uploads(id) ON DELETE CASCADE,
  department    TEXT NOT NULL,     -- from sheet name e.g. "CS", "EE", "ME"
  course_code   TEXT,              -- e.g. "CSC-301"
  course_title  TEXT NOT NULL,
  exam_date     DATE,
  exam_day      TEXT,              -- e.g. "Monday"
  start_time    TEXT,              -- e.g. "09:00 AM"
  end_time      TEXT,              -- e.g. "12:00 PM"
  venue         TEXT,              -- room/hall
  batch_section TEXT,              -- e.g. "BSE-FA23-6A"
  credit_hours  TEXT,
  remarks       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Assuming existing policies or open for demo)
ALTER TABLE exam_schedule_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedule_entries ENABLE ROW LEVEL SECURITY;

-- Basic policies (Public Read for Demo)
CREATE POLICY "Public Read Access Uploads" ON exam_schedule_uploads FOR SELECT USING (true);
CREATE POLICY "Public Read Access Entries" ON exam_schedule_entries FOR SELECT USING (true);
CREATE POLICY "Admin All Access Uploads" ON exam_schedule_uploads FOR ALL USING (true);
CREATE POLICY "Admin All Access Entries" ON exam_schedule_entries FOR ALL USING (true);
