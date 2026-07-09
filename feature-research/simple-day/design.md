# Simple Day — design spec (approved 2026-07-09)

Replace the time-block day view (morning/afternoon work blocks + evening zone) with a single
time-free tick-list per day, keeping DailyOS's existing visual language. Approved via interactive
mockup: https://claude.ai/code/artifact/9272398b-9fe7-4743-bcb5-88751e96795c
Approach: **full replacement** (option B — model + render), not a mode toggle.

## Why
The block structure taught the routine; the routine is now internalised. Blocks are ceremony.
User wants: "a list of things to do for that day so I can just tick them off."

## Day view layout (top → bottom)
1. Greeting + date + streak chip — unchanged.
2. Countdown hero cards — unchanged.
3. Non-negotiables strip — unchanged (streak logic untouched: NN done-state + S.streak only).
4. **TODAY card** (the new core):
   - Header: `TODAY` + `n/N` count + thin amber progress bar (replaces "3 blocks completed").
   - Events strip: that day's calendar events, amber left-edge rows (MUFC red), time + title +
     badge. Not tickable. Sorted by time, above the tasks.
   - Task list: one flat, manually ordered list. Row = grip (drag reorder, hover/long-press) +
     tick + text + optional `↩ YESTERDAY` carry chip + `⇄` move button (hover/touch-faint).
     No time labels anywhere on tasks.
   - Quick-add row at card bottom: type → task appended to today's list. The add path drops all
     block/duration routing. DECISION: category picker is dropped from quick-add; existing tasks
     keep their `cat` field (harmless, used for the coloured tick bar only).
5. **Parking Lot card** — same semantics as now (optional, excluded from progress), same row
   affordances (tick, reorder, ⇄ move).
6. EOD nudge line: "N to go…" replaces block-based wrap copy.

## Move-to feature (user-required)
`⇄` on every task row (Today + Parking Lot) opens a small popover: **Tomorrow · Pick a date… ·
To Parking Lot** (from Parking: **To Today**). "Pick a date…" uses a native date input.
- Custom task: re-keys it to the target day's list (or parking).
- Recurring-task instance: hides that instance for the source day and creates a one-off copy on
  the target day (recurrence itself untouched).
- Moving clears any carry-over state.

## Carry-over (replaces "Still Outstanding")
- On rendering today, any task unticked on yesterday's list appears at the TOP of today's list
  with an `↩ YESTERDAY` chip.
- It's the same task surfaced, not a copy; ticking it marks it done for its home day and stops
  the carry. Moving or explicit dismissal (small × in its row, or move menu) also stops it.
- A task carries at most 2 days, then quietly stops following (no guilt pile).
- Recurring tasks do NOT carry over (they recur anyway). Parking Lot never carries.

## Data model
- `S.custom[day]` becomes a single flat array per day (key `'list'`) + existing `'parking'` key.
  Weekend key handling folds into the same shape (weekends already flat).
- New `S.order[day]`: array of task ids = manual order (tasks not listed sort by creation).
- `S.recurring[]`: `block` field ignored/removed; recurrence = `dayOfWeek` only. Gym seeds
  (`rec_gym_*`) become plain recurring tasks on `S.gymDays` days.
- New `S.skips[day][taskId] = true`: per-day hide for moved recurring instances (replaces
  `taskMoves` sentinel semantics, far simpler).
- New `S.carryDismissed[day][taskId]`: carry-over dismissals.
- `S.done[day][taskId]` unchanged (already block-independent) — history preserved.
- DELETED: `TEMPLATE`, `CAT_BLOCK`, `smartBlock`, block routing in `blockTasks`,
  `getTemplateForDay`, `blockStatus`/`getCurrentBlock` engine, `S.taskMoves` (after migration),
  gym block swap in `syncGymDays` (keep gym recurring seeding).
- KEPT: `PARKING_TEMPLATE` and the `'parking'` zone, `NN` constant, `S.daysOff`, `S.gymDays`,
  `S.weekly`, `S.streak`.

## Migration (one-time, versioned, sync-safe)
- Bump state version `_v`; migration runs inside `migrateState()` so BOTH startup and
  `adoptState()` (sync pull) paths migrate — same pattern as existing migrations. Idempotent:
  keyed off `_v`, safe to run on already-migrated state.
- For each day in `S.custom`: concat block-keyed arrays (template block ids + `'evening'` +
  `'weekend'`) in block-time order into `custom[day].list`; `'parking'` untouched; apply
  `taskMoves` overrides during folding, then delete `S.taskMoves`.
- `S.done` untouched. Recurring: drop `block` field.
- Devices: both of Ben's devices auto-update within a day (update toast); old client pushing
  un-migrated state is re-migrated on pull by the new client (migrateState in adopt path) —
  acceptable during the brief overlap window.

## Rewritten consumers (from scout map, index.html line refs pre-change)
- `renderMain()` ~3820-4196: weekday/weekend branches unify into one flat-list day renderer.
- Focus card (~3870): replaced by simple date-contextual line (today/past/future), no block engine.
- Past-summary "N blocks completed" (~4068) → progress bar in TODAY header.
- `getOutstandingPastTasks`/`renderOutstanding` (~2601/4450) → carry-over logic.
- `getAllTasks` (~4632) + sidebar `renderStats` (~4749): count from flat lists; "blocked hours"
  pill REMOVED (replace with nothing; sidebar keeps streak/done/non-negs).
- Drag/drop `dropTask` (~4496): reorder within list + drop into parking, writes `S.order`.
- Quick-add: strip block routing; append to today.
- Search/week views: verify they read `S.custom`/`S.weekly` day keys only; adjust if they
  reference block ids.

## Out of scope
Weekend/weekday distinction beyond sharing the same list shape; events system; sync;
non-negotiables; countdowns; PWA/service worker; Man Utd fixture refresher.

## Files touched
`index.html` only (+ this folder's audit/progress docs).

## Verification
1. Node boot harness (TDZ check) — app boots.
2. Migration unit test in harness: synthetic pre-migration state (blocks, taskMoves, evening,
   weekend, done flags) → migrated flat state with order preserved, done preserved, idempotent
   on second run, and stable under adoptState(migrated) + adoptState(unmigrated cloud copy).
3. Headless renders at 550px and 1200px: today (tasks+events+carry), past day, future day,
   weekend, parking — screenshots reviewed.
4. Interaction smoke via harness or headless: tick, quick-add, move-to-tomorrow, move recurring
   instance, carry dismiss, reorder persistence.
5. Streak regression: NN completion still increments streak on migrated state.
