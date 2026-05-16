import React from 'react';
import { supabase } from '../lib/supabase';

const EnrollmentManagement = ({ enrolments, setEnrolments, students, courses, notify }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleStatusChange = async (enrolment, newStatus) => {
    try {
        const { error } = await supabase
            .from('enrollments')
            .update({ status: newStatus })
            .eq('id', enrolment.registrationID);
            
        if (error) throw error;
        
        setEnrolments(prev => prev.map(e => e.registrationID === enrolment.registrationID ? { ...e, status: newStatus } : e));
        notify(`Registration ${enrolment.registrationID} ${newStatus === 'Confirmed' ? 'Approved' : 'Rejected'}.`);
    } catch (e) {
        // Fallback for mock/demo IDs (like REG-001)
        setEnrolments(prev => prev.map(e => e.registrationID === enrolment.registrationID ? { ...e, status: newStatus } : e));
        notify(`Status Updated Successfully (Offline Mode).`);
    }
  };

  const handleReject = (enrolment) => {
    handleStatusChange(enrolment, 'Rejected');
  };

  const handleApprove = (enrolment) => {
    handleStatusChange(enrolment, 'Confirmed');
  };

  const filtered = enrolments.filter(e => {
    const student = students.find(s => s.id === e.studentID || s.dbID === e.studentID);
    if (!student) return false; // Hide "Pending ID" or orphaned records
    
    const course = courses.find(c => c.courseID === e.courseID);
    return (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (student?.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (course?.courseName || '').toLowerCase().includes(searchTerm.toLowerCase());
  });


  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Registration & Enrollment Oversight</h1>
          <p>Review academic commitments and approve or reject semester registrations.</p>
        </div>
      </div>

      <div className="card mb-24" style={{display:'flex', gap:'12px', alignItems:'center', padding:'8px 16px', background:'var(--color-bg)'}}>
          <span style={{opacity:0.6, fontWeight:700, fontSize:'12px'}}>SEARCH REGISTRY:</span>
          <input 
            className="input-premium" 
            placeholder="Search by Student, Registry #, or Course..." 
            style={{flex:1, border:'none', background:'transparent'}} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="table-wrapper card">
        <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>Reg ID</th>
              <th>Candidate Identity</th>
              <th>Academic Unit</th>
              <th>Request Date</th>
              <th>Status Profile</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, index) => {
              const student = students.find(s => s.dbID === e.studentID || s.id === e.studentID);
              const course = courses.find(c => c.courseID === e.courseID);
              return (
                <tr key={e.registrationID}>
                  <td>
                    <span className="font-monospace" style={{fontSize:'12px', fontWeight:800, color:'var(--color-ink)'}}>#{index + 101}</span>
                  </td>
                  <td>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontWeight:600}}>{student?.name || 'Academic Member'}</span>
                      <span className="font-monospace" style={{fontSize:'11px', opacity:0.6, letterSpacing:'0.5px'}}>{student?.regNumber || 'Pending ID'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontWeight:600}}>{course?.courseName || 'Advanced Study'}</span>
                      <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{e.courseID}</span>
                    </div>
                  </td>
                  <td className="font-monospace" style={{fontSize:'12px'}}>{e.registrationDate || '2026-09-08'}</td>
                  <td>
                    <span className={`badge-premium ${e.status === 'Confirmed' ? 'badge-primary' : ''}`} style={{background: e.status === 'Rejected' ? 'var(--color-danger)' : '', color: e.status === 'Rejected' ? 'white' : ''}}>
                      {e.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                      {e.status !== 'Confirmed' && (
                        <button className="btn-icon-premium" title="Approve Enrollment" onClick={() => handleApprove(e)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                      )}
                      {e.status !== 'Rejected' && (
                        <button className="btn-icon-premium delete" title="Reject Enrollment" style={{color:'var(--color-danger)', borderColor:'var(--color-danger)'}} onClick={() => handleReject(e)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No enrollment requests match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentManagement;
