# Mobile Layout Overhaul — Phase 1 Plan

**Goal**: On phones (<900px, primarily 375–430px wide), DailyOS reads as a designed mobile app: actionable content first, nothing wrapped or broken, proper tap targets, correct iPhone PWA safe areas. Desktop rendering must be pixel-identical (every change lives inside `max-width` media queries or is a no-op on desktop).

**Approved by Ben**: pinned countdowns become a compact strip on mobile (big cards stay on desktop).

## Project invariants (MUST follow)

- Single-file app: all UI code in `index.html`. No build step.
- **No state schema changes** in this phase → no `DATA_VERSION` migration needed, no `setSyncDirty` calls. Do not touch any `S.*` write path.
- `renderCountdownHero` (3564) mutates state and calls `save()` during render — restyle its OUTPUT via CSS only; do not call it from any new path or change its logic.
- `sw.js` is network-first — no cache-version bump needed.
- Deploy = commit + push to `master` (GitHub Pages). Do NOT push until Ben approves the reviewed implementation.
- Dev preview: `.claude/launch.json` config `daily-os`, port 8741.
- Line numbers below are pre-edit anchors; they shift as edits land — locate by selector/content, not blindly by number.

## Files touched

1. `index.html` — all functional changes (CSS media blocks, viewport meta, theme-color meta, ~5 lines JS in `renderMain`)
2. `feature-research/mobile-layout/audit.md` — implementer's audit (new)
3. `feature-research/mobile-layout/progress.md` — phase status (new)

Nothing else. `manifest.json`, `sw.js`, seeds, state logic: untouched.

## Implementation steps

All CSS goes into the existing `@media (max-width: 900px)` block (1858–1862), extended in place; add a narrower `@media (max-width: 480px)` block after it only where noted.

### 1. Head fixes (only non-media-query changes)
- Line 5 viewport meta → `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`
- Add `<meta name="theme-color" content="#1b1e28">` next to it (manifest sets it, but the HTML meta controls browser chrome / PWA top area live).

### 2. Safe areas (<900px)
- `.main` and `.sidebar`: horizontal padding via `calc(20px + env(safe-area-inset-left/right))`; `.main` top padding `calc(existing + env(safe-area-inset-top))`; `.sidebar` bottom padding `calc(existing + env(safe-area-inset-bottom))` (home-indicator clearance). `env()` is 0 outside standalone iOS, so this is a no-op elsewhere.

### 3. Compact countdown strip (<900px)
Restyle `.cd-hero-row` (240) / `.cd-hero` (246) children into one slim row per pin:
- `.cd-hero-row`: column, gap 8px.
- `.cd-hero`: `display:flex; align-items:center; gap:10px; padding:10px 14px;` — single-line layout: label (`.cd-hero-label`, keep) · days number (`.cd-hero-num` shrunk to ~16px, inline) + unit (`.cd-hero-unit` ~9px) · target date (`.cd-hero-date`) pushed right · unpin `×` (keep tappable, min 28px hit).
- `.cd-hero-bar` (299): keep but as a 2px full-width strip absolutely positioned at the card's bottom edge (progress still visible, no vertical cost). Hide `.cd-hero-foot` if it duplicates the date.
- `.cd-hero-loc` (267): hide at <480px.
Result target: each pin ≤ ~44px tall instead of ~250px.

### 4. Day-nav strip — no wrapping (<900px)
- `.day-nav` (128): `flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch;` hide scrollbar (`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`); `.day-btn` `flex:0 0 auto`, min-height 36px.
- JS (only JS in this phase): at the end of `renderMain` after `el.innerHTML = htm` (3787), if `window.matchMedia('(max-width:900px)').matches`, `scrollIntoView({inline:'center', block:'nearest'})` the `.day-btn.active` inside `.day-nav`. Guarded so desktop is untouched.

### 5. Non-negotiables strip (<900px)
- `.nn-strip` (599): `flex-direction:column; align-items:stretch; gap:8px`.
- `.nn-strip-label` (609): full-width line above chips.
- `.nn-strip-items` (618): `flex-wrap:wrap; width:100%`.
- `.nn-chip` (624): min-height 40px, padding up — real tap targets, no squeeze.

### 6. Header compaction (<900px)
- `.greeting` (115): font-size down to ~24px, margin tightened.
- `.hdr` (108): reduce top/bottom margins.
- `.date-line` already flex-wraps (shipped earlier) — no change.

### 7. Sidebar section order + weight (<900px)
Sidebar children are static blocks (1872–2003) in a flex column at <900px — reorder with CSS `order` only, no DOM moves:
1. `.sb-top` (stats strip + icon actions) — stays first, acts as the divider (`order:0`)
2. Events section (1946) — `order:1` (the list people actually check on phone)
3. Quick Add section (1910) — `order:2`
4. Search (1900) — `order:3`
5. Weekly (1991) — `order:4` (already collapsed by default)
Use explicit `order` on each of the five wrappers so intent is readable.

### 8. Tap targets (<900px, plus `(hover:none)` block at 1010)
- `.tck` (854): 20px → 26px; keep visual proportions (border-radius scales).
- `.day-btn` (136): padding up (see step 4).
- In the `(hover:none)` block: bump `.t-rm` / `.t-move` / `.sd-grip` font-size and give `.t-rm`/`.t-move` min 28px square hit area (padding), opacity 0.45 → 0.6.

### 9. `@media (max-width: 480px)` block (new, after 900px block)
Only: `.cd-hero-loc{display:none}`, `.main` horizontal padding 20px → 14px, `.sd-count`/`.sd-title` size trim if needed after visual check. Keep this block minimal.

## Verification (implementer must do all before reporting done)

1. Preview via launch config `daily-os` (port 8741), `resize_window` mobile preset (375×812):
   - No horizontal page overflow (`document.documentElement.scrollWidth <= clientWidth`)
   - Day-nav on one line, active day visible; countdown pins ≤ 50px tall each; NN label above full-width chips
   - `.tck` computed size 26px; sidebar section DOM order per step 7 (`getComputedStyle(...).order`)
2. Desktop check at default pane size: countdown cards still big, sidebar right column, day-nav unchanged — compare against pre-change behavior (zero visual diff expected).
3. Zero console errors after reload + a tick/untick + week navigation.
4. Write `feature-research/mobile-layout/audit.md`: every selector touched, with before/after line refs.

## Out of scope (phase 2 candidates — do NOT build now)

- Touch drag-to-reorder (HTML5 drag doesn't fire on iOS)
- Collapsible Quick Add / tabbed or bottom-nav layout
- Floating add button
- Key rotation for sync
