const http = require("http");
const fs = require("fs/promises");
const cheerio = require("cheerio");
const path = require("path");

const ORIGIN = "http://localhost:8000";

async function snapshot() {
  try {
    console.log("Crawl Report\n============");
    
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

      if (visited.has(urlPath)) {
        continue;
      }
      visited.add(urlPath);
      
      const currentPageUrl = new URL(urlPath, ORIGIN).href;
      console.log(`\nCrawling: ${currentPageUrl}`);

      const { statusCode, body } = await fetchUrl(currentPageUrl);
      results.set(urlPath, statusCode);

      if (statusCode === 200 && body) {
        const $ = cheerio.load(body);

        const base = $("base").attr("href");
        const baseUrl = base ? new URL(base, currentPageUrl).href : currentPageUrl;

        $("a[href], area[href], link[rel='canonical'][href]").each((i, el) => {
          const href = $(el).attr("href");
          const tagName = el.tagName.toLowerCase();
          const absoluteUrl = new URL(href, baseUrl);
          const resolvedPath = absoluteUrl.pathname + absoluteUrl.search; // No fragment

          let logMessage = `  Found ${tagName}: href="${href}" -> Resolved: ${absoluteUrl.href}`;

          if (absoluteUrl.origin === ORIGIN) {
            if (!visited.has(resolvedPath)) {
              queue.push(resolvedPath);
              logMessage += " (Queued)";
            } else {
              logMessage += " (Skipped - Already Visited)";
            }
          } else {
            logMessage += " (Skipped - External)";
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

  } catch (error)
   {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

const fetchUrl = (url) => {
  return new Promise((resolve) => {
    const req = http.request(url, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on("error", () => {
      resolve({ statusCode: "ERROR", body: "" });
    });
    req.end();
  });
};

snapshot();
