import React, { useState } from 'react';
import { generateInstitutionalReport } from '../lib/exportUtils';

const ExamManagement = ({ exams, setExams, courses, faculty, user, openForm, handleDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const isAdmin = user.role === 'Admin';
  const isStudent = user.role === 'Student';
  const isFaculty = user.role === 'Faculty';

  const filteredExams = (exams || []).filter(e => {
    const course = courses.find(c => c.courseID === e.courseID);
    const searchMatches = (course?.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.courseID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatches = typeFilter === 'All' || e.type === typeFilter;
    
    // Students only see exams for courses they are enrolled in (optional logic, for now show all schedule)
    return searchMatches && typeMatches;
  });

  const exportSchedule = () => {
    const data = filteredExams.map(e => {
      const course = courses.find(c => c.courseID === e.courseID);
      return {
        'Course Code': e.courseID,
        'Course Name': course?.courseName || 'N/A',
        'Date': e.date,
        'Time': e.time,
        'Venue': e.venue,
        'Type': e.type,
        'Invigilator': e.invigilator
      };
    });

    generateInstitutionalReport('Official Examination Schedule', 
      ['Course Code', 'Course Name', 'Date', 'Time', 'Venue', 'Type', 'Invigilator'],
      data
    );
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Examination Management</h1>
          <p>Official scheduling, venue allocation, and invigilator assignments.</p>
        </div>
        <div style={{display:'flex', gap:'12px'}}>
           <button className="btn-text-only" onClick={exportSchedule}>📊 Export Schedule</button>
           {isAdmin && (
             <button className="btn-primary-premium" onClick={() => openForm('exam')}>+ Schedule New Exam</button>
           )}
        </div>
      </div>

      <div className="glass-card mb-24" style={{display:'flex', gap:'20px', alignItems:'center', flexWrap:'wrap', padding:'12px 24px'}}>
        <div style={{display:'flex', flexDirection:'column', gap:'4px', flex:1}}>
            <span style={{fontSize:'12px', opacity:0.6}}>🔍 Search Schedule</span>
            <input 
              className="input-premium" 
              placeholder="Search by course, venue..." 
              style={{background:'transparent', border:'none', borderBottom:'1px solid var(--glass-border)'}}
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
            <span style={{fontSize:'12px', opacity:0.6}}>Exam Category</span>
            <select className="input-premium" style={{width:'180px'}} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option value="Midterm">Midterm</option>
                <option value="Terminal">Terminal (Final)</option>
                <option value="Sessional">Sessional</option>
            </select>
        </div>
        <div style={{marginLeft:'auto', textAlign:'right'}}>
            <span style={{fontSize:'12px', opacity:0.6}}>Scheduled Papers</span>
            <h3 style={{color:'var(--accent)', margin:0}}>{filteredExams.length}</h3>
        </div>
      </div>

      <div className="dashboard-main-grid" style={{gridTemplateColumns:'1fr'}}>
        <div className="table-card-premium glass-card">
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Course Detail</th>
                  <th>Date & Time</th>
                  <th>Venue / Hall</th>
                  <th>Exam Type</th>
                  <th>Invigilation Staff</th>
                  {isAdmin && <th className="text-right">Manage</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExams.map(e => {
                  const course = courses.find(c => c.courseID === e.courseID);
                  return (
                    <tr key={e.id}>
                      <td>
                        <div className="user-info-cell">
                          <span className="user-name-cell" style={{fontWeight:600, color:'var(--text-main)'}}>{course?.courseName || 'Unknown Course'}</span>
                          <span className="font-monospace" style={{fontSize:'11px', color:'var(--accent)', background:'var(--surface-container-high)', padding:'2px 8px', borderRadius:'4px'}}>
                            {e.courseID}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{display:'flex', flexDirection:'column'}}>
                           <span style={{fontWeight:600}}>{e.date}</span>
                           <span style={{fontSize:'12px', opacity:0.6}}>{e.time}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{display:'flex', alignItems:'center', gap:'8px'}}>
                           <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'var(--accent)'}} />
                           {e.venue}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-premium ${e.type === 'Terminal' ? 'badge-primary' : 'badge-gold'}`} style={{fontSize:'10px'}}>
                           {e.type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                         <span style={{fontSize:'13px', opacity:0.8}}>{e.invigilator || 'Staff TBD'}</span>
                      </td>
                      {isAdmin && (
                        <td className="text-right">
                           <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                              <button className="btn-icon-premium" onClick={() => openForm('exam', e)}>
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button className="btn-icon-premium delete" onClick={() => handleDelete(setExams, e.id, 'Exam', 'id')}>
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                           </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredExams.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} style={{textAlign:'center', padding:'40px', opacity:0.4}}>
                      No examination sessions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
