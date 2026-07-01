# Side Quest — Shop · Gamble · Economy Redesign
## "The Twilight Market & the Payday Machine"

*Dedicated redesign pass per the owner's mandate ("shop + gambling — improve overall"), building on the UNIFIED-LOOP weave (`live_game_weave.md`): banked ledger, ~180 coins/wk from steps + tomatoes, ~7–10★/wk from chapters/quests, slot inverted into a post-work payday ritual, pomo-room decor as the flagship coin sink, charms v1 shipped or cut.*

**Grounded in code:** `quest.html` — derived economy (624–632), `adjustBalance`/`aq_econ` spent-ledger (626–629), 5-hat `COSMETICS` (881–887, 50–140 coins), slot machine (923–967: 8-coin spins, 40/day cap, weighted `SLOT_SYMS`), gacha (`HATCH_COST=3`, `PITY=10`, dupes +12c, 708–811), pomo trade-in (`POMO_PRICE=5`, 969–1044), dev grant/wipe (1126–1128), snapshot v2 (1051).

**Design laws (from owner steering):** cohesion · flow-state · zero friction · cozy ("effort earns rest") · judged on LOOK / PERFORMANCE / PRACTICALITY · nothing ever pays for avoidance · no shaming, no decay · balances bit-identical through migration.

---

## PART 0 — Audit: what the numbers actually are today

**The slot machine, measured** (weights 🍒30 🔔24 🍀18 💎12 ⭐12 7️⃣4; cost 8c; computed from `SLOT_SYMS`/`slotPay`):

| Metric | Value |
|---|---|
| Hit rate (any payout) | **27.7%** — nearly 3 of 4 spins are "no luck" |
| Coin RTP | **23.6%** (EV 1.89c back per 8c spin) |
| Star EV | 0.045★/spin → **~135 coins per star** |
| Daily cap burn | 40 spins × 8c = **320c/day** — 1.8× the *new weekly* income |
| Star farm ceiling | 40 spins/day → 1.8★/day possible for 244c net — cheaper than studying a chapter *feels*, which is the anti-feature |

Verdicts: the cap is sized for the old 248-coin campaign and the machine's only real prize (stars) makes it a slow coin→star converter you idle at. It rewards *being in the app*, pays mostly nothing (73% dead spins — feel-bad in a cozy game), and sits at the shop's first paint.

**The shop, measured:** 5 hats totaling 330c — exhausted in under 2 weeks at 180c/wk. Two "coming soon" teases (shop line 430, mascot sheet line 469) with nothing behind them. No decor for sale despite the pomo room already compositing canvas decor (`pomoDecor()`, 1021).

**The wallet:** brilliantly self-healing (balance = derived earned − stored spent) but already leaking grants outside derivation (slot wins, tomato sales, dupes, dev grant are all negative-spends), and it breaks under give-up/lifetime-XP semantics — hence the weave's banked ledger, which this report treats as the foundation (R1).

---

## PART 1 — Ranked redesign

Legend per item: **Rationale · Numbers · Surface (files/functions) · Risk · Perf · When** (PROTOTYPE-NOW = build/tune immediately, safe pre-fold or in `quest-next.html`; AT-FOLD = lands with the v3 migration/weave phase).

---

### R1 — The banked ledger + `bank()`: one auditable front door for every coin and star ⭐ FOUNDATION
- **What:** `aq_econ` becomes `{ce, se, c, s}` (coins-earned, stars-earned, coins-spent, stars-spent). Balance = `max(0, ce−c)` / `max(0, se−s)`. Two functions replace all ad-hoc `adjustBalance` calls: `bank(dc, ds)` (earning: steps, chapters, quest bonuses, tomato trade-ins, slot wins, dupes) and `spend(dc, ds) → bool` (purchases: returns false and reverts if insufficient — no clamping surprises). Un-checking a step within the session un-banks (mirror of `awardXP(-x)`); give-up/archive/edit never claw back.
- **Rationale:** Every other item in this report is a faucet or a sink; without a single greppable choke point the economy can't be tuned or audited. This is also the weave's settled direction (§1.3) — this report just specifies the API and the invariants.
- **Numbers (invariants):** migration seeds `ce = coinsEarned()`, `se = starsEarned()` from the current derived functions on first v3 boot → **visible balances bit-identical** (the no-jump rule). `spend()` wraps its `setItem` in try/catch and checks the return (perf-report finding: `adjustBalance` writes are unwrapped today — a quota throw mid-purchase currently loses coins conceptually spent).
- **Surface:** `quest.html` 621–632 (`readEcon/coinBal/starBal/adjustBalance` → new module), every current `adjustBalance` call site (cosAction 920, slotSpin 948/959, hatch 802/808, sellPomos 1043, devGrant 1127), `snapshot()` 1051 (v:3), migration block at boot.
- **Risk:** Medium — it's the save-format change. Mitigations already specified by the migration audit: pre-migration backup key, version-aware adopt, seed-from-derived. The old derived functions stay in the file as the migration seeder + a dev-tools "audit wallet" check (`ce ≥ derived` sanity).
- **Perf:** Neutral-to-better (same tiny key; fewer redundant JSON parses if balances are cached in-memory and invalidated on bank/spend).
- **When:** AT-FOLD (Phase 1 of the weave). Everything below assumes it.

---

### R2 — The Payday Machine: the gamble inverted into a post-work ritual ⭐ THE HEADLINE
- **What:** The slot machine stops being an always-lit idle pocket and becomes a **payday ritual that studying switches on**:
  1. **The machine boots dark.** Reels dim, lever locked, a small unlit lantern on the cabinet. Copy: *"the machine wakes up after your first quest step."* It is physically incapable of rewarding a day with no work.
  2. **First completed step of the day → the machine lights up** (lantern flickers on, one soft `xp` chime, HUD whisper from the tomato: *"payday~ 🎰"*) **and mints 1 free GOLDEN SPIN.** Golden spin = guaranteed pair-or-better, all coin payouts ×2. It never expires within the day but doesn't stack across days (one `paydayDay` date flag — un-check/re-check can't re-mint it).
  3. **Paid spins: 10 coins each, cap 10/day** (down from 8c/40). Cap counter reframed as cozy, not scarcity: "the machine sleeps after 10" instead of "spins left."
  4. **Bonus golden spins for milestones:** +1 on each chapter cleared (max +2/day), +1 on quest complete. Payday spins are part of the completion celebration cascade — the coin flight lands, then the lantern pulses.
- **Rationale:** This is the one feature the weave flags as pointing away from studying. Demoting the cap alone still leaves an EV-negative idle toy; *earning the light and the golden spin* mechanically mirrors the whole game's thesis (effort → celebration → rest). The daily free spin also gives the machine a reason to exist for a player who never gambles coins: it becomes a 10-second post-work fireworks button.
  - **Why not cut it?** It's the game's only luck verb, the cabinet art is loved, and a *bounded* gamble is a healthy surplus sink. The fix is relationship-to-the-day, not deletion.
- **Numbers:** worst-case daily coin burn falls 320c → 100c (≈ 56c net at the new RTP, R3). Weekly realistic: 5 golden spins (free, ≈ +20c-equiv each) + ~10–25 paid spins ≈ **60–140c/wk net sink** against 180c/wk income — a meaningful, optional sink that can't bankrupt the decor goal (R4). Star farming: ≤10 paid spins/day at 0.021★/spin effective = **max 0.21★/day from gambling, at ~267c/★** — studying one chapter (1★, ~30 min) is always ≥5× more star-efficient than a full day of gambling. Unfarmable by construction.
- **Surface:** `quest.html` `SLOT_COST/SLOT_CAP` (925), `slotToday()/slotLeft()` (926–927) — `aq_slot` grows `{d, n, g, paydayDay}` (g = banked golden spins; stays device-local, fine per weave), `updateSlotInfo()` (943) gains the lit/dark state, the completion pipeline (`cwToggle` wrapper, 1073–1081 → the shared `completeStep()` at fold) grants the payday spin, `.slot-cab` CSS (267–274) gets `.asleep`/`.lit` states + lantern element.
- **Risk:** Low-Med. Design risk: Antonio liked 40 spins — but the golden-spin gift + juicier reels (R3) trade quantity for quality; if it stings, the fallback is cap 15, never 40. Technical risk: date-boundary edges — reuse the existing `dayStr` pattern.
- **Perf:** Neutral. Same 3 intervals (already cleaned up correctly). The lantern glow animates opacity on a pseudo-element (compositor-only, per perf report finding on box-shadow animation).
- **When:** Mechanics AT-FOLD (Phase 5 in the weave, when income makes it necessary) — but the **dark-until-first-step state and payday grant can ship PROTOTYPE-NOW** against the current economy (grant works off the existing `cwToggle` wrapper; it only makes the live game *less* exploitable).

---

### R3 — Reels v2: juicier, cozier, and paying the right prizes
- **What:** New 7-symbol reel + paytable, tuned so **more spins pay, payouts are cozier, and stars become a delight instead of a pipe**:

  | Symbol | Weight | Match | Pays |
  |---|---|---|---|
  | 🍒 cherry | 28 | pair / triple | +10c / +25c |
  | 🔔 bell | 22 | triple | +40c |
  | 🍅 **tomato (new)** | 16 | pair / triple | **+1 tomato / +4 tomatoes drop into the pomo room** (startle-hop and all — `dropPomo()` already does the choreography) |
  | 🍀 clover | 14 | triple | +60c |
  | 💎 diamond | 10 | triple | +25c **+1★** |
  | ⭐ star | 7 | pair / triple | +1★ / +3★ |
  | 7️⃣ seven | 3 | triple | **JACKPOT:** first time = the exclusive **🎏 lucky koi hat** (slot-only cosmetic, not purchasable) + 3★; repeats = 100c + 5★ |

  Plus a **warm-streak guarantee** (pity for slots): after 3 dry spins, the 4th pays at least a pair. Copy on a dry spin softens from "no luck — spin again" to a rotating cozy line ("the reels yawn…", "almost! the bell winked").
- **Numbers (simulated, 2M spins, with warm streak):** hit rate **38.8%** (vs 27.7%), coin RTP incl. tomato value **44%** (vs 23.6%), net burn **5.6c/spin**, star EV 0.021/spin → **267c/★** (vs 135 — the coin→star conversion pipe is deliberately *worse*, because stars now flow from chapters; the slot's stars are lottery sparkle, not an exchange rate). Golden spin (R2: guaranteed + coins×2) ≈ **+18–22c-equivalent** daily gift.
- **What the slot does NOT pay (decisions):**
  - **No decor drops** — decor is the "effort furnishes rest" purchase (R4); winning your lamp in a slot cheapens the flagship sink's meaning and its save-up arc.
  - **No buddy pulls** — the gacha's pity math and pull ceremony are its own polished loop; a second RNG door into the dex would double-dip randomness and undercut the 3★ hatch. One exclusive *cosmetic* chase (the koi hat) is the whole crossover.
  - **Tomatoes YES** — the cheapest, coziest cross-link in the game: a slot win that makes the *rest room* more alive, using 100% existing code.
- **Rationale:** 73% dead spins is casino psychology, not cozy game feel. ~39% hit + warm-streak + near-miss reel staging (third reel slows an extra 200ms when two match — one `setTimeout` constant) makes 10 spins feel like an event, not a grind. Tomato and koi prizes make wins *about the game's world* instead of raw currency.
- **Surface:** `SLOT_SYMS`/`slotPay` (924–940) — pure table swap; `slotSpin` (944–966) gains the dry-streak counter (in `aq_slot`), the near-miss delay, and a `dropPomo()` call (guard: if pomo screen hidden, bank to `pomoState.room` silently and let the room show them on next visit — `pomoState.room++` + `savePomo()` without the DOM entity); jackpot flag in `aq_cos.owned.koi`; `slot-odds` legend line (422) rewritten.
- **Risk:** Low — data-table change on proven machinery. Tune weights in a spreadsheet before shipping; keep the sim harness (this report's math) as the tuning tool.
- **Perf:** Neutral. `dropPomo` while room hidden must not touch `POMO_AREA` (it early-returns today — add the counter-only path).
- **When:** PROTOTYPE-NOW (table + warm streak are safe against the live economy; ~10 lines beyond constants). Golden-spin doubling lands with R2.

---

### R4 — Room & Board: pomo-room decor as the flagship coin sink ⭐ THE COZY AXIS
- **What:** A **decor shelf** in the shop that furnishes the pomo room — the "effort furnishes rest" thesis as an economy. Catalog v1 (~14 items, all canvas-pixel-drawn like `pomoMoonURL/pomoRugURL`, all visible in the live room the moment they're bought):

  | Tier | Item | Price | Effect in room |
  |---|---|---|---|
  | Cozy (40–90c) | rug recolors ×3 (rose/teal/gold) | 60c ea | swaps `pomoRugURL` palette |
  | | wall poster ("lock in") | 40c | static sprite |
  | | tea mug on the floor | 50c | static sprite; mascots pause near it |
  | Comfort (120–220c) | warm lamp | 140c | soft radial glow gradient, tiny light pool |
  | | string lights | 160c | 5 twinkle dots (opacity anim, capped) |
  | | bookshelf | 180c | static sprite, med-school spines |
  | | tea table | 220c | tea scene (weave §3.5) uses it when present |
  | Dream (280–420c) | kotatsu | 320c | mascots path to it and nap (reuse roam targets) |
  | | rain window | 300c | toggleable rain strip + `rain` sfx loop (the orphaned mp3, ≤250KB re-encode per perf report) |
  | | sakura window | 300c | petal drift, 4–6 motes (perf budget) |
  | | aquarium | 420c | 2 pixel fish on sine paths — the prestige piece |

  Catalog total ≈ **2,290c ≈ 12–13 weeks of income** — a full season of "one nice thing for the room every week or two," with three clear tiers of goal.
- **Rationale:** The weave names this the flagship sink and the aesthetic notes make the room the emotional core ("warm room you want to be in"). It converts coin surplus into *permanent, visible coziness* — every purchase makes the rest beat of the loop literally better, so spending money reinforces the loop instead of leaking out of it. It's also the anti-inflation flywheel: unlike hats (5 slots, one equipped), a room accumulates.
- **Numbers:** first goal reachable week 1 (rug, 60c), first "saved up for it" moment week 2 (lamp, 140c), the kotatsu is a fortnight's ambition, the aquarium a month's. Nothing is ever *required* — the room is charming empty (it already is).
- **Surface:** new `DECOR=[...]` table + `aq_decor {owned:{}}` key (joins snapshot v3 — ~100 bytes, well inside payload budget); `pomoDecor()` (1021–1028) becomes data-driven off `DECOR` + ownership (it's already an add-sprite loop — this is its designed extension point); shop screen gains the shelf (R5); tea-scene integration reads ownership.
- **Risk:** Medium — it's the most *new art* in this report (each item is a 20–60-line canvas function in the established style; batch them, 2–4 per sitting). Scope guard: ship Cozy+Comfort tiers first (9 items), Dream tier trickles in.
- **Perf:** The care point. Rules: every sprite rendered once to a data-URL and **cached in a module map** (the current code regenerates `drawMascotBig` data-URLs on every shop render — don't copy that; fix it while here, see R5); animated items obey the perf report's particle budget (string lights = 5 opacity-animated dots, sakura ≤6 motes, fish = 2 transform-animated nodes); all room animation lives inside the existing `pomoStart/pomoStop` RAF discipline and pauses off-screen; `prefers-reduced-motion` freezes to static frames (art report #0).
- **When:** Shelf + static items PROTOTYPE-NOW (works against the current economy; prices assume new income but 60–180c items are reachable today); animated Dream tier AT-FOLD alongside the tea scene.

---

### R5 — The Twilight Market: shop screen re-architecture (browsing that feels like a place)
- **What:** The shop screen stops being "slot machine, then hats, then an apology" and becomes a cozy market laid out along the loop:
  1. **Header:** "✦ the twilight market" (replaces "gamble 🪙 for ⭐" — that tagline is the old anti-feature's mission statement).
  2. **First paint: the decor shelf** with a **live mini room preview** — a scaled-down render of *your actual room* (same sprites, ~140px) that shows the selected item placed before you buy. Selecting a hat swaps the preview pane to the existing mascot preview. One preview pane, two modes.
  3. **Then outfits** (existing UI, grown per R6).
  4. **Then the charm cabinet** (stars — R7).
  5. **Bottom: the Payday Machine**, below the fold, dark until earned (R2). The shop's first paint is furnishing rest, not a lever.
  6. **The "saving for ✦" pin:** tap-hold any unaffordable item to pin it; a tiny progress sliver appears under the HUD coin chip (`kotatsu · 220/320`). Coins flying to the wallet (gamefeel #1) now visibly fill a *goal*. One pin at a time, zero management.
  7. **Buy feel:** every purchase = coin-flight *out* of the chip → item sparkles into the preview → soft `fanfare` → for decor, a one-tap "visit your room →" link. Zero-friction: no confirm modals for purchases under 100c (the wallet math is visible before the tap); Dream-tier items get the existing kind-confirm pattern.
- **Rationale:** Owner mandate is LOOK · flow · zero friction. Browsing is currently a vertical dump; a preview-first market with a pinned goal makes wanting → earning → buying one continuous loop that starts and ends in the study loop (the pin is literally a reason to finish another step). Moving the slot below the fold is the weave's own fallback ask, made structural.
- **Numbers:** none — this is layout + one new `aq_pin` field (device-local is fine).
- **Surface:** `#screen-shop` markup (415–431), `renderShopOutfits` (898–915) generalized to `renderMarket()` with section renderers; delete the `shop-soon` tease (430) — R7 replaces it with real goods; HUD chip sliver (one div, width%).
- **Risk:** Low-Med — the biggest DOM change in this report, but screen-local and render-on-show.
- **Perf:** Fix while here: **cache cosmetic/decor data-URLs** (`drawMascotBig` runs 2+N times per render today, every tap — memoize by `kind+cosId`); render the market only on nav-show (already the pattern, 1094); mini room preview is static sprites, no RAF.
- **When:** PROTOTYPE-NOW (pure presentation; carries the fold).

---

### R6 — Outfits grown, priced in tiers, with world echoes
- **What:** Hat catalog 5 → 12, priced into legible tiers against 180c/wk income, worn everywhere hats already render (HUD, avatar, pomo dumpling, shop preview — free, it's one `drawHat` case each):

  | Tier | Items | Price |
  |---|---|---|
  | everyday | party hat (50), scholar cap (60), **tea-cozy hat (60)**, **sprout (70)** | 50–80c |
  | fancy | bloom (80), **snow cap (90)**, **wizard hat (120)**, royal crown (140) | 80–150c |
  | prestige | **sakura petal crown (200)**, **halo (240)**, **stethoscope (180 — the med-student wink)** | 180–240c |
  | unbuyable | **🎏 lucky koi** (slot jackpot, R3) · **⭐ graduate cap GOLD** (auto-granted when exam-3 completes — the founding-quest trophy you *wear*) | — |
- **Rationale:** Existing prices were sized to a 248c campaign and stay untouched (repricing owned goods reads as betrayal — same rule as HATCH_COST). Growth goes *up* in aspiration instead of sideways in clutter; world-themed hats (sakura/snow) pre-seed the worlds feature per weave §1.5; the two unbuyables give both the gamble and the campaign a cosmetic legacy.
- **Numbers:** new-item total ≈ 960c ≈ 5 weeks of income if hats were the only sink — correctly secondary to decor.
- **Surface:** `COSMETICS` table (881) + one `drawHat` branch per hat (854–857 pattern, ~4 rects each); `aq_cos` unchanged in shape.
- **Risk:** Low. Art time only.
- **Perf:** Neutral with the R5 data-URL memoization.
- **When:** PROTOTYPE-NOW (a few hats per sitting; prestige tier can trail).

---

### R7 — Charms v1: ship three, delete the teases ⭐ SHIP-OR-CUT RESOLVED: SHIP
- **What:** The star-priced **charm cabinet** (shop) + the mascot sheet's charm row goes live with exactly three cozy-safe items — never stat power, never XP/coin multipliers:

  | Charm | Price | What it does |
  |---|---|---|
  | 🕯 **rest ember** | 2★ (hold max 2; **1 earned free per 7-day streak**) | streak keeper: a missed day quietly consumes it and the flame stays lit. Bought rest, zero guilt — the anti-decay contract as an item. |
  | 🍵 **tea set** | 6★ (one-time) | permanently upgrades the evening tea scene (nicer service, +1 idle animation; pairs with the tea table decor). A star *heirloom* — the milestone tender buying a milestone feeling. |
  | 🍀 **clover charm** | 1★ (consumable, max 1 held) | your next payday-machine spin is golden (guaranteed pair-or-better, coins ×2). Stars → one moment of luck — links the milestone tender to the ritual without creating a farmable pipe (1★ → ~+20c EV = deliberately "bad" exchange that's about the moment, not the money). |
- **Rationale:** The weave is blunt: a "coming soon" older than the feature it teases reads as abandonment — ship v1 or delete the copy. This v1 is deliberately tiny (one keeper, one heirloom, one moment) and doubles as the **post-dex star sink**: once the 12-buddy dex closes (~6–8 weeks at 2–3 pulls/wk), embers + tea set keep stars meaningful until buddy wave 2.
- **Numbers:** expected star spend ~1–2★/wk alongside 2–3 hatches — stars stay scarce enough that a hatch is never trivial, plentiful enough that a pull lands every few days (healthy cadence per weave §3.3).
- **Surface:** new `CHARMS` table + `aq_charms {ember:0, tea:0, clover:0, emberEarnedWk:''}` (snapshot v3, ~60 bytes); shop cabinet section (R5); mascot-sheet row (469) shows *owned* charms instead of the tease; streak logic consumes embers in the (already planned) real-streak check; `slotSpin` checks/consumes clover.
- **Risk:** Low-Med — touches the streak system (Phase 1 spine), so it lands after the real streak exists. The ember's "quietly consumed" moment needs one gentle toast ("your ember kept the flame 🕯") — never a loss notice.
- **Perf:** Trivial.
- **When:** AT-FOLD (needs real streak + banked ledger). **PROTOTYPE-NOW: delete both "coming soon" teases** (lines 430, 469) — a one-line honesty patch that stands alone even if charms slip.

---

### R8 — Star economy pacing: protect the hatch, schedule the sinks
- **What:** Codified star policy for the new income (~7–10★/wk):
  - `HATCH_COST` stays **3★**, `PITY=10` stays, dupes stay +12c (now via `bank()`). Repricing = betrayal; add sinks instead (weave §3.3, endorsed).
  - Star sinks in order of arrival: gacha (now) → charms v1 (R7, at-fold) → **buddy wave 2 or bond system before the dex closes** (~week 6–8 of the new economy; owned by the buddies redesign pass, but this report reserves the star budget: keep total star sinks ≥ income by then).
  - Stars are **never purchasable with coins at a sane rate** — the slot's 267c/★ EV is the only bridge and it's intentionally terrible (R3). No direct exchange UI, ever: coins = grind tender (things finished), stars = milestone tender (chapters/quests). Blurring them is how both go meaningless.
- **Rationale:** The dex completing with no sink is when gacha dies; the schedule above means stars never pile up unspendable *and* never gate the loop.
- **Surface:** none now beyond R7; a calendar note for the buddies pass.
- **Risk:** Low (policy). **When:** policy PROTOTYPE-NOW; wave-2 trigger tracked at-fold.

---

### R9 — The balance sheet: weekly income vs sinks (the inflation audit)
- **What/Numbers:** the whole economy on one card (typical week: ~13 steps avg 10xp, ~10 pomos, 1 quest finished, 5 study days):

  | | Coins | Stars |
  |---|---|---|
  | **IN** steps | ~130 | — |
  | **IN** tomato trade-ins (~10 × 5c) | ~50 | — |
  | **IN** slot winnings (net of stake, see OUT) | (included below) | ~0.2–0.4 (sparkle) |
  | **IN** chapters + quest bonus | — | ~5 + 3 |
  | **IN** dupes (avg) | ~10–25 | — |
  | **TOTAL IN** | **~180–200/wk** | **~8–11/wk** |
  | **OUT** slot (net, 10–25 paid spins) | 60–140 | — |
  | **OUT** decor (1 item most weeks) | 60–220 | — |
  | **OUT** hats (occasional) | 0–140 | — |
  | **OUT** hatches (2–3) | — | 6–9 |
  | **OUT** charms | — | 0–2 |

  **Steady state:** coins hover near zero with a pinned goal always 1–2 weeks out (pleasantly stingy — the weave's "0.75× old rate" instinct, preserved); stars cycle through the hatch with a small charm remainder. **Faucet firewall reaffirmed:** focus minutes mint XP only, never coins (their coin trickle is the tomato, routed through the trade-in choice); pity systems mint no currency; the payday spin is the only free-money event and it's ≈20c/day, gated on a completed step.
  - **Anti-exploit checks:** un-check/re-check loops — banked `ce` un-banks on same-session un-check, payday flag is per-calendar-day, chapter stars bank once (chapter-clear event, not re-derived); slot farming — EV-negative, capped, dark until work; tomato farming — manual "log one by hand" stays (honesty valve, weave §1.7) but tomatoes only mint coins on trade-in at 5c ≈ 25 real minutes; if manual logging ever gets abused the valve moves behind a daily soft-cap of 12 logs, not deleted.
- **Surface:** constants + this table kept next to `bank()` as a comment block — the tuning card.
- **Risk:** Low. **Perf:** n/a. **When:** ships with R1 (the numbers are R1's test plan).

---

### R10 — Juice pass on spend/win moments (the LOOK column)
- **What:** Small, shared FX so every economy beat lands (all reusing existing systems, complementing — not duplicating — gamefeel #1/#3):
  - **Coin flight both ways:** wins arc coins *to* the chip (gamefeel #1, extended to slot wins + trade-ins which currently just re-count); purchases arc coins *out* of the chip into the bought item + chip does a small dip-pop. Symmetry makes spending feel like a choice, not a subtraction.
  - **Reel staging:** near-miss slow-down (R3), per-payout-tier celebrations kept as-is (they're already tiered, 960–962), golden spin gets a gold reel-window tint + the `legend` sting on jackpot only.
  - **Decor placement moment:** bought item drops into the mini-preview with the pomo-room's fall-and-squish physics verbs (visual echo, not shared code); the room itself sparkles the new item on next visit (one-shot class).
  - **Payday lantern:** the day's transition dark→lit is the single most important frame of this redesign — one 600ms flicker-on animation, one whisper, done. Never loops, never nags.
- **Rationale:** The owner's three judgment axes start with LOOK; the economy's *feel* is what makes 10 capped spins beat 40 idle ones.
- **Surface:** `coinFloat` sibling `coinFly` (gamefeel #1's spec), `.slot-cab` states, `renderMarket` one-shot classes.
- **Risk:** Low — additive FX. **Perf:** WAAPI transforms/opacity only; bursts respect the concurrent-burst cap (perf report). Reduced-motion: flights become instant count-ups.
- **When:** PROTOTYPE-NOW (coin flight is already a live-safe gamefeel item; the rest rides its system).

---

### R11 — Migration & hardening (bit-identical wallets, guarded dev tools)
- **What:**
  1. v3 boot: back up `aq_econ/aq_cos/aq_buddies/aq_pomo/aq_slot` to `aq_backup_v2` (one key), then seed `{ce,se}` from derived, keep `{c,s}` verbatim → `coinBal/starBal` render identical numbers pre/post (assert in dev tools; the no-jump rule).
  2. New keys (`aq_decor`, `aq_charms`, extended `aq_slot`) join `snapshot()` v3 under the payload budget (all ≤ ~200 bytes combined); version-aware adopt refuses to let a v2 client clobber a v3 blob (per perf/migration reports).
  3. **Dev grant/wipe leave the sync panel** (1126–1128) — behind the triple-tap-on-version gate (weave #8). A visible "＋60🪙" button and a banked ledger cannot coexist; the wipe now also has to know about decor/charms or it half-wipes.
  4. The old derived-economy functions remain as the **wallet auditor**: dev tool "recompute floor" flags `ce < coinsEarned_derived()` drift (self-healing *property* preserved as a check, per perf finding 12).
- **Rationale/Risk/Perf:** This is the practicality column — the redesign is only as good as the upgrade nobody notices. Risk Medium (save format), fully mitigated by backup + seed + assert. **When:** AT-FOLD, same commit as R1.

---

### R12 — Cohesion audit: every path starts work, celebrates finishing, or funds rest
- **What:** The rule from the weave ("every reward path either starts work or ends in rest"), applied as a checklist this redesign passes:

  | Path | Classification | Check |
  |---|---|---|
  | earn coins (steps) | celebrates finishing | ✓ per-step bank + flight |
  | earn coins (tomatoes) | funds rest ← real focus | ✓ auto-drop, trade-in choice |
  | earn stars (chapters/quests) | celebrates finishing | ✓ milestone ceremony |
  | payday golden spin | celebrates finishing | ✓ minted by first step; machine dark otherwise |
  | paid spins | funds rest (bounded play) | ✓ capped, EV-negative, unlit until work |
  | buy decor | funds rest | ✓ furnishes the loop's rest chamber |
  | buy hats | self-expression at every surface | ✓ worn in work views too |
  | buy charms | protects rest (ember) / deepens rest (tea) / one moment of luck (clover) | ✓ never stat power |
  | hatch buddies | companionship (rest + map) | ✓ star sink with places to exist |
  | "saving for" pin | **starts work** | ✓ the goal is visible where earning happens |

  And the restraint list, inherited whole: no notifications, no red states, no decay (ember *prevents* the only reset), no FOMO timers or rotating stock (a cozy market is *always* stocked — rotating shops are engagement mechanics, not cozy ones), no real-money anything, ever.
- **When:** the standing gate for every economy PR.

---

## PART 2 — What changes for Antonio, day one

Morning: campfire → first step done → **the market's lantern flickers on across the app, one golden spin waiting**. He spins it after the study block — guaranteed something: coins arc to the wallet, or two tomatoes tumble into his room. His coin chip shows `lamp · 110/140`. Two more steps and it's his. The lamp goes in the room where his real focus time already lives as tomatoes. Saturday's chapter stars hatch a buddy who joins the tea scene the tea set upgraded. Nothing in this paragraph rewards opening the app instead of the lecture — and everything in it rewards closing the lecture.

## PART 3 — Build order (within the weave's phases)

1. **PROTOTYPE-NOW batch** (safe against the live economy): delete the two "coming soon" teases (R7) · slot table v2 + warm streak (R3) · dark-machine + payday spin (R2 core) · market layout + preview + pin + data-URL memoization (R5) · 3–4 new hats (R6) · decor shelf with Cozy tier statics (R4) · coin-flight symmetry (R10).
2. **AT-FOLD, Phase 1** (with the v3 save): banked ledger + `bank()/spend()` (R1) · migration + backups + dev-tool gating (R11) · balance-sheet constants (R9).
3. **AT-FOLD, Phase 5** (with focus marriage + new income): golden-spin milestones (R2 full) · Comfort/Dream decor incl. rain window wiring the orphan mp3 (R4) · charms v1 on the real streak (R7) · star-sink schedule check (R8).

**Standing gates:** balances bit-identical on upgrade · exam-3 renderer untouched · shop renders on show only · particle/timer budgets green · 484px embed is the primary viewport · and the ordering question: does it make the 10 seconds after finishing a step feel better?
