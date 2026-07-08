# MUFC fixture auto-refresh — progress

## Phase 1: Premier League auto-refresh (2026-07-08) — implemented, reviewed, verdict: SHIP
- Static seed table: 4 moved fixtures corrected (Ipswich H 30 Aug 16:30, Everton A 6 Sep 14:00, Man City H 13 Sep 16:30, Fulham A 20 Sep 16:30). Table remains add-only.
- New `refreshMufcFixtures()`: ESPN `soccer/eng.1/teams/360/schedule?fixture=true`, 3-day throttle (localStorage `dailyOS_mufcFixtureCheck`, stamped on success only), updates mufc events' date/time in place by canonical text match, adds missing via `ensureEvent` (same option shape as seeder), never deletes, silent failure, `save()+render()` on change. Called via `setTimeout(…, 3000)` at startup; NOT in adoptState.
- Verified: Node boot harness (no TDZ), 38/38 live fixtures map to seed texts, mocked e2e (update/add/persist/throttle).

### Reviewer non-blocking notes (accepted, logged for future)
1. Static-table date fixes are inert for existing installs (ensureEvent matches by text only) — existing devices get corrected dates via the live refresh, which is the feature's purpose.
2. Throttle timestamp stamped before `_applyingRemote` guard — a coinciding adopt window could skip one 3-day cycle. Self-corrects.
3. Narrow race: cloudPull→adoptState between mutation and debounced push can drop in-place updates for one cycle. Self-corrects next refresh.
4. Refresh-path `render()` doesn't guard active inputs (fires ~once/3 days, 3s after load). Negligible.
5. Dead alias entry `'Manchester United'` — harmless.
6. Name matching keys on ESPN `displayName`; a mid-season rename or promoted-club mismatch creates a visible duplicate rather than an update (never-delete keeps it safe).

## Phase 2 (proposed, not started): cup competitions
- ESPN feeds confirmed live for team 360: `eng.fa` (FA Cup), `eng.league_cup` (Carabao), `uefa.champions`, `uefa.europa` — same endpoint/format as eng.1. Empty events when not participating / draw not made, so safe to poll all unconditionally.
- Design care needed: text collisions (PL + cup tie vs same opponent, same venue → same canonical text would wrongly move the PL game). Cup events need a competition marker in the text (e.g. "Man Utd vs Chelsea (H) · FA Cup") and matching must include it. Cup fixtures appear automatically once draws are made — refresher picks them up on its 3-day cycle.
- Note: FA Cup/UCL/Europa feeds still showed season 2025-26 "Final" on 2026-07-08 (season rolls over later); Carabao already on 2026-27.
