Building
--------

```sh
# Dependencies
bower install
npm install --only=dev

# Build
npm run build
```

Deploying
---------

```sh
git checkout src
cd kalabasa.github.io

git add build -f
git commit -m "Deploy"
git subtree push --prefix build/ origin master
```
