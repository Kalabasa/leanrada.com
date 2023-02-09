#!/usr/bin/env bash
set -e

if [[ `git status --porcelain` ]]; then
  echo "Unclean work dir"
  exit
fi

# Build project
yarn install
yarn clean
yarn build

# Update prod in a worktree. master == prod
git worktree add -f prod master

# Copy build files to prod
rsync -Pr --del docs/ prod/docs

# Commit prod changes
cd prod
touch .nojekyll
git add docs .nojekyll

if [[ -n `git diff --quiet` ]]; then
  git commit -m "Deploy"
  git diff HEAD~
  git push
else
  echo "No changes to deploy"
fi

cd ..
rm -r prod
git worktree prune
