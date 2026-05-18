-- CUI Vehari Campus Academic Registry Initialization Migration
-- Target tables: profiles, departments, faculty

-- Defensive Schema Preparation: Ensure 'user_role' enum and 'role' column exist in 'profiles'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT', 'FACULTY', 'REGISTRAR', 'GUEST');
    END IF;
END$$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'STUDENT';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Defensive: Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert into auth.users first to satisfy foreign key constraint
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES
    ('b7b4d6b6-5f5a-4933-8a7e-123456789001', '00000000-0000-0000-0000-000000000000', 'irehman@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789002', '00000000-0000-0000-0000-000000000000', 'rashid@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789003', '00000000-0000-0000-0000-000000000000', 'muzhar@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789004', '00000000-0000-0000-0000-000000000000', 'orangzab@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789005', '00000000-0000-0000-0000-000000000000', 'tnazir@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789006', '00000000-0000-0000-0000-000000000000', 'mshahid@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789007', '00000000-0000-0000-0000-000000000000', 'mimran@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789008', '00000000-0000-0000-0000-000000000000', 'saeed@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789009', '00000000-0000-0000-0000-000000000000', 'mzahid@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789010', '00000000-0000-0000-0000-000000000000', 'sadia@cui.edu.pk', crypt('123', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now()),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789011', '00000000-0000-0000-0000-000000000000', 'finance@cui.edu.pk', crypt('admin', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 1. Insert/Upsert Faculty Profiles
INSERT INTO profiles (id, email, role, full_name, phone_number)
VALUES
    ('b7b4d6b6-5f5a-4933-8a7e-123456789001', 'irehman@cui.edu.pk', 'FACULTY', 'Dr. Inayat-ur-Rehman', '+92 312 0001112'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789002', 'rashid@cui.edu.pk', 'FACULTY', 'Dr. Rashid Jahangir', '+92 313 2223334'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789003', 'muzhar@cui.edu.pk', 'FACULTY', 'Dr. Muzhar Javed', '+92 333 4455667'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789004', 'orangzab@cui.edu.pk', 'FACULTY', 'Dr. Orangzab', '+92 332 7788990'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789005', 'tnazir@cui.edu.pk', 'FACULTY', 'Dr. Tahira Nazir', '+92 322 1122334'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789006', 'mshahid@cui.edu.pk', 'FACULTY', 'Dr. Muhammad Shahid', '+92 300 5566778'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789007', 'mimran@cui.edu.pk', 'FACULTY', 'Dr. Muhammad Imran', '+92 345 8899001'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789008', 'saeed@cui.edu.pk', 'FACULTY', 'Dr. Saeed Ahmad Qaisrani', '+92 321 4455667'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789009', 'mzahid@cui.edu.pk', 'FACULTY', 'Dr. Muhammad Zahid Abbas', '+92 315 3344557'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789010', 'sadia@cui.edu.pk', 'FACULTY', 'Dr. Sadia Bashir', '+92 331 4455668'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789011', 'finance@cui.edu.pk', 'FACULTY', 'Adnan Ahmed', '+92 314 4445556')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number;

-- 2. Insert/Upsert Departments (referencing HOD profiles)
ALTER TABLE departments ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_of_department_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

INSERT INTO departments (code, name, head_of_department_id)
VALUES
    ('CS', 'Department of Computer Science', 'b7b4d6b6-5f5a-4933-8a7e-123456789001'),
    ('MS', 'Department of Management Sciences', 'b7b4d6b6-5f5a-4933-8a7e-123456789003'),
    ('ES', 'Department of Environmental Sciences', 'b7b4d6b6-5f5a-4933-8a7e-123456789006'),
    ('MTH', 'Department of Mathematics', 'b7b4d6b6-5f5a-4933-8a7e-123456789009'),
    ('HUM', 'Department of Humanities', 'b7b4d6b6-5f5a-4933-8a7e-123456789010')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    head_of_department_id = EXCLUDED.head_of_department_id;

-- 3. Insert/Upsert Faculty details referencing profiles and departments
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department_uuid UUID REFERENCES departments(uuid) ON DELETE CASCADE;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS specialization TEXT;

INSERT INTO faculty (profile_id, employee_id, department_uuid, designation, specialization)
VALUES
    ('b7b4d6b6-5f5a-4933-8a7e-123456789001', 'VHR-F-001', (SELECT uuid FROM departments WHERE code = 'CS'), 'Associate Professor', 'Computer Science'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789002', 'VHR-F-002', (SELECT uuid FROM departments WHERE code = 'CS'), 'Assistant Professor', 'Computer Science'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789003', 'VHR-F-003', (SELECT uuid FROM departments WHERE code = 'MS'), 'Assistant Professor', 'Management Sciences'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789004', 'VHR-F-004', (SELECT uuid FROM departments WHERE code = 'MS'), 'Assistant Professor', 'Finance'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789005', 'VHR-F-005', (SELECT uuid FROM departments WHERE code = 'MS'), 'Assistant Professor', 'Human Resource Management'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789006', 'VHR-F-006', (SELECT uuid FROM departments WHERE code = 'ES'), 'Associate Professor', 'Environmental Sciences'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789007', 'VHR-F-007', (SELECT uuid FROM departments WHERE code = 'ES'), 'Associate Professor', 'Environmental Sciences'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789008', 'VHR-F-008', (SELECT uuid FROM departments WHERE code = 'ES'), 'Associate Professor', 'Biotechnology'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789009', 'VHR-F-009', (SELECT uuid FROM departments WHERE code = 'MTH'), 'Associate Professor', 'Mathematics'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789010', 'VHR-F-010', (SELECT uuid FROM departments WHERE code = 'HUM'), 'Lecturer', 'Humanities'),
    ('b7b4d6b6-5f5a-4933-8a7e-123456789011', 'FIN1', (SELECT uuid FROM departments WHERE code = 'MS'), 'Finance Lead', 'Accounts & Audits')
ON CONFLICT (profile_id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    department_uuid = EXCLUDED.department_uuid,
    designation = EXCLUDED.designation,
    specialization = EXCLUDED.specialization;
