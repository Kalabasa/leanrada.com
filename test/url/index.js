const fs = require("node:fs/promises");
const path = require("node:path");
const childProcess = require("node:child_process");

const port = 4567
const origin = "http://localhost:" + port;

const shouldLog = !process.stdout.isTTY;
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

    const queue = new Map([...snapshotUrls, ...seedUrls].map(value => [value, value]));
    const visited = new Set();
    const results = new Map();

    const baseHrefRegex = makeHrefRegex(["base"]);
    const hrefRegex = makeHrefRegex(["a", "link"]);

    // OPTIMISATION: SHARED RESULT OBJECT. DO NOT USE CONCURRENTLY!
    const SHARED_result = {};

    while (queue.size > 0) {
      const urlPath = queue.keys().next().value;
      queue.delete(urlPath);

      if (visited.has(urlPath)) continue;
      visited.add(urlPath);
      
      const currentPageUrl = new URL(urlPath, origin).href;
      if (shouldLog) console.log(`crawl: ${currentPageUrl}`);

      await fetchUrl(currentPageUrl, SHARED_result);
      results.set(urlPath, SHARED_result.status);

      if (SHARED_result.status === 200 && SHARED_result.text) {
        baseHrefRegex.lastIndex = 0;
        const baseHref = getMatchHref(baseHrefRegex.exec(SHARED_result.text));
        const baseUrl = baseHref ? new URL(baseHref, currentPageUrl).href : currentPageUrl;

        const hrefMatches = SHARED_result.text.matchAll(hrefRegex);
        for (const m of hrefMatches) {
          const href = getMatchHref(m);
          const absoluteUrl = new URL(href, baseUrl);
          const resolvedPath = absoluteUrl.pathname + absoluteUrl.search; // No fragment

          let extraLog = "";
          if (absoluteUrl.origin === origin) {
            if (!visited.has(resolvedPath)) {
              queue.set(resolvedPath, resolvedPath);
              if (shouldLog) extraLog = " (queued)";
            } else {
              if (shouldLog) extraLog = " (skipped - visited)";
            }
          } else {
            if (shouldLog) extraLog = " (skipped - external)";
          }
          if (shouldLog) console.log(`  ${href} : ${absoluteUrl.href}${extraLog}`);
        }
      }
    }

    const lines = Array.from(results.entries())
      .sort(([urlA,], [urlB,]) => urlA.localeCompare(urlB, "en"))
      .map(([url, code]) => `${code} ${url}`);
    await fs.writeFile(snapshotPath, lines.join("\n") + "\n");
    if (shouldLog) console.log(`\nSnapshot created successfully with ${results.size} URLs.`);

    devServer?.kill();
    devServer?.unref();
    process.exit(0); // Don't wait for setTimeouts
  } catch (error) {
    console.error(error);
    devServer?.kill();
    devServer?.unref();
    process.exit(1);
  }
}

function makeHrefRegex(tagNames) {
  const tags = tagNames.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(
    `<(?:${tags})\\b[^>]*?\\bhref\\s*?=\\s*?(?:"([^"]*?)"|'([^']*?)'|([^\\s>]+?))`,
    'gi'
  );
}

function getMatchHref(match) {
  return match && (match[1] ?? match[2] ?? match[3]);
}

async function fetchUrl(url, result = {}) {
  const abortController = new AbortController();
  try {
    let attempts = 5;
    while (attempts > 0) {
      try {
        const res = await fetch(url, { signal: abortController.signal });
        const isHtml = res.headers.get("Content-Type")?.startsWith("text/html");
        result.status = res.status;
        result.text = isHtml ? await res.text() : "";
        return result;
      } catch (e) {
        attempts--;
        await delay(100);
      }
    }
    result.status = "ERR";
    result.text = "";
    return result;
  } finally {
    abortController.abort();
  }
}

async function setupDevServer(devServer) {
  const devServerReady = Promise.withResolvers();

  devServer = childProcess.spawn("node", ["lat", "dev", `--port=${port}`, "main"], {
    detached: true,
  });
  devServer.stdout.on("data", data => {
    if (data.toString().includes(origin)) {
      devServerReady.resolve();
    }
  });
  devServer.stderr.on("data", data => {
    console.error("[SERVER]", data.toString());
  });

  await Promise.race([devServerReady, delay(5000)]);

  await delay(50);
  return devServer;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}