# Source

- Repo: https://github.com/pbakaus/impeccable (Apache-2.0; `LICENSE` kept)
- Commit: 2fc5e1459efbbf06d92c7306517c286bf12490cf (2026-11-26), read 2026-11-27
- Taken as reference: `reference/craft-floor.md`, `reference/critique-rubric.md`, `reference/ios.md` (skill dir
  `.claude/skills/impeccable/`). NOT taken: `SKILL.md`, the launcher `scripts/impeccable` (downloads a binary on first
  run), the design hook, `live` mode (can launch `codex` or `claude` with approvals off), `init` and `document`
  (write PRODUCT.md and DESIGN.md), the font fetcher, 40 other references, and the 4,800-file multi-tool tree.
- Changed (Apache section 4(b), prominent notice): a banner line on each file; in `craft-floor.md` the screenshot
  command and the font-fetch command are replaced by Ardan's, and the "reach past transform and opacity" sentence is
  struck. `SKILL.md` is ours; the rest is untouched.
- Vetting: read the main SKILL.md, critique.md, craft-floor, rubric, ios, the launcher. SkillSpector 2.13.7 static scan (`--no-llm`):
  CRITICAL 100 on the whole tree (live mode, hooks, binary download, agent-steering text), which is why only three
  reference files are kept; the kept subset scores LOW 19, SAFE (two medium notes on persona text and the licence).
