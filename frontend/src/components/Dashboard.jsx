import React from 'react';

/**
 * Dashboard — Role-aware institutional command center.
 * Students see ONLY their own stats. Faculty see their own workload. Admin sees all.
 */
const Dashboard = ({ stats, user, notices, onAction }) => {

  const getIconSvg = (id) => {
    switch (id) {
      case 'calendar':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'reports':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'notices':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
      case 'reset':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      case 'registration':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'finance':
      case 'ledger':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'results':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5" />
          </svg>
        );
      case 'exams':
      case 'grading':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'attendance':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'profile':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Role-specific quick actions
  const adminActions = [
    { id: 'calendar', label: 'Academic Calendar', handler: () => onAction('VIEW_CALENDAR') },
    { id: 'reports',  label: 'Generate Reports',  handler: () => onAction('VIEW_REPORTS') },
    { id: 'notices',  label: 'Manage Notices',    handler: () => onAction('VIEW_NOTICES') },
    { id: 'reset',    label: 'Reset System',       handler: () => onAction('RESET_SYSTEM'), danger: true },
  ];

  const studentActions = [
    { id: 'calendar',    label: 'Academic Calendar', handler: () => onAction('VIEW_CALENDAR') },
    { id: 'registration',label: 'Course Registration',handler: () => onAction('VIEW_REGISTRATION') },
    { id: 'finance',     label: 'My Fee Status',     handler: () => onAction('VIEW_FINANCE') },
    { id: 'results',     label: 'My Transcript',     handler: () => onAction('VIEW_MY_RESULTS') },
    { id: 'exams',       label: 'Exam Schedule',     handler: () => onAction('VIEW_EXAMS') },
  ];

  const facultyActions = [
    { id: 'calendar',  label: 'Academic Calendar', handler: () => onAction('VIEW_CALENDAR') },
    { id: 'grading',   label: 'Grade Students',    handler: () => onAction('VIEW_GRADING') },
    { id: 'attendance',label: 'Mark Attendance',   handler: () => onAction('VIEW_CLASSES') },
    { id: 'exams',     label: 'Exam Schedule',     handler: () => onAction('VIEW_EXAMS') },
    { id: 'profile',   label: 'My Profile',        handler: () => onAction('VIEW_PROFILE') },
  ];

  const financeActions = [
    { id: 'ledger',  label: 'Fee Ledger',      handler: () => onAction('VIEW_FINANCE') },
    { id: 'calendar',label: 'Academic Calendar',handler: () => onAction('VIEW_CALENDAR') },
  ];

  const actions = user.role === 'Admin' ? adminActions
    : user.role === 'Student'  ? studentActions
    : user.role === 'Faculty'  ? facultyActions
    : financeActions;

  return (
    <div className="dashboard-content fade-in">
      <div className="page-header">
        <div className="page-breadcrumb">CUI VEHARI / {user.role.toUpperCase()} / OVERVIEW</div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user.name || user.facultyName || 'User'}. {user.role === 'Admin' ? 'Institutional Command Center.' : 'Accessing your academic portal.'}</p>
        <p className="page-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`stat-card ${stat.warning ? 'danger' : ''}`}
            onClick={() => stat.action && onAction(stat.action)}
            style={{ cursor: stat.action ? 'pointer' : 'default' }}
          >
            <span className="stat-label">{stat.label}</span>
            <span className="stat-number">{stat.value}</span>
            <span className="stat-sublabel">{stat.warning ? 'Audit Required' : stat.trend || 'Status Optimal'}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'32px'}}>
        <div className="section-card" style={{padding:0, overflow:'hidden'}}>
          <div style={{padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--color-border)'}}>
            <h3>University Notices</h3>
            <button className="btn-view-all" onClick={() => onAction('VIEW_NOTICES')}>View All</button>
          </div>
          <div className="notices-scroll-area" style={{padding:'24px'}}>
            {notices.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p>No active announcements at this time.</p>
              </div>
            )}
            {notices.map(notice => (
              <div
                key={notice.id}
                style={{
                  cursor:'pointer', 
                  padding:'16px', 
                  borderBottom:'1px solid var(--color-border)'
                }}
                className="notice-item"
                onClick={() => onAction('VIEW_NOTICE', notice)}
              >
                <div style={{display:'flex', gap:'16px', alignItems:'start'}}>
                  <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'var(--color-accent)', marginTop:'8px'}} />
                  <div style={{flex:1}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                      <span className="hint">{notice.date || 'No Date'}</span>
                      <span className="hint" style={{textTransform:'uppercase', letterSpacing:'1px'}}>{notice.type || 'General'}</span>
                    </div>
                    <h4>{notice.title || 'Untitled Announcement'}</h4>
                    <p style={{opacity:0.7}}>{(notice.content || '').substring(0, 80)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h3 style={{borderBottom:'1px solid var(--color-border)', paddingBottom:'16px', marginBottom:'24px'}}>Quick Actions</h3>
          <div className="quick-actions-list">
            {actions.map(action => (
              <button
                key={action.id}
                className={`quick-action-btn ${action.danger ? 'danger' : ''}`}
                onClick={action.handler}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{getIconSvg(action.id)}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-card mt-24">
         <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
           Recent Activity Hub
         </h3>
          <div style={{marginTop:'16px'}}>
            {[
              { id:1, text: "Course Catalog updated with 5 new modules", time: "2h ago" },
              { id:2, text: "Dr. Nasir Ahmed posted Midterm results for CSC112", time: "5h ago" },
              { id:3, text: "Finance portal maintenance window scheduled for tonight", time: "1d ago" }
            ].map(item => (
              <div key={item.id} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--color-border)'}}>
                 <p style={{opacity:0.8}}>• {item.text}</p>
                 <span className="hint">{item.time}</span>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

const ROLES = { ADMIN: 'Admin', STUDENT: 'Student', FACULTY: 'Faculty', FINANCE: 'Finance' };

export default Dashboard;
