import fs from "fs";
import { readFile } from "fs/promises";
import * as h3 from "h3-js";
import { featureEach } from "@turf/meta";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const inputFile = path.join(dirname, "philippines.geojson");
const outputFile = path.join(dirname, "..", "data", "_app_hexmap.json");

const resolution = 5;

const geojsonURL =
  "https://raw.githubusercontent.com/faeldon/philippines-json-maps/refs/heads/master/2023/geojson/country/lowres/country.0.001.json";

// lat,lng to x,y
const project = ([lat, lng]) => [lng, -lat]; // Equirectangular projection

// Download the GeoJSON file if it doesn't exist
if (!fs.existsSync(inputFile)) {
  console.log("Downloading GeoJSON...");
  const res = await fetch(geojsonURL);
  if (!res.ok) {
    console.error(`Failed to download GeoJSON: ${res.statusText}`);
    process.exit(1);
  }
  const data = await res.text();
  fs.writeFileSync(inputFile, data);
  console.log("Download complete.");
}

const geojson = JSON.parse(await readFile(inputFile, "utf8"));
const hexSet = new Set();

featureEach(geojson, (f) => {
  console.log(f.geometry);
  if (f.geometry.type === "MultiPolygon") {
    for (const [polygon] of f.geometry.coordinates) {
      const hexes = h3.polygonToCells(polygon, resolution, true);
      hexes.forEach((h) => hexSet.add(h));
    }
  } else if (f.geometry.type === "Polygon") {
    const hexes = h3.polygonToCells(
      f.geometry.coordinates[0],
      resolution,
      true
    );
    hexes.forEach((h) => hexSet.add(h));
  } else {
    throw new Error("Unsupported geometry type: " + f.geometry.type);
  }
});

const rawCells = [];
let minX = Infinity,
  maxX = -Infinity;
let minY = Infinity,
  maxY = -Infinity;

for (const h of hexSet) {
  const [x, y] = project(h3.cellToLatLng(h, true));
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
  rawCells.push([x, y]);
}

// Normalize to Y ∈ [0, 100], preserving aspect ratio
const scale = 100 / (maxY - minY);
const normCells = rawCells.map(([x, y]) => [
  (x - minX) * scale,
  (y - minY) * scale,
]);

fs.writeFileSync(outputFile, JSON.stringify(normCells));
console.log(`Saved ${normCells.length} hex tiles to ${outputFile}`);
