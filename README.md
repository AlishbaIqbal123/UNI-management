# 🏛️ University Management OS (UMS)
**The Fully Connected Academic Ecosystem**

A premium institutional management system built for COMSATS University Islamabad, designed to synchronize Administrative, Academic, and Financial operations in real-time.

## 🚀 Vision
To eliminate administrative silos by linking every institutional action—from fee payment to grade entry—into a single, automated workflow.

---

## 🛠️ Core Modules

### 1. Institutional Finance Gateway
- **Centralized Ledger**: Real-time management of student dues and payments.
- **Reporting**: One-click generation of PDF/CSV institutional records for batch auditing.
- **Automated Blocking**: Integrated with the registration module to restrict academic access for students with pending dues.

### 2. Faculty Pedagogical Command
- **Course Workspace**: Role-isolated views for faculty to manage their assigned classes.
- **Assessment Engine**: Dynamic creation of Quizzes, Assignments, Midterms, and Finals.
- **Inline Marking**: Spreadsheet-style interface for rapid grading that syncs instantly with student portfolios.

### 3. Student Academic Portfolio
- **Eligibility Dashboard**: Real-time tracking of registration status based on financial clearance.
- **Pedagogical Telemetry**: Visual progress bars representing attendance percentage and current grades.
- **Academic Results**: Instant access to verified results and teacher feedback.

### 4. Administrative Hub
- **Registry Management**: CRUD operations for Students, Faculty, Departments, and the Course Catalog.
- **Admin Overrides**: A powerful bypass tool allowing administrators to unlock registration for students (e.g., for scholarships) despite financial blocks.

---

## 📋 Requirements Implemented

### ✅ Functional Requirements
- **FR-01: Role-Based Access Control**: Strict data isolation for Admin, Faculty, Student, and Finance roles.
- **FR-02: Finance-Gated Registration**: Automatic blocking system ensuring academic participation is linked to financial clearance.
- **FR-03: Real-Time Grade Entry**: Faculty can post marks directly to student profiles via the Assessment Module.
- **FR-04: Attendance Tracking**: Session-by-session attendance logic with automated percentage calculation.
- **FR-05: Institutional Reporting**: Exportable data for institutional record-keeping.

### 🛡️ Non-Functional Requirements
- **NFR-01: Real-Time Sync**: Powered by Supabase PostgreSQL Channels for zero-latency cross-role updates.
- **NFR-02: Responsive Architecture**: Fully fluid UI using the "Stitch" glassmorphism design system for all screen sizes.
- **NFR-03: Data Integrity**: Strict foreign-key relationships ensuring orphans are never created (e.g., Enrollment linked to Batch).
- **NFR-04: Performance**: Implementation of LocalStorage-first persistence with Supabase background sync.

---

## 🧪 Demo Data Guide
The system is seeded with **10 Students**, **3 Faculty**, **5 Courses**, and **7 Finance Records** to facilitate immediate testing.

- **Finance Block Test**: Log in as `student1@cui.edu.pk`. Registration will be blocked.
- **Clearance Test**: Log in as `student2@cui.edu.pk`. Registration will be fully unlocked.
- **Faculty Workflow**: Log in as `nasir@comsats.edu.pk` to manage `CSC101` and enter marks.

---

## 💻 Tech Stack
- **Frontend**: React.js with Vite
- **Styling**: Vanilla CSS (Premium "Stitch" Design System)
- **Backend/DB**: Supabase (PostgreSQL + Real-time)
- **Reporting**: Institutional CSV/PDF Export Utilities
