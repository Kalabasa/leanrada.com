#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { rewrite } from "./rewrite/rewrite.mjs";
import sharp from "sharp";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);
if (path.basename(projectRoot) !== "main") {
  throw new Error("Unexpected project root!");
}

const siteDir = path.resolve(projectRoot, "site");
const dryRun = process.argv.includes("--dry-run");
const htmlFilePath = process.argv[process.argv.length - 1];

main();

async function main() {
  let count = 0;

  await rewrite({
    dryRun,
    htmlFilePath,
    setup(rewrite) {
      rewrite.on('img:not([style*="--lqip:"])', {
        async element(element) {
          try {
            const src = element.getAttribute("src");
            if (!src) throw new Error("<img> with no src!");

            const imagePath = filePathFromSrc(htmlFilePath, src);
            console.log("Analyzing", imagePath);
            const theSharp = sharp(imagePath);
            const { baseR, baseG, baseB, values } = await getImageStats(
              theSharp
            );

            const ca = Math.round(values[0] * 0b11);
            const cb = Math.round(values[1] * 0b11);
            const cc = Math.round(values[2] * 0b11);
            const cd = Math.round(values[3] * 0b11);
            const ce = Math.round(values[4] * 0b11);
            const cf = Math.round(values[5] * 0b11);
            const rrr = Math.round((baseR * 0b111) / 255);
            const ggg = Math.round((baseG * 0b111) / 255);
            const bb = Math.round((baseB * 0b11) / 255);
            const lqip =
              ((ca & 0b11) << 18) +
              ((cb & 0b11) << 16) +
              ((cc & 0b11) << 14) +
              ((cd & 0b11) << 12) +
              ((ce & 0b11) << 10) +
              ((cf & 0b11) << 8) +
              ((rrr & 0b111) << 5) +
              ((ggg & 0b111) << 2) +
              (bb & 0b11);

            // sanity check (999999 is the max safe integer for css in browsers)
            if (lqip > 999999) {
              throw new Error("miscalculated");
            }

            const style = element.getAttribute("style");
            const rule = `--lqip:${lqip.toFixed(0).padStart(6, "0")}`;
            element.setAttribute(
              "style",
              [style, rule].filter(exists).join(";")
            );
            count++;
          } catch (error) {
            // print error here, else it be hidden by the html rewrite wasm layer
            console.error(error);
            throw error;
          }
        },
      });
    },
  });
}

async function getImageStats(aSharp) {
  const [stats, previewBuffer] = await Promise.all([
    aSharp.stats(),
    aSharp
      .gamma(2)
      .resize(3, 2, { fit: "fill" })
      .removeAlpha()
      .toFormat("raw", { bitdepth: 8 })
      .toBuffer(),
  ]);

  const { r: baseR, g: baseG, b: baseB } = stats.dominant;

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
    baseR,
    baseG,
    baseB,
    values,
  };
}

function getValue(r, g, b) {
  return 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
}

function filePathFromSrc(htmlFilePath, src) {
  const dir = src.startsWith("/") ? siteDir : path.dirname(htmlFilePath);
  return path.resolve(path.join(dir, src));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function exists(thing) {
  return thing != null;
}
