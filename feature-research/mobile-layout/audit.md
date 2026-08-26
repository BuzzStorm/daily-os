# Mobile Layout Overhaul — Phase 1 Implementation Audit

Baseline: commit aec592e (clean tree). Reviewed as working-tree diff.

## Files changed

- `index.html` — modified (all functional changes)
- `feature-research/mobile-layout/audit.md` — created (this file)
- `feature-research/mobile-layout/progress.md` — created (phase status)

Nothing else touched. `manifest.json`, `sw.js`, seeds, state logic: untouched. No `S.*` writes, no schema changes, no `renderCountdownHero` logic changes.

## index.html changes

### 1. Head (plan step 1) — line 5 (pre-edit anchor)

- Viewport meta: `width=device-width, initial-scale=1.0` → `width=device-width, initial-scale=1.0, viewport-fit=cover`
- **Deviation (no-op)**: `<meta name="theme-color" content="#1b1e28">` already existed at line 6 — plan step 1's "add" was already satisfied; nothing added.

### 2. `@media (hover: none)` block (plan step 8) — pre-edit lines 1010–1012

Before:
```css
.sd-grip, .task .t-move, .task .t-rm { opacity: 0.45; }
```
After: opacity 0.45 → 0.6; `.sd-grip` font-size 15px (base 12–13px); `.t-move`/`.t-rm` font-size 16px (base 13/14px), `min-width/min-height: 28px`, `display:inline-flex` centered — 28px square hit area.

### 3. `@media (max-width: 900px)` block (plan steps 2–8) — pre-edit lines 1858–1862, extended in place

Original three rules (`.app`, `.sidebar`, `.main`) kept; additions per selector:

| Selector | Before (base/mobile) | After (<900px) |
|---|---|---|
| `.sidebar` | no padding | `padding-left/right: env(safe-area-inset-left/right)`, `padding-bottom: env(safe-area-inset-bottom)` |
| `.main` | `padding: 0 20px 64px` | `padding: env(safe-area-inset-top) calc(20px + env(safe-area-inset-right)) 64px calc(20px + env(safe-area-inset-left))` |
| `.hdr` (108) | `padding: 28px 0 0` | `padding: 16px 0 0` |
| `.greeting` (115) | 28px | 24px |
| `.day-nav` (128) | `flex-wrap: wrap` | `nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none` + `::-webkit-scrollbar{display:none}` |
| `.day-btn` (136) | `padding: 5px 11px` | `flex:0 0 auto; min-height:36px; min-width:36px; padding:7px 12px` (min-width added per review nit — the week-arrow buttons carry inline `padding:5px 8px` that beats the media-query padding, leaving them ~26px; min-width gives them a real tap target without touching the inline styles) |
| `.cd-hero-row` (240) | row, wrap, gap 12px, margin 16px 0 8px | column, gap 8px, margin 12px 0 8px |
| `.cd-hero` (246) | block, `flex:1 1 210px`, padding 11px 14px | `display:flex; align-items:center; gap:10px; padding:10px 14px; flex:none` |
| `.cd-hero-label` (256) | flex, margin-bottom 6px | block, `order:1; flex:1 1 auto; min-width:0; margin-bottom:0`, nowrap + ellipsis |
| `.cd-hero-body` (271) | gap 12px | `order:2; flex:0 0 auto; gap:5px` |
| `.cd-hero-num` (276) | 30px | 16px, line-height 1 |
| `.cd-hero-unit` (283) | 10px | 9px, letter-spacing 1px |
| `.cd-hero-foot` (290) | margin-top 9px | `order:3; flex:0 0 auto; margin-top:0; margin-left:auto` (now shows only the date; bar pulled out below) |
| `.cd-hero-bar` (299) | in-flow, `flex:1`, 4px | `position:absolute; left:0; right:0; bottom:0; height:2px; flex:none; border-radius:0` (progress kept, zero vertical cost) |
| `.cd-hero-unpin` (316) | `position:absolute; top:10px; right:12px; font-size:16px` | static, `order:4`, 18px, 28×28px centered flex hit area, negative margins to keep the row slim |
| `.nn-strip` (599) | row, center, gap 12px | `flex-direction:column; align-items:stretch; gap:8px` |
| `.nn-strip-label` (609) | inline in row | `width:100%` (full-width line above chips) |
| `.nn-strip-items` (618) | `flex:1` | `flex-wrap:wrap; width:100%; flex:none` |
| `.nn-chip` (624) | `padding: 5px 11px` | `min-height:40px; padding:8px 14px` |
| `.sidebar > .sb-top` | order 0 (default) | `order:0` explicit |
| `.sidebar > .sb-sec:nth-child(4)` (Events, 1946) | order 0 | `order:1` |
| `.sidebar > .sb-sec:nth-child(3)` (Quick Add, 1910) | order 0 | `order:2` |
| `.sidebar > .sb-search-wrap` (1900) | order 0 | `order:3` |
| `.sidebar > .sb-sec:nth-child(5)` (This Week, 1991) | order 0 | `order:4` |
| `.sidebar > .pa-strip` (2006) | order 0 | `order:5` |
| `.tck` (854) | 20×20px, radius 4px | 26×26px, radius 5px |
| `.tck.done::after` (866) | top 3px / left 6px / 5×9px | top 5px / left 9px / 6×11px (checkmark re-centred for 26px box) |

### 4. `@media (max-width: 480px)` block (plan step 9) — new, immediately after the 900px block

- `.main` horizontal padding → `calc(14px + env(safe-area-inset-left/right))`
- `.cd-hero-loc{display:none}` (267)
- `.sd-count`/`.sd-title`: NOT trimmed — visual check at 375px showed them fitting fine (plan made this conditional "if needed").

### 5. JS addition (plan step 4) — `renderMain`, after `el.innerHTML = htm` (pre-edit 3785)

The only JS in this phase. First implementation used `scrollIntoView({inline:'center', block:'nearest'})` behind a matchMedia guard; the independent review flagged it as BLOCKING — `render()` fires on every tick and on the async MUFC refresh, and since the mobile `.hdr` sticky is neutered (`.main` is `height:auto`), scrollIntoView could scroll the document itself, yanking a user who is scrolled down back up to the header. Replaced with a direct strip-scroll that can only move the day-nav's own scrollLeft (document scroll untouchable by construction); the matchMedia guard was dropped because on desktop `.day-nav` has no overflow so `scrollLeft` stays 0:

```js
const nav = el.querySelector('.day-nav');
const dbtn = nav && nav.querySelector('.day-btn.active');
if (nav && dbtn) nav.scrollLeft = dbtn.offsetLeft - (nav.clientWidth - dbtn.offsetWidth) / 2;
```

## Deviations from plan

1. **theme-color meta not added** — already present at line 6 (plan anticipated adding it). No-op.
2. **Sidebar horizontal padding is `env()` only, not `calc(20px + env())`** — plan step 2's general wording said 20px for both `.main` and `.sidebar`, but the sidebar has zero base horizontal padding (its `.sb-sec` children carry their own). Applying the plan's own "existing + env()" pattern gives `env()` alone; adding 20px would have double-indented every sidebar section and changed mobile rendering for all browsers, not just notched iPhones.
3. **`.pa-strip` given `order:5`** — plan listed "five wrappers", omitting the sixth sidebar child (`.pa-strip`). Without an explicit order it (default 0) would have jumped from last to second, between `.sb-top` and Events. Explicit `order:5` preserves its position.
4. **`.tck.done::after` also rescaled** — not itemised in the plan, but required by step 8's "keep visual proportions": the checkmark was positioned for a 20px box and would sit off-centre in the 26px box.
5. **480px `.sd-count`/`.sd-title` trim skipped** — plan made it conditional on visual check; not needed at 375px.

## Verification results (Browser pane, launch config `daily-os`, port 8741)

### Mobile — 375×812 (resize_window mobile preset), measured via getComputedStyle/getBoundingClientRect

- Horizontal overflow: `scrollWidth 375 <= clientWidth 375` — none
- `.day-nav`: `flex-wrap: nowrap`, `overflow-x: auto`; all `.day-btn` on a single line (identical bounding-rect tops); active day button fully within viewport (scrollIntoView working); day-btn height 37px
- Countdown pins: 2 pins rendered, each **41px** tall (target ≤50px, was ~250px); label · num+unit · date · unpin on one line; 2px progress bar at bottom edge
- `.tck` computed: **26px × 26px**
- Sidebar computed `order` by DOM child: `.sb-top`=0, `.sb-search-wrap`=3, Quick Add=2, Events=1, This Week=4, `.pa-strip`=5 — matches step 7
- NN strip: label bottom above chips top (full-width label line); single chip (nn3, post-trim) renders at 40px height, looks correct with 1 chip
- Console: **zero errors** after reload + tick/untick a `.tck` + `changeWeek(1)`/`changeWeek(-1)` (tick was reverted; no state left dirty)

### Desktop — pane responsive size (1350px viewport), after resize reset + reload

- `.sidebar`: 372px wide, positioned as right column
- `.cd-hero`: `display: block`, 97px tall, `.cd-hero-num` 30px, `.cd-hero-unpin` `position: absolute` — big cards unchanged
- `.day-nav`: `flex-wrap: wrap`, `overflow-x: visible` — unchanged
- `.tck` 20px, `.greeting` 28px, `.main` padding `0px 44px 80px` — all baseline values
- All sidebar children computed `order: 0` — no reorder
- Console: zero errors

## Review-fix re-test (375×812, after replacing scrollIntoView + adding min-width)

- Scrolled to page bottom (`window.scrollTo(0, scrollHeight)`), then ticked a task (full `render()`), then unticked:
  - `scrollY` before tick: **913** · after tick: **913** · after untick: **913** — page position unchanged, no jump to header (document `scrollHeight` 1725 constant through tick/untick, so no layout-height confound)
- Week-arrow buttons: computed `min-width: 36px`, rendered width **36px** each (was ~26px under the inline `padding:5px 8px`)
- Active day chip fully in view; `.day-nav` scrollLeft 0 (active = first chip, centring clamps at 0); no horizontal overflow (375 ≤ 375); zero console errors
- Desktop re-check after resize reset + reload: `.day-btn` min-width `auto`, arrows 24px (baseline), `.day-nav` wrap, scrollLeft 0, `.tck` 20px, zero console errors — unchanged

## Open risks

- Real-device iOS safe-area behaviour (`env()` values, standalone PWA chrome) not testable in the pane — verify on Ben's phone after deploy.
- Not committed/pushed per instructions.
