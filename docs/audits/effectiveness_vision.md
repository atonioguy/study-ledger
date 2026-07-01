# Side Quest — Effectiveness Vision
*Initiation · Planning · Digestion — a behavioral-design pass, with explicit divergences from PLAN.md*

**Grounding:** `PLAN.md` (full read), `quest.html` (live campaign code + `cwToggle`/`buildCampaign`), `quest-next.html` (worlds/map/builder/pick/HUD + the baked real TickTick snapshot), plus the sibling reports (migration audits, gamefeel, navigation). This report deliberately does NOT re-cover juice/FX (gamefeel report) or tap-count plumbing (navigation report). It covers the *behavioral engine*: what makes Antonio press go, plan without dread, and feel a scary week as doable.

**A concrete lens for everything below — Antonio's actual next 7 days (from the baked snapshot; today is Jul 1):**
peer reply #1 + Big Interview setup (today) · colony reading #1 (Jul 2) · record 10 mock-interview answers (Jul 2) · peer reply #2 (Jul 3) · self-quiz + weak spots (Jul 4) · colony reading #2 (Jul 4) · light review (Jul 5) · **Unit 3 EXAM window Jul 4–6** · cheese write-up (Jul 6) · Assignment 3A submit (Jul 6) · discussion follow-up (Jul 5) — then MCAT FL2 (Jul 11) and the 100-pt Winogradsky finale (Jul 18) looming behind it.
That is ~13 real actions across 6 days. **Digested, it's ~2 small things a day plus one exam.** Undigested, it's a wall. The app's whole job is to be the difference between those two sentences.

---

## 0. The core diagnosis (read this even if you skim the rest)

The current plan is an excellent **library** and a weak **librarian**. Worlds → maps → quests → chapters → steps, builder, archive, theming, stats: all of it is *organization and bookkeeping of work*. Almost none of it is *mechanics that cause work to start*. Three structural findings:

1. **There is no "now" surface.** Boot lands on the map (`show('map')`). To begin studying, Antonio must browse: map → select quest → walk animation → open quest → scan chapters → find the next step → tap. Every screen in the plan answers "what exists?"; no screen answers **"what do I do right now?"** — which is the only question that matters at 9pm with an exam in three days.
2. **The app deliberately blinds itself to time.** PLAN decision #8: due dates are a "purely cosmetic 'when' — no XP/ordering effect." The single strongest signal for both digestion (what's actually urgent this week?) and initiation (what's the next domino?) is imported from TickTick and then ignored. This is the plan's most consequential anti-goal decision.
3. **All reward lands at completion; zero at initiation.** XP, coins, stars, bursts — everything pays when a step is *finished*. But the stated hardest problem is *starting*. A 7-hour MCAT full-length and a 5-minute peer reply currently earn a similar dopamine shape (one pop at the end). The reward curve is exactly backwards for an executive-function-friction user: the game should pay out most densely in the first two minutes of a session.

Everything below serves those three fixes. The worlds/quests structure stays — it's good — but it becomes the *backstage*, and a new tiny "now" surface becomes the stage.

---

## PART 1 — Ranked high-leverage ideas

### 1. THE CAMPFIRE — a "tonight" screen that becomes the boot surface
**[INITIATION + DIGESTION · DIVERGES from plan · impact: HIGH]**

**What:** A new, deliberately tiny screen — the gang (dumpling, tomato, equipped buddy) sitting around a pixel campfire under the dusky sky. Leaning against the log: **at most 3 step cards** — today's picks, drawn automatically from across ALL worlds/quests (algorithm in idea #2). Each card is one tap from *playing that step in its quest, scrolled to and spotlighted*. A single soft line above them: the mascot's plain-language read of the day ("two small things today, then you're free 🌙"). The map, hub, builder, stats are all still there — one tap behind the campfire.

**Behavioral rationale:** Choice is the enemy of starting. Barry Schwartz + every habit-design result since: reducing the option set from "your entire academic life, zoomable across worlds" to "these three cards" collapses activation energy. The screen also *reframes scope*: Antonio never confronts the mountain unless he chooses to zoom out. This is the anti-overwhelm move — the mountain still exists, but the door you walk through every day is a campfire with three things by it. Crucially it makes the app's first frame *warm instead of demanding*: a fire and friends, not a dashboard of fractions.

**Fit / extension:** Sits as a new view in the map-screen stack (audit §5a); pulls from the existing `WORLD.quests` store + `questState`/step dates. Tapping a card = `openQuest(qid)` + scroll-to-step + spotlight (idea #7). The campfire scene reuses the pomo room's canvas-sprite idiom and the gang sprites that already exist for the map.

**Diverges — and why it's right:** The plan boots to the world map and has no daily surface at all. Argument: the map is a *planning* artifact (weekly cadence); the campfire is an *initiation* artifact (daily cadence, 5–20 opens/day). Apps must boot into their highest-frequency loop. Nothing is lost — the map is one tap away and still the place for choosing/attaching quests.

**Surface:** ~1 new render function + card component + the pick algorithm (idea #2) + boot change. Small canvas campfire sprite (2-frame flicker). No new storage beyond a "today's picks" cache keyed by `dayStr()`.
**Risk:** Low-Med. The pick heuristic must feel *right* (see #2); a bad pick teaches ignoring the screen. Mitigate with a visible "swap ↻" on each card (re-roll from the next candidates) so Antonio stays in charge.

---

### 2. GIVE THE APP A CLOCK — dates become real (pace, not pressure)
**[DIGESTION + PLANNING · DIVERGES explicitly from PLAN decision #8 · impact: HIGH]**

**What:** Promote the step `date` field from cosmetic string to a real ISO date (the pick screen already has real ISO dues; the builder currently lossily converts to "Jul 4" text). Then use it in exactly three gentle, never-red ways:
- **Campfire picker:** today's 3 cards = (a) any step due today/tomorrow across all quests, (b) then the *current* quest's next step, (c) then the smallest easy step anywhere. Overdue steps quietly float to the top of tomorrow — no red, no "OVERDUE," they just don't disappear.
- **Pace line per quest:** any quest with a target date (a new optional `due` on the quest, auto-suggested from its latest step date) shows one calm sentence under its banner: *"9 steps · 5 days → ~2 a day keeps it cozy."* Recomputed live; ahead of pace gets a tiny ☀; behind pace just updates the arithmetic — the number itself is the nudge.
- **Week strip (the digestion view):** on the campfire, a single row of 7 day-pips, each showing a count-dot per due step (max ~4 dots, then "+"). Tap a pip → that day's steps. This replaces "scary week" with "Mon:2 Tue:1 Wed:0 …" — the visual proof that the wall is actually a garden path.

**Behavioral rationale:** Overwhelm is almost always *unquantified* dread. The Jul-4–6 week above feels crushing as a list and trivial as "≈2/day." Turning deadlines into a *pace* (a rate you're on) instead of *alarms* (a state you failed) is the difference between a coach and a creditor — and pace framing is what actually changes behavior (goal-gradient works on rates). For initiation, due-today is the single best "next domino" signal we have, and it's already flowing in from TickTick.

**Diverges — argued:** Decision #8 says dates are cosmetic, "no XP/ordering effect." Keep that letter where it protects coziness — **no XP effect, no forced reordering inside a quest, no red states, ever** — but the app choosing *what to surface on the campfire* by date is not pressure, it's digestion. An app for a student with real exam windows that ignores its own deadline data is decorating the problem it was built to solve.

**Surface:** Change `date` to ISO + render via existing `dueLabel()` (builder shows the pretty label, stores the ISO — small migration for drafts). Picker function (~40 lines). Pace line = arithmetic + one div. Week strip = one row render. Also carry TickTick's real ISO through `pkStepFrom` (it already has it; it currently throws it away).
**Risk:** Low-Med. The one real danger is *tone* — a single red pixel or "late!" copy converts this from digestion to anxiety. Enforce a hard style rule: date UI may only use the world accent + gold, never the danger rose.

---

### 3. PRESS ▶ FOR REAL — a start-state, and the pomo timer finally marries the quest
**[INITIATION · EXTENDS plan (pomo↔streak) / DIVERGES on step model · impact: HIGH]**

**What:** Today the ▶ play button is a lie — it *marks done*. Give steps a third state: **doing**. Tap ▶ → the step "lights": row glows gold, the dumpling walks over and sits beside it, and a small **focus chip** starts counting up in the HUD (tap chip = pause/stop). Then two payoffs:
- At **2 minutes**, a tiny ember pops (+2 xp, once per step): the *showed-up bonus*. This is the app literally paying out the 2-minute rule.
- Every **25 minutes** of a lit step, a tomato drops into the pomo room automatically (reuses `dropPomo()` — which already pays 5-coin sale value and, per plan, will bump the streak). Long work — the Winogradsky write-up, an MCAT full-length — finally *earns while it happens* instead of only at the end.
Completing is unchanged: tap the row/star → done, full ceremony. Never started a step but did it offline? Row-tap-to-done still works exactly as now; the start-state is optional gravy, not a gate.

**Behavioral rationale:** This is the initiation mechanic. (1) It creates a *cheap committing action*: pressing ▶ costs nothing and is fun, but it's a public (to the mascots) declaration that flips Antonio from deciding to doing — the Zeigarnik effect then makes stopping feel unfinished. (2) It fixes the reward-timing inversion (all-at-completion) by paying at minute 2 and every 25 min. (3) It merges two currently *disconnected* loops: the pomo room (cozy, but you log tomatoes manually, unrelated to any task) and the quest (tasks, but no time dimension). One system: start a step → tomatoes accumulate → streak kept → step done → xp. The mascot sitting next to the lit row is the Steven Universe move: you're not studying alone.

**Fit / extension:** `dropPomo` and the pomo economy exist (audit §4); the streak-counts-pomos hook is already in the plan. The step model gains `doing:boolean` + `startedAt` (transient — don't sync mid-session seconds; persist only tomato drops and the ember flag).
**Diverges — argued:** The plan's step is binary and its pomo room is a separate toy. The plan even keeps ▶ as the completion control. Argument: a "play" affordance that means "already finished" wastes the best verb in the game. Games are about *doing*, not bookkeeping; this makes the core loop present-tense.
**Surface:** Med — step-state + one timer + HUD chip + `dropPomo` call + mascot reposition. All in one screen (the questline view). The 2-min ember is ~10 lines.
**Risk:** Med. Timers invite fiddliness (backgrounded tab, forgot-to-stop). Keep it forgiving: cap credit at 3 tomatoes per lit session, auto-sleep the chip after 90 idle minutes with a friendly "we dozed off 💤" (no penalty). Never *require* the timer for anything.

---

### 4. TOMORROW'S PROMISE — implementation intentions, cozied
**[INITIATION · EXTENDS plan (new, no conflict) · impact: HIGH for its size — it's ~50 lines]**

**What:** When Antonio finishes his last step of the day (or ends a session), the dumpling asks one question: *"what's first tomorrow?"* — offering 2–3 candidate steps (tomorrow's due + next-in-current-quest). One tap to pick, one to skip. Next morning, the campfire shows that step **already in the dumpling's hands**, held out: *"you said this one ✦."* Starting it within the day pays a tiny bonus ember (+2 xp).

**Behavioral rationale:** Implementation intentions ("I will do X in situation Y") are the most replicated task-initiation intervention in behavioral science — Gollwitzer's meta-analyses put the effect at d≈0.65 for goal attainment. The magic is that *tonight-Antonio* makes the decision so *tomorrow-morning-Antonio* doesn't have to — decision and action are separated, and the morning app-open presents zero choices, just a promise held by a friend. This also front-loads the daily streak (the first action of the day is the whole battle).

**Fit:** One field in `aq_progress` (`promise: {stepId, day}`); campfire renders it first; the ask is a small modal reusing the confirm pattern. **Aligns** with everything; the plan simply never thought about the day boundary.
**Risk:** Low. Only rule: a broken promise is *never mentioned*. The card just returns to being a normal candidate. Guilt is the failure mode of this entire app category.

---

### 5. XP = MINUTES — make effort sizing honest (and planning trivial)
**[PLANNING · DIVERGES from PLAN decision #10 (semantics, not numbers) · impact: MED-HIGH]**

**What:** The live campaign already runs the smartest economy in the app and nobody named it: **1 xp ≈ 1 minute of lecture** (`xp ≈ minutes`, comment at quest.html:506). Imported quests abandon this for abstract 🟢5/🟡10/🔴20 difficulty. Keep the exact same three presets and numbers, but change what they *mean*: **~5 min · ~15 min · ~30 min+**, with the existing custom-number escape hatch meaning literal minutes (MCAT FL2 = 420, and it *should* be — see below). Builder chip cycles time-sizes; the preview shows `~15m` next to `+15xp`.

**Behavioral rationale:** Three wins. (1) **Planning becomes estimation**, which is the skill a med student actually needs — a quest's total xp *is* its total hours, so "Exam Sprint · 240 xp" literally reads "4 hours of work," and the pace line (idea #2) can say "~35 min/day," which is dramatically more digestible than step counts. (2) **Initiation:** "what fits in the 20 minutes before class?" becomes answerable at a glance — small-xp steps are *findable* as small. (3) **Fairness:** the current scheme prices a 7-hour full-length at 20 xp — the same as a hard flashcard session. Under-rewarding the scariest work is exactly backwards; effort-proportional reward is what keeps a grind-heavy month feeling fair rather than punitive.

**Diverges — argued:** Decision #10 chose difficulty semantics "calibrated to keep the start-stingy pace." Minutes keep the identical calibration for typical steps (the presets don't change!) while making the unit *mean something*. The start-stingy concern only bites on huge honest values (a 420-xp full-length ≈ 8 levels early on) — acceptable: finishing an MCAT full-length **should** feel like a boss kill; if it still worries you, soft-cap a single step's level contribution, never its coins.
**Surface:** Tiny — labels, one `~Nm` render, `pkStepFrom` mapping (pri→size stays as the default guess), custom field copy.
**Risk:** Low. Purely semantic; numbers and saves unchanged.

---

### 6. QUICK QUEST — one-tap "this week" planning (the builder is for architecture, not for Tuesdays)
**[PLANNING + DIGESTION · DIVERGES from plan's builder-always ceremony · impact: MED-HIGH]**

**What:** Next to `＋ add a quest` (and on the campfire when a week looks dense), a second, faster path: **"⚡ plan my week"** → the app pre-assembles a quest named "week of jul 6" from every TickTick task due in the next 7 days, chaptered **by day** ("wed · jul 2", "thu · jul 3", …), sized by the pri→size guess — and shows it as a *finished preview* with one button: **"looks good — build it"** (plus "open in builder" for tweaks). Ten seconds from dread to a playable week.

**Behavioral rationale:** The plan's flow (pick screen → multi-select → builder → arrange → name → save) is right for *architecting* a big exam campaign, but it prices weekly planning at ~15 taps and real decisions — high enough that the most important planning act (the weekly digest) may simply not happen. Worse, the builder is *fun*: rich editing, drag physics, palettes — which makes it a first-class **procrastination surface** ("I organized my quests" ≠ studying). Defaults beat editors: give the 80% case a zero-decision path and reserve the lovely builder for the 20% case it was designed for.

**Fit:** Reuses `pkAddToQuest`'s machinery with a date-window filter and a by-day chaptering rule instead of by-parent. No new screens — it's a preconfigured pick+assemble.
**Diverges — argued:** The plan states "the builder board is a full editor… TickTick is one source" — nothing forbids an express lane, but the plan's every flow routes through hand-assembly. This is a philosophical divergence: **planning should default to automatic and offer manual**, not the reverse, because the user who most needs the plan is the one least able to hand-build it that day.
**Risk:** Low-Med. Overlap with steps already placed in other quests needs the plan's parked "already-added greyed ✓" guard, promoted from parked to required.

---

### 7. THE SPOTLIGHT + FOLDED MOUNTAIN — show one next thing, tuck the rest
**[DIGESTION + INITIATION · ALIGNS (extends existing campaign idiom) · impact: MED]**

**What:** In any imported quest: the **first uncompleted step gets the gold "current" treatment** the exam campaign already gives its current node (gold sparkle on the trail, brighter row) — and **chapters with zero progress render collapsed** to just their banner + progress bar (tap to unfold; current chapter always open). A finished chapter folds itself with a satisfied thunk. Net effect: opening a 30-step quest shows ~6 rows and one glowing thing, not a wall.

**Behavioral rationale:** Progressive disclosure is anti-overwhelm 101 — you cannot be crushed by what's folded. And a single glowing next action removes the last micro-decision between opening a quest and starting ("which of these 30?" → "the shiny one"). This is the same principle as the campfire, applied one level down.

**Fit:** The trail system already has done/current/future segment semantics (`.cw-seg`, gold current sparkle); this extends them to `buildQuest()` output. Collapse = a `folded` render flag, defaulting from chapter progress.
**Risk:** Low. Keep fold-state ephemeral (recomputed each open) so there's nothing to manage.

---

### 8. "TOO BIG? SPLIT IT." — decomposition at the moment of dread
**[INITIATION + PLANNING · EXTENDS builder into play-time · impact: MED]**

**What:** In the step's long-press menu (which the plan already defines): **✂ split**. It turns one step into 2–3 sub-steps *in place* (pre-filled suggestions: "open the doc + outline" / "first half" / "finish + submit"), dividing the minutes/xp between them, first fragment auto-spotlighted. One extra option in an existing menu.

**Behavioral rationale:** Avoidance is information: the step you keep skipping is mis-sized. Today fixing that means leaving the play view for the builder — friction at the exact moment willpower is lowest. Splitting *where the dread happens* converts "ugh, cheese write-up" into "just open the doc and paste the colony data," which is startable. It also teaches the meta-skill (chunking) inside the game loop instead of in a planning session.

**Fit:** Pure model edit (replace step with N steps summing to its xp) + re-render; the menu exists in the plan (two-tier editing).
**Risk:** Low.

---

### 9. EXAM LENS — a backward-planned template for the thing his life orbits
**[PLANNING · EXTENDS (new quest template) · impact: MED, but high fit to Antonio]**

**What:** In the pick/new-quest flow, one template: **"📅 exam quest."** Ask two things — exam date, and pick the related tasks/lectures — and it assembles the proven shape *backwards from the date*: chapters = "watch & learn" (the lectures) → "practice" → "self-quiz + weak spots (T-2)" → "light review + buffer (T-1)", with the plan's own review wisdom baked into default steps ("recall, not rewatching," "take it early — don't cram"). The quest gets a `due` and therefore a pace line (idea #2).

**Behavioral rationale:** The exam-3 campaign Antonio loves *is* this template, hand-built. Templates are crystallized planning: they remove the blank-canvas problem (the hardest planning moment) and encode good study strategy (spaced review, buffer day) as the default rather than as discipline. Every future exam — Unit 4 (Jul 17), MCAT — gets the structure of the thing that already worked, in 30 seconds.

**Fit:** A preset chaptering rule on top of the pick screen, exactly like idea #6 — same machinery, different recipe. ALIGNS with the plan's "reusing the format, not inventing one" philosophy; it just automates the reuse.
**Risk:** Low-Med (template copy needs care to not feel prescriptive; everything stays editable in the builder — which is the builder's true calling).

---

## PART 2 — Blunt critique: where the current plan works AGAINST the three goals

1. **Decision #8 (cosmetic dates) is the plan's biggest self-inflicted wound.** The app imports the exact data that defines Antonio's stress (due dates, exam windows) and then commits, in writing, to ignoring it. That guarantees TickTick remains the *real* source of truth for "what matters now," and Side Quest stays a nice place to record what already happened. Fix per idea #2 — keep the cozy guarantees (no red, no XP coupling), drop the blindness.

2. **The plan builds a filing system and calls it a game.** Count the plan's decided sections: worlds, hub, archive, view-stats, theming, move-quest, end-states, leveling — *meta-structure*. The only "play" is tapping a row to mark it done. Initiation mechanics: zero. Daily surface: zero. Time dimension: zero. The plan optimizes for the Antonio who is already studying and wants credit; the brief says the product exists for the Antonio who hasn't started yet. Ideas #1/#3/#4 are the correction.

3. **All reward at completion = backwards for the stated user.** Big steps (100-pt Winogradsky, 7-hr full-lengths) pay identically-shaped rewards to 5-minute steps, and pay *nothing until the end*. The pomo room — the one system that could reward time-in-seat — is an island: tomatoes are logged by hand, unconnected to any task. Marry them (#3) or the hardest work stays the least rewarding.

4. **The ▶ button is a lie.** The plan's step rows use a play glyph whose action is "mark complete." That squanders the game's best verb and forecloses the start-state that initiation needs. (Also mildly confusing: play-means-done.)

5. **The builder is a procrastination honeypot.** It's the most lavish surface in the plan (drag physics, shapeshifting cards, banners, palettes) for an activity — arranging work — that substitutes for work. Keep it, but demote it: defaults first (#6, #9), builder for architecture sessions. Also note the pick→builder→name→save ceremony fronts *every* quest creation; the plan has no cheap path.

6. **The map spots are number-dense debt statements.** Every spot shows progress bar + `earned/total xp` + `earned/total ⭐` — three fractions per quest, most reading `0/…` for a fresh world. Fractions-below-one everywhere reads as *owing*. Show a not-started spot as just a hill + name (mystery, not debt); reveal fractions on select or once progress exists. (Prototype already has all the data; this is a render choice.)

7. **Completion-fraction framing repeats in the hub** (`resolved/total`, xp fractions, star fractions per card). Same fix: lead with what's *banked* (flags, stars earned — the tally is already planned), keep denominators for the drill-in.

8. **`state:'gaveup'` aside — the give-up design itself is genuinely excellent.** Keep-earnings, resumable, counts-as-resolved, faded-flag-not-grave: this is the kindest abandonment mechanic I've seen planned, and it directly serves digestion (safe to shed load). Don't let anyone talk you into penalties. (The gamefeel report's campfire-at-the-flag idea is the right garnish.)

9. **Small but real: the plan's streak (correctly) requires daily action but has no rest concept.** Med school has clinical days and exam-recovery days. One earned "rest ember" per week (auto-spent on a missed day, mascot says "we kept the fire going 🔥") keeps the streak honest *and* humane. Cheap: one counter in `aq_progress`.

10. **Prototype quirks that would actively hurt if migrated as-is** (flagged in audits, endorsed here as behavioral issues, not just bugs): completed quests still toggleable (undermines "trophy" psychology), no double-add guard in pick (invites duplicate debt), `createdAt:'now'` (kills any pace/stats math), and the pick screen dropping real ISO dates on import (blocks idea #2 outright — fix `pkStepFrom` first).

---

## PART 3 — Concrete "first-press" mechanics (small, specific, shippable)

The catalog of tiny initiation features; several are components of Part 1 ideas, listed here as build-able units:

- **F1 · The held-out card** (from #4): the morning campfire shows one step *in the dumpling's hands*. One tap = quest opens, scrolled, spotlighted, ▶ pre-armed. The whole cold-start is: open app → tap → studying.
- **F2 · Two-minute ember** (from #3): +2 xp ember pops 2 minutes into any lit step, once per step. Copy: *"showed up ✦"*. Pays the hardest rep — the first one.
- **F3 · "Just the first line" hint**: a spotlighted step with notes shows its first note line inline (already planned as line 2!) — but for split steps, seed the note with a literal first action ("open Canvas → the discussion thread"). The screen tells your hands what to do, not just what the task is called.
- **F4 · Swap, don't skip**: campfire cards have ↻ (replace with next candidate), never an ✗. You can't "clear" the day's suggestions into an empty, guilt-free-but-also-action-free screen; there's always a smallest thing on offer.
- **F5 · One-more whisper**: when a chapter has exactly one step left, the mascot bubbles "one more and the banner's ours" (the gamefeel report's HUD-whisper system; this is its highest-leverage trigger — goal-gradient effect, people accelerate near a finish line).
- **F6 · Momentum framing on re-entry**: opening the app mid-streak-day, the sub-line reads *"day 4 🔥 · yesterday: 3 steps"* — yesterday's win as today's identity ("I'm someone who did 3 yesterday"). Never shows zeros ("yesterday: rest").
- **F7 · The 20-minute pocket finder**: a tiny "⏳ got 20 min?" chip on the campfire → surfaces the largest step that *fits* (needs minutes-as-XP, #5). Turns dead gaps between classes into runs.
- **F8 · Arm-on-open**: opening a quest from a campfire card auto-arms the spotlighted step's ▶ (one tap to light instead of two). Micro, but the whole funnel should be countable on one hand: open → tap card → tap ▶ → working.
- **F9 · First-of-day disproportion** (endorsing gamefeel #5, sharpened): the day's *first* completed step gets the streak-kept toast + a slightly bigger burst than usual. Reward asymmetry should favor the step that broke the ice, not the tenth.
- **F10 · Promise chain**: finishing the promised step (F1) immediately offers "and the next one's tiny — ride the wave?" with the following step pre-armed. Momentum is a resource; spend it while it exists.

**Explicit non-mechanics (restraint list):** no push-notification nagging, no red/overdue states, no decay (XP/streak loss), no locked content behind daily activity, no "you haven't studied in N days" copy ever — the mascots missed you, they were never disappointed. Cozy is not a skin; it's the guarantee that the app never becomes another stressor. That guarantee is *itself* an initiation feature: an app that might scold you is an app you avoid opening.

---

## PART 4 — Suggested sequence (effectiveness-first ordering)

1. **Foundations that unlock everything:** ISO dates through `pkStepFrom` + step model (`date`, real `createdAt`) · minutes-as-XP relabel (#5). *(Days, not weeks.)*
2. **The initiation core:** Campfire screen + picker (#1, #2's picker half) · spotlight + folded chapters (#7) · Tomorrow's Promise (#4) · two-minute ember F2. This bundle alone transforms the app's job performance.
3. **The time layer:** pace lines + week strip (#2 remainder) · quick "plan my week" (#6).
4. **The deep loop:** start-state + pomo marriage (#3) · split-a-step (#8) · exam template (#9) · F5–F10 garnish.
5. Then the plan's remaining meta-structure (hub polish, stats, archive) — it's all good, it's just not urgent, because none of it fires on a Tuesday night before an exam.

One test for every future feature debate: **"does this change what happens in the 10 seconds after Antonio opens the app on July 3rd?"** If not, it queues behind something that does.
