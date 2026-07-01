# Side Quest — Master Roadmap

*Synthesized from an 11-report Fable audit fleet + Antonio's steering (2026-07-01). Full reports in `docs/audits/`.*

---

## The game, whole (the vision)

One cozy loop where **effort furnishes rest**. You boot to the **Campfire** — the gang around a fire, ≤3 of your next unstarted steps, one tap to begin. **Press ▶** on a step (from the campfire, the step's hold-menu, or TickTick itself) starts a *native TickTick focus session*; the tomato mascot goes "to work" beside your lit task. Focus minutes quietly accrue **bonus XP**, and every completed pomo drops a **tomato** into **The Den** (the pomo room, reimagined as the tomato's home + the timer's face). Completing steps banks **coins**, chapters bank **stars**, quests plant flags on your **world map** — all feeding one open-ended **lifetime level** + a real **streak**. Coins **furnish the Den** and buy outfits; stars **summon buddies** who become a found-family joining you at the campfire, on the map, during focus, at tea. When you're out of fuel you press **"call it a night 🫖"** — the campfire shifts to tea ("the hustle is over, we're having tea now") and asks *what's first tomorrow?*, closing the day by opening the next.

**Quests are the substance; everything else orbits starting, finishing, or resting.** The beloved exam-3 look is preserved throughout.

---

## Locked decisions (Antonio's steering)

- **Quests stand alone**; the Campfire is an optional daily on-ramp that reads *across* quests, never replaces them.
- **Start focus** from: the Campfire, a quest step's hold/right-click menu, or TickTick native — all one TickTick focus session.
- **One timer = TickTick's**, bidirectional (start in Side Quest → writes a TickTick focus record; focus in TickTick → read it). Pauses handled natively by TickTick.
- **Tomatoes = one per completed pomodoro** (not per minute). Bonus **XP accrues per focused minute** (smooth, invisible), never mints coins (inflation firewall).
- **Day ends on a manual button**, never an automatic/timed cutoff (irregular study hours).
- **XP = manual minutes: REJECTED.** **Give-up design: kept as-is (excellent).**
- **Cozy is the emotional core** (effort earns rest). Evaluate everything on **look · performance · practicality**. Bold revamp welcomed; whole-package cohesion + flow-state + zero-friction is the throughline.

---

## Tracks (all the work, tagged `live-now` / `proto-now` / `at-fold`)

### 🚨 T0 — Health & data safety `live-now` — the "bricking" fixes
- Loud sync failure path (currently `quest.html:1054` swallows 413/401/network — sync can die silently for weeks).
- Central guarded `save()` + quota toast + boot storage gauge (writes currently dropped silently).
- `pullCloud` rolling backup + shape validation before adopting cloud (currently overwrites 5 keys on one truthy check).
- `pagehide`/`visibilitychange` keepalive flush (last change of a session often never syncs).
- Payload budget + strip-empty serialization (200 KB blob ceiling; archive lazy-slot verified good).
- Reduced-motion foundation (no guard exists in either file today — must precede any motion/particles).
- Externalize the 77 KB base64 audio line (−40% file size) + `preload='none'`.

### 🐛 T1 — Prototype bugs `proto-now`
- Opening a map quest can destroy unsaved builder work · a quest can save to the wrong world · step-toggle awards XP in preview but not build → all fixed by the **play/edit split** (T2).
- Twilight/mint accent collision (folded into the palette refresh, T7).

### 🧭 T2 — Navigation `proto-now` (converges toward the live game's pattern)
- Persistent bottom nav; kill the top tabs.
- **Split "play" from "edit"**: quest screen gets `←` + `⚙ edit`; builder binds to a specific quest+world and autosaves (fixes T1 bugs).
- Universal `←` = one level up. Quick world switcher off the map banner. Map-spot legibility (`▶ enter`), visible ✎ on world cards.

### 🎯 T3 — Initiation & flow `proto-now` (the north star)
- **The Campfire** (optional daily on-ramp, ≤3 cards, reads across quests).
- **Press ▶ for real** (lights the row, seats the tomato, starts TickTick focus, "showed up" ember at 2 min).
- **The Clock** (real dates → calm pace lines + week strip; *never red/shaming*).
- **Tomorrow's Promise** + **manual "call it a night 🫖"** day-end → tea/rest beat.
- Spotlight the next step; fold zero-progress chapters to banners (anti-overwhelm).

### 🍅 T4 — The Den (pomo revamp)
- Tomato = the timer's face; two-state room (away-at-work ↔ home-for-tea); a **kettle** replaces countdown digits.
- Tomatoes drop **per completed pomo**; **furnish-the-den** decor as flagship coin sink; tea rest-beat; TickTick focus integration + per-minute bonus XP; "log one by hand" kept as an honesty valve.

### 🥚 T5 — Buddies (found-family revamp)
- Personality kits (voice + idle tic + likes) · presence pipeline (equipped buddy everywhere) · **ritual perks, not power** (each re-flavors a ceremony) · **Bond** (depth from studying while equipped; dupes = reunions + keepsakes) · Dex → Family Album · **Shooting Star wish token** (dex reachable in ~10–14 wks) · wave-2 **Night Market** set · sprite-cache prerequisite.

### 🎡 T6 — Twilight Market & Payday Wheel (economy revamp)
- **Banked ledger** (`bank()`/`spend()`, migration keeps balances bit-identical).
- **Payday Wheel** (a spin-the-wheel, *not* a slot — cozier + transparent, visible odds): boots inert, earns a free **golden spin** on the day's first completed step, ~10 paid spins/day, bonus golden spins on chapter/quest clears — can't be farmed instead of studying.
- Wheel segments = coins / tomatoes / rare-star sparkle / jackpot koi hat, with tick-decelerate spin juice · **Room & Board decor shelf** (~14 items, ~2,290c season of goals) · Twilight Market layout + "saving for ✦" pin · hats 5→12 · **Charms v1 shipped** · remove the ⟲ reset from the primary UI.

### 🎨 T7 — Art direction
- Reduced-motion + bloom-token foundation · **palette refresh** (unique vivid accent + glow hue per world; fixes twilight/mint collision + snow mismatch; optional cozy **pastel** register) · ambient sky-glow + vignette · prismatic reward star + glowing currency · glossy alive mascots (no new art needed) · cozy map props (canvas-generated) · text pop · budgeted particles (fireflies/petals/rain/twinkles).

### 🎮 T8 — Juice
- **Quest-complete flag-plant ceremony** (the missing victory moment — highest gap) · coin-flight to wallet · combo momentum · level-up flourish · thump/rumble tiers · idle life · pet-the-gang · gang travels the road · weather-as-a-gift.

### 🔥 T10 — Daily-streak revamp *(dedicated redesign in progress)*
- Real daily streak (≥1 step **or** ≥1 pomo per day, replacing the mislabeled `done/21`) made **truly satisfying + encouraging** — evolving flame, milestone ceremonies, mascot reactions, tied to the campfire fire.
- Cozy restraint: **never red / never shaming / gentle grace on a missed day** ("the fire's still warm"), never dread-inducing.

### 🔧 T9 — The migration / "the fold" `at-fold` (Opus, sequential)
7-phase weave from `live_game_weave.md` + `migration_audit_live.md`:
1. **Save-migration first** (behind a backup): auto-detect exam-3 save → wrap as **World 1** via a `kind:'campaign'` adapter over untouched `campDone` → seed lifetime XP = sum of completed items → **banked earned-ledger** so coin/star balances stay *bit-identical* (the derived-economy landmine) → snapshot `v:3` keeping `campDone`.
2. Replace leveling (`RANKS`/`rankFor`/`campUpdate`, 3 sites) with global open-ended.
3. Port screens into the live `.screen`/`#nav` stack, reusing live chrome (trail, avatar, effects, modals).
4. TickTick pick reuses `aq_api_url/key`; worker adds **subtask** + **focus** endpoints.
5. Preserve exam-3 look throughout (screenshot-diff gate; balances never jump; 484px embed-first).

---

## Recommended sequence

| Phase | Contents | Where | Why first |
|---|---|---|---|
| **A** | T0 health & data safety | live-now | Protects your current save *today*, independent of everything else |
| **B** | T1 bugs · T2 nav · T7 motion+palette foundation | proto-now | Cheap, fixes real bugs, validates the feel |
| **C** | T3 initiation mechanics (campfire/press/clock/promise/day-end) | proto-now | The actual point of the app — prototype it before the fold |
| **D** | T9 migration — carry B+C into the live game | the fold | Exam-3 preserved; your real save auto-migrated behind a backup |
| **E** | T4 Den · T5 buddies · T6 market · T8 juice · T7 art | live, post-fold | "Make the whole package sing" |

*(TickTick focus + subtask worker changes land with D/E.)*

## Build vs delegate
- **Opus (me):** all sequential edits to shared files (migration, integration, anything touching `quest.html`), plus synthesis + coherence.
- **Fable agents:** isolated/parallel research, self-contained modules, worktree experiments, further design passes.

## Open decisions for Antonio
1. **Start with Phase A** (health fixes to the live game) now? *(Recommended — protects your data regardless of the rest.)*
2. **Cozy pastel** as a 6th palette/mode, or keep the 5 dusk palettes richer-but-same?
3. **Nav shape:** the weave's 5-tab (home·map·pomo·buddies·shop) vs. the nav agent's leaner 3-tab — resolve at the fold.
