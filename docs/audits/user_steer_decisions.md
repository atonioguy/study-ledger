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

## Standing rule reinforced
- Every feature must REDUCE friction. If a mechanic requires manual bookkeeping/logging to earn rewards, redesign it to be automatic or drop it.
- Evaluation lens for ALL work: look · performance · practicality.
