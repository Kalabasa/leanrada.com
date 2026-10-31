#!/usr/bin/env bash
set -euo pipefail

repoDir="$(dirname "$0")/.."
siteDir="$repoDir/site"
fontPath="$siteDir/font/noto-sans-tagalog.woff2"

tagalogChars=""
for codePoint in $(seq $((0x1700)) $((0x171F))) $((0x1735)) $((0x1736)); do
  tagalogChars+="$(printf "\\U$(printf "%08X" "$codePoint")")"
done

fontCss="$(curl -sf \
  -A "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0" \
  --get "https://fonts.googleapis.com/css2" \
  --data-urlencode "family=Noto Sans Tagalog" \
  --data-urlencode "text=$tagalogChars")"

fontUrl="$(grep -oP "url\(\K[^)]+" <<<"$fontCss")"

curl -sf "$fontUrl" -o "$fontPath"

echo "Vendored $tagalogChars to $fontPath"
