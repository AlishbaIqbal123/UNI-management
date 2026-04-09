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

      <div className="table-card-premium glass-card">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Institutional Name</th>
                <th>Head of Department</th>
                <th className="text-right">Action Gate</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.departmentID}>
                  <td className="font-monospace">#{d.departmentID}</td>
                  <td><span className="user-name-cell">{d.departmentName}</span></td>
                  <td>
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <span className="program-tag">{d.headOfDepartment}</span>
                        <span style={{fontSize:'10px', opacity:0.6}}>Assigned on term basis</span>
                    </div>
                  </td>
                  <td className="text-right">
                      <button className="btn-text-only" style={{color:'var(--accent)', fontSize:'12px'}} onClick={() => openForm('assign_hod', d)}>
                        Assign Faculty
                      </button>
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

export default DepartmentManagement;
