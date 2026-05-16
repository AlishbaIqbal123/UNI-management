import React from 'react';

const ROLES = { ADMIN: 'Admin', STUDENT: 'Student', FACULTY: 'Faculty', FINANCE: 'Finance' };

const Login = ({ onLogin, setStep, loginStep, authData, setAuthData, regSubStep, setRegSubStep, handleRegister }) => {
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
      background: 'var(--color-bg)'
    }}>
      {/* Left Column: Branding */}
      <div className="login-branding-col" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        borderRight: '2px solid var(--color-ink)',
        background: 'var(--surface-container-high)',
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
          background: 'white',
          border: '1px solid var(--color-ink)',
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
                  <span>Student: S001/123</span>
                  <span>Faculty: VHR-F-001/123</span>
                  <span>Finance: FIN1/admin</span>
                </div>
              </div>
              <p className="mt-24" style={{ textAlign: 'center', fontSize: '14px' }}>
                New candidate? <span style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setStep('register')}>Apply for Admission</span>
              </p>
            </div>
          )}

          {(['admin', 'student', 'faculty', 'finance', 'forgot'].includes(loginStep)) && (
            <div className="fade-in">
              <h3 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '24px', color: 'var(--color-accent)' }}>
                {loginStep === 'forgot' ? 'Account Recovery' : `${loginStep} Authentication`}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Identification</label>
                  <input 
                    autoFocus 
                    placeholder="Institutional ID / Registration No" 
                    value={authData.id} 
                    onChange={e => setAuthData({...authData, id: e.target.value})} 
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
                      onChange={e => setAuthData({...authData, password: e.target.value})} 
                      onKeyDown={e => e.key === 'Enter' && onLogin(ROLES[loginStep.toUpperCase()])}
                    />
                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', cursor: 'pointer', opacity: 0.6 }} onClick={() => setStep('forgot')}>Forgot Key?</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Security Token</label>
                    <input placeholder="Enter last 4 digits of Phone" value={authData.securityToken || ''} onChange={e => setAuthData({...authData, securityToken: e.target.value})} />
                  </div>
                )}
              </div>

              <button 
                style={isInvertedBtn}
                onClick={() => {
                  if (loginStep === 'forgot') {
                    alert("Recovery protocol initiated. Check your primary email.");
                    setStep('choice');
                  } else {
                    onLogin(ROLES[loginStep.toUpperCase()]);
                  }
                }}
              >
                {loginStep === 'forgot' ? 'Initiate Recovery' : 'Authorize Access'}
              </button>
              
              <button 
                className="btn-text-only" 
                style={{ width: '100%', marginTop: '16px', color: 'var(--color-ink)' }} 
                onClick={() => setStep('choice')}
              >
                ← Return to Choice
              </button>
            </div>
          )}

          {loginStep === 'register' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Admission {regSubStep}/4</h3>
                <span style={{ fontSize: '12px', opacity: 0.5 }}>Step {regSubStep} of 4</span>
              </div>
              
              <div style={{ height: '2px', background: 'var(--color-border)', marginBottom: '32px' }}>
                <div style={{ width: `${regSubStep * 25}%`, height: '100%', background: 'var(--color-accent)', transition: 'width 0.3s ease' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {regSubStep === 1 && (
                  <>
                    <input placeholder="Full Candidate Name" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
                    <input placeholder="Official Email Address" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
                    <button style={isInvertedBtn} onClick={() => setRegSubStep(2)}>Continue</button>
                  </>
                )}
                {regSubStep === 2 && (
                  <>
                    <select value={authData.program || ''} onChange={e => setAuthData({...authData, program: e.target.value})}>
                      <option value="" disabled>Select Academic Program</option>
                      <option value="BS Computer Science">BS Computer Science</option>
                      <option value="BS Software Engineering">BS Software Engineering</option>
                      <option value="BS Business Administration">BS Business Administration</option>
                    </select>
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
                      <button style={{ ...isInvertedBtn, flex: 2, marginTop: 0 }} onClick={handleRegister}>Finalize Application</button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn-text-only" style={{ width: '100%', marginTop: '16px' }} onClick={() => setStep('choice')}>Abort Application</button>
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
          .login-form-col { flex: 1 !important; background: var(--surface-container-high) !important; padding: 16px !important; }
          .login-card-premium { padding: 32px !important; }
        }
      `}} />
    </div>
  );
};

export default Login;
