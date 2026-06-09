#!/bin/bash
# Meta-logging hook — append usage events to cache
mkdir -p .cheat-cache
echo "{\"event\": \"${1:-session}\", \"time\": \"$(date -Iseconds)\"}" >> .cheat-cache/usage.jsonl
exit 0
