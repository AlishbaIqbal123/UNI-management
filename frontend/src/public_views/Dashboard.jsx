import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dashboardData = [
  { name: 'Aug', students: 1200, faculty: 150 },
  { name: 'Sep', students: 2100, faculty: 180 },
  { name: 'Oct', students: 2500, faculty: 195 },
  { name: 'Nov', students: 2530, faculty: 210 },
  { name: 'Dec', students: 2545, faculty: 210 },
];

const AdminDashboardWidgets = () => (
    <div style={{ height: '300px', width: '100%', marginTop: '32px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dashboardData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary-light)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--primary-light)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="var(--text-dim)" />
          <YAxis stroke="var(--text-dim)" />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--glass-border)', color: 'white' }}
            itemStyle={{ color: 'white' }}
          />
          <Area type="monotone" dataKey="students" stroke="var(--primary-light)" fillOpacity={1} fill="url(#colorStudents)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
);

const Dashboard = ({ stats, user, notices, onAction }) => {
  return (
    <div className="view-container fade-in">
      <div className="welcome-section" style={{marginBottom: '40px'}}>
        <div className="welcome-text">
          <h1 style={{fontSize: '36px', color: 'white'}}>Welcome, {user.name || 'User'}</h1>
          <p style={{color: 'var(--text-dim)', fontSize: '16px'}}>Here is your institutional overview for the current academic session.</p>
        </div>
      </div>

      <div className="stats-grid-premium">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card-premium glass-card" style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <span style={{color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em'}}>{stat.label}</span>
            <span style={{color: 'white', fontSize: '32px', fontWeight: 800}}>{stat.value}</span>
            <div className={`stat-trend ${idx % 2 === 0 ? 'up' : 'down'}`} style={{marginTop: 'auto', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 700}}>
              {idx % 2 === 0 ? '+12% from last term' : 'Needs attention'}
            </div>
          </div>
        ))}
      </div>

      {user.role === 'Admin' && (
          <div className="glass-card" style={{padding: '32px', marginTop: '32px'}}>
              <h2 style={{color: 'white', fontSize: '20px'}}>Enrollment Growth Engine</h2>
              <AdminDashboardWidgets />
          </div>
      )}

      <div className="dashboard-main-grid" style={{marginTop: '32px'}}>
        <div className="notice-board-premium glass-card" style={{padding: '32px'}}>
          <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
            <h2 style={{color: 'white', fontSize: '20px'}}>Campus Announcements</h2>
            <button className="btn-text-only" onClick={() => onAction('VIEW_ALL_NOTICES')} style={{color: 'var(--accent)'}}>View All</button>
          </div>
          <div className="notices-scroll-area">
            {notices.slice(0,3).map(notice => (
              <div key={notice.id} style={{padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <span style={{color: 'var(--text-dim)', fontSize: '12px'}}>{notice.date}</span>
                <h3 style={{color: 'white', fontSize: '16px'}}>{notice.title}</h3>
                <p style={{color: 'var(--text-dim)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{notice.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions-premium glass-card" style={{padding: '32px'}}>
          <h2 style={{color: 'white', fontSize: '20px', marginBottom: '24px'}}>Quick Actions</h2>
          <div style={{display: 'grid', gap: '16px'}}>
             <button onClick={() => onAction('calendar')} className="btn-primary-premium" style={{width: '100%', justifyContent: 'flex-start'}}>View Master Calendar</button>
             <button className="btn-primary-premium" style={{width: '100%', justifyContent: 'flex-start', background: 'transparent', border: '1px solid var(--glass-border)'}}>Registrar Support</button>
             {user.role === 'Admin' && <button onClick={() => onAction('RESET_SYSTEM')} className="btn-primary-premium" style={{width: '100%', justifyContent: 'flex-start', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)'}}>Clear Local Memory</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
