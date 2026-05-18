const WebSocket = require('ws');
const http = require('http');

console.log("🔍 Scanning project members to locate 'Sania Irum'...");

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
    const userRes = await fetch('/rest/api/3/user/assignable/search?project=SCRUM');
    if (!userRes.ok) return { error: "Failed with status " + userRes.status };
    const users = await userRes.json();
    return users.map(u => ({
      accountId: u.accountId,
      displayName: u.displayName,
      accountType: u.accountType
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
      console.log('📬 Users response:');
      console.dir(response, { depth: null });
      ws.close();
      process.exit(0);
    });
  });
});
