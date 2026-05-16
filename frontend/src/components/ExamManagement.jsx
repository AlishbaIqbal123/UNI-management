import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';

const ExamManagement = ({ 
  user, 
  students = [], 
  courses = [], 
  departments = [], 
  assessments = [], 
  setAssessments, 
  marks = [], 
  setMarks, 
  enrolments = [], 
  notify,
  exams = [],
  setExams,
  openForm,
  handleDelete
}) => {
  const [selDept, setSelDept] = useState('');
  const [selCourse, setSelCourse] = useState('');
  const [selSection, setSelSection] = useState('');
  
  const [activeView, setActiveView] = useState('overview'); // overview, entry, summary
  const [selAsst, setSelAsst] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddAsst, setShowAddAsst] = useState(false);
  const [newAsst, setNewAsst] = useState({ type: 'quiz', title: '', total_marks: 0 });

  // Filtering Logic
  const filteredCourses = courses.filter(c => {
    const facultyMatch = user.role === 'Admin' || c.assignedFacultyID === user.id || c.assignedFacultyID === user.dbID;
    return facultyMatch && (!selDept || departments.find(d => d.departmentID === selDept)?.departmentName === c.department);
  });

  const availableSections = ['A', 'B', 'C', 'D']; // Mocked sections, in real app would come from enrollments
  
  const isSelectionComplete = selDept && selCourse && selSection;

  // Data for current selection
  const currentAssessments = assessments.filter(a => a.courseID === selCourse && a.section === selSection);
  const courseEnrolments = enrolments.filter(e => e.courseID === selCourse && e.status === 'Confirmed');
  const sessionStudents = students.filter(s => courseEnrolments.some(e => e.studentID === s.id || e.studentID === s.dbID));

  const handleSaveMarks = async (marksToSave) => {
    setIsSaving(true);
    try {
      if (isDatabaseConnected()) {
        const { error } = await supabase.from('marks').upsert(marksToSave);
        if (error) throw error;
      } else {
        setMarks(prev => {
          const next = [...prev];
          marksToSave.forEach(m => {
            const idx = next.findIndex(nm => nm.assessmentID === m.assessment_id && nm.studentID === m.student_id);
            if (idx > -1) next[idx] = { ...next[idx], obtainedMarks: m.obtained_marks, remarks: m.remarks };
            else next.push({ assessmentID: m.assessment_id, studentID: m.student_id, obtainedMarks: m.obtained_marks, remarks: m.remarks, id: Math.random().toString() });
          });
          return next;
        });
      }
      notify("🎯 Marks Synchronized Successfully");
      setActiveView('overview');
    } catch (err) {
      console.error(err);
      notify("Error saving marks", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAsst = async () => {
    if (isSaving) return;
    if (!newAsst.title || newAsst.total_marks <= 0) return notify("Please provide title and valid marks", "error");
    
    // Check for duplicate Midterm/Final
    if (newAsst.type === 'midterm' || newAsst.type === 'final') {
      const exists = currentAssessments.find(a => a.type === newAsst.type);
      if (exists) return notify(`${newAsst.type.toUpperCase()} already initialized for this section`, "error");
    }

    setIsSaving(true);
    const asstData = {
      ...newAsst,
      course_id: selCourse,
      section: selSection,
      department: selDept,
      created_by: user.id || user.dbID
    };

    try {
      if (isDatabaseConnected()) {
        const { error } = await supabase.from('assessments').insert([asstData]);
        if (error) throw error;
      } else {
        setAssessments(prev => [...prev, { ...asstData, id: Date.now().toString(), courseID: selCourse, totalMarks: newAsst.total_marks }]);
      }
      notify(`Initialized ${newAsst.type}: ${newAsst.title}`);
      setShowAddAsst(false);
      setNewAsst({ type: 'quiz', title: '', total_marks: 0 }); // Reset form
    } catch (err) {
      console.error(err);
      notify(err.message || "Error creating assessment", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderOverview = () => {
    const types = [
      { id: 'quiz', label: 'Quizzes' },
      { id: 'assignment', label: 'Assignments' },
      { id: 'midterm', label: 'Midterm Exam' },
      { id: 'final', label: 'Final Exam' }
    ];

    return (
      <div className="grid-2-cols fade-in" style={{gap: '24px'}}>
        {types.map(t => {
          const typeAssts = currentAssessments.filter(a => a.type === t.id);
          const submittedCount = typeAssts.filter(a => marks.some(m => m.assessmentID === a.id && m.obtainedMarks !== null)).length;
          const pendingCount = typeAssts.length - submittedCount;

          return (
            <div key={t.id} className="card" style={{padding: '32px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px'}}>
                <h2 style={{margin: 0}}>{t.label}</h2>
                <span className="badge-premium badge-gold" style={{fontSize: '10px'}}>{typeAssts.length} Total</span>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                   <span style={{opacity: 0.6}}>Submitted Records:</span>
                   <span style={{fontWeight: 700, color: 'var(--color-accent)'}}>{submittedCount}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
                   <span style={{opacity: 0.6}}>Pending Evaluations:</span>
                   <span style={{fontWeight: 700, color: pendingCount > 0 ? 'var(--color-danger)' : 'var(--text-dim)'}}>{pendingCount}</span>
                </div>
              </div>

              <div style={{display: 'flex', gap: '12px'}}>
                <button className="btn-primary-premium" style={{flex: 1}} onClick={() => { setNewAsst({...newAsst, type: t.id}); setShowAddAsst(true); }}>+ Create New</button>
                {typeAssts.length > 0 && (
                  <select 
                    className="input-premium" 
                    style={{width: '120px', fontSize: '11px'}}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelAsst(typeAssts.find(a => a.id === e.target.value));
                        setActiveView('entry');
                      }
                    }}
                  >
                    <option value="">Edit Marks</option>
                    {typeAssts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMarksEntry = () => {
    if (!selAsst) return null;
    const currentMarks = marks.filter(m => m.assessmentID === selAsst.id);
    
    return (
      <div className="fade-in">
        <div className="card mb-24" style={{padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <button className="btn-text-only" onClick={() => setActiveView('overview')}>← Back to Overview</button>
            <h2 style={{margin: '8px 0 0 0'}}>{selAsst.title} Scoring Grid</h2>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)'}}>{currentMarks.length} / {sessionStudents.length} Marked</div>
            <button className="btn-primary-premium mt-12" style={{background: 'var(--color-ink)', color: 'var(--color-bg)'}} onClick={() => {
              const toSave = sessionStudents.map(s => {
                const input = document.getElementById(`mark-${s.id || s.dbID}`);
                const remark = document.getElementById(`remark-${s.id || s.dbID}`);
                const val = input.value === '' ? null : parseFloat(input.value);
                
                return {
                  assessment_id: selAsst.id,
                  student_id: s.id || s.dbID,
                  obtained_marks: isNaN(val) ? null : val,
                  remarks: remark.value,
                  submitted_at: new Date().toISOString()
                };
              });
              
              // Basic validation: Check if any marks exceed total
              const invalid = toSave.find(m => m.obtained_marks > selAsst.totalMarks);
              if (invalid) return notify("Some entries exceed total marks", "error");

              handleSaveMarks(toSave);
            }} disabled={isSaving}>{isSaving ? 'Synchronizing...' : 'Commit Changes'}</button>
          </div>
        </div>

        {isSaving && <div className="loading-pulse mb-12" />}

        <div className="table-wrapper card">
          <table className="premium-table min-w-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Reg No</th>
                <th style={{width: '150px'}}>Obtained Marks</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {sessionStudents.map(s => {
                const mark = currentMarks.find(m => m.studentID === (s.id || s.dbID));
                return (
                  <tr key={s.id || s.dbID}>
                    <td style={{fontWeight: 600}}>{s.name}</td>
                    <td className="font-monospace" style={{fontSize: '12px'}}>{s.regNumber || s.id}</td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <input 
                          id={`mark-${s.id || s.dbID}`}
                          type="number" 
                          className="input-premium" 
                          style={{width: '80px', textAlign: 'center', border: '1px solid var(--color-accent)'}}
                          defaultValue={mark?.obtainedMarks ?? ''}
                          max={selAsst.totalMarks}
                          min={0}
                        />
                        <span style={{opacity: 0.5}}>/ {selAsst.totalMarks}</span>
                      </div>
                    </td>
                    <td>
                      <input 
                        id={`remark-${s.id || s.dbID}`}
                        className="input-premium" 
                        style={{fontSize: '12px'}} 
                        placeholder="Optional remarks..."
                        defaultValue={mark?.remarks || ''}
                      />
                    </td>
                  </tr>
                );
              })}
              {sessionStudents.length === 0 && (
                <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', opacity:0.5}}>No students currently enrolled in this section.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    return (
      <div className="fade-in">
        <div className="card mb-24" style={{padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <h2 style={{margin:0}}>Master Performance Matrix</h2>
           <button className="btn-text-only" onClick={() => setActiveView('overview')}>Return to Overview</button>
        </div>
        <div className="table-wrapper card">
          <table className="premium-table min-w-table">
            <thead>
              <tr>
                <th style={{position: 'sticky', left: 0, background: 'var(--color-ink)', color: 'white', zIndex: 10}}>Candidate</th>
                {currentAssessments.map(a => (
                  <th key={a.id} style={{textAlign: 'center', fontSize: '11px'}}>
                    {a.title}<br/>
                    <small style={{opacity: 0.7}}>{a.totalMarks}M</small>
                  </th>
                ))}
                <th style={{textAlign: 'right', background: 'var(--color-bg)', color: 'var(--color-accent)'}}>Aggregate %</th>
              </tr>
            </thead>
            <tbody>
              {sessionStudents.map(s => {
                let totalObtained = 0;
                let totalPossible = 0;

                return (
                  <tr key={s.id || s.dbID}>
                    <td style={{fontWeight: 600, position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 5}}>{s.name}</td>
                    {currentAssessments.map(a => {
                      const mark = marks.find(m => m.assessmentID === a.id && m.studentID === (s.id || s.dbID));
                      const isPending = mark?.obtainedMarks === null || mark === undefined;
                      if (!isPending) {
                        totalObtained += parseFloat(mark.obtainedMarks);
                        totalPossible += parseFloat(a.totalMarks);
                      }
                      return (
                        <td key={a.id} style={{
                          textAlign: 'center', 
                          background: isPending ? 'var(--color-border)' : 'transparent',
                          opacity: isPending ? 0.3 : 1
                        }}>
                          {isPending ? '—' : mark.obtainedMarks}
                        </td>
                      );
                    })}
                    <td className="text-right" style={{fontWeight: 800, color: 'var(--color-accent)'}}>
                      {totalPossible > 0 ? `${((totalObtained / totalPossible) * 100).toFixed(1)}%` : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="view-container fade-in">
      {/* Panel 1 — Selection Bar (Sticky) */}
      <div className="sticky-top-bar card mb-32" style={{
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center',
        padding: '16px 24px',
        margin: 0,
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        top: 0
      }}>
        <div style={{flex: 1}}>
          <label style={{fontSize: '10px', fontWeight: 700, opacity: 0.5, display: 'block', marginBottom: '4px'}}>DEPARTMENT</label>
          <select className="input-premium" value={selDept} onChange={e => { setSelDept(e.target.value); setSelCourse(''); setSelSection(''); }}>
            <option value="">Select Dept</option>
            {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
          </select>
        </div>
        <div style={{flex: 1}}>
          <label style={{fontSize: '10px', fontWeight: 700, opacity: 0.5, display: 'block', marginBottom: '4px'}}>COURSE</label>
          <select className="input-premium" value={selCourse} onChange={e => { setSelCourse(e.target.value); setSelSection(''); }} disabled={!selDept}>
            <option value="">{filteredCourses.length > 0 ? "Select Course" : "No Courses Assigned"}</option>
            {filteredCourses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseID}: {c.courseName}</option>)}
          </select>
        </div>
        <div style={{flex: 1}}>
          <label style={{fontSize: '10px', fontWeight: 700, opacity: 0.5, display: 'block', marginBottom: '4px'}}>SECTION</label>
          <select className="input-premium" value={selSection} onChange={e => setSelSection(e.target.value)} disabled={!selCourse}>
            <option value="">Select Section</option>
            {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
        <div style={{display: 'flex', gap: '8px', paddingTop: '18px'}}>
           <button className={activeView === 'overview' ? 'btn-primary-premium' : 'btn-text-only'} onClick={() => setActiveView('overview')} disabled={!isSelectionComplete}>Evaluation Hub</button>
           <button className={activeView === 'summary' ? 'btn-primary-premium' : 'btn-text-only'} onClick={() => setActiveView('summary')} disabled={!isSelectionComplete}>Performance Matrix</button>
        </div>
      </div>

      {/* NEW: PDF Schedule Hub */}
      <div className="card mb-32" style={{
        background: 'var(--color-ink)', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '20px 32px'
      }}>
        <div>
          <h3 style={{color: 'white', margin: 0, fontSize: '18px'}}>Official Institutional Date Sheet (PDF)</h3>
          <p style={{margin: '4px 0 0 0', opacity: 0.7, fontSize: '12px'}}>Access the master examination schedule as published by the Registrar's Office.</p>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          {exams.some(e => e.type === 'pdf_schedule') ? (
            <button className="btn-primary-premium" style={{background: 'var(--color-accent)', color: 'var(--color-ink)'}} 
              onClick={() => window.open(exams.find(e => e.type === 'pdf_schedule').fileURL, '_blank')}>
              📄 VIEW OFFICIAL PDF
            </button>
          ) : (
             <span style={{fontSize: '11px', opacity: 0.5, fontStyle: 'italic'}}>No PDF Schedule Uploaded</span>
          )}
          
          {user.role === 'Admin' && (
            <button className="btn-outline" style={{borderColor: 'rgba(255,255,255,0.3)', color: 'white'}} onClick={() => openForm('upload_exam_pdf')}>
              {exams.some(e => e.type === 'pdf_schedule') ? '🔄 UPDATE PDF' : '📤 UPLOAD PDF'}
            </button>
          )}
        </div>
      </div>

      {exams.length > 0 && !selCourse ? (
        <div className="fade-in">
          <div className="view-header-premium">
            <div>
              <h1>Institutional Date Sheet</h1>
              <p>Master schedule for Midterm & Terminal assessments.</p>
            </div>
            {user.role === 'Admin' && <button className="btn-primary-premium" onClick={() => openForm('exam')}>+ Schedule New Exam</button>}
          </div>
          
          <div className="table-card-premium glass-card p-0">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Assessment Type</th>
                  <th>Scheduled Date</th>
                  <th>Venue</th>
                  <th>Invigilator</th>
                  {user.role === 'Admin' && <th>Registry Actions</th>}
                </tr>
              </thead>
              <tbody>
                {exams.map((e, idx) => (
                  <tr key={`exam-row-${idx}-${e.id || 'new'}`}>
                    <td data-label="Course Code" className="font-monospace" style={{fontWeight: 700}}>{e.courseID}</td>
                    <td data-label="Assessment Type"><span className={`badge-premium ${e.type === 'Final' ? 'badge-primary' : 'badge-gold'}`}>{(e.type || 'Exam').toUpperCase()}</span></td>
                    <td data-label="Schedule Date" className="font-monospace">{e.date} — {e.time}</td>
                    <td data-label="Assigned Venue">{e.venue}</td>
                    <td data-label="Invigilator">{e.invigilator || 'TBA'}</td>
                    {user.role === 'Admin' && (
                      <td data-label="Actions">
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button className="btn-text-only" style={{color: 'var(--color-accent)'}} onClick={() => openForm('exam', e)}>Edit</button>
                          <button className="btn-text-only" style={{color: 'var(--color-danger)'}} onClick={() => handleDelete(setExams, e.id, 'Exam Schedule', 'id')}>Remove</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !isSelectionComplete ? (
        <div className="empty-state card" style={{padding: '100px 40px'}}>
          <div className="empty-state-icon">🔒</div>
          <h2>Pedagogical Repository Locked</h2>
          <p>Please select Department, Course, and Section from the header to access evaluations.</p>
        </div>
      ) : (
        <>
          {activeView === 'overview' && renderOverview()}
          {activeView === 'entry' && renderMarksEntry()}
          {activeView === 'summary' && renderSummary()}
        </>
      )}

      {/* Add Assessment Modal */}
      {showAddAsst && (
        <div className="modal-overlay-premium fade-in">
           <div className="card" style={{width: '400px', border: '1px solid var(--color-ink)'}}>
              <h3>Initialize Evaluation</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px'}}>
                <div>
                  <label style={{fontSize: '12px', opacity: 0.6}}>Evaluation Type</label>
                  <select className="input-premium" value={newAsst.type} onChange={e => setNewAsst({...newAsst, type: e.target.value})}>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize: '12px', opacity: 0.6}}>Short Title</label>
                  <input className="input-premium" placeholder="e.g. Quiz 1" value={newAsst.title} onChange={e => setNewAsst({...newAsst, title: e.target.value})} />
                </div>
                <div>
                  <label style={{fontSize: '12px', opacity: 0.6}}>Total Points</label>
                  <input type="number" className="input-premium" value={newAsst.total_marks} onChange={e => setNewAsst({...newAsst, total_marks: e.target.value})} />
                </div>
                <div style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
                  <button className="btn-text-only" style={{flex: 1}} onClick={() => setShowAddAsst(false)}>Cancel</button>
                  <button className="btn-primary-premium" style={{flex: 1}} onClick={handleAddAsst}>Initialize</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
