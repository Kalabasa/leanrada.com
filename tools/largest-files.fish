#!/usr/bin/env fish

set dir (dirname (status dirname))
find $dir -type f \
  -not -path "*/.git/*" \
  -not -path "*/.venv/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/cache/*" \
  -not -path "*/tmp/*" \
  -not -path "*/www/*" \
  -printf "%s %p\n" \
| sort -nr \
| head -n 20 \
| numfmt --to=iec --field=1 \
| awk '{print $1, $2}'
