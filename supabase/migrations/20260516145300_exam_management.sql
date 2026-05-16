-- Migration for Exam and Marks Management
-- Created at 2026-05-16 14:53:00

-- Assessments (e.g., Quiz 1, Assignment 2, Midterm)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  section TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quiz', 'assignment', 'midterm', 'final')),
  title TEXT NOT NULL,         -- e.g., "Quiz 1", "Assignment 2"
  total_marks NUMERIC NOT NULL,
  conducted_date DATE,
  created_by TEXT,             -- faculty id
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student marks per assessment
CREATE TABLE IF NOT EXISTS marks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  obtained_marks NUMERIC,      -- NULL means not yet submitted/marked
  submitted_at TIMESTAMPTZ,
  remarks TEXT
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_assessments_lookup ON assessments(course_id, section, department);
CREATE INDEX IF NOT EXISTS idx_marks_assessment ON marks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
