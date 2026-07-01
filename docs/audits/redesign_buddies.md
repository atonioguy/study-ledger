# Side Quest — Buddies Redesign: From Skins to Found Family
*A ranked, concrete revamp spec for the buddy / gacha / dex system. Owner brief: buddies "fall a little flat" — make them companions that genuinely MATTER. Judged on LOOK · PERFORMANCE · PRACTICALITY. Builds on `live_game_weave.md`'s UNIFIED-LOOP (stars summon companions; equipped buddy travels the map, sits at campfire/tea; wave 2 + charms scheduled before the 12-dex closes; ~7–10 stars/week income).*

**Grounded in:** `quest.html` lines 664–847 (BUDDIES table of 12, drawBuddy/drawBuddyPortrait canvas sprites, HATCH_COST=3 / PITY=10 / rates 3-9-28-60, dupe = +12 coins, playPull staging, TCG card, dex grid, mascot sheet where the buddy is the *only silent* character), the weave report (§1.4, §3.3, §3.5), owner steering (cohesion · flow-state · zero-friction · bold), aesthetic notes (huggable chibi slime reference, tea-party "little family" mandate), art_direction #6 (glossy/alive mascots), gamefeel #6/#7/#10 (whispers, idle life, petting), performance_robustness (≤8 animated nodes, transform/opacity only, contain:strict).

---

## PART 0 — Diagnosis: why buddies fall flat

1. **They are mute and inert.** The dumpling has 25 lines, the tomato has 25 lines, the buddy has *zero* — `if(bu)bu.onclick=()=>{ jiggle(bu); }` (quest.html:846). The one collectible character class is the only one with no voice, no behavior, no reaction to anything you do. Identity currently = a color + a topper + two lines of card text you see once.
2. **They exist in exactly one pixel.** The equipped buddy is a 32×30 sprite in the HUD corner and a portrait in the mascot sheet. It never appears at a completion, a streak, the pomo room, or (post-weave) the campfire/tea/map — the weave commits to fixing the *equipped* one, but the other 11 owned buddies still live nowhere.
3. **Collection has breadth but zero depth.** Own it or don't. A dupe is +12 coins — the gacha's most common outcome is its most boring screen. There is nothing to feel about a buddy you've had for a month vs. one you hatched today.
4. **The dex is a spreadsheet of "???".** Locked cells give no scent of who's missing, so the chase has no *target*, only a counter. No milestone at 4, 8, or 12. Completing it produces… a full grid.
5. **The economy will out-run the content.** At ~7–10★/wk (2–3 pulls), new-buddy moments dry up around week 4–5 and the dex tail (two 3% legendaries) becomes a dupe slog. Without wave 2 + dupe meaning + a tail-mercy mechanic, the best dopamine loop in the game dies right as the habit forms.

**What's already excellent and must not be touched:** the pull staging (charge → gold tease at 78% → flash → fanfare → card), the pity system's honesty, the TCG card craft, the rarity colors, 3★ price, the comedic register ("bow, peasant"). This is a *deepening*, not a rebuild.

---

## PART 1 — Design pillars (the contract)

- **P1 · Companions, not skins.** Every buddy has a voice, a tic, and a place to exist. Personality is expressed *in the world*, not on a card.
- **P2 · Presence over power.** Buddies change how moments *look, sound, and feel* — never how much they pay. No stats, no meta, no "optimal buddy." Swapping buddies is self-expression, never homework.
- **P3 · Affection is never obligation.** No hunger, no decay, no daily buddy chores, no limited-time banners, no "buddy missed you." Bond accrues as a *byproduct of studying*, silently. The restraint list (weave §4.9) applies to buddies in full.
- **P4 · The dex is a found family, not a checklist.** The fantasy: a med student's study desk slowly filling with tiny creatures who sit with him. Collection progress should render as *a fuller room, a longer tea table, a bigger campfire circle*.
- **P5 · Stars stay the bridge to studying.** Every pull is downstream of finished chapters. The system amplifies the study loop's rewards; it never becomes a parallel game to grind.

**The one-sentence redesign:** *every star you earn summons a small creature with a voice and a favorite spot, who shows up at your campfire, cheers your streak, sits with you while you focus, and slowly becomes family — and the dex is the photo album of everyone who's joined.*

---

## PART 2 — Ranked redesign

Ranking = impact-per-risk under look · performance · practicality. #1–#5 are the core of the revamp; #6–#8 are the economy/content spine; #9–#11 are garnish and guardrails.

---

### #1 · Personality Kits — every buddy gets a voice, a tic, and a taste  ★ the keystone
**What.** Extend the `BUDDIES` table from 6 fields to a full character kit per buddy:

```js
{ id:'zest', …existing…,
  say:      [6–8 lines in a distinct voice],
  greet:    [2 campfire-morning lines],
  cheer:    [2 completion/streak lines],
  rest:     [2 tea-time/evening lines],
  tic:      'sparkHop',        // signature idle behavior key
  fav:      'map',             // favorite hangout: campfire|pomo|map|shop
  likes:    'first steps of the day'  // one flavor fact, shown on card
}
```

The buddy finally *talks*: tapping it in the mascot sheet gives `pickSay(b.say)` through the existing `sayBubble` (one-line change at quest.html:846); its `greet/cheer/rest` pools feed the HUD-whisper channel (gamefeel #6) and, at fold, the campfire/tea scenes. The TCG card gains one row — `♥ likes: first steps of the day` — so the card teaches you who they are.

**The twelve voices (concrete, ship-ready register):**

| buddy | rar | vibe | signature tic (idle) | sample line |
|---|---|---|---|---|
| mochi | c | sleepy, softest yes-friend | slow-blinks, nods off, wakes with a wobble | "five more minutes… ok fine, one step first." |
| pea | c | earnest tiny coach | leaf wiggles when you complete anything | "i grew a whole leaf today. your turn!" |
| berry | c | sweet with opinions | huffs — little puff, blush brightens | "that lecture was rude. we finish it anyway." |
| puff | c | spacey drifter | drifts 2px off the ground, floats back | "oh. i was somewhere else. hi. you're doing great." |
| zest | r | full-volume hype | double-hop with a spark fleck | "ZING! that's the stuff! next one!!" |
| kit | r | sly, loyal underneath | ear flick, looks away then back | "i wasn't watching. …ok i was. nice work." |
| taro | r | dreamy slow-morning poet | sways, tiny "z" that pops into ✦ | "soft start. steady finish. we've got all dusk." |
| frost | e | deadpan unbothered | horn glints; never startles in the pomo room | "deadline's warm. we're not. proceed." |
| ember | e | tiny flame, huge resolve | flickers brighter when a row is lit | "one spark is enough. i would know." |
| shade | e | nocturnal, secretive | only fully awake after 21:00 (twilight-clock tie-in); glows faintly | "midnight is just free time with better lighting." |
| astra | L | regal, benevolently smug | wears the crown; others' bubbles bow «…» around it | "you may proceed to greatness. bow optional." |
| nova | L | cosmic, luck-drunk | a star orbits it once every ~20s | "the universe owed me one. i'm spending it on you." |

**Rationale.** Identity is the cheapest, deepest fix — ~100 short strings and a per-buddy idle key turn "a purple one" into "taro, who's slow in the mornings, like me." Voice is how the reference tea-party scene works: characters, not sprites. It also fixes the glaring asymmetry that the *collectible* is the only mute cast member.
**Implementation surface.** `BUDDIES` table (709–722) grows fields; `initMascotSheet` (843–846) wires buddy taps to `sayBubble`; tic = per-buddy 2nd pre-rendered frame + a small `TIC` behavior table reusing the blink/idle timer from gamefeel #7 / art #6. `shade`'s night behavior reads the twilight-clock phase (gamefeel #4) — degrade to "always awake" if the clock isn't in yet.
**Risk.** Low. Pure data + existing bubble/jiggle plumbing. Only care: line pools must stay in the established voice (warm, lowercase, funny-tender) — this is writing work, not code work.
**Perf.** Strings are ~3KB. Tic frames = one extra cached data-URL per owned buddy, drawn once (see #11 memoization). Zero new animation loops — tics ride the shared idle timer.
**When.** **Prototype-now (live-safe).** Voices + sheet talk + card "likes" row can ship this week; greet/cheer/rest pools light up automatically as the campfire/tea scenes land at fold.

---

### #2 · The Presence Pipeline — buddies live everywhere the loop goes
**What.** One equipped-buddy render contract, applied to every loop surface as it lands (this *is* the weave's §1.4 commitment, made concrete + extended):

1. **Campfire (boot):** equipped buddy sits in the gang circle; on first open of the day it delivers its `greet` line (rotating with dumpling/tomato so mornings vary). LOOK: the fire circle is drawn with **one seat per owned buddy tier** — see #5.
2. **Press ▶ (focus):** the tomato seats itself by the lit row (weave §3.2) — the equipped buddy hops up next to it and idles its tic. Ember literally flickers brighter; frost sits perfectly still; mochi falls asleep against the tomato. At the 2-min ember pop, the buddy does the cheer hop.
3. **Completion beats:** on step-complete, ~20% chance the buddy (not just mascots) whispers a `cheer` line; on chapter/quest complete it joins the existing `cwCheer` hop. Streak-kept toast (gamefeel #5): the buddy is the one who carries the flame line.
4. **Map travel:** buddy trails the gang single-file (gamefeel #12 already places it last in line — keep; the trailing spot reads as "the little one").
5. **Tea / evening:** buddy at the tea table with its `rest` line; today's tomato pile beside it (weave §3.5).
6. **Pomo room:** the equipped buddy is a *roamer* in the room (same `makeEnt` physics as tomatoes — draggable, pettable per gamefeel #10, squish sfx). This is the single biggest "it's alive" moment available pre-fold.

**Rationale.** A companion is someone who is *there*. Every surface above already exists or is committed; the pipeline just makes "equipped buddy" a first-class citizen of each. Presence in the pomo room + focus row directly serves flow: the buddy's whole job is to make starting and resting feel accompanied.
**Implementation surface.** One helper — `buddySprites(id)` returning cached `{small, portrait, tic}` URLs — consumed by: pomo `makeEnt` (add a buddy ent on room enter), the Press-▶ seat (Phase 4/5 code), campfire/tea scene composers (Phase 4), gang travel (prototype `BD` stub already exists). Whisper hooks ride gamefeel #6's `hudSay` event table.
**Risk.** Low-Med. Each surface is an independent, additive sprite placement; the only coupling is the shared sprite cache. Keep the buddy *optional* in every scene (no buddy equipped → scene renders without it, as today).
**Perf.** +1 ent in the pomo RAF (trivial — same loop, same physics). Scene sprites are static/bobbing CSS, within the ≤8-animated-nodes budget per screen. `contain:strict` scene containers per perf report.
**When.** **Pomo-room roamer + completion whispers: prototype-now (live-safe).** Campfire/▶/tea/map presence: **at-fold** with Phases 2/4/5 — but specify it in those phases' scene specs *now* so the seats are drawn with a buddy slot from day one.

---

### #3 · "Do they DO something?" — the answer: **ritual perks, not power** (recommendation)
**What.** The decision this spec makes and defends: buddies get **one signature ritual perk each** — a per-buddy twist on an existing moment's presentation or a feather-weight economy garnish — and **never numeric power**. The full set:

| buddy | ritual perk (equipped only) |
|---|---|
| mochi | tea scene gains a steam-swirl + mochi snores; give-up comfort line is delivered by mochi extra-softly |
| pea | first completion of the day sprouts a tiny leaf on the checkmark |
| berry | combo bursts (gamefeel #2) tint berry-pink at ×3 |
| puff | pomo room gains one extra drifting cloud while puff is home |
| zest | payday spin (slot ritual) gets zest's spark-shower lever pull |
| kit | dupe pulls pay +2 bonus coins ("kit found spare change") — the *only* numeric perk, ~2 coins/week scale |
| taro | morning campfire sky gets a brief lavender haze; taro reads the pace line |
| frost | rain days (gamefeel #14): frost sits in the window, rain sfx slightly clearer |
| ember | Press-▶ row glow warms from gold toward ember-orange; the 2-min ember pop is ember's own flame |
| shade | after 21:00 the HUD dims one step and shade's eyes glow — "night shift" mode |
| astra | quest-complete ceremony adds a 1s crown-ray flourish; astra plants the flag with you |
| nova | pull auras (anyone's) get nova's orbiting star; legendary pulls add one extra burst |

**Why this side of the line (the weigh-up the brief asked for):**
- *Pure cosmetic* keeps the anti-friction ethos but is exactly the "just skins" the owner is rejecting — a hat with a name.
- *Real perks* (XP boosts, star discounts, streak insurance) create an optimal-buddy meta: Antonio would equip for value, not affection; swapping becomes bookkeeping; gacha luck would gate *function* — pay-to-win against yourself. It also collides with charms' role (weave §1.5: streak-keeping is the **rest ember charm**, one earned free per week — keep that boundary; buddies must not duplicate charm function).
- *Ritual perks* thread it: the buddy visibly **changes the ceremony of your day** — which is functional in the way that matters (it makes starting/finishing/resting feel personal) with zero optimization pressure. kit's +2-coin gag is the deliberate single exception: small enough to be a joke, present enough to prove perks are "real."
**Rationale.** This is what "companions that matter" means inside a zero-friction contract: mattering = *your day looks different because of who's with you*, not *your numbers do*.
**Implementation surface.** A `PERK[id]` table of hook-name → tweak (tint value, extra sprite, sfx variant); hooks fire at already-centralized sites (`cwToggle` pipeline, `playPull`, `dropPomo`, ceremony sequence, tea composer). Each perk is ≤15 lines.
**Risk.** Med — twelve small FX variants is a testing surface; ship 4–5 first (ember, zest, mochi, nova, kit), rest trickle in. Keep every perk skippable under reduced-motion.
**Perf.** All perks are one-shot FX or single static sprites; no loops added. shade's HUD dim = one CSS class.
**When.** **At-fold** (most hooks live in Phase 4/5 moments). ember/nova/kit's hooks (▶ glow, pull aura, dupe payout) exist earlier and can **prototype-now**.

---

### #4 · Bond — depth without obligation (and the dupe fix)
**What.** Each owned buddy silently accrues **bond points** as a byproduct of studying while equipped: +1 per step completed, +1 per 10 focus minutes, **+5 per duplicate pulled**. No feeding, no decay, no cap-chasing UI — just a small heart meter on the TCG card.

Tiers and what they unlock (all warmth, no power):
- **☆ hatched** (0) — base kit.
- **♡ warm** (15) — +4 new voice lines (deeper register: they start referencing *your* habits — "you always start with the hard one. respect."); tic plays more often.
- **♥ close** (50) — **card foils** (the TCG card gains the animated sheen currently reserved for the pull moment, permanently) + a signature 1-px accessory on the sprite (mochi: nightcap; zest: tiny sunglasses; astra: nothing — "the crown suffices").
- **✦ family** (120) — a **keepsake line** stamped on the card, auto-composed from real history: *"sat with you through 340 focus minutes · joined jun 2026."* Plus one charm ingredient (see #7).

**Dupes become the bond currency:** the pull's most common outcome changes from "+12 coins" (spare change) to **"+12 coins · bond +5 ♥"** with the buddy hopping on the card — "again!! missed you too." The dry duplicate screen becomes a reunion.
**Rationale.** Collection currently has no depth axis; bond adds one that is *earned by studying and by pulling* — the two things the game already wants — and produces the emotional artifact this whole redesign aims at: a card that proves this creature has been with you through real work. Critically, bond can't be grinded outside the study loop, so it can never compete with it (P3, P5).
**Implementation surface.** `BUD` store: `owned:{id:1}` → `owned:{id:count}` and add `bond:{id:pts}` (migration: existing `1` values stay valid counts). Hooks: the `completeStep` pipeline and focus-record reconciliation (weave §3.2) each add a line; `hatch()`'s dupe branch (808) adds +5 and the card note. Card renderer (758–764) gains the heart meter + keepsake row.
**Risk.** Med. The one real danger is bond *reading* as a chore ("I should equip everyone evenly"). Mitigations: no bond leaderboard, no "lowest bond" surfacing, tiers are far apart, and unequipped buddies gain a trickle too (+1 per day any study happened — the family shares meals). Keep numbers invisible outside the card.
**Perf.** A few counters in `aq_buddies` (~200 bytes). Foil = existing `.tcg-sheen` class re-used. Nothing per-frame.
**When.** **Prototype-now** for the store shape + dupe reunion + heart meter (live-safe, and it must land *before* dupes become common ~week 3). Keepsake auto-lines land with Phase 5 (needs focus totals).

---

### #5 · The Dex becomes the Family Album (+ the growing campfire)
**What.** Replace the flat grid-of-??? with two layers:

1. **The shelf scene (top of the buddies screen).** Owned buddies rendered as a little group scene on a pixel shelf/hill — sitting, tics playing, arranged in acquisition order so the scene literally *grows* as you collect. At 4 / 8 / 12 owned, a **milestone group moment** plays once (they huddle, a heart floats, a "family photo" postcard mints — reusing gamefeel #16's postcard compositor: buddies + date + "the family so far"). Full dex = the **tea-party portrait**: the reference image's scene, earned — everyone at one long table, "the hustle is over, we're having tea now" as the caption. This is the collection's endgame *feeling*.
2. **Locked cells get rumors.** `???` → a dark silhouette (already derivable: draw the sprite in outline color) + a one-line rumor in the buddy's voice-adjacent register: pea: *"something small is sprouting…"* · frost: *"you feel a cool breeze…"* · astra: *"a crown glints somewhere ✦"*. Tapping a locked cell shows rumor + rarity color only.
3. **Downstream echo:** the campfire scene's circle (Phase 4) draws one background seat per 4 owned buddies — collection progress visible at the emotional center of the game without a single number.

**Rationale.** Rumors give the chase *targets* ("I want the cool one") instead of a counter; the shelf makes progress feel like a fuller home (P4); the milestone photos give the dex intermediate ceremonies so motivation doesn't hinge on 12/12. All of it converts "grid completion" into "family growing," which is the exact cozy register the owner mandated.
**Implementation surface.** `renderDex` (741–749): prepend the shelf scene (canvas composite of cached sprites, static + shared idle timer); rumor strings in the `BUDDIES` table; silhouette = `drawBuddy` with all colors → outline. Milestone check in `hatch()`'s isNew branch. Postcards ride gamefeel #16's compositor (params-only storage, ~40 bytes).
**Risk.** Low-Med. Scene layout at 484px needs one careful pass; milestones must guard against re-trigger (store `dexMilestones:[4,8]` in `BUD`).
**Perf.** Shelf = one composed canvas redrawn only on dex change; tics ride the shared timer; render-on-show like every screen.
**When.** **Prototype-now** (rumors + silhouettes + shelf are live-safe). Campfire seats + tea-party portrait: **at-fold**.

---

### #6 · Star economy & the dex clock — wish tokens, wave 2 timing, no repricing
**What.** The pacing spine that keeps the dex "a months-long warm goal, not trivially closed or impossibly far":

- **Keep HATCH_COST=3 and PITY=10 forever.** Repricing reads as betrayal (weave §3.3). All balancing is content-side and mercy-side.
- **Income reality check** (at 7–10★/wk = 2–3 pulls/wk): weeks 1–3 are a new-buddy festival (commons/rares fall fast); by week 4–5 you own ~8–9 and pulls go dupe-heavy; the tail — two specific 3% legendaries — is a 1.5%-per-pull hunt that pity only softens (pity legendary = 22%, then 50/50 which one). Unaided full-dex expectation: **~45–70 pulls ≈ 4–6 months.** Too far. Trivially closable? No — the problem is the opposite: a demoralizing dupe desert.
- **Mercy: the Shooting Star (wish token).** Every **10th duplicate** mints a ✦ shooting star; spending it lets you **choose any locked buddy** (a little scene: you wish on it at the campfire, the buddy walks in from the dark). With dupe-rate math this lands roughly weeks 6–9 and 10–13 — i.e., exactly when the tail would otherwise stall. Full wave-1 dex settles at **~10–14 weeks**: months-long, never hopeless. (Chosen over invisible smart-pity/rerolls: a *visible, spendable* mercy is honest, creates an anticipation meter of its own, and preserves pull integrity.)
- **Wave 2 ships around week 6–8** (before wave 1 closes, per the weave's mandate) as **the Night Market set** — 12 more, themed to the world palettes so collection and the worlds feature feed each other: commons **bun** (steamed bun) · **moss** (mint world) · **drip** (raindrop, rain days) · **pip** (firefly); rares **petal** (sakura) · **lumen** (jellyfish, the aquarium reference) · **koko** (mushroom); epics **tide** · **cinder** (sunset) · **wisp**; legendaries **solstice** (dawn sun) & **eclipse** (moon — shade's idol). Presented as *"new eggs at the night market"* — **additive, permanent, never a rotating banner** (P3). One shared pull pool after unlock (pool dilution actually *helps* the wave-1 tail feel fresh); pity and wish tokens span both waves.
- **Post-dex star sink = charms (#7).** The dex closing must never mean stars go dead.

**Rationale.** This schedule keeps a live chase on the board continuously for ~5–6 months on honest math, using content and visible mercy instead of price knobs.
**Implementation surface.** `hatch()`: dupe counter + token mint; a `WAVE2` array appended to `BUDDIES` behind an unlock flag (`owned≥10 || first quest world complete`); wish-token UI = one button on the dex header when tokens > 0.
**Risk.** Med — the only real balancing risk in this spec; instrument it (log pulls/dupes locally) and check the week-6 telemetry before tuning. Wave 2 is 12 new kits of writing + sprite params — budget the authoring time.
**Perf.** Nil. Same pipelines, bigger table.
**When.** Wish token: **prototype-now** (it changes week-6+ experience; harmless earlier). Wave 2: **at-fold / Phase 6**, authored in advance.

---

### #7 · Charms v1 — made by buddies, closing the "coming soon" loop
**What.** The twice-teased charms ("charms — next update" shop:430; "one-use boosts — coming soon" sheet:469) ship as **things the family makes for you**, purchased with stars (the post-dex sink) or gifted at bond-✦:

- **rest ember** (★4, one free earned per week — per weave §1.5): keeps a streak through one missed day. Flavor: *"ember sat by your flame all night."* Auto-applies; never asks.
- **tea set** (★6, permanent): unlocks the evening tea-scene variant + tea sfx. Flavor: mochi's.
- **tiny lantern** (★5, permanent): a warm lamp glows on the map near the current quest at night (art #5's lit-window, purchasable). Flavor: kit found it.
- **star jar** (★4, one-use): your next pull's aura is always the gold tease — pure ceremony, zero rate change, honestly labeled. Flavor: nova, obviously.

Never stat power; nothing consumable is required for anything.
**Rationale.** Ships the promised feature in the cozy register, gives stars a permanent destination, and — by crediting each charm to a buddy — makes the collection feel like a household that *does things for you*, the softest possible answer to "do they DO something?".
**Implementation surface.** Shop section replaces the tease; `aq_econ` spends stars via the banked ledger; rest-ember hook = one check in the streak-reset path; lantern/tea = scene flags.
**Risk.** Low-Med. rest ember touches streak logic — the only mechanically-live charm; test its once-per-week grant carefully.
**Perf.** Nil.
**When.** **At-fold, Phase 5–6** (streak + tea + map must exist). Delete the tease copy *now* if charms slip past the dex close.

---

### #8 · Today's Visitor — the un-equipped collection comes alive
**What.** Once per day, one random *owned, un-equipped* buddy appears somewhere doing its tic — dozing at the campfire's edge, wandering the pomo room, sitting by the map road, or (rarely) poking around the shop. Tap = pet + one line. If frost visits on a rain day or shade after midnight, their lines acknowledge it. Absence is never mentioned; it's a cameo, not a schedule.
**Rationale.** Solves "the other 11 are a menu": the whole family stays ambiently alive, gives a tiny daily surprise that rewards opening the app without obligating anything, and quietly reminds you who you own (which re-sells the dex daily). Cheap: one sprite, existing pet/bubble verbs.
**Implementation surface.** `visitorToday()` seeded by `dayStr()` + owned list; each host screen's composer places the sprite if `fav` matches (buddies visit their `likes` spots — pea likes mornings/campfire, shade the late map). Pet = gamefeel #10's tap verb.
**Risk.** Low. Keep it to exactly one visitor; two would start reading as a farm.
**Perf.** One extra sprite per day on one screen; rides existing timers.
**When.** **Pomo-room visitor: prototype-now.** Campfire/map spots: **at-fold**.

---

### #9 · The Pull, warmed — nest pity, crack tell, and the walk-home
**What.** Three refinements to the already-great pull:
1. **Pity as a nest of embers.** Replace the text line "✦ guaranteed epic+ in N" with a visual: the egg sits in a nest ring of 10 ember-dots; each non-epic pull lights one; at 10 lit the egg *itself* glows gold before you press. Pity becomes a cozy anticipation meter you can see charging — the mechanic is unchanged, only made felt.
2. **Crack tell.** During the shake, hairline cracks appear in the rarity color ~60% through — a second tell layered under the existing 78% gold tease, so seasoned eyes get an earlier heartbeat.
3. **The walk-home.** After a NEW buddy's card closes, don't just pop the corner sprite in (753: "buddy joins the corner only now") — the buddy hops off the card, walks along the bottom of the screen to the HUD gang, and squeezes in with a group jiggle + `yay` sfx. Six seconds of "joining the family" that the current cut-to-corner skips. Dupe closes get the #4 reunion hop instead.
**Rationale.** The pull is the game's best moment; these three make its *meaning* (pity progress, rarity hope, family growth) visible without touching rates, cost, or the sacred staging.
**Implementation surface.** Buddies screen markup (408–411): nest ring divs; `playPull` (774–797): crack overlay keyframe; `closeCard` (752): WAAPI walk path to `.hud-buds` + group jiggle.
**Risk.** Low. Walk-home must be skippable (tap anywhere = snap to corner) so it never costs time.
**Perf.** One-shot WAAPI; nest ring is 10 static divs.
**When.** **Prototype-now (live-safe).**

---

### #10 · The Buddy Restraint Contract (guardrail, not feature)
**What.** Written into the spec so future waves can't drift: **no hunger/decay · no daily buddy tasks · no limited-time or rotating buddies, ever · no buddy-gated content · no "X missed you" · no bond comparisons or totals surfaced · no real-money anything · dupes always pay forward (coins + bond) · every scene renders fine with zero buddies equipped.** The mascots' contract (weave §4.9 — "they missed you; they were never disappointed") extends verbatim to buddies.
**Rationale.** Every mechanic above sits one bad tuning decision away from turning care into obligation. This is the fence.
**Implementation surface / Risk / Perf.** None — it's a lint rule for design reviews.
**When.** Now and forever.

---

### #11 · Sprite-cache + scene hygiene (performance prerequisite)
**What.** `drawBuddy`/`drawBuddyPortrait` currently re-rasterize canvases and re-mint data-URLs on **every** `renderDex`/`refreshBuddies`/`renderActiveBuddy` call. With buddies now appearing on 6+ surfaces, in tic frames, and ×24 after wave 2, memoize once: `const SPRITES={}; buddySprites(id) → {small, portrait, tic, silhouette}` built on first request, invalidated never (params are static). Scenes follow the perf report's rules: `contain:strict` containers, transform/opacity only, ≤8 animated nodes/screen, shared idle timer, render-on-show.
**Rationale.** The whole redesign multiplies buddy render sites; this makes the multiplication free and is a straight win even for today's code.
**Implementation surface.** ~15 lines wrapping the two draw functions; replace all call sites (733, 744, 761, 835).
**Risk.** Nil.
**Perf.** This *is* the perf line item. Post-change: buddy rendering is O(1) URL lookups.
**When.** **Prototype-now — do it first**, before #1/#2/#5 add call sites.

---

## PART 3 — What this rejects (considered and cut)

- **Stat perks / XP boosts per buddy** — creates an optimal-buddy meta and collides with charms; rejected in #3.
- **Buddy leveling with feeding/materials** — care-as-chore; bond (#4) delivers depth as a study byproduct instead.
- **Multi-equip party slots** — dilutes the "one companion beside you" intimacy and doubles every scene's render matrix; the *collection* gets presence through visitors (#8) and the album (#5) instead.
- **Limited-time / seasonal banners** — FOMO is the anti-cozy; waves are permanent additions (#6).
- **Trading/social features** — out of scope, single-player found family.
- **Raising HATCH_COST or reworking rates** — the weave already ruled it; all pacing is content + visible mercy.

## PART 4 — Sequencing (mirrors the weave's phases)

| Phase | Buddy work |
|---|---|
| **Now (live-safe batch)** | #11 sprite cache → #1 personality kits + sheet voice + card "likes" → #4 dupe-reunion + bond store → #9 pull warmth → #5 rumors/silhouettes/shelf → #2 pomo-room roamer → #8 pomo visitor |
| **Phase 2–4 (map/campfire/tea land)** | #2 full presence pipeline (campfire seat, ▶ companion, tea table, gang travel) · #5 campfire seats + milestone photos · #8 full visitor spots · #3 first 5 ritual perks |
| **Phase 5 (focus marriage)** | #4 focus-minute bond + keepsake lines · #3 remaining perks · #7 charms v1 (rest ember, tea set) |
| **Phase 6 (~week 6–8)** | #6 wave 2 "night market" + wish-token telemetry check · #5 tea-party portrait · #7 lantern/star jar |

**Standing gates:** pull staging/rates/pity/price untouched · every scene fine with no buddy · reduced-motion honored on every tic/walk/perk · `aq_buddies` stays a few hundred bytes · and the loop test rules all: a buddy feature ships only if it makes starting work, finishing work, or resting *warmer* — never if it adds a reason to be in the app instead of the books.

## The through-line
Wave 1 made buddies *ownable*. This revamp makes them *knowable* (voices, tics, likes), *present* (campfire, focus row, tea, room, road), *historied* (bond, keepsakes, family photos), and *generous* (charms, visitors, mercy stars) — twelve small creatures who show up for a med student the way he shows up for the work. The dex stops being a grid you fill and becomes the guest list of a tea party you're slowly earning.
