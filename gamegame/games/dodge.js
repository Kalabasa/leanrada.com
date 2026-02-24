/**
 * Dodge Game — survive by avoiding falling objects
 */
export function dodgeGame(api) {
  let playerX = api.width / 2;
  const playerY = api.height * 0.8;
  let alive = true;
  let obstacles = [];
  let spawnTimer = 0;

  const themes = [
    { player: '🐸', obstacle: '🪨', bg: 140 },
    { player: '🐥', obstacle: '💧', bg: 200 },
    { player: '🏃', obstacle: '🔥', bg: 10 },
    { player: '🛸', obstacle: '☄️', bg: 260 },
  ];
  const theme = themes[Math.floor(api.random(themes.length))];

  return {
    duration: 8, // beats — survive this long
    timeoutResult: 'win',

    draw(api) {
      api.clear(`hsl(${theme.bg}, 30%, 10%)`);

      // Spawn every half beat
      spawnTimer += api.dt;
      const spawnInterval = (60000 / api.bpm) / 2;
      while (spawnTimer > spawnInterval) {
        spawnTimer -= spawnInterval;
        obstacles.push({
          x: api.random(40, api.width - 40),
          y: -30,
          speed: 2.5 + api.random(2),
        });
      }

      obstacles = obstacles.filter(o => {
        o.y += o.speed * (api.dt / 16);
        const bounce = 1 + 0.15 * Math.sin(api.beatFrac * Math.PI * 2);
        api.emoji(theme.obstacle, o.x, o.y, 36 * bounce);
        if (alive && api.dist(o.x, o.y, playerX, playerY) < 32) {
          alive = false;
          api.lose();
        }
        return o.y < api.height + 40;
      });

      if (alive) {
        const pulse = 1 + 0.08 * Math.sin(api.beatFrac * Math.PI * 2);
        api.emoji(theme.player, playerX, playerY, 52 * pulse);
      }

      api.fill('rgba(255,255,255,0.4)');
      api.text('Dodge!', api.width / 2, 50, 20);
    },

    onTap(x) { playerX = x; },
    onDrag(x) { playerX = x; },
  };
}
