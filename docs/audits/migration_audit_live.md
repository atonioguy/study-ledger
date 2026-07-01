# Migration Audit — `quest.html` (LIVE game) → worlds/maps/quests + global leveling

Read-only architecture audit of `/home/user/study-ledger/quest.html` (1,146 lines, ~193KB; line 533 alone is 77,482 chars of embedded base64 audio), `/home/user/study-ledger/aquamarine.html` (1,649 lines), and `/home/user/study-ledger/PLAN.md`. Also inspected `/home/user/study-ledger/quest-next.html` (prototype storage keys) and `/home/user/study-ledger/worker/worker.js` (save endpoint) where they bear on migration.

---

## 1. Overall file structure of `quest.html`

Single self-contained HTML file. No external JS; two Google Fonts (Silkscreen, VT323) and same-origin mp3s are the only network assets.

| Region | Lines | Content |
|---|---|---|
| Head / PWA meta | 1–12 | viewport, `theme-color #241d3c`, apple-web-app meta, `icon.png` |
| **One `<style>` block** | 13–379 | all CSS, organized by `/* ===== section ===== */` markers |
| Body / DOM | 381–474 | `#app` → `#hud` (383–394), `#screens` (396–437: 4 `<section class="screen">`), `#nav` (439–444), modals (446–471), `#cwFx` (472), `#cwBanner` (473) |
| **One `<script>` block** | 475–1144 | everything below |

CSS section markers (all in the one style block): part nodes 91 · review quests 104 · **app shell 124** · **HUD 128** · screens 147 · **map/questline 152** · stub screens 174 · bottom nav 183 · cloud-sync panel 190 · buddies/collection 202 · gacha pull 233 · TCG card 242 · slot machine 266 · cosmetics 276 · mascot sheet 290 · squish idle (v1.6) 304 · talking mascots (v1.8) 323 · **embed mode 333** · pixel currency icons 336 · **segmented questline trail 340** · pomo room 353.

Script layout:

- **475–503** — shared `esc()` helper + canvas mascot art (`drawSlime`, `drawTomato`).
- **504–591** — the exam-campaign block, commented `// ---- exam-campaign game logic + data + effects (verbatim from dashboard) ----` (line 504). Contains `CAMP_MODS` (507), `CAMP_REVIEW` (520), `CAMP_ITEMS` (524), `RANKS`/`rankFor` (527–528), `campDone` load (529), `CW_SFX` base sounds embedded as base64 (533), `campUpdate` (540), effects (`cwCheer`/`cwBanner`/`cwBurst`/`cwXpFloat`/`cwBigCelebrate` 549–557), `cwToggle` (562), `buildCampaign` (577).
- **Line 593** — the injection marker: `// ===== Side Quest shell: economy, HUD, nav, questline, cloud sync, gacha =====`. Everything after is one **async IIFE** (594–1142) that layers the "game shell" over the verbatim campaign code — including **monkey-patching** `cwToggle` (1072–1081) and reassigning `cwSfx` (612).
- **595** — `const SQ_VER='v2.8';` with comment "bump on every push so a new build is verifiable". Rendered into the sync-modal footer at 1132: `sqVer` shows `side quest v2.8`.
- **1130–1141** — boot: embed detection (`?embed` → `.embed` on html/body, 1131), `await pullCloud()` (1133), `loadCos/applyCos`, `initBuddies/initShop/initPomo/initMascotSheet`, `rebuild()`, `resize → scheduleTrail`, push-if-not-adopted.

### Versioning ↔ aquamarine iframe
`aquamarine.html:724`:
```html
<div class="cwin cw-win cw-embed"><iframe class="cw-frame" src="quest.html?embed=1&v=28" title="Side Quest"></iframe></div>
```
`v=28` is a **manual cache-buster mirroring SQ_VER v2.8**. The two are not wired together — bumping `SQ_VER` in quest.html requires manually bumping `v=` in aquamarine.html or the dashboard can keep serving a cached old build. `embed=1` triggers the embed CSS (quest.html 333–335): transparent background, `#app` loses max-width/border/shadow and fills the iframe (which is 484px wide, `height:min(840px,82vh)` per aquamarine 568–569).

---

## 2. Save / state

### 2a. Every localStorage key

**Written/read by quest.html (the game save):**

| Key | Shape | Where |
|---|---|---|
| `aq_campaign` | `{ "<itemId>": true, ... }` flat done-map | read 529, write `saveCampaign()` 530 |
| `exam-campaign-m5m6` | legacy fallback, **read-only** (529; never written) | 529 |
| `aq_econ` | `{c:<coinsSpent>, s:<starsSpent>}` — spent counters, negative = grants | 626, 629 |
| `aq_buddies` | `{owned:{id:1}, active:<id|null>, pity:<n>}` | 725–726 |
| `aq_cos` | `{owned:{none:1,...}, eq:<id>}` | 889–890 |
| `aq_slot` | `{d:'YYYY-MM-DD', n:<spinsToday>}` — **not cloud-synced** | 926, 949 |
| `aq_pomo` | `{room:<n>, total:<n>}` | 973–974 |
| `aq_api_url` / `aq_api_key` | worker URL + AQ key | 1047, 1112–1113 |
| `aq_save_t` | last-changed timestamp (ms) for sync conflict resolution | 1049, 1065, 1069 |

**Written by aquamarine.html (same origin → same localStorage!):** `aq_box`, `aq_dgroup`, `aq_feed`, `aq_notes`, `aq_view`, `aq_clean_scroll`, `aq_clean_skin`, `aq_cl_dark`, `aq_notion`, `aq_mon_source`, `aq_notion_view`, and **`aq_api_url`/`aq_api_key` (shared with the game — this is the "no new login" for the TickTick pick screen, PLAN line 87)**, plus a *dead duplicate* of `aq_campaign` read/write (aquamarine 1209–1210; its `buildCampaign()` no-ops because aquamarine no longer has a `#cwList` element — the inline campaign was replaced by the iframe).

**Prototype keys the fold will introduce (quest-next.html):** `aq_worlds` (`{worlds:[...], activeWorldId, quests:{}}`, line 384), `aq_progress` (`{xp, streak, lastDay}`, line 402), `aq_archive` (array, line 780; plan says its own `sidequest-archive` cloud slot).

### 2b. Exam-3 campaign data structure (quest.html 505–527)

```js
const CAMP_MODS=[                              // 2 modules
  {mod:'m5',label:'module 5',time:'1h 46m',lessons:[
    {l:'lesson 1',day:'mon',date:'6/29',time:'39:36',
     parts:[{id:'m5l1p1',t:'14:32',xp:15},{id:'m5l1p2',t:'9:07',xp:9},{id:'m5l1p3',t:'15:57',xp:16}]},
    ... 3 lessons total ]},
  {mod:'m6', ... 4 lessons ]},
];
const CAMP_REVIEW=[ {id:'sat',...,xp:40}, {id:'sun',...,xp:20} ];   // 2 review quests
const CAMP_ITEMS = flatten → [{id,xp,mod}]     // 19 parts + 2 review = 21 items… (m5:10 parts, m6:9 parts)
const XP_TOTAL = Σxp = 248                     // (HUD HTML shows a "0 / 250 xp" placeholder; real number computed)
const RANKS=[[0,'fresh start'],[40,'warming up'],[90,'in the zone'],
             [140,'locked in'],[190,'almost there'],[240,'exam ready ✦']];  // 6 ranks, lv = index+1
```
XP ≈ minutes of lecture (1 xp/min). Progress is **only** the flat `campDone` id→bool map; lesson/module completion is always derived (`les.parts.every(p=>campDone[p.id])`). `campStats()` (531) returns `{m5,m6,xp,done,lv}`.

### 2c. Cloud sync (quest.html 1046–1069; worker/worker.js 52–66)

- `API = {url: aq_api_url, key: aq_api_key}` (1047); `syncOn()` iff both set.
- **Snapshot (1051):** `{ v:2, t:stamp(), campDone, econ, buddies, cos, pomo }` → POST `API.url + '/save?slot=sidequest'` with header `x-aq-key` (1054). Note `aq_slot` (daily spins) is intentionally per-device.
- `pushCloud()` debounced 900ms; `markChanged()` (1069) = set `aq_save_t` = now + push. Every state mutation calls `markChanged()`.
- `pullCloud()` (1056) adopts the remote blob only if `d.campDone` exists **and** `d.t > local stamp` — last-writer-wins by timestamp; on adopt it overwrites all five keys and the stamp.
- Boot order matters: `await pullCloud()` happens **before** `rebuild()` (1133 → 1139). The ⚙ panel's save handler (1107–1125) re-pulls, reloads all subsystems, and pushes if nothing was adopted.
- **The ≤200KB blob concern is real and enforced server-side:** `worker.js:63` — `if (body.length > 200000) return json({error:'save too large'}, 413)`. One JSON blob per slot in KV; the worker accepts **any** `?slot=` name (sliced to 64 chars), so the planned lazy `sidequest-archive` slot needs zero worker changes (PLAN line 152).

---

## 3. The existing HUD (quest.html 383–394 DOM, 128–145 CSS, 540–548 logic)

DOM ids:
```html
#hud
  .hud-buds  → #cwSlime (+#slimeHat), #cwTom (+#tomHat), #cwBud   (tap → mascot sheet)
  .hud-mid   → #cwLv "lv 1" · #cwRank "fresh start" · #cwStreak "🔥 0/7"
               .hud-xptrack > #cwXpFill (gold gradient bar, .cw-xpfill: #ffd96b→#ff9e5a→#ff7aa8 + sheen)
               #cwXpTotal "0 / 250 xp"
  .hud-cur   → #sqCoins / #sqStars chips
```

Current computation — **everything is scoped to the one exam campaign**, via `campUpdate(prevXp)` (540–548):
- `cwSetW('cwXpFill', s.xp / XP_TOTAL)` — the bar is % of the **quest's** 248 xp, not per-level.
- `rankFor(s.xp)` → `#cwLv` = `lv 1..6`, `#cwRank` = fixed 6-name ladder maxing at 240 xp.
- `#cwStreak` = `'🔥 ' + s.done + '/' + CAMP_ITEMS.length` — **not a streak at all**; it's tasks-done/21 mislabeled with a 🔥 (PLAN 184/190 calls this out; the HTML placeholder even says `0/7`).
- `cwCountUp` (539) animates the number and **hardcodes `' / ' + XP_TOTAL + ' xp'`** — must change for `lv N · into/next` display.
- Also consuming `rankFor`/`campStats`: the level-up banner in `cwToggle` (572), the completion banner (573), and the mascot sheet stats (830–833).

Per PLAN (183–197), migration target: `#cwXpFill` = per-level progress on curve `50 + 25·(L−1)`, level from lifetime `aq_progress.xp`, extended rank ladder, `#cwStreak` = real consecutive-day streak (step **or** pomo counts). The gold bar styling must stay (PLAN 197: "player-level bar = constant gold").

---

## 4. Currency + systems already built

### Economy (621–632) — **derived-earned, stored-spent**
```js
coinsEarned() = campStats().xp                      // 624 — coins ≡ campaign xp
starsEarned() = lessonsCleared() + modulesCleared()*3   // 625 — 1/lesson + 3/module
coinBal() = max(0, coinsEarned() - econ.c)          // 627
starBal() = max(0, starsEarned() - econ.s)          // 628
adjustBalance(dc,ds){ e.c-=dc; e.s-=ds; }           // 629 — positive arg = grant, negative = charge
```
Call sites: hatch `adjustBalance(0,-3)` (802), dup refund `adjustBalance(12,0)` (808), slot spin `-8` coins (948) / payouts (959), outfit buy `adjustBalance(-price,0)` (920), pomo sale `adjustBalance(room*5,0)` (1043), dev grant (1127). `refreshEcon()` (632) animates the chips.
**This derived model is the single biggest migration coupling** — see §7.

### Buddies / gacha (664–816)
- `BUDDIES` (709–722): 12 entries `{id,name,rar,color,top,title,desc}` — 4 common, 3 rare, 3 epic (frost/ember/shade), 2 legendary (astra/nova). `RARC` rarity colors (708). All art canvas-drawn (`drawBuddy` 667 small icon, `drawBuddyPortrait` 685 TCG art).
- `HATCH_COST=3` stars, `PITY=10` (723). `rollRarity()` (728): legendary 3%, epic 9%, rare 28%, common 60%; at pity 9 → 78% epic / 22% legendary.
- Flow: `hatch()` (799) → `playPull()` charge/burst sequence (774) → `openCard()` TCG modal (753) → duplicates pay +12 coins. `renderDex()` 3-col grid; active buddy joins the HUD (`renderActiveBuddy` 730) — PLAN wants this same equipped buddy walking the world map.

### Cosmetics (849–921)
`COSMETICS` (881): none / scholar cap 60 / party hat 50 / bloom 80 / royal crown 140 coins. Hats are canvas overlays (`drawHat` 851, `hatIconURL` 880) layered on `#slimeHat`/`#tomHat`/map avatar via `applyCos()` (891). Shop preview + grid in `renderShopOutfits()` (898), buy/equip in `cosAction()` (916).

### Slot machine (923–967)
`SLOT_SYMS` weighted reel (924), `SLOT_COST=8` coins, `SLOT_CAP=40` spins/day tracked in `aq_slot` (926). Payout table `slotPay()` (929): 7️⃣7️⃣7️⃣ 50c+5★ … two-⭐ pays 1★.

### Pomo room (969–1044)
`POMO_PRICE=5` coins each; `pomoState={room,total}` in `aq_pomo`. Roaming physics entities (`makeEnt` 976, `pomoTick` RAF loop 986) on a canvas-sprite-decorated floor (`FLOOR_FRAC=0.45`); RAF started/stopped by nav (`pomoStart`/`pomoStop`, wired at 1096). `dropPomo` (1040) logs one (+startle-hop for the others), `sellPomos` (1043) behind the `#pomoConfirm` modal. PLAN 190: logging a pomo must also bump the new daily streak — `dropPomo` already calls `markChanged()`, an easy hook.

### Audio layer `cwSfx` (533–535 base; 600–619 shell)
- Base `CW_SFX` = 4 embedded base64 mp3s: **check, xp, levelup, reset** (line 533, the 77KB line).
- Shell adds URL-loaded: **buildup, fanfare, legend, dice, squish** (601, same-origin mp3 files present in the repo).
- **Web Audio upgrade (603–619):** `unlockAudio()` on first pointerdown/touchstart/mousedown creates an `AudioContext` and `fetch()`-decodes every `CW_SFX[k].src` into buffers `_buf`; per-sound gains `_vol` (levelup .18, buildup 2.2, …).
- `cwSfx` is **reassigned** (612): name `'blip'` → synthesized triangle oscillator @500Hz (nav/UI tick, no file); otherwise buffer playback with gain; **HTMLAudio fallback** if no context/buffer (615). Returns a handle; `stopSound()` (618) fades it (used to cut `buildup` at reveal, 794).
- Full sound-name inventory: `check, xp, levelup, reset, buildup, fanfare, legend, dice, squish, blip`.

---

## 5. Integration points for each new system (THE KEY DELIVERABLE)

### The shell's extension patterns (what everything hooks into)
- **Screen pattern:** `<section class="screen" data-screen="X" id="screen-X">` inside `#screens`; nav buttons `data-go="X"`; the single nav handler (1090–1098) toggles `.on` and runs per-screen enter hooks (`shop` → re-render, `map` → `scheduleTrail()`, `pomo` → `pomoStart()`/else `pomoStop()`), then `cwSfx('blip')`.
- **Map render entry points:** `rebuild()` (1083–1087) = `buildCampaign()` + reset-button wrap + `refreshEcon()` + `placeAvatar()` + `scheduleTrail()`. `buildTrail()` (646) only measures when visible (`offsetParent` check 647) — any questline shown in a new screen needs the same rebuild-on-show discipline.
- **State mutation pattern:** mutate → `save*()` → `refreshEcon()` → `markChanged()`.
- **Modal pattern:** `.sq-modal`/`.sq-card` (446+), click-outside-to-close, `.sq-mbtn` buttons.
- **Fidelity constraint (PLAN 176–181):** port features **into** this UI; don't replace it with the prototype's rougher version. `quest-next.html` is a data-model/interaction proof only.

### 5a. World map (winding road of quest spots)
- **Where:** becomes the new content of `#screen-map` — a view *stack* inside the map tab: `worlds hub ↔ world map ↔ quest`. The bottom nav (map/pomo/buddies/shop) is explicitly "never themed, always default chrome" (PLAN 163) and should keep its 4 buttons; zooming happens inside the map screen, not via new nav tabs.
- **Reuse:** the vertical segmented trail (`.cw-seg`, CSS 340–352 + `buildTrail` 646–660) is exactly the "vertical-snake road" primitive; `placeAvatar()` (635) already parks the gang sprite (+hat, +equipped buddy per PLAN 121) on the "current" node; the finished-quest bar reuses the HUD gold `.cw-xpfill` gradient (PLAN 123).
- **Change vs add:** ADD a `renderWorldMap()` + a map-view state variable; ADD spot cards (progress bar, `earned/total xp`, `earned/total ⭐`, flag glyphs 🚩/🍅/🏳️); CHANGE the map-tab enter hook (1095) to render whichever view of the stack is active; the header strip `.sq-questhd` (398) becomes the tappable `🌍 <world> ▾` strip (sticky under `#hud` — the `.screen` scrolls, so `position:sticky; top:0` inside it works).
- **State:** new `aq_worlds` (worlds + quests + questIds), plus per-quest state (`active/gaveup/done`). The exam campaign is quest #1 of the default world.

### 5b. Worlds hub
- **Where:** another view in the same map-screen stack, entered from the world strip; grid of portal cards (emoji, name, palette, xp-% bar, `done+gaveup/total` count, flag tally, ✦ done marker; gang stands on the active world).
- **Reuse:** card chrome = existing bevel-border card patterns (`.cw-barcard`/`.sq-hatch` style); hold/right-click context menu = same pattern planned for steps (PLAN 141).
- **Change vs add:** all ADD. Palette theming (PLAN 157–171) rides the existing CSS-variable system — `:root` tokens at line 15–17 (`--hi --lo --frame --bar --barhi --body --spot --card --gold --teal`…); a world swaps base+accent tokens on the screen container while `#hud`/`#nav` keep default chrome and gold/xp/coin tokens stay constant. The exam quest keeps default twilight.
- **State:** `aq_worlds`; `＋ new world` writes a world; archive moves a summary into the lazy archive slot.

### 5c. Quest builder (assembly board)
- **Where:** a new full screen (`#screen-build` style section) *or* map-stack view, entered from the map's ⊕ add-a-quest spot and from ⚙ edit quest; not on the nav bar.
- **Reuse:** `.sq-card` inputs (CSS 196–197) for typeable slots; `.sq-bigbtn` for actions; `esc()` for user text; drag pattern precedent exists in the pomo room's pointer-capture code (980–984) and aquamarine's note-pin drag.
- **Change vs add:** all ADD (build/edit modes, banners, step difficulty 🟢5/🟡10/🔴20, due-date tags, give-up/resume toggle per PLAN 76–82, 129–134). Must write back into `aq_worlds` on every check/give-up (the live equivalent of the prototype's `syncQuestToWorld()`, PLAN 180).
- **Rendering a built quest:** the *imported*-quest look is the banner + trail + step-row style (PLAN 63–74), reusing `CW_PLAY`/`CW_STAR` icons (559), `.cw-mod` banner styling (161), the trail, gold `+xp`. The **P1/14:32 diamond node grid stays exclusive to the hardcoded exam campaign** (PLAN 64). So: keep `buildCampaign()` as the renderer for quest #1; ADD a `buildQuest(quest)` renderer for user quests; generalize `cwToggle` (or add a sibling) so completion → xp/coins/stars/banners flow through the same effects (`cwBurst/cwXpFloat/cwBanner/cwBigCelebrate`, `coinFloat`) and the same wrap (refreshEcon/placeAvatar/scheduleTrail/markChanged, 1072–1081).

### 5d. TickTick pick screen
- **Where:** entered from ⊕ new quest (fresh) and from builder "↯ import from ticktick" (append) — PLAN 102–106. Fits as a full-screen view in the same stack (it's list-heavy), or a `.sq-modal` if kept compact.
- **Reuse:** **credentials already exist** — `aq_api_url`/`aq_api_key` are the same keys the ⚙ sync panel manages (1047) and the same keys aquamarine's connect-data panel writes (aquamarine 1393, 1423). Fetch pattern = aquamarine's `loadTickTick()` (1395): `GET API.url+'/ticktick'` with `x-aq-key`. Not-connected state should nudge to the existing ⚙ panel (openSync, 1102).
- **Blocker (worker):** `/ticktick` (worker.js 20–21, 105+) returns tasks **without subtasks**; PLAN 100 requires adding checklist/subtask data before parent→chapter auto-fill works. The prototype currently ships a baked snapshot instead.
- **Change vs add:** all ADD in quest.html; one endpoint change in worker.js.

### 5e. View stats
- **Where:** entry at the bottom of the worlds hub (PLAN 145–155): lifetime summary (rank · level, lifetime XP, 🔥 streak, total ⭐) + archived-world trophy list with drill-down.
- **Reuse:** stat-row markup exists (`statRow`, 824; `.ms-stat` CSS 297–299); rank/level come from the new global leveling.
- **State:** local `aq_archive` + its **own lazy cloud slot** (e.g. `/save?slot=sidequest-archive`) loaded only when the screen opens — never part of `snapshot()`, keeping the main sync blob small. Worker already supports arbitrary slots (worker.js 55, 61).
- **Change vs add:** all ADD, plus an `archiveWorld()` that computes the compact summary and removes the world from `aq_worlds`.

### 5f. Global leveling (cross-cutting)
- **State:** ADD `aq_progress = {xp, streak, lastDay}`; include it in `snapshot()`/`pullCloud`.
- **CHANGE (the only true rewires):**
  - `RANKS`/`rankFor` (527–528) → open-ended curve `50+25·(L−1)` + extended rank tiers.
  - `campUpdate` lines 546–548 (HUD xp bar %, lv/rank text, streak text) → read `aq_progress`; `cwCountUp` (539) drops the hardcoded `XP_TOTAL` denominator → `into-level / to-next`.
  - `cwToggle`'s level-up detection (572) → compare global level before/after.
  - `openMascotSheet` stats (830–833) → global level/rank.
  - `coinsEarned()`/`starsEarned()` (624–625) → sum over **all** quests (campaign + user quests), or move to a stored earned ledger (see §7 landmine).
- **XP award hook:** every step completion (exam `cwToggle` + new quest toggles) adds/subtracts step xp to `aq_progress.xp`; `dropPomo` (1040) and step completion both bump the daily streak (once/day).
- The HUD's DOM/CSS (gold bar, pulse, chips) stays untouched — only the numbers feeding it change.

---

## 6. Save migration ("preserve + auto-migrate on load, nothing destructive")

Exact conversion, per PLAN 137 ("the current exam questline lives as its first quest"), 181, 191:

1. **Trigger & placement:** run once at boot, **after** `await pullCloud()` (1133) and before `rebuild()` (1139), so the freshest campaign save (local or just-adopted cloud) is what migrates. Guard on absence of the new keys (e.g. no `aq_worlds` / no migrated flag) so it's idempotent. Also re-run the guard after the ⚙-panel adoption path (1121), which can replace `campDone` at runtime.
2. **World 1:** create default world (name e.g. "My Quests"/school, twilight palette) in `aq_worlds`, containing quest #1 = the exam questline. The quest record can be a thin wrapper — `{id:'exam3', kind:'campaign', worldId, state}` — because `CAMP_MODS`/`CAMP_REVIEW` stay hardcoded and `campDone` stays the exam quest's per-step truth (PLAN 64 keeps its diamond-tile renderer). Its map-spot totals derive from existing code: total xp = `XP_TOTAL` (248), earned xp = `campStats().xp`, stars = `lessonsCleared() + modulesCleared()*3` (+3 bonus only when all 21 items done).
3. **Lifetime XP pool:** `aq_progress.xp = CAMP_ITEMS.filter(i=>campDone[i.id]).reduce((s,i)=>s+i.xp,0)` — sum of **completed** items only (0–248), exactly PLAN 191. Streak initializes `{streak:0,lastDay:null}` (or streak 1/today if anything is checked today — either is defensible; 0 is safest).
4. **Coins/stars must not jump:** balances are *derived* (`earned − spent`). The generalized `coinsEarned()`/`starsEarned()` must yield **identical values** for the migrated campaign as the old functions did (coins = campaign xp earned; stars = lessons + 3·modules), otherwise wallets visibly change or clamp at 0 on first load. `aq_econ` is untouched.
5. **Nothing destructive:** never delete or rewrite `aq_campaign` / `exam-campaign-m5m6`; only ADD `aq_worlds` + `aq_progress`. `campDone` keeps being written by the exam quest exactly as today, so an old build (or the aquamarine dead copy) reading it still works.
6. **Cloud shape:** bump `snapshot()` to `v:3` adding `worlds` + `progress`. Keep `campDone` in the blob (the `pullCloud` validity gate at 1059 is literally `d && d.campDone && …`). `pullCloud` must handle adopting a **v2 blob from a not-yet-updated device**: adopt, then re-run migration — and must not let a v2 push erase v3 fields on the server (last-writer-wins is by whole blob; see risk below). After local migration, `markChanged()` publishes the v3 blob.

---

## 7. Risks / landmines

1. **Derived economy vs multi-quest semantics (biggest logic trap).** Because `coinBal()=max(0, earned−spent)`, un-checking a step or hitting the ⟲ reset (590 — wipes `campDone`) *reduces earned* and can silently drop a balance to the `Math.max(0,…)` clamp — today that's an accepted quirk of one quest. But PLAN 132 ("give up… keep all coins + stars already earned") and lifetime-XP-never-resets (185) are incompatible with pure derivation across resettable quests. The migration likely needs an **earned ledger** (banked coins/stars/xp survive reset/give-up), or per-quest "earned high-water marks." Whatever the choice, migrate so current visible balances are exactly preserved.
2. **200KB cloud blob ceiling.** `worker.js:63` hard-rejects >200,000 chars with a 413 — and `pushCloud()` swallows errors (`catch(()=>{})`, 1054), so an over-limit save would **silently stop syncing**. User quests carry step text + notes; keep them lean, keep the archive in its separate lazy slot (PLAN 150–155), and consider surfacing push failures.
3. **v2↔v3 sync clobbering.** Two devices, one updated: the old device pushes a v2 blob with a newer `t`, the new device's `pullCloud` adopts it and could drop `worlds`/`progress`. Needs version-aware merge (e.g., never adopt a lower-`v` blob's *missing* fields; re-migrate after adopting v2).
4. **The shell-injection pattern is order-sensitive.** The IIFE monkey-patches `cwToggle` (1072) and wraps the reset button's onclick inside `rebuild()` (1085); `cwSfx` is reassigned (612); `campDone` is a mutable global reassigned by `pullCloud` (1060). New code must layer *after* these (or refactor carefully); double-wrapping `cwToggle` or calling the raw `_toggle` would skip economy/sync.
5. **Embed + versioning.** The aquamarine iframe pins `?v=28` (aquamarine 724) — forget to bump it and the dashboard runs the old build against a migrated save. Embed mode also means the whole game lives in a **484px-wide iframe**; `#cwFx`, `#cwBanner`, and all `.sq-modal`s are `position:fixed` (fine — fixed is relative to the iframe viewport) but new wide screens (builder two-pane, pick screen) must degrade to that width, not just to 560px standalone.
6. **Exam-3 look preservation.** The map-view CSS *re-styles* base campaign classes with `!important` (161–170) and hides the old `::before` trail (341) — the polished look is an accumulation of overrides. New theming must be **additive** (CSS variables per PLAN 165, scoped to world containers), never edits to `.cw-node/.cw-mod/.cw-seg` rules; the exam quest keeps the diamond-node grid + twilight tokens verbatim. Also don't rename `aq_*` keys: aquamarine's dead campaign copy and any old cached build still read them.
7. **Trail/layout measurement.** `buildTrail` bails when the list is hidden (647) and positions segments from `offsetTop` — every new screen hosting a questline/road needs the render-on-show + `scheduleTrail`-on-resize pattern (1095, 1140), or trails render zero-height.
8. **`rankFor` fan-out.** It's used in three places (547, 572, 830); replacing the leveling in only the HUD leaves stale banners/sheet. Same for the `'🔥 done/total'` pseudo-streak string (548) — the *label* semantics change, not just the number.
9. **Single-file size & the 77KB audio line.** The file is ~193KB with one 77,482-char line (533); the worlds+builder+pick+stats fold plausibly adds 40–80KB of code. No hard limit locally, but editing near line 533 is hazardous (easy to corrupt the base64), and iOS Safari localStorage (~5MB) also holds aquamarine's image-bearing `aq_feed` — quest saves should stay text-only.
10. **`aq_slot` is device-local by design** — if new daily-capped features follow it, they won't roam; if added to `snapshot()`, mind blob size and the `t` conflict model (a spin on device A would then race a step-check on device B for the whole blob).

---

## Appendix — quick line-number index (quest.html)

| Thing | Lines |
|---|---|
| CSS `:root` tokens | 15–17 |
| HUD CSS / DOM | 128–145 / 383–394 |
| Screens DOM (map/buddies/shop/pomo) | 397–436 |
| Nav DOM / handler | 439–444 / 1090–1098 |
| Sync modal + dev tools DOM | 446–457 |
| CAMP_MODS / CAMP_REVIEW / CAMP_ITEMS / XP_TOTAL / RANKS | 507–527 |
| campDone load/save · campStats | 529–531 |
| Embedded base64 sfx (`CW_SFX`) | 533 |
| campUpdate (HUD writer) | 540–548 |
| Effects (burst/float/banner/celebrate) | 549–557 |
| cwToggle (raw) / buildCampaign | 562–576 / 577–591 |
| **Side Quest shell marker / SQ_VER** | **593 / 595** |
| Web Audio layer + `cwSfx` reassign + `blip` | 603–619 |
| Economy (earned/spent/adjustBalance) | 621–632 |
| placeAvatar / buildTrail / scheduleTrail | 635–662 |
| BUDDIES / gacha / TCG / hatch | 664–816 |
| Mascot sheet (talking mascots) | 817–847 |
| Cosmetics | 849–921 |
| Slot machine | 923–967 |
| Pomo room | 969–1044 |
| Cloud sync (API/snapshot/push/pull/markChanged) | 1046–1069 |
| cwToggle monkey-patch / rebuild | 1072–1087 |
| ⚙ sync panel logic / dev grant+wipe | 1100–1128 |
| Boot (embed, sqVer, pullCloud, inits) | 1130–1141 |

Aquamarine anchors: iframe embed 724 · embed CSS 563–572 · dead campaign copy 1185–1271 · TickTick API 1393–1426 · Notion 1428–1546 · shared `aq_api_url/aq_api_key` 1393/1423. Worker anchors: `/ticktick` 20–33 (no subtasks yet) · `/save` slots + 200KB limit 52–66.
