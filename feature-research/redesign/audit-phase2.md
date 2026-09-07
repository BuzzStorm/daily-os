# Redesign phase 2 — audit

## Files changed

1. `index.html` — modified (the app; CSS block, static shell, render/add/rail/theme JS)
2. `feature-research/redesign/audit-phase2.md` — created (this file)
3. `feature-research/redesign/progress.md` — modified (phase status)

Nothing else touched. Not committed, not pushed. `sw.js`, `manifest.json` untouched.
Working tree diff: `index.html | 855 insertions(+), 2236 deletions(-)`.

## What changed, by plan step

### 1. Layout shell
- `<head>`: 5-line inline script right after the theme-color meta applies a stored
  `dailyOS_theme=light` before first paint (sets `data-theme` + meta colour).
- `<body>`: `.app/.main/.sidebar` replaced by `.shell > .top + .search-wrap + .cols(main#main, aside.rail#rail)`
  + fixed `#paMsg.toast`. The whole old sidebar block is gone.
- CSS: `.app .main .sidebar .hdr .greeting .date-line .day-nav .day-btn`, all `.sb-*`,
  `.pa-strip*`, `.quick-add*`, `.sd-nudge`, `.nn-strip*`, `.nn-chip*`, `.nn/.nn-dot/.nn-txt/.nn-biz`,
  `.focus-*` (card/label/pulse/title/sub/countdown/evening), `.cd-hero*`, `.block*`/`.bk-*`
  (except the add box), `.blocks`, `.inline-event*/.ie-*`, `.now-tag`, `.parking-block`,
  `.parking-tag`, `.evening-block`, `.outstanding*`, `.ot-*`, `.past-summary*`,
  `.missed-*`, `.prog*/.pd`, `.event-banner*`, `.t-rep`, `.t-meta`, `.t-divider`,
  `.sd-card/.sd-head/.sd-title/.sd-count/.sd-progress/.sd-park`, `.sd-ev*`, `.sd-cat`,
  `.sd-carry`, `.gym-gear`, `.qa-form/.qa-hint/.qa-row`, `.pa-msg`, `.ev-group/.ev-now/
  .ev-item/.ev-date/.ev-txt/.ev-days`, `.sr-`… kept, `blockHighlight/blockComplete/chipPop`
  keyframes deleted. Each was grepped: zero JS/markup use after the render rewrite.
- New CSS copied from the mockup: `.shell .top .today-label .week .day .utils .theme
  .cols .now .eyebrow .sec-head .progress .list .row .meta .cat .dur .rep .chip .tick(→.tck)
  .parking .rail .count .up .d .dh .ev .bd`, plus `.sync .icon-btn .data-menu .search-wrap
  .later .mh .toast .badge .chev`.

### 2. Top bar
- `.today-label` = "Sunday <span>6 September</span> ▾", `onclick="toggleCalendar()"`,
  `position:relative`, `#calendarDrop` inside it. `_calOutsideClick` now ignores clicks
  inside `.today-label` (was `.date-line`).
- `#week`: same handlers (`changeWeek(±1)`, `switchDay`), `.day` 36px, "Today" label,
  `.has-tasks` dot. Rendered by the new `renderTop()` (called first in `render()`); the
  mobile centre-scroll moved there and targets `.week`.
- `.utils`: `<b id="sTasks">` done · `<b id="sStreak">` streak · hidden `#sNnPill/#sNn` ·
  `#syncPill` (`#syncPillDot` + `#syncPillText`, `openSyncSetup`) · Book haircut `<a>`
  (CSS hover; inline handlers dropped) · `#topBtns` slot (TODAY when off-week, Day off /
  Back to work with `.hdr-link.on`; inline handlers dropped) · `#sbSearchBtn` →
  `toggleSbSearch()` · `.icon-btn` ⋯ wrapping `#syncDot` + `#dataMenu` (`toggleDataMenu(this)`
  receives the wrapper) · `#importFile` · `.theme` pill.
- `.top` sticky, `background:var(--bg)`, z-index 20, own top padding (28px) so the stuck
  bar covers content. Measured height 78px at 1280.

### 3. Now block — `renderNowBlock(day)` (new), `dayEventSpans(day)` (new)
- Today: h1 = first open carry (in `getCarryTasks()` order) else first open task in
  `listTasks()` order; carry gets `<span class="soft">— carried from Ddd</span>`. Nothing
  open → `Clear day. <span class="soft">N done, nothing waiting.</span>` (N = done count of
  `listTasks(today)`, the same number as `#sTasks`). `.then` = today's events sorted by
  time, `<span class="t mono">HH:MM|all day</span>`, `.past` via `timeToMin < getNow()`,
  ⚽ + `MUFC` / `HOL` badge kept; each span opens `editEvent`.
- Other days: eyebrow Planning ahead / Looking back, h1 = weekday line, `.then` =
  the tasks-planned sentence (+ that day's events after it — see deviations).
- `renderCountdownHero()` no longer returns HTML here; `renderMain()` still calls it
  first so the stale-pin cleanup + `save()` run exactly where they always did.

### 4. Today section — `renderDayCard(day)` rewritten, `nnRow()` + `addBoxHtml()` new, `sdTaskRow()` rewritten
- `.sec-head` h2 Today/weekday + `.count` "N of M done"; `.progress` 2px.
- `.list` card = old `.sd-card` (drag attrs, `data-zone="list"` kept). Row order:
  done Daily → done carries → done tasks → open Daily → open carries → open tasks.
  Display-only; `S.order` untouched.
- Daily rows: one `.row.pin` per `NN`, tick = existing `toggle('${n.link}')`, `.chip.daily`.
  Weekdays only (as the old strip). `nnStripHtml()` deleted; `renderNn()` untouched (it
  already guards `#nnBdg`).
- `sdTaskRow`: `.row` (was `.task`), `done` class on the row, `.meta` = `[chip.carry "from
  Ddd"] [.cat --dot] [.dur mono] [.rep ↻]`. `CAT_NAME` const added (Liquid Biz / Private
  Label / Bark Spa / Life / Admin). `.sd-cat` bar and `REPEATS` tag gone; notes, grip,
  move, remove, drag handlers unchanged. `carryChipLabel()` now returns the home weekday
  ("Sun") when ≤6 days old, else "d Mon".
- `toggle()` and `dragTask()` `closest('.task')` → `.row`; the `.nn-chip` pop lookup removed.
- Done rows: `.row.done, .row:has(.tck.done)` → padding 8px, background `var(--s1)`
  (measured rgb(24,27,36) = card). Tick pop + row flash kept (verified `just-done` +
  `just-completed` classes fire).
- `.sd-nudge`, bottom `.quick-add`, `quickAdd()` deleted. `focusQuickAdd()` → focuses
  `.list[data-zone="list"] .bk-add-inp`; keyboard `n` uses it.
- Placeholder: `Add to today — try “Call mum tomorrow 10 mins”` / `Add to Thursday…`.

### 5. Parking lot — `renderParkingLot(day)` rewritten, `showParkAdd()` new
- Empty (no user-parked tasks, no parking carries): `<div class="parking"><b>Parking lot</b>
  <span class="n">nothing parked</span> + park…</div>` + a hidden `.list[data-zone=parking]`
  holding only the add box; "+ park…" unhides + focuses it. Today only (as before).
- Non-empty: `.parking-sec` with `.sec-head` "Parking lot · optional · d of n done" and a
  `.list` (template row + user rows + carries + add box). Drag/drop attrs kept.

### 6. One add path — `addTaskFromText(text, {zone, cat, dur, when})` new; `paAdd`, `quickAdd` deleted
- Body is `paAdd`'s, moved verbatim: detectCat → parseDuration → "every <day>" →
  `S.recurring.push` + `showPa` → parseTime/parseWhenFromText/parseDayName + text cleanup →
  week → `S.weekly.push` + `showPaWithMove` → else `S.custom[day][zone].push`. Same object
  shapes (`{id, text, done:false, cat, dur}` / recurring / weekly), same `save()` calls.
- Differences from paAdd: `zone` param (parking default cat `privatelabel`, as
  `listQuickAdd` did); "this week" in the text triggers the week path (the old selector is
  gone); toast + view-jump only when the task landed on a day other than `viewDay`.
  Returns `{kind, id, day, zone}`.
- `listQuickAdd(zone, inp)` → `addTaskFromText(text, {zone})`; same-day custom adds refocus
  the same card's input; routed adds scroll the list into view; `_lastAddedTaskId`
  highlight timing unchanged (verified `.just-added-task` present).

### 7. Rail
- `renderCountdownHero()` writes `#railCount` (`<h3>Counting down</h3>` + one
  `.count` per pin: `n mono` days, `b` name, `small` "Mon 16 Nov · Marbella · 10 weeks",
  `.unpin` → `unpinCountdown`). `hidden` when no pins. Stale-pin cleanup unchanged.
  `renderCountdownCard` → `renderCountdownRow`.
- `renderEvents()` rewritten to `#railUp`: per-day groups for `daysAway < 14`
  (`Today`, `Mon 7`, …), `.ev` = `t mono | x (+ .sub location, 🔔) | .bd MUFC/HOL |
  .acts (📌 togglePinCountdown · ✕ rmEvent)`, row click `editEvent`. Then
  `Later · N` button (`toggleLater()`, `_laterOpen` state survives re-render) expanding
  the rest of the 60-day horizon under `.mh` month labels. Empty state text kept.
- `+ Add` in the h3 → existing `toggleEventForm()`; `#eventForm` + all `ev*` ids moved into
  the Coming up section; `addEvent` unchanged.
- `#railWeek`: `#wkList`/`#wkBdg`/`#wkChev` + `toggleSbSec`, collapsed by default.
  `renderWeek` guards `#wkList`/`#wkBdg`; empty text added.

### 8. Toast
- `#paMsg` is a fixed bottom-centre `.toast` (z 950); `showPa`/`showPaWithMove` untouched.
  `.pa-strip`/`#paText` removed; `renderPaText()` guarded and left in place.

### 9. Mobile block rewritten (`≤900px`)
- `.shell` safe-area padding; `.top` wraps (`gap 14px 20px`), `.utils margin-left:0` +
  wraps; `.week` nowrap/scroll with 36px `.day`; `.cols` single column (rail follows in
  source order, no `nth-child`/`order` rules); `.rail gap 34px`; `.row.pin` 40px;
  `.tck` 26px. `≤480px`: `.shell` 14px, `.rail .count small` hidden.

### 10. Guards / cleanups
- `renderStats`: every target guarded (`sNnPill` forced hidden; `sNn` still updated).
- `renderWeek`, `renderPaText`, `renderEvents`, `renderMain`, `renderTop`,
  `renderCountdownHero`: null-guarded on their containers.
- Deleted functions: `paAdd`, `quickAdd`, `nnStripHtml`, `sdEventRow`,
  `renderCountdownCard` (→ `renderCountdownRow`). Inline hover handlers on the Haircut
  link / Day off button removed.

### 11. Light theme + toggle
- `:root[data-theme="light"]` block redefines tokens only (values from the plan, plus the
  new tokens below). Dark stays the default; OS preference deliberately not followed.
  `.ae-date` gets `color-scheme: light` under the light stamp.
- `setTheme(t)`: sets/clears `documentElement.dataset.theme`, stores `dailyOS_theme`
  (`'light'|'dark'`), updates `<meta name="theme-color">` (#12141b / #f6f6f8), syncs
  `aria-pressed`. `syncThemeButtons()` runs at load. Nothing written to `S`.
- **Light --muted deviates from the plan's #6b7186 → #61677c** (4.49:1 on --bg failed the
  ≥4.5 gate; now 5.2:1 on --bg, 5.6:1 on --s1). **Light --faint #a3a8ba → #8a90a4**
  (2.19 → 2.95:1, matching dark's 3.0:1) so times/durations are legible.

## Literal colours → tokens (every one, with the light value)

| Was | Where | Now |
|---|---|---|
| `#d9846f` / `#e6a08d` | `.hdr-link.on` | `--danger` (#e06c75 / #c8414b) |
| `rgba(217,132,111,.14)` + `#d9846f` | `.sd-carry` | `--carry` / `--carry-bg` (#d9846f,.14 / #b9634a,.12) |
| `#c45050`, `rgba(196,80,80,.1)` | `.t-rm:hover .wt-rm:hover .ev-rm:hover .sb-data-item.danger .bk-cap.over` | `--danger` / `--danger-bg` |
| `#e06c75` | sync-err dots, Disconnect button (inline) | `--danger` |
| `#6fbf73` | sync-ok dots | `--done` |
| `#DA291C`, `rgba(218,41,28,…)` | `.sd-ev.mufc`, `.inline-event.is-mufc`, MUFC tag (inline), search dot (inline) | `--mufc` / `--mufc-bg` (#e0433a,.14 / #c4241a,.12) |
| `#6ea8b8`, `rgba(110,168,184,…)` | holiday variants, HOL tag (inline) | `--accent2` / `--accent2-bg` (#6ea8b8 / #3f8a9e) |
| `#0c0d11` | `.now-tag`, `.cal-day.selected`, weekly move chips (inline) | `--on-accent` (#0c0d11 both) |
| `#fff` / `white` | `.tck.done::after`, `.wt-ck.done::after`, `.nn-chip-ck`, NN banner (inline) | `--on-done` (#fff both) |
| `rgba(0,0,0,.6)`, `rgba(10,11,16,.7)` | edit-task / edit-event modals, sync setup overlay (inline) | `--overlay` (rgba(0,0,0,.6) / rgba(20,22,40,.45)) |
| `rgba(0,0,0,.4/.5)` shadows | `.sd-menu`, `#searchResults`, `.cal`, `.sb-data-menu`, `.update-toast`, day picker (inline) | `--shadow-pop` |
| `rgba(255,255,255,.04–.08)` hairlines | `.wt`, `.sr-item`, `.gym-picker`, `.ev-*`, `.nn`, `.outstanding-hd` | `--hairline` (light: rgba(20,22,40,.06)) |
| `rgba(255,255,255,.06)` hover | `.update-toast .ut-dismiss:hover` | `--hover` |
| `rgba(212,164,74,.15)` / `rgba(90,158,124,.2)` | `taskGlow`, `taskFlash` | `--accent-bg` / `--done-bg` |
| `rgba(226,178,87,…)`, `rgba(212,164,74,…)` | `.capacity-banner.short`, `pulse` keyframes | `--accent-bg` / `--accent-border` |
| `rgba(90,158,124,.4)` | NN banner box-shadow (inline) | `--done-bg` |
| `#888db0` | `.outstanding-sub` | deleted with the rule |
| `stroke="#8a90a3"` | search icon svg | `currentColor` on `.search-wrap .ico` (`--muted`) |
| `color-scheme: dark` | `.ae-date` | light override under `[data-theme=light]` |

Remaining literals: the two token blocks, the theme-color meta + head script + `setTheme`
(the meta values by design), the favicon data-URI and the notification icon SVG (icons,
not themed). `manifest.json` untouched.

## Dependency-map id checklist

| id | fate |
|---|---|
| `sStreak` | kept, `.utils` (`renderStats` guarded) |
| `sTasks` | kept, `.utils` `<b>` (guarded) |
| `sNnPill` / `sNn` | kept, hidden (`display:none`, forced in `renderStats`); value still written |
| `syncPillDot` / `syncPillText` / `syncPill` | kept, `.sync` in `.utils` |
| `syncDot` | kept inside the ⋯ `.icon-btn` |
| `syncMenuItem` / `dataMenu` / `importFile` | kept inside the ⋯ wrapper (`toggleDataMenu(this)` gets the wrapper) |
| `searchResults` / `searchInp` / `sbSearchWrap` / `sbSearchBtn` | kept, `.search-wrap` under the top bar |
| `paMsg` | kept, now `.toast` fixed bottom-centre |
| `evList` | **removed** → `renderEvents` writes `#railUp` (guarded) |
| `wkBdg` / `wkList` / `wkChev` | kept, `#railWeek` (`renderWeek` guarded) |
| `paText` | **removed**; `renderPaText` guarded |
| `eventForm` / `evTitle` / `evDate` / `evTime` / `evRepeat` / `evReminder` | kept, moved into the Coming up section |
| `calendarDrop` | kept, inside `.today-label` |
| `main` | kept (`renderMain` target) |
| `quickAddInp` | **removed** with `quickAdd()`; `focusQuickAdd` retargeted |
| `qaInp` / `qaCat` / `qaDur` / `qaWhen` | **removed** with `paAdd()`; keyboard `n` → `focusQuickAdd()` |
| `nnBdg` | never existed; `renderNn` already guards |
| new: `topDate`, `week`, `topBtns`, `railCount`, `railUp`, `railWeek`, `parkAdd` | written by `renderTop` / `renderCountdownHero` / `renderEvents` / `renderParkingLot`, all guarded |

Runtime check after final reload: none of the 33 ids above that should exist is missing.

## Verification (preview `daily-os` @ localhost:8741, viewport emulated; page `today()` = 2026-09-06, a Sunday)

Sync key: `localStorage.dailyOS_syncKey` = null throughout, `dailyOS_syncDirty` = "0".
`dailyos_pull` with the key in `SYNC_KEY.txt` returned `null` (no cloud row for that key
— it may have been rotated), so the preview's existing localStorage state was used: 129
events, custom days through 2026-09-10, one pin (Baby due). Realistic enough for every check.

Service worker: 0 registrations / 0 caches on the preview origin (http, SW never
registers); every reload used a cache-busting query.

1. Structure (1280): `.top .now .today .list .parking #rail(3 sections)` present; `.sidebar
   .sb-* .pa-strip .sd-nudge .quick-add .nn-strip .app .main .hdr` absent. Document scrolls.
2. Now: h1 "Flight claim" (first open). Tick everything → "Clear day. 2 done, nothing
   waiting." (header `2/2`, count "2 of 2 done"); restored → "Flight claim". `.then` =
   `past|14:00 ⚽ Everton vs Man Utd (A) MUFC` (struck, badge not struck).
3. Daily row (Mon 7 Sep): row 0 = "Creatine + protein + multivit · Daily" chip; tick →
   `.row.pin.done`, `#sNn` 1/1, `renderStats()` no throw, "All non-negotiables done" banner
   fired; untick → 0/1. Weekend: 0 pin rows.
4. Add box (via `addTaskFromText`, the path `listQuickAdd` calls):
   - "Zz plain test" → `S.custom[2026-09-06].list`, viewDay unchanged, `.just-added-task` present.
   - "Zz tomorrow test 10 mins" → `S.custom[2026-09-07].list` `{text:"Zz test", dur:10,
     cat:"life"}`, view jumped to 2026-09-07, toast "Added to tomorrow (10min). Viewing now."
   - "Zz gym every tuesday" → `S.recurring` `{text:"Zz gym", dayOfWeek:2, dur:30}`;
     `rmRecurring` removed it.
   - parking "Zz park test" → `S.custom[today].parking` `{cat:"privatelabel"}`; card
     header "Parking lot · optional · 0 of 2 done"; after cleanup the one-liner
     "Parking lot nothing parked + park…" is back.
   - "Zz weekly this week" → `S.weekly` entry, toast with the Move day chips.
   Cleanup verified: `S.recurring`/`S.weekly` lengths back to baseline; state restored from
   a pre-test snapshot and `saveLocal()`'d.
5. Rail: `#railCount` "71 Baby due · Mon 16 Nov · 10 weeks ×", `countdownTarget` = 71.
   📌 on the first event row → pinned (2 counts), again → reverted. Groups: Today, Mon 7,
   Wed 9, Thu 10, Fri 11, Sat 12, Sun 13, Wed 16; "Later · 14" → 20 day groups under
   September / October / November; click again → collapsed. `+ Add` → form `display:block`;
   `addEvent` ("Zz test event" today 23:30) → in `S.events`, in the rail and in the Now
   `.then`; `rmEvent` → gone (and the `deletedSeeds` entry it leaves was removed). This week
   toggle: none → '' + chevron `.open` → none.
6. Top bar: calendar opens; outside click closes. Search opens + focuses, "flight" → 1
   result, `searchJump` hides results and jumps. ⋯ opens `#dataMenu`; outside click closes.
   `syncSetStatus('ok','on · up to date')` → `#syncPillDot` `sync-dot sync-ok`, text
   "synced", `#syncMenuItem` "Sync: on · up to date", `#syncDot` `sync-ok`, no throw.
   Day off (Mon 7) → `.on` "Back to work", `S.daysOff` updated, Daily row hidden; reverted.
   `changeWeek(1)` → viewDay 2026-09-07, TODAY button shown, label "Monday 7 September",
   eyebrow "Planning ahead"; `goThisWeek` → back.
7. `showPa('test toast')` → `#paMsg.show`, `position: fixed`. Move menu: Tomorrow / Pick a
   date… / To Parking Lot. Edit-task modal opens. Tick → `.tck.just-done` +
   `.row.just-completed` present at +60ms.
8. Console: zero messages/errors across all of the above (checked after each batch).
   375px: `scrollWidth` 375 = `innerWidth`, no element wider than the viewport, `.cols`
   single column (347px), rail top 610 > Today bottom 531, week strip one line
   (scrollable, active day centred), `.tck` 26px, `.top` wraps, `.utils margin-left 0`,
   `.shell` padding 14px, h1 26px.
   2000px: `.shell` 1080 wide, left offset 460 (centred), columns 660px + 300px, no overflow.
9. Side-by-side with `concept.html` at 1280 (screenshots taken of both): columns
   `660px 300px` / gap 56px / list 660 / h1 30px / countdown "N Baby due" / Coming up
   groups all match. Visible divergences: (a) app's top bar is 78px tall with 26px below
   (28px top padding so the sticky bar covers content) vs the mockup's 36px + 40px; (b)
   week strip keeps the app's Mon/Tue labels + ← → arrows (mockup: single letters, no
   arrows) per the plan; (c) app's utils carry sync / streak / ⌕ / ⋯ that the mockup omits;
   (d) the rail also has the collapsed "This week" section (planned deviation).
10. Light: Light button → `data-theme="light"`, `localStorage.dailyOS_theme = "light"`,
    meta `#f6f6f8`, `aria-pressed` dark=false/light=true; reload keeps it (head script).
    Structure check + zero console errors re-run in light. Contrast on the light ground
    (measured from computed styles): task text 16.96:1, done-row text 4.85:1 on the card,
    `.meta` 4.85:1, h1 15.72:1, toast text 15.03:1, MUFC badge 5.38:1, `.utils`/muted
    5.2:1 after the --muted bump (was 4.49). Tertiary `--faint` (times, durations) is
    2.95:1 in light / 3.03:1 in dark — the mockup's own tier, left as-is (see risks).
    Dark button → stamp removed, stored value "dark", meta `#12141b`, bg rgb(18,20,27);
    reload keeps dark.

`node --check` on the extracted script: OK.

## Deviations from the plan (and why)

1. **Light `--muted` #6b7186 → #61677c, `--faint` #a3a8ba → #8a90a4.** The plan's own
   contrast gate (≥4.5:1) failed for --muted on --bg at 4.49; --faint bumped for legibility
   of 11.5px times. Every other light value is as listed.
2. **Mobile `.top` is not sticky** (`position: static` ≤900px). Wrapped, it measures 180px
   at 375px — pinning that eats a quarter of the phone viewport. Desktop stays sticky.
3. **Parking "empty" ignores `PARKING_TEMPLATE`.** The template row ("Work on next
   PL/Bundle product") always exists, so a literal reading would never show the mockup's
   "nothing parked" line. Empty = no user-parked tasks and no carries; when anything is
   parked, the template row renders in the card as before. Ben may prefer the template row
   gone or always shown.
4. **Non-today `.then`** carries the day's events after the planned-tasks sentence (the
   old day card showed them via `sdEventRow`; dropping them would lose information).
5. **"this week" in typed text** routes to the weekly list (the old When selector is gone,
   so this is the only way to reach that path from the one add box).
6. **Short-day capacity banner kept** (rendered between Now and Today on Mon/Fri). The plan
   didn't list `shortDayCapacityHtml` for removal; the mockup has no equivalent.
7. **Same-day adds from the box don't toast** (the old inline box didn't either); routed
   adds do, exactly as `paAdd`.
8. Extra dead CSS beyond the plan's list was deleted only where grep showed zero use
   (`.outstanding*`, `.ot-*`, `.past-summary*`, `.missed-*`, `.prog*`, `.event-banner*`,
   `.gym-gear`, `.t-divider`, `.t-meta`, `.nn*` rows).

## Open risks

- Ben's real cloud state could not be pulled (the key in `SYNC_KEY.txt` returns null);
  checks ran on the preview's stored real-looking state. Worth a look on the real origin
  before pushing — especially a weekday with carries + a Daily row + parking carries.
- `--faint` text (times, durations, past events) sits at ~3:1 in both themes by design.
- Mobile `.top` at 375px is three rows (label / week / utils); `.utils` wraps to two
  lines. Functional, not pretty.
- The `.row:has()` fallback is now redundant with the `done` class; harmless.
- Pre-existing, not touched: `detectCat` matches "sd" inside "tuesday" (→ privatelabel);
  the weekly path picks Monday of the current week when every weekday is in the past.

## Post-review fixes (main session)

Reviewer verdict: fix-first on two blocking findings; four follow-ups folded in.

1. **BLOCKING — parking drop zone.** In the empty state the only `ondrop="dropTask(event,'parking')"`
   target was the hidden `#parkAdd` list, so list→parking drag silently did nothing (HEAD always
   rendered the card). The visible `.parking` line now carries `dropAttrs` too, with a
   `.parking.drag-over` dashed-outline affordance.
2. **BLOCKING — Daily row alignment.** `nnRow` lacked the invisible `.sd-grip` spacer every
   `sdTaskRow` emits, so the Daily checkbox sat ~20px left of task checkboxes. Spacer added.
3. "this week" was stripped from the title even when the week route was not taken (e.g.
   `call bank this week 3pm`). Strip is now gated on the same `weekRoute` condition the branch uses.
4. `dur` default: `opts.dur != null ? opts.dur : 30` — keeps the old 30-minute default the plan
   text omitted, but no longer coerces an explicit 0.
5. Weekday empty state restored: "Nothing else on the list yet." when only the Daily row shows;
   "Nothing on the list yet." otherwise; "Day off. Enjoy." unchanged.
6. `CAT_NAME` gains `break` / `evening` / `parking` so legacy-category tasks keep a label + dot.

Left as reviewer notes (Ben's call / cosmetic): light-theme accent-on-accent-bg chips ≈3.1:1
(mockup's approved tokens); `#searchResults` paints above the calendar/data menu when both are
open; `renderPaText`/`renderNn` are guarded no-ops per plan; `void wknd;` leftover.
