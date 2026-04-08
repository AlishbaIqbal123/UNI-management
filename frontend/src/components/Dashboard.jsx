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
  ];

  const facultyActions = [
    { id: 'calendar',  label: 'Academic Calendar', icon: '📅', handler: () => onAction('VIEW_CALENDAR') },
    { id: 'grading',   label: 'Grade Students',    icon: '📝', handler: () => onAction('VIEW_GRADING') },
    { id: 'attendance',label: 'Mark Attendance',   icon: '✅', handler: () => onAction('VIEW_CLASSES') },
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
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>Welcome back, {user.name || user.facultyName || 'User'}</h1>
          <p>
            {user.role === 'Admin'   && 'Full institutional control. Manage all university operations.'}
            {user.role === 'Student' && `You are logged in as a student — ${user.id}. View your academic progress below.`}
            {user.role === 'Faculty' && `Welcome, ${user.facultyName || user.name}. Manage your classes and student assessments.`}
            {user.role === 'Finance' && 'Access the financial ledger and manage institutional fee records.'}
          </p>
        </div>
        <div className="current-date-card">
          <span className="date-day">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
          <span className="date-full">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Role Badge & Focus Area */}
      <div style={{display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'24px', alignItems:'center'}}>
        <span className={`badge-premium ${user.role === 'Admin' ? 'badge-primary' : 'badge-gold'}`} style={{padding:'6px 16px', fontSize:'12px', letterSpacing:'0.1em'}}>
          {user.role === 'Admin' ? '🔐 ADMIN — FULL ACCESS' 
            : user.role === 'Student' ? `🎓 STUDENT — ${user.id}`
            : user.role === 'Faculty' ? `👨‍🏫 FACULTY — ${user.id}`
            : '💼 FINANCE OFFICER'}
        </span>
        
        {/* Dynamic Focus Area Widget */}
        <div className="glass-card" style={{padding:'6px 16px', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'100px', fontSize:'12px', display:'flex', gap:'12px', alignItems:'center'}}>
          {user.role === 'Admin' && <><span className="pulse-dot" style={{background:'#4ade80'}} /> System Health: 98% Optimal</>}
          {user.role === 'Student' && <><span className="pulse-dot" style={{background:'#60a5fa'}} /> Academic Status: Active</>}
          {user.role === 'Faculty' && <><span className="pulse-dot" style={{background:'#facc15'}} /> Pending Gradestack: 12 Records</>}
          {user.role === 'Finance' && <><span className="pulse-dot" style={{background:'#a855f7'}} /> Revenue Pipeline: +12% MoM</>}
        </div>
      </div>

      <div className="stats-grid-premium">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`stat-card-premium ${stat.warning ? 'warning' : ''}`}
            style={{cursor: stat.action ? 'pointer' : 'default'}}
            onClick={() => stat.action && onAction(stat.action)}
          >
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
            <div className={`stat-trend ${stat.warning ? 'down' : 'up'}`}>
              {stat.warning ? 'Needs Attention' : stat.trend || 'Active'}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="notice-board-premium glass-card">
          <div className="section-header">
            <h2>University Notices</h2>
            <button className="btn-text-only" onClick={() => onAction('VIEW_NOTICES')}>View All</button>
          </div>
          <div className="notices-scroll-area">
            {notices.length === 0 && (
              <p style={{padding:'40px', textAlign:'center', opacity:0.5}}>No active announcements.</p>
            )}
            {notices.map(notice => (
              <div
                key={notice.id}
                className="notice-item-premium"
                style={{cursor:'pointer'}}
                onClick={() => onAction('VIEW_NOTICE', notice)}
              >
                <div className="notice-marker" />
                <div className="notice-content-wrapper">
                  <div className="notice-meta-top">
                    <span className="notice-date">{notice.date}</span>
                    <span className="notice-tag">{notice.type}</span>
                  </div>
                  <h3>{notice.title}</h3>
                  <p>{(notice.content || '').substring(0, 80)}...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions-premium glass-card">
          <h2>Quick Actions</h2>
          <div className="actions-list">
            {actions.map(action => (
              <button
                key={action.id}
                className={`action-btn-premium ${action.danger ? 'danger' : ''}`}
                onClick={action.handler}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card mt-24" style={{padding:'24px'}}>
         <h2 style={{fontSize:'18px', marginBottom:'16px'}}>🕒 Recent Activity Hub</h2>
         <div className="activity-feed">
            {[
              { id:1, text: "Course Catalog updated with 5 new modules", time: "2h ago", type: "system" },
              { id:2, text: "Dr. Nasir Ahmed posted Midterm results for CSC112", time: "5h ago", type: "academic" },
              { id:3, text: "Finance portal maintenance window scheduled for tonight", time: "1d ago", type: "info" }
            ].map(item => (
              <div key={item.id} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:'14px'}}>
                 <span style={{opacity:0.8}}>• {item.text}</span>
                 <span style={{opacity:0.4, fontSize:'12px'}}>{item.time}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
