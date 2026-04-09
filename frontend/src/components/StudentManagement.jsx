import React from 'react';
import { exportToCSV, generateInstitutionalReport } from '../lib/exportUtils';

const icons = {
  delete: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const StudentManagement = ({ students, finance, openForm, handleDelete, setStudents }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredStudents = (students || []).filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFinancialStatus = (studentID) => {
    const record = (finance || []).find(f => f.studentID === studentID);
    if (!record) return { label: 'CLEARED', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' };
    return record.dueAmount === 0 
      ? { label: 'CLEARED', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' } 
      : { label: 'RESTRICTED', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Student Registry</h1>
          <p>Global oversight of official institutional records and academic standing.</p>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
          <button className="btn-text-only" onClick={() => generateInstitutionalReport('Student Registry', ['ID', 'Name', 'RegNumber', 'Program', 'Batch'], students)} style={{color:'var(--text-main)', background:'var(--surface-container-high)', padding:'8px 16px', borderRadius:'8px'}}>
             📊 Export Registry
          </button>
          <button className="btn-primary-premium" onClick={() => openForm('student')}>
            + Enroll New Student
          </button>
        </div>
      </div>

      <div className="glass-card mb-24" style={{padding:'4px 16px', display:'flex', alignItems:'center', gap:'12px'}}>
         <span style={{opacity:0.6}}>🔍 Filter Registry:</span>
         <input 
            className="input-premium" 
            placeholder="Search by candidate name or registration number..." 
            style={{flex:1, border:'none', background:'transparent'}} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      <div className="table-card-premium glass-card">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Registration #</th>
                <th>Institutional Name</th>
                <th>Academic Track</th>
                <th>Financial Gate</th>
                <th>Official Email</th>
                <th className="text-right">Action Gate</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const fin = getFinancialStatus(student.id);
                return (
                  <tr key={student.id} onClick={() => openForm('student', student)} style={{cursor:'pointer'}}>
                    <td>
                      <span className="font-monospace" style={{background:'rgba(255,183,77,0.1)', color:'var(--accent)', padding:'4px 10px', borderRadius:'6px', fontSize:'13px', fontWeight:700}}>
                        {student.regNumber || student.id}
                      </span>
                    </td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-small">{(student.name || 'S').charAt(0)}</div>
                        <span className="user-name-cell" style={{fontSize:'15px'}}>{student.name || 'Student Candidate'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="academic-info-cell">
                        <span className="program-tag">{student.program}</span>
                        <span className="batch-label">{student.batch}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-premium" style={{background: fin.bg, color: fin.color, fontWeight:800, fontSize:'10px', letterSpacing:'1px'}}>
                         {fin.label}
                      </span>
                    </td>
                    <td>
                      <span style={{fontSize:'13px', opacity:0.8}}>{student.email}</span>
                    </td>
                    <td className="text-right">
                      <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                        <button className="btn-icon-premium" onClick={(e) => { e.stopPropagation(); openForm('student', student); }}>{icons.edit}</button>
                        <button className="btn-icon-premium delete" onClick={(e) => { e.stopPropagation(); handleDelete(setStudents, student.id, 'Student', 'id'); }}>{icons.delete}</button>
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
  );
};

export default StudentManagement;
