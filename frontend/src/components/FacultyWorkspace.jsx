import React, { useState } from 'react';

/**
 * FacultyWorkspace — Enhanced Pedagogical Command Center
 * Features: Attendance, Grading, Quiz/Assignment Creation, and Inline Marking.
 */
const FacultyWorkspace = ({ 
  user, students, courses, results, setResults, 
  attendance, setAttendance, assessments, setAssessments, 
  marks, setMarks, enrolments, notify, initialTab 
}) => {
  
  const myCourses = user.role === 'Admin'
    ? courses
    : courses.filter(c => (c.assignedFacultyID === user.id) || !c.assignedFacultyID);

  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.courseID || '');
  const [activeTab, setActiveTab] = useState(initialTab || 'classes');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAssessment, setSelectedAssessment] = useState('');

  // Course-specific data
  const courseAssessments = (assessments || []).filter(a => a.courseID === selectedCourse);
  
  // Strict Roster Isolation: Only show students enrolled in this course
  const courseEnrolments = (enrolments || []).filter(e => e.courseID === selectedCourse && e.status === 'Confirmed');
  const rosterStudents = students.filter(s => courseEnrolments.some(e => e.studentID === s.id || e.studentID === s.dbID));

  const handleAttendance = (studentID, status) => {
    setAttendance(prev => {
      const filtered = prev.filter(a => !((a.studentID === studentID) && a.courseID === selectedCourse && a.date === attendanceDate));
      return [...filtered, { id: Date.now(), studentID, courseID: selectedCourse, date: attendanceDate, status }];
    });
    notify(`📋 Marked as ${status}`);
  };

  const handleMarkUpdate = (studentID, obtainedMarks) => {
    if (!selectedAssessment) return;
    setMarks(prev => {
      const filtered = prev.filter(m => !((m.studentID === studentID) && m.assessmentID === selectedAssessment));
      return [...filtered, { assessmentID: selectedAssessment, studentID, obtainedMarks: parseFloat(obtainedMarks) }];
    });
  };

  const handleCreateAssessment = () => {
    const title = prompt("Assessment Title (e.g. Quiz 2):");
    const totalMarks = prompt("Total Marks:");
    const type = prompt("Type (Quiz/Assignment/Midterm/Final):");

    if (title && totalMarks && type) {
      const newAsst = {
        id: `ASST-${Date.now()}`,
        courseID: selectedCourse,
        title,
        totalMarks: parseInt(totalMarks),
        type
      };
      setAssessments(prev => [...prev, newAsst]);
      notify(`🎯 Created ${type}: ${title}`);
    }
  };

  const getMark = (studentID) => {
    return marks.find(m => (m.studentID === studentID) && m.assessmentID === selectedAssessment)?.obtainedMarks || '';
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Faculty Workspace</h1>
          <p>{selectedCourse ? `Managing: ${selectedCourse}` : 'Select a course to begin management.'}</p>
        </div>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <select
            className="input-premium"
            style={{width:'200px', height:'44px'}}
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            {myCourses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseID}: {c.courseName}</option>)}
          </select>
          <div className="glass-card" style={{display:'flex', padding:'4px', gap:'4px', borderRadius:'10px'}}>
             {['classes', 'assessments'].map(t => (
               <button 
                key={t}
                className={activeTab === t ? 'btn-primary-premium' : 'btn-text-only'}
                style={{padding:'8px 16px', borderRadius:'8px', fontSize:'12px'}}
                onClick={() => setActiveTab(t)}
               >
                 {t.charAt(0).toUpperCase() + t.slice(1)}
               </button>
             ))}
          </div>
        </div>
      </div>

      {activeTab === 'classes' ? (
        <div className="fade-in">
          <div className="glass-card mb-24" style={{display:'flex', alignItems:'center', gap:'16px'}}>
            <span>📅 Attendance Date:</span>
            <input type="date" className="input-premium" style={{width:'auto'}} value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
          </div>

          <div className="table-card-premium glass-card">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rosterStudents.map(s => {
                  const status = attendance.find(a => (a.studentID === s.id || a.studentID === s.dbID) && a.courseID === selectedCourse && a.date === attendanceDate)?.status;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="user-info-cell">
                          <span className="user-name-cell">{s.name}</span>
                          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                            <span className="font-monospace" style={{fontSize:'11px', opacity:0.6}}>{s.regNumber || s.id}</span>
                            <span className="badge-premium" style={{fontSize:'10px', padding:'2px 4px', background:'rgba(255,255,255,0.05)'}}>
                              {s.section || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-premium ${status === 'Present' ? 'badge-primary' : status === 'Absent' ? 'badge-gold' : ''}`} 
                              style={{background: status === 'Absent' ? 'rgba(239,68,68,0.2)' : '', color: status === 'Absent' ? '#ef4444' : ''}}>
                          {status || 'Not Marked'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                          <button className="btn-primary-premium" style={{padding:'6px 12px', fontSize:'11px', background:'var(--success)'}} onClick={() => handleAttendance(s.id, 'Present')}>P</button>
                          <button className="btn-primary-premium" style={{padding:'6px 12px', fontSize:'11px', background:'#ef4444'}} onClick={() => handleAttendance(s.id, 'Absent')}>A</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="fade-in">
          <div className="glass-card mb-24" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
              <span>🎯 Selected Assessment:</span>
              <select className="input-premium" style={{width:'auto'}} value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}>
                <option value="">Select Assessment</option>
                {courseAssessments.map(a => <option key={a.id} value={a.id}>{a.title} ({a.type})</option>)}
              </select>
            </div>
            <button className="btn-primary-premium" onClick={handleCreateAssessment}>+ Create New</button>
          </div>

          <div className="table-card-premium glass-card">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Obtained Marks</th>
                  <th className="text-right">Weightage</th>
                </tr>
              </thead>
              <tbody>
                {rosterStudents.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="user-info-cell">
                        <span className="user-name-cell">{s.name}</span>
                        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                          <span className="font-monospace" style={{fontSize:'11px', opacity:0.6}}>{s.regNumber || s.id}</span>
                          <span className="badge-premium" style={{fontSize:'10px', padding:'2px 4px', background:'rgba(255,255,255,0.05)'}}>
                            {s.section || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="input-premium" 
                        style={{width:'100px', height:'36px', textAlign:'center'}}
                        disabled={!selectedAssessment}
                        value={getMark(s.id)}
                        onChange={(e) => handleMarkUpdate(s.id, e.target.value)}
                        placeholder="0.0"
                      />
                      <span style={{marginLeft:'8px', opacity:0.6}}>/ {assessments.find(a => a.id === selectedAssessment)?.totalMarks || '--'}</span>
                    </td>
                    <td className="text-right">
                      <span className="badge-premium badge-gold">10%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyWorkspace;
