import React from 'react';

const icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  student: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  faculty: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  catalog: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  dept: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line></svg>,
  financial: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  result: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  attendance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>,
  report: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  enrol: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="16" y1="11" x2="22" y2="11"></line></svg>
};

const ROLES = { ADMIN: 'Admin', STUDENT: 'Student', FACULTY: 'Faculty', FINANCE: 'Finance' };


const Sidebar = ({ activeTab, setActiveTab, user, onLogout, onHomeClick }) => {
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'students', label: 'Students', icon: icons.student, access: [ROLES.ADMIN] },
    { id: 'importer', label: 'Bulk Importer', icon: icons.enrol, access: [ROLES.ADMIN] },
    { id: 'faculty', label: 'Faculty', icon: icons.faculty, access: [ROLES.ADMIN] },
    { id: 'departments', label: 'Departments', icon: icons.dept, access: [ROLES.ADMIN] },
    { id: 'catalog', label: 'Course Catalog', icon: icons.catalog, access: [ROLES.ADMIN] },
    {id: 'enrolments', label: 'Registration Prep', icon: icons.enrol, access: [ROLES.ADMIN] },
    { id: 'results', label: 'Results', icon: icons.result, access: [ROLES.ADMIN] },
    { id: 'overrides', label: 'Admin Overrides', icon: icons.enrol, access: [ROLES.ADMIN] },
    { id: 'finance', label: 'Financial Hub', icon: icons.financial, access: [ROLES.ADMIN, ROLES.FINANCE] },
    { id: 'notices', label: 'Announcements', icon: icons.report, access: [ROLES.ADMIN, ROLES.STUDENT, ROLES.FACULTY, ROLES.FINANCE] },
    { id: 'calendar', label: 'Academic Calendar', icon: icons.dashboard, access: [ROLES.ADMIN, ROLES.STUDENT, ROLES.FACULTY, ROLES.FINANCE] },


    { id: 'registration', label: 'Registration', icon: icons.catalog, access: [ROLES.STUDENT] },
    { id: 'academic-progress', label: 'My Progress', icon: icons.attendance, access: [ROLES.STUDENT] },
    { id: 'my-results', label: 'My Results', icon: icons.result, access: [ROLES.STUDENT] },
    { id: 'my-finance', label: 'My Finance', icon: icons.financial, access: [ROLES.STUDENT] },
    { id: 'classes', label: 'My Classes', icon: icons.catalog, access: [ROLES.FACULTY] },
    { id: 'grading', label: 'Grading', icon: icons.result, access: [ROLES.FACULTY] },
    { id: 'profile', label: 'Profile Settings', icon: icons.student, access: [ROLES.STUDENT, ROLES.FACULTY, ROLES.FINANCE] },

  ].filter(i => !i.access || (user && i.access.includes(user.role)));


  return (
    <aside className="sidebar premium-sidebar">
      <div className="logo-container" onClick={onHomeClick} style={{cursor: 'pointer', display:'flex', alignItems:'center', gap:'12px'}}>
        <img src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="COMSATS" style={{width:'40px', height:'40px', objectFit:'contain'}} />
        <div className="logo-text-stack">
          <span className="logo-text-top" style={{fontWeight: 800}}>COMSATS</span>
          <span className="logo-text-bottom" style={{color: 'var(--accent)'}}>University</span>
        </div>
      </div>
      <nav className="nav-menu">
        <div className="nav-group-label">Main Menu</div>
        {sidebarItems.map(i => (
          <div 
            key={i.id} 
            onClick={() => setActiveTab(i.id)} 
            className={`nav-item-premium ${activeTab === i.id ? 'active' : ''}`}
          >
            <div className="nav-icon-wrapper">{i.icon}</div>
            <span className="nav-label">{i.label}</span>
            {activeTab === i.id && <div className="active-indicator" />}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item-premium logout" onClick={onLogout}>
          <div className="nav-icon-wrapper">{icons.logout}</div>
          <span className="nav-label">Sign Out</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
