# Side Quest — Pomo Room Redesign: THE DEN
*Bold revamp spec for the pomo room + focus-timer mechanic. Builds on the unified-loop framing (`live_game_weave.md` §1.7/§3.2): room = the loop's rest chamber, tomatoes = crystallized focus, decor = flagship coin sink, manual log = honesty valve. Honors owner mandates: ONE timer (TickTick native, bidirectional), zero friction, cohesion · flow-state · "hustle is over, tea now." Judged on LOOK · PERFORMANCE · PRACTICALITY.*

**Grounding in code (read, not edited):** `quest.html` — room CSS 353–373, markup 432–435/458–461, engine 969–1044 (`makeEnt` 976, `pomoTick` 986, `pomoDecor` 1021, `pomoBuild` 1029, `pomoStart/Stop` 1038–39, `dropPomo` 1040, `sellPomos` 1043), `POMO_PRICE=5` (970), `aq_pomo` in `snapshot()` (1051), nav RAF discipline (1096), `TOM_SAY` (819), mascot sprites via `--slime`/`--tomato` CSS vars (598).

---

## 0. The one-paragraph vision

Today the pomo room is a terrarium with a chore attached: you *remember* to log a tomato, it roams, you liquidate it. The redesign makes it **THE DEN — the tomato's house, the focus timer's face, and the place where effort becomes rest.** The room has **two states**: while a TickTick focus session runs, the tomato is *away at work* (seated beside the lit quest step), its cushion sits empty, and a kettle on the stove quietly fills toward the next tomato; when focus ends, the tomato walks home, crystallized-focus tomatoes rain in for every 25 real minutes, and the room becomes tea time. Every coin Antonio earns studying can furnish this room — lamp, rain window, jellyfish tank — so months of effort are *visible as coziness*. You return to the den for three reasons: to bank your harvest, to sit in what your work built, and because the little guy who times your life lives there.

**The room's contract (design principles, non-negotiable):**
1. **The room never asks for work.** No countdown digits shouting, no "start a session?" prompts, no idle-shame. It *reflects* focus; TickTick *owns* focus.
2. **Nothing in the room requires the app to be open.** All rewards reconcile idempotently from TickTick focus records.
3. **Every reward path either starts work or ends in rest** (the weave's through-line). The den is the "ends in rest" terminal.
4. **Tomatoes are never punished, never expire, never decay.** The room can only ever get warmer.

---

## RANKED FEATURES

### #1 — Tomatoes = crystallized focus (the auto-drop engine) — THE HEART
**What.** Kill "tomato = a note-to-self you logged." A tomato is minted **automatically for every 25 minutes of real TickTick focus time**. On boot/foreground (and after any ▶-started session ends), Side Quest reads TickTick focus records (`GET /focus?since=`, worker-proxied), computes credited minutes (TickTick handles `pauseDuration` natively — we never re-implement pauses), and:
- pays **+1 bonus XP per focus minute** (weave §3.2 rate, settled),
- pops the **2-minute showed-up ember** if the session was ▶-started on a step,
- calls the existing `dropPomo()` (quest.html:1040) once per full 25 minutes — the fall, the startle-hop of the residents, the squish sfx are already perfect choreography; **zero new drop animation needed**,
- banks the remainder in `aq_pomo.carry` (e.g. a 40-min session = 1 tomato + 15 carried; the next session's first 10 minutes finish tomato #2). Carry means no focus minute is ever wasted — critical for feeling fair.
- **Dedupe by focus-record id** in `aq_progress.lastFocus` — never double-award across devices/reloads.

**Rationale.** This is the single change that turns the room from island to organ: the one system that could reward time-in-seat stops rewarding *remembering to log* (the vision report's diagnosis). It also finally makes the tomato mascot and the pomodoro technique the same bit. Flow: earning requires literally nothing beyond focusing, in either app. Cozy: your day's focus physically accumulates as little creatures in your room.
**Implementation surface.** Worker: focus-read endpoint (weave Phase 5). Client: a `reconcileFocus()` called from boot + `visibilitychange` + session-end; loops `dropPomo()` (throttled — see perf); extends `aq_pomo` with `{carry}` and `aq_progress` with `{lastFocus}`. `dropPomo` itself needs one edit-point: split "mint a tomato" (state) from "drop ceremony" (visual) so reconciliation can mint N while visually dropping ≤6 (see #10 perf budget).
**Risk.** Medium — hinges on the Focus API (still being verified). Fully mitigated by the degraded ladder in §D: local 25-min count-up while a step is lit (no API), settle-on-sync (read-only API). Idempotency bugs are the real hazard: make `lastFocus` id-set append-only and cap at ~200 ids with time-window pruning.
**Perf / reduced-motion.** Reconcile is O(records) once per foreground, no loops. Multi-tomato arrivals staggered 250ms, capped at 6 visible drops + counter tick for the rest. Reduced-motion: tomatoes appear in place (no fall), counter updates, sfx kept.
**When.** The state/reconcile skeleton + local count-up fallback: **prototype now** (it defines everything else). Worker endpoints + bidirectional write: **at-fold Phase 5**.

---

### #2 — The two-state room: the tomato leaves for work — THE SOUL
**What.** The room renders differently depending on whether a focus session is live:
- **REST state (default, today's room + warmer):** tomato home on its cushion, dumpling + equipped buddy roaming, tomatoes wandering, lamp warm, kettle idle.
- **FOCUS state (a TickTick session is running):** the tomato **is not in the room** — it visibly hops out (a 600ms exit through the room edge) and appears **seated beside the lit quest step** (the weave's Press-▶ seat, same sprite, `--tomato` var). In the den, its cushion sits empty with a tiny "at work ✦" pixel sign; the lamp dims a notch to a deeper amber; the **kettle** (see #3) starts filling; if it's a rain evening, rain audio is allowed at whisper volume. The dumpling stays home holding the fort — visiting the den mid-focus feels like checking on a quiet house, not abandoning your post.
- **Return beat:** when the session ends (event if app open; reconciliation if not), the tomato walks back in from the edge carrying a tiny crystal-tomato sprite, sets it down (that's the final `dropPomo` of the batch), and the room shifts back to REST with a soft two-note.

**Rationale.** Cohesion at its maximum: the tomato mascot becomes *the focus timer made flesh* (weave §1.8 cast roles), and the room becomes the timer's honest face — you can glance at the den and *know* whether you're mid-session. Emotionally it inverts the guilt of "playing instead of studying": while you focus, the room is visibly waiting for you both. Flow: the state is ambient information, never a demand.
**Rationale (look).** The empty cushion is the kind of loving detail the reference images are made of; the walk-home-with-a-crystal is the game's best possible 2-second story.
**Implementation surface.** A `denState('focus'|'rest')` toggling: `POMO_DUMP`-style handling of the tomato ent (remove from `POMOS` iteration / re-add), a `.den-focus` class on `.pomo-room` shifting `--lamp` warmth via CSS vars, cushion sign as a `pomo-deco` sprite. The seat-beside-step is the weave's Press-▶ feature (shared sprite; render in `#cwFx` layer next to the lit row). Exit/entry = WAAPI translate on the ent element, then remove/add.
**Risk.** Low-medium — state can desync from TickTick reality (e.g., session ended hours ago, app just opened): rule = *reconcile before render*; when in doubt render REST. Never render FOCUS from stale data older than the session's possible end.
**Perf / reduced-motion.** State swap is class + one ent add/remove — free. Reduced-motion: no walk animations; tomato simply present/absent, sign still shown (state legibility preserved without motion).
**When.** **Prototype now** with the local ▶ state (doesn't need the API — Press ▶ is approved and works standalone). Bidirectional truth wiring at-fold Phase 5.

---

### #3 — The kettle: session presence without a countdown — THE TIMER UX
**What.** Side Quest's entire "timer UI" is deliberately **not a timer**. It is:
1. **The kettle** — a small canvas-drawn stove+kettle in the den (also miniaturized into the room header when on other screens... no — keep it den-only; the HUD chip covers elsewhere). While FOCUS state is live, the kettle fills: its pixel water-line = `(creditedMinutes + carry) % 25 / 25`. At each 25-minute boundary it whistles softly (short `yay` at low gain) and a tomato drops. No digits on it. Tapping it shows a 2s bubble with the honest numbers: *"18 min this pot · 2🍅 today."*
2. **The HUD focus chip** (weave §1.2, endorsed here as the den's remote): `⏱ 12m · focusing` beside the streak chip while a session is live, on every screen. Tap → jumps to the lit step. This is the only place minutes are always visible — small, calm, factual.
3. **Press ▶ = the only start verb.** Primary: ▶ on a quest step (starts a TickTick focus session titled with the step text — the session *is TickTick's*; Side Quest merely reflects it). Secondary: a **"▶ brew a focus"** button in the den replacing today's primary slot — it starts focus on *the campfire's current card / promised step* (one tap, zero choosing; long-press to pick a different step). This makes the den itself an on-ramp: you came to rest, the room offers the gentlest possible way back in — once, silently, via a button that just sits there.
4. **Pause/stop live in TickTick.** Side Quest shows **no pause button anywhere**. If the write-API supports ending a session, the focus chip's detail view may offer a single "finish ✦" — otherwise nothing. Reflect-first, control-second.

**Rationale.** Owner mandate: ONE timer, TickTick's, bidirectional. Flow-state research and the app's own thesis agree: a visible countdown is a stressor; a filling kettle is a promise. The ▶-from-den button collapses start friction to one tap from the coziest screen — the room literally *reduces the cost of starting* without ever nagging. Cozy: tea imagery = the aesthetic doc's core line, made mechanical.
**Implementation surface.** Kettle = one `pomo-deco`-style canvas sprite with a redraw-on-minute (1 Hz interval **only while den visible AND focus live**; else zero timers). HUD chip = one element in `#hud .hud-cur`, toggled by the same `denState`. "Brew" button reuses `.sq-bigbtn`; picks step from the campfire selector (weave §3.5). TickTick write: worker `POST /focus` (Phase 5).
**Risk.** Medium — the bidirectional write is the unverified leg; ship the ladder (§D). UX risk of the brew button feeling pushy: it must be visually quiet (ghost style), never pulse, never badge.
**Perf / reduced-motion.** Kettle redraw = tiny canvas per minute; steam puff is a 2-frame sprite, disabled under reduced-motion (fill level alone carries the info). Chip is text.
**When.** Chip + local-count kettle + brew-on-step: **prototype now**. TickTick session write: **at-fold Phase 5**.

---

### #4 — Furnish the den: decor as the flagship coin sink — THE ECONOMY
**What.** A decor catalog, bought with coins in the shop's new "den" shelf (weave §1.5), **rendered in the room**. Fixed placement slots (no free-drag furniture — friction + save-size discipline); buying a piece makes the room visibly warmer. All pieces **canvas-drawn like `pomoMoonURL`/`pomoRugURL`** — zero bytes of new assets, palette-native.

Launch catalog (prices tuned to ~180 coins/wk income, weave §3.3 — first buy in week 1, full set ≈ 6 weeks):

| Piece | Cost | What it adds (LOOK) | Slot |
|---|---|---|---|
| rug dyes (teal/gold/lavender) | 30 ea | recolors `pomoRugURL` | floor (owned rug, dye swap) |
| wall poster | 50 | tiny pixel anatomy chart / band poster | wall |
| tomato's cushion | 60 | the seat that sits empty during focus (#2) | floor |
| hanging plants | 70 | 2 sprigs, gentle 2-frame sway | ceiling |
| **warm lamp** | 80 | a pool of warm light — radial gold gradient layer, the room's biggest mood shift | corner |
| **rain window** | 90 | a window frame; on rain evenings, streaks + faint `rain.mp3` (gamefeel #14 lifecycle) | wall |
| bookshelf | 100 | med-school spines; jars migrate here (#5) | wall |
| string lights | 110 | 5 warm twinkle dots along the ceiling (staggered opacity) | ceiling |
| **tea table + pot** | 120 | stages the tea beat (#6); idle steam wisp | floor |
| **jellyfish tank** | 250 | the aspirational piece — 2 slow-drifting glowing jellies (the reference-image bedroom), soft cyan bloom | corner |

- **Coziness tiers:** every 3 pieces owned raises a `--hearth` CSS var one notch — ambient glow deepens, the radial room gradient warms. The room *itself* levels up; no numbers shown, you just feel it.
- Later waves: seasonal/world-palette pieces (sakura branch, snow globe), a buddy bed (equipped buddy naps in it).

**Rationale.** "Effort furnishes rest" is the cozy thesis as an economy (weave §1.5, settled as the flagship sink) — and it fixes the real inflation problem: the 5-hat catalog exhausts in a fortnight against the new ~180c/wk. Every purchase is *re-seen daily*, unlike hats' one-time novelty — the strongest possible coin-sink retention. Cohesion: shop → room → tea beat → campfire all share the cast and the light.
**Implementation surface.** `aq_pomo.decor:["lamp","rug_teal",...]` (~120 bytes; `snapshot()` already carries `pomo`, line 1051 — budget-safe). `pomoDecor()` (1021) is the extension point: table-driven `DECOR = {id:{draw, slotCSS, price}}`; shop shelf reuses the outfit card renderer (`renderShopOutfits`, 849–921 pattern) with a room-corner preview. Lamp/hearth = CSS gradient layers on `.pomo-room::before`.
**Risk.** Low — additive rendering + one saved array. Only care: contrast/readability as glow layers stack (test the darkest and warmest ends), and don't let decor z-index above roamers (`.pomo-deco` already z:0, keep it).
**Perf / reduced-motion.** All decor static except ≤3 animated pieces (plants sway, string-light twinkle, jellyfish drift) — **shared node budget of ~8 animated elements** with the sky twinkle (art #4 / perf #9). Jellies = transform/opacity keyframes only. Reduced-motion: all decor freezes at a lit static frame (a still jellyfish is still a glowing jellyfish — art #0's rule).
**When.** Decor table + 3 launch pieces (lamp, rug dyes, cushion): **prototype now** (it's pure canvas + CSS and sells the whole concept). Full catalog + shop shelf: **at-fold** with the banked ledger (purchases must go through `aq_econ{ce,se,c,s}`).

---

### #5 — The pantry: trade-in replaces "sell all" — THE WALLET FLOW
**What.** Evolve the liquidation flow from "sell your friends" to "preserve the harvest":
- Button copy: `sell all · N🪙` → **`trade in · N🪙`**. Modal: *"trade N tomatoes for N×5 coins? they go to the pantry, not the void."* Keep the kind confirm (the modal at 458–461 stays; copy swap only).
- **Visual:** on trade-in, tomatoes hop single-file into a basket by the door (staggered 120ms, cap 6 animated + counter), then 3–5 coins arc to the HUD coin chip (gamefeel #1's `coinFly`, explicitly reused for `sellPomos` per that report). No more silent `.remove()` purge (1043).
- **The pantry shelf:** `pomoState.total` (lifetime tomatoes) becomes *visible* — pixel preserve jars on the bookshelf/wall, 1 jar per 10 lifetime tomatoes, capped at ~12 jars then a `×N` label. The header tally `N here · M logged` becomes **`N ripe · M jarred · today: K🍅`**.
- **Price stays 5 coins** (POMO_PRICE, 970) — the weave's inflation firewall (focus mints XP directly, coins only via this cozy choice) depends on it; don't touch the rate.
- **Partial keeping is free:** trade-in remains all-or-nothing (one decision, zero inventory management) but petting (#8) gives a reason the room never feels like a warehouse. If Antonio ever wants a permanent pet tomato, that's a future 1-tap "keep this one" flag — not now.

**Rationale.** With tomatoes now representing *real focus*, wiping the room must feel like banking, not culling (weave §1.7, settled). The jars convert the dead `total` counter into a trophy surface — the den quietly becomes the *lifetime focus monument*, sibling to the map's flags. Flow: still one button, one confirm.
**Implementation surface.** Copy edits in markup (435, 459–460) + `pomoTally` (975); basket = one deco sprite + WAAPI hops in `sellPomos`; jars = a `pomoDecor` addition reading `pomoState.total`. `coinFly` comes from gamefeel #1 (shared system).
**Risk.** Trivial.
**Perf / reduced-motion.** Hop animation capped; reduced-motion: tomatoes vanish, jar count updates, coins land instantly with the chip pop only.
**When.** **Prototype/live now** — this is shippable polish with zero data risk (Phase 0 caliber).

---

### #6 — The rest beat: "the hustle is over, tea now" — THE CEREMONY
**What.** When a focus session ends **and** the app is (or comes) foreground, the den hosts a 4–6 second unskippable-in-the-good-way moment (only if ≥1 tomato was minted; otherwise just the walk-home):
1. tomato walks in with the crystal (#2's return beat) →
2. the gang gathers loosely on the rug (roam targets converge — `o.tx/o.ty` already support this) →
3. if the tea table is owned: teapot pours, steam wisp, dumpling raises a tiny cup; if not: they just sit together (the table purchase visibly *upgrades this exact moment* — the decor sink advertising itself) →
4. a quiet banner in the room (not `#cwFx` global): *"the hustle is over — tea now ✦ +2🍅 · +50 xp"* with the day's totals →
5. everything drifts back to roaming.

Evening variant: the campfire's tea scene (weave §3.5) *draws this cast* — today's tomato count appears as the pile by the fire. One moment, two homes, same sprites.

**Rationale.** This is the aesthetic doc's north-star sentence made into the loop's reward terminal — the moment that teaches "finishing focus = warmth," which is the entire behavioral thesis. It also gives session-end a *shape* (right now, in any design, focus just... stops). Cohesion: reuses the mascot cast, feeds the campfire, showcases decor.
**Implementation surface.** A `teaBeat(minted, xp)` sequence: set roam targets → WAAPI on a teapot deco sprite → room-local banner (clone `.cw-banner` style scoped to `.pomo-room`). Triggered from `reconcileFocus` when it detects a session boundary and screen is/becomes the den, else queued as a one-shot the next time the den opens ("while you were away" naturally handled: the beat plays with the reconciled totals).
**Risk.** Low-medium — sequencing + "don't replay on re-render" guard (same discipline as gamefeel #3's ceremony). Never block input; any tap fast-forwards to the end state.
**Perf / reduced-motion.** Uses the existing RAF loop's roam system; banner is one element. Reduced-motion: skip the gather/pour, show the banner + totals only.
**When.** **At-fold Phase 5** (needs session boundaries), but the `teaBeat` staging can be **prototyped now** off the manual log button.

---

### #7 — Ambient life: window, weather, twilight — THE LOOK
**What.** Make the den the most alive frame in the game, on a strict budget:
- **Twilight window/sky:** the room's upper half follows the real clock (gamefeel #4): warmer dusk mornings, deep indigo + brighter star-twinkle late. The existing moon (`pomoMoonURL`) gets a bloom halo at night (art #12); 5–6 of the static stars (1024–25) get the staggered twinkle (art #4 — explicitly "pomo live now").
- **Rain evenings:** date-seeded ~25% of evenings (gamefeel #14): 1px streak layer behind the window (or whole sky if window not owned... no — **rain requires the rain window piece**: weather is a *purchase*, which makes it a gift, never an imposition; the umbrella toggle from gamefeel #14 lives on the window). `rain.mp3` re-encoded ≤250KB (perf #10) at gain ≈0.12, started only inside the audio-unlock gesture path, paused on `visibilitychange` and on leaving the den.
- **Lamp warmth:** owned lamp adds the warm pool; in FOCUS state it dims one notch (#2) — light itself communicates state.
- Sky/star/moon craft per art #2/#3/#4 (layered gradient + vignette, prismatic star sprite reused).

**Rationale.** The room is the rest chamber — rest is communicated through *atmosphere*, not features. Rain-behind-a-window-you-bought is the single coziest idea available to this game and it's already 80% specced across gamefeel/art. Late-night med-school sessions get a room that says "witnessed, not grim."
**Implementation surface.** CSS var lerp on the room gradient (`skyTick`, gamefeel #4 sketch); rain = one div, `background-position` compositor animation; twinkle = opacity keyframes on existing deco nodes.
**Risk.** Low visuals; **medium** for looping audio on iOS Safari (the known lifecycle care point — pause on hide, resume only on gesture).
**Perf / reduced-motion.** Everything transform/opacity/background-position; total animated nodes in the den (decor #4 + sky) hard-capped at **8** (perf #9's budget, enforced as a constant). RAF still starts/stops with nav (1096 discipline — codify per perf #14). Reduced-motion: static streaks + tint, frozen twinkle at mid-opacity, audio unaffected (sound isn't motion; keep the toggle).
**When.** Twinkle + sky + vignette: **live now** (Phase 0 batch, already endorsed). Rain: **live now** for visuals, audio with the re-encode. Window-gating: with decor at-fold.

---

### #8 — Residents with a relationship: petting + contextual voice — THE WARMTH
**What.**
- **Petting** (gamefeel #10, adopted wholesale): quick-tap (<180ms, <6px move) vs drag disambiguation in `makeEnt`'s pointer handlers → squash pop (the `react` field already does this), 5×5 pixel heart float, squish sfx; every ~5th pet a one-line bubble.
- **Contextual voice in the den:** the tomato (when home) speaks *rest-register* lines — new small pool `TOM_REST` (~10: "we earned this pot.", "look at today's harvest.", "the timer's off. i'm just tomato now.") distinct from its `TOM_SAY` focus-drill register, which now fires at ▶-press beside the step (weave §1.8). The dumpling keeps `SLIME_SAY`. Bubble reuses `.ms-bubble`/`pickSay` (819–823).
- **The equipped buddy roams the den** — third resident via the same `makeEnt` pipeline with the buddy sprite. The gacha collection finally has a *home*, not just a HUD slot.

**Rationale.** The room's only verbs today are utilitarian (log, sell, drag). Affection verbs are what make a place feel like *yours* — and a bond you chose not to sell softens the harvest economy. Two vocal registers complete the tomato's character arc: drill sergeant at work, soft roommate at home — the cohesion brief's "timer made flesh," emotionally finished.
**Implementation surface.** `makeEnt` pointerup timing check; heart sprite à la `pomoStarURL`; `TOM_REST` array + `pickSay`; buddy ent = `makeEnt('buddy', ...)` with `drawBuddy` data-URL.
**Risk.** Low (tap-vs-drag is the one care point, already scoped by gamefeel).
**Perf / reduced-motion.** One more roaming ent is O(1) in the existing loop. Reduced-motion: hearts appear-fade without float; bubbles unaffected.
**When.** **Live now** (Phase 0 batch — gamefeel already lists petting in the ship-this-week set). Buddy resident: now. `TOM_REST`: now.

---

### #9 — "log one by hand": the honesty valve, demoted with love
**What.** Keep manual logging (settled — never require the automatic path), but reframe: button moves to secondary/ghost styling under the primary "▶ brew a focus", relabeled **"＋ log one by hand"**, with a one-line hint under the modal-free tap: *"for focus the timer didn't see — library sessions count too."* It still drops a tomato, still counts streak, still `total++`. It does **not** mint bonus XP (XP is for *measured* minutes; the tomato + coins + streak are the honest reward for honest memory — keeps the valve from becoming an XP faucet).
**Rationale.** Phone-in-locker library sessions are real med-school life; the valve keeps the system truthful without keeping it manual-first. Demotion (not removal) tells the story: automation is the norm now.
**Implementation surface.** Markup swap in `.pomo-actions` (435): primary slot = brew ▶, secondary = hand-log, `trade in` third. `dropPomo` unchanged.
**Risk.** None. (Watch only: if hand-logs ever dwarf auto-drops in telemetry, the API integration is failing silently — the valve doubles as a canary.)
**Perf.** n/a. **When. Now.**

---

### #10 — Perf spine: the crowd cap + reconcile budget — THE ENGINEERING GUARANTEE
**What.** The redesign multiplies tomatoes (a 7h MCAT full-length = 16; an untraded week = 50+). `pomoTick` (986) iterates every ent per RAF frame with per-ent style writes — fine at 8, not at 50. Rules:
- **Visible-roamer cap = 12 tomatoes.** Beyond that, extras render as a static **pile sprite** (canvas, 3 growth stages) + the header count. Trading in always clears both.
- **Drop ceremony cap = 6** per reconciliation batch; remainder ticks the counter with a soft multi-pop.
- Reconcile runs at most once per foreground + after session end; never on an interval.
- Preserve the enter/leave RAF discipline (1038–39, 1096) verbatim — the perf audit calls it the pattern to spread, and every new den timer (kettle 1 Hz) must key off the same visibility gates.
- `aq_pomo` growth stays trivial (`{room,total,carry,decor[],rainPref}` ≈ 200B) — no payload-budget interaction (perf #2 safe). Wrap `savePomo` (974) in the central `save()` helper (perf #3).

**Rationale.** The owner judges on PERFORMANCE; the cozy room must be the *cheapest* screen, not the heaviest — calm that stutters isn't calm. **Risk.** Low. **Reduced-motion.** With roamers frozen (art #0), the RAF loop can early-exit entirely under reduced-motion: render positions once, run zero frames — the den becomes a still painting that still shows all state. **When.** Caps land **with #1**; save-wrapper **Phase 0**.

---

### #11 — The den's ledger line: focus made visible, gently
**What.** One quiet stats surface: the room header becomes `THE DEN ✦ today: 2🍅 · 63m — N ripe · M jarred` (VT323, existing `.pomo-tally` slot), and tapping the kettle/jars gives lifetime: *"412 tomatoes · 178 hours of focus, all yours."* Lifetime focus **hours** join lifetime XP as a never-decreasing identity number — displayed here and in the mascot sheet's stat rows (824–833), nowhere else. No graphs, no weekly comparisons, no "down from last week" — ever.
**Rationale.** For a med student, "178 hours, crystallized and jarred" is the long-horizon motivator; keeping it tap-hidden keeps the room a room, not a dashboard. **Surface.** `pomoTally` + one `statRow`. **Risk/Perf.** None. **When.** With #1's data (minutes come from reconciliation).

---

### #12 — Optional flavor: rename to "the den" (or "tea room")
Keep the 🍅 nav icon and `pomo` internals; the on-screen title `✦ pomo room` → `✦ the den`. Pure copy; do it only if Antonio smiles at it. Zero risk, zero cost, at any time.

---

## D. Degraded-mode ladder (feasibility honesty — inherited from weave §3.2, restated as the den's contract)
1. **Bidirectional Focus API (target):** ▶ writes a native TickTick session; records read back; everything above at full fidelity.
2. **Read-only API:** ▶ lights the row + local count-up powers ember/kettle/seated tomato live; XP + tomato mints *settle* on next record sync (identical totals, slightly delayed drops — the kettle whistles on reconcile).
3. **No API:** ▶ still ships (initiation never depends on TickTick); kettle runs on a local 25-min count-up while a step is lit; hand-log valve carries offline focus. The den loses none of its look, decor economy, or rest beat.

The ladder means **every ranked feature except the write-half of #3 ships regardless of API outcome.**

## E. Cohesion map (one glance)
- **Quests:** ▶ on a step → TickTick session titled with the step → tomato seated beside the lit row → ember at 2 min → +1 XP/min → tomatoes drop in the den. The den's brew button starts the campfire's card.
- **Campfire:** morning card can whisper yesterday's harvest; evening tea scene draws the den's cast + today's tomato pile; Tomorrow's Promise closes the day the den's rest beat opened.
- **Mascots:** tomato = timer made flesh (drill voice at work, rest voice at home); dumpling = the den's constant warmth; equipped buddy = resident.
- **Economy:** coins (finished steps + traded tomatoes) → decor → a visibly warmer room → a better tea beat. Focus mints XP only (inflation firewall intact). Stars/gacha untouched.
- **Lifetime XP & streak:** focus minutes feed both; the den displays the hours; `dropPomo` keeps the real streak (weave/PLAN, unchanged).

## F. Restraint list (what the den will NEVER do)
No countdown digits on the room. No break-length enforcement or "back to work" prompts. No tomato decay/rot/expiry. No red states. No notifications. No "you didn't focus today." No free-drag furniture editor. No coin faucet from idle presence. The mascots missed you; they were never disappointed.

## G. Build order (folds into the weave's phases)
- **Phase 0 / this week (zero data risk):** #5 trade-in copy + coin flight + jars, #8 petting + buddy resident + TOM_REST, #7 twinkle/sky/vignette + rain visuals, #9 hand-log demote, #10 save-wrapper, #12 rename (optional).
- **Prototype now:** #1 reconcile skeleton + carry + local count-up, #2 two-state room + walk-out/home, #3 kettle + HUD chip + brew button, #4 decor table + lamp/rug/cushion, #6 teaBeat staging (off manual log).
- **At-fold Phase 5 (Focus API):** #1 worker read + idempotent mint, #3 session write, #6 real session-end trigger, #2 truth wiring, #11 lifetime minutes.
- **At-fold with economy:** #4 full catalog through the banked ledger + shop den-shelf.

**Standing gate (same as the weave's):** does it change the 10 seconds after Antonio opens the app — and now also: *does it make ending a session feel like coming home?*
