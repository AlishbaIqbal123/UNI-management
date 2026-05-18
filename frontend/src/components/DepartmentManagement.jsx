import React from 'react';

const icons = {
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  delete: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  ),
  department: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--color-accent)'}}>
      <path d="M22 10v6M2 10v6M4 10h16M12 4v16M9 4h6M9 20h6"></path>
    </svg>
  ),
  governance: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
  )
};

const DepartmentManagement = ({ departments, setDepartments, faculty, openForm, handleDelete }) => {
  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <div className="card" style={{padding: '12px', background: 'rgba(201, 164, 53, 0.08)', borderRadius: '12px', border: '1px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {icons.department}
          </div>
          <div>
            <h1>Departmental Governance</h1>
            <p>Structural management of academic units and leadership assignments.</p>
          </div>
        </div>
        <button className="btn-primary-premium" onClick={() => openForm('department')}>
          <span>+ Establish New Department</span>
        </button>
      </div>

      <div className="table-wrapper card">
         <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th style={{width: '12%'}}>Identifier</th>
              <th style={{width: '28%'}}>Institutional Name</th>
              <th style={{width: '20%'}}>Head of Department</th>
              <th style={{width: '28%'}}>Programs Offered</th>
              <th style={{width: '12%'}} className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(departments || []).map((d, idx) => (
              <tr key={`${d.departmentID}-${idx}`}>
                <td data-label="Identifier" className="font-monospace" style={{fontWeight: 700, color: 'var(--color-accent)'}}>
                  #{d.departmentID}
                </td>
                <td data-label="Institutional Name">
                  <span style={{fontWeight: 600, letterSpacing: '0.02em'}}>{d.departmentName}</span>
                </td>
                <td data-label="Head of Department">
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <span className="badge-premium badge-primary" style={{alignSelf: 'flex-start'}}>
                      {d.headOfDepartment || 'TBD'}
                    </span>
                    <span style={{fontSize: '9px', opacity: 0.6, fontWeight: 700, letterSpacing: '0.05em'}}>TENURED LEADERSHIP</span>
                  </div>
                </td>
                <td data-label="Programs Offered">
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                    {(d.programs || []).map((p, pi) => (
                      <span key={pi} className="badge-premium" style={{
                        fontSize: '10px', padding: '2px 8px',
                        background: p.startsWith('PhD') ? 'rgba(201,164,53,0.15)' : p.startsWith('M') ? 'rgba(26,58,107,0.1)' : 'rgba(0,0,0,0.05)',
                        color: p.startsWith('PhD') ? 'var(--color-accent)' : 'var(--color-ink)',
                        fontWeight: 600, borderRadius: '4px'
                      }}>{p}</span>
                    ))}
                  </div>
                </td>
                <td data-label="Actions" className="text-right">
                  <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center'}}>
                    <button 
                      className="btn-icon-premium" 
                      title="Appoint HOD"
                      style={{color: 'var(--color-accent)', borderColor: 'var(--color-accent)'}}
                      onClick={() => openForm('assign_hod', d)}
                    >
                      {icons.governance}
                    </button>
                    <button 
                      className="btn-icon-premium" 
                      title="Edit Department"
                      onClick={() => openForm('department', d)}
                    >
                      {icons.edit}
                    </button>
                    <button 
                      className="btn-icon-premium delete" 
                      title="Delete Department"
                      style={{color: 'var(--color-danger)', borderColor: 'var(--color-danger)'}} 
                      onClick={() => handleDelete(setDepartments, d.departmentID, 'Department', 'departmentID')}
                    >
                      {icons.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!departments || departments.length === 0) && (
          <div className="empty-state">
            <div className="empty-state-icon">🏛️</div>
            <p>No departments have been established yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
