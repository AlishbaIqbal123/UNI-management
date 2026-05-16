import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const FacultyWorkspace = ({ 
  user, students, courses, results, setResults, 
  attendance, setAttendance, sessions, setSessions,
  sessionAttendance, setSessionAttendance,
  assessments, setAssessments, 
  marks, setMarks, enrolments, notify, initialTab 
}) => {
  
  const myCourses = user.role === 'Admin'
    ? courses
    : courses.filter(c => (c.assignedFacultyID === user.id) || !c.assignedFacultyID);

  const [selectedCourse, setSelectedCourse] = useState(myCourses[0]?.courseID || '');
  const [activeTab, setActiveTab] = useState(initialTab || 'attendance');
  
  // Attendance Redesign States
  const [isMarking, setIsMarking] = useState(false);
  const [sessionSetup, setSessionSetup] = useState({
    course_id: myCourses[0]?.courseID || '',
    section: 'A',
    session_type: 'class',
    session_date: new Date().toISOString().split('T')[0],
    topic: ''
  });
  const [tempAttendance, setTempAttendance] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Get students for setup
  const sessionEnrolments = enrolments.filter(e => e.courseID === sessionSetup.course_id && e.status === 'Confirmed');
  const sessionStudents = students.filter(s => sessionEnrolments.some(e => e.studentID === s.id || e.studentID === s.dbID));

  const startAttendance = () => {
    if (!sessionSetup.course_id || !sessionSetup.section || !sessionSetup.session_type) return notify("Please select course, section and type", "error");
    if (sessionStudents.length === 0) return notify("No students enrolled in this section", "error");

    // Check for duplicate session today
    const exists = sessions.some(s => 
      s.course_id === sessionSetup.course_id && 
      s.section === sessionSetup.section && 
      s.session_type === sessionSetup.session_type && 
      s.session_date === sessionSetup.session_date
    );
    if (exists && !confirm("Attendance for this specific session already exists in the journal. Duplicate entry?")) return;
    
    // Initialize all as absent
    const initial = {};
    sessionStudents.forEach(s => { initial[s.id || s.dbID] = 'absent'; });
    setTempAttendance(initial);
    setIsMarking(true);
  };

  const saveAttendance = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const sessionData = {
      ...sessionSetup,
      conducted_by: user.id || user.dbID
    };

    try {
      let savedSessionId = '';
      if (isDatabaseConnected()) {
        const { data: sData, error: sErr } = await supabase.from('sessions').insert([sessionData]).select();
        if (sErr) throw sErr;
        savedSessionId = sData[0].id;

        const attendanceData = Object.entries(tempAttendance).map(([studentId, status]) => ({
          session_id: savedSessionId,
          student_id: studentId,
          status
        }));

        const { error: aErr } = await supabase.from('session_attendance').insert(attendanceData);
        if (aErr) throw aErr;
      } else {
        savedSessionId = Date.now().toString();
        const newSession = { ...sessionData, id: savedSessionId };
        const newAttend = Object.entries(tempAttendance).map(([studentId, status]) => ({
          id: Math.random().toString(),
          session_id: savedSessionId,
          student_id: studentId,
          status
        }));
        setSessions(prev => [...prev, newSession]);
        setSessionAttendance(prev => [...prev, ...newAttend]);
      }

      notify("🎯 Attendance Session Recorded Successfully");
      setIsMarking(false);
      setSessionSetup(prev => ({ ...prev, topic: '' }));
    } catch (err) {
      console.error(err);
      notify(err.message || "Error saving attendance", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getStats = () => {
    const vals = Object.values(tempAttendance);
    return {
      present: vals.filter(v => v === 'present').length,
      absent: vals.filter(v => v === 'absent').length,
      late: vals.filter(v => v === 'late').length,
      total: vals.length
    };
  };

  const courseEnrolments = (enrolments || []).filter(e => e.courseID === selectedCourse && e.status === 'Confirmed');
  const rosterStudents = students.filter(s => courseEnrolments.some(e => e.studentID === s.id || e.studentID === s.dbID));

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Faculty Workspace</h1>
          <p>{selectedCourse ? `Managing: ${selectedCourse}` : (myCourses.length > 0 ? 'Select a course to begin management.' : 'No institutional courses assigned to your ID.')}</p>
        </div>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <select className="input-premium" style={{width:'180px', height:'44px'}} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="" disabled>Switch Course</option>
            {myCourses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseID}: {c.courseName}</option>)}
          </select>
          <div className="card" style={{display:'flex', padding:'4px', gap:'4px', borderRadius:'10px', background: 'var(--color-bg)'}}>
             {['my-classes', 'attendance', 'history'].map(t => (
               <button key={t} className={activeTab === t ? 'btn-primary-premium' : 'btn-text-only'} style={{padding:'8px 16px', borderRadius:'8px', fontSize:'12px', background: activeTab === t ? 'var(--color-ink)' : 'transparent', color: activeTab === t ? 'var(--color-bg)' : 'var(--color-ink)'}} onClick={() => setActiveTab(t)}>
                 {t.replace('-', ' ').toUpperCase()}
               </button>
             ))}
          </div>
        </div>
      </div>

      {activeTab === 'attendance' && (
        <div className="fade-in">
          {!isMarking ? (
            <div className="card" style={{padding:'40px', maxWidth:'700px', margin:'0 auto'}}>
              <h2 style={{marginBottom:'24px'}}>Session Setup</h2>
              <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                  <div>
                    <label style={{fontSize:'12px', opacity:0.6, display:'block', marginBottom:'8px'}}>Course</label>
                    <select className="input-premium" value={sessionSetup.course_id} onChange={e => setSessionSetup({...sessionSetup, course_id: e.target.value})}>
                      {myCourses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseID}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'12px', opacity:0.6, display:'block', marginBottom:'8px'}}>Section</label>
                    <input className="input-premium" value={sessionSetup.section} onChange={e => setSessionSetup({...sessionSetup, section: e.target.value})} placeholder="e.g. A" />
                  </div>
                </div>

                <div>
                  <label style={{fontSize:'12px', opacity:0.6, display:'block', marginBottom:'12px'}}>Session Type</label>
                  <div style={{display:'flex', gap:'16px'}}>
                    <div 
                      className={`card ${sessionSetup.session_type === 'class' ? 'active' : ''}`}
                      style={{flex:1, padding:'20px', cursor:'pointer', textAlign:'center', border: sessionSetup.session_type === 'class' ? '2px solid var(--color-ink)' : '2px solid var(--color-border)', background: sessionSetup.session_type === 'class' ? 'var(--color-bg-dim)' : 'var(--color-bg)'}}
                      onClick={() => setSessionSetup({...sessionSetup, session_type: 'class'})}
                    >
                      <h3 style={{margin:0}}>Lecture</h3>
                      <span style={{fontSize:'12px', opacity:0.6}}>Regular Class</span>
                    </div>
                    <div 
                      className={`card ${sessionSetup.session_type === 'lab' ? 'active' : ''}`}
                      style={{flex:1, padding:'20px', cursor:'pointer', textAlign:'center', border: sessionSetup.session_type === 'lab' ? '2px solid var(--color-ink)' : '2px solid var(--color-border)', background: sessionSetup.session_type === 'lab' ? 'var(--color-bg-dim)' : 'var(--color-bg)'}}
                      onClick={() => setSessionSetup({...sessionSetup, session_type: 'lab'})}
                    >
                      <h3 style={{margin:0}}>Lab</h3>
                      <span style={{fontSize:'12px', opacity:0.6}}>Practical Session</span>
                    </div>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px'}}>
                  <div>
                    <label style={{fontSize:'12px', opacity:0.6, display:'block', marginBottom:'8px'}}>Date</label>
                    <input type="date" className="input-premium" value={sessionSetup.session_date} onChange={e => setSessionSetup({...sessionSetup, session_date: e.target.value})} />
                  </div>
                  <div>
                    <label style={{fontSize:'12px', opacity:0.6, display:'block', marginBottom:'8px'}}>Topic (Optional)</label>
                    <input className="input-premium" value={sessionSetup.topic} onChange={e => setSessionSetup({...sessionSetup, topic: e.target.value})} placeholder="e.g. Introduction to SQE" />
                  </div>
                </div>

                <button className="btn-primary-premium" style={{padding:'16px', fontSize:'16px'}} onClick={startAttendance}>Start Attendance Audit</button>
              </div>
            </div>
          ) : (
            <div className="fade-in">
              <div className="card mb-24" style={{padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <h3 style={{margin:0}}>{sessionSetup.course_id} - Section {sessionSetup.section} ({sessionSetup.session_type.toUpperCase()})</h3>
                  <p style={{margin:0, opacity:0.6, fontSize:'14px'}}>{sessionSetup.topic || 'No topic specified'}</p>
                </div>
                <div style={{display:'flex', gap:'24px', alignItems:'center'}}>
                  <div style={{display:'flex', gap:'12px', fontSize:'13px', fontWeight:600}}>
                    <span style={{color:'var(--success)'}}>P: {getStats().present}</span>
                    <span style={{color:'#ef4444'}}>A: {getStats().absent}</span>
                    <span style={{color:'#D47C0F'}}>L: {getStats().late}</span>
                    <span style={{opacity:0.5}}>Total: {getStats().total}</span>
                  </div>
                  <button className="btn-text-only" onClick={() => setTempAttendance(prev => {
                    const next = {...prev};
                    Object.keys(next).forEach(k => next[k] = 'present');
                    return next;
                  })}>Mark All Present</button>
                  <button className="btn-primary-premium" onClick={saveAttendance} style={{background:'var(--success)'}}>Save Attendance</button>
                  <button className="btn-text-only" style={{color:'var(--color-danger)'}} onClick={() => setIsMarking(false)}>Cancel</button>
                </div>
              </div>

              <div className="table-wrapper card">
                <table className="premium-table min-w-table">
                  <thead>
                    <tr>
                      <th>Candidate Info</th>
                      <th className="text-right">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionStudents.map(s => (
                      <tr key={s.id || s.dbID}>
                        <td>
                          <div style={{display:'flex', flexDirection:'column'}}>
                            <span style={{fontWeight:600}}>{s.name}</span>
                            <span style={{fontSize:'12px', opacity:0.6}}>{s.regNumber || s.id}</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <div style={{display:'inline-flex', gap:'4px', background:'var(--color-bg-dim)', padding:'4px', borderRadius:'8px', border:'1px solid var(--color-border)'}}>
                            {['present', 'absent', 'late'].map(status => (
                              <button 
                                key={status}
                                className={tempAttendance[s.id || s.dbID] === status ? 'btn-primary-premium' : 'btn-text-only'}
                                style={{
                                  padding:'6px 12px', 
                                  fontSize:'11px', 
                                  borderRadius:'6px',
                                  background: tempAttendance[s.id || s.dbID] === status ? (status === 'present' ? 'var(--success)' : status === 'absent' ? '#ef4444' : '#D47C0F') : 'transparent',
                                  color: tempAttendance[s.id || s.dbID] === status ? 'white' : 'inherit'
                                }}
                                onClick={() => setTempAttendance({...tempAttendance, [s.id || s.dbID]: status})}
                              >
                                {status[0].toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sessionStudents.length === 0 && (
                      <tr><td colSpan="2" style={{textAlign:'center', opacity:0.5, padding:'40px'}}>No candidates found for this section audit.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="fade-in">
          <div className="table-wrapper card">
            <h3>Past Sessions Journal</h3>
            <table className="premium-table min-w-table mt-24">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Type</th>
                  <th>Topic</th>
                  <th className="text-right">Presence Ratio</th>
                </tr>
              </thead>
              <tbody>
                {sessions.filter(s => s.conducted_by === user.id || s.conducted_by === user.dbID).sort((a,b) => new Date(b.session_date) - new Date(a.session_date)).map(s => {
                  const sAttends = sessionAttendance.filter(a => a.session_id === s.id);
                  const presentCount = sAttends.filter(a => a.status === 'present' || a.status === 'late').length;
                  return (
                    <tr key={s.id}>
                      <td className="font-monospace">{s.session_date}</td>
                      <td>{s.course_id}</td>
                      <td>{s.section}</td>
                      <td><span className={`badge-premium ${s.session_type === 'lab' ? 'badge-gold' : 'badge-primary'}`}>{s.session_type.toUpperCase()}</span></td>
                      <td style={{fontSize:'13px', opacity:0.8}}>{s.topic || '--'}</td>
                      <td className="text-right"><strong>{presentCount} / {sAttends.length}</strong></td>
                    </tr>
                  );
                })}
                {sessions.filter(s => s.conducted_by === user.id || s.conducted_by === user.dbID).length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center', opacity:0.5, padding:'40px'}}>No sessions recorded yet in your journal.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'my-classes' && (
        <div className="fade-in">
          <div className="table-wrapper card">
            <h3>Institutional Roster</h3>
            <table className="premium-table min-w-table">
              <thead>
                <tr><th>Name</th><th>Reg No</th><th>Batch</th><th>Section</th></tr>
              </thead>
              <tbody>
                {rosterStudents.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.regNumber}</td>
                    <td>{s.batch}</td>
                    <td>{s.section}</td>
                  </tr>
                ))}
                {rosterStudents.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign:'center', opacity:0.5, padding:'40px'}}>No students confirmed for this course yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyWorkspace;
