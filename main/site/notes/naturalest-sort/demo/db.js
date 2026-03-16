const isNode = typeof globalThis.process !== "undefined";


export function openDB(name) {
  if (isNode) {
    return openMemoryDB();
  }
  return openIndexedDB(name);
}

function openMemoryDB() {
  const map = new Map();
  return Promise.resolve({
    get(keys) {
      return Promise.resolve(keys.map(k => map.get(k)));
    },
    put(key, value) {
      map.set(key, value);
      return Promise.resolve();
    },
    putAll(entries) {
      for (const [key, value] of entries) {
        map.set(key, value);
      }
      return Promise.resolve();
    },
  });
}

function openIndexedDB(name) {
  const storeName = "data";
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => req.result.createObjectStore(storeName);
    req.onsuccess = () => {
      const idb = req.result;
      resolve({
        get(keys) {
          return new Promise((resolve, reject) => {
            const tx = idb.transaction(storeName);
            const store = tx.objectStore(storeName);
            const results = [];
            for (const key of keys) {
              const req = store.get(key);
              req.onsuccess = () => results.push(req.result);
            }
            tx.oncomplete = () => resolve(results);
            tx.onerror = () => reject(tx.error);
          });
        },
        put(key, value) {
          return wrapIDBRequest(
            idb.transaction(storeName, "readwrite").objectStore(storeName).put(value, key)
          );
        },
        putAll(entries) {
          return new Promise((resolve, reject) => {
            const tx = idb.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            for (const [key, value] of entries) {
              store.put(value, key);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        },
      });
    };
  });
}

function wrapIDBRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
