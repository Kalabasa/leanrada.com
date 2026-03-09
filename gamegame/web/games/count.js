export function countGame(api) {
  const c = api.complexity;

  const variants = ['simple', 'mixed', 'flash', 'moving'];
  const variant = variants[Math.floor(api.random(variants.length))];

  const allEmoji = ['🍎','🍊','🌟','🔵','🟢','🐱','🐶','🎈','🍕','💎','🌸','🔥','⚡','🍬','🎯'];
  const targetEmoji = allEmoji[Math.floor(api.random(allEmoji.length))];
  let distractorEmoji = allEmoji[Math.floor(api.random(allEmoji.length - 1))];
  if (distractorEmoji === targetEmoji) distractorEmoji = allEmoji[allEmoji.length - 1];

  const targetCount = 2 + Math.floor(Math.log2(1 + c) * 2);
  const distractorCount = variant === 'mixed' ? targetCount + Math.floor(1 + Math.sqrt(c) * 2) : 0;
  const total = targetCount + distractorCount;

  const margin = 40;
  const areaW = api.width - margin * 2;
  const areaH = api.height * 0.45;
  const areaTop = api.height * 0.1;

  const moveSpeed = variant === 'moving' ? 15 : 0;

  const items = [];
  for (let i = 0; i < total; i++) {
    items.push({
      emoji: i < targetCount ? targetEmoji : distractorEmoji,
      x: margin + api.random(areaW),
      y: areaTop + api.random(areaH),
      angle: api.random(Math.PI * 2),
    });
  }
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(api.random(i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const flashDuration = variant === 'flash' ? 1500 + 500 / (1 + c * 0.3) : Infinity;

  const btnY = api.height * 0.75;
  const wrongOffset = 1 + Math.floor(api.random(3));
  const wrongDir = api.random() < 0.5 ? -1 : 1;
  const wrongCount = Math.max(1, targetCount + wrongOffset * wrongDir);
  const answers = [targetCount, wrongCount === targetCount ? targetCount + 1 : wrongCount];
  if (api.random() < 0.5) answers.reverse();
  const btnW = 80;
  const btnGap = 30;
  const btnsX = api.width / 2 - (btnW + btnGap / 2);

  let answered = false;

  return {
    title: variant === 'mixed' ? `Count the ${targetEmoji}!` : `How many ${targetEmoji}?`,
    duration: 8,

    draw(api) {
      api.clear(0x1a1e1f);

      const showItems = api.time < flashDuration;
      if (showItems) {
        for (const item of items) {
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
          const pulse = 1 + 0.06 * api.pulse;
          api.emoji(item.emoji, item.x, item.y, 36 * pulse);
        }
      } else {
        api.text('?', api.width / 2, areaTop + areaH / 2, 0x555555, 64);
      }

      for (let i = 0; i < answers.length; i++) {
        const bx = btnsX + i * (btnW + btnGap);
        api.rect(bx, btnY, btnW, btnW, 0x222222);
        api.rectOutline(bx, btnY, btnW, btnW, 0x555555, 2);
        api.text(`${answers[i]}`, bx + btnW / 2, btnY + btnW / 2, 0xffffff, 32);
      }
    },

    onTap(x, y) {
      if (answered) return;

      for (let i = 0; i < answers.length; i++) {
        const bx = btnsX + i * (btnW + btnGap);
        if (x > bx && x < bx + btnW && y > btnY && y < btnY + btnW) {
          answered = true;
          if (answers[i] === targetCount) {
            api.soundTap();
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
