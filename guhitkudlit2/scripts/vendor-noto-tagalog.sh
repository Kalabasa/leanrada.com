#!/usr/bin/env bash
set -euo pipefail

repoDir="$(dirname "$0")/.."
siteDir="$repoDir/site"
fontPath="$siteDir/font/noto-sans-tagalog.woff2"

usedChars="$(grep -rhoIP "[\x{1700}-\x{173F}]" "$siteDir" | sort -u | tr -d '\n')"

fontCss="$(curl -sf \
  -A "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0" \
  --get "https://fonts.googleapis.com/css2" \
  --data-urlencode "family=Noto Sans Tagalog" \
  --data-urlencode "text=$usedChars")"

fontUrl="$(grep -oP "url\(\K[^)]+" <<<"$fontCss")"

curl -sf "$fontUrl" -o "$fontPath"

echo "Vendored $usedChars to $fontPath"
