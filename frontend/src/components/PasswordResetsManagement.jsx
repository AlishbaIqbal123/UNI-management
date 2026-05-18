import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

export default function PasswordResetsManagement({
  students,
  setStudents,
  faculty,
  setFaculty,
  passwordResetRequests,
  setPasswordResetRequests,
  notify
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  // Handle approving and resetting password
  const handleApproveReset = async (request) => {
    const defaultPass = request.role === 'Finance' ? 'admin' : '123';
    
    try {
      // 1. Locate user in Studet or Faculty registry and update password
      let userFound = false;

      if (request.role === 'Student') {
        const studentIdx = students.findIndex(
          s => s.id.toLowerCase() === request.regNo.toLowerCase() || 
               s.regNumber?.toLowerCase() === request.regNo.toLowerCase()
        );
        if (studentIdx !== -1) {
          const updated = [...students];
          updated[studentIdx] = { ...updated[studentIdx], password: defaultPass };
          setStudents(updated);
          userFound = true;

          // Sync with Supabase if active
          if (isDatabaseConnected()) {
            const dbId = updated[studentIdx].dbID || updated[studentIdx].id;
            await supabase
              .from('students')
              .update({ password: defaultPass })
              .eq('id', dbId);
          }
        }
      } else {
        // Faculty or Finance
        const facultyIdx = faculty.findIndex(
          f => f.id.toLowerCase() === request.regNo.toLowerCase()
        );
        if (facultyIdx !== -1) {
          const updated = [...faculty];
          updated[facultyIdx] = { ...updated[facultyIdx], password: defaultPass };
          setFaculty(updated);
          userFound = true;

          // Sync with Supabase if active
          if (isDatabaseConnected()) {
            const dbId = updated[facultyIdx].dbID || updated[facultyIdx].id;
            await supabase
              .from('faculty')
              .update({ password: defaultPass })
              .eq('id', dbId);
          }
        }
      }

      if (!userFound) {
        // If not found in the initial datasets, let's search across all student registry by id or regNumber just to be safe
        const studentIdx = students.findIndex(
          s => s.id.toLowerCase() === request.regNo.toLowerCase() || 
               (s.regNumber && s.regNumber.toLowerCase() === request.regNo.toLowerCase())
        );
        if (studentIdx !== -1) {
          const updated = [...students];
          updated[studentIdx] = { ...updated[studentIdx], password: defaultPass };
          setStudents(updated);
          userFound = true;
        }
      }

      // 2. Update the reset request state to 'Approved'
      const updatedRequests = passwordResetRequests.map(r => 
        r.id === request.id ? { ...r, status: 'Approved' } : r
      );
      setPasswordResetRequests(updatedRequests);

      if (isDatabaseConnected()) {
        await supabase
          .from('password_reset_requests')
          .update({ status: 'Approved', updated_at: new Date().toISOString() })
          .eq('id', request.id);
      }

      notify(`Password successfully reset for ${request.name} (${request.regNo}) to default '${defaultPass}'!`);
    } catch (e) {
      console.error(e);
      notify('Failed to process password reset request.', 'error');
    }
  };

  // Handle rejecting reset request
  const handleRejectRequest = async (request) => {
    try {
      const updatedRequests = passwordResetRequests.map(r => 
        r.id === request.id ? { ...r, status: 'Rejected' } : r
      );
      setPasswordResetRequests(updatedRequests);

      if (isDatabaseConnected()) {
        await supabase
          .from('password_reset_requests')
          .update({ status: 'Rejected', updated_at: new Date().toISOString() })
          .eq('id', request.id);
      }

      notify(`Reset request for ${request.name} has been rejected.`);
    } catch (e) {
      console.error(e);
      notify('Failed to reject reset request.', 'error');
    }
  };

  // Filter requests
  const filteredRequests = passwordResetRequests.filter(r => {
    const matchesSearch = 
      r.regNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Password Reset Gateway</h1>
          <p>Authorize incoming security resets and account recovery claims from institutional members.</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass-card feature-card p-24 mb-24" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '32px', background: 'rgba(255,193,7,0.1)', padding: '16px', borderRadius: '12px' }}>🔑</div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--color-ink)' }}>Institutional Recovery Protocol</h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, lineHeight: '1.5' }}>
            When students or faculty lock their accounts, they submit a reset request. Admins can click 
            <strong> "Reset to Default"</strong> to set their portal key back to <strong>'123'</strong> 
            (or <strong>'admin'</strong> for Finance). Once approved, the user can log in instantly.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
          <input 
            type="text" 
            placeholder="Search by ID or Name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium"
            style={{ margin: 0, width: '100%', maxWidth: '350px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.7 }}>Status Filter:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input-premium"
            style={{ minWidth: '150px', padding: '8px 12px', margin: 0 }}
          >
            <option value="All">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Registration ID</th>
              <th>System Role</th>
              <th>Request Timestamp</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(request => (
              <tr key={request.id}>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{request.name}</span>
                </td>
                <td>
                  <span className="badge-premium" style={{ background: 'var(--color-border)', color: 'var(--color-ink)', fontSize: '12px' }}>
                    {request.regNo}
                  </span>
                </td>
                <td>
                  <span style={{ opacity: 0.8 }}>{request.role}</span>
                </td>
                <td className="font-monospace" style={{ fontSize: '12px', opacity: 0.7 }}>
                  {new Date(request.requestedAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>
                  <span className="badge-premium" style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 8px',
                    background: request.status === 'Pending' ? 'rgba(255, 193, 7, 0.15)' : request.status === 'Approved' ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)',
                    color: request.status === 'Pending' ? '#ffc107' : request.status === 'Approved' ? '#28a745' : '#dc3545'
                  }}>
                    {request.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {request.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-primary-premium" 
                        style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }}
                        onClick={() => handleApproveReset(request)}
                      >
                        Reset to Default
                      </button>
                      <button 
                        className="btn-danger-premium" 
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '12px', 
                          margin: 0,
                          background: 'rgba(220, 53, 69, 0.1)', 
                          color: '#dc3545',
                          border: '1px solid rgba(220, 53, 69, 0.2)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleRejectRequest(request)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', opacity: 0.5, fontStyle: 'italic' }}>
                      Resolved
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                  No password reset requests found in active registry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
