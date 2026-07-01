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

## ✂️ Explicitly out (for now)
- **No hidden link to TickTick.** Dropped cards are plain text; the quest lives entirely in the game.
  *(Revive with one word if wanted — see the retired "sync-back" idea below.)*
- **Notion integration** — skipped, likely too complicated. Off the board.

## 📌 Parked stickies (open questions, pick when ready)
- 🔗 **sync-back** — currently OFF. Would re-add the hidden link so checking a step off marks it done in TickTick. Only if the link idea comes back.
- 🪙 **coins / stars payout** — XP-per-step is decided (#10); still open is where spendable currency comes from. Leaning: **not per step**, but paid on finishing a **section or the whole quest** (mirrors how clearing a lesson/module grants stars today), to keep currency special.
- 🎨 **the "pick your tasks" screen** — how choosing tasks from TickTick actually looks/feels.
- 🗂️ **multiple saved quests** — switching between more than one quest on the map.

## Finished assembly model (one paragraph)
> Pull from a **pile** of your TickTick cards (main tasks + subtasks) → drop into a quest skeleton where
> **every slot is typeable** → drop a **main task as a chapter** and its **subtasks auto-fill as steps** →
> **rearrange, ✎-edit, or pull cards back to the pile** freely → add your own chapters/steps by hand →
> name the quest → build it to your map. No links, nothing locked.
