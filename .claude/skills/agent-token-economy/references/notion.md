# Notion routes, prices and recommendations (read 2026-11-27)

Sources: Notion MCP tool docs https://developers.notion.com/guides/mcp/tools-pages-reference,
https://developers.notion.com/guides/mcp/tools-databases-reference, https://developers.notion.com/guides/mcp/tools-faqs;
REST limits https://developers.notion.com/reference/request-limits; markdown API
https://developers.notion.com/guides/data-apis/working-with-markdown-content; credits
https://www.notion.com/help/custom-agent-pricing; live check with `notion-get-tool-access` in this session.

## Where we stand (facts)
- **Plan: not Business.** `notion-get-tool-access` marks `query_multiple_data_sources` full_version_required,
  `connector_search`, comment updates and suggested edits plan_required, search filters (date, editor, title-only, sort)
  Business-only, and `query_data_sources` `available_with_limit` (single-source SQL and rows mode share a per-workspace
  allowance on non-Business plans; view mode has no quota). So: free or Plus.
- **Notion's own agents cost credits.** Custom Agents draw on Select credits that come with Business/Enterprise, then
  paid Notion credits (owner enables a limit under Settings, Notion AI, Credits). Notion's estimate: about 5 credits a
  simple task, 10 medium, 25 complex. Running Notion Agent or a Custom Agent from the API or a connected app uses
  Notion credits. The promo that made Custom Agents free on Business ended 2026-05-03. Free/Plus have no credit counter.
  A third-party-listed price of $10 per 1,000 credits appeared on one regional page only; unverified. Verdict: **not an
  option on this plan**; revisit if the owner upgrades. The MCP session tools (`spawn-session`, `wait-session`,
  `search-agents`) need a shared agent to exist; none does.

## Cost of the routes (rank by cheapness for bulk)
1. **REST API from a script (Bash/Node)** for host `api.notion.com` (**the owner declined a key on 2026-11-27: do not ask again unless he raises it**; until then use route 2, file uploads): model tokens only
   for writing the script once (about 3 to 5K) and reading a one-line result. Limits: 180 requests/minute on non-
   Business plans (about 3 a second; query endpoint about 3 a second), HTTP 429 with `Retry-After`; payload at most
   1,000 blocks and 500 KB a request; arrays at most 100 elements; rich text 2,000 characters; relations/people 100.
   Create a page from markdown with `POST /v1/pages` and a `markdown` body (use `markdown_version: "v2"`; v1 is
   deprecated), at most 5,000 blocks per create; add more with `PATCH /v1/pages/:id/markdown` `insert_content`;
   `allow_async: true` returns 202 and a task to poll. 438 rows at 3 a second: about 2.5 minutes, 0 model tokens.
   Needs: the host allowed in the environment's network (`get_environment`, then `update_environment`, owner approves),
   an integration token (owner creates, shares the Ardan page with the integration). One script serves every later job.
2. **Attach, do not paste:** `notion-create-file-upload` plus `notion-create-attachment` carry a file (a data file, a
   generated table) without the model writing its content. Best for sources of truth that the repo already holds.
3. **MCP `notion-create-pages` with markdown:** the model writes every character, the result echoes properties.
   About 900 tokens a short row (L-013), 2x page size per long page. Use for structure and small edits only. No page
   count cap is stated, but "all pages in one call share the same parse limit"; oversize returns `validation_error` and
   creates nothing: split by child page. Use `allow_async: true` for large writes and poll `notion-get-async-task`.
4. **`notion-update-page`:** `update_content` takes search/replace pairs (each `old_str` matches one place): cheap for
   small edits, never rewrite a page with `replace_content` to change a line.

## Reading cheaply
- Search first (relevance sort only on this plan), fetch one page (a page is one topic, order 102), never a whole
  database. Rows mode: `limit` 50 default, 100 max, no cursor; share the free allowance, so prefer a saved **view**
  (no quota) or fetch of the database page. Results over 15,000 tokens now land in a file (settings change above).
- Page layout for agents: a small index page per area with one line per child and its URL; the agent reads the
  index (200 tokens) then one child. Avoid "dump everything" pages; the 20,000-block read truncation is far above need.
- Repo files stay the source for what code needs; Notion holds information (order 102). Mirror by script, one
  direction, with a manifest (path, hash, page id) so a re-run updates only changed pages (saves rows x 900 tokens a time).

## Recommendations
1. (Only if the owner offers a key; he declined on 2026-11-27.) A Notion integration token via `request_credential` (host `api.notion.com`), the host allowed;
   build `tools/notion-sync.mjs` once (repo records to pages, markdown v2, manifest, async, 429 backoff, dry run).
   Saving: a full mirror drops from about 400K tokens to about 5K.
2. Until then: no row jobs through MCP; at most one page per topic, 20 pages per agent session, attach large files.
3. Write what a Notion page is for in its first line, so search results are enough to choose (fewer fetches).
4. Skills in Notion (`notion-upload-skill`, `convert-page-to-skill`) exist but our skills live in the repo and load
   free of tool calls; do not duplicate.
5. Re-check plan features when the owner upgrades: Business adds unlimited SQL, multi-source queries and agent credits.

## The bulk route exists now: `tools/notion-sync.mjs` (2026-11-27, order 102)
The owner's key is injected by the session's proxy for `api.notion.com` (no Authorization header, nothing stored); route 1
above is live and the "declined" note is superseded. Notion-Version `2026-03-11` (data sources: `POST /v1/data_sources/{id}/query`;
pages created with `parent.data_source_id`). The script builds blocks itself (headings, paragraphs with bold/italic/code/links,
lists nested one level, code, tables, rules; text split at 2,000 chars, at most 100 blocks a request) and updates a page by
deleting its children and appending new ones.
- `node tools/notion-sync.mjs whoami | chronicle [--kind= --match= --limit= --dry --manifest=] | page <md> <parent-id> [--title=]`.
- `tools/notion-sync.manifest.json` holds page id and content hash per source: a re-run writes only changed records.
- Free plan: block capacity may be limited and never comes back; the run prints blocks created and stops on 403 `restricted_resource`.
- Use the MCP tool only for small edits and reads; never for bulk text or rows (L-012, L-013).
