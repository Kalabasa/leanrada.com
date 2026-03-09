/**
 * Odd One Out — find the different emoji
 *
 * Variants (one per play):
 * - grid: neat grid, more items with complexity
 * - scattered: random placement, same count
 * - moving: items drift around
 * - blink: items flicker in and out
 */
export function oddOneOutGame(api) {
  const c = api.complexity;

  const categories = [
    ['🐱','🐶','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐺','🐴'],
    ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🍍','🥝','🍅','🍆','🥑','🥦','🥒','🌽','🥕'],
    ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸'],
    ['🌸','🌺','🌻','🌹','🌷','🌼','💐','💮'],
    ['🚗','🚕','🚙','🚌','🏎','🚓','🚑','🚒','🛻','🚚','🚛','🚜','🚲','🚁','🚀','🛸','⛵','🚤'],
  ];

  const cat = categories[Math.floor(api.random(categories.length))];
  const idxA = Math.floor(api.random(cat.length));
  let idxB = Math.floor(api.random(cat.length - 1));
  if (idxB >= idxA) idxB++;
  const odd = cat[idxA];
  const common = cat[idxB];

  const total = 9 + Math.floor(Math.sqrt(c) * 6);
  const oddIndex = Math.floor(api.random(total));
  const baseSize = Math.max(18, 48 - Math.sqrt(total) * 3);

  // Layout area
  const margin = 40;
  const areaW = api.width - margin * 2;
  const areaH = api.height * 0.65;
  const areaTop = api.height * 0.15;

  // Pick ONE variant
  const variants = ['grid', 'scattered', 'moving', 'blink'];
  const variant = variants[Math.floor(api.random(variants.length))];

  // Generate item positions
  const cols = Math.ceil(Math.sqrt(total * (areaW / areaH)));
  const rows = Math.ceil(total / cols);
  const cellW = areaW / cols;
  const cellH = areaH / rows;

  const items = [];
  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    let x, y;

    if (variant === 'scattered') {
      x = margin + api.random(areaW);
      y = areaTop + api.random(areaH);
    } else {
      x = margin + cellW * (col + 0.5);
      y = areaTop + cellH * (row + 0.5);
    }

    items.push({
      x, y,
      angle: api.random(Math.PI * 2),
      blinkPhase: api.random(Math.PI * 2),
    });
  }

  // Variant-specific intensity
  const moveSpeed = variant === 'moving' ? 10 : 0;
  const blinkRate = variant === 'blink' ? 1 : 0;

  let tapped = false;

  return {
    title: 'Find the odd one!',
    duration: 6,

    draw(api) {
      api.clear(0x1a1e1f);

      for (let i = 0; i < total; i++) {
        const item = items[i];

        // Motion (only if moving variant)
        if (moveSpeed > 0) {
          item.x += Math.cos(item.angle) * moveSpeed * (api.dt / 1000);
          item.y += Math.sin(item.angle) * moveSpeed * (api.dt / 1000);
          if (item.x < margin || item.x > api.width - margin) {
            item.angle = Math.PI - item.angle;
            item.x = Math.max(margin, Math.min(api.width - margin, item.x));
          }
          if (item.y < areaTop || item.y > areaTop + areaH) {
            item.angle = -item.angle;
            item.y = Math.max(areaTop, Math.min(areaTop + areaH, item.y));
          }
        }

        // Blink (only if blink variant) — items phase in/out
        if (blinkRate > 0) {
          const vis = Math.sin(api.time * 0.001 * blinkRate * Math.PI + item.blinkPhase);
          if (vis < -0.2) continue; // hidden this frame
        }

        const e = i === oddIndex ? odd : common;
        const pulse = 1 + 0.08 * api.pulse;
        api.emoji(e, item.x, item.y, baseSize * pulse);
      }
    },

    onTap(x, y) {
      if (tapped) return;

      let closest = -1;
      let closestDist = Infinity;
      for (let i = 0; i < total; i++) {
        const d = api.dist(x, y, items[i].x, items[i].y);
        if (d < closestDist) {
          closestDist = d;
          closest = i;
        }
      }

      if (closest >= 0 && closestDist < baseSize * 1.2) {
        tapped = true;
        if (closest === oddIndex) {
          api.soundTap();
          api.win();
        } else {
          api.lose();
        }
      }
    },
  };
}
