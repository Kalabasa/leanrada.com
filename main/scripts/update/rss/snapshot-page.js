import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

export async function createSnapshotter(siteDir) {
  const server = await startServer(siteDir);
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return {
    async snapshotPage(pageHref) {
      const pageUrl = `http://localhost:${server.port}${pageHref}`;

      const page = await browser.newPage();
      try {
        await page.goto(pageUrl, { waitUntil: "networkidle0", timeout: 30_000 });

        // trigger IntersectionObservers
        await page.evaluate(async () => {
          const delay = (ms) => new Promise((r) => setTimeout(r, ms));
          const step = window.innerHeight;
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await delay(100);
          }
          window.scrollTo(0, 0);
          await delay(500);
        });

        const mainHTML = await page.evaluate(() => {
          const main = document.querySelector("main");
          return main ? main.innerHTML : null;
        });

        if (!mainHTML) {
          throw new Error(`No <main> found for ${pageHref}`);
        }

        return mainHTML;
      } finally {
        await page.close();
      }
    },

    async close() {
      await browser.close();
      server.close();
    },
  };
}

function startServer(siteDir) {
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  };

  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      let filePath = path.join(siteDir, decodeURIComponent(new URL(req.url, "http://localhost").pathname));

      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          filePath = path.join(filePath, "index.html");
        }
      } catch {}

      try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    server.listen(0, () => {
      server.port = server.address().port;
      resolve(server);
    });
  });
}
