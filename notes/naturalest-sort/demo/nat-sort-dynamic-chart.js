(() => {
  const DPR = window.devicePixelRatio || 1;
  const aspectRatio = 1.25;

  customElements.define(
    "nat-sort-dynamic-chart",
    class NatSortDynamicChart extends HTMLElement {
      #canvas = null;
      #ctx = null;
      #points = [];
      #lines = [];
      #targetPoints = [];
      #targetLines = [];
      #fit = null;
      #camera = { rotX: 0, rotY: 0, scaleZ: 0 };
      #targetCamera = { rotX: 0, rotY: 0, scaleZ: 1 };
      #baseTargetCamera = { rotX: 0, rotY: 0, scaleZ: 1 };
      #animFrame = null;
      #width = 400;
      #height = 400;

      #resizeObserver = null;
      #visible = false;
      #rotatable = null;

      constructor() {
        super();
        this.#canvas = document.createElement("canvas");
        this.#canvas.style.display = "block";
        this.#canvas.style.width = "100%";
        this.#canvas.style.aspectRatio = aspectRatio;
      }

      connectedCallback() {
        this.appendChild(this.#canvas);
        this.#resize();
        this.#resizeObserver = new ResizeObserver(() => {
          this.#resize();
          this.#draw();
        });
        this.#resizeObserver.observe(this.#canvas);
        new IntersectionObserver((entries) => {
          this.#visible = entries[0].isIntersecting;
          if (this.#visible && this.#animFrame === null) this.#draw();
        }).observe(this);
        this.#canvas.addEventListener("pointerdown", (e) => this.#onPointerDown(e));
        this.#canvas.addEventListener("pointermove", (e) => this.#onPointerMove(e));
        this.#canvas.addEventListener("pointerup", () => this.#onPointerUp());
        this.#canvas.addEventListener("pointerleave", () => {
          if (!this.#dragging) this.#resetTargetCamera();
        });
        this.#draw();
      }

      disconnectedCallback() {
        this.#resizeObserver?.disconnect();
        if (this.#animFrame) cancelAnimationFrame(this.#animFrame);
      }

      set data({ points, lines }) {
        this.#targetPoints = points || [];
        this.#targetLines = lines || [];
        if (this.#points.length === 0) {
          this.#points = this.#targetPoints.map(p => ({ ...p }));
          this.#lines = this.#targetLines.map(l => ({ ...l }));
        }
        this.#fit = null;
        this.#animate();
      }

      set baseTargetCamera(value) {
        this.#baseTargetCamera = value ?? { rotX: 0, rotY: 0, scaleZ: 1 };
        this.#animate();
      }

      set rotatable(value) {
        this.#rotatable = value;
        this.#canvas.style.touchAction = this.#rotatable === true ? "pinch-zoom" : "";
        this.#resetTargetCamera();
      }

      #resetTargetCamera() {
        this.#targetCamera = { rotX: 0, rotY: 0, scaleZ: this.#rotatable !== false ? 1 : 0 };
        this.#animate();
      }

      #dragging = false;

      #onPointerDown(e) {
        if (this.#rotatable === false) return;
        this.#dragging = true;
        this.#canvas.setPointerCapture(e.pointerId);
        this.#updateCamera(e);
        this.#canvas.style.touchAction = "pinch-zoom";
      }

      #onPointerMove(e) {
        if (this.#rotatable === false) return;
        if (e.pointerType === "mouse" || this.#dragging) {
          e.preventDefault();
          this.#updateCamera(e);
        }
      }

      #onPointerUp() {
        this.#dragging = false;
        this.#resetTargetCamera();
        this.#canvas.style.touchAction = this.#rotatable === true ? "pinch-zoom" : "";
      }

      #updateCamera(e) {
        const rect = this.#canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width - 0.5;
        const my = (e.clientY - rect.top) / rect.height - 0.5;
        this.#targetCamera = { rotX: my * Math.PI, rotY: mx * Math.PI, scaleZ: 1 };
        this.#animate();
      }

      #animate() {
        if (this.#animFrame) return;
        const tick = () => {
          if (!this.#visible) {
            this.#animFrame = requestAnimationFrame(tick);
            return;
          }
          let settled = true;
          const ease = 0.12;
          
          const targetRotX = this.#baseTargetCamera.rotX + this.#targetCamera.rotX;
          const targetRotY = this.#baseTargetCamera.rotY + this.#targetCamera.rotY;
          const targetScaleZ = this.#baseTargetCamera.scaleZ * this.#targetCamera.scaleZ;
          const dx = targetRotX - this.#camera.rotX;
          const dy = targetRotY - this.#camera.rotY;
          const dz = targetScaleZ - this.#camera.scaleZ;
          if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001 || Math.abs(dz) > 0.001) {
            this.#camera.rotX += dx * ease;
            this.#camera.rotY += dy * ease;
            this.#camera.scaleZ = zerp(this.#camera.scaleZ, targetScaleZ, ease);
            settled = false;
          } else {
            this.#camera.rotX = targetRotX;
            this.#camera.rotY = targetRotY;
            this.#camera.scaleZ = targetScaleZ;
          }

          if (this.#lerpData(ease)) settled = false;

          this.#draw();
          if (settled) {
            this.#animFrame = null;
          } else {
            this.#animFrame = requestAnimationFrame(tick);
          }
        };
        this.#animFrame = requestAnimationFrame(tick);
      }

      #lerpData(ease) {
        let moving = false;
        for (let i = 0; i < this.#targetPoints.length; i++) {
          if (i >= this.#points.length) {
            this.#points.push({ ...this.#targetPoints[i] });
            continue;
          }
          const p = this.#points[i];
          const tp = this.#targetPoints[i];
          for (const k of ["x", "y", "z"]) {
            const d = tp[k] - p[k];
            if (Math.abs(d) > 0.0001) {
              p[k] += d * ease;
              moving = true;
            } else {
              p[k] = tp[k];
            }
          }
          p.label = tp.label;
          p.color = tp.color;
        }
        this.#points.length = this.#targetPoints.length;

        for (let i = 0; i < this.#targetLines.length; i++) {
          if (i >= this.#lines.length) {
            this.#lines.push({ ...this.#targetLines[i] });
            continue;
          }
          const l = this.#lines[i];
          const tl = this.#targetLines[i];
          for (const k of ["x1", "y1", "z1", "x2", "y2", "z2"]) {
            const d = tl[k] - l[k];
            if (Math.abs(d) > 0.0001) {
              l[k] += d * ease;
              moving = true;
            } else {
              l[k] = tl[k];
            }
          }
          l.color = tl.color;
          l.labelEnd = tl.labelEnd;
          if (l.tickInterval == null || tl.tickInterval == null) {
            l.tickInterval = tl.tickInterval;
          } else {
            const dTick = tl.tickInterval - l.tickInterval;
            if (Math.abs(dTick) > 0.0001) {
              l.tickInterval += dTick * ease;
              moving = true;
            } else {
              l.tickInterval = tl.tickInterval;
            }
          }
          l.hasArrowStart = tl.hasArrowStart;
          l.hasArrowEnd = tl.hasArrowEnd;
        }
        this.#lines.length = this.#targetLines.length;

        if (moving) this.#fit = null;
        return moving;
      }

      #resize() {
        this.#fit = null;
        const size = this.#canvas.clientWidth || 400;
        this.#width = size;
        this.#height = size / aspectRatio;
        this.#canvas.width = this.#width * DPR;
        this.#canvas.height = this.#height * DPR;
        this.#ctx = this.#canvas.getContext("2d");
        this.#ctx.scale(DPR, DPR);
        this.#ctx.imageSmoothingEnabled = true;
        this.#ctx.imageSmoothingQuality = "high";
      }

      #draw() {
        const ctx = this.#ctx;
        if (!ctx || this.#points.length === 0) return;
        const w = this.#width;
        const h = this.#height;

        ctx.clearRect(0, 0, w, h);
        ctx.textRendering = "optimizeLegibility";

        if (!this.#fit) {
          const padding = 48;
          const mat = cameraMatrix(this.#baseTargetCamera);
          const allProjected = [
            ...this.#points.map(p => applyMatrix(mat, p.x, p.y, p.z)),
            ...this.#lines.flatMap(l => [
              applyMatrix(mat, l.x1, l.y1, l.z1),
              applyMatrix(mat, l.x2, l.y2, l.z2),
            ]),
          ];
          this.#fit = fitToScreen(allProjected, w, h, padding);
        }

        const fit = this.#fit;

        const mat = cameraMatrix(this.#camera);
        
        const projected = this.#points.map(p => applyMatrix(mat, p.x, p.y, p.z));
        
        const screenPoints = projected.map(p => toScreen(p, fit));

        const allDepths = [
          ...projected.map(p => p[2]),
          ...this.#lines.flatMap(l => {
            const a = applyMatrix(mat, l.x1, l.y1, l.z1);
            const b = applyMatrix(mat, l.x2, l.y2, l.z2);
            return [a[2], b[2]];
          }),
        ];
        const depthMin = Math.min(...allDepths);
        const depthMax = Math.max(...allDepths);
        const depthRange = depthMax - depthMin;
        const isFlat = depthRange < 1e-6;

        for (const line of this.#lines) {
          const ap = applyMatrix(mat, line.x1, line.y1, line.z1);
          const bp = applyMatrix(mat, line.x2, line.y2, line.z2);
          const a = toScreen(ap, fit);
          const b = toScreen(bp, fit);

          const screenLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const flatAlpha = Math.min(screenLen / 30, 1);
          if (flatAlpha < 0.01) continue;

          const color = line.color || getColor("--text2-clr");

          if (isFlat) {
            ctx.globalAlpha = flatAlpha;
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            const segments = 20;
            for (let s = 0; s < segments; s++) {
              const t0 = s / segments;
              const t1 = (s + 1) / segments;
              const z0 = ap[2] + (bp[2] - ap[2]) * t0;
              const z1 = ap[2] + (bp[2] - ap[2]) * t1;
              const zMid = (z0 + z1) / 2;
              const depthAlpha = alphaFromDepth(zMid);
              ctx.globalAlpha = flatAlpha * depthAlpha;
              ctx.beginPath();
              ctx.moveTo(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0);
              ctx.lineTo(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1);
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }

          const endDepthAlpha = alphaFromDepth(bp[2]);
          const startDepthAlpha = alphaFromDepth(ap[2]);
          if (line.hasArrowEnd) {
            ctx.globalAlpha = flatAlpha * endDepthAlpha;
            drawArrow(ctx, a, b, color);
          }
          if (line.hasArrowStart) {
            ctx.globalAlpha = flatAlpha * startDepthAlpha;
            drawArrow(ctx, b, a, color);
          }

          if (line.tickInterval != null) {
            drawTicks(ctx, line, color, flatAlpha, ap, bp, fit);
          }

          if (line.labelEnd) {
            const mx = b[0];
            const my = b[1] - 12;
            ctx.fillStyle = getColor("--text-clr");
            ctx.font = getFont(11);
            ctx.textAlign = "center";
            ctx.fillText(line.labelEnd, mx, my);
          }
          ctx.globalAlpha = 1;
        }

        for (let i = 0; i < this.#points.length; i++) {
          const p = this.#points[i];
          const [sx, sy] = screenPoints[i];
          const depth = projected[i][2];
          const depthAlpha = alphaFromDepth(depth);

          ctx.globalAlpha = depthAlpha;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color || getColor("--clr0");
          ctx.fill();

          if (p.label) {
            const onRight = sx > w * 0.6;
            ctx.fillStyle = getColor("--text-clr");
            ctx.font = getFont(12);
            ctx.textAlign = onRight ? "right" : "left";
            const tx = onRight ? sx - 7 : sx + 7;
            ctx.fillText(p.label, tx, sy + 4);
          }
          ctx.globalAlpha = 1;
        }
      }
    }
  );

  function cameraMatrix(cam) {
    const cosX = Math.cos(cam.rotX);
    const sinX = Math.sin(cam.rotX);
    const cosY = Math.cos(cam.rotY);
    const sinY = Math.sin(cam.rotY);
    const zs = cam.scaleZ;
    return [
      cosY, 0, sinY * zs,
      sinX * sinY, cosX, -sinX * cosY * zs,
      -cosX * sinY, sinX, cosX * cosY * zs,
    ];
  }

  function applyMatrix(m, x, y, z) {
    return [
      m[0] * x + m[1] * y + m[2] * z,
      m[3] * x + m[4] * y + m[5] * z,
      m[6] * x + m[7] * y + m[8] * z,
    ];
  }

  function alphaFromDepth(z) {
    return 0.4 + 0.6 * Math.max(0, Math.min(1, 1 + z * 3));
  }

  function fitToScreen(projected, w, h, padding) {
    const xs = projected.map(p => p[0]);
    const ys = projected.map(p => p[1]);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xMid = (xMin + xMax) / 2;
    const yMid = (yMin + yMax) / 2;
    const scale = Math.max(xMax - xMin, yMax - yMin) || 1;
    return { xMid, yMid, scale, w, h, padding };
  }

  const PERSPECTIVE_DISTANCE = 4;

  function toScreen(p, fit) {
    const pz = PERSPECTIVE_DISTANCE / (PERSPECTIVE_DISTANCE - p[2] / fit.scale);
    return [
      fit.w / 2 + ((p[0] - fit.xMid) / fit.scale) * (fit.w - fit.padding * 2) * pz,
      fit.h / 2 - ((p[1] - fit.yMid) / fit.scale) * (fit.h - fit.padding * 2) * pz,
    ];
  }

  function drawArrow(ctx, from, to, color) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const ux = dx / len;
    const uy = dy / len;
    const size = 6;
    ctx.beginPath();
    ctx.moveTo(to[0], to[1]);
    ctx.lineTo(to[0] - ux * size - uy * size, to[1] - uy * size + ux * size);
    ctx.moveTo(to[0], to[1]);
    ctx.lineTo(to[0] - ux * size + uy * size, to[1] - uy * size - ux * size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawTicks(ctx, line, color, flatAlpha, ap, bp, fit) {
    const worldLen = Math.hypot(line.x2 - line.x1, line.y2 - line.y1, line.z2 - line.z1);
    if (worldLen === 0) return;
    const halfCount = Math.floor(worldLen / 2 / line.tickInterval);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = -halfCount; i <= halfCount; i++) {
      const t = 0.5 + (i * line.tickInterval) / worldLen;
      const p3d = [
        ap[0] + (bp[0] - ap[0]) * t,
        ap[1] + (bp[1] - ap[1]) * t,
        ap[2] + (bp[2] - ap[2]) * t,
      ];
      const [sx, sy] = toScreen(p3d, fit);
      const dt = line.tickInterval / worldLen * 0.5;
      const tPrev = t - dt;
      const tNext = t + dt;
      const prev = toScreen([
        ap[0] + (bp[0] - ap[0]) * tPrev,
        ap[1] + (bp[1] - ap[1]) * tPrev,
        ap[2] + (bp[2] - ap[2]) * tPrev,
      ], fit);
      const next = toScreen([
        ap[0] + (bp[0] - ap[0]) * tNext,
        ap[1] + (bp[1] - ap[1]) * tNext,
        ap[2] + (bp[2] - ap[2]) * tNext,
      ], fit);
      const dx = next[0] - prev[0];
      const dy = next[1] - prev[1];
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const px = -dy / len;
      const py = dx / len;
      ctx.globalAlpha = flatAlpha * alphaFromDepth(p3d[2]);
      ctx.beginPath();
      ctx.moveTo(sx - px * 3, sy - py * 3);
      ctx.lineTo(sx + px * 3, sy + py * 3);
      ctx.stroke();
    }
  }

  let cachedStyles = null;
  function getColor(prop) {
    if (!cachedStyles) cachedStyles = getComputedStyle(document.documentElement);
    return cachedStyles.getPropertyValue(prop).trim() || "#888";
  }

  function getFont(size) {
    if (!cachedStyles) cachedStyles = getComputedStyle(document.documentElement);
    const family = cachedStyles.getPropertyValue("--default-font").trim() || "sans-serif";
    return `${size}px ${family}`;
  }

  function zerp(current, target, ease) {
    // const threshold = 0.01;
    // if (current > threshold && target > threshold) {
    //   const ratio = target / current;
    //   return current * Math.pow(ratio, ease);
    // }

    return current + (target - current) * ease;
  }
})();
