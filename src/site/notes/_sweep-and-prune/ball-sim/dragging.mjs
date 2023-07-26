
import { mousePosition } from "/lib/mouse_position.mjs";

export function setupDragging(ballSim, canvas, runner) {
  let draggingBall = null;

  canvas.addEventListener("pointerdown", event => {
    const { x, y } = mousePosition;
    const bounds = canvas.getBoundingClientRect();
    draggingBall = findBall(ballSim, x - bounds.left, y - bounds.top);

    document.addEventListener("pointerup", event => {
      draggingBall = null;
    }, { once: true });
  });

  canvas.addEventListener("pointermove", event => {
    if (!draggingBall) return;

    const { x, y } = mousePosition;
    const bounds = canvas.getBoundingClientRect();
    const simX = x - bounds.left;
    const simY = y - bounds.top;

    draggingBall.x = simX;
    draggingBall.y = simY;
    draggingBall.vx = draggingBall.vy = 0;
  });
}

function findBall(ballSim, x, y) {
  for (const ball of ballSim.balls) {
    const dx = x - ball.x;
    const dy = y - ball.y;
    const d = dx * dx + dy * dy;
    if (d < ball.radius * ball.radius) return ball;
  }
  return null;
}