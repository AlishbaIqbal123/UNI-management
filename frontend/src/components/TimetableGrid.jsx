import React from 'react';

const TimetableGrid = ({ entries, title }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [1, 2, 3, 4, 5, 6];
  const timeLabels = [
    "8:30 - 10:00",
    "10:00 - 11:30",
    "11:30 - 1:00",
    "1:30 - 3:00",
    "3:00 - 4:30",
    "4:30 - 6:00"
  ];

  const getEntry = (day, slot) => {
    return entries.find(e => e.day === day && e.slot_number === slot);
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium" style={{marginBottom: '32px'}}>
        <h1>{title}</h1>
        <p>Weekly academic schedule for the current semester.</p>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state card" style={{padding: '60px', textAlign: 'center'}}>
          <div className="empty-state-icon">📅</div>
          <h2>Timetable Not Published</h2>
          <p>The institutional schedule for this semester has not been finalized or published yet. Please check back later or contact the Department Hub.</p>
        </div>
      ) : (
        <div className="table-wrapper card" style={{padding: '0', overflowX: 'auto'}}>
          <table className="timetable-grid min-w-table" style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr>
              <th style={{
                background: 'var(--color-ink)', 
                color: 'white', 
                padding: '16px', 
                border: '1px solid var(--color-border)',
                width: '100px'
              }}>Day</th>
              {timeLabels.map((label, i) => (
                <th key={i} style={{
                  background: 'var(--color-ink)', 
                  color: 'white', 
                  padding: '16px', 
                  border: '1px solid var(--color-border)',
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  Slot {i + 1}<br/>
                  <span style={{fontWeight: 400, opacity: 0.8}}>{label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td style={{
                  fontWeight: 700, 
                  padding: '16px', 
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  textAlign: 'center'
                }}>{day}</td>
                {(() => {
                  const cells = [];
                  let skipCount = 0;
                  
                  for (let s = 1; s <= slots.length; s++) {
                    if (skipCount > 0) {
                      skipCount--;
                      continue;
                    }

                    const entry = getEntry(day, s);
                    const isLab = entry?.session_type === 'lab';
                    const span = entry?.span || 1;
                    if (span > 1) skipCount = span - 1;
                    
                    cells.push(
                      <td key={s} colSpan={span} style={{
                        padding: '12px', 
                        border: '1px solid var(--color-border)',
                        verticalAlign: 'top',
                        minHeight: '80px',
                        width: `${150 * span}px`,
                        background: isLab ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent'
                      }}>
                        {entry ? (
                          <div style={{fontSize: '12px'}}>
                            <div style={{fontWeight: 700, marginBottom: '4px', lineHeight: 1.2}}>
                              {entry.subject}
                              {isLab && <span style={{color: 'var(--color-accent)', marginLeft: '4px'}}>[LAB]</span>}
                            </div>
                            <div style={{opacity: 0.7, marginBottom: '2px'}}>Room: {entry.room_code}</div>
                            <div style={{fontSize: '11px', fontWeight: 600}}>
                              {entry.instructor || entry.batch_section}
                            </div>
                          </div>
                        ) : (
                          <div style={{opacity: 0.2, textAlign: 'center', fontSize: '10px'}}>--</div>
                        )}
                      </td>
                    );
                  }
                  return cells;
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      
      <div style={{marginTop: '24px', fontSize: '12px', opacity: 0.6}}>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
            <div style={{width: '12px', height: '12px', background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', border: '1px solid var(--color-border)'}} />
            <span>Practical / Lab Session</span>
          </div>
          <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
            <div style={{width: '12px', height: '12px', background: 'transparent', border: '1px solid var(--color-border)'}} />
            <span>Theoretical Lecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
