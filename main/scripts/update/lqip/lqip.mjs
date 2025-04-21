import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { rgbToOkLab } from "../lib/color/convert.mjs";
import { getPalette } from "../lib/color/thief.mjs";
import { getDirs } from "../lib/script.mjs";
import { rewrite } from "../rewrite/rewrite.mjs";

const { siteDir } = getDirs();

export async function rewriteLQIP({
  dryRun = false,
  refresh = false,
  includeVideos = false,
  htmlFilePath,
}) {
  let tmpPreviewDir;
  if (includeVideos) {
    tmpPreviewDir = mkdtempSync("/tmp/lqip-");
  }

  try {
    await rewrite({
      dryRun,
      htmlFilePath,
      async setup(rewrite) {
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
              await applyElementLQIP(readFileSync(imagePath), element, refresh);
              console.groupEnd();
            } catch (error) {
              console.error(error);
              throw error;
            }
          },
        });
        if (includeVideos) {
          rewrite.on(refresh ? "video" : 'video:not([style*="--lqip:"])', {
            async element(element) {
              try {
                const src = element.getAttribute("src");
                if (!src) throw new Error("<video> with no src!");

                // todo: maybe fetch and save as tmp file?
                if (src.match("^([a-z]+:)?//")) return;

                const videoPath = filePathFromSrc(htmlFilePath, src);
                if (!existsSync(videoPath)) return;

                console.group("Analyzing", videoPath);
                const imagePath = path.resolve(
                  tmpPreviewDir,
                  path.basename(videoPath).replaceAll(".", "_") + ".jpg"
                );
                execSync(
                  `ffmpeg -y -i ${videoPath} -vf "select=eq(n\\,0)" -q:v 2 -update true -frames:v 1 ${imagePath}`
                );
                await applyElementLQIP(
                  readFileSync(imagePath),
                  element,
                  refresh
                );
                console.groupEnd();
              } catch (error) {
                console.error(error);
                throw error;
              }
            },
          });
        }
      },
    });
  } finally {
    if (tmpPreviewDir) {
      rmSync(tmpPreviewDir, { recursive: true, force: true });
    }
  }
}

async function applyElementLQIP(imageData, element, refresh) {
  const { width, height, opaque, ll, aaa, bbb, values } = await analyzeImage(
    imageData
  );

  // add this as well because why not
  if (!element.hasAttribute("loading")) {
    element.setAttribute("loading", "lazy");
  }

  if (
    refresh
      ? element.getAttribute("width") !== String(width) ||
        element.getAttribute("height") !== String(height)
      : !element.hasAttribute("width") && !element.hasAttribute("height")
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
      -(2 ** 19) +
      ((ca & 0b11) << 18) +
      ((cb & 0b11) << 16) +
      ((cc & 0b11) << 14) +
      ((cd & 0b11) << 12) +
      ((ce & 0b11) << 10) +
      ((cf & 0b11) << 8) +
      ((ll & 0b11) << 6) +
      ((aaa & 0b111) << 3) +
      (bbb & 0b111);

    // sanity check (+-999999 is the max int range in css in major browsers)
    if (lqip < -999999 || lqip > 999999) {
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
  }
}

async function analyzeImage(imageData) {
  const theSharp = sharp(imageData);
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

  const [previewBuffer, dominantColor] = await Promise.all([
    theSharp
      .gamma(2)
      .resize(3, 2, { fit: "fill" })
      .sharpen({ sigma: 0.5 })
      .removeAlpha()
      .toFormat("raw", { bitdepth: 8 })
      .toBuffer(),
    getPalette(imageData, 4, 10).then((palette) => palette[0]),
  ]);

  const {
    L: rawBaseL,
    a: rawBaseA,
    b: rawBaseB,
  } = rgbToOkLab({
    r: dominantColor[0],
    g: dominantColor[1],
    b: dominantColor[2],
  });
  const { ll, aaa, bbb } = findOklabBits(rawBaseL, rawBaseA, rawBaseB);
  const { L: baseL, a: baseA, b: baseB } = bitsToLab(ll, aaa, bbb);
  console.log(
    "dominant rgb",
    dominantColor,
    "lab",
    Number(rawBaseL.toFixed(4)),
    Number(rawBaseA.toFixed(4)),
    Number(rawBaseB.toFixed(4)),
    "compressed",
    Number(baseL.toFixed(4)),
    Number(baseA.toFixed(4)),
    Number(baseB.toFixed(4))
  );

  const cells = Array.from({ length: 6 }, (_, index) => {
    const r = previewBuffer.readUint8(index * 3);
    const g = previewBuffer.readUint8(index * 3 + 1);
    const b = previewBuffer.readUint8(index * 3 + 2);
    return rgbToOkLab({ r, g, b });
  });

  const values = cells.map(({ L }) => clamp(0.5 + L - baseL, 0, 1));

  return {
    ...size,
    opaque: true,
    ll,
    aaa,
    bbb,
    values,
  };
}

// find the best bit configuration that would produce a color closest to target
function findOklabBits(targetL, targetA, targetB) {
  const targetChroma = Math.hypot(targetA, targetB);
  const scaledTargetA = scaleComponentForDiff(targetA, targetChroma);
  const scaledTargetB = scaleComponentForDiff(targetB, targetChroma);

  let bestBits = [0, 0, 0];
  let bestDifference = Infinity;

  for (let lli = 0; lli <= 0b11; lli++) {
    for (let aaai = 0; aaai <= 0b111; aaai++) {
      for (let bbbi = 0; bbbi <= 0b111; bbbi++) {
        const { L, a, b } = bitsToLab(lli, aaai, bbbi);

        // gray is a common average colour and i don't like that
        const grayPenalty = aaai === 4 && bbbi === 3 ? 0.04 : 0;

        const chroma = Math.hypot(a, b);
        const scaledA = scaleComponentForDiff(a, chroma);
        const scaledB = scaleComponentForDiff(b, chroma);

        const difference =
          grayPenalty +
          Math.hypot(
            L - targetL,
            scaledA - scaledTargetA,
            scaledB - scaledTargetB
          );

        if (difference < bestDifference) {
          bestDifference = difference;
          bestBits = [lli, aaai, bbbi];
        }
      }
    }
  }

  return { ll: bestBits[0], aaa: bestBits[1], bbb: bestBits[2] };
}

// Scales a or b of Oklab to move away from the center
// so that euclidean comparison won't be biased to the center
function scaleComponentForDiff(x, chroma) {
  return x / (1e-6 + Math.pow(chroma, 0.5));
}

function bitsToLab(ll, aaa, bbb) {
  const L = (ll / 0b11) * 0.6 + 0.2;
  const a = (aaa / 0b1000) * 0.7 - 0.35;
  const b = ((bbb + 1) / 0b1000) * 0.7 - 0.35;
  return { L, a, b };
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
