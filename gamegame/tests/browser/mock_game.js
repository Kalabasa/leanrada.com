export function mockGame(api) {
  const params = new URLSearchParams(location.search);
  const duration = Number(params.get('mockDuration') ?? 8);

  let notifyReady;
  const ready = new Promise(resolve => { notifyReady = resolve; });

  window.mockControls = {
    ready,
    win: (message) => api.win(message),
    lose: (message) => api.lose(message),
  };

  let firstDraw = true;
  return {
    title: params.get('mockTitle') ?? 'MOCK',
    hint: params.get('mockHint') ?? undefined,
    duration,
    timeoutMessage: 'TIME UP',
    draw() {
      if (firstDraw) { firstDraw = false; notifyReady(); }
    },
  };
}