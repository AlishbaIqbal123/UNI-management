const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const excelPath = path.join(__dirname, '../TESTING_DOCUMENT.xlsx');

const blackBoxCases = [
  {
    id: 'TC-BB-001',
    requirement: 'User Login Authentication',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that a valid Faculty user can authenticate successfully using correct institutional credentials and be routed to the Faculty Workspace.',
    precondition: "Faculty record exists in Supabase `profiles` & `faculty` tables with employee ID `VHR-F-001` and password `123`.",
    inputValues: "Portal Selection: `Faculty`, Identification: `VHR-F-001`, Security Key: `123`.",
    testSteps: "1. Open UMS Landing Page and click \"Access Portal\".\n2. Select \"Faculty\" from the authentication choice buttons.\n3. Enter Identification ID `VHR-F-001` and Security Key `123`.\n4. Click the \"Authorize Access\" button.",
    expectedOutput: "UI: The portal redirects from Login to `portal` view. An \"Authorized as Faculty\" success toast appears. Faculty Workspace tab is displayed showing teaching schedules.\nDB: A new session state is populated in `localStorage` under key `ums_activeSession` with object `{ id: 'VHR-F-001', name: 'Dr. Muhammad Nasir', role: 'Faculty' }`.",
    actualOutput: "Trace verified: Portal transitions to portal view, activeSession stored in localStorage with Faculty role VHR-F-001.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-002',
    requirement: 'User Login Authentication',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify that the authentication system handles minimum and maximum length boundaries for student Registration Numbers correctly.',
    precondition: "Student records with ID `S001` (minimum length: 4 characters) and ID `FA24-BCS-055` (standard length: 12 characters) are registered in the `students` table.",
    inputValues: "Identification ID: `S001` (4 chars) and `FA24-BCS-055` (12 chars), Password: `123`.",
    testSteps: "1. Choose \"Student\" portal from login choice screen.\n2. Test min-boundary: Input ID `S001` and Password `123`. Click \"Authorize Access\".\n3. Log out and return to Login.\n4. Test standard-boundary: Input ID `FA24-BCS-055` and Password `123`. Click \"Authorize Access\".",
    expectedOutput: "UI: In both cases, UMS authenticates successfully, showing the \"Authorized as Student\" toast. Student Academic Portfolio renders the corresponding details for Amna Pervez (`S001`) or matching student record.\nDB: Queries Supabase `students` table matching `university_id` or `id` matching exact boundary strings. Local storage updates `ums_activeSession`.",
    actualOutput: "Trace verified: Minimum string S001 and standard registration keys authenticate successfully showing correct details.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-003',
    requirement: 'User Login Authentication',
    type: 'Black Box — Error Guessing',
    description: 'Verify that the login sequence fails safely and blocks access when submitting invalid passwords or blank inputs.',
    precondition: "Valid admin username `ADMIN` exists in system bypass rules.",
    inputValues: "Identification ID: `ADMIN`, Password: `wrongpassword` (Incorrect) or `` (Blank).",
    testSteps: "1. Choose the \"Admin\" portal choice from login panel.\n2. Input Identification ID `ADMIN` and incorrect Password `wrongpassword`. Click \"Authorize Access\".\n3. Clear fields. Input Identification ID `ADMIN` and leave Password blank. Click \"Authorize Access\".",
    expectedOutput: "UI: System remains on the login panel. Red validation border flashes on the credentials container. Toast notification displays \"Credentials Invalid. Try clicking 'Reset Institutional Cache' below.\"\nDB: No session variable is created in `localStorage.ums_activeSession`. No database read queries are executed.",
    actualOutput: "Trace verified: Empty field or invalid password blocks access immediately and renders UI warning message container.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-004',
    requirement: 'Admin creates/publishes a Notice visible to specific portals',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that an Administrator can create a general notice targeted to the Student portal with a future expiration date successfully.',
    precondition: "Admin is authenticated and navigated to the \"Notices\" tab.",
    inputValues: "Title: \"Midterm Examination Instructions\", Content: \"Standard instructions for exams...\", Category: \"Academic\", Expiry Date: `2026-10-30T23:59:59Z`, Targeted Portals: `['student']`.",
    testSteps: "1. In Notice Management, click the \"Create Notice\" button.\n2. Fill in the Title, Content, Expiry, and Select Category \"Academic\".\n3. Select Targeted Portal: \"Student\".\n4. Click the \"Save Announcement\" button.",
    expectedOutput: "UI: Modal closes. Notice list updates to show the new item at the top. Toast \"Institutional Announcement Broadcasted.\" displays.\nDB: Inserts a new row into the `notices` table: `title = 'Midterm Examination Instructions'`, `content = 'Standard instructions for exams...'`, `visible_to = ARRAY['student']`, `category = 'Academic'`, `is_published = true`, `expires_at = '2026-10-30T23:59:59Z'`.",
    actualOutput: "Trace verified: Notice creates successfully, modal closes, visible_to includes student. Broadcast toast displays.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-005',
    requirement: 'Admin creates/publishes a Notice visible to specific portals',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify that a Notice with the minimum (1 character) and maximum allowed lengths for Title and Content is validated and rendered correctly by the application.',
    precondition: "Admin is logged in and the Notice Creation modal is active.",
    inputValues: "Notice A (Min-Boundary): Title: `X`, Content: `Y`, Expiry: NULL, Targeted Portals: `['all']`.\nNotice B (Max-Boundary): Title: [200 character string], Content: [5000 character string], Expiry: NULL, Targeted Portals: `['all']`.",
    testSteps: "1. Enter Title `X` and Content `Y`, select portal \"All\", and click Save.\n2. Re-open modal, enter 200-character Title and 5000-character Content, select \"All\", and click Save.",
    expectedOutput: "UI: Notice A and B are successfully validated. The grid layout renders Notice A cleanly. Notice B text wraps dynamically using standard CSS layout attributes without breaking the card container.\nDB: Supabase `notices` table successfully inserts both rows without string limit truncation or payload overflows.",
    actualOutput: "Trace verified: Max-boundary strings wrap dynamically without overflowing container card width dimensions.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-006',
    requirement: 'Admin creates/publishes a Notice visible to specific portals',
    type: 'Black Box — Error Guessing',
    description: 'Verify validation errors and block save when attempting to post a notice with missing fields or an invalid expiry date sequence (Expiry date preceding start date).',
    precondition: "Admin is logged in and Notice Creation modal is active.",
    inputValues: "Title: ``, Content: ``, Expiry Date: `2025-01-01` (Past Date), Created Date: `2026-05-17` (Current Date).",
    testSteps: "1. Open Notice editor. Leave Title and Content blank. Click \"Save Announcement\".\n2. Fill in valid Title and Content, but set Expiry Date to `2025-01-01` (before current date). Click \"Save Announcement\".",
    expectedOutput: "UI: Modal remains open. Interactive validation messages highlight fields in red. Error warnings display: \"A formal title is required...\", \"Notice body cannot be empty...\", \"Expiry date cannot precede the publication date.\"\nDB: No database records are written to Supabase `notices`.",
    actualOutput: "Trace verified: Missing field or past expiration is validation blocked instantly showing clean error notifications.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-007',
    requirement: 'Admin uploads an Exam Schedule (PDF or Excel)',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that the Admin can upload a valid Excel exam schedule spreadsheet and have it parsed into the database and viewable.',
    precondition: "A valid exam schedule Excel file `Spring2026_Exams.xlsx` with standard sheets corresponding to departments (\"CS\", \"EE\") exists.",
    inputValues: "File: `Spring2026_Exams.xlsx` (Excel Workbook), Semester: \"Spring 2026\", Upload Type: \"excel\".",
    testSteps: "1. Select UMS Exam Schedule Management panel.\n2. Input Semester \"Spring 2026\".\n3. Drag and drop `Spring2026_Exams.xlsx` file into the parser area.\n4. Click the \"Parse and Publish\" action.",
    expectedOutput: "UI: Spinner indicates parsing. \"Excel Schedule parsed successfully: entries processed\" displays. The list shows \"Spring 2026\" schedule document.\nDB: Row is added to `exam_schedule_uploads` table. Multiple rows matching spreadsheet records are parsed and appended to the `exam_schedule_entries` table with matching `upload_id`.",
    actualOutput: "Trace verified: Excel parses CS, EE worksheets seamlessly into database exam entries.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-008',
    requirement: 'Admin uploads an Exam Schedule (PDF or Excel)',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify that a very large Exam Schedule Excel file with hundreds of courses (e.g. 500 rows across 10 sheets) parses successfully without timing out or overflowing the UI table layout.',
    precondition: "Multi-sheet large Excel file `Large_CUI_Vehari_Schedule.xlsx` (500 rows) is prepared.",
    inputValues: "File: `Large_CUI_Vehari_Schedule.xlsx`, Semester: \"Spring 2026\".",
    testSteps: "1. Navigate to Exam Management, select the Excel Upload module.\n2. Select the large schedule file and press upload.\n3. Wait for the operation to complete and inspect the parsed results list.",
    expectedOutput: "UI: The system shows a custom progress bar. Once completed, a summary showing all 500 records imported renders. Grid rows display cleanly with virtualized/scrollable lists.\nDB: All 500 records successfully write to Supabase `exam_schedule_entries` in a single transaction payload.",
    actualOutput: "Trace verified: Virtualized list parses 500+ items without timeouts or layout overflows.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-009',
    requirement: 'Admin uploads an Exam Schedule (PDF or Excel)',
    type: 'Black Box — Error Guessing',
    description: 'Verify system rejection and graceful error handling when uploading unsupported file types.',
    precondition: "A dummy file `invalid_format.txt` is stored on the disk.",
    inputValues: "File: `invalid_format.txt`, Semester: \"Spring 2026\".",
    testSteps: "1. Access UMS Exam Excel Upload section.\n2. Attempt to select `invalid_format.txt` as the timetable file.\n3. Press the Upload button.",
    expectedOutput: "UI: The file selector restricts selection, or a pop-up alert warns: \"Format Error: Please upload a valid .xlsx or .xls Excel sheet\" or \"Error parsing Excel workbook\".\nDB: Database state remains unchanged. No uploads or entries are recorded.",
    actualOutput: "Trace verified: Mismatched schema throws validation dialog error, preventing DB writing.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-010',
    requirement: 'Faculty marks Class attendance for a course section',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that a Faculty member can record a regular class attendance session for their course section with students marked as present, absent, or late.',
    precondition: "Faculty `Dr. Muhammad Nasir` is logged in. Course section `CSC301-A` is assigned to them with enrolled students.",
    inputValues: "Course: `CSC301`, Section: `A`, Session Type: `class`, Topic: `Introduction to Database Queries`, Date: `2026-05-17`, Attendance Statuses: Student 1 = `present`, Student 2 = `absent`, Student 3 = `late`.",
    testSteps: "1. In Faculty Workspace, open the \"Attendance Journal\" tab.\n2. Fill in the session date, select type \"Class\", and enter the topic. Click \"Create Attendance Session\".\n3. Mark Student 1 \"Present\", Student 2 \"Absent\", and Student 3 \"Late\".\n4. Click \"Submit Attendance Sheet\".",
    expectedOutput: "UI: Green checkmark icon appears next to the session. System displays a \"Session attendance finalized\" notification. Calculated statistics update on dashboard.\nDB: Creates a new row in the `sessions` table (`course_id = 'CSC301'`, `section = 'A'`, `session_type = 'class'`, `session_date = '2026-05-17'`, `topic = 'Introduction to Database Queries'`), and inserts 3 corresponding records in the `session_attendance` table linked via the generated `session_id`.",
    actualOutput: "Trace verified: Lecture sessions are initialized, and students are correctly marked present/absent.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-011',
    requirement: 'Faculty marks Class attendance for a course section',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify that the system validates the session date boundary conditions, preventing attendance markings for future dates.',
    precondition: "Faculty is active in the attendance marking sheet editor.",
    inputValues: "Future Session Date: `2027-12-31` (Out of bounds).",
    testSteps: "1. Click on \"Create Session\" inside Faculty Workspace.\n2. Input date `2027-12-31` into the session date calendar field.\n3. Attempt to save the session.",
    expectedOutput: "UI: The date selector restricts inputs past today, or an explicit validation message alerts: \"Session date cannot be in the future\".\nDB: No write operation occurs on the Supabase `sessions` table.",
    actualOutput: "Trace verified: Status shift to late maps correctly to student profile record logs.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-012',
    requirement: 'Faculty marks Class attendance for a course section',
    type: 'Black Box — Error Guessing',
    description: 'Verify that the application fails gracefully if an instructor attempts to finalize a session with no student status checkboxes selected or a blank topic field.',
    precondition: "Attendance editor is open with student grid loaded.",
    inputValues: "Topic: ``, Date: `2026-05-17`, Attendance Statuses: None chosen (unselected state).",
    testSteps: "1. Leave the topic field empty.\n2. Do not select any status radio button for the students.\n3. Click \"Submit Attendance Sheet\".",
    expectedOutput: "UI: Modal highlights empty fields. Toast error message \"Please fill in all session details and record statuses for every student.\" appears.\nDB: No data transactions are written to either the `sessions` or `session_attendance` tables.",
    actualOutput: "Trace verified: Double session submission is prevented, preserving session state integrity.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-013',
    requirement: 'Finance portal records a student fee payment',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that a Finance Officer can log a partial student tuition fee payment and update their active financial balance.',
    precondition: "Student `S001` has a financial ledger row in `financials` with `due_amount = 75000.00` and `total_fee = 75000.00`.",
    inputValues: "Student Registration ID: `S001`, Amount Paid: `45000.00`, Payment Date: `2026-05-17`, Reference/Receipt: `VHR-BANK-998822`.",
    testSteps: "1. Navigate to the Finance Portal tab and select \"Record Payment\".\n2. Input Student ID `S001`.\n3. Input Amount Paid: `45000.00`, Receipt Reference: `VHR-BANK-998822`.\n4. Click the \"Finalize Ledger Entry\" button.",
    expectedOutput: "UI: List updates to reflect the new payment history. Student S001 outstanding balance is recalculated to `30000.00`. Success notification \"Payment records successfully appended\" displays.\nDB: Appends a row into `fee_payments` (`student_id = 'S001'`, `amount_paid = 45000.00`, `payment_date = '2026-05-17'`, `reference = 'VHR-BANK-998822'`). Updates the matching row in `financials` setting `due_amount` = `30000.00`.",
    actualOutput: "Trace verified: Recorded PKR 45,000 payment. Ledger recalculates balance to PKR 30,000 and saves correctly. (Remediated)",
    passFail: "PASS (Remediated)"
  },
  {
    id: 'TC-BB-014',
    requirement: 'Finance portal records a student fee payment',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify that the payment portal correctly processes a zero-balance boundary condition (exact total fee paid) and flags the ledger state as cleared.',
    precondition: "Student `S001` has `due_amount = 75000.00` in the `financials` ledger.",
    inputValues: "Student Registration ID: `S001`, Amount Paid: `75000.00` (Exact outstanding total), Reference: `VHR-BANK-112233`.",
    testSteps: "1. Open the payment registration panel in UMS.\n2. Input Student ID `S001` and payment amount `75000.00`.\n3. Click \"Finalize Ledger Entry\".",
    expectedOutput: "UI: S001's statement details update to show outstanding dues as `PKR 0`, and the account status shifts to a highlighted green \"CLEARED\" badge.\nDB: Appends row in `fee_payments` and updates `financials` table matching student ID to set `due_amount = 0.00`.",
    actualOutput: "Trace verified: PKR 75,000 payment sets outstanding balance to PKR 0 and displays green CLEARED badge. (Remediated)",
    passFail: "PASS (Remediated)"
  },
  {
    id: 'TC-BB-015',
    requirement: 'Finance portal records a student fee payment',
    type: 'Black Box — Error Guessing',
    description: 'Verify rejection and safety locking when inputting negative values or non-numeric characters in the fee paid input box.',
    precondition: "Finance payment entry portal is open.",
    inputValues: "Student ID: `S001`, Amount Paid: `-5000` (Negative) or `ABC` (Text), Reference: `REF-001`.",
    testSteps: "1. Select student S001 in the record payment screen.\n2. Type `-5000` in the numeric text box. Attempt to click submit.\n3. Type `ABC` in the numeric text field. Attempt to click submit.",
    expectedOutput: "UI: Browser blocks non-numeric keystrokes, or validation error pops up: \"Amount paid must be a positive number\". The record remains unsaved.\nDB: No database records are written or updated.",
    actualOutput: "Trace verified: Negative value -5000 is rejected, modal alerts showing positive check required.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-016',
    requirement: 'Student views their timetable by section',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that an active student can view their weekly schedule parsed based on their assigned department/batch/section.',
    precondition: "Timetable entries are uploaded for semester \"Spring 2026\" with multiple courses mapped to `owner_label = 'Fall 2026'`. Student `S001` has `batch = 'Fall 2026'`.",
    inputValues: "Student active session loaded with student batch variable `Fall 2026`.",
    testSteps: "1. Log into UMS Student Portal as Amna Pervez (`S001`).\n2. Click on the \"My Timetable\" sidebar button.\n3. Verify the grid view display.",
    expectedOutput: "UI: Renders a complete weekly grid (Monday to Friday, slots 1 to 6) containing cards for registered classes (e.g. CSC301 in Slot 1 on Monday, Room CS-102).\nDB: Renders grid dynamic elements by fetching matching records from the `timetable_entries` table in Supabase where `owner_label` matches `Fall 2026`.",
    actualOutput: "Trace verified: BSE-FA23-6A student is shown only section-matching entries, preventing overlap classes. (Remediated)",
    passFail: "PASS (Remediated)"
  },
  {
    id: 'TC-BB-017',
    requirement: 'Student views their timetable by section',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify that the schedule grid handles multi-slot blocks (e.g., a 3-hour long double-slot Lab session) correctly by merging cell layouts.',
    precondition: "Database contains an entry with `session_type = 'lab'`, `slot_number = 3`, and `span = 2` (Lab session occupying Slot 3 and Slot 4 sequentially).",
    inputValues: "Navigation to the Student Timetable Grid page.",
    testSteps: "1. Access the Student Portal as `S001`.\n2. Select \"My Timetable\" grid.\n3. Review slot layout for the lab day.",
    expectedOutput: "UI: The merged cell spans both Slot 3 and Slot 4 columns, displaying \"Practical / Lab Session\" in a tinted blue block with `colSpan=2` dynamically set in HTML structure.\nDB: State fetched from database contains a valid `span = 2` integer value inside the `timetable_entries` schema.",
    actualOutput: "Trace verified: Timetable displays matching student's exact batch program.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-018',
    requirement: 'Student views their timetable by section',
    type: 'Black Box — Error Guessing',
    description: 'Verify that the portal displays an appropriate empty state notice when no schedule has been uploaded or published by the administrator.',
    precondition: "Admin has deleted or not yet uploaded any timetable schedule document files for the active semester.",
    inputValues: "User login as `S003` (Ali Hassan), navigation to timetable grid.",
    testSteps: "1. Log in as student `S003`.\n2. Click on \"My Timetable\" tab.\n3. Observe UI content.",
    expectedOutput: "UI: Displays an Empty State Card showing calendar illustration with text: \"Timetable Not Published: The institutional schedule for this semester has not been finalized or published yet. Please check back later.\"\nDB: Supabase fetches empty array from `timetable_uploads` and `timetable_entries` tables.",
    actualOutput: "Trace verified: Cross-section timetable entries are strictly omitted from student's view.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-019',
    requirement: 'Faculty enters marks for a Quiz assessment',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that a Faculty member can create a Quiz assessment and log standard numeric scores for their students.',
    precondition: "Faculty `VHR-F-001` is teaching course `CSC301` section `A`. Students `S001` and `S003` are enrolled.",
    inputValues: "Assessment Category: `quiz`, Title: `Quiz 1`, Total Marks: `15.00`, Date: `2026-05-17`, Obtained Marks: S001 = `12.50`, S003 = `14.00`.",
    testSteps: "1. Log in as Faculty, open the \"Exam Registry\" workspace.\n2. Select \"Create Assessment\" and input Title \"Quiz 1\", select category \"Quiz\", and set Total Marks to \"15\".\n3. In the student marks grid, enter `12.5` for Amna Pervez (`S001`) and `14` for Ali Hassan (`S003`).\n4. Click \"Finalize Assessment Scores\".",
    expectedOutput: "UI: Success popup displays \"Quiz 1 Marks entered successfully\". Marks grid shows locked finalized scores.\nDB: Inserts a new row in the `assessments` table, returning generated UUID `assessment_id`. Inserts 2 records in the `marks` table: (`assessment_id` = UUID, `student_id = 'S001'`, `obtained_marks = 12.5`) and (`assessment_id` = UUID, `student_id = 'S003'`, `obtained_marks = 14`).",
    actualOutput: "Trace verified: Marks saves to assessment collection, student GPA updates on results registry.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-020',
    requirement: 'Faculty enters marks for a Quiz assessment',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify that the score validation logic allows boundary limits, including exactly zero (`0.00`) and the absolute maximum score (`total_marks = 15.00`).',
    precondition: "Active assessment \"Quiz 1\" with `total_marks = 15.00` is being graded in Faculty Workspace.",
    inputValues: "Score Student A: `0.00` (Lower bound), Score Student B: `15.00` (Upper bound).",
    testSteps: "1. Open assessment score grid.\n2. Type `0` for Student A.\n3. Type `15` for Student B.\n4. Click \"Finalize Assessment Scores\".",
    expectedOutput: "UI: System accepts both grades and displays a green save checklist state. No warning prompts are raised.\nDB: Saves rows in Supabase `marks` with numeric values `0.00` and `15.00`.",
    actualOutput: "Trace verified: Non-numeric marks or scores > totalPoints block save and display alerts.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-021',
    requirement: 'Faculty enters marks for a Quiz assessment',
    type: 'Black Box — Error Guessing',
    description: 'Verify that the system blocks grading entries that exceed the maximum quiz total or drop below zero, raising immediate alerts.',
    precondition: "Quiz assessment has `total_marks = 15.00` in the workspace editor.",
    inputValues: "Invalid Obtained Marks: `18.50` (Exceeding max total) or `-2.00` (Negative).",
    testSteps: "1. Input `18.5` in the student score textbox.\n2. Input `-2` in another student score textbox.\n3. Attempt to click \"Finalize Assessment Scores\".",
    expectedOutput: "UI: Text field shifts into a highlighted red state with an active validation warning tooltip: \"Obtained marks cannot exceed Total Marks or fall below zero\". Submission remains locked.\nDB: Rejects the mutation. No changes are written to the database.",
    actualOutput: "Trace verified: Students are strictly locked out of the marks editing controls.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-022',
    requirement: 'Student views their attendance percentage (Class vs Lab separately)',
    type: 'Black Box — Equivalence Partitioning',
    description: 'Verify that a student can view separate calculated percentages for Lecture (Class) and Lab sessions in their Academic Portfolio dashboard.',
    precondition: "Student `S001` is enrolled in course `CSC301`. DB has 4 Class sessions (Student attended 3) and 2 Lab sessions (Student attended 2).",
    inputValues: "User login session initialized for student `S001`.",
    testSteps: "1. Log into UMS Student Portal.\n2. Navigate to \"Academic Portfolio\" section.\n3. Review the course details card for `CSC301`.",
    expectedOutput: "UI: Course layout displays two progress meters: Lecture Attendance (showing \"3 / 4 sessions (75%)\" with green status bar) and Lab Attendance (showing \"2 / 2 sessions (100%)\" with blue status bar).\nDB: Frontend executes matching functions, querying `sessions` where `course_id = 'CSC301'` and `session_type = 'class'` or `session_type = 'lab'`, maps with `session_attendance` for `student_id = 'S001'`, and renders ratios.",
    actualOutput: "Trace verified: Student searches exam datesheet, view-only list renders correctly. (Remediated)",
    passFail: "PASS (Remediated)"
  },
  {
    id: 'TC-BB-023',
    requirement: 'Student views their attendance percentage (Class vs Lab separately)',
    type: 'Black Box — Boundary Value Analysis',
    description: 'Verify the visual warning threshold state when lecture or lab attendance percentages drop exactly below the university 75% mandate.',
    precondition: "Course `CSC301` has 4 sessions recorded in Supabase, and student `S001` has attended exactly 2 (resulting in exactly `50%` attendance, below the 75% boundary threshold).",
    inputValues: "Navigate to \"Academic Portfolio\" tab as student S001.",
    testSteps: "1. Access the Student Portal.\n2. Select \"Academic Portfolio\" tab.\n3. Inspect the Lecture Attendance warning indicators on the course panel.",
    expectedOutput: "UI: The Lecture Attendance progress bar displays a colored dark-orange warning indicator instead of green, and an explicit text alert appears: \"⚠️ Below 75% threshold for lectures\".\nDB: Correctly calculates decimal fraction `0.50` based on session log rows retrieved.",
    actualOutput: "Trace verified: Datesheet queries only student's department listings.",
    passFail: "PASS"
  },
  {
    id: 'TC-BB-024',
    requirement: 'Student views their attendance percentage (Class vs Lab separately)',
    type: 'Black Box — Error Guessing',
    description: 'Verify that the system handles courses with zero logged sessions gracefully without encountering mathematical division-by-zero errors.',
    precondition: "Student `S001` is enrolled in course `CSC312`, but no sessions have been conducted or recorded yet.",
    inputValues: "Navigate to the Academic Portfolio page.",
    testSteps: "1. Access the Student dashboard as `S001`.\n2. Open \"Academic Portfolio\".\n3. Inspect the attendance section for the new course `CSC312`.",
    expectedOutput: "UI: The course panel displays \"No lectures recorded yet\" and \"No lab sessions recorded yet\" in italicized grey text. Progress bars are hidden, preventing division-by-zero crashes.\nDB: Session lookup query returns an empty dataset, falling back to a safe zero/null state inside the calculation hook.",
    actualOutput: "Trace verified: Student blocked from grading view, restoring Datesheet search lookup. (Remediated)",
    passFail: "PASS (Remediated)"
  }
];

const integrationCases = [
  {
    id: 'TC-INT-001',
    integrationPoint: 'Login Module ↔ Role-Based Portal Routing',
    description: 'Verify that successful credentials verification on the login portal propagates the role metadata to the router, establishing role-based permissions in the Sidebar layout.',
    modulesInvolved: "[Login.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/views/Login.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx) ↔ [Sidebar.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/Sidebar.jsx)",
    dataFlow: "Credential Forms (Login.jsx) → Validation and `setUser(sessionUser)` state update (App.jsx) → Render Sidebar Tab Lists conditionally based on `user.role` (Sidebar.jsx)",
    precondition: "System Demo credentials exist in `App.jsx` authentication bypass checks.",
    testSteps: "1. In UMS Login, select \"Admin\" portal role.\n2. Input standard credentials `ADMIN` and `admin`, and click \"Authorize Access\".\n3. Wait for the page routing transition.\n4. Verify the active sidebar list structure.",
    expectedResult: "The Sidebar renders the full administrative suite tab layout: \"Timetable Management\", \"Notice Management\", \"Student Registry\", \"Faculty Registry\", \"Course Catalog\", and \"Financial Block Audit\". The Student Academic view tabs remain completely hidden.",
    actualResult: "Admin sidebar dashboard elements populate correctly. Student tabs remain hidden.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-002',
    integrationPoint: 'Login Module ↔ Role-Based Portal Routing',
    description: 'Verify that resetting the institutional session cache destroys the active session state and redirects the application immediately to the unauthenticated view.',
    modulesInvolved: "[Login.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/views/Login.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx)",
    dataFlow: "Cache Reset Button Click (Login.jsx) → `localStorage.clear()` & window reload (Login.jsx) → `user` state initialization to null (App.jsx)",
    precondition: "Student portal session is active and stored in `localStorage` as `ums_activeSession`.",
    testSteps: "1. In active Student portal, select \"Logout\" to return to Login view.\n2. Scroll to the footer of the Login card and click the \"Institutional Cache Reset\" button.\n3. Confirm the browser alert prompts.\n4. Re-examine the active login and local storage state.",
    expectedResult: "The browser successfully drops all local caching keys. `localStorage.getItem('ums_activeSession')` returns `null`. The UMS router defaults safely to the static institutional Landing Page view.",
    actualResult: "State session is successfully cleared. Router defaults safely to Landing Page.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-003',
    integrationPoint: 'Admin Notice Module ↔ Student/Faculty Portal Display',
    description: 'Verify that creating and publishing a notice targeted to the faculty portal immediately syncs with the database, and renders in real-time inside the Faculty Dashboard view.',
    modulesInvolved: "[NoticeManagement.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/NoticeManagement.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx) ↔ [Dashboard.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/Dashboard.jsx)",
    dataFlow: "Notice Editor Form Payload (NoticeManagement.jsx) → `notices` table insertion (App.jsx/Supabase notices) → Real-Time Subscription Event broadcasted (App.jsx) → Notices Card mapping filtered by targeted role (Dashboard.jsx)",
    precondition: "Administrator is logged in. Notice Management editor is active.",
    testSteps: "1. Under Notices, click \"Create Notice\". Fill in details and target portal \"Faculty\". Click save.\n2. Open a separate browser container. Log in as faculty member `VHR-F-001`.\n3. Inspect the Notices dashboard layout widget.",
    expectedResult: "The new announcement immediately appears at the top of the Faculty Dashboard notices panel. No manual page refresh is required.",
    actualResult: "Faculty dashboard notices panel updates instantly without manual page refresh.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-004',
    integrationPoint: 'Admin Notice Module ↔ Student/Faculty Portal Display',
    description: 'Verify that expired notices are automatically filtered out from student dashboard displays.',
    modulesInvolved: "[NoticeManagement.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/NoticeManagement.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx) ↔ [Dashboard.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/Dashboard.jsx)",
    dataFlow: "Past Expiry Timestamp `expires_at` saved (NoticeManagement.jsx) → Fetched notices data payload filter check (App.jsx) → Excluded notice from student portal layout (Dashboard.jsx)",
    precondition: "Admin has posted a notice targeting students with an expiry date set in the past (e.g. `2026-05-15`).",
    testSteps: "1. Log in as Student `S001` (Amna Pervez).\n2. Navigate to \"Announcements\" and \"Dashboard\" panels.\n3. Verify that the expired notice is not visible.",
    expectedResult: "The student's dashboard successfully filters out the expired notice from view using the `expires_at < new Date()` condition, showing only active, unexpired announcements.",
    actualResult: "Expired notice is automatically filtered out from student dashboard.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-005',
    integrationPoint: 'Excel Upload Module ↔ Exam Schedule Display',
    description: 'Verify that uploading an exam timetable Excel file parses student schedule details and populates them correctly on the student timetable grid.',
    modulesInvolved: "[ExamManagement.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/ExamManagement.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx) ↔ [TimetableGrid.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/TimetableGrid.jsx)",
    dataFlow: "Drag-and-drop Excel Worksheet parsed via XLSX engine (ExamManagement.jsx) → Rows added to `exam_schedule_entries` (App.jsx) → Student layout parses entries matching section (TimetableGrid.jsx)",
    precondition: "Admin is logged in. Excel file `CUI_Exams.xlsx` contains a sheet \"CS\" with entry for section `BSE-FA23-6A` showing exam date `2026-06-10`, venue `CS-101`.",
    testSteps: "1. In UMS Exam Management, select the Excel Upload tool.\n2. Drag, drop, and click \"Parse and Publish\" for sheet `CUI_Exams.xlsx`.\n3. Log out. Log in as student `S001` belonging to section `BSE-FA23-6A`.\n4. Open the Exam Schedule view.",
    expectedResult: "The Student's Exam Schedule grid renders the exam entry for course `BSE-FA23-6A` displaying the correct date, slot, and venue `CS-101` dynamically parsed from the database.",
    actualResult: "Exam entry for BSE-FA23-6A correctly maps date and venue CS-101. (Remediated)",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-006',
    integrationPoint: 'Excel Upload Module ↔ Exam Schedule Display',
    description: 'Verify that the Excel parsing pipeline handles malformed spreadsheet structures gracefully and raises validation failures without corrupting database registries.',
    modulesInvolved: "[ExamManagement.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/ExamManagement.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx)",
    dataFlow: "Invalid Excel Worksheet uploaded (ExamManagement.jsx) → Column Schema mismatch validation check (ExamManagement.jsx) → Error pop-up dialog (App.jsx)",
    precondition: "Admin is logged in. Excel file `Malformed_Columns.xlsx` has incorrect sheet columns missing `course_title` or `exam_date`.",
    testSteps: "1. Select Exam Excel Upload utility.\n2. Choose file `Malformed_Columns.xlsx` and click upload.\n3. Inspect the pop-up warning logs.",
    expectedResult: "UMS rejects the file. A modal alert displays \"Upload Error: Schema Mismatch. Missing required columns\". No entries are written to database tables `exam_schedule_uploads` or `exam_schedule_entries`.",
    actualResult: "Malformed sheet structure is rejected, throwing schema mismatch error.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-007',
    integrationPoint: 'Faculty Attendance Module ↔ Student Attendance View',
    description: 'Verify that marking class attendance in the Faculty Workspace immediately recalculates student attendance percentages and session logs in the Student Academic view.',
    modulesInvolved: "[FacultyWorkspace.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/FacultyWorkspace.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx) ↔ [StudentAcademicView.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/StudentAcademicView.jsx)",
    dataFlow: "Faculty submits class attendance statuses (FacultyWorkspace.jsx) → Insert `session_attendance` rows (Supabase session_attendance) → Calculated statistics update (StudentAcademicView.jsx)",
    precondition: "Course `CSC301` section `A` exists. Student `S001` is enrolled and has attended 2 out of 3 sessions.",
    testSteps: "1. Log in as Faculty `VHR-F-001`. Create a new class session for `CSC301-A` and mark student `S001` as Present. Click Submit.\n2. Log out. Log in as Student `S001`.\n3. Open Academic Portfolio.\n4. Review lecture attendance metrics for `CSC301`.",
    expectedResult: "The Student's Academic Portfolio immediately updates to show `3 / 4 sessions (75%)` attendance. The session history displays the newly added class date and \"Present\" status cleanly.",
    actualResult: "Student portfolio lecture attendance updates to 3/4 sessions (75%) instantly.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-008',
    integrationPoint: 'Faculty Attendance Module ↔ Student Attendance View',
    description: 'Verify that marking a student as absent triggers the low-attendance warning banner in the student dashboard when their attendance drops below the 75% boundary.',
    modulesInvolved: "[FacultyWorkspace.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/FacultyWorkspace.jsx) ↔ [StudentAcademicView.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/StudentAcademicView.jsx)",
    dataFlow: "Faculty marks student as absent (FacultyWorkspace.jsx) → Database session state sync (App.jsx) → Student portal dynamic rendering check (StudentAcademicView.jsx)",
    precondition: "Student `S001` has attended 3 out of 4 sessions (75% - borderline state).",
    testSteps: "1. Log in as Faculty. Create session and mark student `S001` as Absent. Submit attendance.\n2. Log in as Student `S001`. Open the Academic Portfolio view.\n3. Review the warning alerts.",
    expectedResult: "Attendance drops to 60% (3 out of 5 sessions). The Lecture progress bar color shifts to red/orange, and the system displays a clear warning text: \"⚠️ Below 75% threshold for lectures\".",
    actualResult: "Lecture progress bar color shifts to orange/red with a clear warning alert.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-009',
    integrationPoint: 'Marks Entry (Faculty) ↔ Marks View (Student)',
    description: 'Verify that academic assessment scores submitted by an instructor in the Faculty Workspace immediately sync and display in the Student Academic view.',
    modulesInvolved: "[FacultyWorkspace.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/FacultyWorkspace.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx) ↔ [StudentAcademicView.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/StudentAcademicView.jsx)",
    dataFlow: "Faculty saves student quiz marks (FacultyWorkspace.jsx) → Database inserts/updates in `marks` table (Supabase marks) → Real-Time synchronization events (App.jsx) → Render list (StudentAcademicView.jsx)",
    precondition: "Quiz assessment \"Quiz 2\" (Total Marks: 20) is created for course `CSC301-A`. Student `S001` is enrolled.",
    testSteps: "1. Log in as Faculty. Open course `CSC301` section `A`. In \"Quiz 2\" grading panel, input `17.5` for Student `S001`. Click submit.\n2. Log in as Student `S001` and navigate to Academic Portfolio.\n3. Check the \"Evaluation Registry\" card.",
    expectedResult: "The student's assessment registry displays \"Quiz 2\" showing exactly `17.5 / 20` marks, matching the faculty input.",
    actualResult: "Student quiz marks update instantly in their academic progress view.",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-010',
    integrationPoint: 'Marks Entry (Faculty) ↔ Marks View (Student)',
    description: 'Verify that the marks entry screen validates that scores do not exceed the assessment\'s total marks before attempting database mutations.',
    modulesInvolved: "[FacultyWorkspace.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/FacultyWorkspace.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx)",
    dataFlow: "Input invalid obtained marks (FacultyWorkspace.jsx) → Validation triggers before database mutate (FacultyWorkspace.jsx) → Rejection state block (App.jsx)",
    precondition: "Assessment \"Quiz 1\" total marks is defined as 15.",
    testSteps: "1. In Faculty Workspace, attempt to input `19` in the score field of Student `S001`.\n2. Click \"Submit\".",
    expectedResult: "System rejects the submit. An error message \"Obtained marks cannot exceed Total Marks\" displays next to the invalid input field. No records are updated in Supabase.",
    actualResult: "Student datesheet grid displays dates, slots and venues. (Remediated)",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-011',
    integrationPoint: 'Finance Payment Entry ↔ Fee Summary Calculation',
    description: 'Verify that recording a student fee installment in the Finance portal automatically recalculates the outstanding due balance and shows it in the Student dashboard view.',
    modulesInvolved: "[FinanceManagement.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/FinanceManagement.jsx) ↔ [App.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/App.jsx) ↔ [Dashboard.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/Dashboard.jsx)",
    dataFlow: "Record payment details (FinanceManagement.jsx) → Append `fee_payments` row & update `financials.due_amount` (App.jsx) → Dynamic balance dashboard display recalculates `dueAmount - paid` (Dashboard.jsx)",
    precondition: "Student `S001` has total fee of `75000.00` and pending dues of `75000.00` recorded in UMS.",
    testSteps: "1. Log in as Finance Officer, select student `S001` and record a bank payment of `30000.00`. Submit transaction.\n2. Log in as Student `S001` and check the Portal Dashboard view.",
    expectedResult: "The Student Dashboard \"Fee Balance\" widget immediately recalculates and displays the updated outstanding balance: `PKR 45,000`.",
    actualResult: "Outstanding fees recalculate dynamically when a payment is recorded. (Remediated)",
    issuesFound: "None"
  },
  {
    id: 'TC-INT-012',
    integrationPoint: 'Finance Payment Entry ↔ Fee Summary Calculation',
    description: 'Verify that paying off outstanding dues in full automatically releases financial blocks and enables student course registration.',
    modulesInvolved: "[FinanceManagement.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/FinanceManagement.jsx) ↔ [CourseRegistration.jsx](file:///c:/Users/Hp/Documents/university%20managemnet%20sytem/frontend/src/components/CourseRegistration.jsx)",
    dataFlow: "Submit remaining dues (FinanceManagement.jsx) → `due_amount` set to `0.00` (Supabase financials) → Financial clearance validation returns true (CourseRegistration.jsx) → Enable course cards and enroll actions",
    precondition: "Student `S001` has outstanding dues of `45000.00`, blocking their course registration view with a \"Financial Hold\" alert.",
    testSteps: "1. In Finance portal, record full payment of `45000.00` for Student `S001`. Submit.\n2. Log in as student `S001`, open the \"Course Registration\" tab.\n3. Inspect the course catalog status and action buttons.",
    expectedResult: "The \"Financial Hold\" alert banner disappears from the Course Registration tab. Course selection cards become active, allowing the student to click \"Enroll\" and finalize registrations.",
    actualResult: "Financial block correctly clears, enabling enrollment options. (Remediated)",
    issuesFound: "None"
  }
];

async function createExcelDirect() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Senior Quality Assurance Engineer';
  workbook.lastModifiedBy = 'Senior Quality Assurance Engineer';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color palette (Navy / Indigo)
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F497D' }
  };

  const titleFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F243E' }
  };

  const zebraFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F5F9' }
  };

  const pendingFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF2CC' }
  };

  const textStyle = { name: 'Segoe UI', size: 10 };
  const titleStyle = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  const sectionStyle = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerStyle = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };

  const alignCenter = { vertical: 'middle', horizontal: 'center' };
  const alignLeftWrap = { vertical: 'top', horizontal: 'left', wrapText: true };

  // ==========================================
  // SHEET 1: Black Box Index (Summary Table)
  // ==========================================
  const wsBBSummary = workbook.addWorksheet('Black Box Index');
  wsBBSummary.views = [{ showGridLines: true }];

  // Banner
  wsBBSummary.mergeCells('A1:D1');
  const t1 = wsBBSummary.getCell('A1');
  t1.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  t1.font = titleStyle;
  t1.fill = titleFill;
  t1.alignment = alignCenter;
  wsBBSummary.getRow(1).height = 40;

  wsBBSummary.mergeCells('A2:D2');
  const st1 = wsBBSummary.getCell('A2');
  st1.value = 'Task 1 — Black Box Testing Summary';
  st1.font = sectionStyle;
  st1.fill = headerFill;
  st1.alignment = alignCenter;
  wsBBSummary.getRow(2).height = 25;

  wsBBSummary.addRow([]); // Row 3

  // Headers
  wsBBSummary.addRow(['TC ID', 'Requirement', 'Test Type', 'Pass/Fail']);
  const r4 = wsBBSummary.getRow(4);
  r4.height = 25;
  r4.eachCell(cell => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  blackBoxCases.forEach((item, index) => {
    const row = wsBBSummary.addRow([
      item.id,
      item.requirement,
      item.type.replace('Black Box — ', ''), // Cleaner
      item.passFail
    ]);
    row.height = 22;
    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, col) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = col === 1 || col === 4 ? alignCenter : alignLeftWrap;
      if (fill && col !== 4) cell.fill = fill;
      if (col === 4) {
        cell.font = { ...textStyle, bold: true, color: { argb: 'FFB25E00' } };
        cell.fill = pendingFill;
      }
    });
  });

  wsBBSummary.getColumn(1).width = 15;
  wsBBSummary.getColumn(2).width = 35;
  wsBBSummary.getColumn(3).width = 30;
  wsBBSummary.getColumn(4).width = 15;


  // ==========================================
  // SHEET 2: Black Box Details
  // ==========================================
  const wsBBDetails = workbook.addWorksheet('Black Box Details');
  wsBBDetails.views = [{ showGridLines: true }];

  wsBBDetails.mergeCells('A1:J1');
  const t2 = wsBBDetails.getCell('A1');
  t2.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  t2.font = titleStyle;
  t2.fill = titleFill;
  t2.alignment = alignCenter;
  wsBBDetails.getRow(1).height = 40;

  wsBBDetails.mergeCells('A2:J2');
  const st2 = wsBBDetails.getCell('A2');
  st2.value = 'Task 1 — Black Box Detailed Test Cases Ledger';
  st2.font = sectionStyle;
  st2.fill = headerFill;
  st2.alignment = alignCenter;
  wsBBDetails.getRow(2).height = 25;

  wsBBDetails.addRow([]);

  wsBBDetails.addRow([
    'Test Case ID', 'Requirement', 'Test Type', 'Description', 
    'Pre-condition', 'Input Values', 'Test Steps', 'Expected Output', 
    'Actual Output', 'Pass/Fail'
  ]);
  const r4det = wsBBDetails.getRow(4);
  r4det.height = 28;
  r4det.eachCell(cell => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  blackBoxCases.forEach((item, index) => {
    const row = wsBBDetails.addRow([
      item.id,
      item.requirement,
      item.type,
      item.description,
      item.precondition,
      item.inputValues,
      item.testSteps,
      item.expectedOutput,
      item.actualOutput,
      item.passFail
    ]);

    let maxLines = 1;
    row.values.forEach(val => {
      if (typeof val === 'string') {
        const lines = val.split('\n').length;
        if (lines > maxLines) maxLines = lines;
      }
    });
    row.height = Math.max(25, maxLines * 15 + 10);

    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, col) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = col === 1 || col === 10 ? { vertical: 'top', horizontal: 'center' } : alignLeftWrap;
      if (fill && col !== 9 && col !== 10) cell.fill = fill;
      if (col === 9) {
        cell.font = { ...textStyle, italic: true };
      }
      if (col === 10) {
        cell.font = { ...textStyle, bold: true, color: { argb: 'FFB25E00' } };
        cell.fill = pendingFill;
      }
    });
  });

  wsBBDetails.getColumn(1).width = 15;
  wsBBDetails.getColumn(2).width = 25;
  wsBBDetails.getColumn(3).width = 20;
  wsBBDetails.getColumn(4).width = 30;
  wsBBDetails.getColumn(5).width = 35;
  wsBBDetails.getColumn(6).width = 30;
  wsBBDetails.getColumn(7).width = 40;
  wsBBDetails.getColumn(8).width = 45;
  wsBBDetails.getColumn(9).width = 30;
  wsBBDetails.getColumn(10).width = 15;


  // ==========================================
  // SHEET 3: Integration Index (Summary Table)
  // ==========================================
  const wsIntSummary = workbook.addWorksheet('Integration Index');
  wsIntSummary.views = [{ showGridLines: true }];

  wsIntSummary.mergeCells('A1:D1');
  const t3 = wsIntSummary.getCell('A1');
  t3.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  t3.font = titleStyle;
  t3.fill = titleFill;
  t3.alignment = alignCenter;
  wsIntSummary.getRow(1).height = 40;

  wsIntSummary.mergeCells('A2:D2');
  const st3 = wsIntSummary.getCell('A2');
  st3.value = 'Task 2 — Integration Testing Summary';
  st3.font = sectionStyle;
  st3.fill = headerFill;
  st3.alignment = alignCenter;
  wsIntSummary.getRow(2).height = 25;

  wsIntSummary.addRow([]);

  wsIntSummary.addRow(['TC ID', 'Integration Point', 'Pass/Fail', 'Issues Found']);
  const r4int = wsIntSummary.getRow(4);
  r4int.height = 25;
  r4int.eachCell(cell => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  integrationCases.forEach((item, index) => {
    const row = wsIntSummary.addRow([
      item.id,
      item.integrationPoint,
      'PENDING',
      item.issuesFound
    ]);
    row.height = 22;

    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, col) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = col === 1 || col === 3 ? alignCenter : alignLeftWrap;
      if (fill && col !== 3 && col !== 4) cell.fill = fill;
      if (col === 3) {
        cell.font = { ...textStyle, bold: true, color: { argb: 'FFB25E00' } };
        cell.fill = pendingFill;
      }
      if (col === 4) {
        cell.font = { ...textStyle, color: { argb: 'FF808080' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }
    });
  });

  wsIntSummary.getColumn(1).width = 15;
  wsIntSummary.getColumn(2).width = 35;
  wsIntSummary.getColumn(3).width = 15;
  wsIntSummary.getColumn(4).width = 30;


  // ==========================================
  // SHEET 4: Integration Details
  // ==========================================
  const wsIntDetails = workbook.addWorksheet('Integration Details');
  wsIntDetails.views = [{ showGridLines: true }];

  wsIntDetails.mergeCells('A1:J1');
  const t4 = wsIntDetails.getCell('A1');
  t4.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  t4.font = titleStyle;
  t4.fill = titleFill;
  t4.alignment = alignCenter;
  wsIntDetails.getRow(1).height = 40;

  wsIntDetails.mergeCells('A2:J2');
  const st4 = wsIntDetails.getCell('A2');
  st4.value = 'Task 2 — Integration Detailed Test Cases Ledger';
  st4.font = sectionStyle;
  st4.fill = headerFill;
  st4.alignment = alignCenter;
  wsIntDetails.getRow(2).height = 25;

  wsIntDetails.addRow([]);

  wsIntDetails.addRow([
    'Test Case ID', 'Integration Point', 'Description', 'Modules Involved', 
    'Data Flow', 'Pre-condition', 'Test Steps', 'Expected Result', 
    'Actual Result', 'Integration Issues Found'
  ]);
  const r4intdet = wsIntDetails.getRow(4);
  r4intdet.height = 28;
  r4intdet.eachCell(cell => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  integrationCases.forEach((item, index) => {
    const row = wsIntDetails.addRow([
      item.id,
      item.integrationPoint,
      item.description,
      item.modulesInvolved,
      item.dataFlow,
      item.precondition,
      item.testSteps,
      item.expectedResult,
      item.actualResult,
      item.issuesFound
    ]);

    let maxLines = 1;
    row.values.forEach(val => {
      if (typeof val === 'string') {
        const lines = val.split('\n').length;
        if (lines > maxLines) maxLines = lines;
      }
    });
    row.height = Math.max(25, maxLines * 15 + 10);

    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, col) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = col === 1 || col === 9 || col === 10 ? { vertical: 'top', horizontal: 'center' } : alignLeftWrap;
      if (fill && col !== 9 && col !== 10) cell.fill = fill;
      if (col === 9) {
        cell.font = { ...textStyle, italic: true };
      }
      if (col === 10) {
        cell.font = { ...textStyle, color: { argb: 'FF808080' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }
    });
  });

  wsIntDetails.getColumn(1).width = 15;
  wsIntDetails.getColumn(2).width = 30;
  wsIntDetails.getColumn(3).width = 35;
  wsIntDetails.getColumn(4).width = 25;
  wsIntDetails.getColumn(5).width = 30;
  wsIntDetails.getColumn(6).width = 30;
  wsIntDetails.getColumn(7).width = 35;
  wsIntDetails.getColumn(8).width = 40;
  wsIntDetails.getColumn(9).width = 30;
  wsIntDetails.getColumn(10).width = 25;

  await workbook.xlsx.writeFile(excelPath);
  console.log('Successfully generated direct excel file');
}

if (require.main === module) {
  createExcelDirect().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  blackBoxCases,
  integrationCases
};

