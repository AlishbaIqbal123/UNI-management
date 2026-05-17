-- =======================================================
-- SQL MIGRATION: SETUP STORAGE BUCKETS AND RLS POLICIES
-- =======================================================

-- 1. Create "timetables" and "institutional-documents" public buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('timetables', 'timetables', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('institutional-documents', 'institutional-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing storage RLS policies to prevent "already exists" errors
DROP POLICY IF EXISTS "Allow public read access on timetables" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload on timetables" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on timetables" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access on institutional-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload on institutional-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on institutional-documents" ON storage.objects;

-- 3. Create RLS Policies for "timetables" bucket
CREATE POLICY "Allow public read access on timetables" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'timetables');

CREATE POLICY "Allow public upload on timetables" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'timetables');

CREATE POLICY "Allow public delete on timetables" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'timetables');

-- 4. Create RLS Policies for "institutional-documents" bucket
CREATE POLICY "Allow public read access on institutional-documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'institutional-documents');

CREATE POLICY "Allow public upload on institutional-documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'institutional-documents');

CREATE POLICY "Allow public delete on institutional-documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'institutional-documents');
