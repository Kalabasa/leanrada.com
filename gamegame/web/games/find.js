import { RESULT_LOSE } from '../engine/engine.js';

const CHARACTERS = [
  { key: 'blobbo',  name: 'Blobbo'  },
  { key: 'sparky',  name: 'Sparky'  },
  { key: 'chomps',  name: 'Chomps'  },
  { key: 'peep',    name: 'Peep'    },
  { key: 'twig',    name: 'Twig'    },
  { key: 'gloop',   name: 'Gloop'   },
  { key: 'ember',   name: 'Ember'   },
  { key: 'skully',  name: 'Skully'  },
  { key: 'mushlet', name: 'Mushlet' },
  { key: 'clank',   name: 'Clank'   },
];

export function findGame(api) {
  const c = api.complexity;

  const target = CHARACTERS[Math.floor(api.random(CHARACTERS.length))];
  const distractorPool = CHARACTERS.filter(ch => ch.key !== target.key);

  const REACTION_SEC = 0.3;
  const INPUT_SEC = 0.3;
  const CONJUNCTION_SEC_PER_DISTRACTOR = 0.05;
  const FILL_FRACTION = 0.75;
  const durationSec = (10 * 60) / api.bpm;
  const maxN = Math.floor(
    (durationSec * FILL_FRACTION - REACTION_SEC - INPUT_SEC) / CONJUNCTION_SEC_PER_DISTRACTOR
  );
  const N = Math.max(4, Math.min(maxN, Math.floor(6 + Math.log2(1 + c) * 4)));

  const CARD_H = 200;
  const CARD_SPRITE_R = 40;
  const CARD_TEXT_SIZE = 20;
  const CARD_PAD_X = 16;
  const CARD_GAP = 12;
  const label = `FIND ${target.name.toUpperCase()}`;
  const labelWidth = label.length * CARD_TEXT_SIZE * 0.55;
  const cardW = CARD_PAD_X * 2 + CARD_SPRITE_R * 2 + CARD_GAP + labelWidth;

  const cols = Math.ceil(Math.sqrt(N));
  const rows = Math.ceil(N / cols);

  let alive = true;
  let wrongShakeUntilMs = 0;

  const playAreaTop = api.safeTop + 8 + CARD_H + 12;
  const slots = [];
  const cellSize = Math.min(
    api.width / cols,
    (api.height - playAreaTop) / rows,
  );
  const gridTop = playAreaTop + ((api.height - playAreaTop) - (cellSize * rows)) / 2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (slots.length >= N) break;
      slots.push({
        x: cellSize * (col + 0.5),
        y: gridTop + cellSize * (row + 0.5),
      });
    }
  }
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(api.random(i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const entities = [{ ...slots[0], key: target.key, isTarget: true }];
  for (let i = 1; i < slots.length; i++) {
    const d = distractorPool[Math.floor(api.random(distractorPool.length))];
    entities.push({ ...slots[i], key: d.key, isTarget: false });
  }

  return {
    title: `Find ${target.name}!`,
    hint: 'Tap it!',
    duration: 10,
    timeoutResult: RESULT_LOSE,
    timeoutMessage: 'TOO SLOW!',

    draw(api) {
      api.clear(0x1a1a2e);

      const shaking = api.time < wrongShakeUntilMs;
      const shakeX = shaking ? (Math.random() - 0.5) * 8 : 0;
      const shakeY = shaking ? (Math.random() - 0.5) * 8 : 0;

      for (const e of entities) {
        drawCharacter(api, e.key, e.x + shakeX, e.y + shakeY, Math.min(30, Math.min(((api.width) * 0.94 / cols), ((api.height - 12 - api.safeTop + 8 + CARD_H + 12) / rows)) * 0.42));
      }

      api.rect(((0 + api.width - cardW) / 2), (api.safeTop + 8), cardW, CARD_H, 0x0a0a1a);
      api.rectOutline(((0 + api.width - cardW) / 2), (api.safeTop + 8), cardW, CARD_H, 0x4466aa, 2);
      const cardTop = api.safeTop + 8;
      drawCharacter(api, target.key, api.width / 2, cardTop + CARD_H / 3, CARD_SPRITE_R);
      api.text("WANTED", api.width / 2, cardTop + CARD_H / 2 + CARD_SPRITE_R, 0xffee88, CARD_TEXT_SIZE);
    },

    onTap(x, y) {
      if (!alive) return;
      let hit = null;
      let hitD = Infinity;
      for (const e of entities) {
        const d = api.dist(x, y, e.x, e.y);
        if (d < hitD && d < Math.max(Math.min(30, Math.min(((api.width) * 0.94 / cols), ((api.height - 12 - api.safeTop + 8 + CARD_H + 12) / rows)) * 0.42) * 1.2, 32)) {
          hit = e;
          hitD = d;
        }
      }
      if (!hit) return;
      if (hit.isTarget) {
        api.soundTap();
        alive = false;
        api.win();
      } else {
        wrongShakeUntilMs = api.time + 300;
        alive = false;
        api.lose('WRONG!');
      }
    },
  };
}

function drawCharacter(api, key, cx, cy, r) {
  drawers[key](api, cx, cy, r);
}

function drawBlobbo(api, cx, cy, r) {
  api.circle(cx, cy + r * 0.3, r * 0.85, 0x226622);
  api.circle(cx, cy, r, 0x55cc55);
  api.circle(cx - r * 0.4, cy - r * 0.45, r * 0.22, 0x88ee88);
  const eyeR = r * 0.28;
  api.circle(cx - r * 0.35, cy - r * 0.05, eyeR, 0xffffff);
  api.circle(cx + r * 0.35, cy - r * 0.05, eyeR, 0xffffff);
  api.circle(cx - r * 0.3, cy, eyeR * 0.5, 0x111111);
  api.circle(cx + r * 0.4, cy, eyeR * 0.5, 0x111111);
}

function drawSparky(api, cx, cy, r) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r * 0.8;
    const y1 = cy + Math.sin(a) * r * 0.8;
    const x2 = cx + Math.cos(a) * r * 1.3;
    const y2 = cy + Math.sin(a) * r * 1.3;
    api.line(x1, y1, x2, y2, 0xffaa22, 3);
  }
  api.circle(cx, cy, r * 0.85, 0xffdd33);
  api.circle(cx - r * 0.3, cy - r * 0.35, r * 0.18, 0xfff588);
  api.circle(cx - r * 0.22, cy - r * 0.05, r * 0.09, 0x111111);
  api.circle(cx + r * 0.22, cy - r * 0.05, r * 0.09, 0x111111);
}

function drawChomps(api, cx, cy, r) {
  api.circle(cx, cy + r * 0.3, r * 0.85, 0x552288);
  api.circle(cx, cy, r, 0x9944cc);
  api.rect(cx - r * 0.55, cy + r * 0.8, r * 0.3, r * 0.22, 0x552288);
  api.rect(cx + r * 0.25, cy + r * 0.8, r * 0.3, r * 0.22, 0x552288);
  api.rect(cx - r * 0.6, cy + r * 0.1, r * 1.2, r * 0.22, 0x1a0011);
  api.rect(cx - r * 0.45, cy + r * 0.05, r * 0.14, r * 0.18, 0xfff8e0);
  api.rect(cx + r * 0.32, cy + r * 0.05, r * 0.14, r * 0.18, 0xfff8e0);
  api.circle(cx - r * 0.38, cy - r * 0.35, r * 0.2, 0xffffff);
  api.circle(cx + r * 0.38, cy - r * 0.35, r * 0.2, 0xffffff);
  api.circle(cx - r * 0.38, cy - r * 0.35, r * 0.09, 0x111111);
  api.circle(cx + r * 0.38, cy - r * 0.35, r * 0.09, 0x111111);
}

function drawPeep(api, cx, cy, r) {
  api.rect(cx - r * 1.25, cy - r * 0.1, r * 0.5, r * 0.2, 0x221122);
  api.rect(cx + r * 0.75, cy - r * 0.1, r * 0.5, r * 0.2, 0x221122);
  api.circle(cx - r * 0.9, cy, r * 0.3, 0x221122);
  api.circle(cx + r * 0.9, cy, r * 0.3, 0x221122);
  api.circle(cx, cy, r, 0xcc2233);
  api.circle(cx - r * 0.3, cy - r * 0.4, r * 0.18, 0xff7788);
  api.rect(cx - r * 0.08, cy - r * 0.55, r * 0.16, r * 1.1, 0x111111);
}

function drawTwig(api, cx, cy, r) {
  const brown = 0x886633;
  api.rect(cx - r * 0.1, cy - r * 0.25, r * 0.2, r * 1.1, brown);
  api.rect(cx - r * 0.35, cy - r * 0.7, r * 0.7, r * 0.5, brown);
  api.line(cx - r * 0.1, cy - r * 0.7, cx - r * 0.55, cy - r * 1.15, brown, 3);
  api.line(cx + r * 0.1, cy - r * 0.7, cx + r * 0.55, cy - r * 1.15, brown, 3);
  api.line(cx - r * 0.35, cy - r * 0.95, cx - r * 0.7, cy - r * 0.85, brown, 2);
  api.line(cx + r * 0.35, cy - r * 0.95, cx + r * 0.7, cy - r * 0.85, brown, 2);
  api.line(cx - r * 0.1, cy, cx - r * 0.55, cy + r * 0.3, brown, 3);
  api.line(cx + r * 0.1, cy, cx + r * 0.55, cy + r * 0.3, brown, 3);
  api.line(cx - r * 0.05, cy + r * 0.85, cx - r * 0.25, cy + r * 1.15, brown, 3);
  api.line(cx + r * 0.05, cy + r * 0.85, cx + r * 0.25, cy + r * 1.15, brown, 3);
  api.circle(cx - r * 0.15, cy - r * 0.5, r * 0.06, 0xffffff);
  api.circle(cx + r * 0.15, cy - r * 0.5, r * 0.06, 0xffffff);
}

function drawGloop(api, cx, cy, r) {
  const blue = 0x3388dd;
  api.rect(cx - r * 0.75, cy + r * 0.95, r * 1.5, r * 0.12, 0x225577);
  api.circle(cx, cy + r * 0.25, r * 0.85, blue);
  api.circle(cx, cy - r * 0.3, r * 0.55, blue);
  api.circle(cx, cy - r * 0.7, r * 0.3, blue);
  api.circle(cx, cy - r * 0.95, r * 0.12, blue);
  api.circle(cx - r * 0.3, cy + r * 0.1, r * 0.15, 0x77bbee);
  api.circle(cx - r * 0.2, cy + r * 0.3, r * 0.08, 0x111111);
  api.circle(cx + r * 0.2, cy + r * 0.3, r * 0.08, 0x111111);
  api.rect(cx - r * 0.12, cy + r * 0.55, r * 0.24, r * 0.05, 0x111111);
}

function drawEmber(api, cx, cy, r) {
  const flame = 0xff6622;
  const bright = 0xffcc33;
  api.circle(cx, cy + r * 0.3, r * 0.8, flame);
  api.circle(cx - r * 0.05, cy - r * 0.15, r * 0.55, flame);
  api.circle(cx + r * 0.1, cy - r * 0.55, r * 0.3, flame);
  api.circle(cx + r * 0.2, cy - r * 0.9, r * 0.14, flame);
  api.circle(cx, cy + r * 0.3, r * 0.45, bright);
  api.circle(cx - r * 0.05, cy - r * 0.15, r * 0.28, bright);
  api.circle(cx - r * 0.2, cy + r * 0.2, r * 0.08, 0x111111);
  api.circle(cx + r * 0.2, cy + r * 0.2, r * 0.08, 0x111111);
}

function drawSkully(api, cx, cy, r) {
  const bone = 0xf0eedd;
  api.circle(cx, cy + r * 1.05, r * 0.3, 0xbbbbcc);
  api.circle(cx - r * 0.3, cy + r * 1.2, r * 0.12, 0xbbbbcc);
  api.circle(cx + r * 0.3, cy + r * 1.2, r * 0.12, 0xbbbbcc);
  api.circle(cx, cy, r, bone);
  api.rect(cx - r * 0.5, cy + r * 0.3, r * 1.0, r * 0.3, bone);
  api.circle(cx - r * 0.35, cy - r * 0.1, r * 0.22, 0x111111);
  api.circle(cx + r * 0.35, cy - r * 0.1, r * 0.22, 0x111111);
  api.rect(cx - r * 0.08, cy + r * 0.2, r * 0.16, r * 0.12, 0x111111);
  api.circle(cx - r * 0.55, cy + r * 0.3, r * 0.1, 0xff99bb);
  api.circle(cx + r * 0.55, cy + r * 0.3, r * 0.1, 0xff99bb);
  api.rect(cx - r * 0.35, cy + r * 0.5, r * 0.7, r * 0.04, 0x111111);
}

function drawMushlet(api, cx, cy, r) {
  const red = 0xcc3333;
  const stem = 0xeeeecc;
  api.circle(cx, cy - r * 0.15, r * 0.9, red);
  api.rect(cx - r * 0.9, cy - r * 0.15, r * 1.8, r * 0.2, red);
  api.rect(cx - r * 0.28, cy + r * 0.05, r * 0.56, r * 0.65, stem);
  api.rect(cx - r * 0.35, cy + r * 0.68, r * 0.28, r * 0.15, 0x553322);
  api.rect(cx + r * 0.07, cy + r * 0.68, r * 0.28, r * 0.15, 0x553322);
  api.circle(cx - r * 0.4, cy - r * 0.4, r * 0.14, 0xffffff);
  api.circle(cx + r * 0.3, cy - r * 0.3, r * 0.1, 0xffffff);
  api.circle(cx - r * 0.05, cy - r * 0.65, r * 0.1, 0xffffff);
  api.circle(cx - r * 0.1, cy + r * 0.3, r * 0.05, 0x111111);
  api.circle(cx + r * 0.1, cy + r * 0.3, r * 0.05, 0x111111);
}

function drawClank(api, cx, cy, r) {
  const body = 0x8899aa;
  const dark = 0x556677;
  api.line(cx, cy - r * 0.7, cx, cy - r * 1.05, body, 2);
  api.circle(cx, cy - r * 1.1, r * 0.1, 0xff4444);
  api.rect(cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.5, body);
  api.rect(cx - r * 0.7, cy + r * 0.55, r * 1.4, r * 0.25, dark);
  api.rect(cx - r * 0.6, cy - r * 0.6, r * 0.1, r * 0.1, dark);
  api.rect(cx + r * 0.5, cy - r * 0.6, r * 0.1, r * 0.1, dark);
  api.rect(cx - r * 0.4, cy - r * 0.3, r * 0.25, r * 0.25, 0x33ee66);
  api.rect(cx + r * 0.15, cy - r * 0.3, r * 0.25, r * 0.25, 0x33ee66);
  api.rect(cx - r * 0.3, cy + r * 0.15, r * 0.6, r * 0.06, dark);
  api.rect(cx - r * 0.3, cy + r * 0.28, r * 0.6, r * 0.06, dark);
}

const drawers = {
  blobbo:  drawBlobbo,
  sparky:  drawSparky,
  chomps:  drawChomps,
  peep:    drawPeep,
  twig:    drawTwig,
  gloop:   drawGloop,
  ember:   drawEmber,
  skully:  drawSkully,
  mushlet: drawMushlet,
  clank:   drawClank,
};
