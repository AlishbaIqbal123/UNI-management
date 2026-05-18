import React, { useState, useEffect } from 'react';

const ROLES = { ADMIN: 'Admin', STUDENT: 'Student', FACULTY: 'Faculty', FINANCE: 'Finance' };

const Login = ({ onLogin, loginError, setLoginError, setStep, loginStep, authData, setAuthData, regSubStep, setRegSubStep, handleRegister, theme, toggleTheme, onInitiateRecovery, notify }) => {
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    if (loginStep !== 'forgot') {
      setRecoveryRequested(false);
      setConfirmChecked(false);
    }
  }, [loginStep]);

  const handleRegNumberChange = (val) => {
    const formatted = val.toUpperCase();
    
    let parsedProgram = '';
    let parsedBatch = '';
    
    // Parse intake session and year (e.g. FA20 -> Fall 2020)
    const batchMatch = formatted.match(/^(FA|SP)(\d{2})/i);
    if (batchMatch) {
      const term = batchMatch[1].toUpperCase() === 'FA' ? 'Fall' : 'Spring';
      const year = '20' + batchMatch[2];
      parsedBatch = `${term} ${year}`;
    }
    
    // Parse HEC degree program code (e.g. BCS -> BS Computer Science)
    const progMatch = formatted.match(/^(?:FA|SP)\d{2}-([A-Z]{3,4})/i);
    if (progMatch) {
      const progCode = progMatch[1].toUpperCase();
      if (progCode === 'BCS') parsedProgram = 'BS Computer Science';
      else if (progCode === 'BSE') parsedProgram = 'BS Software Engineering';
      else if (progCode === 'BBA') parsedProgram = 'BS Business Administration';
      else if (progCode === 'BAF') parsedProgram = 'BS Accounting & Finance';
      else if (progCode === 'BMT') parsedProgram = 'BS Mathematics';
      else if (progCode === 'BVS') parsedProgram = 'BS Environmental Sciences';
      else if (progCode === 'BEN') parsedProgram = 'BS English';
      else if (progCode === 'BEC') parsedProgram = 'BS Economics';
      else parsedProgram = `BS ${progCode}`;
    }
    
    setAuthData(prev => ({
      ...prev,
      regNumber: formatted,
      program: parsedProgram || prev.program,
      batch: parsedBatch || prev.batch
    }));
  };

  const validateStep1 = () => {
    if (!authData.name) {
      if (notify) notify("Please enter your Full Name.", "error");
      else alert("Please enter your Full Name.");
      return;
    }
    if (!authData.email) {
      if (notify) notify("Please enter your Official Email Address.", "error");
      else alert("Please enter your Official Email Address.");
      return;
    }
    if (!authData.regNumber) {
      if (notify) notify("Please enter your Registration Number.", "error");
      else alert("Please enter your Registration Number.");
      return;
    }
    
    const regPattern = /^(FA|SP)\d{2}-[A-Z]{3,4}-\d{3}$/i;
    if (!regPattern.test(authData.regNumber)) {
      if (notify) {
        notify("Invalid Registration Number format. Hint: [IntakeSession][IntakeYear]-[DegreeCode]-[RollNo] (e.g. FA20-BCS-001)", "error");
      } else {
        alert("Invalid Registration Number. Must match format: [IntakeSession][IntakeYear]-[DegreeCode]-[RollNo] (e.g. FA20-BCS-001)");
      }
      return;
    }
    
    setRegSubStep(2);
  };

  const isInvertedBtn = {
    background: 'var(--color-ink)',
    color: 'var(--color-bg)',
    width: '100%',
    padding: '14px',
    fontSize: '14px',
    marginTop: '24px',
    border: 'none',
    boxShadow: 'var(--shadow)'
  };

  return (
    <div className="login-page-container" style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--color-bg)',
      position: 'relative'
    }}>
      <button 
        className="btn-icon-premium" 
        onClick={toggleTheme} 
        title="Toggle Theme" 
        style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {/* Left Column: Branding */}
      <div className="login-branding-col" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        borderRight: '2px solid var(--color-ink)',
        background: 'var(--color-card)',
        backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }}>
        <img 
          src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" 
          alt="COMSATS" 
          style={{ width: '120px', marginBottom: '32px' }} 
        />
        <h1 style={{ fontSize: '64px', lineHeight: 1, marginBottom: '24px' }}>CUI VEHARI</h1>
        <p style={{ fontSize: '20px', maxWidth: '400px', opacity: 0.8, fontFamily: 'var(--font-body)' }}>
          Institutional Access Gateway for the University Management System. Secure and centralized authentication for students, faculty, and administration.
        </p>
        <div style={{ marginTop: 'auto', fontSize: '12px', opacity: 0.5 }}>
          © 2026 COMSATS University Islamabad, Vehari Campus.
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="login-form-col" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div className="login-card-premium" style={{
          width: '100%',
          maxWidth: '450px',
          padding: '48px',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius)'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>System Gateway</h2>
          <p style={{ marginBottom: '32px', opacity: 0.6, fontSize: '14px' }}>Please authenticate using your institutional credentials.</p>

          {loginStep === 'choice' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['admin', 'student', 'faculty', 'finance'].map(role => (
                  <button 
                    key={role}
                    style={{ padding: '16px', textTransform: 'uppercase', fontSize: '11px' }}
                    onClick={() => setStep(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="mt-24" style={{ 
                padding: '20px', 
                background: 'var(--color-bg)', 
                border: '1px solid var(--color-border)',
                fontSize: '12px'
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 700, opacity: 0.5 }}>DEMO ACCESS KEYS</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <span>Admin: ADMIN/admin</span>
                  <span>Student: FA24-BCS-055/123</span>
                  <span>Faculty: VHR-F-001/123</span>
                  <span>Finance: FIN1/admin</span>
                </div>
              </div>
              <p className="mt-24" style={{ textAlign: 'center', fontSize: '14px' }}>
                Are you a student? <span style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setStep('register')}>Student Sign Up</span>
              </p>
            </div>
          )}

          {(['admin', 'student', 'faculty', 'finance', 'forgot'].includes(loginStep)) && (
            <div className="fade-in">
              <h3 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '24px', color: 'var(--color-accent)' }}>
                {loginStep === 'forgot' ? 'Account Recovery' : `${loginStep} Authentication`}
              </h3>
              
              {loginError && (
                <div className="fade-in" style={{
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius)', 
                  padding: '12px 16px', 
                  marginBottom: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}
              
              {loginStep === 'forgot' && recoveryRequested ? (
                <div className="fade-in" style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
                  <h4 style={{ fontSize: '18px', color: 'var(--color-ink)', marginBottom: '12px', fontWeight: 700 }}>Request Submitted</h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8, marginBottom: '24px' }}>
                    A secure password reset request has been logged. 
                    <strong style={{ display: 'block', marginTop: '12px', color: 'var(--color-accent)', fontSize: '15px' }}>
                      Please visit the Admin Office to get your new password.
                    </strong>
                  </p>
                  <button 
                    style={isInvertedBtn} 
                    onClick={() => {
                      setRecoveryRequested(false);
                      setConfirmChecked(false);
                      setStep('choice');
                    }}
                  >
                    Return to Choice
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                      {loginStep === 'forgot' ? 'Registration No. / Email Address' : 'Identification'}
                    </label>
                    <input 
                      autoFocus 
                      placeholder={loginStep === 'forgot' ? "Enter your Reg No (Student) or Email (Staff)" : "Institutional ID / Registration No"} 
                      value={authData.id} 
                      onChange={e => {
                        setAuthData({...authData, id: e.target.value});
                        if (setLoginError) setLoginError(null);
                      }} 
                      onKeyDown={e => e.key === 'Enter' && loginStep !== 'forgot' && onLogin(ROLES[loginStep.toUpperCase()])}
                    />
                  </div>
                  
                  {loginStep !== 'forgot' ? (
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Security Key</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={authData.password} 
                        onChange={e => {
                          setAuthData({...authData, password: e.target.value});
                          if (setLoginError) setLoginError(null);
                        }} 
                        onKeyDown={e => e.key === 'Enter' && onLogin(ROLES[loginStep.toUpperCase()])}
                      />
                      <div style={{ textAlign: 'right', marginTop: '8px' }}>
                        <span style={{ fontSize: '12px', cursor: 'pointer', opacity: 0.6 }} onClick={() => setStep('forgot')}>Forgot Key?</span>
                      </div>
                    </div>
                  ) : (
                    <div className="fade-in">
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '4px' }}>
                        <input 
                          type="checkbox" 
                          id="confirm-reset" 
                          checked={confirmChecked} 
                          onChange={e => setConfirmChecked(e.target.checked)} 
                          style={{ width: 'auto', marginTop: '4px', cursor: 'pointer' }}
                        />
                        <label htmlFor="confirm-reset" style={{ fontSize: '13px', lineHeight: '1.4', cursor: 'pointer', opacity: 0.9 }}>
                          I confirm that I really want to request to reset my account password.
                        </label>
                      </div>
                    </div>
                  )}

                  <button 
                    style={{
                      ...isInvertedBtn,
                      opacity: (loginStep !== 'forgot' || (confirmChecked && authData.id?.trim())) ? 1 : 0.6,
                      cursor: (loginStep !== 'forgot' || (confirmChecked && authData.id?.trim())) ? 'pointer' : 'not-allowed'
                    }}
                    disabled={loginStep === 'forgot' && (!confirmChecked || !authData.id?.trim())}
                    onClick={async () => {
                      if (loginStep === 'forgot') {
                        if (!authData.id || !authData.id.trim()) {
                          if (notify) notify("Please enter your Registration Number / Email first.", "error");
                          else alert("Please enter your Registration Number / Email first.");
                          return;
                        }
                        if (!confirmChecked) {
                          if (notify) notify("Please confirm your reset request.", "warning");
                          else alert("Please confirm your reset request.");
                          return;
                        }
                        if (onInitiateRecovery) {
                          const success = await onInitiateRecovery(authData.id.trim());
                          if (success) {
                            setRecoveryRequested(true);
                          }
                        } else {
                          setRecoveryRequested(true);
                        }
                      } else {
                        onLogin(ROLES[loginStep.toUpperCase()]);
                      }
                    }}
                  >
                    {loginStep === 'forgot' ? 'Confirm Reset Request' : 'Authorize Access'}
                  </button>
                  
                  <button 
                    className="btn-text-only" 
                    style={{ width: '100%', marginTop: '8px', color: 'var(--color-ink)' }} 
                    onClick={() => setStep('choice')}
                  >
                    ← Return to Choice
                  </button>
                </div>
              )}
            </div>
          )}

          {loginStep === 'register' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Student Sign Up (Step {regSubStep}/4)</h3>
                <span style={{ fontSize: '12px', opacity: 0.5 }}>Step {regSubStep} of 4</span>
              </div>
              
              <div style={{ height: '2px', background: 'var(--color-border)', marginBottom: '32px' }}>
                <div style={{ width: `${regSubStep * 25}%`, height: '100%', background: 'var(--color-accent)', transition: 'width 0.3s ease' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {regSubStep === 1 && (
                  <>
                    <input placeholder="Full Name" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
                    <input placeholder="Official Email Address" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
                    <input placeholder="Registration Number (e.g. FA20-BCS-001)" value={authData.regNumber || ''} onChange={e => handleRegNumberChange(e.target.value)} />
                    <button style={isInvertedBtn} onClick={validateStep1}>Continue</button>
                  </>
                )}
                {regSubStep === 2 && (
                  <>
                    <div style={{ 
                      padding: '16px', 
                      background: 'rgba(74, 103, 133, 0.1)', 
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      fontSize: '13px',
                      textAlign: 'left'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, opacity: 0.6, fontSize: '10px', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Parsed Academic Program</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{authData.program || 'Pending Detection'}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, opacity: 0.6, fontSize: '10px', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>Parsed Batch / Session</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{authData.batch || 'Pending Detection'}</span>
                      </div>
                    </div>
                    <input placeholder="Previous Institute Name" value={authData.instName} onChange={e => setAuthData({...authData, instName: e.target.value})} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-text-only" style={{ flex: 1 }} onClick={() => setRegSubStep(1)}>Back</button>
                      <button style={{ ...isInvertedBtn, flex: 2, marginTop: 0 }} onClick={() => setRegSubStep(3)}>Next</button>
                    </div>
                  </>
                )}
                {regSubStep === 3 && (
                  <>
                    <div style={{ border: '2px dashed var(--color-border)', padding: '32px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '13px' }}>Upload Academic Certificates</p>
                      <input type="file" style={{ fontSize: '11px', marginTop: '12px' }} />
                    </div>
                    <input placeholder="Entrance Test Score (NTS/GAT)" value={authData.testScore} onChange={e => setAuthData({...authData, testScore: e.target.value})} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-text-only" style={{ flex: 1 }} onClick={() => setRegSubStep(2)}>Back</button>
                      <button style={{ ...isInvertedBtn, flex: 2, marginTop: 0 }} onClick={() => setRegSubStep(4)}>Next</button>
                    </div>
                  </>
                )}
                {regSubStep === 4 && (
                  <>
                    <input placeholder="CNIC / Identity Number" value={authData.cnic} onChange={e => setAuthData({...authData, cnic: e.target.value})} />
                    <input type="password" placeholder="Create Account Password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-text-only" style={{ flex: 1 }} onClick={() => setRegSubStep(3)}>Back</button>
                      <button style={{ ...isInvertedBtn, flex: 2, marginTop: 0 }} onClick={handleRegister}>Finalize Account</button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn-text-only" style={{ width: '100%', marginTop: '16px' }} onClick={() => setStep('choice')}>Abort Sign Up</button>
            </div>
          )}

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
             <button 
               className="btn-text-only" 
               style={{ fontSize: '11px', opacity: 0.5 }} 
               onClick={() => { if(confirm("Clear system cache?")) { localStorage.clear(); window.location.reload(); } }}
             >
                institutional cache reset v2.4.0
             </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .login-branding-col { display: none !important; }
          .login-form-col { flex: 1 !important; background: var(--color-bg) !important; padding: 16px !important; }
          .login-card-premium { padding: 32px !important; }
        }
      `}} />
    </div>
  );
};

export default Login;
