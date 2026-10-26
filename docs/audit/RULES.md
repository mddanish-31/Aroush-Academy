# Work Rules

You are auditing the Aroush-Academy repo (Next.js 16.4, React 19, TypeScript, App Router, branch frontend-redesign). This is a READ-ONLY audit. Do not edit, create or delete any file under src/, scripts/, public/ or config files. Do not run git add, git commit or git push. You may only create files inside docs/audit/ and qa-output/audit/. Before coding or checking anything about Next.js behaviour, read the relevant guides in node_modules/next/dist/docs/.

WORK RULES
1. Work in numbered steps. After each step append its findings to the phase file docs/audit/phase-N-name.md immediately. Never keep findings only in the chat.
2. At the start of every phase, re-read docs/audit/RULES.md and docs/audit/PROGRESS.md. When a phase finishes, tick it in PROGRESS.md with the time and the phase file name. Then continue to the next phase without waiting, unless a rule below says stop.
3. If you lose context, restart, or the network drops: read RULES.md, PROGRESS.md and the existing phase files, then continue from the first unfinished step. Do not redo finished steps.
4. Every finding has: ID (P3-007 style), severity (blocker, high, medium, low), file path with line numbers, one sentence on what is wrong, evidence (the code line, a command output, or a Playwright result), and a one sentence suggested fix. A finding without a file path and line number is not allowed.
5. Never write "verified", "confirmed" or "works" unless you ran a command or opened the file in this session and saw it. If you only read code, write "static only". Everything you did not check goes into a "Not checked" list at the end of each phase file with the reason.
6. Do not state business facts as true (subjects taught, class ranges, fees, phone numbers, faculty, ratings). Only quote what is in src/content or src/data and name the file. Mark such items "needs owner confirmation".
7. Style rules the project follows; report violations as findings: no em dash or en dash anywhere, no emojis, no capsule or pill tags, no code comments, small files, lucide-react icons only, locked palette #F5F5F7 #1D1D1F #AAAAAA #007AFF #FFFFFF with #007AFF never used as small text colour, fonts Fraunces and Manrope.
8. If a tool does not work (dev server will not start, Playwright fails), say so once at the top of that phase file and continue with static review. Do not fake results.
9. Keep each phase file under 400 lines. If there are more findings, keep the top 40 by severity and write the count of the rest at the bottom.
10. Never write "Unverified items: None" or "everything verified". Every phase file ends with a "Not checked" list that is not empty.
11. When you quote command output, paste it raw. Do not write "..." or "all passed" in place of output. If output is longer than 40 lines, save it to docs/audit/raw/<name>.txt and link it.
12. For every style-rule finding, count occurrences with a grep command and paste the command and its count. Do not estimate.
13. Use one dev server on port 3000 and one production server on port 3001 only when a step needs them. Stop both when the audit ends. Screenshots go to qa-output/audit/.
14. For tests of tampered storage or other users' data, only use the local app and demo data. Do not contact any external service except Unsplash image URLs already in src/content/media.ts.
