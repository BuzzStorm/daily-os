# Redesign phase 1 — implementation audit

## Files changed

1. `index.html` — modified (CSS pass + the allowed inline-style→class swaps and label strings)
2. `feature-research/redesign/audit.md` — created (this file)
3. `feature-research/redesign/progress.md` — created

Not touched: `concept.html` (reference), `sw.js`, `manifest.json`, anything else.
Not committed, not pushed.

## index.html — what changed, by plan step

### 1. Fonts
- `@import` (line 16): `Inter:wght@300..700` → `Instrument+Sans:wght@400;500;600;700` (JetBrains Mono unchanged).
- `html, body`: `font-family: 'Inter', -apple-system, sans-serif` → `"Instrument Sans", "Segoe UI", system-ui, sans-serif`; added `-webkit-font-smoothing: antialiased`.
- Every `font-family: 'Inter', sans-serif` on inputs/buttons (`.bk-add-inp`, `.quick-add-inp`, `.sb-data-item`, `.qa-inp`, `.qa-btn`, `.ae-inp`, `.ae-btn`, `.cal-title`) → `font-family: inherit`.
- `JetBrains Mono` declarations: **57 before → 25 after** (see survivor list at the bottom).

### 2. Tokens (`:root`)
| token | before | after |
|---|---|---|
| --bg | #1b1e28 | #12141b |
| --s1 | #252836 | #181b24 |
| --s2 | #2f3242 | #1e222d |
| --s3 | #3b3e50 | #262a36 |
| --border | #444859 | #262a36 |
| --border2 | #555a72 | #2f3442 |
| --accent | #e2b257 | #e4b45a |
| --accent-bg | rgba(226,178,87,.12) | rgba(228,180,90,.14) |
| --accent-border | rgba(226,178,87,.3) | rgba(228,180,90,.35) |
| --text | #f5f5f7 | #e9ebf1 |
| --text2 | #ecedf3 | #dfe2ea |
| --muted | #ccd0e0 | #8a90a3 |
| --faint | #8a8fa0 | #5c6276 |
| --done | #7cc59b | #6fb08d |
| --done-bg | rgba(124,197,155,.14) | rgba(111,176,141,.14) |
| --shadow | (none) | 0 1px 0 rgba(0,0,0,.25), 0 12px 32px -16px rgba(0,0,0,.6) |
| --c-liquidbiz | #6ab891 | #4fb3a3 |
| --c-barkspa | #cc8a5e | #e08fb6 |
| --c-privatelabel | #6690c4 | #9b8cf2 |
| --c-life | #c4808e | #7cb37a |
| --c-admin | #8a8da4 | #8c98b8 |

Unchanged (not in plan): `--c-break`, `--c-evening`, `--c-parking`, `--accent2*`, radius scale.

### 3. Section labels → sentence case, sans
| selector | before | after |
|---|---|---|
| `.sd-title` | mono 10px, ls 2px, uppercase, `--accent` | sans 15px/600, ls -.01em, `text-transform:none`, `--text` |
| `.sd-card.sd-park .sd-title` | #b8905a | `--text` |
| `.sb-h` | mono 10px, ls 1.5px, uppercase | sans 13px/600, ls .02em, none, `--muted` |
| `.nn-strip-label` | mono 9px, ls 1.8px, uppercase, `--faint` | sans 13px/600, `--muted` |
| `.focus-label` | mono 9px, ls 2px, uppercase | sans 13px/600, none |
| `.cd-hero-label` | mono 9px, ls 2px, uppercase, `--accent` | sans 13px/600, `--text` (see step 8) |
| `.sd-ev-badge` | mono 8px, ls 1px, #8a90a8 | sans 10px/700, ls .04em, `--muted` (text stays uppercase: EVENT / HOLIDAY / MAN UTD) |
| `.ie-badge`, `.now-tag` | mono 8–9px, ls 1.5px | sans 10px/700, ls .04em |
| `.ev-group` (sidebar This week / Next week / month) | mono 8px, ls 1.6px, uppercase, `--faint` | sans 12px/600, `--muted` |
| `.parking-tag` (OPTIONAL) | mono 9px uppercase, purple bordered chip | sans 11px/600, `text-transform:lowercase`, `--muted` on `--s2`, radius 6px, no border |
| `.outstanding-label`, `.past-summary-toggle`, `.missed-hd`, `.t-block-tag`, `.gym-picker-label`, `.gym-day`, `.t-divider`, `.qa-hint`, `.nn-biz`, `.wt-day`, `.sr-meta`, `.cal-dow`, `.t-meta` | mono, 9–11px, letter-spaced | sans, 11–13px, no letter-spacing |

Label strings changed (form b):
- renderDayCard: `'TODAY'` → `'Today'`; weekday title `.toUpperCase()` removed (`'Monday'` etc).
- renderParkingLot: `'Parking Lot'` → `'Parking lot'`.
- nnStripHtml: `'Daily non-negotiables'` → `'Daily'`.
- Static sidebar: `Quick Add` → `Quick add`; `This Week` → `This week`. (`Events`, `This week`/`Next week` in renderEvents were already sentence case — no change needed.)
- Date-context card: `'LOOKING BACK'`/`'PLANNING AHEAD'` → `'Looking back'`/`'Planning ahead'`.
- Header pills: `TODAY` → `Today`, `DAY OFF`/`BACK TO WORK` → `Day off`/`Back to work`, `HAIRCUT` → `Haircut`.

### 4. Header
- `.greeting`: 28px/700, ls -0.5px → 24px/600, ls -.02em.
- `.date-line`: mono 11px → sans 13px/500 `--muted` (not a time/count, so mono retired).
- New `.hdr-link` (+ `.hdr-link:hover` → `--text`, `.hdr-link.on` → #d9846f red tint): 13px/500 `--muted`, no border/background/padding.
- Inline style → class swaps in renderMain (pre-edit lines 3858 / 3864 / 3866):
  - TODAY button: `style="…"` removed → `class="hdr-link"`; `onclick="goThisWeek()"` byte-identical.
  - DAY OFF button: `style="…"` removed → `class="hdr-link${off?' on':''}"`; `onclick`, `onmouseenter`, `onmouseleave` byte-identical (they still set `borderColor`, which is now a visual no-op).
  - HAIRCUT link: `style="…"` removed → `class="hdr-link"`; `href`/`target`/`rel`/`title`/`onmouseenter`/`onmouseleave` byte-identical.

### 5. Day strip
- `.day-nav` gap 3px → 4px.
- `.day-btn`: padding 5px 11px + mono 11px + 1px transparent border + `--r-chip` → `min-width:36px; height:36px; padding:0 6px; inline-grid centred; sans 13px/500; border:none; radius 8px; --muted`.
  - **Note:** plan says 36×36. Fixed `width:36px` would clip the "Today" label (Instrument Sans 13px/600 renders "Today" at ~41px) so I used `min-width:36px` — letter days measure exactly 36×36, "Today" 53×36 at desktop, 43×36 at 375px. Same visual as the concept's `.day` (which also overflows on "Today").
- `.active`: `--accent-bg` + `--accent`, weight 600, no border.
- `.has-tasks::after` dot: 5px `--accent` block-flow → 4px `--faint`, absolutely positioned at bottom 5px; `.active.has-tasks::after` → `--accent`.
- Mobile block: `.day-btn { padding: 7px 12px }` → `padding: 0 8px` (the old vertical padding would have inflated the new fixed 36px height).

### 6. Cards
- `.sd-card`: added `box-shadow: var(--shadow)`, `overflow:hidden`; padding `16px 16px 8px` → `14px 0 4px` so rows can carry the 16px gutter themselves (concept's list has no inner card padding). Children re-padded: `.sd-head` `padding:0 16px; gap:14px`; `.sd-progress` `margin:8px 16px 6px`; `.sd-ev` `margin:4px 16px 6px`; `.sd-card .bk-add` `padding:10px 16px`; new `.sd-empty` for the empty-state line (inline `style="padding:14px 4px;font-size:13px;color:var(--muted)"` in renderDayCard → `class="sd-empty"`, form a).
- `.sd-progress`: 3px `--s3` track, `--accent` fill → 2px `--border2` track, `--done` fill.
- `.sd-ev`: `rgba(212,164,74,.06)` → `--accent-bg`; `.sd-ev-name` → `--text` 500.
- `.focus-card`: radial gradient + accent border + 4px accent left rule → `--s1`, `--border`, 3px accent left rule, `--shadow`, padding 20px 22px; `.focus-card::before` gradient overlay removed. `.focus-title` 26px/700 → 22px/600.
  - New `.focus-card.focus-ctx` (+ `.focus-label`/`.focus-pulse` descendants) replaces the inline `style="border-left-color:var(--muted);background:radial-gradient(…)"` / `style="color:var(--muted)"` / `style="background:var(--muted);animation:none"` trio on the planning-ahead card in renderMain (pre-edit 3898–3899, form a; no handlers on those elements).
- `.sd-count`: 11px → 12px mono, tabular-nums.

### 7. Task rows
- `.task`: gap 10px → 12px; padding `8px 0` → `12px 16px`; border `rgba(255,255,255,.06)` → `--border`; added padding/background transition.
- Added exactly the three `:has()` rules from the plan (`.task:has(.tck.done)` → `padding:8px 16px; background:var(--s2)`; `.t-text` 13px/400 `--muted`; `.t-move/.t-rm/.sd-cat` opacity .55).
- `.t-text`: 14px → 15px/500, ls -.005em, line-height 1.4. `.t-text.done` keeps strikethrough (+ `text-decoration-color: var(--faint)`).
- `.tck`: border `--border2` radius 4px → `--faint` radius 6px (20px, hover accent, `.done` `--done` fill all unchanged). `just-done` / `just-completed` / `checkPop` / `taskFlash` animations untouched.
- `.t-move`, `.t-rm`, `.wt-rm`, `.ev-rm`, `.sd-grip`: hard-coded #3a3d50 / #565b72 → `--faint` (those hexes were near-invisible on the new bg).
- `.sd-carry` chip: mono 9px bordered accent → sans 11px/600, carry colour #d9846f on rgba(217,132,111,.14) (concept `--carry`).
- New `.t-rep` replaces the inline mono REPEATS tag in sdTaskRow (pre-edit 4007, form a; no handler on it): sans 10px/700, ls .04em, `--accent` at .7. String stays `REPEATS` (badge, stays uppercase per step 3).

### 8. Countdown cards → compact rows
- Base `.cd-hero-row` / `.cd-hero*` replaced with the ≤900px compact rules (flex row, label flex 1 with ellipsis, body/foot/unpin ordered, 2px bar pinned to bottom, unpin 28px tap target). Added: column layout `max-width: 520px` at desktop; `.cd-hero` bg `--s1` + `--border` + `--shadow` (was gold gradient); `.cd-hero-num` mono 16px/500 `--accent` (was 30px/800 sans); `.cd-hero-unit` sans 12px `--muted` (was mono 10px uppercase); `.cd-hero-foot` sans 12px; `.cd-hero-bar` track `--accent-bg`.
- Mobile block: the ~40 lines of `.cd-hero*` overrides removed; only `.cd-hero-row { max-width:none; margin:12px 0 8px }` remains. `@media (max-width:480px) .cd-hero-loc { display:none }` untouched.

### 9. Sidebar (structure untouched)
- `.sb-h` per step 3. `.sb-badge` → mono 11px (count).
- `.qa-inp`, `.qa-sel`, `.qa-num`, `.ae-inp`, `.ae-date`: bg `--bg` → `--s2`, radius `--r-chip`(6) → 8px, sans 13–14px (`.qa-num` keeps mono 12px — it is a duration). `.ae-btn` → `--s2` bg, radius 8px, 12px/500. Placeholders #50546e → `--faint`.
- `.qa-btn`: `--accent` bg, text #0c0d11 → `var(--bg)`, 13px/600, radius 8px.
- `.sb-stat-pill`: mono 10px → sans 12px `--muted`; `.sv` numbers → mono `--text` 500 tabular. `.sb-sync-pill`: mono 10px → sans 11px/500.
- `#evList`: `.ev-date` mono 10px `--muted` → mono 11.5px `--faint`; `.ev-txt` `--text2` → `--text`, `.ev-item` 12px → 13px; `.ev-days` mono 10px, radius 4px (count — stays mono); `.ev-group` per step 3.
- `.sb-data-item` 12px → 13px, inherit font. `.pa-strip` 11px → 12px.

### 10. Non-negotiables strip
- Label "Daily" (string + style per step 3).
- `.nn-chip`: `--s2` bg, 6px radius, 12px `--text2`, padding 5px 11px → `--s1` bg, `--border`, radius 8px, `min-height:40px`, padding 8px 14px, 13px/500 `--text`. `.done` → `--done-bg` + `--done` text, transparent border. `.nn-chip-ck` 15px `--border2` → 16px `--faint`, radius 5px. Hover → `--border2` / `--s2`. Mobile block's `.nn-chip { min-height:40px; padding:8px 14px }` now matches base (left in place).

### Other small changes inside the touched CSS
- `.cal-day` `--muted` → `--text2` (promotion, see below); `.cal-day.other` #3a3d50 → `--faint`.
- `.t-bullet` (task notes) 11px `--muted` → 12px `--text2` (promotion).
- `.sd-nudge` text `--muted` → `--text2` (promotion).
- `.sr-empty` #888db0 → `--muted`, 12px.

## --muted review (step 2 / verification 7)

Promoted to `--text2`:
- `.t-bullet` — task notes are content the user reads on the row.
- `.cal-day` — calendar date numbers are the primary interactive content of the picker.
- `.sd-nudge` — an instruction the user is expected to read/act on.

Promoted to `--text`:
- `.ev-txt` (sidebar event names, was `--text2`, plan step 9).
- `.sd-ev-name`, `.nn-chip` text (were `--text2`).

Kept `--muted` (secondary by design): `.date-line`, `.hdr-link`, `.day-btn` (inactive), `.focus-sub`, `.cd-hero-unit/.cd-hero-date/.cd-hero-loc`, `.sd-count`, `.sd-ev-badge`, `.sd-empty`, `.t-text.done`, `.nn-chip.done`-adjacent, `.sb-h`, `.sb-stat-pill`, `.sb-sync-pill`, `.ev-group`, `.ev-days`, `.pa-strip`, `.qa-hint`, `.parking-tag`, `.t-meta`, empty-state/`.sr-empty`, `.outstanding-*`, `.past-summary-*`, `.bk-*` legacy, `.gym-*`, `.wt-day`, `.nn-biz`, `.sr-meta`, `.cal-dow`, `.cal-nav`, `.sb-chev`, `.sb-icon-btn`, `.update-toast .ut-dismiss`, inline JS uses (edit modals, sync setup copy, location tags) — all secondary labels/meta.
- `.nn-txt.done`, `.wt-txt.done`, `.ot-text.done`, `.t-text.done` — done-state text, intentionally muted.

## JetBrains Mono survivors (verification 6)

Count: **57 → 25**.

CSS (19):
| selector | reason |
|---|---|
| `.focus-countdown` | duration |
| `.cd-hero-num` | count |
| `.outstanding-count` | count |
| `.ot-time` | time |
| `.prog-text` | count |
| `.event-banner .eb-days` | count |
| `.bk-time` | time |
| `.bk-prog` | count |
| `.bk-cap` | duration |
| `.pd b` | count |
| `.sd-count` | count |
| `.sd-ev-time` | time |
| `.ie-time` | time |
| `.sb-stat-pill .sv` | count |
| `.sb-badge` | count |
| `.qa-num` | duration |
| `.ev-date` | time |
| `.ev-days` | count |
| `.cal-day` | count (tabular date grid) |

Inline JS (6) — untouched, outside the plan's named swaps (modal/menu internals, not main-view labels):
| pre-edit line | what | note |
|---|---|---|
| 3326 | weekly move day chips (`moveWeeklyTask`) | label — candidate for phase 2/3 |
| 3368 | "Edit Task" modal heading | label — candidate |
| 3494 | "Edit Event" modal heading | label — candidate |
| 3797 | week-picker menu buttons (`btn.style.cssText`) | label — candidate |
| 4929, 4942 | sync-setup key inputs | key strings; mono arguably fine |

## Verification (preview `daily-os`, http://localhost:8741, `localStorage.getItem('dailyOS_syncKey')` → `null`)

Desktop (pane 800px wide):
1. `getComputedStyle(document.body).fontFamily` → `"Instrument Sans", "Segoe UI", system-ui, sans-serif`; `--accent` → `#e4b45a`.
2. `.sd-title`: text `Today`, `text-transform: none`, font-family Instrument Sans, 15px.
3. Tick/untick (parking task): before `padding-top 12px / .t-text 15px` → done `8px / 13px`, `.tck` bg `rgb(111,176,141)` → untick `12px / 15px`. Console errors after reload + tick/untick + `changeWeek(+1)`, `changeWeek(-1)` ×2, `changeWeek(+1)` + `toggleCalendar()` open/close + `.t-move` menu open/close + data menu open/close: **none** (`read_console_messages onlyErrors` → "No console logs").
   - Next-week view: header links render `Today`, `Day off`, `💈 Haircut`; `.hdr-link` computed 13px, `--muted`, `border-style none`, transparent bg; focus card `background-image: none`, label `Planning ahead`.
4. `.cd-hero` height: **42.14px** (≤ 50).
   - Active `.day-btn` 52.9×36 (`Today`), letter days 36×36.

Mobile (`resize_window` 375×812, reloaded):
5. `documentElement.scrollWidth/clientWidth` → 375/375; `body.scrollWidth` 375; `.main` 375/375 — no horizontal overflow. `.day-nav`: all buttons share one `top` (91) — single line (nav itself scrolls horizontally, 395/347, as the existing mobile block intends). Sidebar computed `order` in DOM order: `sb-top:0, sb-search-wrap:3, sb-sec(QuickAdd):2, sb-sec(Events):1, sb-sec(ThisWeek):4, pa-strip:5` → 0/3/2/1/4/5. `.tck` 26px (mobile override intact). `.cd-hero` 42.14px. Weekday view at 375: `.nn-chip` min-height/height 40px, radius 8px, bg `--s1`; label `Daily`; `.task` padding `12px 16px`; `.t-text` 15px/500 `--text`; no console errors.

Viewport reset to desktop afterwards.

## Deviations / judgement calls

1. `.day-btn` uses `min-width:36px` not `width:36px` (see step 5) — a hard 36px would clip "Today".
2. `.sd-card` inner padding moved from the card to its children (step 6) — needed so the plan's `.task { padding: 12px 16px }` and the done-row `--s2` background run edge-to-edge like the concept's `.list`, instead of double-gutter (16px card + 16px row). No DOM change; one extra inline-style→class swap (`.sd-empty`) to keep the empty-state line aligned.
3. Extra form-a swaps beyond the three header pills: `.focus-ctx` (planning-ahead card, 3 inline styles), `.sd-empty`, `.t-rep` (REPEATS badge). All are inline `style` → class with no handlers on the elements; done because the plan's step 6 ("remove the radial gradient") and step 1 ("every other mono declaration … badges") could not be met otherwise.
4. Hard-coded near-black greys (#3a3d50, #565b72, #50546e, #888db0) on icons/placeholders were replaced with `--faint`/`--muted` — they were tuned for the old bg and became invisible on #12141b.
5. `.cd-hero-row` capped at 520px on desktop only; the mobile block resets it to `max-width:none`.

## Deviation candidates NOT acted on (flagging only)

- `<meta name="theme-color" content="#1b1e28">` (line 6) now mismatches `--bg` #12141b. Markup outside the two allowed forms — left alone; one-line follow-up for Ben.
- The 6 inline-JS mono/uppercase labels listed above (edit modals, week picker, weekly move chips).
- `.focus-card.focus-evening` still carries its gradient; evening mode was not in the plan's list. Same for the legacy `.block`/`.bk-*` time-block styles and `.inline-event` gradients.
- `.sd-ev.mufc` / `.holiday` hard-coded colours (#DA291C, #6ea8b8) unchanged.

## Open risks

- `:has()` recession needs Safari 15.4+/Chrome 105+; older browsers see done rows at full size (accepted in plan).
- At 375px a task row now has 32px less text width than before (row gutters + wider gap), so long titles wrap one line earlier with the always-visible mobile move/remove buttons. Cosmetic; phase 3 row-meta work will revisit the row anyway.
- The DAY OFF / HAIRCUT inline `onmouseleave` handlers still write `style.color='var(--muted)'` (Haircut) — after the first hover the link's colour is pinned to `--muted` inline, which equals the class default, so hover-to-`--text` via CSS is overridden by the inline accent/muted handlers. Behaviour is unchanged from before; handlers were kept byte-identical per plan.

## Post-review fixes (main session)

Reviewer verdict: fix-first on one blocking finding. Applied the blocking fix plus the
one-line follow-ups the reviewer recommended folding in:

1. **BLOCKING — done-row controls.** `.task:has(.tck.done) .t-move/.t-rm { opacity:.55 }`
   out-specified `.task:hover .t-move { opacity:1 }` (`:has()` takes its argument's
   specificity), so done rows showed permanently-visible, never-brightening controls at
   ~1.7:1. Rule reduced to `.sd-cat` only; controls use the normal hover-reveal again.
2. `.sd-ev:hover` was `.12` of the retired gold (darker than rest state) → `rgba(228,180,90,.22)`.
3. `.quick-add-icon` colour `--border2` (1.4:1) → `--muted`; dropped `font-weight:300` (not loaded).
4. Old-palette literals: `#5e6280` (2 SVG strokes) → `#8a90a3`; scrollbar thumb `#3a3d50` →
   `var(--faint)`; `<meta name="theme-color">` `#1b1e28` → `#12141b` (approved palette, PWA
   status bar).
5. Contrast stacking: `.t-text.done` lost `opacity:.7` (the `:has()` rule already recedes it;
   stacked it fell to 3.2:1); `.ev-date` `--faint` → `--muted`.
6. Edit-task / Edit-event modal eyebrows: inline old-style mono (no handlers) → `.modal-eyebrow`,
   sentence case.
7. Header hierarchy: `.hdr-link` was typographically identical to `.date-line` → quiet pill
   (`--s2`, 3px 10px, radius 6; hover `--s3`).
8. Minor: `.parking-tag` background `--s2` → `--s3`; mobile `.tck` radius 5 → 6.

Verified after a hard reload (the pane had a stale SW copy first): body font "Instrument Sans",
`--accent #e4b45a`, theme-color `#12141b`, `.sd-title` "Today", `.cd-hero` 42px, quick-add
icon `rgb(138,144,163)`, `.hdr-link` `rgb(30,34,45)` / 3px 10px, no horizontal overflow,
zero console errors.

Deferred to phase 2 (reviewer items, design judgement): done rows sit at the top in a
LIGHTER band (`--s2` on `--s1`) which reads as emphasis, not recession — either darken or
revisit the sort; Haircut link hovers to accent via its legacy inline handler while the
other two hover to text (handlers had to stay byte-identical); dead CSS (`.focus-evening`,
`.block`/`.bk-*`, `.inline-event`, `.now-tag`) can be deleted; input boxes are flatter
than before by design (matches the approved concept).
