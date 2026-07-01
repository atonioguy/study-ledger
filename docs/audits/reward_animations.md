# Side Quest — Reward Celebration Choreography
*Frame-by-frame audio-visual sequences for every achievement beat — tiered so big moments land BIG, frequent moments stay light forever. Cozy dusky-twilight register: a happy thump, never an explosion.*

**Grounded in:** `quest.html` (FX primitives: `cwBurst` 13/30-fleck confetti, `cwXpFloat`, `cwBanner` 2.2s drop-in, `cwCheer` mascot hop, `cwPop`/`cwCheck`/`cwShine` keyframes, the `playPull` egg buildup→flash→card flow, WebAudio `cwSfx` with BufferSource path + `_vol` table, `cwBuzz` haptics, `dropPomo` fall-and-startle physics) · `quest-next.html` (synth `sfx('done'/'sel')` tone pairs, `playSVG` star, `hillURL`/`flagURL` map, `questState→done` +3★) · and the scratchpad direction set (gamefeel #1/#2/#3/#8/#9 own the *concepts*; this doc is the actual choreography; art_direction owns the bloom tokens + prismatic star sprite; perf report owns the motion budget this doc obeys).

---

## 0 · The tier ladder (escalation contract)

Everything below hangs on one law: **intensity is a function of rarity, and the frequent beat is the quietest.** A step must feel great 40 times a day; a quest complete happens maybe once a week and should feel like the whole world noticed.

| Tier | Moment | Total dur | Particles (cap) | Sound layers | Physical | Screen scope |
|---|---|---|---|---|---|---|
| **T0** | showed-up ember · tomato drop · pet | ≤ 400ms | 0–3 | 1 (soft) | buzz 8–10 | one element |
| **T1** | **step complete** | ~700ms | 13 flecks + 3–5 coins | 2 (`check`+`xp`) | buzz 16 | the tapped row + HUD chip |
| **T2** | **chapter complete** · streak milestone · wheel star win | ~2.0s | 30 flecks + 1 star | 3 (`check`→`levelup`→`yay`) | buzz pattern + 2px nudge | row + banner + HUD |
| **T3** | **level up** | ~1.5s | 6–8 gold spill px | 2–3 (`levelup`+`legend` on rank-up) | long buzz + 2px nudge | HUD only (signature) |
| **T4** | **quest complete** (flag-plant) · jackpot | ~4.5s staged | 3×30 bursts (the 90-node ceiling) + 3 stars + dust | 4 staged (`buildup`→`fanfare`→chimes→`legend`) | long buzz + 3px two-bounce | whole screen (dim → map cut) |
| **T4+** | **buddy hatch** (epic/legendary) | 1.1–2.35s buildup + reveal | 1–3 big bursts + rays/sheen | staged (`buildup`→`fanfare`→`levelup`→`legend`) | tiered buzz | full-screen overlay (already sacred) |

**Hard budget (from performance_robustness.md, adopted as law):** transform/opacity only; ≤3 concurrent bursts (queue, never stack — one `celebrationQueue` array, shift on finish); `cwBigCelebrate`'s 90 nodes is the absolute ceiling; no per-frame JS for FX (WAAPI one-shots, self-removing via `onfinish`); `REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches` checked at every spawn site.

**Sound system note (unlocks everything):** the WebAudio path already returns a `BufferSource` — add one optional arg `cwSfx(name, semitones)` that sets `s.playbackRate.value = Math.pow(2, semitones/12)`. This single line gives us combo ladders, star-arc arpeggios, and wheel-peg ticks from the *existing* samples. Orphaned mp3s get wired: **`hi`** → first-open-of-day / streak-kept toast; **`yay`** → chapter clear, streak milestones, buddy walk-home; **`hmm`/`huh`** → dupe reveal + mascot-sheet variety. Zero new assets.

---

## 1 · STEP COMPLETE — the heartbeat (T1) ★ rank 1, ship first

The most frequent beat. Design goal: *a perfect little "chk-ding" you could tap 100 times and still like* — crisp attack, warm payoff, done in under a second, never blocks the next tap.

### Beat-by-beat
| t (ms) | phase | what happens |
|---|---|---|
| 0 | **anticipation** | pointerdown: check square squashes to `scale(.9)` (60ms ease-out) — the coiled spring. `cwSfx('check', combo)` (pitch ladder, below) + `cwBuzz(16)`. |
| 60 | **impact** | existing `cwPop` fires (1→1.4→1, 340ms) on the check; `cwCheck` stroke-draw runs (300ms, dashoffset — already lovely, keep); `cwBurst(x,y,false)` — 13 flecks at the tap point. |
| 70 | | `cwSfx('xp', combo)` layers in (existing 70ms offset — the two-note "chk…ding" is the signature; keep the gap exact). |
| 120 | **reward** | `cwXpFloat` "+15 xp" rises (existing 820ms). **NEW: `coinFly`** — 3 coins (5 on hard steps) spawn at the check, arc to the HUD coin chip along a quadratic (rise ~24px then swoop, 420ms `cubic-bezier(.3,0,.4,1)`, 60ms stagger). |
| 540–660 | | each coin lands: chip does `.chip-pop` (`scale(1.18)`, 160ms) + a one-shot white glint sweep (opacity-animated pseudo-element, NOT box-shadow); count-up ticks with the last landing (`countChip` already exists — just delay its start to first-landing). |
| 700 | **settle** | row's done-state glow blooms bright then eases to its resting `box-shadow` over 500ms via CSS transition on the `.done` class (art_direction #11's "afterglow"). Done. |

### Anti-fatigue kit (this is what keeps beat #1 fresh at rep 40)
- **Combo pitch ladder** (gamefeel #2): consecutive checks within 90s raise both `check` and `xp` by +1 semitone per step, capped at +4. Undo/idle resets silently. The *third* video of a lecture block literally sounds brighter than the first.
- **Combo garnish, not inflation:** at ×3 show a small gold "combo ×3" float (reuse `.cw-xpfloat` styling) + `cwCheer()`; at ×5 one extra fleck ring. Never longer duration, never louder volume.
- **Hue rotation:** `cwBurst` picks a rotating window of 3 from its 6-color array per check, so bursts subtly differ. One line.
- **Mascot whisper lottery:** ~25% of checks, one 2s HUD bubble ("nice one!"); "one more!" when a chapter has exactly 1 step left (gamefeel #6 owns the system). Rate-limited so it charms, never clips.
- **The prismatic star check icon** (art_direction #3): the done-node's `CW_STAR` fill becomes the icy-blue→lavender→peach gradient — every completed step leaves a tiny jewel behind. Passive dopamine on every scroll-past.

### Spec
- **Particles:** 13 flecks + ≤5 coins = 18 nodes, all WAAPI transform/opacity, self-removing.
- **Sound:** `check`+`xp` two-note, pitch-laddered. No banner, no fanfare — ever, at this tier.
- **Reuse:** `cwBurst`, `cwXpFloat`, `cwPop`, `cwCheck`, `countChip` as-is. **New:** `coinFly(x,y,n)` (~25 lines, WAAPI, spawns in `#cwFx`), `.chip-pop` keyframe, combo counter var.
- **Risk:** Low — pure additive layer around the existing `cwToggle` call sites. Guard: coins target `getBoundingClientRect()` of the chip *once* per flight (no layout reads in loops).
- **Reduced-motion:** check flips instantly (stroke-draw shortened to .01ms by the global media block), no coins/burst — instead one 120ms opacity glint on the chip + instant count. Sound unchanged (audio is not motion).
- **When:** PROTOTYPE-NOW / live-safe today. This is the foundation every other tier reuses (`coinFly` becomes `starFly` with a sprite swap).

---

## 2 · QUEST COMPLETE — the flag-plant ceremony (T4) ★ rank 2, the missing crown

The game's biggest earned moment and it currently *doesn't exist* in the prototype. Design goal: **anticipation → held breath → payout cascade → a permanent monument.** Staged as a sequence, never simultaneous soup. Total ~4.5s, tap-anywhere-to-skip at every phase.

### Beat-by-beat
| t (ms) | phase | what happens |
|---|---|---|
| 0–650 | **the last check** | the final step plays its normal full T1 beat (combo ladder and all). The ceremony must not steal the step's own payoff. |
| 650–1050 | **the held breath** | 400ms of *quiet* — this gap IS the choreography. A full-screen overlay div eases to `opacity:.28` (twilight deepens, content dims); the quest's xp bar glow brightens (`.near-full` charged bloom, art #8). Audio: nothing, or the first 400ms of `buildup` at half volume, killed at the downbeat via `stopSound`. `cwBuzz(8)`. |
| 1050 | **impact — the banner** | "★ QUEST COMPLETE ★" drops in — `cwBanner` keyframe scaled up (`.cw-banner.big`: 1.3× type, prismatic icy→lavender→peach `background-clip:text` per art #7, gold border bloom). `cwSfx('fanfare')`. **Thump tier 3:** 3px two-bounce `translateY` on `#app` (180ms). Three staggered `cwBurst(..., true)` across the top third, 130ms apart (the exact `cwBigCelebrate` pattern — the 90-node ceiling, used only here). `cwCheer()` — the whole gang hops. `cwBuzz([30,40,30,40,70])`. |
| 1500–2550 | **reward cascade — the 3 stars** | the +3★ bonus pays *one at a time*, 350ms apart: each prismatic star (art #3 sprite) scales in at the banner (0→1.15→1, 130ms), hangs 120ms, then arcs to the HUD star chip (500ms, same `coinFly` engine with star sprite). Landings: chip pop + `cwSfx('check', k)` at **+0, +4, +7 semitones** — a little major-triad arpeggio. Star count ticks per landing. |
| 2550 | **the golden spin mints** | a small gold wheel token glints beside the shop nav dot (`scale-in + one glint sweep`, 300ms, `cwSfx('xp', +7)`); the nav dot keeps a slow gold *opacity* breathe (pre-rendered pseudo-element — never box-shadow) until the spin is claimed. The wheel is a *promise*, not a detour — no forced navigation. |
| 2800 | **cut to the map — flag-plant** | view transitions to the map (or camera-scrolls if already there). The gold flag (`flagURL('done')`, 42px) **drops from 40px above the crest**, 450ms gravity ease (`cubic-bezier(.5,0,.85,.5)`), overshoots 3px into the hill and rebounds. On stick: **hill squash** `scaleY(.94)` 120ms; **dust puff** — 6 grey-lavender 2px pixels kicked outward-up, 380ms fade; `cwSfx('legend')` (the deep sting belongs to the monument, not the banner); second thump bounce; the hill's window pixel lights warm gold (art #5); fireflies near the crest pulse once. The gang, parked at the hill, does the group "hup!" squash. |
| 3600–4500 | **settle — the tea beat** | overlay dim lifts over 600ms; dumpling bubble: *"the hustle is over — tea now? 🫖"* (aesthetic mandate, verbatim energy). Everything comes to rest with the flag flying and the wallet fatter. Quiet. |

**Comeback rule:** a given-up quest finished later gets the *identical* ceremony (the +3 pays whenever truly done) + the campfire ember at the flag base goes out and the bubble swaps to "welcome back. told you it was a camp, not a grave." Celebrate the comeback equally.

### Spec
- **Particles:** 90 (bursts) + 3 stars + 6 dust = ceiling moment, by design, once per quest.
- **Sound:** `buildup`(clipped) → `fanfare` → `check`-arpeggio ×3 → `xp` → `legend`. Five cues, all staged, never simultaneous.
- **Reuse:** `cwBanner` (new `.big` variant), `cwBurst`, `cwBigCelebrate` stagger pattern, `cwCheer`, `coinFly`→`starFly`, `flagURL`/`hillURL` from the prototype, `stopSound`. **New:** ~60 lines of async sequencer (`await beat(ms)` chain with a `skip` flag any pointerdown sets), overlay dim div, flag-drop WAAPI, dust spawner (share `cwBurst`'s loop with a `dust` palette), hill-squash class.
- **Risk:** Low-Med — sequencing + re-trigger guard (`quest.celebrated` flag persisted so re-render/undo-redo can't replay it). Skip must jump the *state* to final, not just cancel animations.
- **Perf:** all transform/opacity; the dim overlay is one full-screen div (opacity only — cheap compositor layer); map cut reuses the existing screen switch.
- **Reduced-motion:** banner shows statically for 1.4s, wallet updates instantly with a single chip glint, flag appears in place with a static glow frame instead of the drop, all sounds play (staged timing kept — audio carries the ceremony alone, and it works).
- **When:** PROTOTYPE-NOW (it defines the reward loop the migration must preserve — gamefeel #3's mandate); `legend`/`fanfare` mp3s at fold.

---

## 3 · CHAPTER COMPLETE — the mid-beat (T2) ★ rank 3

One ⭐ pays. Design goal: *clearly bigger than a step, clearly smaller than a quest* — the step's beat plus ONE banner, ONE big burst, ONE star flight. No dim, no fanfare, no map cut: those cues stay exclusive to quest-tier so the ladder reads.

### Beat-by-beat
| t (ms) | phase | what happens |
|---|---|---|
| 0–650 | **the closing step** | full T1 beat plays (it earned it). |
| 400 | **anticipation** | the chapter's diamond pip (`.cw-ldot`) blooms teal→bright (opacity/scale pulse, 250ms) and the chapter bar's last segment fills — eye is drawn to *what* completed. |
| 650 | **impact** | `cwBanner('✦ chapter done ✦')` (standard size); `cwSfx('levelup')` + **`cwSfx('yay')` at +120ms** (wiring the orphan — the mascots' voice makes it warm, not grand). ONE `cwBurst(..., true)` (30 flecks) at the chapter header. **Thump tier 2:** single 2px `translateY` bounce, 120ms. `cwBuzz([16,30])`. |
| 850 | **reward — the star** | one prismatic star scales in at the chapter header (0→1.15→1), hangs 150ms *twinkling* (one opacity flicker), then arcs to the star chip (500ms `starFly`); on landing: chip pop + 4-point white cross-flash (120ms, opacity) + `cwSfx('check', +7)` + star count ticks. |
| 900 | | `cwCheer()` — mascots hop with the star flight. |
| 1400–2000 | **settle** | chapter bar's `full` glow eases from bright to resting; banner exits on its own keyframe (2.2s total, already handled). |

### Spec
- **Reuse:** everything from T1 + `cwBanner`, `cwCheer`, `starFly`, the existing `lesDone` branch (line ~575) which already does banner+big-burst+levelup — this choreography *re-times* it and adds the star flight.
- **New:** pip bloom keyframe, star hang-twinkle (2 keyframes), `yay` wiring.
- **Risk:** Low — the trigger (`before/after` chapter counts) already exists in the toggle wrapper.
- **Reduced-motion:** banner static, star chip updates instantly with the cross-flash as a 120ms opacity blink.
- **When:** PROTOTYPE-NOW / live-safe.

---

## 4 · LEVEL UP — the lifetime heartbeat (T3) ★ rank 4

Global progression across all worlds — deserves a *signature shape* distinct from quest events: everything happens **in and around the HUD bar**, nowhere else. Design goal: the bar itself celebrates (gamefeel #8's flourish, choreographed). ~1.5s.

### Beat-by-beat
| t (ms) | phase | what happens |
|---|---|---|
| 0–350 | **anticipation** | xp bar fills to 100% (inline-shortened 350ms width transition) while its brightness ramps (`filter` on the *fill* only — small element, bounded; or a pre-layered white overlay's opacity). A rising two-note (`xp` at +0 then +5 semitones, 150ms apart). |
| 350 | **impact — overflow** | bar flashes white (90ms opacity on the overlay); **6–8 gold pixels spill past the bar's right edge** — confetti-pattern spawn with rightward velocity + gravity fall, 500ms — the bar *overflows*, teaching the reset without words. `cwSfx('levelup')` — **at this call site pass a volume override** (the `_vol` table has levelup at .18 for its garnish uses; the real level-up deserves ~.6: add an optional `vol` arg to `cwSfx`). `cwBuzz([30,40,30,40,70])`. Thump tier 2. |
| 380 | | lv badge (`.cw-lv`) does `cwPop`; the number flips mid-pop (at scale max, so the change hides in the motion). A **radial gold vignette** behind the HUD pulses once (pre-rendered pseudo-element, opacity 0→.35→0, 500ms — per perf finding 8, never animated box-shadow). |
| 450–1100 | **reward — the title** | rank title **re-types letter-by-letter** (~35ms/char, VT323 makes this sing; `setTimeout` chain, registry-tracked). On a *rank-up* (new tier name): the text types in the prismatic gradient + `cwSfx('legend')` at 600ms + `cwCheer()` — rank-ups are the T3 ceiling. |
| 700 | | **payout glint:** the free golden wheel spin (owner's ladder: every level) mints — same gold token glint by the shop dot as quest-tier, `cwSfx('xp', +7)`. Milestone levels (10, 20…) additionally queue their guaranteed-drop reveal AFTER settle — never overlap ceremonies. |
| 1100–1500 | **settle** | bar eases from 100% down to the overflow remainder (400ms) — visibly "pouring" the extra xp into the new level. Vignette gone. Done. |

**Chaining rule:** two level-ups in one action queue; the second plays compressed (skip type-on, keep overflow+pop) — respect the player's time.

### Spec
- **Reuse:** `cwPop`, `cwShine` bar, confetti spawn loop, `cwCheer`, `countChip`. **New:** overflow spill (share `cwBurst`'s loop, directional), type-on util (~10 lines), HUD vignette element, `cwSfx` vol arg.
- **Risk:** Low-Med — contained to the HUD; the only care is the width-transition juggle (set transition inline for the fill-to-100 then restore).
- **Reduced-motion:** bar jumps to new value, badge + title swap instantly, vignette becomes a single 150ms opacity blink. Sounds intact.
- **When:** prototype now (`renderHUD` already detects `levelUp`), final polish at fold with the leveling rework.

---

## 5 · BUDDY HATCH / GACHA REVEAL — the collection thrill (T4+) ★ rank 5

`playPull` is already the game's best moment — rarity-scaled shake (1100→2350ms), aura charge, the 78% gold tease, flash, tiered bursts, fanfare→card→legend. **The staging is sacred; do not re-time it.** This choreography adds three warmth layers (from redesign_buddies #9) at its edges:

### Additions, beat-placed
| where | addition |
|---|---|
| **before the press** | **nest of embers pity ring** — the egg sits in a ring of 10 ember dots; each non-epic pull lights one (static divs, one opacity flicker on the newest). At 10 lit, the egg itself idles with a gold breathe (opacity pseudo-element). Anticipation you can *see charging* across days. |
| **~60% through the shake** | **crack tell** — hairline cracks (a pre-drawn overlay sprite tinted the rarity color) fade in at 60%, widening at 85%. Layered *under* the existing 78% charged tease so seasoned eyes get an earlier heartbeat. Sync `cwBuzz` ticks to the rotation extremes (they're at known keyframe offsets — 3 timeouts). |
| **the flash** | unchanged (it's right). One refinement: legendary adds a **prismatic ray tint** — the flash's white gets a 2-stop icy-blue→peach gradient (the reference star's colors at the game's peak moment). |
| **card reveal** | existing `cardIn` + `card-rays` + `tcg-sheen` kept. Add: two 4-point twinkle sprites at opposite card corners for epic+ (one-shot scale+opacity, 400ms, staggered). Dupe note gets **`cwSfx('huh')`** — a gentle comic beat that softens the disappointment (then the +12 coins `coinFly` to the chip: even a dupe pays *visibly*). |
| **after card close (NEW buddy)** | **the walk-home** — the buddy hops off the card (translateY arc), lands at screen-bottom, walks ~1.2s along the bottom edge to the HUD gang (translateX + the `cwBob` walk-bounce, sprite flipped to face travel), squeezes in — whole `hud-buds` does a group jiggle + **`cwSfx('yay')`** + `cwBuzz(14)`. Tap anywhere = snap to corner instantly. Joining the family, felt. |

### Spec
- **Reuse:** the entire `playPull` machine, `jiggle`, `cwBob`, `cwBuzz`, `openCard`. **New:** ember ring markup (10 divs), crack overlay sprite (canvas, 2 frames), walk-home WAAPI path (~20 lines), corner twinkles.
- **Risk:** Low — all additive at the edges of a proven sequence; walk-home needs the skip guard.
- **Reduced-motion:** shake collapses to a 200ms scale-in, crack tell becomes a static cracked frame before the flash, walk-home skipped (buddy appears in corner with one jiggle). The staged *sounds* still deliver the rarity drama.
- **When:** ember ring + crack tell PROTOTYPE-NOW (live-safe); walk-home at fold (needs the HUD gang layout stable).

---

## 6 · BONUS BEATS (T0–T2) ★ rank 6 — cheap, high-warmth garnishes

### 6a · Streak milestone (T2 at milestones, T0 daily)
- **Daily "kept":** first completion of the day, +250ms after its T1 beat: small toast under the HUD ("🔥 streak kept — day N", banner-lite at 0.8× scale, 1.6s) + **`cwSfx('hi')`** (the orphan mp3's perfect home — the mascots *greeting* you). Flame chip does one flicker-pop. Never before the step's own beat.
- **Milestones (3/7/14/30):** full T2 shape — banner ("🔥 seven days — steady flame"), one big burst *at the flame chip*, `cwCheer`, `yay`, flame chip visually tiers up (small flicker → steady → white-gold at 7/14/30 — class swap, glow via pre-layered opacity). 7+ pays its one-time star via `starFly`.
- **Missed day: NO animation at all.** The flame is simply smaller next time. Cozy games never choreograph failure.

### 6b · Tomato drop (T0)
`dropPomo` already has the best physics beat in the game (spawn above, gravity fall, roommates startle-hop, `check` on drop, `squish` on landing). Garnish only: pitch the landing `squish` by fall speed (`vy` → ±2 semitones); 2-pixel dust pair on landing; **batch reconcile** (multiple pomos from TickTick records) rains them 250ms apart, capped at 5 visible drops then "+N more" counter tick — never a 20-tomato hailstorm.

### 6c · Wheel win (T1–T4 by prize)
The Payday Wheel's spin IS the anticipation phase — choreograph the deceleration:
- **Pull:** `cwSfx('dice')` + `cwBuzz(14)`; wheel spins fast (WAAPI rotate, `cubic-bezier(.15,.6,.35,1)` decelerate, 2.8–3.4s randomized).
- **Peg ticks:** each segment boundary passing the pointer fires the synth `blip` with pitch mapped to current speed (fast = high, slowing = descending — a real clatter-to-click ritardando; compute tick times from the easing curve once, schedule with timeouts). Pointer flap: 8° rotate per tick.
- **Near-miss honesty:** none — wheels are transparent by design (the owner chose it over slots for exactly this). No fake almost-stops.
- **Land:** winning segment does `slotPop` (exists) + payout by tier: coins → T1 (`check`+`xp` + `coinFly`); tomatoes → 6b drop into the room; star → T2 (burst + `starFly` + `fanfare`); **jackpot koi hat → T4-lite** (`legend`, 2 bursts, thump 3, hat sails onto the buddy's head with a squash). **Golden spin:** the wheel rim glints gold + `buildup` plays *under* the whole spin (it's the day's earned ceremony) and all landings step one tier up in sound.

### 6d · The "showed up" ember (T0 — the quietest beat in the game)
Pressing ▶ on a step lights the row + seats a mascot (owner-approved). At 2 minutes of focus: **one single ember pixel** detaches from the row and drifts to the streak flame (900ms, slight sway), lands with a 1-frame flame flicker + `cwSfx('xp')` at .25 volume, −5 semitones. No burst, no float text. It must be *felt as smaller than a step-complete* — it's the game whispering "you're here, that counts." This beat anchors the whole ladder from below.

- **Reuse:** `dropPomo`, `blip` synth, `slotPop`, `coinFly`/`starFly`, banner-lite. **New:** wheel tick scheduler (~15 lines), ember drift (one WAAPI node), flame tier classes.
- **Risk:** Low across the board. **Reduced-motion:** wheel jumps to result after a 600ms static "spinning…" shimmer, ember becomes an instant flame flicker, toasts static.
- **When:** ember + streak toast at fold (they ride the real streak + press-▶ features); wheel choreography with the wheel build; tomato garnish live-safe now.

---

## Delight-per-effort ranking (build order)

| # | Moment | Delight | Effort | Why this order |
|---|---|---|---|---|
| 1 | **Step complete v2** (coin flight + combo ladder + afterglow) | ★★★★★ (×40/day) | S — all primitives exist | Multiplies across every single interaction; `coinFly` is shared infrastructure for #2/#3/#4. |
| 2 | **Quest flag-plant ceremony** | ★★★★★ (the crown) | M — sequencer + flag drop | The biggest moment literally doesn't exist yet; defines the bar for the fold. |
| 3 | **Chapter star pay** | ★★★★ | S — re-time existing branch + starFly | The economy's ⭐ source should feel like one. |
| 4 | **Level-up flourish** | ★★★★ | S-M — HUD-contained | The perpetual ladder needs its signature; unlocks the ranked-prize ladder's feel. |
| 5 | **Hatch warmth** (nest/crack/walk-home) | ★★★★ | S-M — edges of a done system | Best moment gets better for pennies. |
| 6 | **Wheel spin ticks + tiered lands** | ★★★ | M — rides the wheel build | Choreography ships with the feature, not after. |
| 7 | **Streak toast/milestones · tomato garnish · showed-up ember** | ★★★ (daily warmth) | S each | Micro-beats that make ordinary days feel witnessed. |

**Sequencing note:** build the shared kit first inside item 1 — `coinFly/starFly`, `cwSfx(name, semitones, vol)`, `thump(tier)`, the celebration queue, and the `REDUCED` gate. Every later item is then mostly *timing tables*.

---

## The restraint list (non-negotiable)

1. **Never block input.** No celebration is modal (the gacha overlay is the one sanctioned exception and even it should take a skip-tap). The next check must always be tappable mid-celebration — queue FX, don't gate taps.
2. **Never fatigue the frequent beat.** Step-complete stays ≤700ms, ≤2 sound layers, no banner, no screen nudge — forever. Variation comes from pitch/hue/whispers, never from added duration or volume.
3. **One ceiling, used once.** 90 concurrent particles + thump-3 + `legend` exist only at quest-complete/jackpot. If everything is big, nothing is.
4. **Escalate with *exclusive cues*, not louder ones.** Banner = chapter+. Screen dim = quest only. Fanfare = quest/hatch only. Type-on = level only. Map cut = quest only. The ladder must be readable blind.
5. **Reduced-motion is a first-class version, not an off-switch.** Static glints, instant counts, staged audio kept — a tasteful quiet mode, tested, per the global media block + `REDUCED` spawn guard (neither file has this yet — it lands before any of the above).
6. **Transform/opacity only; no box-shadow/filter/`left` animation, no rAF for FX** (WAAPI one-shots, self-removing). Bursts capped at 3 concurrent; queue the rest.
7. **Never choreograph failure.** Missed streaks, give-ups, dry wheel spins get soft copy at most — zero sad animations, zero red.
8. **Sound is layered, never stacked.** Cues in a sequence are ≥70ms apart; simultaneous different-sample playback only for the designed pairs (`check`+`xp`). Respect the two-note signature.
9. **Haptics mirror the tiers exactly** (16 / [16,30] / [30,40,30,40,70]) and never fire without a visual.
10. **Every reward is traceable to its cause** — bursts spawn at the tapped element, coins fly *from* the work *to* the wallet, the flag plants *on* the quest's own hill. No abstract screen-center fireworks.
11. **Cozy register above all:** nudges ≤3px, no rotation shake, no strobing (one flash frame max per sequence), volumes tuned so a 1am library session never flinches.

---

## Reuse-vs-new summary

| Primitive | Status | Powers |
|---|---|---|
| `cwBurst` (13/30) | reuse as-is + hue-window + dust palette | every impact tier |
| `cwXpFloat` | reuse as-is | step float, combo float |
| `cwBanner` | reuse + `.big` prismatic variant + toast-scale variant | chapter, quest, streak |
| `cwCheer` / `cwHop` / `jiggle` | reuse as-is | all T2+ mascot joy |
| `cwPop` / `cwCheck` / `cwShine` | reuse as-is | step check, lv badge, bars |
| `playPull` staging + `cardIn`/rays/sheen | sacred — additive edges only | hatch |
| `dropPomo` physics | reuse + pitch/dust garnish | tomato, wheel tomato prize |
| `cwSfx` WebAudio path | extend: `(name, semitones, vol)` | pitch ladders, arpeggios, wheel ticks |
| orphaned `hi`/`yay`/`hmm`/`huh` mp3s | wire (zero new assets) | streak-kept, chapter/walk-home, dupes |
| `flagURL`/`hillURL` (prototype) | reuse | flag-plant target |
| **NEW: `coinFly`/`starFly`** | ~25 lines, WAAPI arcs in `#cwFx` | steps, chapters, quest stars, dupes, wheel |
| **NEW: `thump(tier)`** | ~15 lines + 2 keyframes on `#app` | T2/T4 weight |
| **NEW: celebration sequencer + queue** | ~60 lines async | quest ceremony, chained level-ups |
| **NEW: type-on util, HUD vignette, ember ring, crack overlay, wheel tick scheduler** | small one-offs | level, hatch, wheel |

*Implementation surfaces: CSS keyframes for states/loops, WAAPI for one-shot flights/drops (self-cleaning), canvas only for sprites (star, crack, dust are reusable data-URLs). Zero new rAF loops.*
