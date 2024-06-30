const fs = require("node:fs");

function isOutputStale(inputPath, outPath) {
  if (!fs.existsSync(outPath)) return true;

  const outStats = fs.statSync(outPath);
  if (!outStats.isFile()) {
    throw new Error("Expected a file. Got a directory or something:", outPath);
  }

  const inStats = fs.statSync(inputPath);
  return outStats.mtimeMs < inStats.mtimeMs;
}

module.exports = { isOutputStale };
