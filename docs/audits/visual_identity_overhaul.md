# SIDE QUEST — Visual Identity Overhaul: **LANTERNLIGHT**

*Ground-up identity system. Not a polish pass — a re-founding of how the game looks, lights, and moves. Owner-locked ambition: HYBRID (full CSS/canvas chrome redesign + a small set of sourced hero pixel-art PNGs).*

**Grounded in:** `quest.html` (live chrome as-is), `docs/audits/art_direction.md` (the timid version — this goes past it), `aesthetic_direction_notes.md` (the five references), `user_steer_decisions.md` (Campfire, Den, Hearth/Fire Ring, Payday Wheel, buddies, cosmetics+decor, Auto Today — the new skin must house all of them).

---

## 0. The identity in one paragraph

**Side Quest looks like a warm room at dusk.** Every screen is a pool of lamplight in an indigo evening: ambience is always cool (dusky violet-indigo), light sources are always warm (hearth-gold, peach), and everything interactive is *lit from within*. The chrome stops imitating a Windows-98 dialog (the current hi/lo bevel borders) and becomes **hand-crafted pixel furniture**: plush 9-slice frames with stepped pixel corners, chunky "clay" buttons that physically depress, paper-cream dialogue that feels like a storybook, and one disciplined bloom vocabulary shared by every glow in the game. The mascots stand on a real shelf, the XP bar is a lantern tube of golden light, and the nav is a tray of lit game-cartridge slots. Name of the system: **LANTERNLIGHT**.

### Why the current look reads "fine but too simple" — the diagnosis
1. **OS-bevel borders everywhere** (`border-color:var(--hi) var(--lo) var(--lo) var(--hi)`): reads as retro *software*, not a crafted *game*. The references have zero bevels — they have outlines, rounded mass, and light.
2. **Emoji as iconography** (🗺️🍅🥚🎰🥚🍒⚙): the single loudest "unofficial" tell. Platform-rendered emoji breaks pixel cohesion on every row it touches.
3. **Flat fills + one dot grid**: no light source, no depth, no vignette. Dark rectangle, not dusk.
4. **Square-cornered everything at one elevation**: no material language (what's raised? sunken? paper? glass?).
5. **Glow is ad-hoc**: a dozen hand-tuned rgba shadows instead of one luminous vocabulary.

LANTERNLIGHT fixes all five with **one token sheet + one frame generator + one icon atlas** — then the hero PNGs land on top.

---

## PART 1 — THE CHROME (CSS/canvas, buildable now)

*Ranked by impact-per-effort. Items 1–3 are the re-founding; everything after compounds.*

### 1.1 Foundation: tokens, light logic, reduced-motion — **[S effort · unlocks everything]**

One `:root` block replaces the current ad-hoc palette. Three families:

**Ink & dusk ramp (constant, all worlds):**
```css
--ink:#140f24;                     /* every outline, every hard shadow */
--dusk-0:#0f0a22; --dusk-1:#171029; --dusk-2:#241d3c;
--dusk-3:#332a59; --dusk-4:#463a78;   /* 5-step indigo, replaces body/spot/frame/card/hi */
```
**Hearthlight ramp (the warm constant — rewards, lamps, CTAs):**
```css
--hearth-0:#fff4c2; --hearth-1:#ffd96b; --hearth-2:#e8a94a; --hearth-3:#8a5a24;
--paper:#fbf3e0; --paper-ink:#3a2c52;   /* storybook dialogue material */
```
**Per-world tokens (adopt art_direction.md #1's table verbatim — it's correct):** `--c1 --c2 --bd --acc --acc2 --glow` per world (twilight/sunset/mint/snow/sakura), with mint's dup-teal and snow's blue-not-peach bugs fixed.

**Light logic (the rule that makes it cohere):**
- **Ambient = cool** (dusk ramp, world `--glow` leaks at edges).
- **Sources = warm** (hearth ramp): CTAs, rewards, the streak flame, lit windows, the selected thing.
- **Interactive = world accent**; **rest/tea = paper**. No element may glow outside this.

**Two shared bloom recipes** (the only glows allowed):
```css
--bloom-gold: 0 0 14px rgba(255,200,110,.65);
--bloom-acc:  0 0 12px color-mix(in srgb, var(--glow) 55%, transparent);
```
**Reduced-motion, global, first commit:** `@media (prefers-reduced-motion:reduce)` kills loops/parallax/particles (particles freeze at mid-opacity — a still firefly is still pretty), keeps one-shot state transitions at ≤120ms. Non-negotiable for a 1am study tool.

### 1.2 Frame language: the pixel-plush 9-slice — **[M effort · transforms every panel at once]**

Retire the bevel. One boot-time canvas draws a **24×24 frame sprite** (data-URL, ~300 bytes) and every panel uses it via `border-image`:

- **Anatomy:** 2px `--ink` outline → 1px `--hearth-0`-at-12% rim-light on the top inner edge → 2px face in `--dusk-3` → **stepped pixel corners** (2px steps, so corners read as hand-placed pixels, not CSS `border-radius` smoothness).
- **Three material variants, generated from the same function:**
  - `frame-panel` (cards, sections): dusk face, subtle top rim-light.
  - `frame-well` (inputs, bar tracks, the dex sockets, wheel hub): inverted — dark `--dusk-0` face, inner shadow `inset 0 3px 8px rgba(0,0,0,.5)`, no rim-light. Things *sit inside* wells.
  - `frame-paper` (dialogue, tooltips, Tomorrow's Promise note): `--paper` face, `--paper-ink` outline, tiny torn-edge notch pixels on one corner. This is the "we're having tea now" material.
- **Elevation model (exactly three depths):** *sunken* (wells), *resting* (panels, `box-shadow:0 2px 0 var(--ink)`), *raised* (buttons — below). Every element declares one. No more ambiguous flatness.
- Because it's `border-image` from a generated sprite, **re-theming per world is free** (regenerate once per palette swap) and it costs zero network bytes.

### 1.3 Button language: chunky clay — **[M effort · the "press feel" of the whole game]**

Buttons become physical objects you push into the frame:

```css
.btn{
  font:700 12px var(--pixfont); color:var(--dusk-0); text-transform:lowercase;
  background:linear-gradient(180deg, var(--btn-hi) 0 45%, var(--btn-md) 45%); /* hard 2-tone face = pixel shading */
  border:2px solid var(--ink); border-radius:7px;          /* + stepped-corner frame variant */
  box-shadow: 0 4px 0 var(--btn-lo), 0 4px 0 2px var(--ink),  /* colored extrude + ink under-edge */
              inset 0 2px 0 rgba(255,244,214,.4);            /* rim-light lip */
  transition: transform 70ms, box-shadow 90ms, filter 140ms;
}
.btn:hover  { transform:translateY(-1px); box-shadow:0 5px 0 var(--btn-lo),0 5px 0 2px var(--ink), var(--bloom-acc), inset 0 2px 0 rgba(255,244,214,.4); }
.btn:active { transform:translateY(3px);  box-shadow:0 1px 0 var(--btn-lo),0 1px 0 2px var(--ink); filter:brightness(.94); }
.btn:focus-visible{ outline:2px dashed var(--hearth-1); outline-offset:3px; }
.btn[disabled]{ filter:saturate(.35) brightness(.75); box-shadow:0 2px 0 var(--btn-lo),0 2px 0 2px var(--ink); transform:none; }
```
- **The depth trick:** the extrude is the button's *own hue darkened* (`--btn-lo`), then a 2px ink under-edge — this is what the reference sprites do (colored form shadow + outline), vs. the current black `0 4px 0 #0e0820` which reads as a hole.
- **Variants:** `primary` = hearth-gold clay (hi `#ffe291`/md `#ffc95e`/lo `#c07f2e`) — CTAs only, one per screen; `secondary` = world-accent clay; `quiet` = dusk clay; `ghost` = outline-only well (for "keep them"-style safe outs); `danger` = dusk-rose `#c56a86` (never red — cozy law).
- **Press feel:** active state travels the full 3px in 70ms *with no ease* (instant, mechanical), release settles back with `cubic-bezier(.2,.8,.2,1)` — a real click. On success taps, a 1-frame `--hearth-0` flash on the rim-light lip.
- Quest **part-nodes and review-quest buttons** adopt the same clay anatomy (they're already close) — they just swap black extrudes for colored ones, gain stepped corners and the bloom-on-hover token. **The exam-3 trail gets *elevated*, not restructured.**

### 1.4 Kill the emoji: one pixel icon atlas — **[M effort · biggest single "official game" jump]**

A boot-time `icon(name, hue)` canvas function draws a **12×12 pixel icon set** (rendered 2×, cached as data-URLs): `map-scroll, kettle, tomato, flame, egg, paw, wheel, coin, star4, gear, undo, cloud, tea-cup, moon, check, link, lock`.

- **Rules:** 1px `--ink` outline · 2-shade fill (base + shade) · exactly one `--hearth-0` highlight pixel · no anti-aliasing · drawn on the same grid so they sit on a shared baseline.
- Replaces: nav 🗺️🍅🥚🎰, header ⚙/⟲, slot 🍒🔔⭐, egg 🥚, chips, pills. Emoji survives **only inside user-ish flavor text**, nowhere in chrome.
- **The reward star** becomes the prismatic 4-pointer from reference #2: per-row ramp `#bfe8ff → #c9b3ff → #ffd9c2 → #fff` + white hot-center + `drop-shadow(var(--bloom-gold))`. The coin gets a rim-light and a 2px glint. Every dopamine beat upgrades at once.

### 1.5 The HUD becomes **The Mantel** — **[M effort]**

The top bar stops being a toolbar and becomes the top of the hearth — a place where the family lives:

- **Backdrop:** a 3-stop sky gradient (`--glow` at 8% → `--dusk-3` → `--dusk-2`) with 4–5 single-pixel star specks (canvas sprite) and a tiny code-drawn moon at the right; bottom edge is a **2px warm shelf line** (`--hearth-3` with a 1px `--hearth-1` top highlight).
- **Mascots stand ON the shelf**: contact shadows (2px `rgba(0,0,0,.25)` ellipse), the existing squish idle, hats intact. Tap → mascot sheet (unchanged behavior).
- **XP bar → lantern tube:** a `frame-well` pill with a 1px glass top-highlight; the fill is hearth-gold "liquid" with the existing sheen sweep, plus a bloom that scales up over the last 20% (`.near-full` class) — a nearly-full lantern feels *charged*. Level plaque sits on the tube's left cap like a lantern collar.
- **Streak chip → the Hearth flame:** the `🔥 0/7` mislabel dies; the chip shows the pixel flame icon whose *lit/embers/cold* art states come from `redesign_streak.md` — the flame is now a first-class identity element (it also anchors the Campfire and Fire Ring).
- **Currency chips → tokens:** small `frame-well` sockets with the icon *set into* the well and the number beside it; on gain, the socket blips `--bloom-gold` and the number counts up.

### 1.6 Bottom nav becomes **The Tray** — **[S–M effort]**

Five slots on a raised tray (`--dusk-1` base, 2px ink top edge, faint top rim-light): **campfire · map · den · buddies · shop** (Campfire earns the first slot per the approved daily on-ramp; "pomo" is renamed to match the Den design).

- Inactive tab: dimmed pixel icon, 8px lowercase label at 55% opacity.
- **Active tab: a lit slot** — the icon recolors to `--hearth-1`, a soft radial lamp-pool rises behind it (`radial-gradient` in `--glow` at 18%), the slot face lifts 1px, and a **2px ember dot** glows beneath the label (breathing at 3s; static under reduced-motion). Switching tabs slides the ember dot horizontally (140ms) — one tiny, satisfying mechanical detail.
- 484px-safe: 5 slots × ~92px min; labels truncate never (all ≤7 chars).

### 1.7 Light the rooms: background stack + ambient layer — **[S effort · the "alive" feel]**

Every screen body gets the same 3-layer stack (pure CSS, zero motion required):
1. **Sky pool:** `radial-gradient(120% 90% at 50% -10%, color-mix(in srgb, var(--glow) 22%, transparent), transparent 60%)` — light has a source.
2. The existing pixel dot grid, but **masked to fade out by 70% height**.
3. **Vignette:** `radial-gradient(transparent 55%, rgba(8,5,20,.38))` — content floats in a pool of lamplight.

Plus a per-screen **ambient particle layer, capped at 8 nodes, transform/opacity only**: map = fireflies in `--glow` (lissajous drift + pulse); Den = kettle steam wisps + 2 embers; buddies = drifting star motes; shop/wheel = nothing (calm before a spin). Reduced-motion: frozen at mid-opacity.

### 1.8 Typography treatment — **[S effort]**

Keep the voice (Silkscreen display / VT323 body / all-lowercase chrome — it's already a brand asset). Add hierarchy and light:

- **Screen titles** (`✦ exam 3 quest` etc.): Silkscreen 15px, letter-spacing 1px, **gold gradient clip** (`linear-gradient(#fff4c2,#ffcf6e)` + `background-clip:text`) over a 1px ink drop shadow — a lit sign, like the reference "NEXT BUS". Solid `color` fallback always declared.
- **Section labels:** Silkscreen 10px, +1.5 tracking, lavender at 65%.
- **Body/meta:** VT323 17/13px (unchanged sizes — legibility is already right).
- **Numbers that pay** (xp, coins, timers): VT323 in hearth-gold with the ink shadow; on change they count up (JS tween, 400ms).
- **Prismatic text is reserved** for the two peak ceremonies only (quest complete, rank-up): the star's icy→lavender→peach ramp as a clip gradient + one-char type-on (VT323 loves it). Scarcity keeps it special.
- **Paper dialogue** (mascot bubbles, tea beat, Tomorrow's Promise): VT323 18px `--paper-ink` on `frame-paper` — the tenderest register, straight from the tea-party reference.

### 1.9 Cards, rows, modals, wells — **[S–M effort]**

- **Quest rows / cards:** `frame-panel` + a 3px **accent spine** on the left edge (world accent; turns hearth-gold on the *current* actionable row with a breathing bloom). Done rows warm: face tints 6% toward `--acc`, check socket fills accent with the existing draw-on check, then the glow *settles* over 600ms to a resting shimmer — a satisfied afterglow, not a state flip.
- **Progress bars:** all bars (chapter/quest/module) get the gold bar's treatment — inner sheen tinted `--acc`, 1px bright top edge (lit tube), bloom scaling with fill, brightness flash at 100%.
- **Modals:** dimmer becomes indigo-with-vignette (`rgba(15,10,34,.78)` + radial edge darkening), card enters with **settle** (below). System modals = `frame-panel`; emotional beats (tea, promise, rank-up) = `frame-paper` or ceremony treatment. Buttons follow the clay system (`primary` right, `ghost` left).
- **Inputs:** `frame-well` + VT323 16px; focus = accent rim + `--bloom-acc`.
- **Wheel (Payday):** fully code-drawn — canvas segments in world palette with hearth-gold jackpot wedge, ink outlines, a clay pointer; tick-decelerate spin per the locked design. The *cabinet* around it is `frame-panel` with two tiny painted-on lamp pixels.

### 1.10 Motion language — **[S effort · one vocabulary]**

Four named motions, used everywhere, nothing else:

| name | spec | used for |
|---|---|---|
| **press** | 70ms linear down / 140ms settle-back | buttons, checks, taps |
| **settle** | 180ms `cubic-bezier(.2,.8,.2,1)`, translateY(6px)+fade, 2% overshoot | modals, cards entering, screen switches (screens crossfade 160ms + 6px slide) |
| **breathe** | 3s ease-in-out glow/opacity pulse | the ONE currently-actionable thing per screen + active nav ember |
| **ceremony** | reserved composite (banner, confetti, count-up, type-on) | quest/chapter complete, rank-up, jackpot — gamefeel doc owns triggers |

Durations quantized to 70/140/220/400ms. Reduced-motion: press/settle shorten to ≤120ms, breathe/particles freeze, ceremony becomes a static card + count-up only.

---

## PART 2 — HERO PIXEL-ART SHOPPING LIST (sourced PNGs; Antonio hands these briefs verbatim to an artist or image generator)

**Global spec for every asset:** true low-res pixel art at NATIVE resolution listed (no fake "pixel-style" hi-res — crisp 1px pixels), PNG-8/indexed color, transparent where noted, ≤ the byte budget, no text baked in, no characters baked in (the code-drawn gang must layer on top). Display is `image-rendering:pixelated` at integer scale (app column is 484px in the dashboard iframe; all natives chosen to 2×-scale cleanly into it). Style anchor for ALL: the owner's references — hand-drawn cozy pixel scenes, saturated-but-soft dusk palettes, warm lamplight against indigo, loving small details, calm not loud.

### HERO-1 · The Den room background — *the flagship* 
- **Purpose:** backdrop of the Den (pomo room → cozy focus/rest room where tomatoes live, per the Den/Press-▶ design). Highest-dwell cozy surface in the game.
- **Dimensions:** **240×200 native** (displays 480×400 @2×). Deliver 2 states: `den-evening.png` and `den-teatime.png` (same room, warmer lamp pools + kettle steam glow + tea set out).
- **Art direction:** interior at dusk in the spirit of the jellyfish-bedroom + pastel-living-room references: one arched window (upper third, dusky indigo sky with 2–3 stars visible), bookshelf with small clutter, a low shelf with kettle, potted plant, round rug centered in the lower half, warm lamp on the left pooling gold light on the floor, soft wood floorboards. Leave the rug + floor center **visually quiet** (entities walk/sit there) and the bottom 15% low-detail.
- **Palette:** walls/sky from the dusk ramp (#241d3c–#463a78), lamp pools #ffd96b→#fff4c2, accents lavender #8a72d8 + teal #5fe0c8; outlines #140f24.
- **Integration:** `<img>` absolutely positioned as layer 0 inside `.pomo-room`; code draws ON TOP: tomatoes, mascots, steam particles, the lamp's animated glow (CSS radial pulse anchored to the lamp), preserve jars on the shelf (code sprites at spec'd anchor coords: window rect, shelf line y=38%, rug ellipse at 50%/72%). Lazy-loaded on first Den open; **budget ≤70KB each**. Fallback until it arrives: current CSS floor + a code-drawn window rectangle (see rollout).

### HERO-2 · Campfire clearing — *the daily front door*
- **Purpose:** backdrop of the Campfire boot screen (gang around a fire + ≤3 step cards) — first thing seen every day; also home of the Fire Ring hearthstones.
- **Dimensions:** **240×160 native** (480×320 @2×), full-bleed top panel; step cards render below it.
- **Art direction:** night clearing: indigo starfield sky (leave upper-center calm for a greeting line), silhouetted pine/rounded-tree line, grassy ground, **an UNLIT stone fire pit dead-center** (logs + stone ring only — the flame is code-drawn and animated so it can flicker, scale with streak state, and go to embers), a log bench arc around it, 8 small flat stones evenly spaced in a ring around the pit (the Fire Ring hearthstones — code lights them). 2–3 fireflies' worth of empty air for code particles.
- **Palette:** sky #0f0a22→#332a59, grass desaturated indigo-green #2c3a4a, stones #4a4066, moonlight rim #add0ff; NO warm light baked in (all warm light is code, so the fire can be out).
- **Integration:** layer 0 of the campfire screen; code layers: animated pixel flame + glow pool, seated mascots at bench anchors, lit hearthstone overlays, fireflies. **Budget ≤55KB.**

### HERO-3 · World horizon strips ×5 — *the map's soul, cheap*
- **Purpose:** a parallax skyline behind the quest trail on the map screen — makes each world (twilight/sunset/mint/snow/sakura) feel like a *place* without commissioning five full maps.
- **Dimensions:** **240×56 native each** (480×112 @2×), horizontally tileable, transparent sky above the silhouette line. Five files: `horizon-twilight.png`, `-sunset`, `-mint`, `-snow`, `-sakura`.
- **Art direction:** a low village/landscape silhouette strip per world with **2–4 lit windows** (the warm-lamplight-in-cool-dusk signature): twilight = village rooftops + one lamppost; sunset = desert-mesa + campfire dot; mint = mushroom-and-fern grove + glowworm; snow = pines + one cabin window; sakura = blossom trees + a shrine lantern. Rich bloom on the lit pixels, everything else 2–3 tones of that world's `--c2`/`--bd`.
- **Palette:** each strip uses ONLY its world's 6 tokens + hearth-gold for lit windows.
- **Integration:** fixed behind the scrolling trail (`background-position` parallax at 0.3× scroll — static under reduced-motion), fading into the vignette. Lazy per-world on first visit. **Budget ≤25KB each (≤125KB set).**

### HERO-4 · "The hustle is over" tea-party vignette — *the emotional keystone*
- **Purpose:** the art for the **"call it a night 🫖"** rest beat + Tomorrow's Promise frame — the single most tender moment in the loop, straight from the owner's favorite reference.
- **Dimensions:** **200×120 native** (400×240 @2×), transparent or soft-vignetted edges (it floats on `frame-paper`).
- **Art direction:** the gang's tea table, pastel register: low round table with teapot + three cups, cushions, a small vase of hydrangeas, floral-hint wallpaper behind, warm lamp glow from the right; pinks/lavenders (#f7d9e8, #cbb4f0) over dusk shadows. **Seats/cups empty or generic** — the code seats the actual slime/tomato/dumpling + equipped buddy on top at anchor points, so the scene always shows *your* family, hats included.
- **Palette:** paper-pastels + hearth gold; outlines a softened plum #3a2c52 (gentler than ink — this scene is the soft register).
- **Integration:** shown inside the tea modal (`frame-paper` card), lazy on first day-end. **Budget ≤45KB.**

### HERO-5 · Key art & app identity — *the "official" seal*
- **Purpose:** app icon + title moment. One piece of true key art: the slime mascot with a tiny lantern, dusk sky, prismatic star overhead.
- **Dimensions:** **64×64 native icon** (export 512×512 nearest-neighbor for `icon.png`/touch icon) + optional **160×64 native title vignette** used behind the "side quest" wordmark on first load (wordmark itself stays code: Silkscreen + gold-clip treatment).
- **Art direction:** the chunky-blue-slime reference energy — big gloss highlight, clean dark outline, huggable mass — holding a lit lantern; background split dusk-indigo to warm glow; one prismatic 4-point star.
- **Palette:** slime teal-blue #5fb7e8/#2f7fc0, lantern hearth ramp, sky dusk ramp.
- **Integration:** replaces `icon.png` + apple-touch; title vignette lazy, only on the boot/campfire screen. **Budget ≤20KB (icon) + ≤30KB (vignette).**

**Total wave-1 asset weight: ≤ ~350KB, all lazy-loaded, zero bytes inlined in the HTML.**

*Explicitly NOT commissioned (code-drawn is better):* the wheel (must be data-driven/spinnable), the egg (cheap sprite), mascots/buddies/hats (already code-drawn and must accept cosmetics), map decor props (palette-tinted canvas sprites, per art_direction #10), all icons, all frames, the flame (animated states).

---

## PART 3 — THE SPLIT (one table)

| Surface | Code-drawn (CSS/canvas) | Sourced PNG |
|---|---|---|
| Frames/panels/wells/paper, buttons, nav tray, HUD mantel | ✅ 9-slice generator + tokens | — |
| Icon set (nav, currency, actions, star, coin, flame) | ✅ 12×12 atlas | — |
| Mascots, buddies, hats, cosmetics, egg, wheel, decor props | ✅ existing draw fns + upgrades (gloss, rim-light, contact shadow, blink) | — |
| Backgrounds: sky pool, dot grid, vignette, particles, rain | ✅ CSS stacks + ≤8 sprite nodes | — |
| Den room | placeholder: CSS floor + code window | ✅ HERO-1 (2 states) |
| Campfire clearing | placeholder: gradient night + code fire | ✅ HERO-2 |
| Map skyline | placeholder: code hills (existing `hillURL` style) | ✅ HERO-3 ×5 |
| Tea/rest vignette | placeholder: paper card + seated code mascots | ✅ HERO-4 |
| App icon / key art | current icon stands in | ✅ HERO-5 |
| Ceremonies, banners, text FX, wheel spin | ✅ all code | — |

**Loading contract (single-file-friendly):** one tiny `ASSETS` manifest (`{den:'assets/den-evening.png', …}`); each hero renders as `<img loading="lazy" decoding="async" onerror=…>` that removes itself and reveals the code-drawn placeholder on 404. The game is **100% complete with zero PNGs present** — assets are pure upgrades. Cache-busted by filename version (`den-evening.v1.png`). Note the cautionary tale already in-repo: `images/room.png` is 1.9MB — hero budgets above are 25–70KB *because they're true native-res indexed PNGs*; the brief must say "deliver native resolution, not upscaled."

---

## PART 4 — ROLLOUT (no broken game, no exam-3 regression)

**Principle: re-skin by CSS/token substitution against the EXISTING DOM.** Class names, JS logic, and the `buildCampaign()` exam-3 trail structure don't change in phases 1–3 — only the paint does. Each phase ships independently; the game is playable and coherent after every one.

- **Phase 0 — Foundation (hours):** token sheet + reduced-motion block + bloom recipes into `quest.html` (and mirrored into the prototype's `applyWorldTheme`). Nothing visibly changes yet except safer motion.
- **Phase 1 — Chrome swap (1–2 sessions):** frame generator + `border-image` onto `.cw-win/.sq-card/.cw-barcard/.cw-row/.slot-cab/...`; clay button rules onto `.sq-bigbtn/.sq-mbtn/.cw-node/.cw-quest/.sq-reset`; background light stack on `#app/.cwbody`. **Checkpoint: exam-3 trail screenshot diff at 484px** — rows, nodes, seg-trail, module banners must all read *better, same layout*. This phase alone is ~60% of the perceived overhaul.
- **Phase 2 — Identity details (1–2 sessions):** icon atlas replaces emoji everywhere in chrome; Mantel HUD; Tray nav (add campfire slot as a stub route until the feature lands); typography treatment; bars/chips/checks alive-states; modal settle + indigo dimmer.
- **Phase 3 — Rooms & ambiance (parallel with feature migration):** per-screen ambient layers; Den placeholder scene (CSS floor + code window + lamp pool) so the room reads cozy *before* HERO-1 exists; paper dialogue material; wheel cabinet (lands with the shop revamp); mascot gloss/rim/blink upgrades.
- **Phase 4 — Heroes land (as Antonio sources them, any order):** drop each PNG into `assets/`, add one manifest line. HERO-3 strips can land per-world. No code risk — placeholders already occupy every slot.
- **Migration coexistence:** LANTERNLIGHT is defined as tokens + a generator + an icon atlas — a portable ~200-line block. It applies to live `quest.html` NOW (phases 0–2 touch zero game logic) and the prototype adopts the same block, so the fold inherits one identity instead of re-skinning twice. The Campfire/Den/Hearth/wheel features being designed elsewhere all *assume* these materials (paper, clay, wells, flame states) — this system is their stage, built first.
- **Perf guardrails:** all frames/icons are boot-time canvas → data-URLs (one-time ~ms cost, zero network); animation is transform/opacity only; ≤8 particle nodes per screen; `will-change` only on the ember dot and held entities; heroes lazy + ≤budget. Contrast check per world (snow's light base especially) before fold.

---

## The one-line pitch to Antonio

Everything gets a single rule — **cool dusk, warm light, plush pixel furniture, one glow** — enforced by three cheap machines (a token sheet, a frame generator, an icon atlas), so the whole game snaps from "retro webpage" to "official cozy game" in two CSS-only phases; then five small hand-made PNGs (den, campfire, five skylines, tea party, key art) drop into pre-built slots and make the hero rooms feel like the reference art you loved — with the game fully playable and pretty at every step, even if no asset ever arrives.
