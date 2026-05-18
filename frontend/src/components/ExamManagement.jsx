import React, { useState } from 'react';
import { supabase, isDatabaseConnected } from '../lib/supabase';
import * as XLSX from 'xlsx';

const ExamManagement = ({ 
  mode,
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

  const isGradingMode = mode !== 'schedule' && !!setAssessments && (user.role === 'Faculty' || user.role === 'Admin');

  // --- Excel Import & View State ---
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
  const [searchQuery, setSearchQuery]     = useState('');
  const [error, setError]                 = useState(null);
  const [successMsg, setSuccessMsg]       = useState(null);

  // New interactive view flow states
  const [viewDept, setViewDept]           = useState('all');
  const [viewProgram, setViewProgram]     = useState('all');
  const [studentFilterBatchOnly, setStudentFilterBatchOnly] = useState(true);
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef                      = React.useRef(null);


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

  // --- Data Fetching & Excel Processing ---
  
  function parseDateHeader(raw) {
    if (!raw) return { iso: null, day: null, label: String(raw || '') };
    const s = String(raw).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract day name
    const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    let dayName = null;
    for (const d of DAYS) {
      if (s.toLowerCase().includes(d)) { 
        dayName = d.charAt(0).toUpperCase() + d.slice(1); 
        break; 
      }
    }

    const MONTHS = {
      january:1, feb:2, february:2, mar:3, march:3, apr:4, april:4, may:5, jun:6, june:6,
      jul:7, july:7, aug:8, august:8, sep:9, september:9, oct:10, october:10, nov:11, november:11, dec:12, december:12
    };

    let iso = null;
    const lower = s.toLowerCase();
    const cleanStr = lower.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const tokens = cleanStr.split(' ');

    let monthVal = null;
    let dayVal = null;
    let yearVal = null;

    for (const token of tokens) {
      if (MONTHS[token] !== undefined) {
        monthVal = MONTHS[token];
      } else if (/^\d{4}$/.test(token)) {
        yearVal = parseInt(token, 10);
      } else if (/^\d{1,2}$/.test(token)) {
        const val = parseInt(token, 10);
        if (val >= 1 && val <= 31) {
          dayVal = val;
        }
      }
    }

    if (yearVal && monthVal && dayVal) {
      iso = `${yearVal}-${String(monthVal).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
    } else {
      const fallback = new Date(s);
      if (!isNaN(fallback.getTime())) {
        iso = fallback.toISOString().split('T')[0];
      }
    }

    return { iso, day: dayName, label: s };
  }

  function parseCellBlock(rawCell) {
    if (!rawCell || String(rawCell).trim() === '') return [];
    const text = String(rawCell).trim();

    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const results = [];

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let course_title = '';
      let instructor   = '';
      let strength     = '';
      let room         = '';
      let start_time   = '';
      let end_time     = '';

      const firstLine = lines[0];
      const looksLikeTime   = /\d{1,2}:\d{2}/.test(firstLine);
      const looksLikeRoom   = /^(Room|R#|Room\s*#)/i.test(firstLine);
      const looksLikeStreng = /^(Strength|ST#|strength\s*[:=])/i.test(firstLine);

      let startIndex = 0;
      if (!looksLikeTime && !looksLikeRoom && !looksLikeStreng) {
        course_title = firstLine;
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];

        if (/^inst:/i.test(line)) {
          instructor = line.replace(/^inst:\s*/i, '').trim();
          continue;
        }

        if (/^strength/i.test(line) || /^st#/i.test(line)) {
          strength = line.replace(/^(strength\s*[:=]?\s*|st#\s*)/i, '').trim();
          continue;
        }

        if (/^room/i.test(line) || /^r#/i.test(line)) {
          room = line.replace(/^(room\s*#?\s*[:=]?\s*|r#\s*)/i, '').trim();
          continue;
        }

        if (/^time/i.test(line) || /\d{1,2}:\d{2}/.test(line)) {
          const timeStr = line.replace(/^time\s*[:=]?\s*/i, '').trim();
          const separator = timeStr.includes(' to ') ? ' to ' : '-';
          const timeParts = timeStr.split(separator).map(t => t.trim());
          start_time = timeParts[0] || '';
          end_time = timeParts[1] || '';
          continue;
        }

        if (!instructor && course_title) {
          instructor = line;
        }
      }

      start_time = start_time.replace(/\s*to\s*/gi, '-').trim();
      end_time = end_time.replace(/\s*to\s*/gi, '-').trim();

      if (course_title) {
        results.push({
          course_title,
          instructor,
          strength,
          room,
          start_time,
          end_time
        });
      }
    }
    return results;
  }

  function parseExamScheduleWorkbook(workbook) {
    const departments = {};

    for (const rawSheetName of workbook.SheetNames) {
      const deptName = rawSheetName.trim();
      const ws       = workbook.Sheets[rawSheetName];
      const rows     = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

      if (!rows || rows.length < 4) continue;

      let headerRowIdx = -1;
      for (let r = 0; r < Math.min(8, rows.length); r++) {
        const c0 = String(rows[r][0] || '').toLowerCase().trim();
        if (c0 === 'program' || c0 === 'prgram' || c0 === 'programme') {
          headerRowIdx = r;
          break;
        }
      }
      if (headerRowIdx === -1) continue;

      const headerRow  = rows[headerRowIdx];
      const dateHeaders = [];
      for (let c = 1; c < headerRow.length; c++) {
        dateHeaders.push(parseDateHeader(headerRow[c]));
      }

      const entries = [];
      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every(c => c === null || String(c || '').trim() === '')) continue;

        const rawProgram = String(row[0] || '').trim();
        if (!rawProgram || rawProgram === ':') continue;

        const program = rawProgram.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        for (let c = 1; c < row.length; c++) {
          const cell = row[c];
          if (!cell || String(cell).trim() === '') continue;

          const dateInfo  = dateHeaders[c - 1] || { iso: null, day: null, label: '' };
          const examItems = parseCellBlock(cell);

          for (const item of examItems) {
            entries.push({
              department:      deptName,
              program:         program,
              course_title:    item.course_title,
              exam_date:       dateInfo.iso,
              exam_date_label: dateInfo.label,
              exam_day:        dateInfo.day,
              start_time:      item.start_time,
              end_time:        item.end_time,
              instructor:      item.instructor,
              room:            item.room,
              strength:        item.strength,
            });
          }
        }
      }

      if (entries.length > 0) {
        departments[deptName] = entries;
      }
    }

    return departments;
  }

  const handleExcelSelect = (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    setParseLoading(true);
    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const parsed = parseExamScheduleWorkbook(workbook);
        
        if (Object.keys(parsed).length === 0) {
          throw new Error("No valid department sheets found in the workbook (expected CS, Math, Economics, Biotech, ES, BEN, MS).");
        }

        setPreviewData(parsed);
        const depts = Object.keys(parsed).sort();
        if (depts.length > 0) setActiveDept(depts[0]);
        setSelectedFile(file);
      } catch (err) {
        setError(err.message || 'Failed to read Excel file. Please check the structure.');
      } finally {
        setParseLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const fetchUploads = async () => {
    if (!isDatabaseConnected()) {
      const localUploads = (exams || []).filter(e => e.upload_type === 'excel');
      setUploads(localUploads);
      if ((user.role === 'Student' || user.role === 'Faculty') && localUploads.length > 0 && !viewingUpload) {
        setViewingUpload(localUploads[0]);
      }
      return;
    }
    try {
      const { data, error } = await supabase
        .from('exam_schedule_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.warn("Exam schedule tables not found. Please run the migration.");
          return;
        }
        throw error;
      }
      setUploads(data || []);
      
      // Auto-load the most recent upload for student/faculty if nothing is selected yet
      if ((user.role === 'Student' || user.role === 'Faculty') && data && data.length > 0 && !viewingUpload) {
        setViewingUpload(data[0]);
      }
    } catch (err) {
      console.error("Fetch Uploads Error:", err);
    }
  };

  const fetchEntries = async (uploadId) => {
    if (!isDatabaseConnected()) {
      const localEntries = (exams || []).filter(e => e.type === 'excel_schedule' && e.upload_id === uploadId);
      // Sort local entries by exam_date
      localEntries.sort((a, b) => {
        const da = new Date(a.exam_date || 0);
        const db = new Date(b.exam_date || 0);
        return da - db;
      });
      setViewEntries(localEntries);
      return;
    }
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
  }, [exams]);

  React.useEffect(() => {
    if (viewingUpload) {
      if (viewingUpload.upload_type === 'excel') {
        fetchEntries(viewingUpload.id);
        setViewDept('all');
        setViewProgram('all');
      }
    }
  }, [viewingUpload, exams]);

  const saveSchedule = async () => {
    if (!semesterLabel.trim()) {
      setError('Please enter a semester label first.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const uploadId = Date.now().toString();
      // Flatten all parsed Excel entries from previewData
      const allEntries = Object.values(previewData).flat().map(e => ({
        ...e,
        upload_id: uploadId,
      }));

      if (isDatabaseConnected()) {
        // 1. Create upload record
        const { data: upload, error: uploadErr } = await supabase
          .from('exam_schedule_uploads')
          .insert({ 
            file_name: selectedFile.name, 
            upload_type: 'excel', 
            semester: semesterLabel.trim() 
          })
          .select().single();
        if (uploadErr) throw uploadErr;

        // 2. Flatten all entries using real DB upload_id
        const dbEntries = allEntries.map(e => ({
          ...e,
          upload_id: upload.id,
        }));

        // 3. Batch insert (100 at a time)
        const BATCH = 100;
        for (let i = 0; i < dbEntries.length; i += BATCH) {
          const { error } = await supabase
            .from('exam_schedule_entries')
            .insert(dbEntries.slice(i, i + BATCH));
          if (error) throw error;
        }

        if (setExams) {
          setExams(prev => [...prev, ...dbEntries]);
        }
      } else {
        // Local only fallback - save in memory state and localStorage
        const localUpload = {
          id: uploadId,
          file_name: selectedFile.name,
          upload_type: 'excel',
          semester: semesterLabel.trim(),
          uploaded_at: new Date().toISOString()
        };

        const localEntries = allEntries.map(e => ({
          ...e,
          type: 'excel_schedule',
          id: `local_entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          upload_id: uploadId,
          semester: semesterLabel.trim()
        }));

        if (setExams) {
          setExams(prev => [...prev, localUpload, ...localEntries]);
        }
        
        setUploads(prev => [...prev, {
          id: uploadId,
          file_name: selectedFile.name,
          upload_type: 'excel',
          semester: semesterLabel.trim(),
          uploaded_at: new Date().toISOString()
        }]);
      }

      setSuccessMsg(`Saved ${allEntries.length} exam entries across ${Object.keys(previewData).length} departments.`);
      setPreviewData(null);
      setSelectedFile(null);
      setSemesterLabel('');
      fetchUploads();
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUpload = async (id) => {
    if (isDatabaseConnected()) {
      try {
        const { error } = await supabase.from('exam_schedule_uploads').delete().eq('id', id);
        if (error) throw error;
        notify("Institutional Record Purged Successfully");
        if (setExams) {
          setExams(prev => prev.filter(e => e.upload_id !== id && e.id !== id));
        }
        fetchUploads();
      } catch (err) { notify(err.message, "error"); }
    } else {
      if (setExams) {
        setExams(prev => prev.filter(e => e.upload_id !== id && e.id !== id));
      }
      notify("Institutional Local Record Purged Successfully");
      setUploads(prev => prev.filter(u => u.id !== id));
      if (viewingUpload && viewingUpload.id === id) {
        setViewingUpload(null);
      }
    }
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
  // Determine student batch code and faculty name for filtering
  let studentBatch = '';
  if (user.role === 'Student') {
    const studentRecord = students.find(s => s.id === user.id || s.dbID === user.id);
    const regNum = user.regNumber || studentRecord?.regNumber || user.id || '';
    if (regNum.match(/^[A-Z0-9]+-[A-Z0-9]+/i)) {
      studentBatch = regNum.split('-').slice(0, 2).join('-').toUpperCase();
    } else {
      const prog = user.program || studentRecord?.program || '';
      let progCode = '';
      if (prog.includes('Computer Science') || prog.includes('CS')) progCode = 'BCS';
      else if (prog.includes('Software Engineering') || prog.includes('SE')) progCode = 'BSE';
      else if (prog.includes('Business') || prog.includes('BBA')) progCode = 'BBA';
      
      const batchStr = user.batch || studentRecord?.batch || '';
      const year = batchStr.match(/\d+/)?.[0]?.slice(-2) || '';
      const term = batchStr.toLowerCase().includes('spring') ? 'SP' : 'FA';
      if (progCode && year) studentBatch = `${term}${year}-${progCode}`;
    }
  }

  // Filter entries dynamically
  let filteredEntries = [...viewEntries];

  if (user.role === 'Student' && studentFilterBatchOnly && studentBatch) {
    const matched = viewEntries.filter(e => {
      const cleanProg = String(e.program || '').replace(/\s+/g,'');
      return e.program.includes(studentBatch) || studentBatch.includes(cleanProg);
    });
    if (matched.length > 0) {
      filteredEntries = matched;
    } else {
      const studentRecord = students.find(s => s.id === user.id || s.dbID === user.id);
      const studentProg = (user.program || studentRecord?.program || '').toLowerCase();
      let matchedDept = '';
      if (studentProg.includes('computer') || studentProg.includes('software') || studentProg.includes('cs') || studentProg.includes('se')) {
        matchedDept = 'CS';
      } else if (studentProg.includes('business') || studentProg.includes('management') || studentProg.includes('ba')) {
        matchedDept = 'MS';
      }
      
      if (matchedDept && viewEntries.some(e => e.department === matchedDept)) {
        filteredEntries = viewEntries.filter(e => e.department === matchedDept);
      }
    }
  }

  if (user.role === 'Faculty' && studentFilterBatchOnly) {
    const teacherName = (user.facultyName || user.name || '').toLowerCase();
    if (teacherName) {
      const matched = viewEntries.filter(e => String(e.instructor || '').toLowerCase().includes(teacherName));
      if (matched.length > 0) {
        filteredEntries = matched;
      }
    }
  }

  if (viewDept !== 'all') {
    filteredEntries = filteredEntries.filter(e => e.department === viewDept);
  }

  if (viewDept !== 'all' && viewProgram !== 'all') {
    filteredEntries = filteredEntries.filter(e => e.program === viewProgram);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredEntries = filteredEntries.filter(e => 
      String(e.course_title || '').toLowerCase().includes(q) ||
      String(e.program || '').toLowerCase().includes(q) ||
      String(e.instructor || '').toLowerCase().includes(q) ||
      String(e.room || '').toLowerCase().includes(q) ||
      String(e.exam_date_label || '').toLowerCase().includes(q) ||
      String(e.exam_day || '').toLowerCase().includes(q)
    );
  }

  filteredEntries.sort((a, b) => {
    if (!a.exam_date) return 1;
    if (!b.exam_date) return -1;
    return a.exam_date.localeCompare(b.exam_date);
  });

  return (
    <div className="view-container fade-in">
      {viewingUpload ? (
        <div className="schedule-view-page fade-in">
          <div className="schedule-view-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'16px'}}>
            <div>
              <div style={{fontSize:'12px', opacity:0.6, marginBottom:'4px'}}>Exam Schedule / {viewingUpload.semester}</div>
              <h2 style={{margin:0}}>{viewingUpload.semester} — Official Date Sheet</h2>
              <p style={{margin:'4px 0 0 0', opacity:0.7, fontSize:'13px'}}>
                {viewEntries.length} exams across {new Set(viewEntries.map(e => e.department)).size} department(s)
              </p>
            </div>
            <button className="btn-primary-premium" onClick={() => setViewingUpload(null)}>← BACK TO HUB</button>
          </div>

          {/* Search & Filter Controls */}
          <div className="schedule-controls-card card p-24 mb-24" style={{display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{display:'flex', gap:'16px', flexWrap:'wrap', flex:1}}>
              <div style={{minWidth:'250px', flex:1}}>
                <label style={{fontSize:'12px', display:'block', marginBottom:'6px', fontWeight:600}}>Search Course, Instructor, Room or Code</label>
                <input 
                  className="input-premium" 
                  placeholder="Search exams..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{width: '100%', margin:0}}
                />
              </div>

              {viewDept !== 'all' && (
                <div style={{minWidth:'200px'}}>
                  <label style={{fontSize:'12px', display:'block', marginBottom:'6px', fontWeight:600}}>Program / Class</label>
                  <select 
                    className="input-premium" 
                    value={viewProgram} 
                    onChange={e => setViewProgram(e.target.value)}
                    style={{width: '100%', margin:0}}
                  >
                    <option value="all">All Programs</option>
                    {[...new Set(viewEntries.filter(e => e.department === viewDept).map(e => e.program))].sort().map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {user.role === 'Student' && (
              <div style={{display:'flex', alignItems:'center', gap:'8px', background:'rgba(26, 58, 107, 0.1)', padding:'8px 16px', borderRadius:'6px'}}>
                <input 
                  type="checkbox" 
                  id="studentBatchToggle" 
                  checked={studentFilterBatchOnly} 
                  onChange={e => setStudentFilterBatchOnly(e.target.checked)} 
                  style={{cursor:'pointer', width:'18px', height:'18px', margin:0}}
                />
                <label htmlFor="studentBatchToggle" style={{fontSize:'13px', fontWeight:600, cursor:'pointer', userSelect:'none'}}>
                  Show my batch only ({studentBatch || 'TBD'})
                </label>
              </div>
            )}

            {user.role === 'Faculty' && (
              <div style={{display:'flex', alignItems:'center', gap:'8px', background:'rgba(26, 58, 107, 0.1)', padding:'8px 16px', borderRadius:'6px'}}>
                <input 
                  type="checkbox" 
                  id="facultyToggle" 
                  checked={studentFilterBatchOnly} 
                  onChange={e => setStudentFilterBatchOnly(e.target.checked)} 
                  style={{cursor:'pointer', width:'18px', height:'18px', margin:0}}
                />
                <label htmlFor="facultyToggle" style={{fontSize:'13px', fontWeight:600, cursor:'pointer', userSelect:'none'}}>
                  My invigilations only ({user.facultyName || user.name})
                </label>
              </div>
            )}
          </div>

          {/* Department pills tab bar */}
          <div className="dept-tabs-bar" style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px', borderBottom:'1px solid var(--color-border)', paddingBottom:'16px'}}>
            <button 
              className={`dept-tab ${viewDept === 'all' ? 'active' : ''}`} 
              onClick={() => { setViewDept('all'); setViewProgram('all'); }}
            >
              All Departments <span className="dept-count" style={{marginLeft:'6px', opacity:0.6}}>{viewEntries.length}</span>
            </button>
            {[...new Set(viewEntries.map(e => e.department))].sort().map(dept => (
              <button 
                key={dept} 
                className={`dept-tab ${viewDept === dept ? 'active' : ''}`} 
                onClick={() => { setViewDept(dept); setViewProgram('all'); }}
              >
                {dept} <span className="dept-count" style={{marginLeft:'6px', opacity:0.6}}>{viewEntries.filter(e => e.department === dept).length}</span>
              </button>
            ))}
          </div>

          <div className="table-wrapper card" style={{padding:0}}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Course Title / Code</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Instructor</th>
                  <th>Room</th>
                  <th>Strength</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => (
                  <tr key={entry.id || i} className={i % 2 === 0 ? '' : 'row-alt'}>
                    <td data-label="Program" style={{fontWeight:600}}>{entry.program}</td>
                    <td data-label="Course">
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontWeight:700, color:'var(--color-ink)'}}>{entry.course_title}</span>
                      </div>
                    </td>
                    <td data-label="Date">
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <strong className="font-monospace">{entry.exam_date || '—'}</strong>
                        {entry.exam_date_label && <span style={{fontSize:'10px', opacity:0.6}}>{entry.exam_date_label}</span>}
                      </div>
                    </td>
                    <td data-label="Day">{entry.exam_day || '—'}</td>
                    <td data-label="Time"><strong>{entry.start_time}</strong> — {entry.end_time}</td>
                    <td data-label="Instructor">{entry.instructor || '—'}</td>
                    <td data-label="Room">
                      <span className="badge-premium" style={{background:'var(--color-border)', color:'var(--color-ink)'}}>
                        {entry.room || '—'}
                      </span>
                    </td>
                    <td data-label="Strength" className="font-monospace">{entry.strength || '—'}</td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr><td colSpan="8" style={{textAlign:'center', opacity:0.5, padding:'40px'}}>No exams matching the selected criteria.</td></tr>
                )}
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
                      <h3>Excel-Driven Institutional Date Sheet Scheduling</h3>
                      <p style={{fontSize:'13px', opacity:0.8}}>
                        Upload a multi-department scheduling Excel workbook containing sheets trimmed exactly to: CS, Math, Economics, Biotech, ES, BEN, MS.
                      </p>
                      <div className="column-guide mt-12" style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                         {['Multi-exam cells (\\n\\n)', 'Trimmed sheets', 'Dynamic program parser', 'Room cleanups'].map(c => <span key={c} className="badge-premium" style={{background:'var(--color-border)', opacity:0.7}}>{c}</span>)}
                      </div>
                    </div>

                    <div 
                      className={`excel-dropzone ${dragOver ? 'drag-over' : ''}`} 
                      id="excel-dropzone"
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleExcelSelect(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div style={{fontSize:'40px', marginBottom:'12px'}}>📊</div>
                      <p style={{fontWeight:600, margin:0}}>Drag & Drop .xlsx file or click to browse</p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".xlsx,.xls" 
                        onChange={e => handleExcelSelect(e.target.files[0])} 
                        style={{display:'none'}} 
                      />
                      <button className="btn-primary-premium mt-12" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>SELECT EXCEL FILE</button>
                    </div>

                    <div className="semester-field mb-24" style={{maxWidth:'300px'}}>
                      <label style={{fontSize:'12px', display:'block', marginBottom:'8px', fontWeight:600}}>Semester Session Label</label>
                      <input className="input-premium" placeholder="e.g. Spring 2026" value={semesterLabel} onChange={e => setSemesterLabel(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // For Student/Faculty - Show master PDF button if it exists
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
                      <th>Instructor / Invigilator</th>
                      {user.role === 'Admin' && <th>Registry Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {exams.filter(e => e.upload_type !== 'excel').map((e, idx) => (
                      <tr key={`exam-row-${idx}-${e.id || 'new'}`}>
                        <td data-label="Course Code" className="font-monospace" style={{fontWeight: 700}}>{e.courseID || e.course_title || e.course_code || 'N/A'}</td>
                        <td data-label="Assessment Type"><span className={`badge-premium ${(e.type === 'Final' || e.type === 'excel_schedule' || !e.type) ? 'badge-primary' : 'badge-gold'}`}>{((e.type && e.type !== 'excel_schedule') ? e.type : 'Final Exam').toUpperCase()}</span></td>
                        <td data-label="Schedule Date" className="font-monospace">
                          {e.date || e.exam_date_label || e.exam_date || '—'} — {e.time || (e.start_time && e.end_time ? `${e.start_time} - ${e.end_time}` : e.start_time || '—')}
                        </td>
                        <td data-label="Assigned Venue">{e.venue || e.room || '—'}</td>
                        <td data-label="Instructor / Invigilator">{e.invigilator || e.instructor || 'TBA'}</td>
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
          <div className="card glass-card shadow-lg" style={{width:'95vw', maxWidth:'1400px', maxHeight:'90vh', display:'flex', flexDirection:'column', padding:0, border:'1px solid var(--glass-border)'}}>
            <div className="modal-header" style={{padding:'24px', borderBottom:'1px solid var(--color-border)', display:'flex', flexDirection:'column', gap:'16px'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                 <h2 style={{margin:0, fontFamily:'var(--font-heading)'}}>📊 Academic Import Preview</h2>
                 <span className="badge-premium badge-gold" style={{fontSize:'12px', padding:'6px 12px'}}>
                   {Object.values(previewData).flat().length} Exams Parsed
                 </span>
               </div>
               
               {/* Department Tabs in Modal */}
               <div className="dept-tabs-bar" style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                 {Object.keys(previewData).sort().map(dept => {
                   const count = previewData[dept].length;
                   return (
                     <button 
                       key={dept} 
                       className={`dept-tab ${activeDept === dept ? 'active' : ''}`} 
                       onClick={() => setActiveDept(dept)}
                       style={{padding:'8px 16px', fontSize:'13px', borderRadius:'6px'}}
                     >
                       {dept} <span className="dept-count" style={{marginLeft:'6px', opacity:0.6}}>({count})</span>
                     </button>
                   );
                 })}
               </div>
            </div>
            
            <div style={{flex:1, overflowY:'auto', padding:'24px'}}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Course Code / Title</th>
                    <th>Exam Date</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Instructor</th>
                    <th>Room</th>
                    <th>Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData[activeDept]?.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'row-alt'}>
                      <td data-label="Program" style={{fontWeight:600}}>{row.program}</td>
                      <td data-label="Course">
                        <div style={{display:'flex', flexDirection:'column'}}>
                          <span style={{fontWeight:700, color:'var(--color-ink)'}}>{row.course_title}</span>
                        </div>
                      </td>
                      <td data-label="Date" className="font-monospace">{row.exam_date || row.exam_date_label || '—'}</td>
                      <td data-label="Day">{row.exam_day || '—'}</td>
                      <td data-label="Time"><strong>{row.start_time}</strong> - {row.end_time}</td>
                      <td data-label="Instructor" style={{fontSize:'13px'}}>{row.instructor || '—'}</td>
                      <td data-label="Room"><span className="badge-premium" style={{background:'var(--color-border)', color:'var(--color-ink)'}}>{row.room || '—'}</span></td>
                      <td data-label="Strength" className="font-monospace" style={{fontWeight:600}}>{row.strength || '—'}</td>
                    </tr>
                  ))}
                  {(!previewData[activeDept] || previewData[activeDept].length === 0) && (
                    <tr><td colSpan="8" style={{textAlign:'center', opacity:0.5, padding:'40px'}}>No entries parsed for this department.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="modal-footer" style={{padding:'24px', borderTop:'1px solid var(--color-border)', display:'flex', justifyContent:'flex-end', gap:'12px', background:'var(--surface-container)'}}>
              <button className="btn-text-only" onClick={() => setPreviewData(null)}>CANCEL</button>
              <button 
                className="btn-primary-premium" 
                disabled={saving} 
                onClick={saveSchedule}
                style={{background:'var(--color-accent)', color:'var(--color-ink)', fontWeight:700}}
              >
                {saving ? 'SYNCHRONIZING...' : 'CONFIRM & SAVE REGISTRY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
