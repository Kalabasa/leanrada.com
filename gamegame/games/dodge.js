/**
 * Dodge — survive by avoiding falling objects
 *
 * Variants (one per play):
 * - straight: classic rain, more per wave with complexity
 * - zigzag: obstacles sine-wave horizontally
 * - aimed: obstacles steer toward the player
 * - big: fewer but much larger obstacles
 */
export function dodgeGame(api) {
  const c = api.complexity;
  let playerX = api.width / 2;
  const playerY = api.height * 0.8;
  let alive = true;
  let obs = [];
  let spawnTimer = 0;

  const playerEmoji = ['🐸', '🐥', '🏃', '🛸', '🐱', '🐶', '🐰', '🐧'][Math.floor(api.random(8))];
  const obstacleEmoji = ['🪨', '💧', '🔥', '☄️', '💣', '🧱', '❄️', '💀'][Math.floor(api.random(8))];
  const bgHue = api.random(360);

  // Pick ONE variant
  const variants = ['straight', 'zigzag', 'aimed', 'big'];
  const variant = variants[Math.floor(api.random(variants.length))];

  // Spawn count: low and flat — the variant behavior is the challenge, not quantity
  const spawnCount = variant === 'big' ? 1 : 1 + Math.floor(Math.log2(1 + c));

  const obstacleSize = variant === 'big' ? 50 + Math.log2(1 + c) * 10 : 36;
  const hitRadius = 14;

  return {
    title: 'Dodge!',
    duration: 8,
    timeoutResult: 'win',

    draw(api) {
      api.clear(`hsl(${bgHue}, 30%, 10%)`);

      spawnTimer += api.dt;
      const spawnInterval = (60000 / api.bpm) * 2;
      while (spawnTimer > spawnInterval) {
        spawnTimer -= spawnInterval;
        for (let i = 0; i < spawnCount; i++) {
          obs.push({
            x: api.random(40, api.width - 40),
            y: -30,
            speed: 6 + api.random(4),
            phase: api.random(Math.PI * 2),
            freq: 1.5 + api.random(2),
          });
        }
      }

      obs = obs.filter(o => {
        o.y += o.speed * (api.dt / 16);

        if (variant === 'zigzag') {
          o.x += Math.sin(o.y * 0.02 * o.freq + o.phase) * (1 + c * 0.5);
        } else if (variant === 'aimed') {
          const dx = playerX - o.x;
          o.x += dx * (0.1 + c * 0.05) * (api.dt / 1000);
        }

        api.emoji(obstacleEmoji, o.x, o.y, obstacleSize);

        if (alive && api.dist(o.x, o.y, playerX, playerY) < hitRadius) {
          alive = false;
          api.lose();
        }
        return o.y < api.height + 40;
      });

      if (alive) {
        const pulse = 1 + 0.15 * api.pulse;
        api.emoji(playerEmoji, playerX, playerY, 52 * pulse);
      }
    },

    onTap(x) { playerX = x; },
    onDrag(x) { playerX = x; },
  };
}
