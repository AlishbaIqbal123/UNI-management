import React from 'react';

const LandingPage = ({ onEnterPortal, theme, toggleTheme }) => {
  return (
    <div className="landing-wrapper fade-in" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Navigation Header */}
      <header className="landing-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '32px 64px',
        borderBottom: '2px solid var(--color-ink)'
      }}>
        <div className="landing-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="COMSATS" style={{ width: '48px', height: '48px' }} />
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>COMSATS</div>
            <div style={{ fontSize: '10px', color: 'var(--color-accent)', letterSpacing: '0.1em', fontWeight: 700 }}>UNIVERSITY ISLAMABAD</div>
          </div>
        </div>
        <nav className="header-nav" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" style={{ textDecoration: 'none', color: 'var(--color-ink)', fontWeight: 600, fontSize: '14px' }}>Modules</a>
          <a href="#tech" style={{ textDecoration: 'none', color: 'var(--color-ink)', fontWeight: 600, fontSize: '14px' }}>Tech Stack</a>
          <button className="btn-icon-premium" onClick={toggleTheme} title="Toggle Theme" style={{ border: 'none' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-primary-premium" onClick={onEnterPortal}>Enter Portal</button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="landing-hero" style={{
        display: 'flex',
        padding: '80px 64px',
        alignItems: 'center',
        gap: '64px',
        backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }}>
        <div className="hero-content" style={{ flex: 1 }}>
          <div className="badge-premium badge-primary" style={{ marginBottom: '24px', display: 'inline-block' }}>Institutional V2.0 Live</div>
          <h1 style={{ fontSize: '80px', lineHeight: 0.9, marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
            Next-Gen <span style={{ color: 'var(--color-accent)' }}>Campus OS</span>
          </h1>
          <p style={{ fontSize: '20px', maxWidth: '500px', opacity: 0.8, marginBottom: '40px' }}>
            A comprehensive, modular management pipeline bridging Admissions, Academics, and Financials under one unified academic architecture.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '16px' }}>
            <button 
              style={{ background: 'var(--color-ink)', color: 'var(--color-bg)', padding: '16px 32px', fontSize: '14px', border: 'none', boxShadow: 'var(--shadow)' }}
              onClick={onEnterPortal}
            >
              Access Gateway
            </button>
            <button 
              className="btn-text-only" 
              style={{ fontWeight: 700, border: '1px solid var(--color-ink)', padding: '16px 32px' }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            >
              View Modules
            </button>
          </div>
        </div>
        
        <div className="hero-visual" style={{ flex: 1 }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden', transform: 'rotate(2deg)' }}>
            <div style={{ background: 'var(--color-ink)', padding: '12px', display: 'flex', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></div>
            </div>
            <div style={{ padding: '40px', background: 'white' }}>
                <div style={{ height: '20px', width: '60%', background: 'var(--color-bg)', marginBottom: '16px', border: '1px solid var(--color-border)' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ height: '80px', background: 'var(--color-accent)', opacity: 0.1, border: '1px solid var(--color-accent)' }}></div>
                  <div style={{ height: '80px', background: 'var(--color-border)', opacity: 0.2, border: '1px solid var(--color-border)' }}></div>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modules Grid */}
      <section id="features" style={{ padding: '80px 64px', borderTop: '2px solid var(--color-ink)' }}>
        <h2 style={{ fontSize: '48px', marginBottom: '48px', textAlign: 'center' }}>Institutional Core</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {[
            { title: 'Admission Engine', desc: 'Automated verification, dynamic seat allocation, and real-time merit lists.', icon: '🎓' },
            { title: 'Academic Hub', desc: 'Conflict-free scheduling, prerequisite enforcement, and attendance tracking.', icon: '📚' },
            { title: 'Financial OS', desc: 'End-to-end fee reconciliation and online payment integration.', icon: '💰' }
          ].map((m, i) => (
            <div key={i} className="card" style={{ padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '24px' }}>{m.icon}</div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>{m.title}</h3>
              <p style={{ opacity: 0.7, fontSize: '15px' }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Hardening */}
      <section id="tech" style={{ padding: '80px 64px', background: 'var(--color-ink)', color: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '48px', color: 'inherit' }}>System Hardening</h2>
          <p style={{ opacity: 0.6 }}>Technical specifications of the University Pipeline.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px' }}>
          {[
            { label: 'Security', val: 'JWT + MFA' },
            { label: 'Database', val: 'PostgreSQL ACID' },
            { label: 'Latency', val: '< 200ms Edge' },
            { label: 'Compliance', val: 'HEC/Institutional' }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .landing-hero { flex-direction: column !important; padding: 40px 24px !important; }
          .landing-header { padding: 24px !important; }
          .hero-visual { display: none !important; }
          h1 { fontSize: 48px !important; }
        }
      `}} />
    </div>
  );
};

export default LandingPage;
