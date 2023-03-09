#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"/..
pwd

touch out/lint.txt
truncate -s 0 out/lint.txt

yarn build-dev > /dev/null

npx textlint -o out/lint.txt --no-color -f pretty-error "out/site/wares/*/**/*.html" "out/site/notes/*/**/*.html"

cat out/lint.txt
