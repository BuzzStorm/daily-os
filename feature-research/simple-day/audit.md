# Simple Day — implementation audit (2026-07-09)

## Files changed
- `C:\Users\Ben\DailyOS\index.html` — the only product file touched (442 insertions, 1172 deletions)
- `C:\Users\Ben\DailyOS\feature-research\simple-day\audit.md` — this audit (new)

Not committed / not pushed. Test harnesses and screenshots live in the session scratchpad
(`...\scratchpad\`: `boot-lib.js` (pre-existing), `migration-test.js`, `interaction-test.js`,
`view-*.html`, `shot-*.png`), not in the repo.

## What changed in index.html

### CSS (added after `.t-rm:hover`, ~line 959)
New `sd-*` classes for the Simple Day card, taken from the approved mockup and mapped onto
DailyOS tokens: `.sd-card/.sd-head/.sd-title/.sd-count/.sd-progress` (card + thin amber progress
bar), `.sd-ev*` (amber event rows, MUFC red / holiday teal variants), `.sd-grip` (hover drag
grip), `.sd-cat` (thin category colour bar), `.sd-carry` (↩ YESTERDAY chip), `.sd-nudge` (EOD
line), `.sd-menu/.sd-menu-item` (move popover), `.task.drop-above` (reorder indicator), hover
reveal for `.t-move/.t-rm` inside `.task` with a `@media (hover: none)` touch-faint fallback.
Old block CSS (`.block`, `.bk-*`, `.focus-*`, `.outstanding`, etc.) left in place — removing
~800 lines of CSS was out of scope and risk-free to keep; `.focus-card` is still used by the
past/future context card.

### Removed (HTML)
- Sidebar "blocked" hours stat pill (`#sHoursPill`, ~line 1804) — spec: replace with nothing.

### Removed (JS)
`TEMPLATE`, `CAT_BLOCK`, `EVENING_START`, `isEveningMode`, `eveningTasks`,
`getOutstandingPastTasks`, `getTemplateForDay`, `blockStatus`, `bestBlock`, `nextWeekday`,
`getBlockCapacity`, `smartBlock`, `bestDay`, `blockTasks`, `findBlockAtTime`, `getCurrentBlock`,
`getNextBlock`, `formatCountdown`, `renderInlineEvent`, `renderBlock`, `taskHtml`,
`renderEveningBlock`, `eveningTaskHtml`, `renderOutstanding`, `rmParkingTask`, `rmWeekendTask`,
`rmEveningTask`, `blockQuickAdd`, `togBlock`, `togglePast`, `moveCustomTask`, `execMoveCustom`,
`moveTaskToDate`, `execMoveTaskToDate`, `getAllTasks`, and the module state
`showPastBlocks` / `openBlocks` / `_lastAddedBlock`. `LEGACY_BLOCK_MAP` kept (still used by the
v3 migration).

### Added (JS)
- `workSeedTasks()` (~line 1951) — the old TEMPLATE's two daily work tasks
  ("Pack & post orders", "List stock on eBay") as 10 weekday recurring seeds
  (`rec_work_parcels_1..5`, `rec_work_list_1..5`). Used by `def()` and the v4 migration.
- `getCarryTasks()` / `dismissCarry()` (~line 2600) — carry-over engine. Custom tasks unticked
  on D-1/D-2 surface on today; dismissal keyed `S.carryDismissed[homeDay][taskId]`.
- `listTasks(day)` (~line 2660) — the day's flat list: recurring (dow, minus `S.skips[day]`)
  + weekly for the day + `S.custom[day].list`, with `S.order[day]` manual-order override.
- `closeMoveMenu()` / `moveMenu()` / `execMove()` (~line 2760) — the ⇄ popover
  (Tomorrow · Pick a date… (native date input) · To Parking Lot / To Today) and its executor:
  custom = re-key; recurring instance = `S.skips[viewDay][id]` + one-off copy (recurrence
  untouched); weekly = `w.day` change (or convert to parked custom).
- `renderDayCard()` / `sdEventRow()` / `sdTaskRow()` (~line 3660) — the TODAY card: header +
  n/N + progress bar, events strip (sorted, all-day first), carry rows on top, task rows
  (grip · tick · cat bar · text/notes · carry chip · ⇄ · ×), quick-add row.
- `dragOverRow` / `dragLeaveRow` / `dropOnRow` / `moveOrReorder` (~line 3990) — row-level
  reorder writing `S.order[viewDay]` (list) or splicing the parking array; cross-zone drops
  route through `execMove`.
- `listQuickAdd(zone, inp)` — replaces `blockQuickAdd`; appends to `list`/`parking`.

### Modified (JS)
- `def()` — includes work seeds + `order`/`skips`/`carryDismissed` (~line 2091).
- `migrateState()` — new v4 block (~line 2129, see Migration below); `DATA_VERSION` 3 → 4.
- Startup fixups (~line 2181) and `adoptState()` fixups (~line 4680): `taskMoves` init replaced
  by `order`/`skips`/`carryDismissed` inits. Nothing else in adoptState/sync touched;
  `ensureCountdowns`/`ensureMufcFixtures` re-run there as before.
- `syncGymDays()` — gym recurring seeds no longer carry a `block` field.
- `toggle(tid, day)` — optional home-day param for carry ticks; block-complete celebration
  removed (no blocks); NN banner/checkbox pop kept.
- `paAdd()` — block/time/capacity routing stripped: "every X" recurring kept (no block field),
  "This week" weekly kept (lightest day now = fewest open tasks via `listTasks`), everything
  else appends to the target day's `list`. Time/duration text-cleaning kept; `time` no longer
  stored on tasks.
- `editTask`/`saveTaskEdit` — block <select> removed; `bid` param now the zone (`list`/`parking`).
- `renderMain()` — full rewrite of the body: header/nav/countdown hero unchanged; date-context
  focus-card now for ANY non-today day (weekends included, was weekday-only); short-day banner +
  NN strip kept (weekdays); then `renderDayCard` + `renderParkingLot` + EOD nudge (today only:
  "N to go…" / "All done…") + bottom quick-add. Weekday/weekend branches unified. Page title
  fixed to "Daily OS". Day-nav has-tasks dot now checks for non-empty arrays.
- `renderParkingLot()` — rewritten as an `sd-card` using `sdTaskRow`; PARKING_TEMPLATE merge,
  optional tag, done count, add row (today only) all preserved.
- `dragTask`/`dropTask` — new payload `{fromZone, type, tid}`; card-level drop appends.
- `quickAdd()` — appends to `S.custom[viewDay].list` (weekend/evening branches gone).
- `renderStats()` — hours pill code removed; counts from `listTasks`.
- `renderPaText()` — three block-flavoured copy lines reworded ("Stay in the blocks" →
  "Keep ticking", "EOD wrap" → "Finish strong", 9am schedule line → "Early yet…").
- Search — TEMPLATE task loop removed; custom-task loop labels zones (`Parking Lot`/`Day list`)
  and `searchJump` scrolls to the matching card instead of expanding blocks.
- Clean-old-data — also prunes 30-day-old `S.order`/`S.skips`/`S.carryDismissed` keys.
- Streak logic (`checkStreak`/`streakCount`), NN, countdowns, sync functions, service worker,
  update toast, MUFC refresher: untouched.

## Migration (v4, inside migrateState, versioned on `_v`)
For each day in `S.custom`: concat block arrays in block-time order
(`mainwork_am, gym, lunch, mainwork_pm, flex, evening, weekend`, then any unknown orphan keys)
into `custom[day].list`; `parking` preserved; all other keys dropped. Every `taskMoves[day][tid]`
entry (block-id or `__moved__`) becomes `S.skips[day][tid] = true` (the visible copy already
lives in the folded custom arrays — old code always created a custom copy on move), then
`S.taskMoves` is deleted. Recurring `block` fields deleted. Work seeds appended if missing.
Done-state continuity: `done[day].nn_parcels/nn_list` copied to the matching
`rec_work_*_<dow>` id per weekday so history and today's ticks survive the id change.
Idempotent (gated on `_v < 4`); runs on startup, import, and every `adoptState()` sync pull,
so an un-migrated payload pushed by an old client is re-migrated on pull.

## Verification evidence
1. **Boot harness (TDZ)** — extracted inline script executed in the stubbed-DOM Node harness
   (`boot-lib.js`): `node --check` OK, boot OK, `S._v = 4`, 13 recurring (10 work + 3 gym).
2. **Migration unit test** (`migration-test.js`) — 24/24 PASS: fold order
   (`ct_a,ct_g,ct_p,ct_e` = am→gym→pm→evening), weekend + orphan-flex keys folded, parking
   untouched, done preserved + carried to seed ids, taskMoves deleted, `__moved__` and block-id
   overrides → skips, recurring `block` dropped, `_v=4`; second `migrateState` run byte-identical
   (no-op); `adoptState(un-migrated payload)` migrates, deletes taskMoves, keeps skips, re-seeds
   gym without block, runs ensureCountdowns; `listTasks` order semantics + `S.order` override.
3. **Headless Chrome renders** — seeded a PRE-migration (v3) state (so Chrome exercised the real
   migration): today with 4 block-keyed tasks + 2 events (one MUFC) + yesterday's unticked task,
   a past day with a done task, a future day, a weekend day. 8 screenshots at 550px and 1200px,
   all eyeballed:
   - today: TODAY card 0/7 + progress bar; event strip (14:00 amber EVENT, 16:30 red MAN UTD);
     "Chase VAT receipt ↩ YESTERDAY" carry at top; migrated tasks in block-time order after the
     recurring seeds; Parking Lot 0/2 (template + migrated parked task); "8 to go" nudge;
     sidebar shows streak 2 / 0-7 done / 0-3 non-negs, no "blocked" pill. No overflow at 550px.
   - past day: LOOKING BACK card "1/4 tasks done", MONDAY card 1/4 with part-filled bar, done
     task struck through — history preserved through migration.
   - future day: PLANNING AHEAD card, FRIDAY 0/3 (work seeds + migrated custom, no Gym — Friday
     isn't a gym day), short-day banner.
   - weekend: SATURDAY card with weekend-key task folded into the flat list, no NN strip, no
     non-negs pill, parking card rendered.
4. **Interaction smoke** (`interaction-test.js`) — 27/27 PASS: tick/untick (incl. home-day
   ticks), quick-add to list & parking (duration parsed), move-to-tomorrow re-keys custom,
   recurring move = skip + one-off copy with recurrence untouched, carry-over
   appears/tick-stops/dismiss-stops/returns-on-untick, 3-day-old task quietly stops, reorder
   writes `S.order` and changes `listTasks` order, cross-zone drop list→parking, date-pick move,
   `render()` clean on today and past days.
5. **Streak regression** — on the migrated state, completing all NN via `checkStreak()`
   incremented `streakCount()` (PASS in migration-test); real-Chrome screenshot independently
   shows the seeded 2-day streak surviving migration.

## Deviations from the spec (smallest-surprise calls, flagged)
1. **Old TEMPLATE work tasks re-homed as recurring seeds.** The spec deletes TEMPLATE and only
   names the gym seeds, but the approved mockup shows "Pack & post orders" / "List stock on
   eBay" in the TODAY list. Deleting TEMPLATE silently would have dropped them, so they became
   10 weekday recurring tasks (`rec_work_*_<dow>`), with done-state copied from the old
   `nn_parcels`/`nn_list` ids during migration.
2. **Carry dismissal keyed by home day.** Spec says dismissal "stops" the carry and gives the
   shape `S.carryDismissed[day][taskId]`; keying by the task's home day makes dismissal
   permanent (matches "stops it") rather than per-viewing-day.
3. **Carry scope = custom tasks only.** "Any task unticked on yesterday's list" intersected
   with "recurring tasks do NOT carry" and the weekly sidebar having its own day mechanics:
   only `list` custom tasks carry. Weekly tasks keep their existing day-pill affordances.
4. **Short-day (Daisy pickup) banner kept.** Not in the spec's DELETED list; it's a pickup
   reminder, not block engine. Its copy still says "~4.5h work" — trivially editable if unwanted.
5. **Date-context card extended to weekends.** Spec asks for a date-contextual line for
   today/past/future; the existing LOOKING BACK / PLANNING AHEAD focus-card was kept for all
   non-today days (previously weekday-only). Today gets no extra line (greeting covers it).
6. **Parking Lot rendered on weekends too** (previously weekday-only) — the spec's day-view
   layout lists the Parking card unconditionally.
7. **Dead block CSS left in place** — removal would have been a large, unreviewable cosmetic
   diff with zero behaviour change.
8. **PA copy lines** in `renderPaText` that referenced blocks/EOD wrap were minimally reworded
   (consumer of removed concepts).

## Open risks
- Old ticks on the template ids from BEFORE migration day render correctly (done copied to the
  new ids), but a device running the OLD client after another device migrated will briefly show
  block view of migrated data until its update toast lands — the spec accepts this overlap.
- `S.order` stores displayed ids including recurring ids (`rec_work_*_<dow>`), so a manual
  order set on one Monday also applies to future Mondays for those recurring rows — arguably a
  feature; flagged for awareness.
- Harness `setTimeout` is a no-op, so post-render focus/scroll callbacks are untested in Node;
  they are unchanged patterns from the old code and exercised in the Chrome renders.
