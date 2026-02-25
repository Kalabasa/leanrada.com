/**
 * Count — how many are there? Tap the right number.
 *
 * Variants (one per play):
 * - simple: count all items on screen
 * - mixed: two emoji types, count only one
 * - flash: items appear briefly then hide, count from memory
 */
export function countGame(api) {
  const c = api.complexity;
  const bgHue = api.random(360);

  const variants = ['simple', 'mixed', 'flash'];
  const variant = variants[Math.floor(api.random(variants.length))];

  const allEmoji = ['🍎','🍊','🌟','🔵','🟢','🐱','🐶','🎈','🍕','💎','🌸','🔥','⚡','🍬','🎯'];
  const targetEmoji = allEmoji[Math.floor(api.random(allEmoji.length))];
  let distractorEmoji = allEmoji[Math.floor(api.random(allEmoji.length - 1))];
  if (distractorEmoji === targetEmoji) distractorEmoji = allEmoji[allEmoji.length - 1];

  // Target count: 2–6 at low c, grows with diminishing returns
  const targetCount = 2 + Math.floor(Math.log2(1 + c) * 2);
  const distractorCount = variant === 'mixed' ? targetCount + Math.floor(1 + Math.sqrt(c) * 2) : 0;
  const total = targetCount + distractorCount;

  // Place items
  const margin = 40;
  const areaW = api.width - margin * 2;
  const areaH = api.height * 0.45;
  const areaTop = api.height * 0.1;

  const items = [];
  for (let i = 0; i < total; i++) {
    items.push({
      emoji: i < targetCount ? targetEmoji : distractorEmoji,
      x: margin + api.random(areaW),
      y: areaTop + api.random(areaH),
    });
  }
  // Shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(api.random(i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  // Flash variant: show items for a limited time then hide
  const flashDuration = variant === 'flash' ? 1500 + 500 / (1 + c * 0.3) : Infinity;

  // Answer buttons
  const btnY = api.height * 0.75;
  const wrongOffset = 1 + Math.floor(api.random(3));
  const wrongDir = api.random() < 0.5 ? -1 : 1;
  const wrongCount = Math.max(1, targetCount + wrongOffset * wrongDir);
  // Ensure wrong !== target
  const answers = [targetCount, wrongCount === targetCount ? targetCount + 1 : wrongCount];
  // Shuffle answer positions
  if (api.random() < 0.5) answers.reverse();
  const btnW = 80;
  const btnGap = 30;
  const btnsX = api.width / 2 - (btnW + btnGap / 2);

  let answered = false;

  return {
    title: variant === 'mixed' ? `Count the ${targetEmoji}!` : `How many ${targetEmoji}?`,
    duration: 8,

    draw(api) {
      api.clear(`hsl(${bgHue}, 30%, 12%)`);

      // Draw items (hidden after flash duration)
      const showItems = api.time < flashDuration;
      if (showItems) {
        for (const item of items) {
          const pulse = 1 + 0.06 * api.pulse;
          api.emoji(item.emoji, item.x, item.y, 36 * pulse);
        }
      } else {
        api.fill('rgba(255,255,255,0.2)');
        api.text('?', api.width / 2, areaTop + areaH / 2, 64);
      }

      // Draw answer buttons
      for (let i = 0; i < answers.length; i++) {
        const bx = btnsX + i * (btnW + btnGap);
        api.fill('rgba(255,255,255,0.1)');
        api.stroke('rgba(255,255,255,0.3)', 2);
        api.rect(bx, btnY, btnW, btnW);
        api.fill('#fff');
        api.stroke(null);
        api.text(`${answers[i]}`, bx + btnW / 2, btnY + btnW / 2, 32);
      }
    },

    onTap(x, y) {
      if (answered) return;

      for (let i = 0; i < answers.length; i++) {
        const bx = btnsX + i * (btnW + btnGap);
        if (x > bx && x < bx + btnW && y > btnY && y < btnY + btnW) {
          answered = true;
          if (answers[i] === targetCount) {
            api.sound.tap();
            api.win();
          } else {
            api.lose();
          }
          return;
        }
      }
    },
  };
}
