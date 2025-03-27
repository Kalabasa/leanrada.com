#!/usr/bin/env node
import path from "node:path";
import { rewrite } from "./rewrite/rewrite.mjs";
import sharp from "sharp";
import { oklabToRGB, rgbToOkLab } from "./lib/color/convert.mjs";
import { getPalette } from "./lib/color/thief.mjs";
import { existsSync } from "node:fs";

process.chdir(path.resolve(import.meta.dirname, "..", ".."));
const projectRoot = process.cwd();
console.log("Project root:", projectRoot);
if (path.basename(projectRoot) !== "main") {
  throw new Error("Unexpected project root!");
}

const siteDir = path.resolve(projectRoot, "site");
const dryRun = process.argv.includes("--dry-run");
const refresh = process.argv.includes("--refresh");
const writeEstimates = process.argv.includes("--write-estimates");
const generationsArg =
  process.argv[process.argv.indexOf("--generations") + 1 || -1];
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

            // todo: maybe fetch and save as tmp file?
            if (src.match("^([a-z]+:)?//")) return;

            const imagePath = filePathFromSrc(htmlFilePath, src);
            if (!existsSync(imagePath)) return;

            console.group("Analyzing", imagePath);
            const { width, height, opaque, lqip } = await analyzeImage(
              imagePath
            );
            console.groupEnd();

            if (
              !element.hasAttribute("width") &&
              !element.hasAttribute("height")
            ) {
              element.setAttribute("width", String(width));
              element.setAttribute("height", String(height));
            }

            if (opaque) {
              // sanity check (+-999999 is the max int range in css in major browsers)
              if (lqip < -999_999 || lqip > 999_999) {
                throw new Error(`Invalid lqip value: ${lqip}`);
              }

              const lqipRule = `--lqip:${lqip.toFixed(0)}`;
              let existingStyle = element.getAttribute("style");
              if (refresh && existingStyle?.includes("--lqip:")) {
                existingStyle = existingStyle.replaceAll(
                  /;--lqip:\s*-?\d+|--lqip:\s*-?\d+;?/g,
                  ""
                );
              }

              element.setAttribute(
                "style",
                [existingStyle, lqipRule].filter(truthy).join(";")
              );

              if (writeEstimates) {
                await estimateImage(
                  [
                    ((lqip + 2 ** 19) >> 18) & 0b11,
                    ((lqip + 2 ** 19) >> 16) & 0b11,
                    ((lqip + 2 ** 19) >> 14) & 0b11,
                    ((lqip + 2 ** 19) >> 12) & 0b11,
                    ((lqip + 2 ** 19) >> 10) & 0b11,
                    ((lqip + 2 ** 19) >> 8) & 0b11,
                    ((lqip + 2 ** 19) >> 6) & 0b11,
                    ((lqip + 2 ** 19) >> 3) & 0b111,
                    (lqip + 2 ** 19) & 0b111,
                  ],
                  width,
                  height
                ).then((buffer) =>
                  sharp(buffer, {
                    raw: { width, height, channels: 3 },
                  })
                    .toFormat("jpg")
                    .toFile(imagePath + ".lqip")
                );
              }
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

async function analyzeImage(imagePath) {
  const theSharp = sharp(imagePath);
  const [metadata, stats] = await Promise.all([
    theSharp.metadata(),
    theSharp.stats(),
  ]);

  const size = getNormalSize(metadata);
  const opaque = stats.isOpaque;

  if (!opaque) {
    return {
      ...size,
      opaque: false,
    };
  }

  const targetWidth = 6;
  const targetHeight = 4;
  const targetBuffer = await theSharp
    .gamma(3)
    .resize(6, 4, { fit: "fill" })
    .removeAlpha()
    .toFormat("raw", { bitdepth: 8 })
    .toBuffer();

  const { lqip } = await optimize(targetBuffer, targetWidth, targetHeight);

  return {
    ...size,
    opaque: true,
    lqip,
  };
}

async function optimize(targetBuffer, targetWidth, targetHeight) {
  const totalPopulation = 1000;
  const selectedCount = 500;

  let population = Array.from({ length: totalPopulation }, (_, i) =>
    Array.from({ length: 9 }, (_, j) => mutation(j))
  );

  let generations = generationsArg ? Number(generationsArg) : 20;
  while (generations > 0) {
    // recombine
    const initialCount = population.length;
    while (population.length < totalPopulation) {
      const parentA = population[Math.floor(Math.random() * initialCount)];
      const parentB = population[Math.floor(Math.random() * initialCount)];
      const childBits = Array.from({ length: 9 }, (_, i) =>
        Math.random() < 0.02
          ? mutation(i)
          : Math.random() < 0.5
          ? parentA[i]
          : parentB[i]
      );
      population.push(childBits);
    }

    const tests = await Promise.all(
      population.map(async (lqipBits) => {
        const buffer = await estimateImage(lqipBits, targetWidth, targetHeight);
        const score = calcScore(targetBuffer, buffer);
        return { lqipBits, buffer, score };
      })
    );

    // select
    tests.sort((a, b) => a.score - b.score);
    population = tests.slice(0, selectedCount).map((test) => test.lqipBits);
    generations--;
  }

  const top = population[0];
  const lqip =
    -(2 ** 19) +
    ((top[0] & 0b11) << 18) +
    ((top[1] & 0b11) << 16) +
    ((top[2] & 0b11) << 14) +
    ((top[3] & 0b11) << 12) +
    ((top[4] & 0b11) << 10) +
    ((top[5] & 0b11) << 8) +
    ((top[6] & 0b11) << 6) +
    ((top[7] & 0b111) << 3) +
    (top[8] & 0b111);
  return { lqip };
}

function mutation(index) {
  return index < 7
    ? Math.floor(Math.random() * 0b100)
    : Math.floor(Math.random() * 0b1000);
}

async function estimateImage(lqipBits, width, height) {
  const [ll, aaa, bbb] = lqipBits.slice(6);
  const baseL = (ll / 3) * 0.6 + 0.2;
  const baseA = (aaa / 8) * 0.7 - 0.35;
  const baseB = ((bbb + 1) / 8) * 0.7 - 0.35;

  const baseRGB = oklabToRGB({
    L: baseL,
    a: baseA,
    b: baseB,
  });

  const compRGBs = lqipBits.slice(0, 6).map((cx) => {
    const compL = cx / 3 - 0.5;
    const chromaFactor = 1 - Math.abs(compL);
    return oklabToRGB({
      L: clamp(baseL + compL, 0, 1),
      a: baseA * chromaFactor,
      b: baseB * chromaFactor,
    });
  });

  const canvasWidth = 12;
  const canvasHeight = 8;

  const buffer = Uint8Array.from(
    Array.from({ length: canvasWidth * canvasHeight * 3 }, (_, i) => {
      const index = Math.floor(i / 3);
      const x = index % canvasWidth;
      const y = Math.floor(index / canvasWidth);

      // simulate edge colors
      if (
        x === 0 ||
        x === canvasWidth - 1 ||
        y === 0 ||
        y === canvasHeight - 1
      ) {
        return Math.floor(
          clamp([baseRGB.r, baseRGB.g, baseRGB.b][i % 3], 0, 255)
        );
      }

      // map canvas coordinates to 3x2 component grid
      // h: 12 -> 3, w: 8 -> 2
      const compIndex = Math.floor(y / 4) * 3 + Math.floor(x / 4);
      const rgb = compRGBs[compIndex];
      const v = [rgb.r, rgb.g, rgb.b][i % 3];
      return Math.floor(clamp(v, 0, 255));
    })
  );

  return sharp(buffer, {
    raw: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
    },
  })
    .gamma(3)
    .resize({ width, height })
    .blur(Math.max(0.3, Math.min(width, height) / 4 - 1))
    .toFormat("raw", { bitdepth: 8 })
    .toBuffer();
}

/**
 * @param {Buffer} targetBuffer
 * @param {Buffer} testBuffer
 */
function calcScore(targetBuffer, testBuffer) {
  if (targetBuffer.length !== testBuffer.length) {
    throw new Error("buffer length mismatch");
  }

  let sumSquareDiffs = 0;
  for (let i = 0; i < testBuffer.length; i += 3) {
    const targetLab = rgbToOkLab({
      r: targetBuffer.readUint8(i),
      g: targetBuffer.readUint8(i + 1),
      b: targetBuffer.readUint8(i + 2),
    });
    const targetChroma = Math.hypot(targetLab.a, targetLab.b);
    const scaledTargetA = scaleComponentForDiff(targetLab.a, targetChroma);
    const scaledTargetB = scaleComponentForDiff(targetLab.b, targetChroma);
    const testLab = rgbToOkLab({
      r: testBuffer.readUint8(i),
      g: testBuffer.readUint8(i + 1),
      b: testBuffer.readUint8(i + 2),
    });
    const testChroma = Math.hypot(testLab.a, testLab.b);
    const scaledTestA = scaleComponentForDiff(testLab.a, testChroma);
    const scaledTestB = scaleComponentForDiff(testLab.b, testChroma);
    sumSquareDiffs +=
      Math.hypot(
        targetLab.L - testLab.L,
        3 * (scaledTargetA - scaledTestA),
        3 * (scaledTargetB - scaledTestB)
      ) ** 2;
  }

  return sumSquareDiffs;
}

// Scales a or b of Oklab to move away from the center
// so that euclidean comparison won't be biased to the center
function scaleComponentForDiff(x, chroma) {
  return x / (1e-6 + Math.pow(chroma, 0.5));
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
