export function mockGame(api) {
  const duration = Number(new URLSearchParams(location.search).get('mockDuration') ?? 8);

  let notifyReady;
  const ready = new Promise(resolve => { notifyReady = resolve; });

  window.mockControls = {
    ready,
    win: () => api.win(),
    lose: () => api.lose(),
  };

  let firstDraw = true;
  return {
    title: 'MOCK',
    duration,
    draw() {
      if (firstDraw) { firstDraw = false; notifyReady(); }
    },
  };
}