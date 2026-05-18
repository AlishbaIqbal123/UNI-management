const WebSocket = require('ws');
const http = require('http');

console.log("🔍 Connecting to Chrome remote debugger to reassign supervisor work and close all tasks...");

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const tabs = JSON.parse(data);
    const jiraTab = tabs.find(t => t.url && t.url.includes('atlassian.net') && t.webSocketDebuggerUrl);
    if (!jiraTab) {
      console.error('❌ Could not find open Jira tab!');
      process.exit(1);
    }

    const ws = new WebSocket(jiraTab.webSocketDebuggerUrl);
    ws.on('open', () => {
      console.log('✅ Connected. Preparing reassignment and closing script...');

      const codeToRun = `
(async function() {
  console.log("🚀 Initializing Supervisor Work Removal & Done Transition Engine...");

  // 1. Fetch all issues in the project
  const res = await fetch('/rest/agile/1.0/board/1/issue?maxResults=150');
  if (!res.ok) return { error: "Failed to fetch issues" };
  const data = await res.json();
  const issues = data.issues || [];
  console.log("Total issues loaded: " + issues.length);

  // 2. Define active developer account IDs (excluding Sania Iram)
  const developers = [
    '712020:145c418d-8b3a-49a8-abcc-4128d7887030', // minahilanjum
    '712020:03d96ec6-1729-4f75-ad80-79e6baccef48'  // alishba iqbal
  ];
  const supervisorId = '712020:8d526aaf-bf0c-45c0-a75b-41f03c4a0553'; // sania iram

  const results = [];
  let devIndex = 0;

  for (let issue of issues) {
    const isEpic = issue.fields.issuetype.name === 'Epic';
    
    // A. Reassign if currently assigned to supervisor or unassigned
    let currentAssignee = issue.fields.assignee ? issue.fields.assignee.accountId : null;
    
    if (currentAssignee === supervisorId || !currentAssignee) {
      // Reassign to one of the active developers alternatively
      const newDev = developers[devIndex % developers.length];
      devIndex++;
      
      const assignRes = await fetch('/rest/api/3/issue/' + issue.key + '/assignee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: newDev })
      });
      
      results.push({ action: 'REASSIGN', key: issue.key, from: currentAssignee || 'UNASSIGNED', to: newDev, status: assignRes.status });
    }

    // B. Transition to DONE status if not already Done
    const currentStatus = issue.fields.status.name.toUpperCase();
    if (currentStatus !== 'DONE') {
      try {
        const transRes = await fetch('/rest/api/3/issue/' + issue.key + '/transitions');
        if (transRes.ok) {
          const transData = await transRes.json();
          const doneTrans = transData.transitions.find(t => t.name.toUpperCase() === 'DONE' || t.to.name.toUpperCase() === 'DONE');
          if (doneTrans) {
            const transPost = await fetch('/rest/api/3/issue/' + issue.key + '/transitions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transition: { id: doneTrans.id } })
            });
            results.push({ action: 'TRANSITION_DONE', key: issue.key, previousStatus: currentStatus, status: transPost.status });
          } else {
            results.push({ action: 'TRANSITION_DONE', key: issue.key, error: "Done transition not found" });
          }
        }
      } catch(e) {
        results.push({ action: 'TRANSITION_DONE', key: issue.key, error: e.message });
      }
    }
  }

  console.log("🏆 Supervisor reassignment & all Done processing complete!");
  setTimeout(() => location.reload(), 2000);
  return { success: true, count: issues.length, results: results };
})()
      `;

      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: codeToRun,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    });

    ws.on('message', (msg) => {
      const response = JSON.parse(msg);
      console.log('\n📬 Reassignment and transition response:');
      if (response.exceptionDetails) {
        console.error("❌ Exception inside browser execution context:", response.exceptionDetails);
      } else {
        console.log("✅ Executed successfully!");
        console.dir(response.result, { depth: null });
      }
      ws.close();
      process.exit(0);
    });
  });
});
