import { openDB } from "./db.js";

export class Word2VecData {
  async find(words) {
    await preload();
    const keys = words.map(w => w.toLowerCase());
    const vecs = await db.get(keys);
    for (let i = 0; i < words.length; i++) {
      if (!vecs[i]) throw new Error(`no embedding found for "${words[i]}"`);
    }
    return vecs;
  }
}

const db = await openDB("word2vec");

let preloadPromise = null;

export async function preload() {
  if (preloadPromise) return preloadPromise;
  return preloadPromise = (async () => {
    const sentinelKey = "_populated";
    const [existing] = await db.get([sentinelKey]);
    if (existing) return;
    const data = await fetchData();
    const entries = Object.entries(data);
    entries.push([sentinelKey, true]);
    await db.putAll(entries);
  })();
}

const isNode = typeof globalThis.process !== "undefined";

const dataURL = "https://raw.githubusercontent.com/Kalabasa/word2vecjson/2ed5414e77533f9d9bded211158569d99c00cec1/data.json.gz"; // https://kalabasa.github.io/word2vecjson/data.json.gz

async function fetchData() {
  if (isNode) {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const cacheFile = path.join(import.meta.dirname, ".cache", "data.json");
    try {
      return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    } catch {
      console.warn("Fetching data...");
      const data = await decompressToJson(await fetch(dataURL));
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(data));
      return data;
    }
  }
  return decompressToJson(await fetch(dataURL));
}

async function decompressToJson(response) {
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).json();
}
