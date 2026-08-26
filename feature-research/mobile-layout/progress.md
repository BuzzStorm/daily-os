# Mobile Layout Overhaul — Progress

## Phase 1 — implemented (2026-08-26), awaiting review

- Shipped: viewport-fit=cover; safe-area padding; compact countdown strip (~41px/pin, was ~250px); single-line scrollable day-nav with active-day centring via nav.scrollLeft (only JS added; reviewer-flagged scrollIntoView replaced — it could jump document scroll on every render); NN strip label-above-chips with 40px tap chips; header compaction; CSS-order sidebar reorder (Events > Quick Add > Search > Weekly); 26px .tck + 28px touch hit areas; minimal 480px block. All inside max-width media queries; desktop verified pixel-identical at 1350px.
- Key decisions: sidebar safe-area padding is env()-only (base padding is 0 — plan's 20px would double-indent sections); .pa-strip pinned order:5 (plan omitted it; default 0 would move it to second); .tck.done::after checkmark rescaled with the 26px box; theme-color meta already existed.
- Verified: mobile 375x812 DOM checks all pass, zero console errors (reload + tick/untick + week nav); desktop baseline values unchanged.
- Not committed/pushed. Next: reviewer diff pass → Ben approval → commit+push to master → real-iPhone safe-area check.
- Phase 2 candidates (out of scope): touch drag-reorder, collapsible Quick Add / bottom nav, floating add button, sync key rotation.
