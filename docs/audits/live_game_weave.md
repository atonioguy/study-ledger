# Side Quest — The Live-Game Weave
*A critical feature-by-feature review of `quest.html` v2.8, and the design for how worlds → maps → quests, global leveling, TickTick import, and task-initiation weave through the ENTIRE existing game — so the result is one intentional game, not a mod pack.*

**Grounding:** `quest.html` (live, read in full), `quest-next.html` (prototype), `PLAN.md`, and all sibling reports (`migration_audit_live/prototype`, `navigation_flow`, `effectiveness_vision`, `gamefeel_ideas`, `art_direction`, `performance_robustness`). This report does not re-derive their findings; it cites and *decides on top of* them.

**Settled decisions honored throughout (not re-litigated):** base step XP stays the 🟢5/🟡10/🔴20 presets (XP-as-manual-minutes REJECTED); optional per-minute bonus XP comes from ACTUAL focus time via bidirectional TickTick Focus integration (pauses handled natively by TickTick); Campfire daily boot, Press-▶ initiation, the real-dates Clock (never shaming), and Tomorrow's Promise are APPROVED; give-up design stays as-is; cozy is the emotional core ("the hustle is over, tea now"); the exam-3 look is preserved verbatim.

---

## PART 1 — Feature-by-feature review of the LIVE game

Verdict legend: **KEEP** (protect as-is) · **CHANGE** (rework in the weave) · **CHALLENGE** (owner should reconsider) · **CUT** (retire or demote).

### 1.1 The exam-3 campaign (CAMP_MODS · diamond node grid · lesson/module/review) — **KEEP the look, CHANGE the frame**

**What it is.** A hardcoded questline (quest.html:507–527): 2 modules → 7 lessons → 19 video parts (`P1 / 14:32` chunky diamond-node buttons) + 2 review quests, on a segmented vertical trail (teal done / gold current-sparkle / purple future) with the dumpling avatar parked at the first unfinished lesson. XP ≈ minutes of lecture. Completion is a flat `campDone` map; lesson/module state is always derived — an unusually clean design.

**What's GOOD and worth protecting.**
- The **presentation is the game's soul**: node grid, module banners with gold left-bar, trail + avatar, per-lesson counters, check ceremony (`cwToggle`'s burst/float/banner/big-celebrate cascade). Antonio loves it; PLAN 176–181 already ring-fences it. Protect the *CSS and renderer verbatim* — the map-view overrides at lines 161–170 are an accumulation of hand-tuned `!important`s; touch nothing.
- The **derived-not-stored progress model** (only leaf checks are truth) is the right invariant for every future quest — the prototype's `questState/questStars/questTotals` already copy it. Keep that philosophy.
- **1 xp ≈ 1 min of lecture** was quietly brilliant calibration. The owner rejected minutes as a *manual* input — correctly — but note the focus-time bonus (per-minute, automatic) is the honest heir of this instinct: the campaign paid 1 xp/min of watching; the new game pays bonus xp/min of *actually focusing*. Same soul, zero bookkeeping.

**What CHANGES.**
- It becomes **World 1, quest #1** — a `{id:'exam3', kind:'campaign'}` wrapper in `aq_worlds` (details §3.1). `CAMP_MODS`/`campDone` stay the source of truth; the wrapper only *adapts* them to the quest interface (totals, stars, state, render). No data migration of its internals, ever.
- Its HUD couplings are rewired (rank/level/streak → global; §1.2), and its completion flows through the shared award pipeline (banked ledger + lifetime XP; §1.3).
- **The ⟲ reset button must leave the header.** Under lifetime XP ("never resets") and banked earnings ("give up keeps everything"), a one-tap wipe of `campDone` is now a semantic contradiction and a ledger-drift machine (migration audit risk #1). Move it behind ⚙ dev tools. This is the one visible change to the beloved screen, and it's a *removal of danger*, not of charm.
- After the exam window (Jul 6), it completes → gold flag plants → it becomes the game's **first trophy monument** (read-only, per PLAN 131). The founding quest becomes the founding memory. Future exams don't get hardcoded campaigns; they get the exam-template flow (§4.3).

### 1.2 HUD + leveling (mascot corner · lv/rank · xp bar · 🔥 · currency chips) — **KEEP the chrome, CHANGE every number**

**What it is.** quest.html:383–394/540–548. Squishing mascots (+hats, +active buddy), `lv N` + rank name from a 6-rank ladder capped at 240 xp, gold gradient bar = % of the campaign's 248 xp, `🔥 done/21` (not a streak — a mislabeled task fraction), coin/star chips.

**GOOD.** The layout, the gold bar (gradient + sheen + glow — PLAN 197 keeps it constant-gold in every world), the chip count-up animation, the tap-for-mascot-sheet affordance. This HUD *is* the game's constant heartbeat; its pixel identity should not change at all.

**CHANGE (all planned, endorsed).**
- Bar/level/rank → global lifetime XP on the `50+25·(L−1)` curve; `cwCountUp`'s hardcoded `/ XP_TOTAL` denominator → `into / need` (audit §3). Extend rank names past "exam ready ✦" — the six campaign ranks were a love letter to one exam; the new ladder ("fresh start → … → legend → ascended") keeps the voice.
- `🔥` becomes the **real daily streak** (≥1 step or ≥1 focus session/pomo per day). The current display is a lie that will be exposed the moment there are two quests; killing it is non-negotiable at fold.
- ADD one element only: a small **focus chip** (`⏱ 12m · focusing`) that appears while a TickTick focus session is live on a lit step (§3.2). It replaces the streak chip's slot temporarily or sits beside it — no layout rework.
- `rankFor` fans out to 3 sites (HUD, level-up banner, mascot sheet — audit risk #8): rewire all three in one commit.

### 1.3 Economy (derived coins/stars, spent-ledger `aq_econ`) — **CHANGE structurally: derived → banked ledger**

**What it is.** The cleverest code in the file (621–632): nothing stores balances. `coinsEarned() = campaign xp`, `starsEarned() = lessons + 3·modules`; `aq_econ` stores only *spent*; balance = `max(0, earned − spent)`. Grants are negative spends.

**GOOD.** Self-healing (recomputable from progress — performance audit finding-12 rightly says preserve that *property*), tiny to sync, and it made coins meaningful: your wallet literally *is* your studying.

**Why it must CHANGE.** Three new facts break pure derivation: (a) give-up keeps earnings while the quest freezes below 100%; (b) lifetime XP never resets while quests can be edited/deleted; (c) tomato sales and slot wins are already grants outside derivation. **Design: `aq_econ` becomes `{ce, se, c, s}`** — earned counters banked at each completion event, spent counters as today; balance = `max(0, ce−c)`. Un-checking a step within a session subtracts (undo grace, mirroring the prototype's `awardXP(-x)`); give-up/archive/edit never claw back. Migration seeds `ce/se` from the current derived functions so visible balances are **bit-identical** on first v3 boot (migration audit §6.4 — the no-jump rule).
- **Coins stay the grind tender** (per step = its XP value, PLAN #11), **stars the milestone tender** (1/chapter, +3/quest). One critical adapter rule: the campaign keeps its own star formula (lessons + 3·modules = 13 max) and does **NOT** also get the generic +3 completion bonus — its "module = 3★" already *was* the milestone bonus. Otherwise migration mints 3 stars out of thin air.
- **Focus-time bonus XP mints XP only, never coins directly** (inflation control, §3.3). Focus time's coin trickle flows through tomatoes instead.

### 1.4 Gacha / buddies / dex (12 buddies, pity, TCG cards) — **KEEP, weave outward**

**What it is.** 664–816: 3★ hatch, rarity table (3% legendary, pity-10 → guaranteed epic+), the charge→flash→TCG-card pull sequence with buildup/fanfare/legend audio, dupes pay +12 coins, active buddy joins the HUD.

**GOOD.** This is the most polished dopamine loop in the game — the pull staging (aura, gold tease at 78%, buildup cut to fanfare) is genuinely well-crafted, and the writing on the cards ("bow, peasant") is the game's comedic register. The pity system is honest. Don't touch the mechanics or rates.

**CHANGE (integration, not redesign).**
- The equipped buddy **travels with the gang** on the world map (PLAN 121 — prototype already stubs `BD`) and **sits at the Campfire** and tea scenes. This is what upgrades a buddy from HUD pixel to companion — the collection finally has a *place* to be.
- Star income rises from ~13/campaign to ~7–10/week (§3.3 math) → the 12-buddy dex completes in ~6–8 weeks. Acceptable for launch; plan **wave 2** (12 more, or buddy "bond" flavor via campfire presence) before the dex closes. A completed dex with no sink is when gacha dies — the tease is already in the shop copy ("charms — next update"): make charms the post-dex star sink (§1.5).
- Dex tap → card → "set as sidekick" stays the only management; fine.

### 1.5 Cosmetics / shop (5 hats) — **KEEP, grow into the cozy sink**

**What it is.** 849–921: canvas-drawn hats layered on both mascots + the map avatar via `hatIconURL`, live preview with big mascots, buy/equip.

**GOOD.** Hats-on-everyone (HUD, avatar, shop preview, mascot sheet) makes purchases feel *worn*. Prices (50–140) were sized to a 248-coin campaign — a real decision, not filler.

**CHANGE.**
- With per-step coins + tomato income (~150–200 coins/wk, §3.3), the 5-hat catalog exhausts in a fortnight. Grow the catalog along the game's emotional axis, not sideways: **pomo-room decor as the flagship coin sink** — lamp, bookshelf, tea table, window rain toggle, rug colors (the room already composites canvas decor; `pomoDecor()` is the extension point). *Effort furnishes rest* — this is "the hustle is over, tea now" as an economy. Hats stay the cheap shelf; decor is the aspirational shelf.
- **Charms**: teased in the shop AND mascot sheet. Ship a v1 or delete the tease (a "coming soon" older than the feature it teases reads as abandonment). v1 proposal, cozy-safe: **rest ember** (streak keeper — one earned free per week per effectiveness #9, extras purchasable), and a **tea set** (unlocks the evening tea scene variant). Never stat power.
- World-palette-themed cosmetics later (sakura petal crown, snow cap) — ties shop to the worlds feature.

### 1.6 Slot machine — **CHALLENGE: from procrastination pocket to daily ritual**

**What it is.** 923–967: 8-coin spins, weighted reels, coin→star conversion at terrible odds (~167 coins/★ EV — checked; not an exploit), **40 spins/day cap**, jackpot ceremony.

**GOOD.** The cabinet styling, staggered reel stops with per-reel pop + check sfx, payout-tiered celebration. It's a legitimately fun coin sink and the only *luck* verb in the game.

**The honest problem.** This is the single feature that rewards **being in the app instead of studying**. Forty spins is ~10 minutes of lever-pulling — a state-of-the-art procrastination pocket for exactly the user this app defends. It also sits on the nav-adjacent shop screen, one tap from anywhere, always lit.
**The rescue (recommended over cutting).** Keep the machine, change its *relationship to the day*: cap **~10 spins/day**, and grant **one free spin when the day's first step completes** ("payday spin" — the reels as a completion ritual, not an idle toy). Now the slot pays *after* work, mechanically mirroring the whole game's thesis. `aq_slot` stays device-local (fine). If the owner disagrees on the cap, at minimum move the machine below the outfits fold so it isn't the shop's first paint.

### 1.7 Pomo room — **CHANGE most: from island toy to the loop's rest chamber**

**What it is.** 969–1044: a physics terrarium — roaming/draggable dumpling + tomatoes with gravity, startle-hops, squish audio; moon/stars/rug canvas decor; "＋ log a pomo" (manual), "sell all" at 5 coins each behind a kind confirm modal. RAF correctly starts/stops with the nav.

**GOOD.** The coziest surface in the game and its best physicality (pointer-capture drag, fall-and-squish). The enter/leave RAF discipline is the pattern the perf audit wants everywhere. The tomato-as-creature conceit is *the* bridge asset for the whole pomodoro integration.

**Why it's currently an island.** Tomatoes are logged by hand, unconnected to any task, then liquidated. Nothing flows in from studying; nothing flows out but coins. The vision report's diagnosis stands: the one system that could reward time-in-seat rewards *remembering to log*.

**The weave (this is the big one — full design §3.2).**
- Tomatoes become **crystallized focus**: every 25 minutes of real TickTick focus time auto-drops one (`dropPomo()` already exists, already pays streak per PLAN 190, already startles the room — zero new choreography needed).
- The room becomes the **rest beat** of the core loop: the tea moment (§2) visits it or draws its cast; room decor becomes the shop's coin sink (§1.5).
- "＋ log a pomo" **stays** — it's the manual-honesty valve for offline focus (a library session with the phone away), and the standing rule says never *require* the automatic path. Its label can become "log one by hand."
- "Sell all" stays as the coin faucet, but soften the copy ("trade in" — they go to the pantry, not the void). With tomatoes now representing real focus, wiping the room should feel like banking, not culling.

### 1.8 Mascots + voice lines (HUD trio, mascot sheet, SLIME_SAY/TOM_SAY) — **KEEP, promote to cast**

**What it is.** 817–847: tap the HUD → sheet with big mascots, stats, tap-to-talk (25 encouragement lines for the dumpling, 25 focus-jumpstart lines for the tomato), jiggle + bubble.

**GOOD.** The line-writing is exactly the two voices the new systems need — and this is not a coincidence to waste: **the dumpling already speaks initiation-warmth ("just start. that's enough.") and the tomato already speaks focus-drill ("let's lock in for 25")**. The `pickSay` no-repeat picker, the bubble CSS, and jiggle are reusable everywhere.

**CHANGE — assign the cast roles the new mechanics need:**
- **Dumpling = the warmth/initiation character**: holds Tomorrow's Promise card at the morning campfire, says the pace lines ("two small things today, then you're free 🌙"), delivers give-up comfort ("resting, not quitting").
- **Tomato = the focus timer made flesh**: Press-▶ seats *it* beside the lit row (not the dumpling), its lines fire on session start, it walks home to the pomo room when the session ends. The tomato mascot and the pomodoro technique finally acknowledge they're the same bit.
- **Buddy = flavor/luck**: silent squish stays; card personality shows at the campfire.
- Ship gamefeel #6 (HUD whispers) as the delivery channel — the sheet stays as the "visit them" surface, whispers make them ambient companions. New pools (`WELCOME_SAY`, `ALMOST_SAY`, `PRAISE_SAY`) extend, never replace.

### 1.9 Audio layer — **KEEP the architecture, adopt the perf fixes, wire the orphans**

**What it is.** 533–535, 600–619: 4 base64-embedded base sounds + 5 URL mp3s, upgraded to Web Audio buffers on first gesture, per-sound gains, synthesized `blip`, `stopSound` fade (used to cut buildup at pull-reveal — a pro touch).

**GOOD.** The layered fallback design (buffer → HTMLAudio) and the *restraint* of the mix. The blip-on-nav gives the whole app a console feel.

**CHANGE.**
- Adopt performance findings 10/11 wholesale: externalize the 77KB base64 line to 4 mp3s (−40% file size, removes the edit hazard), `preload='none'`, lazy per-sound decode, re-encode rain.mp3 to a ≤250KB loop, font preconnect.
- Wire the unused bank per gamefeel's sound note: `hi` → first-open whisper, `yay` → combo/petting, `hmm/huh` → sheet variety, `rain` → the weather feature.
- New moments need only 3 cues, all composable from existing assets: focus-start (soft `blip` variant), ember pop (short `xp`), tea-time (quiet `yay`). No new recordings required.

### 1.10 Aquamarine embed + cloud sync — **KEEP, harden**

**What it is.** The game lives twice: standalone PWA and a 484px iframe in the dashboard (`quest.html?embed=1&v=28`). Sync = one ≤200KB blob per slot, last-writer-wins, shared `aq_api_url/key` with aquamarine (which is also the TickTick credential — the "no new login" for the pick screen).

**GOOD.** The embed puts the game inside the page Antonio already opens daily — distribution *is* an initiation feature. The shared-key trick means the pick screen ships with zero auth work.

**CHANGE (all specified in the perf/robustness report — endorse, sequence in §5):** loud sync failure + telemetry, pagehide flush, pre-adopt backup, payload budget before `worlds` enters the snapshot, version-aware v2↔v3 adopt + worker OCC, `SQ_VER`↔`?v=` handshake (postMessage or auto-append). One weave-specific addition: **the Campfire must be iframe-first** — it's the first frame of the dashboard; design it at 484px before 560px. And delete aquamarine's dead campaign copy (aquamarine 1185–1271) at fold time so `aq_campaign` has exactly one writer.

---

## PART 2 — The unified game loop

**The one-sentence loop:** *A warm screen hands you the next small thing → pressing ▶ starts real focus (TickTick) and pays immediately → finishing banks coins/stars/lifetime XP with ceremony → effort becomes rest (tea, tomatoes, the gang) → rest ends with one promise for tomorrow morning.*

```
                         ┌──────────────  META (weeks)  ──────────────┐
                         │  levels/ranks · gacha buddies · outfits ·  │
                         │  room decor · map flags · postcards/stats  │
                         └───────▲──────────────────────────┬─────────┘
                                 │ spend/collect            │ companions return to…
        MORNING                  │                          ▼
┌───────────────────┐   ┌────────┴────────┐   ┌─────────────────────┐   ┌──────────────────┐
│ CAMPFIRE (boot)   │   │  REWARD          │   │  REST               │   │ NIGHT            │
│ promise held out  │──▶│  ember @2min     │──▶│  "hustle is over,   │──▶│ Tomorrow's       │──┐
│ ≤3 cards · week   │   │  coins per step  │   │   tea now" · pomo   │   │ Promise (1 tap)  │  │
│ strip · pace line │   │  ★ per chapter   │   │  room · gang scene  │   └──────────────────┘  │
└─────────┬─────────┘   │  +3★ per quest   │   └─────────────────────┘            ▲            │
          │ tap card    │  lifetime XP     │                                      └────────────┘
          ▼             │  focus xp/min    │                                      (next morning)
┌───────────────────┐   │  auto-tomatoes   │
│ WORK              │──▶│  streak kept     │
│ quest opens,      │   └─────────────────┘
│ scrolled + lit ·  │
│ Press ▶ = TickTick│      backstage, on demand: MAP (plan the week) · BUILDER/PICK
│ focus session     │      (architect quests) · HUB (switch worlds) · STATS (trophies)
└───────────────────┘
```

**Three time-scales, one game:**
- **Daily (the stage):** Campfire → card → ▶ → work → reward → tea → promise. Every approved initiation mechanic lives here. The test from the vision report governs: *does it change the 10 seconds after opening the app?*
- **Weekly (the workshop):** the map. Pick/builder assemble the week's quests from TickTick; pace lines + the week strip digest dread into arithmetic; flags accumulate. The map is where Antonio *plans*; he should visit it a few times a week, not per-session.
- **Seasonal (the shelf):** worlds complete/archive, dex fills, room furnishes, ranks climb. View Stats and the flag-covered map are the "look how far" surfaces.

**How each existing system earns its place (or was reworked to):**

| System | Role in the loop | Earned how |
|---|---|---|
| Exam-3 campaign | World 1's founding questline → first trophy | Content + the visual bar every quest aspires to |
| HUD | The constant heartbeat: level, streak, wallet, live focus chip | Rewired to global numbers; chrome untouched |
| Coins | Grind tender: per-step (=XP) + tomato trade-ins | Banked ledger; spent on outfits/decor/spins |
| Stars | Milestone tender: chapters + quest bonuses | Spent on gacha (later charms) |
| Lifetime XP | Identity, never spent: steps + embers + focus minutes | The only number that *only* goes up |
| Gacha/buddies | Star sink → companions that populate map/campfire/tea | Collection with places to exist |
| Shop/cosmetics | Coin sink → self-expression + furnishing the rest space | Decor line = cozy thesis as economy |
| Slot | Daily post-work ritual (payday spin) | Demoted from idle pocket (§1.6) |
| Pomo room | Rest chamber + focus bank (tomatoes = crystallized focus) | Married to the timer (§3.2) |
| Mascots | The relationship layer that *delivers* initiation | Cast roles: dumpling=warmth, tomato=focus |
| Audio | Reward texture | Orphan sounds wired to new beats |
| Embed | Distribution: the game inside the daily dashboard | Campfire as the dashboard's first frame |

The through-line that makes it feel intentional: **every reward path either starts work or ends in rest.** Nothing pays for idling; nothing punishes stopping.

---

## PART 3 — The weave, concretely

### 3.1 Exam-3 as World 1's questline — dual renderers, one interface

- Migration (audit §6, endorsed) creates World 1 (default: `school` 📚, twilight — twilight so the campaign's colors are literally unchanged) with quest #1 = `{id:'exam3', kind:'campaign', worldId}`. `CAMP_MODS`/`CAMP_REVIEW`/`campDone` remain the truth; the wrapper is an **adapter** implementing the quest interface: `totals()` from `campStats()`, `stars()` from `lessonsCleared()+3·modulesCleared()` (**no** generic +3 bonus — §1.3), `state()` (done when all 21 items), `render()` = the existing `buildCampaign()` untouched.
- **Coexistence rule:** `openQuest(q)` dispatches on `kind` — `campaign` → `buildCampaign()` into `#cwList` exactly as today; `user` → new `buildQuest(q)` producing the PLAN-decided imported-quest look (banner + trail + two-line step rows + ▶/⭐ leading control). Both feed **one completion pipeline**: `completeStep(...)` → banked ledger + `awardXP` + streak + fx cascade (`cwBurst/cwXpFloat/cwBanner/coinFloat`) + `refreshEcon/placeAvatar/scheduleTrail/markChanged` + `syncQuestToWorld` (user quests only). The existing `cwToggle` monkey-patch (1072–1081) *becomes* this pipeline; don't add a second wrapper layer (audit risk #4).
- The diamond node grid stays **exclusive** to the campaign (PLAN 64). Future exams use the exam-template flow (§4.3) rendered in the generic style. If the owner ever wants diamond tiles for user quests, it's a presentation option on step groups with time metadata — explicitly *not now*.
- Quest header: the current `.sq-questhd` becomes the quest-level sticky banner (name + `⚙`); the campaign's `⚙` menu offers give-up/resume + move-to-world but not structural edit (its structure isn't editable data). The `.sq-note` ("content done by friday…") becomes the campaign quest's note field — user quests get theirs from the builder.

### 3.2 The pomo marriage — Press ▶, TickTick Focus, bonus XP, and the room

**The chain (best case, bidirectional Focus API):**
1. **Press ▶ on a step** → step enters `doing`: row glows gold, tomato mascot walks over and sits beside it, focus chip appears in the HUD — and the worker `POST`s a focus-session start to TickTick (so TickTick shows the same running timer natively). Title = the step text; the session is *TickTick's*, Side Quest merely reflects it. Pauses/stops happen in either app; TickTick is authoritative (owner decision — pauses handled natively).
2. **At 2 minutes lit** → the **showed-up ember** pops: +2 lifetime XP, once per step. The 2-minute rule, paid in gold pixels.
3. **Every 25 focus minutes** → `dropPomo()` fires: a tomato falls into the room (startling the residents), streak is kept, +5-coin trade-in value accrues. Long work finally earns *while it happens*.
4. **Focus records reconcile idempotently**: Side Quest reads TickTick focus records (worker `GET /focus?since=`) on boot/foreground and awards **per-minute bonus XP** for any session not yet credited — **dedupe by focus-record id** stored in `aq_progress.lastFocus` (never double-award; never require the app to be open while focusing). A session run entirely inside TickTick with no ▶ ever pressed still pays in full. Zero bookkeeping — the standing rule, satisfied.

**Rates (design proposal, tunable):** **+1 bonus XP per focus minute.** Precedent: the beloved campaign paid exactly 1 xp/min of lecture — this is the same constant, now measured honestly. A 25-min pomo ≈ +25 xp ≈ a hard step; a 7-hour MCAT full-length ≈ +420 xp ≈ several levels early on — and it *should* feel like a boss kill. Yes, a focused step "double dips" (step XP + focus XP): intended — the deep-work path is the most-rewarded path. Sanity only: cap a single record at 4h credit, no daily caps (caps read as punishment).

**Inflation firewall:** focus minutes mint **XP only**. Their coin trickle is the tomato (5 coins/25 min *if traded in* — routed through a cozy choice, not a faucet). This keeps shop/slot pricing sane (§3.3) and keeps coins meaning "things finished."

**Degraded modes (feasibility honesty — the Focus API is still being verified):**
- *Read-only API:* ▶ lights the row + local count-up powers the ember and the seated tomato; per-minute XP + tomato drops settle on the next record sync. Slightly delayed gratification, identical totals.
- *No API:* ▶ still ships (start-state, ember, seated mascot — initiation doesn't depend on TickTick), auto-tomatoes fall back to a local 25-min count-up while lit, and manual "log one by hand" remains. The feature ladder is: initiation always works; automation is progressive enhancement.

**The room's new meaning:** tomatoes are no longer notes-to-self; they're the day's focus, embodied and pettable (gamefeel #10). The tea beat (§3.5) and decor shop (§1.5) complete it: the pomo room is where the loop *ends well*.

### 3.3 Economy balance with the new faucets — the inflation audit

**Old weekly income** (exam-3 pace): ~248 coins + 13★ per campaign-week.
**New weekly income** (typical: one week-quest ≈ 13 steps avg 10xp, ~10 focus pomos, 1 quest finished): ~130 step-coins + ~50 tomato-coins ≈ **180 coins/wk** · ~5 chapter ★ + 3 bonus ≈ **7–10 ★/wk** · ~130 step XP + ~250 focus XP + embers ≈ **~400 lifetime XP/wk** (≈ 2–3 levels/wk early, ~1/wk by lv 10 — the curve holds).

Consequences and the levers already designed:
- **Coins ≈ 0.75× old rate** — pleasantly stingy. The decor shelf (§1.5) absorbs growth; slot demotion (§1.6) removes the 320-coin/day theoretical burn that no longer matches income.
- **Stars ≈ 2–3 pulls/wk** vs the campaign's ~4 pulls *total*. That's the real inflation point — and it's fine *as pacing* (a pull every few days is healthy gacha cadence) but it burns the 12-buddy pool in ~2 months: schedule buddy wave 2 / charms before then. Do **not** raise HATCH_COST to compensate — repricing reads as betrayal; add sinks instead.
- **Level-up frequency** replaces the campaign's rank-ups as the HUD's heartbeat: 2–3/wk early is right for the new gamefeel flourish (#8) to carry.
- The banked ledger (§1.3) makes all of this auditable: every faucet goes through `bank(coins, stars)` / `awardXP(n)` — two functions, greppable, tunable.

### 3.4 Navigation — the home of every system

Adopting the navigation report's model (bottom nav + one-←-rule + play/edit split) with the Campfire added as the true root:

```
BOTTOM NAV (persistent, never themed, 5 slots):
  🔥 home  ·  🗺️ map  ·  🍅 pomo  ·  🥚 buddies  ·  🎰 shop

🔥 home  = THE CAMPFIRE (boot screen): promise card, ≤3 step cards, week strip,
           evening tea scene. Cards deep-link into the map tab's quest view.
🗺️ map   = the world stack: [worlds HUB ↔ world MAP ↔ QUEST(play)]
           · world strip `🌍 school ▾` = quick-switch dropdown; hub = overview/manage
           · ⊕ on map → PICK → BUILDER (pushed, ← returns); ⚙ on quest → BUILDER
           · 📊 view stats = hub bottom row (low-frequency; not worth a nav slot)
🍅 pomo  = the room (rest + tomato bank + decor)
🥚 buddies = gacha + dex          🎰 shop = slot + outfits + decor + charms
HEADER   = ⚙ sync (campfire + map headers) · dev tools inside ⚙ (incl. relocated ⟲ reset)
```

- **Campfire vs map:** the campfire is a **sibling root**, not a map view — it reads across *all* worlds (its picker ignores world boundaries; urgency doesn't care which world a step lives in). The map stays the planning surface, one tap away. Boot = campfire; the nav makes "return to now" always one tap.
- Every prototype nav fix from the navigation report ships in the prototype first (its #1–#6, #8): kill top tabs, universal ←, play/edit split with autosave, quick world switcher, visible enter-chip on selected spots, visible ✎ on world cards. The live fold then merges its proven grammar into the live `#nav` chrome.
- At 484px embed width the 5 tabs fit (current 4 have ~120px each; 5 → ~96px — icons + 9px labels still clear).

### 3.5 The daily bookends — where the approved mechanics live

- **Morning:** campfire; dumpling holds the promised step ("you said this one ✦"); tap → quest opens scrolled + spotlighted with ▶ pre-armed (vision F1/F8). Cards carry the swap-not-skip rule (F4). Week strip + pace line render the Clock (accent + gold only — never the danger rose; make it a lint rule in the theming tokens).
- **During:** Press ▶ chain (§3.2); spotlight + folded chapters in quest views (vision #7 — extend the campaign's gold-current idiom to `buildQuest`); combo/coin-flight/whisper garnish per gamefeel.
- **Evening:** after the promised step + campfire cards resolve (or a "done for today" tap), the campfire shifts to **tea time**: the gang + tea table, *"the hustle is over, we're having tea now."* Tomorrow's Promise is asked *from this scene* — the day closes by opening the next one. A broken promise is never mentioned (vision #4's only rule).
- The pomo room remains the *anytime* cozy space; the campfire hosts the bookends. Tea scene population: dumpling + tomato + equipped buddy + today's tomato count as a little pile by the fire.

---

## PART 4 — What to CHALLENGE / CUT (honest list)

1. **CUT from primary UI: the ⟲ reset button** (§1.1). It contradicts banked earnings + lifetime XP and can silently clamp wallets today. Dev-tools only. *(The single most important deletion in the fold.)*
2. **CHALLENGE: the slot machine's 40/day cap** (§1.6). Recast as a ~10/day + payday-spin ritual. It's the only feature whose incentive points away from studying; the rescue keeps the fun and flips the incentive.
3. **CHALLENGE: the builder's gravitational pull.** It's the most lavish surface in the plan for an activity that substitutes for studying. Nothing settled forbids an express lane: endorse vision #6 (**"⚡ plan my week"** — auto-assembled by-day quest from the next 7 days of TickTick dues, one confirm) and #9 (**exam template**, backward-planned from a date — it is literally the exam-3 shape as a recipe). Builder remains the full editor it was decided to be; defaults just stop routing every Tuesday through it. Requires promoting the parked "already-added greyed ✓" guard to required.
4. **CHALLENGE: fractions-as-debt on map/hub** (vision #6/#7). Not-started spots show hill + name only; fractions appear on select/progress. Pure render choice, big tone win, no PLAN conflict.
5. **CUT: the `0/7` pseudo-streak** at fold (planned, listed for completeness — it's a lie in the HUD).
6. **CHALLENGE: "charms — next update" + "one-use boosts — coming soon"** teased in two places. Ship the cozy v1 (§1.5) in the weave or remove the copy until real.
7. **CUT: aquamarine's dead campaign block** (1185–1271) and the manual `?v=28` — replace with an SQ_VER handshake. One writer per key, one version of truth.
8. **CHALLENGE: dev grant/wipe buttons live in the user-facing sync panel.** Post-fold they can corrupt the banked ledger narrative; gate behind a triple-tap on the version string.
9. **Restraint list (re-affirmed, from the vision report):** no notifications, no red states, no decay, no locked-content-behind-activity, no "you haven't studied in N days." The mascots missed you; they were never disappointed. This is the contract that makes the app safe to open — which *is* the initiation feature.
10. **Not challenged (settled and right):** give-up design (the kindest abandonment mechanic in the plan — garnish with gamefeel #17's ember-at-the-flag), difficulty presets over minutes (owner's call; the focus bonus carries the effort-proportionality load instead), cosmetic-only dates *inside* quests (the Clock surfaces, it never reorders or colors).

---

## PART 5 — The weave sequence (playable and coherent at every step)

Each phase ships a working game; the exam-3 renderer is never edited, only wrapped. Perf/robustness items land with the phase that creates their risk.

**Phase 0 — Hardening + garnish (live, this week, zero data risk).**
Sync telemetry + loud failure, pagehide flush, pre-adopt backup, `preload='none'` + font preconnect, `cwSweep` left→transform, `prefers-reduced-motion` block, externalize the base64 audio line. Optional same-cost delight: coin flight, thump tiers, HUD whispers, idle blinks, petting, pomo rain/twinkle. *(All from perf/gamefeel/art batch lists — the game gets safer and warmer before anything structural moves.)*

**Phase 1 — The spine: ledger + global leveling + migration (v3 save).**
Banked `aq_econ{ce,se,c,s}`, `aq_progress{xp,streak,lastDay}`, HUD rewire (bar/lv/rank/real-🔥), extended ranks, auto-migration (World 1 + exam3 wrapper + XP fold-in + **balance-identical** seeding + pre-migration backup), version-aware adopt + worker OCC, payload budget, reset→dev-tools. *Visible change: HUD numbers only. The game plays identically.*

**Phase 2 — The map stack (structure without new content).**
Worlds hub ↔ world map ↔ quest inside the map tab, with the navigation report's grammar (bottom-nav pattern, ←-rule, quick world switcher, sticky banners) and the art report's fixed palettes (unique mint/snow accents, glow tokens). Exam-3 is the only quest — the map is a one-spot road with the gang parked on it. Ship the **quest-complete ceremony + flag plant** now: exam-3 completes around Jul 6 and should land as the first flag, not a silent checkbox.

**Phase 3 — Quests you can make.**
Worker subtask endpoint → pick screen (live fetch) → builder (delegated events, targeted toggles, autosave-on-←, no done-toggle in build — the prototype fixes) → `buildQuest` renderer at exam-quest fidelity → shared completion pipeline → give-up/resume → per-step coins & per-chapter stars through the banked ledger. *The game is now the full PLAN.*

**Phase 4 — The initiation layer (the approved mechanics).**
ISO dates through `pkStepFrom` + step model → the Clock (campfire picker, pace lines, week strip; accent+gold only) → **Campfire screen + boot change + 🔥 nav slot** (MVP can point at exam-3's next part even before Phase 3 finishes — dates exist in the campaign) → Press-▶ start-state + showed-up ember + seated tomato → Tomorrow's Promise + evening tea scene. *This phase is the product's job; everything before it is load-bearing structure.*

**Phase 5 — The focus marriage.**
Worker Focus endpoints (create/read, per feasibility) → ▶ starts a native TickTick session → idempotent record sync → +1 xp/min bonus + auto-tomato drops + streak-by-focus → focus chip in HUD → degraded-mode fallbacks. Then the room's promotion: decor shop line, trade-in copy, tea polish. Slot rebalance (10/day + payday spin) lands here, when the new income makes it visibly necessary.

**Phase 6 — The shelf.**
View Stats + lazy archive slot, hub flag tallies + gang-on-card, express lanes ("plan my week", exam template), charms v1 / buddy wave 2, postcards, gang travel animation, world motes, level-up flourish 2.0.

**Standing gates for every phase:** exam-3 CSS/renderer untouched (screenshot-diff it); balances/XP never jump on upgrade; every new screen follows render-on-show + `scheduleTrail` discipline; blob size telemetry green; the 484px embed is the primary viewport; and the one question that orders any backlog fight — *does it change the 10 seconds after Antonio opens the app on July 3rd?*
