# 🔄 System Workflow & Institutional Logic

The UMS operates as an interconnected web of triggers. Below is the primary workflow for the academic lifecycle.

## 1. The Registration Lifecycle
- **Step 1: Financial Assessment**: The system queries the `financials` table for the user's `fee_status`.
- **Step 2: Gate Logic**: 
    - If `Cleared`, the Registration button is enabled.
    - If `Pending`, the system checks `admin_overrides`. If no override exists, the student is blocked.
- **Step 3: Registration**: Student selects courses from the catalog. Submission creates an entry in `enrollments` with a `Pending` status until faculty or admin approval depends on specific campus policy.

## 2. The Pedagogical Feedback Loop
1. **Creation**: Faculty member creates a `Quiz` or `Assignment` for an `Offering` in the **Faculty Workspace**.
2. **Marking**: Faculty enters marks in the **Grading Grid**. This writes records into the `results` table.
3. **Synchronization**: The **Student Dashboard** listens to the Supabase `results` channel or state updates.
4. **Visualisation**: The student sees a new grade entry and their updated GPA/Percentage instantly without a page reload.

## 3. Real-Time Finance Updates
1. **Billing**: Admin or Finance officer updates a student's `due_amount` via the **Financial Hub**.
2. **Automatic State Change**: The `fee_status` switches from `Cleared` to `Pending`.
3. **Live Sync**: The student's `CourseRegistration` logic immediately detects this change (State Sync) and disables the 'Register' button for that student in real-time.

---

## 🏗️ Technical Architecture Details

### Data Sync Strategy
- **Persistence Layer**: `useUMSData.js` handles the synchronization between `localStorage` (for latency hiding) and Supabase (for persistent storage).
- **Subscription Model**: We use Supabase Channels to subscribe to `POSTGRES_CHANGES` on following tables:
    - `enrollments`
    - `attendance`
    - `results`
    - `financials`

### Role-Based Access (Frontend)
- **Admin**: Full read/write access to all registries and overrides.
- **Finance**: Read/Write access to `financials`, read access to `students`.
- **Faculty**: Read/Write access to `attendance` and `results` for their specific courses.
- **Student**: Read-only access to their own academic telemetry; write access to `enrollments`.

---

© 2026 COMSATS University Islamabad - Management System Developer Records.
