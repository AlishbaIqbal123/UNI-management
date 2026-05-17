import React from 'react';

const Footer = () => {
  return (
    <footer className="footer-premium" style={{
      background: 'var(--color-ink)',
      color: 'var(--color-bg)',
      padding: '64px 64px 24px 64px',
      borderTop: '4px solid var(--color-accent)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflow: 'hidden',
      marginTop: 'auto'
    }}>
      <style>{`
        .footer-premium {
          margin: 48px -36px -48px -36px !important;
        }
        .footer-link {
          color: var(--color-bg);
          text-decoration: none;
          font-size: 13px;
          opacity: 0.7;
          transition: all 0.2s ease;
        }
        .footer-link:hover {
          opacity: 1;
          color: var(--color-accent);
          transform: translateX(4px);
        }
        .footer-contact-item {
          display: flex;
          gap: 12px;
          font-size: 13px;
          opacity: 0.8;
          align-items: center;
        }
        @media (max-width: 768px) {
          .footer-premium {
            padding: 40px 24px 24px 24px !important;
            margin: 48px -20px -40px -20px !important;
          }
        }
      `}</style>
      
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '48px',
        marginBottom: '64px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Brand Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="COMSATS" style={{ width: '48px', height: '48px' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>COMSATS</div>
              <div style={{ fontSize: '10px', color: 'var(--color-accent)', letterSpacing: '0.12em', fontWeight: 700, marginTop: '4px' }}>UNIVERSITY ISLAMABAD</div>
            </div>
          </div>
          <p style={{ opacity: 0.6, fontSize: '13px', lineHeight: 1.6, maxWidth: '300px', margin: '8px 0 0 0' }}>
            Next-Gen Campus OS. Bridging Admissions, Academics, and Financials under one unified architecture for the Vehari Campus.
          </p>
        </div>

        {/* Links Column 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academics</h4>
          <a href="#" className="footer-link">Admissions Portal</a>
          <a href="#" className="footer-link">Course Catalog</a>
          <a href="#" className="footer-link">Academic Calendar</a>
          <a href="#" className="footer-link">Library Resources</a>
        </div>

        {/* Links Column 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administration</h4>
          <a href="#" className="footer-link">Finance & Scholarships</a>
          <a href="#" className="footer-link">Registrar Office</a>
          <a href="#" className="footer-link">IT Support Desk</a>
          <a href="#" className="footer-link">Career Center</a>
        </div>

        {/* Contact Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Us</h4>
          <div className="footer-contact-item"><span>📍</span> Multan Road, Vehari, Punjab</div>
          <div className="footer-contact-item"><span>📞</span> +92 67 3028346</div>
          <div className="footer-contact-item"><span>✉️</span> admissions@cuivehari.edu.pk</div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '12px',
        opacity: 0.6,
        position: 'relative',
        zIndex: 1,
        gap: '16px'
      }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} COMSATS University Islamabad, Vehari Campus. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" className="footer-link" style={{ opacity: 1, transform: 'none' }}>Privacy Policy</a>
          <a href="#" className="footer-link" style={{ opacity: 1, transform: 'none' }}>Terms of Service</a>
          <a href="#" className="footer-link" style={{ opacity: 1, transform: 'none' }}>Sitemap</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
