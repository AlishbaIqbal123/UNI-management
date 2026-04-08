import React from 'react';

const AdminOverrideManagement = ({ students, adminOverrides, setAdminOverrides, notify }) => {
  const handleGrantOverride = (studentID) => {
    const reason = prompt("Reason for override (e.g. Finance Delay):");
    if (!reason) return;

    setAdminOverrides(prev => {
      const filtered = prev.filter(o => o.studentID !== studentID);
      return [...filtered, { studentID, registrationAllowed: true, reason, grantedBy: 'ADM-001' }];
    });
    notify(`🔓 Registration override granted for ${studentID}`);
  };

  const handleRevoke = (studentID) => {
    setAdminOverrides(prev => prev.filter(o => o.studentID !== studentID));
    notify(`🔒 Override revoked for ${studentID}`);
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Administrative Overrides</h1>
          <p>Grant registration permissions to students with pending financial clearances.</p>
        </div>
      </div>

      <div className="table-card-premium glass-card">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Reason</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
               const override = adminOverrides.find(o => o.studentID === s.id);
               return (
                 <tr key={s.id}>
                   <td>
                     <div className="user-info-cell">
                       <span className="user-name-cell">{s.name}</span>
                       <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{s.id}</span>
                     </div>
                   </td>
                   <td>
                     {override ? (
                       <span className="badge-premium badge-primary">🔓 Override Active</span>
                     ) : (
                       <span className="badge-premium" style={{opacity:0.5}}>No Override</span>
                     )}
                   </td>
                   <td><span style={{fontSize:'13px', opacity:0.7}}>{override?.reason || '—'}</span></td>
                   <td className="text-right">
                     {override ? (
                       <button className="btn-text-only" style={{color:'#ef4444'}} onClick={() => handleRevoke(s.id)}>Revoke</button>
                     ) : (
                       <button className="btn-primary-premium" style={{padding:'6px 14px', fontSize:'11px'}} onClick={() => handleGrantOverride(s.id)}>Grant Access</button>
                     )}
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOverrideManagement;
