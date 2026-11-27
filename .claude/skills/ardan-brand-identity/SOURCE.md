# Source

- Repo: https://github.com/fatihaydost/brand-identity-skill (MIT, Copyright 2026 Fatih Aydost; `LICENSE` kept)
- Commit: af7ba40fe067b8b4aaeb2af90ed6c8996d014791 (2026-11-15), read 2026-11-27
- Taken: `references/` logo, type, color, cohesion, ai-defaults, accessibility, critique, kit (design knowledge as
  prose). NOT taken: all Python scripts (they fetch Google Fonts, `raw.githubusercontent.com` and PyPI through `uv`,
  and drive a headless browser), the font catalogue, templates and assets (2.4 MB of data).
- Changed: a banner line on each reference saying the `brand.py` commands and font downloads are not available;
  `SKILL.md` is ours (the "In Ardan" section overrides). Reference text is otherwise untouched.
- Vetting: SKILL.md, all eight references and the pydeps/network code read. SkillSpector 2.13.7 static scan (`--no-llm`): the whole skill dir
  timed out at 250 s (1.2 MB of scripts); the kept subset scores LOW 19, SAFE.
