import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { supabase, isDatabaseConnected } from '../lib/supabase';
import TimetableGrid from './TimetableGrid';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const TimetableManagement = ({ uploads, setUploads, entries, setEntries, departments, faculty, students }) => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState('student');
  const [semesterLabel, setSemesterLabel] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const cleanName = (n) => {
    if (!n) return '';
    return n.toLowerCase()
      .replace(/\b(dr|engr|prof|professor|associate|assistant|lecturer|mr|ms|mrs|phd)\b/g, '')
      .replace(/[^a-z0-9]/g, '').trim();
  };

  const getTeacherEntries = (teacherName) => {
    if (!teacherName || !entries) return [];
    const cleanedTeacherName = cleanName(teacherName);
    return entries.map(e => {
      const isStudentMatch = e.timetable_type === 'student' && e.instructor && (
        cleanName(e.instructor).includes(cleanedTeacherName) || 
        cleanedTeacherName.includes(cleanName(e.instructor))
      );
      if (isStudentMatch) return { ...e, batch_section: e.owner_label };
      return e;
    }).filter(e => {
      if (e.timetable_type === 'teacher' && e.owner_label) {
        const cleanedOwner = cleanName(e.owner_label);
        return cleanedOwner.includes(cleanedTeacherName) || cleanedTeacherName.includes(cleanedOwner);
      }
      if (e.timetable_type === 'student' && e.instructor) {
        const cleanedInstr = cleanName(e.instructor);
        return cleanedInstr.includes(cleanedTeacherName) || cleanedTeacherName.includes(cleanedInstr);
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

      // Parse PDF
      await parsePDF(file, uploadId, type);
      alert('Timetable uploaded and parsed successfully');
      setFile(null);
      setSemesterLabel('');
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Error uploading/parsing timetable: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const parsePDF = async (file, uploadId, globalType) => {
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

      const isTeacher = pageTitle.toLowerCase().includes('teacher');
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
          const cellText = grid[day][slot].join(' ').trim();
          if (cellText.length < 3) return;

          // Step 4 rules:
          const isLab = cellText.toLowerCase().includes('-lab');
          const hasSpan = cellText.toLowerCase().includes('(2h)') || cellText.length > 50; // Heuristic for span

          allEntries.push({
            upload_id: uploadId,
            timetable_type: isTeacher ? 'teacher' : 'student',
            owner_label: ownerLabel,
            day,
            slot_number: slot,
            time_label: getTimeLabel(slot),
            subject: cellText.split('\n')[0].substring(0, 30),
            room_code: cellText.match(/[A-Z]+-\d+/)?.[0] || 'TBD',
            instructor: isTeacher ? '' : (cellText.match(/Dr\.\s\w+|Prof\.\s\w+/)?.[0] || 'Faculty'),
            batch_section: isTeacher ? (cellText.match(/[A-Z]+-[A-Z0-9-]+/)?.[0] || 'N/A') : '',
            session_type: isLab ? 'lab' : 'class',
            span: hasSpan ? 2 : 1
          });
        });
      });
    }

    if (isDatabaseConnected()) {
      await supabase.from('timetable_entries').insert(allEntries);
    }
    setEntries(prev => [...prev, ...allEntries]);
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
    if (!window.confirm("Permanent Action: This will remove the document and all associated grid entries. Continue?")) return;
    
    if (isDatabaseConnected()) {
      try {
        // Delete from storage
        if (upload.storagePath) {
          try {
            await supabase.storage.from('timetables').remove([upload.storagePath]);
          } catch (storageErr) {
            console.warn('Storage deletion failed (bucket likely missing):', storageErr);
          }
        }
        // Delete from DB (entries will cascade delete if foreign key set to CASCADE)
        await supabase.from('timetable_uploads').delete().eq('id', upload.id);
      } catch (err) {
        console.error('Delete Error:', err);
        return alert("Failed to delete record from database: " + err.message);
      }
    }
    setUploads(prev => prev.filter(u => u.id !== upload.id));
    setEntries(prev => prev.filter(e => e.upload_id !== upload.id));
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
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end'}}>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>PDF File</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
          </div>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Timetable Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="student">Student Timetables</option>
              <option value="teacher">Teacher Timetables</option>
            </select>
          </div>
          <div>
            <label style={{fontSize: '12px', display: 'block', marginBottom: '4px'}}>Semester Label</label>
            <input 
              type="text" 
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
                  <button className="btn-text-only" style={{color: 'var(--color-danger)'}} onClick={() => handleDelete(u)}>Delete</button>
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
              {departments && departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
            entries={getTeacherEntries(selectedTeacher)} 
            title={`Faculty Timetable — ${selectedTeacher}`} 
          />
        ) : (
          <div className="empty-state" style={{padding: '40px'}}>
             <p style={{opacity: 0.6}}>Select a department and an instructor to view their parsed timetable slots.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableManagement;
