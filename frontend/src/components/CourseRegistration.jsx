import React, { useState } from 'react';

const CourseRegistration = ({ courses, enrolments, setEnrolments, user, results, notify, finance, adminOverrides, feePayments }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const studentEnrolments = enrolments.filter(e => e.studentID === user.id || e.studentID === user.dbID || e.studentID === user.regNumber);
  const enrolledCourseIDs = studentEnrolments.map(e => e.courseID);

  // Get student's batch from user profile
  const studentBatch = user.batch || 'Fall 2024';

  // Get student's results
  const studentResults = (results || []).filter(r => r.studentID === user.id || r.studentID === user.dbID || r.studentID === user.regNumber);
  
  // Passed courses: any course where student has a grade other than 'F'
  const passedCourseIDs = studentResults.filter(r => r.grade !== 'F').map(r => r.courseID);
  
  // Failed courses: courses where student has an 'F' grade and HAS NOT passed subsequently
  const failedCourseIDs = studentResults.filter(r => r.grade === 'F' && !passedCourseIDs.includes(r.courseID)).map(r => r.courseID);

  // Available courses are those the student hasn't passed and is not currently enrolled in
  const unregisteredCourses = courses.filter(c => !passedCourseIDs.includes(c.courseID) && !enrolledCourseIDs.includes(c.courseID));

  // 1. Regular Semester Offerings: Courses offered to their batch
  const regularCourses = unregisteredCourses.filter(c => {
    // If a course is failed, we show it in backlog, not regular
    if (failedCourseIDs.includes(c.courseID)) return false;
    // Offered to the student's batch
    const batches = c.offeredToBatches || ['Fall 2024', 'Spring 2025', 'Spring 2026'];
    return batches.includes(studentBatch);
  });

  // 2. Re-offered Backlogs: Failed or Missed
  const backlogCourses = unregisteredCourses.filter(c => {
    // If it's failed, it's definitely a backlog course
    if (failedCourseIDs.includes(c.courseID)) return true;
    
    // If it's not offered to their batch, but they haven't passed it, it's considered a Missed course
    const batches = c.offeredToBatches || ['Fall 2024', 'Spring 2025', 'Spring 2026'];
    return !batches.includes(studentBatch);
  });

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
  // Calculate real-time balance
  const studentTotalFee = studentFinance?.totalFee || studentFinance?.dueAmount || 0;
  const studentPayments = (feePayments || []).filter(p => 
    p.studentID === user.id || 
    p.studentID === user.dbID || 
    p.studentID === user.regNumber
  );
  const totalReceived = studentPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
  const currentBalance = Math.max(0, studentTotalFee - totalReceived);

  // Bypassed as per finance portal redesign (informational only, never blocks students)
  const isFinanceCleared = true;

  const handleRegister = (course) => {
    // 1. Finance Block
    if (!isFinanceCleared && !hasOverride) {
        notify("Registration Blocked: Outstanding fee balance detected. Contact Admin to unlock your portal.", "error");
        return;
    }

    // 1.5 Duplicate Check
    if (enrolledCourseIDs.includes(course.courseID)) {
      notify("Already enrolled in this course cycle.", "error");
      return;
    }

    // 2. Prerequisite Check
    if (course.prerequisites && course.prerequisites.length > 0 && course.prerequisites[0] !== 'None' && course.prerequisites[0] !== 'none') {
      const missing = course.prerequisites.filter(pre => !passedCourseIDs.includes(pre));
      
      if (missing.length > 0) {
        notify(`Registration Error: Prerequisites not met (${missing.join(', ')}). You must pass the prerequisite course first!`, 'error');
        return;
      }
    }

    const newEnrolment = {
      registrationID: `REG-${Math.floor(Math.random() * 9000) + 1000}`,
      studentID: user.id || user.regNumber,
      courseID: course.courseID,
      status: 'Confirmed',
      registrationDate: new Date().toISOString().split('T')[0]
    };

    setEnrolments(prev => [...prev, newEnrolment]);
    notify(`Successfully Enrolled in ${course.courseID}: ${course.courseName}`);
  };

  const handleDrop = (courseID) => {
    if (!window.confirm(`Warning: Are you sure you want to drop ${courseID}? This will remove it from your current semester plan.`)) return;
    setEnrolments(prev => prev.filter(e => !((e.studentID === user.id || e.studentID === user.dbID || e.studentID === user.regNumber) && e.courseID === courseID)));
    notify(`Dropped ${courseID} from your semester plan.`);
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h1>Academic Registration</h1>
          <p>Plan your semester and commit to your selected core and elective cycles.</p>
        </div>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
            <span className="badge-premium" style={{background: isFinanceCleared ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', color: isFinanceCleared ? '#4ade80' : '#ef4444', border: isFinanceCleared ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(239,68,68,0.2)', fontWeight:700}}>
                {isFinanceCleared ? '💰 FINANCE: CLEARED' : '🛑 FINANCE: BLOCKED'}
            </span>
            {hasOverride && (
               <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                 <span className="badge-premium badge-primary">🔓 ADMIN UNLOCKED</span>
                 <span style={{fontSize:'10px', opacity:0.6, fontWeight:700}}>NOTE: {override.reason}</span>
               </div>
            )}
        </div>
      </div>

      <div className="grid-2-cols mt-24" style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:'24px', alignItems:'start'}}>
        
        {/* Left Column: Available Courses & Backlogs */}
        <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
          
          {/* Regular Semester Offerings */}
          <div className="card" style={{padding:'24px'}}>
            <div style={{marginBottom:'16px', textAlign:'left'}}>
              <h3 style={{margin:0, fontSize:'18px', fontWeight:700, color:'var(--color-ink)'}}>Regular Semester Offerings</h3>
              <p style={{fontSize:'12px', opacity:0.6, margin:'4px 0 0 0'}}>Curriculum courses mapped for your cohort batch ({studentBatch})</p>
            </div>
            
            <div className="table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Course Code & Title</th>
                    <th>Status / Prereqs</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {regularCourses.map(c => {
                    const hasPrereq = !c.prerequisites || c.prerequisites.length === 0 || c.prerequisites[0] === 'None' || c.prerequisites[0] === 'none';
                    const missingPrereqs = hasPrereq ? [] : c.prerequisites.filter(pre => !passedCourseIDs.includes(pre));
                    const prereqsMet = missingPrereqs.length === 0;
                    
                    return (
                      <tr key={c.courseID}>
                        <td>
                          <div style={{display:'flex', flexDirection:'column', textAlign:'left'}}>
                            <span style={{fontWeight:600}}>{c.courseName}</span>
                            <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{c.courseID}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{textAlign:'left'}}>
                            {prereqsMet ? (
                              <span className="badge-premium" style={{background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)', fontSize:'10px'}}>
                                ✓ Prereqs Met
                              </span>
                            ) : (
                              <span className="badge-premium" style={{background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', fontSize:'10px'}}>
                                🛑 Requires {missingPrereqs.join(', ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          {!prereqsMet ? (
                            <button className="btn-outline" disabled style={{padding:'6px 12px', fontSize:'11px', opacity:0.5, cursor:'not-allowed', border:'1px solid var(--color-border)'}}>LOCKED</button>
                          ) : (
                            <button className="btn-primary" style={{padding:'6px 12px', fontSize:'11px', cursor:'pointer'}} onClick={() => handleRegister(c)}>REGISTER</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {regularCourses.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center" style={{padding:'20px', opacity:0.5, fontSize:'13px'}}>No regular semester courses available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Re-offered Backlogs */}
          <div className="card" style={{padding:'24px'}}>
            <div style={{marginBottom:'16px', textAlign:'left'}}>
              <h3 style={{margin:0, fontSize:'18px', fontWeight:700, color:'var(--color-ink)'}}>Re-offered Backlogs (Failed/Missed)</h3>
              <p style={{fontSize:'12px', opacity:0.6, margin:'4px 0 0 0'}}>Re-offered courses from failed previous attempts or missed registry cycles</p>
            </div>
            
            <div className="table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Course Code & Title</th>
                    <th>Type / Prereqs</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {backlogCourses.map(c => {
                    const isFailed = failedCourseIDs.includes(c.courseID);
                    const hasPrereq = !c.prerequisites || c.prerequisites.length === 0 || c.prerequisites[0] === 'None' || c.prerequisites[0] === 'none';
                    const missingPrereqs = hasPrereq ? [] : c.prerequisites.filter(pre => !passedCourseIDs.includes(pre));
                    const prereqsMet = missingPrereqs.length === 0;

                    return (
                      <tr key={c.courseID}>
                        <td>
                          <div style={{display:'flex', flexDirection:'column', textAlign:'left'}}>
                            <span style={{fontWeight:600}}>{c.courseName}</span>
                            <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{c.courseID}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{display:'flex', flexDirection:'column', gap:'4px', textAlign:'left'}}>
                            {isFailed ? (
                              <span className="badge-premium" style={{background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', fontSize:'10px', alignSelf:'flex-start'}}>
                                ⚠️ FAILED (RE-OFFERED)
                              </span>
                            ) : (
                              <span className="badge-premium" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.2)', fontSize:'10px', alignSelf:'flex-start'}}>
                                ❔ MISSED COURSE
                              </span>
                            )}
                            {prereqsMet ? (
                              <span style={{fontSize:'10px', opacity:0.6}}>✓ Prereqs Met</span>
                            ) : (
                              <span style={{fontSize:'10px', color:'#f87171'}}>🛑 Requires {missingPrereqs.join(', ')}</span>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          {!prereqsMet ? (
                            <button className="btn-outline" disabled style={{padding:'6px 12px', fontSize:'11px', opacity:0.5, cursor:'not-allowed', border:'1px solid var(--color-border)'}}>LOCKED</button>
                          ) : (
                            <button className="btn-primary" style={{padding:'6px 12px', fontSize:'11px', cursor:'pointer'}} onClick={() => handleRegister(c)}>REGISTER</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {backlogCourses.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center" style={{padding:'20px', opacity:0.5, fontSize:'13px'}}>No backlog or re-offered courses found. Clear history! 🎉</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Active Semester Enrollment Plan */}
        <div className="card" style={{padding:'24px'}}>
          <div style={{marginBottom:'16px', textAlign:'left'}}>
            <h3 style={{margin:0, fontSize:'18px', fontWeight:700, color:'var(--color-ink)'}}>Active Semester Plan</h3>
            <p style={{fontSize:'12px', opacity:0.6, margin:'4px 0 0 0'}}>Your committed courses for the current academic session</p>
          </div>
          
          <div className="table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {studentEnrolments.map(e => (
                  <tr key={e.courseID}>
                    <td className="font-monospace" style={{fontWeight:700, textAlign:'left'}}>{e.courseID}</td>
                    <td>
                      <div style={{textAlign:'left'}}>
                        <span className="badge-premium" style={{background:'rgba(59,130,246,0.1)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.2)', fontSize:'10px'}}>
                          {e.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <button className="btn-icon-premium delete" style={{color:'var(--color-danger)', borderColor:'var(--color-danger)'}} onClick={() => handleDrop(e.courseID)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {studentEnrolments.length === 0 && (
              <div className="empty-state" style={{padding:'40px 20px', textAlign:'center'}}>
                <div className="empty-state-icon" style={{fontSize:'36px', marginBottom:'12px'}}>📂</div>
                <p style={{fontSize:'14px', opacity:0.6, margin:0}}>No active enrollments for this semester.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CourseRegistration;
