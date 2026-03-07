/**
 * Split — drag a line to cut a shape at the target ratio
 *
 * Variants (one per play):
 * - horizontal: classic horizontal bar
 * - vertical: vertical bar
 * - multi: multiple cuts in sequence
 */
export function splitGame(api) {
  const c = api.complexity;
  const bgHue = api.random(360);

  // Pick ONE variant
  const variants = ['horizontal', 'vertical', 'multi'];
  const variant = variants[Math.floor(api.random(variants.length))];

  const numCuts = variant === 'multi' ? 2 + Math.floor(c * 0.4) : 1;
  const vertical = variant === 'vertical';

  // Generate fraction targets
  const cuts = [];
  for (let i = 0; i < numCuts; i++) {
    const maxDenom = Math.floor(3 + c * 3);
    const denom = 2 + Math.floor(api.random(maxDenom - 1));
    const numer = 1 + Math.floor(api.random(denom - 1));
    cuts.push({ label: `${numer}/${denom}`, value: numer / denom });
  }

  const tolerance = 0.12;
  let currentCut = 0;

  // Bar dimensions
  const barLength = (vertical ? api.height : api.width) * 0.7;
  const barThick = 100;
  const barX = vertical ? (api.width - barThick) / 2 : api.width * 0.15;
  const barY = vertical ? api.height * 0.12 : api.height * 0.35;
  const barW = vertical ? barThick : barLength;
  const barH = vertical ? barLength : barThick;

  let dragPos = null;
  let dragging = false;
  let decided = false;

  function pointerToRatio(x, y) {
    if (vertical) {
      return Math.max(0, Math.min(1, (y - barY) / barH));
    } else {
      return Math.max(0, Math.min(1, (x - barX) / barW));
    }
  }

  const firstLabel = cuts[0].label;

  return {
    title: variant === 'multi' ? `Cut ${numCuts}x!` : `Cut ${firstLabel}!`,
    duration: 8 + (numCuts - 1) * 2,

    draw(api) {
      api.clear(`hsl(${bgHue}, 25%, 10%)`);

      const target = cuts[currentCut];

      // Label
      api.fill('rgba(255,255,255,0.35)');
      api.text(target.label, api.width / 2, (vertical ? barY : barY) - 30, 20);

      // Counter
      if (numCuts > 1) {
        api.fill('rgba(255,255,255,0.3)');
        api.text(`${currentCut + 1}/${numCuts}`, api.width / 2, api.height * 0.9, 16);
      }

      // Bar
      api.fill('rgba(255,255,255,0.15)');
      api.stroke(null);
      api.rect(barX, barY, barW, barH);

      // Cut line
      if (dragPos !== null) {
        if (vertical) {
          const cutY = barY + barH * dragPos;
          api.stroke('rgba(255,255,255,0.9)', 3);
          api.line(barX - 20, cutY, barX + barW + 20, cutY);
          api.fill('rgba(100,200,255,0.3)');
          api.stroke(null);
          api.rect(barX, barY, barW, cutY - barY);
          api.fill('rgba(255,150,100,0.3)');
          api.rect(barX, cutY, barW, barY + barH - cutY);
        } else {
          const cutX = barX + barW * dragPos;
          api.stroke('rgba(255,255,255,0.9)', 3);
          api.line(cutX, barY - 20, cutX, barY + barH + 20);
          api.fill('rgba(100,200,255,0.3)');
          api.stroke(null);
          api.rect(barX, barY, cutX - barX, barH);
          api.fill('rgba(255,150,100,0.3)');
          api.rect(cutX, barY, barX + barW - cutX, barH);
        }
      }

      // Pulse border
      const pulse = api.pulse;
      api.stroke(`rgba(255,255,255,${0.1 + 0.2 * pulse})`, 2);
      api.fill(null);
      api.rect(barX, barY, barW, barH);
    },

    onTap(x, y) {
      if (decided) return;
      dragging = true;
      dragPos = pointerToRatio(x, y);
    },

    onDrag(x, y) {
      if (decided || !dragging) return;
      dragPos = pointerToRatio(x, y);
    },

    onRelease() {
      if (decided || dragPos === null || !dragging) return;
      dragging = false;

      const target = cuts[currentCut];
      if (Math.abs(dragPos - target.value) < tolerance) {
        api.soundTap();
        currentCut++;
        if (currentCut >= numCuts) {
          decided = true;
          api.win();
        } else {
          dragPos = null;
        }
      } else {
        decided = true;
        api.lose();
      }
    },
  };
}
