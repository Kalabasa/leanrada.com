// Run with: node generate-demo.mjs
// Generates demo.html with pre-baked CSS physics animations
// Uses planck.js for proper rigid body collisions

import { writeFileSync } from "fs";
import planck from "planck-js";

const { World, Vec2, Edge, Box, Circle } = planck;

function simulate(scene, durationS, sampleCount) {
  const dt = durationS / sampleCount;
  const trajectories = scene.bodies.map(() => []);

  for (let s = 0; s <= sampleCount; s++) {
    scene.bodies.forEach((b, i) => {
      const pos = b.body.getPosition();
      trajectories[i].push({ x: pos.x, y: pos.y, angle: b.body.getAngle() });
    });
    if (s < sampleCount) {
      scene.world.step(dt);
    }
  }

  return trajectories;
}

function toLinearEasing(values, globalMin, globalMax) {
  const range = globalMax - globalMin;
  if (range < 0.001) return "linear(0, 0)";
  const points = values.map(v => round((v - globalMin) / range));
  return `linear(${points.join(", ")})`;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function compileScene(scene, durationS, sampleCount) {
  const { viewBox, pixelScale, prefix } = scene;
  const trajectories = simulate(scene, durationS, sampleCount);

  const allX = trajectories.flat().map(t => (t.x - viewBox.x) * pixelScale);
  const allY = trajectories.flat().map(t => (t.y - viewBox.y) * pixelScale);
  const allR = trajectories.flat().map(t => t.angle);

  const xMin = Math.min(...allX), xMax = Math.max(...allX);
  const yMin = Math.min(...allY), yMax = Math.max(...allY);
  const rMin = Math.min(...allR), rMax = Math.max(...allR);

  let css = `@keyframes ${prefix}-x { from { translate: ${round(xMin)}px 0 } to { translate: ${round(xMax)}px 0 } }
@keyframes ${prefix}-y { from { translate: 0 ${round(yMin)}px } to { translate: 0 ${round(yMax)}px } }
@keyframes ${prefix}-r { from { rotate: ${round(rMin)}rad } to { rotate: ${round(rMax)}rad } }
`;
  let html = "";

  trajectories.forEach((traj, i) => {
    const b = scene.bodies[i];
    const id = `${prefix}-${i}`;

    const xs = traj.map(t => (t.x - viewBox.x) * pixelScale);
    const ys = traj.map(t => (t.y - viewBox.y) * pixelScale);
    const angles = traj.map(t => t.angle);

    const xEasing = toLinearEasing(xs, xMin, xMax);
    const yEasing = toLinearEasing(ys, yMin, yMax);
    const rEasing = toLinearEasing(angles, rMin, rMax);

    let size = "";
    if (b.radius) {
      const d = round(b.radius * 2 * pixelScale);
      size = `width: ${d}px; height: ${d}px; border-radius: 50%;`;
    } else if (b.hw) {
      size = `width: ${round(b.hw * 2 * pixelScale)}px; height: ${round(b.hh * 2 * pixelScale)}px; border-radius: 2px;`;
    }

    css += `.${id} {
  position: absolute; top: 0; left: 0;
  ${size}
  background: ${b.color};
  animation:
    ${prefix}-x ${durationS}s ${xEasing} both,
    ${prefix}-y ${durationS}s ${yEasing} both,
    ${prefix}-r ${durationS}s ${rEasing} both;
  animation-composition: accumulate;
}
`;
    html += `  <div class="${id}"></div>\n`;
  });

  const containerW = round(viewBox.w * pixelScale);
  const containerH = round(viewBox.h * pixelScale);
  return { css, html, containerW, containerH };
}

// --- Demo 1: Bouncing balls (with inter-body collisions) ---
function buildBouncingBalls() {
  const world = World({ gravity: Vec2(0, 20) });

  world.createBody().createFixture(Edge(Vec2(-5, 8), Vec2(5, 8)), { friction: 0.3 });
  world.createBody().createFixture(Edge(Vec2(-5, -2), Vec2(-5, 8)), { friction: 0.3 });
  world.createBody().createFixture(Edge(Vec2(5, -2), Vec2(5, 8)), { friction: 0.3 });

  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
  const bodies = colors.map((color, i) => {
    const body = world.createDynamicBody({
      position: Vec2(-2 + i, -1 - i * 0.5),
      angularVelocity: (Math.random() - 0.5) * 10,
    });
    body.createFixture(Circle(0.4), {
      density: 1,
      restitution: 0.7,
      friction: 0.3,
    });
    return { body, radius: 0.4, color, label: `ball-${i}` };
  });

  return {
    world, bodies, prefix: "ball",
    viewBox: { x: -5, y: -2, w: 10, h: 10 },
    pixelScale: 40,
  };
}

// --- Demo 2: Confetti burst (with inter-body collisions) ---
function buildConfetti() {
  const world = World({ gravity: Vec2(0, 6) });

  world.createBody().createFixture(Edge(Vec2(-8, 4), Vec2(8, 4)), { friction: 0.5 });
  world.createBody().createFixture(Edge(Vec2(-8, -10), Vec2(-8, 4)));
  world.createBody().createFixture(Edge(Vec2(8, -10), Vec2(8, 4)));

  const colors = [
    "#e74c3c", "#3498db", "#2ecc71", "#f1c40f",
    "#9b59b6", "#e67e22", "#1abc9c", "#ff6b9d",
  ];

  const bodies = [];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 6;
    const body = world.createDynamicBody({
      position: Vec2(0, 2),
      linearVelocity: Vec2(Math.cos(angle) * speed, -Math.abs(Math.sin(angle)) * speed - 2),
      angularVelocity: (Math.random() - 0.5) * 20,
      linearDamping: 0.5,
      angularDamping: 0.3,
    });
    const hw = 0.05 + Math.random() * 0.1;
    const hh = 0.1 + Math.random() * 0.15;
    body.createFixture(Box(hw, hh), {
      density: 0.5,
      restitution: 0.3,
      friction: 0.5,
    });
    bodies.push({ body, hw, hh, color: colors[i % colors.length], label: `conf-${i}` });
  }

  return {
    world, bodies, prefix: "conf",
    viewBox: { x: -8, y: -10, w: 16, h: 14 },
    pixelScale: 30,
  };
}

const bouncingBalls = compileScene(buildBouncingBalls(), 4, 80);
const confetti = compileScene(buildConfetti(), 3, 80);

const output = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>sim-css demos</title>
<style>
  body { font-family: system-ui; padding: 20px; background: #111; color: #eee; }
  h1 { font-size: 1.3em; }
  h2 { font-size: 1em; margin-top: 24px; }
  .sim-container {
    position: relative;
    overflow: hidden;
    background: #fafafa;
    border-radius: 8px;
    margin-top: 8px;
  }

  .bouncing-balls { width: ${bouncingBalls.containerW}px; height: ${bouncingBalls.containerH}px; }
${bouncingBalls.css}
  .confetti-burst { width: ${confetti.containerW}px; height: ${confetti.containerH}px; }
${confetti.css}
</style>
</head>
<body>

<h1>sim-css demos</h1>
<p>Physics simulations baked into CSS keyframes + linear() easing. Zero JS at runtime.</p>

<h2>Bouncing balls</h2>
<div class="sim-container bouncing-balls">
${bouncingBalls.html}</div>

<h2>Confetti burst</h2>
<div class="sim-container confetti-burst">
${confetti.html}</div>

</body>
</html>
`;

writeFileSync("demo.html", output);
console.log("Wrote demo.html");
