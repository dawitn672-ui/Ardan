#!/usr/bin/env bash
# Read the failures out of a GitHub Actions job log. The GitHub MCP tool get_job_logs (return_content: false) gives a
# short-lived logs_url; pass it here (quote it). Prints FAIL lines, balance bands out of range, and the shard summary.
# Usage: ci-failures.sh '<logs_url>' [width]
url="$1"; w="${2:-400}"
curl -s "$url" | grep -E "FAIL  |out of band|passed, .* failed|Error:|✗" | cut -c1-"$w" | head -60
