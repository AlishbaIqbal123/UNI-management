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

### Current Color Variables
The codebase currently uses two sets of variables in index.css and App.css:

From index.css (Default Dark):
- --primary: #573273
- --primary-light: #7c4dff
- --accent: #ffb74d
- --success: #10b981
- --surface: #1e1e1e
- --surface-container: #313131
- --surface-container-high: #3d3d3d
- --text-main: #ffffff
- --text-dim: #b0b0b0
- --glass-bg: rgba(49, 49, 49, 0.7)

From App.css (Redundant):
- --primary: #6366f1
- --bg-main: #020617
- --text-main: #f8fafc

### Identified Design Inconsistencies
1. Redundant Styles: Both index.css and App.css define global variables and base styles, leading to conflicting color schemes (Purple vs Indigo).
2. Glassmorphism Overuse: Multiple components rely on backdrop-filter: blur(), which can be inconsistent across browsers and heavy on performance.
3. Typography Inconsistency: index.css uses 'Montserrat', while App.css uses 'Outfit'.
4. Section Contrast: Some "premium" sections use very dark backgrounds with low-contrast borders (--glass-border), while others use solid surface colors.
5. Border Radii: Mixed use of 16px, 12px, 14px, and 28px for cards and inputs.

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
-->

# Audit Complete
The audit of the UNI-management repository is complete. The design system will now be unified under a "Sketchy Academic" aesthetic.
