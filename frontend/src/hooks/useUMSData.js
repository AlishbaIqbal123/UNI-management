import { useState, useEffect } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const load = (key, initial) => JSON.parse(localStorage.getItem(key)) || initial;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const safeQuery = async (queryPromise, fallbackData = []) => {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.warn("Supabase query warning:", error.message || error);
      return { data: fallbackData, error: null };
    }
    return { data: data || fallbackData, error: null };
  } catch (err) {
    console.warn("Supabase query crash:", err);
    return { data: fallbackData, error: null };
  }
};

const uniqueDepartments = (depts) => {
  const seen = new Set();
  return (depts || []).filter(d => {
    if (!d || !d.departmentID || d.departmentID.trim() === '') return false;
    const isDuplicate = seen.has(d.departmentID);
    seen.add(d.departmentID);
    return !isDuplicate;
  });
};

export function useUMSData() {
  const [students, setStudents] = useState(() => load('ums_students_v6', [
    // --- BS Computer Science ---
    { id: 'FA24-BCS-055', dbID: 'a1', name: 'Amna Pervez', regNumber: 'FA24-BCS-055', batch: 'Fall 2024', section: 'A', program: 'BS Computer Science', departmentID: 'CS', password: '123', email: 'amna.pervez@cuivehari.edu.pk', phone: '+92 321 4567890' },
    { id: 'SP25-BCS-012', dbID: 'a2', name: 'Maham Shaukat', regNumber: 'SP25-BCS-012', batch: 'Spring 2025', section: 'A', program: 'BS Computer Science', departmentID: 'CS', password: '123', email: 'maham.shaukat@cuivehari.edu.pk', phone: '+92 333 9876543' },
    { id: 'FA24-BCS-003', dbID: 'a3', name: 'Ali Hassan', regNumber: 'FA24-BCS-003', batch: 'Fall 2024', section: 'A', program: 'BS Computer Science', departmentID: 'CS', password: '123', email: 'ali.hassan@cuivehari.edu.pk', phone: '+92 300 1122334' },
    { id: 'FA24-BCS-005', dbID: 'a5', name: 'Kamran Ahmed', regNumber: 'FA24-BCS-005', batch: 'Fall 2024', section: 'B', program: 'BS Computer Science', departmentID: 'CS', password: '123', email: 'kamran@cuivehari.edu.pk', phone: '+92 345 8899001' },
    { id: 'FA24-BCS-007', dbID: 'a7', name: 'Zainab Ahmed', regNumber: 'FA24-BCS-007', batch: 'Fall 2024', section: 'A', program: 'BS Computer Science', departmentID: 'CS', password: '123', email: 'zainab@cuivehari.edu.pk', phone: '+92 321 4455667' },
    { id: 'FA24-BCS-010', dbID: 'a10', name: 'Muhammad Ali', regNumber: 'FA24-BCS-010', batch: 'Fall 2024', section: 'B', program: 'BS Computer Science', departmentID: 'CS', password: '123', email: 'mali@cuivehari.edu.pk', phone: '+92 315 3344557' },
    { id: 'FA23-BCS-021', dbID: 'a11', name: 'Usman Tariq', regNumber: 'FA23-BCS-021', batch: 'Fall 2023', section: 'A', program: 'BS Computer Science', departmentID: 'CS', password: '123', email: 'usman.tariq@cuivehari.edu.pk', phone: '+92 300 9988776' },
    // --- BS Software Engineering ---
    { id: 'SP26-BSE-045', dbID: 'a4', name: 'Ayesha Malik', regNumber: 'SP26-BSE-045', batch: 'Spring 2026', section: 'A', program: 'BS Software Engineering', departmentID: 'CS', password: '123', email: 'ayesha.malik@cuivehari.edu.pk', phone: '+92 315 5566778' },
    { id: 'FA24-BSE-008', dbID: 'a8', name: 'Hamza Malik', regNumber: 'FA24-BSE-008', batch: 'Fall 2024', section: 'B', program: 'BS Software Engineering', departmentID: 'CS', password: '123', email: 'hamza@cuivehari.edu.pk', phone: '+92 333 7788990' },
    { id: 'FA24-BSE-009', dbID: 'a9', name: 'Ayesha Khan', regNumber: 'FA24-BSE-009', batch: 'Fall 2024', section: 'A', program: 'BS Software Engineering', departmentID: 'CS', password: '123', email: 'akhan@cuivehari.edu.pk', phone: '+92 300 0011223' },
    { id: 'SP26-BSE-001', dbID: 'a6', name: 'Sana Khan', regNumber: 'SP26-BSE-001', batch: 'Spring 2026', section: 'B', program: 'BS Software Engineering', departmentID: 'CS', password: '123', email: 'sana.khan@cuivehari.edu.pk', phone: '+92 322 3344556' },
    // --- BBA ---
    { id: 'FA24-BBA-001', dbID: 'a12', name: 'Hassan Raza', regNumber: 'FA24-BBA-001', batch: 'Fall 2024', section: 'A', program: 'BBA', departmentID: 'MGMT', password: '123', email: 'hassan.raza@cuivehari.edu.pk', phone: '+92 345 1122001' },
    { id: 'FA24-BBA-015', dbID: 'a13', name: 'Maryam Sheikh', regNumber: 'FA24-BBA-015', batch: 'Fall 2024', section: 'A', program: 'BBA', departmentID: 'MGMT', password: '123', email: 'maryam.sheikh@cuivehari.edu.pk', phone: '+92 333 2233112' },
    // --- BS Accounting & Finance ---
    { id: 'SP25-BAF-003', dbID: 'a14', name: 'Bilal Ahmed', regNumber: 'SP25-BAF-003', batch: 'Spring 2025', section: 'A', program: 'BS Accounting & Finance', departmentID: 'MGMT', password: '123', email: 'bilal.ahmed@cuivehari.edu.pk', phone: '+92 321 3344223' },
    // --- BS Mathematics ---
    { id: 'FA24-BMT-001', dbID: 'a15', name: 'Noor Fatima', regNumber: 'FA24-BMT-001', batch: 'Fall 2024', section: 'A', program: 'BS Mathematics', departmentID: 'MTH', password: '123', email: 'noor.fatima@cuivehari.edu.pk', phone: '+92 300 4455334' },
    { id: 'FA24-BMT-008', dbID: 'a16', name: 'Asad Mehmood', regNumber: 'FA24-BMT-008', batch: 'Fall 2024', section: 'A', program: 'BS Mathematics', departmentID: 'MTH', password: '123', email: 'asad.mehmood@cuivehari.edu.pk', phone: '+92 315 5566445' },
    // --- BS English ---
    { id: 'FA24-BEN-001', dbID: 'a17', name: 'Sara Tariq', regNumber: 'FA24-BEN-001', batch: 'Fall 2024', section: 'A', program: 'BS English', departmentID: 'HUM', password: '123', email: 'sara.tariq@cuivehari.edu.pk', phone: '+92 301 6677556' },
    { id: 'FA24-BEN-012', dbID: 'a18', name: 'Hina Bukhari', regNumber: 'FA24-BEN-012', batch: 'Fall 2024', section: 'A', program: 'BS English', departmentID: 'HUM', password: '123', email: 'hina.bukhari@cuivehari.edu.pk', phone: '+92 302 7788667' },
    // --- BS Environmental Sciences ---
    { id: 'FA24-BVS-001', dbID: 'a19', name: 'Umar Farooq', regNumber: 'FA24-BVS-001', batch: 'Fall 2024', section: 'A', program: 'BS Environmental Sciences', departmentID: 'ES', password: '123', email: 'umar.farooq@cuivehari.edu.pk', phone: '+92 303 8899778' },
    { id: 'SP25-BVS-005', dbID: 'a20', name: 'Nimra Aslam', regNumber: 'SP25-BVS-005', batch: 'Spring 2025', section: 'A', program: 'BS Environmental Sciences', departmentID: 'ES', password: '123', email: 'nimra.aslam@cuivehari.edu.pk', phone: '+92 304 9900889' },
    // --- BS Biotechnology ---
    { id: 'FA24-BBT-001', dbID: 'a21', name: 'Anam Riaz', regNumber: 'FA24-BBT-001', batch: 'Fall 2024', section: 'A', program: 'BS Biotechnology', departmentID: 'BT', password: '123', email: 'anam.riaz@cuivehari.edu.pk', phone: '+92 305 0011990' },
    { id: 'FA24-BBT-007', dbID: 'a22', name: 'Saad Hussain', regNumber: 'FA24-BBT-007', batch: 'Fall 2024', section: 'A', program: 'BS Biotechnology', departmentID: 'BT', password: '123', email: 'saad.hussain@cuivehari.edu.pk', phone: '+92 306 1122001' },
    // --- BS Economics ---
    { id: 'FA24-BEC-001', dbID: 'a23', name: 'Zahid Iqbal', regNumber: 'FA24-BEC-001', batch: 'Fall 2024', section: 'A', program: 'BS Economics', departmentID: 'ECO', password: '123', email: 'zahid.iqbal@cuivehari.edu.pk', phone: '+92 307 2233112' },
    { id: 'SP25-BEC-003', dbID: 'a24', name: 'Nadia Akram', regNumber: 'SP25-BEC-003', batch: 'Spring 2025', section: 'A', program: 'BS Economics', departmentID: 'ECO', password: '123', email: 'nadia.akram@cuivehari.edu.pk', phone: '+92 308 3344223' }
  ]));


  const [faculty, setFaculty] = useState(() => load('ums_faculty_v5', [
    // --- Department of Computer Science ---
    { id: 'VHR-F-001', dbID: 'f1', facultyName: 'Dr. Aqeel Ur Rehman', designation: 'Associate Professor', department: 'CS', password: '123', email: 'aqeel.rehman@cuivehari.edu.pk', phone: '+92 312 0001112' },
    { id: 'VHR-F-002', dbID: 'f2', facultyName: 'Dr. Muhammad Rafiq Mufti', designation: 'Associate Professor', department: 'CS', password: '123', email: 'rafiq.mufti@cuivehari.edu.pk', phone: '+92 313 2223334' },
    { id: 'VHR-F-003', dbID: 'f3', facultyName: 'Dr. Rashid Jahangir', designation: 'Assistant Professor', department: 'CS', password: '123', email: 'rashid.jahangir@cuivehari.edu.pk', phone: '+92 333 4455667' },
    { id: 'VHR-F-004', dbID: 'f4', facultyName: 'Muhammad Izhar', designation: 'Lecturer', department: 'CS', password: '123', email: 'mizhar@cuivehari.edu.pk', phone: '+92 332 7788990' },
    { id: 'VHR-F-005', dbID: 'f5', facultyName: 'Muhammad Zubair', designation: 'Lecturer', department: 'CS', password: '123', email: 'mzubair@cuivehari.edu.pk', phone: '+92 322 1122334' },
    { id: 'VHR-F-006', dbID: 'f6', facultyName: 'Muhammad Sami Ullah', designation: 'Lecturer', department: 'CS', password: '123', email: 'samiullah@cuivehari.edu.pk', phone: '+92 300 5566778' },
    { id: 'VHR-F-007', dbID: 'f7', facultyName: 'Hafiz Yasir Ghafoor', designation: 'Lecturer', department: 'CS', password: '123', email: 'yasir.ghafoor@cuivehari.edu.pk', phone: '+92 345 8899001' },
    { id: 'VHR-F-020', dbID: 'f20', facultyName: 'Dr. Rab Nawaz Bashir', designation: 'Assistant Professor', department: 'CS', password: '123', email: 'rabnawaz@cuivehari.edu.pk', phone: '+92 333 1112223' },
    { id: 'VHR-F-021', dbID: 'f21', facultyName: 'Muhammad Zaheer Akhtar', designation: 'Lecturer', department: 'CS', password: '123', email: 'mzaheer@cuivehari.edu.pk', phone: '+92 334 2223334' },
    // --- Department of Management Sciences ---
    { id: 'VHR-F-008', dbID: 'f8', facultyName: 'Dr. Orangzab', designation: 'Associate Professor', department: 'MGMT', password: '123', email: 'orangzab@cuivehari.edu.pk', phone: '+92 321 4455667' },
    { id: 'VHR-F-009', dbID: 'f9', facultyName: 'Dr. Muzhar Javed', designation: 'Assistant Professor', department: 'MGMT', password: '123', email: 'muzhar.javed@cuivehari.edu.pk', phone: '+92 315 3344557' },
    { id: 'VHR-F-010', dbID: 'f10', facultyName: 'Dr. Saeed Ahmad Qaisrani', designation: 'Associate Professor', department: 'MGMT', password: '123', email: 'saeed.qaisrani@cuivehari.edu.pk', phone: '+92 331 4455668' },
    // --- Department of Mathematics ---
    { id: 'VHR-F-011', dbID: 'f11', facultyName: 'Dr. Muhammad Zahid Abbas', designation: 'Associate Professor', department: 'MTH', password: '123', email: 'zahid.abbas@cuivehari.edu.pk', phone: '+92 300 1234501' },
    { id: 'VHR-F-012', dbID: 'f12', facultyName: 'Dr. Tahira Nazir', designation: 'Assistant Professor', department: 'MTH', password: '123', email: 'tahira.nazir@cuivehari.edu.pk', phone: '+92 301 2345612' },
    // --- Department of Environmental Sciences ---
    { id: 'VHR-F-013', dbID: 'f13', facultyName: 'Dr. Muhammad Shahid', designation: 'Associate Professor', department: 'ES', password: '123', email: 'mshahid@cuivehari.edu.pk', phone: '+92 302 3456723' },
    { id: 'VHR-F-014', dbID: 'f14', facultyName: 'Dr. Muhammad Imran', designation: 'Associate Professor', department: 'ES', password: '123', email: 'mimran@cuivehari.edu.pk', phone: '+92 303 4567834' },
    // --- Department of Biotechnology ---
    { id: 'VHR-F-015', dbID: 'f15', facultyName: 'Dr. Muhammad Ibrahim Abdullah', designation: 'Professor', department: 'BT', password: '123', email: 'ibrahim.abdullah@cuivehari.edu.pk', phone: '+92 304 5678945' },
    { id: 'VHR-F-016', dbID: 'f16', facultyName: 'Dr. Asma Sattar', designation: 'Assistant Professor', department: 'BT', password: '123', email: 'asma.sattar@cuivehari.edu.pk', phone: '+92 305 6789056' },
    // --- Department of Humanities (English) ---
    { id: 'VHR-F-017', dbID: 'f17', facultyName: 'Dr. Ghulam Abbas', designation: 'Assistant Professor', department: 'HUM', password: '123', email: 'ghulam.abbas@cuivehari.edu.pk', phone: '+92 306 7890167' },
    { id: 'VHR-F-018', dbID: 'f18', facultyName: 'Dr. Sadia Bashir', designation: 'Lecturer', department: 'HUM', password: '123', email: 'sadia.bashir@cuivehari.edu.pk', phone: '+92 307 8901278' },
    // --- Department of Economics ---
    { id: 'VHR-F-019', dbID: 'f19', facultyName: 'Dr. Tahir Mahmood', designation: 'Associate Professor', department: 'ECO', password: '123', email: 'tahir.mahmood@cuivehari.edu.pk', phone: '+92 308 9012389' },
    { id: 'VHR-F-020', dbID: 'f20', facultyName: 'Dr. Saima Jamil', designation: 'Assistant Professor', department: 'ECO', password: '123', email: 'saima.jamil@cuivehari.edu.pk', phone: '+92 309 0123490' },
    // --- Finance Office ---
    { id: 'FIN1', dbID: 'f21', facultyName: 'Adnan Ahmed', role: 'Finance', password: 'admin', designation: 'Finance Manager', department: 'ADMIN', email: 'finance@cuivehari.edu.pk', phone: '+92 314 4445556' }
  ]));

  const [courses, setCourses] = useState(() => load('ums_courses_v5', [
    // --- Computer Science / Software Engineering ---
    { courseID: 'CSC101', courseName: 'Programming Fundamentals', credits: 4, assignedFacultyID: 'VHR-F-004', department: 'CS', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'CSC141', courseName: 'Introduction to Computing', credits: 3, assignedFacultyID: 'VHR-F-006', department: 'CS', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'CSC241', courseName: 'Object Oriented Programming', credits: 4, assignedFacultyID: 'VHR-F-005', department: 'CS', prerequisites: ['CSC101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'CSC211', courseName: 'Discrete Structures', credits: 3, assignedFacultyID: 'VHR-F-003', department: 'CS', prerequisites: ['MTH101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'CSC291', courseName: 'Data Structures & Algorithms', credits: 4, assignedFacultyID: 'VHR-F-004', department: 'CS', prerequisites: ['CSC241'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'CSC311', courseName: 'Database Systems', credits: 3, assignedFacultyID: 'VHR-F-003', department: 'CS', prerequisites: ['CSC291'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'CSC371', courseName: 'Computer Networks', credits: 3, assignedFacultyID: 'VHR-F-007', department: 'CS', prerequisites: ['CSC291'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'CSC351', courseName: 'Operating Systems', credits: 3, assignedFacultyID: 'VHR-F-002', department: 'CS', prerequisites: ['CSC291'], offeredToBatches: ['Fall 2024'] },
    { courseID: 'CSC461', courseName: 'Compiler Construction', credits: 3, assignedFacultyID: 'VHR-F-002', department: 'CS', prerequisites: ['CSC291', 'CSC211'], offeredToBatches: ['Fall 2024'] },
    { courseID: 'CSC421', courseName: 'Public Key Cryptography', credits: 3, assignedFacultyID: 'VHR-F-001', department: 'CS', prerequisites: ['CSC211'], offeredToBatches: ['Fall 2024'] },
    { courseID: 'SEN301', courseName: 'Software Engineering', credits: 3, assignedFacultyID: 'VHR-F-003', department: 'CS', prerequisites: ['CSC241'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'SEN411', courseName: 'Software Design & Architecture', credits: 3, assignedFacultyID: 'VHR-F-001', department: 'CS', prerequisites: ['SEN301'], offeredToBatches: ['Fall 2024'] },
    // --- Mathematics ---
    { courseID: 'MTH101', courseName: 'Calculus & Analytical Geometry', credits: 3, assignedFacultyID: 'VHR-F-011', department: 'MTH', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'MTH231', courseName: 'Linear Algebra', credits: 3, assignedFacultyID: 'VHR-F-012', department: 'MTH', prerequisites: ['MTH101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'MTH262', courseName: 'Statistics & Probability', credits: 3, assignedFacultyID: 'VHR-F-012', department: 'MTH', prerequisites: ['MTH101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    // --- Management Sciences ---
    { courseID: 'MGT101', courseName: 'Principles of Management', credits: 3, assignedFacultyID: 'VHR-F-009', department: 'MGMT', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'MGT201', courseName: 'Financial Accounting', credits: 3, assignedFacultyID: 'VHR-F-010', department: 'MGMT', prerequisites: ['MGT101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'MGT301', courseName: 'Marketing Management', credits: 3, assignedFacultyID: 'VHR-F-008', department: 'MGMT', prerequisites: ['MGT101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'MGT401', courseName: 'Strategic Management', credits: 3, assignedFacultyID: 'VHR-F-008', department: 'MGMT', prerequisites: ['MGT301'], offeredToBatches: ['Fall 2024'] },
    // --- Environmental Sciences ---
    { courseID: 'ENV101', courseName: 'Introduction to Environmental Sciences', credits: 3, assignedFacultyID: 'VHR-F-013', department: 'ES', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'ENV201', courseName: 'Environmental Chemistry', credits: 3, assignedFacultyID: 'VHR-F-014', department: 'ES', prerequisites: ['ENV101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    // --- Biotechnology ---
    { courseID: 'BIO101', courseName: 'Basic Biology', credits: 3, assignedFacultyID: 'VHR-F-015', department: 'BT', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'BIO201', courseName: 'Molecular Biology', credits: 3, assignedFacultyID: 'VHR-F-016', department: 'BT', prerequisites: ['BIO101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    // --- Humanities ---
    { courseID: 'ENG101', courseName: 'English Composition & Comprehension', credits: 3, assignedFacultyID: 'VHR-F-018', department: 'HUM', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'ENG201', courseName: 'Communication Skills', credits: 3, assignedFacultyID: 'VHR-F-017', department: 'HUM', prerequisites: ['ENG101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] },
    { courseID: 'HUM100', courseName: 'Pakistan Studies', credits: 2, assignedFacultyID: 'VHR-F-017', department: 'HUM', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'HUM110', courseName: 'Islamic Studies / Ethics', credits: 2, assignedFacultyID: 'VHR-F-018', department: 'HUM', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    // --- Economics ---
    { courseID: 'ECO101', courseName: 'Principles of Microeconomics', credits: 3, assignedFacultyID: 'VHR-F-019', department: 'ECO', prerequisites: ['None'], offeredToBatches: ['Fall 2024', 'Spring 2025', 'Spring 2026'] },
    { courseID: 'ECO201', courseName: 'Principles of Macroeconomics', credits: 3, assignedFacultyID: 'VHR-F-020', department: 'ECO', prerequisites: ['ECO101'], offeredToBatches: ['Fall 2024', 'Spring 2025'] }
  ]));

  const [departments, setDepartments] = useState(() => uniqueDepartments(load('ums_depts_v5', [
    { departmentID: 'CS', departmentName: 'Department of Computer Science', headOfDepartment: 'Dr. Aqeel Ur Rehman', programs: ['BS Computer Science', 'BS Software Engineering', 'MS Computer Science'] },
    { departmentID: 'MGMT', departmentName: 'Department of Management Sciences', headOfDepartment: 'Dr. Orangzab', programs: ['BBA', 'BS Accounting & Finance', 'MBA', 'MS Management Sciences', 'PhD Management Sciences'] },
    { departmentID: 'MTH', departmentName: 'Department of Mathematics', headOfDepartment: 'Dr. Muhammad Zahid Abbas', programs: ['BS Mathematics', 'MS Mathematics', 'PhD Mathematics'] },
    { departmentID: 'ES', departmentName: 'Department of Environmental Sciences', headOfDepartment: 'Dr. Muhammad Shahid', programs: ['BS Environmental Sciences', 'MS Environmental Sciences', 'PhD Environmental Sciences'] },
    { departmentID: 'BT', departmentName: 'Department of Biotechnology', headOfDepartment: 'Dr. Muhammad Ibrahim Abdullah', programs: ['BS Biotechnology', 'MS Biotechnology', 'PhD Biotechnology'] },
    { departmentID: 'HUM', departmentName: 'Department of Humanities', headOfDepartment: 'Dr. Ghulam Abbas', programs: ['BS English', 'MS English', 'PhD English (Linguistics)'] },
    { departmentID: 'ECO', departmentName: 'Department of Economics', headOfDepartment: 'Dr. Tahir Mahmood', programs: ['BS Economics', 'MS Economics', 'PhD Economics'] }
  ])));

  const [enrolments, setEnrolments] = useState(() => load('ums_enrolments_v5', [
    { registrationID: 101, studentID: 'FA24-BCS-055', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 102, studentID: 'FA24-BCS-055', courseID: 'MTH101', status: 'Confirmed' },
    { registrationID: 103, studentID: 'FA24-BCS-055', courseID: 'ENG101', status: 'Confirmed' },
    { registrationID: 104, studentID: 'SP25-BCS-012', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 105, studentID: 'FA24-BCS-003', courseID: 'CSC211', status: 'Confirmed' },
    { registrationID: 106, studentID: 'FA24-BCS-003', courseID: 'CSC241', status: 'Confirmed' },
    { registrationID: 107, studentID: 'FA24-BCS-007', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 108, studentID: 'FA24-BCS-010', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 109, studentID: 'FA23-BCS-021', courseID: 'CSC311', status: 'Confirmed' },
    { registrationID: 110, studentID: 'FA23-BCS-021', courseID: 'CSC351', status: 'Confirmed' },
    { registrationID: 111, studentID: 'SP26-BSE-045', courseID: 'CSC141', status: 'Confirmed' },
    { registrationID: 112, studentID: 'FA24-BSE-008', courseID: 'CSC101', status: 'Confirmed' },
    { registrationID: 113, studentID: 'FA24-BSE-009', courseID: 'CSC241', status: 'Confirmed' },
    { registrationID: 114, studentID: 'FA24-BBA-001', courseID: 'MGT101', status: 'Confirmed' },
    { registrationID: 115, studentID: 'FA24-BBA-015', courseID: 'MGT101', status: 'Confirmed' },
    { registrationID: 116, studentID: 'SP25-BAF-003', courseID: 'MGT201', status: 'Confirmed' },
    { registrationID: 117, studentID: 'FA24-BMT-001', courseID: 'MTH101', status: 'Confirmed' },
    { registrationID: 118, studentID: 'FA24-BMT-008', courseID: 'MTH231', status: 'Confirmed' },
    { registrationID: 119, studentID: 'FA24-BEN-001', courseID: 'ENG101', status: 'Confirmed' },
    { registrationID: 120, studentID: 'FA24-BVS-001', courseID: 'ENV101', status: 'Confirmed' },
    { registrationID: 121, studentID: 'FA24-BBT-001', courseID: 'BIO101', status: 'Confirmed' },
    { registrationID: 122, studentID: 'FA24-BEC-001', courseID: 'ECO101', status: 'Confirmed' }
  ]));

  const [results, setResults] = useState(() => load('ums_results_v5', [
    { resultID: 'r1', studentID: 'FA24-BCS-055', courseID: 'CSC101', grade: 'A', GPA: 4.0 },
    { resultID: 'r2', studentID: 'FA24-BCS-055', courseID: 'MTH101', grade: 'B+', GPA: 3.3 },
    { resultID: 'r3', studentID: 'FA24-BCS-055', courseID: 'ENG101', grade: 'A-', GPA: 3.7 },
    { resultID: 'r4', studentID: 'FA24-BCS-003', courseID: 'CSC101', grade: 'B', GPA: 3.0 },
    { resultID: 'r5', studentID: 'FA24-BCS-007', courseID: 'CSC101', grade: 'A-', GPA: 3.7 },
    { resultID: 'r6', studentID: 'FA23-BCS-021', courseID: 'CSC291', grade: 'B+', GPA: 3.3 },
    { resultID: 'r7', studentID: 'FA24-BBA-001', courseID: 'MGT101', grade: 'A', GPA: 4.0 },
    { resultID: 'r8', studentID: 'FA24-BMT-001', courseID: 'MTH101', grade: 'A', GPA: 4.0 },
    { resultID: 'r9', studentID: 'FA24-BEN-001', courseID: 'ENG101', grade: 'A-', GPA: 3.7 },
    { resultID: 'r10', studentID: 'FA24-BVS-001', courseID: 'ENV101', grade: 'B+', GPA: 3.3 }
  ]));
  const [finance, setFinance] = useState(() => load('ums_finance_v5', [
     { recordID: 1, studentID: 'FA24-BCS-055', amountPaid: 154000, dueAmount: 0, totalFee: 154000, semester: 'Fall 2024' },
     { recordID: 2, studentID: 'SP25-BCS-012', amountPaid: 77000, dueAmount: 77000, totalFee: 154000, semester: 'Spring 2025' },
     { recordID: 3, studentID: 'FA24-BCS-003', amountPaid: 0, dueAmount: 154000, totalFee: 154000, semester: 'Fall 2024' },
     { recordID: 4, studentID: 'FA24-BCS-010', amountPaid: 154000, dueAmount: 0, totalFee: 154000, semester: 'Fall 2024' },
     { recordID: 5, studentID: 'FA24-BBA-001', amountPaid: 90000, dueAmount: 0, totalFee: 90000, semester: 'Fall 2024' },
     { recordID: 6, studentID: 'FA24-BBA-015', amountPaid: 45000, dueAmount: 45000, totalFee: 90000, semester: 'Fall 2024' },
     { recordID: 7, studentID: 'FA24-BMT-001', amountPaid: 86000, dueAmount: 0, totalFee: 86000, semester: 'Fall 2024' },
     { recordID: 8, studentID: 'FA24-BEN-001', amountPaid: 86000, dueAmount: 0, totalFee: 86000, semester: 'Fall 2024' },
     { recordID: 9, studentID: 'FA24-BVS-001', amountPaid: 43000, dueAmount: 43000, totalFee: 86000, semester: 'Fall 2024' },
     { recordID: 10, studentID: 'FA24-BBT-001', amountPaid: 92000, dueAmount: 0, totalFee: 92000, semester: 'Fall 2024' }
  ]));
  const [feeStructures, setFeeStructures] = useState(() => load('ums_fee_structures_v2', [
     { id: 'fs1', departmentID: 'BS Computer Science', semester: 'Spring 2026', totalFee: 154000 },
     { id: 'fs2', departmentID: 'BS Software Engineering', semester: 'Spring 2026', totalFee: 154000 },
     { id: 'fs3', departmentID: 'BBA', semester: 'Spring 2026', totalFee: 90000 },
     { id: 'fs4', departmentID: 'BS Accounting & Finance', semester: 'Spring 2026', totalFee: 86000 },
     { id: 'fs5', departmentID: 'BS Mathematics', semester: 'Spring 2026', totalFee: 86000 },
     { id: 'fs6', departmentID: 'BS English', semester: 'Spring 2026', totalFee: 86000 },
     { id: 'fs7', departmentID: 'BS Environmental Sciences', semester: 'Spring 2026', totalFee: 86000 },
     { id: 'fs8', departmentID: 'BS Biotechnology', semester: 'Spring 2026', totalFee: 92000 },
     { id: 'fs9', departmentID: 'BS Economics', semester: 'Spring 2026', totalFee: 86000 }
  ]));
  const [attendance, setAttendance] = useState(() => load('ums_attendance_v5', []));
  const [notices, setNotices] = useState(() => load('ums_notices_v5', [
    { id: 1, title: 'Spring 2026 Orientation', content: 'Orientation week for all freshmen begins on March 3, 2026. Report to the Main Auditorium at 9:00 AM.', date: '2026-03-01', target: 'All', type: 'Academic' },
    { id: 2, title: 'Mid-Term Examination Schedule', content: 'Mid-term examinations for Spring 2026 will be held from April 14 to April 25, 2026. Datesheet is available on the notice board.', date: '2026-04-01', target: 'All', type: 'Examination' },
    { id: 3, title: 'Fee Payment Deadline', content: 'Last date for fee payment without late fee surcharge is March 15, 2026. Visit the Finance Office or pay via online challan.', date: '2026-03-05', target: 'All', type: 'Finance' },
    { id: 4, title: 'Career Fair 2026', content: 'Annual Career Fair featuring top employers from the tech industry. All final year students are encouraged to attend with updated CVs.', date: '2026-04-15', target: 'All', type: 'General' },
    { id: 5, title: 'Campus Director Message', content: 'Prof. Dr. Khuda Bakhsh congratulates all students on academic achievements and encourages participation in co-curricular activities.', date: '2026-03-10', target: 'All', type: 'General' }
  ]));
  
  // Data Integrity & Professionalization Effect
  useEffect(() => {
    let changed = false;
    const cleanStudents = students.map(s => {
      let updated = { ...s };
      if (!s.regNumber) {
        changed = true;
        updated.regNumber = s.id;
      }
      if (s.id && !s.id.includes('-')) {
        changed = true;
        updated.id = s.regNumber || `FA24-BCS-055`;
      }
      return updated;
    });
    if (changed) setStudents(cleanStudents);
  }, [students]);
  const [adminOverrides, setAdminOverrides] = useState(() => load('ums_overrides_v4', []));
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState(() => load('ums_exams_v5', [
    { id: 1, courseID: 'CSC101', date: '2026-04-14', time: '09:00 AM', venue: 'Hall A', type: 'Midterm', invigilator: 'Dr. Rashid Jahangir' },
    { id: 2, courseID: 'MTH101', date: '2026-04-14', time: '02:00 PM', venue: 'Hall B', type: 'Midterm', invigilator: 'Dr. Tahira Nazir' },
    { id: 3, courseID: 'CSC241', date: '2026-04-15', time: '09:00 AM', venue: 'Hall A', type: 'Midterm', invigilator: 'Muhammad Izhar' },
    { id: 4, courseID: 'MGT101', date: '2026-04-15', time: '02:00 PM', venue: 'Hall C', type: 'Midterm', invigilator: 'Dr. Saeed Ahmad Qaisrani' },
    { id: 5, courseID: 'ENG101', date: '2026-04-16', time: '09:00 AM', venue: 'Hall B', type: 'Midterm', invigilator: 'Dr. Ghulam Abbas' },
    { id: 6, courseID: 'ENV101', date: '2026-04-16', time: '02:00 PM', venue: 'Hall C', type: 'Midterm', invigilator: 'Dr. Muhammad Imran' },
    { id: 7, courseID: 'BIO101', date: '2026-04-17', time: '09:00 AM', venue: 'Hall A', type: 'Midterm', invigilator: 'Dr. Asma Sattar' },
    { id: 8, courseID: 'ECO101', date: '2026-04-17', time: '02:00 PM', venue: 'Hall B', type: 'Midterm', invigilator: 'Dr. Saima Jamil' },
    { id: 9, courseID: 'CSC461', date: '2026-04-18', time: '09:00 AM', venue: 'CS Lab 1', type: 'Midterm', invigilator: 'Dr. Muhammad Rafiq Mufti' },
    { id: 10, courseID: 'CSC421', date: '2026-04-18', time: '02:00 PM', venue: 'Hall A', type: 'Midterm', invigilator: 'Dr. Aqeel Ur Rehman' }
  ]));

  const [assessments, setAssessments] = useState(() => load('ums_assessments_v4', []));
  const [marks, setMarks] = useState(() => load('ums_marks_v4', []));
  const [feePayments, setFeePayments] = useState(() => load('ums_fee_payments_v1', []));
  const [passwordResetRequests, setPasswordResetRequests] = useState(() => load('ums_password_resets_v1', []));
  const defaultUploads = [
    {
      id: 'mock-upload-1',
      fileURL: '#',
      type: 'student',
      semesterLabel: 'Fall 2026',
      uploadedAt: new Date().toISOString()
    },
    {
      id: 'mock-upload-2',
      fileURL: '#',
      type: 'teacher',
      semesterLabel: 'Fall 2026',
      uploadedAt: new Date().toISOString()
    }
  ];

  const defaultEntries = [
    // Student Timetable (FA24-BCS-A) - Monday
    {
      upload_id: 'mock-upload-1',
      timetable_type: 'student',
      owner_label: 'FA24-BCS-A',
      day: 'Monday',
      slot_number: 1,
      time_label: '8:30 - 10:00 AM',
      subject: 'Programming Fundamentals',
      room_code: 'CS-01',
      instructor: 'Muhammad Izhar',
      session_type: 'class',
      span: 1
    },
    {
      upload_id: 'mock-upload-1',
      timetable_type: 'student',
      owner_label: 'FA24-BCS-A',
      day: 'Monday',
      slot_number: 2,
      time_label: '10:00 - 11:30 AM',
      subject: 'Programming Fundamentals Lab',
      room_code: 'CS-Lab-1',
      instructor: 'Muhammad Izhar',
      session_type: 'lab',
      span: 2
    },
    // Tuesday
    {
      upload_id: 'mock-upload-1',
      timetable_type: 'student',
      owner_label: 'FA24-BCS-A',
      day: 'Tuesday',
      slot_number: 3,
      time_label: '11:30 - 1:00 PM',
      subject: 'Discrete Structures',
      room_code: 'CS-02',
      instructor: 'Engr. Waqas Ahmed',
      session_type: 'class',
      span: 1
    },
    // Wednesday
    {
      upload_id: 'mock-upload-1',
      timetable_type: 'student',
      owner_label: 'FA24-BCS-A',
      day: 'Wednesday',
      slot_number: 2,
      time_label: '10:00 - 11:30 AM',
      subject: 'Calculus & Geometry',
      room_code: 'MTH-05',
      instructor: 'Dr. Saima Jamil',
      session_type: 'class',
      span: 1
    },
    // Thursday
    {
      upload_id: 'mock-upload-1',
      timetable_type: 'student',
      owner_label: 'FA24-BCS-A',
      day: 'Thursday',
      slot_number: 4,
      time_label: '1:30 - 3:00 PM',
      subject: 'Object Oriented Programming',
      room_code: 'CS-03',
      instructor: 'Dr. Sadia Bashir',
      session_type: 'class',
      span: 1
    },
    // Friday
    {
      upload_id: 'mock-upload-1',
      timetable_type: 'student',
      owner_label: 'FA24-BCS-A',
      day: 'Friday',
      slot_number: 1,
      time_label: '8:30 - 10:00 AM',
      subject: 'Discrete Structures',
      room_code: 'CS-02',
      instructor: 'Engr. Waqas Ahmed',
      session_type: 'class',
      span: 1
    },

    // Teacher Timetable — Dr. Aqeel Ur Rehman (from PDF)
    {
      upload_id: 'mock-upload-2',
      timetable_type: 'teacher',
      owner_label: 'Dr. Aqeel Ur Rehman',
      day: 'Wednesday',
      slot_number: 5,
      time_label: '3:00 - 4:30 PM',
      subject: 'Public Key Cryptography',
      room_code: 'R17',
      batch_section: 'MSCS-B2, MSCS-B3, MSCS-B4',
      session_type: 'class',
      span: 1
    },
    {
      upload_id: 'mock-upload-2',
      timetable_type: 'teacher',
      owner_label: 'Dr. Aqeel Ur Rehman',
      day: 'Wednesday',
      slot_number: 6,
      time_label: '4:30 - 6:00 PM',
      subject: 'Public Key Cryptography',
      room_code: 'R17',
      batch_section: 'MSCS-B2, MSCS-B3, MSCS-B4',
      session_type: 'class',
      span: 1
    },
    // Teacher Timetable — Dr. Muhammad Rafiq Mufti (from PDF)
    {
      upload_id: 'mock-upload-2',
      timetable_type: 'teacher',
      owner_label: 'Dr. Muhammad Rafiq Mufti',
      day: 'Tuesday',
      slot_number: 3,
      time_label: '11:30 - 1:00 PM',
      subject: 'Compiler Construction (2 Hrs.)',
      room_code: 'R17',
      batch_section: 'BCS-B21-A',
      session_type: 'class',
      span: 1
    },
    {
      upload_id: 'mock-upload-2',
      timetable_type: 'teacher',
      owner_label: 'Dr. Muhammad Rafiq Mufti',
      day: 'Wednesday',
      slot_number: 3,
      time_label: '11:30 - 1:00 PM',
      subject: 'Compiler Construction (2 Hrs.)',
      room_code: 'R17',
      batch_section: 'BCS-B21-A',
      session_type: 'class',
      span: 1
    },
    // Teacher Timetable — Muhammad Izhar
    {
      upload_id: 'mock-upload-2',
      timetable_type: 'teacher',
      owner_label: 'Muhammad Izhar',
      day: 'Monday',
      slot_number: 1,
      time_label: '8:30 - 10:00 AM',
      subject: 'Programming Fundamentals',
      room_code: 'CS-01',
      batch_section: 'FA24-BCS-A',
      session_type: 'class',
      span: 1
    },
    {
      upload_id: 'mock-upload-2',
      timetable_type: 'teacher',
      owner_label: 'Muhammad Izhar',
      day: 'Monday',
      slot_number: 2,
      time_label: '10:00 - 11:30 AM',
      subject: 'Programming Fundamentals Lab',
      room_code: 'CS-Lab-1',
      batch_section: 'FA24-BCS-A',
      session_type: 'lab',
      span: 2
    }
  ];

  const [timetableUploads, setTimetableUploads] = useState(() => load('ums_timetable_uploads_v1', defaultUploads));
  const [timetableEntries, setTimetableEntries] = useState(() => load('ums_timetable_entries_v1', defaultEntries));
  const [sessions, setSessions] = useState(() => load('ums_sessions_v1', []));
  const [sessionAttendance, setSessionAttendance] = useState(() => load('ums_session_attendance_v1', []));

  useEffect(() => {
    save('ums_students_v6', students); save('ums_faculty_v5', faculty);
    save('ums_courses_v5', courses); save('ums_depts_v5', departments);
    save('ums_enrolments_v5', enrolments); save('ums_results_v5', results);
    save('ums_finance_v5', finance); save('ums_attendance_v5', attendance);
    save('ums_notices_v5', notices); save('ums_exams_v5', exams);
    save('ums_overrides_v4', adminOverrides); save('ums_assessments_v4', assessments);
    save('ums_marks_v4', marks); save('ums_fee_payments_v1', feePayments);
    save('ums_timetable_uploads_v1', timetableUploads); save('ums_timetable_entries_v1', timetableEntries);
    save('ums_sessions_v1', sessions); save('ums_session_attendance_v1', sessionAttendance);
    save('ums_fee_structures_v2', feeStructures);
    save('ums_password_resets_v1', passwordResetRequests);
  }, [students, faculty, courses, departments, enrolments, results, finance, attendance, notices, exams, adminOverrides, assessments, marks, feePayments, timetableUploads, timetableEntries, sessions, sessionAttendance, feeStructures, passwordResetRequests]);

  useEffect(() => {
    const fetchCoreRegistries = async () => {
      let localStudents = students;
      let localFaculty = faculty;
      let localCourses = courses;

      if (isDatabaseConnected()) {
        try {
          const [
            resStudents, resFaculty, resCourses, resDepts, resEnrol, 
            resRes, resFin, resPay, resUploads, resEntries, 
            resSessions, resAttend, resFeeStructures, resAsst, resMarks, resResets
          ] = await Promise.all([
             safeQuery(supabase.from('students').select('*')),
             safeQuery(supabase.from('faculty').select('*')),
             safeQuery(supabase.from('courses').select('*')),
             safeQuery(supabase.from('departments').select('*')),
             safeQuery(supabase.from('enrollments').select('*')),
             safeQuery(supabase.from('results').select('*')),
             safeQuery(supabase.from('financials').select('*')),
             safeQuery(supabase.from('fee_payments').select('*')),
             safeQuery(supabase.from('timetable_uploads').select('*')),
             safeQuery(supabase.from('timetable_entries').select('*')),
             safeQuery(supabase.from('sessions').select('*')),
             safeQuery(supabase.from('session_attendance').select('*')),
             safeQuery(supabase.from('fee_structures').select('*')),
             safeQuery(supabase.from('assessments').select('*')),
             safeQuery(supabase.from('marks').select('*')),
             safeQuery(supabase.from('password_reset_requests').select('*'))
          ]);

          if (resStudents.data?.length) {
            const fetchedStudents = resStudents.data
              .filter(s => s.full_name && s.full_name.trim() !== '')
              .map((s, idx) => {
                const regId = s.university_id && s.university_id.length < 20 ? s.university_id : `FA24-BCS-${String(idx+1).padStart(3, '0')}`;
                const localMatch = localStudents.find(ls => ls.id === regId || ls.regNumber === regId);
                return { 
                  id: regId, 
                  dbID: s.profile_id || s.uuid || s.id, 
                  name: s.full_name, 
                  regNumber: regId,
                  program: s.program || (localMatch?.program) || 'BSCS',
                  departmentID: s.department_id || (localMatch?.departmentID) || 'CS',
                  batch: s.batch || (localMatch?.batch) || 'Fall 2024',
                  section: s.section || (localMatch?.section) || 'A',
                  password: (localMatch?.password) || '123',
                  email: s.email || (localMatch?.email),
                  phone: s.phone || (localMatch?.phone) || ''
                };
              });
            localStudents = [...localStudents.filter(s => !fetchedStudents.some(fs => fs.id === s.id)), ...fetchedStudents];
          }

          if (resFaculty.data?.length) {
            const fetchedFaculty = resFaculty.data
              .filter(f => f.full_name && f.full_name.trim() !== '') // Skip records without proper names
              .map(f => {
                const empId = f.employee_id || f.id;
                const localMatch = localFaculty.find(lf => lf.id === empId);
                return { 
                  id: empId, 
                  dbID: f.profile_id || f.uuid || f.id, 
                  facultyName: f.full_name, 
                  designation: f.designation || (localMatch?.designation) || 'Lecturer', 
                  department: f.department || (localMatch?.department) || '',
                  role: (empId || '').includes('FIN') ? 'Finance' : 'Faculty', 
                  password: (localMatch?.password) || ((empId || '').includes('FIN') ? 'admin' : '123'),
                  email: f.email || (localMatch?.email),
                  phone: f.phone || (localMatch?.phone) || ''
                };
              });
            localFaculty = [...localFaculty.filter(f => !fetchedFaculty.some(ff => ff.id === f.id)), ...fetchedFaculty];
          }

          if (resCourses.data?.length) {
              const fetchedCourses = resCourses.data
                .filter(c => (c.title || c.name) && (c.title || c.name).trim() !== '')
                .map(c => {
                  const cid = c.course_code || c.id;
                  const localMatch = localCourses.find(lc => lc.courseID === cid);
                  return { 
                    courseID: cid, 
                    courseName: c.title || c.name, 
                    credits: c.credit_hours || (localMatch?.credits) || 3,
                    assignedFacultyID: c.faculty_id || (localMatch?.assignedFacultyID),
                    department: c.department || (localMatch?.department) || '',
                    offeredToBatches: c.offered_batches ? c.offered_batches.split(',').map(s => s.trim()) : (localMatch?.offeredToBatches) || ['Fall 2024', 'Spring 2025'],
                    prerequisites: c.prerequisites ? c.prerequisites.split(',').map(s => s.trim()) : (localMatch?.prerequisites) || ['None']
                  };
                });
              localCourses = [...localCourses.filter(c => !fetchedCourses.some(fc => fc.courseID === c.courseID)), ...fetchedCourses];
          }

          if (resDepts.data?.length) {
            const mapped = resDepts.data
              .filter(d => (d.name && d.name.trim() !== '') || (d.code && d.code.trim() !== ''))
              .map(d => {
                const deptCode = d.code || d.id;
                const localMatch = departments.find(ld => ld.departmentID === deptCode);
                return { 
                  departmentID: deptCode, 
                  departmentName: d.name || (localMatch?.departmentName) || deptCode, 
                  headOfDepartment: d.hod_name || (localMatch?.headOfDepartment) || 'TBD',
                  programs: d.programs || (localMatch?.programs) || []
                };
              });
            // Merge: keep local departments not in DB, add/update from DB
            const mergedDepts = [
              ...departments.filter(ld => !mapped.some(md => md.departmentID === ld.departmentID)),
              ...mapped
            ];
            setDepartments(uniqueDepartments(mergedDepts));
          }
          
          if (resEnrol.data?.length) {
            setEnrolments(resEnrol.data.map(e => ({
              registrationID: e.id,
              studentID: e.student_id,
              courseID: e.course_id || e.course_code,
              status: e.status || 'Confirmed',
              registrationDate: e.created_at || '2026-03-20'
            })));
          }

          if (resRes.data?.length) {
            setResults(resRes.data.map(r => ({ 
              resultID: r.id, 
              studentID: r.student_id, 
              courseID: r.course_id || r.course_code, 
              grade: r.grade, 
              GPA: r.gpa 
            })));
          }

          if (resFin.data?.length) {
            setFinance(resFin.data.map(f => ({ 
              recordID: f.id, 
              studentID: f.student_id, 
              amountPaid: f.amount_paid || 0, 
              dueAmount: f.due_amount || 0,
              totalFee: f.total_fee || 0,
              semester: f.semester || 'Fall 2024'
            })));
          }

          if (resPay?.data?.length) {
            setFeePayments(resPay.data.map(p => ({
              id: p.id,
              studentID: p.student_id,
              amountPaid: p.amount_paid,
              paymentDate: p.payment_date,
              reference: p.reference
            })));
          }

          if (resUploads?.data?.length) {
            setTimetableUploads(resUploads.data.map(u => ({
              id: u.id,
              fileURL: u.file_url,
              type: u.type,
              semesterLabel: u.semester_label,
              uploadedAt: u.uploaded_at
            })));
          }

          if (resEntries?.data?.length) setTimetableEntries(resEntries.data);

          if (resSessions?.data?.length) setSessions(resSessions.data);
          if (resAttend?.data?.length) setSessionAttendance(resAttend.data);

          if (resFeeStructures.data?.length) {
            setFeeStructures(resFeeStructures.data.map(f => ({
              id: f.id,
              departmentID: f.department_id,
              semester: f.semester,
              totalFee: f.total_fee
            })));
          }

          if (resAsst.data?.length) {
            setAssessments(resAsst.data.map(a => ({
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
          }

          if (resMarks.data?.length) {
            setMarks(resMarks.data.map(m => ({
              id: m.id,
              assessmentID: m.assessment_id,
              studentID: m.student_id,
              obtainedMarks: m.obtained_marks,
              submittedAt: m.submitted_at,
              remarks: m.remarks
            })));
          }

          if (resResets?.data?.length) {
            setPasswordResetRequests(resResets.data.map(r => ({
              id: r.id,
              regNo: r.reg_no,
              name: r.name,
              role: r.role,
              status: r.status,
              requestedAt: r.created_at || r.requested_at
            })));
          }

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'password_reset_requests' }, () => fetchCoreRegistries())
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
    passwordResetRequests, setPasswordResetRequests,
    loading
  };
}
