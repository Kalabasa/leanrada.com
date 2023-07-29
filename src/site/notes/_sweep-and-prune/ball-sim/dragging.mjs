import { mousePosition } from "/lib/mouse_position.mjs";

export function setupDragging(ballSim, canvas, eventTarget) {
  let draggingBall = null;
  let offsetX = 0;
  let offsetY = 0;

  canvas.addEventListener("pointerdown", event => {
    const { x, y } = mousePosition;
    const bounds = canvas.getBoundingClientRect();
    const simX = x - bounds.left;
    const simY = y - bounds.top;

    draggingBall = findBall(ballSim, simX, simY);
    if (draggingBall) {
      offsetX = draggingBall.x - simX;
      offsetY = draggingBall.y - simY;
      canvas.style.cursor = "grabbing";
    }

    document.addEventListener("pointerup", event => {
      draggingBall = null;
      canvas.style.removeProperty("cursor");
    }, { once: true });
  });

  canvas.addEventListener("pointermove", event => {
    if (!draggingBall) return;

    const { x, y } = mousePosition;
    const bounds = canvas.getBoundingClientRect();
    const simX = x - bounds.left;
    const simY = y - bounds.top;

    draggingBall.x = simX + offsetX;
    draggingBall.y = simY + offsetY;
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