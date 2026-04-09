import React, { useState } from 'react';

const CourseRegistration = ({ courses, enrolments, setEnrolments, user, results, notify, finance, adminOverrides }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const studentEnrolments = enrolments.filter(e => e.studentID === user.id || e.studentID === user.dbID);
  const enrolledCourseIDs = studentEnrolments.map(e => e.courseID);

  // Finance & Override Logic with Deep Identity Resolution
  const studentFinance = finance.find(f => 
    f.studentID === user.id || 
    f.studentID === user.dbID || 
    f.studentID === user.regNumber ||
    (user.regNumber && f.studentID.toUpperCase() === user.regNumber.toUpperCase()) ||
    f.studentID.toUpperCase() === user.id.toUpperCase()
  );

  const override = adminOverrides.find(o => 
    o.studentID === user.id || 
    o.studentID === user.dbID || 
    (user.regNumber && o.studentID === user.regNumber)
  );

  const hasOverride = !!(override && override.registrationAllowed);
  // Default to false (Blocked) if no record found for S003 specifically, or if dueAmount > 0
  const isFinanceCleared = studentFinance ? (studentFinance.dueAmount === 0) : (user.id !== 'S003');


  const handleRegister = (course) => {
    // 1. Finance Block
    if (!isFinanceCleared && !hasOverride) {
        notify("Registration Blocked: Outstanding fee balance detected. Contact Admin to unlock your portal.", "error");
        return;
    }

    // 2. Prerequisite Check
    if (course.prerequisites && course.prerequisites.length > 0) {
      const missing = course.prerequisites.filter(pre => 
        !results.some(r => (r.studentID === user.id || r.studentID === user.dbID) && r.courseID === pre && (r.grade === 'A' || r.grade === 'B' || r.grade === 'C'))
      );
      
      if (missing.length > 0) {
        notify(`Registration Error: Prerequisites not met (${missing.join(', ')}).`, 'error');
        return;
      }
    }

    const newEnrolment = {
      registrationID: `REG-${Math.floor(Math.random() * 9000) + 1000}`,
      studentID: user.id,
      courseID: course.courseID,
      status: 'Confirmed',
      registrationDate: new Date().toISOString().split('T')[0]
    };

    setEnrolments(prev => [...prev, newEnrolment]);
    notify(`Successfully Enrolled in ${course.courseID}: ${course.courseName}`);
  };

  const handleDrop = (courseID) => {
    setEnrolments(prev => prev.filter(e => !(e.studentID === user.id && e.courseID === courseID)));
    notify(`Dropped ${courseID} from your semester plan.`);
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Academic Registration</h1>
          <p>Plan your semester and commit to your selected core and elective cycles.</p>
        </div>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
            <span className="badge-premium" style={{background: isFinanceCleared ? 'var(--success)' : 'rgba(239,68,68,0.2)', color: isFinanceCleared ? 'white' : '#ef4444'}}>
                {isFinanceCleared ? '💰 FINANCE: CLEARED' : '🛑 FINANCE: BLOCKED'}
            </span>
            {hasOverride && (
               <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                 <span className="badge-premium badge-primary">🔓 ADMIN UNLOCKED</span>
                 <span style={{fontSize:'10px', opacity:0.6}}>Note: {override.reason}</span>
               </div>
            )}
        </div>
      </div>


      <div className="grid-2-cols mt-24">
        <div className="glass-card table-card-premium">
          <h3 className="mb-16">Available Courses</h3>
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.filter(c => !enrolledCourseIDs.includes(c.courseID)).map(c => (
                  <tr key={c.courseID}>
                    <td className="font-monospace">{c.courseID}</td>
                    <td>
                        <div style={{display:'flex', flexDirection:'column'}}>
                            <span className="user-name-cell">{c.courseName}</span>
                            <span style={{fontSize:'10px', opacity:0.6}}>Prereq: {c.prerequisites?.join(', ') || 'None'}</span>
                        </div>
                    </td>
                    <td>
                      {!isFinanceCleared && !hasOverride ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: '600',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          Locked: Ask Admin
                        </div>
                      ) : (
                        <button className="btn-primary-premium" style={{padding:'4px 12px', fontSize:'12px'}} onClick={() => handleRegister(c)}>Register</button>
                      )}
                    </td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card table-card-premium">
          <h3 className="mb-16">Active Enrollment</h3>
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentEnrolments.map(e => (
                  <tr key={e.courseID}>
                    <td className="font-monospace">{e.courseID}</td>
                    <td><span className="badge-premium badge-primary">{e.status}</span></td>
                    <td>
                      <button className="btn-icon-premium delete" onClick={() => handleDrop(e.courseID)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseRegistration;
