import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <p>&copy; 2026 COMSATS University Islamabad, Vehari Campus. All rights reserved.</p>
        </div>
        <div className="footer-center">
            <div className="footer-status">
                <span className="status-dot green"></span>
                <span>System Operational: v2.4.0</span>
            </div>
        </div>
        <div className="footer-right">
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support Desk</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
