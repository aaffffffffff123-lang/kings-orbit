/* @surface {"id":"p0019","name":"DIS","shortName":"DIS","description":"아홉 층으로 꺼진 구덩이 · 맨 밑 얼음에 루시퍼가 가슴까지 박혀 있습니다.","rulerName":"루시퍼","trophyNote":"여섯 개의 눈에서 아직도 눈물이 흐른다.","species":"damned","inhabited":false,"hell":true} */
/* p0019 — hell, after Dante. A pit sunk into the world in nine circles, a river to cross before the first,
 * fire and storm and ice on the way down, and at the bottom one who weeps with six eyes.
 * Nobody here can die: a body broken apart lies in pieces, the pieces find each other, and it goes back.
 * The scanner counts no one. The only way out is up, in the ship's tractor beam.
 * Save contract (planetStates.p0019.destroyed):
 *   towers "dis-<k>", the castle "limbo" (shared building rules)
 *   "x.d." fallen demons (index, 2 chars) · "x.w." broken wall segments (index 2) · "x.i.<n>" ice broken off Lucifer (0–4)
 *   "x.l." souls lifted out, per circle (circle letter · count 2)
 *   demon index: Charon 0 · Minos 1 · Cerberus 2 · Malebranche 3–12 · centaurs 13–18 · giants 19–22 · fallen angels 23–46 */
(function (K) {
  'use strict';
  const { M, mesh, group } = K,
    ID = 'p0019',
    TAU = Math.PI * 2;
  const { trs } = K.Mat;
  const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  const enc2 = n => B36[Math.floor(n / 36) % 36] + B36[n % 36];
  const dec2 = (s, i) => {
    const a = B36.indexOf(s[i]),
      b = B36.indexOf(s[i + 1]);
    return a < 0 || b < 0 ? -1 : a * 36 + b;
  };
  const rgb = h => M.hex(h).slice();
  const ss = (a, b, x) => {
    const t = M.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  function hh(a, b = 0) {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, z) {
    const ix = Math.floor(x),
      iz = Math.floor(z),
      fx = x - ix,
      fz = z - iz,
      u = fx * fx * (3 - 2 * fx),
      v = fz * fz * (3 - 2 * fz);
    const a = hh(ix, iz),
      b = hh(ix + 1, iz),
      c = hh(ix, iz + 1),
      d = hh(ix + 1, iz + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function pack(prefix, parts) {
    const out = [];
    let s = '';
    for (const p of parts) {
      if (s.length + p.length > 57) {
        out.push(prefix + s);
        s = '';
      }
      s += p;
    }
    if (s) out.push(prefix + s);
    return out;
  }

  /* ---------- the measure of the pit ---------- */
  // Each circle is a terrace, each lower than the last, narrower than the last; cliffs between them.
  const ICE_Y = -332,
    ICE_BED = -341,
    ICE_R = 92,
    GATE = [0, 545],
    ACH = { r0: 472, r1: 505, water: -3 },
    STYX = { r0: 254, r1: 282, water: -132 },
    WALL_R = 249,
    BLOOD = { r0: 189, r1: 206, surface: -192.5 },
    MALE_Y = -262;
  // circle letter, the band its people keep to, the terrace height, the toast when the ship first comes down into it
  const CIRCLES = {
    v: { r0: 512, r1: 600, y: 0 },
    s: { r0: 504, r1: 518, y: 0 },
    n: { r0: 504, r1: 518, y: 0 },
    l: { r0: 428, r1: 469, y: -1.5, n: '제1옥 · 림보', t: '벌은 없습니다. 한숨만 있습니다.' },
    w: { r0: 370, r1: 412, y: -44, n: '제2옥 · 애욕', t: '멈추지 않는 바람에 휩쓸려 다닙니다.' },
    g: { r0: 330, r1: 356, y: -76, n: '제3옥 · 탐식', t: '차가운 비가 그치지 않는 진창입니다.' },
    a: { r0: 292, r1: 316, y: -106, n: '제4옥 · 탐욕', t: '무거운 돌을 밀고 가서 부딪치고, 되돌아갑니다.' },
    y: { r0: 256, r1: 280, y: -132, n: '제5옥 · 분노', t: '스틱스 늪에서 서로를 물어뜯습니다.' },
    h: { r0: 218, r1: 242, y: -133, n: '제6옥 · 이단', t: '디스 성 안쪽, 불타는 무덤들입니다.' },
    b: { r0: 190, r1: 205, y: -192, n: '제7옥 · 폭력', t: '끓는 피의 강, 그 안쪽은 불비가 내리는 모래밭입니다.' },
    d: { r0: 159, r1: 184, y: -190 },
    p: { r0: 128, r1: 134, y: MALE_Y, n: '제8옥 · 사기', t: '열 개의 도랑. 다섯째 도랑은 끓는 역청입니다.' },
    c: { r0: 121.5, r1: 125.5, y: MALE_Y },
    i: { r0: 18, r1: 88, y: ICE_Y, n: '제9옥 · 배신', t: '코키투스. 얼어붙은 호수입니다.' },
  };
  const BOUND = new Set(['g', 'y', 'h', 'b', 'p', 'c', 'i']); // held in place by their punishment
  // the ten ditches of the eighth circle: centre radius, width, depth
  const BOLGE = [
    [148, 2.6, 5],
    [144, 2.6, 5],
    [140.2, 2.6, 5],
    [136.4, 2.6, 5],
    [131, 6.6, 6.5],
    [123.5, 5.6, 4.5],
    [117.6, 2.6, 5],
    [113.8, 2.6, 5],
    [110, 2.6, 5],
    [106.4, 2.2, 4.5],
  ];
  const PITCH = { r: 131, w: 6.6, surface: MALE_Y - 3.4 };
  const cliff = (a, b, ya, yb, R) => ya + (yb - ya) * ss(0.1, 0.9, (R - a) / (b - a));
  function ditch(R) {
    let d = 0;
    for (const [c, w, dep] of BOLGE) {
      const x = Math.abs(R - c) / (w * 0.5);
      if (x < 1) d = Math.max(d, dep * Math.pow(1 - x * x, 0.55));
    }
    return d;
  }
  // radial profile of the pit; noise is laid on top of it
  function profile(R) {
    if (R >= 505) return R < 760 ? 0 : 165 * ss(760, 1010, R);
    if (R >= 472) {
      const t = (R - 472) / 33;
      return -1.5 + 1.5 * t - 6.4 * Math.pow(Math.sin(Math.PI * t), 0.6);
    }
    if (R >= 426) return -1.5;
    if (R >= 414) return cliff(414, 426, -44, -1.5, R);
    if (R >= 368) return -44;
    if (R >= 358) return cliff(358, 368, -76, -44, R);
    if (R >= 328) return -76;
    if (R >= 318) return cliff(318, 328, -106, -76, R);
    if (R >= 290) return -106;
    if (R >= 282) return cliff(282, 290, -130.6, -106, R);
    if (R >= 254) {
      const t = (R - 254) / 28;
      return -130.6 - 6.2 * Math.pow(Math.sin(Math.PI * t), 0.45);
    }
    if (R >= 244) return -130;
    if (R >= 216) return -133;
    if (R >= 206) return cliff(206, 216, -190, -133, R);
    if (R >= 189) {
      const t = (R - 189) / 17;
      return -190 - 7.5 * Math.pow(Math.sin(Math.PI * t), 0.7);
    }
    if (R >= 158) return -190;
    if (R >= 150) return cliff(150, 158, MALE_Y, -190, R);
    if (R >= 104) return MALE_Y - ditch(R);
    if (R >= 92) return cliff(92, 104, ICE_Y, MALE_Y, R);
    return ICE_BED + (ICE_Y - ICE_BED) * ss(84, 92, R);
  }
  function roughness(R) {
    if (R >= 760) return 0;
    if (R >= 505) return 0.9;
    if ((R > 414 && R < 426) || (R > 358 && R < 368) || (R > 318 && R < 328) || (R > 282 && R < 290) || (R > 206 && R < 216) || (R > 150 && R < 158) || (R > 92 && R < 104))
      return 2.4;
    if (R > 472 || (R > 254 && R < 282) || (R > 189 && R < 206) || (R > 104 && R < 150) || R < 92) return 0.12;
    return 0.55;
  }
  function liquidAt(R) {
    if (R > ACH.r0 + 2 && R < ACH.r1 - 2) return ACH.water;
    if (R > STYX.r0 && R < STYX.r1) return STYX.water;
    if (R > BLOOD.r0 && R < BLOOD.r1) return BLOOD.surface;
    if (Math.abs(R - PITCH.r) < PITCH.w * 0.5) return PITCH.surface;
    if (R < ICE_R) return ICE_Y;
    return null;
  }

  /* ---------- light: smoke lit from below, colder the deeper it goes ---------- */
  const TOP = {
    fog: [0.2, 0.07, 0.045],
    fogD: 0.0008,
    ambient: 0.6,
    tint: [1.34, 0.8, 0.64],
    sun: [0.3, 0.86, 0.42],
    sunK: 0.52,
    skyTop: [0.06, 0.025, 0.022],
    skyHorizon: [1, 0.34, 0.08],
    skyCloud: [0.22, 0.09, 0.06],
    skyStyle: 4,
    noShadows: true,
  };
  const DEEP = { fog: [0.3, 0.055, 0.03], fogD: 0.00125, ambient: 0.6, tint: [1.5, 0.72, 0.54], sunK: 0.42 };
  const COLD = { fog: [0.36, 0.44, 0.54], fogD: 0.0015, ambient: 0.78, tint: [0.8, 0.94, 1.28], sunK: 0.5 };
  (K.SurfaceAtmospheres ||= {})[ID] = TOP;

  /* ---------- the damned ---------- */
  const DIMS = { hipY: 1.0, hipX: 0.21, legLen: 1.0, shoulderX: 0.42, shoulderY: 0.98, neckY: 1.12, upperLen: 0.6, foreLen: 0.55, depth: 0.32, headTop: 0.86 };
  K.defineSpecies('damned', {
    name: '망자',
    dims: DIMS,
    scale: [0.86, 1.08],
    walk: 1.0,
    jog: 2.4,
    run: 5.6,
    radius: 1.25,
    voice: 'damned',
    blood: '#5a0d12',
    scorch: '#1a1412',
    capColor: '#3c1414',
    charColor: '#2a1d18',
    palettes: [
      { skin: '#dcc6b0', hair: '#2a211c', rag: '#4b3b32', dark: '#7a6252', mouth: '#3a0c10' },
      { skin: '#bc9d85', hair: '#15110f', rag: '#3a2e28', dark: '#644c3e', mouth: '#330a0e' },
      { skin: '#cfc0ae', hair: '#8a8178', rag: '#56463a', dark: '#77624f', mouth: '#3c0e12' },
      { skin: '#a07d64', hair: '#0f0c0b', rag: '#2f2622', dark: '#584235', mouth: '#2e080c' },
      { skin: '#e6d8c9', hair: '#5a3a24', rag: '#463830', dark: '#7d6656', mouth: '#401014' },
      { skin: '#84634e', hair: '#1a1411', rag: '#352a25', dark: '#503c31', mouth: '#2a070a' },
    ],
    parts: [
      [1, 'lowCyl', 'rag', [0, 0.04, 0], [0.62, 0.4, 0.46]],
      [1, 'lowCyl', 'skin', [0, 0.2, 0], [0.57, 0.3, 0.41]],
      [2, 'lowSphere', 'skin', [0, 0.55, 0], [0.82, 1.1, 0.55]],
      [2, 'lowSphere', 'dark', [0, 0.64, 0.16], [0.5, 0.6, 0.24], [0, 0, 0], 0, 1],
      [2, 'lowCyl', 'skin', [0, 1.1, 0], [0.22, 0.2, 0.22], [0, 0, 0], 0, 1],
      [3, 'lowSphere', 'skin', [0, 0.42, 0], [0.7, 0.82, 0.68]],
      [3, 'lowSphere', 'hair', [0, 0.6, -0.08], [0.75, 0.62, 0.7]],
      [3, 'tinySphere', '#0d0606', [0.15, 0.47, 0.3], [0.16, 0.13, 0.07], [0, 0, 0], 0, 1],
      [3, 'tinySphere', '#0d0606', [-0.15, 0.47, 0.3], [0.16, 0.13, 0.07], [0, 0, 0], 0, 1],
      [3, 'tinySphere', 'mouth', [0, 0.2, 0.32], [0.19, 0.13, 0.06], [0, 0, 0], 0, 1, null, 'mouth', 3.8],
      [4, 'lowCyl', 'skin', [0, -0.3, 0], [0.16, 0.6, 0.16]],
      [5, 'lowCyl', 'skin', [0, -0.27, 0], [0.13, 0.55, 0.13]],
      [5, 'tinySphere', 'skin', [0, -0.58, 0], [0.18, 0.2, 0.16], [0, 0, 0], 0, 1],
      [6, 'lowCyl', 'skin', [0, -0.3, 0], [0.16, 0.6, 0.16]],
      [7, 'lowCyl', 'skin', [0, -0.27, 0], [0.13, 0.55, 0.13]],
      [7, 'tinySphere', 'skin', [0, -0.58, 0], [0.18, 0.2, 0.16], [0, 0, 0], 0, 1],
      [8, 'lowCyl', 'skin', [0, -0.5, 0], [0.2, 1.0, 0.2]],
      [9, 'lowCyl', 'skin', [0, -0.5, 0], [0.2, 1.0, 0.2]],
      [8, 'box', 'dark', [0, -1.0, 0.08], [0.17, 0.07, 0.32], [0, 0, 0], 0, 1],
      [9, 'box', 'dark', [0, -1.0, 0.08], [0.17, 0.07, 0.32], [0, 0, 0], 0, 1],
      [8, 'lowCyl', 'rag', [0, -0.14, 0], [0.24, 0.28, 0.24], [0, 0, 0], 0, 1],
    ],
  });
  // the hypocrites: cloaks gilded outside so that they dazzle, lead inside, too heavy to lift an arm
  K.defineSpecies('hypocrite', {
    name: '납 외투를 입은 망자',
    dims: DIMS,
    scale: [0.9, 1.04],
    walk: 0.35,
    jog: 0.5,
    run: 0.8,
    radius: 1.4,
    voice: 'damned',
    blood: '#5a0d12',
    palettes: [
      { skin: '#cdb6a0', gold: '#b8892e', lead: '#57524f', mouth: '#33090d' },
      { skin: '#a88a72', gold: '#c4983a', lead: '#4a4644', mouth: '#2c080b' },
      { skin: '#dcc9b6', gold: '#a87b26', lead: '#5f5955', mouth: '#3a0c10' },
    ],
    parts: [
      [1, 'lowCone', 'gold', [0, -0.42, 0], [1.5, 1.66, 1.24], [0, 0, 0], 0.14],
      [2, 'lowSphere', 'gold', [0, 0.55, -0.02], [1.1, 1.34, 0.8], [0, 0, 0], 0.14],
      [2, 'lowCyl', 'lead', [0, 0.0, 0], [1.02, 0.09, 0.74], [0, 0, 0], 0, 1],
      [3, 'lowSphere', 'skin', [0, 0.4, 0.06], [0.64, 0.76, 0.62]],
      [3, 'lowSphere', 'gold', [0, 0.54, -0.07], [0.98, 1.02, 0.94], [0, 0, 0], 0.14],
      [3, 'tinySphere', '#120808', [0.14, 0.45, 0.34], [0.13, 0.1, 0.06], [0, 0, 0], 0, 1],
      [3, 'tinySphere', '#120808', [-0.14, 0.45, 0.34], [0.13, 0.1, 0.06], [0, 0, 0], 0, 1],
      [3, 'tinySphere', 'mouth', [0, 0.2, 0.33], [0.16, 0.08, 0.06], [0, 0, 0], 0, 1, null, 'mouth', 3],
      [4, 'lowCyl', 'gold', [0, -0.3, 0], [0.23, 0.62, 0.23], [0, 0, 0], 0.14],
      [5, 'lowCyl', 'gold', [0, -0.27, 0], [0.21, 0.55, 0.21], [0, 0, 0], 0.14],
      [5, 'tinySphere', 'skin', [0, -0.58, 0], [0.17, 0.19, 0.15], [0, 0, 0], 0, 1],
      [6, 'lowCyl', 'gold', [0, -0.3, 0], [0.23, 0.62, 0.23], [0, 0, 0], 0.14],
      [7, 'lowCyl', 'gold', [0, -0.27, 0], [0.21, 0.55, 0.21], [0, 0, 0], 0.14],
      [7, 'tinySphere', 'skin', [0, -0.58, 0], [0.17, 0.19, 0.15], [0, 0, 0], 0, 1],
      [8, 'lowCyl', 'lead', [0, -0.5, 0], [0.2, 1.0, 0.2]],
      [9, 'lowCyl', 'lead', [0, -0.5, 0], [0.2, 1.0, 0.2]],
    ],
  });

  /* ---------- the one at the bottom ---------- */
  const RED = '#a8180f',
    PALE = '#d9c98c',
    BLACK = '#1c1615',
    HIDE = '#2a1412',
    HORN = '#120d0c',
    TEAR = '#cfe6ff',
    FOAM = '#c0283a',
    ICE = '#bfe2ff',
    BASALT = '#2e2523',
    IRON = '#3a2421';
  // One head, three faces: red in front, pale yellow over the right shoulder, black over the left.
  // Unit size: about 3 across. Faces look out along +Z, +X and -X of the head's own frame.
  function luciferHead(g, lit) {
    const out = { jaws: [], eyes: [], mouths: [], tears: [] };
    mesh(g, 'sphere', [0, 0.25, -0.15], [2.5, 2.4, 2.3], HIDE, { em: 0 });
    mesh(g, 'sphere', [0, 1.15, -0.1], [2.1, 1.1, 2.0], HIDE);
    for (const sd of [-1, 1]) {
      const horn = mesh(g, 'cone', [sd * 0.7, 1.95, -0.25], [0.34, 1.25, 0.34], HORN);
      horn.r = [-0.35, 0, -sd * 0.42];
    }
    [
      [0, RED],
      [-Math.PI / 2, PALE],
      [Math.PI / 2, BLACK],
    ].forEach(([a, col], k) => {
      const f = group(g, [0, 0, 0]);
      f.r[1] = a;
      const skin = mesh(f, 'sphere', [0, 0.1, 0.72], [1.7, 2.0, 1.35], col);
      mesh(f, 'sphere', [0, 0.62, 1.22], [1.5, 0.34, 0.42], col).color = rgb(col).map(c => c * 0.62);
      mesh(f, 'lowCone', [0, 0.26, 1.5], [0.32, 0.5, 0.32], col).r = [Math.PI / 2 - 0.2, 0, 0];
      for (const sd of [-1, 1]) {
        const e = mesh(f, 'sphere', [sd * 0.42, 0.42, 1.28], [0.38, 0.32, 0.3], '#ff2a0c', { type: 20, em: 1, detail: 0.15 });
        e.r = [0, sd * 0.35, 0];
        out.eyes.push(e);
        // tears down to the chin, with the bloody foam of what the mouth is chewing
        const t = mesh(f, 'box', [sd * 0.44, -0.42, 1.34], [0.07, 1.25, 0.06], TEAR, { em: lit ? 0.9 : 0.25, alpha: 0.85 });
        t.r = [-0.18, 0, sd * 0.06];
        out.tears.push(t);
      }
      mesh(f, 'sphere', [0, -0.42, 1.24], [1.0, 0.62, 0.5], '#120406');
      out.mouths.push(f);
      const jaw = group(f, [0, -0.5, 0.85]);
      mesh(jaw, 'sphere', [0, -0.28, 0.32], [1.3, 0.6, 1.0], col);
      for (let i = 0; i < 5; i++) mesh(jaw, 'lowCone', [(i - 2) * 0.2, -0.05, 0.75 - Math.abs(i - 2) * 0.05], [0.09, 0.22, 0.09], '#e8dcc0');
      for (let i = 0; i < 3; i++) mesh(jaw, 'lowSphere', [(i - 1) * 0.28, -0.58, 0.62], [0.26, 0.34, 0.2], FOAM, { em: lit ? 0.15 : 0 });
      out.jaws.push(jaw);
      if (k === 0) for (let i = 0; i < 4; i++) mesh(f, 'lowCone', [(i - 1.5) * 0.36, 0.92, 1.16], [0.12, 0.3, 0.12], '#e8dcc0').r = [Math.PI, 0, 0];
    });
    return out;
  }
  K.TrophyModels[ID + '-ruler'] = root => {
    // the archive shows every head facing -Z; the red face goes to the front
    const g = group(root, [0, 0.35, 0]);
    g.s = [0.62, 0.62, 0.62];
    g.r[1] = Math.PI;
    luciferHead(g, false);
    mesh(g, 'cylinder', [0, -1.5, -0.1], [1.7, 1.2, 1.6], HIDE);
    mesh(g, 'disc', [0, -2.1, -0.1], [1.75, 0.06, 1.65], '#5b1a14');
    mesh(g, 'disc', [0, -2.13, -0.1], [1.2, 0.05, 1.1], ICE, { em: 0.2 });
    return g;
  };
  // the words over the gate, in the size they are seen at
  if (typeof document !== 'undefined' && !document.getElementById('hell-css')) {
    const st = document.createElement('style');
    st.id = 'hell-css';
    st.textContent =
      '.worldLabel.inscription{font:600 12px/1.5 Georgia,"Times New Roman",serif;letter-spacing:4px;color:#f2b47a;text-shadow:0 0 12px rgba(255,90,20,.7),0 2px 3px #000;white-space:nowrap}' +
      '.worldLabel.inscription span{font:600 19px/1.6 "Noto Serif KR","Nanum Myeongjo","Batang",serif;letter-spacing:5px;color:#ffe0b8;margin-top:6px;text-shadow:0 0 18px rgba(255,70,10,.75),0 2px 4px #000}' +
      '@media(max-width:760px){.worldLabel.inscription{font-size:9px;letter-spacing:2px}.worldLabel.inscription span{font-size:14px;letter-spacing:3px}}';
    document.head.append(st);
  }

  const box = (min, max) => ({ min, max });

  class Hell extends K.Surface {
    constructor(game, def) {
      const captured = game.save.data.trophies.some(t => t.id === def.rulerId);
      super(game, def, {
        seed: 191919,
        rulerName: '루시퍼',
        areaLabel: 'DIS / 지옥',
        regionName: '지옥문 앞',
        afterLabel: '바람이 멎은 구덩이',
        rubble: '#3b302c',
        accent: '#b23a1c',
        spark: '#ffb066',
        lifeColor: '#c9a88e',
        scorch: '#1a1311',
        stablePhase: true,
        environment: TOP,
        wind: 0.05,
        spawn: { p: [0, 46, 700], yaw: 0, pitch: -0.12 },
        rulerAim: '루시퍼 · Q로 머리 붙잡기',
        rulerGrab: ['루시퍼의 머리를 붙잡았습니다', 'S로 뒤로 물러나 끝까지 당기세요. 날개 바람이 함선을 밀어냅니다.'],
        pullRate: 0.06,
        pullRise: 7,
        arrival: ['전시 복도에 루시퍼의 머리가 도착했습니다.', '복도를 따라가면 새로 채워진 자리가 있습니다.'],
      });
      this.hell = true;
      this.stilled = captured; // once the head is gone the wings stop, and stay stopped
      this.stillAt = captured ? -100 : null;
      this.deadDemons = new Set();
      this.brokenWalls = new Set();
      this.iceBroken = 0;
      this.liftedBy = {};
      for (const t of this.destroyed) {
        if (t.startsWith('x.d.'))
          for (let i = 4; i + 2 <= t.length; i += 2) {
            const n = dec2(t, i);
            if (n >= 0) this.deadDemons.add(n);
          }
        else if (t.startsWith('x.w.'))
          for (let i = 4; i + 2 <= t.length; i += 2) {
            const n = dec2(t, i);
            if (n >= 0) this.brokenWalls.add(n);
          }
        else if (t.startsWith('x.i.')) this.iceBroken = M.clamp(parseInt(t.slice(4), 10) || 0, 0, 4);
        else if (t.startsWith('x.l.'))
          for (let i = 4; i + 3 <= t.length; i += 3) {
            const k = t[i],
              n = dec2(t, i + 1);
            if (CIRCLES[k] && n > 0) this.liftedBy[k] = (this.liftedBy[k] || 0) + n;
          }
      }
      // what heaven has lost comes down here: the people killed there, in their white robes, and the angels that fell
      this.newcomers = Math.min(36, K.ResidentLedger?.read(game.save, 'p0018')?.ki || 0);
      let fallen = 0;
      for (const t of game.save.data.planetStates?.p0018?.destroyed || []) if (typeof t === 'string' && t.startsWith('h.a.')) fallen += Math.floor((t.length - 4) / 2);
      this.heavenAngels = Math.min(16, fallen);
      this.demons = [];
      this.walls = [];
      this.tombs = [];
      this.boulders = [];
      this.arrows = [];
      this.told = {};
      this.breaks = 0;
      this.fire = captured ? 0.38 : 1; // how hot the pit burns; it cools once the wings stop
      this.gust = 0;
      this.wingT = 0;
      this.pullPrev = 0;
      this.envMix = [0, 0];
      this.lastCircle = null;
      this.residents.haloOff = true;
      this.initialize();
      if (this.stilled) this.applyStill(true);
    }

    /* ---------- ground ---------- */
    ground(x, z) {
      const R = Math.hypot(x, z);
      let y = profile(R);
      const k = roughness(R);
      if (k > 0) y += (vnoise(x * 0.045, z * 0.045) - 0.5) * 2 * k + (vnoise(x * 0.16 + 7.3, z * 0.16 - 2.1) - 0.5) * k * 0.7;
      if (R >= 760) y += (vnoise(x * 0.006, z * 0.006) - 0.4) * 150 * ss(760, 900, R) + (vnoise(x * 0.021, z * 0.021) - 0.5) * 44 * ss(760, 860, R);
      return y;
    }
    // where people stand: on the ice at the bottom, on the beds of the rivers they stand in
    height(x, z) {
      return Math.hypot(x, z) < ICE_R ? ICE_Y : this.ground(x, z);
    }
    // where the ship rests: on liquid as on stone; inside a cliff, the foot of it (the wall itself pushes back)
    floor(x, z, y = 1e9) {
      const R = Math.hypot(x, z),
        L = liquidAt(R);
      let f = this.height(x, z);
      if (L != null && L > f) f = L;
      if (y < f - 4.5 && R > 1)
        for (let k = 1; k <= 10; k++) {
          const r2 = R - k * 1.6;
          if (r2 <= 0) break;
          const s = r2 / R,
            g = this.height(x * s, z * s);
          if (g < y - 1) return Math.max(g, liquidAt(r2) ?? -1e9);
        }
      return f;
    }
    circleAt(R, y) {
      for (const k of ['l', 'w', 'g', 'a', 'y', 'h', 'b', 'p', 'i']) {
        const c = CIRCLES[k],
          lo = k === 'b' ? 158 : k === 'p' ? 104 : k === 'i' ? 0 : k === 'h' ? 216 : c.r0 - 2,
          hi = k === 'b' ? 206 : k === 'p' ? 150 : k === 'i' ? 92 : k === 'y' ? 282 : c.r1 + 2;
        if (R >= lo && R <= hi && y < c.y + 90) return k;
      }
      return null;
    }
    stat(geo, opts = {}) {
      const b = this.game.engine.makeBatch(geo, { capacity: 64, dynamic: false, ...opts });
      this.residents.all.push(b);
      return b;
    }
    put(b, p, r, s, c, em = 0, type = 0, det = 0, seed = 0, alpha = 1) {
      const d = this.game.engine.growBatch(b, b.count + 1),
        o = b.count * 24,
        col = typeof c === 'string' ? rgb(c) : c;
      trs(d, o, p[0], p[1], p[2], r[0], r[1], r[2], s[0], s[1], s[2]);
      d[o + 16] = col[0];
      d[o + 17] = col[1];
      d[o + 18] = col[2];
      d[o + 19] = alpha;
      d[o + 20] = em;
      d[o + 21] = type;
      d[o + 22] = det;
      d[o + 23] = seed;
      b.count++;
      return o;
    }
    ringMesh(name, radii, segs, yfn, color, opts) {
      const p = [],
        n = [],
        idx = [];
      for (const R of radii)
        for (let j = 0; j <= segs; j++) {
          const a = (j / segs) * TAU,
            x = Math.sin(a) * R,
            z = Math.cos(a) * R,
            e = 0.9;
          p.push(x, yfn(x, z), z);
          const nx = yfn(x - e, z) - yfn(x + e, z),
            nz = yfn(x, z - e) - yfn(x, z + e),
            l = Math.hypot(nx, 2 * e, nz);
          n.push(nx / l, (2 * e) / l, nz / l);
        }
      for (let i = 0; i < radii.length - 1; i++)
        for (let j = 0; j < segs; j++) {
          const a = i * (segs + 1) + j,
            b = a + segs + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      this.game.engine.addGeometry(name, { p, n, idx });
      this.ownedGeometries.add(name);
      return mesh(this.root, name, [0, 0, 0], [1, 1, 1], color, opts);
    }
    makeTerrain() {
      const step = R => (R < 92 ? 4 : R >= 104 && R <= 150 ? 0.8 : roughness(R) > 2 || (R > 472 && R < 505) || (R > 254 && R < 282) || (R > 189 && R < 206) ? 1.4 : R >= 760 ? 26 : R >= 505 ? 8 : 5);
      const band = (a, b) => {
        const out = [];
        for (let R = a; R < b - 0.2; R += step(R)) out.push(R);
        out.push(b);
        return out;
      };
      const g = (x, z) => this.ground(x, z);
      // one mesh per material, sharing their edges: the stuff of each circle
      const parts = [
        [0, 92, '#141c28', 0, 0],
        [92, 104, '#3a3230', 0, 0.25],
        [104, 150, '#6e625a', 7, 0],
        [150, 158, '#4a3832', 0, 0.8],
        [158, 189, '#c88040', 2, 1],
        [189, 206, '#3a1612', 0, 0.3],
        [206, 216, '#4c3530', 0, 1],
        [216, 254, '#4e3832', 0, 0.65],
        [254, 282, '#3d3627', 1, 0],
        [282, 290, '#4a3630', 0, 0.6],
        [290, 318, '#6e5240', 0, 0.42],
        [318, 328, '#4c3832', 0, 0.55],
        [328, 358, '#52402d', 1, 0],
        [358, 368, '#4e3a34', 0, 0.5],
        [368, 414, '#61443d', 0, 0.5],
        [414, 426, '#4e3a33', 0, 0.45],
        [426, 472, '#5f6c4c', 4, 0],
        [472, 505, '#3c352d', 0, 0],
        [505, 1400, '#4d413a', 6, 0.35],
      ];
      this.groundParts = parts.map(([a, b, col, det, hot], i) => {
        const n = this.ringMesh('hell-g' + i, band(a, b), b > 600 ? 160 : 200, g, col, { type: 27, detail: det, em: hot, seed: i * 1.37 });
        n.hot = hot;
        return n;
      });
      // what lies on it: rivers that go round, the frozen lake at the bottom
      const flat = y => () => y;
      const ring = (name, a, b, y, det, em, alpha = 1, segs = 180) =>
        this.ringMesh(name, [a, (a + b) / 2, b], segs, flat(y), '#ffffff', { type: 28, detail: det, em, alpha });
      this.liquids = [
        ring('hell-acheron', ACH.r0 + 1, ACH.r1 - 1, ACH.water, 0, 0),
        ring('hell-styx', STYX.r0 - 0.5, STYX.r1 + 0.5, STYX.water, 1, 0),
        ring('hell-blood', BLOOD.r0 - 0.5, BLOOD.r1 + 0.5, BLOOD.surface, 2, 1),
        ring('hell-pitch', PITCH.r - PITCH.w * 0.5 - 0.3, PITCH.r + PITCH.w * 0.5 + 0.3, PITCH.surface, 3, 0),
      ];
      this.ice = this.ringMesh('hell-ice', [0, 30, 60, ICE_R + 0.6], 120, flat(ICE_Y), '#ffffff', { type: 27, detail: 3, em: 1, alpha: 0.8 });
    }

    /* ---------- what was built here ---------- */
    makeCity() {
      this.makeGate();
      this.makeLimbo();
      this.makeDis();
      this.makeTombs();
      this.makeBridges();
      this.makeBoulders();
      this.makeBanner();
      this.makeRocks();
    }
    makeGate() {
      const [gx, gz] = GATE,
        y = this.height(gx, gz) - 0.5,
        g = group(this.root, [gx, y, gz]),
        ST = { type: 27, detail: 0, em: 0.75, seed: 3.1 };
      for (const sd of [-1, 1]) {
        mesh(g, 'box', [sd * 15, 19.5, 0], [8, 39, 9], BASALT, ST);
        mesh(g, 'box', [sd * 15, 1.5, 0], [11.5, 3, 12], BASALT, ST);
        mesh(g, 'box', [sd * 15, 37, 0], [10, 2, 11], BASALT, ST);
        // the doors lie where they fell: no bolt has held this gate since it was broken
        const leaf = mesh(g, 'box', [sd * 8.5, 0.7, 12 + sd * 2], [11, 1.2, 22], IRON, { type: 27, detail: 5, em: 0.35 });
        leaf.r = [0, sd * 0.32, sd * 0.05];
      }
      mesh(g, 'box', [0, 41, 0], [40, 6.5, 10], BASALT, ST);
      mesh(g, 'box', [0, 45.2, 0], [45, 2.2, 11.5], BASALT, ST);
      mesh(g, 'box', [0, 41, 5.08], [31, 4.2, 0.3], '#140d0b');
      this.gateBoxes = [
        box([gx - 19, y, gz - 4.5], [gx - 11, y + 39, gz + 4.5]),
        box([gx + 11, y, gz - 4.5], [gx + 19, y + 39, gz + 4.5]),
        box([gx - 22.5, y + 37.8, gz - 5.8], [gx + 22.5, y + 46.3, gz + 5.8]),
      ];
      this.gateEnt = { kind: 'gate', fixed: true, fixedNote: '땅에 박혀 있습니다.', label: '지옥문', alive: true, p: [gx, y + 20, gz], radius: 20 };
      this.gateLabelP = [gx, y + 41, gz + 6];
    }
    makeLimbo() {
      const a = -0.9,
        R = 449,
        cx = Math.sin(a) * R,
        cz = Math.cos(a) * R,
        y = this.height(cx, cz) - 0.6;
      const b = this.building('limbo', [cx, y, cz], 56, 40, 'castle', 1400);
      b.label = '림보의 성';
      // a noble castle seven times circled with high walls
      for (let k = 0; k < 7; k++) {
        const rad = 27 - k * 3.15,
          h = 6 + k * 4.3,
          col = k % 2 ? '#8f877c' : '#a0978a';
        mesh(b.node, 'cylinder', [0, h / 2, 0], [rad * 2, h, rad * 2], col);
        const n = Math.round(rad * 1.15);
        for (let j = 0; j < n; j++) {
          const t = (j / n) * TAU;
          mesh(b.node, 'box', [Math.sin(t) * (rad - 0.7), h + 0.9, Math.cos(t) * (rad - 0.7)], [1.5, 1.8, 1.5], '#82796e').r[1] = t;
        }
      }
      mesh(b.node, 'cylinder', [0, 37, 0], [8.5, 12, 8.5], '#aaa092');
      mesh(b.node, 'cone', [0, 47, 0], [11, 8, 11], '#5d4c40');
      for (let j = 0; j < 6; j++) {
        const t = (j / 6) * TAU;
        mesh(b.node, 'box', [Math.sin(t) * 4.3, 38, Math.cos(t) * 4.3], [1.1, 2.2, 0.25], '#ffd89c', { em: 1.6, type: 1 }).r[1] = t;
      }
      this.moat = mesh(this.root, 'ring', [cx, -1.2, cz], [34, 1, 34], '#ffffff', { type: 28, detail: 0 });
      this.finishBuilding(b);
      this.castle = b;
      if (!b.alive) this.moat.visible = false;
    }
    // the city of Dis: walls of iron glowing red, towers with fire in their domes, and on the walls the angels who fell
    makeDis() {
      const N = 24;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * TAU,
          x = Math.sin(t) * WALL_R,
          z = Math.cos(t) * WALL_R,
          y = -131,
          node = group(this.root, [x, y, z]);
        node.r[1] = t;
        const len = 2 * WALL_R * Math.sin(Math.PI / N) + 1.2,
          W = { type: 27, detail: 5, em: 1, seed: i * 0.7 };
        if (i === 0) {
          // the gate of the city, shut
          for (const sd of [-1, 1]) mesh(node, 'box', [sd * (len / 4 + 3.5), 15.5, 0], [len / 2 - 7, 31, 6], IRON, W);
          mesh(node, 'box', [0, 13, 0.4], [14, 26, 2.2], '#22100e', { type: 27, detail: 5, em: 0.55 });
          mesh(node, 'box', [0, 28.5, 0], [15, 5, 6], IRON, W);
        } else mesh(node, 'box', [0, 15.5, 0], [len, 31, 6], IRON, W);
        const merl = [];
        for (let k = 0; k < 15; k++) merl.push(mesh(node, 'box', [(k / 14 - 0.5) * (len - 3), 32.3, 0], [2.2, 2.6, 6.4], IRON, W));
        const w = {
          kind: 'wall',
          i,
          label: '디스 성벽',
          alive: !this.brokenWalls.has(i),
          hp: 320,
          maxHp: 320,
          node,
          t,
          p: [x, y + 15.5, z],
          half: [len / 2, 15.5, 3],
          fixed: true,
          fixedNote: '성벽은 땅에 박혀 있습니다.',
          fall: 0,
        };
        if (!w.alive) this.wallDown(w, true);
        this.walls.push(w);
      }
      for (let k = 0; k < 12; k++) {
        const t = ((k * 2 + 1) / N) * TAU,
          x = Math.sin(t) * WALL_R,
          z = Math.cos(t) * WALL_R,
          b = this.building('dis-' + k, [x, -131, z], 15, 47, 'tower', 520);
        b.label = '디스의 탑';
        mesh(b.node, 'cylinder', [0, 21, 0], [13, 42, 13], IRON, { type: 27, detail: 5, em: 1, seed: k });
        mesh(b.node, 'cylinder', [0, 42.6, 0], [15, 1.6, 15], '#2a1714');
        const dome = mesh(b.node, 'dome', [0, 43.2, 0], [12.5, 10, 12.5], '#d2401a', { em: 1.3 });
        b.glows.push(dome);
        dome.restEm = 1.3;
        for (let j = 0; j < 5; j++) {
          const a = (j / 5) * TAU + 0.3;
          mesh(b.node, 'cone', [Math.sin(a) * 3.2, 50.5, Math.cos(a) * 3.2], [2.6, 6.5 + (j % 2) * 2, 2.6], '#ffb35a', { type: 29, em: 1, seed: k + j * 0.37 });
        }
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * TAU;
          mesh(b.node, 'box', [Math.sin(a) * 6.55, 30, Math.cos(a) * 6.55], [1.4, 3.6, 0.3], '#ff7a2a', { em: 1.8, type: 1 }).r[1] = a;
        }
        b.flameRoot = true;
        this.finishBuilding(b);
      }
    }
    wallDown(w, old = false) {
      w.alive = false;
      this.brokenWalls.add(w.i);
      if (old) {
        w.node.p[1] -= 26;
        w.node.r[2] = 0.3;
        w.fall = 9;
        this.wallRubble(w);
      } else w.fall = 0.001;
    }
    wallRubble(w) {
      const rng = M.rand(w.i * 97 + 11);
      for (let k = 0; k < 9; k++) {
        const along = (rng() - 0.5) * w.half[0] * 1.8,
          out = (rng() - 0.5) * 14,
          x = w.p[0] + Math.cos(w.t) * along + Math.sin(w.t) * out,
          z = w.p[2] - Math.sin(w.t) * along + Math.cos(w.t) * out,
          s = 2 + rng() * 5;
        const n = mesh(this.root, 'box', [x, this.height(x, z) + s * 0.3, z], [s * 1.4, s, s], IRON, { type: 27, detail: 5, em: 0.4 });
        n.r = [rng(), rng() * 6, rng()];
      }
    }
    // the sixth circle: open tombs in rows, fire inside them, the lids leaning on their sides
    makeTombs() {
      const B = this.stat('box', { capacity: 1000 }),
        F = this.stat('cone', { capacity: 480, transparent: true });
      this.tombFire = F;
      const STONE = '#4a403a',
        rng = M.rand(606);
      for (let i = 0; i < 150; i++) {
        // four rows round the inside of the walls; the ones with someone in them come first
        const row = i % 4,
          j = Math.floor(i / 4),
          n = 38,
          a = ((j % n) / n) * TAU + row * 0.041 + (rng() - 0.5) * 0.03,
          R = [221, 227, 233, 239][row],
          x = Math.sin(a) * R,
          z = Math.cos(a) * R,
          y = this.height(x, z),
          yaw = a + Math.PI / 2,
          cs = Math.cos(yaw),
          sn = Math.sin(yaw);
        const at = (lx, ly, lz) => [x + cs * lx + sn * lz, y + ly, z - sn * lx + cs * lz];
        // shell: floor, two long sides, two ends
        this.put(B, at(0, 0.12, 0), [0, yaw, 0], [1.7, 0.25, 3.5], STONE, 0.1, 27, 0, i);
        for (const sd of [-1, 1]) {
          this.put(B, at(sd * 0.8, 0.65, 0), [0, yaw, 0], [0.18, 1.1, 3.5], STONE, 0.25, 27, 0, i);
          this.put(B, at(0, 0.65, sd * 1.7), [0, yaw, 0], [1.6, 1.1, 0.18], STONE, 0.25, 27, 0, i);
        }
        // the lid, set aside: they will be sealed on the last day, not before
        this.put(B, at(1.7, 0.55, 0.2), [0, yaw, 1.05], [0.22, 1.9, 3.6], '#5a4e46', 0.1, 27, 0, i);
        const fires = [];
        for (let k = 0; k < 3; k++) fires.push(this.put(F, at((rng() - 0.5) * 0.7, 1.6 + rng() * 0.6, (k - 1) * 1.05), [0, 0, 0], [1.1, 3.0 + rng() * 2.2, 1.1], '#ffb25a', 1.2, 29, 0, i + k * 0.31, 0.95));
        this.tombs.push({ i, x, z, y, yaw, fires });
      }
    }
    // the eighth circle: four stone bridges cross all ten ditches like spokes
    makeBridges() {
      const B = this.stat('box', { capacity: 120 });
      for (let q = 0; q < 4; q++) {
        const a = (q / 4) * TAU + 0.25,
          s = Math.sin(a),
          c = Math.cos(a),
          L = 48,
          mid = 128;
        this.put(B, [s * mid, MALE_Y + 0.6, c * mid], [0, a, 0], [3.4, 1.3, L], '#7a6f66', 0, 27, 7, q);
        for (const sd of [-1, 1]) this.put(B, [s * mid + c * sd * 1.6, MALE_Y + 1.6, c * mid - s * sd * 1.6], [0, a, 0], [0.4, 0.9, L], '#6a5f57', 0, 27, 7, q);
        for (let k = 0; k < BOLGE.length - 1; k++) {
          const rr = (BOLGE[k][0] - BOLGE[k][1] / 2 + BOLGE[k + 1][0] + BOLGE[k + 1][1] / 2) / 2;
          this.put(B, [s * rr, MALE_Y - 0.6, c * rr], [0, a, 0], [3.8, 2.6, 1.4], '#6a5f57', 0, 27, 7, q + k);
        }
      }
    }
    // the fourth circle: weights rolled round half the circle and back, two crowds meeting at either end
    makeBoulders() {
      for (let k = 0; k < 8; k++) {
        const n = group(this.root, [0, 0, 0]);
        mesh(n, 'sphere', [0, 0, 0], [5.6, 5.3, 5.6], '#7d604a', { type: 27, detail: 0, em: 0.15, seed: k });
        mesh(n, 'lowSphere', [1.1, 1.3, 0.6], [3.4, 2.6, 3.2], '#6a503e', { type: 27, detail: 0, em: 0.1, seed: k + 3 });
        this.boulders.push({ k, side: k < 4 ? 1 : -1, j: k % 4, node: n, th: 0, R: 304, dir: 1, roll: 0, label: '돌덩이', kind: 'boulder', fixed: true, fixedNote: '굴러갈 뿐, 들리지 않습니다.', alive: true, p: [0, 0, 0], radius: 3 });
      }
    }
    // the vestibule: a banner whirling round and round, and everyone who never chose a side running after it
    makeBanner() {
      this.banner = group(this.root, [0, 0, 560]);
      mesh(this.banner, 'cylinder', [0, 6, 0], [0.32, 12, 0.32], '#3a302a');
      this.flag = group(this.banner, [0, 10.5, 0]);
      mesh(this.flag, 'box', [1.9, 0, 0], [3.8, 2.2, 0.1], '#d9d2c4', { em: 0.1 });
      this.bannerP = [0, 0, 560];
    }
    makeRocks() {
      const S = this.stat('tinySphere', { capacity: 700 }),
        C = this.stat('cone', { capacity: 260 }),
        K2 = this.stat('box', { capacity: 240 }),
        rng = M.rand(4242);
      const ok = R => !(liquidAt(R) != null || roughness(R) > 2 || (R > 104 && R < 150) || R < 100);
      for (let i = 0; i < 640; i++) {
        const R = 100 + Math.pow(rng(), 0.8) * 640,
          a = rng() * TAU;
        if (!ok(R) || (R > 535 && R < 560 && Math.abs(a) < 0.08)) continue;
        const x = Math.sin(a) * R,
          z = Math.cos(a) * R,
          s = 0.6 + Math.pow(rng(), 2.4) * 4.2;
        this.put(S, [x, this.ground(x, z) + s * 0.18, z], [rng(), rng() * 6, rng()], [s * 1.3, s * 0.8, s], R > 505 ? '#3a302b' : '#3a2c27', 0.3, 27, 0, rng() * 9);
      }
      // black spires on the plain outside, and up the mountain wall round the pit
      for (let i = 0; i < 240; i++) {
        const R = 520 + rng() * 560,
          a = rng() * TAU;
        if (R > 535 && R < 600 && Math.abs(a) < 0.12) continue;
        const x = Math.sin(a) * R,
          z = Math.cos(a) * R,
          h = 5 + Math.pow(rng(), 1.6) * (R > 760 ? 55 : 22);
        this.put(C, [x, this.ground(x, z) + h * 0.45, z], [(rng() - 0.5) * 0.3, rng() * 6, (rng() - 0.5) * 0.3], [h * 0.26, h, h * 0.22], '#171110', 0.9, 27, 0, rng() * 9);
      }
      // the meadow of the first circle
      const G = this.stat('lowCone', { capacity: 420 });
      for (let i = 0; i < 420; i++) {
        const R = 428 + rng() * 42,
          a = rng() * TAU,
          x = Math.sin(a) * R,
          z = Math.cos(a) * R,
          h = 0.5 + rng() * 1.1;
        this.put(G, [x, this.ground(x, z) + h * 0.45, z], [(rng() - 0.5) * 0.4, rng() * 6, (rng() - 0.5) * 0.4], [0.5 + rng() * 0.5, h, 0.4], rng() < 0.5 ? '#4f6a3c' : '#3f5732', 0);
      }
      // bones on the ash: the plain outside the gate is where they wait
      for (let i = 0; i < 220; i++) {
        const R = 506 + rng() * 240,
          a = rng() * TAU,
          x = Math.sin(a) * R,
          z = Math.cos(a) * R;
        this.put(K2, [x, this.ground(x, z) + 0.12, z], [rng() * 0.3, rng() * 6, rng() * 0.3], [0.16, 0.16, 0.7 + rng() * 0.6], '#d9d0bf', 0.05);
      }
    }
    /* ---------- the bottom: Lucifer, frozen to the chest, beating six wings ---------- */
    wingGeometry() {
      if (this.game.engine.geometries['hell-wing']) return;
      // a bat's wing in its own plane: root at the origin, reaching +X, the membrane scalloped between the fingers
      const P = [
        [0.62, 0.3],
        [0, 0],
        [0.38, 0.22],
        [0.62, 0.3],
        [1.0, 0.62],
        [0.86, 0.34],
        [1.06, 0.18],
        [0.84, -0.02],
        [0.92, -0.22],
        [0.66, -0.24],
        [0.66, -0.46],
        [0.42, -0.3],
        [0.32, -0.52],
        [0.16, -0.3],
        [0.04, -0.32],
        [0, 0],
      ];
      const p = [],
        n = [],
        idx = [];
      for (const [x, y] of P) {
        p.push(x, y, 0);
        n.push(0, 0, 1);
      }
      for (let i = 4; i < P.length - 1; i++) idx.push(0, i, i + 1);
      idx.push(0, 1, 2);
      this.game.engine.addGeometry('hell-wing', { p, n, idx });
      this.ownedGeometries.add('hell-wing');
    }
    batWing(parent, p, scale, color, em = 0) {
      const root = group(parent, p),
        flap = group(root);
      mesh(flap, 'hell-wing', [0, 0, 0], [scale, scale, scale], color, { type: 31, em, seed: p[0] * 0.13 });
      const bone = (a, b, w) => K.beam(flap, [a[0] * scale, a[1] * scale, 0], [b[0] * scale, b[1] * scale, 0], w * scale, '#1a0d0b');
      bone([0, 0], [0.38, 0.22], 0.03);
      bone([0.38, 0.22], [0.62, 0.3], 0.025);
      for (const t of [[1.0, 0.62], [1.06, 0.18], [0.92, -0.22], [0.66, -0.46], [0.32, -0.52]]) bone([0.62, 0.3], t, 0.011);
      mesh(flap, 'lowCone', [0.62 * scale, 0.36 * scale, 0], [0.04 * scale, 0.12 * scale, 0.04 * scale], HORN);
      return { root, flap };
    }
    makeRuler() {
      const root = this.root,
        base = group(root, [0, ICE_Y, 0]),
        body = group(base);
      this.wingGeometry();
      const HIDE2 = { em: 0 };
      mesh(body, 'sphere', [0, 3, 0], [37, 31, 25], HIDE, HIDE2);
      for (const sd of [-1, 1]) {
        mesh(body, 'sphere', [sd * 15.5, 12.5, -0.5], [17, 13, 15], HIDE, HIDE2);
        const arm = K.beam(body, [sd * 19, 11, 0], [sd * 24, -9, 5], 9, HIDE);
        arm.geo = 'lowCyl';
      }
      // the shag of his hide, that the poet climbed down by
      const rng = M.rand(19);
      for (let i = 0; i < 70; i++) {
        const a = rng() * TAU,
          up = 0.25 + rng() * 0.7,
          x = Math.sin(a) * 18.5 * Math.cos(up * 1.2),
          z = Math.cos(a) * 12.5 * Math.cos(up * 1.2),
          y = 3 + Math.sin(up * 1.3) * 15.5;
        const c = mesh(body, 'lowCone', [x, y, z], [1.3, 3.6 + rng() * 2.4, 1.3], '#1b0c0a');
        c.r = [Math.atan2(z, 14) * 0.6, 0, -Math.atan2(x, 14) * 0.6];
      }
      mesh(body, 'cylinder', [0, 22, -0.5], [13.5, 10, 12.5], HIDE);
      this.stump = mesh(body, 'disc', [0, 27.1, -0.5], [13.6, 0.3, 12.6], '#4a0f0c', { em: 0.15 });
      this.stump.visible = false;
      // the head: three faces, eyes weeping into the bloody foam of what each mouth chews
      const head = group(base, [0, 34, 0]),
        face = group(head);
      face.s = [6.6, 6.6, 6.6];
      this.lhead = luciferHead(face, true);
      // in each mouth one of the three: the one in front head first, legs outside; the two at the sides head down
      this.chewed = this.lhead.mouths.map((f, k) => {
        const g = group(f, k === 0 ? [0, -0.5, 2.05] : [0, -0.45, 1.42]);
        const fig = K.residentFigure(g, 'damned', 7 + k * 5, 0.8);
        if (k === 0) g.r = [-Math.PI / 2 + 0.55, 0, 0];
        else g.r = [Math.PI, 0, 0];
        fig.p = [0, 0, 0];
        return g;
      });
      this.setupRuler(base, body, head, group(head), 34, 400, 12);
      this.ruler.hp = this.ruler.captured ? 0 : 400 - this.iceBroken * 100;
      // six wings, two below each face: their wind is what freezes the lake
      this.wings = [];
      [0, -Math.PI / 2, Math.PI / 2].forEach((a, k) => {
        for (const sd of [-1, 1]) {
          const b = a + sd * 0.48,
            w = this.batWing(base, [Math.sin(b) * 9, 15, Math.cos(b) * 9], 56, k === 0 ? '#3c1612' : k === 1 ? '#4a3a24' : '#1a1414', 0.05);
          w.root.r = [1.05, b - Math.PI / 2, 0];
          w.b = b;
          w.sd = sd;
          w.k = k;
          this.wings.push(w);
        }
      });
      // the ice he is held in, built up round his chest to the jaw: it has to be broken before the head comes away
      this.iceStages = [];
      for (let s = 0; s < 4; s++) {
        const list = [],
          n = 9,
          y0 = 1 + s * 6.5,
          rad = 21.5 - s * 3.1;
        for (let j = 0; j < n; j++) {
          const a = (j / n) * TAU + s * 0.55,
            h = 12 + ((j * 7 + s * 3) % 5) * 2.2,
            w = 7 + ((j * 3 + s) % 3) * 1.6,
            c = mesh(base, 'hex', [Math.sin(a) * rad, y0 + h * 0.35, Math.cos(a) * rad * 0.8], [w, h, w * 0.8], '#9fd6f2', { type: 23, em: 0.35, detail: 0.85, alpha: 0.72 });
          c.r = [Math.cos(a) * 0.5, a, -Math.sin(a) * 0.5];
          list.push(c);
        }
        this.iceStages.push(list);
        if (s < this.iceBroken) for (const c of list) c.visible = false;
      }
      this.lucifer = { kind: 'lucifer', fixed: true, fixedNote: '얼음에 가슴까지 박혀 있습니다.', label: '루시퍼', alive: true, p: [0, ICE_Y + 10, 0], radius: 20 };
      this.flapK = 1;
    }
    iceLeft() {
      return this.ruler.captured ? 0 : Math.round((this.ruler.hp / 400) * 100);
    }
    guardText() {
      return '루시퍼 · 목 둘레의 얼음을 광선으로 깨세요';
    }
    lockedText() {
      return ['머리가 얼음에 묶여 있습니다', '광선으로 목 둘레의 얼음을 먼저 깨세요. 남은 얼음 ' + this.iceLeft() + '%'];
    }
    // the ice comes off in four layers, from the outside in
    chipIce(amount, at) {
      const r = this.ruler;
      if (r.captured || r.hp <= 0) return;
      const before = Math.ceil(r.hp / 100);
      r.hp = Math.max(0, r.hp - amount);
      const after = Math.ceil(r.hp / 100);
      if (Math.random() < 0.25) this.emit(at || [0, ICE_Y + 18, 0], 2, ICE, 9, 1.2);
      if (after < before) {
        for (let s = 0; s < 4 - after; s++) {
          if (s < this.iceBroken) continue;
          for (const c of this.iceStages[s]) {
            c.visible = false;
            this.emit([c.p[0], ICE_Y + c.p[1], c.p[2]], 3, ICE, 14, 2.2);
          }
        }
        this.iceBroken = 4 - after;
        const [pan, gain] = this.where([0, ICE_Y + 18, 0]);
        this.game.audio.crack(pan, Math.max(0.5, gain));
        this.game.audio.impact(1.4);
        if (r.hp > 0) this.game.ui.toast('얼음이 깨지고 있습니다', '남은 얼음 ' + this.iceLeft() + '%', 3);
        else this.game.ui.toast('얼음이 모두 깨졌습니다', '이제 루시퍼의 머리를 붙잡을 수 있습니다. 가까이 가서 Q.', 7);
      }
    }
    updateLucifer(dt, ship, pulling, tension) {
      const t = this.time,
        r = this.ruler;
      // the beat: slower and slower once the head is gone, until it stops
      if (this.stilled) this.flapK = Math.max(0, this.flapK - dt * 0.22);
      const rate = (0.24 + tension * 0.5) * (this.stilled ? this.flapK : 1);
      this.wingT += dt * rate * TAU;
      const ph = this.wingT,
        flap = Math.sin(ph) * (0.42 + tension * 0.2) * (this.stilled ? this.flapK : 1),
        down = -Math.cos(ph); // > 0 while the wings come down
      for (const w of this.wings) {
        const off = w.sd * 0.06;
        w.flap.r[1] = this.stilled ? -0.55 * (1 - this.flapK) + flap * this.flapK + off : flap + off;
        w.root.r[0] = this.stilled ? 1.05 - (1 - this.flapK) * 0.45 : 1.05;
      }
      if (!this.stilled && down > 0.92 && !this.flapped) {
        this.flapped = true;
        const [pan, gain] = this.where([0, ICE_Y + 20, 0]);
        if (gain > 0.03) this.game.audio.flap(pan, Math.min(1.2, gain * 1.6));
      } else if (down < 0) this.flapped = false;
      // the wind it makes pushes everything away from him; it does no harm, it only pushes
      const dx = ship[0],
        dz = ship[2],
        d = Math.hypot(dx, dz) || 1,
        dy = ship[1] - ICE_Y;
      const reach = M.clamp(1 - d / 230, 0, 1) * M.clamp(1 - (dy - 60) / 200, 0, 1);
      this.gust = this.stilled ? 0 : reach * (0.45 + 0.55 * Math.max(0, down)) * (1 + tension * 0.8);
      if (this.gust > 0.01) {
        const v = this.vehicle,
          k = this.gust * 34 * dt;
        v.velocity[0] += (dx / d) * k;
        v.velocity[2] += (dz / d) * k;
        v.velocity[1] += k * 0.2;
        v.shake = Math.max(v.shake, this.gust * 0.22);
      }
      if (r.captured) return;
      // the faces: jaws working on what they hold, eyes on the ship when it comes near
      const near = M.clamp(1 - d / 260, 0, 1);
      this.lhead.jaws.forEach((j, k) => {
        j.r[0] = 0.12 + Math.abs(Math.sin(t * (1.6 + k * 0.13) + k)) * 0.26 + tension * 0.35;
      });
      for (const e of this.lhead.eyes) {
        e.em = 0.75 + near * 0.25;
        e.detail = 0.15 + tension * 0.12;
      }
      for (const tr of this.lhead.tears) tr.alpha = 0.6 + 0.3 * Math.sin(t * 2.3 + tr.p[0]);
      this.chewed.forEach((g, k) => {
        const s = Math.sin(t * (2.1 + k * 0.4) + k * 2);
        if (k === 0) g.r[0] = -Math.PI / 2 + 0.55 + s * 0.16;
        else g.r[2] = s * 0.22;
      });
      if (!pulling) {
        // he cannot turn his head far: the ice holds his shoulders
        const want = M.clamp(Math.atan2(ship[0], ship[2]) * 0.18, -0.25, 0.25) * near;
        r.head.r[1] = M.damp(r.head.r[1], want, 1.5, dt);
        r.head.p[1] = 34 + Math.sin(t * 0.9) * 0.3;
      } else r.head.r[1] = Math.sin(t * 17) * 0.03 * tension;
    }
    /* ---------- the keepers of the circles ---------- */
    makeCreatures() {
      this.makeCharon();
      this.makeMinos();
      this.makeCerberus();
      for (let k = 0; k < 10; k++) this.makeMalebranche(3 + k, k);
      for (let k = 0; k < 6; k++) this.makeCentaur(13 + k, k);
      for (let k = 0; k < 4; k++) this.makeGiant(19 + k, k);
      const n = 8 + this.heavenAngels;
      for (let k = 0; k < n; k++) this.makeFallen(23 + k, k, n);
    }
    addDemon(d) {
      d.kind = 'demon';
      d.alive = !this.deadDemons.has(d.i);
      d.maxHp = d.hp;
      d.velocity = [0, 0, 0];
      d.thrown = false;
      d.p = d.node.p;
      d.flinch = 0;
      this.demons.push(d);
      if (!d.alive) this.layDemon(d, true);
      return d;
    }
    figure(parent, opt) {
      // a standing body in the planet's own nodes: robe or hide, head, arms, eyes that glow
      const g = group(parent, [0, 0, 0]),
        h = opt.h,
        c = opt.body,
        out = { g };
      mesh(g, 'lowCone', [0, h * 0.27, 0], [h * 0.42, h * 0.56, h * 0.34], opt.robe || c);
      mesh(g, 'sphere', [0, h * 0.62, 0], [h * 0.36, h * 0.38, h * 0.24], c);
      out.head = group(g, [0, h * 0.86, 0]);
      mesh(out.head, 'sphere', [0, 0, 0], [h * 0.2, h * 0.23, h * 0.2], opt.skin || c);
      out.eyes = [];
      for (const sd of [-1, 1]) out.eyes.push(mesh(out.head, 'tinySphere', [sd * h * 0.05, h * 0.02, h * 0.09], [h * 0.04, h * 0.03, h * 0.02], opt.eye || '#ff3a12', { em: 2.2, type: 1 }));
      out.arms = [];
      for (const sd of [-1, 1]) {
        const a = group(g, [sd * h * 0.2, h * 0.74, 0]);
        mesh(a, 'lowCyl', [0, -h * 0.17, 0], [h * 0.08, h * 0.36, h * 0.08], opt.robe || c);
        a.r[2] = sd * 0.15;
        out.arms.push(a);
      }
      return out;
    }
    // Charon, the ferryman, eyes in wheels of flame
    makeCharon() {
      const boat = group(this.root, [0, ACH.water, 0]);
      mesh(boat, 'box', [0, 0.1, 0], [3, 1.1, 10], '#2a1d16');
      mesh(boat, 'box', [0, 0.8, 4.6], [2.6, 1.2, 1.4], '#2a1d16');
      mesh(boat, 'box', [0, 0.8, -4.6], [2.6, 1.2, 1.4], '#2a1d16');
      for (const sd of [-1, 1]) mesh(boat, 'box', [sd * 1.45, 0.7, 0], [0.2, 0.5, 9.4], '#3a2a20');
      this.boat = boat;
      const node = group(this.root, [0, ACH.water, 0]),
        f = this.figure(node, { h: 3.6, body: '#3a3533', robe: '#2b2826', skin: '#cbb8a6', eye: '#ffcf6a' });
      mesh(f.head, 'lowSphere', [0, -0.42, 0.3], [0.62, 0.9, 0.42], '#e9e4da');
      for (const e of f.eyes) {
        const w = mesh(f.head, 'lowTorus', [e.p[0], e.p[1], e.p[2] + 0.02], [0.4, 0.4, 0.4], '#ff8a24', { em: 2.4, type: 1 });
        w.r[0] = Math.PI / 2;
      }
      const oar = K.beam(node, [0.6, 2.4, 0.2], [1.6, -1.6, 2.4], 0.16, '#4a3626');
      this.charonOar = oar;
      this.addDemon({ i: 0, cls: 'charon', label: '카론 · 뱃사공', hp: 220, node, f, radius: 2.2, hy: 2, cross: 0, wait: 3, from: 1 });
    }
    // Minos, who judges at the head of the second circle: he winds his tail round himself once for every circle
    makeMinos() {
      const a = 0.3,
        R = 406,
        x = Math.sin(a) * R,
        z = Math.cos(a) * R,
        node = group(this.root, [x, this.height(x, z), z]);
      node.r[1] = a + Math.PI;
      const f = this.figure(node, { h: 14, body: '#4a1c16', robe: '#2d1210', skin: '#5c2a20', eye: '#ffb02a' });
      mesh(f.head, 'box', [0, -0.6, 1.9], [1.8, 1.4, 2.4], '#5c2a20');
      for (const sd of [-1, 1]) mesh(f.head, 'cone', [sd * 1.2, 2.4, -0.2], [0.6, 2.6, 0.6], HORN).r[2] = -sd * 0.35;
      const coils = group(node, [0, 0, 0]);
      for (let i = 0; i < 40; i++) {
        const t = i / 40,
          ang = t * TAU * 3.2,
          rr = 4.2 - t * 1.6;
        mesh(coils, 'lowSphere', [Math.sin(ang) * rr, 1 + t * 7.5, Math.cos(ang) * rr], [1.5 - t * 0.6, 1.3 - t * 0.5, 1.5 - t * 0.6], '#3a2a1c');
      }
      const tip = mesh(node, 'cone', [3.2, 9.5, 1.5], [0.9, 2.8, 0.9], '#3a2a1c');
      this.addDemon({ i: 1, cls: 'minos', label: '미노스 · 심판관', hp: 420, node, f, coils, tip, radius: 6, hy: 7, fixed: true, fixedNote: '너무 무겁습니다.' });
    }
    // Cerberus: three throats, red eyes, a greasy black beard, hands that claw
    makeCerberus() {
      const a = -0.42,
        R = 343,
        x = Math.sin(a) * R,
        z = Math.cos(a) * R,
        node = group(this.root, [x, this.height(x, z), z]),
        FUR = '#1c1512';
      node.r[1] = a + Math.PI / 2;
      mesh(node, 'sphere', [0, 4.4, 0], [6.2, 5.2, 11], FUR);
      mesh(node, 'sphere', [0, 5.2, 3.6], [6.6, 5.6, 5.6], FUR);
      const legs = [];
      for (const [lx, lz] of [[-2, 3.6], [2, 3.6], [-2, -3.6], [2, -3.6]]) legs.push(K.beam(node, [lx, 3.6, lz], [lx * 1.1, 0, lz + 0.6], 1.5, FUR));
      const tail = K.beam(node, [0, 5, -5.2], [0, 7.5, -9], 0.9, FUR);
      const heads = [];
      [-1, 0, 1].forEach(k => {
        const neck = group(node, [k * 2.1, 6.6, 5]);
        neck.r = [-0.3, k * 0.45, 0];
        mesh(neck, 'lowCyl', [0, 1.2, 0.9], [2.1, 3.2, 2.1], FUR).r[0] = 0.6;
        const h = group(neck, [0, 2.6, 2.2]);
        mesh(h, 'sphere', [0, 0, 0], [2.6, 2.4, 2.8], FUR);
        mesh(h, 'box', [0, -0.35, 1.7], [1.4, 1.1, 1.9], '#2a1f1a');
        const jaw = group(h, [0, -0.7, 0.9]);
        mesh(jaw, 'box', [0, -0.2, 0.9], [1.3, 0.45, 1.8], '#2a1f1a');
        for (let t = 0; t < 4; t++) mesh(jaw, 'lowCone', [(t - 1.5) * 0.3, 0.12, 1.65], [0.12, 0.32, 0.12], '#e6dcc8');
        for (const sd of [-1, 1]) {
          mesh(h, 'tinySphere', [sd * 0.62, 0.42, 1.1], [0.36, 0.3, 0.2], '#ff2212', { em: 2.6, type: 1 });
          mesh(h, 'cone', [sd * 0.9, 1.5, -0.3], [0.6, 1.3, 0.5], FUR).r[2] = -sd * 0.4;
        }
        for (let b = 0; b < 4; b++) mesh(h, 'lowSphere', [(b - 1.5) * 0.4, -1.3, 0.7], [0.5, 1.2, 0.5], '#0c0807', { em: 0 });
        heads.push({ neck, h, jaw, k, lunge: 0 });
      });
      this.addDemon({ i: 2, cls: 'cerberus', label: '케르베로스', hp: 380, node, heads, legs, tail, radius: 7, hy: 5, fixed: true, fixedNote: '너무 무겁습니다.', bite: 3 });
    }
    // the Malebranche of the fifth ditch: black, winged, a hook in every hand
    makeMalebranche(i, k) {
      const fly = k >= 6,
        a = (k / 10) * TAU + 0.4,
        R = fly ? PITCH.r : PITCH.r + (k % 2 ? -5.4 : 5.4),
        x = Math.sin(a) * R,
        z = Math.cos(a) * R,
        node = group(this.root, [x, fly ? MALE_Y + 8 : this.height(x, z), z]);
      const f = this.figure(node, { h: 2.6, body: '#1a0c0a', robe: '#240f0c', skin: '#2e110d', eye: '#ffd23a' });
      for (const sd of [-1, 1]) mesh(f.head, 'cone', [sd * 0.22, 0.42, -0.05], [0.12, 0.42, 0.12], '#0c0606').r[2] = -sd * 0.3;
      const wings = [-1, 1].map(sd => {
        const w = this.batWing(node, [sd * 0.25, 2.0, -0.25], 2.6, '#2a0e0c');
        w.root.r = [0.5, sd > 0 ? -0.9 : Math.PI + 0.9, 0];
        return w;
      });
      const hook = group(f.arms[1], [0, -0.6, 0]);
      K.beam(hook, [0, -0.2, 0], [0, 3.6, 0.6], 0.09, '#2a2420');
      const hk = mesh(hook, 'lowTorus', [0, 3.85, 0.9], [0.65, 0.65, 0.65], '#5a524c');
      hk.r = [0, Math.PI / 2, 0];
      this.addDemon({ i, cls: 'male', label: '말레브랑케 · 갈고리 악마', hp: 60, node, f, wings, hook, radius: 1.4, hy: 1.5, fly, a, a0: a, R, strike: 0, cool: 2 + k * 0.7 });
      if (!fly) node.r[1] = a + (R > PITCH.r ? Math.PI : 0);
    }
    // the centaurs of the river of blood, running the bank, bows ready
    makeCentaur(i, k) {
      const node = group(this.root, [0, 0, 0]),
        HORSE = k % 2 ? '#5a3a28' : '#3a2a20';
      mesh(node, 'sphere', [0, 1.9, 0], [1.6, 1.5, 3.4], HORSE);
      const legs = [];
      for (const [lx, lz] of [[-0.5, 1.2], [0.5, 1.2], [-0.5, -1.2], [0.5, -1.2]]) {
        const g = group(node, [lx, 1.6, lz]);
        mesh(g, 'lowCyl', [0, -0.8, 0], [0.32, 1.6, 0.32], HORSE);
        legs.push(g);
      }
      const top = group(node, [0, 2.4, 1.4]);
      mesh(top, 'sphere', [0, 0.9, 0], [1.0, 1.4, 0.7], '#a87a5a');
      const head = group(top, [0, 1.85, 0]);
      mesh(head, 'sphere', [0, 0, 0], [0.55, 0.62, 0.55], '#a87a5a');
      mesh(head, 'lowSphere', [0, 0.18, -0.06], [0.6, 0.45, 0.6], '#2a1a12');
      const bow = group(top, [0.55, 1.1, 0.5]);
      const arc = mesh(bow, 'lowTorus', [0, 0, 0], [1.6, 1.6, 2.4], '#3a2416');
      arc.r = [0, Math.PI / 2, 0];
      K.beam(node, [-0.4, 3.4, 0.9], [-0.7, 4.6, 0.2], 0.3, '#4a2c1a');
      this.addDemon({ i, cls: 'centaur', label: '켄타우로스 · 활', hp: 90, node, legs, top, head, bow, radius: 1.8, hy: 2.2, th: (k / 6) * TAU + 0.2, aim: 0, shot: null, cool: 1.5 + k });
    }
    // the giants round the well: standing on the ice below, their heads above the eighth circle,
    // a chain wound five times round each from the neck down, one arm bound in front, the other behind
    makeGiant(i, k) {
      const a = 0.5 + (k / 4) * TAU,
        R = 97,
        x = Math.sin(a) * R,
        z = Math.cos(a) * R,
        node = group(this.root, [x, ICE_Y, z]),
        SK = ['#9a7660', '#86664f', '#a3806a', '#7a5a46'][k],
        HAIR = ['#2a1d16', '#3a2a1c', '#1c1410', '#4a3626'][k];
      node.r[1] = a;
      for (const sd of [-1, 1]) {
        mesh(node, 'taper', [sd * 5.2, 19, 0], [9.5, 38, 9.5], SK).r[0] = Math.PI;
        mesh(node, 'lowSphere', [sd * 5.2, 37.5, 0.4], [10, 7, 10], SK);
      }
      mesh(node, 'lowSphere', [0, 40, 0], [21, 10, 13], '#3a2a20');
      const torso = mesh(node, 'frustum', [0, 55, 0], [25, 28, 14.5], SK);
      torso.r[0] = Math.PI;
      mesh(node, 'sphere', [0, 61, 2.5], [21, 12, 9], SK);
      for (const sd of [-1, 1]) mesh(node, 'sphere', [sd * 12.5, 66, 0], [11.5, 10, 11], SK);
      // the arms, bound: the left in front, the right behind
      const arm = (a1, b1, w) => (K.beam(node, a1, b1, w, SK).geo = 'lowCyl');
      arm([12.5, 66, 0], [14.5, 50, -1], 7);
      arm([14.5, 50, -1], [4, 45, -7.5], 6);
      arm([-12.5, 66, 0], [-14.5, 50, 1], 7);
      arm([-14.5, 50, 1], [-4, 45, 7.5], 6);
      mesh(node, 'cylinder', [0, 70, 0.5], [8, 6, 8], SK);
      const head = group(node, [0, 78, 1]);
      mesh(head, 'sphere', [0, 0, 0], [12, 14, 12.5], SK);
      mesh(head, 'lowSphere', [0, 3.6, -1.6], [13, 8, 12.4], HAIR);
      mesh(head, 'lowSphere', [0, -3.2, -2.8], [12.6, 9, 9], HAIR);
      mesh(head, 'lowSphere', [0, -4.8, 3.4], [9, 8, 6], HAIR);
      mesh(head, 'box', [0, 1.8, 5.4], [8.4, 1.4, 2], SK);
      mesh(head, 'lowCone', [0, -0.2, 6.6], [1.8, 3, 1.8], SK).r[0] = Math.PI / 2 - 0.3;
      const eyes = [];
      for (const sd of [-1, 1]) eyes.push(mesh(head, 'tinySphere', [sd * 2.3, 0.7, 5.7], [1.5, 1, 0.8], '#f0c890', { em: 0.6 }));
      if (k === 0) {
        // the one with a horn hung at his neck, that once blew loud enough to drown out thunder
        const horn = mesh(node, 'cone', [7, 63, 8.2], [3, 10, 3], '#d2bd92');
        horn.r = [0.4, 0, 2.5];
        K.beam(node, [-5, 71, 3], [6.5, 60, 8], 0.5, '#4a3a2a');
      }
      // the chain: links laid along a helix, five turns from the neck to the waist
      const C = this.chain || (this.chain = this.stat('lowCyl', { capacity: 600 }));
      const turns = 5,
        segs = 130,
        ca = Math.cos(a),
        sa = Math.sin(a),
        at = u => {
          const ang = u * turns * TAU,
            rr = 13.6 - u * 3.2,
            lx = Math.sin(ang) * rr,
            lz = Math.cos(ang) * rr * 0.66;
          return [x + lx * ca + lz * sa, ICE_Y + 69.5 - u * 27, z - lx * sa + lz * ca];
        };
      for (let j = 0; j < segs; j++) {
        const A = at(j / segs),
          B = at((j + 1) / segs),
          d = M.sub(B, A),
          L = M.len(d),
          w = j % 2 ? 1.25 : 1.6;
        this.put(C, M.mul(M.add(A, B), 0.5), [Math.acos(M.clamp(d[1] / L, -1, 1)), Math.atan2(d[0], d[2]), 0], [w, L * 1.15, w], j % 2 ? '#2a2523' : '#3a3330', 0.05, 0);
      }
      this.addDemon({ i, cls: 'giant', label: k === 0 ? '거인 · 뿔나팔을 목에 건' : '거인 · 사슬에 묶임', hp: 1200, node, head, eyes, radius: 14, hy: 60, fixed: true, fixedNote: '사슬에 묶여 있습니다.', k, a });
    }
    // on the walls of Dis, the angels who fell with him; and with them, any that fell from the city of gold
    makeFallen(i, k, n) {
      const t = -1.05 + (2.1 * (k + 0.5)) / n,
        x = Math.sin(t) * WALL_R,
        z = Math.cos(t) * WALL_R,
        node = group(this.root, [x, -131 + 33.6, z]);
      node.r[1] = t;
      const f = this.figure(node, { h: 3.1, body: '#2a2628', robe: '#1e1b1d', skin: '#9a948e', eye: '#ff5a2a' });
      const wings = [];
      for (const sd of [-1, 1]) {
        const w = group(node, [sd * 0.4, 2.3, -0.3]);
        for (let j = 0; j < 6; j++) {
          const q = j / 5,
            fe = group(w);
          fe.r[2] = sd * (0.5 - q * 1.4);
          mesh(fe, 'feather', [sd * (1.1 - q * 0.3), 0, 0], [2.2 - q * 0.8, 0.42, 0.12], j < 2 ? '#3c3836' : '#232022');
        }
        w.r[1] = sd * 0.5;
        wings.push(w);
      }
      const seg = Math.round(((t + TAU) % TAU) / TAU * 24) % 24;
      this.addDemon({ i, cls: 'fallen', label: '타락한 천사', hp: 80, node, f, wings, radius: 1.6, hy: 1.8, seg, t, fromHeaven: k >= 8 });
    }
    /* ---------- the damned, circle by circle ---------- */
    residentSpec() {
      return {
        species: 'damned',
        exact: true,
        deathless: true,
        mode: 'beg',
        quiet: true,
        seed: 1919,
        center: [0, 0],
        radius: 590,
        occupancy: () => 0,
        slots: () => this.soulSlots(),
        init: (r, sl) => this.initSoul(r, sl),
        think: (r, dt, t, ship, R) => this.soulThink(r, dt, t, ship, R),
        pose: (r, Q, t, ship) => this.soulPose(r, Q, t, ship),
        clamp: (p, r) => this.clampSoul(p, r),
        mendY: r => this.height(r.p[0], r.p[2]),
        broken: r => this.soulBroken(r),
        mended: r => this.soulMended(r),
        lifted: r => this.soulLifted(r),
      };
    }
    soulSlots() {
      const rng = M.rand(1919),
        out = [];
      const polar = (R, a, extra) => Object.assign({ x: Math.sin(a) * R, z: Math.cos(a) * R, a, R }, extra);
      const add = (ring, n, gen) => {
        const list = [];
        for (let k = 0; k < n; k++) list.push(Object.assign(gen(k), { ring, k }));
        out.push(...list.slice(0, Math.max(0, n - (this.liftedBy[ring] || 0))));
      };
      const castle = [Math.sin(-0.9) * 449, Math.cos(-0.9) * 449];
      add('v', 46, () => polar(540 + rng() * 34, (rng() - 0.5) * 0.14));
      add('s', 38, () => polar(507 + rng() * 9, (rng() - 0.5) * 0.6));
      add('n', this.newcomers, () => polar(507 + rng() * 8, (rng() - 0.5) * 0.46, { sp: 'saved' }));
      add('l', 30, () => {
        for (let g = 0; g < 30; g++) {
          const s = polar(432 + rng() * 34, -0.9 + (rng() - 0.5) * 1.1);
          if (Math.hypot(s.x - castle[0], s.z - castle[1]) > 37) return s;
        }
        return polar(432, -0.2);
      });
      add('w', 72, k => polar(374 + rng() * 34, (k / 72) * TAU + rng() * 0.05));
      add('g', 52, () => {
        for (let g = 0; g < 30; g++) {
          const s = polar(332 + rng() * 22, rng() * TAU);
          if (Math.abs(((s.a + 0.42 + Math.PI) % TAU) - Math.PI) > 0.05) return s;
        }
        return polar(340, 1);
      });
      add('a', 48, () => polar(304, 0));
      add('y', 46, k => {
        if (k % 2) return polar(this.pairBase.R + 1.4, this.pairBase.a + 0.004);
        this.pairBase = polar(259 + rng() * 18, rng() * TAU);
        return this.pairBase;
      });
      add('h', 48, k => polar(Math.hypot(this.tombs[k * 3].x, this.tombs[k * 3].z), Math.atan2(this.tombs[k * 3].x, this.tombs[k * 3].z)));
      add('b', 42, () => polar(192 + rng() * 11, rng() * TAU));
      add('d', 54, () => polar(162 + rng() * 20, rng() * TAU));
      add('p', 30, () => polar(PITCH.r + (rng() - 0.5) * 4.2, rng() * TAU));
      add('c', 22, k => polar(123.5 + ((k % 3) - 1) * 1.3, (k / 22) * TAU, { sp: 'hypocrite' }));
      add('i', 58, () => {
        for (let g = 0; g < 40; g++) {
          const s = polar(26 + Math.sqrt(rng()) * 60, rng() * TAU);
          if (s.R > 28) return s;
        }
        return polar(60, 0);
      });
      return out;
    }
    initSoul(r, sl) {
      r.ring = r.ring0 = sl.ring === 'n' ? 's' : sl.ring;
      r.circ = sl.ring;
      r.home = [sl.x, sl.z];
      r.home0 = [sl.x, sl.z];
      r.k = sl.k;
      r.beg = true;
      r.label = sl.ring === 'n' ? '흰옷 입은 사람 · Q 견인' : r.sp.key === 'hypocrite' ? '납 외투를 입은 망자 · Q 견인' : '망자 · Q 견인';
      r.bound = BOUND.has(r.ring);
      r.state = 'torment';
      r.var = hh(sl.k * 31 + 7, sl.ring.charCodeAt(0));
      if (r.ring === 'w') {
        // blown round in flocks, tumbling over one another; some go round two together, never apart
        const k = sl.k % 9 === 8 ? sl.k - 1 : sl.k,
          flock = k % 3,
          o = (r.orb = {
            flock,
            dth: (hh(k, 1) - 0.5) * 0.09,
            dR: (hh(k, 2) - 0.5) * 10,
            dy: (hh(k, 3) - 0.5) * 12,
            rr: 3 + hh(k, 4) * 7,
            w2: 0.8 + hh(k, 7) * 0.9,
            ph: hh(k, 5) * TAU,
            spin: (hh(k, 6) - 0.5) * 2.4,
          });
        if (k !== sl.k) {
          o.dth += 0.004;
          o.dy += 1.1;
          o.pair = true;
        }
      } else if (r.ring === 'a') {
        r.boulder = Math.floor(sl.k / 6);
        r.pslot = sl.k % 6;
      } else if (r.ring === 'y') {
        r.pair = Math.floor(sl.k / 2);
        r.sullen = sl.k >= 34;
        ((this.pairs ||= {})[r.pair] ||= []).push(r);
      } else if (r.ring === 'h') r.tomb = this.tombs[sl.k * 3];
      else if (r.ring === 'b') {
        r.depth = 0.5 + hh(sl.k, 7) * 0.42;
        r.rise = 0;
      } else if (r.ring === 'd') r.kind = sl.k % 3;
      else if (r.ring === 'p') {
        r.dive = hh(sl.k, 8) * 8;
        r.up = 0;
        r.hook = 0;
      } else if (r.ring === 'c') r.ca = sl.a;
      else if (r.ring === 'i') r.frozen = hh(sl.k, 9) < 0.72 ? 0 : 1;
      if (r.ring === 'h' || r.ring === 'i' || r.ring === 'p') r.yaw = r.ring === 'h' ? r.tomb.yaw : hh(sl.k, 10) * TAU;
      if (r.ring === 's') r.yaw = Math.atan2(-sl.x, -sl.z) + (r.var - 0.5) * 0.8;
      this.placeSoul(r);
    }
    // where the punishment holds them
    placeSoul(r) {
      const H = (DIMS.hipY + DIMS.neckY) * r.scale;
      switch (r.ring) {
        case 'h':
          r.p[0] = r.tomb.x;
          r.p[2] = r.tomb.z;
          r.p[1] = r.tomb.y + 0.28;
          break;
        case 'i':
          r.p[0] = r.home[0];
          r.p[2] = r.home[1];
          r.p[1] = r.frozen ? ICE_BED + 2.2 + r.var * 3 : ICE_Y - H * 0.985;
          break;
        default:
          r.p[0] = r.home[0];
          r.p[2] = r.home[1];
          r.p[1] = this.height(r.p[0], r.p[2]);
      }
    }
    zoneOf(R) {
      let best = null,
        bd = 1e9;
      for (const k of ['v', 's', 'l', 'w', 'g', 'a', 'y', 'h', 'b', 'd', 'p', 'c', 'i']) {
        const c = CIRCLES[k],
          d = R < c.r0 ? c.r0 - R : R > c.r1 ? R - c.r1 : 0;
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      return best;
    }
    // the wall above each circle: where they go once the wings have stopped
    wallOf(ring) {
      return { v: 600, s: 518, l: 470, w: 413, g: 357, a: 317, y: 281, h: 243, b: 205, d: 205, p: 134, c: 125.5, i: 88 }[ring] || 600;
    }
    clampSoul(p, r) {
      if (!r || !r.ring) return;
      const c = CIRCLES[r.ring];
      if (!c) return;
      const lo = c.r0,
        hi = this.stilled && r.state === 'climb' ? this.wallOf(r.ring) - 0.5 : r.ring === 'd' && this.stilled ? 204.5 : c.r1;
      const R = Math.hypot(p[0], p[2]) || 1;
      if (R < lo) {
        p[0] *= lo / R;
        p[2] *= lo / R;
      } else if (R > hi) {
        p[0] *= hi / R;
        p[2] *= hi / R;
      }
      if (r.ring === 'l' && this.castle?.alive) {
        const cx = this.castle.p[0],
          cz = this.castle.p[2],
          dx = p[0] - cx,
          dz = p[2] - cz,
          d = Math.hypot(dx, dz);
        if (d < 31 && d > 0.01) {
          p[0] = cx + (dx / d) * 31;
          p[2] = cz + (dz / d) * 31;
        }
      }
    }
    attach(e, ship) {
      super.attach(e, ship);
      // taken out of the punishment by the beam: until it puts them back together, they are loose
      if (e.res && !e.loose) {
        e.loose = true;
        e.bound = false;
      }
    }
    soulThink(r, dt, t, ship, R) {
      const sp = ship.p,
        dx = sp[0] - r.p[0],
        dz = sp[2] - r.p[2],
        ds = Math.hypot(dx, dz),
        dy = sp[1] - r.p[1];
      const near = (r.near = ds < 60 && dy > -8 && dy < 95);
      if (r.voiceT <= 0 && Math.random() < dt * 0.5) {
        r.voiceT = 3 + Math.random() * 6;
        if (ds < 150) R.say(r, near ? 'plea' : Math.random() < 0.5 ? 'sob' : 'cry', 0.95);
      }
      if (this.stilled && r.ring !== 'i' && r.ring !== 'p' && r.ring !== 'c') return this.climb(r, dt, t, R, ds);
      if (r.loose) {
        const z = this.zoneOf(Math.hypot(r.p[0], r.p[2]));
        if (z && z !== r.ring) {
          r.ring = z;
          r.home = [r.p[0], r.p[2]];
        }
        if (near) {
          if (r.state !== 'beg') R.begin(r, 'beg');
          return false;
        }
        if (r.state === 'beg') r.state = 'torment';
        R.wander(r, dt);
        return true;
      }
      const free = r.ring === 'v' || r.ring === 's' || r.ring === 'l' || (r.ring === 'd' && r.kind > 0);
      if (free && near) {
        if (r.state !== 'beg') R.begin(r, 'beg');
        return false;
      }
      if (r.state === 'beg') r.state = 'torment';
      const H = (DIMS.hipY + DIMS.neckY) * r.scale;
      switch (r.ring) {
        case 'v': {
          // after the banner, forever
          const b = this.bannerP,
            a = t * 0.11 + r.var * TAU,
            ox = Math.sin(a) * (4 + r.var * 12),
            oz = Math.cos(a) * (4 + r.var * 12);
          R.move(r, b[0] + ox - r.p[0], b[2] + oz - r.p[2], r.sp.run * 0.82 * r.speedK, dt, 5);
          return true;
        }
        case 's':
        case 'l': {
          const hx = r.home[0] - r.p[0],
            hz = r.home[1] - r.p[2];
          if (Math.hypot(hx, hz) > 1.6) R.move(r, hx, hz, r.sp.walk * r.speedK, dt, 3);
          else {
            r.speed = M.damp(r.speed, 0, 6, dt);
            if (r.ring === 's') R.face(r, 0, 0, dt, 0.8);
            else R.face(r, this.castle.p[0], this.castle.p[2], dt, 0.5);
          }
          return true;
        }
        case 'w': {
          // each flock rolls over and over as it goes round: bodies looping through the air
          const o = r.orb,
            T = this.game.time,
            phi = T * o.w2 + o.ph,
            th = this.flockAt(o.flock, T) + o.dth,
            RR = 391 + o.dR + Math.cos(phi) * o.rr,
            y = CIRCLES.w.y + 20 + o.dy + Math.sin(phi) * o.rr * 0.85,
            x = Math.sin(th) * RR,
            z = Math.cos(th) * RR;
          o.th = th;
          if (r.lift > 0) {
            // put back together on the ground, and the wind takes them up again
            r.lift -= dt;
            const k = ss(0, 1, 1 - r.lift / 2.6);
            r.p[0] += (x - r.p[0]) * k * 0.2;
            r.p[2] += (z - r.p[2]) * k * 0.2;
            r.p[1] += (y - r.p[1]) * k * 0.2;
          } else {
            r.p[0] = x;
            r.p[2] = z;
            r.p[1] = y;
          }
          r.yaw = th + Math.PI / 2;
          r.speed = 0;
          return true;
        }
        case 'g':
          r.speed = 0;
          r.p[1] = this.height(r.p[0], r.p[2]);
          return true;
        case 'a': {
          const b = this.boulders[r.boulder];
          if (!b) return true;
          const ang = b.th - (b.dir * (4.2 + (r.pslot % 2) * 1.5)) / b.R,
            rad = b.R + (Math.floor(r.pslot / 2) - 1) * 1.7,
            tx = Math.sin(ang) * rad,
            tz = Math.cos(ang) * rad,
            gx = tx - r.p[0],
            gz = tz - r.p[2],
            d = Math.hypot(gx, gz);
          if (d > 0.3) R.move(r, gx, gz, Math.min(r.sp.run, d * 2.5 + 0.8), dt, 4);
          else r.speed = M.damp(r.speed, 0, 5, dt);
          R.face(r, b.node.p[0], b.node.p[2], dt, 6);
          return true;
        }
        case 'y': {
          const pr = this.pairs?.[r.pair],
            o = pr && (pr[0] === r ? pr[1] : pr[0]);
          r.p[0] = r.home[0] + Math.sin(t * 0.5 + r.var * 6) * 0.6;
          r.p[2] = r.home[1] + Math.cos(t * 0.43 + r.var * 6) * 0.6;
          r.p[1] = STYX.water - (r.sullen ? 1.03 : 0.62) * H;
          if (o && o.alive) R.face(r, o.p[0], o.p[2], dt, 5);
          r.speed = 0;
          return true;
        }
        case 'h':
          r.speed = 0;
          return true;
        case 'b': {
          const want = near && this.centaursAlive() ? 0.25 : near ? 0.45 : 0;
          r.rise = M.damp(r.rise, want, 1.2, dt);
          r.p[1] = BLOOD.surface - (r.depth - r.rise * 0.6) * H * 1.18;
          r.speed = 0;
          return true;
        }
        case 'd': {
          if (r.kind === 2) {
            const a = t * 0.32 * (r.var > 0.5 ? 1 : -1) + r.var * TAU,
              tx = r.home[0] + Math.sin(a) * 9,
              tz = r.home[1] + Math.cos(a) * 9;
            R.move(r, tx - r.p[0], tz - r.p[2], r.sp.run * 0.75, dt, 4);
          } else r.speed = 0;
          return true;
        }
        case 'p': {
          r.hook = Math.max(0, r.hook - dt);
          if (r.hook > 0) {
            r.p[1] = M.damp(r.p[1], PITCH.surface + 1.2, 6, dt);
            return true;
          }
          r.dive -= dt;
          if (near && r.up <= 0 && Math.random() < dt * 0.6) r.dive = 0;
          if (r.dive <= 0) {
            r.up = 1.4 + Math.random() * 1.2;
            r.dive = 5 + Math.random() * 8;
          }
          r.up = Math.max(0, r.up - dt);
          const k = r.up > 0 ? Math.sin(Math.min(1, r.up / 1.4) * Math.PI) : 0;
          r.p[1] = PITCH.surface - (1.05 - k * 0.75) * H;
          r.speed = 0;
          return true;
        }
        case 'c': {
          r.ca += dt * 0.0032;
          const rad = 123.5 + ((r.k % 3) - 1) * 1.3,
            x = Math.sin(r.ca) * rad,
            z = Math.cos(r.ca) * rad;
          r.p[0] = x;
          r.p[2] = z;
          r.p[1] = this.height(x, z);
          r.yaw = r.ca + Math.PI / 2;
          r.speed = 0.3;
          r.phase += dt * 0.9;
          return true;
        }
        case 'i':
          r.speed = 0;
          return true;
      }
      return false;
    }
    // once the wings have stopped: out of every punishment that lets go, up to the wall of the circle, and trying to climb it
    climb(r, dt, t, R, ds) {
      if (r.ring === 'w' && !r.thrown && r.p[1] > this.height(r.p[0], r.p[2]) + 0.6) {
        r.thrown = true;
        r.state = 'thrown';
        r.velocity = [0, -2, 0];
        r.deathOnLand = false;
        return true;
      }
      if (r.ring === 'h' && !r.outOfTomb) {
        r.outOfTomb = true;
        r.p[0] += Math.sin(r.tomb.yaw + Math.PI / 2) * 1.5;
        r.p[2] += Math.cos(r.tomb.yaw + Math.PI / 2) * 1.5;
      }
      const wall = this.wallOf(r.ring) - 1.2,
        Rn = Math.hypot(r.p[0], r.p[2]) || 1;
      if (r.ring === 'v' || r.ring === 's') {
        r.state = 'climb';
        r.speed = M.damp(r.speed, 0, 4, dt);
        return true;
      }
      if (Rn < wall - 1) {
        R.move(r, r.p[0] / Rn, r.p[2] / Rn, r.sp.jog * r.speedK, dt, 4);
        if (r.state !== 'climb') r.state = 'torment';
      } else {
        r.state = 'climb';
        r.speed = M.damp(r.speed, 0, 6, dt);
        r.yaw += M.angle(r.yaw, Math.atan2(r.p[0], r.p[2])) * Math.min(1, dt * 4);
        r.p[1] = this.height(r.p[0], r.p[2]);
      }
      return true;
    }
    soulPose(r, Q, t, ship) {
      const s = r.seed,
        sp = r.sp,
        L = sp.dims.legLen,
        ph = r.phase;
      const look = (k = 1) => {
        const dx = ship[0] - r.p[0],
          dz = ship[2] - r.p[2],
          rel = M.angle(r.yaw, Math.atan2(dx, dz)),
          up = Math.atan2(ship[1] - r.p[1] - 2, Math.hypot(dx, dz) || 1);
        Q.hdy = M.clamp(rel, -1.1, 1.1) * k;
        Q.hdp = -M.clamp(up, -0.2, 1.2) * k;
      };
      const reach = () => {
        Q.aLz = 2.55 + Math.sin(t * 9 + s) * 0.4;
        Q.aRz = 2.55 + Math.sin(t * 9 + s + 2.2) * 0.4;
        Q.eL = Q.eR = 0.25;
        Q.mouth = Math.max(Q.mouth, 0.45);
        look();
      };
      if (r.state === 'climb') {
        // against the rock: arms up, clawing, jumping, falling back
        Q.aLz = 2.75 + Math.sin(t * 5 + s) * 0.25;
        Q.aRz = 2.75 + Math.sin(t * 5 + s + 1.7) * 0.25;
        Q.aLx = Q.aRx = -0.35;
        Q.eL = Q.eR = 0.4 + Math.abs(Math.sin(t * 4 + s)) * 0.6;
        Q.bob = Math.max(0, Math.sin(t * 2.6 + s)) * 0.45;
        Q.hdp = -0.85;
        Q.tp = -0.12;
        Q.mouth = Math.max(Q.mouth, 0.3);
        return true;
      }
      if (r.state === 'beg' || r.loose) return false;
      switch (r.ring) {
        case 'v': {
          // running, and swatting at what stings
          const a = Math.min(0.95, 0.2 + r.speed * 0.12);
          Q.lLx = Math.sin(ph) * a;
          Q.lRx = -Math.sin(ph) * a;
          Q.bob = Math.abs(Math.cos(ph)) * 0.12;
          Q.tp = 0.18;
          Q.aLz = 1.4 + Math.sin(t * 11 + s) * 0.9;
          Q.aRz = 1.4 + Math.sin(t * 13 + s + 1) * 0.9;
          Q.aLx = Math.sin(t * 9 + s) * 0.8;
          Q.aRx = Math.cos(t * 10 + s) * 0.8;
          Q.eL = Q.eR = 1.2;
          Q.hdy = Math.sin(t * 4 + s) * 0.5;
          return true;
        }
        case 's': {
          if (r.sp.key === 'saved') {
            // just come down, still in white: looking about, hands together
            Q.hdy = Math.sin(t * 0.7 + s) * 1.0;
            Q.hdp = Math.sin(t * 0.4 + s) * 0.25;
            Q.aLx = Q.aRx = -0.95;
            Q.aLz = Q.aRz = -0.3;
            Q.eL = Q.eR = 1.6;
          } else {
            Q.hdp = 0.45 + Math.sin(t * 0.5 + s) * 0.08;
            Q.tp = 0.12;
            Q.aLz = Q.aRz = 0.06;
            if (r.var > 0.6) {
              Q.aLx = Q.aRx = -2.3;
              Q.eL = Q.eR = 2.2;
              Q.hdp = 0.7;
            }
          }
          return true;
        }
        case 'l':
          // sitting in the grass, sighing
          Q.bob = -L * 0.92;
          Q.lLx = Q.lRx = -1.45;
          Q.tp = 0.32;
          Q.hdp = r.near ? 0 : 0.42;
          Q.aLx = Q.aRx = -0.85;
          Q.eL = Q.eR = 0.7;
          if (r.near) look(0.8);
          return true;
        case 'w':
          Q.rp = 1.25 + Math.sin(t * 1.7 + s) * 0.35;
          Q.rr = t * r.orb.spin + s;
          Q.aLz = Q.aRz = 1.35 + Math.sin(t * 3 + s) * 0.45;
          Q.lLx = Math.sin(t * 2.2 + s) * 0.35;
          Q.lRx = -Math.sin(t * 2.2 + s) * 0.35;
          Q.lLz = Q.lRz = 0.25;
          Q.mouth = 0.5 + Math.sin(t * 7 + s) * 0.3;
          if (r.near) {
            Q.aLx = Q.aRx = -2.6;
            Q.aLz = Q.aRz = 0.3;
          }
          return true;
        case 'g': {
          if (r.near) {
            Q.bob = -L * 0.5;
            Q.lLx = Q.lRx = -1.35;
            reach();
            return true;
          }
          const up = r.var < 0.5;
          Q.rp = up ? -1.5 : 1.47;
          Q.lift = 0.36;
          Q.rr = Math.sin(t * 0.6 + s) * 0.12;
          Q.aLz = 0.6 + Math.sin(t * 0.9 + s) * 0.4;
          Q.aRz = 0.7 + Math.sin(t * 0.8 + s + 1) * 0.4;
          Q.aLx = Math.sin(t * 0.5 + s) * 0.6;
          Q.lLx = Math.sin(t * 0.7 + s) * 0.25;
          Q.mouth = 0.3 + Math.sin(t * 2 + s) * 0.2;
          return true;
        }
        case 'a':
          Q.tp = 0.78;
          Q.aLx = Q.aRx = -1.45;
          Q.eL = Q.eR = 0.35;
          Q.lLx = Math.sin(ph) * 0.6;
          Q.lRx = -Math.sin(ph) * 0.6;
          Q.bob = -0.12;
          Q.hdp = -0.35;
          Q.mouth = 0.35 + Math.sin(t * 3 + s) * 0.25;
          if (r.near && r.var > 0.6) {
            Q.aRz = 2.6;
            Q.aRx = -0.3;
            look(0.7);
          }
          return true;
        case 'y':
          if (r.sullen) {
            Q.hdp = 0.2;
            Q.mouth = 0.2 + Math.abs(Math.sin(t * 6 + s)) * 0.5;
            if (r.near) reach();
            return true;
          }
          if (r.near) {
            reach();
            return true;
          }
          Q.aLx = -1.4 + Math.sin(t * 8 + s) * 0.95;
          Q.aRx = -1.4 + Math.sin(t * 8 + s + Math.PI) * 0.95;
          Q.eL = 0.9 + Math.sin(t * 8 + s) * 0.6;
          Q.eR = 0.9 - Math.sin(t * 8 + s) * 0.6;
          Q.tp = 0.25 + Math.sin(t * 4 + s) * 0.12;
          Q.hdp = 0.2 + Math.sin(t * 8 + s + 1) * 0.2;
          Q.mouth = 0.7;
          return true;
        case 'h':
          if (r.near) {
            Q.bob = -L * 0.82;
            Q.lLx = Q.lRx = -1.45;
            Q.tp = -0.15;
            reach();
            return true;
          }
          Q.rp = -1.5;
          Q.lift = 0.36;
          Q.aLz = Q.aRz = 0.2 + Math.abs(Math.sin(t * 1.3 + s)) * 0.5;
          Q.aLx = Q.aRx = -0.4 + Math.sin(t * 1.7 + s) * 0.4;
          Q.mouth = 0.5 + Math.sin(t * 4 + s) * 0.3;
          return true;
        case 'b':
          if (r.near) {
            reach();
            return true;
          }
          Q.aLx = Q.aRx = -2.2 + Math.sin(t * 5 + s) * 0.3;
          Q.eL = Q.eR = 2.0;
          Q.aLz = Q.aRz = 0.35 + Math.sin(t * 7 + s) * 0.2;
          Q.hdp = -0.4;
          Q.mouth = 0.85;
          return true;
        case 'd': {
          const sw = Math.sin(t * 7 + s);
          if (r.kind === 0) {
            if (r.near) {
              Q.bob = -L * 0.82;
              Q.lLx = Q.lRx = -1.45;
              reach();
              return true;
            }
            Q.rp = -1.5;
            Q.lift = 0.36;
            Q.aLz = 1.2 + sw * 0.9;
            Q.aRz = 1.2 - sw * 0.9;
            Q.aLx = -1.2 + Math.cos(t * 6 + s) * 0.6;
            Q.aRx = -1.2 - Math.cos(t * 6 + s) * 0.6;
            Q.lLx = Math.sin(t * 3 + s) * 0.3;
          } else if (r.kind === 1) {
            Q.bob = -L * 0.6;
            Q.lLx = Q.lRx = -1.95;
            Q.tp = 0.5;
            Q.aLx = -1.5 + sw * 1.1;
            Q.aRx = -1.5 - sw * 1.1;
            Q.eL = Q.eR = 1.4;
            Q.hdp = 0.3;
          } else {
            const a = 0.85;
            Q.lLx = Math.sin(ph) * a;
            Q.lRx = -Math.sin(ph) * a;
            Q.bob = Math.abs(Math.cos(ph)) * 0.14;
            Q.tp = 0.25;
            Q.aLz = 2.2 + sw * 0.5;
            Q.aRz = 2.2 - sw * 0.5;
            Q.eL = Q.eR = 1.3;
          }
          Q.mouth = 0.6 + sw * 0.3;
          return true;
        }
        case 'p':
          if (r.hook > 0) {
            Q.rp = Math.sin(t * 2.1 + s) * 0.6;
            Q.lLx = Math.sin(t * 13 + s) * 0.9;
            Q.lRx = Math.sin(t * 13 + s + 2.4) * 0.9;
            Q.aLz = 1.3 + Math.sin(t * 11 + s) * 0.9;
            Q.aRz = 1.3 + Math.sin(t * 12 + s + 1) * 0.9;
            Q.mouth = 1;
            return true;
          }
          if (r.near) {
            reach();
            return true;
          }
          Q.rp = -0.35 + Math.sin(t * 1.4 + s) * 0.5;
          Q.aLz = Q.aRz = 1.2;
          Q.mouth = 0.7;
          return true;
        case 'c':
          Q.lLx = Math.sin(r.phase) * 0.18;
          Q.lRx = -Math.sin(r.phase) * 0.18;
          Q.tp = 0.32;
          Q.hdp = r.near ? 0.05 : 0.62;
          Q.aLz = Q.aRz = 0.05;
          Q.aLx = Q.aRx = -0.25;
          Q.eL = Q.eR = 0.6;
          return true;
        case 'i':
          if (r.frozen) {
            Q.rp = r.var > 0.5 ? -1.45 : 1.45;
            Q.rr = r.var * 2;
            Q.aLz = 0.4 + r.var;
            Q.aRz = 1.4 - r.var;
            Q.lLz = Q.lRz = 0.3;
            Q.mouth = 0.6;
            return true;
          }
          Q.aLz = Q.aRz = 0.04;
          Q.hdp = r.near ? -0.55 : 0.58;
          Q.hdy = r.near ? 0 : (r.var - 0.5) * 0.8;
          Q.mouth = 0.15 + Math.abs(Math.sin(t * 22 + s)) * 0.22;
          return true;
      }
      return false;
    }
    // where each flock of the storm has got to: they go round the circle at different speeds
    flockAt(f, t) {
      return f * 2.094 + t * this.flockSpeed(f);
    }
    flockSpeed(f) {
      return 0.05 + f * 0.012;
    }
    soulBroken(r) {
      this.breaks++;
      if (!this.told.broken) {
        this.told.broken = true;
        this.later(1.2, () => this.game.ui.toast('부서진 몸이 다시 붙습니다', '여기서는 아무도 죽지 않습니다. 조각들이 다시 기어 모입니다.', 6));
      }
    }
    soulMended(r) {
      r.loose = false;
      r.ring = r.ring0;
      r.home = r.home0.slice();
      r.bound = BOUND.has(r.ring);
      r.state = 'torment';
      r.outOfTomb = false;
      if (this.stilled) return;
      if (r.ring === 'w') r.lift = 2.6;
      else if (r.bound) this.placeSoul(r);
    }
    soulLifted(r) {
      const k = r.circ || r.ring0;
      if (k) this.liftedBy[k] = (this.liftedBy[k] || 0) + 1;
    }
    centaursAlive() {
      return this.demons.some(d => d.cls === 'centaur' && d.alive);
    }
    /* ---------- rain, fire, ash, frost ---------- */
    makeScenery() {
      const rng = M.rand(777);
      // the third circle: cold heavy rain that never stops
      const rain = this.stat('box', { capacity: 1000, transparent: true });
      for (let i = 0; i < 1000; i++) {
        const R = 329 + rng() * 28,
          a = rng() * TAU;
        this.put(rain, [Math.sin(a) * R, CIRCLES.g.y + 38, Math.cos(a) * R], [0, 0, 0], [0.05, 1.8, 0.05], '#b3c2cf', 0.2, 30, 38, 8 + rng(), 0.5);
      }
      // the second circle: grit and smoke carried round and round by the wind that never drops
      // most of it travels with the flocks: each flock goes round in a cloud of its own grit
      this.streaks = this.stat('box', { capacity: 900, transparent: true });
      const dust = this.stat('lowSphere', { capacity: 80, transparent: true });
      for (let i = 0; i < 900; i++) {
        const f = i % 3,
          own = i < 720,
          R = own ? 391 + (rng() - 0.5) * 30 : 372 + rng() * 40,
          a = own ? f * 2.094 + (rng() - 0.5) * 0.15 : rng() * TAU,
          y = own ? CIRCLES.w.y + 20 + (rng() - 0.5) * 30 : CIRCLES.w.y + 1.5 + Math.pow(rng(), 1.4) * 30;
        this.put(this.streaks, [Math.sin(a) * R, y, Math.cos(a) * R], [0, a + Math.PI / 2, (rng() - 0.5) * 0.5], [0.07, 0.07, 1.5 + rng() * 3.5], '#b08a70', 0.08, 32, own ? this.flockSpeed(f) : 0.07 + rng() * 0.05, 0, own ? 0.3 : 0.18);
      }
      for (let i = 0; i < 78; i++) {
        const f = i % 3,
          R = 391 + (rng() - 0.5) * 20,
          a = f * 2.094 + (rng() - 0.5) * 0.12,
          s = 8 + rng() * 10;
        this.put(dust, [Math.sin(a) * R, CIRCLES.w.y + 20 + (rng() - 0.5) * 22, Math.cos(a) * R], [0, rng() * 6, 0], [s, s * 0.6, s], '#7a5a48', 0, 32, this.flockSpeed(f), 0, 0.07);
      }
      // the burning sand: flakes of fire coming down slowly, like snow in the mountains when there is no wind
      this.fireRain = this.stat('tinySphere', { capacity: 800, transparent: true });
      for (let i = 0; i < 800; i++) {
        const R = 157 + rng() * 30,
          a = rng() * TAU;
        this.put(this.fireRain, [Math.sin(a) * R, -190 + 74, Math.cos(a) * R], [0, rng() * 6, 0], [0.55, 0.8, 0.55], '#ff8f2e', 2.3, 30, 74, 2 + rng(), 0.95);
      }
      // sparks going up off the river of blood and from among the tombs; steam off the blood
      const sparks = this.stat('tinySphere', { capacity: 360, transparent: true });
      for (let i = 0; i < 360; i++) {
        const tombs = i % 3 === 0,
          R = tombs ? 218 + rng() * 25 : 189 + rng() * 17,
          a = rng() * TAU,
          y = tombs ? -132 : BLOOD.surface;
        this.put(sparks, [Math.sin(a) * R, y + 1, Math.cos(a) * R], [0, 0, 0], [0.22, 0.22, 0.22], '#ffb35c', 2.6, 30, -34, 1 + rng() * 1.5, 1);
      }
      const steam = this.stat('lowSphere', { capacity: 100, transparent: true });
      for (let i = 0; i < 100; i++) {
        const R = 190 + rng() * 15,
          a = rng() * TAU;
        this.put(steam, [Math.sin(a) * R, BLOOD.surface + 1, Math.cos(a) * R], [0, 0, 0], [6, 2, 6], '#8a5450', 0.05, 30, -16, 1 + rng(), 0.08);
      }
      // ash over the plain outside; snow on the frozen lake
      const ash = this.stat('box', { capacity: 500, transparent: true });
      for (let i = 0; i < 500; i++) {
        const R = 505 + rng() * 230,
          a = rng() * TAU;
        this.put(ash, [Math.sin(a) * R, 62, Math.cos(a) * R], [rng(), rng() * 6, 0], [0.3, 0.08, 0.3], '#6a625c', 0, 30, 64, 1.4 + rng() * 0.5, 0.8);
      }
      this.snow = this.stat('tinySphere', { capacity: 500, transparent: true });
      for (let i = 0; i < 500; i++) {
        const R = Math.sqrt(rng()) * 100,
          a = rng() * TAU;
        this.put(this.snow, [Math.sin(a) * R, ICE_Y + 95, Math.cos(a) * R], [0, 0, 0], [0.32, 0.32, 0.32], '#e8f4ff', 0.4, 30, 96, 1.6 + rng() * 0.6, 0.9);
      }
      // what stings the ones who never chose; the frost blown off the wings
      this.wasps = this.game.engine.makeBatch('tinySphere', { capacity: 120 });
      this.frost = this.game.engine.makeBatch('tinySphere', { capacity: 180, transparent: true });
      this.residents.all.push(this.wasps, this.frost);
      this.puffs = [];
      this.vest = [];
      this.vestClock = 0;
    }
    updateSwarm(dt, ship) {
      const e = this.game.engine,
        t = this.time;
      this.vestClock -= dt;
      if (this.vestClock <= 0) {
        this.vestClock = 2;
        this.vest = this.residents.list.filter(r => r.alive && r.ring === 'v');
      }
      const W = this.wasps;
      W.count = 0;
      if (this.vest.length && Math.hypot(ship[0], ship[2] - 560) < 360) {
        const n = Math.min(110, this.vest.length * 3),
          d = e.growBatch(W, n);
        for (let i = 0; i < n; i++) {
          const r = this.vest[i % this.vest.length];
          if (!r.alive) continue;
          const o = W.count * 24,
            a = t * (7 + (i % 5)) + i * 2.3;
          trs(d, o, r.p[0] + Math.sin(a) * (0.7 + (i % 3) * 0.3), r.p[1] + 2.1 + Math.sin(t * 13 + i) * 0.5, r.p[2] + Math.cos(a * 1.1) * (0.7 + (i % 3) * 0.3), 0, a, 0, 0.13, 0.1, 0.2);
          d[o + 16] = 0.12;
          d[o + 17] = 0.09;
          d[o + 18] = 0.03;
          d[o + 19] = 1;
          d[o + 20] = 0;
          d[o + 21] = 0;
          d[o + 22] = 0;
          d[o + 23] = 0;
          W.count++;
        }
      }
      // frost: torn off the wings by every beat, blown outward across the lake
      const F = this.frost,
        close = Math.hypot(ship[0], ship[2]) < 420 && ship[1] < ICE_Y + 260;
      for (let q = 0; q < 3; q++)
      if (close && !this.stilled && this.puffs.length < 170 && Math.random() < dt * (10 + this.gust * 60)) {
        const a = Math.random() * TAU,
          R = 14 + Math.random() * 40;
        this.puffs.push({ p: [Math.sin(a) * R, ICE_Y + 4 + Math.random() * 36, Math.cos(a) * R], v: [Math.sin(a), 0, Math.cos(a)], life: 3, s: 0.25 + Math.random() * 0.5 });
      }
      F.count = 0;
      const d = e.growBatch(F, Math.max(1, this.puffs.length));
      for (let i = this.puffs.length - 1; i >= 0; i--) {
        const f = this.puffs[i];
        f.life -= dt;
        if (f.life <= 0 || !close) {
          this.puffs.splice(i, 1);
          continue;
        }
        const sp = 12 + this.gust * 55;
        f.p[0] += f.v[0] * sp * dt;
        f.p[2] += f.v[2] * sp * dt;
        f.p[1] += dt * 1.5;
      }
      for (const f of this.puffs) {
        const o = F.count * 24,
          s = f.s;
        trs(d, o, f.p[0], f.p[1], f.p[2], 0, 0, 0, s, s, s);
        d[o + 16] = 0.9;
        d[o + 17] = 0.95;
        d[o + 18] = 1;
        d[o + 19] = 0.75 * Math.sin(Math.min(1, f.life / 3) * Math.PI);
        d[o + 20] = 0.3;
        d[o + 21] = 0;
        d[o + 22] = 0;
        d[o + 23] = 0;
        F.count++;
      }
    }

    /* ---------- the ship among it all ---------- */
    where(p) {
      const cam = this.game.engine.camera,
        r = M.right(cam.yaw),
        dx = p[0] - cam.p[0],
        dy = p[1] - cam.p[1],
        dz = p[2] - cam.p[2],
        d = Math.hypot(dx, dy, dz) || 1;
      return [((dx * r[0] + dz * r[2]) / d) * 0.85, Math.pow(Math.max(0, 1 - d / 320), 1.3)];
    }
    toLocal(w, v) {
      const c = Math.cos(w.t),
        s = Math.sin(w.t);
      return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
    }
    rayWall(o, d, w) {
      const lo = this.toLocal(w, [o[0] - w.p[0], o[1] - w.p[1], o[2] - w.p[2]]),
        ld = this.toLocal(w, d),
        h = w.half;
      return M.rayBox(lo, ld, [-h[0], -h[1], -h[2]], [h[0], h[1], h[2]]);
    }
    raycast(origin, dir, max = 230) {
      const base = super.raycast(origin, dir, max);
      let dist = base ? base.distance : max,
        best = base ? base.entity : null;
      const hit = (cx, cy, cz, r) => {
        const px = origin[0] - cx,
          py = origin[1] - cy,
          pz = origin[2] - cz,
          b = px * dir[0] + py * dir[1] + pz * dir[2],
          c = px * px + py * py + pz * pz - r * r;
        if (c > 0 && b > 0) return Infinity;
        const h = b * b - c;
        return h < 0 ? Infinity : Math.max(0, -b - Math.sqrt(h));
      };
      const consider = (d, e) => {
        if (d < dist) {
          dist = d;
          best = e;
        }
      };
      for (const d of this.demons) {
        if (!d.alive || d.dying) continue;
        const p = d.node.p;
        if (d.cls === 'giant') {
          consider(hit(p[0], p[1] + 58, p[2], 15), d);
          consider(hit(p[0], p[1] + 78, p[2], 8), d);
          consider(hit(p[0], p[1] + 25, p[2], 11), d);
        } else consider(hit(p[0], p[1] + d.hy, p[2], d.radius + 0.6), d);
      }
      for (const w of this.walls) if (w.alive) consider(this.rayWall(origin, dir, w), w);
      for (const b of this.gateBoxes) consider(M.rayBox(origin, dir, b.min, b.max), this.gateEnt);
      for (const b of this.boulders) consider(hit(b.node.p[0], b.node.p[1], b.node.p[2], 3), b);
      consider(hit(0, ICE_Y + 3, 0, 18), this.lucifer);
      consider(hit(15.5, ICE_Y + 12.5, 0, 8), this.lucifer);
      consider(hit(-15.5, ICE_Y + 12.5, 0, 8), this.lucifer);
      return best ? { entity: best, distance: dist, point: M.add(origin, M.mul(dir, dist)) } : null;
    }
    damage(e, amount, dir, source) {
      if (!e || !Number.isFinite(amount) || amount <= 0) return;
      if (e.kind === 'demon') {
        if (!e.alive || e.dying) return;
        e.hp -= amount;
        e.flinch = 0.25;
        if (e.hp <= 0) this.killDemon(e, dir || [0, 1, 0]);
        return;
      }
      if (e.kind === 'wall') {
        if (!e.alive) return;
        e.hp -= amount;
        e.node.r[2] = Math.sin(this.time * 31) * 0.004;
        if (e.hp <= 0) this.breakWall(e);
        return;
      }
      if (e.kind === 'ruler' || e.kind === 'lucifer') {
        this.chipIce(amount * (e.kind === 'lucifer' ? 0.8 : 1));
        return;
      }
      if (e.kind === 'gate' || e.kind === 'boulder') return;
      super.damage(e, amount, dir, source);
    }
    shock(p, radius, force, opts) {
      super.shock(p, radius, force, opts);
      for (const d of this.demons) {
        if (!d.alive || d.dying) continue;
        const q = d.node.p,
          dd = Math.hypot(q[0] - p[0], q[1] + d.hy - p[1], q[2] - p[2]);
        if (dd < radius + d.radius) this.damage(d, force * Math.max(0.3, 1 - dd / (radius + d.radius)), M.norm(M.sub(q, p)), 'pulse');
      }
      for (const w of this.walls) {
        if (!w.alive) continue;
        const l = this.toLocal(w, [p[0] - w.p[0], p[1] - w.p[1], p[2] - w.p[2]]),
          h = w.half,
          dx = Math.max(Math.abs(l[0]) - h[0], 0),
          dy = Math.max(Math.abs(l[1]) - h[1], 0),
          dz = Math.max(Math.abs(l[2]) - h[2], 0);
        if (Math.hypot(dx, dy, dz) < radius) this.damage(w, force * 0.8, [0, 1, 0], 'pulse');
      }
      if (Math.hypot(p[0], p[2]) < 40 && p[1] < ICE_Y + 40) this.chipIce(force * 0.6);
    }
    pushBox(ship, b, r = 2.6) {
      const p = ship.p;
      if (p[0] < b.min[0] - r || p[0] > b.max[0] + r || p[1] < b.min[1] - r || p[1] > b.max[1] + r || p[2] < b.min[2] - r || p[2] > b.max[2] + r) return false;
      const pens = [p[0] - (b.min[0] - r), b.max[0] + r - p[0], p[1] - (b.min[1] - r), b.max[1] + r - p[1], p[2] - (b.min[2] - r), b.max[2] + r - p[2]];
      let k = 0;
      for (let i = 1; i < 6; i++) if (pens[i] < pens[k]) k = i;
      const axis = k >> 1,
        sgn = k & 1 ? 1 : -1;
      p[axis] += sgn * pens[k];
      if (ship.velocity[axis] * sgn < 0) ship.velocity[axis] *= -0.25;
      return true;
    }
    pushSphere(ship, c, lim) {
      const dx = ship.p[0] - c[0],
        dy = ship.p[1] - c[1],
        dz = ship.p[2] - c[2],
        d = Math.hypot(dx, dy, dz);
      if (d >= lim) return false;
      const n = [dx / (d || 1), dy / (d || 1), dz / (d || 1)];
      ship.p[0] = c[0] + n[0] * lim;
      ship.p[1] = c[1] + n[1] * lim;
      ship.p[2] = c[2] + n[2] * lim;
      const vn = ship.velocity[0] * n[0] + ship.velocity[1] * n[1] + ship.velocity[2] * n[2];
      if (vn < 0) ship.velocity = ship.velocity.map((v, k) => (v - vn * n[k] * 1.6) * 0.6);
      return true;
    }
    pushWall(ship, w, r = 2.8) {
      const l = this.toLocal(w, [ship.p[0] - w.p[0], ship.p[1] - w.p[1], ship.p[2] - w.p[2]]),
        h = w.half;
      const pens = [l[0] + h[0] + r, h[0] + r - l[0], l[1] + h[1] + r, h[1] + r - l[1], l[2] + h[2] + r, h[2] + r - l[2]];
      if (pens.some(x => x <= 0)) return false;
      let k = 0;
      for (let i = 1; i < 6; i++) if (pens[i] < pens[k]) k = i;
      l[k >> 1] += (k & 1 ? 1 : -1) * pens[k];
      const c = Math.cos(w.t),
        s = Math.sin(w.t);
      ship.p[0] = w.p[0] + l[0] * c + l[2] * s;
      ship.p[1] = w.p[1] + l[1];
      ship.p[2] = w.p[2] - l[0] * s + l[2] * c;
      ship.velocity = ship.velocity.map(v => v * 0.5);
      return true;
    }
    // a cliff is a wall: inside it, the ship is put back out over the circle below
    cliffPush(ship) {
      const p = ship.p,
        R = Math.hypot(p[0], p[2]);
      if (R < 1) return;
      const g = this.height(p[0], p[2]);
      if (p[1] >= g + 3.4) return;
      for (let k = 1; k <= 32; k++) {
        const r2 = R - k * 0.9,
          s = r2 / R;
        if (r2 <= 0) return;
        const s2 = (r2 + 2.5) / R;
        if (this.height(p[0] * s, p[2] * s) + 3.6 <= p[1] && this.height(p[0] * s2, p[2] * s2) + 1 <= p[1]) {
          p[0] *= s;
          p[2] *= s;
          const rx = p[0] / r2,
            rz = p[2] / r2,
            vr = ship.velocity[0] * rx + ship.velocity[2] * rz;
          if (vr > 0) {
            ship.velocity[0] -= vr * rx * 1.3;
            ship.velocity[2] -= vr * rz * 1.3;
          }
          return;
        }
      }
    }
    collide(ship, dt) {
      this.cliffPush(ship);
      for (const b of this.gateBoxes) this.pushBox(ship, b);
      for (const w of this.walls) if (w.alive) this.pushWall(ship, w);
      this.pushSphere(ship, [0, ICE_Y + 3, 0], 21);
      for (const sd of [-1, 1]) this.pushSphere(ship, [sd * 15.5, ICE_Y + 12.5, 0], 11);
      if (!this.ruler.captured) this.pushSphere(ship, [0, ICE_Y + 34, 0], 13);
      const speed = M.len(ship.velocity);
      for (const d of this.demons) {
        if (!d.alive && d.cls !== 'giant') continue;
        const p = d.node.p;
        if (d.cls === 'giant') {
          for (const [y, rr] of [[20, 12], [42, 13], [58, 16], [78, 10]]) this.pushSphere(ship, [p[0], p[1] + y, p[2]], rr);
          continue;
        }
        const c = [p[0], p[1] + d.hy, p[2]];
        if (M.dist(ship.p, c) < d.radius + 2.8) {
          if (speed > 16 && ship.hitCooldown <= 0 && d.alive) {
            this.damage(d, speed * 3, M.norm(ship.velocity), 'ram');
            ship.hitCooldown = 0.3;
            ship.shake = 0.5;
            this.game.audio.impact(0.8);
          }
          if (d.radius > 3) this.pushSphere(ship, c, d.radius + 2.8);
        }
      }
      for (const b of this.boulders) this.pushSphere(ship, b.node.p, 5.4);
      super.collide(ship, dt);
    }

    /* ---------- the keepers, moving ---------- */
    killDemon(d, dir = [0, 1, 0]) {
      if (!d.alive || d.dying) return;
      d.alive = false;
      this.deadDemons.add(d.i);
      if (this.vehicle?.grab === d) this.vehicle.release();
      const p = d.node.p,
        [pan, gain] = this.where(p);
      this.game.audio.growl(pan, Math.max(0.3, gain), d.cls === 'giant' ? 0.45 : d.cls === 'male' ? 1.6 : 0.9);
      this.game.audio.impact(d.cls === 'giant' ? 2 : 0.8);
      this.emit([p[0], p[1] + d.hy, p[2]], d.cls === 'giant' ? 18 : 8, '#3a0c0a', 12, 1.6);
      d.dying = { t: 0, dir: dir.slice(), v: [dir[0] * 6, 4, dir[2] * 6] };
      const all = cls => !this.demons.some(x => x.cls === cls && x.alive);
      const say = (k, a, b) => {
        if (this.told[k]) return;
        this.told[k] = true;
        this.later(0.8, () => this.game.ui.toast(a, b, 6));
      };
      if (d.cls === 'charon') say('charon', '카론이 쓰러졌습니다', '이제 강을 건네줄 자가 없습니다.');
      else if (d.cls === 'minos') say('minos', '미노스가 쓰러졌습니다', '누가 어느 층으로 갈지 정해 줄 자가 없습니다.');
      else if (d.cls === 'cerberus') say('cerberus', '케르베로스가 쓰러졌습니다', '진창의 사람들을 할퀴던 것이 멈췄습니다.');
      else if (d.cls === 'male') {
        if (all('male')) say('male-all', '말레브랑케가 모두 떨어졌습니다', '역청 속 사람들을 찍어 누르던 갈고리가 없습니다.');
        else say('male', '말레브랑케 하나가 떨어졌습니다', '갈고리를 든 것이 아직 남아 있습니다.');
      } else if (d.cls === 'centaur') {
        if (all('centaur')) say('centaur-all', '켄타우로스가 모두 쓰러졌습니다', '피의 강에서 고개를 들어도 이제 화살이 날아오지 않습니다.');
      } else if (d.cls === 'giant') say('giant', '거인이 고개를 떨궜습니다', '사슬에 묶여 쓰러지지도 못합니다.');
      else if (d.cls === 'fallen') {
        if (d.fromHeaven) say('fallen-h', '성벽에서 천사가 떨어졌습니다', '천국에서 떨어져 이 성벽에 서 있던 천사였습니다.');
        else say('fallen', '타락한 천사가 성벽에서 떨어졌습니다', '');
      }
    }
    // where a keeper lies once it has fallen
    layDemon(d, old = false) {
      const n = d.node,
        p = n.p,
        cls = d.cls;
      d.dying = null;
      if (cls === 'charon') {
        n.visible = false;
        return;
      }
      if (cls === 'giant') {
        d.head.r[0] = 0.75;
        d.head.r[1] = 0;
        for (const e of d.eyes) e.em = 0;
        return;
      }
      if (cls === 'fallen' && old) {
        const t = d.t,
          R = WALL_R - 10;
        p[0] = Math.sin(t) * R;
        p[2] = Math.cos(t) * R;
      }
      if (cls === 'male' && Math.abs(Math.hypot(p[0], p[2]) - PITCH.r) < PITCH.w * 0.6) {
        n.visible = false; // under the pitch, with the ones it kept there
        return;
      }
      p[1] = this.height(p[0], p[2]) + (cls === 'cerberus' ? 1.2 : cls === 'minos' ? 1.4 : 0.35);
      n.r[2] = cls === 'cerberus' ? 1.3 : 1.45;
      n.r[0] = cls === 'cerberus' ? 0 : 0.15;
      for (const e of d.f?.eyes || []) e.em = 0;
    }
    updateDemons(dt, ship) {
      const t = this.time,
        R = this.residents,
        v = this.vehicle,
        still = this.stilled;
      for (const d of this.demons) {
        const n = d.node;
        if (d.dying) {
          d.dying.t += dt;
          const k = Math.min(1, d.dying.t / 1.1);
          if (d.cls === 'male' || d.cls === 'fallen' || d.cls === 'charon') {
            d.dying.v[1] -= 22 * dt;
            n.p[0] += d.dying.v[0] * dt;
            n.p[1] += d.dying.v[1] * dt;
            n.p[2] += d.dying.v[2] * dt;
            n.r[2] += dt * 3;
            if (n.p[1] <= this.floor(n.p[0], n.p[2])) this.layDemon(d);
          } else {
            if (d.cls === 'giant') d.head.r[0] = k * 0.75;
            else n.r[2] = k * k * (d.cls === 'cerberus' ? 1.3 : 1.45);
            if (k >= 1) this.layDemon(d);
          }
          continue;
        }
        if (!d.alive) continue;
        if (v.grab === d) {
          d.held = true;
          continue;
        }
        if (d.held) {
          d.held = false;
          n.r[2] = 0;
        }
        if (d.thrown) {
          d.velocity[1] -= 22 * dt;
          for (let k = 0; k < 3; k++) n.p[k] += d.velocity[k] * dt;
          n.r[0] += dt * 4;
          if (n.p[1] <= this.floor(n.p[0], n.p[2])) {
            d.thrown = false;
            n.p[1] = this.floor(n.p[0], n.p[2]);
            this.killDemon(d, M.norm(d.velocity));
          }
          continue;
        }
        d.flinch = Math.max(0, d.flinch - dt);
        const dx = ship[0] - n.p[0],
          dz = ship[2] - n.p[2],
          ds = Math.hypot(dx, dz);
        const turnTo = (node, base, k = 1, lim = 1.2) => {
          node.r[1] = M.damp(node.r[1], M.clamp(M.angle(base, Math.atan2(dx, dz)), -lim, lim) * k, 3, dt);
        };
        switch (d.cls) {
          case 'charon':
            this.updateCharon(d, dt, t);
            break;
          case 'minos':
            turnTo(d.f.head, n.r[1], ds < 220 ? 1 : 0);
            d.coils.r[1] += dt * (still ? 0.05 : 0.35);
            d.tip.p[0] = 3.2 + Math.sin(t * 2.3) * 1.2;
            d.tip.p[1] = 9.5 + Math.sin(t * 3.1) * 1.6;
            d.tip.r[2] = Math.sin(t * 2.3) * 0.8;
            if (!still && ds < 70 && Math.random() < dt * 0.4) this.game.audio.growl(...this.where(n.p), 0.7);
            break;
          case 'cerberus':
            this.updateCerberus(d, dt, t, ds, ship, R);
            break;
          case 'male':
            this.updateMale(d, dt, t, ds, ship, R);
            break;
          case 'centaur':
            this.updateCentaur(d, dt, t, R);
            break;
          case 'giant':
            turnTo(d.head, n.r[1], ds < 260 ? 0.8 : 0, 0.8);
            d.head.r[0] = Math.sin(t * 0.3 + d.k) * 0.05;
            break;
          case 'fallen': {
            const w = this.walls[d.seg];
            if (w && !w.alive && !d.dying) {
              this.killDemon(d, [Math.sin(d.t), 0, Math.cos(d.t)]);
              break;
            }
            turnTo(d.f.head, n.r[1], ds < 160 ? 1 : 0, 1.0);
            for (const [k, wg] of d.wings.entries()) wg.r[1] = (k ? 1 : -1) * (0.5 + Math.sin(t * 0.8 + d.i) * 0.08);
            break;
          }
        }
        d.p = n.p;
      }
    }
    updateCharon(d, dt, t) {
      const n = d.node,
        th = 0.16,
        b = this.boat;
      if (d.alive && !this.stilled) {
        if (d.wait > 0) d.wait -= dt;
        else {
          d.cross = Math.min(1, d.cross + dt / 19);
          if (d.cross >= 1) {
            d.cross = 0;
            d.from = -d.from;
            d.wait = 6;
          }
        }
      }
      const k = ss(0, 1, d.cross),
        r0 = d.from > 0 ? ACH.r1 - 3 : ACH.r0 + 3,
        r1 = d.from > 0 ? ACH.r0 + 3 : ACH.r1 - 3,
        Rb = r0 + (r1 - r0) * k,
        a = th + Math.sin(d.cross * Math.PI) * 0.012,
        heading = a + (d.from > 0 ? Math.PI : 0);
      b.p = [Math.sin(a) * Rb, ACH.water + Math.sin(t * 1.3) * 0.08, Math.cos(a) * Rb];
      b.r[1] = heading;
      b.r[2] = Math.sin(t * 0.9) * 0.02;
      if (!d.alive) return;
      const back = -3.2;
      n.p = [b.p[0] + Math.sin(heading) * back, ACH.water + 0.9, b.p[2] + Math.cos(heading) * back];
      n.r[1] = heading;
      this.charonOar.r[0] = Math.acos(0.6) + Math.sin(t * 1.6) * (d.wait > 0 ? 0.05 : 0.35);
    }
    updateCerberus(d, dt, t, ds, ship, R) {
      const n = d.node,
        still = this.stilled;
      d.bite -= dt;
      for (const h of d.heads) {
        h.lunge = Math.max(0, h.lunge - dt * 2.5);
        h.neck.r[0] = -0.3 - h.lunge * 0.7 + Math.sin(t * 1.1 + h.k) * 0.08;
        h.neck.r[1] = h.k * 0.45 + Math.sin(t * 0.7 + h.k * 2) * 0.25;
        h.jaw.r[0] = 0.15 + Math.max(h.lunge, Math.abs(Math.sin(t * 3 + h.k)) * 0.3) * 0.7;
      }
      if (still) return;
      if (ds < 55 && Math.random() < dt * 0.7) {
        const h = d.heads[(Math.random() * 3) | 0];
        h.lunge = 1;
        this.game.audio.growl(...this.where(n.p), 1.1 + Math.random() * 0.3);
      }
      if (d.bite <= 0) {
        d.bite = 3 + Math.random() * 4;
        // he claws and tears the ones lying nearest him
        let best = null,
          bd = 18;
        for (const r of R.list) {
          if (!r.alive || r.ring !== 'g' || r.loose) continue;
          const dd = Math.hypot(r.p[0] - n.p[0], r.p[2] - n.p[2]);
          if (dd < bd) {
            bd = dd;
            best = r;
          }
        }
        if (best) {
          const h = d.heads[(Math.random() * 3) | 0];
          h.lunge = 1;
          this.game.audio.growl(...this.where(n.p), 1);
          this.later(0.3, () => {
            if (best.alive && d.alive) R.kill(best, 'cut', M.norm([best.p[0] - n.p[0], 0, best.p[2] - n.p[2]]));
          });
        }
      }
    }
    updateMale(d, dt, t, ds, ship, R) {
      const n = d.node,
        still = this.stilled;
      for (const w of d.wings) w.flap.r[1] = (d.fly || ds < 45 ? Math.sin(t * 11 + d.i) * 0.6 : 0.4) * (w.root.r[1] > 0 ? 1 : -1);
      const swarm = !still && ds < 42 && ship[1] < MALE_Y + 70;
      {
        // in the air: round the ditch, or round the ship when it comes close, hooks out
        if (swarm) {
          d.a += dt * 1.1;
          const tx = ship[0] + Math.sin(d.a + d.i) * 9,
            tz = ship[2] + Math.cos(d.a + d.i) * 9,
            ty = ship[1] + Math.sin(t * 2 + d.i) * 3;
          n.p[0] = M.damp(n.p[0], tx, 2, dt);
          n.p[1] = M.damp(n.p[1], ty, 2, dt);
          n.p[2] = M.damp(n.p[2], tz, 2, dt);
          n.r[1] = Math.atan2(ship[0] - n.p[0], ship[2] - n.p[2]);
        } else if (d.fly) {
          d.a += dt * (still ? 0.02 : 0.11);
          const tx = Math.sin(d.a) * d.R,
            tz = Math.cos(d.a) * d.R,
            ty = MALE_Y + 7 + Math.sin(t * 0.9 + d.i) * 2.5;
          n.p[0] = M.damp(n.p[0], tx, 1.5, dt);
          n.p[1] = M.damp(n.p[1], ty, 1.5, dt);
          n.p[2] = M.damp(n.p[2], tz, 1.5, dt);
          n.r[1] = d.a + Math.PI / 2;
        } else {
          // back to its post on the bank, facing the pitch
          const hx = Math.sin(d.a0) * d.R,
            hz = Math.cos(d.a0) * d.R;
          n.p[0] = M.damp(n.p[0], hx, 1.2, dt);
          n.p[2] = M.damp(n.p[2], hz, 1.2, dt);
          n.p[1] = M.damp(n.p[1], this.height(n.p[0], n.p[2]), 2, dt);
          n.r[1] = d.a0 + (d.R > PITCH.r ? Math.PI : 0) + Math.sin(t * 0.4 + d.i) * 0.3;
        }
      }
      d.strike = Math.max(0, d.strike - dt);
      d.f.arms[1].r[0] = -0.6 - Math.sin(Math.min(1, d.strike / 0.5) * Math.PI) * 1.6;
      if (still) return;
      d.cool -= dt;
      if (d.cool > 0) return;
      d.cool = 0.8;
      // whoever comes up out of the pitch gets the hook
      for (const r of R.list) {
        if (!r.alive || r.ring !== 'p' || r.loose || r.up <= 0.2 || r.hook > 0) continue;
        if (Math.hypot(r.p[0] - n.p[0], r.p[2] - n.p[2]) > (d.fly ? 12 : 8.5)) continue;
        r.hook = 1.4;
        r.up = 0;
        d.strike = 0.5;
        d.cool = 3 + Math.random() * 3;
        R.say(r, 'scream');
        this.game.audio.metal();
        if (Math.random() < 0.35) this.later(0.7, () => r.alive && R.kill(r, 'cut', [0, 1, 0]));
        break;
      }
    }
    updateCentaur(d, dt, t, R) {
      const n = d.node,
        still = this.stilled;
      if (!d.shot && d.aim <= 0) d.th += dt * (still ? 0 : 0.045);
      const rad = 186.6,
        x = Math.sin(d.th) * rad,
        z = Math.cos(d.th) * rad;
      n.p[0] = x;
      n.p[2] = z;
      n.p[1] = this.height(x, z);
      const run = !still && d.aim <= 0;
      d.legs.forEach((l, k) => (l.r[0] = run ? Math.sin(t * 9 + k * 1.6) * 0.65 : 0));
      if (d.aim <= 0) n.r[1] = d.th + Math.PI / 2;
      n.p[1] += run ? Math.abs(Math.sin(t * 9)) * 0.25 : 0;
      if (still) return;
      d.cool -= dt;
      if (d.aim > 0) {
        d.aim -= dt;
        const r = d.target;
        if (r?.alive) n.r[1] = M.damp(n.r[1], Math.atan2(r.p[0] - x, r.p[2] - z), 6, dt);
        if (d.aim <= 0 && r?.alive) {
          const from = [x, n.p[1] + 4.4, z],
            to = [r.p[0], r.p[1] + 2.2, r.p[2]];
          const node = K.beam(this.fxRoot, from, to, 0.08, '#e8d0a8', 0.6);
          this.arrows.push({ node, from, to, t: 0, r });
          this.game.audio.noiseHit(0.12, 0.12, 3400, null, 'highpass', 1200);
        }
        return;
      }
      if (d.cool > 0) return;
      d.cool = 0.6;
      // whoever rises higher out of the blood than their sin allows
      for (const r of R.list) {
        if (!r.alive || r.ring !== 'b' || r.loose || r.rise < 0.12) continue;
        if (Math.hypot(r.p[0] - x, r.p[2] - z) > 34) continue;
        d.target = r;
        d.aim = 0.6;
        d.cool = 2.5 + Math.random() * 2;
        break;
      }
    }
    updateArrows(dt) {
      for (let i = this.arrows.length - 1; i >= 0; i--) {
        const a = this.arrows[i];
        a.t += dt / 0.32;
        const k = Math.min(1, a.t),
          tip = a.from.map((v, j) => v + (a.to[j] - v) * k),
          tail = a.from.map((v, j) => v + (a.to[j] - v) * Math.max(0, k - 0.25));
        this.setLine(a.node, tail, tip, 0.09);
        if (k >= 1) {
          this.fxRoot.remove(a.node);
          this.arrows.splice(i, 1);
          if (a.r.alive) this.residents.kill(a.r, 'cut', M.norm(M.sub(a.to, a.from)));
        }
      }
    }
    updateBoulders(dt) {
      if (!this.stilled) this.boulderT = (this.boulderT || 0) + dt;
      const T = 70,
        u = ((this.boulderT || 0) % T) / T,
        tri = u < 0.5 ? u * 2 : 2 - u * 2,
        dir = u < 0.5 ? 1 : -1,
        span = Math.PI - 0.56;
      const clash = tri < 0.004 || tri > 0.996;
      if (clash && !this.clashed && !this.stilled) {
        this.clashed = true;
        const at = tri < 0.5 ? [0, CIRCLES.a.y, 304] : [0, CIRCLES.a.y, -304],
          [pan, gain] = this.where(at);
        if (gain > 0.03) {
          this.game.audio.impact(1.2 * gain + 0.2);
          this.game.audio.growl(pan, gain, 0.55);
        }
      } else if (!clash) this.clashed = false;
      for (const b of this.boulders) {
        const th = b.side * (0.03 + b.j * 0.16 + tri * span),
          x = Math.sin(th) * b.R,
          z = Math.cos(th) * b.R;
        b.roll += (b.th !== 0 ? (th - b.th) * b.R : 0) / 2.8;
        b.th = th;
        b.dir = b.side * dir;
        b.node.p = [x, this.height(x, z) + 2.6, z];
        b.node.r = [0, th, -b.roll];
        b.p = b.node.p;
      }
    }
    updateBanner(dt) {
      if (this.stilled) return;
      const t = this.time,
        a = Math.sin(t * 0.045) * 1.05 + Math.sin(t * 0.13) * 0.25,
        R = 556 + Math.sin(t * 0.17) * 24,
        x = Math.sin(a) * R,
        z = Math.cos(a) * R;
      this.bannerP = [x, 0, z];
      this.banner.p = [x, this.height(x, z), z];
      this.flag.r[1] += dt * 9;
    }
    updateWalls(dt) {
      for (const w of this.walls) {
        if (!(w.fall > 0 && w.fall < 2)) continue;
        w.fall += dt;
        const k = Math.min(1, w.fall / 1.6);
        w.node.p[1] = -131 - k * k * 26;
        w.node.r[2] = k * 0.3;
        if (w.fall >= 1.6) {
          w.fall = 9;
          this.wallRubble(w);
          this.emit(w.p, 12, '#3a2421', 18, 2);
        }
      }
    }
    breakWall(w) {
      if (!w.alive) return;
      this.wallDown(w);
      this.emit(w.p, 16, '#ff6a2a', 20, 1.6);
      this.game.audio.impact(1.8);
      if (this.vehicle) this.vehicle.shake = Math.max(this.vehicle.shake, 0.6 * Math.max(0, 1 - M.dist(this.vehicle.p, w.p) / 200));
      if (!this.told.wall) {
        this.told.wall = true;
        this.game.ui.toast('디스 성벽이 무너졌습니다', '쇠로 된 벽이 붉게 식어 갑니다.', 5);
      }
    }

    /* ---------- life of the pit ---------- */
    updateWorld(dt) {
      const ship = this.vehicle.p,
        r = this.ruler,
        v = this.vehicle,
        pulling = v.grab === r,
        tension = pulling ? Math.min(1, v.tension / 1.8) : 0;
      if (pulling) {
        // the head comes away slowly however hard the ship pulls; he holds on, the wings beat harder
        v.tension = Math.min(v.tension, this.pullPrev + dt * 0.3);
        const d = M.sub(v.p, r.p),
          len = M.len(d) || 1,
          stretch = Math.max(0, len - v.grabStart),
          k = (Math.min(stretch, 60) * 0.35 * dt) / len;
        v.velocity = v.velocity.map((x, i) => x - d[i] * k);
        v.shake = Math.max(v.shake, tension * 0.5);
        if (Math.random() < dt * (0.8 + tension * 2)) {
          const [pan, gain] = this.where(r.p);
          this.game.audio.growl(pan, Math.max(0.4, gain), 0.55 + Math.random() * 0.3);
        }
      }
      this.pullPrev = pulling ? v.tension : 0;
      if (r.captured && !this.stilled) this.beginStill();
      this.updateLucifer(dt, ship, pulling, tension);
      this.updateEnv(dt, ship);
      this.updateBoulders(dt);
      this.updateBanner(dt);
      this.updateDemons(dt, ship);
      this.updateArrows(dt);
      this.updateSwarm(dt, ship);
      this.updateWalls(dt);
      this.updateTold(ship);
      const depth = M.clamp(-ship[1] / 330, 0, 1),
        inPit = Math.hypot(ship[0], ship[2]) < 620 ? 1 : 0.45;
      this.game.audio.inferno(dt, (0.5 + depth * 0.5) * inPit * (this.stilled ? 0.55 : 1), this.fire, this.gust);
      this.config.wind = 0.035 + this.gust * 0.45;
      if (!this.stilled && Math.random() < dt * 0.8) {
        // the boiling, heard when close
        const Rr = Math.hypot(ship[0], ship[2]);
        if ((Math.abs(Rr - 197) < 30 && Math.abs(ship[1] - BLOOD.surface) < 60) || (Math.abs(Rr - PITCH.r) < 25 && Math.abs(ship[1] - PITCH.surface) < 50)) {
          const a = Math.random() * TAU,
            q = [ship[0] + Math.sin(a) * 12, ship[1] - 20, ship[2] + Math.cos(a) * 12];
          this.game.audio.bubble(...this.where(q));
        }
      }
    }
    updateEnv(dt, ship) {
      const e = this.game.engine,
        R = Math.hypot(ship[0], ship[2]),
        kd = ss(-30, -190, ship[1]) * (R < 520 ? 1 : 0.4),
        kc = ss(-240, -310, ship[1]) * ss(260, 140, R);
      this.envMix[0] = M.damp(this.envMix[0], kd, 1.5, dt);
      this.envMix[1] = M.damp(this.envMix[1], kc, 1.5, dt);
      const [a, b] = this.envMix,
        V = (x, y, z) => x.map((q, i) => (q + (y[i] - q) * a) * (1 - b) + z[i] * b),
        S = (x, y, z) => (x + (y - x) * a) * (1 - b) + z * b;
      const cool = this.stilled ? 0.78 : 1;
      e.fog = V(TOP.fog, DEEP.fog, COLD.fog).map(q => q * cool);
      e.fogD = S(TOP.fogD, DEEP.fogD, COLD.fogD);
      e.ambient = S(TOP.ambient, DEEP.ambient, COLD.ambient) * (this.stilled ? 0.88 : 1);
      e.tint = V(TOP.tint, DEEP.tint, COLD.tint);
      e.sunK = S(TOP.sunK, DEEP.sunK, COLD.sunK);
      e.skyTop = TOP.skyTop.slice();
      e.skyHorizon = TOP.skyHorizon.map(q => q * cool * (1 - b * 0.4));
      e.skyCloud = TOP.skyCloud.slice();
      e.skyStyle = 4;
      e.noShadows = true;
      // the pit cools once the wings have stopped
      if (this.stilled && this.fire > 0.38) {
        this.fire = Math.max(0.38, this.fire - dt * 0.12);
        this.applyFire();
      }
    }
    applyFire() {
      const k = this.fire;
      for (const g of this.groundParts) g.em = g.hot * (0.35 + 0.65 * k);
      this.liquids[2].em = k;
      const F = this.tombFire,
        d = F.data;
      for (let i = 0; i < F.count; i++) d[i * 24 + 19] = 0.92 * (0.3 + 0.7 * k);
      F.uploaded = 0;
      const R = this.fireRain,
        dr = R.data;
      for (let i = 0; i < R.count; i++) dr[i * 24 + 19] = 0.95 * Math.max(0, (k - 0.38) / 0.62) * 0.8 + 0.12;
      R.uploaded = 0;
    }
    updateTold(ship) {
      const R = Math.hypot(ship[0], ship[2]),
        c = this.circleAt(R, ship[1]);
      if (c !== this.lastCircle) {
        this.lastCircle = c;
        this.regionName = c ? CIRCLES[c].n : R > ACH.r1 ? '지옥문 앞' : R > ACH.r0 ? '아케론 강' : '구덩이 위';
        if (c && CIRCLES[c].n && !this.told['c' + c] && ship[1] < CIRCLES[c].y + 70) {
          this.told['c' + c] = true;
          this.game.ui.toast(CIRCLES[c].n, CIRCLES[c].t, 6);
        }
      }
      if (!this.told.gate && Math.hypot(ship[0] - GATE[0], ship[2] - GATE[1]) < 70) {
        this.told.gate = true;
        this.game.ui.toast('지옥문', '여기 들어오는 자, 모든 희망을 버려라', 6);
      }
      if (!this.told.lucifer && !this.ruler.captured && R < 100 && ship[1] < ICE_Y + 110) {
        this.told.lucifer = true;
        this.game.ui.toast('루시퍼', '얼음에 가슴까지 박혀 있습니다. 날개 바람이 함선을 밀어냅니다. 목 둘레의 얼음을 깨야 머리를 붙잡을 수 있습니다.', 8);
      }
    }
    labels() {
      return [{ id: 'gate', p: this.gateLabelP, en: "LASCIATE OGNE SPERANZA, VOI CH'INTRATE", ko: '여기 들어오는 자, 모든 희망을 버려라', cls: 'inscription', range: 240 }];
    }

    /* ---------- when the head is gone ---------- */
    beginStill() {
      this.stilled = true;
      this.stillAt = this.time;
      this.game.audio.lightsOut();
      this.applyStill(false);
      this.later(5.5, () => {
        if (!this.disposed) this.game.ui.toast('날개가 멈췄습니다', '바람이 그치고 불이 잦아듭니다. 사람들이 벽을 기어오르려 합니다.', 8);
      });
    }
    applyStill(onLoad) {
      this.stump.visible = true;
      for (const list of this.iceStages) for (const c of list) c.visible = false;
      for (const e of this.lhead.eyes) e.em = 0;
      if (onLoad) {
        this.flapK = 0;
        this.fire = 0.38;
        this.applyFire();
        this.updateLucifer(0, this.spawn.p, false, 0);
      }
    }

    /* ---------- what it keeps ---------- */
    signalValue() {
      return 0;
    }
    tokens() {
      const out = [];
      out.push(...pack('x.d.', this.demons.filter(d => !d.alive).map(d => enc2(d.i))));
      out.push(...pack('x.w.', this.walls.filter(w => !w.alive).map(w => enc2(w.i))));
      if (this.iceBroken) out.push('x.i.' + this.iceBroken);
      out.push(
        ...pack(
          'x.l.',
          Object.entries(this.liftedBy)
            .filter(([, n]) => n > 0)
            .map(([k, n]) => k + enc2(Math.min(1295, n))),
        ),
      );
      return out;
    }
    snapshot() {
      if (this.disposed || !this.demons) return;
      this.destroyed = new Set([...this.destroyed].filter(t => !t.startsWith('x.')).concat(this.tokens()));
      super.snapshot();
    }
  }
  K.Planets[ID] = Hell;
})((window.KO ||= {}));
