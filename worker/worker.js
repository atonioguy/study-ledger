// Aquamarine data proxy — Cloudflare Worker
// Holds your API tokens server-side and hands the dashboard only the fields it needs.
// Secrets (wrangler secret put ... or dashboard):  TICKTICK_TOKEN, AQ_KEY, NOTION_TOKEN (optional)
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
      if (url.pathname === '/notion/list' && req.method === 'GET') {
        if (!env.NOTION_TOKEN) return json({ error: 'NOTION_TOKEN not set' }, 400, cors);
        return json(await notionList(env.NOTION_TOKEN), 200, cors);
      }
      if (url.pathname === '/notion' && req.method === 'GET') {
        if (!env.NOTION_TOKEN) return json({ error: 'NOTION_TOKEN not set' }, 400, cors);
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'need ?id=<database id or url>' }, 400, cors);
        return json(await notionDB(env.NOTION_TOKEN, id), 200, cors);
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

// ===== Notion =====
const NOTION_VER = '2022-06-28';
// accept a bare id, dashed id, or any Notion URL — pull the 32-hex id and dash it
function notionId(raw) {
  const m = String(raw).replace(/-/g, '').match(/[0-9a-f]{32}/i);
  if (!m) throw new Error('bad notion id/url');
  return m[0].replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5').toLowerCase();
}
async function notionFetch(token, path, init) {
  const r = await fetch('https://api.notion.com/v1' + path, {
    ...init,
    headers: { Authorization: 'Bearer ' + token, 'Notion-Version': NOTION_VER, 'content-type': 'application/json', ...(init && init.headers) },
  });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error('notion ' + r.status + (t ? ': ' + t.slice(0, 160) : '')); }
  return r.json();
}
const richText = (rt) => (rt || []).map((t) => t.plain_text).join('');
// normalize one property into { t:<kind>, v:<value> } the dashboard can render without knowing Notion internals
function notionVal(p) {
  switch (p && p.type) {
    case 'title': return { t: 'text', v: richText(p.title) };
    case 'rich_text': return { t: 'text', v: richText(p.rich_text) };
    case 'select': return { t: 'select', v: p.select ? { name: p.select.name, color: p.select.color } : null };
    case 'status': return { t: 'select', v: p.status ? { name: p.status.name, color: p.status.color } : null };
    case 'multi_select': return { t: 'multi', v: (p.multi_select || []).map((o) => ({ name: o.name, color: o.color })) };
    case 'checkbox': return { t: 'check', v: !!p.checkbox };
    case 'number': return { t: 'text', v: p.number == null ? '' : String(p.number) };
    case 'date': return { t: 'date', v: p.date ? { start: p.date.start, end: p.date.end } : null };
    case 'url': return { t: 'text', v: p.url || '' };
    case 'email': return { t: 'text', v: p.email || '' };
    case 'phone_number': return { t: 'text', v: p.phone_number || '' };
    case 'people': return { t: 'text', v: (p.people || []).map((u) => u.name || '').filter(Boolean).join(', ') };
    case 'files': return { t: 'text', v: (p.files || []).map((f) => f.name).join(', ') };
    case 'created_time': return { t: 'date', v: { start: p.created_time, end: null } };
    case 'last_edited_time': return { t: 'date', v: { start: p.last_edited_time, end: null } };
    case 'created_by': return { t: 'text', v: (p.created_by && p.created_by.name) || '' };
    case 'last_edited_by': return { t: 'text', v: (p.last_edited_by && p.last_edited_by.name) || '' };
    case 'relation': return { t: 'text', v: (p.relation || []).length ? (p.relation.length + ' linked') : '' };
    case 'unique_id': return { t: 'text', v: p.unique_id ? ((p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number) : '' };
    case 'formula': { const f = p.formula || {}; if (f.type === 'date') return { t: 'date', v: f.date ? { start: f.date.start, end: f.date.end } : null }; const v = f[f.type]; return { t: 'text', v: v == null ? '' : String(v) }; }
    case 'rollup': { const r = p.rollup || {}; if (r.type === 'number') return { t: 'text', v: r.number == null ? '' : String(r.number) }; if (r.type === 'date') return { t: 'date', v: r.date ? { start: r.date.start, end: r.date.end } : null }; if (r.type === 'array') return { t: 'text', v: (r.array || []).map((x) => (x[x.type] && (x[x.type].name || richText(x[x.type]))) || '').filter(Boolean).join(', ') }; return { t: 'text', v: '' }; }
    default: return { t: 'text', v: '' };
  }
}
// list the databases the integration can see (shared with it)
async function notionList(token) {
  const r = await notionFetch(token, '/search', { method: 'POST', body: JSON.stringify({ filter: { property: 'object', value: 'database' }, page_size: 100 }) });
  const databases = (r.results || []).map((d) => ({ id: d.id, title: richText(d.title) || 'Untitled', url: d.url }));
  return { databases, ts: Date.now() };
}
// one database's schema + rows, normalized
async function notionDB(token, rawId) {
  const id = notionId(rawId);
  const meta = await notionFetch(token, '/databases/' + id, {});
  const title = richText(meta.title) || 'Untitled';
  const props = meta.properties || {};
  const names = Object.keys(props);
  // title column first, the rest in schema order
  names.sort((a, b) => (props[a].type === 'title' ? -1 : props[b].type === 'title' ? 1 : 0));
  const columns = names.map((n) => ({ name: n, type: props[n].type }));
  const q = await notionFetch(token, '/databases/' + id + '/query', { method: 'POST', body: JSON.stringify({ page_size: 100 }) });
  const rows = (q.results || []).map((pg) => {
    const cells = {}; for (const n of names) cells[n] = notionVal(pg.properties[n]);
    return { id: pg.id, url: pg.url, cells };
  });
  return { id, title, url: meta.url, columns, rows, ts: Date.now() };
}
