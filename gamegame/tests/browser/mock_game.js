export function mockGame(api) {
  const duration = Number(new URLSearchParams(location.search).get('mockDuration') ?? 8);

  let notifyReady;
  const ready = new Promise(resolve => { notifyReady = resolve; });

  window.mockControls = {
    ready,
    win: (message) => api.win(message),
    lose: (message) => api.lose(message),
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