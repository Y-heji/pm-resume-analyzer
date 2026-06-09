#!/bin/bash
# Prediction immutability hook — blocks edits to ## 预测 sections
# Reads the Edit tool's proposed changes and checks for prediction-section tampering

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // ""')
NEW_STRING=$(echo "$INPUT" | jq -r '.new_string // ""')

if [[ "$FILE_PATH" == *"/predictions/"* ]] || [[ "$FILE_PATH" == *"\\predictions\\"* ]]; then
  # Block edits to predictions files
  echo '{"continue": false, "reason": "预测文件不可修改。复盘请追加到 ## 复盘 段。如需修改预测请开新文件。"}'
  exit 1
fi

echo '{"continue": true}'
exit 0
