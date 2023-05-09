#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"/..
pwd

npm run build-dev > /dev/null

truncate -s 0 out/textlint.tmp
npx textlint -o out/textlint.tmp -f pretty-error "out/site/wares/*/**/*.html" "out/site/notes/*/**/*.html"

truncate -s 0 out/eslint.tmp
! npx eslint -o out/eslint.tmp "out/site/**/*.html"

truncate -s 0 out/lint.tmp
cat out/textlint.tmp >> out/lint.tmp
cat out/eslint.tmp >> out/lint.tmp
cat out/lint.tmp

truncate -s 0 out/lint
cat out/lint.tmp | npx strip-ansi > out/lint
echo "Lint report written at out/lint"
