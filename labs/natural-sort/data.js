const dataURLs = [
  // "https://cdn.jsdelivr.net/gh/turbomaze/word2vecjson@f6e0226/data/wordvecs1000.js",
  "https://cdn.jsdelivr.net/gh/turbomaze/word2vecjson@f6e0226/data/wordvecs5000.js",
  "https://raw.githubusercontent.com/turbomaze/word2vecjson/f6e022654fe843e93b39fc5d965e198abaa23df3/data/wordvecs10000.js",
  "https://raw.githubusercontent.com/turbomaze/word2vecjson/f6e022654fe843e93b39fc5d965e198abaa23df3/data/wordvecs25000.js",
];

async function fetchWord2Vec(url) {
  const res = await fetch(url, { cache: "force-cache" });
  const text = await res.text();
  const prefix = "var wordVecs=";
  if (!text.startsWith(prefix)) throw new Error("invalid format");
  const endPunct = ",\n};\n";
  const hasEndPunct = text.endsWith(endPunct);
  const json = text.slice(prefix.length, hasEndPunct ? -endPunct.length : null) + (hasEndPunct ? "}" : "");
  return JSON.parse(json);
}

export class Word2VecData {
  #loadedIndex = -1;
  #lastFetch = Promise.resolve();
  #data = {};

  async find(word, ensure = false) {
    const vec = this.get(word);
    if (!vec && this.canLoadMore()) {
      await this.loadMore();
      return this.find(word, ensure);
    }
    if (!vec && ensure) {
      throw new Error(`no embedding found for "${word}"`);
    }
    return vec;
  }

  get(word) {
    return this.#data[word.toLowerCase()];
  }

  canLoadMore() {
    return this.#loadedIndex < dataURLs.length - 1;
  }

  async loadMore() {
    this.#lastFetch = this.#lastFetch.then(async () => {
      if (!this.canLoadMore()) return false;
      const index = this.#loadedIndex + 1;
      const data = await fetchWord2Vec(dataURLs[index]);
      Object.assign(this.#data, data);
      this.#loadedIndex = index;
      return true;
    });
    await this.#lastFetch;
  }
}
