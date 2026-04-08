import React from 'react';

const LandingPage = ({ onEnterPortal }) => {
  return (
    <div className="landing-wrapper fade-in">
      {/* Dynamic Background */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-logo" style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="COMSATS" style={{width:'36px', height:'36px'}} />
          <div>
            <div className="logo-text-top" style={{fontSize: '20px', fontWeight: 800}}>COMSATS</div>
            <div className="logo-text-bottom" style={{fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.1em'}}>UNIVERSITY ISLAMABAD</div>
          </div>
        </div>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#compliance">HEC Compliance</a>
          <a href="#technology">Technology</a>
          <button className="btn-primary-premium" onClick={onEnterPortal}>Enter Portal</button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-content">
          <div className="badge-premium badge-primary" style={{marginBottom: '24px', display:'inline-block'}}>v2.0 Architecture Live</div>
          <h1 className="hero-title">Next-Generation <span className="text-gradient">Campus OS</span></h1>
          <p className="hero-subtitle">
            A comprehensive, modular, and highly scalable management pipeline bridging Admissions, Academics, Financials, and Alumni under one unified Glassmorphism architecture.
          </p>
          <div className="hero-actions">
            <button className="btn-login-premium" onClick={onEnterPortal}>Access Gateway</button>
            <button className="btn-icon-premium" style={{color: 'white', background: 'rgba(255,255,255,0.05)', marginLeft: '16px'}} onClick={() => document.getElementById('features').scrollIntoView({behavior: 'smooth'})}>View Live Modules</button>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="glass-card mockup-card">
            <div className="mockup-header">
                <div className="dot" style={{background:'#ff5f56'}}></div>
                <div className="dot" style={{background:'#ffbd2e'}}></div>
                <div className="dot" style={{background:'#27c93f'}}></div>
            </div>
            <div className="mockup-dashboard-preview">
                <div className="mock-sidebar"></div>
                <div className="mock-main">
                    <div className="mock-top-stats">
                        <div className="mock-stat-bar"></div>
                        <div className="mock-stat-bar" style={{width: '60%'}}></div>
                    </div>
                    <div className="mock-grid">
                        <div className="mock-box highlight"></div>
                        <div className="mock-box"></div>
                        <div className="mock-box"></div>
                        <div className="mock-box highlight"></div>
                    </div>
                </div>
            </div>
            <div className="mock-badge">LIVE FACULTY LEDGER</div>
          </div>
        </div>
      </main>

      {/* System Preview Section */}
      <section id="features" className="preview-section" style={{padding: '80px 0'}}>
        <h2 style={{fontSize: '32px', color: 'white', textAlign:'center', marginBottom: '48px'}}>Institutional Core Modules</h2>
        <div className="preview-grid" style={{display:'flex', gap:'24px', overflowX:'auto', paddingBottom: '20px'}}>
             <div className="glass-card module-preview-card" style={{minWidth:'300px', flex:1}}>
                <div className="badge-premium badge-primary">Admission Engine</div>
                <h4 style={{color:'white', margin:'16px 0 8px'}}>Digital Registrar</h4>
                <p style={{fontSize:'13px', color:'var(--text-dim)'}}>Automated document verification, dynamic seat allocation, and real-time merit list calculation.</p>
             </div>
             <div className="glass-card module-preview-card" style={{minWidth:'300px', flex:1}}>
                <div className="badge-premium badge-primary">Academic Hub</div>
                <h4 style={{color:'white', margin:'16px 0 8px'}}>Course Management</h4>
                <p style={{fontSize:'13px', color:'var(--text-dim)'}}>Conflict-free scheduling, prerequisite enforcement, and automated attendance tracking system.</p>
             </div>
             <div className="glass-card module-preview-card" style={{minWidth:'300px', flex:1}}>
                <div className="badge-premium badge-primary">Financial OS</div>
                <h4 style={{color:'white', margin:'16px 0 8px'}}>Fee Ledger</h4>
                <p style={{fontSize:'13px', color:'var(--text-dim)'}}>End-to-end fee reconciliation, online payment integration, and scholarship disbursement tracking.</p>
             </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="features-grid">
         <div className="glass-card feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Role-Based Auth & MFA</h3>
            <p>Cryptographically secure JSON Web Tokens ensure strict boundary enforcement between Students, Faculty, and Admin ledgers.</p>
         </div>
         <div className="glass-card feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Sub-Second Performance</h3>
            <p>Optimized edge-routing and persistent caching guarantees query returns under 2.5 seconds during peak registration loads.</p>
         </div>
         <div className="glass-card feature-card">
            <div className="feature-icon">🔗</div>
            <h3>ACID Compliance</h3>
            <p>Hardened PostgreSQL schemas protect database durability, ensuring fee transactions and grading remain uncorrupted universally.</p>
         </div>
         <div className="glass-card feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Automated Admissions</h3>
            <p>AI-driven document parsing and dynamic PDF Admit Card generation streamlines thousands of enrollments simultaneously.</p>
         </div>
      </section>
    </div>
  );
};

export default LandingPage;
