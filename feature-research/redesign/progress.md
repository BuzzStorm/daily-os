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

## Phase 2 — layout (not started)
Sidebar folds into the flow ("Coming up" list under the day, one inline add box, search →
icon); top bar restructure (date + week strip + utilities, greeting decision); "Now" line
at the top of the day; done-row band colour / sort revisit; delete dead CSS.

## Phase 3 — row information (not started)
Category chip with colour dot, duration, ↻ for repeats, "from <day>" carry chip; notes
treatment.
