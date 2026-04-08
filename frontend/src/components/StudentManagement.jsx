import React from 'react';
import { exportToCSV, generateInstitutionalReport } from '../lib/exportUtils';

const icons = {
  delete: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
};

const StudentManagement = ({ students, openForm, handleDelete, setStudents }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Student Registry</h1>
          <p>Manage official student records and enrollment status.</p>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
          <button className="btn-text-only" onClick={() => generateInstitutionalReport('Student Registry', ['ID', 'Name', 'RegNumber', 'Program', 'Batch'], students)} style={{color:'white', background:'rgba(255,255,255,0.05)', padding:'8px 16px', borderRadius:'8px'}}>
             📄 PDF Report
          </button>
          <button className="btn-primary-premium" onClick={() => openForm('student')}>
            + Enroll New Student
          </button>
        </div>
      </div>

      <div className="glass-card mb-24" style={{padding:'4px 16px', display:'flex', alignItems:'center', gap:'12px'}}>
         <span style={{opacity:0.6}}>🔍 Search:</span>
         <input 
            className="input-premium" 
            placeholder="Search by Name, Reg #, or ID..." 
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
                <th>System ID</th>
                <th>Full Name</th>
                <th>Registration #</th>
                <th>Academic Info</th>
                <th>Contact & Email</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} onClick={() => openForm('student', student)} style={{cursor:'pointer'}}>
                  <td className="font-monospace" style={{opacity:0.6}}>#{student.id}</td>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar-small">{student.name.charAt(0)}</div>
                      <span className="user-name-cell">{student.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-monospace" style={{background:'rgba(255,183,77,0.1)', color:'var(--accent)', padding:'4px 8px', borderRadius:'4px', fontSize:'12px'}}>
                      {student.regNumber || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="academic-info-cell">
                      <span className="program-tag">{student.program}</span>
                      <span className="batch-label">Batch {student.batch}</span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info-cell">
                      <span className="email-text" style={{fontSize:'12px', color:'white'}}>{student.email}</span>
                      <span className="cnic-text" style={{fontSize:'11px', opacity:0.7}}>{student.phone || student.cnic}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button className="btn-icon-premium" onClick={(e) => { e.stopPropagation(); openForm('student', student); }}>{icons.edit}</button>
                    <button className="btn-icon-premium delete" onClick={(e) => { e.stopPropagation(); handleDelete(setStudents, student.id, 'Student', 'id'); }}>{icons.delete}</button>
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

export default StudentManagement;
