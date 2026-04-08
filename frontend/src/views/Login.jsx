import React, { useState } from 'react';

const ROLES = { ADMIN: 'Admin', STUDENT: 'Student', FACULTY: 'Faculty', FINANCE: 'Finance' };

const Login = ({ onLogin, setStep, loginStep, authData, setAuthData, regSubStep, setRegSubStep, handleRegister }) => {
  return (
    <div className="login-screen-premium fade-in">
      <div className="login-card-premium">
        <img src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="COMSATS" style={{width:'80px', height:'80px', margin:'0 auto 24px', display:'block', objectFit:'contain'}} />
        <h1>System Gateway</h1>
        
        {loginStep === 'choice' && (
          <div className="role-buttons-premium">
            <div className="role-chips">
              <div className="role-chip" onClick={() => setStep('admin')}>Admin</div>
              <div className="role-chip" onClick={() => setStep('student')}>Student</div>
              <div className="role-chip" onClick={() => setStep('faculty')}>Faculty</div>
              <div className="role-chip" style={{border: '1px solid var(--accent)'}} onClick={() => setStep('finance')}>Finance</div>
            </div>
            <div className="credentials-tip mt-24" style={{fontSize: '12px', opacity: 0.8, background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px'}}>
                <p><strong>Admin:</strong> ADMIN / admin</p>
                <p><strong>Student:</strong> A01 / 123</p>
                <p><strong>Faculty:</strong> F1 / 123</p>
                <p><strong>Finance:</strong> FIN1 / admin</p>
            </div>

            <p className="mt-24" style={{opacity: 0.7}}>New to the university? <span className="link-gold" style={{color: 'var(--accent)', cursor: 'pointer', fontWeight: '700'}} onClick={() => setStep('register')}>Apply Now</span></p>
          </div>
        )}

        {(['admin', 'student', 'faculty', 'finance', 'forgot'].includes(loginStep)) && (
          <div className="form-group-premium">
            {loginStep === 'forgot' ? (
              <>
                <h2 style={{fontSize: '18px', marginBottom: '16px', opacity: 0.8}}>RECOVER ACCESS</h2>
                <label>Institutional Identifier</label>
                <input autoFocus className="input-premium" placeholder="e.g. FA24-BCS-001" value={authData.id} onChange={e => setAuthData({...authData, id: e.target.value})} />
                <label>Verification Token / Security Answer</label>
                <input className="input-premium" placeholder="Enter last 4 digits of Phone" value={authData.securityToken || ''} onChange={e => setAuthData({...authData, securityToken: e.target.value})} />
                <button className="btn-login-premium mt-12" onClick={() => { alert("Recovery Key Sent to Personal Email: " + (authData.id ? "z****@gmail.com" : "N/A")); setStep('choice'); }}>Initiate Reset Cycle</button>
              </>
            ) : (
              <>
                <h2 style={{fontSize: '18px', marginBottom: '16px', opacity: 0.8}}>{loginStep.toUpperCase()} LOGIN</h2>
                <label>Identification</label>
                <input 
                  autoFocus 
                  className="input-premium"
                  placeholder="Enter ID or Email" 
                  value={authData.id} 
                  onChange={e => setAuthData({...authData, id: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && onLogin(ROLES[loginStep.toUpperCase()])}
                />
                <label>Security Key</label>
                <input 
                  className="input-premium"
                  placeholder="Enter Password" 
                  type="password" 
                  value={authData.password} 
                  onChange={e => setAuthData({...authData, password: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && onLogin(ROLES[loginStep.toUpperCase()])}
                />
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px'}}>
                    <span className="link-gold" style={{fontSize:'12px', cursor:'pointer', opacity:0.8}} onClick={() => setStep('forgot')}>Forgot Security Key?</span>
                </div>
                <button className="btn-login-premium" style={{marginTop:'24px'}} onClick={() => onLogin(ROLES[loginStep.toUpperCase()])}>Authorize Access</button>
              </>
            )}
            <button className="btn-icon-premium" style={{color: 'white', marginTop: '12px'}} onClick={() => setStep('choice')}>← Go Back</button>
          </div>
        )}


        {loginStep === 'register' && (
          <div className="form-group-premium registration-wizard">
            <div className="wizard-header">
              <h2>ADMISSION {regSubStep}/4</h2>
              <div className="progress-track" style={{height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '8px', borderRadius: '4px'}}>
                <div style={{width: `${regSubStep * 25}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.3s ease'}}></div>
              </div>
            </div>
            
            <div className="mt-24">
              {regSubStep === 1 && (
                <div className="wizard-step">
                  <input className="input-premium" placeholder="Full Candidate Name" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
                  <input className="input-premium mt-12" style={{marginTop:'12px'}} placeholder="Email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
                  <button className="btn-login-premium w-full" onClick={() => setRegSubStep(2)}>Continue</button>
                </div>
              )}
              {regSubStep === 2 && (
                <div className="wizard-step">
                  <select className="input-premium" style={{background: 'var(--surface-container-high)', color:'white'}} value={authData.program || ''} onChange={e => setAuthData({...authData, program: e.target.value})}>
                    <option value="" disabled>Target Identification</option>
                    <option value="BS Computer Science">Admission: BS Computer Science</option>
                    <option value="BS Software Engineering">Admission: BS Software Engineering</option>
                    <option value="BS Business Administration">Admission: BS Business Administration</option>
                    <option value="Faculty Applicant">Staff: Faculty Applicant</option>
                  </select>
                  <input className="input-premium mt-12" style={{marginTop:'12px'}} placeholder="Previous Institute Name" value={authData.instName} onChange={e => setAuthData({...authData, instName: e.target.value})} />
                  <div style={{display:'flex', gap:'12px', marginTop:'16px'}}>
                    <button className="btn-icon-premium" style={{color:'white'}} onClick={() => setRegSubStep(1)}>Back</button>
                    <button className="btn-login-premium" style={{flex:1}} onClick={() => setRegSubStep(3)}>Next</button>
                  </div>
                </div>
              )}
              {regSubStep === 3 && (
                <div className="wizard-step">
                  <div className="file-upload-zone" style={{border: '1px dashed var(--glass-border)', padding: '24px', borderRadius: '12px', textAlign: 'center'}}>
                    <p style={{fontSize: '14px', color:'white', marginBottom:'12px'}}>Upload Matric/HSSC Certificates (PDF/JPG)</p>
                    <input type="file" onChange={(e) => setAuthData({...authData, docFile: e.target.files[0]})} style={{fontSize: '12px', color: 'var(--text-dim)'}} />
                  </div>
                  <input className="input-premium mt-12" style={{marginTop:'12px'}} placeholder="Entrance Test Score (GAT/NAT)" value={authData.testScore} onChange={e => setAuthData({...authData, testScore: e.target.value})} />
                  <div style={{display:'flex', gap:'12px', marginTop:'16px'}}>
                    <button className="btn-icon-premium" style={{color:'white'}} onClick={() => setRegSubStep(2)}>Back</button>
                    <button className="btn-login-premium" style={{flex:1}} onClick={() => setRegSubStep(4)}>Next</button>
                  </div>
                </div>
              )}
              {regSubStep === 4 && (
                <div className="wizard-step">
                  <input className="input-premium" placeholder="CNIC Number" value={authData.cnic} onChange={e => setAuthData({...authData, cnic: e.target.value})} />
                  <input className="input-premium mt-12" style={{marginTop:'12px', marginBottom:'16px'}} placeholder="Create Password" type="password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
                  <button className="btn-login-premium w-full" onClick={handleRegister}>Finalize Admission</button>
                </div>
              )}
            </div>
            <button className="btn-icon-premium" style={{color: 'white', marginTop: '16px'}} onClick={() => setStep('choice')}>Abort Application</button>
          </div>
        )}
        <div className="login-footer-premium" style={{marginTop:'auto', paddingTop:'32px', borderTop:'1px solid var(--glass-border)', textAlign:'center'}}>
           <p style={{fontSize:'12px', opacity:0.5}}>Secure Gateway v2.4.0 (COMSATS Unit)</p>
           <button 
             className="btn-text-only" 
             style={{fontSize:'11px', color:'var(--accent)', marginTop:'8px', cursor:'pointer'}} 
             onClick={() => { if(confirm("This will clear local cache and reload. Proceed?")) { localStorage.clear(); window.location.reload(); } }}>
             Troubleshoot: Reset Institutional Cache
           </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

