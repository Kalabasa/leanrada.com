/**
 * Match — a target emoji is shown, tap the matching one from the options
 *
 * Variants (one per play):
 * - simple: pick from a row of options
 * - spinning: options orbit in a circle
 * - growing: options start tiny and grow, first to spot it wins
 * - swap: options shuffle positions mid-game
 */
export function matchGame(api) {
  const c = api.complexity;
  const bgHue = api.random(360);

  const variants = ['simple', 'spinning', 'growing', 'swap'];
  const variant = variants[Math.floor(api.random(variants.length))];

  // Pool
  const pool = ['🐱','🐶','🐭','🐸','🦊','🐼','🐷','🐵','🐔','🐧','🍎','🍊','🍋','🍉','🍇',
    '🍓','🍒','🌸','🌻','🌹','⚽','🏀','🎾','💎','⭐','🔥','❄️','🎈','🍕','🎯'];

  const optionCount = 3 + Math.floor(Math.log2(1 + c) * 2);

  // Pick unique emoji for options
  const picked = [];
  const used = new Set();
  while (picked.length < optionCount) {
    const e = pool[Math.floor(api.random(pool.length))];
    if (!used.has(e)) { picked.push(e); used.add(e); }
  }
  const targetIdx = Math.floor(api.random(picked.length));
  const targetEmoji = picked[targetIdx];

  // Layout
  const cx = api.width / 2;
  const optionY = api.height * 0.6;
  const radius = Math.min(api.width * 0.35, 150);
  let spinAngle = 0;
  const spinSpeed = variant === 'spinning' ? (1 + c * 0.3) : 0;
  let growScale = variant === 'growing' ? 0 : 1;
  let swapTimer = 0;
  const swapInterval = variant === 'swap' ? Math.max(400, 1200 - c * 100) : Infinity;

  // Option positions
  const options = picked.map((emoji, i) => {
    const angle = (i / optionCount) * Math.PI * 2;
    return { emoji, angle, i };
  });

  function getOptionPos(opt) {
    if (variant === 'spinning') {
      const a = opt.angle + spinAngle;
      return { x: cx + Math.cos(a) * radius, y: optionY + Math.sin(a) * radius * 0.5 };
    }
    const spacing = api.width / (optionCount + 1);
    return { x: spacing * (opt.i + 1), y: optionY };
  }

  let tapped = false;

  return {
    title: `Find ${targetEmoji}!`,
    duration: 6,

    draw(api) {
      api.clear(`hsl(${bgHue}, 30%, 12%)`);

      // Target at top
      const tPulse = 1 + 0.15 * api.pulse;
      api.emoji(targetEmoji, cx, api.height * 0.2, 64 * tPulse);

      // Variant updates
      if (variant === 'spinning') spinAngle += api.dt * 0.001 * spinSpeed;
      if (variant === 'growing') growScale = Math.min(1, growScale + api.dt * 0.0008);
      if (variant === 'swap') {
        swapTimer += api.dt;
        if (swapTimer > swapInterval) {
          swapTimer = 0;
          // Shuffle indices
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(api.random(i + 1));
            [options[i].i, options[j].i] = [options[j].i, options[i].i];
          }
        }
      }

      // Draw options
      const size = 44 * growScale;
      for (const opt of options) {
        const pos = getOptionPos(opt);
        api.emoji(opt.emoji, pos.x, pos.y, size);
      }
    },

    onTap(x, y) {
      if (tapped) return;

      const size = 44 * growScale;
      let closest = null;
      let closestDist = Infinity;
      for (const opt of options) {
        const pos = getOptionPos(opt);
        const d = api.dist(x, y, pos.x, pos.y);
        if (d < closestDist) { closestDist = d; closest = opt; }
      }

      if (closest && closestDist < size * 1.2) {
        tapped = true;
        if (closest.emoji === targetEmoji) {
          api.sound.tap();
          api.win();
        } else {
          api.lose();
        }
      }
    },
  };
}
