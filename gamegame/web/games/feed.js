import { RESULT_LOSE } from '../engine/engine.js';

export function feedGame(api) {
  const c = api.complexity;

  const junkFoods = ['🍔', '🍕', '🍩', '🍗', '🍪', '🍦', '🌭'];
  const veggies = ['🥦', '🥕', '🫛', '🥬'];
  const fruit = ['🍎', '🍌', '🍓', '🍊'];

  const poolVariants = ['feed'];
  if (c >= 1) poolVariants.push('picky');
  if (c >= 2) poolVariants.push('vegan');
  const poolVariant = poolVariants[Math.floor(api.random(poolVariants.length))];

  const speedVariants = ['normal', 'normal', 'normal'];
  if (c >= 1.5) speedVariants.push('rush');
  const speedVariant = speedVariants[Math.floor(api.random(speedVariants.length))];

  let goodPool, badPool, title, loseMessage;
  if (poolVariant === 'picky') {
    goodPool = [...junkFoods, ...fruit]; badPool = veggies;
    title = 'Feed NO veggies!';
    loseMessage = 'NO VEGGIES!';
  } else if (poolVariant === 'vegan') {
    goodPool = [...veggies, ...fruit]; badPool = junkFoods;
    title = 'Feed! (VEGAN!)';
    loseMessage = 'ONLY VEGGIES!';
  } else {
    goodPool = [...junkFoods, ...fruit]; badPool = [];
    title = 'Feed!';
    loseMessage = null;
  }
  const beltSpeedMultiplier = speedVariant === 'rush' ? 1.65 : 1;

  const beltPxPer16ms = (4 + Math.log2(1 + c) * 0.7) * beltSpeedMultiplier;
  const badChance = badPool.length > 0 ? 0.3 + Math.min(0.25, c * 0.03) : 0;

  const PLAYER_RATE_PER_SEC = 2;
  const HIT_RATE = 0.8;
  const FILL_FRACTION = 0.75;
  const durationSec = (10 * 60) / api.bpm;
  const quota = Math.max(2, Math.floor(
    durationSec * PLAYER_RATE_PER_SEC * HIT_RATE * (1 - badChance) * FILL_FRACTION
  ));
  const maxOnSurface = 5 + Math.floor(Math.log2(1 + c) * 1.5);

  const spawnPxGap = Math.max(40, 88 - Math.log2(1 + c) * 10);
  const spawnIntervalMs = (spawnPxGap / beltPxPer16ms) * 16;

  const cx = api.width / 2;
  const chompsY = api.height * 0.22;
  const chompsR = Math.min(80, api.width * 0.2);
  const mouthCenterY = chompsY + chompsR * 0.15;
  const mouthCatchR = chompsR * 0.75;

  const belts = [
    { y: api.height * 0.58, dir: -1 },
    { y: api.height * 0.72, dir: 1 },
    { y: api.height * 0.86, dir: -1 },
  ];

  const GRAVITY_PX_PER_16MS2 = 0.8;
  const GRAB_RADIUS = 60;
  const THROW_VELOCITY_SAMPLE_MS = 100;
  const MAX_SPEED_PX_PER_16MS = 35;

  let foods = [];
  let spawnTimer = 0;
  let eaten = 0;
  let alive = true;
  let chompT = 1;
  let happyUntilMs = 0;
  let gagUntilMs = 0;
  let shakeUntilMs = 0;
  let particles = [];
  let popups = [];
  let held = null;

  function idleCount() {
    let n = 0;
    for (const f of foods) if (f.state === 'idle') n++;
    return n;
  }

  function eatFood(f) {
    if (f.isBad) {
      gagUntilMs = api.time + 700;
      shakeUntilMs = api.time + 450;
      alive = false;
      api.lose(loseMessage);
    } else {
      eaten++;
      chompT = 0;
      happyUntilMs = api.time + 280;
      popups.push({ x: cx, y: chompsY + chompsR + 20, t: 0 });
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: cx + (api.random() - 0.5) * 50,
          y: mouthCenterY,
          vx: (api.random() - 0.5) * 5,
          vy: 1 + api.random() * 3,
          life: 1,
          color: 0xffcc66,
        });
      }
      if (eaten >= quota) {
        alive = false;
        api.win();
      }
    }
  }

  return {
    title,
    hint: 'Swipe food to throw!',
    duration: 10,
    timeoutResult: RESULT_LOSE,
    timeoutMessage: 'TOO SLOW!',

    draw(api) {
      const shaking = api.time < shakeUntilMs;
      const shakeX = shaking ? (Math.random() - 0.5) * 12 : 0;
      const shakeY = shaking ? (Math.random() - 0.5) * 12 : 0;

      api.clear(0x281a33);

      for (const belt of belts) {
        drawBelt(api, belt.y, belt.dir, api.width, beltPxPer16ms, api.time);
      }

      if (alive && idleCount() < maxOnSurface) {
        spawnTimer += api.dt;
        while (spawnTimer > spawnIntervalMs && idleCount() < maxOnSurface) {
          spawnTimer -= spawnIntervalMs;
          const isBad = api.random() < badChance;
          const pool = isBad ? badPool : goodPool;
          const belt = belts[Math.floor(api.random(belts.length))];
          const spawnX = belt.dir < 0 ? api.width + 30 : -30;
          foods.push({
            emoji: pool[Math.floor(api.random(pool.length))],
            isBad,
            x: spawnX,
            y: belt.y - 20,
            vx: belt.dir * beltPxPer16ms,
            vy: 0,
            state: 'idle',
            samples: null,
          });
        }
      }

      foods = foods.filter(f => {
        if (f.state === 'idle') {
          f.x += f.vx * (api.dt / 16);
          if (f.x < -40 || f.x > api.width + 40) return false;
        } else if (f.state === 'thrown') {
          f.vy += GRAVITY_PX_PER_16MS2 * (api.dt / 16);
          f.x += f.vx * (api.dt / 16);
          f.y += f.vy * (api.dt / 16);
          if (api.dist(f.x, f.y, cx, mouthCenterY) < mouthCatchR) {
            eatFood(f);
            return false;
          }
          if (f.x < -60 || f.x > api.width + 60 || f.y > api.height + 60 || f.y < -100) return false;
        }
        return true;
      });

      for (const f of foods) {
        const size = f.state === 'held' ? 44 : 36;
        api.emoji(f.emoji, f.x + shakeX, f.y + shakeY, size);
      }

      particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.life -= api.dt / 500;
        if (p.life <= 0) return false;
        api.rect(p.x + shakeX - 2, p.y + shakeY - 2, 4, 4, p.color);
        return true;
      });

      popups = popups.filter(pp => {
        pp.t += api.dt / 700;
        if (pp.t >= 1) return false;
        api.text('+1', pp.x + shakeX, pp.y + pp.t * 50 + shakeY, 0xffdd44, 22);
        return true;
      });

      chompT = Math.min(1, chompT + api.dt / 180);
      const gagging = api.time < gagUntilMs;
      const happy = api.time < happyUntilMs;
      const mouthOpen = gagging
        ? 0.4 + 0.15 * Math.sin(api.time * 0.06)
        : Math.sin(chompT * Math.PI);
      const bob = happy ? Math.sin((api.time - (happyUntilMs - 280)) * 0.04) * 6 : api.pulse * 2;
      const bodyR = chompsR * (happy ? 1.08 : 1);

      drawChomps(api, cx + shakeX, chompsY + shakeY - bob, bodyR, mouthOpen, gagging);

      const hudY = api.height * 0.46;
      for (let i = 0; i < quota; i++) {
        const x = cx - (quota - 1) * 12 + i * 24;
        if (i < eaten) api.circle(x, hudY, 8, 0xffcc44);
        else api.circleOutline(x, hudY, 8, 0x666677);
      }
    },

    onTap(x, y) {
      if (!alive || held) return;
      let closest = null;
      let closestD = Infinity;
      for (const f of foods) {
        if (f.state !== 'idle') continue;
        const d = api.dist(x, y, f.x, f.y);
        if (d < closestD && d < GRAB_RADIUS) {
          closest = f;
          closestD = d;
        }
      }
      if (closest) {
        closest.state = 'held';
        closest.x = x;
        closest.y = y;
        closest.vx = 0;
        closest.samples = [{ x, y, t: performance.now() }];
        held = closest;
        api.soundTap();
      }
    },

    onDrag(x, y) {
      if (!held) return;
      held.x = x;
      held.y = y;
      const now = performance.now();
      held.samples.push({ x, y, t: now });
      while (held.samples.length > 2 && now - held.samples[0].t > THROW_VELOCITY_SAMPLE_MS) {
        held.samples.shift();
      }
    },

    onRelease() {
      if (!held) return;
      const s = held.samples;
      const first = s[0];
      const last = s[s.length - 1];
      const dtMs = Math.max(8, last.t - first.t);
      let vx = ((last.x - first.x) / dtMs) * 16;
      let vy = ((last.y - first.y) / dtMs) * 16;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_SPEED_PX_PER_16MS) {
        vx = (vx / speed) * MAX_SPEED_PX_PER_16MS;
        vy = (vy / speed) * MAX_SPEED_PX_PER_16MS;
      }
      held.vx = vx;
      held.vy = vy;
      held.state = 'thrown';
      held.samples = null;
      held = null;
    },
  };
}

function drawBelt(api, y, dir, width, speedPxPer16ms, timeMs) {
  api.rect(0, y, width, 14, 0x333340);
  api.rect(0, y, width, 3, 0x555568);
  const stripeW = 24;
  const gap = 16;
  const period = stripeW + gap;
  const offset = ((dir * speedPxPer16ms * timeMs / 16) % period + period) % period;
  for (let x = -period + offset; x < width + period; x += period) {
    api.rect(x, y + 5, stripeW, 4, 0x777788);
  }
}

function drawChomps(api, cx, cy, r, mouthOpen, gagging) {
  const body = 0x9944cc;
  const bodyDark = 0x552288;
  const mouthBlack = 0x1a0011;
  const tooth = 0xfff8e0;
  const eye = 0xffffff;
  const pupil = 0x111111;
  const tongue = 0xff5599;

  api.circle(cx, cy + r * 0.35, r * 0.9, bodyDark);
  api.circle(cx, cy, r, body);

  const footW = r * 0.3;
  const footH = r * 0.25;
  api.rect(cx - r * 0.55, cy + r * 0.85, footW, footH, bodyDark);
  api.rect(cx + r * 0.25, cy + r * 0.85, footW, footH, bodyDark);

  const mouthW = r * 1.3;
  const mouthH = r * (0.18 + 0.75 * mouthOpen);
  const mouthY = cy + r * 0.15;
  api.rect(cx - mouthW / 2, mouthY - mouthH / 2, mouthW, mouthH, mouthBlack);

  const toothW = r * 0.14;
  const toothH = r * 0.2;
  api.rect(cx - r * 0.48, mouthY - mouthH / 2, toothW, toothH, tooth);
  api.rect(cx + r * 0.34, mouthY - mouthH / 2, toothW, toothH, tooth);

  if (gagging) {
    api.rect(cx - r * 0.18, mouthY - r * 0.02, r * 0.36, r * 0.45, tongue);
  }

  const eyeY = cy - r * 0.35;
  const eyeOffX = r * 0.38;
  const eyeR = r * 0.22;
  api.circle(cx - eyeOffX, eyeY, eyeR, eye);
  api.circle(cx + eyeOffX, eyeY, eyeR, eye);

  if (gagging) {
    const pr = eyeR * 0.75;
    api.line(cx - eyeOffX - pr, eyeY - pr, cx - eyeOffX + pr, eyeY + pr, pupil, 3);
    api.line(cx - eyeOffX - pr, eyeY + pr, cx - eyeOffX + pr, eyeY - pr, pupil, 3);
    api.line(cx + eyeOffX - pr, eyeY - pr, cx + eyeOffX + pr, eyeY + pr, pupil, 3);
    api.line(cx + eyeOffX - pr, eyeY + pr, cx + eyeOffX + pr, eyeY - pr, pupil, 3);
  } else {
    api.circle(cx - eyeOffX, eyeY, eyeR * 0.45, pupil);
    api.circle(cx + eyeOffX, eyeY, eyeR * 0.45, pupil);
  }
}
