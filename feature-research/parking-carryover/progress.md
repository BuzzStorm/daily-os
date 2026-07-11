# Parking Lot carry-over (2026-07-11)

**Why:** Unticked Parking Lot tasks (e.g. Fri 10 Jul's "Get TeeCaddie LIVE", "Get
Samples for Mothered") silently stayed on their home day — `getCarryTasks()` only
read `.list`, never `.parking`, by original design ("Parking Lot never carries").
Ben wants parked tasks to follow him automatically until done: "it's extra work
if I get time."

## What changed (index.html only)

- **`getParkingCarries()`** (after `getCarryTasks`): today-only surface scan of all
  past `S.custom[day].parking` arrays. Skips done-on-home-day, `carryDismissed`,
  and anything already physically in **today's** parking (guards against a
  stale-device cloud pull resurrecting an already-purged day → duplicate rows;
  reviewer-caught). No day cap — a parked task follows until ticked or dismissed.
  Read-only: no state mutation, so no sync-dirty concerns.
- **`renderParkingLot()`**: renders carries first with the `↩` chip (same
  `sdTaskRow(..., {carry:true})` mechanics as the day card — ticking marks done
  on the home day, ✕ dismisses via `carryDismissed`). Carries excluded from the
  header done-count, consistent with the day card.
- **`carryChipLabel(home)`**: chip now says `↩ YESTERDAY` only for 1-day-old
  carries, otherwise the home date (`↩ 8 JUL`). Also applies to main-list
  2-day-back carries (previously mislabelled "YESTERDAY").
- **Clean-old-data purge (~line 4450)**: rescue block moves unticked,
  undismissed parked tasks into today's parking *before* their >30-day-old home
  day (and its done-state) is deleted — otherwise "no day cap" would silently die
  at the purge horizon. Dedup by id = idempotent across relaunches/cloud
  resurrections. Runs inside the existing purge block → reaches `saveLocal()`
  only, per the HARD RULE (no `save()` from automatic mutations).

## Verification

Stubbed-DOM Node boot harness (session scratchpad: `boot-lib.js`,
`parking-carry-test.js`) — 26/26 PASS: clean boot (no TDZ), carry filtering
(done/dismissed/main-list excluded, no day cap), resurrection dedupe, purge
rescue + idempotency, toggle-on-home-day, dismiss, main-list carries unaffected.
Reviewer agent verdict: ship (after the resurrection-dedupe fix, applied).

## Not done / notes

- Working tree also had unrelated `.ev-now` CSS + `renderEvents` "this week"
  highlight edits not made in this session — keep commits separate.
- Carry-row body click is a silent no-op (pre-existing for main-list carries too).
- Once purge-rescued, a task renders as a plain today task (chip gone). Fine.
- Not committed/pushed yet (needs Ben's go-ahead; PWA only updates on deploy).
