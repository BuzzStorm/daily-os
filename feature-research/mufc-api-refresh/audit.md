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

---

# Phase 2 — cup competitions (2026-07-08)

## Files changed
- `C:\Users\Ben\DailyOS\index.html` (modified — only file touched besides this audit)

## What changed per file

### index.html — `refreshMufcFixtures()` rewritten (~lines 2379–2493)
All changes are confined to the LIVE FIXTURE REFRESH block; the static seed table, `ensureEvent`, and the startup call site are untouched.

1. **New `MUFC_COMPETITIONS` const** (next to `MUFC_FIXTURE_CHECK_LS`): 5 entries — `eng.1` (suffix `''`, keeps phase-1 canonical text exactly), `eng.fa` (` · FA Cup`), `eng.league_cup` (` · Carabao Cup`), `uefa.champions` (` · Champions League`), `uefa.europa` (` · Europa League`).
2. **Per-competition fetch loop**: `Promise.all` over the 5 codes, same endpoint pattern, each fetch+parse wrapped in its own inner try/catch so one feed failing (network, non-ok, bad shape) never affects the others. Empty `events` arrays fall through silently. `leagueOk` flag set only after eng.1 fetches AND parses.
3. **Stale-season guard**: each event's UTC kickoff → device-local `toDateStr`; anything strictly before today (device-local) is skipped before it reaches the fixtures list. (Applies to eng.1 too — a past league fixture is now never updated either; see deviations.)
4. **Canonical text**: phase-1 text + competition suffix, so league and cup ties vs the same opponent at the same venue can never collide.
5. **Duplicate-text pairing**: fixtures grouped by text (`Map`); per text, API fixtures sorted by date+time are paired in order against stored `e.mufc && e.text === text` events sorted by date+time. Paired → date/time updated in place; unpaired API fixtures → `ensureEvent` first (phase-1 shape: `repeat:'none', mufc:true, quiet:true`), and if it refuses (it dedupes by text — e.g. a second fixture sharing a text just added in this loop), direct `S.events.push({ id: uid(), ... })` with the identical shape ensureEvent uses. Never deletes.
6. **Throttle**: single 3-day `dailyOS_mufcFixtureCheck` timestamp kept; stamped only when `leagueOk` (cup failures don't block the stamp; eng.1 failure leaves it unstamped for retry next load).
7. **Unchanged**: `_applyingRemote` guard (still between stamp and mutation), `save(); render();` only when something changed, outer try/catch with `console.warn` (total silence to the user).

## Deviations from the plan
1. **Stale-past guard also applies to eng.1** (spec rule 3 says "skip any event whose kickoff is before today" without exempting the league). Behavioral delta vs phase 1: a league fixture already played can no longer be date-corrected. Harmless — updating past fixtures was never useful, and it protects against ESPN serving stale league seasons too.
2. **Unpaired adds try `ensureEvent` first, direct-push only on refusal** — exactly the contingency the spec described; verified ensureEvent dedupes on ANY event with the same text (`S.events.some(e => e.text === match)`), so the direct-push branch is required for the second same-text fixture.
3. **None otherwise** — files touched, option shapes, throttle key, and guard order all match the spec.

## Verification results
Harness + tests in scratchpad (`boot-lib.js` shared boot module, `boot-harness.js`, `live-test.js`, `e2e-phase2.js`), Node v24.

1. **Boot / TDZ check**: extracted 154,685-char inline script executes under `vm.runInContext` with stubbed DOM → `BOOT OK: no top-level errors`; sanity: `refreshMufcFixtures` is a function, throttle key correct, 38 mufc seeds present with phase-1 corrected dates.
2. **Live 5-feed test** (real ESPN, real `refreshMufcFixtures()` in the booted app):
   - eng.1: 38 raw events, 0 stale-filtered, **38/38 canonical texts match** the stored seed texts; running the real function changed nothing (seed already current) and stamped the throttle.
   - eng.fa / eng.league_cup / uefa.champions / uefa.europa: **all now return `events: []`** (ESPN has cleared last season's data since the phase-2 notes were written — previously they served 2025-26 "Final"). Handled silently, 0 events added, 0 past-dated events present. The stale-skip path therefore had no live data to exercise and is instead proven by the mocked e2e (A3).
3. **Mocked e2e in the booted app context — 18/18 PASS**:
   - A1 cup event added with suffix (full option shape verified)
   - A2 league fixture vs same opponent/venue untouched by the cup tie (coexistence)
   - A3 past (stale-season) cup event skipped
   - A4 second cup competition applied in the same run
   - A5/A6 throttle stamped; skipped past cup event didn't touch the same-opponent league fixture
   - B1–B3 duplicate-text pairing: two stored UCL events, API (deliberately out of order) moves the second → correct event updated in place (same id), first untouched, no dupes/deletes
   - C1 two same-text API fixtures with nothing stored → both added with distinct ids (direct-push branch exercised)
   - D1–D3 failure isolation: eng.fa throws + uefa.champions bad shape → eng.1 update and Carabao add still applied, throttle stamped
   - E1–E3 eng.1 throws → throttle NOT stamped, cup fixture still applied, league fixture untouched
   - F1/F2 first run fetches exactly 5 feeds; second run within 3 days fetches zero
4. `git diff --stat`: only `index.html` modified. Nothing committed or pushed.

## Open risks
- Phase-1 risks all still apply (displayName renames, device-local kickoff times, `_applyingRemote` skip cycle).
- Pairing is by date order within a text: if a cup text has a stored PAST event (already played) plus a new future tie with the same text, the past stored event sorts first and would be paired with (and moved to) the first future API fixture. Per spec rule 4's in-order pairing; self-consistent but worth knowing.
- Alias map is league-oriented; lower-league cup opponents pass through as ESPN `displayName` verbatim (e.g. "Grimsby Town"), which is the desired display anyway.
- Cup feeds are currently empty; the first real exercise of the cup paths in production happens once ESPN publishes 2026-27 cup draws. Mocked e2e covers the shapes until then.
