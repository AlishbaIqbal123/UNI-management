import React from 'react';

const TimetableGrid = ({ entries, title }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [1, 2, 3, 4, 5, 6];
  const timeLabels = [
    "8:30 - 10:00 AM",
    "10:00 - 11:30 AM",
    "11:30 - 1:00 PM",
    "1:30 - 3:00 PM",
    "3:00 - 4:30 PM",
    "4:30 - 6:00 PM"
  ];

  const getEntry = (day, slot) => {
    return entries.find(e => e.day === day && e.slot_number === slot);
  };

  const handleExportCSV = () => {
    if (!entries || !entries.length) return alert('No timetable entries to export');

    const csvRows = [];
    // Header Row
    const headers = ['Day', ...timeLabels.map((lbl, idx) => `Slot ${idx + 1} (${lbl})`)];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    // Data Rows
    days.forEach(day => {
      const row = [day];
      for (let s = 1; s <= slots.length; s++) {
        const entry = getEntry(day, s);
        if (entry) {
          const detail = `${entry.subject} (Room: ${entry.room_code})${entry.instructor ? ' - ' + entry.instructor : ''}${entry.batch_section ? ' - ' + entry.batch_section : ''}`.trim();
          row.push(detail);
        } else {
          // Check if covered by a span from previous slot
          const spanningEntry = entries.find(e => e.day === day && s > e.slot_number && s < e.slot_number + (e.span || 1));
          if (spanningEntry) {
            row.push(`[Continued: ${spanningEntry.subject}]`);
          } else {
            row.push('--');
          }
        }
      }
      csvRows.push(row.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Timetable.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    
    let tableBodyHtml = '';
    days.forEach(day => {
      let rowHtml = `<tr><td style="font-weight: 700; padding: 16px; border: 1px solid #ddd; background: #fdfdfd; text-align: center; font-size: 13px;">${day}</td>`;
      
      let skipCount = 0;
      for (let s = 1; s <= slots.length; s++) {
        if (skipCount > 0) {
          skipCount--;
          continue;
        }

        const entry = getEntry(day, s);
        const span = entry?.span || 1;
        if (span > 1) skipCount = span - 1;

        if (entry) {
          const isLab = entry.session_type === 'lab';
          rowHtml += `
            <td colspan="${span}" style="padding: 14px; border: 1px solid #ddd; vertical-align: top; background: ${isLab ? '#eaf4ff' : '#ffffff'}; font-size: 12px; line-height: 1.4;">
              <div style="font-weight: 800; margin-bottom: 6px; color: #1a3a6b; font-size: 13px;">
                ${entry.subject} ${isLab ? '<span style="color: #0d47a1; font-size: 10px; font-weight: 800; margin-left: 6px; padding: 2px 6px; background: rgba(13,71,161,0.1); border-radius: 3px;">LAB</span>' : ''}
              </div>
              <div style="opacity: 0.8; margin-bottom: 4px; color: #444;"><strong>Room:</strong> ${entry.room_code}</div>
              <div style="font-weight: 600; color: #666; font-size: 11px;">
                ${entry.instructor || entry.batch_section || 'N/A'}
              </div>
            </td>
          `;
        } else {
          rowHtml += `
            <td style="padding: 14px; border: 1px solid #ddd; vertical-align: middle; text-align: center; color: #ccc; font-size: 12px; background: #fafafa;">
              --
            </td>
          `;
        }
      }
      rowHtml += '</tr>';
      tableBodyHtml += rowHtml;
    });

    const html = `
      <html>
        <head>
          <title>COMSATS University Islamabad - Timetable Schedule</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1a1a1a; background: #fff; }
            .header { display: flex; align-items: center; border-bottom: 4px solid #1a3a6b; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { width: 80px; height: 80px; margin-right: 25px; }
            .title-area h1 { margin: 0; font-size: 26px; color: #1a3a6b; letter-spacing: 0.5px; }
            .title-area p { margin: 6px 0 0; font-size: 14px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: avoid; }
            th { background: #1a3a6b; color: #ffffff; text-align: center; padding: 14px; border: 1px solid #1a3a6b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { border: 1px solid #ddd; }
            .legend { display: flex; gap: 24px; margin-top: 30px; font-size: 12px; color: #444; border-top: 1px solid #eee; padding-top: 20px; }
            .legend-item { display: flex; align-items: center; gap: 8px; }
            .legend-color { width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 4px; }
            .footer { margin-top: 50px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="University Logo" />
            <div class="title-area">
              <h1>COMSATS University Islamabad</h1>
              <p><strong>Official Timetable:</strong> ${title}</p>
              <p style="font-size: 11px">Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 120px;">Day</th>
                ${timeLabels.map((lbl, idx) => `
                  <th>
                    Slot ${idx + 1}<br/>
                    <span style="font-weight: normal; font-size: 10px; opacity: 0.85;">${lbl}</span>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableBodyHtml}
            </tbody>
          </table>
          <div class="legend">
            <div class="legend-item">
              <div class="legend-color" style="background: #eaf4ff; border-color: #bbdefb;"></div>
              <span>Practical / Lab Session</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #ffffff;"></div>
              <span>Theoretical Lecture</span>
            </div>
          </div>
          <div class="footer">
            <p>This timetable was generated officially via the CUI University Management System.</p>
            <p>© 2026 COMSATS University Islamabad - Academic Registry Office</p>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium" style={{marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'}}>
        <div>
          <h1>{title}</h1>
          <p>Weekly academic schedule for the current semester.</p>
        </div>
        {entries.length > 0 && (
          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <button 
              onClick={handleExportCSV} 
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-border)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📥 Export CSV
            </button>
            <button 
              onClick={handlePrintPDF} 
              style={{
                background: 'var(--color-ink)',
                color: 'white',
                border: '1px solid var(--color-ink)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--color-ink) 80%, white)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-ink)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🖨️ Print / PDF
            </button>
          </div>
        )}
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
