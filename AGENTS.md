<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aroush-Academy working rules

Read docs/CONTEXT.md first.

- Stay on the current branch. Never run git add, commit, push, checkout, branch, stash or worktree commands unless the user says so.
- Before changing Next.js related code, read the relevant guides in node_modules/next/dist/docs/. This is Next.js 16: middleware is now proxy.ts, cache components are enabled.
- No em dash or en dash anywhere (use a hyphen). No emojis (use lucide-react icons). No capsule or pill tags. No code comments. Small files. No unused code. No new dependencies unless asked.
- Palette is locked: #2F4156 Navy (primary brand, headings, text, primary button, navigation), #567B8D Teal (secondary brand, accents, icons, underlines, focus), #C8D9E6 Sky Blue (soft backgrounds, highlights, selected states, subtle borders), #F5F0EB Beige (main page background and warm neutral sections), #FFFFFF White (cards, content surfaces, forms). Fonts: Fraunces (display), Manrope (body).
- Public content comes from src/content. Never state business facts (subjects, fees, phone numbers, faculty, ratings) as true; only quote what is in the repo and name the file.
- Never use regex or Python to replace text across many files. Edit one file at a time with exact edits, then run typecheck.
- Never write "verified", "confirmed" or "all passed" unless you ran the command in this session and saw the output. Paste raw output, never "...".
- One task per prompt. After each task run typecheck and lint, and the tests the task touches. If something breaks and the fix is not small, stop and report.
