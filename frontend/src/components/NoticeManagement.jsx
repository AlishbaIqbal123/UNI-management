import React from 'react';

const NoticeManagement = ({ notices, setNotices, openForm }) => {
  const handleDelete = (id) => {
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Institutional Announcements</h1>
          <p>Broadcast critical updates to specific university portals.</p>
        </div>
        <button className="btn-primary-premium" onClick={() => openForm('notice_create')}>
          + Draft New Announcement
        </button>
      </div>

      <div className="notices-management-grid mt-24" style={{display:'grid', gap:'20px'}}>
        {notices.map(notice => (
          <div key={notice.id} className="glass-card feature-card" style={{padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{textAlign:'left'}}>
              <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'8px'}}>
                <span className="notice-date" style={{fontSize:'12px'}}>{notice.date}</span>
                <span className={`badge-premium ${notice.type === 'Academic' ? 'badge-primary' : 'badge-gold'}`} style={{fontSize:'10px', padding:'2px 8px'}}>
                  {notice.type}
                </span>
                <span className="badge-premium" style={{fontSize:'10px', background:'rgba(255,255,255,0.05)', color:'white'}}>
                  Target: {notice.target || 'All'}
                </span>
              </div>
              <h3 style={{color:'white', marginBottom:'8px'}}>{notice.title}</h3>
              <p style={{fontSize:'13px', color:'var(--text-dim)', maxWidth:'600px'}}>{notice.content.substring(0, 150)}...</p>
            </div>
            <div style={{display:'flex', gap:'12px'}}>
              <button className="btn-icon-premium" onClick={() => openForm('notice_create', notice)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button className="btn-icon-premium delete" onClick={() => handleDelete(notice.id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoticeManagement;
