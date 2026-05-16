import React from 'react';
import { exportToCSV, generateInstitutionalReport } from '../lib/exportUtils';

const icons = {
  delete: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const FacultyManagement = ({ faculty, openForm, handleDelete, setFaculty }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredFaculty = (faculty || []).filter(f => 
    (f.facultyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <h1>Faculty Registry</h1>
          <p className="page-subtitle">Official records of teaching and administrative staff.</p>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
          <button className="btn-outline" onClick={() => generateInstitutionalReport('Faculty Registry', ['ID', 'FacultyName', 'Designation', 'Email'], faculty)}>
             📄 STAFF REPORT
          </button>
          <button className="btn-primary" onClick={() => openForm('faculty')}>
            + ADD FACULTY MEMBER
          </button>
        </div>
      </div>

      <div className="card" style={{padding:'16px 20px', display:'flex', alignItems:'center', gap:'16px', marginBottom: '24px'}}>
         <span className="hint" style={{fontWeight:700, whiteSpace:'nowrap'}}>SEARCH REGISTRY:</span>
         <input 
            placeholder="Search by faculty name or employee ID number..." 
            className="input-transparent-premium"
            style={{flex:1, border:'none', background:'transparent', outline:'none', fontSize:'14px'}} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      <div className="table-wrapper card">
        <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Staff Member</th>
              <th>Designation</th>
              <th>Institutional Contact</th>
              <th>Personal Record</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculty.map(f => (
              <tr key={f.id} onClick={() => openForm('faculty', f)} style={{cursor:'pointer'}}>
                <td data-label="ID" className="font-monospace" style={{opacity:0.6}}>#{f.id}</td>
                <td data-label="Staff Member">
                  <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{width:'32px', height:'32px', borderRadius:'var(--radius)', background:'var(--color-ink)', color:'var(--color-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>{(f.facultyName || 'F').charAt(0)}</div>
                    <span style={{fontWeight:600}}>{f.facultyName || 'Academic Staff'}</span>
                  </div>
                </td>
                <td data-label="Designation">
                  <span className="badge-premium badge-gold" style={{textTransform:'uppercase', fontWeight:800}}>
                    {f.designation}
                  </span>
                </td>
                <td data-label="Institutional Contact">
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{fontSize:'12px', fontWeight:600, color:'var(--color-ink)'}}>{f.email}</span>
                    <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>EXT: {f.id.split('-').pop()}</span>
                  </div>
                </td>
                <td data-label="Personal Record">
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{fontSize:'11px', opacity:0.8}}>{f.personalEmail || 'NO RECORD'}</span>
                    <span style={{fontSize:'11px', fontWeight:700, color:'var(--color-accent)'}}>{f.phone || 'N/A'}</span>
                  </div>
                </td>
                <td data-label="Actions" className="text-right">
                  <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                    <button className="btn-icon-premium" onClick={(e) => { e.stopPropagation(); openForm('faculty', f); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="btn-icon-premium delete" style={{color:'var(--color-danger)', borderColor:'var(--color-danger)'}} onClick={(e) => { e.stopPropagation(); handleDelete(setFaculty, f.id, 'Faculty', 'id'); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredFaculty.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👨‍🏫</div>
            <p>No faculty members match your search criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FacultyManagement;
