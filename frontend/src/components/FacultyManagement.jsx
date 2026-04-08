import React from 'react';
import { exportToCSV, generateInstitutionalReport } from '../lib/exportUtils';

const icons = {
  delete: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const FacultyManagement = ({ faculty, openForm, handleDelete, setFaculty }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredFaculty = faculty.filter(f => 
    f.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Faculty Registry</h1>
          <p>Official records of teaching and administrative staff.</p>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
          <button className="btn-text-only" onClick={() => generateInstitutionalReport('Faculty Registry', ['ID', 'FacultyName', 'Designation', 'Email'], faculty)} style={{color:'white', background:'rgba(255,255,255,0.05)', padding:'8px 16px', borderRadius:'8px'}}>
             📄 staff Report
          </button>
          <button className="btn-primary-premium" onClick={() => openForm('faculty')}>
            + Add Faculty Member
          </button>
        </div>
      </div>

      <div className="glass-card mb-24" style={{padding:'4px 16px', display:'flex', alignItems:'center', gap:'12px'}}>
         <span style={{opacity:0.6}}>🔍 Search:</span>
         <input 
            className="input-premium" 
            placeholder="Search by Name or Staff ID..." 
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
                <th>ID</th>
                <th>Staff Member</th>
                <th>Designation</th>
                <th>Institutional Contact</th>
                <th>Personal Info</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map(f => (
                <tr key={f.id} onClick={() => openForm('faculty', f)} style={{cursor:'pointer'}}>
                  <td className="font-monospace" style={{opacity:0.6}}>#{f.id}</td>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar-small" style={{background:'var(--accent)', color:'var(--surface)'}}>{f.facultyName.charAt(0)}</div>
                      <span className="user-name-cell">{f.facultyName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="program-tag" style={{background:'rgba(255,255,255,0.05)', color:'white', border:'1px solid var(--glass-border)'}}>
                      {f.designation}
                    </span>
                  </td>
                  <td>
                    <div className="contact-info-cell">
                      <span className="email-text" style={{fontSize:'12px', color:'white'}}>{f.email}</span>
                      <span className="cnic-text" style={{fontSize:'10px', opacity:0.6}}>Internal Extension: {f.id.split('-').pop()}</span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info-cell">
                      <span className="email-text" style={{fontSize:'11px'}}>{f.personalEmail || 'No Record'}</span>
                      <span className="cnic-text" style={{fontSize:'11px', color:'var(--accent)'}}>{f.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button className="btn-icon-premium" onClick={(e) => { e.stopPropagation(); openForm('faculty', f); }}>{icons.edit}</button>
                    <button className="btn-icon-premium delete" onClick={(e) => { e.stopPropagation(); handleDelete(setFaculty, f.id, 'Faculty', 'id'); }}>{icons.delete}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FacultyManagement;
