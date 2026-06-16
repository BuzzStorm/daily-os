# Pinned Countdown Hero — Design

**Date:** 2026-06-16
**Status:** Approved

## Problem

Ben wants a clear, motivating countdown to a single important future event —
specifically Benson's stag (Marbella, 4 Sep 2026) — to create urgency around
getting back in the gym. The existing "Upcoming Events" list only looks 60 days
ahead and shows a tiny `Xd` badge, so a ~80-day-out event doesn't even appear,
and there's no prominent single-goal countdown.

## Solution

A **pinnable countdown hero banner**. Any event can be pinned as *the* countdown
(one at a time). The pinned event renders as a prominent hero card at the top of
the main dashboard column, showing days-to-go and a "training runway" progress bar.

### Data model

Add to state (with default + idempotent seed):

- `S.pinnedCountdown` — `{ eventId, pinnedAt }` or `null`.
  - `eventId`: id of the pinned event.
  - `pinnedAt`: `yyyy-mm-dd` the pin was set — anchors the runway bar.
- `S._stagSeeded` — guard flag (mirrors existing `_daisyEvents` pattern) so the
  stag event is seeded into `S.events` exactly once and auto-pinned.

Seeded stag event: `{ text: "Benson's Stag", date: '2026-09-04', repeat: 'none',
location: 'Marbella' }`.

### Components

1. **`pinnedTarget()`** — resolves `S.pinnedCountdown` to `{ ev, evDate, diffDays }`.
   - Computes the next occurrence (handles `yearly`/`monthly`/`weekly`, same logic
     as `getUpcomingEvents`), but is **not** capped at 60 days.
   - One-off event whose date has passed → returns `null` and the stale pin is
     cleared. Deleted event (id not found) → same.

2. **`renderCountdownHero()`** — returns the banner HTML string (or `''`).
   Injected at the top of `renderMain()`, right after the `.hdr` block, so it sits
   above the focus card on every day view.
   - Title: `⏳ {TEXT}` + optional `· {LOCATION}`.
   - Big days number + label (`DAYS TO GO` / `DAY TO GO`; `diffDays === 0` → `TODAY`).
   - Runway bar: `pct = clamp((today − pinnedAt) / (evDate − pinnedAt) × 100, 0, 100)`.
     Guard against zero/negative span (pinned same day as event).
   - Target date, e.g. `Fri 4 Sep`.
   - Small `×` to unpin.

3. **Pin controls.**
   - Each `.ev-item` row in the Upcoming Events list gets a pin toggle; the active
     pinned event is visually highlighted.
   - The event edit modal gets a "Pin as countdown" / "Unpin" toggle for discoverability.
   - `togglePinCountdown(eventId)`: unpins if already pinned, else pins (records
     `pinnedAt: today()`).

### Styling

New `.countdown-hero` CSS reusing existing theme tokens (`--accent`, `--s1`,
`--border2`, the `focus-countdown-bar`/`-fill` pattern) so it reads as native, not
bolted on.

### Edge cases

- No pin set → banner hidden.
- Pinned event deleted or one-off date passed → pin auto-cleared, banner hidden.
- Runway span ≤ 0 → bar shown at 0% (no divide-by-zero).
- Repeat events supported via next-occurrence calc.

## Out of scope (YAGNI)

- Multiple simultaneous pinned countdowns.
- Hour/minute/second live ticking — day granularity is enough for the motivation goal.
- Notifications tied to the countdown (events already have their own reminders).
