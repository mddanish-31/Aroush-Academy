# Incomplete Color-Contrast Nodes Diagnosis

| module | width | selector | text color | bg color | ratio | needs 4.5 or 3.0 | overlapping element | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Timetable & Rooms | 390px | `.btn-secondary:nth-child(1)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | button.btn-secondary > div > div | false positive |
| Timetable & Rooms | 390px | `.btn-secondary:nth-child(3)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | button.btn-secondary > div > div | false positive |
| Examinations | 390px | `div:nth-child(1) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 390px | `tr:nth-child(1) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 390px | `tr:nth-child(2) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 390px | `tr:nth-child(3) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 390px | `tr:nth-child(4) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 390px | `tr:nth-child(5) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Timetable & Rooms | 1440px | `div[data-testid="timetable-event-time-1"] > div:nth-child(2) > span:nth-child(1)` | #555558 | #EBF4FF (div) | 6.7:1 | 4.5:1 | none | false positive |
| Timetable & Rooms | 1440px | `div[data-testid="timetable-event-time-sim-1"] > div:nth-child(2) > span:nth-child(1)` | #555558 | #FFF7EB (div) | 6.97:1 | 4.5:1 | none | false positive |
| Examinations | 1440px | `tr:nth-child(1) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | button.btn-secondary > td > table | false positive |
| Examinations | 1440px | `tr:nth-child(2) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 1440px | `tr:nth-child(3) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 1440px | `tr:nth-child(4) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Examinations | 1440px | `tr:nth-child(5) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Overview | 390px | `tr:nth-child(2) > td:nth-child(7) > div > .btn-accent` | #FFFFFF | #1D1D1F (button.btn-accent ) | 16.83:1 | 4.5:1 | none | false positive |
| Overview | 390px | `tr:nth-child(3) > td:nth-child(7) > div > .btn-accent` | #FFFFFF | #1D1D1F (button.btn-accent ) | 16.83:1 | 4.5:1 | none | false positive |
| Overview | 390px | `tr:nth-child(4) > td:nth-child(7) > div > .btn-accent` | #FFFFFF | #1D1D1F (button.btn-accent ) | 16.83:1 | 4.5:1 | none | false positive |
| My Students | 390px | `tr:nth-child(1) > td:nth-child(8) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| My Students | 390px | `tr:nth-child(2) > td:nth-child(8) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| My Students | 390px | `tr:nth-child(3) > td:nth-child(8) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| My Students | 390px | `tr:nth-child(4) > td:nth-child(8) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Timetable & Batches | 390px | `.btn-secondary:nth-child(1)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Timetable & Batches | 390px | `.btn-secondary:nth-child(3)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 390px | `div:nth-child(1) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 390px | `tr:nth-child(1) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 390px | `tr:nth-child(2) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 390px | `tr:nth-child(3) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 390px | `tr:nth-child(4) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 1440px | `tr:nth-child(1) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 1440px | `tr:nth-child(2) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 1440px | `tr:nth-child(3) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Test Series & Marks | 1440px | `tr:nth-child(4) > td:nth-child(7) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Timetable & Schedule | 390px | `.btn-secondary:nth-child(1)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Timetable & Schedule | 390px | `div:nth-child(1) > .btn-secondary:nth-child(3)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Tests & Marks | 390px | `div:nth-child(1) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Tests & Marks | 1440px | `td:nth-child(7) > .btn-primary` | #FFFFFF | #1D1D1F (button.btn-primary ) | 16.83:1 | 4.5:1 | none | false positive |
| Timetable & Schedule | 390px | `.btn-secondary:nth-child(1)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Timetable & Schedule | 390px | `.btn-secondary:nth-child(3)` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Tests & Marks | 390px | `div:nth-child(1) > .btn-secondary` | #1D1D1F | #FFFFFF (button.btn-secondary ) | 16.83:1 | 4.5:1 | none | false positive |
| Tests & Marks | 1440px | `td:nth-child(7) > .btn-primary` | #FFFFFF | #1D1D1F (button.btn-primary ) | 16.83:1 | 4.5:1 | none | false positive |
