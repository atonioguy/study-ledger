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

## ✂️ Explicitly out (for now)
- **No hidden link to TickTick.** Dropped cards are plain text; the quest lives entirely in the game.
  *(Revive with one word if wanted — see the retired "sync-back" idea below.)*
- **Notion integration** — skipped, likely too complicated. Off the board.

## 📌 Parked stickies (open questions, pick when ready)
- 🔗 **sync-back** — currently OFF. Would re-add the hidden link so checking a step off marks it done in TickTick. Only if the link idea comes back.
- 📅 **due date / priority** — becomes a little note on the step, or ignored?
- 🎁 **XP / coins per step** — how rewards get assigned to imported steps.
- 🎨 **the "pick your tasks" screen** — how choosing tasks from TickTick actually looks/feels.
- 🗂️ **multiple saved quests** — switching between more than one quest on the map.

## Finished assembly model (one paragraph)
> Pull from a **pile** of your TickTick cards (main tasks + subtasks) → drop into a quest skeleton where
> **every slot is typeable** → drop a **main task as a chapter** and its **subtasks auto-fill as steps** →
> **rearrange, ✎-edit, or pull cards back to the pile** freely → add your own chapters/steps by hand →
> name the quest → build it to your map. No links, nothing locked.
