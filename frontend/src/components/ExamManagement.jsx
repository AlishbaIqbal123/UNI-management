import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';
import * as XLSX from 'xlsx';

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

  const isGradingMode = !!setAssessments && (user.role === 'Faculty' || user.role === 'Admin');

  // --- Excel Import State ---
  const [activeTab, setActiveTab]         = useState('pdf');       // 'pdf' or 'excel'
  const [selectedFile, setSelectedFile]   = useState(null);
  const [semesterLabel, setSemesterLabel] = useState('');
  const [parseLoading, setParseLoading]   = useState(false);
  const [previewData, setPreviewData]     = useState(null);        // { dept: [...entries] }
  const [activeDept, setActiveDept]       = useState('');
  const [saving, setSaving]               = useState(false);
  const [uploads, setUploads]             = useState([]);
  const [viewingUpload, setViewingUpload] = useState(null);
  const [viewEntries, setViewEntries]     = useState([]);
  const [search, setSearch]               = useState('');
  const [error, setError]                 = useState(null);
  const [successMsg, setSuccessMsg]       = useState(null);

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

  // --- Data Fetching ---
  const fetchUploads = async () => {
    if (!isDatabaseConnected()) return;
    try {
      const { data, error } = await supabase
        .from('exam_schedule_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.warn("Exam schedule tables not found. Please run the migration: 20260516194000_exam_schedule_excel.sql");
          return; // Silently fail but log warning
        }
        throw error;
      }
      setUploads(data || []);
    } catch (err) {
      console.error("Fetch Uploads Error:", err);
    }
  };

  const fetchEntries = async (uploadId) => {
    if (!isDatabaseConnected()) return;
    try {
      const { data, error } = await supabase
        .from('exam_schedule_entries')
        .select('*')
        .eq('upload_id', uploadId)
        .order('exam_date', { ascending: true });
      if (error) throw error;
      setViewEntries(data || []);
    } catch (err) {
      console.error("Fetch Entries Error:", err);
    }
  };

  React.useEffect(() => {
    fetchUploads();
  }, []);

  React.useEffect(() => {
    if (viewingUpload) {
      if (viewingUpload.upload_type === 'excel') {
        fetchEntries(viewingUpload.id);
        setActiveDept('all');
      }
    }
  }, [viewingUpload]);

  // --- Drag & Drop ---
  React.useEffect(() => {
    if (user.role !== 'Admin' || activeTab !== 'excel') return;
    const zone = document.getElementById('excel-drop-zone');
    if (!zone) return;

    const onDragOver = (e) => { e.preventDefault(); zone.classList.add('drag-over'); };
    const onDragLeave = () => zone.classList.remove('drag-over');
    const onDrop = (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) processExcelFile(file);
    };

    zone.addEventListener('dragover', onDragOver);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('drop', onDrop);
    return () => {
      zone.removeEventListener('dragover', onDragOver);
      zone.removeEventListener('dragleave', onDragLeave);
      zone.removeEventListener('drop', onDrop);
    };
  }, [user.role, activeTab]);

  // --- Excel Processing ---
  const handleExcelFile = (e) => {
    const file = e.target.files[0];
    if (file) processExcelFile(file);
  };

  const processExcelFile = (file) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    setParseLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const parsed = parseWorkbook(workbook);
        setPreviewData(parsed);
        const depts = Object.keys(parsed);
        if (depts.length > 0) setActiveDept(depts[0]);
        setSelectedFile(file);
      } catch (err) {
        setError('Failed to read Excel file. Please check format.');
      } finally {
        setParseLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseWorkbook = (workbook) => {
    const departments = {};
    const COLUMN_MAP = {
      course_code:   ['course code', 'code', 'course no', 'course#', 'subject code'],
      course_title:  ['course title', 'title', 'subject', 'course name', 'subject name', 'paper'],
      exam_date:     ['date', 'exam date', 'examination date', 'day/date'],
      exam_day:      ['day', 'exam day', 'weekday'],
      start_time:    ['start time', 'from', 'time from', 'start', 'exam time', 'time'],
      end_time:      ['end time', 'to', 'time to', 'end', 'finish'],
      venue:         ['venue', 'room', 'hall', 'location', 'center', 'place'],
      batch_section: ['section', 'batch', 'class', 'group', 'batch/section', 'section/batch'],
      credit_hours:  ['credit hours', 'cr hrs', 'credits', 'cr.hrs', 'credit'],
      remarks:       ['remarks', 'note', 'notes', 'comment', 'comments'],
    };

    const findColumn = (headerRow, fieldAliases) => {
      const normalized = headerRow.map(h => String(h || '').toLowerCase().trim());
      for (const alias of fieldAliases) {
        const idx = normalized.findIndex(h => h.includes(alias));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    workbook.SheetNames.forEach(sheetName => {
      const trimmed = sheetName.trim();
      if (!trimmed || (trimmed.toLowerCase() === 'sheet1' && workbook.SheetNames.length > 1)) return;
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rows.length < 2) return;

      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const nonEmpty = rows[i].filter(c => String(c).trim() !== '').length;
        if (nonEmpty >= 3) { headerRowIdx = i; break; }
      }

      const headerRow = rows[headerRowIdx].map(h => String(h || '').toLowerCase().trim());
      const colIdx = {};
      Object.entries(COLUMN_MAP).forEach(([field, aliases]) => { colIdx[field] = findColumn(headerRow, aliases); });

      const entries = [];
      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.every(c => String(c).trim() === '')) continue;
        const titleIdx = colIdx['course_title'];
        if (titleIdx === -1 || !String(row[titleIdx] || '').trim()) continue;

        const getVal = (field) => {
          const idx = colIdx[field];
          if (idx === -1) return '';
          return String(row[idx] || '').trim();
        };

        let examDate = null;
        const rawDate = colIdx['exam_date'] !== -1 ? row[colIdx['exam_date']] : null;
        if (rawDate) {
          if (rawDate instanceof Date) examDate = rawDate.toISOString().split('T')[0];
          else if (typeof rawDate === 'number') {
            const d = XLSX.SSF.parse_date_code(rawDate);
            examDate = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
          } else {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed)) examDate = parsed.toISOString().split('T')[0];
            else examDate = String(rawDate);
          }
        }

        entries.push({
          department: trimmed,
          course_code: getVal('course_code'),
          course_title: getVal('course_title'),
          exam_date: examDate,
          exam_day: getVal('exam_day'),
          start_time: getVal('start_time'),
          end_time: getVal('end_time'),
          venue: getVal('venue'),
          batch_section: getVal('batch_section'),
          credit_hours: getVal('credit_hours'),
          remarks: getVal('remarks'),
        });
      }
      if (entries.length > 0) departments[trimmed] = entries;
    });
    return departments;
  };

  const saveSchedule = async () => {
    if (!semesterLabel.trim()) return setError('Please enter a semester label.');
    setSaving(true);
    setError(null);
    try {
      if (isDatabaseConnected()) {
        const { data: upload, error: uErr } = await supabase.from('exam_schedule_uploads').insert({
          file_name: selectedFile.name, upload_type: 'excel', semester: semesterLabel.trim()
        }).select().single();
        
        if (uErr) {
          if (uErr.code === 'PGRST204' || uErr.code === 'PGRST205' || uErr.message.includes('not found')) {
            throw new Error("Database tables not found. Please run the SQL migration first.");
          }
          throw uErr;
        }

        const allEntries = [];
        Object.values(previewData).forEach(deptEntries => {
          deptEntries.forEach(entry => { allEntries.push({ ...entry, upload_id: upload.id }); });
        });

        const BATCH = 100;
        for (let i = 0; i < allEntries.length; i += BATCH) {
          const { error: iErr } = await supabase.from('exam_schedule_entries').insert(allEntries.slice(i, i + BATCH));
          if (iErr) throw iErr;
        }
      }
      setSuccessMsg(`Synchronized ${Object.keys(previewData).length} departments successfully.`);
      setPreviewData(null); setSelectedFile(null); setSemesterLabel('');
      fetchUploads();
    } catch (err) { setError(`Save failed: ${err.message}`); } finally { setSaving(false); }
  };

  const handleDeleteUpload = async (id) => {
    if (!isDatabaseConnected()) return;
    try {
      const { error } = await supabase.from('exam_schedule_uploads').delete().eq('id', id);
      if (error) throw error;
      notify("Institutional Record Purged Successfully");
      fetchUploads();
    } catch (err) { notify(err.message, "error"); }
  };

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

  if (isGradingMode) {
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
              {departments.map((d, idx) => <option key={`${d.departmentID}-${idx}`} value={d.departmentID}>{d.departmentName}</option>)}
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

        {!isSelectionComplete ? (
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
  }

  // --- Exam Schedule View ---
  return (
    <div className="view-container fade-in">
      {viewingUpload ? (
        <div className="schedule-view-page fade-in">
          <div className="schedule-view-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
            <div>
              <div style={{fontSize:'12px', opacity:0.6, marginBottom:'4px'}}>Exam Schedule / {viewingUpload.semester}</div>
              <h2 style={{margin:0}}>{viewingUpload.semester} — Official Date Sheet</h2>
              <p style={{margin:'4px 0 0 0', opacity:0.7, fontSize:'13px'}}>
                {viewEntries.length} exams across {new Set(viewEntries.map(e => e.department)).size} department(s)
              </p>
            </div>
            <button className="btn-primary-premium" onClick={() => setViewingUpload(null)}>← BACK TO HUB</button>
          </div>

          <div className="schedule-search mb-24">
            <input 
              className="input-premium" 
              placeholder="Search by Course, Venue, or Section..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{maxWidth: '400px'}}
            />
          </div>

          <div className="dept-tabs-bar" style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px', borderBottom:'1px solid var(--color-border)', paddingBottom:'16px'}}>
            <button className={`dept-tab ${activeDept === 'all' ? 'active' : ''}`} onClick={() => setActiveDept('all')}>
              All Departments <span className="dept-count" style={{marginLeft:'6px', opacity:0.6}}>{viewEntries.length}</span>
            </button>
            {[...new Set(viewEntries.map(e => e.department))].sort().map(dept => (
              <button key={dept} className={`dept-tab ${activeDept === dept ? 'active' : ''}`} onClick={() => setActiveDept(dept)}>
                {dept} <span className="dept-count" style={{marginLeft:'6px', opacity:0.6}}>{viewEntries.filter(e => e.department === dept).length}</span>
              </button>
            ))}
          </div>

          <div className="table-wrapper card" style={{padding:0}}>
            <table className="premium-table">
              <thead>
                <tr>
                  {activeDept === 'all' && <th>Dept</th>}
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Section</th>
                  <th>Cr.Hrs</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {viewEntries
                  .filter(e => activeDept === 'all' || e.department === activeDept)
                  .filter(e => {
                    if (!search.trim()) return true;
                    const q = search.toLowerCase();
                    return (e.course_title?.toLowerCase().includes(q) || e.course_code?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q) || e.batch_section?.toLowerCase().includes(q));
                  })
                  .map((entry, i) => (
                    <tr key={entry.id} className={i % 2 === 0 ? '' : 'row-alt'}>
                      {activeDept === 'all' && <td data-label="Dept"><span className="badge-premium badge-primary">{entry.department}</span></td>}
                      <td data-label="Code" style={{fontWeight:700}}>{entry.course_code || '—'}</td>
                      <td data-label="Title" style={{fontWeight:600}}>{entry.course_title}</td>
                      <td data-label="Date">{entry.exam_date ? new Date(entry.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td data-label="Day">{entry.exam_day || '—'}</td>
                      <td data-label="Time"><strong>{entry.start_time}</strong> — {entry.end_time}</td>
                      <td data-label="Venue">{entry.venue || '—'}</td>
                      <td data-label="Section">{entry.batch_section || '—'}</td>
                      <td data-label="Credits">{entry.credit_hours || '—'}</td>
                      <td data-label="Remarks" style={{fontSize:'11px', opacity:0.7}}>{entry.remarks || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="view-header-premium mb-32">
            <div>
              <h1>{user.role === 'Admin' ? 'Exam Schedule Management' : 'Official Examination Schedules'}</h1>
              <p>{user.role === 'Admin' ? 'Upload, coordinate and broadcast institutional date sheets.' : 'Access and view published mid-term and terminal examination timetables.'}</p>
            </div>
          </div>

          {/* PDF/Excel Uploader (Admin Only) */}
          {user.role === 'Admin' ? (
            <div className="card mb-32" style={{padding:0, overflow:'hidden'}}>
              <div className="tabs-header" style={{display:'flex', background:'var(--color-ink)', padding:'0 24px'}}>
                 <button className={`tab-pill ${activeTab === 'pdf' ? 'active' : ''}`} onClick={() => setActiveTab('pdf')}>📄 PDF UPLOAD</button>
                 <button className={`tab-pill ${activeTab === 'excel' ? 'active' : ''}`} onClick={() => setActiveTab('excel')}>📊 EXCEL IMPORT</button>
              </div>

              <div style={{padding:'32px'}}>
                {activeTab === 'pdf' ? (
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                     <div>
                      <h3 style={{margin:0}}>Official PDF Schedule</h3>
                      <p style={{margin:'4px 0 0 0', opacity:0.6, fontSize:'13px'}}>Access or update the master examination schedule in PDF format.</p>
                     </div>
                     <div style={{display:'flex', gap:'12px'}}>
                       {exams.some(e => e.type === 'pdf_schedule') && (
                          <button className="btn-primary-premium" onClick={() => window.open(exams.find(e => e.type === 'pdf_schedule').fileURL, '_blank')}>VIEW MASTER PDF</button>
                       )}
                       <button className="btn-primary-premium" style={{background:'var(--color-accent)', color:'var(--color-ink)'}} onClick={() => openForm('upload_exam_pdf')}>
                         {exams.some(e => e.type === 'pdf_schedule') ? 'UPDATE PDF' : 'UPLOAD PDF'}
                       </button>
                     </div>
                  </div>
                ) : (
                  <div className="excel-import-panel">
                    <div className="import-instructions mb-24">
                      <h3>Excel-Driven Institutional Scheduling</h3>
                      <p style={{fontSize:'13px', opacity:0.8}}>Upload an Excel workbook where each sheet corresponds to a department (CS, EE, BBA etc.).</p>
                      <div className="column-guide mt-12" style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                         {['Course Code', 'Course Title', 'Date', 'Day', 'Start Time', 'End Time', 'Venue', 'Section', 'Cr.Hrs'].map(c => <span key={c} className="badge-premium" style={{background:'var(--color-border)', opacity:0.7}}>{c}</span>)}
                      </div>
                    </div>

                    <div className="upload-zone" id="excel-drop-zone" style={{border:'2px dashed var(--color-border)', borderRadius:'8px', padding:'40px', textAlign:'center', cursor:'pointer', marginBottom:'24px', transition:'all 0.2s'}}>
                      <div style={{fontSize:'40px', marginBottom:'12px'}}>📊</div>
                      <p style={{fontWeight:600, margin:0}}>Drag & Drop .xlsx file or click to browse</p>
                      <input type="file" accept=".xlsx,.xls" onChange={handleExcelFile} style={{display:'none'}} id="excel-input" />
                      <button className="btn-primary-premium mt-12" onClick={() => document.getElementById('excel-input').click()}>SELECT EXCEL FILE</button>
                    </div>

                    <div className="semester-field mb-24" style={{maxWidth:'300px'}}>
                      <label>Semester Label</label>
                      <input className="input-premium" placeholder="e.g. Spring 2026" value={semesterLabel} onChange={e => setSemesterLabel(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // For Student/Faculty - Just show master PDF button if it exists
            exams.some(e => e.type === 'pdf_schedule') && (
              <div className="card mb-32" style={{padding:'32px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <h3 style={{margin:0}}>Official PDF Schedule</h3>
                  <p style={{margin:'4px 0 0 0', opacity:0.6, fontSize:'13px'}}>Access the official university master examination schedule in PDF format.</p>
                </div>
                <button className="btn-primary-premium" onClick={() => window.open(exams.find(e => e.type === 'pdf_schedule').fileURL, '_blank')}>VIEW MASTER PDF</button>
              </div>
            )
          )}

          {/* Database Setup Warning - Admin Only */}
          {user.role === 'Admin' && uploads.length === 0 && !error && (
            <div className="card mb-24" style={{border:'1px dashed var(--color-accent)', background:'rgba(201, 164, 53, 0.05)', padding:'24px'}}>
               <h4 style={{margin:0, color:'var(--color-accent)'}}>⚠️ DATABASE SETUP REQUIRED</h4>
               <p style={{fontSize:'13px', margin:'8px 0 0 0', opacity:0.8}}>
                 The Excel scheduling tables were not detected in your Supabase instance. 
                 Please run the migration file <code>20260516194000_exam_schedule_excel.sql</code> in your SQL Editor to enable this feature.
               </p>
            </div>
          )}

          {/* Published Excel Sessions */}
          <div className="view-header-premium mt-24">
            <h2>{user.role === 'Admin' ? 'Institutional Upload Registry' : 'Published Academic Date Sheets'}</h2>
            <p>{user.role === 'Admin' ? 'History of all published exam schedules.' : 'Select an active academic session to view your exam schedule.'}</p>
          </div>

          <div className="grid-2-cols" style={{gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))'}}>
            {uploads.map(u => (
              <div key={u.id} className="card" style={{display:'flex', gap:'16px', alignItems:'center'}}>
                 <div style={{fontSize:'32px'}}>{u.upload_type === 'excel' ? '📊' : '📄'}</div>
                 <div style={{flex:1}}>
                   <div style={{fontWeight:700}}>{u.semester}</div>
                   <div style={{fontSize:'12px', opacity:0.6}}>{u.file_name}</div>
                   <div style={{fontSize:'10px', marginTop:'4px'}}>{new Date(u.uploaded_at).toLocaleDateString()}</div>
                 </div>
                 <div style={{display:'flex', gap:'8px'}}>
                    <button className="btn-text-only" style={{color:'var(--color-accent)'}} onClick={() => setViewingUpload(u)}>VIEW</button>
                    {user.role === 'Admin' && <button className="btn-text-only" style={{color:'var(--color-danger)'}} onClick={() => handleDeleteUpload(u.id)}>DELETE</button>}
                 </div>
              </div>
            ))}
            {uploads.length === 0 && <div className="card" style={{gridColumn:'1/-1', textAlign:'center', opacity:0.5, padding:'40px'}}>No institutional date sheets published yet.</div>}
          </div>

          {/* Master Date Sheet List (exams array) */}
          {exams.length > 0 && (
            <div className="fade-in mt-32">
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
          )}
        </>
      )}

      {/* Excel Preview Modal (Admin Only) */}
      {user.role === 'Admin' && previewData && (
        <div className="modal-overlay-premium fade-in">
          <div className="card" style={{width:'90vw', maxWidth:'1200px', maxHeight:'90vh', display:'flex', flexDirection:'column', padding:0}}>
            <div className="modal-header" style={{padding:'24px', borderBottom:'1px solid var(--color-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
               <h2 style={{margin:0}}>Parsing Preview — {Object.keys(previewData).length} Depts</h2>
               <div style={{display:'flex', gap:'8px'}}>
                  {Object.keys(previewData).map(dept => (
                    <button key={dept} className={`badge-premium ${activeDept === dept ? 'badge-primary' : ''}`} style={{cursor:'pointer'}} onClick={() => setActiveDept(dept)}>{dept}</button>
                  ))}
               </div>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'24px'}}>
              <table className="premium-table">
                <thead><tr><th>Code</th><th>Title</th><th>Date</th><th>Day</th><th>Time</th><th>Venue</th></tr></thead>
                <tbody>
                  {previewData[activeDept]?.map((row, i) => (
                    <tr key={i}>
                      <td>{row.course_code}</td>
                      <td style={{fontWeight:600}}>{row.course_title}</td>
                      <td>{row.exam_date}</td>
                      <td>{row.exam_day}</td>
                      <td>{row.start_time} - {row.end_time}</td>
                      <td>{row.venue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{padding:'24px', borderTop:'1px solid var(--color-border)', display:'flex', justifyContent:'flex-end', gap:'12px'}}>
              <button className="btn-text-only" onClick={() => setPreviewData(null)}>CANCEL</button>
              <button className="btn-primary-premium" disabled={saving} onClick={saveSchedule}>{saving ? 'SYNCHRONIZING...' : 'CONFIRM & SAVE REGISTRY'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
