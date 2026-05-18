import React from 'react';

const StudentMarksView = ({ user, enrolments, assessments, marks, courses }) => {
  const myEnrolments = enrolments.filter(e => e.studentID === user.id || e.studentID === user.dbID);

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Academic Results</h1>
          <p>Registry of evaluations and performance metrics for current enrollments.</p>
        </div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px'}}>
        {myEnrolments.map(enrol => {
          const course = courses.find(c => c.courseID === enrol.courseID);
          const courseAssts = assessments.filter(a => a.courseID === enrol.courseID);
          
          let totalObtained = 0;
          let totalPossible = 0;

          return (
            <div key={enrol.courseID} className="card" style={{padding: '0', overflow: 'hidden'}}>
              <div style={{padding: '24px', background: 'var(--surface-container-high)', borderBottom: '1px solid var(--color-border)'}}>
                <h3 style={{margin: 0}}>{course?.courseName || enrol.courseID}</h3>
                <span className="font-monospace" style={{fontSize: '12px', opacity: 0.6}}>{enrol.courseID}</span>
              </div>

              <div className="table-wrapper">
                <table className="premium-table min-w-table">
                  <thead>
                    <tr>
                      <th>Evaluation Type</th>
                      <th>Title</th>
                      <th>Conducted On</th>
                      <th className="text-right">Score Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseAssts.map(asst => {
                      const mark = marks.find(m => m.assessmentID === asst.id && (m.studentID === user.id || m.studentID === user.dbID));
                      const isPending = !mark || mark.obtainedMarks === null;
                      
                      if (!isPending) {
                        totalObtained += parseFloat(mark.obtainedMarks);
                        totalPossible += parseFloat(asst.totalMarks);
                      }

                      return (
                        <tr key={asst.id}>
                          <td><span className="badge-premium" style={{textTransform: 'uppercase', fontSize: '10px'}}>{asst.type}</span></td>
                          <td>{asst.title}</td>
                          <td className="font-monospace" style={{fontSize: '12px'}}>{asst.conductedDate || 'TBD'}</td>
                          <td className="text-right">
                            {isPending ? (
                              <span className="badge-premium" style={{background: 'var(--color-border)', color: 'var(--text-dim)'}}>Pending Review</span>
                            ) : (
                              <span style={{fontWeight: 700, color: 'var(--color-accent)'}}>{mark.obtainedMarks} / {asst.totalMarks}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {courseAssts.length === 0 && (
                      <tr>
                        <td colSpan="4">
                          <div className="empty-state" style={{padding: '32px'}}>
                            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                            </div>
                            <p>No evaluations recorded for this course.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {totalPossible > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{fontWeight: 700, textAlign: 'right', background: 'var(--surface-container-high)'}}>Aggregated Course Standing:</td>
                        <td className="text-right" style={{background: 'var(--surface-container-high)'}}>
                          <strong style={{fontSize: '18px', color: 'var(--color-accent)'}}>
                            {totalObtained} / {totalPossible} ({((totalObtained / totalPossible) * 100).toFixed(1)}%)
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          );
        })}
        {myEnrolments.length === 0 && (
           <div className="empty-state card" style={{padding: '60px'}}>
             <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                 <path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5" />
               </svg>
             </div>
             <h2>No Active Registry Found</h2>
             <p>No course enrollments were detected for your academic profile. Please verify your registration status with the Department Hub.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default StudentMarksView;
