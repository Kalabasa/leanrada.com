#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"/..
pwd

if [[ `git status --porcelain` ]]; then
  echo >&2 "Unclean work dir"
  exit
fi

# Do generated files
node scripts/clean-redirects.js
node scripts/generate-redirects.js
node scripts/update-blog-index.js

if [[ `git status --porcelain` ]]; then
  echo >&2 "Unclean generated files"
  exit
fi

# Build project
yarn install
yarn clean
yarn build-prod

# Update prod in a worktree. master == prod
git worktree add -f prod master

# Copy build files to prod
rsync -Pr --del out/site/ prod/docs/

# Copy static files to prod
rsync -Pr prod-static/ prod/

# Commit prod changes
cd prod
git add .

if ! git diff-index --cached --quiet HEAD; then
  git commit -m "Deploy"
  git push
else
  echo >&2 "No changes to deploy"
fi

cd ..
rm -r prod
git worktree prune
