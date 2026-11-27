# Claude Code token mechanics: sourced findings (read 2026-11-27)

Docs used (official): costs https://code.claude.com/docs/en/costs, prompt caching
https://code.claude.com/docs/en/prompt-caching, skills https://code.claude.com/docs/en/skills, subagents
https://code.claude.com/docs/en/sub-agents, context window https://code.claude.com/docs/en/context-window, MCP
https://code.claude.com/docs/en/mcp, settings reference https://code.claude.com/docs/en/settings-reference (also via
Context7 `/websites/code_claude`). Versions in the docs move fast; keys below need the stated Claude Code version.

## 1. Prompt caching
- Prefix match, exact: a change anywhere in the prefix recomputes all after it. Order: system prompt and tool
  definitions, then project context (CLAUDE.md, auto memory, unscoped rules), then conversation.
- Invalidates the cache: switching model (each model has its own cache), changing effort on most models (not on
  Sonnet 5.5, Opus 5.5, Haiku 5.5 and Fable 5.1+ with API key or subscription), fast mode on/off, adding or removing a
  tool definition (MCP server connect/remove when tools load up front; deferred tools are safe), compaction (rebuilds the
  shorter history), many images (oldest removed in batches), upgrading Claude Code.
- Keeps it: editing files, editing CLAUDE.md mid-session (not reloaded until /clear or /compact), permission mode,
  output style, invoking skills (appended as messages), plugin skills/agents/hooks, /rewind, spawning a subagent.
- TTL: 5 minutes or 1 hour. Main conversation gets 1 hour on a subscription within plan usage, 5 minutes on API key
  or usage credits. **Everything else (subagents, workflows, teammates, compaction) gets 5 minutes** unless set:
  `subagentPromptCacheTtl: "1h"` or env `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL` (v2.1.242+), or `cacheTtl` under a
  subagent's `experimental` frontmatter (v2.1.248+). The 1-hour write is billed at a higher rate than the 5-minute one.
- Subagents: own system prompt, own cache, do not read the parent's. A *fork* inherits the parent's prefix and reads
  its cache. Sessions in the same directory build matching prefixes and can share cache (parallel worktrees differ by
  directory, so they do not).
- Measure: `/usage` shows `Prompt cache (main)` (hit share, misses, likely cause; v2.1.251/260+). It does not cover
  subagents. Hit rate high = good; creation tokens high turn after turn = something changes the prefix.
- Estimate for Ardan: one builder, 40 turns, 60K average context: cache reads dominate; a cold-cache turn after a
  >5-minute test wait re-writes the whole context once. Test waits are the realistic miss source.

## 2. What a subagent starts with
System prompt (its own body plus environment details, not Claude Code's), the task message, **the full CLAUDE.md
hierarchy unless `omitClaudeMd: true`** (Explore, Plan and web-fetch skip it), git status snapshot (skipped by
Explore/Plan), full text of skills in its `skills:` field (up to 32), MCP tools inherited (names only when deferred).
Not inherited: conversation, auto memory, output style. Fields: `model` (sonnet, opus, haiku, fable, full id,
inherit), `effort` (low to max), `maxTurns`, `isolation: worktree`, `background`, `tools`, `disallowedTools`.
Model order: per-invocation parameter, then definition, then `CLAUDE_CODE_SUBAGENT_MODEL`, then parent's model.
`CLAUDE_CODE_SUBAGENT_MODEL` plus `_FORCE=1` (v2.1.257+) forces one model for all: not set here, D-009 chooses by job.
Default concurrency cap is 20 (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`); our own cap of five is policy (L-001).
Costs page: agent teams use about 7x tokens in plan mode; use Sonnet for teammates, keep spawn prompts focused,
shut teammates down when done. Subagent requests still draw on the same usage.

## 3. Skills
- Descriptions are listed every turn; the body loads only when invoked (progressive disclosure). Listing budget:
  `skillListingBudgetFraction` (default 0.01 of the context window), per-skill cap `skillListingMaxDescChars` (default
  1,536). `skillOverrides`: `on`, `name-only` (name, no description), `user-invocable-only`, `off`. Plugin skills are not
  affected (use /plugin). `disable-model-invocation: true` removes a skill's description from context entirely.
- Invoked skill bodies survive compaction: 5,000 tokens each, 25,000 total, most recent first: put the rule that
  matters first in SKILL.md. Docs advise SKILL.md under 500 lines; ours aim under 200.
- Ardan listing today: 12 repo skills, descriptions 185 to 932 characters (7.2K characters, about 1.8K tokens). Trim
  to 400 each would save about 0.6K tokens a turn per agent; low priority, apply when a skill is next edited.
- Applied 2026-11-27: `skillOverrides` `name-only` for claude-api, workflow-authoring, plugin-authoring,
  session-start-hook, keybindings-help, anthropic-skills:deep-research, anthropic-skills:skill-creator (duplicate of the
  skill-creator plugin). About 2.5K characters, about 600 tokens a turn per agent. Whether built-in skills honour
  `skillOverrides` is not stated for non-plugin bundled skills: verify with `/skills` or `/context` next session.

## 4. Compaction and context
- Compaction summarises history; re-injects CLAUDE.md, auto memory, skill descriptions, up to five recently read files
  (a file over 5,000 tokens comes back as a path only). Compacting a cold session is a big uncached request: compact at
  natural breaks while the cache is warm, with `/compact focus on ...`. `/clear` costs nothing. `/rewind` returns to a
  cached prefix. A `# Compact instructions` section in CLAUDE.md steers summaries. `autoCompactWindow` (per model in
  `modelSettings`, at least 100000) sets when auto-compaction fires.
- Background: session recap, idle compaction (`idleCompaction`), prompt suggestions, scheduled loops, cross-session
  messages (`crossSessionInbound: hold`), goal check-ins (`CLAUDE_CODE_GOAL_CHECKIN_MINUTES=0`) all spend tokens while idle.

## 5. Output size
- MCP: results over 10,000 tokens warn; default hard limit 25,000 (`MAX_MCP_OUTPUT_TOKENS`); over the limit the result
  is saved to a file and named. A tool can raise its own limit with `anthropic/maxResultSizeChars`. Applied here:
  `env.MAX_MCP_OUTPUT_TOKENS=15000` in `.claude/settings.json` (a large Notion fetch lands in a file; read the part needed).
- Bash: `bashOutputMaxChars` setting exists (entry not read in full; check the settings page). The costs page shows a
  PreToolUse hook that appends `| tail -n 100` to test commands: not added (hooks change behaviour; owner's call).
- Tool search defers MCP tool definitions by default (names only until used): disabling an MCP server in /mcp removes
  its tools; unused servers cost the name list only. CLI tools (`gh`, `gcloud`) beat MCP for listing overhead.

## 6. Effort and thinking
Thinking is billed as output. Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable models always think (cannot be turned off): use
effort. `effortLevel`, `maxEffortLevel` (cap, v2.1.267+), `modelSettings.<model>.effortLevel`, env
`CLAUDE_CODE_SUBAGENT_EFFORT`. Lower effort for mechanical agents; `max` only for the critique and big designs.

## 7. Levers not applied, with reasons
| Lever | Why left | Estimated saving |
| --- | --- | --- |
| `subagentPromptCacheTtl: "1h"` | needs one measured wave; write rate is higher | up to 30% on builders that wait on long tests |
| `includeGitInstructions: false` | changes how commits are made; owner's rules and attribution rely on defaults | about 1.5K tokens a session |
| CLAUDE.md trim, Compact instructions | CLAUDE.md is being edited by the system-work lane; integrator decides | about 2.5K tokens a turn per agent |
| PreToolUse `tail` hook | alters commands; hooks are behaviour, not settings | 1K to 10K per test run |
| `CLAUDE_CODE_SUBAGENT_MODEL(_FORCE)` | would override D-009's model-by-job | 2 to 5x if Haiku were forced (quality risk) |
| `crossSessionInbound: hold`, `idleCompaction: false` | affects how sessions talk; decide with the integrator loop | small |
