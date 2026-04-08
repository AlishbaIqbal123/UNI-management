import { useState, useEffect } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const load = (key, initial) => JSON.parse(localStorage.getItem(key)) || initial;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export function useUMSData() {
  const [students, setStudents] = useState(() => load('ums_students_v4', [
    { id: 'A01', dbID: 'a0000000-0000-0000-0000-000000000001', name: 'Zainab Ahmed', batch: 'Fall 2024', program: 'BSCS', password: '123' },
    { id: 'B02', dbID: 'a0000000-0000-0000-0000-000000000002', name: 'Hamza Malik', batch: 'Fall 2024', program: 'BSSE', password: '123' },
    { id: 'C03', dbID: 'a0000000-0000-0000-0000-000000000003', name: 'Ayesha Khan', batch: 'Fall 2024', program: 'BSSE', password: '123' },
    { id: 'D04', dbID: 'a0000000-0000-0000-0000-000000000004', name: 'Muhammad Ali', batch: 'Fall 2024', program: 'BSCS', password: '123' },
    { id: 'E05', dbID: 'a0000000-0000-0000-0000-000000000005', name: 'Fatima Zahra', batch: 'Fall 2024', program: 'BSCS', password: '123' },
    { id: 'F06', dbID: 'a0000000-0000-0000-0000-000000000006', name: 'Umar Farooq', batch: 'Fall 2024', program: 'BSSE', password: '123' },
    { id: 'G07', dbID: 'a0000000-0000-0000-0000-000000000007', name: 'Sara Siddiqui', batch: 'Fall 2024', program: 'BSCS', password: '123' }
  ]));
  const [faculty, setFaculty] = useState(() => load('ums_faculty_v4', [
    { id: 'F1', name: 'Dr. Nasir', designation: 'Asst. Prof', password: '123' },
    { id: 'FIN1', name: 'Adnan (Finance)', role: 'Finance', password: 'admin' }
  ]));
  const [courses, setCourses] = useState(() => load('ums_courses_v4', [
    { courseID: 'CSC101', courseName: 'Programming', credits: 4 },
    { courseID: 'MTH101', courseName: 'Calculus', credits: 3 },
    { courseID: 'CSC112', courseName: 'ICT', credits: 3 }
  ]));

  const [departments, setDepartments] = useState(() => load('ums_depts_v4', [
    { departmentID: 'CS', departmentName: 'Computing', headOfDepartment: 'Dr. Nasir' }
  ]));
  const [enrolments, setEnrolments] = useState(() => load('ums_enrolments_v4', []));
  const [results, setResults] = useState(() => load('ums_results_v4', []));
  const [finance, setFinance] = useState(() => load('ums_finance_v4', []));
  const [attendance, setAttendance] = useState(() => load('ums_attendance_v4', []));
  const [notices, setNotices] = useState(() => load('ums_notices_v4', []));
  const [adminOverrides, setAdminOverrides] = useState(() => load('ums_overrides_v4', []));
  const [loading, setLoading] = useState(true);
  const [exams] = useState(() => load('ums_exams_v4', [
    { id: 1, course: 'CSC101', date: '2026-05-15', venue: 'Hall A' }
  ]));

  const [assessments, setAssessments] = useState(() => load('ums_assessments_v4', [
    { id: 'Q1', courseID: 'CSC101', title: 'Quiz 1', totalMarks: 10, type: 'Quiz' }
  ]));
  const [marks, setMarks] = useState(() => load('ums_marks_v4', [
    { assessmentID: 'Q1', studentID: 'A01', obtainedMarks: 8.5 }
  ]));

  useEffect(() => {
    save('ums_students_v4', students); save('ums_faculty_v4', faculty);
    save('ums_courses_v4', courses); save('ums_depts_v4', departments);
    save('ums_enrolments_v4', enrolments); save('ums_results_v4', results);
    save('ums_finance_v4', finance); save('ums_attendance_v4', attendance);
    save('ums_notices_v4', notices); save('ums_exams_v4', exams);
    save('ums_overrides_v4', adminOverrides); save('ums_assessments_v4', assessments);
    save('ums_marks_v4', marks);
  }, [students, faculty, courses, departments, enrolments, results, finance, attendance, notices, exams, adminOverrides, assessments, marks]);

  useEffect(() => {
    const fetchCoreRegistries = async () => {
      let localStudents = [
        { id: 'A01', dbID: 'a0000000-0000-0000-0000-000000000001', name: 'Zainab Ahmed', batch: 'Fall 2024', program: 'BSCS', password: '123' },
        { id: 'B02', dbID: 'a0000000-0000-0000-0000-000000000002', name: 'Hamza Malik', batch: 'Fall 2024', program: 'BSSE', password: '123' },
        { id: 'C03', dbID: 'a0000000-0000-0000-0000-000000000003', name: 'Ayesha Khan', batch: 'Fall 2024', program: 'BSSE', password: '123' },
        { id: 'D04', dbID: 'a0000000-0000-0000-0000-000000000004', name: 'Muhammad Ali', batch: 'Fall 2024', program: 'BSCS', password: '123' },
        { id: 'E05', dbID: 'a0000000-0000-0000-0000-000000000005', name: 'Fatima Zahra', batch: 'Fall 2024', program: 'BSCS', password: '123' },
        { id: 'F06', dbID: 'a0000000-0000-0000-0000-000000000006', name: 'Umar Farooq', batch: 'Fall 2024', program: 'BSSE', password: '123' },
        { id: 'G07', dbID: 'a0000000-0000-0000-0000-000000000007', name: 'Sara Siddiqui', batch: 'Fall 2024', program: 'BSCS', password: '123' }
      ];
      let localFaculty = [
        { id: 'F1', name: 'Dr. Nasir', designation: 'Asst. Professor', password: '123' },
        { id: 'FIN1', name: 'Adnan (Finance)', role: 'Finance', password: 'admin' }
      ];
      let localCourses = [
        { courseID: 'CSC101', courseName: 'Programming', credits: 4 },
        { courseID: 'MTH101', courseName: 'Calculus', credits: 3 }
      ];

      if (isDatabaseConnected()) {
        try {
          const [resStudents, resFaculty, resCourses, resDepts, resEnrol, resRes, resFin] = await Promise.all([
             supabase.from('students').select('id, university_id, program'),
             supabase.from('faculty').select('id, employee_id, designation'),
             supabase.from('courses').select('course_code, title, credit_hours'),
             supabase.from('departments').select('id, name, hod_name'),
             supabase.from('enrollments').select('*'),
             supabase.from('results').select('*'),
             supabase.from('financials').select('*')
          ]);

          if (resStudents.data?.length) {
            const fetchedStudents = resStudents.data.map(s => ({ 
              id: s.university_id, dbID: s.id, name: `Student ${s.university_id}`, 
              program: s.program || 'BSCS', batch: 'Fall 2024', password: '123' 
            }));
            localStudents = [...localStudents.filter(s => !fetchedStudents.some(fs => fs.id === s.id)), ...fetchedStudents];
          }

          if (resFaculty.data?.length) {
            const fetchedFaculty = resFaculty.data.map(f => ({ 
              id: f.employee_id, dbID: f.id, name: `Faculty ${f.employee_id}`, 
              designation: f.designation, role: f.employee_id?.includes('FIN') ? 'Finance' : 'Faculty', password: (f.employee_id?.includes('FIN') ? 'admin' : '123')
            }));
            localFaculty = [...localFaculty.filter(f => !fetchedFaculty.some(ff => ff.id === f.id)), ...fetchedFaculty];
          }

          if (resCourses.data?.length) {
              const fetchedCourses = resCourses.data.map(c => ({ courseID: c.course_code, courseName: c.title, credits: c.credit_hours }));
              localCourses = [...localCourses.filter(c => !fetchedCourses.some(fc => fc.courseID === c.courseID)), ...fetchedCourses];
          }

          if (resDepts.data?.length) setDepartments(resDepts.data.map(d => ({ departmentID: d.id, departmentName: d.name, headOfDepartment: d.hod_name })));
          
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
            dueAmount: f.due_amount || 0 
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
      const channel = supabase.channel('ums_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, () => fetchCoreRegistries())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financials' }, () => fetchCoreRegistries())
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
    exams,
    adminOverrides, setAdminOverrides,
    assessments, setAssessments,
    marks, setMarks,
    loading
  };
}
