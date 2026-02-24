/**
 * Drag Game — drag an emoji to a target
 */
export function dragGame(api) {
  const targetX = api.width * (0.15 + api.random(0.7));
  const targetY = api.height * (0.15 + api.random(0.5));
  let ballX = api.width / 2;
  let ballY = api.height * 0.8;
  let dragging = false;

  const themes = [
    { ball: '🐱', target: '🧶', bg: 280 },
    { ball: '🐶', target: '🦴', bg: 30 },
    { ball: '🐝', target: '🌸', bg: 50 },
    { ball: '🚀', target: '🌙', bg: 230 },
    { ball: '🧲', target: '🔩', bg: 200 },
  ];
  const theme = themes[Math.floor(api.random(themes.length))];

  return {
    duration: 6, // beats

    draw(api) {
      api.clear(`hsl(${theme.bg}, 35%, 12%)`);

      api.fill('rgba(255,255,255,0.4)');
      api.text('Drag to the target!', api.width / 2, 50, 18);

      const tPulse = 1 + 0.15 * Math.sin(api.beatFrac * Math.PI * 2);
      api.push();
      api.translate(targetX, targetY);
      api.scale(tPulse);
      api.stroke('rgba(255,255,255,0.3)', 2);
      api.circle(0, 0, 45);
      api.emoji(theme.target, 0, 0, 48);
      api.pop();

      api.emoji(theme.ball, ballX, ballY, dragging ? 56 : 48);

      api.stroke('rgba(255,255,255,0.08)', 1);
      api.line(ballX, ballY, targetX, targetY);
    },

    onTap(x, y) {
      if (api.dist(x, y, ballX, ballY) < 50) dragging = true;
    },

    onDrag(x, y) {
      if (!dragging) return;
      ballX = x;
      ballY = y;
      if (api.dist(ballX, ballY, targetX, targetY) < 40) {
        api.sound.tap();
        api.win();
      }
    },

    onRelease() { dragging = false; },
  };
}
