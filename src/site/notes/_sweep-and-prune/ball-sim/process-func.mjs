export function createProcessFunc(
  onCheck = async () => { },
  onIntersect = async () => { },
  willBounce = true,
) {
  if (willBounce) {
    return async (a, b) => {
      await onCheck(a, b);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist2 = dx ** 2 + dy ** 2;
      const radiusSum = a.radius + b.radius;
      if (dist2 > radiusSum ** 2) return;
      await onIntersect(a, b);
      const dist = Math.sqrt(dist2);
      const penDirX = dx / dist;
      const penDirY = dy / dist;
      const momentum =
        2 *
        (dot(a.vx, a.vy, penDirX, penDirY) -
          dot(b.vx, b.vy, penDirX, penDirY));
      a.vx += -penDirX * momentum * 0.5;
      a.vy += -penDirY * momentum * 0.5;
      b.vx += penDirX * momentum * 0.5;
      b.vy += penDirY * momentum * 0.5;
      const centerX = a.x + dx * 0.5;
      const centerY = a.y + dy * 0.5;
      a.x = centerX - penDirX * radiusSum * 0.5;
      a.y = centerY - penDirY * radiusSum * 0.5;
      b.x = centerX + penDirX * radiusSum * 0.5;
      b.y = centerY + penDirY * radiusSum * 0.5;
    };
  } else {
    return async (a, b) => {
      await onCheck(a, b);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist2 = dx ** 2 + dy ** 2;
      const radiusSum = a.radius + b.radius;
      if (dist2 > radiusSum ** 2) return;
      await onIntersect(a, b);
    };
  }
}

function dot(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2;
}
