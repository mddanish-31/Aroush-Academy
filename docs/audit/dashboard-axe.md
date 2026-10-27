# Dashboard axe summary (dev run 2026-10-27)

Source: qa-output/qa-dev.txt, QA_URL=http://localhost:3000, Playwright 1.64.1 Chromium.
Run totals: 287 PASS, 83 FAIL. 101 axe detail lines, 3 distinct rules.
"combos" = unique role + module + viewport combinations the rule failed in.

## Failure split

- Serious or critical violations: 60 failing checks, 284 nodes total.
- Incomplete color-contrast items: 23 failing checks, 73 nodes total.
- Other failures: 0 (Section 5 dropdown timing passed this run, mobile select accessible name passed).

## Top rules by total node count

| rule id | impact | total nodes | combos | example selectors | likely source file |
| --- | --- | --- | --- | --- | --- |
| color-contrast | serious | 190 | 37 | tr:nth-child(1) > td:nth-child(2) > div > div ; tr:nth-child(2) > td:nth-child(2) > span ; div[aria-label="Timetable schedule table"] (16 detail lines) | AssessmentsModule.tsx (87 muted-text uses; same pattern in FeesModule.tsx, DirectoryModule.tsx, DashboardShell.tsx) |
| select-name | critical | 126 | 42 | div:nth-child(1) > select ; div:nth-child(2) > div:nth-child(2) > select ; div:nth-child(4) > div:nth-child(2) > select | DirectoryModule.tsx (17 bare selects; also AssessmentsModule.tsx 16, StudyMaterialsModule.tsx 12, TimetableModule.tsx 10) |
| label-content-name-mismatch | serious | 41 | 8 | div[data-testid="timetable-event-time-1"] ; div[data-testid="timetable-event-time-sim-1"] ; div[data-testid="timetable-event-time-3"] | TimetableEventCard.tsx (data-testid and aria-label at lines 62 and 71) |

## Probable root cause per rule (guess)

- color-contrast (guess): muted inline text, mostly var(--color-neutral-dark) (#555558) plus accent, success and warning colours, is placed on tinted card, badge and table-cell backgrounds; the pair passes on white but drops under 4.5:1 on coloured parents, and axe marks many as incomplete where backgrounds are translucent.
- select-name (guess): filter selects are rendered as bare <select> elements with no aria-label and no associated <label>, for example DirectoryModule.tsx line 1344; nearly every module with a filter select fails.
- label-content-name-mismatch (guess): TimetableEventCard.tsx builds aria-label from displaySubject, displayTime, displayBatch and teacher, but the visible time text rendered inside the card is not contained verbatim in that string, so the accessible name does not match the visible text.

## Notes

- The same three rules cover every failing module; no other rule reached serious, critical or incomplete-contrast thresholds in this run.
- Rule detail lines in qa-output/qa-dev.txt carry role, module, viewport, rule id, impact, node count and the first 2 selectors per failure.
