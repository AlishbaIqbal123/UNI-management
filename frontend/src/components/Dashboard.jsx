import React from 'react';

/**
 * Dashboard — Role-aware institutional command center.
 * Students see ONLY their own stats. Faculty see their own workload. Admin sees all.
 */
const Dashboard = ({ stats, user, notices, onAction }) => {

  // Role-specific quick actions
  const adminActions = [
    { id: 'calendar', label: 'Academic Calendar', icon: '📅', handler: () => onAction('VIEW_CALENDAR') },
    { id: 'reports',  label: 'Generate Reports',  icon: '📊', handler: () => onAction('VIEW_REPORTS') },
    { id: 'notices',  label: 'Manage Notices',    icon: '📢', handler: () => onAction('VIEW_NOTICES') },
    { id: 'reset',    label: 'Reset System',       icon: '⚙️', handler: () => onAction('RESET_SYSTEM'), danger: true },
  ];

  const studentActions = [
    { id: 'calendar',    label: 'Academic Calendar', icon: '📅', handler: () => onAction('VIEW_CALENDAR') },
    { id: 'registration',label: 'Course Registration',icon: '📚', handler: () => onAction('VIEW_REGISTRATION') },
    { id: 'finance',     label: 'My Fee Status',     icon: '💳', handler: () => onAction('VIEW_FINANCE') },
    { id: 'results',     label: 'My Transcript',     icon: '🎓', handler: () => onAction('VIEW_MY_RESULTS') },
    { id: 'exams',       label: 'Exam Schedule',     icon: '📝', handler: () => onAction('VIEW_EXAMS') },
  ];

  const facultyActions = [
    { id: 'calendar',  label: 'Academic Calendar', icon: '📅', handler: () => onAction('VIEW_CALENDAR') },
    { id: 'grading',   label: 'Grade Students',    icon: '📝', handler: () => onAction('VIEW_GRADING') },
    { id: 'attendance',label: 'Mark Attendance',   icon: '✅', handler: () => onAction('VIEW_CLASSES') },
    { id: 'exams',     label: 'Exam Schedule',     icon: '📅', handler: () => onAction('VIEW_EXAMS') },
    { id: 'profile',   label: 'My Profile',        icon: '👤', handler: () => onAction('VIEW_PROFILE') },
  ];

  const financeActions = [
    { id: 'ledger',  label: 'Fee Ledger',      icon: '💰', handler: () => onAction('VIEW_FINANCE') },
    { id: 'calendar',label: 'Academic Calendar',icon: '📅', handler: () => onAction('VIEW_CALENDAR') },
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
                <div className="empty-state-icon">📢</div>
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
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-card mt-24">
         <h3>🕒 Recent Activity Hub</h3>
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
