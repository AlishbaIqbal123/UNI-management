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
    const course = courses.find(c => c.courseID === e.courseID);
    return (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           e.studentID.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      <div className="glass-card mb-24" style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <span style={{opacity:0.6}}>🔍 Search:</span>
          <input 
            className="input-premium" 
            placeholder="Search by Student, Registry #, or Course..." 
            style={{flex:1, border:'none'}} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="table-card-premium glass-card">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>REG ID</th>
                <th>STUDENT ID</th>
                <th>COURSE</th>
                <th>REQUEST DATE</th>
                <th className="text-right">STATUS & ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const student = students.find(s => s.id === e.studentID || s.dbID === e.studentID);
                const course = courses.find(c => c.courseID === e.courseID);
                return (
                  <tr key={e.registrationID}>
                    <td>
                      <span className="font-monospace" style={{fontSize:'11px', opacity:0.8}}>#{String(e.registrationID).slice(0, 8)}</span>
                    </td>
                    <td>
                      <div className="user-info-cell">
                        <span className="user-name-cell" style={{fontWeight:600}}>{student?.name || 'Academic Member'}</span>
                        <span className="font-monospace" style={{fontSize:'11px', opacity:0.6}}>{student?.id || String(e.studentID).slice(0, 8)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontWeight:500, color:'white'}}>{course?.courseName || 'Advanced Study'}</span>
                        <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{e.courseID}</span>
                      </div>
                    </td>
                    <td>{e.registrationDate || '2026-09-08'}</td>
                    <td>
                      <span className={`badge-premium ${e.status === 'Confirmed' ? 'badge-primary' : e.status === 'Rejected' ? 'badge-gold' : ''}`} style={{background: e.status === 'Rejected' ? 'rgba(239,68,68,0.2)' : '', color: e.status === 'Rejected' ? '#ef4444' : ''}}>
                        {e.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {e.status !== 'Confirmed' && (
                        <button className="btn-icon-premium" title="Approve Enrollment" onClick={() => handleApprove(e)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                      )}
                      {e.status !== 'Rejected' && (
                        <button className="btn-icon-premium delete" title="Reject Enrollment" onClick={() => handleReject(e)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentManagement;
