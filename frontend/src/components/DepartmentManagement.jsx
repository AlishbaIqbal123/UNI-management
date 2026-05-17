import React from 'react';

const DepartmentManagement = ({ departments, faculty, openForm }) => {
  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Departmental Governance</h1>
          <p>Structural management of academic units and leadership assignments.</p>
        </div>
        <button className="btn-primary-premium" onClick={() => openForm('department')}>
          + Establish New Department
        </button>
      </div>

      <div className="table-wrapper card">
        <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Institutional Name</th>
              <th>Head of Department</th>
              <th className="text-right">Administrative</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d, idx) => (
              <tr key={`${d.departmentID}-${idx}`}>
                <td data-label="Identifier" className="font-monospace" style={{fontWeight:700}}>#{d.departmentID}</td>
                <td data-label="Institutional Name"><span style={{fontWeight:600}}>{d.departmentName}</span></td>
                <td data-label="Head of Department">
                  <div style={{display:'flex', flexDirection:'column'}}>
                      <span className="badge-premium badge-primary" style={{alignSelf:'flex-start'}}>{d.headOfDepartment}</span>
                      <span style={{fontSize:'10px', opacity:0.6, fontWeight:700, marginTop:'4px'}}>TENURED LEADERSHIP</span>
                  </div>
                </td>
                <td data-label="Administrative" className="text-right">
                    <button className="btn-text-only" style={{color:'var(--color-accent)', fontSize:'12px', fontWeight:700}} onClick={() => openForm('assign_hod', d)}>
                      APPOINT HEAD
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentManagement;
