# 🗺️ Side Quest — TickTick → Quest Integration (planning board)

> Status: **planning only, not built yet.** This is our shared whiteboard for turning
> selected TickTick tasks into a playable quest on the Side Quest map.

## 🧩 The whole idea, one line
**Pick tasks in TickTick → they pour into a quest on your map → you play it like the campaign you already have.**

The game already defines what a "quest" is (today it's hardcoded as `CAMP_MODS` in `quest.html`).
Importing just means pouring a list of tasks into that existing shape — we're reusing the format, not inventing one.

## The quest shape
```
QUEST  ⟵ you name it ("Bio Exam Sprint")
 ├─ Chapter: "Watch lectures"      ⟵ buckets you create + name (≈ current "modules")
 │    ├─ ▢ step   ⟵ each step is checkable, worth XP (≈ current "lesson-parts")
 │    └─ ▢ step
 └─ Chapter: "Practice + review"
      ├─ ▢ step
      └─ ▢ step
```

## The assembly screen (the heart of this feature)
```
   YOUR TICKTICK PILE             THE QUEST YOU'RE BUILDING
   (drag from here)               (drop OR type into any slot)
   ┌─────────────────┐           ┌──────────────────────────────┐
   │ ▸ Study Bio ch5 │           │ QUEST: [ Bio Exam Sprint ___]│ ← type it, or drop a card
   │    · read notes │           ├──────────────────────────────┤
   │    · flashcards │           │ CHAPTER [ Watch lectures ___]│ ← type, or drop a card
   │ ▸ Practice set  │           │    ▢ [ lecture 1 __________ ]│ ← step: type or drop
   │ ▸ Email prof    │           │    ▢ [ lecture 2 __________ ]│
   │ ...             │           ├──────────────────────────────┤
   └─────────────────┘           │ CHAPTER [ ______________ +  ]│ ← add your own empty chapter
                                  └──────────────────────────────┘
```

### Card anatomy
```
┌──────────────────────────────┐
│ ▢  lecture 2          ✎   ⠿  │
└──────────────────────────────┘
                        │    └ drag handle → reorder, move between chapters,
                        │                     or pull it back to the pile
                        └ pencil → flip the card into an edit field
```

## ✅ Decisions locked
1. **Atom = "I sort them into chapters."** You assemble the quest by hand — no rule guesses the structure.
2. **A card is a shapeshifter.** From the pile, main tasks *and* subtasks are draggable, and a card can become the **quest title**, a **chapter**, or a **step** depending on the slot it lands in.
3. **Every slot is a text field AND a drop target.** Quest name, chapter names, steps — always typeable from scratch; nothing requires TickTick.
4. **Drop a main task onto a chapter slot → its subtasks auto-fill as steps** (then trim/edit/add freely). Drop a subtask (or a task with no subtasks) as a chapter → empty steps you type yourself.
5. **Dropped cards are fully editable** — a dropped task just copies its text in as a plain, editable card.
6. **Rearrange / edit / remove freely** — drag handle to reorder & move; ✎ pencil to edit; pull a card back to **the pile** to un-place it (nothing is truly deleted mid-build).
7. **Add your own by hand** — type new chapters, steps, and notes that were never in TickTick.
8. **Priority → dropped; due date → editable tag.** Priority isn't used, so it's ignored (no dot, no logic). A dated task carries its due date over as a small **editable, clearable** tag on the step; you can also add a date to a hand-typed step if you want. Purely cosmetic "when" — no XP/ordering effect.
9. **The builder board is a full editor, not just an importer.** In both create *and* edit modes you can type brand-new steps, rename/rewrite anything, add banners, and jot notes — nothing has to come from TickTick. TickTick is one *source* you can pull from; the board is always yours to write on freely.
10. **XP per step = difficulty presets.** Each step is tagged 🟢 easy **5** / 🟡 medium **10** / 🔴 hard **20** XP, **default medium**. Set it on the card in the builder; change it later via the step's edit menu. A **custom number** option sits behind the presets for outliers. Calibrated to the campaign (part ≈ 5–16 XP, rank ≈ 50) to keep the "start stingy" pace.
11. **Rewards mirror the existing economy — coins per step, stars per chapter.**
    - **Coins per step = the step's XP** (🟢5 / 🟡10 / 🔴20). Coins already equal XP in the game (`coinsEarned() = xp`), so a completed step fills the level bar *and* drops the same in spendable coins. Coins = the frequent/grindy currency (shop outfits 50–140, slot spins 8).
    - **Stars: 1 per chapter finished, + 3 bonus for completing the whole quest.** Matches the campaign (lesson = 1 star, module = 3) and keeps stars the *milestone* currency for gacha pulls (3 stars each ≈ ~3 chapters per pull).

## 🎨 Layout & visual design (decided)
The imported quest reuses the exam-quest look on the map — **not** the rigid `P1 / 14:32` diamond tiles (those stay for the hardcoded campaign). Reference: `quest.html` map view.

- **No box around the steps.** Rows sit right on the dotted background so the **segmented trail + mascot** stay visible down the left side (teal = done, gold sparkle = current, purple = future).
- **Module-style banner per section** — a customizable **typed** label with a **gold left bar** (`border-left:4px solid --gold`) and a **low-opacity purple gradient that spans across** (`linear-gradient(90deg, rgba(128,104,196,.32), transparent)`), with a **teal striped progress bar** below it.
  - **Default = one banner = the whole quest.** Add more banners to chunk it into modules like exam 3 (each gets its own progress bar).
  - **Banners are typed text, NOT drop targets.** Task cards only drop into the step list, never onto a banner.
- **Step row (flexible, wraps).** Long TickTick titles **wrap to ~2 lines then trim with `…`** instead of squishing.
  - Leading control is the **▶ play button**, which becomes the **gold ⭐ star** when the step is completed (reuses `CW_PLAY` / `CW_STAR`).
  - **Done = color shift only (teal), NO strikethrough.**
  - Inline meta line: **`[date] · notes`** (date in teal); no inline edit toggle — edits live in the step menu.
  - **`+XP` is gold** (`#ffcf6e`), matching the campaign. Values come from the difficulty preset (easy 5 / medium 10 / hard 20 — see decision #10).

## ✏️ Editing — two tiers (decided)
| Scope | How | For | Does |
|---|---|---|---|
| **One step** | right-click / long-press a row | quick tweaks | inline menu → **open** (full details, where long notes live) · **edit** (rename, notes, date, delete) |
| **Whole quest** | **⚙ edit quest** (top-right) | structural | re-opens the **builder board** loaded with this quest — rename quest, add/rename/reorder/delete banners, pull up the pile to add more tasks or type new steps, move/delete steps, reset or delete the quest |

One editor to learn: the builder board *is* the quest editor.

## 🎣 The "pick your tasks" screen (decided)
The front door — how TickTick tasks get into the builder's pile.

- **Data source:** the existing Cloudflare worker `/ticktick` endpoint + the key already saved from cloud sync — **no new login**. If the key isn't set, nudge to connect (same as sync).
- **Pick flow = hybrid.** A focused pick screen loads the pile at the start, and it's **re-openable anytime** from the builder (⚙ edit quest → *add tasks*) to pull in more. One picker, two entry points:
  ```
  [ + new quest ] → PICK (browse + select) → add to pile → BUILDER (assemble)
                                                                ▲
       ⚙ edit quest → "add tasks" ───────────────────────────┘
  ```
- **Organization = toggle by-list ↔ by-date**, with a search box + a "due this week" filter on top. (by-list groups under TickTick list headers; by-date is the soonest-due-first flat list with the list name as a tag.)
- **Subtasks:** a parent with subtasks shows a ▸ expand. **Selecting a parent pulls it into the pile carrying its subtasks** (this is what enables the builder's "drop as chapter → subtasks become steps"). Checking a parent auto-checks its subtasks; you can uncheck any, or grab a single subtask on its own. The pile always retains the parent→child relationship.
- **Selection:** multi-select checkboxes → **"add to pile"** with a live count.
- **Micro-details (parked, no decision needed):** tasks already added to this quest show greyed with a ✓ (no double-adding); not-connected state nudges like sync.

### 🔧 Technical to-do (implementation, not design)
- The worker's `/ticktick` currently returns tasks but **not their subtasks** — add subtask/checklist data to the feed so the pick screen and chapter auto-fill work.

## 🌍 Multi-quest: worlds → maps → quests (IN PROGRESS)
Three nested layers wrapping the quest we designed (the game today is just the middle layer with one quest):
```
🌍 WORLDS  (school · exercise · mental health · …)   ← create, label, color, archive
   └─ 🗺️ WORLD MAP  (winding road of up to ~20 quest spots)   ← the gang travels; pick a quest
        └─ 📜 QUEST  (the questline: banners, steps, XP/coins/stars)
                     ↳ on finish OR give-up → a 🚩 dumpling flag is planted at that spot
   📚 ARCHIVE LIBRARY   ← finished/archived worlds retire here with their stats kept
```

### Layer 1 — the world map / travel (decided)
- **Vertical-snake road** (scroll down); winds left↔right as it descends. Matches the existing vertical trail, thumb-friendly on iPhone.
- **Quests are freely selectable, NOT gated/sequential** — any quest, anytime.
- **The gang travels together** — dumpling + tomato + the **equipped gacha buddy** (if one is active) — parking at the current/most-recent quest and walking to a tapped spot before it opens.
- **Road length = exactly the number of quests (up to 20)** — it stops at the last quest, no empty road beyond. The `⊕ add a quest` spot is the final spot (launches pick → builder) until you reach 20.
- **Every spot shows a progress bar + `earned/total xp` + `earned/total ⭐`** (stars earned vs. all the stars available to earn on that quest = 1/chapter + 3 completion bonus). Replaces the raw %. **Flags:**
  - ✅ **done → big gold dumpling victory flag**
  - 🍅 **in-progress (started, not finished) → tiny pomo flag**, always visible so every active quest is spottable at a glance even when the gang is elsewhere
  - ○ **not-started → no flag**
  - 🏳️ **given-up → faded flag** (abandoned but resumable — see end-states below)

### Layer 2 — quest end-states (decided)
- **Completed = 100%** (all steps checked) — auto-triggers on the final step; no "mark complete" button. **Victory moment:** fanfare + burst + "QUEST COMPLETE" banner, the **+3 star bonus** lands, and the **big gold dumpling flag** plants on the hill.
- **Completed quests are trophies** — tapping opens the finished questline **read-only** (no re-checking, no re-earning). It stays as a monument until archived.
- **Give up** — from **⚙ edit quest → "give up quest"**, behind a confirm (like selling pomos). Keep **all coins + stars already earned**; **no +3 bonus**; a **faded flag** plants; the quest freezes at its current %.
- **Give-up is resumable** — the faded flag means "abandoned for now." Re-entering and continuing **resumes** it (flips back to in-progress / pomo flag). Finish it later and the faded flag **converts to the gold victory flag + the +3 bonus** — the completion bonus is paid whenever you truly complete it, first attempt or not.

### Layer 3 — worlds & the worlds hub (decided)
- **A world = a top-level category** with its own name, **emoji** (📚/💪/🧠), **color** (default twilight), and its own quest map. There's always a **default world** so the game works out of the box (the current exam questline lives as its first quest).
- **Navigation adds one zoom level:** `🌍 WORLDS hub → tap a world → its MAP → tap a quest → the QUEST`. The hub is reached by tapping the `🌍 <world> ▾` strip atop the map; a back-arrow steps up.
- **The worlds hub is its own screen** — a grid of **colored portal cards**, each showing its emoji, name, color theme, and a **progress bar + quest count + `earned/total xp` + `earned/total ⭐`** (world-aggregate totals). The **active world glows and has the gang standing on it**; a world with all quests done shows a **✦ done** badge.
- **Create** = a `＋ new world` card → name it, pick a color, pick an emoji. **If no emoji is chosen, the default placeholder is the sparkle/star icon.**
- **Manage** = hold / right-click a card → **rename · recolor · archive** (same context-menu pattern as steps).
- **Archive library** entry sits at the bottom of the hub (see #4).

### Still to whiteboard (sub-stickies)
4. 📚 **archive library** — retiring a world, and what stats it documents (per quest: completion %, XP, coins + stars, dates, steps done).
5. 🎨 **world color theming** *(optional)* — each world map a customizable palette; default twilight; selecting a color re-themes the opened quest too (feasible: the game is already CSS-variable-driven, palette re-declared on `.cw-win`). Drop if too beefy.

## ✂️ Explicitly out (for now)
- **No hidden link to TickTick.** Dropped cards are plain text; the quest lives entirely in the game.
  *(Revive with one word if wanted — see the retired "sync-back" idea below.)*
- **Notion integration** — skipped, likely too complicated. Off the board.

## 📌 Parked stickies (open questions, pick when ready)
- 🎚️ **rework the leveling system** — the current level/XP/rank system is built around the single exam campaign (`XP_TOTAL` = that one campaign's total; `RANKS` are fixed thresholds tied to it; the HUD bar tracks just it). With multi-quest/worlds it needs reworking so the **level/rank reflect cumulative XP across all quests & worlds**, not one quest. Open Qs: is the HUD bar global lifetime XP? do ranks become open-ended tiers that keep scaling? does each quest still show its own local progress (yes — that's the map readout) while the HUD shows the global level? how do existing saves migrate?
- 🔗 **sync-back** — currently OFF. Would re-add the hidden link so checking a step off marks it done in TickTick. Only if the link idea comes back.
- 🗂️ **multiple saved quests** — now being designed in the **Multi-quest** section above (worlds → maps → quests). Layer 1 (the map) decided; sub-stickies 2–5 remain.

## Finished assembly model (one paragraph)
> Pull from a **pile** of your TickTick cards (main tasks + subtasks) → drop into a quest skeleton where
> **every slot is typeable** → drop a **main task as a chapter** and its **subtasks auto-fill as steps** →
> **rearrange, ✎-edit, or pull cards back to the pile** freely → add your own chapters/steps by hand →
> name the quest → build it to your map. No links, nothing locked.
