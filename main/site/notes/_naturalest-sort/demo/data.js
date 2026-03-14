import { openDB } from "./db.js";

export class Word2VecData {
  preload() {
    return populate();
  }

  async find(words) {
    await populate();
    const keys = words.map(w => w.toLowerCase());
    const vecs = await db.get(keys);
    for (let i = 0; i < words.length; i++) {
      if (!vecs[i]) throw new Error(`no embedding found for "${words[i]}"`);
    }
    return vecs;
  }
}

const dataURL = "https://raw.githubusercontent.com/Kalabasa/word2vecjson/df8e1ca892678ab7d00fc9f0c577b64b79c1c568/data.json"; // https://kalabasa.github.io/word2vecjson/data.json

let populatePromise = null;

async function populate() {
  if (populatePromise) return populatePromise;
  return populatePromise = (async () => {
    const sentinelKey = "_populated";
    const [existing] = await db.get([sentinelKey]);
    if (existing) return;
    const data = await fetch(dataURL).then((r) => r.json());
    const entries = Object.entries(data);
    entries.push([sentinelKey, true]);
    await db.putAll(entries);
  })();
}

const db = await openDB("word2vec");
