import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { supabase, isDatabaseConnected } from '../lib/supabase';
import TimetableGrid from './TimetableGrid';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const TimetableManagement = ({ uploads, setUploads, entries, setEntries, departments, faculty, setFaculty, students, notify }) => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState('student');
  const [semesterLabel, setSemesterLabel] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmUpload, setDeleteConfirmUpload] = useState(null);
  const [uploadDept, setUploadDept] = useState('');
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const cleanName = (n) => {
    if (!n) return '';
    return n.toLowerCase()
      .replace(/\b(dr|engr|prof|professor|associate|assistant|lecturer|mr|ms|mrs|phd)\b/g, '')
      .replace(/[^a-z0-9]/g, '').trim();
  };

  const extractSemanticParts = (itemsArray) => {
    let subject = "";
    let instructor = "Faculty";
    let room = "TBD";
    let batchSection = "";
    let isLab = false;

    // Filter and preprocess cleanItems
    let cleanItems = [];
    (itemsArray || []).forEach(item => {
      if (!item) return;
      const trimmed = item.trim();
      if (!trimmed) return;
      
      // Split by common separators to get fine-grained components
      if (trimmed.includes(' - ')) {
        cleanItems.push(...trimmed.split(' - '));
      } else if (trimmed.includes(' / ')) {
        cleanItems.push(...trimmed.split(' / '));
      } else if (trimmed.includes('\n')) {
        cleanItems.push(...trimmed.split('\n'));
      } else {
        cleanItems.push(trimmed);
      }
    });
    cleanItems = cleanItems.map(i => i.trim()).filter(i => i.length > 0);

    if (cleanItems.length === 0) {
      return { subject: "TBD", instructor: "Faculty", room: "TBD", batchSection: "", isLab: false };
    }

    // Identify LAB
    const fullText = cleanItems.join(' ').toLowerCase();
    isLab = fullText.includes('-lab') || fullText.includes(' lab') || fullText.includes('practical');

    // 1. Identify Room Code
    const roomPatterns = [
      /[A-Za-z]+-\d+/i,                // CS-02, Room-5
      /\bRoom\s*\d+\b/i,               // Room 5
      /\bLab\s*\d+\b/i,                // Lab 1
      /\bSeminar\s*Room\b/i,           // Seminar Room
      /\b[A-Za-z]\d+\b/                // B12, C1
    ];

    let roomIndex = -1;
    for (let i = 0; i < cleanItems.length; i++) {
      for (const pattern of roomPatterns) {
        if (pattern.test(cleanItems[i])) {
          room = cleanItems[i].match(pattern)[0];
          roomIndex = i;
          break;
        }
      }
      if (roomIndex !== -1) break;
    }

    // 2. Identify Batch/Section (e.g. FA24-BCS-A, SP23-BSE-B)
    const batchSectionPattern = /\b[A-Z]{2}\d{2}-[A-Z0-9-]+\b/i;
    let batchSectionIndex = -1;
    for (let i = 0; i < cleanItems.length; i++) {
      if (i === roomIndex) continue;
      if (batchSectionPattern.test(cleanItems[i])) {
        batchSection = cleanItems[i].match(batchSectionPattern)[0].toUpperCase();
        batchSectionIndex = i;
        break;
      }
    }

    // 3. Identify Instructor Name
    const instructorPrefixPattern = /\b(Dr|Prof|Engr|Mr|Ms|Mrs|Lec|Lecturer)\b/i;
    let instructorIndex = -1;

    // First try: Prefix search
    for (let i = 0; i < cleanItems.length; i++) {
      if (i === roomIndex || i === batchSectionIndex) continue;
      if (instructorPrefixPattern.test(cleanItems[i])) {
        instructor = cleanItems[i];
        instructorIndex = i;
        break;
      }
    }

    // Second try: Exact matching of known faculty members
    if (instructorIndex === -1 && faculty && faculty.length > 0) {
      for (let i = 0; i < cleanItems.length; i++) {
        if (i === roomIndex || i === batchSectionIndex) continue;
        const itemCleaned = cleanName(cleanItems[i]);
        
        for (const f of faculty) {
          if (f.facultyName && f.facultyName.length > 3) {
            const fCleaned = cleanName(f.facultyName);
            if (itemCleaned === fCleaned || itemCleaned.includes(fCleaned) || fCleaned.includes(itemCleaned)) {
              instructor = f.facultyName;
              instructorIndex = i;
              break;
            }
          }
        }
        if (instructorIndex !== -1) break;
      }
    }

    // Third try: Capitalized words length (2-4 words)
    if (instructorIndex === -1) {
      for (let i = 0; i < cleanItems.length; i++) {
        if (i === roomIndex || i === batchSectionIndex) continue;
        const words = cleanItems[i].split(/\s+/);
        if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z]/.test(w))) {
          instructor = cleanItems[i];
          instructorIndex = i;
          break;
        }
      }
    }

    // 4. Subject Name
    const subjectItems = [];
    for (let i = 0; i < cleanItems.length; i++) {
      if (i === roomIndex || i === batchSectionIndex || i === instructorIndex) continue;
      if (/^\(\s*\d+\s*h\s*\)$/i.test(cleanItems[i])) continue;
      subjectItems.push(cleanItems[i]);
    }

    if (subjectItems.length > 0) {
      subject = subjectItems.join(' ');
    } else {
      subject = cleanItems[0] || "Academic Session";
    }

    // Clean up trailing punctuation, spans or dashes
    subject = subject.replace(/\s*\(2h\)/gi, '')
                     .replace(/\s*\(3h\)/gi, '')
                     .replace(/[-/]+$/, '')
                     .trim();

    // If single item without delimiters, parse logically
    if (cleanItems.length === 1) {
      const text = cleanItems[0];
      let matchedRoom = "TBD";
      for (const pattern of roomPatterns) {
        if (pattern.test(text)) {
          matchedRoom = text.match(pattern)[0];
          break;
        }
      }

      let matchedInstructor = "Faculty";
      const prefixRegex = /(?:Dr\.|Prof\.|Engr\.|Mr\.|Ms\.|Mrs\.|Lec\.|Lecturer\.|Dr|Prof|Engr|Mr|Ms|Mrs|Lec)\s+[A-Z][a-zA-z]+(?:\s+[A-Z][a-zA-z]+){0,2}/i;
      const match = text.match(prefixRegex);
      if (match && match[0]) {
        matchedInstructor = match[0].trim();
      }

      let matchedSubject = text;
      if (matchedInstructor !== "Faculty") {
        matchedSubject = text.split(matchedInstructor)[0].trim();
      } else if (matchedRoom !== "TBD") {
        matchedSubject = text.split(matchedRoom)[0].trim();
      }

      matchedSubject = matchedSubject.replace(/[-/]+$/, '').trim();

      return {
        subject: matchedSubject || "Academic Session",
        instructor: matchedInstructor,
        room: matchedRoom,
        batchSection: "",
        isLab
      };
    }

    return { subject, instructor, room, batchSection, isLab };
  };

  const getTeacherEntries = (teacherName, teacherDept) => {
    if (!teacherName || !entries) return [];
    
    const matchTeacherNameAndDept = (label, name, dept) => {
      if (!label || !name) return false;
      const cleanTargetName = name.toLowerCase()
        .replace(/\b(dr|engr|prof|professor|associate|assistant|lecturer|mr|ms|mrs|phd)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      let entryNamePart = label.split('(')[0];
      const cleanEntryName = entryNamePart.toLowerCase()
        .replace(/\b(dr|engr|prof|professor|associate|assistant|lecturer|mr|ms|mrs|phd)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      const namesMatch = cleanEntryName.includes(cleanTargetName) || cleanTargetName.includes(cleanEntryName);
      if (!namesMatch) return false;
      
      const deptMatch = label.match(/\(([^)]+)\)$/);
      if (deptMatch && dept) {
        const entryDept = deptMatch[1].toLowerCase().trim();
        const targetDeptClean = dept.toLowerCase().trim();
        return entryDept === targetDeptClean || entryDept.includes(targetDeptClean) || targetDeptClean.includes(entryDept);
      }
      return true;
    };

    return entries.map(e => {
      const isStudentMatch = e.timetable_type === 'student' && e.instructor && (
        matchTeacherNameAndDept(e.instructor, teacherName, teacherDept)
      );
      if (isStudentMatch) return { ...e, batch_section: e.owner_label };
      return e;
    }).filter(e => {
      if (e.timetable_type === 'teacher' && e.owner_label) {
        return matchTeacherNameAndDept(e.owner_label, teacherName, teacherDept);
      }
      if (e.timetable_type === 'student' && e.instructor) {
        return matchTeacherNameAndDept(e.instructor, teacherName, teacherDept);
      }
      return false;
    });
  };

  const handleUpload = async () => {
    if (!file || !semesterLabel) return alert('Please select a file and enter semester label');
    setIsUploading(true);

    try {
      let fileUrl = '';
      let uploadId = '';

      if (isDatabaseConnected()) {
        const fileName = `${Date.now()}_${file.name}`;
        try {
          const { data: storageData, error: storageError } = await supabase.storage
            .from('timetables')
            .upload(fileName, file);

          if (storageError) throw storageError;
          
          const { data: { publicUrl } } = supabase.storage.from('timetables').getPublicUrl(fileName);
          fileUrl = publicUrl;
        } catch (storageErr) {
          console.warn('Supabase storage bucket "timetables" not found. Falling back to local URL:', storageErr);
          fileUrl = URL.createObjectURL(file);
        }

        const { data: uploadData, error: uploadError } = await supabase.from('timetable_uploads').insert([{
          file_url: fileUrl,
          storage_path: fileName,
          type,
          semester_label: semesterLabel
        }]).select();

        if (uploadError) throw uploadError;
        uploadId = uploadData[0].id;
        setUploads(prev => [...prev, { id: uploadId, fileURL: fileUrl, storagePath: fileName, type, semesterLabel, uploadedAt: new Date() }]);
      } else {
        // Local only fallback
        uploadId = Date.now().toString();
        fileUrl = URL.createObjectURL(file);
        setUploads(prev => [...prev, { id: uploadId, fileURL: fileUrl, type, semesterLabel, uploadedAt: new Date() }]);
      }

      // Parse PDF and sync faculty
      await parsePDF(file, uploadId, type, uploadDept);
      alert('Timetable uploaded and parsed successfully');
      setFile(null);
      setSemesterLabel('');
      setUploadDept('');
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Error uploading/parsing timetable: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const parsePDF = async (file, uploadId, globalType, selectedUploadDept) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    const allEntries = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items;

      // Extract title (usually top-most item)
      const sortedItems = [...items].sort((a, b) => b.transform[5] - a.transform[5]); // Sort by Y descending
      const titleItem = sortedItems[0];
      const pageTitle = titleItem ? titleItem.str : '';

      const isTeacher = globalType === 'teacher' || pageTitle.toLowerCase().includes('teacher');
      const ownerLabel = isTeacher ? pageTitle.replace(/Teacher\s+/i, '').trim() : pageTitle.trim();

      // Heuristic parsing:
      // 1. Identify Y-coordinates for Days
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const dayYMap = {};
      
      items.forEach(item => {
        const foundDay = days.find(d => item.str.includes(d));
        if (foundDay) {
          dayYMap[foundDay] = item.transform[5];
        }
      });

      // 2. Identify X-coordinates for Slots (approximate columns)
      // Standard slot times (based on common university formats)
      const slotThresholds = [200, 300, 400, 500, 600, 700]; // Example X offsets
      
      // 3. Process items into entries
      const grid = {}; // day -> slot -> [items]
      
      items.forEach(item => {
        // Skip header/footer and title
        if (item.transform[5] > titleItem.transform[5] - 20) return;
        if (item.str.toLowerCase().includes('break')) return; // Step 4: Skip "Break"

        // Find nearest day
        let nearestDay = null;
        let minDist = 20;
        days.forEach(day => {
           if (dayYMap[day]) {
             const dist = Math.abs(item.transform[5] - dayYMap[day]);
             if (dist < minDist) {
               minDist = dist;
               nearestDay = day;
             }
           }
        });

        if (!nearestDay) return;

        // Find slot index based on X
        const x = item.transform[4];
        let slotIndex = -1;
        for (let s = 0; s < slotThresholds.length; s++) {
          if (x < slotThresholds[s]) {
             slotIndex = s + 1;
             break;
          }
        }

        if (slotIndex === -1) return;

        if (!grid[nearestDay]) grid[nearestDay] = {};
        if (!grid[nearestDay][slotIndex]) grid[nearestDay][slotIndex] = [];
        grid[nearestDay][slotIndex].push(item.str);
      });

      // 4. Finalize entries from grid
      Object.keys(grid).forEach(day => {
        Object.keys(grid[day]).forEach(slotStr => {
          const slot = parseInt(slotStr);
          const itemsArray = grid[day][slot];
          const cellText = itemsArray.join(' ').trim();
          if (cellText.length < 3) return;

          const parsed = extractSemanticParts(itemsArray);
          const hasSpan = cellText.toLowerCase().includes('(2h)') || cellText.toLowerCase().includes('(3h)') || cellText.length > 60;

          allEntries.push({
            upload_id: uploadId,
            timetable_type: isTeacher ? 'teacher' : 'student',
            owner_label: ownerLabel,
            day,
            slot_number: slot,
            time_label: getTimeLabel(slot),
            subject: parsed.subject,
            room_code: parsed.room,
            instructor: isTeacher ? ownerLabel : parsed.instructor,
            batch_section: isTeacher ? (parsed.batchSection || parsed.subject || 'N/A') : ownerLabel,
            session_type: parsed.isLab ? 'lab' : 'class',
            span: hasSpan ? 2 : 1
          });
        });
      });
    }

    if (isDatabaseConnected()) {
      await supabase.from('timetable_entries').insert(allEntries);
    }
    setEntries(prev => [...prev, ...allEntries]);

    // Auto-sync missing faculty members if a department is selected
    if (selectedUploadDept) {
      const teacherNames = globalType === 'teacher' 
        ? allEntries.map(e => e.owner_label) 
        : allEntries.map(e => e.instructor);

      const uniqueTeacherNames = [...new Set(teacherNames)]
        .map(name => name ? name.split('(')[0].trim() : '')
        .filter(name => name && name.toLowerCase() !== 'faculty' && name.trim().length > 3);

      const newFacultyMembers = [];
      
      for (const teacherName of uniqueTeacherNames) {
        const cleanedExtractedName = cleanName(teacherName);
        
        // Skip if already in local faculty state
        const existsLocally = faculty.some(f => {
          const cName = cleanName(f.facultyName);
          return cName === cleanedExtractedName || cleanedExtractedName.includes(cName) || cName.includes(cleanedExtractedName);
        });

        if (existsLocally) continue;

        const newId = `AUTO-F-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const dbUUID = crypto.randomUUID ? crypto.randomUUID() : `auto-f-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const newFaculty = {
          id: newId,
          dbID: dbUUID,
          facultyName: teacherName,
          designation: teacherName.toLowerCase().includes('dr') ? 'Assistant Professor' : 'Lecturer',
          department: selectedUploadDept,
          password: '123',
          email: `${teacherName.replace(/^(Dr\.|Prof\.|Engr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').replace(/\s+/g, '.').toLowerCase()}@cuivehari.edu.pk`,
          phone: '+92 300 ' + Math.floor(1000000 + Math.random() * 9000000)
        };

        if (isDatabaseConnected()) {
          try {
            const { error: profileErr } = await supabase
              .from('profiles')
              .insert({
                id: dbUUID,
                email: newFaculty.email,
                role: 'FACULTY',
                full_name: teacherName,
                phone_number: newFaculty.phone
              });
            if (!profileErr) {
              await supabase
                .from('faculty')
                .insert({
                  profile_id: dbUUID,
                  employee_id: newId,
                  designation: newFaculty.designation
                });
            }
          } catch (dbErr) {
            console.error('Failed to insert auto-extracted faculty to Supabase:', dbErr);
          }
        }

        newFacultyMembers.push(newFaculty);
      }

      if (newFacultyMembers.length > 0) {
        if (setFaculty) {
          setFaculty(prev => [...prev, ...newFacultyMembers]);
        }
        if (notify) {
          notify(`Auto-added ${newFacultyMembers.length} new faculty members to the ${selectedUploadDept} department!`);
        }
        console.log(`Auto-added ${newFacultyMembers.length} missing faculty members for department ${selectedUploadDept}`);
      }
    }
  };

  const getTimeLabel = (slot) => {
    const slots = [
      "8:30 - 10:00 AM",
      "10:00 - 11:30 AM",
      "11:30 - 1:00 PM",
      "1:30 - 3:00 PM",
      "3:00 - 4:30 PM",
      "4:30 - 6:00 PM"
    ];
    return slots[slot - 1];
  };

  const handleDelete = async (upload) => {
    setDeletingId(upload.id);
    
    // Optimistic local update
    setUploads(prev => prev.filter(u => u.id !== upload.id));
    setEntries(prev => prev.filter(e => e.upload_id !== upload.id));

    if (isDatabaseConnected()) {
      try {
        if (upload.storagePath) {
          try {
            await supabase.storage.from('timetables').remove([upload.storagePath]);
          } catch (storageErr) {
            console.warn('Storage deletion failed:', storageErr);
          }
        }
        
        // Let ON DELETE CASCADE handle entries automatically, single transaction prevents UI blinking
        const res = await supabase.from('timetable_uploads').delete().eq('id', upload.id);
        
        if (res.error) {
            console.warn('DB Delete Warning:', res.error);
        } else if (notify) {
            notify("Timetable deleted successfully.");
        }
      } catch (err) {
        console.warn('DB Delete Error:', err);
      }
    }
    setDeletingId(null);
  };

  return (
    <div className="view-container fade-in">
      <div className="view-header-premium">
        <div>
          <h1>Timetable Management</h1>
          <p>Upload and parse institutional schedules.</p>
        </div>
      </div>

      <div className="card mb-32">
        <h2>Upload New Timetable</h2>
        <div style={{display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>PDF File</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="form-input-premium" style={{padding: '5px 8px'}} />
          </div>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Timetable Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="form-input-premium" style={{minWidth: '150px'}}>
              <option value="student">Student Timetables</option>
              <option value="teacher">Teacher Timetables</option>
            </select>
          </div>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Department</label>
            <select value={uploadDept} onChange={e => setUploadDept(e.target.value)} className="form-input-premium" style={{minWidth: '180px'}}>
              <option value="">Select Department...</option>
              {departments && departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Semester Label</label>
            <input 
              type="text" 
              className="form-input-premium"
              placeholder="e.g. Spring 2026" 
              value={semesterLabel} 
              onChange={e => setSemesterLabel(e.target.value)} 
            />
          </div>
          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload & Parse'}
          </button>
        </div>
      </div>

      <div className="card" style={{padding: '0'}}>
        <div style={{padding: '24px', borderBottom: '1px solid var(--color-border)'}}>
          <h2>Uploaded Timetables</h2>
        </div>
        <div className="table-wrapper">
          <table className="premium-table min-w-table">
          <thead>
            <tr>
              <th>Semester</th>
              <th>Registry File</th>
              <th>Type</th>
              <th>Upload Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map(u => (
              <tr key={u.id}>
                <td>{u.semesterLabel}</td>
                <td>
                  <a href={u.fileURL} target="_blank" rel="noreferrer" style={{fontSize:'12px', color:'var(--color-accent)', textDecoration:'underline'}}>
                    View Document
                  </a>
                </td>
                <td><span style={{textTransform: 'capitalize'}}>{u.type}</span></td>
                <td>{new Date(u.uploadedAt).toLocaleDateString()}</td>
                <td className="text-right">
                  <button 
                    className="btn-text-only" 
                    style={{color: 'var(--color-danger)', opacity: deletingId === u.id ? 0.5 : 1}} 
                    disabled={deletingId === u.id}
                    onClick={() => setDeleteConfirmUpload(u)}
                  >
                    {deletingId === u.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {uploads.length === 0 && (
                <tr><td colSpan="5" style={{textAlign:'center', opacity:0.5, padding:'40px'}}>No timetables uploaded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <div className="card mt-32 mb-32">
        <h2 style={{marginBottom: '20px'}}>Department Faculty Timetables</h2>
        <div style={{display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap'}}>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Select Department</label>
            <select className="form-input-premium" value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedTeacher(''); }} style={{minWidth: '220px', margin: 0}}>
              <option value="">-- Choose Department --</option>
              {departments && departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
            </select>
          </div>
          {selectedDept && (
            <div>
              <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Select Faculty Member</label>
              <select className="form-input-premium" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={{minWidth: '250px', margin: 0}}>
                <option value="">-- Choose Instructor --</option>
                {faculty && faculty.filter(f => f.department === selectedDept).map(f => (
                  <option key={f.id} value={f.facultyName}>{f.facultyName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {selectedTeacher ? (
          <TimetableGrid 
            entries={getTeacherEntries(selectedTeacher, selectedDept)} 
            title={`Faculty Timetable — ${selectedTeacher}`} 
          />
        ) : (
          <div className="empty-state" style={{padding: '40px'}}>
             <p style={{opacity: 0.6}}>Select a department and an instructor to view their parsed timetable slots.</p>
          </div>
        )}
      {deleteConfirmUpload && (
        <div className="modal-overlay-premium" style={{zIndex: 9999, display:'flex', alignItems:'center', justifyContent:'center', position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)'}}>
          <div className="glass-card p-40 fade-in" style={{maxWidth:'450px', width:'90%', textAlign:'center', background:'var(--color-bg)', border:'1px solid var(--color-border)', borderRadius:'12px', boxShadow:'0 20px 40px rgba(0,0,0,0.3)'}}>
            <h2 style={{color:'var(--color-danger)', fontSize:'24px', marginBottom:'16px'}}>Expunge Schedule?</h2>
            <p style={{fontSize:'14px', margin:'16px 0 24px', opacity:0.8, color:'var(--color-ink)'}}>
              This will permanently remove the semester timetable, all parsed schedules, and associated grid entries. This action is irreversible.
            </p>
            <div style={{display:'flex', gap:'16px'}}>
              <button className="btn-text-only" style={{flex:1, fontWeight:700}} onClick={() => setDeleteConfirmUpload(null)}>CANCEL</button>
              <button className="btn-primary-premium" style={{background:'var(--color-danger)', border:'none', flex:1}} onClick={async () => {
                const u = deleteConfirmUpload;
                setDeleteConfirmUpload(null);
                await handleDelete(u);
              }}>CONFIRM DELETION</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TimetableManagement;
