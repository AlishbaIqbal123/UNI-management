import React from 'react';

/**
 * CourseManagement — Academic Registry Edition
 * Features: Faculty Assignment Mapping, Student Roster Audits, and Credit Load Control.
 */
const CourseManagement = ({ courses, setCourses, faculty, enrolments, user, openForm, handleDelete }) => {
  const isRegistrar = user.role === 'Admin';

  const getFacultyName = (facultyID) => {
    return faculty.find(f => f.id === facultyID)?.facultyName || 'No Faculty Assigned';
  };

  const getStudentCount = (courseID) => {
    return enrolments.filter(e => e.courseID === courseID).length;
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Academic Course Catalog</h1>
          <p>Official registry of university-approved pedagogical offerings and instructor assignments.</p>
        </div>
        {isRegistrar && (
          <button className="btn-primary-premium" onClick={() => openForm('course')}>
            + Commission New Course
          </button>
        )}
      </div>

      <div className="table-wrapper card">
        <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>Course Information</th>
              <th>Academic Lecturer</th>
              <th className="text-center">Enrolled</th>
              <th>Credit Logic</th>
              <th className="text-right">Administrative</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.courseID}>
                <td>
                  <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{fontWeight:600}}>{c.courseName}</span>
                    <span className="font-monospace" style={{fontSize:'10px', opacity:0.6}}>{c.courseID}</span>
                  </div>
                </td>
                <td>
                  <div className="faculty-assignment-cell">
                     <span style={{fontSize:'13px', fontWeight:600}}>{getFacultyName(c.assignedFacultyID)}</span>
                     {isRegistrar && (
                       <button 
                        className="btn-text-only" 
                        style={{padding:0, fontSize:'10px', display:'block', color:'var(--color-accent)', fontWeight:700}}
                        onClick={() => openForm('assign_faculty', c)}
                       >
                          REASSIGN FACULTY
                       </button>
                     )}
                  </div>
                </td>
                <td className="text-center">
                  <button 
                    className="badge-premium badge-gold" 
                    style={{cursor:'pointer', border:'none', fontWeight:800}}
                    onClick={() => openForm('course_roster', c)}
                  >
                    {getStudentCount(c.courseID)} STUDENTS
                  </button>
                </td>
                <td><span className="badge-premium badge-primary">{c.credits} CR.HRS</span></td>
                <td className="text-right">
                  <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                    <button className="btn-icon-premium" onClick={() => openForm('course_roster', c)} title="View Student Roster">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </button>
                    {isRegistrar && (
                      <>
                        <button className="btn-icon-premium" onClick={() => openForm('course', c)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className="btn-icon-premium delete" style={{color:'var(--color-danger)', borderColor:'var(--color-danger)'}} onClick={() => handleDelete(setCourses, c.courseID, 'Course', 'courseID')}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseManagement;
