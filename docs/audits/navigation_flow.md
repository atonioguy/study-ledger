# Side Quest — Navigation Flow Analysis & Proposal

Prototype analyzed: `/home/user/study-ledger/quest-next.html` (892 lines, single-file)
Live-game reference: `/home/user/study-ledger/quest.html`
Design source of truth: `/home/user/study-ledger/PLAN.md`

---

## 1. MAP of the current navigation graph

### 1.1 The machinery

Everything routes through **`show(name)`** (quest-next.html:876), which toggles `.on` across six
sibling `.view` divs and re-renders the target. There is **no history stack** — `show()` only knows
where you're going, never where you came from (the two exceptions, pick and stats, fake it with
their own mode variables `pkMode` / `stDrillId`).

Six screens: **map · build · preview · hub · pick · stats**.
Three modals: **worldEdit · detail · confirm** (all `z-index:40`, all close on backdrop tap).

The **top tabs** (`#tabs`: map / build / preview) live in the always-visible sticky header — but they
only represent **three of the six screens**. On hub, pick, and stats, `show()` un-highlights all
tabs (`T` only has map/build/preview keys), so the header shows three dead-looking tabs that are
still clickable. The header title also reads "✦ side quest — *builder*" on every screen.

### 1.2 Screen-by-screen graph

**MAP (`viewMap`)** — the active world's quest road. *Default screen at boot.*
- In: boot · tab `map` · `switchWorld()` from hub · pick's ← when in "new" mode.
- Out:
  - tap a quest spot → **select** (gang walks, glow moves); tap the *selected* spot **again** → `openQuest()` → **preview**. Two taps for any non-selected quest; nothing on screen says the second tap opens it.
  - `🌍` globe button **or** the entire world banner → **hub** (two affordances, same destination).
  - `＋ add a quest` → `openPick('new')` → **pick**.
  - tabs → build / preview.
- Back: n/a (root-ish), but the map is *not* the actual root of the hierarchy — the hub is above it, reached by a forward-styled button rather than any "up" affordance.

**BUILD (`viewBuild`)** — the builder, always editing the one global `quest` draft.
- In: tab `build` · detail modal's "edit" · pick's "add N to quest" / "start blank instead" · pick's ← when in "add" mode.
- Out: tabs · `↯ import from ticktick` → pick('add') · `save quest` (stays) · `clear` → confirm modal · `give up quest` / `↩ resume quest` → confirm modal (stays).
- Back: **none.** No ← and no "done" — you leave by tabbing away. Leaving does *not* save to the world (only the localStorage draft); "save quest" is a separate explicit act.
- Mode hazards:
  - The build tab edits *whatever is in the draft* — the last quest opened or created, possibly from a **different world**. `saveQuest()` pushes to `activeWorld()`, so a quest opened in world A can be silently filed into world B (quest-next.html:421–427).
  - `openQuest()` **overwrites the draft wholesale** (line 663). Build a new quest, forget to save, tap any map spot → your work is destroyed with no warning.
  - The ▶ toggle on a build step marks it done **without awarding XP and without `syncQuestToWorld()`** — the same action in preview awards XP and persists (lines 475 vs 556). Two screens, same gesture, different consequences.

**PREVIEW (`viewPreview`)** — actually the **play** screen: tapping a step toggles done, awards real XP, bumps streak, syncs to the stored quest.
- In: tab `preview` · `openQuest()` from map.
- Out: tabs · tap step (toggle done) · long-press / right-click a step → **detail modal** → "close" or "edit" → build.
- Back: **none.** Returning to the map means knowing to hit the `map` tab. Getting to the hub from here is map-tab → globe (2 taps). The tab is labeled "preview" but it is the core play loop of the game.

**HUB (`viewHub`)** — the worlds grid.
- In: globe / world banner on map · stats' ← (top level) · re-rendered under the worldEdit modal after save/archive.
- Out:
  - tap a world card → `switchWorld()` → **map** (also resets quest selection).
  - **hold 450 ms or right-click** a card → **worldEdit modal** (invisible affordance — nothing on the card hints at it).
  - `＋ new world` card → worldEdit modal (create mode).
  - `📊 view stats →` row → **stats**.
  - the three unhighlighted tabs still work as an escape.
- Back: **none.** You arrived via a globe *button*, you leave via a world card or a tab. The one screen "above" the map has no up/back affordance at all.

**PICK (`viewPick`)** — TickTick task picker.
- In: map `＋` (`pkMode='new'`) · build `↯ import` (`pkMode='add'`).
- Out: `←` → map (new) or build (add) — mode-aware, correct · "add N to quest ▸" → build · "start blank instead" → build (new mode only).
- Back: **yes** — the only mid-flow screen with a proper ←. But the header tabs remain live: tapping `map` mid-pick silently abandons the selection (no confirm, selection only reset on next `openPick`).

**STATS (`viewStats`)** — trophy shelf, with an internal drill level.
- In: hub's `view stats` row.
- Out/Back: `←` pops drill → list → **hub**. Correct stack behavior — the best-behaved screen in the app. Tabs again remain live as a side exit.

### 1.3 Modals

| Modal | Opened from | Closes to | Notes |
|---|---|---|---|
| **worldEdit** | hub: hold/right-click a card, or `＋ new world` | hub | "archive world" opens **confirm on top of worldEdit** — 2-deep modal stack |
| **detail** | preview: long-press / right-click a step | preview, or "edit" → build | the only path from a step to editing it |
| **confirm** | build (clear, give up), worldEdit (archive) | its opener | shared; fine |

All three close on backdrop tap (consistent), but their affirmative buttons vary: "save" / "close + edit" / "confirm".

### 1.4 Tap-count audit (the numbers behind "clunky")

| Journey | Path | Taps |
|---|---|---|
| Open a non-selected quest from map | tap spot (select) → tap again (open) | **2** |
| Switch worlds, from map | globe → hub renders → tap world card | **2 + full hub round-trip** |
| Switch worlds, from inside a quest | `map` tab → globe → card | **3 + round-trip** |
| Give up a quest, from map | select spot → open → `build` tab → scroll to bottom → give up → confirm | **5 (–6) + scroll** |
| Edit a world | globe → **hold 450 ms** on card → modal | 1 tap + hidden gesture |
| Quest (preview) → hub | `map` tab → globe | **2**, no direct route |
| Edit the quest you're playing | long-press step → detail → "edit" | 2 + hidden gesture (or blind `build` tab) |
| New quest → playable on map | `＋` → pick/select → add → build → **save quest** → `map` tab | 5+ with a mandatory explicit save |

### 1.5 Structural inconsistencies (summary)

- **Two navigation paradigms coexist**: map/build/preview are *tabs* (flat siblings, always visible); hub/pick/stats are *pushed flows* — but only pick and stats acknowledge it with a ←. Hub is a pushed screen pretending to be a root.
- **Back exists on 2 of 6 screens** (pick, stats). Hub, build, and preview have none.
- **Tabs stay visible-but-dead** on hub/pick/stats, and tapping one mid-flow silently abandons the flow.
- **No dead ends**, technically — the always-live tabs guarantee an exit — but that safety net *is* the confusion: the escape hatch is three unlit buttons that belong to a different mental model.
- **Play vs edit is blurry**: "preview" is the play screen; "build" is the editor; both can toggle a step done with different rules; the builder is a floating global draft rather than "editing *this* quest."
- **Destructive/manage actions hide**: give-up at the bottom of build; world edit behind an unhinted long-press.

### 1.6 Live game (quest.html) reference

The live game's nav is dramatically simpler and it *works*: a **persistent bottom nav** (`#nav`:
map / pomo / buddies / shop), one tap between any two top-level screens, `.on` highlighting always
truthful, modals (sync, confirms) only one level deep, no pushed flows at all. The prototype's
clunkiness is largely the cost of adding hierarchy (worlds → map → quest → editor) without adding
the stack/back grammar to carry it — while also abandoning the bottom-nav pattern the live game
already proved.

---

## 2. Top friction points, ranked by hurt

1. **Play vs edit mode confusion (worst).** "Preview" is the real play screen; "build" is a global
   draft editor reachable at all times via a tab. Consequences: the build tab's target is ambiguous
   ("which quest is this?"), opening any map quest silently destroys unsaved builder work, a quest
   can be saved into the wrong world, and marking a step done means different things on two screens.
   This isn't just feel — it produces actual data loss and mis-filing.
2. **No consistent back.** ← exists on pick and stats only; hub, build, and preview rely on the
   map tab as an implicit "back," which is unlabeled, unlit on half the screens, and spatially
   wrong (a *tab* acting as *up*). Every screen transition requires re-deriving "how do I leave?"
3. **Split-brain top nav.** Three of six screens are tabs; three are orphan flows under the same
   header, with dead-looking tabs as an accidental escape hatch that can silently abandon a pick
   in progress. The header also says "builder" everywhere. The hierarchy that PLAN.md decided
   (hub → map → quest) is not expressed anywhere in the chrome.
4. **World switching is a round-trip.** Every switch replays the full hub (2 taps from map,
   3 from inside a quest). For the common "hop between school and MCAT" move, the hub grid is
   ceremony, not value.
5. **Two-tap select-then-open on the map with no affordance.** The gang-walk on first tap is
   charming, but nothing indicates the second tap opens the quest — it reads as "nothing happened."
6. **Buried / hidden actions.** Give-up: 5 taps + a scroll, living in the builder's footer.
   World edit: a 450 ms long-press with zero visual hint. Quest edit from play: long-press a step
   → detail → edit (or blind-tap the build tab).
7. **Modal nesting + explicit save.** worldEdit → confirm stacks two modals; the builder's
   explicit "save quest" (with draft-only persistence otherwise) is a foot-gun that navigation
   makes worse (see #1). Minor next to the above, but part of the same "modes within modes" feel.

---

## 3. Proposed navigation model

### 3.1 Principles

- **One spatial grammar:** a shallow tree — `HUB → MAP → QUEST` — with **stats a sibling of hub**
  and **builder/pick as pushed editors** that always return to their opener.
- **Persistent bottom nav** (the live game's proven pattern) for lateral movement; **one ← rule**
  ("← goes exactly one level up") for vertical movement. Never both meanings on the same control.
- **Playing and editing are different places** entered by different, explicit doors.
- Keep the cozy chrome: the bottom nav reuses quest.html's pixel `#nav`; ← reuses the existing
  `.pkback` bevel button; the world switcher is a pixel dropdown off the existing banner.

### 3.2 The model

```
            ┌───────────── bottom nav (persistent, always lit truthfully) ─────────────┐
            │   🗺️ map        🌍 worlds        📊 stats     (later: 🍅 🥚 🎰 on fold)   │
            └──────────────────────────────────────────────────────────────────────────┘

  WORLDS (hub) ──tap card──► MAP (active world) ──tap spot──► QUEST (play)
      ▲                        │  banner ▾ = quick world        │ ← back to map
      │                        │  switcher (no hub trip)        │ ⚙ edit quest ──► BUILDER
   ✎ on card                   │  ＋ ──► PICK ──► BUILDER            (loaded with THIS quest;
   → world editor              ▲            (new quest)              ← returns to QUEST/MAP;
   (modal, as today)           └─ ← from pick/builder                give-up/resume lives here)
  STATS: bottom nav · drill ← pops drill → list (as today — keep)
```

Screen-level rules:

- **Bottom nav = map · worlds · stats.** Replaces the top map/build/preview tabs entirely. Any
  top-level screen is 1 tap from anywhere. On the eventual fold this merges with the live nav
  (map · worlds · pomo · buddies · shop, stats moving into worlds or staying a hub row — live call).
- **Quest (play) screen** — the current "preview," renamed. Header: `← ` (to map) · quest name ·
  `⚙ edit quest`. Tapping steps plays; long-press → detail stays. This is the *only* place steps
  award XP.
- **Builder** — a pushed editor, only entered via `⚙ edit quest` (existing quest) or the
  new-quest flow (`＋ → pick → builder`). It is always "editing *this* quest of *this* world"
  (quest carries a `worldId`). Header: `←` (= done; autosaves back to the stored quest) · title.
  "save quest" button becomes unnecessary → autosave on edit, matching how play-progress already
  autosyncs. Give up / resume stays here (PLAN-decided) but now it's 3 taps from the map:
  quest → ⚙ → give up → confirm. Kill the builder's silent done-toggle (▶ in build becomes
  visual-state only, or is removed) so "completing" only exists in play.
- **Quick world switcher** — tap the map's world banner (`🌍 emoji name ▾`) → a small pixel
  dropdown/sheet: each world as a compact row (emoji · name · progress bar), `＋ new world`, and
  `all worlds →` (full hub). Switching = 2 taps with **no hub round-trip**; the hub remains the
  pretty overview/manage screen reached via bottom nav. (PLAN.md line 138 already sketches the
  `🌍 <world> ▾` strip — this completes it.)
- **Map spot = one tap opens** *if already selected or nearby*; for a far spot keep the
  select-first charm but surface an explicit **`▶ enter` chip** on the selected spot so the second
  tap is legible. (Alternative: single-tap always opens and the gang walk plays as the open
  transition — fewer taps, still cozy.)
- **World editor** stays a modal (it's small), but gets a **visible ✎** on hub cards and in the
  switcher rows; long-press remains as a shortcut. Replace the archive's stacked confirm with an
  inline two-tap confirm ("archive world" → "really archive?") so modals never nest.
- **Pick** keeps its ← (already correct). With the top tabs gone, its only exits are ←, add,
  and skip — no more silent abandonment.
- **Stats** keeps its drill/← stack (already correct); entered from bottom nav instead of a hub row.

### 3.3 Tap counts, before → after

| Journey | Before | After |
|---|---|---|
| Switch worlds (from map) | 2 + hub round-trip | 2, in place (banner ▾ → world) |
| Switch worlds (from a quest) | 3 + round-trip | 3 in place (← , banner, world) or 2 via nav |
| Give up a quest (from map) | 5–6 + scroll | 4 (open quest → ⚙ → give up → confirm) |
| Quest → hub | 2 (unlabeled) | 1 (bottom nav `worlds`) |
| Edit the quest you're playing | 2 + hidden gesture | 1 (`⚙`) |
| Edit a world | 1 + hidden 450 ms hold | 2 visible taps (hub/switcher → ✎) |
| Leave any screen | re-derive per screen | ← = up, nav = lateral, always |

---

## 4. Per-change recommendation: PROTOTYPE now vs LIVE-game decision

Guiding rule (from PLAN.md's "integration fidelity" note): the prototype exists to prove
*interactions and data model*; the live game keeps its polished visuals. Navigation structure is
interaction — most of this belongs in the prototype. Exact styling/animation polish is live.

| # | Change | Where | Why |
|---|---|---|---|
| 1 | **Persistent bottom nav (map · worlds · stats), kill top tabs** | **PROTOTYPE — do now** | The single biggest feel-fix, ~30 lines by borrowing quest.html's `#nav` CSS. It also *converges* the prototype with the live game's pattern, de-risking the fold. Final icon set/slots on fold = live decision, but the pattern must be validated now. |
| 2 | **Universal ← = one-level-up on quest, builder, pick, stats, (hub n/a once it's a nav root)** | **PROTOTYPE — do now** | `.pkback` already exists; this is wiring, not design. Back-behavior *feel* (does ← from builder autosave?) is exactly what a prototype should answer. |
| 3 | **Split play from edit: rename preview → quest, enter builder only via ⚙ edit quest, builder bound to a specific quest+world, autosave, no done-toggle in build** | **PROTOTYPE — do now** | This is a data-model + interaction question (and it fixes real bugs: draft clobbering, cross-world saves, XP-less done-toggles). PLAN already decided ⚙-edit-quest; the prototype currently contradicts its own plan. Highest-value validation available. |
| 4 | **Quick world switcher off the map banner (▾ dropdown), hub demoted to overview/manage** | **PROTOTYPE — do now** | Cheap (one popover), and "does switching feel instant?" is a pure feel question only the prototype can answer. Visual treatment of the dropdown on fold = live. |
| 5 | **Map spot: visible `▶ enter` chip on selected spot (or single-tap-opens)** | **PROTOTYPE — do now (try both variants)** | Tiny change, big legibility win; A/B-able in a day. Which variant ships = decide after feeling it. |
| 6 | **Visible ✎ edit affordance on world cards / switcher rows (long-press stays as shortcut)** | **PROTOTYPE — cheap, do with #4** | One small button. The *final* context-menu pattern (hold → rename/recolor/archive) is PLAN-decided and matches the live game's step menus, so its polish is a live concern. |
| 7 | **De-nest modals: inline two-tap confirm for archive (and give-up)** | **LIVE-game decision** | Low feel-impact in the prototype; the live game has its own confirm styling (`sq-modal`) and the pattern should be decided once, there. Not worth prototype time. |
| 8 | **Header truthfulness (title/sub reflects current screen instead of permanent "builder")** | **PROTOTYPE — trivial, fold into #1** | One line per screen; removes ambient confusion while testing everything else. |
| 9 | **Bottom-nav final composition after fold (where stats/pomo/buddies/shop sit, whether hub is a nav tab or lives behind the map banner only)** | **LIVE-game decision** | Depends on the live game's existing 4 tabs and real estate; decide at fold time with the proven prototype pattern in hand. |

### Suggested prototype order
1 → 3 → 2 → 4 → 5/6/8 (a weekend's worth in a single-file prototype; #3 is the only one touching
the data model, and it removes bugs rather than adding risk).
