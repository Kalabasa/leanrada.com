const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/build/CCapture.all.min.js";
document.head.appendChild(script);

export async function bidyuhan(p5) {
  await new Promise(resolve => setTimeout(() => window.CCapture && resolve(), 100));

  const ccapture = new CCapture({ format: "webm", framerate: 60 });

  let bilang = 0;
  const origNaDraw = p5.draw;
  p5.draw = function draw() {
    if (bilang === 1) {
      ccapture.start();
      document.title = "[🔴REC] " + document.title;
    }
    origNaDraw();
    ccapture.capture(p5.canvas);
    bilang++;
  }

  return () => {
    for (let i = 0; i < 60 * 1.0; i++) {
      ccapture.capture(p5.canvas);
    }
    ccapture.stop();
    ccapture.save((blob) => {
      const a = document.createElement("a");
      document.body.appendChild(a);
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = "bidyo.webm";
      a.click();
      window.URL.revokeObjectURL(url);
      setTimeout(() => a.remove());
    });
  }
}