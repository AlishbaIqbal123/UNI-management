import React, { useState, useMemo } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const FinanceManagement = ({ finance, feePayments, setFinance, setFeePayments, user, students, departments }) => {
  const [activeForm, setActiveForm] = useState(null); // 'structure' or 'payment'
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Form States
  const [structureForm, setStructureForm] = useState({ studentId: '', totalFee: '', semester: 'Fall 2024' });
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amountPaid: '', paymentDate: new Date().toISOString().split('T')[0], reference: '' });

  const isFinanceOfficer = user.role === 'Admin' || user.role === 'Finance';

  // Calculate Summary Data
  const summaryData = useMemo(() => {
    return students.map(student => {
      const fin = finance.find(f => f.studentID === student.id || f.studentID === student.dbID || f.studentID === student.regNumber);
      const studentPayments = feePayments.filter(p => p.studentID === student.id || p.studentID === student.dbID || p.studentID === student.regNumber);
      const totalReceived = studentPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
      const totalFee = fin?.totalFee || fin?.dueAmount || 0;
      const pendingAmount = Math.max(0, totalFee - totalReceived);

      return {
        ...student,
        totalFee,
        totalReceived,
        pendingAmount,
        status: pendingAmount <= 0 && totalFee > 0 ? 'CLEARED' : 'PENDING'
      };
    });
  }, [students, finance, feePayments]);

  const filteredData = summaryData.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = batchFilter === 'All' || s.batch === batchFilter;
    const matchesDept = deptFilter === 'All' || s.program?.includes(deptFilter) || s.department_uuid === deptFilter;
    return matchesSearch && matchesBatch && matchesDept;
  });

  const handleSaveStructure = async (e) => {
    e.preventDefault();
    const { studentId, totalFee, semester } = structureForm;
    if (!studentId || !totalFee) return alert('Please fill all fields');
    
    const selectedStudent = students.find(s => s.id === studentId);
    if (!selectedStudent) return alert('Student not found');

    const newData = { 
      student_id: selectedStudent.dbID || selectedStudent.id, 
      total_fee: parseFloat(totalFee), 
      semester,
      due_amount: parseFloat(totalFee),
      fee_type: 'Tuition'
    };

    if (isDatabaseConnected()) {
      const { error } = await supabase.from('financials').upsert([newData], { onConflict: 'student_id' });
      if (error) console.error('Error saving structure:', error);
    }

    // Local update
    setFinance(prev => {
      const existing = prev.find(f => f.studentID === studentId);
      if (existing) {
        return prev.map(f => f.studentID === studentId ? { ...f, totalFee: parseFloat(totalFee), semester, dueAmount: parseFloat(totalFee) } : f);
      }
      return [...prev, { studentID: studentId, totalFee: parseFloat(totalFee), semester, dueAmount: parseFloat(totalFee) }];
    });

    setStructureForm({ studentId: '', totalFee: '', semester: 'Fall 2024' });
    setActiveForm(null);
    alert('Fee structure updated successfully');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const { studentId, amountPaid, paymentDate, reference } = paymentForm;
    if (!studentId || !amountPaid) return alert('Please fill all fields');

    const selectedStudent = students.find(s => s.id === studentId);
    if (!selectedStudent) return alert('Student not found');

    const newPayment = {
      student_id: selectedStudent.dbID || selectedStudent.id,
      amount_paid: parseFloat(amountPaid),
      payment_date: paymentDate,
      reference
    };

    if (isDatabaseConnected()) {
      const { data, error } = await supabase.from('fee_payments').insert([newPayment]).select();
      if (error) {
          console.error('Error recording payment:', error);
          return alert('Database error. Check console.');
      }
      if (data) {
          setFeePayments(prev => [...prev, { 
              id: data[0].id, 
              studentID: studentId, 
              amountPaid: parseFloat(amountPaid), 
              paymentDate, 
              reference 
          }]);
      }
    } else {
      setFeePayments(prev => [...prev, { 
          id: Date.now(), 
          studentID: studentId, 
          amountPaid: parseFloat(amountPaid), 
          paymentDate, 
          reference 
      }]);
    }

    setPaymentForm({ studentId: '', amountPaid: '', paymentDate: new Date().toISOString().split('T')[0], reference: '' });
    setActiveForm(null);
    alert('Payment recorded successfully');
  };

  // Only allow Admin/Finance to see the management view
  if (!isFinanceOfficer) {
    // Basic student view as fallback or redirected
    const myData = summaryData.find(s => s.id === user.id || s.dbID === user.id || s.regNumber === user.regNumber);
    if (!myData) return (
      <div className="view-container fade-in">
        <div className="empty-state card" style={{maxWidth: '600px', margin: '40px auto'}}>
          <div className="empty-state-icon">💰</div>
          <h2>Financial Profile Inactive</h2>
          <p>No institutional financial records were found for your candidate ID. Please contact the Finance Hub if you have recently registered.</p>
        </div>
      </div>
    );

    return (
      <div className="view-container fade-in">
        <div className="card" style={{maxWidth: '600px', margin: '40px auto'}}>
          <h1 style={{borderBottom: '2px solid var(--color-ink)', paddingBottom: '12px'}}>Fee Statement</h1>
          <div style={{display: 'flex', justifyContent: 'space-between', margin: '20px 0'}}>
            <div>
              <div style={{fontSize: '12px', opacity: 0.6}}>STUDENT</div>
              <div style={{fontWeight: 700}}>{myData.name}</div>
              <div style={{fontSize: '14px'}}>{myData.regNumber}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: '12px', opacity: 0.6}}>STATUS</div>
              <div style={{
                color: myData.status === 'CLEARED' ? 'white' : 'white',
                background: myData.status === 'CLEARED' ? 'var(--color-accent)' : 'var(--color-danger)',
                padding: '4px 12px',
                borderRadius: 'var(--radius)',
                fontWeight: 700,
                display: 'inline-block'
              }}>
                {myData.status}
              </div>
            </div>
          </div>
          <div style={{borderTop: '1px solid var(--color-border)', paddingTop: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span>Total Fee:</span>
              <span style={{fontWeight: 700}}>PKR {myData.totalFee.toLocaleString()}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span>Total Received:</span>
              <span style={{fontWeight: 700, color: 'var(--color-accent)'}}>PKR {myData.totalReceived.toLocaleString()}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-ink)', paddingTop: '8px', marginTop: '8px'}}>
              <span style={{fontWeight: 700}}>Pending Amount:</span>
              <span style={{fontWeight: 800, color: myData.pendingAmount > 0 ? 'var(--color-danger)' : 'var(--color-ink)'}}>
                PKR {myData.pendingAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <div>
          <h1>Finance Portal</h1>
          <p>Manage fee structures and student payments.</p>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          <button onClick={() => setActiveForm(activeForm === 'structure' ? null : 'structure')}>
            {activeForm === 'structure' ? 'Cancel' : '+ Set Fee Structure'}
          </button>
          <button onClick={() => setActiveForm(activeForm === 'payment' ? null : 'payment')}>
            {activeForm === 'payment' ? 'Cancel' : '+ Record Payment'}
          </button>
        </div>
      </div>

      {activeForm === 'structure' && (
        <div className="card fade-in" style={{marginBottom: '32px'}}>
          <h2>Set Fee Structure</h2>
          <form onSubmit={handleSaveStructure} style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end'}}>
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Select Student</label>
              <select 
                value={structureForm.studentId} 
                onChange={e => setStructureForm({...structureForm, studentId: e.target.value})}
              >
                <option value="">Select Student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.regNumber} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Total Fee (PKR)</label>
              <input 
                type="number" 
                placeholder="e.g. 45000" 
                value={structureForm.totalFee} 
                onChange={e => setStructureForm({...structureForm, totalFee: e.target.value})} 
              />
            </div>
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Semester</label>
              <input 
                type="text" 
                placeholder="e.g. Fall 2024" 
                value={structureForm.semester} 
                onChange={e => setStructureForm({...structureForm, semester: e.target.value})} 
              />
            </div>
            <button type="submit">Update Structure</button>
          </form>
        </div>
      )}

      {activeForm === 'payment' && (
        <div className="card fade-in" style={{marginBottom: '32px'}}>
          <h2>Record Student Payment</h2>
          <form onSubmit={handleRecordPayment} style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end'}}>
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Select Student</label>
              <select 
                value={paymentForm.studentId} 
                onChange={e => setPaymentForm({...paymentForm, studentId: e.target.value})}
              >
                <option value="">Select Student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.regNumber} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Amount (PKR)</label>
              <input 
                type="number" 
                placeholder="e.g. 20000" 
                value={paymentForm.amountPaid} 
                onChange={e => setPaymentForm({...paymentForm, amountPaid: e.target.value})} 
              />
            </div>
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Payment Date</label>
              <input 
                type="date" 
                value={paymentForm.paymentDate} 
                onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} 
              />
            </div>
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Reference (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. HBL-12345" 
                value={paymentForm.reference} 
                onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} 
              />
            </div>
            <button type="submit">Post Payment</button>
          </form>
        </div>
      )}

      <div className="card" style={{padding: '0'}}>
        <div style={{padding: '24px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--color-border)'}}>
          <input 
            style={{flex: 1}} 
            placeholder="Search by Name or Reg No..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
          <select style={{width: '200px'}} value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
            <option value="All">All Batches</option>
            {[...new Set(students.map(s => s.batch))].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select style={{width: '200px'}} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
          </select>
        </div>
        
        <div className="table-wrapper">
          <table className="min-w-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg No</th>
                <th>Total Fee</th>
                <th>Total Received</th>
                <th>Pending</th>
                <th>Status</th>
              </tr>
            </thead>
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <p>No financial records match your current search criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredData.map(s => (
                <tr key={s.id}>
                  <td><div style={{fontWeight: 600}}>{s.name}</div></td>
                  <td><span style={{fontFamily: 'monospace', fontSize: '13px'}}>{s.regNumber}</span></td>
                  <td>PKR {s.totalFee.toLocaleString()}</td>
                  <td style={{color: 'var(--color-accent)', fontWeight: 600}}>PKR {s.totalReceived.toLocaleString()}</td>
                  <td style={{color: s.pendingAmount > 0 ? 'var(--color-danger)' : 'var(--color-ink)', fontWeight: 700}}>
                    PKR {s.pendingAmount.toLocaleString()}
                  </td>
                  <td>
                    <span style={{
                      color: 'white',
                      background: s.status === 'CLEARED' ? 'var(--color-accent)' : 'var(--color-danger)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius)',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {s.status}
                    </span>
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
