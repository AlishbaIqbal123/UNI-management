<!-- 
# Audit Report: University Management System (UNI-management)

## Step 1 — Audit

### Existing Components and Purpose
| Component | Purpose |
|-----------|---------|
| AcademicResults.jsx | Displays student grades and GPA metrics. |
| AdminOverrideManagement.jsx | Allows administrators to bypass financial blocks for course registration. |
| CourseManagement.jsx | Interface for managing the university's course catalog and instructor assignments. |
| CourseRegistration.jsx | Student-facing portal for enrolling in available courses, subject to prerequisites and financial clearance. |
| Dashboard.jsx | Role-based overview (Admin, Student, Faculty, Finance) showing key statistics and announcements. |
| DepartmentManagement.jsx | Manages university departments and Head of Department (HOD) assignments. |
| EnrollmentManagement.jsx | Administrative view for managing student course enrollments and registration statuses. |
| ExamManagement.jsx | Management of examination schedules, venues, and invigilators. |
| FacultyManagement.jsx | Registry management for faculty members, including designations and contact info. |
| FacultyWorkspace.jsx | Integrated workspace for faculty to manage grading, attendance, and assessments. |
| FinanceManagement.jsx | Handles student financial records, fee payments, and outstanding dues. |
| Footer.jsx | Standard application footer with institutional branding. |
| NoticeManagement.jsx | Administrative interface for publishing and managing campus announcements. |
| Sidebar.jsx | Primary navigation component with role-based visibility of modules. |
| StudentAcademicView.jsx | Detailed academic progress view for students, including attendance and marks. |
| StudentManagement.jsx | Central registry for student records and bulk CSV importing. |
| StudentMarksView.jsx | Specialized view for student assessment results and transcript previews. |
| TimetableGrid.jsx | Visual grid component for displaying weekly academic schedules. |
| TimetableManagement.jsx | Administrative tool for uploading and managing university-wide timetables. |

### Current Color Variables (Design System)
The codebase has been unified under the "Sketchy Academic" design system in `frontend/src/styles/design-system.css`:
- --color-bg: #fdfbf7 (Parchment)
- --color-ink: #1a1a1a (Deep Charcoal)
- --color-accent: #4a6785 (Muted Academic Blue)
- --color-border: #d1ccc0 (Aged Paper Border)
- --color-danger: #a63d40 (Alert Red)
- --font-heading: 'Instrument Serif', serif
- --font-body: 'Inter', sans-serif

### Identified Design Inconsistencies (FIXED)
1. Redundant Styles: Conflicting variables in index.css and App.css have been superseded by design-system.css.
2. Glassmorphism: Backdrop-filters and translucent backgrounds have been replaced with solid parchment cards.
3. Typography: Unified across the platform using Google Fonts (Instrument Serif & Inter).
4. Section Contrast: Standardized using high-contrast borders and system shadows.
5. Border Radii: Standardized to 3px across all components.

### Existing Supabase Tables
| Table | Columns |
|-------|---------|
| profiles | id (UUID, PK), email, role, full_name, phone_number, created_at, updated_at |
| departments | uuid (UUID, PK), code, name, head_of_department_id, created_at |
| students | profile_id (UUID, PK), university_id, department_uuid, program, batch, cgpa |
| faculty | profile_id (UUID, PK), employee_id, department_uuid, designation, specialization |
| courses | uuid (UUID, PK), course_code, title, credit_hours, department_uuid, syllabus_url |
| course_prerequisites | course_uuid, prerequisite_uuid |
| sections | uuid (UUID, PK), course_uuid, faculty_id, semester, capacity, time_slot, room_number |
| enrollments | uuid (UUID, PK), student_id, section_uuid, status, registration_date |
| financials | uuid (UUID, PK), student_id, amount_due, amount_paid, fee_type, due_date, transaction_date |
| results | uuid (UUID, PK), enrollment_uuid, grade, gpa, published |
| notices | uuid (UUID, PK), title, content, author_id, created_at |
| assessments | id (UUID, PK), course_id, section, department, type, title, total_marks, conducted_date, created_by |
| marks | id (UUID, PK), assessment_id, student_id, obtained_marks, remarks |
| sessions | id (UUID, PK), course_id, section, session_type, session_date, topic |
| attendance | id (UUID, PK), session_id, student_id, status |
| timetable_entries | id (UUID, PK), type, day, time_slot, subject, room, teacher, batch, section |
| fee_payments | id (UUID, PK), student_id, amount, date, reference, semester |
-->

# Audit Complete
The audit of the UNI-management repository is complete. The design system is fully unified under the "Sketchy Academic" aesthetic.
