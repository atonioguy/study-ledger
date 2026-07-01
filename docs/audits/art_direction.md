# Side Quest — Art Direction: Making the Twilight Glow

*A ranked art-direction proposal for making the visuals more vibrant, luminous, and dopamine-satisfying — without losing the cozy dusky-twilight soul. Med-student calm; Animal Crossing / Steven Universe warmth.*

**Grounded in:** `quest.html` (live — CSS-variable theming, canvas `drawSlime`/`drawTomato`/`drawBuddy`, pomo room with moon/star/rug sprites, `cwBurst`/`cwXpFloat`/`cwBanner` FX, arcade scanlines, radial dot bg), `quest-next.html` (prototype — `PALETTES` table + two-token `applyWorldTheme`, `drawSlime`/`drawTomato`/`drawBuddy`/`hillURL`/`flagURL`, snake map), `PLAN.md` (worlds/palettes/leveling intent), and the four reference images (blue slime mascot; prismatic 4-point star; cozy nighttime village / jellyfish bedroom / rainy bus stop).

**Complements — does not duplicate — `gamefeel_ideas.md`.** That report owns the *mechanics of juice* (coin flight, combo, ceremony, thump, petting, twilight clock, rain lifecycle, flavor motes as a system). This report owns the *craft of the image*: exact hues, gradient stacks, bloom recipes, sprite pixel work, and type treatments. Where we touch a shared surface (rain, motes, twilight sky, map ambiance) I go deeper on the *look* and defer the *trigger/lifecycle* to gamefeel.

## Two hard constraints found in the code
1. **There is no `prefers-reduced-motion` guard anywhere in either file** (only `exam2.html` has one). Every animated idea below assumes we add ONE global block first (see idea #0). This is non-negotiable for a study tool a tired med student uses at 1am.
2. **The prototype palettes have two bugs to fix while we're in there:** `mint` and `twilight` share the identical accent `#5fe0c8` (mint has no identity), and `snow`'s accent is blue `#7fbfff` even though PLAN.md wants peach. Both are addressed in idea #1.

**Ranking:** low-risk / high-delight first. Tags: **[CSS]** / **[canvas]** / **[new-art]** and **[prototype]** (build in `quest-next.html` now) / **[live]** (safe to fold into `quest.html`).

---

## 0. Reduced-motion + bloom foundation (do this first) — [CSS] [live + prototype]
- **What:** A single `@media (prefers-reduced-motion: reduce)` block that (a) kills all looping/parallax/particle animation, (b) keeps one-shot state-change transitions (bar fills, check-draw) but shortens them, and (c) freezes particles at a tasteful static frame rather than removing them (a still firefly is a glowing dot — still pretty). Plus define a small set of reusable bloom tokens: `--bloom-gold`, `--bloom-accent`, `--glow-soft` as pre-tuned `drop-shadow`/`box-shadow` recipes so every later idea composes the same luminous language instead of ad-hoc shadows.
- **Why:** Vibrance without this is reckless in a calm app. And a shared bloom vocabulary is *why* the reference images read as one luminous world rather than scattered effects — consistency of glow is the whole trick.
- **Implementation:** CSS only. `:root{ --bloom-gold:0 0 14px rgba(255,200,110,.75); --bloom-accent:0 0 14px color-mix(in srgb,var(--comp) 60%,transparent); }` then reuse in every glow site. The media block wraps `*{ animation-duration:.001ms!important; animation-iteration-count:1!important; }` with hand-exceptions.
- **Risk:** Low. Pure safety + refactor.
- **Perf:** Improves it (caps animation).
- **When:** BEFORE everything, both files.

---

## 1. Palette Refresh — richer, two-shade luminous tokens — [CSS] [prototype now, live on fold]
The single highest-leverage move. Today each palette is 4 flat hexes (`acc/c1/c2/bd`) and `applyWorldTheme` derives the rest with a crude `shade()` lerp toward black/white — which *desaturates* as it darkens (muddy), the opposite of the references' rich, saturated dusk.

**The fix: keep the two-token base+accent model, but (a) push saturation up ~10-15% and lightness of the accent up, (b) give each palette a distinct luminous accent, (c) add a per-palette `glow` hue token and a `hi2` bright-highlight token so gradients read as *lit* not *tinted*, and (d) derive shades by rotating toward the palette's own hue instead of pure grey.**

Concrete suggested hexes (base c1/c2 stay dusky and cozy; accents get brighter + each unique; new `glow` = the color light "leaks" as):

| World | base c1 (lit) | base c2 (deep) | border bd | **accent (brighter, unique)** | **glow (bloom hue)** |
|---|---|---|---|---|---|
| 🌆 twilight | `#3d3168` | `#241c46` | `#8a72d8` | `#66ecd4` (keep teal, +lum) | `#8f7bff` violet |
| 🔥 sunset | `#523142` | `#3a2130` | `#d67a44` | `#ffb36a` warm amber-cyan pair→ **`#57d9e0` cyan** | `#ff9e5a` ember |
| 🌿 mint | `#27503f` | `#183028` | `#54ad94` | **`#ff9e86` coral** (was dup teal) | `#8fe6b4` leaf-green |
| ❄️ snow | `#38507e` | `#243050` | `#7a94d0` | **`#ffcaa0` peach** (was blue; matches PLAN) | `#add0ff` icy |
| 🌸 sakura | `#4a3352` | `#33203c` | `#c885b0` | `#9fe9c4` mint | `#ffc2e0` blossom-pink |

- **Why:** This is what turns "the world is pink" into "cherry-blossom season." The references are saturated-but-soft: deep base, one singing accent, and light *leaking* as a third hue. Adding `glow` gives every world a signature bloom color for particles/vignettes (idea #4-6) to inherit for free. Unique accents fix mint's identity crisis and honor PLAN's snow-peach.
- **Implementation:** CSS/JS. Extend the `PALETTES` objects with `acc2` (light accent), `glow`, `hi2`. Rewrite `shade()` → `mix(hex, targetHue, pct)` so darkening rotates toward `glow`/base hue (stays saturated). `applyWorldTheme` sets `--glow`, `--comp-hi` alongside existing tokens. The picker `.palchip` gradient already previews c1→acc; make it c1→acc2→glow tri-stop so the chip itself sparkles.
- **Risk:** Med — touches the theming core and every downstream color. Do it in the prototype first, tune contrast (esp. snow's light base needs dark text — PLAN already flags this), then fold.
- **Perf:** None.
- **When:** Prototype NOW (it's the visual bedrock all other ideas pull hues from), fold with the migration.

## 2. Layered ambient gradient + vignette on every screen bg — [CSS] [live + prototype]
- **What:** Replace the flat `--body` fill + single radial dot with a **3-layer stack**: (1) a large soft radial "sky glow" top-center in the palette's `glow` hue (like the village's lamp-lit horizon), (2) the existing pixel dot grid but fading toward the bottom, (3) a gentle full-screen inner vignette (`radial-gradient(transparent 55%, rgba(8,5,20,.35))`) that darkens the corners so content floats in a pool of warm light. The prototype's `#app` already layers `radial-gradient(var(--dot)…) , radial-gradient(circle at 50% 0%, var(--base2), var(--base))` — extend that same pattern into `quest.html`'s `#app`/`.cwbody`.
- **Why:** Depth. The reference scenes glow from *within* — light has a source and falls off. A vignette + top glow instantly reads as "cozy interior at dusk" instead of "dark rectangle." Costs zero motion, safe for reduced-motion.
- **Implementation:** CSS only, stacked `background-image`. One new `--skyglow` token (idea #1's `glow` with low alpha).
- **Risk:** Low.
- **Perf:** Static gradients, negligible.
- **When:** BEFORE (live now), prototype mirrors it.

## 3. Prismatic reward star + glow-ified currency icons — [canvas] [live now]
- **What:** The current star sprites are flat lilac (`ic-star` SVG `#bca6f0`, pomo `pomoStarURL` white cross). Reference image #2 is the north star: a radiant 4-point sparkle with an **icy-blue → lavender → peach → white prismatic gradient** and soft bloom. Redraw the reward/currency star as a small pixel 4-point star with a 3-4 color vertical ramp (`#bfe8ff → #c9b3ff → #ffc`→ white core) and a 1px white hot-center, then wrap it in a `drop-shadow` bloom. Apply the same treatment to the coin (warm gold core + rim-light) and the completion ⭐ in `CW_STAR`.
- **Why:** Rewards should *sparkle*. This icon appears at every dopamine beat (star chip, quest stars, node completion, gacha). Making it luminous and prismatic — the exact thing the owner pinned as inspiration — upgrades every reward moment at once for the cost of one sprite.
- **Implementation:** Canvas — a `starURL(size)` compositor (ramp via per-row `fillStyle`); reuse for chip icon, node star, float. Bloom via CSS `filter:drop-shadow(var(--bloom-gold))` on the `<img>`/span. `CW_STAR` path already exists for SVG — give its `<svg>` a gradient `<defs>` fill + drop-shadow.
- **Risk:** Low — additive sprite swap.
- **Perf:** Negligible (drawn once, cached data-URL).
- **When:** BEFORE (live now).

## 4. Twinkling stars + fireflies as the map/pomo ambient layer — [canvas + CSS] [prototype now, pomo live now]
- **What (visual craft; gamefeel #13/#15 owns the system):** Two cheap luminous layers. **Twinkle:** the pomo room already scatters static `pomoStarURL` dots at fixed opacities — give ~5-6 of them an individual staggered opacity+scale keyframe (`.4→1→.4` over 3-5s, random delays) so the sky *breathes*. **Fireflies:** 3-4 two-pixel dots in the palette `glow` hue, each on a slow lissajous wander with a pulsing bloom (`box-shadow` in `--glow`), drifting near the hills at dusk. Petals/snow/embers reskin the same node.
- **Why:** Independent twinkle is the difference between "starfield wallpaper" and "evening sky." Fireflies are the single coziest particle in the reference set (the bus-stop scene) and they carry the world's signature glow hue, tying particle → palette → mood into one system.
- **Implementation:** Canvas 5×5 sprites + CSS keyframe wander. Cap ~8 animated nodes. Reduced-motion → freeze at mid-opacity (still a pretty static glow, per idea #0). Fireflies inherit `--glow` so they retint per world automatically.
- **Risk:** Med — perf/jank on iPhone; keep node count tiny, transform/opacity only, `will-change` sparingly.
- **When:** Pomo twinkle BEFORE (live); map fireflies prototype now → live on fold.

## 5. Lamp-light warmth + window glow on hills and map props — [canvas] [prototype now]
- **What:** The reference villages glow because *windows are lit*. Give the map hills (`hillURL`) and any cozy props a warm interior light: a tiny 2×2 gold window pixel with a soft bloom halo on the current/selected quest hill, and a warm rim-light on the crest facing the "moon." The `.mglow` selection halo already exists (radial teal+gold `mamb` pulse) — enrich it to a two-stop radial in `--glow` + gold and make the *selected* hill's window brighter than the rest (a lit home = "you are here").
- **Why:** Warm lamplight against cool dusk is the exact emotional core of the village reference — it says "someone's home, it's safe here." Making the *current* quest the brightest-lit spot also doubles as wayfinding (dopamine + function).
- **Implementation:** Canvas — add a `warm=true` param to `hillURL` that stamps a window + rim highlight; CSS bloom on the selected `.mhill`. Enrich `.mglow` gradient stops with `--glow`.
- **Risk:** Low-Med — sprite tweak + one gradient.
- **When:** Prototype now (map is a prototype surface); folds later.

## 6. Glossier, more alive mascots — highlight, rim-light, cast shadow, blink — [canvas] [live now]
- **What:** The slime/tomato/buddy already have ONE flat highlight patch (`HI`). Reference #1's slime is *huggable* because it has a big soft gloss highlight, a clean dark outline, and readable weight. Upgrades, all in the existing draw functions:
  - **Bigger gradient gloss:** widen the `HI` patch and add a second brighter `hi2` pixel at its center (2-step specular, reads as glossy/wet).
  - **Rim-light:** 1px of the palette `glow` hue along the top-left edge (catches the "moonlight") — this is the biggest "pops off the background" win.
  - **Contact shadow:** a soft 2px `rgba(0,0,0,.22)` ellipse *under* the sprite (the buddy portrait already does `px(...'rgba(0,0,0,.22)')` — bring it to the HUD/map sprites) so they sit in the world instead of floating.
  - **Blink frame:** pre-render an eyes-closed variant (eyes → 1px lines) and swap ~120ms on a random 4-7s timer (gamefeel #7 owns the idle *behavior*; this is just the art asset).
- **Why:** Gloss + rim-light + contact shadow are the three cheapest "this is a cute creature, not a sprite" signals. They make the mascots feel plush and lit by the same twilight as everything else — pure warmth, no noise.
- **Implementation:** Canvas — add `hi2`, a rim-light loop over the outline row, and a shadow ellipse to `drawSlime`/`drawTomato`/`drawBuddy`/`drawBuddyPortrait`. Blink = second cached data-URL. **Doable entirely by tweaking existing draw functions** — no commissioned art needed for these blobs.
- **Risk:** Low — self-contained pixel edits; keep outline crisp so it stays readable at 26px.
- **When:** BEFORE (live now); prototype sprites get the same edits.

## 7. Text pop — gradient headings, glow, and animated reveals — [CSS] [live + prototype]
- **What:** The pixel fonts (Silkscreen headings, VT323 body) are legible but flat. Add tasteful pop while protecting legibility:
  - **Gold gradient fill on section/quest titles** (`background:linear-gradient(#fff4c2,#ffcf6e); -webkit-background-clip:text`) with the existing gold text-shadow as a soft outer glow — turns `.qt`/`.hubttl`/`.pomo-ttl` into little lit signs (like the reference "NEXT BUS" sign).
  - **Prismatic fill on the biggest moment only** (`QUEST COMPLETE` / level-up rank): the star's icy→lavender→peach ramp as a text gradient.
  - **Count-up + one-char-at-a-time reveal** for rank titles and big numbers (VT323 renders type-on beautifully) — gamefeel #8 owns the level-up trigger; this is the type treatment.
  - **Crisp drop-shadow for legibility on bright accent surfaces** (done rows already dark-on-bright per PLAN — keep a 1px dark shadow so pixel text never smears on glow).
- **Why:** Typography is where "app" vs "game" is felt in the reading. A gold gradient sign glows like the references without hurting the pixel crispness (clip preserves the glyph edges). Reserve prismatic/animated reveals for peak moments so they stay special.
- **Implementation:** CSS `background-clip:text` + existing text-shadow tokens; reveal via a tiny JS type-on. Guard motion under #0.
- **Risk:** Low — clip-text is well-supported; always keep a solid `color` fallback for the gradient headings.
- **When:** BEFORE (headings/signs live now); prismatic/reveal with the ceremony (prototype→fold).

## 8. XP / progress bars as glowing energy — [CSS] [live + prototype]
- **What:** The gold HUD bar already has a sweep sheen + `box-shadow` glow (nice). Extend the language: (1) give the teal/accent chapter+quest bars the same *animated* inner sheen (currently only the gold bar shines), tinted to `--comp`; (2) add a soft outer bloom in `--glow` that brightens as the bar approaches 100% (a bar that's almost full should feel *charged*); (3) a 1px bright top-edge highlight on the fill so it reads as a lit tube, not a flat block. On completion the bar does a brief brightness flash (composes with gamefeel's fill/ceremony).
- **Why:** Progress bars are watched constantly; making them read as *glowing energy* rather than filled rectangles adds luminous life to the most-seen element. "Brighter as it fills" is a subconscious anticipation cue.
- **Implementation:** CSS — reuse the `cwShine` keyframe on accent bars; a `box-shadow` that scales via a `--fillpct`-driven inline style or a `.near-full` class toggled in the render.
- **Risk:** Low.
- **When:** BEFORE.

## 9. Rain & weather as a *visual* mood layer — [CSS] [live pomo now, map on fold]
- **What (visual craft; gamefeel #14 owns the audio/date-seed lifecycle):** The cozy look of the rainy bus-stop reference: (1) 1px diagonal rain streaks via an animated `repeating-linear-gradient` `background-position` (single compositor animation), (2) a subtle deepened indigo tint overlay, (3) **wet-reflection sheen** at the bottom edge (a faint vertical gradient + a couple of blurred inverted glints under lit props), (4) occasional slow drift of the streak angle. Snow reuses the same layer with round dots and a slower fall.
- **Why:** Rain is the most study-coded weather (lo-fi culture is built on it) and `rain.mp3` is already in the repo waiting. The reflection sheen is what elevates it from "lines on screen" to the reference's glossy wet-night mood.
- **Implementation:** One absolutely-positioned div, gradient animation. Reduced-motion → static streaks + tint (still cozy). Tint composes over any palette as an overlay (don't touch palette tokens).
- **Risk:** Med — visuals trivial; the audio lifecycle (gamefeel's concern) is the only real risk.
- **When:** Pomo BEFORE; map AFTER fold.

## 10. Environmental cozy props on the map — [canvas + new-art] [prototype now]
- **What:** The reference maps are dense with loving detail (rounded trees, lily pads, lamp posts, jellyfish, cherry-blossom trees). Give the map world sparse decor between quest spots that reskins per palette: rounded pixel trees + a lamp post (twilight), cherry trees + drifting petals (sakura), snowdrifts + a pine (snow), a little fire/lantern (sunset), ferns + mushrooms (mint). Keep them small, behind the road, low-contrast so quest spots stay readable. A single lamp post with a warm bloom near the current quest is worth ten scattered props.
- **Why:** Density of *loving* detail is the whole cozy-world feeling — it's why the references feel inhabited. Reskinning props per palette is a major reason to *make* worlds (feeds the multi-world motivation loop).
- **Implementation:** Canvas prop sprites (trees/lamp are doable in the existing `hillURL` style — **flag: a full cohesive decor set per palette is the one place I'd recommend NEW commissioned pixel art** if quality bar is high; the blobs/hills/flags can stay code-drawn). Place a `DECOR[palette]` table in the map render, z-index under `.mbox`. Watch single-file size — code-drawn sprites add ~0 bytes; imported PNGs would bloat the file, so keep decor canvas-generated.
- **Risk:** Med — readability (keep decor dim/behind) and size discipline (canvas-only, no PNG imports).
- **When:** Prototype now; folds with the map. Commissioned decor art is a stretch goal, explicitly optional.

## 11. Selection & hover bloom polish — [CSS] [live + prototype]
- **What:** Make interactive elements *invite the touch* with a warm bloom on focus/hover/active. Quest nodes/cards already lift + glow on hover; unify to the `--bloom-accent`/`--bloom-gold` tokens, add a brief bloom "breath" on the *currently-actionable* thing (the current lesson pip already pulses — extend a soft halo to the selected map box and the primary CTA button). Done states get a lingering accent bloom that slowly settles (a satisfied glow after completion).
- **Why:** Consistent, warm interaction glow is dopamine-per-tap and reinforces the luminous language. The "settling" done-glow gives completion a soft afterglow instead of a hard state flip.
- **Implementation:** CSS transitions on existing hover/`.sel`/`.done` rules, swapping ad-hoc shadows for the shared bloom tokens; a settle = a `.done` transition on `box-shadow` from bright→resting.
- **Risk:** Low.
- **When:** BEFORE.

## 12. Shooting stars & night-sky moments — [canvas + CSS] [prototype/live with twilight clock]
- **What (visual; gamefeel #4 owns the day/night clock trigger):** At late-night phases, a rare (every few min) shooting star streaks across the map/pomo sky — a 2px gold-white head with a fading 8px tail — and the moon (pomo `pomoMoonURL` already exists) gets a soft bloom halo. A once-in-a-while treat, never on a tight loop.
- **Why:** The reference night skies feel *witnessed* and magical. A rare shooting star is a tiny surprise-delight that rewards the late-night study grind specifically (the exact audience). Rarity keeps it calm.
- **Implementation:** Canvas streak + CSS one-shot translate/opacity; scheduled by the twilight-clock phase. Reduced-motion → skip entirely (it's motion-only).
- **Risk:** Low-Med.
- **When:** WITH the twilight clock (prototype now for pomo, folds to map).

---

## Suggested batches
- **Ship in live `quest.html` now (pure look, low risk):** #0 reduced-motion+bloom foundation, #2 ambient gradient+vignette, #3 prismatic star/currency, #6 glossy mascots, #7 text pop (headings), #8 glowing bars, #11 selection bloom, #4 pomo twinkle, #9 pomo rain visuals.
- **Build in the prototype now (defines the world's look before fold):** #1 palette refresh (bedrock), #5 lamp-light hills, #4 map fireflies, #10 cozy map props, #12 shooting stars.
- **After the fold (world-structure dependent):** map rain, palette-particle motes, full decor sets.

## The through-line
Every idea pulls from **one shared luminous vocabulary**: a saturated dusky base, one singing accent, a third `glow` hue that light "leaks" as, and a consistent bloom recipe. That single system — not any one effect — is what makes the reference images feel alive and of-a-piece. Add it once (#0 + #1), and vibrance compounds across every screen while the calm twilight soul stays intact: nothing loud, nothing that punishes a tired student, everything glowing gently from within.
