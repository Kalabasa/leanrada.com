/**
 * Tap Game — tap N times before timeout
 */
export function tapGame(api) {
  const count = 3 + Math.floor(api.random(4));
  let remaining = count;
  let ripples = [];

  const emojis = ['👆', '🎯', '⭐', '🔴', '💥', '🍎', '🐱'];
  const emoji = emojis[Math.floor(api.random(emojis.length))];
  const bgHue = api.random(360);

  return {
    duration: 4, // beats

    draw(api) {
      api.clear(`hsl(${bgHue}, 40%, 15%)`);
      const cx = api.width / 2;
      const cy = api.height / 2;

      const pulse = 1 + 0.05 * Math.sin(api.beatFrac * Math.PI * 2);
      api.push();
      api.translate(cx, cy);
      api.scale(pulse);
      api.emoji(emoji, 0, 0, 80);
      api.pop();

      api.fill('#fff');
      api.text(`${remaining}`, cx, cy + 80, 64);

      api.fill('rgba(255,255,255,0.5)');
      api.text(`Tap ${count} times!`, cx, 60, 20);

      ripples = ripples.filter(r => {
        const age = api.time - r.t;
        if (age > 300) return false;
        const frac = age / 300;
        api.stroke(`rgba(255,255,255,${1 - frac})`, 2);
        api.circle(r.x, r.y, 20 + 50 * frac);
        return true;
      });
    },

    onTap(x, y) {
      api.sound.tap();
      remaining--;
      ripples.push({ x, y, t: api.time });
      if (remaining <= 0) api.win();
    },
  };
}
