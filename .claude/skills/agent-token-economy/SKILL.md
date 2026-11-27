---
name: agent-token-economy
description: "Cut token use and get more work per token on Ardan. Load before briefing builder or helper agents, before any bulk job (Notion rows or pages, mass renames, data generation), before choosing a model or effort for an agent, when a session feels slow or the usage limit looms, and when asked about graphify, claude-mem, code-graph tools, plugins, MCP servers or skills to install. Holds the ranked levers (what is cached, what a subagent loads, what output costs, Notion routes by price, which tools to skip) with this repo's numbers and the verdicts on outside tools. Orders 101 and 102."
---

# Agent token economy

Order 101/102: more done per token, nothing repeated (L-001, L-012, L-013, L-014). Sources, numbers and the
reasoning behind every line below are in `references/` (read one file, not all): `levers.md` (Claude Code mechanics),
`notion.md` (Notion routes and prices), `tools-verdicts.md` (graphify, claude-mem, code graphs, skills and plugins).
All figures are estimates for this repo unless a source is cited there; re-measure with `/usage` ("Prompt cache" line,
"Plan usage breakdown" and its recommendations).

## The model of cost (why the levers rank as they do)

- Every turn re-sends the whole context; the unchanged prefix is read from cache at a lower rate, and any change in the
  prefix re-processes everything after it. A long session, many tool results and many turns are what cost.
- Each subagent is a fresh conversation: it loads the full CLAUDE.md hierarchy, the skill listing, tool names and its
  brief, and **warms its own cache** (it cannot read the parent's). Subagents get a 5-minute cache unless set otherwise.
- Output a tool returns stays in context for every later turn. So: small outputs, few turns, and nothing bulky
  passed through a model that a script could move.

## Levers, ranked by saving

1. **Never route bulk data through a model.** Price it first: rows x ~900 tokens, pages x characters x 2 (written
   by the model, echoed back). 438 rows cost about 400K tokens (L-013). Use a script (about 5K tokens once) over the
   file uploads (the owner declined a Notion API key), a generated batch, or the REST API only if he later offers a key; fewer, richer pages beat hundreds of rows. See `references/notion.md`.
   Saving: 95 to 99% on any bulk job.
2. **Stage agents; at most five at once** (L-001), each commits after every step. Token use is roughly proportional
   to the number of live agents and their lifetime; agent teams in plan mode cost about 7x a plain session. End
   helpers the moment they report. Saving: avoids the stop that wastes every agent's work, the biggest single loss.
3. **Right model and effort per job, chosen at spawn, never switched mid-session.** A model switch throws away the
   cache (each model has its own); an effort change keeps it on Sonnet 5.5 and Opus 5.5. Haiku or Sonnet default for
   mechanical work (verify runs, lint, record merging, Notion scripting, playtest bots); Sonnet high for interface and
   data; Opus high only for system design; the strongest model only for the critique and big designs (D-009, D-010).
   Saving: 2 to 5x per agent on mechanical work.
4. **Brief precisely so the agent reads little.** Give exact `file:line` (from `tools/show.mjs --where A.name`),
   the test names, the report shape and "do not read other files". `src/core/release/core/` files run to 100 KB each
   (about 25K tokens), 14 lines in `content/` exceed 2,000 characters: read by range, never whole. A vague brief
   ("improve the map") triggers whole-repo scans. Saving: 20 to 40% of a builder's turns.
5. **Cap what commands print.** Test, build and lint runs end with `| tail -n 60` (or `--quiet`), a failing test is
   re-run alone and its first error read. `MAX_MCP_OUTPUT_TOKENS=15000` is set in `.claude/settings.json` (an MCP
   result over it is saved to a file and named, not pasted). Saving: 1K to 10K tokens per run, repeated each turn after.
6. **Keep the base context small.** CLAUDE.md is 19.7 KB (about 5K tokens, 227 lines; the docs advise under 200
   lines): every agent and every turn carries it. Move the Build/test command list (2.1 KB), Layout table (3.5 KB) and
   Parallel safety to a skill or reference; target 10 KB. Skill descriptions are listed every turn too: keep each
   under 400 characters with the trigger first; `skillOverrides` in `.claude/settings.json` hides the rest.
   Saving: about 2.5K tokens per turn per agent for the CLAUDE.md trim; about 600 for the skill pruning already made.
7. **One task per session; clear between tasks; compact at a break, with instructions.** `/clear` is free;
   `/compact focus on ...` between steps, never mid-edit. A compaction after a cold cache re-reads everything.
   A "# Compact instructions" section in CLAUDE.md steers the summary (recommended, not yet added). Saving: 30 to 60%
   on a long session's late turns.
8. **Light helpers skip the heavy start.** A custom agent in `.claude/agents/` with `model: haiku`, `omitClaudeMd:
   true`, `maxTurns` and a short `tools` list (verify, merge-records, report-reader) starts at a fraction of a builder's
   context. Builders list needed skills in `skills:` (full text at start, no discovery turns). Saving: about 5K
   tokens per helper start plus its turns.
9. **Do not poll; do not leave things idle.** Integrator waits on one `TaskOutput`/notification, never a loop;
   idle sessions still re-send context on schedules, cross-session messages and goal check-ins. Settings to consider:
   `crossSessionInbound: hold`, `idleCompaction: false` only if cold resumes are rare. Saving: small but silent.
10. **Cache lifetime for long tests.** A builder that waits more than 5 minutes on a test run (no request in
    between) loses its cache and re-writes it at the write rate. Recommended trial (not applied): `"subagentPromptCacheTtl":
    "1h"` in `.claude/settings.json`; compare `/usage` before and after for one wave. The 1-hour write costs more, so
    it only pays when gaps exceed 5 minutes.

## Do before every brief (checklist)

- Price the job: bulk? rows? pages? the whole-file reads? If bulk, write the script, not the prompt.
- Pick model and effort from lever 3; name them in the spawn call.
- Count live agents (at most five); name the owner's fixed terms (L-003); `ls` every path (L-006).
- Tell the agent what to print and what not to read (levers 4 and 5), and to commit after each step.
- Ask what the agent returns: a report under 300 words with shas and numbers, not a transcript.
- After the wave: `/usage` breakdown, then write what was learned into `docs/LESSONS.md`.

## Outside tools (verdicts, details in `references/tools-verdicts.md`)

- **graphify, claude-mem, a code graph (CodeGraph, codebase-memory-mcp): none adopted as is.** Our containers are
  wiped each session, so any index must be rebuilt every session; the repo already has `tools/show.mjs --where`; the
  numbers they publish come from their own benchmarks. The idea worth taking: a small committed symbol index script
  (name, file, line, one line of purpose) that agents grep, built by us in the build, no daemon, no model, no network.
- **Notion's own agents:** this workspace is not on a Business plan (tool access check, 2026-11-27); custom agents
  draw on paid credits. Not an option now; revisit if the plan changes.
- Nothing is installed unread, nothing with telemetry or an LLM of its own in the loop without the owner's say.

## Keep this skill true

When a lever is measured (a `/usage` reading, a bulk job's real cost), update the number here and add the reading to
`references/levers.md`. When a doc source changes (settings keys move often), re-check with Context7 or the docs page
named in the reference, then edit.

## Choosing models dynamically (the owner asked, 2026-11-27)
- Pick the model **per job at spawn**, every time: Haiku for bulk and mechanical work, Sonnet for systems, data, research
  and test fixing, the biggest model only for real design. Re-choose at the next job, never mid-job.
- A job that proves harder or easier than planned: stop it at a clean point (it commits) and start the next piece on the
  fitting model, rather than letting a big model grind through routine work.
- Smaller jobs, chosen well, beat one long job on one model: each keeps its own cache warm.
- The integrator's own model is the owner's choice (`/model`); recommend keeping the integrator on the strong model,
  since its judgment gates every builder's work.
