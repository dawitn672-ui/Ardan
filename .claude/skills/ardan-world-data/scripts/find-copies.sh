#!/usr/bin/env bash
# ardan-world-data: find every copy of one world fact before you change it.
#
#   bash .claude/skills/ardan-world-data/scripts/find-copies.sh [-i] [--blobs=DIR] TERM [TERM...]
#
# TERMs are ripgrep regexes, joined with |, matched as whole words (Ghazrul, 'POL-24', 'Emirate of Sabra', 'Wyrm-?Slayer').
# -i ignores case. --blobs=DIR also greps a private build's unpacked blobs (node tools/build.mjs --out=/tmp/ardan/<me>/x.html
# --unpack=/tmp/ardan/<me>/blobs), which is where leftovers in the built page show. Prints the files by kind of copy, with
# a count of lines each, so you can pick the source of truth and list every reader before you edit. Read-only.
# Left out: the v2 bundle (src/core/99990-v2-engine/a-v2.core.js, rebuilt by tools/build-v2.mjs), archive/, the
# critique probes and bench reports (frozen records), node_modules. Records (docs/HISTORY.md, CHANGELOG.md, docs/VERSIONS.md)
# are listed but never rewritten.
set -u
cd "$(dirname "$0")/../../../.." || exit 1
CASE=(); BLOBS=""; TERMS=()
for a in "$@"; do
  case "$a" in
    -i) CASE=(-i) ;;
    --blobs=*) BLOBS="${a#--blobs=}" ;;
    *) TERMS+=("$a") ;;
  esac
done
[ ${#TERMS[@]} -eq 0 ] && { echo "usage: find-copies.sh [-i] [--blobs=DIR] TERM [TERM...]"; exit 2; }
PAT="$(IFS='|'; echo "${TERMS[*]}")"
EXCL=(-g '!src/core/99990-v2-engine/a-v2.core.js' -g '!archive/**' -g '!tools/critique-probes/**' -g '!tools/bench/reports/**' -g '!node_modules/**' -g '!.claude/skills/ardan-world-data/**' -g '!index.html' -g '!versions/**' -g '!.build/**')
show() { # title, then rg path args and globs
  local title="$1"; shift
  local res
  res="$(rg -c "${CASE[@]}" -w -e "$PAT" "${EXCL[@]}" "$@" 2>/dev/null | sort)"
  [ -z "$res" ] && return
  local n; n="$(printf '%s\n' "$res" | wc -l)"
  echo "== $title ($n files)"
  printf '%s\n' "$res" | sed 's/^/   /'
}
echo "pattern: \\b($PAT)\\b ${CASE[*]:-}"
show "data/ (content kept as data: the usual source of truth)"            data
show "release lore (src/core/release/core/00-lore.json, lore/*.json)"     src/core/release/core/00-lore.json src/core/release/lore
show "release events (content/*.js: function text is read as text; run identity-probe)" src/core/release/content
show "release code (core/*.js: GD tables, prose, ids)"                    src/core/release/core -g '*.js'
show "feature events (*.events.js)"                                       src -g '*.events.js' -g '!src/core/release/**'
show "feature data in code (*.data.core.js, habitats, voices, bibles)"   src -g '*data*.js' -g '!src/core/release/**'
show "feature and engine code (*.core.js, engine/*.js)"                   src -g '*.js' -g '!*.events.js' -g '!*data*.js' -g '!test.mjs' -g '!src/core/release/**'
show "tests that pin it (test.mjs, tests/)"                               src -g 'test.mjs'
show "tests/"                                                             tests -g '!saves/**'
show "tools (generators, linters, benches)"                               tools
show "skills (.claude/skills)"                                            .claude/skills
show "docs and READMEs (living docs: update; records: HISTORY, CHANGELOG, VERSIONS, prompts are history, leave them)" docs src -g '*.md' CLAUDE.md CHANGELOG.md
if [ -n "$BLOBS" ]; then
  show "the built page's blobs ($BLOBS)"                                  "$BLOBS"
fi
