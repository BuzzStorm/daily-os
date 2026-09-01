# Audit — tick-and-delete-stickiness

## Files changed

1. `index.html` (modified)
2. `feature-research/tick-and-delete-stickiness/audit.md` (this file, new)

Nothing else touched.

## New state fields (additive, no DATA_VERSION bump)

- `S.carryTicked = { [taskId]: 'YYYY-MM-DD' }` — day a carry row was ticked; keeps it visible (struck through) that day.
- `S.deletedSeeds = { [eventText]: true }` — event texts the user deleted; seeders skip them.

Both initialised with plain guards in the startup guard block (beside `if (!S.skips)`) and in `adoptState()`'s post-pull guard block. No `setSyncDirty` calls added; all mutations sit in user-action paths that already call `save()`.

## Changes per function (before → after)

| Function | Before | After |
|---|---|---|
| startup guard block (~2298) | ends at `carryDismissed` | adds `carryTicked` + `deletedSeeds` guards |
| `adoptState()` (~4805) | same | same two guards added |
| `toggle(tid, day)` (~2980) | flips done, saves | when `day && day !== viewDay` (i.e. a carry row): tick sets `S.carryTicked[tid] = viewDay`, untick deletes the entry; before `save()` |
| `getCarryTasks()` (~2870) | `if (isDone(t.id, dk) \|\| dismissed[t.id]) continue;` | `if (dismissed[t.id]) continue;` then `if (isDone(t.id, dk) && (S.carryTicked \|\| {})[t.id] !== today()) continue;` |
| `getParkingCarries()` (~2895) | `if (isDone(t.id, dk) \|\| dismissed[t.id] \|\| seen.has(t.id)) continue;` | dismissed/seen check first, then same isDone+carryTicked rule |
| old-data purge (~4620) | purges `carryDismissed` by key date | adds purge of `carryTicked` entries whose **value** date < cut |
| `ensureEvent(match, data)` (~2505) | dedupe-by-text only | returns `false` immediately when `S.deletedSeeds[match]` |
| MUFC fixture direct push (~2705) | `} else {` (ensureEvent + direct push) | `} else if (!S.deletedSeeds[f.text]) {` — deleted fixture texts are never re-pushed |
| `ensureRecoveredEvents()` (~2805) | re-adds by id | skips an entry when `S.deletedSeeds[ev.text]` |
| `rmEvent(id)` (~3460) | filter only | records `S.deletedSeeds[ev.text] = true` first; comment explains why recording every deletion is safe (ensureEvent is seeder-only; the sidebar form pushes directly) |
| `rmRecurring(id)` (~4090) | filter only | `rec_gym_*` ids: parse trailing dow, remove from `S.gymDays`, `syncGymDays()`, `save(); render(); return`. Other ids unchanged |

## Verification (Browser pane, launch config `daily-os`, port 8741)

Safety pre-check: `localStorage.getItem('dailyOS_syncKey')` → `null`. Preview origin is sync-isolated; confirmed before writing any test state. App's `today()` = `2026-09-01`, `viewDay` = `2026-09-01` (read from the page, not hardcoded).

1. **A — carry stays**: seeded `test_carry_1` on yesterday (`2026-08-31`). Appeared in `getCarryTasks()`. `toggle('test_carry_1','2026-08-31')` → still listed (`afterTick_stillListed: true`), DOM class `"t-text done"` (struck through), `S.carryTicked['test_carry_1'] === '2026-09-01'`, `isDone` on home day true. Untick → still listed, DOM class `"t-text "` (no done), `carryTicked` entry cleared, `isDone` false. PASS.
2. **A — old ticks stay hidden**: re-ticked, backdated `S.carryTicked['test_carry_1'] = '2026-08-31'`, reload → not in `getCarryTasks()`, not in DOM (`a2_carryHidden: true`, `a2_domAbsent: true`). PASS.
3. **A — parking**: seeded `test_park_1` parked 3 days back (`2026-08-29`). Ticked via `toggle` with home day → still listed in `getParkingCarries()`, DOM `"t-text done"`, `carryTicked` = `'2026-09-01'`; survived a reload same-day (`parkStillVisible_tickedToday: true`). PASS.
4. **B1**: `rmEvent` on 'Swimming at Lamorna (Daisy)' → removed, `S.deletedSeeds['Swimming at Lamorna (Daisy)'] = true`. Reload → stays deleted (`b1_staysDeletedAfterReload: true`), flag persisted. Deleted the key, reload → event re-seeded (`b1_reseededAfterFlagCleared: true`) — seeder still works. PASS.
5. **B2**: `rmRecurring('rec_gym_1')` (dow 1 was in `S.gymDays [1,2,4]`) → `S.gymDays` became `[2,4]`, `rec_gym_1` gone, `rec_gym_2`/`rec_gym_4` intact. Reload → `gymDays` still `[2,4]`, `rec_gym_1` not resurrected. PASS.
6. **Console/responsive**: zero console errors across all steps (desktop and mobile). Mobile 375x812: day card rendered, parking carry visible, no errors. Viewport reset to desktop afterwards. PASS.

Test state cleaned from the preview origin afterwards (test tasks, done entries, carryTicked entries removed; `gymDays` restored to `[1,2,4]`).

## Deviations from plan

- Fixture push guard (B1 step 3) implemented as `} else if (!S.deletedSeeds[f.text]) {` on the branch rather than wrapping only the inner direct push — the branch's only other work is the ensureEvent call (which the new guard already declines) and `changed = true`; skipping the whole branch avoids a pointless saveLocal/render on deleted fixtures. Same net behaviour as specified.
- No other deviations. Line numbers in the plan were pre-edit anchors; all sites located by function/selector name as instructed.

## Open risks

- `rmEvent` records deletions of *user-created* events into `deletedSeeds` too. Per plan (and the in-code comment) this is safe today because `ensureEvent` is only called by seeders; if a future seeder reuses a text a user once deleted, it will silently not seed. Accepted in plan.
- If a future MUFC fixture legitimately shares a text with a deleted one, it stays suppressed — intended behaviour per plan.
- Not committed/pushed; working tree diff vs fecb593 awaits review.

## Post-review fixes (main session)

Reviewer verdict was fix-first. Applied:

1. **BLOCKING — EOD nudge count.** `renderDayCard` counted `carries.length` as
   "open", which was only valid while `getCarryTasks()` filtered out done rows.
   With feature A a ticked carry stays in that array, so the nudge read
   "1 to go" forever and "All done. Clear day, clear head." became unreachable
   on any day with a carry. Now counts `carries.filter(t => !isDone(t.id, t._home))`.
   Verified in preview: last open carry ticked → row stays `t-text done` AND
   nudge flips to "All done. Clear day, clear head."; untick → back to "1 to go",
   `carryTicked` entry cleared. Zero console errors.
2. **Non-blocking #2 — import path.** `migrateState` does not add the two new
   additive fields and the import path never reloads, so deleting an event after
   importing an old backup would have thrown. Added `deletedSeeds`/`carryTicked`
   guards immediately after `S = migrateState(imported)`.

Deferred (logged, not fixed): reviewer findings 3-7 — stale `carryTicked` after a
home-day re-tick; `deletedSeeds` never purged and only recoverable via devtools;
`ensureRecoveredEvents` guard could key on id rather than text; prototype-key reads;
non-defensive purge parse; and the cross-device caveat that a phone still running
old code will re-add a deleted seed (update every device before trusting B1).
