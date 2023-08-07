#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"/../..
pwd

if [[ `git status --porcelain` ]]; then
  git status
  echo >&2 "Unclean work dir"
  git diff --stat
  exit 1
fi

# Build project
npm install
npm run clean-lite
npm run build-prod

# Generate source-controlled generated files
node scripts/update/clean-redirects.js
node scripts/update/generate-redirects.js
node scripts/update/generate-blog-index.js

if [[ `git status --porcelain` ]]; then
  echo >&2 "Unclean generated files"
  git diff --stat
  exit 1
fi

# Update prod in a worktree. master == prod
git fetch
git worktree add -f prod origin/master

# Generate untracked generated files
node scripts/deploy/generate-rss.js

# Copy build files to prod
rsync -Pr --del out/site/ prod/docs/

# Copy static files to prod
rsync -Pr prod-static/ prod/

# Copy github files to prod
rsync -Pr --del .github/ prod/.github/

# Commit prod changes
cd prod
git add .

if ! git diff-index --cached --quiet HEAD; then
  git config extensions.worktreeConfig true
  git config --worktree user.email "Kalabasa@users.noreply.github.com"
  git config --worktree user.name "Kalabasa"
  git commit -m "Deploy"
  git push origin HEAD:master
else
  echo >&2 "No changes to deploy"
fi

cd ..
rm -r prod
git worktree prune