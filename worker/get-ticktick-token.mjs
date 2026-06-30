// One-time helper to mint a TickTick access token for the worker.
// Run:  TT_CLIENT_ID=xxx TT_CLIENT_SECRET=yyy node get-ticktick-token.mjs
// Then in the TickTick app settings, make sure the redirect URI is exactly:
//   http://localhost:8080/callback
import http from 'node:http';

const CLIENT_ID = process.env.TT_CLIENT_ID;
const CLIENT_SECRET = process.env.TT_CLIENT_SECRET;
const REDIRECT = 'http://localhost:8080/callback';
if (!CLIENT_ID || !CLIENT_SECRET) { console.error('Set TT_CLIENT_ID and TT_CLIENT_SECRET env vars.'); process.exit(1); }

const authUrl = 'https://ticktick.com/oauth/authorize'
  + '?scope=' + encodeURIComponent('tasks:read tasks:write')
  + '&client_id=' + encodeURIComponent(CLIENT_ID)
  + '&state=aquamarine'
  + '&redirect_uri=' + encodeURIComponent(REDIRECT)
  + '&response_type=code';

console.log('\n1) Open this URL in your browser and click Allow:\n\n' + authUrl + '\n');

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:8080');
  if (u.pathname !== '/callback') { res.end('waiting for TickTick redirect…'); return; }
  const code = u.searchParams.get('code');
  if (!code) { res.end('no code in callback'); return; }
  const body = new URLSearchParams({
    client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code,
    grant_type: 'authorization_code', scope: 'tasks:read tasks:write', redirect_uri: REDIRECT,
  });
  const r = await fetch('https://ticktick.com/oauth/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body,
  });
  const j = await r.json();
  if (j.access_token) {
    console.log('\n✅ TickTick access token:\n\n' + j.access_token + '\n');
    console.log('Now set it on the worker:\n  wrangler secret put TICKTICK_TOKEN   (paste the token)\n');
    res.end('Done — check your terminal for the token, then close this tab.');
  } else {
    console.error('\n❌ Token error:', j);
    res.end('Error — check your terminal.');
  }
  setTimeout(() => process.exit(0), 400);
}).listen(8080, () => console.log('2) Listening on http://localhost:8080 for the redirect…'));
