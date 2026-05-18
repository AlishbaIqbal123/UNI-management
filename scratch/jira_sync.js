const WebSocket = require('ws');
const http = require('http');

console.log("🔍 Scanning local Chrome remote debugging instances on port 9222...");

// 1. Fetch active targets from Chrome debugger endpoint
http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let tabs = [];
    try {
      tabs = JSON.parse(data);
    } catch(e) {
      console.error("❌ Failed to parse targets list:", e);
      process.exit(1);
    }

    // Find the active Jira tab
    const jiraTab = tabs.find(t => t.url && t.url.includes('atlassian.net') && t.webSocketDebuggerUrl);
    if (!jiraTab) {
      console.error('❌ Could not find an open Atlassian Jira tab on port 9222!');
      console.log('Available targets were:');
      tabs.forEach(t => console.log(` - [${t.title}] (${t.url})`));
      process.exit(1);
    }

    console.log(`🎯 Found Active Jira Tab: "${jiraTab.title}"`);
    console.log(`🔗 Connecting to debugger: ${jiraTab.webSocketDebuggerUrl}`);

    // 2. Open WebSocket connection to CDP target
    const ws = new WebSocket(jiraTab.webSocketDebuggerUrl);
    
    ws.on('open', () => {
      console.log('✅ Connected to debugger WebSocket. Injecting chronological sync engine...');
      
      // 3. Define the ultimate timeline and scrum synchronization script to evaluate inside Jira
      const codeToRun = `
(async function() {
  console.log("🚀 Starting ultimate browser context timeline & scrum synchronization...");
  
  // A. Fetch all active board issues
  const res = await fetch('/rest/agile/1.0/board/1/issue?maxResults=150');
  if (!res.ok) throw new Error("Fetch board issues failed");
  const data = await res.json();
  const issues = data.issues || [];
  console.log("📋 Page context loaded " + issues.length + " board issues.");
  
  // B. Retrieve Sprint details and IDs
  let sprint1Id = null, sprint2Id = null;
  const sprintRes = await fetch('/rest/agile/1.0/board/1/sprint');
  if (sprintRes.ok) {
    const sprintData = await sprintRes.json();
    const s1 = sprintData.values.find(s => s.name.toUpperCase().includes("SPRINT 1") || s.name.includes("1"));
    const s2 = sprintData.values.find(s => s.name.toUpperCase().includes("SPRINT 2") || s.name.includes("2"));
    if (s1) sprint1Id = s1.id;
    if (s2) sprint2Id = s2.id;
  }
  console.log("📡 Resolved Sprint IDs: Sprint 1: " + sprint1Id + ", Sprint 2: " + sprint2Id);
  
  // C. Resolve dynamic Start Date custom field key
  let startDateField = 'customfield_10015';
  try {
    const editMetaRes = await fetch('/rest/api/3/issue/SCRUM-61/editmeta');
    if (editMetaRes.ok) {
      const meta = await editMetaRes.json();
      for (let k in meta.fields) {
        if (meta.fields[k].name && meta.fields[k].name.toLowerCase() === 'start date') {
          startDateField = k;
          break;
        }
      }
    }
  } catch (e) {
    console.warn("Could not find start date metadata, defaulting to customfield_10015");
  }
  console.log("🔑 Start Date Field Key: " + startDateField);

  // D. Map duplicate/legacy epics to the single winning Epic
  const epicMappings = {
    // Authentication & Identity
    "SCRUM-1": "SCRUM-61", "SCRUM-31": "SCRUM-61", "SCRUM-46": "SCRUM-61",
    // Academic Timetable
    "SCRUM-34": "SCRUM-68", "SCRUM-49": "SCRUM-68",
    // Examination & Grading
    "SCRUM-5": "SCRUM-73", "SCRUM-37": "SCRUM-73", "SCRUM-52": "SCRUM-73",
    // Finance & Attendance
    "SCRUM-6": "SCRUM-78", "SCRUM-20": "SCRUM-78", "SCRUM-40": "SCRUM-78", "SCRUM-55": "SCRUM-78",
    // Institutional clearance & Communications
    "SCRUM-43": "SCRUM-83", "SCRUM-58": "SCRUM-83"
  };

  const winningEpics = {
    "SCRUM-3":  { name: "Faculty Management", start: "2026-03-09", end: "2026-04-03", sprint: "SPRINT_1" },
    "SCRUM-4":  { name: "Course Setup", start: "2026-03-09", end: "2026-04-03", sprint: "SPRINT_1" },
    "SCRUM-61": { name: "Core Authentication & Identity", start: "2026-03-09", end: "2026-04-03", sprint: "SPRINT_1" },
    "SCRUM-68": { name: "Academic & Timetable Logistics", start: "2026-03-09", end: "2026-04-03", sprint: "SPRINT_1" },
    "SCRUM-18": { name: "Administration Management", start: "2026-04-09", end: "2026-05-01", sprint: "SPRINT_2" },
    "SCRUM-73": { name: "Examination & Grade Registry", start: "2026-04-09", end: "2026-05-01", sprint: "SPRINT_2" },
    "SCRUM-78": { name: "Financial & Attendance Operations", start: "2026-04-09", end: "2026-05-01", sprint: "SPRINT_2" },
    "SCRUM-83": { name: "Institutional Communications & Clearance", start: "2026-04-09", end: "2026-05-01", sprint: "SPRINT_2" }
  };

  // E. Reparent child issues of duplicate/legacy epics to safe winning Epics
  console.log("🔄 Re-routing child stories to authentic Epic winners...");
  for (let issue of issues) {
    if (issue.fields.parent && epicMappings[issue.fields.parent.key]) {
      const newParent = epicMappings[issue.fields.parent.key];
      console.log("🔀 Moving child " + issue.key + " parent from " + issue.fields.parent.key + " to winner: " + newParent);
      await fetch('/rest/api/3/issue/' + issue.key, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { parent: { key: newParent } } })
      });
    }
  }

  // F. Delete all duplicate Epics completely (removes timelines clutter)
  console.log("🧹 Deleting legacy/duplicate Epics...");
  for (let dupKey in epicMappings) {
    console.log("❌ Deleting duplicate Epic: " + dupKey);
    await fetch('/rest/api/3/issue/' + dupKey, { method: 'DELETE' });
  }

  // G. Schedule Winning Epics to match chronological Sprints
  console.log("📅 Formatting winning Epic dates...");
  for (let epicKey in winningEpics) {
    const info = winningEpics[epicKey];
    console.log("✨ Scheduling winning Epic " + epicKey + " (" + info.name + ") ➔ " + info.start + " to " + info.end);
    const payload = { fields: {} };
    payload.fields[startDateField] = info.start;
    payload.fields.duedate = info.end;
    await fetch('/rest/api/3/issue/' + epicKey, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // H. Nest child issue timelines cleanly and assign Sprints
  console.log("⚡ Aligning child issue Sprints and matching nested due dates...");
  const s1Issues = [];
  const s2Issues = [];
  
  // Re-fetch fresh list of board issues (after deletions and updates)
  const refRes = await fetch('/rest/agile/1.0/board/1/issue?maxResults=150');
  const refData = await refRes.json();
  const freshIssues = refData.issues || [];

  for (let child of freshIssues) {
    if (child.fields.parent && winningEpics[child.fields.parent.key]) {
      const epicKey = child.fields.parent.key;
      const epicInfo = winningEpics[epicKey];

      if (epicInfo.sprint === "SPRINT_1") {
        s1Issues.push(child.key);
      } else {
        s2Issues.push(child.key);
      }

      // Align Story due date to exactly Epic's end date (perfect warning-free nesting)
      await fetch('/rest/api/3/issue/' + child.key, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { duedate: epicInfo.end } })
      });
    }
  }

  // Push Sprint 1 issues
  if (sprint1Id && s1Issues.length > 0) {
    console.log("⚡ Moving " + s1Issues.length + " issues to Sprint 1...");
    await fetch('/rest/agile/1.0/sprint/' + sprint1Id + '/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issues: s1Issues })
    });
  }

  // Push Sprint 2 issues
  if (sprint2Id && s2Issues.length > 0) {
    console.log("⚡ Moving " + s2Issues.length + " issues to Sprint 2...");
    await fetch('/rest/agile/1.0/sprint/' + sprint2Id + '/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issues: s2Issues })
    });
  }

  // I. Final Scrum Sync: Transition all open tasks and stories to DONE
  console.log("🌈 Transitioning remaining Scrum tasks to DONE status...");
  for (let issue of freshIssues) {
    if (issue.fields.issuetype.name !== 'Epic' && issue.fields.status.name.toUpperCase() !== 'DONE') {
      try {
        const transRes = await fetch('/rest/api/3/issue/' + issue.key + '/transitions');
        if (transRes.ok) {
          const transData = await transRes.json();
          const doneTrans = transData.transitions.find(t => t.name.toUpperCase() === 'DONE' || t.to.name.toUpperCase() === 'DONE');
          if (doneTrans) {
            await fetch('/rest/api/3/issue/' + issue.key + '/transitions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transition: { id: doneTrans.id } })
            });
            console.log("✅ Transitioned " + issue.key + " to DONE.");
          }
        }
      } catch(e) {}
    }
  }

  console.log("🏆 Chronological Scrum board & Timeline Sync Complete!");
  setTimeout(() => location.reload(), 2000);
  return "SUCCESS";
})()
      `;

      // 4. Send CDP command
      const payload = {
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: codeToRun,
          awaitPromise: true,
          returnByValue: true
        }
      };
      
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', (msg) => {
      const response = JSON.parse(msg);
      if (response.id === 1) {
        console.log('\n📬 Chrome DevTools Protocol response received:');
        if (response.exceptionDetails) {
          console.error("❌ Exception inside browser execution context:", response.exceptionDetails);
        } else {
          console.log("✅ Script executed successfully inside Jira tab context!");
          console.dir(response.result, { depth: null });
        }
        ws.close();
        process.exit(0);
      }
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket error connecting to target tab:', err);
      process.exit(1);
    });
  });
}).on('error', (err) => {
  console.error("❌ Failed to query Chrome Debugger service on port 9222:", err);
  process.exit(1);
});
