# Side Quest — Quest-Management Interaction Spec: "TENDING THE GARDEN"

*Dedicated interaction pass per the owner's mandate ("moving quests between worlds + reordering within a world, plus delete / give-up / resume / archive — all smooth, intentional, satisfying, cozy — NOT clunky; needs a proper flow design + undo/safety model"). Builds on: **navigation_flow.md §3** (which OWNS the nav model — this spec plugs into its ⚙ edit-quest entry and its "quick world switcher", it does not re-litigate them), **migration_audit_prototype.md** (§2.1 data model: a move is a `questIds` splice; §3.5 give-up state machine; §2.5 archive snapshot), **gamefeel #17** (ember at the faded flag — settled), **live_game_weave line 190** (the quest ⚙ menu offers give-up/resume + move-to-world), **redesign_streak R9-style copy restraint**, and the owner's locked lens: cohesion · flow-state · zero-friction · cozy · never shaming. The give-up design is loved and STAYS — it gets garnish, not surgery.*

**Grounded in code (`quest-next.html`):**
- Give-up/resume: `#giveupBtn` at the builder's footer (lines 266, 457, 870–873) — 5–6 taps + a scroll from the map, living in an editor it has nothing to do with.
- Archive: `archiveWorld()` (847–857) behind a **450ms hold** on a hub card (768–773) → `worldEdit` modal → confirm modal **stacked on the modal** (860); heavy data discarded instantly (850), no undo.
- Delete a quest: **does not exist.** Move a quest: **does not exist** (PLAN designed it; audit §2.1 confirms it's one id reassignment). Reorder quests: **does not exist** (order = `questIds` array order → road position, 629).
- Reusable machinery already proven: pointer drag with placeholder (`beginDrag/dragMove/dragEnd`, 483–523), `askConfirm` (574–579), `.mgang`/`.mglow` left/top transitions (.55s ease, 141/145), `applyWorldTheme` (319), `syncQuestToWorld` (429), `w.archived` already respected by `renderHub`'s filter (756) and `renderStats`' star sum (809), orphan `sfx('give')`/`sfx('save')`/`sfx('add')` (612–614) waiting to be wired.

**The one-sentence thesis:** management is *tending*, not filing — every action is something a gardener does to a hillside (re-plant, rearrange, let go, rest, shelve), every risky action is **calmly reversible for ~6 seconds instead of interrogated up front**, and nothing ever nags, stacks modals, or shames.

---

## 0. TWO SHARED FOUNDATIONS (build once, every action stands on them)

### 0.A — The Quest Care Menu (⚙) — one home for every per-quest action
navigation_flow.md §3.2 already gives the quest (play) screen a header: `← · quest name · ⚙`. This spec defines what ⚙ opens: **a small bottom sheet** (same `.mcard` bevel language, slides up 180ms, backdrop tap closes — NOT a full modal card in the center; a sheet reads as "options about the thing behind it"):

```
  ⚙  tend this quest
  ─────────────────────────────
  ✎  edit steps & chapters      → builder (bound to THIS quest)
  🏔  move to another world…    → world picker sheet (§3)
  🏳️  give up quest             → inline-arm (§4)   [or "↩ resume quest"]
  🍂  let this quest go          → inline-arm + undo (§2)
```

Rules: max 4 rows, icons + lowercase labels, danger rows tinted rose only *after* arming (see 0.C), one `sfx('sel')` per open. Long-press a map hill = shortcut to the same sheet (consistent with the app's existing 450ms-hold grammar, but never the only path — everything hidden behind hold must also be reachable via visible ⚙).

**Why this is the keystone:** today every management verb lives in a different place at a different depth (builder footer, hidden hold, nowhere). One predictable "care" door means Antonio never re-derives "where do I manage this?" — the single biggest clunk named in the mandate. Effort: one sheet component + 4 wired rows.

### 0.B — The Undo Ember (shared undo-toast system) — the app's safety model
One component: `undoToast(msg, {undo, commit})`.
- A pixel banner slides up from the bottom (above the future bottom nav), `.mcard` bevel, world-accent border: `🍂 quest let go — ` **`undo`** .
- A thin **ember-burn bar** along its bottom edge burns down over **6s** (gold → dim; literally the fire-going-out metaphor, not a stopwatch). No countdown numbers — numbers are pressure.
- Tap `undo` → the action reverses with its own settle animation + `sfx('save')` (the warm rising arpeggio, currently orphaned). Toast pops away.
- On expiry, navigation to another world, app blur/`pagehide`, or a *second* undoable action → `commit()` fires (the destructive part actually happens **only now**). Never two toasts stacked; the newest evicts (and commits) the oldest.
- Reduced-motion: static banner, bar steps in 3 discrete ticks.

**Philosophy (the safety model in one line):** *confirm-up-front for things you're about to lose forever and can't get back (none of these, once soft-delete exists); inline-arm (two taps on the same control) for intentionality; undo-toast for reversibility.* Modals stop being the safety mechanism — reversibility is. This kills both failure modes at once: one-tap accidents (arming) and confirm-fatigue nagging (no modal, undo instead).

### 0.C — Inline two-tap arming (replaces stacked confirms)
Any danger row/button: first tap **arms** it in place — label swaps to a short question, tint goes rose, a 3s un-arm timer starts (`give up quest` → `really give up? — keep coins/⭐, lose +3`). Second tap executes. Tap anywhere else = disarm, no penalty. This is navigation_flow.md's item #7, adopted here as the standard for give-up, delete, and archive — **modals never nest again** (the current archive flow stacks confirm on worldEdit; that dies).

---

## RANKED ACTIONS (by friction-removed ÷ effort)

---

## 1 — GIVE UP / RESUME: move it home, garnish the flag ⭐ CHEAPEST BIG WIN
*(already built & loved — this pass relocates + dresses it, changes zero mechanics)*

### Interaction design
- **Lives in:** the ⚙ Care Menu (§0.A) — `🏳️ give up quest`, flipping to `↩ resume quest` when `state==='gaveup'` (exact logic of line 457 relocated). It **leaves the builder footer entirely** — giving up is a *feeling about the quest*, not an edit to its structure; parking it under "edit steps" was the category error making it clunky.
- **Flow (give up):** quest screen → ⚙ → `give up quest` → row arms in place (`really give up? — you keep every coin + ⭐`) → tap again → sheet closes → **the give-up beat** plays.
- **The beat (~1.2s, on the quest screen then echoed on the map):** the quest banner's progress bar cross-fades to the grey `greybar` stripes; a small 🏳️ chip fades into the banner; `sfx('give')` (the orphaned 300→180Hz sawtooth descend — melancholy, not punishing) at low gain; note text: *"resting at camp — resumable anytime."* Back on the map, the flag swap is **animated, not instant**: the prog flag slides down the pole (translateY +6, 300ms), cross-fades to the grey tattered sprite, and gamefeel #17's **tiny 2-frame ember** lights at its base — *camp, not grave.*
- **Flow (resume):** ⚙ → `↩ resume quest` — **one tap, no arm, no confirm** (already the rule; resuming must be the easiest thing in the app — never make coming back harder than leaving). The beat inverts: on the map the flag **re-hoists** (translateY −8 → settle bounce, 350ms), ember winks out, `sfx('save')` warm arpeggio, gang does a wee hop. Toast-less; the re-hoist IS the feedback. Note: *"↩ back on the road."*

### Friction: **5–6 taps + scroll + wrong room → 4 taps, zero scroll**
map → open quest (1–2) → ⚙ (3) → give up (4a) → arm-confirm (4b). Resume: 3 taps. Dead-end removed: today you must know give-up lives at the bottom of an editor tab that isn't even lit on the map.

### Safety/undo
State flip is inherently reversible (the feature's genius) — the arm step is the only guard needed. **No undo toast** (resume IS the undo, permanently available). Keeps `syncQuestToWorld()` on both edges exactly as today (871–872).

### Cozy tone
Copy bans "quit/abandon/fail." Vocabulary: *rest, camp, later.* The confirm-arm keeps the loved framing: `really give up? — keep every coin + ⭐, forfeit the +3`. The ember reframe is the whole emotional design: a grey flag reads as failure; a grey flag **with a campfire** reads as "we'll be back."

### Risk · perf · when
- Risk: **low** — relocation + garnish on a settled mechanic. Only tone risk: the ember must be subtle (1px flicker) or the map gets busy.
- Perf: ember rides the shared blink interval (gamefeel #7 / streak R1 discipline — zero new timers); flag animations are one-shot WAAPI.
- **PROTOTYPE-NOW:** ⚙ sheet + relocation + arm + flag slide/re-hoist + wiring the two orphan sfx. **AT-FOLD:** ember sprite polish, mascot no-guilt line on tapping a camped hill.

---

## 2 — DELETE A QUEST: "let it go" — soft-delete + undo ember ⭐ CLOSES THE ONLY TRUE DEAD-END
*(does not exist today — the road's only exit is archiving the entire world)*

### Interaction design
- **Lives in:** ⚙ Care Menu, last row, quietly styled: `🍂 let this quest go`. Deliberately *below* give-up — the UI's order teaches the gentler option first (most "I want this gone" impulses are actually give-up: keep the earnings, keep the record).
- **Flow:** ⚙ → `let this quest go` → arms in place (`really let it go? — it leaves the road`) → tap → sheet closes → **the letting-go beat** → undo ember toast.
- **The beat (~900ms, on the map — always cut to the map so the consequence is *seen where it lives*):** the quest's hill+flag+label **sink and fade** together (translateY +10, opacity→0, 450ms ease-in — settling into the earth, not exploding/shrinking away); 3–4 leaf-mote particles drift off it (reuse the mote/particle idiom); the road **heals**: remaining plots glide up the path into place (see §5's transition plumbing — same code), path dots re-lay. Soft low `tone` (single 220Hz triangle, breath-length). Toast: `🍂 quest let go — undo`.
- **Undo:** the hill **grows back** (reverse: rise + fade-in with a tiny settle bounce), neighbors glide back down, `sfx('save')`. Feels like the garden forgave you — which it did.

### Friction: **impossible today (∞) → 3 taps, self-insuring**
No confirm modal at all: arm (2 taps total in the sheet) + 6s undo replaces interrogation. Compare the classic pattern (menu → modal → "type DELETE" energy): we spend the safety budget *after* the action, where it costs nothing when you meant it.

### Safety/undo model (the reference implementation for the app)
- **Soft-delete:** on execute — `w.questIds.splice(i,1)`; push `{qid, worldId, index, at}` onto `WORLD.trash`; `persistWorld()`. **`WORLD.quests[qid]` is NOT touched yet.**
- **Undo:** splice the id back at its original `index` (order restored exactly), drop the trash entry.
- **Commit** (toast expiry / eviction / pagehide): `delete WORLD.quests[qid]`, drop trash entry. Boot sweep: any trash entries left behind by a crash are committed on next load (they were already off the road; silent).
- **Ledger rule:** earned XP/coins/streak are **never clawed back** (`AQ.xp` is a lifetime pool; nothing subtracts — consistent with give-up's "keep what you earned" and the anti-dread mandate). Deleting a quest deletes *the plan*, never *the credit for work done*.
- **What deletion is for** (and copy should gently imply): duplicates, test quests, plans that never started. A quest with real progress that Antonio is "done with" is better *given up* (keeps record) — but we don't block delete on progress; we just order the menu to suggest it.

### Cozy tone
"Delete" never appears in UI copy. *Let it go / it leaves the road / undo.* Autumn-leaf 🍂 iconography (season's-end, natural) instead of 🗑 trash. Never "are you sure? this cannot be undone!" — because it *can* be, for exactly one warm ember's length.

### Risk · perf · when
- Risk: **low-med.** Two edges: (1) `aq_sel` may point at the deleted id — `defaultSel` already self-heals (618), just clear it on commit; (2) the builder draft may hold the deleted quest — on commit, if `aq_builder_draft.id === qid`, leave the draft alone (it's a copy; saving it re-creates the quest — actually acceptable resurrect behavior, but under nav-model #3's quest-bound builder simply close/blank the editor if open on it).
- Perf: one-shot WAAPI; road-heal shares §5's transition (cap ~20 quests keeps node count trivial).
- **PROTOTYPE-NOW** in full — it's the smallest complete demo of the undo-ember system, and the toast component gets reused by #3 and #4.

---

## 3 — MOVE A QUEST BETWEEN WORLDS: "pack up & re-plant" ⭐ THE SIGNATURE FEEL MOMENT
*(designed in PLAN, absent in prototype; data model is a two-line splice — 95% of the work here is making it FEEL like travel)*

### Interaction design
- **Lives in:** ⚙ Care Menu → `🏔 move to another world…` (exactly where navigation_flow.md + weave line 190 put it — this spec builds ON that entry, adding the picker + transition).
- **Flow:** ⚙ → `move to…` → the sheet content slides left to a **world picker** (same sheet, second pane — no new modal): one compact row per non-archived world — `emoji · name · N quests · [palette swatch chip]` — current world shown greyed with a small `● here` tag (visible but disabled — no invisible options); `＋ new world` row at the bottom (opens the existing worldEdit modal, returns here with the newborn world selectable — covers "I want to split this out" in one gesture). Tap a destination → **the move beat.**
- **The move beat (~1.6s, the one place a longer transition is EARNED because it depicts actual travel):**
  1. Sheet closes; cut to the map. The quest's plot **packs up**: label and bar tuck into the hill, hill+flag lift off the road (translateY −14, slight scale 1.05, drop-shadow grows — the existing `.dragging` lift language) — 300ms.
  2. The gang **runs to it** (reuse the .55s gang-walk transition) and huddles under the lifted hill — your friends are carrying it. 400ms overlap.
  3. **Twilight blink re-theme:** a full-screen dusk overlay fades in (220ms, `rgba(base,0.85)` of the *target* palette with 2–3 star pips) — behind it, `applyWorldTheme(targetWorld)` + `switchWorld(targetId)` swap instantly (CSS vars can't transition; the blink makes the palette change read as *sky changing during travel*, and hides the full re-render for free). Fade out 220ms.
  4. On the target world's road, the hill **settles into the appended plot** (translateY 0 with a 2-frame squash-and-settle, dust puff), the flag **re-plants** (the small re-hoist from §1), the label fades back in already wearing the target accent, the gang bobs beside it. `sfx('add')` (orphaned 440→660 triangle — arrival chime).
  5. Undo ember toast: `🏔 moved to 🌱 mint garden — undo`.
- **Where you land:** ON the target world's map, quest selected (`aq_sel = qid`). Moving *is* traveling with it — landing back in the old world with the quest gone would feel like mailing a friend away.

### Friction: **impossible today (workaround: manually rebuild the quest, ~30+ taps) → 3 taps**
⚙ (1) → move to… (2) → destination (3). No confirm — moving is non-destructive (nothing is lost, only relocated), so it gets **undo only**, no arm. Consistent affordance: the same sheet grammar as every other care action.

### Safety/undo
- **Execute:** `srcW.questIds.splice(i,1); dstW.questIds.push(qid);` update the quest's `worldId` binding (nav-model #3's field) `; persistWorld()`. Append-to-end is the settled rule (mandate: "appends to another's") — predictable > clever.
- **Undo:** reverse splice back to the original index in the source world + twilight-blink back to the source map. Full round trip, order preserved.
- Edge: destination at the (planned) 20-quest cap → the row renders dimmed with `world's full` in place of the count — disabled *with a reason*, never a post-tap error.
- The builder-draft cross-world save bug (nav §1.2 hazard) is *fixed by this feature done right*: once quests carry `worldId` and the builder is quest-bound, `saveQuest()` files by the quest's own world, never `activeWorld()`.

### Cozy tone
Copy: *move to… / moved to [world] / undo.* The gang carrying the hill is the emotional core — quests don't get "reassigned between categories," the family **moves camp together**. The re-theme is diegetic (the sky changes because you traveled), which makes the palette system itself feel more alive.

### Risk · perf · when
- Risk: **medium** — the beat choreographs across a world switch + full `renderMap()`. Mitigation: the dusk overlay covers the re-render seam (steps 3–4 don't need continuity tricks; only the *lift* pre-blink and *settle* post-blink are animated). Fallback if sequencing fights back: lift → blink → settle, cutting the gang-huddle (still 90% of the feel).
- Perf: overlay = one node, opacity only (perf-safe); no animated box-shadows; total ≤1.6s and interruptible (any tap skips to the settled end state).
- **PROTOTYPE-NOW:** picker pane + splice + blink + settle + undo (the interaction & data proof). **AT-FOLD:** gang-huddle carry, dust puff art, star pips in the blink, real arrival sfx.

---

## 4 — ARCHIVE A WORLD: "onto the shelf" — de-nest, reveal, insure
*(built & mostly right — this pass fixes the three flaws: hidden entry, stacked modals, instant heavy-data discard)*

### Interaction design
- **Entry becomes visible:** hub cards get a small `✎` bevel chip (top-right, next to where the `✦ done` badge sits) → opens `worldEdit` — the existing 450ms hold / right-click **stays as the shortcut** (nav-model #6; hidden gestures may accelerate, never gatekeep).
- **In worldEdit:** `archive world` stops opening a stacked confirm (line 860 dies). It **inline-arms** (§0.C): first tap → button becomes `really archive? — quests settle into stats`; second tap executes. Modal depth never exceeds one, app-wide.
- **The shelving beat (~1.1s):** worldEdit closes to the hub; the world's card **lifts slightly, then glides + shrinks down-screen toward the `📊 view stats` row** (WAAPI transform, 500ms ease-in), landing as a brief gold glint on that row — the card visibly *becomes* a trophy on the shelf. Remaining cards glide into the gap (grid reflow with FLIP transforms). `sfx('save')` arpeggio — archiving a world is an *achievement*, and the sound should say ceremony, not deletion. Toast: `🏔 [world] settled on the shelf — undo`.
- If the archived world was active, the hub simply stays put (you're already at the right altitude to pick a new home) — current behavior of falling back to `worlds[0]` remains as the data-level default.

### Friction: **1 tap + hidden 450ms hold + 2 stacked modals → 4 visible taps, one modal, one arm**
hub → ✎ (1–2) → archive (3) → arm (4). Slightly *more* taps than the hidden path — correct trade: archiving is rare, monumental, and was previously both undiscoverable *and* under-protected.

### Safety/undo (the important fix — archive is currently the app's most destructive one-way door)
- **Execute (soft):** write `archiveSnapshot(w)` to `aq_archive` (as today, 849) **and set `w.archived = true`** — which `renderHub` (756) and the stats star-sum (809) *already filter on*, so the world vanishes from the hub with **zero heavy-data loss yet**. Do NOT run lines 850–851 (quest discard + world removal) yet.
- **Undo:** clear `w.archived`, `shift()` the snapshot back off `aq_archive`. Card glides back up into the grid. Nothing was ever at risk.
- **Commit (toast expiry):** *now* discard — `delete WORLD.quests[id]` for each, remove the world object (exactly today's 850–851). Boot sweep commits any `archived:true` stragglers.
- Snapshot semantics unchanged (compact stats survive forever in View Stats — the trophy shelf is the point).
- Optional at-fold upgrade: stretch the safety window by keeping `archived:true` worlds' heavy data until the **next session's** boot sweep instead of 6s — costs nothing (localStorage headroom is fine at ≤20 quests/world), converts "oh no, wrong world" from a 6-second reflex test into an overnight grace. Recommended.

### Cozy tone
Copy: *settle onto the shelf / archived [date] / undo.* Keep the existing modal copy's spirit ("moves to view stats with its progress kept"). Never "delete world," never a red button — archive styling is **gold**, not danger: it's retirement with honors. The card-to-shelf glide makes View Stats feel like a real place things go, priming the trophy-shelf/postcard future (gamefeel #16).

### Risk · perf · when
- Risk: **low** — the `w.archived` flag path already exists in the render layer; the change is *sequencing* the discard, not new state. One edge: archiving with a pending quest-delete toast → eviction rule (§0.B) commits the delete first; ordering is automatic.
- Perf: card glide = single transform; grid FLIP over ≤8 cards.
- **PROTOTYPE-NOW:** ✎ chip, de-nest arm, soft-archive + undo toast. **AT-FOLD:** glide-to-shelf choreography, next-session grace window, glint on the stats row.

---

## 5 — REORDER QUESTS WITHIN A WORLD: "tend the road"
*(does not exist; rarest of the five actions — worth doing well but LAST, and in two stages so the cheap stage ships now)*

### Interaction design — Stage A (prototype-now): lift-and-slide on the map itself
- **Initiate:** **press-and-hold a hill ~450ms** (the app's established hold grammar) *without moving* opens the ⚙ sheet (§0.A shortcut)… **unless the pointer then moves >8px while held — which seamlessly becomes a drag.** One gesture, two intents, disambiguated by motion (exactly how the builder's grip already coexists with taps). On drag-start: haptic tick, `sfx('sel')`, the hill+flag+label **lift** (scale 1.06, shadow, slight tilt — the `.dragging` language) and the map enters **tend mode**: other labels dim to 60%, path dots brighten.
- **During:** the lifted plot follows the pointer vertically (the road is a vertical snake — **1-D reorder**, like the step-drag, so the mental model is already learned). Other plots **glide** out of the way along the road (each `.mbox/.mhill/.mflag/.mlbl` gets `transition: left .3s, top .3s` while tend mode is on — the exact idiom `.mgang/.mglow` already use). Auto-scroll near viewport edges (the map is tall) — same loop the builder drag needs anyway.
- **Drop:** hill **settles** (squash-and-settle + dust puff, shared with §3's re-plant), path dots re-lay, labels un-dim, gang trots to the settled hill. `sfx('add')`. Model: `w.questIds.splice(from,1); w.questIds.splice(to,0,qid); persistWorld();`.
- **Escape hatches:** drop where you picked up = no-op, no sound, no toast. No undo toast at all — reorder is trivially self-reversing by the same gesture, and toasting it would train Antonio to ignore the ember (save it for real stakes).

### Interaction design — Stage B (at-fold, optional): "arrange" list in the world editor
worldEdit gains an `⇅ arrange quests` row → a compact list (emoji-flag-state chip · name · grip ⠿) reusing the builder's `beginDrag` **verbatim** (it's the same 1-D list problem). Exists for long roads (drag across 15 quests of map is a hike) and as the reduced-motion/accessibility path. Cheap because it's 90% existing code — but it's paperwork-shaped, which is why it's the fallback, not the lead.

### Friction: **impossible today (∞) → 1 gesture (hold-drag-drop)**
No mode toggle to find, no edit screen round-trip, no save button — the road is directly manipulable, which is the strongest "this is a place, not a spreadsheet" signal in the whole spec.

### Safety/undo
None needed beyond the no-op drop — non-destructive, self-inverse, instantly visible result. (The splice is atomic; a crash mid-drag loses nothing since the model only mutates on drop.)

### Cozy tone
Tend mode's dimming + brightened path dots frame it as *quiet gardening light*, not an "EDIT MODE" banner. The dust-puff settle and the gang trotting over to inspect your handiwork are the reward. No copy at all — the best-feeling action in the app should need zero words.

### Risk · perf · when
- Risk: **medium.** (a) Hold-then-drag vs hold-then-sheet disambiguation needs tuning (move-threshold 8px, and the sheet only opens on *release* without movement — test on touch); (b) alternating left/right road positions mean a dragged plot visually crosses x=132↔300 as its index parity changes — gliding transitions make this legible, but it's the bit to feel-test first; (c) collides with map scroll — vertical drag must claim the gesture only after the hold (touch-action:none on hold, as the grips already do).
- Perf: transitions on ≤20×4 absolutely-positioned nodes, transform-free left/top like the gang already uses — fine; tend-mode dimming = one class toggle. No rAF loops.
- **PROTOTYPE-NOW:** Stage A core (this is a pure feel question only the prototype can answer — same argument as nav #4/#5). **AT-FOLD:** Stage B list, auto-scroll polish, reduced-motion path (Stage B *is* it).

---

## RANKING SUMMARY (friction-removed ÷ effort)

| # | Action | Gesture | Undo model | Taps before → after | Effort | When |
|---|---|---|---|---|---|---|
| 1 | Give up / resume | ⚙ sheet row + inline arm; resume = 1 tap | State flip IS the undo (permanent) | 5–6+scroll → 4 / 3 | **XS** (relocate + garnish) | NOW |
| 2 | Delete quest | ⚙ `let this quest go` + arm | Soft-delete → 6s undo ember → commit | ∞ → 3 | **S** (toast system incl.) | NOW |
| 3 | Move between worlds | ⚙ → world-picker pane | Undo ember (reverse splice + blink back) | ∞ → 3 | **M** (the travel beat) | NOW core / fold polish |
| 4 | Archive world | visible ✎ → arm in worldEdit | Soft-archive (`w.archived`) → undo → deferred discard | 3 hidden+nested → 4 visible | **S** | NOW core / fold glide |
| 5 | Reorder in world | hold-drag a hill; road glides | None needed (self-inverse) | ∞ → 1 gesture | **M-L** (feel tuning) | NOW stage A / fold stage B |

Shared prerequisites: **0.A Care Menu** (before 1–3), **0.B Undo Ember** (before 2–4), **0.C arming** (before 1, 2, 4). Suggested build order: 0.A+1 → 0.B/0.C+2 → 4 → 3 → 5.

---

## RESTRAINT LIST (deliberately NOT doing)

1. **No trash-can screen / "recently deleted" UI.** The undo ember (+ archive's overnight grace) is the entire recovery surface. A visitable graveyard invites hoarding and dread; a garden composts.
2. **No bulk-select / multi-manage mode.** ≤20 quests per world; per-quest care keeps every action intentional. Checkbox armies are filing-cabinet energy.
3. **No swipe-to-delete.** Hidden, conflicts with map scroll, and one-swipe destruction is exactly the "one-tap mistake" class the mandate bans — even with undo, it makes letting-go *casual*, which it shouldn't be.
4. **No drag-a-quest-onto-a-hub-card to move worlds.** Cute demo, miserable precision on mobile (drag across screens?), and it would bypass the travel beat that makes moving feel like something.
5. **No confirm on resume, no confirm on reorder, no toast on reorder.** Guard rails only where stakes are; safety theater trains people to ignore real safety.
6. **No "type the name to delete" / red warning walls / ALL-CAPS LOSS language.** Never shaming, never scary — arming + undo covers it. The words *delete, permanently, lost forever, are you sure* don't appear in UI copy.
7. **No auto-sort options** (by due date / progress / name). The road's order is Antonio's hand-placed order; the Clock mandate already bans the app reordering his world for him. One manual order, sacred.
8. **No XP/coin clawback on any management action** — lifetime pool stays monotonic (anti-dread firewall, consistent with give-up).
9. **No un-archive of committed archives.** The shelf is a trophy case, not cold storage — reopening finished worlds re-litigates the past. (The undo window + overnight grace covers mistakes; after that, it's history with honors.)
10. **No new ambient animation on management surfaces** beyond the give-up ember (which rides the shared blink timer). Management moments are one-shot ceremonies; the animation budget (perf #9) stays with the living map.
11. **No second confirm inside the Care Menu for opening the builder** or any non-destructive row — the sheet itself is the intentionality gate.

---

## COPY TABLE (single source, lowercase, VT323 voice)

| Moment | Copy |
|---|---|
| Care menu title | `⚙ tend this quest` |
| Give-up arm | `really give up? — keep every coin + ⭐, forfeit the +3` |
| Given-up note | `🏳️ resting at camp — resumable anytime` |
| Resume flash | `↩ back on the road` |
| Delete row / arm | `🍂 let this quest go` / `really let it go? — it leaves the road` |
| Delete toast | `🍂 quest let go — undo` |
| Move row / toast | `🏔 move to another world…` / `🏔 moved to [emoji] [world] — undo` |
| Full destination | `[world] — world's full` (dimmed row) |
| Archive arm | `really archive? — quests settle into stats` |
| Archive toast | `🏔 [world] settled on the shelf — undo` |
