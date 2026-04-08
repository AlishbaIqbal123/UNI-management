import React from 'react';

const StudentAcademicView = ({ user, enrolments, attendance, assessments, marks, courses }) => {
  const myEnrolments = enrolments.filter(e => e.studentID === user.id);
  
  const calculateAttendance = (courseID) => {
    const records = attendance.filter(a => a.studentID === user.id && a.courseID === courseID);
    if (records.length === 0) return 0;
    const present = records.filter(a => a.status === 'Present').length;
    return Math.round((present / records.length) * 100);
  };

  const getAssessmentMarks = (courseID) => {
    const courseAssts = assessments.filter(a => a.courseID === courseID);
    return courseAssts.map(asst => {
      const mark = marks.find(m => m.studentID === user.id && m.assessmentID === asst.id);
      return { ...asst, obtainedMarks: mark?.obtainedMarks || 0 };
    });
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Academic Portfolio</h1>
          <p>Real-time telemetry of your pedagogical engagement and performance.</p>
        </div>
      </div>

      <div className="grid-2-cols" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:'24px', marginTop:'24px'}}>
        {myEnrolments.map(enrol => {
          const course = courses.find(c => c.courseID === enrol.courseID);
          const attPercent = calculateAttendance(enrol.courseID);
          const asstMarks = getAssessmentMarks(enrol.courseID);

          return (
            <div key={enrol.courseID} className="glass-card" style={{padding:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px'}}>
                <div>
                  <h3 style={{margin:0}}>{course?.courseName || enrol.courseID}</h3>
                  <span className="font-monospace" style={{fontSize:'12px', opacity:0.6}}>{enrol.courseID}</span>
                </div>
                <div className="text-right">
                  <span className={`badge-premium ${attPercent > 75 ? 'badge-primary' : 'badge-gold'}`} style={{background: attPercent < 75 ? 'rgba(239,68,68,0.2)' : '', color: attPercent < 75 ? '#ef4444' : ''}}>
                    {attPercent}% Attendance
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{width:'100%', height:'6px', background:'rgba(255,255,255,0.05)', borderRadius:'10px', overflow:'hidden', marginBottom:'24px'}}>
                <div style={{width:`${attPercent}%`, height:'100%', background: attPercent > 75 ? 'var(--primary-light)' : '#ef4444', transition:'width 1s ease'}}></div>
              </div>

              <div className="assessment-list">
                <h4 style={{fontSize:'13px', textTransform:'uppercase', opacity:0.6, marginBottom:'12px'}}>Assessments</h4>
                {asstMarks.length === 0 && <p style={{fontSize:'12px', opacity:0.5}}>No assessment records found.</p>}
                {asstMarks.map(asst => (
                  <div key={asst.id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{fontSize:'13px'}}>{asst.title} <small style={{opacity:0.6}}>({asst.type})</small></span>
                    <span style={{fontWeight:700}}>{asst.obtainedMarks} / {asst.totalMarks}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentAcademicView;
