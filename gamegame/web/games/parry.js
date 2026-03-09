import { RESULT_WIN } from '../engine/engine.js';

export function parryGame(api) {
  const c = api.complexity;

  const playerEmoji = ['🛡️', '🥊', '🏏', '🪄', '⚔️', '🗡️'][Math.floor(api.random(6))];
  const attackerEmoji = ['👊', '🏐', '🔥', '💣', '☄️', '🪨'][Math.floor(api.random(6))];

  const cx = api.width / 2;
  const cy = api.height * 0.6;

  const variants = ['normal', 'rapid', 'feints', 'dual'];
  const variant = variants[Math.floor(api.random(variants.length))];

  const approachBeats = 4;
  const parryWindowBeats = 0.5;
  const numAttacks = 2 + Math.floor(Math.log2(1 + c) * 3);

  const attacks = [];
  const firstArrival = approachBeats + 0.5;

  if (variant === 'rapid') {
    const burstSize = 2 + Math.floor(c * 0.5);
    let beat = firstArrival;
    let remaining = numAttacks;
    while (remaining > 0) {
      const burst = Math.min(burstSize, remaining);
      for (let i = 0; i < burst; i++) {
        attacks.push({ beat, side: Math.random() < 0.5 ? -1 : 1, isFeint: false, state: 'incoming' });
        beat += 0.6;
      }
      beat += 2;
      remaining -= burst;
    }
  } else if (variant === 'feints') {
    let beat = firstArrival;
    for (let i = 0; i < numAttacks; i++) {
      attacks.push({ beat, side: Math.random() < 0.5 ? -1 : 1, isFeint: false, state: 'incoming' });
      if (api.random() < 0.4 + c * 0.05) {
        attacks.push({ beat: beat + 0.4, side: Math.random() < 0.5 ? -1 : 1, isFeint: true, state: 'incoming' });
      }
      beat += 1.4;
    }
  } else if (variant === 'dual') {
    let beat = firstArrival;
    for (let i = 0; i < numAttacks; i++) {
      attacks.push({ beat, side: -1, isFeint: false, state: 'incoming' });
      attacks.push({ beat: beat + 0.2, side: 1, isFeint: false, state: 'incoming' });
      beat += 1.8;
    }
  } else {
    let beat = firstArrival;
    for (let i = 0; i < numAttacks; i++) {
      attacks.push({ beat, side: i % 2 === 0 ? -1 : 1, isFeint: false, state: 'incoming' });
      beat += 1.4;
    }
  }

  const lastBeat = Math.max(...attacks.map(a => a.beat));
  const duration = Math.ceil(lastBeat + 2);

  let alive = true;
  let localBeat = 0;

  return {
    title: variant === 'feints' ? 'Parry real ones!' : 'Parry!',
    duration,
    timeoutResult: RESULT_WIN,

    draw(api) {
      localBeat += (api.dt / 60000) * api.bpm;

      api.clear(0x1a1a1a);

      const playerPulse = 1 + 0.15 * api.pulse;
      api.emoji(playerEmoji, cx, cy, 60 * playerPulse);

      for (const atk of attacks) {
        if (atk.state === 'parried' || atk.state === 'dodged') continue;

        const timeTo = atk.beat - localBeat;
        if (timeTo > approachBeats) continue;

        if (timeTo < -parryWindowBeats && atk.state === 'incoming' && !atk.isFeint) {
          atk.state = 'hit';
          alive = false;
          api.lose();
          continue;
        }

        if (timeTo < -parryWindowBeats && atk.isFeint) {
          atk.state = 'dodged';
          continue;
        }

        if (atk.state === 'hit') continue;

        const progress = 1 - Math.max(0, timeTo) / approachBeats;
        const startX = atk.side > 0 ? api.width + 30 : -30;
        const x = api.lerp(startX, cx, progress);
        const y = api.lerp(cy - 60, cy, progress * progress);
        const size = api.lerp(30, 50, progress);

        if (Math.abs(timeTo) < parryWindowBeats && !atk.isFeint) {
          api.circleOutline(cx, cy, 50 + 10 * Math.sin(api.time / 50), 0xcccc00);
        }

        if (atk.isFeint) {
          api.emoji('💨', x, y, size);
        } else {
          api.emoji(attackerEmoji, x, y, size);
        }
      }
    },

    onTap() {
      if (!alive) return;

      for (const atk of attacks) {
        if (atk.state !== 'incoming') continue;
        if (Math.abs(atk.beat - localBeat) < parryWindowBeats) {
          if (atk.isFeint) {
            atk.state = 'hit';
            alive = false;
            api.lose();
          } else {
            atk.state = 'parried';
            api.soundTap();
          }
          break;
        }
      }
    },
  };
}
