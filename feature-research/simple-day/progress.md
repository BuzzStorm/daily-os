# Simple Day — progress

## Phase 1: full replacement (2026-07-09) — implemented, reviewed (SHIP), pushed
- Time-block day view replaced with flat per-day tick-list. Net ~730 lines deleted.
- Data: `S.custom[day]={list,parking}`, `S.order`, `S.skips`, `S.carryDismissed`; taskMoves +
  recurring.block gone; DATA_VERSION 3→4, migration in migrateState (startup/import/adoptState).
- UI per approved mockup (https://claude.ai/code/artifact/9272398b-9fe7-4743-bcb5-88751e96795c):
  TODAY card w/ progress bar, event strip, ↩ YESTERDAY carries (2-day window, × dismiss),
  grip reorder, ⇄ move popover (Tomorrow/Pick a date…/Parking), quick-add; Parking Lot; EOD nudge.
- Verified: boot harness, 24/24 migration tests, 27/27 interaction, 8 screenshots, streak regression.
- Reviewer: v3↔v4 sync window proven SAFE (save() re-stamps own DATA_VERSION → beneficial
  re-migration; fold shape-idempotent). Deviations 1-8 accepted.

### Follow-ups (non-blocking, not yet done)
1. Carried task rows look editable but inline edit no-ops (editTask reads viewDay list, carry
   lives in home day's list — sdTaskRow editAttr ~index.html:3772, editTask ~3120).
2. Rare historical duplicate work-task row on days where a template task was drag-moved pre-v4
   (same-id custom copy folds in alongside new rec_work_* seed). Cosmetic, history-only.
3. Header shows 0/0 + empty bar when today's list is empty but carry rows are visible. Cosmetic.
