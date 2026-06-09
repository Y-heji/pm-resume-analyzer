#!/bin/bash
# SessionStart hook — show cheat-on-content status on new session
echo "🎛️ cheat-on-content 状态快照 ($(date '+%Y-%m-%d %H:%M'))"
echo ""
if [ -f ".cheat-state.json" ]; then
  SAMPLES=$(jq -r '.calibration_samples // 0' .cheat-state.json 2>/dev/null)
  RUBRIC=$(jq -r '.rubric_version // "v0"' .cheat-state.json 2>/dev/null)
  PENDING=$(jq -r '.pending_retros | length' .cheat-state.json 2>/dev/null)
  SHOOTS=$(jq -r '.shoots | length' .cheat-state.json 2>/dev/null)
  echo "   rubric: $RUBRIC | 校准样本: $SAMPLES | 待复盘: $PENDING | buffer: $SHOOTS"
fi
echo ""
