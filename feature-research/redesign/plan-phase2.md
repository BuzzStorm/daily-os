# DailyOS Redesign — Phase 2: make the live app match the mockup

**Spec = `feature-research/redesign/concept.html`** (Ben's approved mockup). Phase 1 shipped
its type/colour/labels; the live app still has the old two-pane layout. This phase makes the
structure match: top bar, "Now" block, Today list with pinned Daily row and informative rows,
one add box with the full parser, quiet right rail (Counting down + Coming up), no sidebar,
document scroll, composed 1080px grid. Rows (former "phase 3") are included — the mockup
shows them and they are cheap once `sdTaskRow` is being edited anyway.

One deliberate deviation from the mockup (Ben may overrule):
1. **"This week" (S.weekly) list kept**, collapsed, under Coming up — the mockup omitted it
   but `paAdd`'s "week" path and `moveWeeklyTask` rely on it being visible somewhere.

The mockup's **Dark / Light toggle is in scope** (Ben asked for it) — see step 11.

## Project invariants (MUST follow)

- Single-file app, `index.html`. No build step. No new files beyond the touched list.
- **State and sync untouched**: no `S.*` schema change, no `DATA_VERSION` bump, no changes to
  sync code, seeds, migrations, carries, done/skip/order logic. Adding tasks may only write
  through the code paths `paAdd` already uses (see step 6) — reuse, don't reimplement.
- **Every element id that JS writes to or reads from either keeps its id in the new DOM, or
  its writer gets a null guard.** The scout's dependency map (section "Dependency map" below)
  is the checklist. `renderStats`, `renderWeek`, `renderPaText`, `showPa`, `syncSetStatus`
  have NO guards today — missing any id kills the whole `render()` pass.
- Mobile: the `@media (max-width:900px)` block is rewritten for the new DOM (no `nth-child`
  order hacks; the rail simply follows main in source order). 375px is re-verified.
- `sw.js` network-first — no bump. Do NOT commit or push; Ben reviews first.
- Dev preview: launch config `daily-os`, port 8741; the preview origin has no sync key, so
  injecting Ben's real state there for testing is safe (see Verification).
- Line numbers below are pre-edit anchors — locate by function/selector name.

## Files touched

1. `index.html`
2. `feature-research/redesign/audit-phase2.md` (new)
3. `feature-research/redesign/progress.md` (update)
4. `feature-research/redesign/concept.html` — reference only

## Target DOM (desktop ≥ 900px)

```
.shell (max-width 1080, margin auto, padding 28px 32px 80px)
  .top            sticky top bar — see step 2
    .today-label  "Tuesday" <span>1 September</span> (click → existing calendar dropdown)
    .week         7 day buttons (existing switchDay/changeWeek handlers, arrows kept)
    .utils        <span id="sTasks"…> done · sync dot+text · Book haircut · Day off · search ⌕ · ⋯ menu
  .search-wrap    hidden until ⌕ (existing #sbSearchWrap/#searchInp/#searchResults, ids kept)
  .cols (grid minmax(0,1fr) 300px, gap 56px)
    main#main     rendered by renderMain — step 3–5
      section.now
      section.today  (.sec-head + .progress + .list + .parking)
    aside.rail#rail  static shell, JS fills the three containers — step 7
      #railCount    Counting down
      #railUp       Coming up (+ #eventForm moved here)
      #railWeek     This week (collapsed)
  #paMsg          fixed toast (bottom-centre) — id kept for showPa
  hidden inputs: #importFile (kept)
```

`.app` / `.main` / `.sidebar` 100vh panes with internal scroll are removed; the document scrolls.

## Steps

### 1. Layout shell (CSS + static markup)
Replace `<div class="app"><div class="main" id="main"></div><div class="sidebar">…</div></div>`
with the target DOM above. Static parts: top bar, search wrap, rail shell, toast. `#main`
stays the render target of `renderMain`. Copy the mockup's `.shell/.top/.cols/.rail` CSS.
Delete `.app`, `.main`, `.sidebar` rules and the entire `.sb-*` family (list in scout §9),
`.pa-strip`, `.quick-add*`, `.sd-nudge`, `.nn-strip*`, `.focus-evening`, `.block`/`.bk-*`
EXCEPT `.bk-add`/`.bk-add-inp`/`.bk-add-plus` (the inline add box), `.inline-event`, `.now-tag`,
big-card `.cd-hero` leftovers. Grep each selector before deleting to confirm no live use.

### 2. Top bar
- Date label replaces the greeting entirely (`.greeting` removed). The label keeps
  `onclick="toggleCalendar()"` and the `▾`; `#calendarDrop` stays inside a
  `position:relative` wrapper so `toggleCalendar`/`closeCalendar`/`_calOutsideClick` work.
- Week strip = existing day-nav markup/handlers, restyled per mockup (`.day`, 36px, "Today"
  label on today, dots). Arrows kept, same size.
- Utilities (right-aligned): `<span class="mono"><b id="sTasks">0/0</b> done</span>`,
  `<span id="sStreak">` streak, hidden `#sNnPill/#sNn` (kept for renderStats, `display:none`),
  sync status = `#syncPill` (dot `#syncPillDot` + `#syncPillText`, `onclick="openSyncSetup()"`),
  Book haircut link (the existing `<a>` — move its hover to CSS, drop the inline
  onmouseenter/leave), Day off button (existing handler, `.hdr-link.on` state), TODAY
  button when not this week (existing), search button `#sbSearchBtn` → `toggleSbSearch()`,
  and the `⋯` button wrapping the existing `#dataMenu` (ids `dataMenu`, `syncMenuItem`,
  `importFile` kept; `toggleDataMenu(this)` still receives the containing element).
- `.top` is `position:sticky; top:0; background:var(--bg)`; z-index above the list.

### 3. "Now" block (renderMain, replaces the countdown hero slot)
Today only:
- eyebrow "Now"; `h1` = first OPEN item in the same order the list shows them (carries
  first, then list order), excluding Daily rows; carry → append `<span class="soft">— carried
  from <Ddd></span>`. If nothing open: `Clear day. <span class="soft">N done, nothing
  waiting.</span>` (N = done count of real tasks, same number as the header count).
- `.then` line = today's events (`getUpcomingEvents()` filtered to today, sorted by time):
  `<span class="t mono">HH:MM|all day</span>Name`, past ones `.past` (strikethrough) using
  `getNow()`; MUFC keep the ⚽.
Non-today days: render the existing planning-ahead / looking-back card content in this slot
(same text, `.now` styling: eyebrow = "Planning ahead"/"Looking back", h1 = the weekday
line, `.then` = the tasks-planned sentence). `renderCountdownHero()` no longer renders here
(step 7). Keep its state-mutating stale-pin cleanup exactly as is — just redirect output.

### 4. Today section
- `.sec-head`: `<h2>Today</h2>` (or weekday for other days) + `<span class="count">N of M
  done</span>`; `.progress` 2px bar. Remove the old `.sd-head/.sd-count` markup.
- `.list` card = the existing `.sd-card` (rename or restyle to the mockup's `.list`).
- Row order inside: done rows (existing sort, compact), then **Daily rows**, then carries,
  then pending. Daily rows: one `.row.pin` per `NN` entry — checkbox uses the existing
  `toggle('${n.link}')`, title, `<span class="chip daily">Daily</span>`. `nnStripHtml()` is
  retired; `renderNn()` keeps working (guard `#nnBdg` if it targets one).
- **Row meta** (sdTaskRow): `.meta` = `[from Ddd chip if carry] [cat chip with --dot colour]
  [dur mono "30m" if dur] [↻ if rec]`. Category labels: liquidbiz "Liquid Biz", privatelabel
  "Private Label", barkspa "Bark Spa", life "Life", admin "Admin". The `.sd-cat` 2px bar is
  removed. Notes (`.t-bullets`) stay under the title. Move/remove/grip controls keep their
  handlers and hover-reveal.
- Done rows: keep the `:has()` recession from phase 1 but background = `var(--s1)` (same as
  card) — the reviewer's "lighter band reads as emphasis" note. Keep the tick pop/flash.
- Remove `.sd-nudge` (the Now block supersedes it) and the bottom `.quick-add` box
  (`quickAdd()` deleted; `focusQuickAdd()` now focuses the day card's `.bk-add-inp`).
- Add box (`.bk-add`) placeholder: `Add to today — try "Call mum tomorrow 10 mins"` (other
  days: `Add to Thursday…`).

### 5. Parking lot
Empty (no parking tasks and no parking carries): render one line
`<div class="parking"><b>Parking lot</b><span class="n">nothing parked</span> + park…</div>`
where clicking "+ park…" reveals the existing parking add input. Non-empty: the existing
parking card, restyled like `.list`, header "Parking lot · optional" in sentence case.

### 6. One add path with the full parser
Extract the parsing/routing body of `paAdd()` (~3195–3308: detectCat, parseDuration,
parseTime, "every <day>" → S.recurring, parseWhenFromText, parseDayName, week → S.weekly,
else S.custom[day].list + navigate) into `addTaskFromText(text, { zone, cat:'auto', dur:null,
when:'auto' })` that returns what it created. `paAdd` is deleted with its form.
`listQuickAdd(zone, inp)` and the parking add call `addTaskFromText(text, { zone })`:
- explicit day words / "every <day>" / "this week" route exactly as paAdd did (including the
  view jump to that day, and the `showPa` confirmation);
- otherwise insert into `S.custom[viewDay][zone]` as today (keep `_lastAddedTaskId` highlight
  + refocus timing).
Delete `quickAdd()` (duplicate). Net: three parsers → one.

### 7. Right rail (static shell + three render targets)
- **Counting down** (`#railCount`): `renderCountdownHero()` writes here: per pin
  `<div class="count"><span class="n mono">76</span><span class="l"><b>Baby due</b>
  <small>Mon 16 Nov · 11 weeks</small></span><button class="unpin">×</button></div>`.
  Stale-pin cleanup + `unpinCountdown` unchanged. Hidden when no pins.
- **Coming up** (`#railUp`): `renderEvents()` rewritten to the mockup's grouping: next 14 days
  grouped per day (`Today`, `Wed 2`, …), `.ev` rows = `time mono | text (+ "· location",
  MUFC/HOL badge) | hover: pin (togglePinCountdown) · ✕ (rmEvent)`, row click →
  `editEvent(id)`. After 14 days: a `Later · N` toggle row that expands the rest of the
  60-day horizon using the existing month labels. `+ Add` button in the `h3` toggles the
  existing `#eventForm` (moved into `#railUp` above the list; all `ev*` ids kept, `addEvent`
  unchanged).
- **This week** (`#railWeek`): existing `#wkList` + `#wkBdg` + `#wkChev` + `toggleSbSec`,
  collapsed by default, restyled.
- Rail `h3` labels: "Counting down", "Coming up", "This week".

### 8. Toast + coaching line
`#paMsg` becomes a fixed bottom-centre toast (`.toast`), id kept; `showPa`/`showPaWithMove`
unchanged. `.pa-strip`/`#paText` removed; `renderPaText()` gets a null guard and is left in
place (its text is superseded by the Now block).

### 9. Mobile block rewrite (`@media (max-width:900px)`)
`.cols` → single column (rail after main, natural order); `.top` wraps (`gap 14px 20px`),
`.utils` `margin-left:0`; keep: day strip nowrap/scroll + `min-width:36px` arrows,
`.tck` 26px, `.nn`-row min-height 40px, safe-area padding on `.shell`, rail sections
stack with 34px gap. Delete the old `nth-child` order rules and the `.pa-strip` rule.
`(max-width:480px)`: `.shell` padding 14px, hide `.count small`.

### 10. Guards and cleanups
Null-guard `renderStats` targets that no longer exist (`sNnPill`/`sNn` are kept hidden, so
just keep the ids). Guard `renderWeek` on `#wkList`. Remove the Haircut link's inline hover
handlers (CSS hover instead). Delete now-dead functions: `paAdd`, `quickAdd`, `nnStripHtml`
(only if no other caller). Delete dead CSS from step 1.

### 11. Light theme + toggle
- Add a `:root[data-theme="light"]` block that redefines ONLY the tokens, using the mockup's
  light values mapped onto the app's names: `--bg #f6f6f8, --s1 #ffffff, --s2 #f0f1f5,
  --s3 #e4e6ee, --border #e4e6ee, --border2 #d5d8e3, --text #1a1c26, --text2 #2a2d3a,
  --muted #6b7186, --faint #a3a8ba, --accent #b8862e, --accent-bg rgba(184,134,46,.12),
  --accent-border rgba(184,134,46,.35), --done #2f8a5e, --done-bg rgba(47,138,94,.12),
  --c-liquidbiz #2f9c8b, --c-privatelabel #7a6ae0, --c-barkspa #d06a9a, --c-life #5e9a5b,
  --c-admin #6f7d9e, --shadow 0 1px 2px rgba(20,22,40,.06), 0 8px 24px -12px rgba(20,22,40,.12)`.
  Dark stays the default (no stamp = dark; the app has always been dark, so do NOT follow
  the OS preference).
- **Audit every literal colour** in CSS and inline styles (`#…`, `rgba(…)`) that assumes the
  dark ground — MUFC/holiday badge reds, `.hdr-link.on` red, done/carry tints, chip colours,
  `.just-added-task`/`taskFlash` tints, calendar, modals, toast, scrollbar. Each becomes a
  token (add `--danger`, `--danger-bg`, `--carry`, `--carry-bg`, `--flash` etc. with a light
  value in the light block) or gets a light override. List every one in the audit.
- Toggle: `.theme` pill in `.top .utils` (Dark | Light, `aria-pressed`), exactly the mockup's
  markup. On click: set `document.documentElement.dataset.theme`, persist to
  `localStorage 'dailyOS_theme'` (per-device preference — NOT in `S`, no sync, no schema),
  and update `<meta name="theme-color">` (#12141b / #f6f6f8). Apply the stored value before
  first paint (tiny inline script in `<head>` right after the meta, so there is no flash).
- `manifest.json` untouched (standalone chrome uses theme-color meta at runtime).

## Dependency map (from scout — every id must survive or be guarded)

Render targets: `sStreak sTasks sNnPill sNn` (renderStats), `syncPillDot syncPillText
syncDot syncMenuItem` (syncSetStatus), `searchResults` (searchTasks/searchJump), `paMsg`
(showPa, ~15 callers), `evList`→ now `railUp` content (renderEvents), `wkBdg wkList`
(renderWeek), `paText` (renderPaText — guard). User-action: `sbSearchBtn sbSearchWrap
searchInp`, `dataMenu importFile syncPill`, `eventForm evTitle evDate evTime evRepeat
evReminder`, `wkChev`. Day-card ids (`quickAddInp` etc.) are regenerated per render;
`quickAddInp` goes away with `quickAdd()` — update `focusQuickAdd`.

## Verification (mandatory)

Preview via `daily-os` (8741). Confirm `localStorage.getItem('dailyOS_syncKey')` is null, then
inject Ben's real state for realistic checks:
`S = (await syncRpc('dailyos_pull',{sync_key: <SYNC_KEY.txt>})).data; localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); render();`
(no key is stored, so nothing can push). Check at 1280px, 2000px and 375px:

1. Structure: `.top`, `.now`, `.today .list`, `.parking`, `#rail` with three sections present;
   no `.sidebar`, `.sb-*`, `.pa-strip`, `.sd-nudge`, `.quick-add`, `.nn-strip` in the DOM.
2. Now block: with an open task → h1 is that task; tick everything → "Clear day. N done…";
   `.then` lists today's events with past ones struck.
3. Daily row: ticking it updates the streak/`sNn` logic (call `renderStats` — no throw) and
   the "All non-negotiables" banner still fires.
4. Add box: plain text → lands on viewDay; "X tomorrow" → lands on tomorrow and the view
   jumps; "gym every tuesday" → creates a recurring (then `rmRecurring` it); parking add works.
   Check `S.custom`/`S.recurring` directly, then clean up test items.
5. Rail: countdown shows pins with correct days; unpin/pin from an event row updates it;
   Coming up groups by day, `Later · N` expands; `+ Add` opens the form, adding + deleting an
   event works. This week toggles.
6. Top bar: calendar dropdown opens/closes (outside click), search opens, typing shows
   results, jump works; `⋯` opens the data menu, `syncSetStatus('ok','on · up to date')`
   updates the dot/text without throwing; Day off toggles; week arrows.
7. `showPa('test')` shows the toast. Move menu and edit modals open. Tick pop animation fires.
8. Zero console errors across all of the above. 375px: no horizontal overflow, rail stacks
   under Today, day strip one line.
9. Screenshot at 1280px next to `concept.html` at the same width; note any visible
   divergence in the audit.
10. Light theme: toggle → `data-theme="light"` on `<html>`, `localStorage.dailyOS_theme`
    set, theme-color meta updated; reload keeps it; every screen from checks 1–8 re-run once
    in light (structure + zero console errors), plus a contrast spot-check of task text,
    muted meta, badges, done rows and the toast on the light ground (all ≥ 4.5:1 for text).
    Toggle back to dark, confirm the stored value clears/updates.

Write `audit-phase2.md` (every function/section changed, id checklist with the fate of each,
verification values, deviations) and update `progress.md`.
