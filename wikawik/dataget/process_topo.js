const geojsonMerge = require("@mapbox/geojson-merge");
const topojson = require("topojson");
const simplify = require("simplify-js");
const polygonClipping = require("polygon-clipping");
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const { MERGE_MAP, areaNameToCode } = require("./common.js");

// Read geojson
console.log("Loading geojson");
const regionGeoObjects = glob
  .sync(
    path.resolve(
      __dirname,
      "philippines-json-maps/geojson/regions/hires/*.json"
    )
  )
  .map((file) => JSON.parse(fs.readFileSync(file)));
const provinceGeoObjects = glob
  .sync(
    path.resolve(
      __dirname,
      "philippines-json-maps/geojson/provinces/hires/*.json"
    )
  )
  .map((file) => JSON.parse(fs.readFileSync(file)));
const municipalityGeoObjects = glob
  .sync(
    path.resolve(
      __dirname,
      "philippines-json-maps/geojson/municities/hires/*.json"
    )
  )
  .map((file) => JSON.parse(fs.readFileSync(file)));

console.log(
  `Loaded ${regionGeoObjects.length} region files, ${provinceGeoObjects.length} province files, and ${municipalityGeoObjects.length} municipality/city files`
);

// Merge areas. See MERGE_MAP
for (const [srcCode, dstCode] of Object.entries(MERGE_MAP)) {
  let srcFeature, dstFeature;

  for (const provinceGeo of provinceGeoObjects) {
    const features = provinceGeo.features;
    for (let i = features.length - 1; i >= 0; i--) {
      const feature = features[i];
      if (feature.properties.ADM2_PCODE) {
        const code = feature.properties.ADM2_PCODE.substring(2, 6);

        if (code === srcCode) {
          srcFeature = feature;
          features.splice(i, 1);
        } else if (code === dstCode) {
          dstFeature = feature;
        }
      }
    }
  }

  if (srcFeature && dstFeature) {
    console.log(
      `Merging ${srcFeature.properties.ADM2_EN} (${srcCode})` +
        ` → ${dstFeature.properties.ADM2_EN} (${dstCode})`
    );
    const mergedCoordinates = polygonClipping.union(
      dstFeature.geometry.coordinates,
      srcFeature.geometry.coordinates
    );
    dstFeature.geometry.type = "MultiPolygon";
    dstFeature.geometry.coordinates = mergedCoordinates;
  } else {
    console.warn(
      "Geometries to merge not found: " +
        ((!srcFeature && srcCode) || "...") +
        " → " +
        ((!dstFeature && dstCode) || "...")
    );
  }
}

// Get provinces + NCR.
const geoObjects = [
  ...regionGeoObjects
    .map((regionGeoObject) => ({
      ...regionGeoObject,
      features: regionGeoObject.features.filter(
        // add NCR
        ({ properties }) => properties.ADM1_PCODE === "PH130000000"
      ),
    }))
    .filter((obj) => obj && obj.features.length),
  ...provinceGeoObjects
    .map((provinceGeoObject) => ({
      ...provinceGeoObject,
      features: provinceGeoObject.features.filter(
        ({ properties }) =>
          // filter out NCR districts
          properties.ADM1_PCODE !== "PH130000000"
      ),
    }))
    .filter((obj) => obj && obj.features.length),
];

// Assign area code (PSGC 2018) to geo objects
for (const geoObject of geoObjects) {
  for (const feature of geoObject.features) {
    const name = feature.properties.ADM2_EN || feature.properties.ADM1_EN;
    const geojsonCode = (
      feature.properties.ADM2_PCODE || feature.properties.ADM1_PCODE
    ).substring(2, 6);

    const psgcCode = areaNameToCode(name);
    feature.properties = {
      wikaCode: psgcCode || geojsonCode,
    };

    if (!psgcCode) {
      console.warn(
        `No code found for '${name}'. Falling back to geojson data: ${geojsonCode}`
      );
    } else if (geojsonCode !== psgcCode) {
      console.warn(
        `Mismatched code from geojson & from PSGC for '${name}'. Geojson: ${geojsonCode}. PSGC: ${psgcCode}. PSGC used.`
      );
    }

    if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(
        simplifyPolygon
      );
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(
        (shapes) => shapes.map(simplifyPolygon)
      );
    } else {
      throw new Error("Unknown geometry type");
    }
  }
}

function simplifyPolygon(polygon) {
  return simplify(
    polygon.map(([x, y]) => ({ x: x, y: y })),
    0.002,
    true
  ).map(({ x, y }) => [x, y]);
}

// Merge to simplified topojson
const mergedGeoObject = geojsonMerge.merge(geoObjects);
let topoObject = topojson.topology({ areas: mergedGeoObject }, 1e3);
for (let i = 0; i < 4; i++) {
  topoObject = topojson.presimplify(topoObject);
  topoObject = topojson.simplify(topoObject, 1e-3);
}
topoObject = topojson.presimplify(topoObject, dot);
topoObject = topojson.simplify(topoObject, 0);
topoObject = topojson.filter(
  topoObject,
  topojson.filterWeight(topoObject, 1e-3)
);

console.log("Total: " + topoObject.objects.areas.geometries.length + " areas.");

const outFile = path.resolve(__dirname, "data/areas.topo.json");
fs.writeFileSync(outFile, JSON.stringify(topoObject));
console.log("Wrote output to " + outFile);

function dot([[x0, y0], [x1, y1], [x2, y2]]) {
  const v1x = x1 - x0;
  const v1y = y1 - y0;
  const v2x = x2 - x1;
  const v2y = y2 - y1;
  return v1x * v2x + v1y * v2y;
}
