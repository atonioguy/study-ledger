# Side Quest — Game-Feel & Juice Report
*Ranked ideas for making the game more game-like, satisfying, and cozy — dusky-twilight pixel warmth, Animal Crossing / Steven Universe energy.*

**Context read:** `quest.html` (live, v2.8 — exam-3 questline, HUD mascots, pomo room, gacha, shop, confetti/xp-float/banner/haptics/WebAudio sfx already in place), `quest-next.html` (prototype — worlds hub, hill map with flags, gang travel, builder/pick, global leveling, synth sfx only), `PLAN.md` (migration intent: port features into the live UI, preserve the live game's polish).

**Ranking principle:** low-risk / high-delight first. "BEFORE" = safe to ship in the live `quest.html` now (and carries over on the fold) or belongs in the prototype as it hardens; "AFTER" = depends on the worlds/map structure landing in the live game.

**A general note on restraint:** the live game's juice is already tasteful (small bursts, count-ups, gentle easing). Every idea below is calibrated to *add warmth, not noise* — short durations, existing palette colors (`--gold #ffd96b`, `--teal #5fe0c8`, dusky purples), and `prefers-reduced-motion` respected on anything that moves the camera or loops.

---

## 1. Coin Flight to the Wallet
- **What:** When a step completes, 3–5 tiny pixel coins (the existing `ic-coin` sprite) arc from the tapped node to the HUD coin chip; the chip does a scale-pop and a glint sweep as each lands, then the count-up runs. Stars do the same on lesson/chapter clears (arc to the star chip with a twinkle).
- **Why:** This is the single highest-ROI juice pattern in games — it *physically connects* the action to the reward. Right now `coinFloat()` shows "+15 🪙" floating up and the chip silently re-counts; the loop between "I did the thing" and "my wallet grew" is implied, not felt.
- **Sketch:** `quest.html` — new `coinFly(x,y,amt)` beside `coinFloat()`: spawn absolutely-positioned `.ic-coin` spans in `#cwFx`, animate with WAAPI along a 2-point quadratic (translate + a mid keyframe for the arc) to `#sqCoins.getBoundingClientRect()`, stagger 60ms; on each arrival add a `.chip-pop` class (scale 1→1.25→1, ~180ms) + a one-shot glint pseudo-element; call from the `cwToggle` wrapper where `coinFloat` is called. Reuse for `sellPomos()` and slot wins (their payouts currently just re-count).
- **Risk:** Low — pure additive FX layer, no state changes.
- **When:** BEFORE (ship in live now; the pattern ports 1:1 to imported-quest steps).

## 2. Combo Momentum (pitch-laddered checks)
- **What:** Consecutive step completions within a short window (say 90s, or same session) build a combo: 2nd check plays the check sfx a semitone higher and the burst gets a few extra flecks; 3rd+ shows a small gold "combo ×3" float, both mascots cheer, haptic gets one extra tick. Undoing or idling resets it silently. Purely presentational — no XP inflation (keeps the "start stingy" economy intact); optionally +1 coin per combo tier as a garnish.
- **Why:** Antonio's real loop is "watch 3–4 lecture parts back to back." A momentum ramp makes the *second and third* check feel better than the first, which is exactly the behavior to reinforce. Rising pitch is the cheapest, most legible "you're on a roll" signal in the vocabulary of games.
- **Sketch:** `quest.html` — a `combo={n,t}` var in the `cwToggle` wrapper; in `cwSfx` the WebAudio path already builds a `BufferSource`, so set `s.playbackRate.value=Math.pow(2, Math.min(combo,4)/12)` for the `check` sound; scale `cwBurst` count by combo; reuse `cwXpFloat` styling for the "combo ×N" float; `cwCheer()` at ×3.
- **Risk:** Low — a few lines around existing hooks; degrades gracefully on the `<audio>` fallback (just no pitch shift).
- **When:** BEFORE (and carries straight into imported-quest steps after the fold).

## 3. Quest-Complete Flag-Plant Ceremony
- **What:** The victory moment PLAN.md already locks in ("fanfare + burst + QUEST COMPLETE banner + the +3 star bonus lands + gold dumpling flag plants") — but staged as a *sequence*, not simultaneous soup: (1) final check pops as normal → (2) beat of quiet (~400ms) → (3) screen dims slightly, "★ QUEST COMPLETE ★" banner drops in with `sfx-fanfare` → (4) the 3 bonus stars arc to the wallet one by one (idea #1's system) → (5) cut to the map where the gold flag *drops in from above*, sticks with a dust puff and a tiny hill-squash, gang hops. Given-up→finished later gets the same ceremony (the plan pays the bonus whenever truly completed — celebrate the comeback equally, maybe with an extra "welcome back" bubble).
- **Why:** This is the game's biggest earned moment and currently the prototype has *nothing* (no banner, no fanfare — checked: no celebration code in `quest-next.html`). Milestone ceremonies with a beat of anticipation are what separate "checklist app" from "game." The flag drop on the map turns the reward into a *place* you revisit.
- **Sketch:** Prototype first: in `renderPreview()`'s completion handler, detect `questState` transitioning to `done`, run a small async sequence (existing `cwBanner`/`cwBurst`/`cwBigCelebrate` port over from `quest.html` almost verbatim), then `show('map')` with a `plantFlag(qid)` that WAAPI-drops the `.mflag` img (translateY −40→0, tiny bounce) + confetti at the crest. Fold into live with the real mp3s.
- **Risk:** Low-Med — sequencing code, but all ingredients exist; guard against re-triggering on re-render.
- **When:** Build in the prototype NOW (it defines the reward loop the migration must preserve); final polish AFTER with real sfx.

## 4. Twilight Clock — day/night sky by real time
- **What:** The app's dusky backdrop breathes with the real clock: morning = slightly warmer/lighter dusk, afternoon = the current default, evening = deeper indigo with more visible star-spots and the pomo-room moon peeking into the map header, late night = darkest + occasional shooting star. Subtle — maybe 8–12% shifts in the `--body`/`--spot` tokens, never breaking readability.
- **Why:** This is *the* Animal Crossing trick: the world acknowledges your time, which makes it feel alive and makes late-night study sessions feel cozy and witnessed rather than grim. It's a mood layer, not a feature — perfect fit for the brand ("dusky twilight" becomes literal).
- **Sketch:** `quest.html` — a `skyTick()` on load + every ~10 min: pick a phase from `new Date().getHours()`, lerp 3–4 CSS variables on `:root` (`--body`, `--spot`, plus a new `--skyglow` used by the HUD gradient), toggle a `night` class that raises star-dot opacity. The pomo room already draws moon/stars — reuse `pomoStarURL()` for a couple of fixed twinkle dots in the map header. For world palettes (after fold), apply the shift as a single overlay tint so it composes with any palette instead of touching their tokens.
- **Risk:** Low — CSS-variable-driven, exactly how world theming already works; test contrast at the darkest step.
- **When:** BEFORE (app-wide backdrop + pomo room now); map/world blending AFTER.

## 5. Real Streak + Ember Milestones
- **What:** Ship the plan's real daily streak (≥1 step or pomo per day) with feelings attached: the first completion of each day gets a soft "🔥 streak kept — day N" toast under the HUD; the flame chip grows through tiers (small flicker → steady flame → white-gold flame at 7/14/30); milestone days (3, 7, 14, 30) trigger a mini-ceremony (banner + burst + mascots cheer) and, at 7+, a one-time small star bonus. A *missed* day never scolds — the flame just quietly resets small (cozy games don't punish).
- **Why:** The current 🔥 is mislabeled (`done/total`), so this fixes a lie *and* installs the single strongest daily-return mechanic in habit games. The "kept" toast front-loads the reward to the first action of the day — the hardest one for a med student to start.
- **Sketch:** Prototype already has `bumpStreak()`/`aq_progress`; add a `streakTier(n)` that swaps the chip's emoji/color/glow (`.cw-streak` classes), a `toast()` reusing the `.cw-banner` style at smaller scale, and hook milestone checks in `awardXP`. Live fold: wire `dropPomo()` to also bump it (plan says pomos count).
- **Risk:** Low — data model is decided and half-built; only date-boundary edge cases (use the existing `dayStr`).
- **When:** WITH the migration (the real streak lands then), but the toast/tier visuals can be built in the prototype now.

## 6. HUD Whispers — mascots react in the moment
- **What:** The dumpling and tomato already have voice (SLIME_SAY/TOM_SAY) but only speak inside the mascot sheet. Let tiny speech bubbles surface in the HUD at meaningful beats: first open of the day ("welcome back!" / "let's lock in"), right after a completion (occasional, ~25% chance, "nice one!"), one part left in a lesson ("one more!"), returning after 3+ idle days ("missed you — no big deal, start small"). Bubbles use the existing cream `.ms-bubble` style, ~2s, never stacking, max a few per session.
- **Why:** This converts the mascots from decoration into *companions* — the Steven Universe warmth the game is going for. Contextual reactions ("one more!") also nudge completion at exactly the right moment. Cheap sentence-level content, huge relationship payoff.
- **Sketch:** `quest.html` — reposition a clone of `.ms-bubble` absolutely under `.hud-buds` (`#hud` already has `overflow:visible`); a `hudSay(who,text)` + a tiny event table checked in the `cwToggle` wrapper and on boot (compare `lastDay`); rate-limit with a session counter. New line pools: `WELCOME_SAY`, `ALMOST_SAY`, `PRAISE_SAY` (~8 lines each, same voice as existing).
- **Risk:** Low — reuses bubble CSS + say-picker; only care needed is frequency tuning so it stays charming, not clippy.
- **When:** BEFORE.

## 7. Idle Life — blinks, naps, and glances
- **What:** Micro-idle animation for the HUD mascots and the questline avatar: an eye-blink every 4–7s (randomized), a rare look-at-each-other, and after ~90s of no interaction a sleepy "z" pixel drifting up from the dumpling (any tap wakes them with the squish). The map avatar parked on the current lesson occasionally does a tiny hop + single sparkle.
- **Why:** Blinking is the highest-value-per-pixel aliveness signal there is. Right now the mascots bob/squish on a loop — lovely, but mechanical. One blink turns "sprite" into "creature." The sleepy z doubles as a gentle, judgment-free "the game is waiting" cue.
- **Sketch:** `quest.html` — `drawSlime()`/`drawTomato()` take an optional `blink` flag (eyes → 1px lines, 2 extra fillRects); pre-render both frames to data-URLs at boot and swap `--slime`/`--tomato` (or the element's background) for ~120ms on a randomized timer. The "z" is a tiny absolutely-positioned span animated like `cwXpFloat`. Idle timer resets on any `pointerdown` (the audio-unlock listener already exists to piggyback on).
- **Risk:** Low-Med — sprite frames are shared via CSS vars, so swap cost is trivial; just avoid swapping during the cheer animation.
- **When:** BEFORE (also inherited by the pomo-room roamers and, after the fold, the map gang for free if they use the same sprites).

## 8. Level-Up Flourish 2.0
- **What:** Elevate level-up above module-clear (they currently share `cwBigCelebrate`): xp bar fills to the end, *overflows* with a brief golden spill of pixels past the bar's right edge, flashes, then resets to the new level's progress; the rank title re-types itself letter-by-letter (VT323 makes this look great); a soft radial gold vignette pulses once behind the HUD; mascots do the full hop. ~1.4s total.
- **Why:** With the new open-ended leveling, level-ups become the *global* progression heartbeat across all worlds — they deserve a signature moment distinct from quest events. The bar-overfill visual also teaches the per-level reset (`lv N · into/need`) without words.
- **Sketch:** Prototype (`renderHUD` already knows `levelUp` and pulses): add `levelUpFx()` — WAAPI on `.cw-xpfill` (width 100% + brightness flash), 6–8 gold pixels spawned at the bar's end via the confetti pattern, `setInterval` type-on for `#cwRank`, one-shot vignette div. Port into the live HUD on fold, keeping `sfx-legend`/`levelup` mp3s.
- **Risk:** Low-Med — contained to the HUD; keep it skippable/overlappable if two level-ups chain.
- **When:** Prototype now, final AFTER (it's part of the leveling rework landing).

## 9. Thump & Rumble Tiers (screen-shake-lite)
- **What:** A formalized 3-tier physical-feedback scale: **tier 1** (step done) = current pop + 16ms buzz, unchanged; **tier 2** (lesson/chapter, slot star win) = 2px single-bounce nudge of `#app` (translateY, 120ms) + current buzz pattern; **tier 3** (module/quest complete, level-up, legendary pull, jackpot) = 3px two-bounce nudge + the long buzz. Never rotational, never more than 3px, disabled under `prefers-reduced-motion`.
- **Why:** The game has great particle juice but zero *weight* — everything happens on top of a perfectly still frame. A tiny camera acknowledgment on big beats adds physicality and creates hierarchy (right now a lesson-done and a legendary pull feel similar). Keeping it to 2–3px preserves the cozy register — this is a happy thump, not an explosion.
- **Sketch:** `quest.html` — `thump(tier)` adding `.thump1/.thump2` keyframe classes to `#app`; call sites already exist and are centralized (`cwToggle` big-branch, `cwBigCelebrate`, `playPull`, `slotSpin` payout). ~15 lines + 2 keyframes.
- **Risk:** Low — one element, class-based, motion-query-gated.
- **When:** BEFORE.

## 10. Pet the Gang (pomo room affection)
- **What:** Quick-tap a roaming tomato or the dumpling in the pomo room (distinct from drag) → it does the existing jiggle, a tiny pixel heart floats up, and the squish sfx plays; every ~5th pet it says a one-line bubble. Petting does nothing mechanical — it's pure affection.
- **Why:** The pomo room is the game's coziest space and its inhabitants are already draggable physical creatures — but the only interactions are utilitarian (log, sell). A zero-stakes affection verb is the Animal Crossing move: it gives the room a reason to *visit*, which keeps the pomo-logging habit warm. Also softens the slightly dark "sell all your friends" economy with a bond you chose not to sell.
- **Sketch:** `quest.html` pomo section — in `makeEnt`'s pointer handlers, if pointerup lands <180ms after pointerdown with <6px movement, treat as pet: reuse `jiggle`-style squash on the ent (the tick loop already supports a `react` pop — set `o.react=22`), spawn a 5×5 heart canvas sprite (like `pomoStarURL`) floating up via WAAPI, `cwSfx('squish')`.
- **Risk:** Low — the tap-vs-drag disambiguation is the only care point, and the drop handler already exists to build on.
- **When:** BEFORE.

## 11. Signpost Welcomes (onboarding & empty states)
- **What:** Replace text-only empty states with tiny staged scenes. New world / no quests: the gang stands on an empty hill next to a pixel signpost, dumpling bubble: "nothing here yet — let's build our first quest ✦", and the ⊕ add-spot breathes with a gold pulse. Empty builder: the pile side shows the tomato pointing at the "import from ticktick" button. First-ever boot (fresh save): a 3-beat hello — gang walks in from the left edge of the map, waves (jiggle), bubble intro.
- **Why:** Empty states are where a planner app feels most like a spreadsheet and a game must feel most like a world. The prototype's current `.mempty` is one line of text. Since every new world starts empty, this scene is seen *often* — it should sell the fantasy every time, and it doubles as onboarding (the pulse literally points at the next action).
- **Sketch:** `quest-next.html` — in `renderMap()`'s `!quests.length` branch, render the gang sprites + a `signURL()` canvas sprite on a hill instead of the text div; `.madd .an` gets the existing `cwLvPulse`-style glow animation; bubble reuses idea #6's `hudSay`. First-boot flag in `aq_progress`.
- **Risk:** Low — render-branch content only.
- **When:** Prototype now / AFTER for the live fold (the live game has no empty states today).

## 12. Gang Travel, But Traveled — hops, dust, arrival
- **What:** Upgrade the prototype's gang move (currently a straight 550ms CSS slide with a bob) to feel like a journey: the trio follows the dotted road (per-segment, so they wind around corners), sprites flip to face travel direction, little dust puffs kick up behind them, they move in single-file with slight stagger (dumpling leads, buddy trails), and on arrival do a group "hup!" squash + the hill glow blooms. Duration scales gently with distance (capped ~1.2s), and tapping the destination again skips the walk and opens the quest immediately.
- **Why:** The plan's whole map fantasy is "the gang travels together." A linear slide reads as UI; a winding, bouncing walk reads as *characters going somewhere*, which makes each quest a place and selection itself a tiny delight. The skip-tap keeps it from ever costing the user time.
- **Sketch:** `quest-next.html` — `selectQuest` already has the `mdot` chain coordinates in scope (`pts`); animate `gangEl` through the waypoint list with WAAPI keyframes (offset per segment length), toggle `scaleX(-1)` per segment direction, spawn 2px fading dust divs every ~120ms, fire the existing `.walking` bob throughout, `sfx('sel')` tick per waypoint at low volume, squish on arrival.
- **Risk:** Med — waypoint math + interruption handling (a second tap mid-walk must cancel cleanly).
- **When:** AFTER (map-structure feature) — but prototype it now while the map code is hot.

## 13. Living Twilight Map (parallax & ambiance)
- **What:** Three thin ambience layers on the world map: (a) 2–3 drifting pixel clouds behind the hills at ~0.4× scroll parallax, (b) star-spots that individually twinkle (staggered opacity animation) instead of the static background dots, (c) at night (idea #4's clock) fireflies — 3–4 slow-wandering 2px gold dots near the hills — and a shooting star roughly once every few minutes. All behind content, all pausable, all removed under reduced-motion.
- **Why:** The map is where users *choose* work, so it should be the place that feels most like a world worth returning to. Parallax + independent twinkle is what makes a static backdrop read as "evening outdoors" instead of "wallpaper" — the AC/SU coziness lives in exactly this layer.
- **Sketch:** `quest-next.html` — a `.map-amb` div inside `.map` (z-index under `.mbox`); clouds = small canvas sprites on very slow WAAPI translate loops; parallax = `transform: translateY(scrollTop*-0.6px)` updated in a passive scroll listener on the map view; fireflies = the pomo-room star sprite tinted gold on randomized wander keyframes. Cap at ~8 animated nodes total.
- **Risk:** Med — mind scroll-jank on iPhone (transform-only, `will-change`, passive listeners); keep node count tiny.
- **When:** AFTER (belongs to the new map; prototype-ready now).

## 14. Rainy Evenings (the rain.mp3 is already in the repo)
- **What:** An occasional cozy weather mood: some evenings (seeded by date so it's consistent all evening, ~25% of days) the pomo room — and later the map — gets soft pixel rain streaks down the window/sky, slightly deepened tint, and `rain.mp3` looping at very low volume. A small toggle (an umbrella icon in the pomo header) mutes/forces it, because rain should be a gift, not an imposition. Mascots comment ("cozy in here, huh").
- **Why:** `rain.mp3` sits unused in the repo — someone already knows rain belongs in this game. Weather is the cheapest "the world exists without you" signal, and rain specifically pairs with studying like nothing else (lo-fi culture is literally built on it). Date-seeding makes it feel like weather rather than a random effect.
- **Sketch:** `quest.html` — `weatherToday()` hashing `dayStr()`; rain layer = one absolutely-positioned div with a repeating-linear-gradient of 1px streaks animated via `background-position` (single compositor animation, near-zero cost); `CW_SFX.rain=new Audio('rain.mp3'); loop=true; volume≈0.12`, started only inside the existing `unlockAudio` gesture path, stopped on tab switch away from pomo. Persist the toggle in `aq_pomo`.
- **Risk:** Med — looping-audio lifecycle on iOS Safari needs care (pause on `visibilitychange`); visuals are trivial.
- **When:** BEFORE for the pomo room; extend to the map AFTER.

## 15. World Flavor Motes (palette-specific particles)
- **What:** Each world palette gets one signature drifting particle on its map, sparse (4–6 on screen): Sakura → falling pink petals, Snowy → slow snow dots, Sunset → occasional ember sparks rising, Mint → tiny leaves, Twilight → keeps the fireflies/stars from idea #13. Same engine, different sprite + motion curve.
- **Why:** The palette system re-skins colors, but particles re-skin *atmosphere* — it's the difference between "this world is pink" and "this world is cherry-blossom season." Gives each world an identity worth creating, which feeds the multi-world motivation loop (people make worlds partly to collect vibes).
- **Sketch:** `quest-next.html` — extend idea #13's ambience layer: a `MOTES[palette]` table of `{spriteURL, fall|rise|sway, speed}`; 5×5 canvas sprites like `pomoStarURL`; spawn/despawn on `applyWorldTheme`. Shares the same node budget as #13.
- **Risk:** Med — only in that it stacks on #13's perf budget; individually trivial.
- **When:** AFTER (needs world palettes live).

## 16. Trophy Postcards (cozy collectibles)
- **What:** Completing a quest mints a small pixel postcard: auto-composed from the world's palette sky + hill + the gold flag + quest name + date + stats ("Bio Exam Sprint · 214 xp · 7★ · jul 2026"). Postcards collect on a corkboard shelf in View Stats (archived worlds' cards live there too); tapping one shows it big, TCG-style. Purely commemorative.
- **Why:** The plan already treats finished quests as "trophies/monuments," and the archive as a "trophy shelf of numbers" — postcards make the shelf *emotional* instead of numerical. For a med student grinding exams, a visual stack of "places I've been" is a powerful long-horizon motivator, and it gives quest completion a permanent artifact beyond the moment (pairs with ceremony #3). Fits the archive's size constraint: a postcard is ~40 bytes of parameters (palette id, name, date, stats), rendered to canvas on demand — never stored as an image.
- **Sketch:** `quest-next.html` — `postcardURL(meta)` canvas compositor reusing `hillURL`/`flagURL`/palette tokens; append `meta` to the quest record on completion and to `archiveSnapshot`'s per-quest lines; render a `.postcard-grid` section in `renderStats()`; big view reuses the TCG modal pattern from `quest.html`.
- **Risk:** Med-High — new render surface + archive-schema touch (keep it additive/optional so old snapshots still load).
- **When:** AFTER (rides on quest end-states + View Stats).

## 17. Campfire at the Faded Flag (give-up warmth)
- **What:** A given-up quest's faded flag gets a tiny animated campfire ember at its base — a 2-frame flicker, barely there — signaling "camp, not grave." Tapping the hill has the dumpling say a no-guilt line ("resting, not quitting"). On resume, the flag re-hoists (small upward animation) with a warm two-note sfx; the ember goes out.
- **Why:** The plan's give-up design is unusually kind (keep earnings, resumable, still counts as resolved) — but a grey flag still *reads* like failure. One ember reframes abandonment as "paused at camp," which protects the exact motivation the feature was designed to preserve. It's the cheapest possible emotional-design win.
- **Sketch:** `quest-next.html` — a 6×6 two-frame ember sprite (swap via `setInterval` shared with idea #7's blink timer) positioned at the gaveup-flag base in `renderMap()`; a small `SAY` pool on hill-tap for gaveup state; resume path (state flip already exists) triggers a WAAPI translateY on the flag img + `sfx('save')`.
- **Risk:** Low-Med — few sprites + one animation on an existing state machine.
- **When:** AFTER (give-up states are a new-structure feature).

---

## Suggested batches
- **Ship in live `quest.html` this week (pure polish, zero data risk):** #1 coin flight, #2 combo, #6 HUD whispers, #9 thump tiers, #10 petting, #7 idle life, #4 twilight clock, #14 rainy pomo evenings.
- **Build into the prototype now (defines the bar the migration must hit):** #3 quest-complete ceremony, #8 level-up flourish, #11 signpost welcomes, #5 streak visuals, #12 gang travel.
- **After the fold (world-structure dependent):** #13 living map, #15 flavor motes, #17 campfire, #16 postcards.

## Sound-design side note (cross-cutting)
The mp3 kit (`sfx-hi/hmm/huh/yay` appear unused, like `rain.mp3`) is an untapped voice bank: wire `hi` to first-open-of-day whisper (#6), `yay` to combo ×3 (#2) and petting every ~5th (#10), `hmm/huh` to the mascot-sheet taps for variety. Zero new assets, instant personality.
