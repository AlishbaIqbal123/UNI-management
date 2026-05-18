import React from 'react';
import { exportToCSV, generateInstitutionalReport } from '../lib/exportUtils';

const icons = {
  delete: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const StudentManagement = ({ students, finance, feePayments, openForm, handleDelete, setStudents }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredStudents = (students || []).filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFinancialStatus = (studentID) => {
    const fin = (finance || []).find(f => f.studentID === studentID);
    const sPayments = (feePayments || []).filter(p => p.studentID === studentID);
    const received = sPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
    const total = fin?.totalFee || fin?.dueAmount || 0;
    
    if (total === 0) return { label: 'CLEARED', color: 'white', bg: 'var(--color-accent)' };
    const pending = Math.max(0, total - received);
    
    return pending === 0 
      ? { label: 'CLEARED', color: 'white', bg: 'var(--color-accent)' } 
      : { label: 'PENDING', color: 'white', bg: 'var(--color-danger)' };
  };

  return (
    <div className="view-container">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <h1>Student Registry</h1>
          <p className="page-subtitle">Global oversight of official institutional records and academic standing.</p>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
          <button className="btn-outline" onClick={() => generateInstitutionalReport('Student Registry', ['ID', 'Name', 'RegNumber', 'Program', 'Batch'], students)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
             EXPORT REGISTRY
          </button>
          <button className="btn-primary" onClick={() => openForm('student')}>
            + ENROLL NEW STUDENT
          </button>
        </div>
      </div>

      <div className="card" style={{padding:'16px 20px', display:'flex', alignItems:'center', gap:'16px', marginBottom: '24px'}}>
         <span className="hint" style={{fontWeight:700, whiteSpace:'nowrap'}}>SEARCH REGISTRY:</span>
         <input 
            placeholder="Search by candidate name, registration number, or academic program..." 
            style={{flex:1, border:'none', background:'transparent', outline:'none', fontSize:'14px'}} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      <div className="table-wrapper card">
        <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>Registry #</th>
              <th>Candidate Identity</th>
              <th>Academic Track</th>
              <th>Financial Gate</th>
              <th>Official Email</th>
              <th className="text-right">Administrative</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const fin = getFinancialStatus(student.id);
              return (
                <tr key={student.id} onClick={() => openForm('student', student)} style={{cursor:'pointer'}}>
                  <td data-label="Registry #">
                    <span className="font-monospace" style={{background:'var(--color-bg-dim)', color:'var(--color-ink)', border:'1px solid var(--color-ink)', padding:'4px 10px', borderRadius:'var(--radius)', fontSize:'12px', fontWeight:800}}>
                      {student.regNumber || student.id}
                    </span>
                  </td>
                  <td data-label="Candidate Identity">
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                      <div style={{width:'32px', height:'32px', borderRadius:'var(--radius)', background:'var(--color-ink)', color:'var(--color-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>{(student.name || 'S').charAt(0)}</div>
                      <span style={{fontWeight:600}}>{student.name || 'Student Candidate'}</span>
                    </div>
                  </td>
                  <td data-label="Academic Track">
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span className="badge-premium badge-primary" style={{alignSelf:'flex-start'}}>{student.program}</span>
                      <span style={{fontSize:'10px', opacity:0.6, fontWeight:700, marginTop:'4px'}}>{student.batch}</span>
                    </div>
                  </td>
                  <td data-label="Financial Gate">
                    <span className="badge-premium" style={{background: fin.bg, color: fin.color, fontWeight:800, fontSize:'10px', letterSpacing:'1px', border: fin.label === 'CLEARED' ? 'none' : '1px solid var(--color-danger)'}}>
                       {fin.label}
                    </span>
                  </td>
                  <td data-label="Official Email">
                    <span style={{fontSize:'13px', opacity:0.8, fontWeight:500}}>{student.email}</span>
                  </td>
                  <td data-label="Administrative" className="text-right">
                    <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                      <button className="btn-icon-premium" onClick={(e) => { e.stopPropagation(); openForm('student', student); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button className="btn-icon-premium delete" style={{color:'var(--color-danger)', borderColor:'var(--color-danger)'}} onClick={(e) => { e.stopPropagation(); handleDelete(setStudents, student.id, 'Student', 'id'); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <p>No student candidates found in the active registry.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentManagement;
