# Side Quest — TickTick Habits as Daily Quests: "THE FIRE RING"
*Fable creative-liberty pass per the owner's mandate: gamify TickTick habits as dailies with bidirectional check-in sync — and the make-or-break constraint that this must feel like a warm daily RITUAL, never another task pile. Builds on: redesign_streak.md (the Hearth, `lightDay`, 5am studyDay, restraints), effectiveness_vision.md #1 (the Campfire boot surface), reward_animations.md (tier ladder — dailies are T0), user_steer_decisions (coins-from-work, XP-only firewall, never-shame, one-identity-by-TickTick-id, idempotent minting).*

**The one-sentence thesis:** *dailies are not a list — they're the stones around the fire.* Antonio doesn't "do his habits"; he **tends the ring** — a small circle of hearthstones around the campfire, one per TickTick habit, each lit with a single touch. Quests are the journey (the map, the worlds, the work); the ring is the *home ritual* — the thing you do with your hands while the kettle warms. It lives entirely inside the campfire scene, never on the map, never in any list, never counted against him.

**Why a ring and not cards/list/quest:** the anti-overload constraint is structural, not tonal. Any representation that shares a *shape* with tasks (rows, cards, checkboxes, fractions) will be *read* as tasks — more workload, same pile. A ring of stones shares no shape with work: it has no order, no scroll, no "remaining" count, no text unless you ask. It is glanceable in one saccade, ignorable without guilt (unlit stones are just… stones — a fire ring is MADE of unlit stones; that's what a fire ring looks like), and it makes the daily ritual *spatial and tactile* instead of clerical. It also solves bloat by geometry: a ring visually caps itself.

---

## RANKED IDEAS (by delight-per-effort)

### D1 — THE FIRE RING: a circle of hearthstones around the campfire ⭐ THE KEYSTONE
**What:** In the campfire scene (the boot surface), the fire gains a ring of small pixel hearthstones — one per active TickTick habit, max ~7 visible (D8 handles overflow). Each stone is a tiny sprite (~14×12px) with the habit's icon/emoji etched on it, sitting in the grass at the fire's edge, slightly irregular spacing (hand-placed feel, not a UI grid). States:
- **Unlit** — cool dusk-grey stone, faint etching. Neutral. NOT hollow, NOT outlined, NOT dimmed-as-in-disabled. A resting stone.
- **Lit** — the etching glows warm gold; a 1px flame-lick flickers on top (rides the shared ~600ms flicker interval — zero new timers); a wisp of glow connects it faintly toward the fire.
- **Tap to light** — the whole ritual is ONE TAP per stone (D4 has the beat). Long-press → a small name bubble ("💧 water · 5 of 8" for count habits) + un-light option. No other UI.
- **Tap a lit stone** → the mascot-whisper bubble confirms it warmly ("already glowing ✦") — lit stones don't toggle off on a stray tap (un-light lives behind long-press; accidental un-checks are worse than accidental double-taps).

Where it lives — and where it *doesn't*: **the campfire scene ONLY.** Dailies never appear on the map, never in the hub, never in quest lists, never in Auto Today, never among the ≤3 campfire step cards. The ring sits *below/around* the fire; the step cards lean on the log *beside* it. Work and ritual share the scene but never a container. Since the campfire is the boot screen and always one tap away, the ring needs no nav entry, no badge, no icon — it's simply *there*, part of home, the way a real fire ring is.

**Rationale:** This is the anti-overload answer as architecture. (1) One surface, zero navigation, zero new screens to "keep up with." (2) The ring reuses the streak redesign's emotional vocabulary — fire has no failure states, only lit/unlit/warm — so a fully-dark ring in the morning reads as *morning*, not as debt. (3) It deepens the Campfire's job (the warm first frame) instead of competing with it: on boot Antonio sees the gang, the fire at its streak tier, ≤3 step cards, and his little ring of stones — the whole day in one warm glance. (4) Cohesion: the streak is the fire, the dailies are its stones, the rest room has its hearth — one thermal metaphor across the whole game.
**Implementation surface:** `stoneURL(icon, state, frame)` canvas sprite fn in the established `pomoMoonURL`/`flameURL` idiom, pre-rendered per habit×3 states at boot (data-URL cache); ring layout = one arc-placement fn in the campfire render; tap/long-press handlers; local store `aq_dailies` (D3). No new views.
**Risk:** Low-Med. The one design risk: with 0 habits or during API outage the ring must not render as a broken/empty feature — 0 habits = no ring at all (the campfire is complete without it; the feature is invisible until habits exist). Etchings must stay readable at 14px — fall back to a colored rune-dot if an emoji rasterizes muddy.
**Perf:** sprites cached; flicker piggybacks the shared blink/ember interval (perf discipline: zero new loops, zero rAF); glow baked into sprites + static drop-shadow, never animated box-shadow. Reduced-motion: static lit frame; state fully legible without motion.
**When:** **PROTOTYPE-NOW** (renders from a cached/mock habit list even before sync lands; the campfire scene is already slated).

---

### D2 — THE SYNC SPINE: bidirectional check-ins, idempotent by (habitId, day) ⭐ THE FOUNDATION
**What — exact model (same worker channel as tasks/focus):**
- **Habit identity = TickTick habit id.** Side Quest NEVER creates/edits/deletes habits — TickTick owns habit CRUD entirely; Side Quest renders and checks in. (Mirrors the Auto-Today one-identity rule; kills any "manage habits in two places" bookkeeping — standing rule: no manual bookkeeping.)
- **Local store:** `aq_dailies = { habits:[{id, name, icon, type, goal, step, repeatDays, streak, totalCheckins}], checkins:{ [studyDay]: {[habitId]: value} }, paid:{ [studyDay]: [habitId,…] }, outbox:[{habitId, day, value, ts}], lastSync }` — pruned to ~40 days of checkins/paid (the ring only ever needs today + the stones' age counters).
- **Side Quest → TickTick (optimistic):** tap a stone → light it locally *instantly* (the ritual never waits on a network), write `checkins[today][habitId]`, mint the reward if `paid[today]` lacks the id, push `{habitId, day, value}` to the outbox → worker flushes via `upsert_habit_checkins` (fire-and-forget, retry with backoff). Un-light (long-press) → local reverse + upsert value 0/uncomplete; XP net-zero on toggle (the step rule, inherited).
- **TickTick → Side Quest (reconcile on open):** on boot / campfire focus (throttled ≥5 min), worker pulls `list_habits` + `get_habit_checkins` (window: since `lastSync`, minimum today+yesterday to cover the 5am boundary). Any check-in not in local state → light the stone AND run the **found-lit reveal** (D6), minting through the same `paid` ledger — **rewards mint once per (habitId, studyDay), ever, regardless of which side checked in or how many times either side syncs.** Re-syncing an already-paid check-in is a no-op by construction.
- **Conflict rule: TickTick wins.** If TickTick shows unchecked where local shows lit (Antonio un-checked on his phone), the stone dims silently on next reconcile and the day's XP for it reverses silently — no toast, no message ever announces a reversal (never-shame extends to the ledger).
- **The day boundary:** the ring resets at the **same 5am `studyDayStr` as the Hearth** — one clock for the whole game (the streak redesign's non-negotiable). Check-ins written to TickTick carry the *studyDay's* date, so a 2am skincare check counts as tonight's ritual in both the game and (displayed one calendar day earlier) in TickTick. If TickTick exposes a day-start user preference via `get_user_preference`, adopt it when it matches; otherwise 5am stands. ⚠ *Flag for owner sign-off: the 2am-checkin-shows-as-yesterday-in-TickTick tradeoff — consistency with the Hearth clock is worth it, but it's visible on the TickTick side.*
- **Degraded mode (API down / offline):** the ring keeps working on cache — stones light, rituals play, rewards mint, everything queues in the outbox. Stale habit *list* renders from cache (habits added in TickTick appear next successful sync). The ONLY degradation cue permitted: a tiny sleepy cloud drifting near the ring's edge (ambient, unlabeled). Never an error banner, never a spinner on the campfire, never a blocked tap. On reconnect the outbox flushes oldest-first; duplicate flushes are safe (upsert semantics + the paid ledger).
**Rationale:** Everything above is the Auto-Today/focus-reconcile playbook re-applied — one identity, reference-don't-copy, idempotent minting keyed to a stable id+day, batch reconcile on open, every ambiguity resolved in Antonio's favor silently. The optimistic-local + outbox shape is what makes the *ritual* reliable at 2am on hostel wifi, which is where trust is won or lost.
**Implementation surface:** worker: 3 endpoints proxied (`list_habits`, `get_habit_checkins`, `upsert_habit_checkins`) beside the existing task/focus routes; client: `syncDailies()` (~60 lines), outbox flusher (~20), `mintDaily(habitId, day)` guard (~10).
**Risk:** Med — the usual sync edges: the 5am date mapping (test the 4:59am tap), partial count-habit values overwritten by a lower TickTick value (rule: take the MAX of the two sides for count habits — never regress progress on a sync), and habit archived-in-TickTick mid-day (stone vanishes next boot, paid ledger keeps the day's mint — no clawback).
**Perf:** one pull per open (throttled), one small localStorage write per tap. Nil render cost.
**When:** local model + optimistic path **PROTOTYPE-NOW** (mock worker); real worker routes **PROTOTYPE-NOW too if the channel's live** (it's the same worker as tasks/focus); conflict/pref polish **AT-FOLD**.

---

### D3 — HABIT SHAPES: how TickTick habit types become stones
**What — the mapping table:**
| TickTick habit type | Stone behavior |
|---|---|
| **Boolean / streak habit** ("meditate", "skincare") | classic stone: one tap → lit. Done. |
| **Count habit** (goal N/day, e.g. "water ×8") | the etching fills like a tiny radial meter as taps accumulate (each tap = +1 step, or the habit's configured step); a soft tick per tap; at goal the stone LIGHTS with the full ritual (D4). Long-press → "set amount" stepper for bulk entry ("just drank 3"). Partial progress at day's end is simply… a partially warm stone. It cools overnight without comment. Partial values DO sync (upsert with value) so TickTick's log stays true. |
| **Scheduled days** (repeatRule: Mon/Wed/Fri) | the stone only *joins the ring on its days*. Off-days it's absent — the ring is physically smaller on light days, which makes light days FEEL light (anti-overload made visible). Never a greyed "not today" placeholder. |
| **X-per-week habits** ("gym ×3/wk") | the stone wears a tiny leaf garland showing weekly progress (1 leaf per check-in, max = goal). Lightable ANY day; once the weekly goal is met the garland completes and the stone becomes a **resting stone** — visibly content (soft moss-green glow) for the rest of the week, still tappable for bonus check-ins (they sync; they re-run the small ritual; no extra reward — the `paid` ledger is per-day so an extra gym day still pays its day's XP, which is correct: he did the thing). |
| **Paused/archived habits** | not rendered. Ever. No graveyard. |
**Rationale:** Every TickTick habit shape maps to a *physical* stone behavior with zero new UI chrome — no steppers-by-default, no progress bars, no per-habit config in Side Quest. The scheduled-days rule is quietly the best anti-overload mechanic in the whole design: the system itself makes some mornings smaller.
**Implementation surface:** type/goal/step/repeatRule come free from `list_habits`; radial-fill = one extra `stoneURL` param (8 fill frames, cached); garland = 1–3px leaf pixels on the sprite.
**Risk:** Low — rendering variants. One edge: habits with goal-unit quirks (e.g. 2000ml water in 250ml steps) — always display in *taps toward goal*, never raw units, unless long-press.
**Perf:** all pre-rendered frames. **When:** boolean + count **PROTOTYPE-NOW**; weekly garland + scheduled-days **AT-FOLD** (needs repeatRule parsing).

---

### D4 — THE TENDING BEAT: one tap, one twig, one crackle (the feel) ⭐ THE RITUAL ITSELF
**What — the micro-ceremony, T0 on the established tier ladder (quieter than a step-complete, ALWAYS):**
1. **pointerdown** — the stone squashes to `scale(.9)` (the coiled spring, 60ms) + `cwBuzz(10)`.
2. **release** — the etching *catches*: a 2-frame flame-lick blooms on the stone; simultaneously **a tiny twig arcs from the stone into the central fire** (the coinFly engine with a 4px twig sprite, ~380ms, slight tumble).
3. **the fire answers** — on twig-landing the campfire does ONE appreciative crackle: a single spark pops, the flame does a 1-frame flare (never a burst, never confetti — those cues belong to work tiers). Sound: the soft `xp` sample at −5 semitones, low gain — a warm *fwp*. The XP float drifts up small ("+3") from the fire, not the stone — *the fire pays you*, feeding the metaphor.
4. **settle** — the stone's glow eases to its resting lit state (500ms CSS transition). Total ≤700ms, never blocks the next tap.
- **Count habits:** steps 1–2 only per tap (tick + partial fill, pitch rising +1 semitone per tap toward goal — a little ascending scale you *complete*); the twig-and-crackle plays once, at goal. The last tap of a water habit literally resolves the melody.
- **The last stone (all lit):** NO banner, NO fanfare, NO "all dailies complete!" — instead the quietest, best moment in the game: **the ring hums** — one slow ripple of warm light travels around the circle (staggered 60ms glow pulses, one lap), the fire exhales a single taller flame frame, 2–3 fireflies rise from the grass, and a mascot murmurs once: *"the ring's warm tonight."* ~1.8s, ambient, unrepeatable that day. A full ring is an *atmosphere*, not an achievement — this is the never-shame inverse: if completing-all is a fanfare, missing-one is a failure; if completing-all is a warmer evening, missing-one is just a slightly cooler one.
- **Evening tie:** "call it a night 🫖" on a day with lit stones shows them as tiny lanterns glowing in the tea scene — *"the stones will hold the warmth till morning."* Unlit stones simply aren't mentioned. Tomorrow's Promise remains about steps only — the ring never generates promises, asks, or reminders.
**Rationale:** The ritual IS the reward. The prompt's core ask — "warm, satisfying, motivating to keep" — is delivered by making the *physical loop* (tap → twig → crackle → glow) intrinsically pleasing at the exact intensity that survives 5×/day×365. The tier-ladder discipline (dailies stay T0 forever) is what keeps the ritual from bloating into ceremony fatigue, and keeps step-completes feeling bigger — work must always out-celebrate habits.
**Implementation surface:** reuses `coinFly` (twig sprite), `cwBuzz`, the pitch-ladder `cwSfx` arg, shared flicker timer; new: twig sprite (~6 rect ops), ring-ripple stagger (~15 lines WAAPI), `ringHummedDay` guard.
**Risk:** Low — additive FX on D1's handlers; replay-guard the hum (same discipline as every ceremony).
**Perf:** one-shot WAAPI, self-removing, ≤4 nodes per tap; the hum is ≤10 staggered opacity pulses. Reduced-motion: instant lit state + the sound + XP float; hum becomes a single simultaneous glow swell.
**When:** **PROTOTYPE-NOW** — this is the product. Ship D1+D4 together or not at all.

---

### D5 — THE ECONOMY SEAT: XP-only kindling, the Hearth stays study-pure
**What — exact payout rules:**
- **Each daily pays +3 XP, once per (habitId, studyDay).** XP ONLY — **never coins, never stars, never tomatoes.** Rationale is the owner's own firewall extended: *coins come from work* (steps, 5/10/20); habits are self-care, not work product, and pricing them in coins would (a) inflate against every sink and (b) quietly convert self-care into wage labor, which is the task-pile feeling with extra steps. XP is the game's "you showed up to your life" meter and already has the firewalled precedent (pomo bonus XP). +3 sits deliberately *below* the easiest step (5) so no habit ever rivals a study step.
- **Dailies do NOT light the Hearth.** The streak's definition is locked (≥1 step / ≥1 pomo / 2-min ember) and it means *the study fire*. Letting "drank water" keep a 30-day study streak alive would make the streak stop meaning anything — and a streak that lies is worse than a streak that ends. The ring instead has its **own** ambient consequence: a day with ≥1 lit stone renders the campfire grass slightly dewier/warmer that evening; a fully-lit ring = the hum + fireflies (D4). Atmosphere, never arithmetic.
  - ⚠ *One flagged exception for owner sign-off (default OFF, at-fold):* a habit Antonio marks as study-work in TickTick (e.g. an "Anki reviews" habit — he almost certainly has one) could count as Hearth kindling like the 2-min ember. Honest — daily Anki IS studying — but it's an edit to a locked rule, so it ships only as an opt-in per-habit toggle if the owner wants it.
- **No completion bonuses, no weekly chests, no all-7 multipliers.** Any "complete the set" payout mathematically penalizes the missed one — that's shame with a bow on it. The set-completion reward is the hum, and the hum has no cash value.
- **Milestone warmth (per-habit, paid in permanence, not currency):** at a habit's TickTick streak 7 / 30 / 100 the STONE itself upgrades — moss at 7, tiny white flowers at 30, a gold vein at 100 (D7). Once-per-lifetime per habit, keyed to TickTick's own streak field (no shadow bookkeeping). A long-tended habit becomes a visibly beautiful stone in his ring — identity, not income. Zero inflation surface.
**Rationale:** Sized so the entire ring at full daily use ≈ 21 XP/day ≈ one hard step — meaningful on the level ladder over months (levels DO pay golden spins, so there's a slow, self-balanced trickle from ritual → wheel → fun, laundered through the level system exactly like pomo XP — precedented and capped by wheel odds), yet invisible against the ~65XP/quest work economy. The streak firewall keeps every locked system locked.
**Implementation surface:** `mintDaily()` writes through `awardXP(+3)`; stone-upgrade check reads `habit.streak` from `list_habits` at sync; 3 sprite variants per upgrade tier.
**Risk:** Low — the design risk was inflation and it's structurally zero. Watch only: levels-from-ring-XP pacing feels right (tunable single constant).
**Perf:** nil. **When:** +3 XP + firewall **PROTOTYPE-NOW**; stone milestones **AT-FOLD** (needs stable streak field from sync).

---

### D6 — THE FOUND-LIT REVEAL: TickTick-side check-ins greet you warmly
**What:** When reconcile (D2) discovers check-ins made in TickTick while Side Quest was closed, the campfire renders those stones **already lit** — and plays a one-time compressed reveal on arrival: each found stone does a small glint-sweep in sequence (120ms apart), its twig arcs to the fire (the D4 beat at half scale, batched — max 4 twigs then a single "+N" float), the XP floats pay out, and one whisper: *"you kept the ring going while you were out ✦"*. If the found check-ins complete the ring, the hum plays now. Total ≤2s for any number of habits, never modal, never repeated (guarded by the paid ledger — the reveal IS the minting moment).
**Rationale:** This is the prompt's "completing it in TickTick shows the rewards when the owner opens dailies" made into a *scene*. The emotional design matters: the game noticing work done elsewhere and paying it warmly teaches "Side Quest and TickTick are one world" — which is the entire sync thesis (same lesson the overnight-pomo reconcile beat teaches: "while you slept, the fire ate well"). Batching + caps keep a heavy TickTick day from becoming a hailstorm (the tomato-rain rule, reapplied).
**Implementation surface:** the reveal is D4's beat driven by a queue instead of a tap (~25 lines); whisper line in the WELCOME_SAY pool.
**Risk:** Low — one guard: reveals must queue AFTER the welcome-back choreography, never overlap it (celebration-queue discipline).
**Perf:** batched one-shots, ≤4 flights. Reduced-motion: stones simply render lit + one toast + instant XP.
**When:** **PROTOTYPE-NOW** with the sync spine (it's the sync's visible payoff — shipping sync without this wastes the moment).

---

### D7 — STONES THAT AGE: the ring as a keepsake
**What:** Beyond D5's milestone upgrades — stones accumulate *visible history*: subtle patina by `totalCheckins` (a stone tended 200 times sits deeper in the grass, slightly smoother, warmer base hue). Long-press shows the habit's own little card: name, TickTick streak as a row of flame-pips (never a calendar, never gaps), best streak, "tended 214 times." A habit *retired* in TickTick after long service (archived with 100+ checkins) leaves — once, with permission via a gentle prompt — a small **marker stone** by the Den's hearth: the ring remembers what he used to tend. Pure keepsake, mirrors the preserve-jar philosophy (mementos of cumulative care, never a grind).
**Rationale:** The motivation-without-nagging engine. Nagging pushes from behind; a beautiful aging stone pulls from ahead — you keep the habit because the stone is *yours* and it's becoming something. This is the same psychology as the Hearth's lifetime memory ("58 days warmed") applied per-habit, and it costs only sprite variants.
**Implementation surface:** patina = 2–3 extra `stoneURL` tiers keyed to totalCheckins; detail card = one small sheet reusing the mascot-sheet pattern; marker stone = 1 Den decor sprite + a flag.
**Risk:** Low. The retirement marker needs the gentle-prompt copy reviewed against restraints (it must feel like honoring, not eulogizing).
**Perf:** nil (cached sprites). **When:** patina + detail card **AT-FOLD**; marker stone **AT-FOLD, optional** (cut first if scope presses).

---

### D8 — THE SMALL RING RULE: curation, overflow, and staying optional forever
**What — the anti-overload guardrails as mechanics:**
- **Soft cap 7 stones.** If TickTick has more active habits than fit, the ring shows the 7 scheduled-today with lowest friction ordering (due today by repeatRule first, then most-tended); the rest live in a **pebble pouch** — a tiny bag sprite at the ring's edge; tap → a small sheet to swap which habits sit in the ring (choice persisted). Side Quest never says "you have 12 habits"; it says "the ring holds seven."
- **The ring is read-only about ambition.** No "add a habit" button in Side Quest (TickTick owns creation); no suggested habits; no habit templates. The game never proposes new obligations — it only warms existing ones.
- **No entry in stats that can shame:** View Stats may show *"stones tended: 214 all-time"* (cumulative, monotonic) — never per-day completion %, never a weekly heatmap, never "best day."
- **The morning frame:** at boot, unlit stones render with dew glints (pretty, expectant) — the morning ring is a *fresh* thing, not an empty checklist. Copy above the campfire never references the ring ("two small things today, then you're free" stays about steps).
- **Absolute silence policy:** the ring never notifies, never badges the app icon, never appears in Tomorrow's Promise, never generates campfire cards, never blocks or delays "call it a night." A week of dark stones changes nothing but the stones.
**Rationale:** Each rule closes a specific relapse path back to "task pile": overflow (cap+pouch), scope creep (read-only), metric anxiety (monotonic stats only), morning dread (dew framing), and ambient pressure (silence). Written as mechanics, not vibes, so future features can be linted against them.
**Implementation surface:** pick-7 ordering fn; pouch sheet (reuses the pick-screen list pattern, checkbox-less — tap to swap); dew frame variant.
**Risk:** Low. **Perf:** nil. **When:** cap + silence rules **PROTOTYPE-NOW** (they're constraints, cheapest on day one); pouch sheet **AT-FOLD** (only needed once habit count demands it).

---

## THE RESTRAINT LIST — what dailies must NEVER do
*(binding; extends the Hearth restraints; review all ring copy/UI against both)*
1. **Never a list, never rows, never checkboxes.** The moment a daily looks like a task, it is one.
2. **Never a fraction.** No "3/5 dailies," no ring completion %, no per-day counts anywhere — the only numbers permitted are cumulative and monotonic (tended-all-time, habit streaks).
3. **Never red, never hollow.** Unlit = a resting stone in dusk colors; missed history is never rendered (no gap calendars, no grey X pips).
4. **Never notifies, reminds, or asks.** Not at morning, not at 11pm, not via Tomorrow's Promise, not via mascot copy. The only invitation is the ring existing.
5. **Never pays coins, stars, or tomatoes.** XP only (+3), once per habit-day, idempotent. No set-completion bonuses of any kind.
6. **Never touches the Hearth.** Dailies don't light the study day, don't extend the streak, don't consume embers. (The Anki opt-in is the sole flagged exception, default off, owner sign-off required.)
7. **Never louder than work.** Dailies live at T0 forever — no banners, no bursts, no fanfare cues; the full-ring hum has no banner and no currency.
8. **Never creates, suggests, or gamifies NEW habits.** TickTick owns ambition; Side Quest warms what exists.
9. **Never announces a reversal, conflict, or sync failure.** TickTick-wins corrections are silent; degraded mode is a sleepy cloud, not an error state.
10. **Never grows past the ring.** No dailies screen, no dailies nav dot, no dailies section in the hub. One surface, at the fire, forever.

---

## PROTOTYPE-NOW vs AT-FOLD (build order)
**Prototype-now (with the campfire scene work already slated):**
1. D2 local model: `aq_dailies` store, `mintDaily` idempotent guard, optimistic tap path, outbox stub (+ real worker routes if the habit channel is confirmed live — it's the same worker as tasks/focus).
2. D1 ring render: `stoneURL` sprites, arc layout, tap/long-press, zero-habits = no ring.
3. D4 tending beat: squash → twig → crackle → glow; count-habit pitch ladder; the last-stone hum.
4. D5 +3 XP wiring through `awardXP` + the firewall (no coins path exists to close — keep it that way).
5. D6 found-lit reveal riding the first reconcile.
6. D8 cap-7 + the silence rules (constraints cost nothing early and everything late).
7. D3 boolean + count stones.

**At-fold:**
8. D3 scheduled-days + weekly-garland stones (repeatRule parsing); D2 conflict polish, `get_user_preference` day-start check, max-rule for count values.
9. D5 stone milestones (moss/flowers/gold vein); D7 patina, detail card, retirement marker; D8 pebble pouch.
10. Tea-scene lantern tie + dew morning frame; the flagged Anki-lights-the-Hearth opt-in (owner decision).

**Cross-report coordination locks:** ring day-key = the Hearth's 5am `studyDayStr` (one clock) · dailies occupy T0 in the reward tier ladder and never escalate · twig flight reuses `coinFly` · reveals queue behind welcome-back choreography · the ring joins the campfire scene's existing shared flicker/idle timers (no new loops) · stats line lives beside the Hearth's lifetime line, cumulative-only.

**The one test (inherited):** what happens in the 10 seconds after Antonio opens the app at 7am on July 3rd, exam in two days, having done nothing yet? By design: a warm fire at his streak tier, three cards on the log, and seven quiet stones with dew on them — and if he does nothing but tap the water stone and leave, the fire crackled once, something paid him 3 XP for taking care of himself, and *nothing in the entire scene said the word "should."* That's the ritual.
