# Focus-First Layout Refresh — Design

**Date:** 2026-06-16
**Status:** Approved (mockups confirmed via visual companion)

## Problem

The dashboard reads as a flat wall of equally-weighted bordered boxes. The strong
"Focus now" card is immediately buried under a capacity banner, the
non-negotiables strip, and a progress bar before the user reaches the actual day.
Stats are duplicated (sidebar pills *and* a main-column progress bar). Nothing
ranks above anything else, so the page never answers "what do I do right now?" in
under a second. Ben described it as cluttered, "all in your face," not light.

## Decision

Shift to a **Focus-First** hierarchy without removing any capability. This is a
visual-weight + reordering refactor — the app already folds events inline into the
day chronologically, collapses past blocks, and has quick-add/parking/evening
modes. All of that stays.

### Main column (weekday), top to bottom
1. **Header** + week strip (unchanged — day navigation preserved).
2. **Pinned countdown strip** — compacted into headline-sized cards (was a 46px
   number block; now ~30px, tighter padding) so they read as standing goals, not
   giant banners that out-shout the focus.
3. **Focus hero** — enlarged (`.focus-title` 18px → 26px, more padding). The single
   dominant element. All existing states kept: FOCUS NOW / ON BREAK / OFF THE
   CLOCK / NEXT UP.
4. **Day-header hero** for non-today weekdays (new): a calm "PLANNING · {Weekday}"
   header with task count + first item, so navigating days isn't headerless.
5. Capacity banner + **lightened** non-negotiables strip (card box removed; chips
   carry the visual).
6. The day's timeline (blocks + inline events) — unchanged behaviour.
7. Quick-add (unchanged, always visible).

### Removed
- The main-column progress bar (`.prog` / `.prog-detail`). The identical numbers
  (done / non-negs / hours blocked / streak) already live in the sidebar stat
  pills, so this was pure duplication and a major source of top-of-page clutter.

### Sidebar — calendar rail
- `renderEvents()` regrouped into **This week / Next week / This month / Later**
  buckets, sorted nearest-first, cap raised from 8 so the full look-ahead shows.
  Holiday/reminder/pin/location tags preserved. Pinned events still tagged.

## Preserved (explicitly, per Ben)
Quick-add, per-block add, parking lot, tick/toggle, move-to-another-day (⇄), drag
reorder, edit task/event modals, pin/unpin countdowns, day navigation, weekend
view, evening mode. Nothing is removed — only repositioned and re-weighted.

## Out of scope (this pass / YAGNI)
- A full month-grid calendar view (the existing `toggleCalendar` date-picker stays).
- Collapsing the active task list behind an expander — kept always-visible since
  Ben actively adds/ticks/moves throughout the day.

## Verification
Ben reviews `index.html` locally (open in browser) before any commit/push.
