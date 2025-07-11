const fs = require("fs");
const path = require("path");

const masterPath = path.resolve(__dirname, "../../data/_app_songs.json");
const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));

for (const entry of master) {
  const jsonPath = path.join(path.dirname(masterPath), entry.json);
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const stats = {};
  for (const line of data.lyrics ?? []) {
    if (!line.lang) continue;
    stats[line.lang] = (stats[line.lang] ?? 0) + 1;
  }

  entry.stats = stats;
}

fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));
