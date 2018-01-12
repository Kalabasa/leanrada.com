#!/usr/bin/env sh
git checkout deploy
git merge --no-edit -X theirs src
bower install
npm install --only=dev
npm run build
git add -f build/
git commit -m "Deploy"
git subtree split -P build/ -b master
git push -f origin master:master
git checkout @{-1}
