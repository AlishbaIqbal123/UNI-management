import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const FinanceManagement = ({ user, feeStructures, setFeeStructures, departments, students, feePayments, openForm }) => {
  const [activeForm, setActiveForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ departmentID: '', semester: 'Fall 2024', totalFee: '' });

  const isFinanceOfficer = user.role === 'Admin' || user.role === 'Finance';

  // Helper to resolve student department
  const getStudentDept = (student) => {
    if (!student.program) return 'CS';
    const prog = student.program.toLowerCase();
    if (prog.includes('computer') || prog.includes('software') || prog.includes('cs') || prog.includes('computing')) {
      return 'CS';
    }
    if (prog.includes('business') || prog.includes('bba') || prog.includes('management')) {
      return 'BBA';
    }
    return 'CS'; // fallback
  };

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    const { departmentID, semester, totalFee } = formData;
    if (!departmentID || !semester || !totalFee) return alert('Please fill all fields.');

    setIsSaving(true);
    const amount = parseFloat(totalFee);
    const newStructure = {
      department_id: departmentID,
      semester,
      total_fee: amount
    };

    if (isDatabaseConnected()) {
      try {
        const { data, error } = await supabase
          .from('fee_structures')
          .upsert([newStructure], { onConflict: 'department_id,semester' })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          setFeeStructures(prev => {
            const existingIdx = prev.findIndex(f => f.departmentID === departmentID && f.semester === semester);
            const item = { id: data[0].id, departmentID, semester, totalFee: amount };
            if (existingIdx > -1) {
              const copy = [...prev];
              copy[existingIdx] = item;
              return copy;
            }
            return [...prev, item];
          });
        }
      } catch (err) {
        console.error('Database save error:', err);
        alert(`Failed to save to database: ${err.message}`);
      }
    } else {
      // Mock local fallback
      setFeeStructures(prev => {
        const existingIdx = prev.findIndex(f => f.departmentID === departmentID && f.semester === semester);
        const item = { id: `fs-${Date.now()}`, departmentID, semester, totalFee: amount };
        if (existingIdx > -1) {
          const copy = [...prev];
          copy[existingIdx] = item;
          return copy;
        }
        return [...prev, item];
      });
    }

    setIsSaving(false);
    setFormData({ departmentID: '', semester: 'Fall 2024', totalFee: '' });
    setActiveForm(false);
    alert('Department fee structure updated successfully.');
  };

  const handleDeleteStructure = async (id, deptID, sem) => {
    if (!window.confirm(`Are you sure you want to delete the fee structure for ${deptID} (${sem})?`)) return;

    if (isDatabaseConnected()) {
      try {
        const { error } = await supabase.from('fee_structures').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Delete error:', err);
        return alert(`Failed to delete from database: ${err.message}`);
      }
    }

    setFeeStructures(prev => prev.filter(f => f.id !== id));
    alert('Fee structure deleted successfully.');
  };

  // ----------------------------------------------------
  // STUDENT VIEW (Derived Statement)
  // ----------------------------------------------------
  if (!isFinanceOfficer) {
    const studentRecord = students.find(s => s.id === user.id || s.dbID === user.id || s.regNumber === user.regNumber);
    if (!studentRecord) {
      return (
        <div className="view-container fade-in">
          <div className="empty-state card" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <div className="empty-state-icon">💰</div>
            <h2>Financial Profile Inactive</h2>
            <p>No student registry records were found matching your ID. Please contact the Registrar.</p>
          </div>
        </div>
      );
    }

    const dept = getStudentDept(studentRecord);
    const sem = studentRecord.batch || 'Fall 2024';
    const activeStructure = feeStructures.find(fs => fs.departmentID === dept && fs.semester === sem);
    const totalFee = activeStructure ? activeStructure.totalFee : 0;

    // Payments
    const studentPayments = feePayments.filter(p => p.studentID === studentRecord.id || p.studentID === studentRecord.dbID);
    const totalPaid = studentPayments.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0);
    const pendingAmount = Math.max(0, totalFee - totalPaid);
    const status = totalFee === 0 ? 'UNASSIGNED' : (pendingAmount <= 0 ? 'CLEARED' : 'PENDING');

    return (
      <div className="view-container fade-in">
        <div className="card" style={{ maxWidth: '600px', margin: '40px auto', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle accent border */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--color-accent)' }}></div>
          
          <h1 style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '16px', marginTop: '16px' }}>Fee Statement</h1>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0' }}>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>STUDENT</div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>{studentRecord.name}</div>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>{studentRecord.regNumber}</div>
              <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Dept: {dept} | Semester: {sem}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>STATUS</div>
              <span style={{
                color: 'var(--color-bg)',
                background: status === 'CLEARED' ? 'var(--color-accent)' : (status === 'UNASSIGNED' ? 'var(--color-ink)' : 'var(--color-danger)'),
                padding: '6px 16px',
                borderRadius: 'var(--radius)',
                fontWeight: 800,
                fontSize: '11px',
                letterSpacing: '1px',
                opacity: status === 'UNASSIGNED' ? 0.6 : 1
              }}>
                {status}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ opacity: 0.8 }}>Standard Tuition Fee ({sem}):</span>
              <span style={{ fontWeight: 700 }}>PKR {totalFee.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ opacity: 0.8 }}>Total Paid:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>PKR {totalPaid.toLocaleString()}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderTop: '2px solid var(--color-ink)', 
              paddingTop: '12px', 
              marginTop: '12px' 
            }}>
              <span style={{ fontWeight: 700 }}>Pending Amount:</span>
              <span style={{ 
                fontWeight: 800, 
                fontSize: '18px',
                color: pendingAmount > 0 ? 'var(--color-danger)' : 'var(--color-ink)' 
              }}>
                PKR {pendingAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {studentPayments.length > 0 && (
            <div style={{ marginTop: '32px', borderTop: '1px dashed var(--color-border)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transaction History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {studentPayments.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Tuition Payment</div>
                      <div style={{ fontSize: '11px', opacity: 0.5 }}>{p.paymentDate} {p.reference ? `| Ref: ${p.reference}` : ''}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>+ PKR {p.amountPaid.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FINANCE OFFICER VIEW (Fee Structure Configuration Only)
  // ----------------------------------------------------
  return (
    <div className="view-container fade-in">
      <style>{`
        .finance-card-premium {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(26, 58, 107, 0.08);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .finance-card-premium:hover {
          box-shadow: 0 8px 30px rgba(26, 58, 107, 0.12);
        }
        .finance-table-header {
          background: linear-gradient(135deg, var(--color-sidebar-bg) 0%, #162a45 100%) !important;
          color: white !important;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.1em;
          font-weight: 600;
          padding: 16px 20px !important;
        }
        .finance-table-row {
          transition: all 0.2s ease;
          border-bottom: 1px solid var(--color-border);
        }
        .finance-table-row:hover {
          background: rgba(201, 164, 53, 0.05) !important;
          transform: scale(1.001) translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 58, 107, 0.04);
        }
        .finance-table-row td {
          padding: 18px 20px !important;
          vertical-align: middle;
        }
        .finance-btn-record {
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          border: none !important;
          box-shadow: 0 2px 6px rgba(201, 164, 53, 0.3) !important;
          transition: all 0.2s !important;
          border-radius: 4px !important;
          cursor: pointer !important;
        }
        .finance-btn-record:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(201, 164, 53, 0.5) !important;
          opacity: 0.95 !important;
        }
        .finance-btn-record:active {
          transform: translateY(1px) !important;
        }
        .finance-btn-cleared {
          background: rgba(74, 103, 133, 0.08) !important;
          color: var(--color-ink-muted) !important;
          border: 1px solid var(--color-border) !important;
          cursor: not-allowed !important;
          opacity: 0.6;
        }
        .badge-status-cleared {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2) !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .badge-status-pending {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%) !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2) !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .finance-delete-btn {
          color: var(--color-danger);
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .finance-delete-btn:hover {
          background: rgba(168, 50, 42, 0.08);
          color: #d32f2f;
        }
      `}</style>

      <div className="view-header-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Finance Portal</h1>
          <p>Define standard semester fees by department and batch.</p>
        </div>
        <button className="btn-primary-premium" onClick={() => setActiveForm(!activeForm)}>
          {activeForm ? 'Cancel' : '+ New Fee Structure'}
        </button>
      </div>

      {activeForm && (
        <div className="card fade-in" style={{ marginBottom: '32px', border: '1px solid var(--color-ink)' }}>
          <h2 style={{ marginBottom: '24px' }}>Define Fee Structure</h2>
          <form onSubmit={handleSaveStructure} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Department</label>
              <select 
                value={formData.departmentID} 
                onChange={e => setFormData({ ...formData, departmentID: e.target.value })}
                required
              >
                <option value="">Select Department...</option>
                {departments.map((d, idx) => <option key={`${d.departmentID}-${idx}`} value={d.departmentID}>{d.departmentName} ({d.departmentID})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Semester / Batch</label>
              <select 
                value={formData.semester} 
                onChange={e => setFormData({ ...formData, semester: e.target.value })}
                required
              >
                <option value="Fall 2024">Fall 2024</option>
                <option value="Spring 2025">Spring 2025</option>
                <option value="Spring 2026">Spring 2026</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Total Tuition Fee (PKR)</label>
              <input 
                type="number" 
                placeholder="e.g. 95000" 
                value={formData.totalFee} 
                onChange={e => setFormData({ ...formData, totalFee: e.target.value })} 
                required
              />
            </div>
            <button className="btn-primary-premium" type="submit" style={{ padding: '14px 28px', height: '46px' }} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Set Fee'}
            </button>
          </form>
        </div>
      )}

      <div className="finance-card-premium" style={{ marginBottom: '32px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(26, 58, 107, 0.02)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏛️</span> Active Institutional Fee Structures
          </h3>
        </div>
        
        <div className="table-wrapper">
          <table className="min-w-table">
            <thead>
              <tr>
                <th className="finance-table-header">Department</th>
                <th className="finance-table-header">Semester / Batch</th>
                <th className="finance-table-header">Standard Fee</th>
                <th className="finance-table-header" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <p>No institutional fee structures have been configured yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {feeStructures.map(f => {
                const deptObj = departments.find(d => d.departmentID === f.departmentID);
                return (
                  <tr key={f.id} className="finance-table-row">
                    <td data-label="Department">
                      <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '14px' }}>{deptObj ? deptObj.departmentName : f.departmentID}</div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.departmentID}</span>
                    </td>
                    <td data-label="Semester / Batch">
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>{f.semester}</span>
                    </td>
                    <td data-label="Standard Fee" style={{ fontWeight: 800, color: 'var(--color-accent)', fontSize: '15px' }}>
                      PKR {parseFloat(f.totalFee).toLocaleString()}
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-text-only finance-delete-btn" 
                        onClick={() => handleDeleteStructure(f.id, f.departmentID, f.semester)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isFinanceOfficer && (
        <div className="finance-card-premium" style={{ marginTop: '32px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26, 58, 107, 0.02)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span> Student Fee Ledger & Payments
            </h3>
            <span className="badge-premium badge-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>{students.length} Student Record(s)</span>
          </div>
          
          <div className="table-wrapper">
            <table className="min-w-table">
              <thead>
                <tr>
                  <th className="finance-table-header">Student Information</th>
                  <th className="finance-table-header">Standard Fee</th>
                  <th className="finance-table-header">Total Paid</th>
                  <th className="finance-table-header">Outstanding Dues</th>
                  <th className="finance-table-header">Ledger Status</th>
                  <th className="finance-table-header" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <p>No student records exist in the system registry.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {students.map(s => {
                  const dept = getStudentDept(s);
                  const semester = s.batch || 'Fall 2024';
                  
                  // Find structure
                  const struct = feeStructures.find(fs => fs.departmentID === dept && fs.semester === semester);
                  const standardFee = struct ? parseFloat(struct.totalFee) : 120000;
                  
                  // Total Paid
                  const paid = feePayments
                    ? feePayments.filter(fp => fp.studentID === s.id || fp.studentID === s.dbID).reduce((acc, curr) => acc + (parseFloat(curr.amountPaid) || 0), 0)
                    : 0;
                    
                  const balance = Math.max(0, standardFee - paid);
                  const isCleared = balance <= 0;
                  
                  return (
                    <tr key={s.id || s.dbID} className="finance-table-row">
                      <td data-label="Student Information">
                        <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '14px' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                          <span style={{ fontWeight: 600 }}>{s.program || 'Undergraduate'}</span> • Batch {semester}
                        </div>
                      </td>
                      <td data-label="Standard Fee" style={{ fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                        PKR {standardFee.toLocaleString()}
                      </td>
                      <td data-label="Total Paid" style={{ fontWeight: 700, color: '#10B981' }}>
                        PKR {paid.toLocaleString()}
                      </td>
                      <td data-label="Outstanding Dues" style={{ fontWeight: 800, color: isCleared ? '#10B981' : '#EF4444' }}>
                        PKR {balance.toLocaleString()}
                      </td>
                      <td data-label="Ledger Status">
                        <span className={`badge-premium ${isCleared ? 'badge-status-cleared' : 'badge-status-pending'}`} style={{
                          fontSize: '10px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontWeight: '800',
                          letterSpacing: '0.5px'
                        }}>
                          {isCleared ? '✓ CLEARED' : '⚠ PENDING'}
                        </span>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <button 
                          className={`btn-primary-premium ${isCleared ? 'finance-btn-cleared' : 'finance-btn-record'}`} 
                          style={{ padding: '8px 16px', fontSize: '12px', height: '36px' }}
                          disabled={isCleared}
                          onClick={() => openForm('payment', { studentID: s.id, studentName: s.name, semester: semester })}
                        >
                          {isCleared ? 'Fully Cleared' : 'Record Payment'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagement;
