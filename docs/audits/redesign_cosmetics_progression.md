# Side Quest — Customization & Progression-Reward Redesign
## "Make It Yours" (the Wardrobe + the Nest) · "The Climb" (the finetuned reward ladder) · the Charms verdict

*Dedicated pass per owner round-3 steering: level rewards = **level-locked COSMETICS, never feature/world-slot unlocks** · **charms default CUT** (high bar for any survivor) · **mascot cosmetics UNIFIED with room decor** into one cozy customization system (liberty to expand) · rewards skew **non-coin** (focus-XP-never-mints-coins firewall) · judged on cozy · LOOK · PERFORMANCE · PRACTICALITY.*

**Grounded in code (read, not edited):**
- `quest.html` — `drawHat` (851, 4 hats as unit-coord rect ops), `drawMascotBig(kind,cosId)` (860), `hatIconURL` (880), `COSMETICS` 5-row table (881–887), single shared `COS={owned,eq}` + `applyCos` layering one hat over BOTH mascots via `slimeHat`/`tomHat` (888–896), `renderShopOutfits`/`cosAction` (898–921, re-rasterizing data-URLs every render), mascot sheet (825–847: the stage, `sayBubble`, stat rows), `pomoDecor()` (1021–1028: moon/stars/rug add-sprite loop — the designed decor extension point), `snapshot()` v2 carrying `cos`/`pomo` (1051), campaign `RANKS` capped at 240xp (527).
- `quest-next.html` — the **lifetime, open-ended leveling** this ladder builds on: `xpForLevel(L)=50+25(L−1)` (405), `levelInfo` (406), `RANKS` at levels 1/3/5/8/12/16/20/26 → fresh start · warming up · in the zone · locked in · on a roll · unstoppable · legend · ascended (401), `awardXP`/`renderHUD(levelUp)` (410–420).

**Ownership map (build-on, don't redo):** coin prices, the decor-shelf catalog+prices, the 12-hat catalog+prices, the Payday Wheel mechanics/odds/golden-spin definition, and `bank()/spend()` belong to **redesign_shop_economy.md** (R1–R6, R9). The Den's slots/`--hearth`/tea beat belong to **redesign_pomo.md** (#4/#6). Streak milestones, flame tiers, the warm window belong to **redesign_streak.md**. Buddies are **untouched** (redesign_buddies.md — this doc never dresses a buddy). Level-up/ceremony *feel* is **reward_animations.md §4** — this doc supplies its payout table. This doc owns: the customization **experience** (equip/preview/display/collection), the **exact reward ladder numbers**, and the **charms ruling**.

---

## PART 0 — Audit: what customization and leveling are today

**Cosmetics:** one slot, shared by both mascots (`COS.eq` is a single id; the dumpling and tomato are forcibly twins). 5 hats, 330c total, exhausted in <2 weeks. Equipping happens only inside the shop screen; the mascot sheet *displays* the outfit but can't change it. Hats do render everywhere that matters (HUD overlays, map avatar, shop preview, sheet) — the pipeline is good; the wardrobe in front of it doesn't exist.

**Decor:** `pomoDecor()` is hardcoded (moon, 5 stars, rug). Zero player choice. The shop redesign adds the buy-side (decor shelf, ~14 items); nobody yet owns the *arrange/display* side, the collection feel, or what happens when milestone-exclusive decor (streak day-14/30) and level-granted decor start accumulating alongside purchases.

**Leveling:** the prototype's lifetime XP pool is right (open-ended, +XP from steps and focus minutes) — and pays **nothing**. `renderHUD(levelUp)` does a 0.5s CSS pop. Rank titles change silently. There is no reason to look at the bar. The owner's verdict ("level-ups must PAY OUT") stands unimplemented, and the campaign-file `RANKS` (240xp cap) is a dead end the fold replaces.

**The unification insight this doc runs on:** hats and lamps are the *same pleasure* — small pixel things you earned that make your crew and your room more yours — currently living in two unrelated code paths with no shared collection feel, no shared "locked/owned/new" grammar, and no ladder feeding them. One system, two verbs: **wear** and **place**.

---

## PART 1 — MAKE IT YOURS: the unified customization system (ranked)

Legend per item: **Rationale · Surface · Risk · Perf · When** (PROTOTYPE-NOW = safe against the live game or in `quest-next.html`; AT-FOLD = lands with the v3 migration/weave phases).

---

### C1 — One system, two verbs: the shared grammar of "yours" ⭐ THE KEYSTONE
**What:** Every ownable cosmetic thing in the game — hats, accessories, den decor, granted keepsakes — obeys ONE grammar, everywhere it appears:

| State | Renders as | Copy grammar |
|---|---|---|
| locked by level | dark silhouette of the real sprite + small `lv 14` tag | *"unlocks at lv 14"* — a climb goal, never a tease |
| locked by deed | silhouette + one-line rumor | *"the wheel knows"* (koi) · *"day 50 remembers"* (ember scarf) |
| purchasable | full sprite + price chip | shop-doc register |
| owned, unworn/unplaced | full sprite on the closet rail / nest outline | — |
| worn/placed | sprite live on the mascot / in the room | — |
| NEW (this session) | one-shot sparkle + tiny ✦ pip until first viewed | never a badge count, never persistent |

And one shared acquisition river: **shop purchases (coins) · level-locked shop stock (P4) · rank-up grants (P2) · milestone golden eggs (P3) · streak-exclusive drops (streak R7) · the wheel's koi jackpot (shop R3)** — all pouring into the same two closets (worn things in `aq_cos`, placed things in `aq_decor`). No item type ever has its own bespoke UI pattern again.

**Data model (coordinated, not invented):** `aq_cos` keeps shop R6's shape for `owned`, and grows `eq` from a string to `{dump:{hat,acc}, tom:{hat,acc}}` (see C2; migration: old `eq:'grad'` → both mascots wear it — **bit-identical look on upgrade**, the no-jump rule applied to pixels). `aq_decor` (shop R1/R4's key) = `{owned:{}, hidden:{}, variant:{rug:'teal'}}` — ownership stays shop-owned; this doc adds only `hidden` + `variant` (see C3). Granted items are ordinary `owned` entries with a `src:'rank'|'streak'|'wheel'` flag so the shop renders them as "keepsake — not for sale" instead of priced. Total new bytes ≈ 80; inside the snapshot v3 payload budget.
- **Rationale:** "Unified system" must mean unified *grammar*, or it's just two shops. The silhouette+lv-tag pattern is also how the buddies dex teaches desire (rumors) — reusing the language makes the whole game read as one collection philosophy without merging systems that shouldn't merge.
- **Surface:** a `STYLE_STATE(item)` helper consumed by the market renderer (shop R5), the closet rail (C5), and nest mode (C3); `aq_cos` migration in the v3 boot block beside the ledger seed (shop R11).
- **Risk:** Low — it's a convention plus a migration. The migration is 6 lines and testable (equip crown, upgrade, both mascots still crowned).
- **Perf:** silhouettes = the existing draw fns with all colors → outline (buddies #5's trick); cached data-URLs like everything else.
- **When:** PROTOTYPE-NOW (the grammar) / AT-FOLD (the `eq` migration ships with snapshot v3).

---

### C2 — Dress the gang: per-mascot hats + the accessory slot ⭐ THE EXPRESSIVE WIN
**What:** Break the forced-twins rule. Each of the two mascots gets **2 slots: hat + accessory**, equipped independently:
1. **Per-mascot hats** — the dumpling in the scholar cap while the tomato wears the party hat is the single cheapest expressiveness multiplier available: the existing 12-hat catalog (shop R6) becomes 144 gang combinations with zero new art.
2. **The accessory slot** (new category, canvas-drawn in the `drawHat` idiom — a `drawAcc(c,id,cx,y,s)` sibling anchored at neck/face height): launch set of 6 — **round scholar glasses** (rank grant, P2 — the slot's tutorial item), **knit scarf**, **bowtie**, **tiny satchel**, **star bandana**, **tea-cozy mitts**. Shop-priced ~60–90c each (final prices to the shop doc's register — the coin economy is theirs; this doc contributes the category + art specs).
3. **Renders everywhere the hat already does** — HUD overlays (`slimeHat`/`tomHat` become two layered imgs or one composited hat+acc icon each), map avatar, den roamers, mascot sheet, campfire/tea scenes at fold. One render contract: *if a mascot appears, it appears dressed.* (Buddies explicitly excluded — their identity system is their own doc's; the koi hat's jackpot landing shifts to the tomato's head, amending reward_animations 6c one word.)
4. **Matching-moment garnish:** dress both mascots in the *same* hat → a tiny pixel ♥ floats between them once (sheet or den, wherever visible) + one bubble: *"twins!"* Pure charm, 5 lines of code, teaches that outfits are noticed.

- **Rationale:** The owner asked for a customization *mechanic* revamp with liberty to expand. Two slots × two characters is the sweet spot: combinatorial expressiveness without inventory sprawl (4 equipped things total — never a paper-doll micromanagement screen). Accessories also give the ladder and shop a second aspirational track that isn't "yet another hat."
- **Surface:** `drawAcc` (~15 lines/item), `drawMascotBig(kind,{hat,acc})` signature change + its 4 call sites, `applyCos` builds per-mascot composite icons, `COSMETICS` table gains `slot:'hat'|'acc'`, wardrobe UI (C4) is the equip surface.
- **Risk:** Low-Med — the `eq` shape change touches every cosmetic call site; do it in one sweep with the C1 migration. Art care: accessories must not collide with hats (glasses sit at eye row, scarf at base — disjoint anchor zones, verified per hat in the sheet preview at both scales).
- **Perf:** cache key becomes `kind+hat+acc` (~a few dozen URLs worst case, built lazily) — rides shop R5's memoization mandate; HUD icons composited once per equip change, not per frame.
- **When:** PROTOTYPE-NOW (per-mascot split + 2 accessories prove it) → full accessory set trickles with shop R6's art batches.

---

### C3 — Nest mode: furnishing the Den in the Den ⭐ THE PLACE VERB
**What:** Arranging happens **in the room, not in a menu**. A small ghost-style `nest ✦` toggle in the den header enters nest mode (~the room dims 8%, slots outline softly):
1. **Every decor slot** (pomo #4's fixed slots — floor/wall/ceiling/corner; free-drag stays banned per the pomo restraint list) shows its state: placed item, or a faint dotted outline if you own something hideable/placeable there.
2. **Tap a placed item** → a 2–4 chip picker floats above it: variants (rug: rose/teal/gold dye chips), or `hide` (→ `aq_decor.hidden`). **Tap an empty outline** → picker of owned items for that slot. One tap applies instantly — the item does the fall-and-squish placement beat (shop R10's verb), roamers startle-hop. Exit toggle = saved (it already was, per-tap).
3. **Hidden ≠ lost:** hidden items live on the closet rail (C5) with a `resting` tag. This is the pressure valve for a season of accumulation — milestone decor (streak's hearth stones, lantern), rank grants, and purchases all coexist without the room ever becoming clutter he can't opt out of.
4. **Conflict rule:** one item per slot; variants are one item. If a grant arrives for an occupied slot, it lands `hidden` with the NEW pip — never silently displaces a choice.
- **Rationale:** The shop doc owns buying; the pomo doc owns what slots exist; *nobody owned choosing*. Furnishing in situ (see it in the actual room, with the actual light, next to the actual tomatoes) is the difference between decorating a home and managing an inventory — the cozy thesis applied to interaction design. Fixed slots + variant chips is the zero-friction ceiling: expressive, never fiddly.
- **Surface:** den header button; `pomoDecor()` reads `owned − hidden + variant` (it's already the table-driven extension point per pomo #4); nest mode = one class on `.pomo-room` + a positioned chip strip (reuses `.cos-cell` styling); ~80 lines total.
- **Risk:** Low-Med — touch targets on a 484px room need one careful pass (slots are ≥40px; chips render above the tapped slot, clamped to the room box). Guard: nest mode pauses roamer *dragging* so taps are unambiguous (roamers still bob).
- **Perf:** class toggles + a re-run of `pomoDecor()` on change (already cheap, render-once sprites); zero new loops; reduced-motion: placement beat becomes appear-in-place.
- **When:** AT-FOLD with the decor shelf (needs ≥4 owned items to mean anything) — but the `hidden/variant` fields and the `pomoDecor` ownership read land PROTOTYPE-NOW so every earlier decor ship is already nest-ready.

---

### C4 — The Wardrobe: dressing at the mascot sheet ⭐ THE WEAR VERB
**What:** The mascot sheet's stage — already the place you visit your gang — becomes the fitting room:
1. A ghost `dress ✦` button on the sheet (or long-press a mascot) slides up the **wardrobe drawer** under the stage: two rails — hats, accessories — of owned items as pegged pixel icons (`hatIconURL` + `accIconURL`, cached), plus level-locked silhouettes with `lv N` tags at the rail's end (the climb, visible exactly where desire happens).
2. **Tap a mascot to select who you're dressing** (selected one does the existing jiggle + steps 2px forward); tap an item → instant equip on that mascot: jiggle, `squish`, and a **per-hat reaction line** — one new 12-entry `HAT_SAY` pool (*crown → tomato: "bow, peasant." · stethoscope → dumpling: "the doctor is IN." · koi → "glub."*). The stage IS the live preview — big sprites, both mascots, real light.
3. **The shop keeps its preview pane** (R5) for *purchase* decisions; equip actions there deep-link the same equip fn. One source of truth, two doors: shop = wanting, wardrobe = wearing. Zero duplicated state.
4. **Granted cosmetics auto-equip** on their ceremony (the rank-up moment ends with the mascot already wearing it + one line) — celebration includes the payoff, and reverting is two taps in the wardrobe. Never a claim-inbox, never an "equip now?" modal.
- **Rationale:** Today you dress your crew inside a *store* — like changing clothes at the mall register. Moving wear to where the relationship lives (the sheet where they talk and jiggle) makes customization a visit with friends, not a transaction. The reaction lines cost ~24 strings and convert every hat into a tiny character beat — the aesthetic mandate ("mascots as a warm little family") applied to cosmetics.
- **Surface:** mascot sheet markup + `renderWardrobe()` (~70 lines, reusing `.cos-cell`/`.cos-grid` CSS), `HAT_SAY` table + `sayBubble` hook, equip fn extracted from `cosAction` (916) so shop and wardrobe share it.
- **Risk:** Low — additive UI on a stable sheet. Care: the drawer must not cover the stage on short embeds (drawer max-height + stage shrinks 10%).
- **Perf:** rails render on open only; icons are the C2 cache. Nothing animates persistently.
- **When:** PROTOTYPE-NOW — this plus C2 is the customization revamp's visible core and works against the live 5-hat catalog today.

---

### C5 — The collection surfaces: closet rail, the room itself, and the home portrait
**What:** How growing the collection *feels*, kept passive (display, never demand):
1. **The closet rail** (inside the wardrobe drawer, C4) is the one place the whole worn-collection is visible — owned, resting, locked-silhouettes in level order. No completion %, no "12/23 collected" counter on worn things: the rail just gets pleasantly fuller. (Counters gamify completion; cozy collections gamify *abundance*.)
2. **The room is the decor collection's display** — deliberately NO decor dex. What you own is what warms the Den (`--hearth` tiers, pomo #4) or rests on the rail. The mascot sheet's stat rows swap `outfit: crown` for **`keepsakes: a fuller closet every week`**-style flavor — concretely: `statRow('keepsakes', ownedCount + ' and counting')`, tap → opens the wardrobe.
3. **The home portrait** — the show-off artifact: a `portrait ✦` button in nest mode composites the current room (decor, jars, tomatoes, dressed gang, equipped buddy if any) + date + streak flame into a postcard PNG (gamefeel #16's compositor; params-only storage ~40 bytes, render on demand). Saved to a tiny keepsake strip in the sheet; long-press → native share/save. This is "show it off" for a single-player cozy game: you show *yourself*, later — the furnished-room-in-June vs the empty-room-in-March.
4. **Arrival moments:** any new item's first appearance in room/rail carries the one-shot sparkle + ✦ pip (C1 grammar; shop R10's sparkle for purchases, the same class for grants).
- **Rationale:** The owner's brief: growth should feel "expressive and warm, not a checklist." Rails-that-fill and portraits-that-remember are warmth; percent-complete meters are homework. The portrait also quietly becomes the progression system's emotional receipt — the reward ladder's grants are all *visible in it*.
- **Surface:** rail = part of C4's drawer; portrait = one canvas composite fn (~60 lines) reusing every cached sprite + `toDataURL`; keepsake strip = 3 thumbnails max, params re-render.
- **Risk:** Low. Portrait layout at 2 aspect ratios needs a pass; cap stored portraits at 6 params-sets.
- **Perf:** compose on demand only; thumbnails are the composites scaled by CSS.
- **When:** rail PROTOTYPE-NOW (with C4) · portrait AT-FOLD (wants decor + flame sprite to exist to be worth photographing).

---

### C6 — Matching sets: the wear↔place bridge (the unification made visible)
**What:** 3 curated **sets** spanning both verbs — own/equip both halves and a tiny exclusive garnish appears (pure look, zero numbers):

| Set | Wear half | Place half | Garnish when both active |
|---|---|---|---|
| **sakura** | sakura petal crown (shop, lv 7) | sakura window (shop Dream) | one petal occasionally lands on the wearer's hat in the den; brushing it off = a 2-frame shake |
| **tea time** | tea-cozy hat (shop) | tea table (shop) | the tea beat's pot steam curls into a tiny ♥ once per beat |
| **starlight** | constellation cap (rank grant, lv 16) | firefly jar (rank grant, lv 5) | the cap's star and the jar's fireflies twinkle in sync for one breath every ~30s |

Sets are discovered, not listed: no set UI, no "2/3 collected" — the garnish simply starts happening, and one mascot line acknowledges it (*"we match the room now."*). Hard cap: 3 sets in v1, ever additive.
- **Rationale:** This is the single strongest expression of "mascot cosmetics UNIFIED with room decor": the unification isn't a shared menu, it's the hat and the window *knowing about each other*. Discovery-not-checklist keeps it cozy; the garnishes advertise both the shop's Dream tier and the ladder's grants without a single price tag.
- **Surface:** a 3-row `SETS` table checked in `pomoDecor()`/den enter; each garnish ≤12 lines riding existing timers (the den's shared idle interval, within pomo #10's 8-animated-node budget — the sakura petal replaces one generic mote when active, net zero).
- **Risk:** Low — but garnishes must be written against the reduced-motion rule (sync-twinkle degrades to both-lit; petal becomes a static petal on the brim).
- **Perf:** budget-neutral by substitution (see above).
- **When:** AT-FOLD (needs the pieces to exist). Spec'd now so shop/pomo art batches draw the halves compatibly.

---

### C7 — Deferred, explicitly: worlds/campfire skins, buddy fashion, wallpaper engine
**What (the restraint scope-cut, recorded so it isn't relitigated):** No buddy cosmetics (owner: buddies are separate; their identity = voice/tics, and a hat would fight the sprite-cache economy of 24 buddies × outfits). No campfire-scene cosmetics in v1 (the fire's look is the streak's language — streak R4 owns it; decorating it would blur the one surface whose appearance must mean *consistency*, not purchases). No wallpaper/floor engine beyond rug variants (a full room-reskin fights the twilight palette system; if worlds land palettes, the den inherits via `--glow` tokens — art #1 — for free). Each is a fine wave-2 candidate **after** the season proves the core.
- **When:** never-for-now; revisit post-fold with telemetry.

---

## PART 2 — THE CLIMB: the progression reward ladder, finetuned (ranked)

### P1 — The math foundation: curve kept, ranks extended, rewards lifetime-once ⭐ FOUNDATION
**What:** Keep `quest-next.html`'s curve exactly: **cost(L→L+1) = 25(L+1) XP**, cumulative to reach L = `25(L−1)(L+2)/2`. Keep XP income as settled (steps 5/10/20 + 1 XP per verified focus minute, XP-only). Extend `RANKS` with two open-end titles so "ascended" isn't a ceiling: **1 fresh start · 3 warming up · 5 in the zone · 8 locked in · 12 on a roll · 16 unstoppable · 20 legend · 26 ascended · 33 luminous · 41 eternal scholar** (then every new rank is title-only, authored later).

**Pace check** (typical week ≈ 350 XP: ~130 from steps + ~220 focus minutes):

| Level | cum XP | arrives ~ |
|---|---|---|
| 5 (in the zone) | 350 | week 1 |
| 8 (locked in) | 875 | week 2–3 |
| 10 | 1,350 | week 4 |
| 12 (on a roll) | 1,925 | week 5–6 |
| 16 (unstoppable) | 3,375 | week 9–10 |
| 20 (legend) | 5,225 | week 15 |
| 26 (ascended) | 8,750 | week 25 (≈ the season) |
| 30 | 11,600 | week 33 |
| 33 (luminous) | 14,000 | week 40 |
| 41 (eternal scholar) | 21,500 | week ~61 |

Cadence: ~4 level-ups in week 1 (the honeymoon), ~1/week through the mid-game, ~1 per 2–3 weeks by lv 30 — a number that keeps mattering without ever demanding grind, and the rank spacing means a *ceremony-grade* beat lands every 2–5 weeks all year.

**Reward bookkeeping:** `aq_progress.ladder = {maxPaid:0}` — on level-up, pay every unpaid level ≤ new level once, lifetime, keyed by level *number*. Un-checking a step below a boundary never claws back (net-zero XP on toggle is the step rule; ladder rewards are events, not derivations). Two-level jumps queue ceremonies (reward_animations §4 chaining rule). Rewards write through `bank()`/the grant flags — auditable at the same choke point as everything else (shop R1).
- **Rationale:** the curve is already tuned by lived pace; the finetuning the owner asked for is the *payout schedule*, not the arithmetic. Lifetime-once + max-paid is the entire anti-exploit story in 2 fields.
- **Surface:** `RANKS` array + a `LADDER` table + `payLadder(newLevel)` called from `awardXP`'s level-up branch (quest-next 410); ~40 lines.
- **Risk:** Low. **Perf:** nil. **When:** PROTOTYPE-NOW.

---

### P2 — The ladder itself: every level, every rank, every 10 ⭐ THE TABLE
**The three repeating rules (owner-settled, here given numbers):**
1. **EVERY level → 1 free GOLDEN WHEEL SPIN** (shop R2's definition: guaranteed pair-or-better, coin payouts ×2, ≈ +18–22c-equivalent EV) + the T3 HUD flourish (reward_animations §4, incl. the gold token glint by the shop dot). Level spins **bank** in `aq_slot.g` (no daily expiry — they're earned, not daily bait); soft display cap "×5" then "+more".
2. **EVERY rank-up → a GRANTED exclusive cosmetic** (never purchasable, `src:'rank'`) + the new-title type-on ceremony (prismatic gradient, `legend` sting) + auto-equip/auto-place per C4/C3.
3. **EVERY 10 levels (10, 20, 30, …) → a GOLDEN EGG**: one free hatch, **epic-or-better guaranteed** (rides the existing gacha door and pull staging — no second RNG system, honoring shop R3's one-door rule; pity counter unaffected). If the dex is complete at that moment: pays 3★ + a commemorative "family photo" postcard instead. Never coins.

**THE FULL LADDER TABLE:**

| Lv | ~when | Beat | Reward (on top of the every-level golden spin) |
|---|---|---|---|
| 2 | day 1–2 | first level | — (the spin + flourish teach the loop) |
| 3 | day 2–3 | **RANK: warming up** | grant: **🎏 paper-boat hat** (folded from lecture notes — first keepsake) |
| 4 | week 1 | market restock | shop unlock: **wizard hat** (120c) |
| 5 | week 1 | **RANK: in the zone** | grant: **firefly jar** (den decor, 2 drifting glows — starlight set half) |
| 7 | week 2 | market restock | shop unlock: **sakura petal crown** (200c — sakura set half) |
| 8 | week 2–3 | **RANK: locked in** | grant: **round scholar glasses** — opens the ACCESSORY SLOT (C2's tutorial item) |
| 9 | week 3 | market restock | shop unlock: **stethoscope** (180c — the med-student wink) |
| 10 | week 4 | **MILESTONE** | **🥚 golden egg** (free hatch, epic+ guaranteed) |
| 11 | week 4–5 | market restock | shop unlock: **halo** (240c) |
| 12 | week 5–6 | **RANK: on a roll** | grant: **paper-crane mobile** (den, gentle sway) + **🌠 wish token** (choose any locked buddy — buddies #6's mercy, one scheduled early) |
| 14 | week 7–8 | market restock | shop unlock: **aquarium** (420c — the Dream prestige piece) |
| 16 | week 9–10 | **RANK: unstoppable** | grant: **constellation cap** (one twinkling star — starlight set half) |
| 20 | week 15 | **RANK: legend + MILESTONE** | grant: **legend's armchair** (den; a mascot naps in it) + **🥚 golden egg** |
| 26 | week 25 | **RANK: ascended** | grant: **prismatic crown** (the icy→lavender→peach ramp, art #7's peak-moment palette, worn) + **🌠 wish token** |
| 30 | week 33 | **MILESTONE** | **🥚 golden egg** |
| 33 | week 40 | **RANK: luminous** | grant: **aurora window** (den; faint aurora band, night hours only) |
| 40 | week ~58 | **MILESTONE** | **🥚 golden egg** |
| 41 | week ~61 | **RANK: eternal scholar** | grant: **twilight capes** (tiny capes, both mascots — the gang's graduation robe) |
| beyond | — | standing rules | every level: golden spin · every 10: golden egg · every authored rank: one keepsake |

**Reading the design:** weeks 1–3 are dense (a beat at 3, 4, 5, 7, 8, 9 — the habit-forming window gets the richest drip); the accessory slot unlocking at lv 8 makes the ladder *teach the wardrobe*; restocks (P4) keep the market alive without gating anything essential; wish tokens at 12/26 are placed exactly where the buddies doc predicts the dupe-desert and the wave-2 tail; the two set-halves granted (5, 16) pull toward the two shop-side halves — the ladder and the shop advertise each other.
- **Rationale:** Concrete climb goals were the mandate; a table Antonio could screenshot is the deliverable. Non-coin skew: of everything above, only golden spins carry coin EV (audited in P5); every other reward is cosmetic, egg, or token.
- **Surface:** the `LADDER` table (data), grant fns (equip/place + ceremony), `payLadder`; golden-egg = `hatch({free:true, floor:'epic'})` param on the existing fn; wish token = buddies #6's `wishTokens++`.
- **Risk:** Med on art volume — 8 exclusive grants (5 wearables incl. capes, 3 decor). Scope guard: ship grants through lv 12 first; 16+ art trails (the lv-16 player is 2+ months away by definition — the streak doc's same trick).
- **Perf:** all grants are cached-canvas sprites; aurora window = 1 background-position drift, counts in the den's 8-node budget (substitutes a star mote when active).
- **When:** ladder + grants ≤ lv 12 PROTOTYPE-NOW (quest-next has the leveling live); rest AT-FOLD.

---

### P3 — Milestone golden eggs: the guaranteed drop, specified
**What (detail of P2 rule 3):** the egg arrives as a distinct object — the gacha screen shows it **gold-shelled beside the normal egg** with a `from lv 20 ✦` tag; tapping it runs the sacred `playPull` staging with the gold-tease guaranteed and rarity floor epic (75% epic / 25% legendary within the floor). It never expires, never stacks pressure (max 1 held is impossible by spacing — 10 levels apart). Dupes from a golden egg still pay the buddies-doc dupe path (+12c, bond +5) — a golden egg is *never* a guaranteed-NEW (that would out-mercy the wish token and collapse the dex pacing); its job is a guaranteed *thrill*, not a guaranteed unit.
- **Rationale:** "Guaranteed drop at milestones" (owner) that respects the buddies economy: epic+ floor makes it feel like a jackpot (12% → 100% epic+), while wish tokens remain the only targeted mercy. One RNG door preserved.
- **Surface:** `hatch` gains `{free, floor}`; buddies screen renders the pending egg from `aq_progress.ladder.eggs` (int).
- **Risk:** Low — parameterizing a proven fn. **Perf:** nil. **When:** AT-FOLD (with the buddies pass's pull warmth; the counter field lands PROTOTYPE-NOW so no egg is ever lost).

---

### P4 — Market restocks: level-locked SHOP cosmetics (the climb inside the store)
**What (detail of P2's unlock rows):** four prestige items from the shop doc's own catalog — wizard hat (lv 4), sakura petal crown (lv 7), stethoscope (lv 9), halo (lv 11) — plus the aquarium (lv 14) render as C1 silhouettes with `lv N` tags until unlocked. On unlock: one HUD whisper (*"new in the market ✦"*), the shop nav dot does a single glint (no persistent badge), and the item sparkles on next shop visit. **Everyday and Comfort tiers stay ungated forever** — gates exist only above the aspiration line, where the *price* already delays purchase past the unlock week anyway (the lv-14 aquarium gate is reached ~week 7; saving 420c takes longer — the gate is felt as a *stocking rhythm*, never a wall).
- **Rationale:** This is how level-locked cosmetics give "concrete climb goals" without ever locking anything Antonio's coins could otherwise have today — the anti-frustration version of gating. It also solves the shop doc's quiet problem: a fully-visible catalog is exhausted *as a browsing experience* in one visit; restocks give the market a season-long pulse for free.
- **Numbers:** gates at 4/7/9/11/14 = one restock roughly every 1–2 weeks through week 8, matching the decor purchase cadence (shop R4: one nice thing every week or two).
- **Surface:** `minLv` field on 5 catalog rows; `STYLE_STATE` (C1) checks `levelInfo(AQ.xp).level`; whisper via the gamefeel #6 channel.
- **Risk:** Low. One rule to hold: a gate may never be *added* to an item someone could already have bought (gates ship with the items' first appearance).
- **Perf:** nil. **When:** PROTOTYPE-NOW (ships with shop R6's new hats).

---

### P5 — The inflation audit: the ladder vs wheel + buddy + streak economies ⭐ THE BALANCE PROOF
**What/Numbers — every currency the ladder can mint, worst-case honest:**

| Channel | Volume | Value vs weekly income (~180–200c · ~8–11★) |
|---|---|---|
| golden spins from levels | wk 1: ~4 → ~80c-equiv (the intentional honeymoon: first rug + poster land fast, the loop's promise proven in week one) · steady state (lv 12+): ~1/wk → **~20c-equiv ≈ 10% of coin income** · late (lv 30+): ~0.4/wk | garnish; combined with the payday+chapter golden spins (shop R9 counted 5/wk ≈ 100c-equiv) total free-spin EV stays ≤ ⅓ of earned coins, all of it wheel-shaped (bounded, celebratory, decor-bound) |
| golden eggs | 1 per 10 levels ≈ every 5–8 weeks → amortized **≈ 0.4★-equiv/wk** | < 5% of star income; hatch price/pity untouched |
| wish tokens | 2 lifetime (lv 12, 26) + streak-100's one + buddies' every-10th-dupe | ≈ +1 targeted buddy per 2 months — inside the buddies doc's 10–14-week wave-1 window, and the lv-26 token lands mid-wave-2 by design |
| rank/decor grants | 8 lifetime cosmetics, all exclusive, **no coin-price equivalents** (never sold → can't undercut the shop's sinks) | zero currency |
| **coins directly** | **never** | the firewall, kept absolute |

**The firewall, re-proven end-to-end:** the only path focus-minutes → coins via the ladder is XP → level → golden spin EV. At lv 15 a level costs 400 XP; if 100% focus-earned that's 400 minutes → ~20c EV → **3c per focus-hour** (vs 12c/hr from tomato trade-ins and 35c per hard step) — an order of magnitude below study coins, monotonically *worsening* with level. Levels cannot be farmed into money, checked at the same tuning card as shop R9.
**Anti-trivialization checks:** streak milestones (streak R7) stay the *streak's* rewards — no overlap in items or cadence with rank grants (verified against both tables: zero collisions). The wheel's 10-paid-spin cap is untouched by free spins (free spins don't consume cap; they can't be multiplied by anything). Golden eggs can't skip pity or target — the dex chase stays the buddies doc's math ±one thrill.
- **Surface:** this table lives beside `bank()` with shop R9's card. **Risk:** Low (policy). **When:** ships with P1.

---

## PART 3 — CHARMS: THE VERDICT — CUT (with one absorbed survivor)

**Ruling: CUT charms as a system.** No charm cabinet, no `CHARMS` table, no `aq_charms` inventory, no star-priced consumables. **Delete both "coming soon" teases now** (`quest.html` shop line 430, mascot sheet line 469 — already the shop doc's prototype-now honesty patch; this doc makes it final: nothing replaces them except real goods).

**The zero-friction test** (the owner's high bar, made operational — a survivor must score 4/4):
1. zero purchase decisions · 2. zero inventory/holding to track · 3. zero timing decisions ("when do I use it") · 4. zero new UI surface.

**Applied to shop R7's three candidates:**
- **🍀 clover (next spin golden):** fails 1, 2, 3. And it's now *redundant* — the ladder mints golden spins every level; a purchasable one is a worse copy of a free thing. **Cut outright.**
- **🍵 tea set (permanent tea-scene upgrade):** fails 1 and 4 (a star shop is a UI surface + a decision). But the *content* is good — so it **migrates identities**: the tea-scene upgrade becomes ordinary **decor** ("heirloom tea set"), landing on the optional star-priced heirloom shelf below, or simply folded into a future streak/rank grant. The feature survives; the charm doesn't.
- **🕯 rest ember (streak keeper):** fails 1–2 *as shipped* (2★ purchase, hold max 2)… **but passes 4/4 once it stops being an item.** Verdict: **absorb it into the streak as an invisible mechanic** — every 7 lit days the hearth *banks an ember automatically* (max 2 banked), a missed day auto-spends one, the toast stays (*"your ember kept the flame 🕯"*), and the only UI is what streak R3 already drew (the 🌙 pip, the candle-stub scene). **Remove the 2★ purchase entirely.** This is a one-line amendment to streak R3-layer-1 ("extras 2★" → deleted) and it *strengthens* that doc's own best argument: "the streak forges its own insurance" is purer when insurance can't be bought at all — the ember is now streak grammar, not a charm, and it requires zero decisions forever.

**Why cut rather than ship shop R7's v1** (arguing against the sibling doc, per the owner's later ruling): every charm is a *decision about spending a scarce currency on a future contingency* — exactly the flavor of meta-management ("should I hold stars for an ember or a hatch?") that a study app must not host. The tracking overhead isn't the code (~60 bytes); it's the *cognitive* line-item. The owner's instinct ("fluff / tracking overhead / distracting") is correct, and nothing in the category clears the bar except the piece that stops being a member of it.

**The star-sink hole this leaves, patched:** shop R8 scheduled charms as the post-dex star sink. Coverage without charms: (a) buddies wave 2 (weeks 6–8, the big sink, unchanged), (b) golden eggs consuming *thrill demand* without consuming stars keeps hatching attractive till wave 2, and (c) **optional, at-fold, jointly owned with the shop doc: the HEIRLOOM SHELF** — 2–3 **star-priced decor pieces** (heirloom tea set 6★ · dusk lantern 4★ · star mobile 5★). These are *not* charms reborn: they're plain decor with star prices — permanent, effectless, zero inventory, zero timing, one-tap purchases that pass the 4/4 test (a price is a shop's native decision, not a new system). Stars stay the milestone tender with somewhere beautiful to go after the dex closes. Ship only if week-10 telemetry shows stars pooling.

- **Surface:** deletions (2 tease lines, R7's planned table), streak R3 one-line amendment, optional 3-row shelf later. **Risk:** nil — cutting is the low-risk branch. **When:** teases NOW; ember absorption with the streak build; heirloom shelf decision ~week 10 post-fold.

---

## PART 4 — COHESION: how it all closes the loop (and never becomes a grind)

**The loop, with this doc's pieces bolded:**
study a step → coins/XP → *XP fills a bar that now pays* → **level: golden spin** (10-second post-work ritual, shop R2) → **rank: a keepsake your crew wears / your room keeps** → coins → decor (shop R4) → **arranged in nest mode, worn from the wardrobe** → a warmer Den → the rest beat ("the hustle is over, tea now") happens *in a room that effort furnished, among mascots that effort dressed* → tomorrow's first step lights it all again.

Every customization surface points back at the work: the closet rail's silhouettes say `lv 14` (study), the market restock whisper fires on level-up (study), the sets' missing halves sit in a shop priced in step-coins (study), and the home portrait is only ever a photograph of accumulated effort.

**The anti-grind guarantees (binding, reviewed like the streak's restraint list):**
1. **Customization verbs mint nothing.** Arranging, wearing, hiding, portrait-taking pay 0 XP, 0 coins, 0 anything — there is no reason to fiddle except wanting to. (The grind test: if every reward were removed, would the action still be done? For dressing a tomato in a paper boat — yes. Keep it that way.)
2. **No dailies, no rotation, no FOMO.** No daily outfit bonus, no rotating stock (restocks are permanent additions keyed to *his* level, not the calendar), no seasonal-exclusive windows. A cosmetic missed is a cosmetic still waiting.
3. **No completion meters on cosmetics.** Rails fill; percentages don't exist. The only counted collection stays the buddy dex (its doc's call).
4. **Nothing functional is ever locked.** Gates touch 5 prestige cosmetics + nothing else — no features, no world slots (owner's explicit reversal, honored), no decor a same-week wallet could buy.
5. **The ladder never demands.** No "150 XP to next reward!" nags, no level-up-available badges; the bar, the whisper, and the ceremony are the entire surface. Two quiet weeks = the ladder waits, exactly as warm.
6. **The firewall is structural, not tuned:** focus → XP → levels can reach coins only through golden-spin EV at ~3c/hour and falling — no future reward may be added to the ladder that pays coins directly (lint rule at `payLadder`).
7. **Ceremonies respect the escalation contract** (reward_animations §0): level = T3 HUD-only; rank = T3 + type-on + grant; golden egg rides the sacred pull; nothing new touches the T4 ceiling.

**The one test (house standard):** does it change the 10 seconds after finishing a step? After this pass: the coins arc, the bar climbs *toward something named on a silhouette*, some nights the bar overflows gold and a spin or a paper-boat hat lands, and the room he rests in afterward is measurably, visibly, *his*. Effort → expression → rest → effort.

---

## BUILD ORDER (within the weave's phases)

**PROTOTYPE-NOW (quest-next / live-safe):**
1. P1 ladder plumbing (`LADDER`, `payLadder`, extended `RANKS`, `maxPaid`) + P2 golden-spin-per-level (banks into `aq_slot.g`).
2. C2 per-mascot split + accessory slot skeleton (2 accessories) + the C1 grammar/migration prep.
3. C4 wardrobe drawer + closet rail + `HAT_SAY` + shared equip fn.
4. P4 level tags on the shop's new prestige hats (with shop R6's art batches).
5. P2 rank grants through lv 12 (paper boat, firefly jar, glasses, crane mobile — 4 sprites).
6. Charms: teases deleted (with shop's honesty patch); streak-doc amendment noted (ember purchase removed).
7. `aq_decor.hidden/variant` fields + ownership-driven `pomoDecor()` (nest-ready).

**AT-FOLD (v3 save / Den / ledger / buddies phases):**
8. C1 `eq` migration in the v3 boot block; grants routed through `bank()`-adjacent flags (shop R11's commit).
9. C3 nest mode (with the decor shelf's 4+ items) · C5 home portrait · C6 sets (art drawn alongside shop R4/R6 batches).
10. P3 golden eggs (with the buddies pull-warmth pass) · P2 wish tokens at 12/26 (buddies #6 field) · rank art 16+ trails.
11. Week-10 check: star pooling? → heirloom shelf decision (joint with shop) · honeymoon feel-check on level-spin cadence (fallback: level spins pay ×1.5 not ×2 — one constant).

**Standing gates:** balances and *looks* bit-identical on upgrade (the crown stays on both heads) · no reward pays coins directly from the ladder, ever · every new surface passes the anti-grind list · particle/node budgets green (den ≤8 animated, substitution not addition) · 484px embed primary · and the tone bar: the mascots are delighted by every hat and disappointed by nothing.
