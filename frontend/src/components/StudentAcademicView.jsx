import React, { useState } from 'react';

const StudentAcademicView = ({ user, enrolments, attendance, assessments, marks, courses, sessions, sessionAttendance }) => {
  const [expandedCourse, setExpandedCourse] = useState(null);
  
  const myEnrolments = enrolments.filter(e => e.studentID === user.id || e.studentID === user.dbID);
  
  const calculateTypeAttendance = (courseID, type) => {
    const courseSessions = sessions.filter(s => s.course_id === courseID && s.session_type === type);
    if (courseSessions.length === 0) return { attended: 0, total: 0, percent: 0 };
    
    const mySessions = sessionAttendance.filter(a => 
      (a.student_id === user.id || a.student_id === user.dbID) && 
      courseSessions.some(cs => cs.id === a.session_id)
    );
    
    const attended = mySessions.filter(a => a.status === 'present' || a.status === 'late').length;
    return {
      attended,
      total: courseSessions.length,
      percent: Math.round((attended / courseSessions.length) * 100)
    };
  };

  const getProgressColor = (percent) => {
    if (percent >= 75) return 'var(--color-accent)';
    if (percent >= 50) return '#D47C0F';
    return 'var(--color-danger)';
  };

  const getAssessmentMarks = (courseID) => {
    const courseAssts = assessments.filter(a => a.courseID === courseID);
    return courseAssts.map(asst => {
      const mark = marks.find(m => (m.studentID === user.id || m.studentID === user.dbID) && m.assessmentID === asst.id);
      return { ...asst, obtainedMarks: mark?.obtainedMarks || 0 };
    });
  };

  const getHistory = (courseID) => {
    const courseSessions = sessions.filter(s => s.course_id === courseID);
    return courseSessions.map(s => {
      const record = sessionAttendance.find(a => (a.student_id === user.id || a.student_id === user.dbID) && a.session_id === s.id);
      return { ...s, status: record?.status || 'absent' };
    }).sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Academic Portfolio</h1>
          <p>Real-time telemetry of your pedagogical engagement and performance.</p>
        </div>
      </div>

      <div className="grid-2-cols" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:'24px', marginTop:'24px'}}>
        {myEnrolments.map(enrol => {
          const course = courses.find(c => c.courseID === enrol.courseID);
          const classAtt = calculateTypeAttendance(enrol.courseID, 'class');
          const labAtt = calculateTypeAttendance(enrol.courseID, 'lab');
          const asstMarks = getAssessmentMarks(enrol.courseID);
          const isExpanded = expandedCourse === enrol.courseID;

          return (
            <div key={enrol.courseID} className="card" style={{padding:'24px', transition:'all 0.3s ease'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
                <div>
                  <h3 style={{margin:0}}>{course?.courseName || enrol.courseID}</h3>
                  <span className="font-monospace" style={{fontSize:'12px', opacity:0.6}}>{enrol.courseID}</span>
                </div>
                <button className="btn-text-only" onClick={() => setExpandedCourse(isExpanded ? null : enrol.courseID)}>
                  {isExpanded ? 'Collapse Details' : 'View History'}
                </button>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                {/* Class Attendance */}
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'13px'}}>
                    <span style={{fontWeight:600}}>Lecture Attendance</span>
                    {classAtt.total > 0 ? (
                      <span style={{opacity:0.8}}>{classAtt.attended} / {classAtt.total} sessions ({classAtt.percent}%)</span>
                    ) : (
                      <span style={{opacity:0.5, fontStyle:'italic'}}>No lectures recorded yet</span>
                    )}
                  </div>
                  {classAtt.total > 0 && (
                    <>
                      <div style={{width:'100%', height:'8px', background:'var(--color-border)', borderRadius:'10px', overflow:'hidden', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.1)'}}>
                        <div style={{width:`${classAtt.percent}%`, height:'100%', background: getProgressColor(classAtt.percent), transition:'width 1s ease'}}></div>
                      </div>
                      {classAtt.percent < 75 && (
                        <p style={{color:'var(--color-danger)', fontSize:'10px', marginTop:'4px', fontWeight:600}}>⚠️ Below 75% threshold for lectures</p>
                      )}
                    </>
                  )}
                </div>

                {/* Lab Attendance */}
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'13px'}}>
                    <span style={{fontWeight:600}}>Lab Attendance</span>
                    {labAtt.total > 0 ? (
                      <span style={{opacity:0.8}}>{labAtt.attended} / {labAtt.total} sessions ({labAtt.percent}%)</span>
                    ) : (
                      <span style={{opacity:0.5, fontStyle:'italic'}}>No lab sessions recorded yet</span>
                    )}
                  </div>
                  {labAtt.total > 0 && (
                    <>
                      <div style={{width:'100%', height:'8px', background:'var(--color-border)', borderRadius:'10px', overflow:'hidden', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.1)'}}>
                        <div style={{width:`${labAtt.percent}%`, height:'100%', background: getProgressColor(labAtt.percent), transition:'width 1s ease'}}></div>
                      </div>
                      {labAtt.percent < 75 && (
                        <p style={{color:'var(--color-danger)', fontSize:'10px', marginTop:'4px', fontWeight:600}}>⚠️ Below 75% threshold for labs</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="fade-in mt-24" style={{borderTop:'1px solid var(--color-border)', paddingTop:'24px'}}>
                  <h4 style={{fontSize:'14px', marginBottom:'16px'}}>Session History</h4>
                  <div className="table-wrapper">
                    <table className="premium-table min-w-table" style={{fontSize:'12px'}}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Topic</th>
                          <th className="text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getHistory(enrol.courseID).map((session, idx) => (
                          <tr key={idx}>
                            <td className="font-monospace">{session.session_date}</td>
                            <td><span className={`badge-premium ${session.session_type === 'lab' ? 'badge-gold' : 'badge-primary'}`}>{session.session_type.toUpperCase()}</span></td>
                            <td style={{opacity:0.7}}>{session.topic || '--'}</td>
                            <td className="text-right">
                              <span style={{
                                color: session.status === 'present' ? 'var(--success)' : session.status === 'late' ? '#D47C0F' : '#ef4444',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                              }}>
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {getHistory(enrol.courseID).length === 0 && (
                      <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <p>No sessions recorded yet for this course.</p>
                      </div>
                    )}
                  </div>

                  <h4 style={{fontSize:'14px', margin:'24px 0 16px 0'}}>Evaluation Registry</h4>
                  <div className="assessment-list">
                    {asstMarks.length === 0 && (
                      <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <p>No evaluations have been finalized yet.</p>
                      </div>
                    )}
                    {asstMarks.map(asst => (
                      <div key={asst.id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--color-border)'}}>
                        <span style={{fontSize:'13px'}}>{asst.title} <small style={{opacity:0.6}}>({asst.type})</small></span>
                        <span style={{fontWeight:700, color:'var(--color-accent)'}}>{asst.obtainedMarks} / {asst.totalMarks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentAcademicView;
