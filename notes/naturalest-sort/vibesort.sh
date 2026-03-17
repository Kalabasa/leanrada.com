#!/usr/bin/env bash

FILE="${1:?Usage: vibesort.sh <filepath>}"

ITEMS=""
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  shuffled=$(echo "$line" | tr '|' '\n' | shuf | paste -sd '|')
  ITEMS+="- ${shuffled}"$'\n'
done < "$FILE"

SCHEMA='{
  "type": "object",
  "properties": {
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sorted": {
            "type": "array",
            "items": { "type": "string" },
            "description": "The input strings sorted in their natural/logical order"
          }
        },
        "required": ["sorted"],
        "additionalProperties": false
      },
      "description": "One entry per input line, in the same order"
    }
  },
  "required": ["results"],
  "additionalProperties": false
}'

RESULT=$(cd workspace && claude -p "Sort each line of pipe-separated items in their natural/logical order. Return ONLY the items re-ordered. One result per line, same order as input.

${ITEMS}" \
  --output-format json \
  --json-schema "$SCHEMA" \
  --allowedTools "" \
  < /dev/null | jq -c '.structured_output.results')

IDX=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  sorted=$(echo "$RESULT" | jq -c ".[$IDX].sorted")
  jq -nc --arg input "$line" --argjson sorted "$sorted" '{input: $input, sorted: $sorted}'
  IDX=$((IDX + 1))
done < "$FILE"
