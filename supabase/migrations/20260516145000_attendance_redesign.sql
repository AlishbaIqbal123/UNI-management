-- Migration to redesign Attendance system
-- Created at 2026-05-16 14:50:00

-- Sessions (each recorded class or lab session)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  section TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('class', 'lab')),
  session_date DATE NOT NULL,
  topic TEXT,
  conducted_by TEXT, -- faculty id
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance per session per student
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_course_section ON sessions(course_id, section);
CREATE INDEX IF NOT EXISTS idx_session_attendance_student ON session_attendance(student_id);
