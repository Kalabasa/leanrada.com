#!/usr/bin/env sh
git checkout -B deploy
git merge --no-edit -X theirs src
yarn install
yarn build
git add -f build/
git commit -m "Deploy"
git branch -D master
git subtree split -P build/ -b master
git push -f origin master:master
git checkout @{-1}
