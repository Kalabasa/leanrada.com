const fs = require("node:fs/promises");
const path = require("node:path");
const childProcess = require("node:child_process");
const cheerio = require("cheerio");

const port = 4567
const origin = "http://localhost:" + port;

snapshot();

async function snapshot() {
  let devServer;
  try {
    devServer = await setupDevServer(devServer);

    const seedUrlsPath = path.join(__dirname, "seed");
    const snapshotPath = path.join(__dirname, 'snapshot');

    const seedUrls = (await fs.readFile(seedUrlsPath, 'utf8'))
      .split('\n').filter(Boolean);
    const snapshotUrls = (await fs.readFile(snapshotPath, 'utf8').catch(() => ""))
      .split("\n").filter(Boolean)
      .map(line => line.split(" ", 2)[1]).filter(Boolean);

    const queue = [...snapshotUrls, ...seedUrls];
    const visited = new Set();
    const results = new Map();

    while (queue.length > 0) {
      const urlPath = queue.shift();

      if (visited.has(urlPath)) continue;
      visited.add(urlPath);
      
      const currentPageUrl = new URL(urlPath, origin).href;
      console.log(`crawl: ${currentPageUrl}`);

      const { status, text } = await fetchUrl(currentPageUrl);
      results.set(urlPath, status);

      if (status === 200 && text) {
        const $ = cheerio.load(text);

        const base = $("base").attr("href");
        const baseUrl = base ? new URL(base, currentPageUrl).href : currentPageUrl;

        $("a[href], area[href], link[rel='canonical'][href]").each((i, el) => {
          const href = $(el).attr("href");
          const tagName = el.tagName.toLowerCase();
          const absoluteUrl = new URL(href, baseUrl);
          const resolvedPath = absoluteUrl.pathname + absoluteUrl.search; // No fragment

          let logMessage = `  <${tagName} href="${href}"> : ${absoluteUrl.href}`;

          if (absoluteUrl.origin === origin) {
            if (!visited.has(resolvedPath)) {
              queue.push(resolvedPath);
              logMessage += " (queued)";
            } else {
              logMessage += " (skipped - visited)";
            }
          } else {
            logMessage += " (skipped - external)";
          }
          console.log(logMessage);
        });
      }
    }

    const lines = Array.from(results.entries())
      .sort(([urlA,], [urlB,]) => urlA.localeCompare(urlB, "en"))
      .map(([url, code]) => `${code} ${url}`);
    await fs.writeFile(snapshotPath, lines.join("\n"));
    console.log(`\nSnapshot created successfully with ${results.size} URLs.`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    devServer?.kill();
  }
}

async function fetchUrl(url) {
  try {
    const res = await fetch(url);
    return {
      status: res.status,
      text: await res.text(),
    };
  } catch (e) {
    console.error(e);
    return { status: "ERR", text: "" };
  }
};

async function setupDevServer(devServer) {
  const devServerReady = Promise.withResolvers();

  devServer = childProcess.spawn("node", ["lat", "dev", `--port=${port}`, "main"]);
  devServer.stdout.on("data", data => {
    if (data.toString().includes(origin)) {
      devServerReady.resolve();
    }
  });

  const devServerTmeout = setTimeout(() => devServerReady.resolve(), 5000);
  await devServerReady;
  clearTimeout(devServerTmeout);

  await new Promise(r => setTimeout(r, 100));
  return devServer;
}
