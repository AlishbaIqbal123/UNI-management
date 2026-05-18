import React, { useState } from 'react';
import './index.css';
import { useUMSData } from './hooks/useUMSData';
import { supabase, isDatabaseConnected } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import FacultyManagement from './components/FacultyManagement';
import EnrollmentManagement from './components/EnrollmentManagement';
import ExamManagement from './components/ExamManagement';
import StudentMarksView from './components/StudentMarksView';
import NoticeManagement from './components/NoticeManagement';
import DepartmentManagement from './components/DepartmentManagement';
import CourseManagement from './components/CourseManagement';
import FinanceManagement from './components/FinanceManagement';
import StudentAcademicView from './components/StudentAcademicView';
import AdminOverrideManagement from './components/AdminOverrideManagement';
import Login from './views/Login';
import LandingPage from './views/LandingPage';
import Footer from './components/Footer';
import AcademicResults from './components/AcademicResults';
import CourseRegistration from './components/CourseRegistration';
import FacultyWorkspace from './components/FacultyWorkspace';
import TimetableGrid from './components/TimetableGrid';
import TimetableManagement from './components/TimetableManagement';
import { generateInstitutionalReport } from './lib/exportUtils';
import PasswordResetsManagement from './components/PasswordResetsManagement';




const ROLES = { ADMIN: 'Admin', STUDENT: 'Student', FACULTY: 'Faculty', FINANCE: 'Finance' };


// Session Helpers
const loadSession = () => JSON.parse(localStorage.getItem('ums_activeSession')) || null;
const saveSession = (userData) => localStorage.setItem('ums_activeSession', JSON.stringify(userData));
const loadTab = () => localStorage.getItem('ums_activeTab') || 'dashboard';
const saveTab = (tab) => localStorage.setItem('ums_activeTab', tab);

function App() {
  const [user, setUser] = useState(loadSession);
  const [activeTab, setActiveTab] = useState(loadTab);
  const [theme, setTheme] = useState(localStorage.getItem('ums_theme') || 'dark');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ums_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  // App routing state (landing -> login -> portal)
  const [appView, setAppView] = useState(user ? 'portal' : 'landing');
  
  // Restoration of missing Login wizard State
  const [loginStep, setLoginStep] = useState('choice'); 
  const [regSubStep, setRegSubStep] = useState(1);
  const [authData, setAuthData] = useState({ id: '', name: '', password: '', program: '', email: '' });
  const [loginError, setLoginError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCtx, setModalCtx] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});
  const [notifs, setNotifs] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, setter: null, id: null, typeName: '', idKey: 'id' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTimetableClass, setSelectedTimetableClass] = useState('');
  
  // Advanced Academic Calendar State

  const [calendarConfig, setCalendarConfig] = useState({ 
    headerText: "OFFICIAL ACADEMIC CALENDAR - FALL 2026 SEMESTER (CUI VEHARI)",
    footerText: "Note: The university reserves the right to modify these dates based on official gazetted holidays.",
    events: [
      { event: "Orientation Week", date: "Sep 01 - Sep 07, 2026" },
      { event: "Commencement of Classes", date: "Sep 08, 2026" },
      { event: "Midterm Examinations", date: "Oct 15 - Oct 25, 2026" }
    ]
  });

  const { 
    students, setStudents, faculty, setFaculty, departments, setDepartments, 
    courses, setCourses, enrolments, setEnrolments, results, setResults, 
    finance, setFinance, attendance, setAttendance, notices, setNotices,
    adminOverrides, setAdminOverrides, assessments, setAssessments, marks, setMarks,
    exams, setExams, feePayments, setFeePayments,
    timetableUploads, setTimetableUploads, timetableEntries, setTimetableEntries,
    sessions, setSessions, sessionAttendance, setSessionAttendance,
    feeStructures, setFeeStructures,
    passwordResetRequests, setPasswordResetRequests,
    loading
  } = useUMSData();

  if (loading && students.length < 3) {
    return (
      <div style={{height:'100vh', width:'100vw', background:'var(--surface)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
         <div className="pulse-dot" style={{width:'80px', height:'80px', background:'var(--accent)', marginBottom:'32px'}} />
         <h1 style={{color:'white', letterSpacing:'4px'}}>COMSATS UNIVERSITY</h1>
         <p style={{opacity:0.4, textTransform:'uppercase', fontSize:'12px', letterSpacing:'2px'}}>Synchronizing Institutional Registries...</p>
      </div>
    );
  }

  // --- Helpers ---
  const notify = (msg, type = 'success') => {
    const id = Date.now();
    setNotifs(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const openForm = (type, data = null) => {
    setModalCtx({ type, data });
    setFormData(data || {});
    setIsModalOpen(true);
  };

  // --- Importers & Parsers ---
  const handleCSVImport = (csvText) => {
    try {
        const lines = csvText.split('\n').filter(l => l.trim().includes(','));
        const newStudents = lines.map(line => {
            const [id, name, email, program, batch] = line.split(',');
            return { id: id.trim(), name: name.trim(), email: email.trim(), program: program.trim(), batch: batch.trim(), password: '123' };
        });
        setStudents(prev => [...prev, ...newStudents]);
        notify(`Import Success: ${newStudents.length} students added to registry.`);
        setIsModalOpen(false);
    } catch (e) {
        notify("Format Error: Please use ID,Name,Email,Program,Batch", "error");
    }
  };

  const handleCalendarUpdate = (rawText) => {
    const lines = rawText.split('\n').filter(l => l.trim().includes('|'));
    const events = lines.map(l => {
        const [event, date] = l.split('|');
        return { event: event.trim(), date: date.trim() };
    });
    setCalendarConfig(prev => ({ ...prev, events }));
    notify("Academic Calendar Broadly Synchronized.");
    setIsModalOpen(false);
  };

  const handleInitiateRecovery = async (regNo) => {
    const student = students.find(s => 
      s.id.toLowerCase() === regNo.toLowerCase() || 
      (s.regNumber && s.regNumber.toLowerCase() === regNo.toLowerCase())
    );
    
    const fac = faculty.find(f => 
      f.id.toLowerCase() === regNo.toLowerCase() ||
      (f.email && f.email.toLowerCase() === regNo.toLowerCase())
    );
    
    let userFound = student || fac;
    if (!userFound) {
      notify("No student or faculty account was found matching the entered ID/Email. Please check and try again.", "error");
      return false;
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      regNo: userFound.id || userFound.regNumber,
      name: userFound.name || userFound.facultyName,
      role: userFound.role || (student ? 'Student' : 'Faculty'),
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };

    try {
      if (isDatabaseConnected()) {
        const { data, error } = await supabase
          .from('password_reset_requests')
          .insert({
            reg_no: newRequest.regNo,
            name: newRequest.name,
            role: newRequest.role,
            status: 'Pending'
          })
          .select();
        if (error) throw error;
        if (data && data[0]) {
          newRequest.id = data[0].id;
        }
      }

      setPasswordResetRequests(prev => [newRequest, ...prev]);
      notify(`Account recovery submitted successfully for ${newRequest.name}!`, "success");
      return true;
    } catch (e) {
      console.error("Failed to submit recovery request", e);
      notify("Error: Unable to submit recovery request at this time.", "error");
      return false;
    }
  };

  // --- Global CRUD ---
  const handleSave = () => {
    if (modalCtx.type === 'csv_import') return handleCSVImport(formData.raw);
    if (modalCtx.type === 'calendar_update') return handleCalendarUpdate(formData.raw);

    if (modalCtx.type === 'notice_create') {
      const errors = {};
      if (!formData.title?.trim()) errors.title = "A formal title is required for institutional broadcasts.";
      if (!formData.content?.trim()) errors.content = "Notice body cannot be empty.";
      if (!formData.visible_to || formData.visible_to.length === 0) errors.visible_to = "Specify at least one target portal.";
      if (formData.expires_at && formData.created_at && new Date(formData.expires_at) < new Date(formData.created_at)) {
        errors.expires_at = "Expiry date cannot precede the publication date.";
      }

      if (Object.keys(errors).length > 0) {
        setFormData({ ...formData, _errors: errors });
        return;
      }
      
      // Add institutional metadata
      const noticePayload = {
        ...formData,
        created_by: user.name || user.id,
        is_published: formData.is_published !== false, // default true
        category: formData.category || 'General',
        visible_to: formData.visible_to || ['all'],
        created_at: formData.created_at || new Date().toISOString()
      };
      delete noticePayload._errors;
      delete noticePayload._supabaseError;

      if (modalCtx.data) {
        setNotices(prev => prev.map(n => n.id === modalCtx.data.id ? { ...n, ...noticePayload } : n));
      } else {
        setNotices(prev => [{ ...noticePayload, id: Date.now().toString() }, ...prev]);
      }
      notify("Institutional Announcement Broadcasted.");
      setIsModalOpen(false);
      return;
    }

    if (modalCtx.type === 'assign_hod') {
        const { id, departmentID } = modalCtx.data;
        const targetID = id || departmentID;
        const selectedFaculty = faculty.find(f => f.facultyName === formData.headOfDepartment || f.id === formData.headOfDepartment);
        const hodUUID = selectedFaculty?.dbID || null;
        
        const executeAssign = async () => {
          if (isDatabaseConnected()) {
            try {
              const { error } = await supabase
                .from('departments')
                .update({ head_of_department_id: hodUUID })
                .eq('code', targetID);
              if (error) throw error;
              notify("HOD leadership synced securely to database.");
            } catch (e) {
              console.error("Failed to update HOD in DB:", e);
              notify("HOD updated locally, DB update failed.", "warning");
            }
          }
          
          setDepartments(prev => prev.map(d => (d.id === targetID || d.departmentID === targetID) ? { ...d, headOfDepartment: selectedFaculty ? selectedFaculty.facultyName : formData.headOfDepartment } : d));
          notify(`Leadership assigned to ${selectedFaculty ? selectedFaculty.facultyName : formData.headOfDepartment}`);
          setIsModalOpen(false);
        };
        
        executeAssign();
        return;
    }

    if (modalCtx.type === 'assign_faculty') {
        const { courseID } = modalCtx.data;
        setCourses(p => p.map(c => c.courseID === courseID ? { ...c, assignedFacultyID: formData.facultyId } : c));
        notify("Course faculty updated successfully.");
        setIsModalOpen(false);
        return;
    }

    if (modalCtx.type === 'payment') {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        notify("Please enter a valid payment amount.", "error");
        return;
      }
      
      const reference = formData.description || "Semester Tuition Fee";
      const studentID = modalCtx.data.studentID;
      const studentName = modalCtx.data.studentName || modalCtx.data.name || "Student";
      const paymentDate = new Date().toISOString().split('T')[0];
      
      const executeSave = async () => {
        const payload = {
          student_id: studentID,
          amount: amount,
          date: paymentDate,
          reference: reference,
          semester: modalCtx.data.semester || 'Fall 2024'
        };
        
        if (isDatabaseConnected()) {
          try {
            const { data, error } = await supabase
              .from('fee_payments')
              .insert([payload])
              .select();
            if (error) throw error;
            if (data && data[0]) {
              const newPayment = {
                id: data[0].id,
                studentID: data[0].student_id,
                amountPaid: data[0].amount,
                paymentDate: data[0].date,
                reference: data[0].reference,
                semester: data[0].semester
              };
              setFeePayments(prev => [...prev, newPayment]);
            }
          } catch (e) {
            console.error("DB payment insertion failed, falling back:", e);
            notify("Database save failed. Recorded locally.", "error");
            const localPay = {
              id: `pay-${Date.now()}`,
              studentID,
              amountPaid: amount,
              paymentDate,
              reference,
              semester: payload.semester
            };
            setFeePayments(prev => [...prev, localPay]);
          }
        } else {
          const localPay = {
            id: `pay-${Date.now()}`,
            studentID,
            amountPaid: amount,
            paymentDate,
            reference,
            semester: payload.semester
          };
          setFeePayments(prev => [...prev, localPay]);
        }
        
        // Also update the matching financials record in state if it exists, or create a mock financials record
        setFinance(prev => {
          const existingIdx = prev.findIndex(f => f.studentID === studentID);
          if (existingIdx > -1) {
            const copy = [...prev];
            const oldRecord = copy[existingIdx];
            const updatedPaid = (parseFloat(oldRecord.amountPaid) || 0) + amount;
            const updatedDue = Math.max(0, (parseFloat(oldRecord.totalFee) || 0) - updatedPaid);
            copy[existingIdx] = {
              ...oldRecord,
              amountPaid: updatedPaid,
              dueAmount: updatedDue
            };
            return copy;
          } else {
            // Find student's department fee structure
            const studentRecord = students.find(s => s.id === studentID);
            let totalFee = 0;
            if (studentRecord) {
              const prog = (studentRecord.program || '').toLowerCase();
              const dept = (prog.includes('computer') || prog.includes('software') || prog.includes('cs')) ? 'CS' : 'BBA';
              const sem = studentRecord.batch || 'Fall 2024';
              const struct = feeStructures.find(fs => fs.departmentID === dept && fs.semester === sem);
              totalFee = struct ? struct.totalFee : 120000;
            }
            return [...prev, {
              recordID: `fin-${Date.now()}`,
              studentID,
              amountPaid: amount,
              dueAmount: Math.max(0, totalFee - amount),
              totalFee,
              semester: studentRecord?.batch || 'Fall 2024'
            }];
          }
        });
        
        notify(`Fee payment of PKR ${amount.toLocaleString()} recorded for ${studentName}.`);
        setIsModalOpen(false);
      };
      
      executeSave();
      return;
    }

    const { type, data } = modalCtx;

    if (type === 'student') {
      const name = formData.name?.trim();
      const id = formData.id?.trim().toUpperCase();
      const regNumber = formData.regNumber?.trim().toUpperCase();
      const batch = formData.batch?.trim();
      const email = formData.email?.trim();
      
      if (!name || !id || !regNumber || !batch || !email) {
        notify("Please fill in all required fields (Name, ID, Registration Number, Batch, Email).", "error");
        return;
      }

      // STRICT validation for Batch / Intake
      const batchRegex = /^(Fall|Spring)\s+\d{4}$/i;
      if (!batchRegex.test(batch)) {
        notify("Batch must strictly match active term codes format (e.g., 'Fall 2024', 'Spring 2025', 'Spring 2026').", "error");
        return;
      }

      // COMSATS registration validation on student manually added
      const comsatsRegex = /^(FA|SP)\d{2}-[A-Z]{3,4}-\d{3}$/i;
      if (!comsatsRegex.test(regNumber)) {
        notify("Registration number must follow standard COMSATS format: [IntakeSession][IntakeYear]-[DegreeCode]-[RollNo] (e.g. FA20-BCS-001)", "error");
        return;
      }

      const executeStudentSave = async () => {
        let profileUUID = data?.dbID || null;
        if (isDatabaseConnected()) {
          try {
            // Find department by student program or code
            const programCode = regNumber.split('-')[1]; // BCS, BSE, etc.
            const matchingDept = departments.find(d => d.departmentID === programCode || programCode.includes(d.departmentID));
            const deptUUID = matchingDept?.uuid || departments[0]?.uuid || null;

            if (data) {
              // Editing student profile
              const { error: profileErr } = await supabase
                .from('profiles')
                .update({ full_name: name, email: email, phone_number: formData.phone })
                .eq('id', data.dbID);
              if (profileErr) throw profileErr;

              const { error: studErr } = await supabase
                .from('students')
                .update({ university_id: regNumber, program: formData.program || 'BSCS', batch: batch })
                .eq('profile_id', data.dbID);
              if (studErr) throw studErr;

              notify("Student registry successfully updated in Database.");
            } else {
              // Onboarding new student
              const tempPassword = formData.password || '123';
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: tempPassword,
                options: {
                  data: {
                    full_name: name,
                    role: 'STUDENT'
                  }
                }
              });

              if (signUpError) {
                throw signUpError;
              } else if (signUpData?.user) {
                profileUUID = signUpData.user.id;
                // Upsert profiles
                const { error: profileErr } = await supabase
                  .from('profiles')
                  .upsert({ id: profileUUID, email: email, role: 'STUDENT', full_name: name, phone_number: formData.phone });
                if (profileErr) throw profileErr;

                // Insert student details
                const { error: studErr } = await supabase
                  .from('students')
                  .insert({ profile_id: profileUUID, university_id: regNumber, department_uuid: deptUUID, program: formData.program || 'BSCS', batch: batch });
                if (studErr) throw studErr;

                // Also initialize standard fee
                const { error: finErr } = await supabase
                  .from('financials')
                  .insert({ student_id: profileUUID, amount_due: 120000, amount_paid: 0, fee_type: 'Tuition' });
                if (finErr) throw finErr;

                notify("New Student onboarded and registered in database.");
              }
            }
          } catch (e) {
            console.error("DB student sync failed:", e);
            notify("Database save failed. Student recorded locally.", "error");
          }
        }

        // Update local state
        setStudents(prev => {
          if (data) {
            return prev.map(s => s.id === data.id ? { ...s, ...formData, id: regNumber, regNumber, dbID: profileUUID } : s);
          } else {
            return [...prev, { ...formData, id: regNumber, regNumber, dbID: profileUUID || `mock-${Date.now()}` }];
          }
        });
        
        // Update financials local state
        if (!data) {
          setFinance(prev => [...prev, {
            recordID: `fin-${Date.now()}`,
            studentID: regNumber,
            amountPaid: 0,
            dueAmount: 120000,
            totalFee: 120000,
            semester: batch
          }]);
        }

        setIsModalOpen(false);
      };

      executeStudentSave();
      return;
    }

    if (type === 'faculty') {
      const name = formData.facultyName?.trim();
      const id = formData.id?.trim().toUpperCase();
      const designation = formData.designation;
      const email = formData.email?.trim();
      
      if (!name || !id || !designation || !email) {
        notify("Please fill in all required fields (Name, Employee ID, Designation, Email).", "error");
        return;
      }

      // STRICT validation for Employee ID (VHR-F-XXX) or match CUI employee ID criteria (allow FIN1 / ADMIN bypass)
      const empIdRegex = /^VHR-F-\d{3}$/i;
      const bypassList = ['FIN1', 'ADMIN', 'ADM'];
      if (!empIdRegex.test(id) && !bypassList.includes(id)) {
        notify("Employee ID must follow official CUI Vehari format: VHR-F-XXX (where XXX is a 3-digit sequence, e.g., VHR-F-001).", "error");
        return;
      }

      const executeFacultySave = async () => {
        let profileUUID = data?.dbID || null;
        if (isDatabaseConnected()) {
          try {
            if (data) {
              // Editing faculty
              const { error: profileErr } = await supabase
                .from('profiles')
                .update({ full_name: name, email: email, phone_number: formData.phone })
                .eq('id', data.dbID);
              if (profileErr) throw profileErr;

              const { error: facErr } = await supabase
                .from('faculty')
                .update({ employee_id: id, designation: designation })
                .eq('profile_id', data.dbID);
              if (facErr) throw facErr;

              notify("Faculty registry successfully updated in Database.");
            } else {
              // Onboarding new faculty
              const tempPassword = formData.password || '123';
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: tempPassword,
                options: {
                  data: {
                    full_name: name,
                    role: 'FACULTY'
                  }
                }
              });

              if (signUpError) {
                throw signUpError;
              } else if (signUpData?.user) {
                profileUUID = signUpData.user.id;
                const { error: profileErr } = await supabase
                  .from('profiles')
                  .upsert({ id: profileUUID, email: email, role: 'FACULTY', full_name: name, phone_number: formData.phone });
                if (profileErr) throw profileErr;

                const { error: facErr } = await supabase
                  .from('faculty')
                  .insert({ profile_id: profileUUID, employee_id: id, designation: designation });
                if (facErr) throw facErr;

                notify("New Faculty onboarded and registered in database.");
              }
            }
          } catch (e) {
            console.error("DB faculty sync failed:", e);
            notify("Database save failed. Faculty recorded locally.", "error");
          }
        }

        // Update local state
        setFaculty(prev => {
          if (data) {
            return prev.map(f => f.id === data.id ? { ...f, ...formData, id, dbID: profileUUID } : f);
          } else {
            return [...prev, { ...formData, id, dbID: profileUUID || `mock-${Date.now()}`, role: id.includes('FIN') ? 'Finance' : 'Faculty' }];
          }
        });
        setIsModalOpen(false);
      };

      executeFacultySave();
      return;
    }

    if (type === 'department') {
      const code = formData.departmentID?.trim().toUpperCase();
      const name = formData.departmentName?.trim();
      const hodName = formData.headOfDepartment;
      
      if (!code || !name) {
        notify("Please fill in both Department Name and Code.", "error");
        return;
      }
      
      // Find faculty profile for HOD
      const selectedFaculty = faculty.find(f => f.facultyName === hodName || f.id === hodName);
      const hodUUID = selectedFaculty?.dbID || null;
      const cleanHodName = selectedFaculty ? selectedFaculty.facultyName : (hodName || 'TBD');
      
      const executeDeptSave = async () => {
        const payload = {
          code: code,
          name: name,
          head_of_department_id: hodUUID
        };
        
        if (isDatabaseConnected()) {
          try {
            if (data) {
              const { error } = await supabase
                .from('departments')
                .update({ name: payload.name, head_of_department_id: payload.head_of_department_id })
                .eq('code', data.departmentID);
              if (error) throw error;
              notify("Department successfully updated in Database.");
            } else {
              const { error } = await supabase
                .from('departments')
                .insert([payload]);
              if (error) throw error;
              notify("New Department successfully registered in Database.");
            }
          } catch (e) {
            console.error("DB department save failed:", e);
            notify("Database sync failed. Recorded locally.", "error");
          }
        }
        
        setDepartments(prev => {
          if (data) {
            return prev.map(d => d.departmentID === data.departmentID ? { ...d, departmentID: code, departmentName: name, headOfDepartment: cleanHodName } : d);
          } else {
            return [...prev, { departmentID: code, departmentName: name, headOfDepartment: cleanHodName }];
          }
        });
        setIsModalOpen(false);
      };
      
      executeDeptSave();
      return;
    }

    if (type === 'course') {
      const code = formData.courseID?.trim().toUpperCase();
      const title = formData.courseName?.trim();
      const credits = parseInt(formData.credits) || 3;
      const offeredBatchesStr = (formData.offeredToBatches || []).join(',');
      const prerequisitesStr = (formData.prerequisites || []).join(',');

      if (!code || !title) {
        notify("Please fill in both Course Code and Course Title.", "error");
        return;
      }

      const executeCourseSave = async () => {
        if (isDatabaseConnected()) {
          try {
            const { data: deptData } = await supabase
              .from('departments')
              .select('uuid')
              .eq('code', 'CS')
              .maybeSingle();
            const deptUuid = deptData?.uuid || null;

            const payload = {
              course_code: code,
              title: title,
              credit_hours: credits,
              offered_batches: offeredBatchesStr,
              prerequisites: prerequisitesStr,
              department_uuid: deptUuid
            };

            if (data) {
              const { error } = await supabase
                .from('courses')
                .update({ 
                  title: payload.title, 
                  credit_hours: payload.credit_hours,
                  offered_batches: payload.offered_batches,
                  prerequisites: payload.prerequisites 
                })
                .eq('course_code', data.courseID);
              if (error) throw error;
              notify("Course successfully updated in Database.");
            } else {
              const { error } = await supabase
                .from('courses')
                .insert([payload]);
              if (error) throw error;
              notify("New Course successfully registered in Database.");
            }
          } catch (e) {
            console.error("DB course save failed:", e);
            notify("Database save failed. Course recorded locally.", "error");
          }
        }

        setCourses(prev => {
          if (data) {
            return prev.map(c => c.courseID === data.courseID ? { 
              ...c, 
              courseID: code, 
              courseName: title, 
              credits, 
              offeredToBatches: formData.offeredToBatches || [],
              prerequisites: formData.prerequisites || ['None']
            } : c);
          } else {
            return [...prev, { 
              courseID: code, 
              courseName: title, 
              credits, 
              assignedFacultyID: 'None', 
              offeredToBatches: formData.offeredToBatches || [],
              prerequisites: formData.prerequisites || ['None']
            }];
          }
        });
        setIsModalOpen(false);
      };

      executeCourseSave();
      return;
    }

    const setters = { finance: setFinance, courses: setCourses, exam: setExams, upload_exam_pdf: setExams };
    const setter = setters[type];

    if (setter) {
        if (data) {
            setter(prev => prev.map(x => {
                const idKey = x.id ? 'id' : x.recordID ? 'recordID' : x.courseID ? 'courseID' : x.departmentID ? 'departmentID' : 'id';
                return (String(x[idKey]) === String(data[idKey])) ? { ...x, ...formData } : x;
            }));
        } else {
            const newRecord = { ...formData };
            if (!newRecord.id && !newRecord.recordID && !newRecord.courseID && !newRecord.departmentID) {
                newRecord.id = Date.now();
            }
            setter(prev => [...prev, newRecord]);
        }
        notify("Operation completed successfully.");
    }
    setIsModalOpen(false);

  };

  const executeDelete = async () => {
    const { setter, id, typeName, idKey } = deleteConfirm;
    
    if (isDatabaseConnected()) {
      try {
        if (typeName === 'Department') {
          const { error } = await supabase
            .from('departments')
            .delete()
            .eq('code', id);
          if (error) throw error;
        } else if (typeName === 'Faculty') {
          const record = faculty.find(f => String(f.id) === String(id));
          if (record && record.dbID) {
            const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', record.dbID);
            if (error) throw error;
          }
        } else if (typeName === 'Student') {
          const record = students.find(s => String(s.id) === String(id) || String(s.regNumber) === String(id));
          if (record && record.dbID) {
            const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', record.dbID);
            if (error) throw error;
          }
        }
      } catch (e) {
        console.error(`DB deletion failed for ${typeName}:`, e);
      }
    }
    
    setter(prev => prev.filter(item => String(item[idKey]) !== String(id)));
    notify(`${typeName} record deleted.`);
    setDeleteConfirm({ open: false });
  };

  // --- Auth Handlers ---
  const handleLogin = (role) => {
    const inputID = authData.id.trim().toUpperCase();
    const inputPass = authData.password.trim();
    
    console.log(`[Auth] Attempting ${role} login for ID: ${inputID}`);
    console.log(`[Auth] Current Registry Size: Students(${students.length}), Faculty(${faculty.length})`);

    let found = null;
    
    // 1. MASTER BYPASS for Institutional Demo Accounts (Hardcoded with strict roles)
    if (inputID.toUpperCase() === 'ADMIN' && inputPass === 'admin') {
        found = { name: 'Institutional Administrator', id: 'ADMIN', role: ROLES.ADMIN };
    } else if (inputID.toUpperCase() === 'ADM' && inputPass === 'admin') {
        found = { name: 'Master Demo Student (ADM)', id: 'ADM', role: ROLES.STUDENT, regNumber: 'FA24-ADM-001' };
    } else if (inputID === 'FIN1' && inputPass === 'admin') {
        found = { id: 'FIN1', name: 'Finance Hub (Adnan)', role: ROLES.FINANCE };
    } else if (inputID === 'VHR-F-001' && inputPass === '123') {
        found = { id: 'VHR-F-001', name: 'Dr. Inayat-ur-Rehman', role: ROLES.FACULTY };
    } else if (inputID === 'S001' && inputPass === '123') {
        const registryMatch = students.find(s => s.id === 'S001' || s.name === 'Amna Pervez');
        found = registryMatch ? { ...registryMatch, role: ROLES.STUDENT } : { id: 'S001', name: 'Amna Pervez', role: ROLES.STUDENT, regNumber: 'FA24-BCS-055' };
    } else if (inputID === 'S003' && inputPass === '123') {
        found = { id: 'S003', name: 'Ali Hassan', role: ROLES.STUDENT, regNumber: 'FA24-BCS-003' };
    }

    
    // 2. Dynamic Registry Lookup
    if (!found) {
        if (role === ROLES.STUDENT) {
          found = students.find(s => 
            (s.regNumber?.toUpperCase() === inputID || s.id?.toUpperCase() === inputID || s.dbID === inputID) && 
            String(s.password) === inputPass
          );
          if (found) found = { ...found, role: ROLES.STUDENT };
        } else if (role === ROLES.FACULTY) {
          found = faculty.find(f => 
            (f.email?.trim().toUpperCase() === inputID || f.id?.toUpperCase() === inputID || f.dbID === inputID) && 
            String(f.password) === inputPass && 
            f.role !== 'Finance' && !f.id?.includes('FIN')
          );
          if (found) found = { ...found, role: ROLES.FACULTY };
        } else if (role === ROLES.FINANCE) {
          found = faculty.find(f => 
            (f.email?.trim().toUpperCase() === inputID || f.id?.toUpperCase() === inputID || f.dbID === inputID) && 
            String(f.password) === inputPass && 
            (f.role === 'Finance' || f.id?.includes('FIN'))
          );
          if (found) found = { ...found, role: ROLES.FINANCE };
        } else if (role === ROLES.ADMIN) {
           if ((inputID === 'ADMIN' || inputID === 'ADM') && inputPass === 'admin') 
             found = { name: 'Institutional Admin', id: 'ADM', role: ROLES.ADMIN };
        }
    }


    if (found) { 
        console.log(`[Auth] Success: Session started for ${found.name || found.id}`);
        // Prioritize the role defined in the demodata/bypass logic over the login screen selector
        const finalRole = found.role || role; 
        const sessionUser = { ...found, role: finalRole };
        if (!sessionUser.name && sessionUser.facultyName) sessionUser.name = sessionUser.facultyName;
        if (!sessionUser.name) sessionUser.name = sessionUser.id;
        
        setUser(sessionUser); 
        saveSession(sessionUser);
        notify(`Authorized as ${finalRole}`); 
        switchTab('dashboard'); 
        setAppView('portal');
        setLoginError(null);
    }

    else {
        console.error(`[Auth] Failed: No match for ${inputID} in ${role} registry.`);
        setLoginError("Login credentials are incorrect");
        notify("Credentials Invalid. Try clicking 'Reset Institutional Cache' below.", "error");
    }
  };

  const handleProfileUpdate = async (updatedUser) => {
    setUser(updatedUser);
    saveSession(updatedUser);
    
    try {
      if (updatedUser.role === ROLES.FACULTY || updatedUser.role === ROLES.FINANCE) {
        setFaculty(prev => prev.map(f => 
          f.id === updatedUser.id ? { ...f, email: updatedUser.email, phone: updatedUser.phone } : f
        ));

        if (isDatabaseConnected() && updatedUser.dbID) {
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ 
              email: updatedUser.email, 
              phone_number: updatedUser.phone 
            })
            .eq('id', updatedUser.dbID);
          
          if (profileErr) throw profileErr;
        }
      } else if (updatedUser.role === ROLES.STUDENT) {
        setStudents(prev => prev.map(s => 
          s.id === updatedUser.id ? { ...s, phone: updatedUser.phone } : s
        ));

        if (isDatabaseConnected() && updatedUser.dbID) {
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ 
              phone_number: updatedUser.phone 
            })
            .eq('id', updatedUser.dbID);
          
          if (profileErr) throw profileErr;
        }
      } else if (updatedUser.role === ROLES.ADMIN) {
        if (isDatabaseConnected() && updatedUser.dbID) {
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ 
              email: updatedUser.email, 
              phone_number: updatedUser.phone 
            })
            .eq('id', updatedUser.dbID);
          
          if (profileErr) throw profileErr;
        }
      }
      
      notify('Profile Settings Updated Successfully!', 'success');
    } catch (err) {
      console.error("Profile update failed:", err);
      notify("Profile update synced locally, but failed to persist to database.", "warning");
    }
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('ums_activeSession');
      setAppView('landing');
  };

  const switchTab = (tab) => {
      setActiveTab(tab);
      saveTab(tab);
  };

  const handleRegister = async () => {
    const isFaculty = authData.program === 'Faculty Applicant';
    const role = isFaculty ? ROLES.FACULTY : ROLES.STUDENT;
    
    const newId = isFaculty 
      ? `F-${String(Math.floor(Math.random() * 900) + 100)}` 
      : (authData.regNumber || `FA26-BCS-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`);
      
    const newUser = { 
      id: newId, 
      ...authData, 
      regNumber: isFaculty ? undefined : newId,
      batch: isFaculty ? 'Staff' : (authData.batch || 'Fall 2026'), 
      password: authData.password || '123' 
    };
    
    if (isFaculty) {
        setFaculty(prev => [...prev, { ...newUser, facultyName: newUser.name, designation: 'Lecturer (Probation)' }]);
    } else {
        setStudents(p => [...p, newUser]);
        setFinance(prev => [...prev, {
          recordID: Date.now(),
          studentID: newId,
          amountPaid: 0,
          dueAmount: 120000,
          totalFee: 120000,
          semester: newUser.batch
        }]);
    }
    
    const sessionUser = { ...newUser, role };
    setUser(sessionUser);
    saveSession(sessionUser);
    
    // Auto-Generate Admit Card Payload
    setModalCtx({ 
      type: 'admit_card_generated', 
      data: { name: authData.name, id: newId, program: authData.program, testDate: 'Aug 10, 2026', campus: 'CUI Vehari' } 
    });
    setIsModalOpen(true);
    switchTab('dashboard');
    setAppView('portal');
    notify(`Sign Up Successful! Institutional ID: ${newId}`);
  };

  if (appView === 'landing') return (
    <div className="landing-page-root" style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
      <LandingPage onEnterPortal={() => user ? setAppView('portal') : setAppView('login')} theme={theme} toggleTheme={toggleTheme} />
      <Footer />
    </div>
  );
  if (appView === 'login') return (
    <div className="login-page-root" style={{display:'flex', flexDirection:'column', minHeight:'100vh', height: '100vh', overflowY: 'auto', overflowX: 'hidden'}}>
      <Login onLogin={handleLogin} loginError={loginError} setLoginError={setLoginError} setStep={(s) => { setLoginStep(s); setRegSubStep(1); setAuthData({id:'', name:'', password:'', program: '', email: ''}); setLoginError(null); }} loginStep={loginStep} authData={authData} setAuthData={setAuthData} handleRegister={handleRegister} regSubStep={regSubStep} setRegSubStep={setRegSubStep} theme={theme} toggleTheme={toggleTheme} onInitiateRecovery={handleInitiateRecovery} notify={notify} />
      <Footer />
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': {
        // Build role-specific stats with extreme safety
        const myEnrolments = (enrolments || []).filter(e => e.studentID === user.id);
        const myFinance = (finance || []).filter(f => 
          f.studentID === user.id || 
          f.studentID === user.dbID || 
          (user.regNumber && f.studentID === user.regNumber)
        );
        const myResults = (results || []).filter(r => r.studentID === user.id);
        const myGPA = myResults.length > 0
          ? (myResults.reduce((a, r) => a + (parseFloat(r.GPA) || 0), 0) / myResults.length).toFixed(2)
          : 'N/A';
        const myCourses = (courses || []).filter(c => !c.assignedFacultyID || c.assignedFacultyID === user.id);

        const roleStats = user.role === ROLES.ADMIN
          ? [
              { label: 'Total Students', value: students.length, action: 'VIEW_STUDENTS', trend: 'Full Registry' },
              { label: 'Total Faculty',  value: faculty.length,  action: 'VIEW_FACULTY',  trend: 'All Staff' },
              { label: 'Course Catalog', value: courses.length,  action: 'VIEW_CATALOG',  trend: 'Active Courses' },
              { label: 'Blocked Students', value: students.filter(s => {
                  const fin = finance.find(f => f.studentID === s.id || f.studentID === s.dbID || f.studentID === s.regNumber);
                  const sPayments = feePayments.filter(p => p.studentID === s.id || p.studentID === s.dbID || p.studentID === s.regNumber);
                  const received = sPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
                  const total = fin?.totalFee || fin?.dueAmount || 0;
                  const isCleared = total > 0 && (total - received <= 0);
                  const hasOverride = adminOverrides.some(o => o.studentID === s.id && o.registrationAllowed);
                  return total > 0 && !isCleared && !hasOverride;
              }).length, action: 'VIEW_BLOCKED', warning: true },
            ]

          : user.role === ROLES.STUDENT
          ? [
              { label: 'Enrolled Courses', value: myEnrolments.length, action: 'VIEW_REGISTRATION', trend: 'View Courses' },
              { label: 'CGPA',             value: myGPA,               action: 'VIEW_MY_RESULTS',   trend: 'Academic Score' },
              { label: 'Fee Balance',      value: (() => {
                  const fin = finance.find(f => f.studentID === user.id || f.studentID === user.dbID || f.studentID === user.regNumber);
                  if (!fin) return 'N/A';
                  const sPay = feePayments.filter(p => p.studentID === user.id || p.studentID === user.dbID || p.studentID === user.regNumber);
                  const paid = sPay.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
                  const total = fin.totalFee || fin.dueAmount || 0;
                  const bal = Math.max(0, total - paid);
                  return bal === 0 && total > 0 ? 'CLEARED' : `PKR ${bal.toLocaleString()}`;
              })(), action: 'VIEW_FINANCE', warning: (() => {
                  const fin = finance.find(f => f.studentID === user.id || f.studentID === user.dbID || f.studentID === user.regNumber);
                  const sPay = feePayments.filter(p => p.studentID === user.id || p.studentID === user.dbID || p.studentID === user.regNumber);
                  const paid = sPay.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
                  return ((fin?.totalFee || fin?.dueAmount || 0) - paid) > 0;
              })() },
            ]
          : user.role === ROLES.FACULTY
          ? [
              { label: 'My Courses',     value: myCourses.length,  action: 'VIEW_CLASSES', trend: 'Teaching' },
              { label: 'Total Students', value: students.length,   action: 'VIEW_CLASSES', trend: 'In Classes' },
              { label: 'Grades Entered', value: results.filter(r => myCourses.some(c => c.courseID === r.courseID)).length, action: 'VIEW_GRADING', trend: 'Records' },
            ]
          : [
              { label: 'Total Records', value: finance.length, action: 'VIEW_FINANCE', trend: 'All Payments' },
              { label: 'Pending Dues',  value: finance.filter(f => (f.dueAmount || 0) > 0).length, action: 'VIEW_FINANCE', warning: finance.some(f => (f.dueAmount || 0) > 0) },
            ];

        return <Dashboard
          stats={roleStats}
          user={user}
          notices={notices}
          feeStructures={feeStructures}
          students={students}
          onAction={(type, data) => {
            if (type === 'VIEW_STUDENTS')    setActiveTab('students');
            if (type === 'VIEW_FACULTY')     setActiveTab('faculty');
            if (type === 'VIEW_CATALOG')     setActiveTab('catalog');
            if (type === 'VIEW_FINANCE')     setActiveTab(user.role === ROLES.STUDENT ? 'my-finance' : 'finance');
            if (type === 'VIEW_BLOCKED')     setActiveTab('blocked-audit');
            if (type === 'VIEW_CALENDAR')    setActiveTab('calendar');

            if (type === 'VIEW_REGISTRATION')setActiveTab('registration');
            if (type === 'VIEW_MY_RESULTS')  setActiveTab('academic-progress');
            if (type === 'VIEW_GRADING')     setActiveTab('grading');
            if (type === 'VIEW_CLASSES')     setActiveTab('classes');
            if (type === 'VIEW_PROFILE')     setActiveTab('profile');
            if (type === 'VIEW_NOTICES')     setActiveTab('notices');
            if (type === 'VIEW_EXAMS')       setActiveTab('exams');
            if (type === 'VIEW_NOTICE') { setModalCtx({ type: 'notice_detail', data }); setIsModalOpen(true); }
            if (type === 'VIEW_REPORTS') {
              if (user.role === ROLES.ADMIN) {
                generateInstitutionalReport('Academic Integrity Report',
                  ['ID', 'Name', 'Program', 'Email'],
                  students.map(s => ({ ID: s.id, Name: s.name, Program: s.program, Email: s.email || '' }))
                );
              }
            }
            if (type === 'RESET_SYSTEM' && user.role === ROLES.ADMIN) {
              if (confirm('CRITICAL ACTION: Reset all institutional data to factory defaults?')) {
                localStorage.clear();
                window.location.reload();
              }
            }
          }}
        />;
      }


      
      case 'students': return <StudentManagement students={students} finance={finance} openForm={openForm} handleDelete={(s,i,t) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:'id'})} setStudents={setStudents} />;
      
      case 'notices': 
        const isStudent = user.role === ROLES.STUDENT;
        const isFaculty = user.role === ROLES.FACULTY;
        const isFinance = user.role === ROLES.FINANCE;
        
        if (user.role === ROLES.ADMIN) return <NoticeManagement notices={notices} setNotices={setNotices} openForm={openForm} loading={loading} />;

        const filteredNotices = notices.filter(n => {
          if (!n.is_published && user.role !== ROLES.ADMIN) return false;
          if (n.expires_at && new Date(n.expires_at) < new Date()) return false;
          
          const targets = n.visible_to || ['all'];
          if (targets.includes('all')) return true;
          if (isStudent && targets.includes('student')) return true;
          if (isFaculty && targets.includes('faculty')) return true;
          if (isFinance && targets.includes('finance')) return true;
          
          return false;
        });

        return (
          <div className="view-container">
            <div className="page-header">
              <h1>Announcements</h1>
              <p className="page-subtitle">Official updates for {user.role} personnel.</p>
            </div>
            <div className="notices-management-grid section-gap" style={{display:'grid', gap:'20px'}}>
               {filteredNotices.map(n => (
                 <div key={n.id} className="section-card fade-in" style={{padding:'24px'}}>
                    <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px'}}>
                      <span className="badge-category" style={{
                        padding: '3px 8px', fontSize: '11px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.06em',
                        background: 'rgba(26, 58, 107, 0.1)', color: 'var(--color-ink)'
                      }}>
                        {n.category || 'General'}
                      </span>
                      <span className="hint" style={{fontWeight:700, color: 'var(--color-ink)'}}>
                        {new Date(n.created_at || n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 style={{fontFamily: 'var(--font-heading)', fontSize: '20px', marginBottom: '12px'}}>{n.title}</h3>
                    <p style={{opacity:0.8}}>{n.content}</p>
                 </div>
               ))}
               {filteredNotices.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '48px 24px' }} className="section-card">
                   <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                   <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-ink)' }}>No active announcements</p>
                   <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)' }}>There are no official notifications for your portal at this time.</p>
                 </div>
               )}
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <div>
                <h1>{calendarConfig.headerText}</h1>
                <p>Official schedules for the current academic session.</p>
              </div>
              {user.role === ROLES.ADMIN && <button className="btn-primary-premium" onClick={() => openForm('calendar_update')}>Redefine Calendar</button>}
            </div>
            <div className="table-card-premium glass-card p-40" style={{marginTop:'0'}}>
              <table className="premium-table">
                <thead><tr><th>Academic Event / Milestone</th><th>Date Range / Deadline</th></tr></thead>
                <tbody>
                  {calendarConfig.events.map((e, idx) => (
                    <tr key={idx}><td>{e.event}</td><td className="font-monospace">{e.date}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{marginTop: '32px', fontSize: '13px', fontStyle: 'italic', opacity: 0.6, borderTop: '1px solid var(--surface-container)', paddingTop: '16px'}}>
                {calendarConfig.footerText}
              </div>
            </div>
          </div>
        );
      
      case 'profile': {
        const isStudent = user.role === ROLES.STUDENT;
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <div>
                <h1>Profile Settings</h1>
                <p>Manage your personal identification, login credentials, and contact preferences.</p>
              </div>
            </div>
            <div className="glass-card feature-card mt-24" style={{padding:'32px', maxWidth:'600px', margin:'24px auto'}}>
              <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                   <label style={{fontSize:'12px', opacity:0.6}}>Official Name</label>
                   <input className="input-premium" value={user.name || user.facultyName || ''} readOnly style={{opacity:0.6}} />
                </div>
                
                {isStudent ? (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                     <label style={{fontSize:'12px', opacity:0.6}}>Registration Number (Fixed)</label>
                     <input className="input-premium" value={user.regNumber || user.id || ''} readOnly style={{opacity:0.6}} />
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                     <label style={{fontSize:'12px', opacity:0.6}}>Institutional ID</label>
                     <input className="input-premium" value={user.id || ''} readOnly style={{opacity:0.6}} />
                  </div>
                )}

                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                   <label style={{fontSize:'12px', opacity:0.6}}>Personal Contact</label>
                   <input className="input-premium" placeholder="+92 3XX XXXXXXX" value={user.phone || ''} onChange={e => setUser({...user, phone: e.target.value})} />
                </div>

                {isStudent ? (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                     <label style={{fontSize:'12px', opacity:0.6}}>Personal Email</label>
                     <input className="input-premium" placeholder="e.g. student@gmail.com" value={user.personalEmail || ''} onChange={e => setUser({...user, personalEmail: e.target.value})} />
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                     <label style={{fontSize:'12px', opacity:0.6}}>Registered Login Email (Credentials)</label>
                     <input className="input-premium" placeholder="e.g. faculty@cui.edu" value={user.email || ''} onChange={e => setUser({...user, email: e.target.value})} />
                     <span style={{fontSize:'11px', color:'var(--color-accent)', opacity:0.8}}>Updating this email will change your official gateway login credentials.</span>
                  </div>
                )}

                <button 
                  className="btn-primary-premium mt-12" 
                  onClick={() => handleProfileUpdate(user)}
                >
                  Update Identification
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      
      case 'students': return <StudentManagement students={students} finance={finance} feePayments={feePayments} openForm={openForm} handleDelete={(s,i,t) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:'id'})} setStudents={setStudents} />;
      
      case 'faculty': return <FacultyManagement faculty={faculty} openForm={openForm} handleDelete={(s,i,t) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:'id'})} setFaculty={setFaculty} />;
      case 'my-finance': return <FinanceManagement finance={finance} feePayments={feePayments} setFeePayments={setFeePayments} user={user} students={students} departments={departments} setFinance={setFinance} openForm={openForm} feeStructures={feeStructures} setFeeStructures={setFeeStructures} />;

      case 'overrides':
        return <AdminOverrideManagement students={students} adminOverrides={adminOverrides} setAdminOverrides={setAdminOverrides} notify={notify} />;
      
      case 'timetable':
        return <TimetableManagement uploads={timetableUploads} setUploads={setTimetableUploads} setEntries={setTimetableEntries} />;

      case 'registration': 
        return <CourseRegistration courses={courses} enrolments={enrolments} setEnrolments={setEnrolments} user={user} results={results} notify={notify} finance={finance} adminOverrides={adminOverrides} feePayments={feePayments} />;

      case 'blocked-audit':
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <h1>Financial Block Audit</h1>
              <p>Registry of students currently restricted from registration due to outstanding dues.</p>
            </div>
            <div className="card" style={{padding: '0', overflow: 'hidden'}}>
              <table className="premium-table">
                <thead><tr><th>Student Record</th><th>Login ID</th><th>Registry #</th><th>Outstanding</th><th>Override Status</th></tr></thead>
                <tbody>
                  {students.filter(s => {
                    const fin = finance.find(f => f.studentID === s.id || f.studentID === s.dbID || f.studentID === s.regNumber);
                    const sPayments = feePayments.filter(p => p.studentID === s.id || p.studentID === s.dbID || p.studentID === s.regNumber);
                    const received = sPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
                    const total = fin?.totalFee || fin?.dueAmount || 0;
                    const isCleared = total > 0 && (total - received <= 0);
                    const hasOverride = adminOverrides.some(o => o.studentID === s.id && o.registrationAllowed);
                    return total > 0 && !isCleared && !hasOverride;
                  }).map(s => {
                    const fin = finance.find(f => f.studentID === s.id || f.studentID === s.dbID || f.studentID === s.regNumber);
                    const sPayments = feePayments.filter(p => p.studentID === s.id || p.studentID === s.dbID || p.studentID === s.regNumber);
                    const received = sPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
                    const total = fin?.totalFee || fin?.dueAmount || 0;
                    const pending = Math.max(0, total - received);
                    return (
                      <tr key={s.id}>
                        <td><span style={{fontWeight:600, color:'var(--color-ink)'}}>{s.name}</span></td>
                        <td><span className="badge-premium" style={{background:'var(--color-border)', color:'var(--color-ink)', fontSize:'12px'}}>{s.id}</span></td>
                        <td className="font-monospace" style={{fontSize:'12px', opacity:0.8}}>{s.regNumber || 'FA24-ADM-TBD'}</td>
                        <td style={{color:'var(--color-danger)', fontWeight:700}}>PKR {pending.toLocaleString()}</td>
                        <td><span className="badge-premium" style={{opacity:0.5}}>No Active Override</span></td>
                      </tr>
                    );
                  })}
                  {students.filter(s => {
                    const fin = finance.find(f => f.studentID === s.id || f.studentID === s.dbID || f.studentID === s.regNumber);
                    const sPayments = feePayments.filter(p => p.studentID === s.id || p.studentID === s.dbID || p.studentID === s.regNumber);
                    const received = sPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
                    const total = fin?.totalFee || fin?.dueAmount || 0;
                    const isCleared = total > 0 && (total - received <= 0);
                    const hasOverride = adminOverrides.some(o => o.studentID === s.id && o.registrationAllowed);
                    return total > 0 && !isCleared && !hasOverride;
                  }).length === 0 && (
                    <tr><td colSpan="5" style={{textAlign:'center', opacity:0.5, padding:'40px'}}>No financial blocks detected in active registry.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        );

      case 'academic-progress':
        return <StudentAcademicView user={user} enrolments={enrolments} attendance={attendance} assessments={assessments} marks={marks} courses={courses} sessions={sessions} sessionAttendance={sessionAttendance} />;
      
      case 'my-results':
        return <StudentMarksView user={user} enrolments={enrolments} assessments={assessments} marks={marks} courses={courses} />;


      case 'results':
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <h1>Official Performance Records</h1>
              <p>Registry of confirmed academic results and GPA metrics.</p>
            </div>
            <div className="card" style={{padding: '0', overflow: 'hidden'}}>
              <table className="premium-table">
                <thead><tr><th>Result ID</th><th>Student Record</th><th>Course</th><th>Grade</th><th>GPA</th></tr></thead>
                <tbody>
                  {(results || []).map(r => {
                    const student = students.find(s => s.id === r.studentID || s.dbID === r.studentID);
                    return (
                      <tr key={r.resultID}>
                        <td className="font-monospace">#{r.resultID.substring(0,6)}</td>
                        <td>
                          <div style={{display:'flex', flexDirection:'column'}}>
                             <span style={{fontWeight:600}}>{student?.name || 'Academic Member'}</span>
                             <span style={{fontSize:'11px', opacity:0.6}}>{student?.regNumber || r.studentID}</span>
                          </div>
                        </td>
                        <td>{r.courseID}</td>
                        <td><span className="badge-premium badge-primary">{r.grade}</span></td>
                        <td><strong>{r.GPA}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      

      case 'classes':
        return <FacultyWorkspace user={user} students={students} courses={courses} results={results} setResults={setResults} attendance={attendance} setAttendance={setAttendance} sessions={sessions} setSessions={setSessions} sessionAttendance={sessionAttendance} setSessionAttendance={setSessionAttendance} assessments={assessments} setAssessments={setAssessments} marks={marks} setMarks={setMarks} enrolments={enrolments} notify={notify} initialTab="attendance" />;
      case 'grading':
        return <ExamManagement user={user} students={students} courses={courses} departments={departments} assessments={assessments} setAssessments={setAssessments} marks={marks} setMarks={setMarks} enrolments={enrolments} notify={notify} />;

      case 'notices_mgt':

        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <h1>Official Announcements</h1>
              <p>Institutional updates and notice management.</p>
            </div>
            <div className="glass-card">
               {notices.map(n => (
                 <div key={n.id} className="notice-item-premium" style={{borderBottom:'1px solid var(--glass-border)'}}>
                    <div className="notice-content-wrapper">
                      <h3>{n.title}</h3>
                      <p>{n.content}</p>
                    </div>
                 </div>
               ))}
               {notices.length === 0 && <p style={{padding:'40px', textAlign:'center', opacity:0.6}}>No active announcements for your role.</p>}
            </div>
          </div>
        );
      case 'my-timetable': {
        const studentRecord = students.find(s => s.id === user.id || s.dbID === user.id);
        const studentBatch = user.batch || studentRecord?.batch;
        const studentSection = user.section || studentRecord?.section || 'A';
        
        // Dynamic timetable match helper functions
        const getBatchCode = (batchStr) => {
          if (!batchStr) return "";
          const clean = batchStr.toLowerCase().trim();
          const year = clean.match(/\d+/)?.[0]?.slice(-2) || "";
          if (clean.includes("fall")) return `FA${year}`;
          if (clean.includes("spring")) return `SP${year}`;
          return batchStr;
        };

        const isStudentTimetableMatch = (ownerLabel, student) => {
          if (!ownerLabel || !student) return false;
          const label = ownerLabel.toUpperCase().replace(/\s+/g, '');
          const batchCode = getBatchCode(student.batch || '').toUpperCase();
          const section = (student.section || 'A').toUpperCase();
          const prog = (student.program || '').toUpperCase();
          const reg = (student.regNumber || '').toUpperCase();
          
          const hasBatch = label.includes(batchCode);
          const hasSection = label.endsWith(section) || label.includes(`-${section}`) || label.includes(section);
          
          let hasProgram = false;
          if (prog.includes("COMPUTER") || prog.includes("CS") || reg.includes("BCS")) {
            hasProgram = label.includes("BCS") || label.includes("CS");
          } else if (prog.includes("SOFTWARE") || prog.includes("SE") || reg.includes("BSE")) {
            hasProgram = label.includes("BSE") || label.includes("SE");
          } else if (prog.includes("BUSINESS") || prog.includes("BBA") || reg.includes("BBA")) {
            hasProgram = label.includes("BBA");
          } else {
            hasProgram = true; 
          }
          return hasBatch && hasSection && hasProgram;
        };

        // Extract all distinct student classes uploaded
        const availableClasses = [...new Set(
          timetableEntries
            .filter(e => e.timetable_type === 'student')
            .map(e => e.owner_label)
        )].sort();

        // Determine default class for student
        let defaultClass = selectedTimetableClass;
        if (!defaultClass) {
          const matched = availableClasses.find(c => isStudentTimetableMatch(c, studentRecord || { batch: studentBatch, section: studentSection }));
          defaultClass = matched || availableClasses[0] || '';
        }

        const myStudentEntries = timetableEntries.filter(e => e.timetable_type === 'student' && e.owner_label === defaultClass);

        if (timetableUploads.length === 0) return <div className="p-40 text-center"><h2 style={{opacity:0.5}}>Timetable not yet published by admin</h2></div>;

        return (
          <div className="fade-in">
            {availableClasses.length > 0 && (
              <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, opacity: 0.8 }}>Class Stream Selector</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.6 }}>
                    Select any published department schedule to view slot layouts.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.7 }}>Active View:</span>
                  <select 
                    value={defaultClass} 
                    onChange={(e) => setSelectedTimetableClass(e.target.value)}
                    className="form-input-premium"
                    style={{ minWidth: '200px', padding: '8px 12px', margin: 0 }}
                  >
                    {availableClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <TimetableGrid 
              entries={myStudentEntries} 
              title={`My Timetable (${defaultClass || studentBatch || 'General'})`} 
            />
          </div>
        );
      }

      case 'enrolments': 
        return <EnrollmentManagement enrolments={enrolments} setEnrolments={setEnrolments} students={students} courses={courses} notify={notify} />;

      case 'finance': return <FinanceManagement finance={finance} feePayments={feePayments} setFeePayments={setFeePayments} user={user} students={students} departments={departments} setFinance={setFinance} openForm={openForm} feeStructures={feeStructures} setFeeStructures={setFeeStructures} />;
      
      case 'faculty-timetable':
        const teacherName = user.facultyName || user.name;
        const myTeacherEntries = teacherName ? timetableEntries.filter(e => e.owner_label === teacherName || e.owner_label.includes(teacherName)) : [];
        if (timetableUploads.length === 0) return <div className="p-40 text-center"><h2 style={{opacity:0.5}}>Timetable not yet published by admin</h2></div>;
        return <TimetableGrid entries={myTeacherEntries} title={`Faculty Timetable — ${user.facultyName}`} />;
      
      case 'overrides': return <AdminOverrideManagement adminOverrides={adminOverrides} setAdminOverrides={setAdminOverrides} students={students} notify={notify} />;

      case 'calendar':
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <div>
                <h1>{calendarConfig.headerText}</h1>
                <p>Official schedules for the current academic session.</p>
              </div>
              {user.role === ROLES.ADMIN && <button className="btn-primary-premium" onClick={() => openForm('calendar_update')}>Redefine Calendar</button>}
            </div>
            <div className="table-card-premium glass-card p-40" style={{marginTop:'0'}}>
              <table className="premium-table">
                <thead><tr><th>Academic Event / Milestone</th><th>Date Range / Deadline</th></tr></thead>
                <tbody>
                  {calendarConfig.events.map((e, idx) => (
                    <tr key={idx}><td>{e.event}</td><td className="font-monospace">{e.date}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{marginTop: '32px', fontSize: '13px', fontStyle: 'italic', opacity: 0.6, borderTop: '1px solid var(--surface-container)', paddingTop: '16px'}}>
                {calendarConfig.footerText}
              </div>
            </div>
          </div>
        );

      case 'classes': return <FacultyWorkspace user={user} students={students} courses={courses} enrolments={enrolments} results={results} setResults={setResults} attendance={attendance} setAttendance={setAttendance} sessions={sessions} setSessions={setSessions} sessionAttendance={sessionAttendance} setSessionAttendance={setSessionAttendance} assessments={assessments} setAssessments={setAssessments} marks={marks} setMarks={setMarks} notify={notify} initialTab="attendance" />;
      case 'grading': return <ExamManagement 
        user={user} 
        students={students} 
        courses={courses} 
        departments={departments} 
        assessments={assessments} 
        setAssessments={setAssessments} 
        marks={marks} 
        setMarks={setMarks} 
        enrolments={enrolments} 
        notify={notify}
        exams={exams}
        setExams={setExams}
        faculty={faculty}
        openForm={openForm}
        handleDelete={(s,i,t,k) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:k})}
      />;

      case 'importer':
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <h1>Bulk Record Importer</h1>
              <p>Import thousands of user records instantly via Batch Processing.</p>
            </div>
            <div className="glass-card p-40">
              <h3 style={{marginBottom:'16px'}}>Instructions</h3>
              <p style={{fontSize:'14px', marginBottom:'24px', opacity:0.8}}>Paste CSV data: <strong>ID,Name,Email,Program,Batch</strong>. One student per line.</p>
              <textarea className="input-premium" style={{height:'200px', width:'100%', marginBottom:'20px'}} onChange={(e) => setFormData({raw: e.target.value})} placeholder="FA24-BCS-001,John Doe,john@cui.edu,BSCS,Fall 2024..." />
              <button className="btn-primary-premium" onClick={() => handleCSVImport(formData.raw)}>Execute Batch Import</button>
            </div>
          </div>
        );

      case 'exams':
        return <ExamManagement 
          mode="schedule"
          exams={exams} 
          setExams={setExams} 
          courses={courses} 
          faculty={faculty} 
          user={user} 
          openForm={openForm} 
          notify={notify} 
          handleDelete={(s,i,t,k) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:k})}
          students={students}
          enrolments={enrolments}
          assessments={assessments}
          setAssessments={setAssessments}
          marks={marks}
          setMarks={setMarks}
          departments={departments}
        />;


      case 'departments': return <DepartmentManagement departments={departments} setDepartments={setDepartments} faculty={faculty} openForm={openForm} handleDelete={(s,i,t,k) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:k})} />;
      case 'catalog': return <CourseManagement courses={courses} setCourses={setCourses} faculty={faculty} enrolments={enrolments} user={user} openForm={openForm} handleDelete={(s,i,t,k) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:k})} />;
      case 'enrolments': return <EnrollmentManagement enrolments={enrolments} setEnrolments={setEnrolments} students={students} courses={courses} notify={notify} />;
      case 'password-resets': return (
        <PasswordResetsManagement 
          students={students} 
          setStudents={setStudents}
          faculty={faculty}
          setFaculty={setFaculty}
          passwordResetRequests={passwordResetRequests}
          setPasswordResetRequests={setPasswordResetRequests}
          notify={notify}
        />
      );
      default: return <div className="placeholder-view glass-card p-40"><h2>{activeTab} Module</h2><p>CUI Services initializing...</p></div>;
    }
  };

  const renderModalBody = () => {
    const { type, data } = modalCtx;
    // Standardized Institutional Modal Dispatcher
    switch (type) {
      case 'student':
        return (
          <div className="form-grid-premium" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div>
              <label>Full Name</label>
              <input className="input-premium" placeholder="e.g. John Doe" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label>Portal Username / Login ID</label>
              <input className="input-premium" placeholder="e.g. S001" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} />
            </div>
            <div>
              <label>Registration Number</label>
              <input className="input-premium" placeholder="FA24-BCS-055" value={formData.regNumber || ''} onChange={e => setFormData({...formData, regNumber: e.target.value})} />
            </div>
            <div>
              <label>Institutional Email</label>
              <input className="input-premium" placeholder="john@cui.edu.pk" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label>Contact Phone</label>
              <input className="input-premium" placeholder="+92 3XX XXXXXXX" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label>Personal Email</label>
              <input className="input-premium" placeholder="john.doe@gmail.com" value={formData.personalEmail || ''} onChange={e => setFormData({...formData, personalEmail: e.target.value})} />
            </div>
            <div>
              <label>Degree Program</label>
              <select className="input-premium" value={formData.program || ''} onChange={e => setFormData({...formData, program: e.target.value})}>
                <option value="">Select Program</option>
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Software Engineering">BS Software Engineering</option>
                <option value="BS Business Admin">BS Business Admin</option>
              </select>
            </div>
            <div>
              <label>Section</label>
              <select className="input-premium" value={formData.section || ''} onChange={e => setFormData({...formData, section: e.target.value})}>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
            <div>
              <label>Batch / Intake</label>
              <input className="input-premium" placeholder="Fall 2024" value={formData.batch || ''} onChange={e => setFormData({...formData, batch: e.target.value})} />
            </div>
            <div>
              <label>Portal Password</label>
              <input className="input-premium" type="password" placeholder="Default: 123" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>
        );
      case 'department':
        return (
          <div className="form-grid-premium" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div>
              <label>Department Name</label>
              <input className="input-premium" placeholder="e.g. Humanities" value={formData.departmentName || ''} onChange={e => setFormData({...formData, departmentName: e.target.value})} />
            </div>
            <div>
              <label>Department Code</label>
              <input className="input-premium" placeholder="e.g. HUM" value={formData.departmentID || ''} onChange={e => setFormData({...formData, departmentID: e.target.value})} />
            </div>
            <div style={{gridColumn: 'span 2'}}>
              <label>Head of Department (HOD)</label>
              <input 
                list="department-faculty-list" 
                className="input-premium" 
                placeholder="Start typing teacher name to assign HOD..." 
                value={formData.headOfDepartment || ''} 
                onChange={e => setFormData({...formData, headOfDepartment: e.target.value})} 
              />
              <datalist id="department-faculty-list">
                {faculty.filter(f => f.role !== 'Finance').map(f => (<option key={f.id} value={f.facultyName || f.name}>{f.designation}</option>))}
              </datalist>
            </div>
          </div>
        );
      case 'assign_hod':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div style={{background:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'8px', border:'1px solid var(--glass-border)'}}>
               <span style={{fontSize:'12px', opacity:0.6}}>Target Department:</span>
               <div style={{fontSize:'16px', fontWeight:600, color:'var(--accent)'}}>{modalCtx.data?.departmentName}</div>
            </div>
            <label>Search & Select Head of Department (HOD)</label>
            <input 
              list="faculty-list" 
              className="input-premium" 
              placeholder="Start typing teacher name..." 
              value={formData.headOfDepartment || ''} 
              onChange={e => setFormData({...formData, headOfDepartment: e.target.value})} 
            />
            <datalist id="faculty-list">
              {faculty.filter(f => f.role !== 'Finance').map(f => (<option key={f.id} value={f.facultyName || f.name}>{f.designation}</option>))}
            </datalist>
          </div>
        );
      case 'assign_faculty':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div style={{background:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'8px', border:'1px solid var(--glass-border)'}}>
               <span style={{fontSize:'12px', opacity:0.6}}>Assigning Instructor to Course:</span>
               <div style={{fontSize:'16px', fontWeight:600, color:'var(--accent)'}}>{modalCtx.data?.courseName} ({modalCtx.data?.courseID})</div>
            </div>
            <label>Search & Select Instructor</label>
            <input 
                list="instructor-list"
                className="input-premium" 
                placeholder="Type to search teachers..."
                value={formData.facultyId || ''} 
                onChange={e => setFormData({...formData, facultyId: e.target.value})} 
            />
            <datalist id="instructor-list">
                {faculty.filter(f => f.role !== 'Finance').map(f => (
                  <option key={f.id} value={f.id}>{f.facultyName} ({f.designation})</option>
                ))}
            </datalist>
            <p style={{fontSize:'11px', opacity:0.5}}>Selected ID will be officially mapped to this course ID in the Academic Registry.</p>
          </div>
        );
      case 'faculty':
        return (
          <div className="form-grid-premium" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
            <div>
              <label>Full Name</label>
              <input className="input-premium" placeholder="Dr. Nasir" value={formData.facultyName || ''} onChange={e => setFormData({...formData, facultyName: e.target.value})} />
            </div>
            <div>
              <label>Employee ID</label>
              <input className="input-premium" placeholder="VHR-F-XXX" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} />
            </div>
            <div>
              <label>Designation (CUI Rank)</label>
              <select className="input-premium" value={formData.designation || ''} onChange={e => setFormData({...formData, designation: e.target.value})}>
                <option value="">Select Rank</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Research Assistant">Research Assistant</option>
              </select>
            </div>
            <div>
              <label>Institutional Email</label>
              <input className="input-premium" placeholder="nasir@cui.edu.pk" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label>Personal Phone</label>
              <input className="input-premium" placeholder="+92 3XX XXXXXXX" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label>Portal Password</label>
              <input className="input-premium" type="password" placeholder="Default: 123" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>
        );
      case 'course':
        return (
          <div className="form-grid-premium" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', textAlign:'left'}}>
            <div>
              <label>Course Name</label>
              <input className="input-premium" placeholder="e.g. Data Structures" value={formData.courseName || ''} onChange={e => setFormData({...formData, courseName: e.target.value})} />
            </div>
            <div>
              <label>Course ID / Code</label>
              <input className="input-premium" placeholder="e.g. CSC211" value={formData.courseID || ''} onChange={e => setFormData({...formData, courseID: e.target.value})} />
            </div>
            <div style={{gridColumn: 'span 2'}}>
              <label>Credit Hours</label>
              <input className="input-premium" type="number" placeholder="3" value={formData.credits || ''} onChange={e => setFormData({...formData, credits: e.target.value})} />
            </div>
            <div style={{gridColumn: 'span 2'}}>
              <label style={{fontWeight:600, display:'block', marginBottom:'8px'}}>Course Prerequisites</label>
              <div style={{maxHeight:'110px', overflowY:'auto', background:'var(--color-bg-dim)', padding:'10px', borderRadius:'8px', border:'1px solid var(--color-border)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                {courses.filter(c => c.courseID !== formData.courseID).map(c => {
                  const isChecked = (formData.prerequisites || []).includes(c.courseID);
                  return (
                    <label key={c.courseID} style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', cursor:'pointer', margin:0}}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        style={{width:'auto', height:'auto', margin:0, padding:0}}
                        onChange={(e) => {
                          let list = formData.prerequisites || [];
                          if (e.target.checked) {
                            list = [...list.filter(x => x !== 'None' && x !== 'none'), c.courseID];
                          } else {
                            list = list.filter(x => x !== c.courseID);
                          }
                          if (list.length === 0) list = ['None'];
                          setFormData({...formData, prerequisites: list});
                        }}
                      />
                      <span>{c.courseName} ({c.courseID})</span>
                    </label>
                  );
                })}
                {courses.filter(c => c.courseID !== formData.courseID).length === 0 && (
                  <span style={{opacity:0.5, fontSize:'12px'}}>No other courses in catalog.</span>
                )}
              </div>
            </div>
            <div style={{gridColumn: 'span 2', marginTop: '10px'}}>
              <label style={{fontWeight:600, display:'block', marginBottom:'8px'}}>Offered to Batches</label>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                {['Fall 2024', 'Spring 2025', 'Spring 2026'].map(batch => {
                  const isOffered = (formData.offeredToBatches || []).includes(batch);
                  return (
                    <button
                      key={batch}
                      type="button"
                      className={isOffered ? 'btn-primary' : 'btn-outline'}
                      style={{
                        padding: '6px 16px', fontSize: '12px', borderRadius: '20px', margin: 0,
                        background: isOffered ? 'var(--color-ink)' : 'transparent',
                        color: isOffered ? 'white' : 'var(--color-ink)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        let list = formData.offeredToBatches || [];
                        if (list.includes(batch)) {
                          list = list.filter(b => b !== batch);
                        } else {
                          list = [...list, batch];
                        }
                        setFormData({...formData, offeredToBatches: list});
                      }}
                    >
                      {batch}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'payment':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <label>Amount Description</label>
              <input className="input-premium" placeholder="e.g. Semester Fee Fall 2024" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div>
              <label>Amount (PKR)</label>
              <input className="input-premium" type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
          </div>
        );
      case 'notice_create':
        const portals = ['all', 'student', 'faculty', 'admin', 'finance'];
        const currentTargets = formData.visible_to || ['all'];
        
        const togglePortal = (portal) => {
          let next;
          if (portal === 'all') {
            next = ['all'];
          } else {
            next = currentTargets.filter(t => t !== 'all');
            if (next.includes(portal)) {
              next = next.filter(t => t !== portal);
            } else {
              next.push(portal);
            }
            if (next.length === 0) next = ['all'];
          }
          setFormData({ ...formData, visible_to: next });
        };

        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px', textAlign: 'left'}}>
            <div>
              <label>Notice Title</label>
              <input 
                className="input-premium" 
                placeholder="e.g. Orientation Week, Fee Submission Deadline" 
                value={formData.title || ''} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
              {formData._errors?.title && <small style={{color: 'var(--color-danger)'}}>{formData._errors.title}</small>}
            </div>
            
            <div>
              <label>Announcement Body</label>
              <textarea 
                className="input-premium" 
                style={{height:'120px', minHeight: '120px'}} 
                placeholder="Write the full announcement here..." 
                value={formData.content || ''} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
              />
              {formData._errors?.content && <small style={{color: 'var(--color-danger)'}}>{formData._errors.content}</small>}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div>
                <label>Category</label>
                <select 
                  className="input-premium" 
                  value={formData.category || 'General'} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {['General', 'Academic', 'Finance', 'Exam', 'Holiday', 'Emergency', 'Event'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Status</label>
                <div style={{display: 'flex', gap: '8px'}}>
                  {['Published', 'Draft'].map(s => (
                    <button 
                      key={s}
                      className={((s === 'Published' && formData.is_published !== false) || (s === 'Draft' && formData.is_published === false)) ? 'btn-primary' : 'btn-outline'}
                      style={{flex: 1, fontSize: '10px', padding: '8px 4px'}}
                      onClick={() => setFormData({...formData, is_published: s === 'Published'})}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label>Visible on Portals</label>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                {portals.map(p => (
                  <button 
                    key={p}
                    className={currentTargets.includes(p) ? 'btn-primary' : 'btn-outline'}
                    style={{
                      padding: '6px 12px', fontSize: '10px', borderRadius: '20px',
                      background: currentTargets.includes(p) ? 'var(--color-ink)' : 'transparent',
                      color: currentTargets.includes(p) ? 'white' : 'var(--color-ink)',
                      border: '1px solid var(--color-border)'
                    }}
                    onClick={() => togglePortal(p)}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              {formData._errors?.visible_to && <small style={{color: 'var(--color-danger)'}}>{formData._errors.visible_to}</small>}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div>
                <label>Publication Date</label>
                <input 
                  type="date" 
                  className="input-premium" 
                  value={formData.created_at ? new Date(formData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                  onChange={e => setFormData({...formData, created_at: e.target.value})}
                />
                {modalCtx.data && <small className="hint">Original: {new Date(modalCtx.data.created_at).toLocaleDateString()}</small>}
              </div>
              <div>
                <label>Expires On (optional)</label>
                <input 
                  type="date" 
                  className="input-premium" 
                  value={formData.expires_at ? new Date(formData.expires_at).toISOString().split('T')[0] : ''} 
                  onChange={e => setFormData({...formData, expires_at: e.target.value})}
                />
                <small className="hint">Leave blank for permanent</small>
                {formData._errors?.expires_at && <div style={{color: 'var(--color-danger)', fontSize: '10px'}}>{formData._errors.expires_at}</div>}
              </div>
            </div>
            
            {formData._supabaseError && (
              <div style={{padding: '10px', background: 'rgba(168, 50, 42, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius)', fontSize: '12px'}}>
                {formData._supabaseError}
              </div>
            )}
          </div>
        );
      case 'course_roster':
        return (
          <div style={{textAlign:'left', display:'flex', flexDirection:'column', height:'100%'}}>
             <h3 style={{color:'var(--color-ink)', margin:0, marginBottom:'16px', fontWeight:800}}>{data?.courseID}: {data?.courseName}</h3>
             <div className="table-wrapper" style={{maxHeight:'300px', overflowY:'auto'}}>
                {enrolments.filter(e => e.courseID === data?.courseID).length > 0 ? (
                  enrolments.filter(e => e.courseID === data?.courseID).map(e => {
                    const student = students.find(s => s.dbID === e.studentID || s.id === e.studentID);
                    return (<div key={e.registrationID} style={{padding:'12px', marginBottom:'8px', background:'var(--color-bg-dim)', border:'1px solid var(--color-border)', borderRadius:'var(--radius)', fontSize:'13px', fontWeight:600, color:'var(--color-ink)'}}>{student?.name || 'Unknown'} — {student?.regNumber || e.studentID}</div>);
                  })
                ) : (<p style={{opacity:0.4, textAlign:'center', padding:'20px'}}>No candidates registered.</p>)}
             </div>
          </div>
        );
      case 'admit_card_generated':
        return (
          <div style={{padding:'20px', textAlign:'center'}}>
            <div className="fade-in">
              <span className="badge-premium badge-primary" style={{fontSize:'12px', letterSpacing:'2px'}}>OFFICIAL ADMIT CARD</span>
              <h2 style={{marginTop:'24px', fontSize:'32px', color:'var(--color-ink)'}}>{data.name}</h2>
              <p className="font-monospace" style={{opacity:0.6, fontSize:'16px', fontWeight:700}}>{data.regNumber}</p>
              <div style={{marginTop:'32px', padding:'24px', background:'var(--color-bg-dim)', border:'2px dashed var(--color-border)', borderRadius:'var(--radius)'}}>
                  <p style={{margin:'8px 0', fontSize:'14px'}}><strong>Institutional ID:</strong> <span className="font-monospace">{data.id}</span></p>
                  <p style={{margin:'8px 0', fontSize:'14px'}}><strong>Assessment Date:</strong> <span className="font-monospace">{data.testDate}</span></p>
                  <p style={{margin:'8px 0', fontSize:'14px'}}><strong>Assigned Campus:</strong> {data.campus}</p>
              </div>
            </div>
          </div>
        );
      case 'exam':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <label>Target Course</label>
              <select className="input-premium" value={formData.courseID || ''} onChange={e => setFormData({...formData, courseID: e.target.value})}>
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseName} ({c.courseID})</option>)}
              </select>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
               <div>
                  <label>Exam Date</label>
                  <input type="date" className="input-premium" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div>
                  <label>Commencement Time</label>
                  <input type="time" className="input-premium" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
               </div>
            </div>
            <div>
              <label>Examination Venue</label>
              <input className="input-premium" placeholder="e.g. Hall A, Lab 3" value={formData.venue || ''} onChange={e => setFormData({...formData, venue: e.target.value})} />
            </div>
            <div>
              <label>Exam Category</label>
              <select className="input-premium" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Midterm">Midterm</option>
                <option value="Terminal">Terminal (Final)</option>
                <option value="Sessional">Sessional</option>
              </select>
            </div>
            <div>
              <label>Invigilator / Supervisor</label>
              <input className="input-premium" placeholder="Enter Faculty Name" value={formData.invigilator || ''} onChange={e => setFormData({...formData, invigilator: e.target.value})} />
            </div>
          </div>
        );
      case 'upload_exam_pdf':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div className="card" style={{padding:'32px', textAlign:'center', border:'2px dashed var(--color-border)', position: 'relative'}}>
               <div style={{fontSize:'40px', marginBottom:'16px'}}>📤</div>
               <p style={{fontSize:'14px', fontWeight:600}}>Official Date Sheet PDF Upload</p>
               
               <div style={{marginTop: '16px'}}>
                 {formData.fileURL ? (
                   <div className="fade-in" style={{background: 'rgba(201, 164, 53, 0.1)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-accent)', marginBottom: '16px'}}>
                     <span style={{fontSize: '12px', color: 'var(--color-accent)', fontWeight: 700}}>✓ FILE READY: {formData.fileName || 'exam_schedule.pdf'}</span>
                   </div>
                 ) : (
                   <div style={{marginBottom: '16px', opacity: 0.6, fontSize: '12px'}}>Select the official PDF document from your system.</div>
                 )}

                 <input 
                   type="file" 
                   accept="application/pdf" 
                   style={{display: 'none'}} 
                   id="exam-pdf-upload"
                   onChange={async (e) => {
                     const file = e.target.files[0];
                     if (!file) return;
                     
                     notify("Uploading official document...", "info");
                     try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `exam_schedule_${Date.now()}.${fileExt}`;
                        const filePath = `schedules/${fileName}`;
                        
                        if (isDatabaseConnected()) {
                           let finalUrl = '';
                           try {
                             const { data, error } = await supabase.storage
                               .from('institutional-documents')
                               .upload(filePath, file);

                             if (error) throw error;

                             const { data: { publicUrl } } = supabase.storage
                               .from('institutional-documents')
                               .getPublicUrl(filePath);

                             finalUrl = publicUrl;
                             notify("Institutional Schedule Uploaded Successfully");
                           } catch (storageErr) {
                             console.warn('Supabase storage bucket "institutional-documents" not found. Falling back to local URL:', storageErr);
                             finalUrl = URL.createObjectURL(file);
                             notify("Bucket Not Configured: Schedule loaded via Local Fallback", "info");
                           }

                           setFormData({ 
                             ...formData, 
                             fileURL: finalUrl, 
                             fileName: file.name,
                             type: 'pdf_schedule',
                             id: modalCtx.data?.id || 'pdf_schedule_master' 
                           });
                         } else {
                           // Mock for local/offline testing
                           setFormData({ 
                             ...formData, 
                             fileURL: URL.createObjectURL(file), 
                             fileName: file.name,
                             type: 'pdf_schedule',
                             id: 'pdf_schedule_master' 
                           });
                           notify("Local Cache: Schedule linked (Offline Mode)");
                         }
                     } catch (err) {
                        console.error(err);
                        notify("Upload failed: " + err.message, "error");
                     }
                   }}
                 />
                 <button className="btn-primary-premium" onClick={() => document.getElementById('exam-pdf-upload').click()}>
                   {formData.fileURL ? 'REPLACE DOCUMENT' : 'SELECT PDF FILE'}
                 </button>
               </div>

               <p style={{fontSize:'11px', opacity:0.5, marginTop:'16px'}}>The uploaded file will be immediately visible on all Student and Faculty portals.</p>
            </div>
          </div>
        );

      case 'notice_detail':
        return (
          <div style={{textAlign: 'left'}}>
            <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px'}}>
              <span style={{
                padding: '3px 8px', fontSize: '11px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'rgba(26, 58, 107, 0.1)', color: 'var(--color-ink)'
              }}>
                {data.category || 'General'}
              </span>
              <span className="hint">{new Date(data.created_at || data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-ink)', marginBottom: '12px', border: 'none', padding: 0}}>{data.title}</h2>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)'}}>
              <div style={{width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-ink)'}}>
                {data.created_by?.charAt(0) || 'U'}
              </div>
              <span style={{fontSize: '13px', fontWeight: 500, color: 'var(--color-ink-muted)'}}>Issued by {data.created_by || 'Institutional Authority'}</span>
            </div>
            <p style={{fontSize: '15px', lineHeight: '1.7', color: 'var(--color-ink)', whiteSpace: 'pre-wrap'}}>{data.content}</p>
          </div>
        );
      case 'calendar_update':
        return (<textarea className="input-premium" style={{height:'150px'}} placeholder="Event | Date Range..." onChange={e => setFormData({raw: e.target.value})} />);
      default:
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <input className="input-premium" placeholder="Primary ID" name="id" onChange={e => setFormData({...formData, id: e.target.value})} />
            <input className="input-premium" placeholder="Full Name / Title" name="name" onChange={e => setFormData({...formData, name: e.target.value})} />
            <input className="input-premium" placeholder="Metadata" name="meta" onChange={e => setFormData({...formData, program: e.target.value})} />
          </div>
        );
    }
  };


  return (
    <div className="app-layout" onKeyDown={(e) => e.key === 'Enter' && isModalOpen && handleSave()}>
      
      <div className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)} />

      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={(tab) => { 
          if (tab === 'toggle-sidebar-collapse') {
             setIsSidebarOpen(!isSidebarOpen);
             return;
          }
          switchTab(tab); 
          setIsSidebarOpen(false); 
        }} 
        onLogout={handleLogout} 
        onHomeClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <button className="hamburger-mobile-only" onClick={() => setIsSidebarOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      
      <main className="main-content">
        {renderContent()}
        <Footer />
      </main>

      {/* Dynamic Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay-premium" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
           <div className="card modal-card-premium fade-in" style={{minWidth:'450px'}}>
            <h2 style={{fontSize:'28px', borderBottom:'1px solid var(--color-border)', paddingBottom:'16px', marginBottom:'0'}}>
              {modalCtx.type === 'admit_card_generated' ? 'CANDIDATE ADMIT CARD' : (modalCtx.data ? 'REVISE' : 'INITIALIZE')} {modalCtx.type !== 'admit_card_generated' && modalCtx.type.replace('_',' ').toUpperCase()}
            </h2>
            <div className="mt-24">
                {renderModalBody()}
            </div>
                  
            <div className="modal-footer-premium" style={{display:'flex', gap:'12px', borderTop:'1px solid var(--color-border)', paddingTop:'24px', marginTop:'24px'}}>
               {modalCtx.type === 'admit_card_generated' ? (
                 <>
                   <button className="btn-primary-premium" style={{flex:1}} onClick={() => window.print()}>PRINT RECORD</button>
                   <button className="btn-text-only" style={{flex:1, color:'var(--color-ink)', fontWeight:700}} onClick={() => setIsModalOpen(false)}>CONTINUE TO PORTAL</button>
                 </>
               ) : modalCtx.type === 'notice_detail' ? (
                 <button className="btn-primary-premium" style={{width:'100%'}} onClick={() => setIsModalOpen(false)}>ACKNOWLEDGE BROADCAST</button>
               ) : (
                 <>
                   <button className="btn-text-only" style={{flex:1, fontWeight:700, color:'var(--color-ink)'}} onClick={() => setIsModalOpen(false)}>ABORT</button>
                   <button className="btn-primary-premium" style={{flex:1}} onClick={handleSave}>CONFIRM CHANGES</button>
                 </>
               )}
             </div>
           </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="modal-overlay-premium">
          <div className="card fade-in" style={{width: '400px', border: '2px solid var(--color-danger)'}}>
            <h2 style={{color:'var(--color-danger)', fontSize:'24px'}}>Expunge {deleteConfirm.typeName}?</h2>
            <p style={{fontSize:'14px', opacity:0.7, margin:'12px 0 24px 0'}}>This action is permanent and will remove the record from the institutional registry.</p>
            <div style={{display:'flex', gap:'12px'}}>
              <button className="btn-text-only" style={{flex:1, fontWeight:700}} onClick={() => setDeleteConfirm({open:false})}>CANCEL</button>
              <button className="btn-primary-premium" style={{background:'var(--color-danger)', border:'none', flex:1}} onClick={executeDelete}>CONFIRM DELETION</button>
            </div>
          </div>
        </div>
      )}
      {/* Institutional Notifications Overlay - Fixed Floating Toasts */}
      <div className="notif-layer">
        {notifs.map(n => (
          <div key={n.id} className={`notif-premium ${n.type}`}>
            {n.msg}
          </div>
        ))}
      </div>
    </div>
  );
}


export default App;
