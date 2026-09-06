# Mobile Layout Overhaul — Progress

## Phase 1 — implemented (2026-08-26), awaiting review

- Shipped: viewport-fit=cover; safe-area padding; compact countdown strip (~41px/pin, was ~250px); single-line scrollable day-nav with active-day centring via nav.scrollLeft (only JS added; reviewer-flagged scrollIntoView replaced — it could jump document scroll on every render); NN strip label-above-chips with 40px tap chips; header compaction; CSS-order sidebar reorder (Events > Quick Add > Search > Weekly); 26px .tck + 28px touch hit areas; minimal 480px block. All inside max-width media queries; desktop verified pixel-identical at 1350px.
- Key decisions: sidebar safe-area padding is env()-only (base padding is 0 — plan's 20px would double-indent sections); .pa-strip pinned order:5 (plan omitted it; default 0 would move it to second); .tck.done::after checkmark rescaled with the 26px box; theme-color meta already existed.
- Verified: mobile 375x812 DOM checks all pass, zero console errors (reload + tick/untick + week nav); desktop baseline values unchanged.
- Phase 2 candidates (out of scope): touch drag-reorder, collapsible Quick Add / bottom nav, floating add button, sync key rotation.

## Phase 1 — SHIPPED (2026-08-26)

- Reviewer verdict: fix-first → blocking scrollIntoView issue fixed (strip-scroll via nav.scrollLeft, scrollY 913→913 re-test) + week-arrow min-width nit. Verdict then ship.
- Ben approved; committed as 52a1cd0, pushed to master (GitHub Pages live).
- Awaiting: Ben's real-iPhone check (safe areas around Dynamic Island / home bar are the one thing only a real device proves).
- Reviewer's non-blocking notes for phase 2, beyond the candidates above: Quick Add .sb-sec stranded inline border/background after reorder (doubled rule vs Events); nth-child sidebar order selectors are position-coupled (add classes/ids); .sd-grip more prominent on touch but iOS HTML5 drag is dead; .cd-hero-bar absolute-position comment; env() shorthand fallback on pre-2017 engines.
