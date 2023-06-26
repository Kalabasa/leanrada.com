#!/bin/sh
set -e

cd "$(dirname "$0")"/..
pwd

# Sync v3
git worktree add -f update-archive-worktree 4c3b2d086b4bc099adad31f56ebf3bc4c443bffb

# Update absolute URLs
find update-archive-worktree \
  -type f \
  \( -name "*.html" -o -name "*.css" \) \
  -exec sed -Ei "s_(href=\"|url\(\"|url\(')/_\1/archive/v3/_g" {} +

# Update getPageName() from page.js
find update-archive-worktree \
  -type f \
  -name "*.js" \
  -exec sed -i "s_return pathname.substring(1); // remove front slash_return pathname.substring(12); // remove front slash_g" {} +

rsync -r update-archive-worktree/ src/site/archive/v3/
git worktree remove --force update-archive-worktree

