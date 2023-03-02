#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"/..
pwd

yarn build-dev > /dev/null
npx textlint -o out/lint.txt --no-color -f pretty-error "out/site/wares/*/**/*.html" "out/site/blog/*/**/*.html"
