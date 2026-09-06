# DailyOS Redesign — Phase 1: type, colour, hierarchy

Approved direction: `feature-research/redesign/concept.html` (the mockup Ben signed off,
live at https://claude.ai/code/artifact/820a9e41-e546-4d37-ad12-ed335a48ea42). Its tokens
and type scale are the source of truth for every value below. Phase 1 is the CSS pass:
the app must FEEL like the concept without any structural change. Layout (sidebar → in-flow
"Coming up", top-bar restructure, "Now" line) is phase 2; row information (category chips,
duration, repeat icon, carry chip) is phase 3.

## Project invariants (MUST follow)

- Single-file app, `index.html`. No build step. No new files except the ones listed.
- **No logic changes.** No `S.*` writes, no schema/`DATA_VERSION` change, no sync changes,
  no reordering of DOM/sections, no new render paths.
- Markup edits are allowed in exactly two forms: (a) replacing an inline `style="…"` with a
  class, keeping every `onclick`/handler byte-identical; (b) changing a label STRING
  (e.g. `'PARKING LOT'` → `'Parking lot'`). Nothing else in JS.
- The existing `@media (max-width: 900px)` and `(max-width: 480px)` blocks must keep
  working. New base styles change what they inherit, so 375px must be re-verified, not assumed.
- `sw.js` is network-first — no cache bump. Do NOT commit or push; Ben reviews first.
- Dev preview: launch config `daily-os`, port 8741. The preview origin has no sync key.
- Line numbers below are pre-edit anchors — locate by selector/content.

## Files touched

1. `index.html`
2. `feature-research/redesign/audit.md` (new)
3. `feature-research/redesign/progress.md` (new)
4. `feature-research/redesign/concept.html` — reference only, do not edit

## Steps

### 1. Fonts (line 16, line 69)
- `@import` → `family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap`
- body: `font-family: "Instrument Sans", "Segoe UI", system-ui, sans-serif;`
- JetBrains Mono stays ONLY on: clock times (`.sd-ev-time`, event/sidebar times), counts
  (`.sd-count`, stat pills, countdown numbers), durations. Every other
  `font-family: 'JetBrains Mono'` declaration (section titles, labels, buttons, pills, day
  strip, badges) is removed so it inherits the sans. Grep all occurrences and classify each.

### 2. Tokens (`:root`, ~line 45)
Replace with the concept dark palette, keeping the same variable names so nothing else moves:

```
--bg:#12141b   --s1:#181b24   --s2:#1e222d   --s3:#262a36   --border:#262a36   --border2:#2f3442
--accent:#e4b45a   --accent-bg:rgba(228,180,90,.14)   --accent-border:rgba(228,180,90,.35)
--text:#e9ebf1   --text2:#dfe2ea   --muted:#8a90a3   --faint:#5c6276
--done:#6fb08d   --done-bg:rgba(111,176,141,.14)
--c-liquidbiz:#4fb3a3   --c-privatelabel:#9b8cf2   --c-barkspa:#e08fb6   --c-life:#7cb37a   --c-admin:#8c98b8
```

`--muted` drops from #ccd0e0 to #8a90a3 (about 5.5:1 on the new bg — AA). It is for
secondary info only. Audit every `--muted` use: anything PRIMARY a user must read (task
text, event names, input text) must move to `--text`/`--text2`, not stay muted.
Add `--shadow: 0 1px 0 rgba(0,0,0,.25), 0 12px 32px -16px rgba(0,0,0,.6);`.

### 3. Section labels → sentence case, sans
Retire the uppercase-mono label style everywhere: `.sd-title`, `.sb-h`, `.nn-strip-label`,
`.focus-label`, `.cd-hero-label`, `.sd-ev-badge`, sidebar group headers, `.pa-strip` label.
New style: Instrument Sans 15px/600, `text-transform:none`, `letter-spacing:-.01em`,
colour `--text` for section titles; `--muted` 13px/600 for sub-labels. Where the string
itself is uppercase in markup/JS, change the string: `'TODAY'` (renderDayCard title — also
drop the `.toUpperCase()` on weekday names), `'PARKING LOT'` → `'Parking lot'`,
`'DAILY NON-NEGOTIABLES'` → `'Daily'`, `'QUICK ADD'`, `'EVENTS'`, `'THIS WEEK'` /
`'NEXT WEEK'` / `'LATER'`, `'OPTIONAL'` badge → lowercase in a muted chip.
Badges (`MUFC`, `HOLIDAY`, `EVENT`) stay uppercase but in the sans, 10px/700, `.04em`.

### 4. Header
Keep the greeting (phase 2 decides its fate) but: `.greeting` 24px/600, letter-spacing
-.02em. The three header pills (TODAY / DAY OFF / HAIRCUT, renderMain ~3705–3713) carry
inline styles — move them to one class `.hdr-link` styled like the concept's utilities:
13px, `--muted`, no border or background, hover → `--text`. DAY OFF's "on" state keeps a
subtle red tint via `.hdr-link.on`. Handlers byte-identical.

### 5. Day strip
`.day-btn`: 36×36, border-radius 8px, no border, `--muted` 13px/500; `.active` →
`--accent-bg` background + `--accent` text 600; `.has-tasks::after` dot stays, `--faint`
(accent when active). Arrows same size. The mobile block's `.day-btn` overrides remain.

### 6. Cards
`.sd-card` and the parking card: `background:var(--s1); border:1px solid var(--border);
border-radius:12px; box-shadow:var(--shadow)`. `.sd-progress` 2px, `--done` fill.
`.focus-card` (planning-ahead card): same treatment; remove the radial gradient.

### 7. Task rows
`.task` padding 12px 16px; `.t-text` 15px/500 `--text`; `.tck` 20px, radius 6px,
1.5px border `--faint`, hover border `--accent`; `.tck.done` filled `--done`.
Done-row recession is CSS-only via `:has()` — no JS:

```
.task:has(.tck.done) { padding: 8px 16px; background: var(--s2); }
.task:has(.tck.done) .t-text { font-size: 13px; font-weight: 400; color: var(--muted); }
.task:has(.tck.done) .t-move, .task:has(.tck.done) .t-rm, .task:has(.tck.done) .sd-cat { opacity: .55; }
```

Browsers without `:has()` simply don't recede — acceptable. Keep the `.t-text.done`
strikethrough and the existing `just-done` / `just-completed` animations.

### 8. Countdown cards → compact rows at every width
The mobile block already restyles `.cd-hero*` into one slim row. Lift those rules out of
the media query so they apply at all widths. Desktop: rows stack in a column, max-width
520px, number in mono 16px. The big-card styles (`.cd-hero-num` 30px etc.) are retired.

### 9. Sidebar (structure untouched)
Restyle only: `.sb-sec` headers per step 3; inputs/selects `--s2` background, `--border`,
radius 8px, sans 14px; `.qa-btn` accent background with `--bg` text, 600; stat pills →
plain muted 12px text with mono numbers; `#evList` rows: time in mono 11.5px `--faint`,
name `--text` 13px, day chips muted. Nothing moves.

### 10. Non-negotiables strip
Label "Daily" per step 3; `.nn-chip` → row-lite: 40px min-height, radius 8px, `--s1`
background, `--border`; done → `--done-bg` + `--done` text.

## Verification (mandatory before reporting done)

Preview via `daily-os` (port 8741). Confirm `localStorage.getItem('dailyOS_syncKey')` is
null first. Check at desktop (pane default) AND `resize_window` mobile 375×812:

1. `getComputedStyle(document.body).fontFamily` starts with "Instrument Sans";
   `getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()` is `#e4b45a`.
2. `.sd-title`: `text-transform` none, sans font-family, text reads "Today" not "TODAY".
3. Tick a task: its `.task` computed padding-top is 8px and `.t-text` font-size 13px;
   untick restores 12px / 15px. Zero console errors after reload + tick/untick + week nav
   both directions + open/close calendar + open/close a move menu + open/close the data menu.
4. `.cd-hero` height ≤ 50px at desktop width (record `getBoundingClientRect().height`).
5. 375px: no horizontal overflow (`scrollWidth <= clientWidth`), day-nav still one line, the
   mobile sidebar order still applies (computed `order` values 0/3/2/1/4/5).
6. Grep proof: count of `JetBrains Mono` declarations before/after, and list each survivor
   in the audit with a one-word reason (time / count / duration).
7. `--muted` uses reviewed: which were promoted to `--text2` and why.

Write `feature-research/redesign/audit.md` (every selector/token touched before → after,
the inline-style→class swaps with line refs, verification values, deviations with
justification) and `feature-research/redesign/progress.md` (phase 1 status; phases 2–3 next).
