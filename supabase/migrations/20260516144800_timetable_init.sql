-- Migration to add Timetable tables
-- Created at 2026-05-16 14:48:00

-- Table for timetable uploads
CREATE TABLE IF NOT EXISTS timetable_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'student' or 'teacher'
  semester_label TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Table for parsed timetable entries
CREATE TABLE IF NOT EXISTS timetable_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES timetable_uploads(id) ON DELETE CASCADE,
  timetable_type TEXT, -- 'student' or 'teacher'
  owner_label TEXT,    -- batch-section OR teacher name
  day TEXT,            -- Monday, Tuesday, etc.
  slot_number INT,     -- 1 through 6
  time_label TEXT,     -- e.g., "8:30 - 10:00 AM"
  subject TEXT,
  room_code TEXT,
  instructor TEXT,     -- for student timetables
  batch_section TEXT,  -- for teacher timetables
  session_type TEXT,   -- 'class' or 'lab'
  span INT DEFAULT 1,  -- 1 = normal, 2 = 2-hour class
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: You should manually create a storage bucket named 'timetables' in Supabase dashboard
-- and set up appropriate RLS policies for it.
