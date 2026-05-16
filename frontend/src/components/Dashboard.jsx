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
        <span className={`badge-premium ${user.role === ROLES.ADMIN ? 'badge-primary' : 'badge-gold'}`} style={{padding:'6px 16px', fontSize:'12px', letterSpacing:'0.1em'}}>
          {user.role === ROLES.ADMIN ? '🔐 ADMIN — FULL ACCESS' 
            : user.role === ROLES.STUDENT ? `🎓 STUDENT — ${user.id}`
            : user.role === ROLES.FACULTY ? `👨‍🏫 FACULTY — ${user.id}`
            : '💼 FINANCE OFFICER'}
        </span>
        
        <div className="card" style={{padding:'6px 16px', margin:0, borderRadius:'100px', fontSize:'12px', display:'flex', gap:'12px', alignItems:'center', boxShadow:'var(--shadow-sm)'}}>
          {user.role === ROLES.ADMIN && <>System Health: 98% Optimal</>}
          {user.role === ROLES.STUDENT && <>Academic Status: Active</>}
          {user.role === ROLES.FACULTY && <>Pending Gradestack: 12 Records</>}
          {user.role === ROLES.FINANCE && <>Revenue Pipeline: +12% MoM</>}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px', marginBottom:'32px'}}>
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              cursor: stat.action ? 'pointer' : 'default',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              border: stat.warning ? '2px solid var(--color-danger)' : '1px solid var(--color-ink)'
            }}
            onClick={() => stat.action && onAction(stat.action)}
          >
            <span style={{fontSize:'12px', fontWeight:700, opacity:0.6, textTransform:'uppercase', letterSpacing:'0.05em'}}>{stat.label}</span>
            <span style={{fontSize:'36px', fontWeight:400, fontFamily:'var(--font-heading)', color:'var(--color-ink)'}}>{stat.value}</span>
            <div style={{
              fontSize: '11px', 
              fontWeight: 700, 
              color: stat.warning ? 'var(--color-danger)' : 'var(--color-accent)',
              textTransform: 'uppercase'
            }}>
              {stat.warning ? 'Audit Required' : stat.trend || 'Status Optimal'}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'32px'}}>
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--color-ink)'}}>
            <h2 style={{margin:0}}>University Notices</h2>
            <button className="btn-text-only" onClick={() => onAction('VIEW_NOTICES')}>View All</button>
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
                  borderBottom:'1px solid var(--color-border)',
                  transition:'background 0.2s'
                }}
                className="notice-item-premium"
                onClick={() => onAction('VIEW_NOTICE', notice)}
              >
                <div style={{display:'flex', gap:'16px', alignItems:'start'}}>
                  <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'var(--color-accent)', marginTop:'8px'}} />
                  <div style={{flex:1}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                      <span style={{fontSize:'11px', fontWeight:700, opacity:0.5}}>{notice.date}</span>
                      <span className="badge-premium" style={{fontSize:'9px'}}>{notice.type}</span>
                    </div>
                    <h3 style={{fontSize:'20px', margin:'0 0 8px 0'}}>{notice.title}</h3>
                    <p style={{fontSize:'14px', opacity:0.7, margin:0}}>{(notice.content || '').substring(0, 80)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{borderBottom:'1px solid var(--color-ink)', paddingBottom:'16px', marginBottom:'24px'}}>Quick Actions</h2>
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

      <div className="card-surface mt-24" style={{padding:'24px'}}>
         <h2 style={{fontSize:'18px', marginBottom:'16px'}}>🕒 Recent Activity Hub</h2>
          <div className="activity-feed">
            {[
              { id:1, text: "Course Catalog updated with 5 new modules", time: "2h ago", type: "system" },
              { id:2, text: "Dr. Nasir Ahmed posted Midterm results for CSC112", time: "5h ago", type: "academic" },
              { id:3, text: "Finance portal maintenance window scheduled for tonight", time: "1d ago", type: "info" }
            ].map(item => (
              <div key={item.id} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--color-border)', fontSize:'14px'}}>
                 <span style={{opacity:0.8}}>• {item.text}</span>
                 <span style={{opacity:0.4, fontSize:'12px'}}>{item.time}</span>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

const ROLES = { ADMIN: 'Admin', STUDENT: 'Student', FACULTY: 'Faculty', FINANCE: 'Finance' };

export default Dashboard;
