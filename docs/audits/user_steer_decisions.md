# Owner steering decisions (override agent proposals)

## XP / duration (re: vision agent's "XP = minutes")
- **REJECT** XP-as-manual-time-estimate. Antonio can't reliably estimate/track task duration, tasks get paused, and logging time or keeping the app open to earn XP = friction (the opposite of the app's job).
- **ADOPT instead:** the base XP stays the simple easy/med/hard preset (5/10/20). PLUS an **optional bonus: XP-per-minute of ACTUAL focus time**, earned automatically from a **pomodoro timer** — no manual logging, no need to keep the app foregrounded to "count."

## Pomodoro timer — MUST integrate with TickTick's native focus timer (not a separate one)
- Antonio does NOT want a Side Quest pomo timer that's separate from TickTick's built-in focus/pomo timer.
- **Best case (bidirectional):**
  - Start a focus session in Side Quest → TickTick receives it as if the timer ran natively in TickTick.
  - A focus session done natively in TickTick → Side Quest reads it and awards the per-minute bonus XP.
- Feasibility depends on TickTick's Focus API (create + read focus records). Investigating whether the worker can write/read TickTick focus data bidirectionally.

## APPROVED vision ideas (owner said yes)
- **The Campfire** — cozy daily boot screen; gang around a fire, ≤3 step cards, one tap to start. (Owner loves this + the task-initiation play style.) This is the cozy on-ramp that mirrors the "hustle is over, tea now" reward feeling.
- **Press ▶ for real** — starting a step lights the row, seats a mascot, pays a small "showed up" ember, auto-drops pomo tomatoes. Task-initiation core.
- **Give the app a clock** — real dates → calm pace lines + week strip; never red/shaming. (Overrides the old "dates cosmetic" decision.)
- **Tomorrow's Promise** — end-of-day "what's first tomorrow?" → morning the mascot holds it out.

## Live-game features the owner wants meaningfully IMPROVED (not just ported)
Evaluate every improvement on THREE fronts: **look · performance · practicality.**
- **Pomo room / mechanic** — "can be so much better." Currently starting-somewhere; wants a real redesign (and it must tie into quests + the TickTick focus timer + bonus XP, not stay an island).
- **Buddies (gacha/dex)** — "falls a little flat." Make collecting them more enticing/meaningful (stronger identity, purpose, emotional pull — buddies that DO something or feel like companions, not just skins).
- **Shop + gambling (slot machine)** — improve overall; make spending and the gamble feel more rewarding/interesting and balanced against the new per-step/per-chapter payouts (inflation risk).
- These likely warrant DEDICATED Fable redesign passes after the weave review frames them.

## Creative mandate (owner amplified — the throughline)
- See the **ENTIRE game as one package** (now that the live game is in scope), through a **cohesive lens** that improves the whole, not isolated parts.
- The owner EXPLICITLY WANTS bold improvement: wherever an agent notices the game **falls short**, could be **greatly enhanced**, **tied together more tightly**, or made to **encourage flow states with little-to-no friction** — propose it. More workshopping and revamping is *welcomed*, not scope to avoid.
- Bias every proposal toward: tighter cohesion · flow-state design · friction elimination · a more satisfying, intentional overall package.
- Apply this to ALL remaining agents (weave + the pomo/buddies/shop deep-dives) and the final synthesis.

## Design Q&A resolutions (owner, locked)
1. **Quests stand alone.** Full standalone feature (map/build/play) usable without the campfire. The **Campfire is an optional daily on-ramp** that reads ACROSS existing quests and surfaces ≤3 next-unstarted steps for a one-tap "just start" — it owns nothing, never replaces quests, never forced.
2. **Start focus from a quest step** via the hold/right-click context menu ("▶ start focus"). Third entry point alongside the Campfire and TickTick-native; all converge on ONE TickTick focus session (create_focus w/ taskId).
3. **Day-end = a MANUAL button** ("call it a night 🫖") the owner presses when out of fuel → triggers the tea/rest beat + Tomorrow's Promise. NO automatic time cutoff (irregular/late study hours). Campfire may gently OFFER tea when the day's cards all resolve, but it's always the owner's button; never naggy.
4. **Tomatoes materialize PER COMPLETED POMODORO, not per minute** (per-minute = too many). One finished pomo (e.g. a 15-min TickTick focus) = one tomato, batch-reconciled from focus records next time the room opens. Bonus XP still accrues smoothly per focused minute (invisible number), but TOMATOES are chunky/countable = # pomos done. (Long timing/stopwatch sessions: ~1 tomato per 25-min block.)

## Design Q&A resolutions — round 2 (owner, locked)
5. **Campfire shuffle: YES, but bounded.** A gentle "🔀 show me 3 others" adds autonomy (match a task to current energy) which HELPS initiation. Guard against avoidance: soft daily cap / tiny friction, still curated from real next-unstarted steps (nudged by due-soon/priority), never an infinite task-slot-machine to defer starting. Agency, not reroll-until-easy.
6. **Bonus XP vs. selling pomos — no farm risk by design.** Bonus XP is **XP-ONLY, never coins** (inflation firewall). Both bonus XP and tomatoes are gated by REAL TickTick focus time and reconciled **idempotently by focus-record id** (no re-mint); step toggle is net-zero XP. Tomato→coin stays a tiny trickle (5c) so focus-coins never rival study-coins. **Light rework:** "sell pomos" → "trade in," and give tomatoes a **secondary cozy use** (Den warmth / preserve jars / feed the tomato) so the pomo reward feels meaningful without inflating coins.

7. **Prize WHEEL, not a slot machine.** The gamble becomes a spin-the-wheel — cozier, more readable (segments visible = honest/transparent odds, not predatory), satisfying tick-decelerate spin, fits the pixel aesthetic. Keep ALL the Payday framing: boots inert, a free **golden spin** earned by the day's first completed step, ~10 paid spins/day cap, bonus golden spins on chapter/quest clears, can't be farmed instead of studying. Segments = coins / tomatoes / rare-star sparkle / jackpot koi hat. "Payday Machine" → **"Payday Wheel."**

## Feature the owner wants REVAMPED: the daily streak
- Make the **daily streak** truly satisfying + encouraging — both mechanics AND game feel. Currently weak (live game's "🔥 0/7" is a mislabeled done/21, not a real streak).
- Must ENCOURAGE without inducing dread/anxiety — honor the cozy "never red / never shaming / no harsh decay" restraint. A missed day should feel gentle ("the fire's still warm"), not punishing.
- Getting its own dedicated Fable redesign pass (look · performance · practicality).

## Economy model (locked, with worked example)
- **Coins ← completing STEPS** (coin value = step's easy/med/hard value 5/10/20). **Stars ← completing CHAPTERS** (+3 on full quest). **XP ← steps (same value) + pomo per-minute bonus.** The pomo bonus is **XP-only, never coins** (anti-farm firewall). Tomatoes (1 per completed pomo) trade in for a small coin trickle (~5c) or cozy uses.
- Worked ex — quest with Ch1[easy,med,hard]+Ch2[med,hard]: 65 coins, 5★ (2 chapters +3 quest), 65 XP from steps (+ pomo bonus XP). Work dominates; focus is a gentle bonus.
- **Endgame / infinite sinks (so earning never feels pointless, without a treadmill):**
  - Finite content = a structured SEASON (decor shelf ~season, dex ~10-14 wks, hats/charms) → extended by **wave-2 Night Market** buddies.
  - Infinite cozy sinks: **preserve jars + feeding the tomato** (a keepsake/memento of cumulative focus, NOT a grind) for tomatoes; the **Payday Wheel** recycles coins.
  - **Level (open-ended) + daily streak = perpetual**, need no sink — always a number climbing.
  - Philosophy: "collecting everything" = a cozy STEADY-STATE (furnished Den + full family at tea); the endgame reward is the vibe, not endless unlocks. A study app must not become a second job.

## Leveling needs its own motivator / prizes (owner) — proposed ladder
- Level-ups must PAY OUT (currently just a rising number). Keep rewards **mostly NON-coin** so pomo-focus-XP can't indirectly farm coins via levels (firewall).
- **Every level** → a free golden Payday Wheel spin + the level-up flourish (self-balancing via wheel odds).
- **Every rank-up** (tier titles fresh start → warming up → in the zone → locked in → …) → a milestone prize: Shooting Star wish token / decor piece / charm / cosmetic + new-title ceremony.
- **Big milestone levels (10, 20, …)** → a guaranteed drop (rare buddy or special item).
- **Some cosmetics/features unlock AT levels** (e.g. lv 8 → an outfit / extra world slot) — concrete climb goals.
- Coordinates with the wheel (shop), wish tokens (buddies), and the reward-animation pass (feel). May get a dedicated Fable tuning pass if the owner wants the full ladder balanced.

## Cosmetics + progression rewards (owner, round 3)
- **Level rewards: NO feature/world-slot unlocks** (counterintuitive — don't gate your own workspace). Use **level-locked COSMETICS** instead.
- **Prize ladder: Fable to FINETUNE** (exact per-level/per-rank/milestone rewards, balanced vs wheel+buddy+streak economies, non-coin skew per firewall).
- **Charms: CUT** (fluff / tracking overhead / distracting). Delete the "coming soon" teases. Keep ONLY if a genuinely zero-friction incorporation exists — high bar; default remove.
- **Cosmetics MECHANIC needs its own revamp** (never done — only the gamble/decor-sink was). Covers **MASCOT cosmetics** (the slime/tomato/dumpling gang — NOT buddies) **unified with ROOM DECOR** into one cozy customization system. Liberty to expand.

## Quest management must feel good (owner)
- Moving quests **between worlds** + **reordering within a world**, plus **delete / give-up / resume / archive** — all smooth, intentional, satisfying, cozy — NOT clunky. Needs a proper interaction/flow design + an undo/safety model (esp. deletion).

## Streak — CONFIRMED
- The 2-min "showed up" ember **DOES light the day's fire** (owner confirmed yes). Just *starting* keeps the streak alive — a day is lit by ≥1 step OR ≥1 credited pomo OR the 2-min showed-up ember.

## Standing rule reinforced
- Every feature must REDUCE friction. If a mechanic requires manual bookkeeping/logging to earn rewards, redesign it to be automatic or drop it.
- Evaluation lens for ALL work: look · performance · practicality.
