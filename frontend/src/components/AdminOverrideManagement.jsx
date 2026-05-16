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

      <div className="table-wrapper card">
        <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>Candidate Info</th>
              <th>Status Profile</th>
              <th>Justification</th>
              <th className="text-right">Administrative Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
               const override = adminOverrides.find(o => o.studentID === s.id);
               return (
                 <tr key={s.id}>
                   <td>
                     <div style={{display:'flex', flexDirection:'column'}}>
                       <span style={{fontWeight:600}}>{s.name}</span>
                       <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{s.id}</span>
                     </div>
                   </td>
                   <td>
                     {override ? (
                       <span className="badge-premium badge-primary">🔓 OVERRIDE ACTIVE</span>
                     ) : (
                       <span className="badge-premium" style={{opacity:0.5}}>STANDARD ACCESS</span>
                     )}
                   </td>
                   <td><span style={{fontSize:'13px', opacity:0.7}}>{override?.reason || '—'}</span></td>
                   <td className="text-right">
                     {override ? (
                       <button className="btn-text-only" style={{color:'var(--color-danger)', fontWeight:700}} onClick={() => handleRevoke(s.id)}>REVOKE</button>
                     ) : (
                       <button className="btn-primary-premium" style={{padding:'6px 14px', fontSize:'11px', background:'var(--color-ink)', color:'var(--color-bg)'}} onClick={() => handleGrantOverride(s.id)}>GRANT ACCESS</button>
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
