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

export DEPLOY_DIR="$@"

# Build project
npm install
cd $DEPLOY_DIR
npm run --prefix $PROJECT_DIR clean-ci
cd $PROJECT_DIR
npm run build-prod -- -o $DEPLOY_DIR

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
