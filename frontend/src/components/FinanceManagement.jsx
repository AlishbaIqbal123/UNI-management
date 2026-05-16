import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const FinanceManagement = ({ user, feeStructures, setFeeStructures, departments, students, feePayments }) => {
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
                {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName} ({d.departmentID})</option>)}
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

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Active Institutional Fee Structures</h3>
        </div>
        
        <div className="table-wrapper">
          <table className="min-w-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Semester / Batch</th>
                <th>Standard Fee</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                  <tr key={f.id}>
                    <td data-label="Department">
                      <div style={{ fontWeight: 600 }}>{deptObj ? deptObj.departmentName : f.departmentID}</div>
                      <span className="hint">{f.departmentID}</span>
                    </td>
                    <td data-label="Semester / Batch">
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{f.semester}</span>
                    </td>
                    <td data-label="Standard Fee" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                      PKR {parseFloat(f.totalFee).toLocaleString()}
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-text-only" 
                        style={{ color: 'var(--color-danger)', fontWeight: 600 }}
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
    </div>
  );
};

export default FinanceManagement;
