# Round 2 progress

The checklist of every work item, in the order they are being done. Tick an item the moment it is merged and CI is
green, with the stamp and the commit; never delete a line. Details live in `docs/HISTORY.md`; the plan and the
reasons in `docs/CRITIQUE.md` §2 and `docs/DECISIONS.md`.

*Last updated 2026-11-12 19:26 ET*

## Done
- [x] **Step 0** · Repo restructured by system, with a memory (CLAUDE.md, HISTORY, DECISIONS, IDEAS, CHANGELOG, OWNER_ORDERS) · `d906efc`, CI 95 green · 2026-11-11 23:43 ET
- [x] **Step 1** · Harsh critique: 162 flaws rated, 22-step work order (`docs/CRITIQUE.md`) · `f3fca58` · 2026-11-12 06:15 ET
- [x] **Prep C7** · Name data: one common English pool (3,820 given, 4,083 family names) + 9 pools for non-humans and far peoples (`docs/research/c7-name-data.json`) · `6ae93dd` · 2026-11-12 07:05 ET
- [x] **Prep D11** · Military branches and battlefield strategy draft (`docs/research/d11-branches.*`) · `85df7b0` · 2026-11-12 05:57 ET
- [x] **A0** · Stop the bleeding: the lag's main cause (whole-page restyle), the two-lords crash, text fixes, bench harnesses · `db98217`, CI 96 green · 2026-11-12 11:02 ET

## In progress
- [x] **X6** · Naming pass: 79 clear renames, `docs/NAMES.md` lookup, `docs/README.md` index · `7a5e71d` (CI pending) · 2026-11-12 12:03 ET (moved to immediate priority by the owner, 2026-11-12 11:17 ET)
- [x] **A3a** · The net: hidden errors fail tests; 12 coherency checks in the build; baseline that may only shrink; nightly 60-year audit · merged (CI pending) · 2026-11-12 12:07 ET
- [x] **B4** · Click-to-open descriptions; nothing on hover; activities open a sheet first · `c00a91b` (CI pending) · 2026-11-12 15:05 ET
- [x] **C8a** · Character design plan, realistic version (`docs/design/characters.md`) · `e7d199d` · 2026-11-12 11:48 ET
- [x] **C8b gate 1** · Character demos: 8 sheets + live face maker (`docs/design/demo/`) — a working draft, below the bar · `397b55f` · 2026-11-12 15:52 ET · reviewed: owner chose **detailed 2D illustration** (D-024)

- [x] **C8 2D plan** · The 2D illustrated part system (`docs/design/characters.md`) · `389041f` · 2026-11-12 17:27 ET
- [x] **C8 2D gate 1** · Style frame: four sitters in two finishes (`docs/design/demo-2d/gate1.*`) · `655fe2c` · 2026-11-12 18:16 ET · **with the owner for review**
- [x] **CI fix** · The 22 tests CI 97 failed after A3a: 5 game bugs fixed, 17 tests made robust · `d5f42ab` · 2026-11-12 18:29 ET
- [x] **CI fix 2** · CI 100: B6 draws 6x slower (fixed), iconsWired, two bot-life bars (D-027) · `57180f4` · 2026-11-13 00:55 ET
- [x] **v2.1.0-alpha.2** · cut on green CI 101, `release/v2.1.0-alpha.2` pushed, sample save · `f37c62f` · 2026-11-13 01:35 ET

## Next, in order
- [x] **A1** · Lag, drawing side: one redraw per press, log in place, year 50 = year 0; engine share left to X5/D12b (D-023) · `b9a656c` · 2026-11-12 16:27 ET
- [x] **B6** · Next month or Next year; no initiative cap; only notable events stop time (D-019, D-026; `src/ui/999995-next-year`) · `bacd0a2` · 2026-11-12 19:26 ET
- [x] **X1** · Own the release: the build reads readable source in `src/core/release/`, all 203 patches baked in, proven the same program · `5056e98` · 2026-11-13 01:44 ET
- [ ] **A2** · One holder per post; Marshal vacant until needed, General the highest everyday rank (D-017)
- [ ] **B5** · Declutter (two parts)
- [ ] **C8b** · Faces and bodies (after the owner approves the demo sheets)
- [ ] **X2** · Named stages
- [ ] **D10** · War screens only when deployed
- [ ] **C6** · Relationships and households
- [ ] **X3** · Honest cards and clocks
- [ ] **C7** · Names and cultures in the game (one common language, D-013)
- [ ] **C8c** · Dress, class and regalia (changeable outfits)
- [ ] **D9** · The inked, detailed map; war fronts that spread like a burn (D-016)
- [ ] **D12a** · Branches and command: one design (Fable 5.2)
- [ ] **D11** · Military branches (feudal armies, D-012)
- [ ] **D12b** · War and command depth
- [ ] **E1** · A much bigger economy: bigger markets that simulate themselves over time (owner order 28; design first, Fable 5.2)
- [ ] **E2** · Hundreds of weapons and armour pieces by quality; items unique to one person (owner order 29; design first, with E1)
- [ ] **X4** · Balance pass
- [ ] **X5** · State diet; stop committing index.html every round (D-018)

## Versions
Every finished step is a version: a row in `docs/VERSIONS.md`, a section in `CHANGELOG.md`, a `release/<version>`
branch on GitHub, and a sample save in `tests/saves/`.

| Version | Stamp | What it holds |
|---|---|---|
| v2.0.0-beta.1 | 2026-11-06 15:06 ET | Playtest 2 and CI round 2 fixed (the last version before round 2) |
| v2.1.0-alpha.1 | 2026-11-12 11:20 ET | Round 2 begins: repo by system with a memory, the critique and work order, A0 (lag's main cause and the two-lords crash fixed), name and military prep |
| v2.1.0-alpha.2 | 2026-11-13 01:35 ET | X6 naming pass, A3a coherency net, B4 click-to-open, A1 one redraw a press, B6 Next month or Next year, CI 97-101 fixes |
| v2.1.0-alpha.3 | 2026-11-13 02:40 ET | X1: the release is readable source (`src/core/release/`), all 203 patches baked in, same program |

## Milestones
- [ ] `release/v2.1-foundations` (after A1, A3a, B6, A2)
- [ ] `release/v2.2-interface` (after B4, B5)
- [ ] `release/v2.3-people` (after C6, C7, C8)
- [ ] `release/v2.4-war` (after D9 to D12)
