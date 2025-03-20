#!/usr/bin/env node
import path from "node:path";
import { rewrite } from "./rewrite/rewrite.mjs";
import sharp from "sharp";
import { ciede2000 } from "./lib/color-diff/diff.mjs";

const excludes = [
  // todo: exclude list (is this needed?)
];

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);
if (path.basename(projectRoot) !== "main") {
  throw new Error("Unexpected project root!");
}

const siteDir = path.resolve(projectRoot, "site");
const dryRun = process.argv.includes("--dry-run");
const refresh = process.argv.includes("--refresh");
const htmlFilePath = process.argv[process.argv.length - 1];

main();

async function main() {
  await rewrite({
    dryRun,
    htmlFilePath,
    setup(rewrite) {
      rewrite.on(refresh ? "img" : 'img:not([style*="--lqip:"])', {
        async element(element) {
          try {
            const src = element.getAttribute("src");
            if (!src) throw new Error("<img> with no src!");

            // todo: maybe it can fetch these?
            // external resources
            if (src.match("^([a-z]+:)?//")) return;
            if (src === "intentionally-broken-image") return;

            const imagePath = filePathFromSrc(htmlFilePath, src);
            console.group("Analyzing", imagePath);
            const theSharp = sharp(imagePath);
            const { width, height, opaque, rr, ggg, bb, values } =
              await analyzeImage(theSharp);
            console.groupEnd();

            if (
              !element.hasAttribute("width") &&
              !element.hasAttribute("height")
            ) {
              element.setAttribute("width", String(width));
              element.setAttribute("height", String(height));
            }

            if (opaque) {
              const ca = Math.round(values[0] * 0b11);
              const cb = Math.round(values[1] * 0b11);
              const cc = Math.round(values[2] * 0b11);
              const cd = Math.round(values[3] * 0b11);
              const ce = Math.round(values[4] * 0b11);
              const cf = Math.round(values[5] * 0b11);
              const lqip =
                ((ca & 0b11) << 17) +
                ((cb & 0b11) << 15) +
                ((cc & 0b11) << 13) +
                ((cd & 0b11) << 11) +
                ((ce & 0b11) << 9) +
                ((cf & 0b11) << 7) +
                ((rr & 0b11) << 5) +
                ((ggg & 0b111) << 2) +
                (bb & 0b11);

              // sanity check (999999 is the max safe integer for css in browsers)
              if (lqip > 999999) {
                throw new Error(`Invalid lqip value: ${lqip}`);
              }

              const lqipRule = `--lqip:${lqip.toFixed(0).padStart(6, "0")}`;
              let existingStyle = element.getAttribute("style");
              if (refresh && existingStyle?.includes("--lqip:")) {
                existingStyle = existingStyle.replaceAll(
                  /;--lqip:\s*\d+|--lqip:\s*\d+;?/g,
                  ""
                );
              }

              element.setAttribute(
                "style",
                [existingStyle, lqipRule].filter(truthy).join(";")
              );
            }
          } catch (error) {
            console.error(error);
            throw error;
          }
        },
      });
    },
  });
}

async function analyzeImage(aSharp) {
  const [metadata, stats, previewBuffer] = await Promise.all([
    aSharp.metadata(),
    aSharp.stats(),
    aSharp
      .gamma(2)
      .resize(3, 2, { fit: "fill" })
      .removeAlpha()
      .toFormat("raw", { bitdepth: 8 })
      .toBuffer(),
  ]);

  const size = getNormalSize(metadata);
  const opaque = stats.isOpaque;

  if (!opaque) {
    return {
      ...size,
      opaque: false,
    };
  }

  const { r: rawBaseR, g: rawBaseG, b: rawBaseB } = stats.dominant;

  const { rr, ggg, bb } = findRgbBits(rawBaseR, rawBaseG, rawBaseB);
  const baseR = Math.round((rr / 0b11) * 255);
  const baseG = Math.round((ggg / 0b111) * 255);
  const baseB = Math.round((bb / 0b11) * 255);
  // console.log(
  //   "Base color:",
  //   rawBaseR,
  //   rawBaseG,
  //   rawBaseB,
  //   "Compressed:",
  //   baseR,
  //   baseG,
  //   baseB
  // );

  const cells = Array.from({ length: 6 }, (_, index) => {
    const r = previewBuffer.readUint8(index * 3);
    const g = previewBuffer.readUint8(index * 3 + 1);
    const b = previewBuffer.readUint8(index * 3 + 2);
    return {
      r,
      g,
      b,
      value: getValue(r, g, b),
    };
  });

  const averageValue = cells.reduce((sum, { value }) => sum + value, 0) / 6;

  const offsetR = -baseR;
  const offsetG = -baseG;
  const offsetB = -baseB;
  const values = cells.map((cell) => {
    const { r, g, b, value } = cell;
    const rgbDelta = getValue(r + offsetR, g + offsetG, b + offsetB) / 255;
    const valueDelta = (value - averageValue) / 255;
    return clamp(0.5 + rgbDelta * 0.5 + valueDelta, 0, 1);
  });

  return {
    ...size,
    opaque: true,
    rr,
    ggg,
    bb,
    values,
  };
}

function getValue(r, g, b) {
  return 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
}

// find the best bit configuration that would produce a color closest to target
function findRgbBits(targetR, targetG, targetB) {
  let bestBits = [0, 0, 0];
  let bestDifference = Infinity;

  for (let rri = 0; rri <= 0b11; rri++) {
    for (let gggi = 0; gggi <= 0b111; gggi++) {
      for (let bbi = 0; bbi <= 0b11; bbi++) {
        const testR = (rri / 0b11) * 255;
        const testG = (gggi / 0b111) * 255;
        const testB = (bbi / 0b11) * 255;
        const difference = ciede2000(
          { r: testR, g: testG, b: testB },
          { r: targetR, g: targetG, b: targetB }
        );
        if (difference < bestDifference) {
          bestDifference = difference;
          bestBits = [rri, gggi, bbi];
        }
      }
    }
  }

  return { rr: bestBits[0], ggg: bestBits[1], bb: bestBits[2] };
}

function getNormalSize({ width, height, orientation }) {
  return (orientation || 0) >= 5
    ? { width: height, height: width }
    : { width, height };
}

function filePathFromSrc(htmlFilePath, src) {
  const dir = src.startsWith("/") ? siteDir : path.dirname(htmlFilePath);
  return path.resolve(path.join(dir, src));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function truthy(thing) {
  return !!thing;
}
