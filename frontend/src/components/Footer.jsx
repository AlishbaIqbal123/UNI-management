import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <p>&copy; 2026 COMSATS University Islamabad, Vehari Campus. All rights reserved.</p>
        </div>
        <div style={{display:'flex', gap:'24px'}}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support Desk</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
