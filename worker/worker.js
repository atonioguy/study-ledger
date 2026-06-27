// Aquamarine data proxy — Cloudflare Worker
// Holds your TickTick token server-side and hands the dashboard only the fields it needs.
// Secrets (wrangler secret put ...):  TICKTICK_TOKEN, AQ_KEY
// Var (wrangler.toml [vars] or dashboard):  ALLOW_ORIGIN  (your Pages origin, or * )

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'x-aq-key, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    // shared-secret gate — only requests carrying your key get data
    if (req.headers.get('x-aq-key') !== env.AQ_KEY) return json({ error: 'unauthorized' }, 401, cors);

    try {
      if (url.pathname === '/ticktick' && req.method === 'GET') {
        return json(await ticktick(env.TICKTICK_TOKEN), 200, cors);
      }
      if (url.pathname === '/ticktick/complete' && req.method === 'POST') {
        const b = await req.json();
        if (!b.id || !b.projectId) return json({ error: 'need id + projectId' }, 400, cors);
        await ttComplete(env.TICKTICK_TOKEN, b.projectId, b.id);
        return json({ ok: true }, 200, cors);
      }
      if (url.pathname === '/ticktick/reopen' && req.method === 'POST') {
        const b = await req.json();
        if (!b.id || !b.projectId) return json({ error: 'need id + projectId' }, 400, cors);
        await ttReopen(env.TICKTICK_TOKEN, b);
        return json({ ok: true }, 200, cors);
      }
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 502, cors);
    }
    return json({ error: 'not found' }, 404, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors },
  });
}

async function tt(path, token) {
  const r = await fetch('https://api.ticktick.com/open/v1' + path, { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('ticktick ' + r.status);
  return r.json();
}

// Mark a task done: POST /open/v1/project/{projectId}/task/{taskId}/complete
async function ttComplete(token, projectId, taskId) {
  const r = await fetch(`https://api.ticktick.com/open/v1/project/${projectId}/task/${taskId}/complete`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token },
  });
  if (!r.ok) throw new Error('ticktick complete ' + r.status);
}

// Undo a completion: update the task back to status 0 (open API has no dedicated reopen).
async function ttReopen(token, t) {
  const r = await fetch(`https://api.ticktick.com/open/v1/task/${t.id}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ id: t.id, projectId: t.projectId, title: t.title || '', status: 0 }),
  });
  if (!r.ok) throw new Error('ticktick reopen ' + r.status);
}

// The open API has no global "today" query, so we pull each project's tasks and merge.
async function ticktick(token) {
  const projects = await tt('/project', token);
  const name = {}; for (const p of projects) name[p.id] = p.name;
  const all = [];
  await Promise.all(projects.map(async (p) => {
    try { const d = await tt('/project/' + p.id + '/data', token); for (const t of (d.tasks || [])) all.push(t); }
    catch { /* skip a project that errors */ }
  }));
  const tasks = all
    .filter((t) => t.status === 0)                       // undone only
    .map((t) => ({
      id: t.id,
      title: t.title || '',
      due: t.dueDate || t.startDate || null,             // ISO 8601 or null
      allDay: !!t.isAllDay,
      priority: t.priority || 0,                          // 0 none, 1 low, 3 mid, 5 high
      project: name[t.projectId] || '',
      projectId: t.projectId,                             // needed to complete/reopen the task
    }))
    .sort((a, b) => ((a.due || '9999') < (b.due || '9999') ? -1 : 1));
  return { tasks, ts: Date.now() };
}
