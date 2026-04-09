import React, { useState } from 'react';
import { exportToCSV } from '../lib/exportUtils';


/**
 * FacultyWorkspace — Institutional Marketplace Edition
 * Features: Card-based Evaluation Registry, Itemized Marking Forge, and Daily Attendance Audit.
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
  const [activeTab, setActiveTab] = useState(initialTab || 'attendance');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'marking'
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [newAsst, setNewAsst] = useState({ 
    title: '', 
    totalMarks: 0, 
    type: 'Quiz', 
    questions: [{ id: 1, title: 'Question 1', marks: '' }] 
  });
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(new Date().toISOString().split('T')[0]);

  const addQuestion = () => {
    setNewAsst(prev => ({
      ...prev,
      questions: [...prev.questions, { id: prev.questions.length + 1, title: `Question ${prev.questions.length + 1}`, marks: '' }]
    }));
  };

  const updateQuestion = (id, field, value) => {
    setNewAsst(prev => {
      const updated = prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q);
      const total = updated.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);
      return { ...prev, questions: updated, totalMarks: total };
    });
  };

  // Course-specific data
  const courseAssessments = (assessments || []).filter(a => 
    a.courseID === selectedCourse && 
    (categoryFilter === 'All' || a.type === categoryFilter)
  );
  
  // Strict Roster Isolation
  const courseEnrolments = (enrolments || []).filter(e => e.courseID === selectedCourse && e.status === 'Confirmed');
  const rosterStudents = students.filter(s => courseEnrolments.some(e => e.studentID === s.id || e.studentID === s.dbID));

  const handleAttendance = (studentID, status) => {
    setAttendance(prev => {
      const dbID = students.find(s => s.id === studentID)?.dbID || studentID;
      const filtered = prev.filter(a => !((a.studentID === studentID || a.studentID === dbID) && a.courseID === selectedCourse && a.date === attendanceDate));
      return [...filtered, { id: Date.now(), studentID, courseID: selectedCourse, date: attendanceDate, status }];
    });
    notify(`📋 Marked as ${status}`);
  };

  const handleAttendanceExport = () => {
    const data = rosterStudents.map(s => {
      const status = attendance.find(a => (a.studentID === s.id || a.studentID === s.dbID) && a.courseID === selectedCourse && a.date === attendanceDate)?.status || 'Not Marked';
      return {
        'Name': s.name,
        'Registration No': s.regNumber || s.id,
        'Date': attendanceDate,
        'Status': status
      };
    });
    exportToCSV(data, `${selectedCourse}_Attendance_${attendanceDate}`);
    notify("Attendance Roster Exported Successfully");
  };

  const handleMarksExport = () => {
    if (!selectedAsstData) return;
    const data = rosterStudents.map(s => {
      const markRecord = marks.find(m => (m.studentID === s.id || m.studentID === s.dbID) && m.assessmentID === selectedAssessment);
      const row = {
        'Name': s.name,
        'Registration No': s.regNumber || s.id,
      };
      
      let total = 0;
      selectedAsstData.questions.forEach((q, idx) => {
        const val = markRecord?.questionMarks?.[q.id] || 0;
        row[`Q${idx + 1} (${q.marks}M)`] = val;
        total += parseFloat(val);
      });

      row['Total Obtained'] = total;
      row['Max Marks'] = selectedAsstData.totalMarks;
      row['Percentage'] = ((total / selectedAsstData.totalMarks) * 100).toFixed(2) + '%';
      
      return row;
    });
    exportToCSV(data, `${selectedCourse}_${selectedAsstData.title}_Marks`);
    notify("Grading Sheet Exported Successfully");
  };

  const handleMarkUpdate = (studentID, value, qId = null) => {
    if (!selectedAssessment) return;
    setMarks(prev => {
      const dbID = students.find(s => s.id === studentID)?.dbID || studentID;
      const existing = prev.find(m => (m.studentID === studentID || m.studentID === dbID) && m.assessmentID === selectedAssessment);
      const filtered = prev.filter(m => !((m.studentID === studentID || m.studentID === dbID) && m.assessmentID === selectedAssessment));
      
      let updatedRecord;
      if (qId) {
        const questionMarks = { ...(existing?.questionMarks || {}), [qId]: value };
        const total = Object.values(questionMarks).reduce((a, b) => parseFloat(a || 0) + parseFloat(b || 0), 0);
        updatedRecord = { assessmentID: selectedAssessment, studentID, questionMarks, obtainedMarks: total };
      } else {
        updatedRecord = { assessmentID: selectedAssessment, studentID, obtainedMarks: parseFloat(value) };
      }
      
      return [...filtered, updatedRecord];
    });
  };


  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newAsst.title && newAsst.totalMarks > 0) {
      const asst = {
        id: `ASST-${Date.now()}`,
        courseID: selectedCourse,
        ...newAsst,
        totalMarks: parseInt(newAsst.totalMarks)
      };
      setAssessments(prev => [...prev, asst]);
      setShowForm(false);
      setNewAsst({ title: '', totalMarks: 0, type: 'Quiz', questions: [{ id: 1, title: 'Question 1', marks: '' }] });
      notify(`🎯 Created ${newAsst.type}: ${newAsst.title}`);
    } else {
      notify("Please add questions with valid marks", "error");
    }
  };

  const getMark = (studentID, qId = null) => {
    const dbID = students.find(s => s.id === studentID)?.dbID || studentID;
    const record = marks.find(m => (m.studentID === studentID || m.studentID === dbID) && m.assessmentID === selectedAssessment);
    if (qId) return record?.questionMarks?.[qId] || '';
    return record?.obtainedMarks || '';
  };


  const selectedAsstData = assessments.find(a => a.id === selectedAssessment);

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
            style={{width:'180px', height:'44px'}}
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled>Switch Course</option>
            {myCourses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseID}: {c.courseName}</option>)}
          </select>
          <div className="glass-card" style={{display:'flex', padding:'4px', gap:'4px', borderRadius:'10px'}}>
             {['my-classes', 'attendance', 'grading', 'history'].map(t => (
               <button 
                key={t}
                className={activeTab === t ? 'btn-primary-premium' : 'btn-text-only'}
                style={{padding:'8px 16px', borderRadius:'8px', fontSize:'12px'}}
                onClick={() => {
                  setActiveTab(t);
                  if (t === 'grading') setViewMode('grid');
                }}
               >
                 {t.replace('-', ' ').toUpperCase()}
               </button>
             ))}
          </div>

        </div>
      </div>

      {activeTab === 'my-classes' && (
        <div className="fade-in">
          <div style={{marginBottom:'32px'}}>
            <h3 style={{marginBottom:'16px'}}>Institutional Roster Segments</h3>
            <div className="marketplace-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
              {Array.from(new Set(rosterStudents.map(s => `${s.batch}|${s.section || 'General'}`))).map(groupKey => {
                const [batch, section] = groupKey.split('|');
                const groupStudents = rosterStudents.filter(s => s.batch === batch && (s.section || 'General') === section);
                return (
                  <div key={groupKey} className="glass-card stat-card-premium" style={{borderLeft:'4px solid var(--accent)', padding:'24px', display:'flex', flexDirection:'column', gap:'8px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                       <span className="stat-label" style={{fontSize:'12px', opacity:0.6}}>{batch}</span>
                       <span className="badge-premium badge-primary" style={{fontSize:'10px'}}>Active Session</span>
                    </div>
                    <span className="stat-value" style={{fontSize:'24px', margin:'4px 0'}}>Section {section}</span>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px'}}>
                       <span style={{fontSize:'13px', opacity:0.8}}>{groupStudents.length} Candidates Enrolled</span>
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:0.4}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                  </div>
                );
              })}
              {rosterStudents.length === 0 && (
                <div className="glass-card text-center" style={{padding:'40px', gridColumn:'span 3', opacity:0.4}}>
                   Institutional registry indicates no candidates are currently associated with this course offering.
                </div>
              )}
            </div>
          </div>

          <div className="table-card-premium glass-card">
            <h3>Detailed Student Registry</h3>
            <p style={{fontSize:'12px', opacity:0.6, marginBottom:'20px'}}>Complete administrative breakdown for {selectedCourse}</p>
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Batch</th>
                    <th>Section</th>
                    <th>Program</th>
                    <th className="text-right">Portal Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterStudents.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="user-info-cell">
                          <span className="user-name-cell">{s.name}</span>
                          <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{s.id}</span>
                        </div>
                      </td>
                      <td>{s.batch || 'Fall 2024'}</td>
                      <td><span className="badge-premium" style={{background:'rgba(255,255,255,0.05)'}}>{s.section || 'General'}</span></td>
                      <td><span className="badge-premium badge-gold">{s.program || 'BSCS'}</span></td>
                      <td className="text-right">
                        <span className="badge-premium badge-primary">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'attendance' && (
        <div className="fade-in">
          <div className="glass-card" style={{padding:'32px', maxWidth:'900px', margin:'0 auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h3 style={{margin:0}}>Mark Daily Attendance</h3>
              <div style={{display:'flex', gap:'12px'}}>
                <input type="date" className="input-premium" style={{width:'auto'}} value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                <button className="btn-primary-premium" style={{fontSize:'12px', padding:'8px 16px', background:'var(--success)'}} onClick={() => notify("Attendance Session Saved Locally")}>Save Session</button>
                <button className="btn-primary-premium" style={{fontSize:'12px', padding:'8px 16px', background:'var(--accent)', color:'black'}} onClick={handleAttendanceExport}>Export CSV</button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>ID</th>
                    <th className="text-right">Mark Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterStudents.map(s => {
                    const status = attendance.find(a => (a.studentID === s.id || a.studentID === s.dbID) && a.courseID === selectedCourse && a.date === attendanceDate)?.status;
                    return (
                      <tr key={s.id}>
                        <td className="user-name-cell">{s.name}</td>
                        <td className="font-monospace" style={{fontSize:'11px', opacity:0.6}}>{s.id}</td>
                        <td className="text-right">
                          <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                            <button className={status === 'Present' ? 'btn-primary-premium' : 'btn-text-only'} style={{padding:'6px 14px', fontSize:'10px', background:status === 'Present' ? 'var(--success)' : '', borderRadius:'6px'}} onClick={() => handleAttendance(s.id, 'Present')}>P</button>
                            <button className={status === 'Absent' ? 'btn-primary-premium' : 'btn-text-only'} style={{padding:'6px 14px', fontSize:'10px', background:status === 'Absent' ? '#ef4444' : '', borderRadius:'6px'}} onClick={() => handleAttendance(s.id, 'Absent')}>A</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="fade-in">
           <div className="dashboard-main-grid">
              <div className="glass-card" style={{padding:'24px'}}>
                <h3 id="attendance-hub">Attendance History Hub</h3>
                <p style={{fontSize:'12px', opacity:0.5, marginBottom:'24px'}}>Select a session to audit physiological presence logs for {selectedCourse}.</p>
                <div className="marketplace-grid" style={{display:'grid', gridTemplateColumns:'1fr', gap:'12px'}}>
                  {Array.from(new Set(attendance.filter(a => a.courseID === selectedCourse).map(a => a.date))).length > 0 ? (
                    Array.from(new Set(attendance.filter(a => a.courseID === selectedCourse).map(a => a.date)))
                      .sort((a,b) => new Date(b) - new Date(a))
                      .map(date => {
                        const presentCount = attendance.filter(a => a.courseID === selectedCourse && a.date === date && a.status === 'Present').length;
                        const totalMarked = attendance.filter(a => a.courseID === selectedCourse && a.date === date).length;
                        return (
                          <div 
                            key={date} 
                            className={`notice-item-premium ${selectedHistoryDate === date ? 'active' : ''}`} 
                            style={{padding:'16px', background:selectedHistoryDate === date ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', cursor:'pointer', border: selectedHistoryDate === date ? '1px solid var(--accent)' : '1px solid transparent'}}
                            onClick={() => setSelectedHistoryDate(date)}
                          >
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                              <div>
                                <div style={{fontWeight:600, fontSize:'14px'}}>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                <div style={{fontSize:'11px', opacity:0.5}}>{presentCount}/{totalMarked} Candidates Present</div>
                              </div>
                              <span className="badge-premium" style={{fontSize:'10px'}}>{selectedHistoryDate === date ? 'Viewing' : 'View Log'}</span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center" style={{padding:'40px', opacity:0.3}}>No historical logs found for this course.</div>
                  )}
                </div>
              </div>

              <div className="glass-card" style={{padding:'24px'}}>
                 {selectedHistoryDate && attendance.some(a => a.courseID === selectedCourse && a.date === selectedHistoryDate) ? (
                   <div className="fade-in">
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                        <h4 style={{margin:0}}>Session Audit: {selectedHistoryDate}</h4>
                        <button className="btn-primary-premium" style={{fontSize:'12px', padding:'8px 16px', background:'var(--accent)', color:'black'}} 
                          onClick={() => {
                            const dateData = rosterStudents.map(s => {
                              const status = attendance.find(a => (a.studentID === s.id || a.studentID === s.dbID) && a.courseID === selectedCourse && a.date === selectedHistoryDate)?.status || 'Not Marked';
                              return { 'Name': s.name, 'Reg No': s.regNumber || s.id, 'Status': status };
                            });
                            exportToCSV(dateData, `${selectedCourse}_Attendance_${selectedHistoryDate}`);
                            notify("History Exported Successfully");
                          }}
                        >Export This Log</button>
                      </div>
                      <div className="table-responsive">
                         <table className="premium-table">
                            <thead>
                              <tr>
                                <th>Candidate</th>
                                <th className="text-right">Portal Status</th>
                              </tr>
                            </thead>
                            <tbody>
                               {attendance.filter(a => a.courseID === selectedCourse && a.date === selectedHistoryDate).map(a => {
                                 const student = students.find(s => s.id === a.studentID || s.dbID === a.studentID);
                                 return (
                                   <tr key={a.id}>
                                      <td>
                                         <div style={{fontWeight:500, fontSize:'14px'}}>{student?.name || 'Unknown'}</div>
                                         <div style={{fontSize:'11px', opacity:0.5}}>{student?.regNumber || a.studentID}</div>
                                      </td>
                                      <td className="text-right">
                                         <span className="badge-premium" style={{background: a.status === 'Present' ? 'var(--success)' : '#ef4444', color:'white'}}>{a.status.toUpperCase()}</span>
                                      </td>
                                   </tr>
                                 );
                               })}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center" style={{padding:'100px 40px', opacity:0.3}}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{marginBottom:'16px'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      <p>Select an institutional session from the left to audit the attendance registry.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}


      {activeTab === 'grading' && (
        <div className="fade-in">
          {showForm && (
            <div className="modal-overlay-premium fade-in">
                <div className="glass-card modal-card-premium" style={{width:'500px', border:'1px solid var(--accent)', maxHeight:'85vh', overflowY:'auto'}}>
                    <h3>Assessment Configuration Forge</h3>
                    <form onSubmit={handleCreateSubmit} style={{display:'flex', flexDirection:'column', gap:'16px', marginTop:'24px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                          <div className="form-group-premium">
                            <label>Evaluation Type</label>
                            <select className="input-premium" value={newAsst.type} onChange={e => setNewAsst({...newAsst, type: e.target.value})}>
                                <option value="Quiz">Quiz</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Midterm">Midterm</option>
                                <option value="Final">Final</option>
                            </select>
                          </div>
                          <div className="form-group-premium">
                            <label>Short Title</label>
                            <input className="input-premium" placeholder="e.g. Sessional 1" value={newAsst.title} onChange={e => setNewAsst({...newAsst, title: e.target.value})} />
                          </div>
                        </div>

                        <div className="form-group-premium">
                          <label style={{display:'flex', justifyContent:'space-between'}}>
                            <span>Structure & Scoring Breakdown</span>
                            <span style={{color:'var(--accent)'}}>Total: {newAsst.totalMarks}M</span>
                          </label>
                          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px'}}>
                            {newAsst.questions.map((q, idx) => (
                              <div key={q.id} style={{display:'flex', gap:'8px'}}>
                                <input className="input-premium" style={{flex:2, fontSize:'12px'}} placeholder={`Question ${idx+1} Title`} value={q.title} onChange={e => updateQuestion(q.id, 'title', e.target.value)} />
                                <input type="number" className="input-premium" style={{flex:1, fontSize:'12px', textAlign:'center'}} placeholder="Marks" value={q.marks} onChange={e => updateQuestion(q.id, 'marks', e.target.value)} />
                              </div>
                            ))}
                          </div>
                          <button type="button" className="btn-text-only mt-12" onClick={addQuestion} style={{border:'1px dashed var(--glass-border)'}}>+ Add Question/Part</button>
                        </div>
                        
                        <div style={{display:'flex', gap:'12px', marginTop:'12px'}}>
                            <button type="button" className="btn-text-only" style={{flex:1}} onClick={() => setShowForm(false)}>Abort</button>
                            <button type="submit" className="btn-primary-premium" style={{flex:1, background:'var(--accent)', color:'black'}}>Initialize Forge</button>
                        </div>
                    </form>
                </div>
            </div>
          )}

          <div className="glass-card mb-24 grading-header-premium" style={{padding:'20px'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
               <h3 style={{margin:0}}>Assessment Marketplace</h3>
               <button className="btn-primary-premium" style={{background:'var(--accent)', color:'black'}} onClick={() => { setNewAsst({...newAsst, type: categoryFilter === 'All' ? 'Quiz' : categoryFilter}); setShowForm(true); }}>+ Create New</button>
             </div>
             <div className="sub-tabs-premium" style={{display:'flex', background:'rgba(255,255,255,0.05)', padding:'4px', borderRadius:'8px', gap:'4px', overflowX:'auto'}}>
                {['All', 'Quiz', 'Assignment', 'Midterm', 'Final'].map(cat => (
                  <button 
                    key={cat} 
                    className={categoryFilter === cat ? 'btn-primary-premium' : 'btn-text-only'}
                    style={{fontSize:'11px', padding:'8px 16px', borderRadius:'6px', whiteSpace:'nowrap'}}
                    onClick={() => { setCategoryFilter(cat); setViewMode('grid'); setSelectedAssessment(''); }}
                  >
                    {cat}s
                  </button>
                ))}
              </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="marketplace-grid fade-in" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
               {courseAssessments.map(asst => (
                 <div key={asst.id} className="glass-card marketplace-card-premium" style={{cursor:'pointer'}} onClick={() => { setSelectedAssessment(asst.id); setViewMode('marking'); }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px'}}>
                      <span className="badge-premium" style={{background:'rgba(255,255,255,0.05)', fontSize:'10px'}}>{asst.type}</span>
                      <span className="badge-premium badge-gold" style={{fontSize:'10px'}}>{asst.totalMarks} Points</span>
                    </div>
                    <h4 style={{margin:'0 0 8px 0', fontSize:'18px'}}>{asst.title}</h4>
                    <p style={{fontSize:'12px', opacity:0.6, margin:0}}>Click to manage entries and score analysis.</p>
                    <div style={{marginTop:'20px', display:'flex', gap:'8px'}}>
                       <button className="btn-text-only" style={{fontSize:'10px', padding:'6px 12px', border:'1px solid rgba(255,255,255,0.1)'}}>View Metrics</button>
                       <button className="btn-primary-premium" style={{fontSize:'10px', padding:'6px 12px', flex:1}}>Mark Now</button>
                    </div>
                 </div>
               ))}
               <div className="glass-card marketplace-card-premium add-new-card-premium" style={{border:'2px dashed rgba(255,255,255,0.1)', background:'transparent', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px', cursor:'pointer'}} onClick={() => setShowForm(true)}>
                  <span style={{fontSize:'32px', opacity:0.5, marginBottom:'12px'}}>+</span>
                  <span style={{fontSize:'14px', fontWeight:600, opacity:0.7}}>Add New {categoryFilter === 'All' ? 'Entry' : categoryFilter}</span>
               </div>
            </div>
          ) : (
            <div className="fade-in">
              <div className="table-card-premium glass-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                  <div>
                    <button className="btn-text-only mb-24" style={{padding:0, opacity:0.6}} onClick={() => setViewMode('grid')}>← Back to Marketplace</button>
                    <h3 style={{margin:0}}>{selectedAsstData?.title} <span style={{fontSize:'14px', opacity:0.5}}>({selectedAsstData?.type})</span></h3>
                  </div>
                  <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                    <div className="badge-premium badge-gold" style={{height:'fit-content'}}>{selectedAsstData?.totalMarks} Total Points</div>
                    <button className="btn-primary-premium" style={{fontSize:'12px', padding:'8px 16px', background:'var(--accent)', color:'black'}} onClick={handleMarksExport}>Export Excel</button>
                  </div>

                </div>

                <div className="table-responsive">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Academic Candidate</th>
                        {selectedAsstData?.questions.map((q, i) => (
                          <th key={q.id}>Q{i+1} ({q.marks}M)</th>
                        ))}
                        <th>Total</th>
                        <th className="text-right">Action</th>
                      </tr>

                    </thead>
                    <tbody>
                      {rosterStudents.map(s => (
                        <tr key={s.id}>
                          <td>
                            <div className="user-info-cell">
                              <span className="user-name-cell">{s.name}</span>
                              <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{s.id}</span>
                            </div>
                          </td>
                          {selectedAsstData?.questions.map(q => (
                            <td key={q.id}>
                              <input 
                                type="number" 
                                className="input-premium" 
                                style={{width:'80px', height:'40px', textAlign:'center', border:'1px solid var(--accent)'}}
                                value={getMark(s.id, q.id)}
                                onChange={(e) => handleMarkUpdate(s.id, e.target.value, q.id)}
                                placeholder="0"
                              />
                            </td>
                          ))}
                          <td>
                            <strong style={{color:'var(--accent)'}}>{getMark(s.id)}</strong>
                          </td>

                          <td className="text-right">
                             <button className="btn-text-only" style={{fontSize:'10px', opacity:0.5}}>Reset</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyWorkspace;
