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

# Perform the update in a worktree
git fetch
git worktree add -f update origin/src
cd update

# Update
node scripts/update/update-reputation.js
node scripts/update/update-hits.js
node scripts/update/update-gh-contribs.js
node scripts/update/update-streak.js

# Commit updates
git add .

if ! git diff-index --cached --quiet HEAD; then
  git config extensions.worktreeConfig true
  git config --worktree user.email "Kalabasa@users.noreply.github.com"
  git config --worktree user.name "Kalabasa"
  git commit -m "Automated regular data update."
  git push origin HEAD:src
else
  echo >&2 "No updates to commit"
fi

cd ..
rm -r update
git worktree prune
