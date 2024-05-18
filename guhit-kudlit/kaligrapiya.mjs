import "https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.js";
import { salin } from "./salin.mjs";
const P5 = window.p5;
let p5 = null;

// ⎫
function guhitTalon(x0, y0, x1, y1, hx, hy) {
  return [
    x0, y0,
    timpla(x0, x1, 0.25) + hx, y0,
    timpla(x0, x1, 0.5) + hx, timpla(y0, y1, 0.5),
    timpla(x0, x1, 0.75), timpla(y0, y1, 0.75),
    x1, y1
  ];
}
// ᜑ
function guhitAlon(x0, y0, x1, y1, hx, hy) {
  return [
    x0, y0,
    timpla(x0, x1, 0.15), y0 + hy,
    timpla(x0, x1, 0.85), y1 - hy,
    x1, y1
  ];
}
// ᜂ
function guhitIlog(x0, y0, x1, y1, hx, hy) {
  return [
    x0, y0,
    timpla(x0, x1, 0.0) + hx * 0.8, timpla(y0, y1, 0.0),
    timpla(x0, x1, 0.3) + hx, timpla(y0, y1, 0.3),
    timpla(x0, x1, 0.35) + hx * 0.5, timpla(y0, y1, 0.35),
    timpla(x0, x1, 0.4) + hx * 0.8, timpla(y0, y1, 0.4),
    timpla(x0, x1, 0.8) + hx * 0.7, timpla(y0, y1, 0.8),
    x1, y1
  ];
}
// ω
function guhitUlap(x0, y0, x1, y1, hx, hy) {
  return [
    x0, y0,
    timpla(x0, x1, 0.1), timpla(y0, y1, 0.1) + hy * 0.8,
    timpla(x0, x1, 0.3), timpla(y0, y1, 0.3) + hy,
    timpla(x0, x1, 0.4), timpla(y0, y1, 0.4) + hy * 0.4,
    timpla(x0, x1, 0.6), timpla(y0, y1, 0.6) + hy * 0.9,
    timpla(x0, x1, 0.9), timpla(y0, y1, 0.9) + hy * 0.8,
    x1, y1 + hy * 0.2
  ];
}
// ∩
function guhitBundok(x0, y0, x1, y1, x2, y2, hx, hy) {
  return [
    x0, y0,
    timpla(x0, x1, 0.5) - hx, timpla(y0, y1, 0.5) - hy,
    x1, y1,
    timpla(x1, x2, 0.5) + hx, timpla(y1, y2, 0.5) - hy,
    x2, y2
  ];
}
// ⏤
function guhitTuwid(x0, y0, x1, y1, hx, hy) {
  return [
    x0, y0,
    timpla(x0, x1, 0.5) + hx, timpla(y0, y1, 0.5) + hy,
    x1, y1
  ];
}
// dulong parte ng ᜏ
function guhitSaWa(x0, y0, x1, y1, hx, hy) {
  return [
    x0, y0,
    x0 + hx * 0.2, y0 + hy,
    x0 + hx * 0.9, y0,
    timpla(x0, x1, 0.5) + hx, timpla(y0, y1, 0.5) - hy,
    x1, y1
  ];
}

function timpla(a, b, t) {
  return a + (b - a) * t;
}

const DUGTONG = Symbol("dugtong");
const PUTOL = Symbol("putol");

const guhitDa = [
  [guhitTalon, 0.0, 0.0, 0.1, 0.7, 0.1, 0.0],
  [guhitAlon, DUGTONG, DUGTONG, 1.0, 0.8, 0.0, 0.12, PUTOL],
  [guhitAlon, 0.15, 0.05, 1.0, 0.2, 0.0, 0.12, PUTOL],
];
const guhitYa = [
  [guhitTalon, 0.0, 0.0, 0.2, 0.8, 0.1, 0.0],
  [guhitAlon, DUGTONG, DUGTONG, 1.0, 0.4, 0.0, 0.1, PUTOL],
];

const talaguhitan = {
  "a": [
    ...guhitYa,
    [guhitTuwid, 0.0, 0.4, 0.2, 0.4, 0.05, -0.05, PUTOL],
  ],
  "i": [
    [guhitAlon, 0.0, 0.2, 1.0, 0.2, 0.0, 0.1, PUTOL],
    [guhitUlap, 0.0, 0.5, 1.0, 0.5, 0.0, 0.2, PUTOL],
  ],
  "u": [
    [guhitIlog, 0.3, 0.0, 0.3, 1.0, 0.4, 0.0, PUTOL],
  ],
  "b": [
    [guhitBundok, 0.0, 0.8, 0.5, 0.2, 1.0, 0.7, 0.1, 0.1],
    [guhitUlap, DUGTONG, DUGTONG, 0.05, 0.7, 0.0, 0.3, PUTOL],
  ],
  "k": [
    [guhitAlon, 0.0, 0.2, 1.0, 0.2, 0.0, 0.1, PUTOL],
    [guhitAlon, 0.0, 0.8, 1.0, 0.8, 0.0, 0.1, PUTOL],
    [guhitTuwid, 0.52, 0.2, 0.54, 0.8, -0.02, -0.1, PUTOL],
  ],
  "d": guhitDa,
  "g": [
    [guhitIlog, 0.0, 0.1, 0.0, 0.9, 0.4, 0.0, PUTOL],
    [guhitTalon, 0.42, 0.2, 1.1, 0.8, 0.2, 0.0, PUTOL],
  ],
  "h": [
    [guhitAlon, 0.0, 0.5, 1.0, 0.5, 0.0, 0.15, PUTOL],
  ],
  "l": [
    [guhitAlon, 0.0, 0.2, 1.0, 0.2, 0.0, 0.1, PUTOL],
    [guhitIlog, 0.4, 0.25, 0.5, 1.0, 0.15, 0.0, PUTOL],
  ],
  "m": [
    ...guhitYa,
    [guhitTuwid, 0.2, 0.5, 0.75, 0.5, 0.05, -0.05, PUTOL],
  ],
  "n": [
    [guhitBundok, 0.0, 0.8, 0.5, 0.2, 1.0, 0.8, 0.1, 0.1, PUTOL],
    [guhitIlog, 0.4, 0.2, 0.5, 1.0, 0.15, 0.0, PUTOL],
  ],
  "ng": [
    [guhitTalon, 0.0, 0.2, 0.2, 1.0, 0.2, 0.0, PUTOL],
    [guhitUlap, 0.35, 0.45, 1.0, 0.5, 0.0, 0.15, PUTOL],
  ],
  "p": [
    ...guhitYa,
    [guhitTuwid, 0.55, 0.7, 0.9, 0.65, -0.1, -0.05, PUTOL],
  ],
  "r": [
    ...guhitDa,
    [guhitTuwid, 0.3, 0.8, 0.6, 1.0, 0.1, -0.1, PUTOL],
  ],
  "s": [
    [guhitTalon, 0.0, 0.2, 0.15, 1.0, 0.1, 0.0],
    [guhitAlon, DUGTONG, DUGTONG, 0.7, 0.3, 0.0, 0.1],
    [guhitIlog, DUGTONG, DUGTONG, 0.7, 1.0, 0.3, 0.0, PUTOL],
  ],
  "t": [
    [guhitAlon, 0.0, 0.6, 1.0, 0.4, 0.0, 0.1, PUTOL],
    [guhitTuwid, 0.8, 0.35, 0.45, 1.0, -0.12, -0.04, PUTOL],
  ],
  "w": [
    [guhitTalon, 0.0, 0.0, 0.2, 0.8, 0.1, 0.0],
    [guhitSaWa, DUGTONG, DUGTONG, 0.8, 0.0, 0.4, 0.1, PUTOL],
  ],
  "y": guhitYa,
};

const mgaIstilo = {
  "K": { // Klasiko
    panimulangDiin: 1e-6,
    tindiNgDiin: 0.002,
    tigasNgDiin: 0.001,
    lapadNgGuhit: 0.19,
    tindiNgPaglampas: 0.9,
    hugisNgPinsel: 0.0,
    bilangNgHibla: 1,
    kapalNgHibla: (hibla, k) => k,
    angguloNgPinsel: () => 0,
    layoNgKudlit: 0.9,
    talsik: 1.05,
    kulotNgTalsik: 0.8,
    tangay: 1.6,
    hilisNgHanay: 1.2,
    lapadNgTitik: 1.2,
  },
  "P": { // Pinsel
    panimulangDiin: 1e-6,
    tindiNgDiin: 0.2,
    tigasNgDiin: 0.1,
    lapadNgGuhit: 0.22,
    tindiNgPaglampas: 1.2,
    hugisNgPinsel: 0.0,
    bilangNgHibla: 60,
    kapalNgHibla: (hibla, k) => Math.min(k, Math.log1p(k) * 0.2 + 0.1 * hibla.r * lapadNgGuhit),
    angguloNgPinsel: (x, y) => Math.PI * 0.75 + (x + y) * (x - y) / (malapit * 4),
    layoNgKudlit: 1.0,
    talsik: 1.00,
    kulotNgTalsik: 0.8,
    tangay: 2.0,
    hilisNgHanay: 1.6,
    lapadNgTitik: 1.6,
  },
  "M": { // Moderno
    panimulangDiin: 1e-6,
    tindiNgDiin: 0.45,
    tigasNgDiin: 0.4,
    lapadNgGuhit: 0.16,
    tindiNgPaglampas: 0.9,
    hugisNgPinsel: 0.0,
    bilangNgHibla: 1,
    kapalNgHibla: (hibla, k) => k,
    angguloNgPinsel: () => 0,
    layoNgKudlit: 1.0,
    talsik: 0.85,
    kulotNgTalsik: 0.2,
    tangay: 0.8,
    hilisNgHanay: 1.0,
    lapadNgTitik: 1.2,
  },
  "H": { // Humihilis
    panimulangDiin: 0.2,
    tindiNgDiin: 0.4,
    tigasNgDiin: 0.4,
    lapadNgGuhit: 0.18,
    tindiNgPaglampas: 1.1,
    hugisNgPinsel: 0.7,
    bilangNgHibla: 160,
    kapalNgHibla: (hibla, k) => k * 0.04,
    angguloNgPinsel: (x, y) => Math.PI * 0.75 + (x + y) * (x - y) / (malapit * 8),
    layoNgKudlit: 1.1,
    talsik: 0.95,
    kulotNgTalsik: 0.6,
    tangay: 0.1,
    hagibis: ({ x, y }) => ({
      x: x + x * 0.05 - y * 0.1,
      y: y - x * 0.1 + y * 0.05,
    }),
    hilisNgHanay: 1.4,
    lapadNgTitik: 1.2,
  },
};

let palugit = 0; // px
const bilangNgBakod = 40;
const palugitSaKudlit = 1.2; // p/1
let istilo = null;
let malapit = 0; // px
let lapadNgGuhit = 0; // px
let mgaHibla = []; // [{ x: n, y: n, s: n }]
let lapadNgTitik = 0; // px
let tangkadNgTitik = 0; // px
let bilangNgTitik = 0;
let ikailangTitik = 0;
let pilaNgBaybay = [];
let pilaNgPunto = [];
let hulingPunto = null; // { x: px, y: px }
let diin = 0;
let dulo = null; // { x: px, y: px }
let hagibis = null; // { x: px, y: px }
let bakod = null; // px[bilangNgBakod]
let taposNa = () => { };

/**
 * Iguhit ang binigay na `baybay` sa kambas.
 * 
 * Ang baybay ay isang Array ng mga titik-baybayin, naka-encode sa Latin.
 *   Halimbawa, baybay = ["ku", "la", "y"]
 */
export function iguhitAngKaligrapiya(baybay, kambas, paraan = {}) {
  const { ngalanNgIstilo, bagongPalugit } = paraan;

  const marka = atob`TGVhbnJhZGEuY29tL2d1aGl0LWt1ZGxpdA==`;

  new P5((bago) => {
    if (p5) p5.noLoop();
    p5 = bago;

    p5.setup = () => {
      p5.disableFriendlyErrors = true;
      p5.frameRate(60);
      p5.pixelDensity(1);
      p5.createCanvas(1080, 1350, kambas);
      p5.background(0xff);
      p5.push();
      p5.noStroke();
      p5.fill(192);
      p5.textAlign(p5.RIGHT, p5.BOTTOM);
      p5.textSize(16);
      p5.text(salin.ginawaGamit(), p5.width - 4, p5.height - 4);
      p5.pop();
      p5.noLoop();

      istilo = mgaIstilo[ngalanNgIstilo ?? "K"];

      palugit = bagongPalugit ?? Math.max(p5.height, p5.width) * 0.075;
      const tangkad = p5.height - palugit * 2;
      bilangNgTitik = baybay.length;
      tangkadNgTitik = Math.min(tangkad / bilangNgTitik, p5.width / (istilo.lapadNgTitik * 2)) / palugitSaKudlit;
      lapadNgTitik = tangkadNgTitik * istilo.lapadNgTitik;
      ikailangTitik = 0;
      lapadNgGuhit = tangkadNgTitik * istilo.lapadNgGuhit;
      malapit = tangkadNgTitik / 20;

      pilaNgBaybay = [...baybay];
      pilaNgPunto = [];
      hulingPunto = null;

      diin = 0;
      dulo = null;
      hagibis = { x: 0, y: 0 };

      bakod = Array(bilangNgBakod).fill(0);
    };

    p5.draw = () => {
      if (diin === 0 && pilaNgPunto.length === 0) {
        if (pilaNgBaybay.length === 0) {
          const posisyonNgMarka = [];
          const marka2 = marka.split("/")[0];
          for (let i = 0; i < marka2.length; i++) {
            const x = p5.width / 2 + (i - marka2.length / 2) * 8;
            posisyonNgMarka.push({ x, y: Math.max(bakodSa(x - 4), bakodSa(x + 4)) + 3 });
          }
          for (let i = 1; i < marka2.length; i++) {
            if (
              posisyonNgMarka[i].y < posisyonNgMarka[i - 1].y - 4
              && bakodSa(posisyonNgMarka[i].x) < posisyonNgMarka[i - 1].y - 24
            ) {
              posisyonNgMarka[i].y = posisyonNgMarka[i - 1].y - 4;
            }
            if (
              posisyonNgMarka[marka2.length - i - 1].y < posisyonNgMarka[marka2.length - i].y - 4
              && bakodSa(posisyonNgMarka[marka2.length - i - 1].x) < posisyonNgMarka[marka2.length - i].y - 24
            ) {
              posisyonNgMarka[marka2.length - i - 1].y = posisyonNgMarka[marka2.length - i].y - 4;
            }
          }
          p5.noStroke();
          p5.fill(248);
          p5.blendMode(p5.DARKEST);
          p5.textStyle(p5.BOLD);
          p5.textSize(9);
          for (let i = 0; i < marka2.length; i++) {
            p5.textAlign(p5.CENTER, p5.TOP);
            p5.text(marka2[i].toUpperCase(), posisyonNgMarka[i].x, posisyonNgMarka[i].y);
          }

          taposNa();
          p5.noLoop();
          return;
        }

        const titik = pilaNgBaybay.shift();
        const mgaGuhit = talaguhitan[titik.replace(/(?<!^)[aiu]/, "")];

        if (!mgaGuhit) throw new Error("Kulang ang talaguhitan para sa titik: " + titik);

        const titikX = (p5.width - lapadNgTitik) / 2;
        const tangkadNgTitikNaMayKudlit = tangkadNgTitik * palugitSaKudlit;
        const titikY =
          (p5.height - bilangNgTitik * tangkadNgTitikNaMayKudlit) / 2
          + Math.max(0, ikailangTitik - 1) * tangkadNgTitik;

        for (const guhit of mgaGuhit) {
          const [paraangPagguhit, ...mgaPunto] = guhit;

          const putol = mgaPunto.slice(-1)[0] === PUTOL;
          if (putol) mgaPunto.pop();

          let latag =
            mgaPunto.slice(0, -2)
              .map((p, i) => ilatag(titikX, titikY, p, i))
              .concat(
                // huling dalawang punto ay para sa hilis
                mgaPunto.slice(-2)
                  .map((p, i) => ilatag(0, 0, p, i))
              );

          if (latag[0] === DUGTONG || latag[1] === DUGTONG) {
            latag[0] = pilaNgPunto[pilaNgPunto.length - 2];
            latag[1] = pilaNgPunto[pilaNgPunto.length - 1];
            if (latag[0] === PUTOL || latag[1] === PUTOL) throw new Error("Maling pagtala ng titik: " + titik);
          }

          pilaNgPunto.push(...paraangPagguhit(...latag));

          if (putol) pilaNgPunto.push(PUTOL, PUTOL);

          function ilatag(x, y, p, i) {
            if (p === DUGTONG) return p;
            return (i % 2) === 0 ? x + p * lapadNgTitik : y + p * tangkadNgTitik;
          }
        }

        kudlitan(titik);
        const gitna = { x: titikX + lapadNgTitik / 2, y: titikY + tangkadNgTitik / 2 };
        if (istilo.pilter) pilterin(pilaNgPunto, gitna, istilo.pilter);
        ihanay(pilaNgPunto, titikX, titikX + lapadNgTitik);

        ikailangTitik++;
      }

      const punto = { x: pilaNgPunto[0], y: pilaNgPunto[1] };
      const kasunodNaPunto =
        pilaNgPunto.length > 2
          ? { x: pilaNgPunto[2], y: pilaNgPunto[3] }
          : null;
      if (!hulingPunto) hulingPunto = punto;

      const paputol = punto.x === PUTOL || punto.y === PUTOL;
      if (paputol) {
        punto.x = dulo.x + hagibis.x;
        punto.y = dulo.y + hagibis.y;
        let talsik = 0.9;
        talsik += 0.03 / Math.max(1, pilaNgPunto.length - 3);
        if (pilaNgBaybay.length === 0) {
          talsik += 0.6 / (10 + Math.max(0, pilaNgPunto.length - 2));
        }
        talsik *= istilo.talsik;
        const anggulo = Math.atan2(hagibis.y, hagibis.x);
        const liko = Math.PI / 2;
        const likoX = Math.cos(anggulo + liko) * malapit * istilo.kulotNgTalsik;
        const likoY = Math.sin(anggulo + liko) * malapit * istilo.kulotNgTalsik;
        const tulakX = likoX * Math.max(0, talsik - 1);
        const tulakY = likoY * Math.max(0, talsik - 1);;
        hagibis.x = hagibis.x * talsik + tulakX;
        hagibis.y = hagibis.y * talsik + tulakY
      } else {
        const tangay = malapit * 2 * istilo.tangay;
        const ingayX = punto.x * malapit / 3e3;
        const ingayY = punto.y * malapit / 3e3;
        punto.x += (p5.noise(ingayX, ingayY, 0) - 0.5) * tangay;
        punto.y += (p5.noise(ingayX, ingayY, 100) - 0.5) * tangay;
      }

      if (diin <= 0) {
        p5.beginShape();
        mgaHibla = gumawaNgMgaHibla();
        diin = istilo.panimulangDiin;
        dulo = punto;
        hagibis = { x: 0, y: 0 };
      }

      let tangkangPunto = punto;
      if (kasunodNaPunto && kasunodNaPunto.x !== PUTOL && kasunodNaPunto.y !== PUTOL) {
        const layo = Math.hypot(dulo.x - punto.x, dulo.y - punto.y);
        let pagsunod = 0.1 / (0.1 + layo / malapit);
        if (paputol) {
          pagsunod *= 0.1;
        }
        tangkangPunto = {
          x: timpla(punto.x, kasunodNaPunto.x, pagsunod),
          y: timpla(punto.y, kasunodNaPunto.y, pagsunod),
        };
      }
      const darasig = darasigin(tangkangPunto, dulo);
      hagibis.x += darasig.x;
      hagibis.y += darasig.y;
      const pagkiskis = kiskis(hagibis);
      hagibis.x *= pagkiskis;
      hagibis.y *= pagkiskis;
      const hagibisNgIstilo = istilo.hagibis?.(hagibis) ?? hagibis;
      dulo.x += hagibisNgIstilo.x;
      dulo.y += hagibisNgIstilo.y;
      const hulingDiin = diin;
      diin =
        paputol
          ? Math.max(0, Math.min(1, diin - 0.008 - Math.max(0, 0.8 - diin) * 0.1))
          : Math.max(1e-6, timpla(diin, tangkangDiin(), 0.1));

      ipinta(
        dulo.x - hagibis.x, dulo.y - hagibis.y,
        dulo.x, dulo.y,
        lapadNgGuhit * hulingDiin, lapadNgGuhit * diin
      );

      const radyos = lapadNgGuhit * Math.max(hulingDiin, diin) / 2;
      bakuran(dulo.x - radyos, dulo.y);
      bakuran(dulo.x - radyos * Math.SQRT1_2, dulo.y + radyos * Math.SQRT1_2);
      bakuran(dulo.x, dulo.y + radyos);
      bakuran(dulo.x + radyos * Math.SQRT1_2, dulo.y + radyos * Math.SQRT1_2);
      bakuran(dulo.x + radyos, dulo.y);

      if (paputol ? diin < 1e-6 : lampas(tangkangPunto)) {
        hulingPunto = punto;
        pilaNgPunto = pilaNgPunto.slice(2);
        if (paputol) {
          diin = 0;
        }
      }
    };
  });

  const pangako = new Promise(resolve => void (taposNa = resolve));

  if (/\bvid\b/.test(window.location.search)) {
    import("./bidyo.mjs")
      .then(mod => mod.bidyuhan(p5))
      .then(download => {
        p5.loop();
        pangako.then(() => download());
      });
  } else {
    p5.loop();
  }

  return pangako;
}

function gumawaNgMgaHibla() {
  const mgaHibla = [];
  for (let i = 0; i < istilo.bilangNgHibla; i++) {
    const a = Math.PI * 2 * Math.random();
    const l = Math.sqrt(Math.random());
    mgaHibla.push({
      x: Math.cos(a) * l * (1 + istilo.hugisNgPinsel),
      y: Math.sin(a) * l * (1 - istilo.hugisNgPinsel),
      r: Math.random(),
    });
  }
  return mgaHibla;
}

function ipinta(x0, y0, x1, y1, k0, k1) {
  p5.noFill();
  p5.stroke(0);
  const anggulo = istilo.angguloNgPinsel(x1 - x0, y1 - y0);
  const kapal = timpla(k0, k1, 0.5);
  for (const hibla of mgaHibla) {
    const kapalNgHibla = istilo.kapalNgHibla(hibla, kapal);
    p5.strokeWeight(kapalNgHibla);
    const x = Math.cos(anggulo) * hibla.x - Math.sin(anggulo) * hibla.y;
    const y = Math.sin(anggulo) * hibla.x + Math.cos(anggulo) * hibla.y;
    p5.line(
      x0 + x * Math.max(0, (k0 - kapalNgHibla) / 2),
      y0 + y * Math.max(0, (k0 - kapalNgHibla) / 2),
      x1 + x * Math.max(0, (k1 - kapalNgHibla) / 2),
      y1 + y * Math.max(0, (k1 - kapalNgHibla) / 2),
    );
  }
}

function pilterin(mgaPunto, gitna, pilter) {
  for (let i = 0; i < mgaPunto.length; i += 2) {
    let punto = { x: mgaPunto[i], y: mgaPunto[i + 1] };
    if (punto.x === PUTOL || punto.y === PUTOL) continue;
    punto = pilter(punto, gitna);
    mgaPunto[i] = punto.x;
    mgaPunto[i + 1] = punto.y;
  }
}

function ihanay(mgaPunto, kaliwaX, kananX) {
  let usogKaliwaY = 0;
  let usogKananY = 0;

  for (const p of sundin(mgaPunto, lapadNgGuhit * 0.5)) {
    let bakod = bakodSa(p.x);
    for (let i = lapadNgGuhit * 0.5; i <= lapadNgTitik; i += lapadNgGuhit * 0.5) {
      const urong = i / lapadNgTitik * tangkadNgTitik * 0.8;
      bakod = Math.max(
        bakod,
        bakodSa(p.x - i) - urong,
        bakodSa(p.x + i) - urong
      );
    }
    const y = p.y - lapadNgGuhit * 1.5;
    if (y < bakod) {
      const hilis = Math.max(0, Math.min(1, (p.x - kaliwaX) / (kananX - kaliwaX)));
      usogKaliwaY = Math.max(usogKaliwaY, (bakod - y) * Math.min(1, (1 - hilis) * 2));
      usogKananY = Math.max(usogKananY, (bakod - y) * Math.min(1, hilis * 2));
    }
  }

  const hilis = istilo.hilisNgHanay * (0.3 + 0.6 * (1 - (ikailangTitik + 1) / bilangNgTitik));
  usogKaliwaY = Math.max(usogKaliwaY, usogKananY - tangkadNgTitik * hilis);
  usogKananY = Math.max(usogKananY, usogKaliwaY - tangkadNgTitik * hilis);

  for (let i = 0; i < mgaPunto.length; i += 2) {
    const x = mgaPunto[i];
    const y = mgaPunto[i + 1];
    if (x === PUTOL || y === PUTOL) continue;
    const hilis = Math.max(0, Math.min(1, (x - kaliwaX) / (kananX - kaliwaX)));
    mgaPunto[i + 1] += timpla(usogKaliwaY, usogKananY, hilis);
  }
}

function kudlitan(titik) {
  const katinig = titik.match(/[^aiu]+/)?.[0];
  if (!katinig) return;

  const patinig = titik.match(/[aiu]/)?.[0];
  if (patinig === "a") return;

  let kananX = -Infinity;
  let kaliwaX = Infinity;
  let ilalimY = -Infinity;
  let ibabawY = Infinity;
  for (let i = 0; i < pilaNgPunto.length; i += 2) {
    const x = pilaNgPunto[i];
    const y = pilaNgPunto[i + 1];
    if (x === PUTOL || y === PUTOL) continue;
    if (x > kananX) kananX = x;
    if (x < kaliwaX) kaliwaX = x;
    if (y < ibabawY) ibabawY = y;
    if (y > ilalimY) ilalimY = y;
  }

  const hakbang = lapadNgGuhit * 0.2;
  const palugitNgKudlitX = lapadNgGuhit * 1.0;

  if (patinig === "i") {
    let kudlitX = kaliwaX;
    switch (katinig) {
      case "g":
      case "ng":
        kudlitX += lapadNgTitik * 0.5;
        break;
      case "s":
        kudlitX += lapadNgTitik * 0.35;
        break;
      case "m":
      case "p":
      case "w":
      case "y":
        kudlitX += lapadNgTitik * 0.4;
        break;
      default:
        kudlitX += lapadNgTitik * 0.3;
        break;
    }

    let sabit = null;
    let antasNgSabit = Infinity;
    for (const p of sundin(pilaNgPunto, hakbang)) {
      if (Math.abs(p.x - kudlitX) > palugitNgKudlitX) continue;
      const antasNito = Math.abs(p.x - kudlitX) * 0.5 + (p.y - ilalimY);
      if (antasNito < antasNgSabit) {
        sabit = { x: p.x, y: p.y };
        antasNgSabit = antasNito;
      }
    }

    const kudlitY = Math.min(timpla(ibabawY, ilalimY, 0.2), sabit.y - lapadNgGuhit * istilo.layoNgKudlit);

    pilaNgPunto.push(
      ...guhitTuwid(
        kudlitX - lapadNgTitik * 0.04, kudlitY,
        kudlitX + lapadNgTitik * 0.04, kudlitY - tangkadNgTitik * 0.05,
        lapadNgTitik * 0.03, tangkadNgTitik * 0.03
      ),
      PUTOL, PUTOL
    );
  } else if (patinig === "u") {
    let kudlitX = kananX;
    switch (katinig) {
      case "g":
        kudlitX -= lapadNgTitik * 0.4;
        break;
      case "s":
        break;
      default:
        kudlitX -= lapadNgTitik * 0.15;
        break;
    }

    let sabit = null;
    let antasNgSabit = Infinity;
    for (const p of sundin(pilaNgPunto, hakbang)) {
      if (Math.abs(p.x - kudlitX) > palugitNgKudlitX) continue;
      const antasNito = Math.abs(p.x - kudlitX) * 0.5 + (ibabawY - p.y);
      if (antasNito < antasNgSabit) {
        sabit = { x: p.x, y: p.y };
        antasNgSabit = antasNito;
      }
    }

    const kudlitY = Math.max(timpla(ibabawY, ilalimY, 0.6), sabit.y + lapadNgGuhit * istilo.layoNgKudlit);

    pilaNgPunto.push(
      ...guhitTuwid(
        kudlitX - lapadNgTitik * 0.04, kudlitY + tangkadNgTitik * 0.05,
        kudlitX + lapadNgTitik * 0.04, kudlitY,
        -lapadNgTitik * 0.02, -tangkadNgTitik * 0.02
      ),
      PUTOL, PUTOL
    );
  } else if (!patinig) { // pamudpod
    let sabit = null;
    let antasNgSabit = Infinity;
    for (const p of sundin(pilaNgPunto, hakbang)) {
      if (Math.abs(p.x - kananX) > lapadNgTitik * 0.25) continue;
      const antasNito = (kananX - p.x) + (ilalimY - p.y) * 2;
      if (antasNito < antasNgSabit) {
        sabit = { x: p.x, y: p.y };
        antasNgSabit = antasNito;
      }
    }

    const kudlitX = Math.max(timpla(kaliwaX, kananX, 0.9), sabit.x);
    const kudlitY = Math.max(timpla(ibabawY, ilalimY, 0.7), sabit.y);

    pilaNgPunto.push(
      ...guhitTuwid(
        kudlitX + lapadNgTitik * 0.3, kudlitY - tangkadNgTitik * 0.05,
        kudlitX, kudlitY + tangkadNgTitik * 0.25,
        lapadNgTitik * 0.05, tangkadNgTitik * 0.05
      ),
      PUTOL, PUTOL
    );
  }
}

function* sundin(mgaPunto, hakbang) {
  let dulo = null;
  let pila = [...mgaPunto];
  while (pila.length > 0) {
    const punto = { x: pila[0], y: pila[1] };

    if (punto.x === PUTOL || punto.y === PUTOL) {
      dulo = null;
      pila = pila.slice(2);
      continue;
    }

    if (!dulo) dulo = { x: punto.x, y: punto.y };

    yield dulo;

    const layoX = punto.x - dulo.x;
    const layoY = punto.y - dulo.y;
    const layo = Math.hypot(layoX, layoY);

    if (layo < hakbang) {
      pila = pila.slice(2);
      continue;
    }

    dulo.x += hakbang * layoX / layo;
    dulo.y += hakbang * layoY / layo;
  }
}

function darasigin(punto, dulo) {
  const layo = Math.hypot(punto.x - dulo.x, punto.y - dulo.y);
  if (layo === 0) return { x: 0, y: 0 };
  const tungoX = (punto.x - dulo.x) / layo;
  const tungoY = (punto.y - dulo.y) / layo;

  const bilis = Math.hypot(hagibis.x, hagibis.y);
  const bilisX = bilis === 0 ? 0 : hagibis.x / bilis;
  const bilisY = bilis === 0 ? 0 : hagibis.y / bilis;

  const darasigan =
    (0.012 * malapit)
    + (0.020 * malapit)
    * Math.log1p(layo / malapit)
    * Math.max(0, 2.5 * (sigmoyd((dot(tungoX, tungoY, bilisX, bilisY) - 0.7) * 6) - 0.5));

  const nginig = malapit * 0.006 / (1 + darasigan * 6) * istilo.tangay;
  const nginigX = p5.randomGaussian(0, nginig);
  const nginigY = p5.randomGaussian(0, nginig);

  return {
    x: tungoX * darasigan + nginigX,
    y: tungoY * darasigan + nginigY,
  };
}

function kiskis(hagibis) {
  const k = 0.96;
  const s = 0.3;
  const bilis = Math.hypot(hagibis.x, hagibis.y) / malapit;
  return bilis === 0 ? k : k / Math.log(Math.abs(bilis * s) + Math.E);
}

function tangkangDiin() {
  const bilis = Math.hypot(hagibis.x, hagibis.y) / malapit;
  return Math.min(1, istilo.tindiNgDiin * (1 + bilis / istilo.tigasNgDiin)) + p5.randomGaussian(0, 0.004 * malapit);
}

function lampas(punto) {
  const layo = Math.hypot(punto.x - dulo.x, punto.y - dulo.y);
  if (layo / istilo.tindiNgPaglampas <= malapit + Math.hypot(hagibis.x, hagibis.y) / (malapit * malapit) * 30) return true;

  const tungoX = (punto.x - dulo.x) / layo;
  const tungoY = (punto.y - dulo.y) / layo;

  const pagitan = Math.hypot(punto.x - hulingPunto.x, punto.y - hulingPunto.y);
  if (pagitan === 0) return true;

  const dakoX = (punto.x - hulingPunto.x) / pagitan;
  const dakoY = (punto.y - hulingPunto.y) / pagitan;

  return dot(tungoX, tungoY, dakoX, dakoY) <= 0;
}

function bakuran(x, y) {
  const a = Math.floor(saanSaBakod(x));
  bakod[a] = Math.max(bakod[a], y);
}

function bakodSa(x) {
  const saan = saanSaBakod(x);
  return timpla(bakod[Math.floor(saan)], bakod[Math.ceil(saan)], saan - Math.floor(saan));
}

function saanSaBakod(x) {
  const lapad = lapadNgTitik * 1.2;
  return Math.max(0, Math.min(bilangNgBakod - 1,
    (x - (p5.width - lapad) / 2) * (bilangNgBakod - 1) / lapad
  ));
}

function dot(a, b, x, y) {
  return a * x + b * y;
}

function sigmoyd(x) {
  return 1 / (1 + Math.pow(Math.E, -x));
}
