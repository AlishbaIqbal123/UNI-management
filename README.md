# 🏛️ University Management OS (UMS)
**The Fully Connected Academic Ecosystem**

A high-fidelity institutional management system designed to synchronize Administrative, Academic, and Financial operations in real-time.

---

## 📋 Comprehensive Requirements Registry

### ✅ Functional Requirements (FR)

#### 🔱 1. Institutional Governance (Admin)
- **The system must** allow administrators to manage the **Departmental Registry**, including assigning Heads of Departments (HODs).
- **The system must** provide a centralized **Faculty Command Center** to manage instructors, their professional designations, and contact details.
- **The system must** enable the **Student Registry Overseer** to enroll new candidates and manage their permanent academic profiles.
- **The system must** allow for the **Commissioning of New Courses** within the Course Catalog, specifying credits, prerequisites, and lead instructors.
- **The system should** provide an **Enrollment Audit Gateway** for administrators to approve or reject student course registration requests based on institutional quotas.
- **The system must possess** a **Finance Ledger Control** to manage student fee structures, track payments, and audit due amounts.
- **The system must** allow the broadcast of **University Notices** to all roles or targeted batches.
- **The system should feature** a **Master Override System** to manually bypass financial blocks for selected students (e.g., scholarship cases).

#### 👨‍🏫 2. Pedagogical Forge (Faculty)
- **The system must** allow faculty members to view their **Assigned Course Roster**, including full student names and registration numbers.
- **The system must** enable faculty to conduct a **Daily Attendance Audit** for each course, marking students as Present, Absent, or Late.
- **The system should** provide an **Assessment Marketplace** where faculty can create itemized evaluations (Quizzes, Assignments, Midterms, Finals).
- **The system must** features a **Granular Grading Ledger** allowing faculty to record marks for individual assessment questions or overall scores.
- **The system must** provide a **Roster Integrity Tool** to audit all enrolled candidates and verify their registration status.

#### 🎓 3. Academic Portfolio (Student)
- **The system must** provide a **Financial Eligibility Check** that automatically blocks course registration if fees are pending.
- **The system must** allow students to view their **Real-time Attendance Status**, including session counts and percentages.
- **The system should** display a **Verified Academic Transcript** containing current marks, teacher feedback, and GPA projections.
- **The system must** enable students to request **Course Registration** after obtaining financial clearance.

#### 🔐 4. Access & Security
- **The system must** implement **Role-Based Access Control (RBAC)** to ensure users only access modules relevant to their role (Admin, Faculty, Student, Finance).
- **The system must** provide a **Secure Institutional Login** portal for all academic and administrative members.

---

### 🛡️ Non-Functional Requirements (NFR)

- **The system must be** fully responsive across **Mobile, Tablet, and Desktop** environments using a fluid CSS architecture.
- **The system must** ensure **Real-Time Data Integrity** by synchronizing all actions instantly with a remote PostgreSQL database via Supabase.
- **The system should have** an **Optimized Caching Layer** (LocalStorage) to maintain operational continuity even during intermittent connectivity.
- **The system must provide** a **Premium Visual Experience** using a Glassmorphic Design System that emphasizes professional aesthetics and readable typography.
- **The system should support** **Institutional Data Export** (CSV/PDF) for official record-keeping and regulatory compliance.

---

## 💻 Tech Stack
- **Frontend**: React.js 18 (Vite-powered for high performance)
- **Styling**: Vanilla CSS (Premium "Stitch" Design System)
- **Backend/DB**: Supabase (PostgreSQL with Real-time WebSockets)
- **State Management**: Centralized UMS Data Hook with persistence recovery.
- **Reporting**: Native Institutional Export Utilities.

---

## 🧪 Quick-Start Academic Profiles
| Role | Identity | Auth Code |
| :--- | :--- | :--- |
| **Admin** | `ADMIN` | `admin` |
| **Faculty** | `VHR-F-001` | `123` |
| **Student (Blocked)** | `FA24-BCS-055` | `123` |
| **Student (Cleared)** | `SP25-BSE-012` | `123` |

---
*Developed for Excellence in Institutional Administration.*
