# Migration Audit — `quest-next.html` Prototype → Live Game

**Source of truth for the migration.**
Audited files:
- `/home/user/study-ledger/quest-next.html` (891 lines; single-file HTML prototype — CSS lines 5–245, markup 246–303, JS 304–890)
- `/home/user/study-ledger/PLAN.md` (design doc; "BUILT in prototype" sections describe what exists)

Critical fidelity rule from PLAN.md (lines 176–181): the prototype is a **rough proof** of data model + interactions, **NOT the final visual bar**. Port *features* into the live game's polished UI (`quest.html` exam-3 look); do not replace the live UI with the prototype's rougher version.

---

## 1. Screens / Views

All views live inside `#app > .wrap` as `div.view` siblings; exactly one carries class `.on` at a time. The router is `show(name)` (line 876) with the `V` map (line 874): `map | build | preview | hub | pick | stats`. `show()` also calls `applyWorldTheme(activeWorld())` on every navigation and dispatches to the matching `render*()`. The top tab strip `#tabs` (`T` map, line 875) only covers `map / build / preview` (`#tabMap`, `#tabBuild`, `#tabPreview`).

Persistent chrome (never themed, per PLAN Layer 5): sticky header `#top` containing the title strip (`.topbar`, `.t`, `.sub`), tabs `#tabs`, and the HUD row `#hud` (`.hud-lvl` → `#hudRank`, `#hudLv`; `.hud-bar` → `#hudFill`, `#hudXp`; `#hudStreak`).

### 1.1 World Map — `#viewMap` (renderMap, lines 619–656)
The default screen (`show('map')` on boot, line 889). Shows the active world's vertical-snake road of quests.
- **Sticky world banner** `.wmhd` (pinned at `top:var(--toph)`): world emoji+name `.wn`, quest count `.cnt`, and globe button `.wmglobe` (🌍) → hub. The whole banner is also clickable → hub.
- Empty state `.mempty` when no quests.
- **Map container** `.map`, absolutely-positioned children:
  - Road points alternate x=300 / x=132, y=120+i·172 (line 629); path drawn as rotated-square dots `.mdot` every ~15px between consecutive points (line 632), colored `--pathdot`.
  - Per quest: framed **plot box** `.mbox` (214×160, translateX(-50%), bevel border, `.sel` = accent border + glow; click = select-then-open), pixel-canvas **hill** `.mhill` (150×68 img from `hillURL`), **flag** `.mflag` (done/prog/gaveup sprites; done flag is bigger, 42px vs 32px), **label** `.mlbl` with quest name `.nm`, progress `.track > .fill` (class `goldbar` done / `greybar` gaveup / `tealbar` otherwise; width = xp %), `.stat.xp` "earned / total xp", `.stat.st` "earned / total ⭐" using the `.ics` star sprite (inline SVG data-URI).
  - **Selection glow** `.mglow` (radial accent halo, `mamb` pulse animation) and **the gang** `.mgang` (3 `<img>` sprites: slime `SL`, tomato `TM`, buddy `BD`) parked at the selected hill; both CSS-transition their left/top for the 550ms walk (`.walking` adds the `mbob` bob).
  - **Add-a-quest spot** `.madd` (`.an` dashed plus box + `.al` label) as the final road spot → `newQuest()` → `openPick('new')`.
- Interactions: tap unselected hill/box → `selectQuest(id)` (persists `aq_sel`, walks the gang); tap the selected one → `openQuest(id)` (deep-copies the stored quest into the working `quest`, persists draft, `show('preview')`).

### 1.2 Builder — `#viewBuild` (static markup lines 260–268; renderBuilder lines 435–458)
The quest editor (create AND edit — one editor, per PLAN).
- Quest name row `.qname-row` → `#qname` input.
- `#chapters` container of `.chapter` cards: header `.chapter-hd` (drag grip `.grip` ⠿, name input, delete `.mini.del`), body `.chapter-body` with `.steps` list and a `＋ add step` `.addbtn`.
- Step card `.step` (renderStep, lines 459–480): grip, `.play` toggle (▶︎ SVG → ⭐ when done, `playSVG()`), middle column `.mid` (task input `.tk`, `.row2` = `.diffchip` cycling easy→med→hard + `.sxp` "+XP" + `.date` input, auto-growing `textarea.notes`), delete `.mini.del`. Deleting the last step replaces it with a blank one.
- Buttons: `#importBtn` "↯ import from ticktick" → `openPick('add')`; `#addChapter`; `#clearBtn` (confirm → blank quest); `#saveBtn` → `saveQuest()`; `#giveupBtn` (toggles to "↩ resume quest" and drops `.danger` when `quest.state==='gaveup'` — line 457, wiring 870–873). `#saveNote` / `noteFlash()` for transient status text.
- **Drag-reorder** (lines 483–523): pointer-based, no HTML5 DnD. `beginDrag` swaps the element for a dashed placeholder `.ph` and fixes the dragged node to the pointer; `dragMove` repositions the placeholder among `.step`s (within/across chapters) or `.chapter`s; `dragEnd` splices the model arrays and re-renders.
- Any edit funnels through `onEdit()` (line 481): `persist()` draft + live-refresh preview if visible.

### 1.3 Preview — `#viewPreview` (renderPreview, lines 527–558)
The playable quest view (stand-in for the live questline screen).
- **Sticky quest banner** `.qhd` (pinned at `--toph`): quest name `.qt` + meta `.qm` ("E / T xp · d/t done").
- Given-up notice (reuses `.savenote`) when `state==='gaveup'`.
- Per chapter: **banner** `.pv-ban` (gold left bar + `--ban` gradient; `.lbl` name, `.cnt` "d/t done") then striped progress `.pv-track > .pv-fill` (width = chapter xp %), then `.pv-rows` of step rows `.pv-row`: `.ic` play/star SVG, `.bd` (`.task` one-line ellipsis + `.meta` second line "`date` · notes", date in accent), gold `.xp` "+N". `.done` row = bright accent block, dark `--donetx` text, no strikethrough.
- Footer `.pv-foot` ("on finish: N + 3 ⭐ · earning X coins + xp") + hint `.pv-hint`. Empty state `.pv-empty`.
- Interactions (lines 549–557): tap row = toggle done → `sfx('done')`, `awardXP(±stepXP)`, `persist()`, **`syncQuestToWorld()`**, re-render. Right-click or 450ms hold = `openDetail(step)` modal.

### 1.4 Worlds Hub — `#viewHub` (renderHub, lines 753–776)
- Title `.hubttl`, grid `.hubgrid` of palette-themed portal cards `.hubcard[data-wid]` (inline `--c1/--c2/--bd/--acc` from the world's palette): `.hemoji`, `.hname`, xp progress `.hbar > .hfill`, `.hstat` "resolved / n quests", `.hstat2` xp + `.hstat2.st` stars, `.hbadge` "✦ done" when all quests resolved (from `worldAgg`).
- `＋ new world` card `.hubcard.hubadd` (`#hubAdd`) → `openWorldEdit(null)`.
- `.hubrow#hubStats` "📊 view stats →" → stats screen.
- Card interactions: tap = `switchWorld(id)` (sets `activeWorldId`, clears `selectedId`, `show('map')`); **hold 450ms / right-click = `openWorldEdit(wid)`** (rename · recolor · archive).
- Note: PLAN wants gang-on-active-card + per-card flag tally (🚩×done · 🍅×in-progress); prototype hub does NOT render those (flags/gang only exist on the map) — the "✦ done" badge and stats are built.

### 1.5 TickTick Pick — `#viewPick` (static markup 271–277; logic 666–747)
The "pick your tasks" front door. Two entry modes via `openPick(mode)`: `'new'` (from map ＋; shows `#pkSkip` "start blank instead") and `'add'` (from builder import; appends).
- Sticky header `.pkhd`: back `#pkBack` (→ build if mode add, else map), title `.pktt`, `.pksync` "✓ ticktick" badge.
- Search `#pkSearch` (`.pksearch`), tools `.pktools`: by-list ↔ by-date toggle (`.pktoggle` > `.pkseg[data-org]`), `#pkWeek` "⏳ due this week" filter (`.pkfilter`).
- List `#pkList`: group headers `.pkgh` (by-list mode), task rows `.pktask` (`.sub` for indented subtasks, `.sel` when selected): expand caret `.pkexpand[data-exp]` (▸/▾; hidden placeholder `.pkexpand.ph`), checkbox `.pkcheck` (`.on` ✓ / `.part` – for partial-sub selection), body `.pkbd` (`.pkname`, `.pksub` = subtask count and/or list-name tag in date mode), meta `.pkmeta` (`.pkdue` w/ `.soon` gold, priority diamond `.pkpri.hi/.mid`). Empty state `.pkempty`.
- Sticky footer `.pkfoot` (`.empty` disables): `#pkAdd` "add N to quest ▸" (live count) + `#pkSkip`.
- State: `pkSel` (Set of ids), `pkExpand`, `pkOrg` ('list'|'date'), `pkWeekOn`, `pkMode`, `pkQuery`. Search auto-expands parents whose subs match (line 682).

### 1.6 View Stats — `#viewStats` (renderStats, lines 794–825)
Trophy shelf for archived worlds; reuses `.pkhd`/`.pkback` header. Two levels via `stDrillId`:
- **List level**: lifetime summary card `.stsum` (`.stsum-top`: rank `.stsum-rank` + `lv N` `.stsum-lv`; `.stsum-grid` 3 tiles: lifetime xp (`AQ.xp.toLocaleString()`), 🔥 streak, total ⭐ = active worlds' earned stars + archived `se`), then `.stsec` "archived worlds" and palette-themed `.stcard[data-aid]` cards (`.semoji .sname .sdate`, `.sstats` with 🚩done · 🏳️gaveup / n, `.sx` xp, `.ss` stars). Empty `.stempty`.
- **Drill level** (tap a card): archived summary `.stsum` (archived date, quests done incl. 🏳️ count, xp, stars) + per-quest rows `.stqrow` (`.qi` state icon via `stStateIcon`: 🚩 done / 🏳️ gaveup / 🍅 else, `.qn` name, `.qx` xp, `.qs` stars).
- Back button steps drill → list → hub.

### 1.7 Modals (lines 281–302)
- **World editor** `#worldEdit` (`openWorldEdit`/`saveWorldEdit`/`archiveWorld`, lines 827–861): `#weTitle` ("new world"/"edit world"), `#weName`, emoji picker `#weEmoji` (`.emochip` from `EMOJIS`, default ✦), palette picker `#wePal` (`.palchip` diagonal c1/acc split swatches), `#weCancel`/`#weSave`, and `#weManageRow` → `#weArchive` (edit mode only, behind confirm).
- **Task detail** `#detail` (lines 560–572): `#dTask`, `#dMeta` (date · +xp · diff), `#dNotes` (`.dnotes`, `.empty` when none), `#dClose`, `#dEdit` (→ builder).
- **Confirm** `#confirm` (`askConfirm(title,msg,cb)`, lines 574–579): `#cfTitle`, `#cfMsg` (innerHTML — supports `<b>`), `#cfNo`/`#cfYes`. Used by: clear quest, give up quest, archive world.
- All modals: `.modal`/`.on` overlay pattern, click-outside closes, card `.mcard`, buttons `.bigbtn`/`.ghost`/`.danger`, labels `.welbl`, rows `.mrow`, message `.msg`.

---

## 2. Data Model

### 2.1 `WORLD` — the whole active game state (lines 383–388)
```js
WORLD = {
  worlds: [ { id:'w_…', name, emoji, color /* palette key */, questIds:[qid…],
              created /* 'YYYY-MM-DD', only on worlds made post-feature */ } ],
  activeWorldId: 'w_…',       // fixed up to worlds[0].id if null on load
  quests: { [qid]: quest }    // flat store; worlds reference by id
}
```
- `loadWorld()` seeds a default world `{name:'My Quests', emoji:'✦', color:'twilight', questIds:[]}` when the key is absent/corrupt.
- Helpers: `activeWorld()`, `worldQuests()` (maps `questIds` → quest objects, filters missing).
- Moving a quest between worlds (designed in PLAN, **not built** in prototype) is just reassigning which world's `questIds` holds the id.

### 2.2 Quest / chapter / step shape (lines 378–380)
```js
quest   = { id:'q_…', name:'', chapters:[chapter…], createdAt:null|'now', state:'active'|'gaveup' }
chapter = { id:'c_…', name:'', steps:[step…] }
step    = { id:'s_…', text:'', diff:'easy'|'med'|'hard', date:'' /* free text, e.g. "Jul 4" */,
            notes:'', done:false }
```
- Ids from `nid(prefix)` = `prefix + '_' + Date.now().toString(36) + '_' + uid++` (line 333).
- `createdAt` is a stub (`'now'` on first save, line 422) — real timestamp needed in live game.
- Derived quest state (`questState`, line 391): `'gaveup'` (flag) > `'done'` (steps>0 && all done) > `'prog'` (any done) > `'new'`. There is no stored "done" flag — completion is computed.
- The working `quest` global is a **deep copy** of the stored quest when opened from the map (line 663); edits/persistence write back via `persist()` (draft) and `syncQuestToWorld()` (store).

### 2.3 `AQ` — global leveling + streak (lines 400–410)
```js
AQ = { xp: number,        // lifetime XP pool, open-ended, never resets
       streak: number,    // consecutive-day streak
       lastDay: 'YYYY-MM-DD' | null }  // last day a step was completed
```

### 2.4 `TT_LISTS` — baked TickTick snapshot (lines 335–376)
Const array standing in for the live worker `/ticktick` fetch. Shape:
```js
TT_LISTS = [ { id, name /* list name e.g. 'BMSC 3404 · Microbiology' */, tasks:[
  { id, title, note, due:'YYYY-MM-DD'|null, pri:0|1|3|5,
    subs:[ { id, title, note, due, pri } ] /* may be [] or absent */ } ] } ]
```
Three lists baked: Microbiology, Career Readiness, MCAT Prep. Helpers: `dueLabel(iso)` → "Jul 4" via `MON`; `dueSoon(iso)` → true when due within [-1, +7] days. Transient `p._list` is stamped on tasks in by-date mode (line 706). **Live game must swap this const for the worker fetch, and the worker needs a subtask endpoint** (PLAN line 100).

### 2.5 Archive snapshot (`archiveSnapshot`, lines 782–791)
Compact per-world record (heavy data discarded):
```js
{ id, name, emoji, color, created:null|'YYYY-MM-DD', archived:'YYYY-MM-DD',
  n /* quest count */, done, gaveup,
  xe, xt /* xp earned/total */, se, st /* stars earned/total */,
  quests:[ { name, state /* 'done'|'gaveup'|'prog'|'new' */, xe, xt, se, st } ] }
```
`aq_archive` is an **array** of these, newest first (`unshift`, line 849). Loaded lazily — only `renderStats()` reads it.

### 2.6 localStorage keys (complete)
| Key | Written by | Holds |
|---|---|---|
| `aq_worlds` | `persistWorld()` (386) | The whole `WORLD` object (worlds, activeWorldId, quests store) |
| `aq_builder_draft` | `persist()` (397) | The current working `quest` (draft; survives reload; loaded on boot line 381) |
| `aq_progress` | `persistAQ()` (404) | `AQ` = `{xp, streak, lastDay}` |
| `aq_sel` | `selectQuest()` (657) | Selected quest id on the map (read in `defaultSel`, 618) |
| `aq_archive` | `saveArchive()` (781) | Array of archive snapshots (lazy slot; PLAN maps this to a separate `sidequest-archive` sync slot so it never bloats the main blob) |

All reads/writes are wrapped in try/catch (quota/corruption safe). Note the live game's sync design: main state = one ≤200 KB blob; archive = its own `?slot=` (worker already supports arbitrary slots — PLAN line 152).

---

## 3. Mechanics

### 3.1 XP / leveling curve + ranks (lines 400–420)
- **Curve**: `xpForLevel(L) = 50 + 25*(L-1)` = cost L→L+1 (50, 75, 100, …). `levelInfo(xp)` walks the curve → `{level, into, need}`. Cumulative: lv2=50, lv4=225, lv6=500, lv10≈1400.
- **Ranks** (`RANKS`, line 401; `rankFor(L)` picks highest threshold ≤ L): lv1 fresh start · 3 warming up · 5 in the zone · 8 locked in · 12 on a roll · 16 unstoppable · 20 legend · 26 ascended.
- **`awardXP(delta)`** (line 410): clamps xp ≥ 0, bumps streak only on positive delta, persists, re-renders HUD with a `hudpop` pulse (`.hud.levelup`) if level increased. Undoing a step calls `awardXP(-stepXP)`.
- **HUD** (`renderHUD`, 411–420): rank text, `lv N`, bar width = `into/need`, "`into` / `need`" label, `🔥 streak`. The **player-level bar is constant gold** (yellow→red gradient + sweeping `hudShine` sheen, lines 28–31) in every world — deliberately NOT themed; per-chapter/quest bars take the world accent.
- Migration note (PLAN 191, 197): live game must convert the exam campaign's completed items into lifetime XP on first load.

### 3.2 Daily streak (`bumpStreak`, line 409)
`dayStr()` local-date key. If `lastDay === today` → no-op; if `lastDay === yesterday` → streak+1; else reset to 1. Set only from completing a step (`awardXP` with delta>0). **Live game must also bump on pomodoro logging** (PLAN line 190 — "≥1 step or ≥1 pomo").

### 3.3 Per-step XP / difficulty (line 306, 390)
`XP = {easy:5, med:10, hard:20}`; `DIFFS=['easy','med','hard']`; `stepXP(s)=XP[s.diff]||0`. Default diff `'med'` (blankStep). Builder chip cycles through DIFFS. Coins mirror XP 1:1 (PLAN decision #11 — `coinsEarned()=xp` in live game; prototype only surfaces this in the preview footer text). PLAN #10 also specifies a **custom-number XP option behind the presets** — not built in prototype.

### 3.4 Stars (`questStars`, line 392)
`total = chapters.length + 3`; earned = 1 per chapter whose steps are all done (non-empty step list), +3 when the whole quest is `'done'`. Given-up quests keep earned chapter stars but never the +3 (state stays `'gaveup'` so the bonus branch never fires — until resumed and completed).

### 3.5 Give up / resume (lines 457, 870–873; PLAN 129–134)
- Give up: confirm dialog → `quest.state='gaveup'` → `persist()` + `syncQuestToWorld()`; quest keeps all earned xp/stars; map shows faded grey flag + `greybar`; counts as "resolved" in world aggregates (`worldAgg` counts done+gaveup, line 751).
- Resume: the same builder button (now "↩ resume quest", non-danger) flips `state='active'` — no confirm. Completing later still pays the +3 (completion is recomputed from steps).
- Preview shows a "🏳️ given up" note but steps remain tappable in the prototype.

### 3.6 Palette theming (lines 307–330; PLAN Layer 5)
- **`PALETTES`** (5 entries, each `{label, acc, c1, c2, bd}`):
  | key | label | acc (accent) | c1 (base-light) | c2 (base-dark) | bd (border/hi) |
  |---|---|---|---|---|---|
  | twilight | twilight | `#ffd96b` | `#3a3062` | `#2a2148` | `#7d68c0` |
  | sunset | sunset | `#ff9e5a` | `#4d2f3b` | `#3a2330` | `#c8703e` |
  | mint | mint | `#5fe0c8` | `#26473f` | `#1b342d` | `#4a9f8c` |
  | snow | snowy | `#7fbfff` | `#33436e` | `#243050` | `#6a82c0` |
  | sakura | sakura | `#ffb3d1` | `#45304a` | `#34203a` | `#b877a0` |
- **Two-token model**: each palette re-fills two *roles* — the **accent** takes over everything that was teal (`--comp` family), the **base** takes over the dusky-blue surfaces. Gold/currency tokens and the HUD/tabs chrome are never touched.
- **Helpers**: `_hex2rgb`, `shade(hex,pct)` (mix toward white for +pct, black for −pct), `rgba(hex,a)`.
- **`applyWorldTheme(w)`** (line 319) sets inline CSS vars **on `#app`** (so `:root` defaults stay as the untouched chrome fallback):
  - accent role: `--comp = acc`, `--compL = shade(acc,20)`, `--compD = shade(acc,-30)`, `--donetx = shade(acc,-70)`;
  - base role: `--base2 = c1`, `--base = shade(c2,-14)`, `--dot = shade(c1,-16)`, `--pathdot = shade(bd,-4)`, `--frame = c1`, `--card = shade(c1,12)`, `--bar = shade(c1,14)`, `--barhi = bd`, `--hi = bd`, `--lo = shade(c2,-22)`, `--env = bd`, `--chi = bd`, `--clo = shade(c2,-8)`, `--ban = rgba(bd,.42)`.
  - Called on **every** `show()` navigation.
- Hub/stats cards theme **individually** via inline `--c1/--c2/--bd/--acc` (not via applyWorldTheme) — palette preview per card.
- PLAN's "finalized visual details" (166–171: auto-contrast text, snowy amber currency, per-palette accent tweaks) are **beyond** what the prototype implements — the prototype uses one mechanical shade() formula; the live fold should honor the finalized details.

### 3.7 TickTick pick → auto-assembly (`pkAddToQuest` + `pkStepFrom`, lines 723–741)
- `pkStepFrom(t)`: title→text, **priority→difficulty** (pri≥5→hard, ≥3→med, else easy), `dueLabel(due)`→date tag, note→notes, done=false.
- Assembly walk over `TT_LISTS`:
  - parent selected **with** ≥1 selected sub → a **chapter** named after the parent, selected subs become its steps (note: the parent's own note/due are dropped in this case);
  - parent selected with **no** selected subs → loose step;
  - sub selected without its parent → loose step.
  - All loose steps collect into one trailing chapter named `'tasks'` (`'more tasks'` in add mode).
- Mode `'new'`: replaces `quest` with a fresh unnamed quest built from the chapters. Mode `'add'`: appends — unless the current quest is a single pristine blank chapter, which gets replaced outright (line 735).
- Selection semantics: checking a parent auto-checks all subs; unchecking a sub while parent stays checked gives the parent the `part` (–) checkbox; searching matches parent OR sub titles and force-expands matching parents; the week filter passes a parent if it or any sub is due soon.
- **No double-add guard** in prototype (PLAN parked "already-added shows greyed ✓").
- The prototype's pick screen replaces PLAN's original drag-pile assembly board — assembly is automatic on "add N to quest", then the builder is the free editor.

### 3.8 Plot-box map markers (renderMap, §1.1)
Framed `.mbox` per quest containing label + hill base; hill crest + flag protrude above its top edge (comment line 636). Flag semantics: **done → gold dumpling flag**, **prog → small pomo/tomato flag**, **gaveup → faded grey tattered flag**, **new → no flag**. Bar style per state (gold/grey/teal-accent stripes). Selected box gets accent border + glow; the ambient `.mglow` and gang park there.

### 3.9 Sticky banners / `--toph` (lines 885–887)
`setTopH()` measures `#top.offsetHeight` (safe-area aware) into `--toph` on `#app`; re-measured on resize. `.wmhd` (map world banner), `.qhd` (preview quest banner), and `.pkhd` (pick/stats headers) are `position:sticky; top:var(--toph,52px)` so they park just under the HUD. PLAN 179 requires the same in the live game.

### 3.10 Progress persistence — `syncQuestToWorld()` (line 429)
Whenever play-progress or state changes on a quest that already exists in `WORLD.quests` (matched by id), deep-copy the working `quest` back into the store and `persistWorld()`. Called from: preview step toggle (556), give-up (872), resume (871). This is what makes checked steps and gave-up state survive leaving/re-opening and drive the map bars/flags. `saveQuest()` (421) is the explicit save: stamps `createdAt`, copies into `WORLD.quests`, appends id to the active world's `questIds` if new. **Must-hold for the live fold** (PLAN 180).

### 3.11 Synth SFX (lines 606–615, 879–883)
WebAudio placeholder layer — comment says real mp3s (`sfx-*.mp3` in repo root) get wired at fold time. `tone(freq,start,dur,vol,type)` = one enveloped oscillator; `sfx(name)`:
- `done` — square 660→990 Hz double blip (step completed; the only "satisfying" sound kept distinct)
- `sel` — soft triangle 500 Hz blip (generic UI click)
- `save` — rising 523/784/1046 arpeggio (unused directly in current code — available for save)
- `give` — sawtooth 300→180 descend (give up; defined but not currently invoked)
- `add` — triangle 440→660 (defined, not currently invoked)
A capture-phase document click handler (line 880) plays `sel` for any hit on the big selector list of interactive classes, **except** `.play` / `.pv-row` (so completion keeps its own sound). Lazily creates/resumes the shared `AudioContext`.

### 3.12 Pixel-canvas sprite generation (lines 582–604)
All map art is generated at runtime into data-URLs (no image files): `drawSlime()` (dumpling, 26×18), `drawTomato()` (26×22), `drawBuddy()` (gacha buddy stand-in, 26×18), `hillURL(48,22)` (sine-profile grass hill, scaled up to 150×68 with `image-rendering:pixelated`), `flagURL('done'|'prog'|'gaveup')` (26×32 flags: gold dumpling / cream pomo / grey tattered). Cached as consts `SL, TM, BD, HURL, FLAG{}`. In the live game these are likely replaced by its real sprites — but the *state→flag* mapping must carry over.

---

## 4. Key Functions by Concern

### Constants / utils
- `XP`, `DIFFS` (306) — difficulty→xp table.
- `PALETTES`, `PAL_KEYS` (307–314) — 5 world palettes.
- `EMOJIS` (331) — world icon choices (✦ default first).
- `CW_PLAY`, `CW_STAR` (332) — SVG path data for play/star glyphs.
- `nid(p)` (333) — unique id generator.
- `esc(x)` (394) — HTML-escape (& < > ").
- `MON`, `dueLabel(iso)`, `dueSoon(iso)` (336–338) — date label + week-window check.
- `dayStr(d)` (408) — local YYYY-MM-DD.

### Data model / factories
- `blankStep() / blankChapter() / blankQuest()` (378–380) — canonical shapes.
- `stepXP(s)` (390); `questState(q)` (391); `questStars(q)` (392); `questTotals(q)` (393 — `{xpEarned,xpTotal,stepsDone,steps}`).
- `worldAgg(w)` (750) — world aggregate `{n,resolved,xe,xt,se,st,pct,allDone}`.

### Persistence / load
- `loadWorld() / persistWorld() / activeWorld() / worldQuests()` (384–388) — `aq_worlds`.
- `persist() / load()` (397–398) — `aq_builder_draft`.
- `loadAQ() / persistAQ()` (402–404) — `aq_progress`.
- `defaultSel()` (618) + `selectQuest` write — `aq_sel`.
- `loadArchive() / saveArchive() / archiveSnapshot()` (780–791) — `aq_archive`.
- `saveQuest()` (421) — draft → world store (+questIds).
- `syncQuestToWorld()` (429) — play-progress writeback.

### Level math / HUD
- `xpForLevel(L)` (405); `levelInfo(xp)` (406); `RANKS` + `rankFor(L)` (401, 407).
- `bumpStreak()` (409); `awardXP(delta)` (410); `renderHUD(levelUp)` (411).

### Theming
- `_hex2rgb / shade / rgba` (316–318); `applyWorldTheme(w)` (319–330).

### Render (per view)
- `renderBuilder()` (435) — chapters/steps editor; `renderStep()` (459) — one step card; `playSVG(done)` (433); `autoGrow(t)` (434); `onEdit()` (481).
- `renderPreview()` (527) — playable questline; `openDetail(s,ci)` (563) — detail modal.
- `renderMap()` (619) — road, boxes, hills, flags, labels, gang, add-spot; `selectQuest(id)` (657); `openQuest(id)` (663); `newQuest()` (664).
- `renderHub()` (753); `switchWorld(id)` (777).
- `renderStats()` (794); `stStateIcon(s)` (793); `stDrillId` state.
- `renderPick()` (697); `pkCell(p,isSub)` (676).

### Pick logic
- `pkFind(id)` (668) — locate task/sub in `TT_LISTS`.
- `pkTaskVisible(p)` (669) — search + week filter.
- `pkToggleParent / pkToggleSub` (674–675) — selection with parent↔sub cascade.
- `openPick(mode)` (717) — reset state, enter screen.
- `pkStepFrom(t)` (723) — TickTick task → step (pri→diff mapping).
- `pkAddToQuest()` (724) — auto-assembly into chapters + apply per mode.

### Drag / builder interaction
- `beginDrag / dragMove / dragEnd` (485–523) — pointer drag for steps + chapters with `.ph` placeholder.

### Modals / dialogs
- `askConfirm(title,msg,cb)` (576); detail modal wiring (570–572); world editor `openWorldEdit / saveWorldEdit / archiveWorld` (829–857) + wiring (858–861).

### SFX / sprites
- `tone / sfx` (608–615); global click-blip handler (880–883).
- `pxc / drawSlime / drawTomato / drawBuddy / hillURL / flagURL` (582–602); `SL/TM/BD/HURL/FLAG` (603–604).

### Shell
- `show(name)` + `V`/`T` maps (874–877) — router (re-themes + re-renders on every switch).
- `setTopH()` (886) — `--toph` measurement.
- Boot (888–889): `renderHUD(); show('map');`. Builder buttons wiring 864–873.

---

## 5. CSS Conventions

### 5.1 CSS-variable theming system (`:root`, lines 7–13)
Two-layer: `:root` holds the **default twilight chrome**; `applyWorldTheme` overrides the world-scoped subset **inline on `#app`**. Header `#top` uses hardcoded gradient colors (line 19) so it never re-tints.

**Base/surface role (themed per world):**
- `--base` / `--base2` — page background gradient (dark / light stop); also sticky-banner gradients.
- `--dot` — the 4px dot-grid texture color.
- `--frame` — modal card / stat-card surface.
- `--card` — step/task/row card surface; `--cardtx` its text (not themed).
- `--bar` / `--barhi` / `--bartx` — filled button surface / highlight / text.
- `--hi` / `--lo` — the global bevel light/dark border pair.
- `--chi` / `--clo` — the card-level bevel pair.
- `--ban` — translucent banner gradient tint (rgba of palette `bd`).
- `--pathdot` — map road dots. `--env` — spare accentish token (set by theme, unused by current CSS rules).

**Accent role (themed — "everything that was teal"):**
- `--comp` — the world accent (done rows, selection borders/glows, date text, pick-screen checks/toggles, progress stripes).
- `--compL` / `--compD` — light/dark accent stripe pair for progress bars.
- `--donetx` — very dark accent for text on done (accent-filled) rows.

**Constant, never themed (currency + chrome):**
- `--gold` `#ffd96b` — titles, focus borders, banner left-bars; gold literals `#ffcf6e`/`#ffd98a`/`#ffe27a` for xp numbers, banner labels, done stars.
- `--outline` `#140f24` — outer 2px box-shadow ring; `--inset` `#0f0a22` — sunken input/track background.
- `--tx` — body text; `--ctext` — card body text.
- `--pixfont` / `--pixfont2` — font tokens.
- The HUD gold bar gradient and `#top`/`#tabs` colors.
- `--toph` — measured header height for sticky offsets (mechanics §3.9).
- Per-card inline vars on hub/stat cards: `--c1 --c2 --bd --acc` (fed straight from `PALETTES`, with fallbacks in CSS).

### 5.2 Pixel-art fonts & rendering
- Google Fonts import (line 6): **Silkscreen** (`--pixfont`) for headings/labels/buttons — tiny sizes (7–14px), uppercase/lowercase transforms, letter-spacing; **VT323** (`--pixfont2`) for body/values — larger (12–19px). Fallback `'Courier New', monospace`.
- `image-rendering:pixelated` on `#app`, sprites, hub cards, plot boxes; `-webkit-font-smoothing:antialiased`; canvas sprites drawn with `imageSmoothingEnabled=false`.
- Mobile shell: `max-width:460px` centered column, `env(safe-area-inset-top/bottom)` padding, `viewport-fit=cover`, `-webkit-tap-highlight-color:transparent`.

### 5.3 Bevel / border patterns
- **Raised bevel**: `border:2px solid; border-color: LIGHT DARK DARK LIGHT` (top/right/bottom/left) — e.g. buttons `var(--hi) var(--lo) var(--lo) var(--hi)`, cards `var(--chi) var(--clo) var(--clo) var(--chi)`. **Pressed** state flips the pair (`.bigbtn:active`, `.mini:active`).
- **Sunken/inset**: inverted pair `var(--lo) var(--hi) var(--hi) var(--lo)` on `--inset` background — inputs, progress tracks, checkboxes; focus swaps border to `--gold`.
- **Chunky frame**: 3px bevel + `box-shadow: 0 Npx 0 <dark>` hard drop + `0 0 0 2px var(--outline)` ring (mcard, mbox, hubcard, stsum, stcard).
- **Striped fills**: `repeating-linear-gradient(45deg, compL 0 6px, compD 6px 12px)` for accent progress bars; grey variant for gave-up; dashed borders + 45° stripes for add-affordances (`.addbtn`, `.madd .an`, `.hubadd`).
- **Gold bar**: `linear-gradient(90deg,#ffd96b,#ff9e5a 55%,#ff7aa8)` (+`hudShine` sweep on the HUD) — also `.fill.goldbar` for finished quests.
- Danger styling: fixed rose set `#5a2f3a`/`#ff9eb4`/`#a85f6e #301820` (diffchip.hard, .bigbtn.danger).
- Difficulty chips: green/purple/rose fixed mini-palettes (lines 71–73), not world-themed.
- `color-mix(in srgb, …)` used for translucent accent glows/borders (mbox, mglow, pktask.sel) — needs a modern-browser baseline.

---

## 6. Dependency-Ordered Migration List (bottom-up)

**Tier 0 — pure foundations (no DOM, no deps):**
1. Constants + utils: `XP`/`DIFFS`, `nid`, `esc`, `dayStr`, `MON`/`dueLabel`/`dueSoon`, `EMOJIS`, `CW_PLAY`/`CW_STAR`.
2. Data shapes + derivations: `blankStep/Chapter/Quest`, `stepXP`, `questState`, `questStars`, `questTotals`, `worldAgg`.
3. `PALETTES` table + color math (`_hex2rgb`, `shade`, `rgba`).
4. Level math: `xpForLevel`, `levelInfo`, `RANKS`, `rankFor`.

**Tier 1 — persistence layer (depends on Tier 0):**
5. `WORLD` store: `loadWorld`/`persistWorld`/`activeWorld`/`worldQuests` (`aq_worlds`), incl. default-world seeding.
6. `AQ` store: `loadAQ`/`persistAQ` (`aq_progress`).
7. Draft store: `persist`/`load` (`aq_builder_draft`); selection (`aq_sel`).
8. Archive store: `loadArchive`/`saveArchive`/`archiveSnapshot` (`aq_archive`) — in the live game this becomes the separate `sidequest-archive` sync slot.
9. Write paths: `saveQuest`, **`syncQuestToWorld`** (the must-hold persistence contract), `archiveWorld`'s discard step.
10. **Save migration** (live-game only, PLAN 181/191): detect the existing exam-3 save → convert into worlds/quests + fold its completed items into lifetime XP. Do this before shipping anything that writes the new keys.

**Tier 2 — cross-cutting mechanics (depend on Tiers 0–1):**
11. XP awarding + streak: `awardXP`, `bumpStreak` (+ live-game hook: pomodoro also bumps streak) + HUD render (`renderHUD`, gold bar, level-up pulse).
12. Theming runtime: `applyWorldTheme` + the CSS-variable contract (which vars are world-scoped vs. constant chrome; apply on every view switch). Honor PLAN's finalized visual details (auto-contrast, snowy amber) that the prototype approximates.
13. Give-up/resume state machine (state flag + button toggle + confirm copy + map bar/flag mapping).
14. `--toph` sticky-banner mechanism (`setTopH` + sticky headers).
15. SFX: wire the real mp3s to the prototype's event map (`done` on step complete distinct from the generic `sel` click-blip; `save`/`give`/`add` available).

**Tier 3 — screens (depend on everything above):**
16. **Builder** (`renderBuilder`/`renderStep`/`onEdit` + pointer drag-reorder) — it's also the quest editor, so preview/map "edit" flows need it.
17. **Preview / questline play** (`renderPreview` + detail modal + tap-to-complete → awardXP + syncQuestToWorld) — in the live game this is the existing polished questline view gaining the new data source; keep the exam-3 look.
18. **Map** (`renderMap`/`selectQuest`/`openQuest` + sprites/flags/gang/add-spot) — needs quests+states+theme; live game supplies its own art but keeps the state→flag/bar semantics and plot-box + label layout.
19. **Worlds hub** (`renderHub`/`switchWorld` + world editor modal `openWorldEdit`/`saveWorldEdit`/`archiveWorld` + emoji/palette pickers) — plus PLAN extras not in prototype: gang-on-active-card, per-card flag tally.
20. **TickTick pick** (`openPick`/`renderPick`/`pkCell`/filters/selection + `pkStepFrom`/`pkAddToQuest`) — swap `TT_LISTS` for the worker `/ticktick` fetch; **worker needs subtasks added to its feed first**; add the parked "already-added greyed ✓" and not-connected nudge.
21. **View stats** (`renderStats` + drill) — last; depends on archive store, level math, worldAgg, palette cards.

**Tier 4 — designed but NOT in the prototype (build during/after fold):**
- Move-quest-between-worlds (PLAN 143), 20-quest cap enforcement, custom XP number option (PLAN #10), victory moment (fanfare/burst/"QUEST COMPLETE" banner, PLAN 130), completed-quest read-only lock (PLAN 131 — prototype still allows toggling), coins economy surfacing (coins=xp), pomo→streak hook, real timestamps for `createdAt`, hub flag-tally/gang, TickTick worker subtask endpoint.

### Prototype quirks worth knowing before porting
- `quest.createdAt` is the literal string `'now'` (line 422), never a date.
- Completed and given-up quests are still fully editable/toggleable in preview/builder (no read-only enforcement).
- In `pkAddToQuest`, a parent selected together with subs contributes only its **title** (its note/due/priority are dropped when it becomes a chapter).
- `dragEnd` line 518 has a dead destructure (`drag.ref==null?{}` — `ci` immediately recomputed from `dataset`); harmless but don't cargo-cult it.
- `sfx('give')`, `sfx('save')`, `sfx('add')` are defined but never called; only `done` and `sel` fire today.
- `--env` is set by the theme but not referenced by any CSS rule.
- The archive keeps `'prog'`/`'new'` quest states in snapshots (rendered as 🍅) — archiving is allowed on unfinished worlds.
