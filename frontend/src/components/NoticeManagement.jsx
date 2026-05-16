import React, { useState } from 'react';

const NoticeManagement = ({ notices, setNotices, openForm, loading }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    setDeletingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isExpired = (expiryStr) => {
    if (!expiryStr) return false;
    return new Date(expiryStr) < new Date();
  };

  if (loading) {
    return (
      <div className="view-container">
        <div className="page-header">
          <h1>Notice Management</h1>
          <p className="page-subtitle">Broadcasting institutional updates...</p>
        </div>
        <div className="notices-management-grid section-gap" style={{display:'grid', gap:'20px'}}>
          {[1, 2, 3].map(i => (
            <div key={i} className="section-card skeleton" style={{height: '140px'}} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <h1>Notice Management</h1>
          <p className="page-subtitle">Draft and distribute official institutional announcements across portal gateways.</p>
        </div>
        <button className="btn-primary" onClick={() => openForm('notice_create')}>
          + Draft New Announcement
        </button>
      </div>

      <div className="notices-management-grid section-gap" style={{display:'grid', gap:'20px'}}>
        {notices.map(notice => (
          <div 
            key={notice.id} 
            className={`section-card fade-in ${deletingId === notice.id ? 'deleting' : ''}`} 
            style={{padding:'24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}
          >
            <div style={{textAlign:'left', flex: 1}}>
              <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap: 'wrap', marginBottom:'12px'}}>
                <span className="hint" style={{fontWeight:700, color: 'var(--color-ink)'}}>{formatDate(notice.created_at || notice.date)}</span>
                
                <span className="badge-category" style={{
                  padding: '3px 8px', fontSize: '11px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'rgba(26, 58, 107, 0.1)', color: 'var(--color-ink)'
                }}>
                  {notice.category || 'General'}
                </span>

                {(notice.visible_to || ['all']).map(portal => (
                  <span key={portal} style={{
                    padding: '3px 8px', fontSize: '11px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'rgba(201, 164, 53, 0.15)', color: 'var(--color-accent-dark)'
                  }}>
                    {portal}
                  </span>
                ))}

                {isExpired(notice.expires_at) && (
                  <span style={{
                    padding: '3px 8px', fontSize: '11px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'rgba(168, 50, 42, 0.12)', color: 'var(--color-danger)'
                  }}>
                    EXPIRED
                  </span>
                )}

                {!notice.is_published && (
                  <span style={{
                    padding: '3px 8px', fontSize: '11px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'var(--color-border)', color: 'var(--color-ink-muted)'
                  }}>
                    DRAFT
                  </span>
                )}
              </div>

              <h3 style={{margin:'0 0 8px 0', fontFamily: 'var(--font-heading)', fontSize: '20px'}}>{notice.title || 'Untitled Notice'}</h3>
              
              <p style={{
                opacity:0.7, 
                maxWidth:'800px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {notice.content}
              </p>
            </div>

            <div style={{display:'flex', gap:'12px', marginLeft: '24px'}}>
              {deletingId === notice.id ? (
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <span style={{fontSize: '12px', fontWeight: 500, color: 'var(--color-danger)'}}>Are you sure?</span>
                  <button className="btn-primary" style={{background: 'var(--color-danger)', padding: '4px 8px', fontSize: '10px'}} onClick={() => handleDelete(notice.id)}>YES</button>
                  <button className="btn-outline" style={{padding: '4px 8px', fontSize: '10px'}} onClick={() => setDeletingId(null)}>CANCEL</button>
                </div>
              ) : (
                <>
                  <button className="btn-icon-premium" onClick={() => openForm('notice_create', notice)} title="Edit Notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button className="btn-icon-premium delete" style={{color:'var(--color-danger)', borderColor:'var(--color-danger)'}} onClick={() => setDeletingId(notice.id)} title="Delete Notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {notices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }} className="section-card">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--color-ink)' }}>
              No announcements yet
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', marginBottom: '20px' }}>
              Draft your first official announcement using the button above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeManagement;
