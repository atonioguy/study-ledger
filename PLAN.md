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
- **Step row (two lines).** The **task name is one line and truncates with `…`** when long; the **date + notes sit on a second line** below it (not appended after the name).
  - Leading control is the **▶ play button**, which becomes the **gold ⭐ star** when the step is completed (reuses `CW_PLAY` / `CW_STAR`).
  - **Done = color shift only (to the world's accent), NO strikethrough.**
  - Second line: **`[date] · notes`** (date in the world accent); no inline edit toggle — edits live in the step menu.
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

### ✅ Pick screen — BUILT in prototype (`quest-next.html`)
- Full pick-your-tasks screen: search · by-list ↔ by-date toggle · "due this week" filter · expandable subtasks · multi-select with live count · **add N to quest**.
- **Reached two ways:** map's *add a quest* (＋) opens it fresh (`new` mode, with *start blank instead*); builder's **↯ import from ticktick** reopens it (`add` mode, appends).
- **Auto-assembly:** a selected parent+subs → a **chapter** (subs become **steps**); a lone task/subtask → a loose step in a **tasks** chapter. Notes carry from TickTick content, dates from due dates, difficulty inferred from priority (p5→hard, p3→med, else easy). Everything stays editable in the builder.
- **Data:** currently a **baked real snapshot** of Antonio's actual lists (Microbiology · Career Readiness · MCAT). The live version swaps this for the worker fetch (needs the subtask endpoint above).

## 🌍 Multi-quest: worlds → maps → quests (IN PROGRESS)
Three nested layers wrapping the quest we designed (the game today is just the middle layer with one quest):
```
🌍 WORLDS  (school · exercise · mental health · …)   ← create, label, color, archive
   └─ 🗺️ WORLD MAP  (winding road of up to ~20 quest spots)   ← the gang travels; pick a quest
        └─ 📜 QUEST  (the questline: banners, steps, XP/coins/stars)
                     ↳ on finish OR give-up → a 🚩 dumpling flag is planted at that spot
   📊 VIEW STATS   ← archived worlds retire here; their stats are kept and browsable
```

### Layer 1 — the world map / travel (decided)
- **Vertical-snake road** (scroll down); winds left↔right as it descends. Matches the existing vertical trail, thumb-friendly on iPhone.
- **Quests are freely selectable, NOT gated/sequential** — any quest, anytime.
- **The gang travels together** — dumpling + tomato + the **equipped gacha buddy** (if one is active) — parking at the current/most-recent quest and walking to a tapped spot before it opens.
- **Road length = exactly the number of quests (up to 20)** — it stops at the last quest, no empty road beyond. The `⊕ add a quest` spot is the final spot (launches pick → builder) until you reach 20.
- **Every spot shows a progress bar + `earned/total xp` + `earned/total ⭐`** (stars earned vs. all the stars available to earn on that quest = 1/chapter + 3 completion bonus). Replaces the raw %; **the bar fills by xp % (earned ÷ total xp)**, and a **finished** quest's bar uses the gold level-bar pattern (the HUD xp-bar gradient). **Flags:**
  - ✅ **done → big gold dumpling victory flag**
  - 🍅 **in-progress (started, not finished) → tiny pomo flag**, always visible so every active quest is spottable at a glance even when the gang is elsewhere
  - ○ **not-started → no flag**
  - 🏳️ **given-up → faded flag** (abandoned but resumable — see end-states below)

### Layer 2 — quest end-states (decided)
- **Completed = 100%** (all steps checked) — auto-triggers on the final step; no "mark complete" button. **Victory moment:** fanfare + burst + "QUEST COMPLETE" banner, the **+3 star bonus** lands, and the **big gold dumpling flag** plants on the hill.
- **Completed quests are trophies** — tapping opens the finished questline **read-only** (no re-checking, no re-earning). It stays as a monument until archived.
- **Give up** — from **⚙ edit quest → "give up quest"**, behind a confirm (like selling pomos). Keep **all coins + stars already earned**; **no +3 bonus**; a **faded flag** plants; the quest freezes at its current %.
- **Given-up counts as "resolved" for the quest fraction.** A world's `X/Y quests` counter counts a quest as done when it's **completed *or* given up**, so a world can reach **✦ done** (all quests resolved) even if some were given up — meaning not all possible XP/stars were earned (the xp/star fractions stay short of full, which is fine).
- **Give-up is resumable** — the faded flag means "abandoned for now." Re-entering and continuing **resumes** it (flips back to in-progress / pomo flag). Finish it later and the faded flag **converts to the gold victory flag + the +3 bonus** — the completion bonus is paid whenever you truly complete it, first attempt or not.

### Layer 3 — worlds & the worlds hub (decided)
- **A world = a top-level category** with its own name, **emoji** (📚/💪/🧠), **color** (default twilight), and its own quest map. There's always a **default world** so the game works out of the box (the current exam questline lives as its first quest).
- **Navigation adds one zoom level:** `🌍 WORLDS hub → tap a world → its MAP → tap a quest → the QUEST`. The hub is reached by tapping the `🌍 <world> ▾` strip atop the map; a back-arrow steps up.
- **The worlds hub is its own screen** — a grid of **colored portal cards**, each showing its emoji, name, color theme, and a **progress bar (fills by xp %) + quest count (completed + given-up ÷ total) + `earned/total xp` + `earned/total ⭐`** (world-aggregate totals). Each card also carries a **flag tally** in its top-right (🚩×completed · 🍅×in-progress) so you can read how much of the progress is banked vs. in-flight. The **active world glows and has the gang standing on it**; a world with all quests done shows a **✦ done** marker next to its quest count.
- **Create** = a `＋ new world` card → name it, pick a color, pick an emoji. **If no emoji is chosen, the default placeholder is the sparkle/star icon.**
- **Manage** = hold / right-click a card → **rename · recolor · archive** (same context-menu pattern as steps).
- **View Stats** entry sits at the bottom of the hub (see #4).
- **Move a quest between worlds** — from **⚙ edit quest → "move to world…"** → pick a target world. It leaves the current world's road and appends to the target's; the quest **re-themes to the target's palette**; earned coins/stars are global so nothing's lost. Blocked only if the target world is at the 20-quest cap. (Cheap — a quest just carries a "which world" tag that gets reassigned.)

### Layer 4 — view stats (archive) (decided)
The concern: archives usually clog an app because the whole save syncs as **one ≤200 KB blob** — keeping full archived worlds would bloat every sync and eventually fail. The fix (two moves):
- **Summary-only, not the whole thing.** Archiving computes a compact **stats snapshot** and **discards the heavy data** (step text, notes, TickTick cards, per-step state). Kilobytes → a few hundred bytes to ~1–2 KB per world. The archive is a trophy shelf of *numbers*, not a full copy.
- **Its own lazy-loaded slot** (`sidequest-archive`) — loaded **only when you open View Stats**, never in the active game state or its frequent sync. So archive size **never** slows the app, no matter how big it grows. *(The worker already accepts any `?slot=` name → zero worker changes needed.)*
- **Detail kept = world + per-quest breakdown.** Per world: name, emoji, color, dates (created + archived), quests (completed/given-up/total), xp earned/possible, stars earned/possible. Plus a **tiny per-quest line**: name, completed-or-given-up, its xp + stars, date.
- **Archived worlds are records, not resumable** (fits "documented stats"; completed quests were already read-only trophies).
- **View Stats screen** — reached from the worlds hub (`📊 view stats →`): lists archived worlds with their totals; tap one to drill into its per-quest breakdown. (The verb for retiring a world is still "archive"; it just lands in View Stats.)

### Layer 5 — world color theming (decided)
- **5 palettes** chosen at create/recolor: 🌆 **Twilight** (default), 🔥 **Sunset**, 🌿 **Mint**, ❄️ **Snowy**, 🌸 **Sakura**.
- **Two-token model (mirrors the default).** The default is a **dusky base** ("dusky blue") + a **teal accent**. Each palette **takes over the base role with its own hue**, and a **complementary accent takes over teal's role**:
  - 🌆 Twilight = dusky **purple** base + **teal** accent · 🔥 Sunset = **ember** + **cyan** · 🌿 Mint = **green** + **coral** · ❄️ Snowy = **slate-blue** + **peach** · 🌸 Sakura = **pink** + **mint**.
- **Themed by the base+accent:** the **background** (a dimmed palette, like the picker cards), the **hills**, the **world strip + banner tint**, the **task/step cards + text**, and everything that was **teal → the complementary accent** (done row + its text/date, chapter progress bar, done-trail segment, done pip).
- **Kept as a constant yellow motif (currency + progress):** coins, xp numbers, the HUD level bar, the gold banner side-bar, and the **into-current trail segment** (completed→current stays gold; the completed↔completed/start stretch takes the accent).
- **Never themed — always default chrome:** the **top HUD bar** and the **bottom tabs** (consistent, readable in every world).
- **Recolor UI:** a palette picker with a themed preview per palette; from create-world and a world card's hold-menu → recolor.
- **Cheap:** the game is CSS-variable-driven — a world swaps a small set of base/accent tokens; the fixed chrome + yellow tokens are left untouched.
- **Finalized visual details (from mock iterations):**
  - **Cards are bright/hill-aligned** (jewel-toned, not near-black), and **text auto-contrasts** — dark on light/bright surfaces, light on dark ones.
  - **Completed step = a bright accent block** (matching the star/trail/progress accent brightness) with **dark high-contrast body text** (cream on Sakura's red), a **glowing gold star**, and the **yellow +xp with a matching glow**.
  - **Play button (incomplete) takes the accent color + glow**; progress bars are **two-shade accent stripes**; the completed↔start trail + done pip use the accent, the completed→current segment + current sparkle stay gold.
  - **Snow is a light/icy theme** (soft periwinkle base, dark text); its yellow currency shifts to **deep amber** so it stays legible on light cards.
  - **Accents:** Twilight teal · Sunset (beige base) chocolate/caramel · Mint light-green · Snowy cool-blue · Sakura (pastel-pink base) red-velvet.

### ✅ Multi-quest: all sub-stickies resolved
Map · end-states · worlds hub · view stats · move-quest · color theming are all designed. (Cross-cutting **leveling rework** remains in the parked stickies.)

### ⚠️ Integration fidelity (must-hold when folding into the live game)
- `quest-next.html` is a **rough prototype** of the final — it proves out the data model, worlds/map, builder, theming, and interactions. It is **NOT** the final visual bar.
- When folding into `quest.html`, **keep the live game's existing polished look and button/UI behavior.** Antonio really likes the current **exam-3 questline look** — that fidelity must be preserved, not downgraded to the prototype's rougher version. Port the *features* into the live UI, don't replace the live UI with the prototype.
- Sticky banners: on the map the **world-name banner** stays pinned while scrolling quests; in a quest the **quest-name banner** stays pinned while scrolling steps (both park just under the top HUD bar).

## 🎚️ Leveling rework (decided)
**Problem:** the current level/XP/streak are all scoped to the one exam campaign — 6 fixed ranks (`fresh start`→`exam ready`) maxing at ~250 xp, the XP bar = that one quest's total, and the 🔥 "streak" is actually `tasks-done / total` mislabeled. Multi-quest needs it **global + open-ended**.

- **Level = lifetime XP, open-ended.** Every completed step in any quest/world adds to **one global XP pool that never resets** (given-up quests keep their earned per-step XP too).
- **Gentle curve.** Cost from level L→L+1 = **`50 + 25·(L−1)`** xp → 50, 75, 100, 125, … Cumulative to reach: lv2 = 50, lv4 = 225, lv6 = 500, lv10 ≈ 1,400. Early levels fast, then stretch. Tunable.
- **HUD bar = per-level progress** — `lv N · <xp into level> / <xp to next>`; the **total lifetime XP** is shown in View Stats.
- **Rank titles = evolving tiers.** Keep the cute names (fresh start → warming up → in the zone → locked in → …) extended with higher ones; the level number always shows, the title advances at tier boundaries.
- **🔥 = real daily streak.** Consecutive days you completed **≥1 step or logged ≥1 pomo** (ties the pomo room in). Track last-active date + count: +1 on a new consecutive day, unchanged if already active today, resets to 1 after a missed day. Displays as `🔥 5`.
- **Migration:** existing saves convert the campaign's completed items into lifetime XP (sum of their xp) so no progress is lost on the switch.

## ✂️ Explicitly out (for now)
- **No hidden link to TickTick.** Dropped cards are plain text; the quest lives entirely in the game.
  *(Revive with one word if wanted — see the retired "sync-back" idea below.)*
- **Notion integration** — skipped, likely too complicated. Off the board.

## 📌 Parked stickies (open questions, pick when ready)
- 🔗 **sync-back** — currently OFF. Would re-add the hidden link so checking a step off marks it done in TickTick. Only if the link idea comes back.
- 🗂️ **multiple saved quests** — now being designed in the **Multi-quest** section above (worlds → maps → quests). Layer 1 (the map) decided; sub-stickies 2–5 remain.

## Finished assembly model (one paragraph)
> Pull from a **pile** of your TickTick cards (main tasks + subtasks) → drop into a quest skeleton where
> **every slot is typeable** → drop a **main task as a chapter** and its **subtasks auto-fill as steps** →
> **rearrange, ✎-edit, or pull cards back to the pile** freely → add your own chapters/steps by hand →
> name the quest → build it to your map. No links, nothing locked.
