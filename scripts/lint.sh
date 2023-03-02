#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"/..
pwd

yarn build
npx textlint -f pretty-error "docs/wares/*/**/*.html" "docs/blog/*/**/*.html"
