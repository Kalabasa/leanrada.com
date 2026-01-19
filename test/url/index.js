const http = require('http');
const fs = require('fs/promises');
const cheerio = require('cheerio');
const path = require('path'); // Require the path module

const ORIGIN = 'http://localhost:8000';

async function snapshot() {
  try {
    console.log('Crawl Report\n============');
    
    // Construct absolute path for seed
    const seedUrlsPath = path.join(__dirname, 'seed');
    const seedUrls = (await fs.readFile(seedUrlsPath, 'utf8')).split('\n').filter(Boolean);

    const queue = [...seedUrls];
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

        const base = $('base').attr('href');
        const baseUrl = base ? new URL(base, currentPageUrl).href : currentPageUrl;

        $('a[href], area[href]').each((i, el) => {
          const href = $(el).attr('href');
          const tagName = el.tagName.toLowerCase();
          const absoluteUrl = new URL(href, baseUrl);
          const resolvedPath = absoluteUrl.pathname + absoluteUrl.search; // No fragment

          let logMessage = `  Found ${tagName}: href="${href}" -> Resolved: ${absoluteUrl.href}`;

          if (absoluteUrl.origin === ORIGIN) {
            if (!visited.has(resolvedPath)) {
              queue.push(resolvedPath);
              logMessage += ' (Queued)';
            } else {
              logMessage += ' (Skipped - Already Visited)';
            }
          } else {
            logMessage += ' (Skipped - External)';
          }
          console.log(logMessage);
        });
      }
    }

    const lines = Array.from(results.entries()).map(([url, code]) => `${url} ${code}`).sort(); // Sort lines alphabetically
    // Construct absolute path for snapshot
    const snapshotPath = path.join(__dirname, 'snapshot');
    await fs.writeFile(snapshotPath, lines.join('\n'));
    console.log(`\nSnapshot created successfully with ${results.size} URLs.`);

  } catch (error)
   {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

const fetchUrl = (url) => {
  return new Promise((resolve) => {
    const req = http.request(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', () => {
      resolve({ statusCode: 'ERROR', body: '' });
    });
    req.end();
  });
};

snapshot();


