import { useState, useEffect } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const load = (key, initial) => JSON.parse(localStorage.getItem(key)) || initial;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export function useUMSData() {
  const [students, setStudents] = useState(() => load('ums_students_v4', [
    { id: 'S001', dbID: 'a0000000-0000-0000-0000-000000000001', name: 'Amna Pervez', regNumber: 'FA24-BCS-055', batch: 'Fall 2024', section: 'A', program: 'BS Computer Science', password: '123', email: 'amna@cui.edu.pk', phone: '+92 321 4567890' },
    { id: 'S002', dbID: 'a0000000-0000-0000-0000-000000000002', name: 'Maham Shaukat', regNumber: 'SP25-BSE-012', batch: 'Spring 2025', section: 'B', program: 'BS Software Engineering', password: '123', email: 'maham@cui.edu.pk', phone: '+92 333 9876543' },
    { id: 'S003', dbID: 'a0000000-0000-0000-0000-000000000003', name: 'Ali Hassan', regNumber: 'FA24-BCS-003', batch: 'Fall 2024', section: 'A', program: 'BS Computer Science', password: '123', email: 'ali@cui.edu.pk', phone: '+92 300 1122334' },
    { id: 'S004', dbID: 'a0000000-0000-0000-0000-000000000004', name: 'Ayesha Malik', regNumber: 'SP26-BSE-045', batch: 'Spring 2026', section: 'A', program: 'BS Software Engineering', password: '123', email: 'ayesha@cui.edu.pk', phone: '+92 315 5566778' },
    { id: 'S005', dbID: 'a0000000-0000-0000-0000-000000000005', name: 'Kamran Ahmed', regNumber: 'FA24-BCS-005', batch: 'Fall 2024', section: 'B', program: 'BS Computer Science', password: '123', email: 'kamran@cui.edu.pk', phone: '+92 345 8899001' },
    { id: 'S006', dbID: 'a0000000-0000-0000-0000-000000000006', name: 'Sana Khan', regNumber: 'SP26-BSE-001', batch: 'Spring 2026', section: 'B', program: 'BS Software Engineering', password: '123', email: 'sana@cui.edu.pk', phone: '+92 322 3344556' },
    { id: 'S007', dbID: 'a0000000-0000-0000-0000-000000000007', name: 'Zainab Ahmed', regNumber: 'FA24-BCS-007', batch: 'Fall 2024', section: 'A', program: 'BS Computer Science', password: '123', email: 'zainab@cui.edu.pk', phone: '+92 321 4455667' },
    { id: 'S008', dbID: 'a0000000-0000-0000-0000-000000000008', name: 'Hamza Malik', regNumber: 'FA24-BSE-008', batch: 'Fall 2024', section: 'B', program: 'BS Software Engineering', password: '123', email: 'hamza@cui.edu.pk', phone: '+92 333 7788990' },
    { id: 'S009', dbID: 'a0000000-0000-0000-0000-000000000009', name: 'Ayesha Khan', regNumber: 'FA24-BSE-009', batch: 'Fall 2024', section: 'A', program: 'BS Software Engineering', password: '123', email: 'akhan@cui.edu.pk', phone: '+92 300 0011223' },
    { id: 'S010', dbID: 'a0000000-0000-0000-0000-000000000010', name: 'Muhammad Ali', regNumber: 'FA24-BCS-010', batch: 'Fall 2024', section: 'B', program: 'BS Computer Science', password: '123', email: 'ali@cui.edu.pk', phone: '+92 315 3344557' }
  ]));


  const [faculty, setFaculty] = useState(() => load('ums_faculty_v4', [
    { id: 'VHR-F-001', dbID: 'f1', facultyName: 'Dr. Muhammad Nasir', designation: 'Assistant Professor', password: '123', email: 'nasir@cui.edu.pk', phone: '+92 312 0001112' },
    { id: 'VHR-F-002', dbID: 'f2', facultyName: 'Dr. Saima Jamil', designation: 'Assistant Professor', password: '123', email: 'saima@cui.edu.pk', phone: '+92 313 2223334' },
    { id: 'VHR-F-003', dbID: 'f4', facultyName: 'Dr. Sadia Bashir', designation: 'Lecturer', password: '123', email: 'sadia@cui.edu.pk', phone: '+92 331 4455667' },
    { id: 'VHR-F-004', dbID: 'f5', facultyName: 'Engr. Waqas Ahmed', designation: 'Lecturer', password: '123', email: 'waqas@cui.edu.pk', phone: '+92 332 7788990' },
    { id: 'FIN1', dbID: 'f3', facultyName: 'Adnan Ahmed', role: 'Finance', password: 'admin', designation: 'Finance Officer', email: 'finance@cui.edu.pk', phone: '+92 314 4445556' }
  ]));

  const [courses, setCourses] = useState(() => load('ums_courses_v4', [
    { courseID: 'CSC101', courseName: 'Programming Fundamentals', credits: 4, assignedFacultyID: 'VHR-F-001', prerequisites: ['None'] },
    { courseID: 'MTH101', courseName: 'Calculus & Analytical Geometry', credits: 3, assignedFacultyID: 'VHR-F-002', prerequisites: ['MTH100'] },
    { courseID: 'CSC112', courseName: 'ICT', credits: 3, assignedFacultyID: 'VHR-F-001', prerequisites: ['None'] },
    { courseID: 'CSC241', courseName: 'Object Oriented Programming', credits: 4, assignedFacultyID: 'VHR-F-003', prerequisites: ['CSC101'] },
    { courseID: 'CSC211', courseName: 'Discrete Structures', credits: 3, assignedFacultyID: 'VHR-F-004', prerequisites: ['MTH101'] }
  ]));

  const [departments, setDepartments] = useState(() => load('ums_depts_v4', [
    { departmentID: 'CS', departmentName: 'Computing', headOfDepartment: 'Dr. Muhammad Nasir' },
    { departmentID: 'BBA', departmentName: 'Management Sciences', headOfDepartment: 'Dr. Saima Jamil' }
  ]));

  const [enrolments, setEnrolments] = useState(() => load('ums_enrolments_v4', [
    { registrationID: 101, studentID: 'S001', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 102, studentID: 'S002', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 103, studentID: 'S007', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 104, studentID: 'S008', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 105, studentID: 'S009', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 106, studentID: 'S010', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 107, studentID: 'S003', courseID: 'CSC211', status: 'Confirmed' },
    { registrationID: 108, studentID: 'S004', courseID: 'CSC241', status: 'Confirmed' }
  ]));

  const [results, setResults] = useState(() => load('ums_results_v4', []));
  const [finance, setFinance] = useState(() => load('ums_finance_v4', [
     { recordID: 1, studentID: 'S001', amountPaid: 65000, dueAmount: 0 },
     { recordID: 2, studentID: 'S002', amountPaid: 45000, dueAmount: 0 },
     { recordID: 3, studentID: 'S003', amountPaid: 0, dueAmount: 45000 },
     { recordID: 4, studentID: 'S010', amountPaid: 45000, dueAmount: 0 }
  ]));
  const [feeStructures, setFeeStructures] = useState(() => load('ums_fee_structures_v1', [
     { id: 'fs1', departmentID: 'CS', semester: 'Fall 2024', totalFee: 120000 },
     { id: 'fs2', departmentID: 'BBA', semester: 'Fall 2024', totalFee: 95000 }
  ]));
  const [attendance, setAttendance] = useState(() => load('ums_attendance_v4', []));
  const [notices, setNotices] = useState(() => load('ums_notices_v4', [
    { id: 1, title: 'Orientation Week', content: 'Welcome to Fall 2024 semester.', date: '2026-09-01', target: 'All' }
  ]));
  
  // Data Integrity & Professionalization Effect
  useEffect(() => {
    let changed = false;
    const cleanStudents = students.map(s => {
      if (!s.regNumber) {
        changed = true;
        return { ...s, regNumber: (s.university_id && s.university_id.length < 20) ? s.university_id : `FA24-BCS-${s.id.replace('S', '')}` };
      }
      return s;
    });
    if (changed) setStudents(cleanStudents);
  }, [students]);
  const [adminOverrides, setAdminOverrides] = useState(() => load('ums_overrides_v4', []));
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState(() => load('ums_exams_v4', [
    { id: 1, courseID: 'CSC101', date: '2026-05-15', time: '09:00 AM', venue: 'Hall A', type: 'Midterm', invigilator: 'Dr. Muhammad Nasir' },
    { id: 2, courseID: 'MTH101', date: '2026-05-16', time: '12:00 PM', venue: 'Hall B', type: 'Midterm', invigilator: 'Dr. Saima Jamil' }
  ]));

  const [assessments, setAssessments] = useState(() => load('ums_assessments_v4', []));
  const [marks, setMarks] = useState(() => load('ums_marks_v4', []));
  const [feePayments, setFeePayments] = useState(() => load('ums_fee_payments_v1', []));
  const [timetableUploads, setTimetableUploads] = useState(() => load('ums_timetable_uploads_v1', []));
  const [timetableEntries, setTimetableEntries] = useState(() => load('ums_timetable_entries_v1', []));
  const [sessions, setSessions] = useState(() => load('ums_sessions_v1', []));
  const [sessionAttendance, setSessionAttendance] = useState(() => load('ums_session_attendance_v1', []));

  useEffect(() => {
    save('ums_students_v4', students); save('ums_faculty_v4', faculty);
    save('ums_courses_v4', courses); save('ums_depts_v4', departments);
    save('ums_enrolments_v4', enrolments); save('ums_results_v4', results);
    save('ums_finance_v4', finance); save('ums_attendance_v4', attendance);
    save('ums_notices_v4', notices); save('ums_exams_v4', exams);
    save('ums_overrides_v4', adminOverrides); save('ums_assessments_v4', assessments);
    save('ums_marks_v4', marks); save('ums_fee_payments_v1', feePayments);
    save('ums_timetable_uploads_v1', timetableUploads); save('ums_timetable_entries_v1', timetableEntries);
    save('ums_sessions_v1', sessions); save('ums_session_attendance_v1', sessionAttendance);
    save('ums_fee_structures_v1', feeStructures);
  }, [students, faculty, courses, departments, enrolments, results, finance, attendance, notices, exams, adminOverrides, assessments, marks, feePayments, timetableUploads, timetableEntries, sessions, sessionAttendance, feeStructures]);

  useEffect(() => {
    const fetchCoreRegistries = async () => {
      let localStudents = students;
      let localFaculty = faculty;
      let localCourses = courses;

      if (isDatabaseConnected()) {
        try {
          const [resStudents, resFaculty, resCourses, resDepts, resEnrol, resRes, resFin, resPay, resUploads, resEntries, resSessions, resAttend] = await Promise.all([
             supabase.from('students').select('*'),
             supabase.from('faculty').select('*'),
             supabase.from('courses').select('*'),
             supabase.from('departments').select('*'),
             supabase.from('enrollments').select('*'),
             supabase.from('results').select('*'),
             supabase.from('financials').select('*'),
             supabase.from('fee_payments').select('*'),
             supabase.from('timetable_uploads').select('*'),
             supabase.from('timetable_entries').select('*'),
             supabase.from('sessions').select('*'),
             supabase.from('session_attendance').select('*'),
             supabase.from('fee_structures').select('*')
          ]);

          if (resStudents.data?.length) {
            const fetchedStudents = resStudents.data.map((s, idx) => ({ 
              id: s.university_id && s.university_id.length < 20 ? s.university_id : `FA24-BCS-${String(idx+1).padStart(3, '0')}`, 
              dbID: s.profile_id || s.uuid || s.id, 
              name: s.full_name || (idx % 2 === 0 ? `Amna Pervez` : `Maham Shaukat`), 
              regNumber: s.university_id && s.university_id.length < 20 ? s.university_id : `FA24-BCS-${String(idx+1).padStart(3, '0')}`,
              program: s.program || 'BSCS', batch: 'Fall 2024', password: '123', email: s.email
            }));
            localStudents = [...localStudents.filter(s => !fetchedStudents.some(fs => fs.id === s.id)), ...fetchedStudents];
          }

          if (resFaculty.data?.length) {
            const fetchedFaculty = resFaculty.data.map(f => ({ 
              id: f.employee_id || f.id, 
              dbID: f.profile_id || f.uuid || f.id, 
              facultyName: f.full_name || `Faculty ${f.id}`, 
              designation: f.designation, 
              role: (f.employee_id || '').includes('FIN') ? 'Finance' : 'Faculty', 
              password: ((f.employee_id || '').includes('FIN') ? 'admin' : '123'),
              email: f.email
            }));
            localFaculty = [...localFaculty.filter(f => !fetchedFaculty.some(ff => ff.id === f.id)), ...fetchedFaculty];
          }

          if (resCourses.data?.length) {
              const fetchedCourses = resCourses.data.map(c => ({ 
                courseID: c.course_code || c.id, 
                courseName: c.title || c.name, 
                credits: c.credit_hours || 3,
                assignedFacultyID: c.faculty_id
              }));
              localCourses = [...localCourses.filter(c => !fetchedCourses.some(fc => fc.courseID === c.courseID)), ...fetchedCourses];
          }

          if (resDepts.data?.length) setDepartments(resDepts.data.map(d => ({ 
            departmentID: d.code || d.id, 
            departmentName: d.name, 
            headOfDepartment: d.hod_name || 'TBD' 
          })));
          
          if (resEnrol.data?.length) setEnrolments(resEnrol.data.map(e => ({
            registrationID: e.id,
            studentID: e.student_id,
            courseID: e.course_id || e.course_code,
            status: e.status || 'Confirmed',
            registrationDate: e.created_at || '2026-03-20'
          })));

          if (resRes.data?.length) setResults(resRes.data.map(r => ({ 
            resultID: r.id, 
            studentID: r.student_id, 
            courseID: r.course_id || r.course_code, 
            grade: r.grade, 
            GPA: r.gpa 
          })));

          if (resFin.data?.length) setFinance(resFin.data.map(f => ({ 
            recordID: f.id, 
            studentID: f.student_id, 
            amountPaid: f.amount_paid || 0, 
            dueAmount: f.due_amount || 0,
            totalFee: f.total_fee || 0,
            semester: f.semester || 'Fall 2024'
          })));

          if (resPay?.data?.length) setFeePayments(resPay.data.map(p => ({
            id: p.id,
            studentID: p.student_id,
            amountPaid: p.amount_paid,
            paymentDate: p.payment_date,
            reference: p.reference
          })));

          if (resUploads?.data?.length) setTimetableUploads(resUploads.data.map(u => ({
            id: u.id,
            fileURL: u.file_url,
            type: u.type,
            semesterLabel: u.semester_label,
            uploadedAt: u.uploaded_at
          })));

          if (resEntries?.data?.length) setTimetableEntries(resEntries.data);

          if (resSessions?.data?.length) setSessions(resSessions.data);
          if (resAttend?.data?.length) setSessionAttendance(resAttend.data);

          const { data: resFeeStructures } = await supabase.from('fee_structures').select('*');
          if (resFeeStructures?.length) setFeeStructures(resFeeStructures.map(f => ({
            id: f.id,
            departmentID: f.department_id,
            semester: f.semester,
            totalFee: f.total_fee
          })));

          const { data: resAsst } = await supabase.from('assessments').select('*');
          if (resAsst?.length) setAssessments(resAsst.map(a => ({
            id: a.id,
            courseID: a.course_id,
            section: a.section,
            department: a.department,
            type: a.type,
            title: a.title,
            totalMarks: a.total_marks,
            conductedDate: a.conducted_date,
            createdBy: a.created_by
          })));

          const { data: resMarks } = await supabase.from('marks').select('*');
          if (resMarks?.length) setMarks(resMarks.map(m => ({
            id: m.id,
            assessmentID: m.assessment_id,
            studentID: m.student_id,
            obtainedMarks: m.obtained_marks,
            submittedAt: m.submitted_at,
            remarks: m.remarks
          })));

        } catch (e) {
          console.error("Supabase Data Sync Error:", e);
        } finally {
          setStudents(localStudents);
          setFaculty(localFaculty);
          setCourses(localCourses);
          setLoading(false);
        }
      } else {
        setStudents(localStudents);
        setFaculty(localFaculty);
        setCourses(localCourses);
        setLoading(false);
      }
    };
    fetchCoreRegistries();

    if (isDatabaseConnected()) {
      const channelName = `ums_realtime_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const channel = supabase.channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financials' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_payments' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_uploads' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_entries' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'marks' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'session_attendance' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_structures' }, () => fetchCoreRegistries())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  return { 
    students, setStudents, 
    faculty, setFaculty, 
    departments, setDepartments, 
    courses, setCourses, 
    enrolments, setEnrolments, 
    results, setResults, 
    finance, setFinance, 
    attendance, setAttendance, 
    notices, setNotices, 
    exams, setExams,
    adminOverrides, setAdminOverrides,
    assessments, setAssessments,
    marks, setMarks,
    feePayments, setFeePayments,
    timetableUploads, setTimetableUploads,
    timetableEntries, setTimetableEntries,
    sessions, setSessions,
    sessionAttendance, setSessionAttendance,
    feeStructures, setFeeStructures,
    loading
  };
}
