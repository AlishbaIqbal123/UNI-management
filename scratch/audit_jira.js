const WebSocket = require('ws');
const http = require('http');

console.log("🔍 Querying active issues from local Chrome remote debugger...");

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
      const codeToRun = `
(async function() {
  try {
    const res = await fetch('/rest/agile/1.0/board/1/issue?maxResults=150');
    if (!res.ok) return { error: "Fetch failed with status " + res.status };
    const data = await res.json();
    const issues = data.issues || [];
    
    return issues.map(iss => ({
      key: iss.key,
      type: iss.fields.issuetype.name,
      summary: iss.fields.summary,
      status: iss.fields.status.name,
      parent: iss.fields.parent ? { key: iss.fields.parent.key } : null
    }));
  } catch(e) {
    return { error: e.message };
  }
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
      console.log('📬 Full response received:');
      console.dir(response, { depth: null });
      ws.close();
      process.exit(0);
    });
  });
});
