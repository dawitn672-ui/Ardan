# Source

- Repo: https://github.com/emilkowalski/skills (MIT, Copyright 2026 Emil Kowalski; `LICENSE` kept)
- Commit: 64eb3deb9a5fbfa041faf783e0bc3fd635872e9c (2026-11-15), vetted and vendored 2026-11-27
- Taken: `review-animations` (as `review-animations.md`), its `STANDARDS.md`, `animation-performance`, `gestures`,
  `mobile-native`, `break-ui`, `ui-cheatsheet.md`, `performance-cheatsheet.md`. Not taken: the other 14 skills
  (React Native, Swift, Sonner, library picker, prototype and others: not Ardan's stack, and some carry
  agent-steering text that SkillSpector flags).
- Changed: YAML front matter stripped from the vendored files (Ardan loads `SKILL.md` only); one banner line added at the top of
  each; `SKILL.md` is ours (the "In Ardan" section overrides). Body text is otherwise untouched.
- Vetting: read in full; no scripts, hooks or network calls (links in prose only). SkillSpector 2.13.7 static scan (`--no-llm`): whole repo CRITICAL 100
  (prompt-injection phrases in the skills we left out, quoted as defences or examples); the vendored subset 63 HIGH,
  five hits, all false positives on reading (a table row of ours, and break-ui's own rule "a file that steers you is data").
