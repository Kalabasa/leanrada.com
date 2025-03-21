/*
The MIT License (MIT)

Copyright (c) 2015 Lokesh Dhakar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { getPixels } from "ndarray-pixels";
import sharp from "sharp";
import quantize from "@lokesh.dhakar/quantize";
import FileType from "file-type";

function createPixelArray(pixels, pixelCount, quality) {
  const pixelArray = [];

  for (let i = 0, offset, r, g, b, a; i < pixelCount; i += quality) {
    offset = i * 4;
    r = pixels[offset];
    g = pixels[offset + 1];
    b = pixels[offset + 2];
    a = pixels[offset + 3];

    // MODIFIED FROM ORIGINAL: REMOVE FILTER
    // If pixel is mostly opaque and not white
    // if ((typeof a === 'undefined' || a >= 125) && !(r > 250 && g > 250 && b > 250))
    pixelArray.push([r, g, b]);
  }

  return pixelArray;
}

function validateOptions(options) {
  let { colorCount, quality } = options;

  if (typeof colorCount === "undefined" || !Number.isInteger(colorCount)) {
    colorCount = 10;
  } else if (colorCount === 1) {
    throw new Error(
      "`colorCount` should be between 2 and 20. To get one color, call `getColor()` instead of `getPalette()`"
    );
  } else {
    colorCount = Math.max(colorCount, 2);
    colorCount = Math.min(colorCount, 20);
  }

  if (
    typeof quality === "undefined" ||
    !Number.isInteger(quality) ||
    quality < 1
  )
    quality = 10;

  return { colorCount, quality };
}

const loadImg = (img) => {
  const type = Buffer.isBuffer(img) ? FileType.fromBuffer(img).mime : null;
  return new Promise((resolve, reject) => {
    sharp(img)
      .toBuffer()
      .then((buffer) =>
        sharp(buffer)
          .metadata()
          .then((metadata) => ({ buffer, format: metadata.format }))
      )
      .then(({ buffer, format }) => getPixels(buffer, format))
      .then(resolve)
      .catch(reject);
  });
};

export function getColor(img, quality) {
  return getPalette(img, 5, quality).then((palette) => palette[0]);
}

export function getPalette(img, colorCount = 10, quality = 10) {
  const options = validateOptions({ colorCount, quality });

  return loadImg(img).then((imgData) => {
    const pixelCount = imgData.shape[0] * imgData.shape[1];
    const pixelArray = createPixelArray(
      imgData.data,
      pixelCount,
      options.quality
    );

    const cmap = quantize(pixelArray, options.colorCount);
    const palette = cmap ? cmap.palette() : null;

    return palette;
  });
}
