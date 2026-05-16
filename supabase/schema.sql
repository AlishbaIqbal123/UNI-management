-- Supabase Database Schema - University Management OS

-- 1. Enable RLS (Row Level Security) functions & extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'STUDENT', 'FACULTY', 'REGISTRAR', 'GUEST');
CREATE TYPE registration_status AS ENUM ('PENDING', 'CONFIRMED', 'WITHDRAWN', 'FAILED');

-- 3. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'STUDENT',
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE departments (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    head_of_department_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. STUDENTS EXTENSION
CREATE TABLE students (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    university_id TEXT UNIQUE NOT NULL, -- e.g., FA24-BCS-001
    department_uuid UUID REFERENCES departments(uuid) ON DELETE CASCADE,
    program TEXT NOT NULL,
    batch TEXT NOT NULL,
    cgpa NUMERIC(3, 2) DEFAULT 0.00
);

-- 6. FACULTY EXTENSION
CREATE TABLE faculty (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    department_uuid UUID REFERENCES departments(uuid) ON DELETE CASCADE,
    designation TEXT,
    specialization TEXT
);

-- 7. ACADEMIC CATALOG (COURSES)
CREATE TABLE courses (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT UNIQUE NOT NULL, -- e.g., CSC112
    title TEXT NOT NULL,
    credit_hours INTEGER NOT NULL,
    department_uuid UUID REFERENCES departments(uuid) ON DELETE CASCADE,
    syllabus_url TEXT
);

-- 8. COURSE PREREQUISITES
CREATE TABLE course_prerequisites (
    course_uuid UUID REFERENCES courses(uuid) ON DELETE CASCADE,
    prerequisite_uuid UUID REFERENCES courses(uuid) ON DELETE CASCADE,
    PRIMARY KEY (course_uuid, prerequisite_uuid)
);

-- 9. SECTIONS & CONFLICT AVOIDANCE
CREATE TABLE sections (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_uuid UUID REFERENCES courses(uuid) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(profile_id) ON DELETE SET NULL,
    semester TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 40,
    time_slot TEXT NOT NULL, -- e.g. "Mon 08:30-10:00"
    room_number TEXT
);

-- 10. ENROLLMENT (STUDENT REGISTRATIONS)
CREATE TABLE enrollments (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(profile_id) ON DELETE CASCADE,
    section_uuid UUID REFERENCES sections(uuid) ON DELETE CASCADE,
    status registration_status DEFAULT 'PENDING',
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, section_uuid)
);

-- 11. FINANCIAL LEDGER
CREATE TABLE financials (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(profile_id) ON DELETE CASCADE,
    amount_due NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fee_type TEXT NOT NULL, -- "Tuition", "Library Fine"
    due_date DATE,
    transaction_date TIMESTAMP WITH TIME ZONE
);

-- 12. RESULTS & GRADING
CREATE TABLE results (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_uuid UUID REFERENCES enrollments(uuid) ON DELETE CASCADE,
    grade TEXT,
    gpa NUMERIC(3, 2),
    published BOOLEAN DEFAULT FALSE,
    UNIQUE(enrollment_uuid)
);

-- 13. CAMPUS NOTICES
CREATE TABLE notices (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- SETTING UP ROW LEVEL SECURITY (RLS) FOR CORE TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- EXAMPLE PUBLIC READ POLICIES (Users can read their own profile, Admins read all)
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Triggers for Updated_At
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
