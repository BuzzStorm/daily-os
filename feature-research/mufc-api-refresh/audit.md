# Audit — MUFC self-updating fixtures (ESPN API)

## Files changed
- `C:\Users\Ben\DailyOS\index.html` (modified — only file touched besides this audit)

## What changed per file

### index.html

**1. Static seed table updates (inside `ensureMufcFixtures()`, ~lines 2326–2330)**
Four stale rows updated to the confirmed moved dates/times:
- Man Utd vs Ipswich Town (H): 2026-08-29 15:00 → 2026-08-30 16:30
- Everton vs Man Utd (A): 2026-09-05 15:00 → 2026-09-06 14:00
- Man Utd vs Man City (H): 2026-09-12 15:00 → 2026-09-13 16:30
- Fulham vs Man Utd (A): 2026-09-19 15:00 → 2026-09-20 16:30
Table remains add-only (seeds via `ensureEvent`, which only adds when text is missing).

**2. New `refreshMufcFixtures()` + `MUFC_FIXTURE_CHECK_LS` const (~lines 2379–2447, right after the `ensureMufcFixtures()` startup call)**
Async hoisted function declaration, entire body in try/catch (failures → `console.warn`, silent to user):
- Throttle: bails if `localStorage['dailyOS_mufcFixtureCheck']` is < 3 days old. Timestamp written only after a successful fetch+parse, so failed checks retry next load.
- Fetches `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/360/schedule?fixture=true`; bails on non-ok or missing `json.events`.
- Per event: finds Man Utd (team id '360') and opponent in `competitions[0].competitors`; maps opponent `displayName` through an 8-entry alias map (falls back to `displayName` — see deviations); builds canonical text `'Man Utd vs X (H)'` / `'X vs Man Utd (A)'`; converts `event.date` (UTC ISO) to device-local via `new Date(...)` + `toDateStr()` + padded `getHours()/getMinutes()`.
- Applies: guard `if (_applyingRemote) return;` immediately before mutation. Existing event (`e.mufc && e.text === text`) with differing date/time → updated in place; missing → added via `ensureEvent` with the seeder's exact option shape (`repeat:'none', mufc:true, quiet:true`). Never deletes.
- If anything changed: `save(); render();` — `save()` is the file's standard persist path (localStorage + `scheduleCloudPush()`).

**3. Call site (~line 5520, end of script next to the other deferred startup work)**
`setTimeout(refreshMufcFixtures, 3000);` after the initial `setTimeout(checkReminders, 2000)`. NOT called from `adoptState` (per spec).

## Deviations from the plan
1. **Alias-map fallback is `displayName`, not `shortDisplayName`.** The spec said fall back to ESPN `shortDisplayName`, but also required all 38 texts to match the seed table and listed 'Hull City', 'Ipswich Town', 'Coventry City', etc. as "pass through unchanged". Live API check showed `shortDisplayName` values ('Hull', 'Ipswich', 'Coventry', 'C Palace', 'Nottm Forest', 'Spurs', 'Leeds') do NOT match the seed table, while `displayName` does for every non-aliased club. Falling back to `shortDisplayName` would have created duplicate events for 7 clubs. Verified: 38/38 canonical texts match the seed table with the `displayName` fallback.
2. **Persist/push done via `save()`** rather than separate localStorage write + `scheduleCloudPush()` calls — `save()` is the file's single established pattern and includes both (plus the rolling backup), matching "same pattern the rest of the file uses".

## Verification results
Harness + tests in scratchpad (`boot-harness.js`, `mapping-test.js`, `e2e-test.js`), Node v24.

1. **Boot / TDZ check**: extracted the 151,933-char inline script, executed under `vm.runInContext` with stubbed document/window/localStorage/navigator/fetch/crypto etc. → `BOOT OK: no top-level errors`. Post-boot sanity in same context: `refreshMufcFixtures` is a function, throttle key constant correct, 38 mufc events seeded, and the 4 moved fixtures carry the new dates/times.
2. **Mapping test vs live ESPN API**: 38 events fetched, 38 transformed, **38/38 canonical texts match** the seed table. Moved fixtures from the API: Ipswich (H) → 2026-08-30 16:30, Everton (A) → 2026-09-06 14:00, Man City (H) → 2026-09-13 16:30, Fulham (A) → 2026-09-20 16:30 (device-local, Europe/London).
3. **End-to-end mocked-fetch test in the boot harness**: moved a fixture (Tottenham H → 2026-10-11T15:30Z) and injected an unknown fixture (Wolves A, exercising the alias map). Result: existing event updated in place to 2026-10-11 16:30, Wolves event added with full seeder option shape (mufc count 38→39), state persisted to localStorage under STORAGE_KEY, throttle timestamp written, and a second call made **zero** additional fetches (throttle bail confirmed).
4. `git diff --stat`: only `index.html` modified (74 insertions, 4 deletions). Nothing committed or pushed.

## Open risks
- If ESPN renames a club's `displayName` mid-season (or a promoted club not in the alias map has a displayName differing from any future seed entry), the refresher would add a new event alongside the old one rather than updating it (never deletes, by design). Low likelihood; self-corrects visually since the old event keeps its stale date.
- Kick-off times render in the device's timezone; a device outside the UK will show local kickoff times, which is arguably correct behavior but differs from the UK-time static table.
- The `_applyingRemote` guard skips a refresh cycle if a sync pull is mid-flight; the next 3-day window retries. No churn risk, slight staleness possible.
