async function loadPage(params = {}) {
  const iframe = document.createElement('iframe');
  const query = new URLSearchParams(params).toString();
  iframe.src = query ? `/index.html?${query}` : '/index.html';
  document.body.appendChild(iframe);
  await new Promise(resolve => iframe.addEventListener('load', resolve));
  return iframe;
}

function startGame(doc) {
  doc.getElementById('title-screen').click();
}

async function waitFor(fn, timeoutMs = 3000) {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > timeoutMs) throw new Error(`waitFor timed out: ${fn}`);
    await new Promise(r => setTimeout(r, 50));
  }
}

function pause(doc) {
  doc.getElementById('btn-pause').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
}

function resume(doc) {
  doc.getElementById('pause-resume').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
}

function timerSecs(doc) {
  return parseFloat(doc.getElementById('timer-text').textContent);
}

after(() => {
  document.querySelectorAll('iframe').forEach(el => el.remove());
});

// --- UI ---

it('title screen is visible on load', async () => {
  const iframe = await loadPage();
  const titleScreen = iframe.contentDocument.getElementById('title-screen');
  if (!titleScreen) throw new Error('title-screen element not found');
  if (titleScreen.classList.contains('hidden')) throw new Error('title screen should be visible on load');
});

it('pause button shows pause menu', async () => {
  const iframe = await loadPage();
  const doc = iframe.contentDocument;
  startGame(doc);

  pause(doc);

  if (!doc.getElementById('pause-menu').classList.contains('visible'))
    throw new Error('pause menu should be visible after pause');
});

it('resume button hides pause menu', async () => {
  const iframe = await loadPage();
  const doc = iframe.contentDocument;
  startGame(doc);

  pause(doc);
  resume(doc);

  if (doc.getElementById('pause-menu').classList.contains('visible'))
    throw new Error('pause menu should be hidden after resume');
});

// --- Timing ---

it('game timer counts down while running', async () => {
  const iframe = await loadPage({ mock: 1 });
  const doc = iframe.contentDocument;
  startGame(doc);

  await iframe.contentWindow.mockControls.ready;
  const before = timerSecs(doc);
  await new Promise(r => setTimeout(r, 300));
  const after = timerSecs(doc);

  if (after >= before) throw new Error(`timer should decrease: ${before} -> ${after}`);
});

it('timer does not decrease while paused', async () => {
  const iframe = await loadPage({ mock: 1 });
  const doc = iframe.contentDocument;
  startGame(doc);

  await iframe.contentWindow.mockControls.ready;
  pause(doc);
  const before = timerSecs(doc);
  await new Promise(r => setTimeout(r, 300));
  const after = timerSecs(doc);

  if (after < before - 0.1) throw new Error(`timer should not decrease while paused: ${before} -> ${after}`);
});

it('timer resumes decreasing after resume', async () => {
  const iframe = await loadPage({ mock: 1 });
  const doc = iframe.contentDocument;
  startGame(doc);

  await iframe.contentWindow.mockControls.ready;
  pause(doc);
  await new Promise(r => setTimeout(r, 100));
  const before = timerSecs(doc);
  resume(doc);
  await new Promise(r => setTimeout(r, 400));
  const after = timerSecs(doc);

  if (after >= before) throw new Error(`timer should decrease after resume: ${before} -> ${after}`);
});

it('game does not time out while paused', async () => {
  const iframe = await loadPage({ mock: 1, mockDuration: 2 });
  const doc = iframe.contentDocument;
  startGame(doc);

  await iframe.contentWindow.mockControls.ready;
  await waitFor(() => timerSecs(doc) < 0.3);
  pause(doc);
  await new Promise(r => setTimeout(r, 600));

  if (doc.querySelector('.slide-result')) throw new Error('game should not have ended while paused');

  resume(doc);
  await waitFor(() => doc.querySelector('.slide-result'));
});

// --- Results ---

it('win shows NICE result', async () => {
  const iframe = await loadPage({ mock: 1 });
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  startGame(doc);

  await win.mockControls.ready;
  win.mockControls.win();

  await waitFor(() => doc.querySelector('.slide-result'));
  const text = doc.querySelector('.slide-result').textContent;
  if (!text.includes('NICE')) throw new Error(`expected win message, got: ${text}`);
});

it('lose shows default feedback', async () => {
  const iframe = await loadPage({ mock: 1 });
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  startGame(doc);

  await win.mockControls.ready;
  win.mockControls.lose();

  await waitFor(() => doc.querySelector('.slide-result'));
  const text = doc.querySelector('.slide-result').textContent;
  if (!text.includes('OH NO')) throw new Error(`expected lose message, got: ${text}`);
});

it('lose shows custom feedback message', async () => {
  const iframe = await loadPage({ mock: 1 });
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  startGame(doc);

  await win.mockControls.ready;
  win.mockControls.lose('BECAUSE!');

  await waitFor(() => doc.querySelector('.slide-result'));
  const text = doc.querySelector('.slide-result').textContent;
  if (!text.includes('BECAUSE')) throw new Error(`expected custom lose message, got: ${text}`);
});

// --- Next game ---

it('next game starts after win', async () => {
  const iframe = await loadPage({ mock: 1 });
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  startGame(doc);

  await win.mockControls.ready;
  const firstControls = win.mockControls;
  win.mockControls.win();

  await waitFor(() => win.mockControls !== firstControls, 5000);
  await win.mockControls.ready;
});