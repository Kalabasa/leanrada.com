#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"/../..
pwd

# Sync v2
git worktree add -f update-archive-worktree d50d0d0bb1fed25d0710f7b2c4b232b40c521c21

# Update absolute URLs
find update-archive-worktree \
  -type f \
  \( -name "*.html" -o -name "*.css" \) \
  -exec sed -Ei "s_(href=\"|url\(\"|url\(')/_\1/archive/v2/_g" {} +

# Build project
cd update-archive-worktree
# Fix for "'primordials' undefined"
cp package.json package.old.json
jq '. + {overrides:{"graceful-fs":"^4.2.11"}}' package.old.json > package.json
# Lock versions
npm install -D bower@1.8.8
npm install -D concurrently@3.5.1
# Build
npm install
npm run build
# Use diff compiler
npm uninstall handlebars-cmd
npm install -D hbs-cli
npx hbs -D src/html/home.json -o /dev/null/ -s -- src/html/home.handlebars > build/index.html
cd ..

rsync -r update-archive-worktree/build/ src/site/archive/v2/
git worktree remove --force update-archive-worktree
