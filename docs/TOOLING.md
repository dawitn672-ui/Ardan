# Tooling: skills, plugins, agents and connectors

The record that `docs/MASTER_PROMPT.md` section 16 asks for: what is installed, the verdict on each item, the risks and
clashes, how to switch each one off and on again, and the counts before and after. Written 2026-11-25 (H-107, D-157).

**Status: proposed, waiting for the owner's yes.** Nothing has been disabled or uninstalled. The three new Ardan skills
and the `life-sim-systems` fix only add; they are in place.

## 1. Before: what this Claude Code session has (inventory, 16.0)

Counted in a cloud session (claude.ai/code) on 2026-11-25, from the session's skill list and from the plugin files the
session syncs from the owner's claude.ai account (`~/.claude/plugins/synced/…`, `~/.claude/skills/synced/…`).

| Kind | Count | Where it comes from |
|---|---|---|
| Plugins | **31** | the owner's claude.ai account (Customize > Plugins), synced into each session as `<name>@synced` |
| Skills in the skill list | **459** | 422 from the 31 plugins, 16 account skills, 16 bundled with Claude Code or the session, 4 project skills (`.claude/skills/`), 1 from the cloud environment (`session-start-hook`) |
| Skill and command files inside the plugins | 466 | 44 of them are not offered in the list (retired or set-up skills inside mattpocock-skills, vercel, design-superpowers and others) |
| Agent types from plugins | **64** | agentic-council 38, claude-security 17, backend-design 6, vercel 3 |
| Agent types of Claude Code itself | 5 | general-purpose, Explore, Plan, claude-code-guide, statusline-setup |
| Connectors with tools in this session | **7** | Claude Docs, claude-code-remote, GitHub, Supabase, Vercel (200+ tools), Cloudflare, Google Drive |
| Connectors bundled in plugins | 30 entries | engineering 10, productivity 9, design 9, cloudflare 1, vercel 1; none signed in (16 wait for sign-in, 2 failed, the rest are Google Calendar and Gmail stubs) |
| Plugin hooks that run on their own | 6 plugins | see the risks in section 4 |

**Context.** The plugin skills' descriptions add up to about 127,600 characters and the account skills' to about 9,800
(measured from the files; the listing may trim long ones at 1,536 characters each). That is roughly 35,000 tokens of
skill descriptions offered to every session before any work starts. The biggest: agentic-council 23,000 characters,
vercel 19,600, databricks 13,900, zizi-skills 11,700, unity 7,400. For an exact per-plugin figure the owner can run
`claude plugin details <name>@synced` (its "Always-on" line) or `/skill-doctor` in a terminal session.

**Compared with the owner's counts in section 16.** First count: about 163 skills, 3 agents, one connector of 200+ tools.
Later count: about 457 skills across 31 plugins plus 17 account skills. This session: the same **31 plugins**, holding
466 skill and command files (close to 457) of which **422** reach the list; **16** account skills, not 17 (this session
has none of `setup-claude`, `cowork-plugin`, `explain-usage`, `file-reading`, `pdf-reading`, `product-self-knowledge` or
`video-making`, and has no "remote devices" connector); **64** plugin agents, not 3. `arcads` and `expo` are **not
installed**. The `frontend-design` that section 16.1 calls a duplicate of a built-in is the **only** copy here, so it is
kept. Three account skills are older copies of this repo's own project skills (section 4).

## 2. Verdicts (16.6): Keep, Merge, Remove

"Merge" means: the useful rules are written in our own words into the named Ardan skill (done for the three Phase 0
skills; later ones noted with their phase), and then the plugin is disabled like a Remove. A plugin's skills cannot be
switched off one by one (Claude Code's `skillOverrides` does not reach plugin skills), so every verdict on a plugin is
for the whole plugin.

### 2.1 Plugins (31)

| Plugin | Skills / agents | Licence | Verdict | Reason (one line) |
|---|---|---|---|---|
| superpowers | 15 / 0 | see LICENSE | **Merge** → `ardan-dev-process`, then remove | Its design check, numbered plans, test-first, root cause first and "evidence before done" are now in `ardan-dev-process`; its SessionStart hook forces a skill check before every reply (clash). |
| design | 7 / 0 (+9 connectors) | see plugin | **Merge** → `ardan-ui-review` (critique, accessibility-review, ux-copy, design-system); `user-research` and `research-synthesis` → `ardan-playtest-synthesis` (Phase 7); then remove | Short, sound checklists; `design-handoff` has no job (we are the developer). Re-enable at Phase 7 only if the synthesis skill is not written by then. |
| mattpocock-skills | 11 listed (38 files) / 0 | MIT | **Merge** → `ardan-dev-process`, then remove | Its reproduce-first bug loop, red-green TDD and "grill the plan" ideas fit; the rest is TypeScript, issue trackers and writing workshops. |
| vectorlab-ux-skills | 20 / 0 | MIT | **Merge** → `ardan-ui-review`, then remove | Viewport floor of 375 px, reduced motion, verb-first buttons, error and empty-state wording taken; the rest is SaaS dashboards. |
| ui-consistency | 10 / 0 | MIT | **Merge** → `ardan-ui-review` ("match the screen beside it"), then remove | One good idea; its SessionStart hook injects always-on instructions (clash). |
| unity | 33 / 0 | Unity Companion | **Merge (ideas only)** → `ardan-release-pipeline` (Phase 6), then remove | Ideas recorded in section 2.5 so the plugin can go now: in-app purchases, live-game leaderboards, web size and memory, a polish checklist, localization. Ardan is not a Unity game. |
| vercel | 43 listed (56 files) / 3 | Apache-2.0 | **Merge (ideas only)** → `ardan-release-pipeline`, then remove | CSP writing and testing, secrets kept out of the repo, preview builds and rollback (section 2.5). Hosting is GitHub Pages or itch.io; its hooks send telemetry (risk). |
| frontend-design | 1 / 0 | see LICENSE | **Keep** | The only copy in this session; visual direction for new screens. |
| skill-creator (plugin) | 1 / 0 | see LICENSE | **Remove** | Identical to the account skill `skill-creator`, which is kept. |
| image-deep-research | 1 (+2 commands) / 0 | MIT | **Keep, disabled until Phase 1** | Looks at real images for the portrait and look research (6.8). Searches the web; turn on for that pass only. |
| claude-security | 5 listed / 17 | proprietary | **Remove until Phase 8** | Worth one scan when the game first talks to a backend; until then the game has no network. Hooks on every shell command (risk). |
| backend-design | 18 / 6 | MIT | **Remove until Phase 8** | Migration safety, idempotency and auth ideas belong to the Supabase phase (into `ardan-release-pipeline`); hooks run Python on every file edit. |
| game-trend-skills | 8 / 0 | MIT | **Remove** (re-read at Phase 10) | Hyper-casual mobile market scans; `launching-on-zero-budget` may be worth a read before the store. |
| animation-studio | 1 / 0 | MIT | **Remove** (dormant until a trailer) | Makes animated films with ffmpeg; a store trailer is the only use. |
| agentic-council | 74 / 38 | Apache-2.0 | **Remove** | Enterprise councils (finance, people, revenue), writes its own session folders and opens a browser page; the largest context cost. DECISIONS.md already tracks every choice. |
| zizi-skills | 35 / 0 | MIT | **Remove** | A startup grab-bag (grants, marketing, Tabler UI); `find-skills` installs more skills; `app-store` overlaps `ios-capacitor-release`. |
| ui-ux-behaves | 13 / 0 | MIT | **Remove** | Enterprise tables, forms and date pickers; nothing Ardan's screens use that `ardan-ui-review` lacks. |
| design-skills | 10 / 0 | MIT | **Remove** | 200 to 500-line versions of what `design` already gives; overlaps. |
| design-superpowers | 9 / 0 | MIT | **Remove** | Enterprise design systems and Figma (installs PluginOS through npx). |
| superdesign | 1 / 0 | MIT | **Remove** | An outside canvas service with sign-in, run through `npx --yes`. |
| design-council | 1 / 0 | Apache-2.0 | **Remove** | Five famous-designer personas; no clear job. |
| 10x-Team | 13 / 0 | MIT | **Remove** | Role-play of 12 engineering roles; every description says "You MUST use this" (clash). |
| reverse-engineering | 1 / 0 | Apache-2.0 | **Remove** | For compiled software; installs frida and mitmproxy. Ardan's release is already readable source (X1). |
| diagrams | 1 / 0 | MIT | **Remove** | The session's own `artifact-diagramming` covers it. |
| playground | 1 / 0 | see LICENSE | **Remove** | Interactive HTML explorers; no job here. |
| remotion | 12 / 0 | MIT | **Remove** | React video; `npx remotion`, ffmpeg. |
| meshy-3d-agent | 3 / 0 | MIT | **Remove** | A paid 3D service; asks for `MESHY_API_KEY`, `npm install -g`. |
| cloudflare | 24 / 0 (+1 connector) | Apache-2.0 | **Remove** | Workers, Durable Objects and Cloudflare One; another stack. |
| databricks | 36 / 0 | proprietary | **Remove** | A data platform; its hook reads every prompt you type. |
| productivity | 4 / 0 (+9 connectors) | see LICENSE | **Remove** | Its own memory and TASKS.md system would compete with this repo's memory files. |
| engineering | 10 / 0 (+10 connectors) | none found | **Remove** | Generic debug, testing and deploy checklists; the useful parts are in `ardan-dev-process`. |

### 2.2 Account skills (16; claude.ai Customize > Skills)

| Skill | Verdict | Reason |
|---|---|---|
| `deep-research` | **Keep** | The research loop (section 11). |
| `docs` | **Keep** | Design and roadmap documents (Claude Docs). |
| `skill-creator` | **Keep** | Writing and testing Ardan skills; replaces `superpowers:writing-skills`. |
| `xlsx` | **Keep** | Balance tables, skill-library review sheets. |
| `pdf` | **Keep** | Reading store and service documents. |
| `chrome-browser` | **Keep** (optional) | Helping with the store consoles; never enters payment details. |
| `docx`, `pptx` | **Keep** (optional cut) | Cheap and rare; cut both to save two places if the total runs high. |
| `life-sim-systems`, `game-ux-playtest-loop`, `realistic-continent-maps` | **Remove** | Older copies of this repo's project skills (the account `life-sim-systems` still has the breakthrough exploit line; the account `game-ux-playtest-loop` still says "one button moves time"). The repo's `.claude/skills/` copies are the truth. |
| `built-in-browser`, `computer-use` | **Remove** | For the desktop app; this work runs in cloud sessions. |
| `google-workspace`, `morning`, `import-memory` | **Remove** | Not for this project (16.1). |

### 2.3 Skills bundled with Claude Code or the session (16)

Kept: `dataviz` (balance charts), `artifact-design`, `artifact-diagramming`, `artifact-capabilities` (publishing pages),
`update-config` (settings and hooks), `code-review` (the large-step review), `simplify`, `run`, `loop`.
Turn off with `skillOverrides`: `plugin-authoring` (16.1), `claude-api` (Ardan has no model calls), `workflow-authoring`,
`keybindings-help`, `fewer-permission-prompts`, `init` (CLAUDE.md exists), `security-review` (back on at Phase 8).
`session-start-hook` comes from the cloud environment and stays.

### 2.4 Project skills (`.claude/skills/`, the repo's own)

Kept and owned here: `life-sim-systems` (breakthrough rule fixed, section 6), `game-ux-playtest-loop` (Phase 1 update),
`realistic-continent-maps`, `ios-capacitor-release` (the seed of `ardan-release-pipeline`; section 16 did not list it),
and the new `ardan-prompt-intake`, `ardan-dev-process`, `ardan-ui-review`. Planned (16.2): `ardan-balance-harness`
(Phase 1), `ardan-skill-system` and `ardan-war-core` (Phase 2), `ardan-playtest-synthesis` (Phase 7),
`ardan-release-pipeline` (draft Phase 6).

### 2.5 Ideas kept from removed plugins (for later Ardan skills, in our words)

- **For `ardan-release-pipeline`:** write the CSP as a list of exactly the origins the build needs and test it in a
  browser test that fails on a violation (vercel client-side-security); secrets live only in the service's settings or
  GitHub Secrets, never in the repo or a chat (vercel env-vars); every build gets a preview link and a one-step rollback
  (vercel deployments); purchases are checked on the server, restorable and tested in the store's sandbox (unity IAP);
  scores are accepted only from a server replay (unity live game); budgets for download size, boot time, memory and
  battery (unity optimize-web); a polish pass over art, feel, sound, menus and saves before a release (unity
  craft-game-floors); text kept out of code so it can be translated later (unity localization); migrations reversible,
  idempotent and locked down by row-level security (backend-design, Phase 8).
- **For `ardan-playtest-synthesis`:** timed-task scripts for the five real players; themes, then insights, then ranked
  recommendations, with player segments (design user-research, research-synthesis).

### 2.6 Connectors and agents

| Item | Verdict | Reason |
|---|---|---|
| Claude Docs | **Keep** | Docs and the owner's shared documents. |
| claude-code-remote | **Keep** | The cloud session's own controls (sessions, scheduled tasks, environment). |
| GitHub | **Keep** | The repo, pull requests, CI. |
| Supabase | **Keep, disconnected until Phase 8** | It can run SQL, apply migrations, deploy functions and pause or delete projects. When on: a development project only, branches for migrations, ask before any change to a live project. |
| Vercel | **Remove** (disconnect) | 200+ tools that can change domains, DNS and deployments; not our host. |
| Cloudflare | **Remove** (disconnect) | Not our host. |
| Google Drive | **Remove** unless the owner shares files there | Project documents live in the repo. |
| The 30 connectors bundled in plugins | **Remove** with their plugins | None is signed in; Slack, Linear, Notion, Jira and the rest have no job here. |
| Plugin agents (64) | **Remove** with their plugins | They belong to agentic-council, claude-security, backend-design and vercel. |
| Claude Code's agents (general-purpose, Explore, Plan, claude-code-guide, statusline-setup) | **Keep** | Built in; the playtester and reviewer agents run as general-purpose. |

## 3. Clashes with the master prompt (16, "Project rules win")

| Source | What it says | Clashes with | Resolution |
|---|---|---|---|
| `superpowers:using-superpowers`, injected on every session start by the superpowers SessionStart hook | "Invoke relevant or requested skills BEFORE any response or action — including clarifying questions…"; "If you think there is even a 1% chance a skill might apply… you ABSOLUTELY MUST invoke the skill." | 16 "How to change things safely" item 6 ("check a skill before every reply"); §0.1's one-screen YOUR NEXT ACTIONS flow; CLAUDE.md "token efficiency first" | The master prompt wins. Remove the plugin (16.1 already lists this skill). |
| `ui-consistency` SessionStart hook (`hooks/session-context.md`) | "for anything the end user will see, these join the phases of whatever process is already running… Use them without being asked." It also offers to draft issue reports for the plugin's own GitHub repository. | 16 item 6 (always-on injected instructions); `ardan-dev-process` is the process | The master prompt wins. Remove; the one useful rule is in `ardan-ui-review`. |
| `superpowers:brainstorming` | "You MUST use this before any creative work…" and four steps, with the human picking an approach, before any build | §0.1 "Never sit idle waiting for an answer"; §1.1 "ask only when a wrong guess is costly" | The design check in `ardan-dev-process` keeps the idea, scaled by step size, without the forced wait. |
| `superpowers:writing-plans` | "Save plans to: `docs/superpowers/plans/…`" | §4.1 and §4.2 (docs layout) | Plans go to `docs/design/` or `docs/plan/`. |
| `10x-Team` (all 13) | Each description begins "You MUST use this for…" | 16.6 guardrail (one clear job; no overlap) | Remove. |
| `productivity:memory-management`, `task-management` | Its own memory files and a shared TASKS.md | §4.2 memory files (STATUS, HISTORY, DECISIONS) | Remove. |
| vercel SessionStart hooks (`inject-claude-md.mjs`) | Injects Vercel guidance, and in an empty folder "Do not stop in planning mode… Start executing" | §0.1 and §4.5 | Remove. |
| `databricks` UserPromptSubmit hook | Routes every prompt the owner types into Databricks skills | Token efficiency; project rules | Remove. |
| Account copies of the three project skills | Older text, including the breakthrough exploit as guidance | §0.3 ("keep every skill accurate"), 16.2 | Remove the account copies; the repo's copies are the truth. |
| `CLAUDE.md` vs master prompt §2 | CLAUDE.md teaches `A.addStage` for new hooks; §2 says no new wrapper layers | (inside the repo) | The newer master prompt wins; `ardan-dev-process` says so. CLAUDE.md gets the same line in the Phase 0 sync. |

## 4. Risk flags (16.6 step 4)

Nothing below was run in this review. Items marked **hook** run without being asked, in every session where the plugin
is on.

| Plugin or skill | Risk |
|---|---|
| vercel | **hook**: four SessionStart scripts, a PostToolUse hook on every skill use that sends telemetry to `telemetry.vercel.com`, a SessionEnd clean-up; 116 scripts; the connector can change DNS, domains and deployments. |
| claude-security | **hook**: PreToolUse "guard" and PostToolUse scripts on every shell command, a JavaScript module loaded into Claude Code; 137 scripts. |
| databricks | **hook**: reads every prompt typed (UserPromptSubmit), runs at session start and after every shell command; installs and signs in to the Databricks CLI. |
| backend-design | **hook**: three Python checks before every Write or Edit (they warn and allow). |
| superpowers, ui-consistency | **hook**: inject instructions at session start (section 3). |
| meshy-3d-agent | asks for an API key; `npm install -g`; a paid outside service. |
| superdesign, design-superpowers | run packages through `npx --yes` / `npx -y`; outside services with sign-in. |
| reverse-engineering | installs frida-tools, mitmproxy, `@electron/asar`. |
| zizi-skills, mattpocock-skills, design-council, game-trend-skills, design-skills, image-deep-research | install more skills with `npx skills add …`; mattpocock's `setup-pre-commit` and `git-guardrails-claude-code` install husky and write Claude Code hooks; zizi has `rm -rf` steps. |
| remotion, animation-studio | install npm packages, run ffmpeg. |
| image-deep-research, deep-research | search the web (wanted, for research passes only). |
| Supabase connector | SQL, migrations, edge functions, pause and delete. |
| skill-creator | its trigger optimiser runs `claude -p` many times (cost); only on the owner's yes. |

## 5. How to switch each item off, and on again

**Nothing here has been done.** The owner confirms the table first.

**A. Plugins (the cloud sessions the owner works in).** Plugins come from the owner's claude.ai account, so they are
switched there:
1. Open claude.ai, then **Customize**, then **Plugins** (claude.ai/customize/plugins).
2. Open the plugin (for example *vercel*).
3. Turn its toggle off (the toggle labelled **Disable plugin**). The next session starts without it.
4. To turn it back on: the same page, the same toggle, on. (Do not choose **Remove** from the plugin's menu: that
   uninstalls it from the account; turning it off is enough and is easy to undo.)

**B. Plugins in a terminal session of Claude Code** (the same plugins appear as `<name>@synced`): run `/plugin`, go to
the **Installed** tab, select the plugin and press **Space** (or Enter, then **Disable plugin**). From a shell:
`claude plugin disable vercel@synced`; back on with `claude plugin enable vercel@synced`. This writes
`"enabledPlugins": { "vercel@synced": false }` into `~/.claude/settings.json` (or `.claude/settings.local.json` with
`--scope local`). It changes that computer only, not the account.

**C. For this repo only, as a committed record (what Claude would do after the owner's yes, in addition to A):** a
`.claude/settings.json` in the repo with `"enabledPlugins": { "<name>@synced": false, … }` and, for the bundled skills,
`"skillOverrides": { "claude-api": "off", "plugin-authoring": "off", "workflow-authoring": "off",
"keybindings-help": "off", "fewer-permission-prompts": "off", "init": "off", "security-review": "off" }`. To undo:
delete the entry (or set it to `true` / `"on"`) and commit. Check afterwards with `claude plugin list` that each
plugin shows as disabled; if a synced plugin ignores the project setting, A is the one that counts.

**D. Account skills:** claude.ai, **Customize**, **Skills**; open the skill; turn it off. On again: the same toggle.

**E. Connectors:** claude.ai, **Customize**, **Connectors**; open Vercel, Cloudflare, Google Drive (and Supabase until
Phase 8); choose **Disconnect**. To bring one back: the same page, **Connect**, and sign in again. Connectors bundled in
a plugin go when the plugin is turned off.

**F. Plugin agents** go when their plugin is turned off. Claude Code's own agents cannot be removed and are kept.

## 6. After (projected, once the table is applied)

| Kind | Before | After |
|---|---|---|
| Plugins on | 31 | 1 (`frontend-design`); `image-deep-research` on for the Phase 1 research pass only |
| Skills in the list | 459 | **26**: 7 Ardan project skills, 8 account skills, 1 plugin skill, 9 bundled, 1 environment (24 if `docx` and `pptx` go) |
| Skill descriptions in context | about 140,000 characters | about 13,000 (Ardan 2,900, account 5,900, the rest bundled) |
| Agent types | 69 | 5 (Claude Code's own) |
| Connectors with tools | 7 | 3 (Claude Docs, claude-code-remote, GitHub); Supabase back at Phase 8 |
| Plugin hooks | 6 plugins | 0 |

With the five planned Ardan skills the total reaches about 31; at that point drop `docx` and `pptx`, or fold
`ios-capacitor-release` into `ardan-release-pipeline`, to stay within 25 to 30 (16.6 guardrails).

**Phase gates** (keep off until then): `image-deep-research` (Phase 1 portrait research), the `design` plugin's two
research skills (Phase 7, if `ardan-playtest-synthesis` is not written), `claude-security` and `backend-design` ideas and
the Supabase connector and agent skill (Phase 8), a Capacitor store skill (Phase 9 or 10, read first), `game-trend-skills`
`launching-on-zero-budget` (a read before Phase 10), `animation-studio` (a store trailer).

## 7. Trigger checks for the three new skills

skill-creator's own trigger test (`run_eval.py`, which runs `claude -p` three times per query) was not run: it costs
money and opens many sessions, and the owner has not said yes to that. Each skill was instead checked by reading its
description against the full skill list as it stands today, and again as it will stand after the removals, for three
requests that should trigger it and two near misses that should not.

**`ardan-prompt-intake`**
| Request | Expected | Why |
|---|---|---|
| "Here's my new prompt with orders on the war screens and the store, merge it." | triggers | names a new prompt to merge; no other skill merges into the master prompt |
| "I've written a new plan for the map. Put it into the master file and tell me what changes." | triggers | a plan to fold in; "master file" |
| "New list of plugins I installed, review them." | triggers (with section 16.6) | a list of skills or plugins is a prompt to fold in (§1.1, last rule) |
| "Fix the bug where two people hold the marshal post." | does not trigger → `ardan-dev-process` | code work, no new rule |
| "What does section 8 say about duels?" | does not trigger | a question; no merge |
Risk today: `superpowers:brainstorming` ("You MUST use this before any creative work…") and `ui-consistency` hooks
could pull first; after the removals nothing competes.

**`ardan-dev-process`**
| Request | Expected | Why |
|---|---|---|
| "Add the A0 breakthrough stopgap." | triggers | a code step |
| "The year-50 Next month press got slow again, find out why and fix it." | triggers | a bug fix with root cause and checks |
| "Write the seed-leak Playwright test." | triggers | a test and a code change |
| "Merge this new prompt." | does not trigger → `ardan-prompt-intake` | docs merge |
| "Is the new family screen readable on a phone?" | does not trigger → `ardan-ui-review` | a review, no change |
Risk today: superpowers (systematic-debugging, test-driven-development, writing-plans), mattpocock (tdd,
diagnosing-bugs), engineering (debug), zizi (tdd-skill, debugging), 10x-Team (sde, "You MUST use this") all compete on
the same words. After the removals only the bundled `simplify` and `code-review` sit near it, and they are narrower.

**`ardan-ui-review`**
| Request | Expected | Why |
|---|---|---|
| "Review the new skills screen before we ship it." | triggers | a screen change before merge |
| "The owner says the War tab is cluttered on his phone. Check it." | triggers | the description names clutter and phones |
| "Check this event's text and choices fit the rules." | triggers | 80-word and 12-word rules, voice |
| "Is breakthrough balance too generous?" | does not trigger → `life-sim-systems` | balance, not screen |
| "Run the playtest loop on two lives and a war." | does not trigger → `game-ux-playtest-loop` | the multi-life loop |
Risk today: design:design-critique, design:accessibility-review, design-skills, vectorlab ux-audit, ui-ux-behaves
review, design-superpowers design-review and `ui-consistency:verifying` all describe screen reviews. After the
removals only `frontend-design` (making, not reviewing) is near it.

**To re-check after the removals:** in a fresh session, give each of the fifteen requests above as the first message
and note which skill loads. If a skill does not load where it should, sharpen its description (skill-creator's method:
the key use first, a little "pushy", the near misses named).

## 8. Upkeep

At the end of every phase: list the skills again, compare with this file, remove what was not used, and run 16.6 on
anything new (read it in full, verdict, risk, clash, a line here). Never install a third-party skill, plugin or connector
without reading it and telling the owner what it does.
