# Side Quest — Daily Streak Redesign: "THE HEARTH"
*Dedicated redesign pass per the owner's mandate ("make the daily streak truly satisfying + encouraging — mechanics AND game feel; never dread"). Builds on: gamefeel #5 (Real Streak + Ember Milestones), effectiveness #9 (rest ember) + F6/F9, weave §1.2 (🔥 becomes the real streak) + the Campfire boot screen, shop R7 (rest-ember charm, SETTLED), pomo redesign (the Den), art #0/#1 (bloom tokens, per-world `glow`), perf findings #8/#9/#14 (animation budget).*

**Grounded in code:** `quest.html:386/548` — the live "🔥 0/7" is `s.done+'/'+CAMP_ITEMS.length`, a task fraction wearing a flame emoji; killing this lie is non-negotiable at fold (weave §1.2). `quest-next.html:400–419` — the prototype's real streak: `AQ.streak`/`lastDay` in `aq_progress`, `dayStr()` (local calendar date), `bumpStreak()` called from `awardXP` (consecutive days, hard reset to 1 on a gap).

**The one-sentence thesis:** *the streak is not a number — it's the campfire.* Antonio doesn't "maintain a streak"; he **keeps a fire going** with the gang. Feeding it feels warm; missing a day banks it to embers; it never goes out with a bang, and the hearth remembers every day it ever burned. The 🔥 HUD chip and the Campfire boot screen become **two views of one flame**.

---

## RANKED IDEAS

### R1 — ONE FIRE: the campfire IS the streak (identity) ⭐ THE KEYSTONE
**What:** Unify three surfaces into a single source of truth:
1. **The Campfire scene** (boot screen, weave §3.5): the fire the gang sits around renders at the streak's current **tier** (R4). Higher streak = a taller, richer, more alive fire. Haven't qualified yet today = the fire sits as **banked glowing embers with a wisp of smoke** — an invitation, never an accusation (it's warm, not dead).
2. **The HUD 🔥 chip**: replaces the emoji with a **miniature of the exact same flame sprite** + the day number (`🔥12` → a 12×14 canvas flame + `12`). One `flameURL(tier, frame)` draw function, two scales. When the day's first qualifying action lands, both views flare together.
3. **The Den hearth** (pomo redesign decor): if owned, its fire mirrors the same tier glow — the streak literally warms the rest room.

**Rationale:** The owner approved the Campfire as the daily on-ramp and the aesthetic core is "a warm room you want to be in." A number decays into wallpaper; *a fire you tend with your friends* is a relationship. This also solves cozy-streak's hardest problem — how to show a missed day without shame — because fire has a built-in gentle vocabulary: lit → banked → embers → re-lit. No state in that vocabulary is "failure." It makes the whole game cohere: the boot screen, the HUD heartbeat, and the rest room all share one warm object.
**Implementation surface:** one canvas sprite fn (`flameURL(tier, frame)`, ~40–60 lines in the established `pomoMoonURL` idiom, pre-rendered to cached data-URLs per tier×2 frames at boot); `.cw-streak` chip becomes `<img>` + count; campfire scene param; Den hook reads the same tier.
**Risk:** Low-Med — it's mostly art + plumbing on the already-planned real streak. The one design risk: the morning "embers" state must read as *cozy potential*, not "you haven't done anything yet." Mitigate: embers still glow and pop tiny sparks; the gang is still there; copy is invitational ("feed the fire when you're ready").
**Perf / reduced-motion:** sprites cached; flicker = 2-frame swap on ONE shared ~600ms interval (piggyback gamefeel #7/#17's blink/ember timer — perf #14's codified discipline, zero new loops, zero rAF). Glow = baked into the sprite + one static CSS `drop-shadow(var(--bloom-gold))` (never an animated box-shadow — perf #8). Reduced-motion: freeze on the lit frame; all info carried by the static art.
**When:** Sprite + chip **PROTOTYPE-NOW** (the real streak already lives there); campfire/Den mirrors **AT-FOLD** with those screens.

---

### R2 — THE MECHANIC: study-days, the 5am rollover, and a day-log that can heal
**What — exact definition:**
- **A day is "lit" when ≥1 step is completed OR ≥1 pomodoro is credited** (settled). One shared entry point: `lightDay(dayStr)` called from (a) the step-completion pipeline, (b) `dropPomo()` / focus-record reconciliation, (c) — recommended, see below — the 2-minute "showed up" ember.
- **The study-day rolls over at 5:00 AM local, not midnight.** `studyDayStr(d) = dayStr(new Date(d - 5h))`. Antonio studies 2–5am; a 3am anatomy session is *tonight's* effort and must feed *tonight's* fire. Without this, a 2am step both "keeps" a day he never touched and silently burns yesterday. One constant (`DAY_ROLLOVER_HOUR = 5`), documented, applied everywhere a day is computed (streak, week strip, Tomorrow's Promise, golden-spin `paydayDay`, campfire picks cache) — **one clock for the whole game**, or the surfaces will disagree at 1am and nothing kills trust faster.
- **Kindling counts (recommended extension):** let the **2-minute "showed up" ember** (vision F2) also light the day. Argument: the streak's job is to defeat *avoidance*, not to measure output — output is already paid in XP/coins/tomatoes/stars. A streak that only counts finished work quietly teaches "opening the app and trying wasn't enough," which is the exact dread we're banning. This is a one-line extension of the settled definition; flagging it explicitly for owner sign-off. (No farm risk: it's Antonio's own app, and 2 real minutes on a lit step is the honest minimum.)
- **Data model — replace the single counter with a tiny day-log:** `aq_progress.hearth = { days:[...studyDayStrs, sorted, pruned to 370], best:0, lifetime:0, milestonesPaid:{}, celebratedDay:'' }`. Current streak is **derived** by a pure `calcStreak(days, embers, today)` walking back from today, applying R3's forgiveness rules. (~10 bytes/day, ≤4KB/year raw and prunes to ~370 entries — well inside perf #2's payload budget; serialize as one joined string if we're being precious.)
- **Why a log instead of `lastDay`:** TickTick focus records reconcile *late* (batch, idempotent-by-record-id — settled). A library session at 11pm synced at 9am must credit **yesterday** by its record start time — i.e., the streak must be **retroactively healable**. A `lastDay` counter can't do that; a day-log makes retro-credit, forgiveness, milestones, the week strip, and "hearth lifetime" all trivially derivable and idempotent (re-syncing a record re-sets a day that's already true — a no-op).
**Edge cases (decided):**
- *Timezone travel / clock changes:* always local clock. If the log ever contains a day "in the future" relative to now (flight west, DST), treat it as today — **every ambiguity resolves in Antonio's favor, silently.** Never reset on weirdness.
- *DST:* the 5am boundary makes both DST transitions (1–3am) land inside the same study-day. Free win.
- *Un-checking a step:* does NOT un-light a day (net-zero XP on toggle is already the rule; a day once lit stays lit — un-lighting would be the ledger punishing a correction).
- *"Call it a night 🫖":* pure ceremony — it never closes the streak-day early. If tonight is lit, the tea scene shows the fire banked down for sleep ("the fire's tucked in"); if not, tea is still tea. Rest is never conditional.
- *Multiple qualifying actions:* only the first triggers the kept-beat (R5); the rest are normal ceremonies.
**Rationale:** This is the entire mechanical spine; every ounce of feel sits on it being *correct at 3am*. The prototype's `bumpStreak()` is 90% right and one edge case (late-night + late-sync) away from feeling like a betrayal exactly once — and one unfair reset does more anxiety damage than every animation can repair.
**Implementation surface:** `quest-next.html:408–410` — `studyDayStr()` beside `dayStr()`; `bumpStreak()` → `lightDay()` + derived `calcStreak()` (~30 lines, pure, unit-testable in console); call sites: step pipeline, `dropPomo`/`reconcileFocus` (credit by record start time), showed-up ember. Migration: seed `hearth.days` from existing `lastDay`/`streak` (synthesize the run) so nobody's fire dies in the deploy.
**Risk:** Low — small pure functions; the discipline point is *one clock everywhere*.
**Perf:** trivial (derivation runs on boot + on light, not per frame).
**When:** **PROTOTYPE-NOW** (this is the foundation; everything else layers on).

---

### R3 — THE FORGIVENESS STACK: embers, the warm window, and the hearth that remembers ⭐ THE ANTI-DREAD CORE
**What — three layers, in order of application, so the fire never "dies with a bang":**
1. **Rest embers (settled — shop R7, honored as-is):** 🕯 charm, hold max 2, **1 earned free per 7 streak days**, extras 2★. A missed day quietly consumes one → the day counts as a 🌙 rest, streak unbroken. Toast on return: *"your ember kept the flame 🕯 — day 13."* Never a loss notice. The streak *earning its own insurance* every week is the elegant part: consistency literally manufactures its own grace.
2. **The warm window ("the fire's still warm"):** with no ember, a missed day **banks the fire, it doesn't kill it**. The flame drops to embers (visual), the number dims — and returning **the very next day** re-lights it at the same count (the missed day just doesn't increment; it shows as a small gap-ember in the week strip, never a blank X). Mechanically: the streak only truly breaks after **2+ consecutive unprotected missed days**. Combined with 2 held embers, a brutal exam-recovery week (3–4 dark days) survives — which is exactly med school.
3. **The Hearth (lifetime memory — the streak never hits a shaming zero):** when a run does end, it **composts into the hearth**: `best` (longest run) and `lifetime` (total lit days) never decrease and stay visible in the mascot sheet / View Stats ("🔥 best 21 · 58 days warmed all-time"). The HUD chip never renders "🔥 0" — a fresh state shows the small ember sprite with **no number at all** (an unlit count is simply not a fact the UI states). The next qualifying action starts a new fire at day 1 with full ceremony: *new fire, same hearth.*
**What we argue AGAINST (and why):**
- **Instant reset-to-zero (the prototype's current rule):** one bad day erasing 30 is the single most-cited reason people abandon habit apps — the punishment is wildly disproportionate to the lapse, and the rational response to a broken 30-day streak is to quit, not restart. It converts the streak from asset to hostage.
- **Unlimited/cheap purchasable freezes:** Duolingo-style monetized anxiety. If protection is trivially stockpiled the streak means nothing; if it must be *bought under threat* the shop becomes a protection racket. Cap 2, earn 1/week, price token (2★). The ember is a gift cadence, not a market.
- **"Repair" tasks / do-double-tomorrow:** penance framing. Debt mechanics are dread with extra steps.
- **Streak-at-risk countdowns / evening warnings:** a timer on the day IS the dread. The only "reminder" permitted is ambient: the morning campfire sitting at embers. No badges, no pulses, no notifications (standing restraint).
- **Halving instead of zeroing:** softer but still *arithmetic loss* — the user watches a number get cut. The warm window + hearth reframe is strictly kinder and easier to explain in one mascot line.
**Rationale:** The owner's mandate is verbatim "a missed day should feel gentle ('the fire's still warm'), not punishing." This stack makes that literal: layer 1 spends stored grace, layer 2 gives everyone one free stumble, layer 3 guarantees that even total loss preserves identity ("someone who has warmed 58 days") instead of resetting it. Consistency stays *meaningful* — runs still end, day counts still matter, embers are scarce — so it encourages without lying.
**Implementation surface:** all inside `calcStreak()` + one `consumeEmber(day)` write to `aq_charms.ember` (R7's field) + the R6 copy table. Week strip renders 🌙 for ember-days, dim-ember for warm-window days.
**Risk:** Low mechanics / **the risk is TONE** — the ember-consumed toast, the gap-day pip, and the new-fire copy must be written and reviewed against the restraint list (R9). One wrong word ("lost", "broke", "missed") re-poisons it.
**Perf:** nil. **When:** warm window + hearth **PROTOTYPE-NOW**; ember charm **AT-FOLD** (R7 lands with the banked ledger — until then the warm window alone carries forgiveness).

---

### R4 — THE FLAME TIERS: a fire that visibly grows with you
**What:** Six tiers, each a distinct hand-placed sprite (not a scale transform — pixel art must be *redrawn* to read at 12px):
| Days | Tier | Look (all on the dusky bg, warm against cool per art #5) |
|---|---|---|
| 1–2 | **kindling** | two crossed sticks, a thumb-sized flame, 1px spark |
| 3–6 | **campfire** | classic teardrop flame, warm gold core |
| 7–13 | **hearthfire** | taller two-tongue flame, baked outer halo (`--bloom-gold`) |
| 14–29 | **bonfire** | log base, tall flame + ONE slow rising ember mote |
| 30–99 | **beacon** | white-gold core, rim tinted the world's `--glow` hue (art #1 — the fire subtly wears each world's palette) |
| 100+ | **eternal flame** | prismatic tip (the icy→lavender→peach ramp art #7 reserves for peak moments) + a tiny 4-point star spark ~every 8s |
The same tier table drives the HUD chip, the campfire scene, and (scaled) the Den hearth. Tier-ups only ever *add* (halo, mote, tint) — the silhouette stays recognizably "your fire."
**Rationale:** Growth you can *see* is the cheapest long-horizon motivation there is, and it gives milestones (R5) a physical payoff: the ceremony's climax is your actual fire visibly becoming more. Tying tier 30+ to the per-world `glow` token stitches the streak into the palette system for free — the fire becomes another surface that makes worlds worth creating.
**Implementation surface:** the `flameURL(tier, frame)` fn from R1 with a 6-branch draw table (each ~10–15 rect ops); `streakTier(n)` lookup; chip class swap.
**Risk:** Low — art time only. Keep every tier readable at 12–14px in the HUD before adding detail.
**Perf / reduced-motion:** all frames pre-rendered at boot (12 cached data-URLs); the 100+ star spark rides the shared interval; ember mote = one WAAPI translate/opacity loop, counts inside perf #9's ambient node budget (it is the HUD's ONE permitted ambient node). Reduced-motion: static lit frame per tier — tiers still fully legible.
**When:** **PROTOTYPE-NOW** (gamefeel #5 already slates tier visuals for the prototype).

---

### R5 — THE "STREAK KEPT" BEAT: the day's first action gets the disproportionate warmth
**What:** Once per study-day, on the first qualifying action (vision F9, sharpened into a sequence):
1. The action's normal ceremony plays (check pop / tomato drop) —
2. a small **flame wisp arcs** from the action's row to the 🔥 chip (the coin-flight system, gamefeel #1, retargeted — same engine, flame-colored particle) —
3. the chip **flares**: scale-pop 1→1.3→1, one glint sweep, and if a tier boundary was crossed the sprite swaps *mid-flare* —
4. a soft toast under the HUD: *"🔥 day 12 — the fire's fed"* (small `.cw-banner` variant, ~1.6s) —
5. both mascots do the existing `cwCheer()`; one warm two-note sfx (wire the orphan `sfx-hi`, or the WebAudio synth path at low gain); one haptic tick.
Total ≤1.4s, never blocks input, never repeats that day. If the first action is a *reconciled overnight pomo* (day lit while app closed), the beat plays once on next open instead — "while you slept, the fire ate well 🍅."
On the campfire screen, the same event is grander for free: the scene's fire visibly flares from embers to lit. If R3's warm window is being used, the copy upgrades itself: *"the fire caught right back — day 12 🔥."*
**Rationale:** Front-loads the reward onto the rep that's hardest for a med student — the first one (effectiveness F9: "reward asymmetry should favor the step that broke the ice"). It also stacks naturally with the shop redesign's golden-spin mint (R2 there: first completed step lights the Payday Machine) — one glorious "the day has begun" compound moment, while staying mechanically independent (streak can be kept by a pomo; the golden spin needs a step — no coupling, no confusion).
**Implementation surface:** a `keptToday` guard (`hearth.celebratedDay`); `flameFly()` = `coinFly()` with a different sprite; `.chip-pop` class reuse; toast fn shared with R3/R6 copy.
**Risk:** Low — additive FX on existing hooks; guard against replay on re-render (same discipline as gamefeel #3).
**Perf / reduced-motion:** one-shot WAAPI, self-removing nodes, ≤6 particles. Reduced-motion: skip flight, keep the toast + a single opacity pulse on the chip (perf #8's sanctioned degrade).
**When:** **PROTOTYPE-NOW** (toast + flare); the compound campfire version **AT-FOLD**.

---

### R6 — WELCOME-BACK CHOREOGRAPHY: the return is a scene, not a status
**What:** A tiny copy-and-scene table keyed on the gap since the last lit day, rendered at the campfire (or as a HUD whisper pre-fold, gamefeel #6):
| Gap | Scene | Line (dumpling voice) |
|---|---|---|
| same day, re-open mid-streak | lit fire | *"day 4 🔥 · yesterday: 3 steps"* (F6 momentum framing — never zeros; rest days read "yesterday: rest 🌙") |
| 1 day, ember auto-spent | fire lit, candle stub beside it | *"your ember kept the flame 🕯"* |
| 1 day, warm window | embers, dumpling crouched blowing on them | *"still warm. one small thing and it catches."* → on action: the re-light whoosh |
| 2+ days (run ended) | mascots have laid FRESH KINDLING, neatly | *"we kept your spot. new fire tonight?"* — and after the first action: *"day 1 🔥 · hearth: 58 days warmed all-time"* |
| 7+ days away | same + the gang waves | *"missed you. tea first, then one tiny step?"* |
Hard rule inherited from the vision report: the end of a run is **never mentioned as an event**. No "you lost your 21-day streak" — the 21 lives on in `best`, quietly upgraded in the stats sheet. The mascots missed him; they were never disappointed.
**Rationale:** This is the owner's exact ask ("welcome back, the fire's still going" not "you lost your streak!") made into a spec. The return moment is where every other streak system does its damage; ours is where the relationship shows. Cheap: it's a lookup table and five sprite arrangements.
**Implementation surface:** `welcomeState(gap, emberUsed)` → scene variant + line pool (`WELCOME_SAY` extension, gamefeel #6's channel); fresh-kindling = one extra campfire sprite state.
**Risk:** Low. Copy review against R9 before ship — this table is the highest tone-stakes text in the game.
**Perf:** nil. **When:** whispers version **PROTOTYPE-NOW**; campfire scenes **AT-FOLD**.

---

### R7 — MILESTONE MINI-CEREMONIES + the cozy reward table
**What:** Milestones at **3 · 7 · 14 · 30 · 50 · 100, then every 50**. On the day's kept-beat when a milestone lands, it upgrades into a staged mini-ceremony (~3s, tap-to-skip, gamefeel #3's sequencing discipline — never simultaneous soup):
1. kept-beat plays → **400ms beat of quiet** → 2. screen dims slightly, camera-of-attention on the flame (HUD chip zooms subtly, or the campfire fire centers) → 3. **the fire audibly draws breath and GROWS a tier** — spark burst (one-shot confetti in flame hues, existing engine) → 4. banner: *"✦ seven days of fire ✦"* in the gold-gradient type (art #7) → 5. the reward **arcs to the wallet/room** (coin-flight system) → 6. mascots cheer, one line: *"warmest week we've had."*
**Rewards (sized against R9's economy audit — garnish, never income; total streak payout ≤ ~10% of weekly earnings so a missed day never feels *expensive*, which is the anti-dread constraint expressed in coins):**
| Day | Reward | Why this |
|---|---|---|
| 3 | 15c — *"a bundle of firewood"* | tiny, fast first taste |
| 7 | **1 rest ember 🕯** + 1★ | the streak forges its own insurance (R7-shop cadence made ceremonial) |
| 14 | **decor: hearth stones + firewood stack** for the Den (milestone-exclusive, not purchasable) | the streak furnishes rest — the game's thesis as a prize |
| 30 | **ember lantern** decor (animated glow) + 1 golden spin + 1★ | the room now *shows* a month of showing up |
| 50 | cosmetic: **ember scarf** (worn by any mascot) | streak identity you can wear |
| 100 | **THE ETERNAL FLAME** — permanent prismatic campfire skin + a one-time star-shower moment + **1 Shooting-Star wish 🌠 (= a free gacha hatch)** | the game's biggest earned moment; the wish links streak → buddies exactly once, no farmable pipe |
| 150+ | 1★ + a new mascot line each | quiet, sustainable |
**Anti-farm / anti-inflation rules:** each milestone pays **once per lifetime** (`hearth.milestonesPaid`), keyed to lifetime-best — resetting and re-climbing replays a lighter "encore" ceremony (the fire still grows; the wallet doesn't). Decor/cosmetic rewards are milestone-exclusive and never sold (coordinates with shop R4/R6 — no catalog overlap, no coin-value equivalence to undercut sinks). The 100-day wish is the only gacha touchpoint (respects shop R3's "one RNG door" rule).
**Rationale:** Milestones need to feel like *the fire's* birthdays, not payouts — hence rewards that live in the world (decor, scarf, skin) over currency. The economy stays sound: ~25c + ~4★-equivalent spread over 100 days is noise against ~180c/wk income, so the streak motivates by meaning, not money — which is precisely what keeps a broken run from feeling like a financial loss.
**Implementation surface:** milestone check inside `lightDay()`; ceremony = the quest-complete sequencer (gamefeel #3) with a flame skin; rewards write through the banked ledger (weave §1.3); 2 new decor draw fns + 1 hat branch + campfire skin flag.
**Risk:** Med — the most *new content* in this spec (2 decor sprites, 1 cosmetic, 1 skin, ceremony staging). Scope guard: ship 3/7/14 first; 30/50/100 art can trail (the day-100 player is 3 months away by definition).
**Perf / reduced-motion:** one-shot burst within existing confetti budget; dim = one overlay div opacity. Reduced-motion: banner + reward + static tier-up frame, no burst, no zoom.
**When:** 3/7/14 + ceremony **PROTOTYPE-NOW** (visuals were already slated there); 30+ art + decor **AT-FOLD** (needs Den decor + ledger).

---

### R8 — THE HEARTH SURFACES: week strip, stats, and idle fire-tending
**What:** The streak's supporting cast, kept quiet:
- **Week strip pips** (campfire, effectiveness #2): lit days = tiny flame dot; ember-saved days = 🌙; warm-window gap = dim ember; future = plain. **No empty-outlined boxes for missed past days** — history is rendered as what happened (warmth) never as what didn't (holes).
- **Stats/mascot sheet:** *"🔥 12 now · best 21 · 58 days warmed"* — the hearth's lifetime line replaces the bare `AQ.streak` figure (`quest-next.html:812`).
- **Idle fire-tending (pure charm):** at the campfire, on the shared idle timer: the dumpling occasionally pokes the fire with a stick (2-frame), the tomato warms its hands, a 30+ fire pops a spark that makes the equipped buddy blink. Zero mechanics — this is what makes the fire feel *tended by the family*, so keeping it feels like joining them rather than obeying a counter.
- **Tea-scene tie:** "call it a night 🫖" on a lit day shows the fire banked for sleep + *"the fire's tucked in."* Rest is part of the fire's life, not its enemy.
**Rationale:** Cohesion (owner's whole-package lens): the streak should be *felt* in five places and *managed* in zero. Every surface here reads state; none demand action.
**Implementation surface:** week-strip renderer branch; stats line; 3 tiny idle frames on existing timers; tea-scene variant flag.
**Risk:** Low. **Perf:** idle frames ride existing shared timers (perf #14); node budget unchanged. Reduced-motion: idle animations off, static poses.
**When:** stats line + strip rules **PROTOTYPE-NOW**; idle tending + tea tie **AT-FOLD**.

---

## THE RESTRAINT LIST — what the streak must NEVER do
*(binding; review all copy/UI against this before ship)*
1. **Never red.** Flame hues, gold, world `glow`, moon-blue for rests. The danger rose is banned from every streak surface (same lint rule as the Clock's).
2. **Never the words** "lost / broke / failed / missed your streak," never "streak at risk," never a countdown to midnight (or to 5am). The end of a run is never announced.
3. **Never renders 🔥 0.** Unlit = ember sprite, no number. Zero is not a fact this UI states.
4. **Never notifies, badges, or pulses** to demand a visit. The only reminder is the morning campfire sitting at embers — ambient, in-app, silent.
5. **Never gates content or core features** behind streak length. Tiers change *the fire*, nothing else.
6. **Never pays enough that a break is a financial event** (≤ ~10% of weekly income across all milestones; forgiveness is never purchasable in bulk).
7. **Never shows history as holes** — no empty calendar cells, no X marks, no gap-shaming heatmaps.
8. **Never resets on ambiguity.** Timezone jumps, DST, late syncs, clock skew: every tie resolves in Antonio's favor, silently, forever.
9. **Never conditions rest.** Tea, the Den, the tea scene work identically on a dark day. "Effort earns rest" is a gift-framing, not a lock.
10. **Never lets a mascot be disappointed.** They missed him. That is the entire emotional range permitted for absence.

---

## PROTOTYPE-NOW vs AT-FOLD (build order)
**Prototype-now (quest-next.html, this week):**
1. R2 mechanic: `studyDayStr` (5am), `hearth.days` log, `calcStreak`, retro-credit path, migration from `lastDay`. *(foundation)*
2. R3 warm window + hearth memory (ember charm stubs until R7-shop lands).
3. R1/R4 flame sprite + tiers + HUD chip swap.
4. R5 kept-beat (toast + flare + guard).
5. R7 milestones 3/7/14 + ceremony sequencer.
6. R8 stats line + week-strip pip rules. R6 whisper-table copy (reviewed against restraints).

**At-fold (with the migration / campfire / Den / ledger):**
7. Kill the `done/21` lie in `quest.html:548` — the chip is the real flame from day one of the fold (weave: non-negotiable).
8. R1 campfire-scene fire + Den hearth mirror; R6 full return scenes; R8 idle tending + tea tie.
9. R3 rest-ember charm wiring (shop R7); R7 milestone 30/50/100 art, decor drops, golden-spin + wish hooks; `dropPomo`/focus-reconcile → `lightDay` with record-start-time crediting.

**Cross-report coordination locks:** ember charm spec = shop R7 verbatim (2★, max 2, 1 free per 7 days) · milestone decor is exclusive, never in the R4 catalog · the 100-day wish is the slot/gacha system's only new RNG entry · golden-spin day flag adopts the same 5am `studyDayStr` · the campfire picker/promise day-key adopts it too.

**The one test (inherited from the vision report):** does the streak change what happens in the 10 seconds after Antonio opens the app at 2am on July 3rd? Answer, by design: he sees a warm fire that's glad he came, one small card, and the knowledge that *anything* — even two minutes — feeds it. That's the whole machine.
