#!/usr/bin/env bash

FILE="${1:?Usage: sort.sh <filepath>}"

SCHEMA='{
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
}'

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  shuffled=$(echo "$line" | tr ',' '\n' | shuf | paste -sd ',')
  result=$(cd workspace && claude -p "Sort these comma-separated items in their natural/logical order. Return ONLY these items, re-ordered: $shuffled" \
    --output-format json \
    --json-schema "$SCHEMA" \
    --allowedTools "" \
    < /dev/null | jq -c '.structured_output')
  echo "Input:  $shuffled"
  echo "Output: $result"
  echo
done < "$FILE"
