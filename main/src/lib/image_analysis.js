const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const cacheFile = path.resolve(
  __dirname,
  "..",
  "..",
  "out",
  "cache",
  "image_analysis.json"
);

let cache = null;
async function getImageAnalysis(imageFilePath) {
  cache = cache ?? (await installCache());

  if (!fs.existsSync(imageFilePath)) {
    throw new Error("Image does not exist: " + imageFilePath);
  }

  const stat = fs.statSync(imageFilePath);

  const cachedValue = cache[imageFilePath];
  if (
    cachedValue &&
    cachedValue.time >= Math.floor(stat.mtime.getTime() / 1e3)
  ) {
    return cachedValue.data;
  }

  console.log("Analyzing img:", imageFilePath);
  const image = await fs.promises.readFile(imageFilePath);
  const sharpObj = sharp(image);
  const [metadata, stats] = await Promise.all([
    sharpObj.metadata(),
    sharpObj.stats(),
  ]);

  const data = {
    metadata: {
      width: metadata.width,
      height: metadata.height,
    },
    stats: {
      dominant: stats.dominant,
    },
  };

  cache[imageFilePath] = {
    data,
    time: Math.floor(Date.now() / 1e3),
  };

  return data;
}

function installCache() {
  let writeQueueHead = fs.promises.mkdir(path.dirname(cacheFile), {
    recursive: true,
  });
  return new Proxy(Object.create(null), {
    get(_, key) {
      if (!installCache.memory) loadCacheIntoMemory();
      return installCache.memory[key];
    },
    set(_, key, value) {
      if (!installCache.memory) loadCacheIntoMemory();
      installCache.memory[key] = value;

      const latestJob = writeQueueHead;
      writeQueueHead = writeQueueHead.then(() => {
        if (writeQueueHead !== latestJob) return; // stale
        fs.promises.writeFile(cacheFile, JSON.stringify(installCache.memory));
      });

      return true;
    },
  });
}

function loadCacheIntoMemory() {
  installCache.memory = {};

  try {
    if (fs.existsSync(cacheFile)) {
      installCache.memory = JSON.parse(fs.readFileSync(cacheFile));
    }
  } catch (e) {
    console.error(e);
    installCache.memory = {};
  }
}

module.exports = {
  getImageAnalysis,
};
