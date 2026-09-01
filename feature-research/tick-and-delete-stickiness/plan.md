# Ticked carry-overs stay visible + × sticks on built-in seeds

Two independent fixes, approved by Ben. Both are additive state changes — no
DATA_VERSION bump (follow the existing `if (!S.skips) S.skips = {};` convention
for additive fields).

## Project invariants (MUST follow)

- Single-file app: all code in `index.html`. No build step.
- Additive state only. Initialise new fields with plain guards, NOT a migration branch.
- New fields ride the whole-state sync payload automatically; the mutations below all
  happen in user-action paths that already call `save()` (dirty → push). Do not add
  `setSyncDirty` calls.
- Seeder functions run at startup AND after every sync pull (`adoptState`) — new
  guards must work in both paths.
- Deploy = commit+push to `master`, but DO NOT commit or push. Ben reviews first.
- Dev preview: launch config `daily-os`, port 8741.
- Line numbers are pre-edit anchors; locate by function/selector name, not blindly.

## Files touched

1. `index.html`
2. `feature-research/tick-and-delete-stickiness/audit.md` (new)

Nothing else.

## Feature A — a ticked carry-over stays visible for the rest of the day

Today a carry row vanishes the instant it is ticked (`getCarryTasks` ~2867 and
`getParkingCarries` both do `if (isDone(t.id, dk) || dismissed[t.id]) continue;`).
Ben wants it to stay on the list, struck through, until the day rolls over.

New state: `S.carryTicked = { [taskId]: 'YYYY-MM-DD' }` — the day a carry row was ticked.

1. Init guard beside `if (!S.skips) S.skips = {};` (~2296-2300) AND in the same
   guard block used after sync pull (~4781, where `if (!S.recurring)` lives).
2. `toggle(tid, day)` (~2965): a carry row is exactly the case where a home day is
   passed that differs from the viewed day (`sdTaskRow` passes `home = opts.carry ?
   t._home : viewDay`). So when `day && day !== viewDay`: on tick set
   `S.carryTicked[tid] = viewDay`; on untick `delete S.carryTicked[tid]`.
   Do this before the existing `save()`.
3. `getCarryTasks()` — replace the skip line with:
   - `if (dismissed[t.id]) continue;`
   - `if (isDone(t.id, dk) && (S.carryTicked || {})[t.id] !== today()) continue;`
   Net effect: ticked-today stays visible; ticked on an earlier day (or ticked on its
   own home day) stays hidden as before.
4. `getParkingCarries()` — same change to its skip line.
5. Purge stale entries next to the `S.skips` purge (~4606): drop `carryTicked` entries
   whose value date is older than the same cutoff.

Ticked carries keep rendering in the carries block above the day's own tasks, which
already reads as "done stuff at the top" — no change to `renderDayCard` ordering.

## Feature B — × sticks on the app's built-in events, and on Gym

Two separate resurrect paths:

**B1. Seeded events.** `ensureEvent(match, data)` (~2505) re-adds by text on every
startup, so deleting a birthday / Anniversary / Swimming / MUFC fixture is undone on
next load.

New state: `S.deletedSeeds = { [eventText]: true }`.

1. Init guard in the same two places as `carryTicked`.
2. `ensureEvent`: return `false` immediately when `S.deletedSeeds[match]` is set.
3. The direct fixture push inside the live-refresh loop (~2705, the "second fixture
   sharing a text" branch) must also skip when `S.deletedSeeds[f.text]` is set.
4. `ensureRecoveredEvents()` (~2796) matches by id, not text — give it the same
   `S.deletedSeeds[ev.text]` guard so those four also stay deleted.
5. `rmEvent(id)` (~3449): before filtering, look up the event and record
   `S.deletedSeeds[ev.text] = true`. Recording every deletion (not just seeds) is
   safe — `ensureEvent` is only ever called by seeders, and the sidebar event form
   pushes directly, so a user re-adding the same title later is unaffected. Add a
   short comment saying exactly that.

**B2. Gym.** `syncGymDays()` (~2327) rebuilds `rec_gym_<dow>` rows from `S.gymDays`
at startup, at ~2359, and after every sync pull — so `rmRecurring` on a Gym row is
undone. In `rmRecurring(id)` (~4069): when `id` starts with `rec_gym_`, parse the
trailing day-of-week, remove it from `S.gymDays`, call `syncGymDays()`, then
`save(); render();` and return. Other ids keep the current behaviour.

## Verification (all required before reporting done)

Use the Browser pane preview (launch config `daily-os`, port 8741). The preview has
no sync key and is origin-isolated from Ben's real data — verify that stays true
(`localStorage.getItem('dailyOS_syncKey')` must be null) before writing test state.

Because the dev machine clock may not match the app's "today", drive tests from
`today()` / `viewDay` in the page rather than hardcoded dates.

1. **A — carry stays**: seed a task on a previous day so it surfaces as a carry on
   today, tick it → row still present with `.t-text.done` (struck through), and
   `S.carryTicked[id] === today()`. Untick → still present, not done, entry cleared.
2. **A — old ticks stay hidden**: set `S.carryTicked[id]` to an older date, reload →
   row hidden. Confirms no regression of the original behaviour.
3. **A — parking**: same as (1) for a parking carry.
4. **B1**: `rmEvent` a seeded event (e.g. the Swimming one), reload → it does NOT
   come back, and `S.deletedSeeds` holds its text. Then delete that key, reload →
   it comes back (proves the seeder still works).
5. **B2**: `rmRecurring('rec_gym_<a dow in S.gymDays>')` → that dow leaves
   `S.gymDays`, the row is gone, and it does NOT return after a reload.
6. Zero console errors across all of the above. Desktop and mobile (375x812) both
   render the day card without errors.

Write `feature-research/tick-and-delete-stickiness/audit.md`: every function touched
(before → after), the new state fields, verification results with measured values,
and any deviation from this plan with justification.
