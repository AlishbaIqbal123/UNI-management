-- 20260516174500_enhance_notices.sql
-- Enhances the notices table with institutional metadata for precise portal targeting and lifecycle management.

ALTER TABLE notices 
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS visible_to    TEXT[] DEFAULT ARRAY['all'],
  ADD COLUMN IF NOT EXISTS category      TEXT DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS is_published  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by    TEXT,
  ADD COLUMN IF NOT EXISTS expires_at    TIMESTAMPTZ;

-- Note: created_at already exists in the original schema.
