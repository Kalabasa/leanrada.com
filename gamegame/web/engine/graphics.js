export function createCanvas(slide) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  slide.innerHTML = '';
  slide.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  let fillStyle = '#fff';
  let strokeStyle = '#fff';
  let lineWidth = 2;

  function resetDrawState() {
    fillStyle = '#fff';
    strokeStyle = null;
    lineWidth = 2;
  }

  const drawing = {
    get width() { return canvas.clientWidth; },
    get height() { return canvas.clientHeight; },

    clear(color = '#000') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    },

    fill(color) {
      fillStyle = color;
    },

    stroke(color, width) {
      strokeStyle = color;
      if (width !== undefined) lineWidth = width;
    },

    circle(x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    },

    rect(x, y, rw, rh) {
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, rw, rh);
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, rw, rh);
      }
    },

    line(x1, y1, x2, y2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    },

    text(str, x, y, size = 24) {
      ctx.fillStyle = fillStyle;
      ctx.font = `${size}px Pixel, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, x, y);
    },

    emoji(str, x, y, size = 48) {
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, x, y);
    },

    push() { ctx.save(); },
    pop() { ctx.restore(); },
    translate(x, y) { ctx.translate(x, y); },
    rotate(angle) { ctx.rotate(angle); },
    scale(sx, sy) { ctx.scale(sx, sy ?? sx); },
  };

  return { canvas, drawing, resetDrawState };
}