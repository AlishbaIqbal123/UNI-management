import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const FinanceManagement = ({ user, feeStructures, setFeeStructures, departments, students, feePayments, openForm }) => {
  const [activeForm, setActiveForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Set default form values tailored to COMSATS standard
  const [formData, setFormData] = useState({ 
    departmentID: 'BS Computer Science', 
    academicTerm: 'Spring 2026', 
    selectedSemesters: [], 
    totalFee: '' 
  });

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

  const PROGRAMS = [
    'BS Computer Science',
    'BS Software Engineering',
    'BS Business Administration',
    'BS Environmental Sciences',
    'BS Mathematics',
    'BS Biotechnology',
    'Humanities'
  ];

  const ACADEMIC_TERMS = [
    'Spring 2026',
    'Fall 2025',
    'Spring 2025',
    'Fall 2024'
  ];

  const handleSemesterToggle = (semNum) => {
    setFormData(prev => {
      const current = prev.selectedSemesters;
      const updated = current.includes(semNum)
        ? current.filter(x => x !== semNum)
        : [...current, semNum];
      return { ...prev, selectedSemesters: updated };
    });
  };

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    
    const { departmentID, academicTerm, selectedSemesters, totalFee } = formData;
    if (!departmentID || !academicTerm || !totalFee) return alert('Please fill all fields.');
    if (selectedSemesters.length === 0) return alert('Please select at least one student semester.');

    setIsSaving(true);
    const amount = parseFloat(totalFee);

    if (isDatabaseConnected()) {
      try {
        const promises = selectedSemesters.map(semNum => {
          const semString = `${academicTerm} - Semester ${semNum}`;
          const newStructure = {
            department_id: departmentID,
            semester: semString,
            total_fee: amount
          };
          return supabase
            .from('fee_structures')
            .upsert([newStructure], { onConflict: 'department_id,semester' })
            .select();
        });

        const results = await Promise.all(promises);
        
        // Update fee structures state
        setFeeStructures(prev => {
          let updated = [...prev];
          results.forEach((res, index) => {
            if (res.data && res.data[0]) {
              const dbItem = res.data[0];
              const semString = `${academicTerm} - Semester ${selectedSemesters[index]}`;
              const existingIdx = updated.findIndex(f => 
                (f.departmentID === departmentID || f.department_id === departmentID) && 
                f.semester === semString
              );
              
              const item = { 
                id: dbItem.id, 
                departmentID, 
                department_id: departmentID,
                semester: semString, 
                totalFee: amount,
                total_fee: amount
              };

              if (existingIdx > -1) {
                updated[existingIdx] = item;
              } else {
                updated.push(item);
              }
            }
          });
          return updated;
        });

      } catch (err) {
        console.error('Database save error:', err);
        alert(`Failed to save to database: ${err.message}`);
      }
    } else {
      // Mock local fallback
      setFeeStructures(prev => {
        let updated = [...prev];
        selectedSemesters.forEach(semNum => {
          const semString = `${academicTerm} - Semester ${semNum}`;
          const existingIdx = updated.findIndex(f => 
            (f.departmentID === departmentID || f.department_id === departmentID) && 
            f.semester === semString
          );
          
          const item = { 
            id: `fs-${Date.now()}-${semNum}`, 
            departmentID, 
            department_id: departmentID,
            semester: semString, 
            totalFee: amount,
            total_fee: amount
          };

          if (existingIdx > -1) {
            updated[existingIdx] = item;
          } else {
            updated.push(item);
          }
        });
        return updated;
      });
    }

    setIsSaving(false);
    setFormData({ 
      departmentID: 'BS Computer Science', 
      academicTerm: 'Spring 2026', 
      selectedSemesters: [], 
      totalFee: '' 
    });
    setActiveForm(false);
    alert('Department fee structures updated successfully.');
  };

  const handleDeleteGroup = async (group) => {
    const items = group.items;
    const semNames = group.semesters.join(', ');
    if (!window.confirm(`Are you sure you want to delete the configured fee structures for ${group.departmentID} (${group.term} - ${semNames})?`)) return;

    setIsSaving(true);
    if (isDatabaseConnected()) {
      try {
        const promises = items.map(item => 
          supabase.from('fee_structures').delete().eq('id', item.id)
        );
        await Promise.all(promises);
      } catch (err) {
        console.error('Delete error:', err);
        alert(`Failed to delete from database: ${err.message}`);
        setIsSaving(false);
        return;
      }
    }

    const idsToDelete = items.map(x => x.id);
    setFeeStructures(prev => prev.filter(f => !idsToDelete.includes(f.id)));
    setIsSaving(false);
    alert('Fee structures deleted successfully.');
  };

  // Group fee structures by department, academic term, and fee amount for a consolidated, premium UI
  const getGroupedFeeStructures = () => {
    const grouped = {};
    feeStructures.forEach(f => {
      const dept = f.departmentID || f.department_id || '';
      let term = f.semester || '';
      let semNum = '';
      if (f.semester && f.semester.includes(' - Semester ')) {
        const parts = f.semester.split(' - Semester ');
        term = parts[0];
        semNum = `Semester ${parts[1]}`;
      } else if (f.semester && f.semester.includes(' - Sem ')) {
        const parts = f.semester.split(' - Sem ');
        term = parts[0];
        semNum = `Semester ${parts[1]}`;
      }
      
      const key = `${dept}_${term}_${f.totalFee || f.total_fee}`;
      if (!grouped[key]) {
        grouped[key] = {
          departmentID: dept,
          term: term,
          totalFee: f.totalFee || f.total_fee || 0,
          semesters: [],
          items: []
        };
      }
      if (semNum) {
        grouped[key].semesters.push(semNum);
      } else {
        grouped[key].semesters.push(f.semester);
      }
      grouped[key].items.push(f);
    });
    
    return Object.values(grouped).map(g => {
      // Sort semesters numerically if possible
      g.semesters.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      return g;
    });
  };

  // ----------------------------------------------------
  // STUDENT VIEW (Fee Statement)
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

    const getStudentSemester = (s) => {
      if (s.currentSemester) return parseInt(s.currentSemester);
      const batch = s.batch || '';
      if (batch.includes('Spring 2026')) return 1;
      if (batch.includes('Fall 2025')) return 2;
      if (batch.includes('Spring 2025')) return 3;
      if (batch.includes('Fall 2024')) return 4;
      if (batch.includes('Spring 2024')) return 5;
      if (batch.includes('Fall 2023')) return 6;
      if (batch.includes('Spring 2023')) return 7;
      if (batch.includes('Fall 2022')) return 8;
      return 1;
    };

    const currentSemNum = getStudentSemester(studentRecord);
    const studentProgram = studentRecord.program || '';
    const studentDeptCode = studentRecord.departmentID || getStudentDept(studentRecord);
    
    const activeTerm = 'Spring 2026';
    
    const activeStructure = feeStructures.find(fs => {
      const deptMatch = 
        fs.departmentID === studentProgram || 
        fs.department_id === studentProgram ||
        fs.departmentID === studentDeptCode || 
        fs.department_id === studentDeptCode ||
        (studentProgram.toLowerCase().includes('software') && (fs.departmentID || fs.department_id || '').toLowerCase().includes('software')) ||
        (studentProgram.toLowerCase().includes('computer') && (fs.departmentID || fs.department_id || '').toLowerCase().includes('computer'));
      
      if (!deptMatch) return false;
      
      const structureSemester = fs.semester || '';
      const semMatch = 
        structureSemester === `${activeTerm} - Semester ${currentSemNum}` ||
        structureSemester === `${activeTerm} - Sem ${currentSemNum}` ||
        (structureSemester.includes(activeTerm) && (structureSemester.includes(`Semester ${currentSemNum}`) || structureSemester.includes(`Sem ${currentSemNum}`))) ||
        structureSemester === activeTerm;
        
      return semMatch;
    });

    const totalFee = activeStructure ? (activeStructure.totalFee || activeStructure.total_fee) : 95000;
    
    // Payments
    const studentPayments = feePayments.filter(p => p.studentID === studentRecord.id || p.studentID === studentRecord.dbID || p.studentID === studentRecord.regNumber);
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
              <div style={{ fontSize: '13px', opacity: 0.8 }}>{studentRecord.regNumber || studentRecord.id}</div>
              <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Program: {studentProgram} | Current Semester: {currentSemNum}</div>
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
              <span style={{ opacity: 0.8 }}>Standard Tuition Fee ({activeTerm}):</span>
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
                    <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>+ PKR {parseFloat(p.amountPaid).toLocaleString()}</div>
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
  // FINANCE OFFICER VIEW
  // ----------------------------------------------------
  const groupedStructures = getGroupedFeeStructures();

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
        .semester-checkbox-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: var(--radius);
          border: 1px solid var(--color-border);
        }
        .semester-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          user-select: none;
        }
        .semester-checkbox-label input {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }
      `}</style>

      <div className="view-header-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Finance Portal</h1>
          <p>Configure and review standard semester fees on a department-wise basis.</p>
        </div>
        <button className="btn-primary-premium" onClick={() => setActiveForm(!activeForm)}>
          {activeForm ? 'Cancel Setup' : '+ Configure Standard Fee'}
        </button>
      </div>

      {activeForm && (
        <div className="card fade-in" style={{ marginBottom: '32px', border: '1px solid var(--color-ink)', padding: '32px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Configure Standard Fee Structure</h2>
          <form onSubmit={handleSaveStructure}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Department / Program</label>
                <select 
                  value={formData.departmentID} 
                  onChange={e => setFormData({ ...formData, departmentID: e.target.value })}
                  required
                >
                  {PROGRAMS.map(prog => <option key={prog} value={prog}>{prog}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Academic Term</label>
                <select 
                  value={formData.academicTerm} 
                  onChange={e => setFormData({ ...formData, academicTerm: e.target.value })}
                  required
                >
                  {ACADEMIC_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tuition Fee Amount (PKR)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 95000" 
                  value={formData.totalFee} 
                  onChange={e => setFormData({ ...formData, totalFee: e.target.value })} 
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Target Student Semesters (Select Multiple Semesters for the Same Fee)
              </label>
              <div className="semester-checkbox-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(semNum => (
                  <label key={semNum} className="semester-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formData.selectedSemesters.includes(semNum)}
                      onChange={() => handleSemesterToggle(semNum)}
                    />
                    Semester {semNum}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="btn-text-only" 
                style={{ padding: '12px 24px' }}
                onClick={() => setActiveForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary-premium" 
                type="submit" 
                style={{ padding: '12px 32px' }}
                disabled={isSaving}
              >
                {isSaving ? 'Configuring...' : 'Apply Fee Structure'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="finance-card-premium" style={{ marginBottom: '32px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(26, 58, 107, 0.02)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏛️</span> Active Semester-wise Standard Fee Structures
          </h3>
        </div>
        
        <div className="table-wrapper">
          <table className="min-w-table">
            <thead>
              <tr>
                <th className="finance-table-header">Department / Program</th>
                <th className="finance-table-header">Academic Term</th>
                <th className="finance-table-header">Target Semesters</th>
                <th className="finance-table-header">Standard Fee</th>
                <th className="finance-table-header" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedStructures.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <p>No standard fee structures configured for any semesters.</p>
                    </div>
                  </td>
                </tr>
              )}
              {groupedStructures.map((g, idx) => (
                <tr key={idx} className="finance-table-row">
                  <td data-label="Department / Program">
                    <div style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '14px' }}>{g.departmentID}</div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STANDARD TUITION</span>
                  </td>
                  <td data-label="Academic Term">
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>{g.term}</span>
                  </td>
                  <td data-label="Target Semesters">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {g.semesters.map((sem, sIdx) => (
                        <span key={sIdx} className="badge-premium badge-primary" style={{ fontSize: '10px', padding: '4px 8px' }}>
                          {sem}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td data-label="Standard Fee" style={{ fontWeight: 800, color: 'var(--color-accent)', fontSize: '15px' }}>
                    PKR {parseFloat(g.totalFee).toLocaleString()}
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-text-only finance-delete-btn" 
                      onClick={() => handleDeleteGroup(g)}
                    >
                      Delete
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

export default FinanceManagement;
