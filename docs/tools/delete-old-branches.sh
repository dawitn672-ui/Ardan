#!/bin/sh
# Owner order 54: delete the 44 old working branches from GitHub.
# Every commit on them is kept: 35 are fully inside v2-integration, and the other 9 (the v2 lanes and v2-wf-repeats)
# are kept reachable by the branch archive/v2-lanes (one commit whose parents are their tips; docs/BRANCHES.md).
# Run from any clone of dawitn672-ui/Ardan with push rights:   sh docs/tools/delete-old-branches.sh
set -e
git push origin --delete \
  v2-fix-content v2-fix-diplomacy v2-fix-family v2-fix-map v2-fix-names v2-fix-nobility v2-fix-stats v2-fix-time v2-fix-war \
  v2-lane-diplomacy v2-lane-family v2-lane-map v2-lane-nobility v2-lane-saves v2-lane-stats v2-lane-time v2-lane-war \
  v2-wf-balance v2-wf-body v2-wf-cardrisk v2-wf-chronicle v2-wf-ci90a v2-wf-ci90b v2-wf-ci91 v2-wf-family v2-wf-gates \
  v2-wf-inktiming v2-wf-layout v2-wf-lines v2-wf-map v2-wf-numbers v2-wf-numbers2 v2-wf-observes v2-wf-phonetap \
  v2-wf-renown v2-wf-repeats v2-wf-rolls v2-wf-rollsfallout v2-wf-round2 v2-wf-sameworld v2-wf-timetest \
  v2-wf-warbattles v2-wf-warleaks v2-wf-world
echo "Done: 44 old branches deleted. Kept: main, claude/dreamy-sagan-anwszt, v2-integration, archive/v2-lanes, release/*."
