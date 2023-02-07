#!/usr/bin/env bash
set -e

git status --porcelain

# Build project
git branch -f build
git checkout build

yarn install
yarn clean
yarn build

git add -f "docs/"
git commit -m "Deploy"

# Update prod. master == prod
git checkout -f master

rm -rf node_modules/
git rm -rf .
git clean -df

git checkout -f build -- "docs/"

touch .nojekyll
git add .nojekyll

git commit -m "Deploy"
git diff HEAD~
echo "Run 'git push' to deploy"
