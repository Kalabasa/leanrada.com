#!/usr/bin/env bash
set -e

PROJECT_DIR="$(dirname "$0")"/../..
cd $PROJECT_DIR
pwd

if [[ `git status --porcelain .` ]]; then
  git status
  echo >&2 "Unclean work dir"
  git diff --stat
  exit 1
fi

# Build project
npm install
npm run clean
npm run build-prod

# Generate source-controlled generated files
node scripts/update/clean-redirects.js
node scripts/update/generate-redirects.js
node scripts/update/generate-blog-index.js --no-build

if [[ `git status --porcelain .` ]]; then
  echo >&2 "Unclean generated files"
  git diff --stat
  exit 1
fi

# Generate untracked generated files
node scripts/deploy/generate-rss.js
