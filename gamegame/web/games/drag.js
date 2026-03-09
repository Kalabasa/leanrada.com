export function dragGame(api) {
  const c = api.complexity;

  const ballEmoji = ['🐱', '🐶', '🐝', '🚀', '🧲', '🐸', '🦊', '🐧'][Math.floor(api.random(8))];
  const targetEmoji = ['🧶', '🦴', '🌸', '🌙', '🔩', '🪺', '💎', '⭐'][Math.floor(api.random(8))];

  const variants = ['simple', 'moving', 'walls', 'multi'];
  const variant = variants[Math.floor(api.random(variants.length))];

  const numDeliveries = variant === 'multi' ? 2 + Math.floor(c * 0.5) : 1;
  const driftSpeed = variant === 'moving' ? 20 : 0;
  const numWalls = variant === 'walls' ? Math.min(8, 1 + Math.floor(c * 0.5)) : 0;

  let delivered = 0;
  let dragging = false;
  let ballX = api.width / 2;
  let ballY = api.height * 0.8;

  let targetX = api.width * (0.15 + api.random(0.7));
  let targetY = api.height * (0.15 + api.random(0.4));
  let driftAngle = api.random(Math.PI * 2);

  const walls = [];
  for (let i = 0; i < numWalls; i++) {
    walls.push({
      x: api.width * (0.1 + api.random(0.8)),
      y: api.height * (0.2 + api.random(0.4)),
      r: 25 + api.random(20),
    });
  }

  function resetBall() {
    ballX = api.width / 2;
    ballY = api.height * 0.8;
    targetX = api.width * (0.15 + api.random(0.7));
    targetY = api.height * (0.15 + api.random(0.4));
    driftAngle = api.random(Math.PI * 2);
    dragging = false;
  }

  return {
    title: variant === 'multi' ? `Deliver ${numDeliveries}x!` : 'Drag to target!',
    duration: 6 + (numDeliveries - 1) * 2,

    draw(api) {
      api.clear(0x1e1a1f);

      if (driftSpeed > 0) {
        driftAngle += api.dt * 0.001;
        targetX += Math.cos(driftAngle) * driftSpeed * (api.dt / 1000);
        targetY += Math.sin(driftAngle) * driftSpeed * (api.dt / 1000);
        const m = 50;
        if (targetX < m || targetX > api.width - m) driftAngle = Math.PI - driftAngle;
        if (targetY < m || targetY > api.height * 0.65) driftAngle = -driftAngle;
        targetX = Math.max(m, Math.min(api.width - m, targetX));
        targetY = Math.max(m, Math.min(api.height * 0.65, targetY));
      }

      for (const w of walls) {
        api.emoji('🧱', w.x, w.y, w.r * 1.5);
      }

      const tPulse = 1 + 0.2 * api.pulse;
      api.circleOutline(targetX, targetY, 45 * tPulse, 0x555555);
      api.emoji(targetEmoji, targetX, targetY, 48 * tPulse);

      if (numDeliveries > 1) {
        api.text(`${delivered}/${numDeliveries}`, api.width / 2, api.height * 0.92, 0x999999, 18);
      }

      api.emoji(ballEmoji, ballX, ballY, dragging ? 56 : 48);
      api.line(ballX, ballY, targetX, targetY, 0x222222, 1);
    },

    onTap(x, y) {
      if (api.dist(x, y, ballX, ballY) < 50) dragging = true;
    },

    onDrag(x, y) {
      if (!dragging) return;
      ballX = x;
      ballY = y;

      for (const w of walls) {
        if (api.dist(ballX, ballY, w.x, w.y) < w.r) {
          resetBall();
          return;
        }
      }

      if (api.dist(ballX, ballY, targetX, targetY) < 45) {
        delivered++;
        api.soundTap();
        if (delivered >= numDeliveries) {
          api.win();
        } else {
          resetBall();
        }
      }
    },

    onRelease() { dragging = false; },
  };
}
