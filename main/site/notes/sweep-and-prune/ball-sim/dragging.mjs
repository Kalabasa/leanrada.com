export function setupDragging(ballSim, canvas, eventTarget) {
  let draggingBall = null;
  let offsetX = 0;
  let offsetY = 0;

  canvas.addEventListener("pointerdown", event => {
    const { simX, simY } = getSimPosition(event, canvas);

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
    const { simX, simY } = getSimPosition(event, canvas);

    if (draggingBall) {
      draggingBall.x = simX + offsetX;
      draggingBall.y = simY + offsetY;
      draggingBall.vx = draggingBall.vy = 0;
    } else {
      canvas.style.removeProperty("cursor");

      const hoverBall = findBall(ballSim, simX, simY);
      if (!hoverBall) return;

      canvas.style.cursor = "grab";
    }
  });
}

function getSimPosition(event, canvas) {
  const { clientX, clientY } = event;
  const bounds = canvas.getBoundingClientRect();
  const simX = (clientX - bounds.left) * canvas.width / bounds.width;
  const simY = (clientY - bounds.top) * canvas.height / bounds.height;
  return { simX, simY };
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