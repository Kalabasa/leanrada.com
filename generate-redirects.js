const glob = require("glob");
const path = require("node:path");
const fs = require("node:fs");
const { argv } = require("node:process");

const redirects = {
  "works/**": "archive/v3/works/**.html"
};

const siteSrc = path.resolve(__dirname, "src", "site");

main();

async function main() {
  let expandedRedirects = {};

  for (const [from, to] of Object.entries(redirects)) {
    const toFiles = glob.sync(path.resolve(siteSrc, to), { nodir: true });
    for (const toFile of toFiles) {
      const toHref = path.relative(siteSrc, toFile);

      let fromHref;
      const toPrefix = to.indexOf("*");
      const fromPrefix = from.indexOf("*");
      if (toPrefix >= 0 && fromPrefix >= 0) {
        fromHref = from.substring(0, fromPrefix) + toHref.substring(toPrefix);
      } else {
        fromHref = from;
      }

      expandedRedirects[fromHref] = toHref;
    }
  }

  if (argv.includes("--dry-run")) {
    console.log(expandedRedirects);
    return;
  }

  await Promise.all(
    Object.entries(expandedRedirects)
      .map(([from, to]) => {
        const html = `<meta http-equiv="Refresh" content="0; url='${to}'" />`;
        console.log("Writing redirect file", from, "pointing to", to);
        return fs.promises.writeFile(path.resolve(srcSite, from), html);
      })
  );
}