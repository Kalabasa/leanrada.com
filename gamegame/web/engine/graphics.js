const PIXEL_SCALE = 4;

function fillCircle(ctx, cx, cy, r) {
  let x = r;
  let y = 0;
  let d = 1 - r;
  while (x >= y) {
    ctx.fillRect(cx - x, cy + y, x * 2 + 1, 1);
    ctx.fillRect(cx - x, cy - y, x * 2 + 1, 1);
    ctx.fillRect(cx - y, cy + x, y * 2 + 1, 1);
    ctx.fillRect(cx - y, cy - x, y * 2 + 1, 1);
    y++;
    if (d < 0) {
      d += 2 * y + 1;
    } else {
      x--;
      d += 2 * (y - x) + 1;
    }
  }
}

function strokeCircle(ctx, cx, cy, r) {
  let x = r;
  let y = 0;
  let d = 1 - r;
  while (x >= y) {
    ctx.fillRect(cx + x, cy + y, 1, 1);
    ctx.fillRect(cx - x, cy + y, 1, 1);
    ctx.fillRect(cx + x, cy - y, 1, 1);
    ctx.fillRect(cx - x, cy - y, 1, 1);
    ctx.fillRect(cx + y, cy + x, 1, 1);
    ctx.fillRect(cx - y, cy + x, 1, 1);
    ctx.fillRect(cx + y, cy - x, 1, 1);
    ctx.fillRect(cx - y, cy - x, 1, 1);
    y++;
    if (d < 0) {
      d += 2 * y + 1;
    } else {
      x--;
      d += 2 * (y - x) + 1;
    }
  }
}

function bresenham(ctx, x0, y0, x1, y1, w) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let spanX = x0;
  let spanY = y0;
  while (true) {
    const atEnd = x0 === x1 && y0 === y1;
    const e2 = 2 * err;
    const stepsY = atEnd || e2 < dx;
    if (stepsY) {
      const minX = sx > 0 ? spanX : x0;
      ctx.fillRect(minX, spanY, Math.abs(x0 - spanX) + w, w);
    }
    if (atEnd) break;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (stepsY) { err += dx; y0 += sy; spanX = x0; spanY = y0; }
  }
}

export function createCanvas(slide) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;';
  slide.innerHTML = '';
  slide.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: false });

  const textCanvas = document.createElement('canvas');
  const textCtx = textCanvas.getContext('2d');
  textCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  slide.appendChild(textCanvas);

  let dpr = 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(canvas.clientWidth / PIXEL_SCALE);
    canvas.height = Math.ceil(canvas.clientHeight / PIXEL_SCALE);
    ctx.imageSmoothingEnabled = false;
    textCanvas.width = textCanvas.clientWidth * dpr;
    textCanvas.height = textCanvas.clientHeight * dpr;
    textCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  function px(v) {
    return Math.round(v / PIXEL_SCALE);
  }

  function css(rgb) {
    return `#${(rgb >>> 0).toString(16).padStart(6, '0')}`;
  }

  const drawing = {
    get width() { return canvas.clientWidth; },
    get height() { return canvas.clientHeight; },

    clear(color = 0x000000) {
      ctx.fillStyle = css(color);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    },

    circle(x, y, r, color) {
      ctx.fillStyle = css(color);
      fillCircle(ctx, px(x), px(y), px(r));
    },

    circleOutline(x, y, r, color) {
      ctx.fillStyle = css(color);
      strokeCircle(ctx, px(x), px(y), px(r));
    },

    rect(x, y, rw, rh, color) {
      ctx.fillStyle = css(color);
      ctx.fillRect(px(x), px(y), px(rw), px(rh));
    },

    rectOutline(x, y, rw, rh, color, w = 2) {
      ctx.fillStyle = css(color);
      const rx = px(x);
      const ry = px(y);
      const rrw = px(rw);
      const rrh = px(rh);
      const pw = Math.max(1, px(w));
      ctx.fillRect(rx, ry, rrw, pw);
      ctx.fillRect(rx, ry + rrh - pw, rrw, pw);
      ctx.fillRect(rx, ry, pw, rrh);
      ctx.fillRect(rx + rrw - pw, ry, pw, rrh);
    },

    line(x1, y1, x2, y2, color, w = 2) {
      ctx.fillStyle = css(color);
      bresenham(ctx, px(x1), px(y1), px(x2), px(y2), Math.max(1, px(w)));
    },

    text(str, x, y, color, size = 24) {
      textCtx.fillStyle = css(color);
      textCtx.font = `${size}px Pixel, system-ui, sans-serif`;
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText(str, x, y);
    },

    emoji(str, x, y, size = 48) {
      textCtx.font = `${size}px serif`;
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText(str, x, y);
    },

  };

  return { canvas, drawing };
}