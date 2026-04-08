import React from 'react';

const CourseManagement = ({ courses, setCourses, user, openForm, handleDelete }) => {
  const isRegistrar = user.role === 'Admin' || user.role === 'Faculty';

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Academic Course Catalog</h1>
          <p>Official registry of university-approved pedagogical offerings.</p>
        </div>
        {isRegistrar && (
            <button className="btn-primary-premium" onClick={() => openForm('course')}>
              + Commission New Course
            </button>
        )}
      </div>

      <div className="table-card-premium glass-card">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Institutional Title</th>
                <th>Prerequisites</th>
                <th>Credit Load</th>
                {isRegistrar && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.courseID}>
                  <td className="font-monospace">#{c.courseID}</td>
                  <td><span className="user-name-cell">{c.courseName}</span></td>
                  <td><span className="badge-premium" style={{background:'rgba(255,255,255,0.05)'}}>{c.prerequisites?.join(', ') || 'N/A'}</span></td>
                  <td><span className="badge-premium badge-primary">{c.credits} Cr.Hrs</span></td>
                  {isRegistrar && (
                    <td className="text-right">
                        <button className="btn-icon-premium" onClick={() => openForm('course', c)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className="btn-icon-premium delete" onClick={() => handleDelete(setCourses, c.courseID, 'Course', 'courseID')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
