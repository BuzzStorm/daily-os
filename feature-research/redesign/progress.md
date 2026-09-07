# DailyOS Redesign — Progress

## Phase 1 — type, colour, hierarchy — SHIPPED (2026-09-06)

- Shipped in working tree (not pushed): Instrument Sans + JetBrains Mono for times/counts
  only; concept palette on the existing token names; sentence-case labels everywhere;
  header pills → quiet `.hdr-link`; 36px day strip; cards `--s1`/`--border`/shadow;
  done rows recede via `:has()`; countdown cards → compact rows at every width; sidebar
  restyled in place; NN chips as row-lites.
- Review: one blocking (done-row controls lost hover-reveal) — fixed, plus 8 small
  follow-ups. See audit.md "Post-review fixes".
- Ben approved on the real-data preview; committed + pushed to master.

## Phase 2 — layout + rows + light theme — BUILT, awaiting review (2026-09-06)

- Shipped in working tree (not committed): top bar (date ▾ calendar · week strip ·
  utilities), "Now" block (first open task / Clear day, today's events with past struck),
  Today list with pinned Daily rows and informative row meta (from Ddd · category dot ·
  30m · ↻), one add box with the full parser (`addTaskFromText`; `paAdd`/`quickAdd`
  deleted), quiet right rail (Counting down · Coming up grouped per day + Later · N ·
  This week collapsed), fixed toast, no sidebar, document scroll, 1080px grid, mobile
  block rewritten, Dark | Light toggle (per-device, `dailyOS_theme`), every literal colour
  tokenised. Former "phase 3" row information is included.
- Verification + id checklist + deviations: see audit-phase2.md. Zero console errors,
  1280 / 2000 / 375 checked in dark and light.
- Decisions Ben may overrule: light --muted/--faint darkened for contrast; mobile top bar
  not sticky; parking "nothing parked" ignores the template row; short-day banner kept.
- Next: reviewer diff (plan + audit), Ben reviews on the real-data preview, then commit +
  push to master (phone runs the Pages deploy). Cloud pull with SYNC_KEY.txt returned
  null during testing — check the key before relying on it.

## Phase 3 — row information — FOLDED INTO PHASE 2

## Phase 2 — layout = mockup — SHIPPED (2026-09-07)

- Built per plan-phase2.md: top bar (date · week strip · done/streak · sync · haircut ·
  day off · search · ⋯ · Dark/Light), Now block, Today list (Daily rows, chip rows, inline
  add with the full parser — three parsers → one `addTaskFromText`), parking one-liner,
  right rail (Counting down / Coming up with `Later · N` / This week), sidebar removed,
  document scroll, 1080px grid, mobile block rewritten, light theme + toggle, dead code gone.
- Review: fix-first on two blocking (empty-lot drop zone hidden; Daily row grip spacer) —
  fixed, plus four follow-ups. See audit-phase2.md "Post-review fixes".
- Verified on Ben's real state in the isolated preview: structure, Now logic, Daily row on
  weekdays, add routing (same-day / tomorrow / every-day / this-week), rail, top-bar menus,
  toast, light/dark persistence, 375px stack, zero console errors.
- Ben approved on the real-data preview; committed + pushed to master.
