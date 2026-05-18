-- Add offered_batches and prerequisites columns to the courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS offered_batches TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites TEXT;

-- Update existing default courses to set batch offerings and prerequisites
UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025,Spring 2026', prerequisites = 'None' WHERE course_code = 'CSC101';
UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025,Spring 2026', prerequisites = 'None' WHERE course_code = 'CSC112';
UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025,Spring 2026', prerequisites = 'None' WHERE course_code = 'ENV101';
UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025,Spring 2026', prerequisites = 'None' WHERE course_code = 'MGT101';
UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025,Spring 2026', prerequisites = 'None' WHERE course_code = 'BIO101';

UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025', prerequisites = 'None' WHERE course_code = 'MTH101';
UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025', prerequisites = 'CSC101' WHERE course_code = 'CSC241';
UPDATE courses SET offered_batches = 'Fall 2024,Spring 2025', prerequisites = 'MTH101' WHERE course_code = 'CSC211';
