import React from 'react';
import { generateInstitutionalReport } from '../lib/exportUtils';

const AcademicResults = ({ results, user, courses }) => {
  const myResults = results.filter(r => r.studentID === user.id || r.studentID === user.dbID);
  
  // Calculate GPA
  const totalGP = myResults.reduce((acc, curr) => acc + (parseFloat(curr.GPA) || 0), 0);
  const avgGPA = myResults.length > 0 ? (totalGP / myResults.length).toFixed(2) : '0.00';

  const formatReportData = () => {
      return myResults.map(r => {
          const course = courses.find(c => c.courseID === r.courseID);
          return {
              Code: r.courseID,
              Title: course?.courseName || 'Record Found',
              Grade: r.grade,
              GPA: r.GPA
          };
      });
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Academic Transcripts</h1>
          <p>Verified records of your pedagogical performance and credit accumulation.</p>
        </div>
        <button className="btn-primary-premium" onClick={() => generateInstitutionalReport('Official Transcript', ['Code', 'Title', 'Grade', 'GPA'], formatReportData())}>
          📄 Generate Transcript
        </button>
      </div>

      <div className="telemetry-grid mt-24 mb-32" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
          <div className="card text-center" style={{padding:'24px'}}>
              <span style={{fontSize:'12px', fontWeight:700, opacity:0.6, textTransform:'uppercase'}}>Current Semester GPA</span>
              <h2 style={{fontSize:'48px', color:'var(--color-accent)', margin:'8px 0'}}>{avgGPA}</h2>
              <span className="badge-premium badge-primary">Level: {avgGPA > 3.5 ? 'Excellent' : 'Stable'}</span>
          </div>
          <div className="card text-center" style={{padding:'24px'}}>
              <span style={{fontSize:'12px', fontWeight:700, opacity:0.6, textTransform:'uppercase'}}>Credits Completed</span>
              <h2 style={{fontSize:'48px', color:'var(--color-ink)', margin:'8px 0'}}>{myResults.length * 3}</h2>
              <span className="badge-premium" style={{background:'var(--surface-container-high)', color:'var(--color-ink)'}}>Total Required: 136</span>
          </div>
      </div>

      <div className="table-wrapper card">
        <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>Course Mapping</th>
              <th>Credit Logic</th>
              <th>Academic Grade</th>
              <th>GPA Point</th>
            </tr>
          </thead>
          <tbody>
            {myResults.map(r => {
                const course = courses.find(c => c.courseID === r.courseID);
                return (
                  <tr key={r.resultID}>
                    <td>
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontWeight:600}}>{course?.courseName || 'Institutional Subject'}</span>
                        <span className="font-monospace" style={{fontSize:'11px', opacity:0.6}}>{r.courseID}</span>
                      </div>
                    </td>
                    <td>3 Credits</td>
                    <td>
                      <span className={`badge-premium ${r.grade.startsWith('A') ? 'badge-primary' : 'badge-gold'}`}>{r.grade}</span>
                    </td>
                    <td className="font-monospace" style={{fontWeight:700}}>{r.GPA}</td>
                  </tr>
                );
            })}
          </tbody>
        </table>
        {myResults.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h2>No Transcripts Issued</h2>
            <p>Your academic results for the current cycle have not yet been finalized in the institutional registry.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicResults;
