import React, { useState } from 'react';
import { exportToCSV, generateInstitutionalReport } from '../lib/exportUtils';

const FinanceManagement = ({ finance, user, students, setFinance, openForm }) => {
  const [batchFilter, setBatchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const isFinanceOfficer = user.role === 'Admin' || user.role === 'Finance';
  
  const filteredFinance = finance.filter(f => {
    const student = students.find(s => s.id === f.studentID || s.dbID === f.studentID);
    const batchMatches = batchFilter === 'All' || student?.batch === batchFilter;
    const statusMatches = statusFilter === 'All' || 
                         (statusFilter === 'Cleared' && (f.dueAmount || 0) === 0) || 
                         (statusFilter === 'Pending' && (f.dueAmount || 0) > 0);
    const searchMatches = (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student?.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student?.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.studentID.toLowerCase().includes(searchTerm.toLowerCase());
                          
    return isFinanceOfficer ? (batchMatches && statusMatches && searchMatches) : (f.studentID === user.id || f.studentID === user.dbID);
  });

  const generateReport = (type) => {
    const data = filteredFinance.map(f => {
        const student = students.find(s => s.id === f.studentID);
        return {
            'Student ID': f.studentID,
            'Name': student?.name || 'N/A',
            'Batch': student?.batch || 'N/A',
            'Paid': f.amountPaid,
            'Due': f.dueAmount,
            'Status': f.dueAmount === 0 ? 'Cleared' : 'Pending'
        };
    });
    
    if (type === 'CSV') {
        exportToCSV(data, `Finance_Report_${batchFilter}_${statusFilter}`);
    } else {
        generateInstitutionalReport(`Institutional Finance Report - ${batchFilter}`, 
            ['Student ID', 'Name', 'Batch', 'Paid', 'Due', 'Status'],
            data
        );
    }
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Financial Operations</h1>
          <p>{isFinanceOfficer ? 'Institutional ledger management and reporting exports.' : 'Personal fee statements and payment history.'}</p>
        </div>
        {isFinanceOfficer && (
          <div style={{display:'flex', gap:'10px'}}>
             <button className="btn-text-only" onClick={() => generateReport('CSV')}>📊 CSV</button>
             <button className="btn-primary-premium" onClick={() => generateReport('PDF')}>📄 PDF Report</button>
             <button className="btn-primary-premium" style={{background:'var(--success)'}} onClick={() => openForm('payment')}>+ Record Payment</button>
          </div>
        )}
      </div>

      {isFinanceOfficer && (
        <div className="glass-card mb-24" style={{display:'flex', gap:'20px', alignItems:'center', flexWrap:'wrap'}}>
            <div style={{display:'flex', flexDirection:'column', gap:'4px', flex:1}}>
                <span style={{fontSize:'12px', opacity:0.6}}>🔍 Search Student</span>
                <input 
                  className="input-premium" 
                  placeholder="Enter Name or ID..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                <span style={{fontSize:'12px', opacity:0.6}}>Filter by Batch</span>
                <select className="input-premium" style={{width:'180px'}} value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
                    <option value="All">All Batches</option>
                    <option value="Fall 2024">Fall 2024</option>
                    <option value="Spring 2025">Spring 2025</option>
                </select>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                <span style={{fontSize:'12px', opacity:0.6}}>Filter by Status</span>
                <select className="input-premium" style={{width:'180px'}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Cleared">Cleared Only</option>
                    <option value="Pending">Pending Only</option>
                </select>
            </div>
            <div style={{marginLeft:'auto', textAlign:'right'}}>
                <span style={{fontSize:'12px', opacity:0.6}}>Total Outstanding</span>
                <h3 style={{color:'#ef4444', margin:0}}>
                    PKR {students.reduce((acc, s) => {
                        const f = finance.find(fin => fin.studentID === s.id || fin.studentID === s.dbID);
                        return acc + (f ? f.dueAmount : 45000);
                    }, 0).toLocaleString()}
                </h3>
            </div>
        </div>
      )}

      {!isFinanceOfficer && (
        <div className="finance-student-view fade-in">
           {students.filter(s => {
               const isOwnRecord = s.id === user.id || s.dbID === user.id || (s.regNumber && s.regNumber === user.regNumber);
               return isOwnRecord;
           }).map(s => {
               const f = finance.find(fin => fin.studentID === s.id || fin.studentID === s.dbID || fin.studentID === s.regNumber) || 
                         { amountPaid: 0, dueAmount: 45000, studentID: s.id, isDefault: true };
               
               return (
                 <div key={s.id} className="glass-card p-40" style={{maxWidth:'800px', margin:'0 auto'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px', borderBottom:'1px solid var(--glass-border)', paddingBottom:'24px'}}>
                       <div>
                          <h2 style={{color:'var(--accent)', fontSize:'24px', margin:0}}>OFFICIAL FEE STATEMENT</h2>
                          <p style={{opacity:0.6, fontSize:'14px', marginTop:'4px'}}>Fiscal Year 2024-2025 | Fall Semester</p>
                       </div>
                       <div className={`badge-premium ${f.dueAmount === 0 ? 'badge-primary' : ''}`} style={{background: f.dueAmount === 0 ? '' : 'rgba(239,68,68,0.2)', color: f.dueAmount === 0 ? '' : '#ef4444', padding:'8px 20px', fontSize:'14px'}}>
                          {f.dueAmount === 0 ? 'CLEARED' : 'PENDING'}
                       </div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px', marginBottom:'40px'}}>
                       <div className="info-block">
                          <label style={{fontSize:'12px', opacity:0.5, textTransform:'uppercase', letterSpacing:'1px'}}>Student Identification</label>
                          <div style={{fontSize:'18px', fontWeight:600, color:'var(--text-main)', marginTop:'8px'}}>{s.name}</div>
                          <div style={{fontSize:'14px', opacity:0.8, marginTop:'4px'}}>{s.regNumber || s.id}</div>
                          <div style={{fontSize:'12px', opacity:0.6, marginTop:'2px'}}>{s.program} | {s.batch}</div>
                       </div>
                       <div style={{textAlign:'right'}}>
                          <label style={{fontSize:'12px', opacity:0.5, textTransform:'uppercase', letterSpacing:'1px'}}>Account Summary</label>
                          <div style={{marginTop:'12px'}}>
                             <div style={{display:'flex', justifyContent:'flex-end', gap:'16px', marginBottom:'8px'}}>
                                <span style={{opacity:0.6}}>Amount Paid:</span>
                                <span style={{color:'var(--success)', fontWeight:700}}>PKR {f.amountPaid.toLocaleString()}</span>
                             </div>
                             <div style={{display:'flex', justifyContent:'flex-end', gap:'16px', fontSize:'20px'}}>
                                <span style={{opacity:0.8}}>Total Due:</span>
                                <span style={{color: f.dueAmount > 0 ? '#ef4444' : 'var(--text-dim)', fontWeight:800}}>PKR {f.dueAmount.toLocaleString()}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div style={{background:'rgba(255,255,255,0.03)', borderRadius:'12px', padding:'24px', border:'1px dashed var(--glass-border)'}}>
                       <h4 style={{fontSize:'14px', marginBottom:'12px'}}>Important Instructions:</h4>
                       <ul style={{fontSize:'13px', opacity:0.7, paddingLeft:'20px', display:'flex', flexDirection:'column', gap:'8px'}}>
                          <li>Fee must be deposited in any branch of Habib Bank Limited (HBL) using the University Challan.</li>
                          <li>Course registration is only permitted after 100% financial clearance.</li>
                          <li>In case of discrepancy, please visit the Finance Office (Adnan Ahmed) with proof of payment.</li>
                       </ul>
                    </div>

                    <div style={{marginTop:'32px', textAlign:'center'}}>
                       <button className="btn-primary-premium" onClick={() => window.print()}>🖨️ Download Fee Challan (PDF)</button>
                    </div>
                 </div>
               );
           })}
           {students.filter(s => s.id === user.id || s.dbID === user.id || (s.regNumber && s.regNumber === user.regNumber)).length === 0 && (
              <div className="glass-card p-40 text-center">
                 <h2 style={{opacity:0.5}}>No Financial Profile Found</h2>
                 <p style={{opacity:0.4}}>Please contact the registrar's office to initialize your financial registry.</p>
              </div>
           )}
        </div>
      )}

      {isFinanceOfficer && (
        <div className="table-card-premium glass-card">
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student Tracking</th>
                  <th>Paid Amount</th>
                  <th>Outstanding</th>
                  <th>Institutional Status</th>
                  <th className="text-right">Reference</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => {
                    const searchMatches = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         (s.regNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         (s.id || '').toLowerCase().includes(searchTerm.toLowerCase());
                    const batchMatches = batchFilter === 'All' || s.batch === batchFilter;
                    
                    const f = finance.find(fin => fin.studentID === s.id || fin.studentID === s.dbID);
                    const statusMatches = statusFilter === 'All' || 
                                         (statusFilter === 'Cleared' && (f?.dueAmount || 0) === 0 && f) || 
                                         (statusFilter === 'Pending' && ((f?.dueAmount || 0) > 0 || !f));
                    
                    return searchMatches && batchMatches && statusMatches;
                }).map(s => {
                    const f = finance.find(fin => fin.studentID === s.id || fin.studentID === s.dbID) || 
                              { amountPaid: 0, dueAmount: 45000, studentID: s.id, isDefault: true };
                    
                    return (
                      <tr key={s.dbID || s.id}>
                        <td>
                          <div className="user-info-cell">
                            <span className="user-name-cell" style={{fontWeight:600, color:'var(--text-main)', fontSize:'15px'}}>{s.name}</span>
                            <span className="font-monospace" style={{fontSize:'12px', fontWeight:600, color:'var(--accent)', background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:'4px'}}>
                              {s.regNumber || `FA24-BCS-${s.id.replace('S', '')}`}
                            </span>
                          </div>
                        </td>
                        <td style={{color:'var(--success)', fontWeight:700}}>PKR {f.amountPaid.toLocaleString()}</td>
                        <td style={{color:f.dueAmount > 0 ? '#ef4444' : 'var(--text-dim)'}}>PKR {f.dueAmount.toLocaleString()}</td>
                        <td>
                          <span className={`badge-premium ${f.dueAmount === 0 ? 'badge-primary' : ''}`} style={{background: f.dueAmount === 0 ? '' : 'rgba(239,68,68,0.2)', color: f.dueAmount === 0 ? '' : '#ef4444'}}>
                              {f.dueAmount === 0 ? 'CLEARED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="text-right">
                            <button className="btn-text-only" style={{fontSize:'11px'}} onClick={() => openForm('payment', f)}>Edit</button>
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
