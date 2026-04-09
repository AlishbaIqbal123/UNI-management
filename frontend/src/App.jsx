import React, { useState } from 'react';
import './index.css';
import { useUMSData } from './hooks/useUMSData';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import FacultyManagement from './components/FacultyManagement';
import DepartmentManagement from './components/DepartmentManagement';
import CourseManagement from './components/CourseManagement';
import FinanceManagement from './components/FinanceManagement';
import Login from './views/Login';
import LandingPage from './views/LandingPage';
import Footer from './components/Footer';
import AcademicResults from './components/AcademicResults';
import CourseRegistration from './components/CourseRegistration';
import FacultyWorkspace from './components/FacultyWorkspace';
import NoticeManagement from './components/NoticeManagement';
import StudentAcademicView from './components/StudentAcademicView';
import AdminOverrideManagement from './components/AdminOverrideManagement';
import EnrollmentManagement from './components/EnrollmentManagement';
import ExamManagement from './components/ExamManagement';
import { generateInstitutionalReport } from './lib/exportUtils';



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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCtx, setModalCtx] = useState({ type: '', data: null });
  const [formData, setFormData] = useState({});
  const [notifs, setNotifs] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, setter: null, id: null, typeName: '', idKey: 'id' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
    exams, setExams,
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

  // --- Global CRUD ---
  const handleSave = () => {
    if (modalCtx.type === 'csv_import') return handleCSVImport(formData.raw);
    if (modalCtx.type === 'calendar_update') return handleCalendarUpdate(formData.raw);

    if (modalCtx.type === 'assign_hod') {
        const { id, departmentID } = modalCtx.data;
        const targetID = id || departmentID;
        setDepartments(prev => prev.map(d => (d.id === targetID || d.departmentID === targetID) ? { ...d, headOfDepartment: formData.headOfDepartment } : d));
        notify(`Leadership assigned to ${formData.headOfDepartment}`);
        setIsModalOpen(false);
        return;
    }

    if (modalCtx.type === 'assign_faculty') {
        const { courseID } = modalCtx.data;
        setCourses(p => p.map(c => c.courseID === courseID ? { ...c, assignedFacultyID: formData.facultyId } : c));
        notify("Course faculty updated successfully.");
        setIsModalOpen(false);
        return;
    }

    const { type, data } = modalCtx;
    const setters = { student: setStudents, faculty: setFaculty, finance: setFinance, courses: setCourses, department: setDepartments, exam: setExams };
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
                newRecord.id = Date.now(); // Fallback ID for stability
            }
            setter(prev => [...prev, newRecord]);
        }
        notify("Operation completed successfully.");
    }
    setIsModalOpen(false);

  };

  const executeDelete = () => {
    const { setter, id, typeName, idKey } = deleteConfirm;
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
        found = { id: 'VHR-F-001', name: 'Dr. Muhammad Nasir', role: ROLES.FACULTY };
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
            (s.id?.toUpperCase() === inputID || s.dbID === inputID) && 
            String(s.password) === inputPass
          );
          if (found) found = { ...found, role: ROLES.STUDENT };
        } else if (role === ROLES.FACULTY) {
          found = faculty.find(f => 
            (f.id?.toUpperCase() === inputID || f.dbID === inputID) && 
            String(f.password) === inputPass && 
            f.role !== 'Finance' && !f.id?.includes('FIN')
          );
          if (found) found = { ...found, role: ROLES.FACULTY };
        } else if (role === ROLES.FINANCE) {
          found = faculty.find(f => 
            (f.id?.toUpperCase() === inputID || f.dbID === inputID) && 
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
    }

    else {
        console.error(`[Auth] Failed: No match for ${inputID} in ${role} registry.`);
        notify("Credentials Invalid. Try clicking 'Reset Institutional Cache' below.", "error");
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
    const isCS = authData.program?.includes('Computer') || authData.program?.includes('Software');
    const role = isFaculty ? ROLES.FACULTY : ROLES.STUDENT;
    
    const newId = isFaculty 
      ? `F-${String(Math.floor(Math.random() * 900) + 100)}` 
      : `FA26-${isCS ? 'BCS' : 'BBA'}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
      
    const newUser = { id: newId, ...authData, batch: isFaculty ? 'Staff' : 'Fall 2026', password: authData.password || '123' };
    
    if (isFaculty) {
        setFaculty(prev => [...prev, { ...newUser, facultyName: newUser.name, designation: 'Lecturer (Probation)' }]);
    } else {
        setStudents(p => [...p, newUser]);
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
    notify(`Admission Successfully Processed! Candidate ID: ${newId}`);
  };

  if (appView === 'landing') return (
    <div className="landing-page-root">
      <LandingPage onEnterPortal={() => user ? setAppView('portal') : setAppView('login')} />
      <Footer />
    </div>
  );
  if (appView === 'login') return (
    <div className="login-page-root" style={{display:'flex', flexDirection:'column', minHeight:'100vh'}}>
      <Login onLogin={handleLogin} setStep={(s) => { setLoginStep(s); setRegSubStep(1); setAuthData({id:'', name:'', password:'', program: '', email: ''}); }} loginStep={loginStep} authData={authData} setAuthData={setAuthData} handleRegister={handleRegister} regSubStep={regSubStep} setRegSubStep={setRegSubStep} />
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
                  const fin = finance.find(f => f.studentID === s.id || f.studentID === s.dbID);
                  const isCleared = fin && (fin.dueAmount === 0);
                  const hasOverride = adminOverrides.some(o => o.studentID === s.id && o.registrationAllowed);
                  return !isCleared && !hasOverride;
              }).length, action: 'VIEW_BLOCKED', warning: true },
            ]

          : user.role === ROLES.STUDENT
          ? [
              { label: 'Enrolled Courses', value: myEnrolments.length, action: 'VIEW_REGISTRATION', trend: 'View Courses' },
              { label: 'CGPA',             value: myGPA,               action: 'VIEW_MY_RESULTS',   trend: 'Academic Score' },
              { label: 'Fee Balance',      value: myFinance.length > 0 ? ((myFinance[0].dueAmount || 0) === 0 ? 'CLEARED' : `PKR ${(myFinance[0].dueAmount || 0).toLocaleString()}`) : 'N/A', action: 'VIEW_FINANCE', warning: (myFinance[0]?.dueAmount || 0) > 0 },
            ]
          : user.role === ROLES.FACULTY
          ? [
              { label: 'My Courses',     value: myCourses.length,  action: 'VIEW_CLASSES', trend: 'Teaching' },
              { label: 'Total Students', value: students.length,   action: 'VIEW_CLASSES', trend: 'In Classes' },
              { label: 'Grades Entered', value: results.filter(r => myCourses.some(c => c.courseID === r.courseID)).length, action: 'VIEW_GRADING', trend: 'Records' },
            ]
          : [
              { label: 'Total Records', value: finance.length,   trend: 'All Payments' },
              { label: 'Pending Dues',  value: finance.filter(f => (f.dueAmount || 0) > 0).length, warning: finance.some(f => (f.dueAmount || 0) > 0) },
            ];

        return <Dashboard
          stats={roleStats}
          user={user}
          notices={notices}
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
        if (user.role === ROLES.ADMIN) return <NoticeManagement notices={notices} setNotices={setNotices} openForm={openForm} />;
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <h1>Announcements</h1>
              <p>Official updates for {user.role} personnel.</p>
            </div>
            <div className="glass-card">
               {notices.map(n => (
                 <div key={n.id} className="notice-item-premium" style={{borderBottom:'1px solid var(--glass-border)', padding:'24px'}}>
                    <h3>{n.title}</h3>
                    <p style={{marginTop:'8px', opacity:0.8}}>{n.content}</p>
                    <div className="mt-12" style={{fontSize:'12px', opacity:0.5}}>{n.date}</div>
                 </div>
               ))}
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
      
      case 'profile': return (
        <div className="view-container fade-in">
          <div className="view-header-premium">
            <div>
              <h1>Profile Settings</h1>
              <p>Manage your personal identification and contact preferences.</p>
            </div>
          </div>
          <div className="glass-card feature-card mt-24" style={{padding:'32px', maxWidth:'600px', margin:'24px auto'}}>
            <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                 <label style={{fontSize:'12px', opacity:0.6}}>Official Name</label>
                 <input className="input-premium" value={user.name || user.facultyName} readOnly style={{opacity:0.6}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                 <label style={{fontSize:'12px', opacity:0.6}}>Institutional ID</label>
                 <input className="input-premium" value={user.id} readOnly style={{opacity:0.6}} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                 <label style={{fontSize:'12px', opacity:0.6}}>Personal Contact</label>
                 <input className="input-premium" placeholder="+92 3XX XXXXXXX" value={user.phone || ''} onChange={e => setUser({...user, phone: e.target.value})} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                 <label style={{fontSize:'12px', opacity:0.6}}>Personal Email</label>
                 <input className="input-premium" placeholder="e.g. user@gmail.com" value={user.personalEmail || ''} onChange={e => setUser({...user, personalEmail: e.target.value})} />
              </div>
              <button className="btn-primary-premium mt-12" onClick={() => { notify('Profile Security Update: Success'); saveSession(user); }}>Update Identification</button>
            </div>
          </div>
        </div>
      );
      
      
      case 'faculty': return <FacultyManagement faculty={faculty} openForm={openForm} handleDelete={(s,i,t) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:'id'})} setFaculty={setFaculty} />;
      
      case 'departments': return <DepartmentManagement departments={departments} />;
      
      case 'catalog': return <CourseManagement courses={courses} setCourses={setCourses} faculty={faculty} enrolments={enrolments} user={user} openForm={openForm} handleDelete={(s,i,t,k) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:k})} />;
      
      case 'finance': return <FinanceManagement finance={finance} user={user} students={students} setFinance={setFinance} openForm={openForm} />;
      case 'my-finance': return <FinanceManagement finance={finance} user={user} students={students} setFinance={setFinance} openForm={openForm} />;

      case 'overrides':
        return <AdminOverrideManagement students={students} adminOverrides={adminOverrides} setAdminOverrides={setAdminOverrides} notify={notify} />;

      case 'registration': 
        return <CourseRegistration courses={courses} enrolments={enrolments} setEnrolments={setEnrolments} user={user} results={results} notify={notify} finance={finance} adminOverrides={adminOverrides} />;

      case 'blocked-audit':
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <h1>Financial Block Audit</h1>
              <p>Registry of students currently restricted from registration due to outstanding dues.</p>
            </div>
            <div className="table-card-premium glass-card">
              <table className="premium-table">
                <thead><tr><th>Student Record</th><th>Login ID</th><th>Registry #</th><th>Outstanding</th><th>Override Status</th></tr></thead>
                <tbody>
                  {students.filter(s => {
                    const fin = finance.find(f => f.studentID === s.id || f.studentID === s.dbID);
                    const isCleared = fin && (fin.dueAmount === 0);
                    const hasOverride = adminOverrides.some(o => o.studentID === s.id && o.registrationAllowed);
                    return !isCleared && !hasOverride;
                  }).map(s => {
                    const fin = finance.find(f => f.studentID === s.id || f.studentID === s.dbID);
                    return (
                      <tr key={s.id}>
                        <td><span style={{fontWeight:600, color:'white'}}>{s.name}</span></td>
                        <td><span className="badge-premium" style={{background:'rgba(255,255,255,0.05)', color:'var(--accent)', fontSize:'12px'}}>{s.id}</span></td>
                        <td className="font-monospace" style={{fontSize:'12px', opacity:0.8}}>{s.regNumber || 'FA24-ADM-TBD'}</td>
                        <td style={{color:'#ef4444', fontWeight:700}}>PKR {(fin?.dueAmount || 45000).toLocaleString()}</td>
                        <td><span className="badge-premium" style={{opacity:0.5}}>No Active Override</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        );

      case 'academic-progress':
        return <StudentAcademicView user={user} enrolments={enrolments} attendance={attendance} assessments={assessments} marks={marks} courses={courses} />;


      case 'results':
        return (
          <div className="view-container fade-in">
            <div className="view-header-premium">
              <h1>Official Performance Records</h1>
              <p>Registry of confirmed academic results and GPA metrics.</p>
            </div>
            <div className="table-card-premium glass-card">
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
        return <FacultyWorkspace user={user} students={students} courses={courses} results={results} setResults={setResults} attendance={attendance} setAttendance={setAttendance} assessments={assessments} setAssessments={setAssessments} marks={marks} setMarks={setMarks} enrolments={enrolments} notify={notify} initialTab="classes" />;
      case 'grading':
        return <FacultyWorkspace user={user} students={students} courses={courses} results={results} setResults={setResults} attendance={attendance} setAttendance={setAttendance} assessments={assessments} setAssessments={setAssessments} marks={marks} setMarks={setMarks} enrolments={enrolments} notify={notify} initialTab="assessments" />;

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
      case 'enrolments': 
        return <EnrollmentManagement enrolments={enrolments} setEnrolments={setEnrolments} students={students} courses={courses} notify={notify} />;

      case 'finance': return <FinanceManagement finance={finance} user={user} students={students} setFinance={setFinance} openForm={openForm} />;
      
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

      case 'classes': return <FacultyWorkspace user={user} students={students} courses={courses} enrolments={enrolments} results={results} setResults={setResults} attendance={attendance} setAttendance={setAttendance} assessments={assessments} setAssessments={setAssessments} marks={marks} setMarks={setMarks} notify={notify} initialTab="classes" />;
      case 'grading': return <FacultyWorkspace user={user} students={students} courses={courses} enrolments={enrolments} results={results} setResults={setResults} attendance={attendance} setAttendance={setAttendance} assessments={assessments} setAssessments={setAssessments} marks={marks} setMarks={setMarks} notify={notify} initialTab="assessments" />;

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
        return <ExamManagement exams={exams} setExams={setExams} courses={courses} faculty={faculty} user={user} openForm={openForm} handleDelete={(s,i,t,k) => setDeleteConfirm({open:true, setter:s, id:i, typeName:t, idKey:k})} />;


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
              <label style={{fontSize:'12px', opacity:0.8}}>Full Name</label>
              <input className="input-premium" placeholder="System ID" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} style={{display:'none'}} />
              <input className="input-premium" placeholder="e.g. John Doe" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Registration Number</label>
              <input className="input-premium" placeholder="FA24-BCS-055" value={formData.regNumber || ''} onChange={e => setFormData({...formData, regNumber: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Contact Phone</label>
              <input className="input-premium" placeholder="+92 3XX XXXXXXX" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Personal Email</label>
              <input className="input-premium" placeholder="john.doe@gmail.com" value={formData.personalEmail || ''} onChange={e => setFormData({...formData, personalEmail: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Degree Program</label>
              <select className="input-premium" style={{background:'var(--surface-container-high)', color:'white'}} value={formData.program || ''} onChange={e => setFormData({...formData, program: e.target.value})}>
                <option value="">Select Program</option>
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Software Engineering">BS Software Engineering</option>
                <option value="BS Business Admin">BS Business Admin</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Batch / Intake</label>
              <input className="input-premium" placeholder="Fall 2024" value={formData.batch || ''} onChange={e => setFormData({...formData, batch: e.target.value})} />
            </div>
          </div>
        );
      case 'department':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Department Name</label>
              <input className="input-premium" placeholder="e.g. Humanities" value={formData.departmentName || ''} onChange={e => setFormData({...formData, departmentName: e.target.value})} />
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
            <label style={{fontSize:'12px', opacity:0.8}}>Search & Select Head of Department (HOD)</label>
            <input 
              list="faculty-list" 
              className="input-premium" 
              placeholder="Start typing teacher name..." 
              style={{background:'var(--surface-container-high)', color:'white'}}
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
            <label style={{fontSize:'12px', opacity:0.8}}>Search & Select Instructor</label>
            <input 
                list="instructor-list"
                className="input-premium" 
                placeholder="Type to search teachers..."
                style={{background:'var(--surface-container-high)', color:'white'}} 
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
              <label style={{fontSize:'12px', opacity:0.8}}>Full Name</label>
              <input className="input-premium" placeholder="Dr. Nasir" value={formData.facultyName || ''} onChange={e => setFormData({...formData, facultyName: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Department</label>
              <input className="input-premium" placeholder="Computer Science" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Designation</label>
              <input className="input-premium" placeholder="Assistant Professor" value={formData.designation || ''} onChange={e => setFormData({...formData, designation: e.target.value})} />
            </div>
          </div>
        );
      case 'course':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Course Name</label>
              <input className="input-premium" placeholder="e.g. Data Structures" value={formData.courseName || ''} onChange={e => setFormData({...formData, courseName: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Credit Hours</label>
              <input className="input-premium" type="number" placeholder="3" value={formData.credits || ''} onChange={e => setFormData({...formData, credits: e.target.value})} />
            </div>
          </div>
        );
      case 'payment':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Amount Description</label>
              <input className="input-premium" placeholder="e.g. Semester Fee Fall 2024" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Amount (PKR)</label>
              <input className="input-premium" type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
          </div>
        );
      case 'notice_create':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <input className="input-premium" placeholder="Notification Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <textarea className="input-premium" style={{height:'100px'}} placeholder="Notice Content..." value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>
        );
      case 'course_roster':
        return (
          <div style={{textAlign:'left', display:'flex', flexDirection:'column', height:'100%'}}>
             <h3 style={{color:'var(--accent)', margin:0, marginBottom:'16px'}}>{data?.courseID}: {data?.courseName}</h3>
             <div className="notices-scroll-area" style={{maxHeight:'300px', overflowY:'auto'}}>
                {enrolments.filter(e => e.courseID === data?.courseID).length > 0 ? (
                  enrolments.filter(e => e.courseID === data?.courseID).map(e => {
                    const student = students.find(s => s.dbID === e.studentID || s.id === e.studentID);
                    return (<div key={e.registrationID} className="notice-item-premium" style={{padding:'12px', marginBottom:'8px', background:'rgba(255,255,255,0.03)'}}>{student?.name || 'Unknown'} — {student?.regNumber || e.studentID}</div>);
                  })
                ) : (<p style={{opacity:0.4}}>No candidates registered.</p>)}
             </div>
          </div>
        );
      case 'admit_card_generated':
        return (
          <div style={{padding:'20px', textAlign:'center'}}>
            <div className="fade-in">
              <span className="badge-premium badge-primary">OFFICIAL ADMIT CARD</span>
              <h3 style={{marginTop:'20px', color:'white'}}>{data.name}</h3>
              <p style={{opacity:0.6}}>{data.regNumber}</p>
              <div style={{marginTop:'24px', padding:'16px', background:'rgba(255,255,255,0.03)', borderRadius:'12px'}}>
                  <p><strong>Tracking ID:</strong> {data.id}</p>
                  <p><strong>Test Date:</strong> {data.testDate}</p>
              </div>
            </div>
          </div>
        );
      case 'exam':
        return (
          <div className="form-grid-premium" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Target Course</label>
              <select className="input-premium" value={formData.courseID || ''} onChange={e => setFormData({...formData, courseID: e.target.value})}>
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseName} ({c.courseID})</option>)}
              </select>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
               <div>
                  <label style={{fontSize:'12px', opacity:0.8}}>Exam Date</label>
                  <input type="date" className="input-premium" style={{background:'var(--surface-container-high)', color:'white'}} value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div>
                  <label style={{fontSize:'12px', opacity:0.8}}>Commencement Time</label>
                  <input type="time" className="input-premium" style={{background:'var(--surface-container-high)', color:'white'}} value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
               </div>
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Examination Venue</label>
              <input className="input-premium" placeholder="e.g. Hall A, Lab 3" value={formData.venue || ''} onChange={e => setFormData({...formData, venue: e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:'12px', opacity:0.8}}>Exam Category</label>
              <select className="input-premium" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Midterm">Midterm</option>
                <option value="Terminal">Terminal (Final)</option>
                <option value="Sessional">Sessional</option>
              </select>
            </div>
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
    <div className="app-wrapper-premium" onKeyDown={(e) => e.key === 'Enter' && isModalOpen && handleSave()}>
      
      <button className="hamburger-premium" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <div className="mobile-header-premium">
        <img src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="COMSATS" style={{height:'32px'}} />
      </div>

      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={(tab) => { switchTab(tab); setIsSidebarOpen(false); }} 
        onLogout={handleLogout} 
        onHomeClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="main-content-premium" style={{display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden'}}>
        <div className="scroll-surface">
            <header className="view-breadcrumb">CUI VEHARI / {user.role.toUpperCase()} / {activeTab.toUpperCase()}</header>
            {renderContent()}
        </div>
        <Footer />
      </main>

      {/* Dynamic Modal Overlay */}
      {isModalOpen && (

        <div className="modal-overlay-premium" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
           <div className="modal-card-premium glass-card fade-in">
            <h2>{modalCtx.type === 'admit_card_generated' ? 'Candidate Admit Card' : (modalCtx.data ? 'Modify' : 'Execute')} {modalCtx.type !== 'admit_card_generated' && modalCtx.type.replace('_',' ')}</h2>
            <div className="form-grid-premium mt-24" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                {renderModalBody()}
            </div>

                  
                  <div className="modal-footer-premium" style={{display:'flex', gap:'12px', borderTop:'1px solid var(--glass-border)', paddingTop:'16px'}}>
                     {modalCtx.type === 'admit_card_generated' ? (
                       <>
                         <button className="btn-primary-premium" style={{width:'100%'}} onClick={() => window.print()}>Print Admit Card</button>
                         <button className="btn-text-only" style={{width:'100%', color:'white'}} onClick={() => setIsModalOpen(false)}>Continue</button>
                       </>
                     ) : modalCtx.type === 'notice_detail' ? (
                       <button className="btn-primary-premium" style={{width:'100%'}} onClick={() => setIsModalOpen(false)}>Acknowledge Notice</button>
                     ) : (
                       <>
                         <button className="btn-text-only" style={{flex:1}} onClick={() => setIsModalOpen(false)}>Cancel</button>
                         <button className="btn-primary-premium" style={{flex:1}} onClick={handleSave}>Confirm Transaction</button>
                       </>
                     )}
                   </div>
                 </div>
             </div>
       )}




      {deleteConfirm.open && (
        <div className="modal-overlay-premium"><div className="modal-card-premium glass-card danger-zone">
          <h2>Expunge {deleteConfirm.typeName}?</h2>
          <div style={{display:'flex', gap:'12px', marginTop:'24px'}}>
            <button className="btn-icon-premium" onClick={() => setDeleteConfirm({open:false})}>Cancel</button>
            <button className="btn-primary-premium" style={{background:'#ef4444', flex:1}} onClick={executeDelete}>Confirm Deletion</button>
          </div>
        </div></div>
      )}
      {/* Institutional Notifications Overlay */}
      <div className="notifications-container-premium">
        {notifs.map(n => (
          <div key={n.id} className={`notification-premium ${n.type}`}>
            <div className="notification-indicator" />
            <span className="notification-msg">{n.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default App;
