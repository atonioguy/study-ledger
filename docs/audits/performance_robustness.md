# Performance & Robustness Audit — Side Quest

**Scope:** `/home/user/study-ledger/quest.html` (live, v2.8, 193,371 B, 1,146 lines), `/home/user/study-ledger/quest-next.html` (prototype, 84,830 B, 891 lines), `/home/user/study-ledger/worker/worker.js`, `PLAN.md`.
**Grounded against sibling reports** (`migration_audit_live.md`, `migration_audit_prototype.md`, `gamefeel_ideas.md`) — where they already flagged something (200KB reject + swallowed error, 77KB base64 line, v2↔v3 clobber), this report does not re-derive it; it quantifies it, ranks it, and specifies the fix.

**Framing:** the app is a solo-maintained single file. Every fix below is a vanilla-JS/CSS pattern (event delegation, targeted DOM updates, `visibilitychange`, WAAPI, payload budgeting) — no frameworks, no build step.

---

## Ranked findings (risk of bricking/lag × likelihood)

| # | Finding | Severity | Now / at-scale | Effort | Timing |
|---|---|---|---|---|---|
| 1 | Sync fails silently — `pushCloud()` swallows *every* error | **critical** | **now** (any 401/network) → guaranteed at-scale (413) | S | live-fold, do first |
| 2 | Save blob will realistically cross the 200KB ceiling | **critical** | at-scale (~2 full worlds) | M | design now, enforce at fold |
| 3 | localStorage writes silently dropped on quota/error | **critical** | now (origin shared with aquamarine's image-bearing `aq_feed`) | S | prototype-now + live-fold |
| 4 | Multi-device clobber: last-writer-wins whole blob, no version/OCC guard | **high** | at fold (v2↔v3), latent now | S–M | live-fold, before shipping v3 |
| 5 | `pullCloud()` adopts remote blob destructively — no local backup, no shape/size validation | **high** | now | S | live-fold |
| 6 | 900ms debounced push with no `pagehide` flush — last change of a session often never syncs | **high** | now | S | live-fold |
| 7 | Full-innerHTML re-render: scroll reset, O(n) listener re-attach, whole-view rebuild per step toggle | **high** | at-scale (20 quests × long step lists) | M | prototype-now |
| 8 | Perpetual paint-cost animations (`left`, `box-shadow`, `filter` loops); zero `prefers-reduced-motion`; no offscreen/hidden pause | **med-high** | now (constant battery/paint in iframe), compounds with planned particles | S | prototype-now + live-fold |
| 9 | No particle budget yet — planned fireflies/petals/rain need caps + gating before they exist | **med** | at-scale (planned) | S (spec) | prototype-now |
| 10 | Audio footprint: eager `new Audio()` preload (~280KB), first-tap decode burst, `rain.mp3` is 3.8MB, 77KB base64 line | **med** | now / at feature-time | S–M | live-fold |
| 11 | Font `@import` without preconnect in live file → late font discovery, FOIT flash in iframe | **low-med** | now | XS | live-fold |
| 12 | Whole-`WORLD` stringify + synchronous localStorage write on every toggle/keystroke path | **low-med** | at-scale | S | live-fold |
| 13 | Map render: ~400 absolutely-positioned road-dot divs at 20 quests | **low** | at-scale (fine, watch it) | S | optional |
| 14 | Interval/RAF discipline is currently good — codify it before ambient loops arrive | **low** | forward-looking | XS | prototype-now |

---

## 3. Storage & sync robustness — HIGHEST PRIORITY (the bricking risk)

### Finding 1 — Sync fails silently (critical, NOW)
`quest.html:1054`:
```js
fetch(API.url+'/save?slot=sidequest',{...}).catch(()=>{});
```
There is **no `.then(r => ...)` at all** — a 413 ("save too large", `worker.js:63`), a 401 (rotated key), a 5xx, or plain network failure are indistinguishable from success. The sibling audit flagged the 413 case; the scope is actually wider: **sync can already be dead today for any reason and nothing in the UI will ever say so.** The user keeps playing, local state diverges, and the eventual symptom is "my other device is weeks behind" or, worse, an old device's stale blob winning a timestamp race.

**Fix (fail loudly + telemetry), ~30 lines:**
```js
let SYNC = lsGet('aq_sync_meta') || {ok:true, t:0, err:'', size:0, fails:0};
function syncFail(err, size){
  SYNC = {ok:false, t:Date.now(), err:String(err), size, fails:SYNC.fails+1};
  localStorage.setItem('aq_sync_meta', JSON.stringify(SYNC));
  const g=document.getElementById('sqGear'); if(g) g.classList.add('sync-bad');   // red dot on the ⚙
  if(err==='413') cwBanner('⚠ save too big — archive a world');                    // actionable, once
}
function syncOk(size){ SYNC={ok:true,t:Date.now(),err:'',size,fails:0}; ...persist, clear dot... }

function pushCloud(){ if(!syncOn())return; clearTimeout(pushTimer); pushTimer=setTimeout(()=>{
  const body = JSON.stringify(snapshot());
  if(body.length > BUDGET_HARD) return syncFail('local-oversize', body.length);   // never even send junk
  fetch(API.url+'/save?slot=sidequest', {method:'POST',headers:{...},body})
    .then(r => r.ok ? syncOk(body.length) : syncFail(String(r.status), body.length))
    .catch(() => syncFail('net', body.length));
},900); }
```
- The ⚙ panel already shows `syncStatusText()` (`quest.html:1101`) — extend it to render `SYNC.err`, last-good time, and **current payload size vs budget** ("save: 41KB / 150KB"). That one line of telemetry is the early-warning system for finding 2.
- Retry: don't build a queue — the next `markChanged()` re-pushes the full snapshot anyway (blob sync is idempotent). Just add: if `SYNC.fails>0 && navigator.onLine`, re-push on `online` event and on next app focus. Keep it dumb.
- **Effort:** small. **Timing:** live-fold, first thing — it protects everything else.

### Finding 2 — Payload budget vs the 200KB ceiling (critical, AT SCALE)
Measured JSON sizes for the prototype's step shape (`quest-next.html:378`):
- **typical step ≈ 174 B** (40-char text, 50-char notes)
- **worst-case step = 1,287 B** (maxlength text 200 + notes 1000)

So at the designed caps (20 quests/world, ~20 steps/quest):
- typical quest ≈ **4 KB**, typical full world ≈ **80 KB**
- **two active worlds at cap ≈ 160 KB** + campDone/buddies/cos/pomo/progress → **brushes 200,000 chars in completely realistic use**
- worst-case (heavy notes) **one world alone = ~520 KB** → instant 413.

The current v2 snapshot is <1 KB; the danger arrives exactly when the fold ships `worlds` into `snapshot()`. Combined with finding 1's silent catch, this is the canonical "grows for months, then silently bricks" path.

**Fix — a payload budget with two thresholds (client-side, zero worker changes):**
- `BUDGET_WARN = 100_000`, `BUDGET_HARD = 150_000` (75% of the worker limit — headroom for JSON escaping and future fields). On push, compute `body.length`; over WARN → show the size in the ⚙ panel amber + one-time banner "your save is getting big — archive a finished world"; over HARD → block the push (finding 1's `local-oversize`), keep saving locally, and make the banner persistent. **Never let the worker's 413 be the first signal.**
- **Serialize lean:** strip empty fields when snapshotting (`notes:''`, `date:''`, `done:false` omitted → typical step drops from 174 B to ~110 B, ~35% off the whole blob for free). Rehydrate defaults on load. ~15 lines in a `packQuest()/unpackQuest()` pair.
- **The archive pattern holds — keep it.** Verified: `archiveWorld()` (`quest-next.html:827–861`) computes a compact snapshot (~0.3–2 KB/world) into `aq_archive`, **removes the world + quests from active state**, and `aq_archive` is only read by `renderStats()` — never in `snapshot()`. PLAN.md:150–155 maps it to its own lazy `?slot=sidequest-archive` (worker accepts any slot, `worker.js:55`). This is the correct shape; the fold must preserve two invariants: (a) archive slot is pushed **only** when archiving/pulling stats, (b) archive is never merged into the main blob. Add a boot-time assert-style check that `snapshot()` has no `archive` key.
- **Completed-quest compaction (optional lever):** completed quests are read-only trophies (PLAN 131). At completion (or when a world nears WARN), drop each done quest's `notes` (or the whole step text, keeping counts/xp) — same idea as archiving, one notch earlier. Keeps the ceiling ~5–10× further away.
- **If it's ever still not enough:** shard to per-world slots (`?slot=sidequest-w_<id>`) + a tiny index slot. Worker already supports it; don't build until the telemetry says so.
- **Effort:** medium (budget+strip = small; compaction = small; sharding = defer). **Timing:** thresholds + telemetry designed now, enforced in the same PR that puts `worlds` into `snapshot()`.

### Finding 3 — Quota/corrupt writes silently dropped (critical, NOW)
Two flavors:
- **Prototype:** every write is `try{ localStorage.setItem(...) }catch(e){}` (`quest-next.html:386, 397, 404`). Safety from *throwing*, yes — but on `QuotaExceededError` the game keeps running while **nothing saves**; the user finds out at next reload. Quota is a live concern: the same origin's localStorage (~5 MB on iOS Safari) is shared with aquamarine's `aq_feed` (image-bearing) per the live migration audit.
- **Live:** several writes are **not wrapped at all** — `savePomo()` (`quest.html:974`), `adjustBalance()` (629), `markChanged()` (1069), `saveCampaign` (530). A quota throw inside `adjustBalance` mid-purchase aborts the handler after coins were conceptually spent; a throw in `markChanged` (last call in the patched `cwToggle`, 1080) is survivable but noisy.

**Fix — one central `save(key, obj)` helper, used everywhere:**
```js
function save(key, obj){
  try{ localStorage.setItem(key, JSON.stringify(obj)); return true; }
  catch(e){
    cwBanner('⚠ storage full — progress may not save');   // loud, once per session
    // best-effort self-rescue: prune known-fat non-game keys? No — never touch aquamarine's keys.
    return false;
  }
}
```
- Mutations that charge currency should check the return: `if(!save('aq_econ',e)) revert-in-memory`.
- Add a tiny boot-time gauge: `JSON.stringify(localStorage).length` → show in ⚙ dev area ("origin storage: 1.2MB used"). Costs nothing, makes quota visible years before it hits.
- Game saves stay **text-only** forever (already true; keep it a rule — postcards etc. are re-rendered from ~40 B of params per gamefeel #16, never stored as images).
- **Effort:** small. **Timing:** prototype now (it's 5 call sites), live at fold.

### Finding 4 — Multi-device clobber / v2↔v3 (high, AT FOLD)
Sibling audit already specified the client side (version-aware adopt: never let a v2 blob drop `worlds`/`progress`; re-migrate after adopting v2). **Complement — a 3-line worker-side optimistic-concurrency guard** closes the remaining race (old device pushes stale blob with fresher wall-clock `t`, or two devices push within the debounce window):
```js
// worker.js /save POST, after parsing body:
const cur = await env.SAVES.get('save:'+slot);
if (cur) { const c = JSON.parse(cur); if ((JSON.parse(body).t||0) < (c.t||0)) return json({error:'stale', t:c.t}, 409, cors); }
```
Client: on 409, `pullCloud()` then re-push merged state (and `syncFail('409')` so it's visible). Also **reject `v` regression**: a v3 server blob should never be replaced by a v2 push — check `body.v >= c.v` in the same guard. This converts "silently lose a device's day of progress" into "one extra round-trip."
- **Effort:** small–medium (the merge-on-conflict policy is the thinking part; for a solo user "pull, re-apply local timestamps, push" is enough). **Timing:** must land with v3.

### Finding 5 — Destructive adopt without backup (high, NOW)
`pullCloud()` (`quest.html:1059–1065`) overwrites `campDone` + 4 localStorage keys the moment a remote blob has `campDone` and a newer `t`. A corrupt-but-parsable blob (e.g. `campDone:{}` pushed by a buggy build, or a truncated KV value) wipes local progress with **no undo**. The validity gate is one truthy check.

**Fix:**
- Before adopting: `save('aq_backup_prev', {t:stamp(), snap:snapshot()})` — one rolling pre-adopt backup (~1 KB now, bounded later by the same budget). Add "restore previous save" behind the ⚙ dev area.
- Validate the incoming blob: shape (`typeof d.campDone==='object'`, post-fold: `Array.isArray(d.worlds.worlds)`), and sanity (reject a blob whose step-count/xp is <10% of local unless user confirms — the "did the cloud really lose 90% of my progress?" prompt). ~20 lines.
- **Effort:** small. **Timing:** live-fold (backup line can ship today).

### Finding 6 — Debounce with no flush on exit (high, NOW)
`markChanged()` → 900ms `setTimeout` → fetch. On mobile-in-iframe the common exit is: check a step, swipe away / lock phone. The timeout never fires; the local stamp **is** updated, so when the other device pushes, this device's newer-stamped local state wins the pull comparison and the two never reconcile until this device reopens. Confirmed: **no `pagehide`/`visibilitychange` handler exists anywhere in quest.html.**

**Fix (~6 lines):**
```js
addEventListener('pagehide', flushPush);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) flushPush(); });
function flushPush(){ if(!pushTimer || !syncOn())return; clearTimeout(pushTimer); pushTimer=0;
  fetch(API.url+'/save?slot=sidequest', {method:'POST', keepalive:true, headers:{...}, body:JSON.stringify(snapshot())}).catch(()=>{}); }
```
`keepalive:true` survives page teardown (64KB body cap — fine now; post-fold, if blob >64KB, fall back to `navigator.sendBeacon` won't carry headers, so instead accept best-effort and rely on next-open push + finding 4's OCC). **Effort:** small. **Timing:** live-fold (worth cherry-picking into v2.x now).

---

## 1. Render cost

### Finding 7 — Full-innerHTML re-render pattern (high, AT SCALE)
Current mechanics:
- **Live:** `buildCampaign()` (`quest.html:577–591`) rebuilds the whole questline HTML once and then does **targeted updates** on toggle (`cwToggle` flips classes + `cwSetIcon`, `campUpdate` writes counters by id). This is the *good* pattern — full render on structure change, surgical DOM writes on state change. **Keep it as the model for the fold.**
- **Prototype:** `show(name)` (`quest-next.html:876`) re-renders the entire target view on every navigation, and — the expensive part — **`renderPreview()` rebuilds the whole quest view on every single step toggle** (`quest-next.html:556`), re-attaching 5 listeners per row (`contextmenu/pointerdown/pointermove/pointerup` + implicit, lines 549–556). `renderBuilder()` similarly full-rebuilds on add-step/delete/diff-chip (446, 453, 475–478).

Cost model at scale (iPhone, inside the 484px iframe):
- 20 quests × ~20 steps: `renderPreview` builds ~60 nodes/quest — fine alone; the issue is *frequency* (every tap) plus two side effects: **(a) scroll reset** — `pv.innerHTML = h` collapses the content momentarily, so toggling a step deep in a long list can clamp/jump the scroll position; same for `renderMap()` (`wrap.innerHTML=head` at line 625) on a 3,400px-tall 20-quest map when returning from a quest. **(b)** listener churn is GC-able (no true leak — discarded subtrees release their handlers) but it's O(rows) work per tap that targeted updates make O(1).
- **Not a leak, but note:** the per-row 450ms hold `setTimeout` (`quest-next.html:554`) is cleared on pointerup/move; a re-render racing a hold leaves a timer holding a stale row closure for ≤450ms — harmless, but delegation (below) eliminates the class.

**Fixes (all prototype-now, they define the fold's pattern):**
- **Event delegation:** one `pointerdown/pointerup/contextmenu` set on `.pv-rows`' container (and one `click` on `#chapters`, keyed by `data-act`/`data-ci`/`data-si`), instead of per-row handlers. The prototype already half-does this (the capture-phase blip handler at 880, `data-act` attributes at 442/470) — finish the job. Removes all re-attach cost and the stale-timer class.
- **Targeted toggle:** on step toggle, update only: the row's `done` class + icon (`cwSetIcon` equivalent), the chapter `.pv-fill` width + `.cnt` text, the `.qhd` meta, and HUD. This is exactly what live `cwToggle`/`campUpdate` already do — port that discipline, not the prototype's re-render.
- **Preserve scroll:** where full render is still right (navigation, structural edits), wrap it: `const st=scroller.scrollTop; render(); scroller.scrollTop=st;`.
- **Long step lists:** the builder re-renders whole on structural ops — fine to keep (structure changes are rare), but *keystrokes must never re-render* (they don't today — inputs mutate the model directly, line 472–474; keep that invariant, it's what protects focus + IME on mobile).
- **Effort:** medium (a day). **Timing:** prototype-now — cheaper to fix before the code is folded into the live shell.

### Finding 13 — Map road dots (low, AT SCALE)
`renderMap()` creates a `.mdot` div every ~15px of path (`quest-next.html:632`): at 20 quests ≈ 20 hops × ~16 dots ≈ **320 absolutely-positioned divs**, plus 20 boxes/hills/labels ≈ ~420 elements. Static (no per-frame cost), builds in a few ms; scrolling a `transform`-free absolutely-positioned field is fine. **Acceptable — don't rebuild it.** If it ever grows (longer roads, decor), draw the dotted path as **one SVG `<path stroke-dasharray>`** or one canvas — 1 element instead of 320. Note also: reflow-wise all map children are absolutely positioned with fixed coordinates, so layout is cheap; keep it that way (no percentage/auto layout inside `.map`).

---

## 2. Animation / particle budget

### Finding 8 — Perpetual paint-cost animations + zero motion gating (med-high, NOW)
Inventory of *infinite* loops (grep-verified):
- **quest.html:38 `cwSweep 5.5s infinite` animates `left`** — the HUD xp-bar sheen. Animating `left` runs style+layout+paint every frame, forever, on every screen (the HUD is always visible). This is the single worst standing cost in the live game.
- **quest.html:46,135 `cwLvPulse` animates `box-shadow`** — paint each frame, infinite, always-visible HUD element.
- **quest.html:351 `sqSparkFlash` animates `filter: drop-shadow`** — paint each frame whenever the map tab is shown (the current-node sparkle).
- quest.html:259–260 `sheen` animates `background-position` — paint, but only inside the TCG modal (bounded exposure). Fine.
- The rest (`cwBob`, `sqPulse`, `cwSquish`, `mamb`, `hudShine` in the prototype) are transform/opacity — compositor-only, cheap, good.
- **No `prefers-reduced-motion` anywhere in either file** (grep: zero hits), despite gamefeel_ideas.md:8 promising it. **No `visibilitychange`/IntersectionObserver anywhere** — CSS animations and RAF do get throttled by the browser when the *tab* is hidden, but an iframe scrolled offscreen within a visible dashboard tab is throttled inconsistently across engines (Safari especially).

**Fixes:**
- `cwSweep`: animate `transform: translateX(...)` on the sheen span instead of `left` (the prototype's `hudShine` at quest-next.html:31 already does it correctly — copy it back). 5-minute fix, permanent win.
- `cwLvPulse` / `sqSparkFlash`: pre-render the glow as a pseudo-element/second layer and animate its **opacity** (compositor) instead of box-shadow/filter recomputation. ~30 min.
- Add once, globally:
  ```css
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{ animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
  }
  ```
  plus a JS flag `const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches` that skips particle spawns and ambient loops entirely (confetti bursts can degrade to a single opacity flash).
- Add one **master gate** for ambient work:
  ```js
  let AMBIENT_ON = true;
  const io = new IntersectionObserver(([e])=>{ AMBIENT_ON = e.isIntersecting && !document.hidden; toggleAmbient(); });
  io.observe(document.getElementById('app'));
  document.addEventListener('visibilitychange', ()=>{ AMBIENT_ON = !document.hidden; toggleAmbient(); });
  ```
  (Same-origin iframe IO correctly reflects visibility within the top-level viewport.) `toggleAmbient()` pauses WAAPI handles (`anim.pause()`) and sets `animation-play-state:paused` on the ambient container. The pomo room already has the right shape — `pomoStart()/pomoStop()` wired to nav (quest.html:1096) — extend the same enter/leave discipline to any future ambient layer.
- **Effort:** small. **Timing:** the `left`→transform + reduced-motion block are safe to ship in live now; the gate lands with the first ambient feature.

### Finding 9 — Safe particle budget for the planned effects (med, PLANNED)
gamefeel_ideas.md plans: fireflies/twinkles/clouds (#13, self-capped "~8 animated nodes" — good instinct, make it law), palette motes: petals/snow/embers/leaves (#15, "4–6 on screen"), rain (#14), shooting star. Concrete budget to adopt as constants:

| Rule | Value |
|---|---|
| Ambient animated DOM nodes (map) | **≤ 10 total** (clouds+motes+fireflies combined; one shared engine, `MOTE_MAX=10`) |
| Burst particles (confetti) | current 13/30 per burst is fine; **cap concurrent bursts at 3** (`cwBigCelebrate` already = 3×30=90 nodes, treat that as the ceiling; queue, don't stack, slot+level+quest celebrations) |
| Properties animated | **transform + opacity only** — motes are `position:absolute; will-change:transform` sprites moved by WAAPI keyframes or CSS animations; **never** top/left/box-shadow/filter per frame |
| Layering | one `.map-amb` container, `position:absolute; inset:0; pointer-events:none; contain:strict; z-index` under content — contains layout/paint, one compositor surface |
| Per-frame JS | **none** for ambience — no rAF loop for drifting motes; use long WAAPI loops with randomized delays/durations. rAF is reserved for the pomo room (interactive physics) and one-shot count-ups |
| Rain | one div with `repeating-linear-gradient` streaks animated via `transform: translateY` (loop the tile height), exactly as gamefeel #14 sketches — 1 node, compositor-only |
| Gating | spawn only when `AMBIENT_ON && !REDUCED` (finding 8's gate); despawn (remove nodes) on leave, don't just pause, so hidden screens hold zero ambient DOM |
| Parallax | passive scroll listener writing **one** `transform: translateY()` on `.map-amb` (gamefeel #13's sketch is right); never read layout in that handler |

**Effort:** the budget itself is a 10-line "mote engine" contract. **Timing:** prototype-now — write the engine once in quest-next with the caps baked in, so the fold imports discipline, not just sparkle.

### Finding 14 — Timer discipline (low, forward-looking)
Current state is actually clean: the only `setInterval`s in the live game are the 3 slot reels (`quest.html:954`), each `clearInterval`-ed in a paired timeout (956); pomo rAF is start/stop-wired to nav; drag listeners are removed on `dragEnd`; WAAPI confetti self-removes via `onfinish`. **No live leak found.** The risk is future: gamefeel plans a `skyTick` "on load + every ~10 min" (#4), idle blink timers (#7), typewriter interval (#5). Codify now:
- one module-level **registry**: `const TIMERS=new Set(); function every(ms,fn){const id=setInterval(fn,ms);TIMERS.add(id);return id;}` + a screen-leave hook that clears screen-scoped timers (mirror `pomoStart/pomoStop`);
- rule: any `setInterval` must either be in the registry or paired with a visible `clearInterval` in the same screen's leave hook;
- idle animations (blink, sleepy-z) should be `setTimeout`-rescheduled chains gated on `AMBIENT_ON`, not free-running intervals.
**Effort:** trivial. **Timing:** prototype-now.

---

## 4. Load / footprint

### Finding 10 — Audio strategy (med, NOW + at feature-time)
- **Eager preload:** `quest.html:601` constructs five `new Audio(url)` at parse time. Chrome's default `preload=auto` typically downloads them at load: `sfx-buildup.mp3` **199 KB** + dice 33 + fanfare 20 + legend 23 + squish 1.3 ≈ **~280 KB of audio on first paint's heels**, inside a mobile iframe, before the user does anything. Fix: `a.preload='none'` on each (1 line), and let `unlockAudio()`'s existing fetch-and-decode path (605–611) be the loader — it already runs on first gesture.
- **First-gesture burst:** `unlockAudio` fetch+decodes **all 9** sounds at once on the first tap. Acceptable today (~340 KB incl. the base64 four), but make it lazy-per-sound at fold time: decode on first *play* of each name, keep `check/xp/blip` eager (they fire immediately). Small.
- **`rain.mp3` is 3,829,248 B.** The rain feature (gamefeel #14) must not ship it as-is: re-encode a seamless ~20–30s loop at mono 48–64 kbps (~**150–250 KB**), `preload='none'`, load only on the first rainy evening after the user gesture, and stop/unload when leaving the pomo screen. Put a hard rule in the repo: **no audio asset >300 KB ships to the client.** (`sfx-buildup.mp3` at 199 KB is the current biggest legit one; it's a one-shot, fine.)
- **The 77,482-char base64 line** (`quest.html:533`): siblings flagged the edit-hazard; the perf angle: it's ~58 KB of real audio carried as 77 KB of JS string (+33% wire overhead pre-gzip; gzip claws most back) parsed on every load. Since same-origin mp3 files are *already* the established pattern for the other five sounds, **externalize the four base sounds to `sfx-check/xp/levelup/reset.mp3`** and delete the line: −77 KB file size (−40% of quest.html), removes the corruption hazard, zero behavior change (the decode path is URL-agnostic — it already `fetch()`es `CW_SFX[k].src`). Only cost: 4 more tiny same-origin requests, cached after first load. **Effort:** small. **Timing:** live-fold (safe standalone too).

### Finding 11 — Fonts (low-med, NOW)
`quest.html:14` uses `@import` inside the `<style>` block with **no preconnect** (the prototype added `<link rel="preconnect">` at quest-next.html:4 — the live file never got it). `@import`'d font CSS is discovered only after the style block parses, serializing DNS+TLS+CSS+font fetches; `display=swap` avoids invisible text but the pixel fonts pop in late on cold loads — visible inside the dashboard iframe. Fix: copy the two preconnect lines into quest.html head (30 seconds), or better, self-host the two WOFF2s next to the mp3s (~30–40 KB total, same-origin, immune to font-CDN hiccups — nice for a PWA-ish app). **Timing:** live now.

### File size trajectory
193 KB today → externalizing audio makes it ~116 KB → the fold adds an estimated 40–80 KB (prototype JS+CSS is 85 KB with duplicated concerns) → **~160–200 KB single file**, gzip ~45–60 KB over the wire. That is fine for years. Set a soft ceiling: **quest.html ≤ 350 KB and no single line > 2,000 chars** (post-audio-extraction); if it's ever crossed, split CSS to `quest.css` (still no build step). Parse/execute of ~200 KB of simple JS is <50 ms on a modern iPhone — the single-file architecture is *not* the bottleneck; the payloads (audio) and the sync blob are.

### Mobile / iframe constraints (context for all of the above)
The whole game lives in a 484px-wide iframe (`aquamarine.html:724`) — every paint cost is paid *inside another page's* frame budget, alongside the dashboard's own work. That's why findings 8/9 insist on compositor-only animation, and why the `?v=` cache-buster discipline (sibling-flagged) matters for robustness: bump `SQ_VER` and `v=` together or add a tiny `postMessage` version handshake so the dashboard can hard-reload a stale frame.

---

## 5. Data integrity / never-lose-progress

Mostly covered by findings 3–6 (central guarded `save()`, pre-adopt backup, pagehide flush, OCC). Remaining specifics:

### Finding 12 — Write amplification at scale (low-med, AT SCALE)
- Prototype `onEdit()` → `persist()` stringifies the **whole quest per keystroke** (fine: 4–26 KB, sub-ms) and `syncQuestToWorld()` deep-copies via `JSON.parse(JSON.stringify(quest))` **plus** stringifies the whole `WORLD` per step toggle (`quest-next.html:429`). At a 160 KB WORLD that's ~320 KB of string churn + a synchronous ~160 KB localStorage write per toggle — 5–15 ms on an older iPhone, right in the tap's frame. Fix at fold: debounce `persistWorld()` ~250 ms (writes coalesce; the in-memory model is already correct), and use `structuredClone` instead of parse(stringify). Keep `persist()` (draft) per-keystroke but debounced ~300 ms too. **Never** debounce past the pagehide flush — flush both on `pagehide`.
- Migration safety itself (idempotent guard, run after `pullCloud`, keep `campDone` forever, v3 snapshot shape) is fully specified in the sibling live audit §6 — endorse as-is; the only addition from this report: the migration must also write the pre-migration backup (finding 5's `aq_backup_prev`) *before* creating `aq_worlds`, so the very first v3 boot is reversible.

### Partial-write / corruption guards (small, at fold)
- All game keys are independent `setItem`s — a crash between `saveCampaign()` and `save('aq_econ')` can't half-write a single key (localStorage setItem is atomic per key), but it can leave *cross-key* inconsistency (progress saved, econ not). The derived-economy model (`quest.html:624–628`) actually protects against most of this — balances are recomputed from progress. **Preserve that property in the fold** (the sibling's "earned ledger" for give-up semantics should still be recomputable/clampable, not a free-floating counter that can drift).
- `loadWorld()`-style corruption fallbacks (parse failure → seed default) exist in the prototype for every key — good; port them, but on parse failure **rename** the corrupt value to `aq_worlds_corrupt_<ts>` instead of silently discarding, so nothing is unrecoverable.

---

## Consolidated action list

**Prototype now (quest-next.html):**
1. Event delegation + targeted step-toggle update + scroll preservation (finding 7).
2. Mote/ambient engine with baked caps + `AMBIENT_ON`/`REDUCED` gates + timer registry (findings 8/9/14).
3. Central guarded `save()` with loud quota toast (finding 3).

**Live now (safe, standalone, minutes each):**
4. `pushCloud` response check + red-dot + ⚙ telemetry (finding 1). 5. `pagehide` keepalive flush (finding 6). 6. Pre-adopt backup line in `pullCloud` (finding 5). 7. `cwSweep` left→transform, `prefers-reduced-motion` block, `preload='none'`, font preconnect (findings 8/10/11).

**At fold (must land together with v3 snapshot):**
8. Payload budget WARN/HARD + lean serialization + archive-slot invariants (finding 2). 9. Version-aware adopt + worker OCC 409 (finding 4). 10. Debounced `persistWorld` + structuredClone (finding 12). 11. Externalize the base64 audio, cap rain.mp3 (finding 10).
