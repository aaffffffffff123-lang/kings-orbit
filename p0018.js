/* @surface {"id":"p0018","name":"ALBA","shortName":"ALBA","description":"구름 위의 도시 · 한가운데 보좌에 신이 앉아 있습니다.","rulerName":"신","trophyNote":"빛을 걷어 내니 얼굴이 없었다.","species":"saved","inhabited":true,"heaven":true} */
/* p0018 — heaven. A city of gold floating over a sea of cloud, a throne at its centre and someone sitting on it.
 * Nothing here can hurt the ship. While the one on the throne keeps his head, no one here is afraid.
 * Save contract (planetStates.p0018.destroyed):
 *   mansions "n<block>-<n>" (shared building rules; "m<block>-<n>" from the smaller city are moved onto the nearest "n" house on load) · "h.a." fallen angels (index, 2 chars)
 *   "h.p." where those who fell from the air came down (index 2 · x 2 · z 2 · yaw 1)
 *   "h.t." felled trees of life (index 2) · "h.w." broken wall segments (index 2) · "h.r.1" the rainbow broken
 *   angel index: gate 0–11 · seraphim 12–17 · living creatures 20–23 · wheels 24–27 · elders 28–51 · host 52–75, 76–93
 *   tree index: 0–12 west, 13–25 east (the first thirteen a side), then 26… west and the rest east as the river grew */
(function (K) {
  'use strict';
  const { M, mesh, group } = K,
    ID = 'p0018',
    TAU = Math.PI * 2;
  const { trs } = K.Mat;
  const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  const enc2 = n => B36[Math.floor(n / 36) % 36] + B36[n % 36];
  const dec2 = (s, i) => {
    const a = B36.indexOf(s[i]),
      b = B36.indexOf(s[i + 1]);
    return a < 0 || b < 0 ? -1 : a * 36 + b;
  };
  const qxz = v => M.clamp(Math.round((v + 810) / 1.25), 0, 1295);
  const rgb = h => M.hex(h).slice();
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

  /* ---------- the city's measure ---------- */
  const CX = 0,
    CZ = -40, // the throne stands at the centre of the city
    HALF = 450, // walls on every side
    EDGE = 480, // the ledge outside the walls ends here, and then nothing
    STREET = 225, // the side gates stand halfway between the corner and the middle gate; the streets run through them
    DEPTH = 72, // twelve foundations, six metres each
    CLOUD_Y = -150,
    ABYSS = -1000,
    WALL_H = 46,
    WALL_T = 8,
    GATE_W = 26,
    HEAD_Y = 40;
  const THRONE = [CX, CZ];
  const TREES = Math.floor((CZ + HALF - 14 - 66) / 15) + 1; // thirteen a side when the walls stood at 300
  const SEA = { x: 0, z: 22, r: 32 }; // the sea of glass before the throne
  const RIVER = { w: 12, z0: SEA.z + SEA.r, z1: CZ + EDGE };
  const GOLD = '#e7b646',
    GOLD_DEEP = '#b98a2c',
    MARBLE = '#fbf6ea',
    PEARL = '#f6f0ea',
    JASPER = '#8fd0b6',
    JASPER_PALE = '#c4ecdc',
    SAPPHIRE = '#2d5bd6',
    SAPPHIRE_PALE = '#6a8ff0',
    ROBE = '#fdf9ee',
    FEATHER = '#fbf8f1',
    FEATHER_TIP = '#ead9ad',
    HALO = '#fff0b4',
    SKIN = '#f1d9be',
    FIRE = '#ffb347',
    FIRE_TIP = '#ff6a2a',
    BERYL = '#5ccbc4',
    EMERALD = '#2fcf7d',
    FACE = '#f3e8d3',
    WOOL = '#fbfaf6',
    ICHOR = '#d9b55a';
  // the twelve foundations, from the top: jasper, sapphire, chalcedony, emerald, sardonyx, sardius,
  // chrysolite, beryl, topaz, chrysoprase, jacinth, amethyst
  const JEWELS = ['#7fc8a6', '#2f5fd8', '#a9bfd6', '#19a35a', '#c4553a', '#d1302b', '#d8d046', '#57c6c0', '#f0a42c', '#82d878', '#e2622e', '#8a4fc9'];
  const FRUIT = ['#e8443a', '#f39a2b', '#f5d142', '#9ed34a', '#4fb3e8', '#8b5bd6', '#e85fa2', '#fff4d8', '#c7372f', '#f7b7c8', '#52c9a1', '#e0722f'];

  /* ---------- light: the day it has always had, and the first night ---------- */
  const DAY = {
    fog: [0.95, 0.86, 0.68],
    fogD: 0.00062,
    ambient: 0.66,
    tint: [1.08, 1, 0.88],
    sun: [0.25, 0.9, 0.45],
    sunK: 1,
    skyTop: [0.24, 0.47, 0.95],
    skyHorizon: [1, 0.86, 0.6],
    skyCloud: [1, 0.97, 0.9],
    skyStyle: 2,
    noShadows: true,
  };
  const NIGHT = {
    fog: [0.03, 0.035, 0.07],
    fogD: 0.0016,
    ambient: 0.36,
    tint: [0.7, 0.8, 1.12],
    sun: [0.25, 0.9, 0.45],
    sunK: 0.22,
    skyTop: [0.008, 0.012, 0.04],
    skyHorizon: [0.06, 0.065, 0.11],
    skyCloud: [0.11, 0.11, 0.17],
    skyStyle: 3,
    noShadows: true,
  };
  K.Heaven = { day: DAY, night: NIGHT };
  (K.SurfaceAtmospheres ||= {})[ID] = DAY;

  /* ---------- the saved: people in white robes ---------- */
  K.defineSpecies('saved', {
    name: '흰옷 입은 사람',
    dims: { hipY: 1.05, hipX: 0.22, legLen: 1.05, shoulderX: 0.44, shoulderY: 1.0, neckY: 1.15, upperLen: 0.62, foreLen: 0.56, depth: 0.34, headTop: 0.9 },
    scale: [0.88, 1.06],
    child: 0.58,
    walk: 1.2,
    jog: 2.6,
    run: 6.2,
    radius: 1.3,
    voice: 'subject',
    blood: '#6a1420',
    scorch: '#1d1b1a',
    capColor: '#4a1a1c',
    palettes: [
      { skin: '#f0d2b8', hair: '#3b2a1e', robe: '#fbfaf5', sash: '#e2b546', mouth: '#5c1d24' },
      { skin: '#c99a72', hair: '#1c1612', robe: '#f6f2e8', sash: '#e8c25a', mouth: '#4f1820' },
      { skin: '#8a5a3c', hair: '#120e0c', robe: '#fdfcf7', sash: '#d9a93c', mouth: '#3e1218' },
      { skin: '#e7c39e', hair: '#c9a15a', robe: '#f4efe2', sash: '#e9c768', mouth: '#5e1c24' },
      { skin: '#5e3b28', hair: '#0f0c0b', robe: '#f8f6ee', sash: '#e0b24c', mouth: '#36101a' },
      { skin: '#f3dcc8', hair: '#d9d6d0', robe: '#faf7ef', sash: '#d8ad48', mouth: '#5a1e26' },
    ],
    parts: [
      [1, 'lowCone', 'robe', [0, -0.4, 0], [1.32, 1.3, 1.1]],
      [1, 'lowCyl', 'sash', [0, 0.24, 0], [0.86, 0.13, 0.7], [0, 0, 0], 0.12],
      [8, 'lowCyl', 'robe', [0, -0.5, 0], [0.3, 1.0, 0.3], [0, 0, 0], 0, 1],
      [9, 'lowCyl', 'robe', [0, -0.5, 0], [0.3, 1.0, 0.3], [0, 0, 0], 0, 1],
      [8, 'box', '#b08a52', [0, -1.02, 0.1], [0.2, 0.08, 0.38], [0, 0, 0], 0, 1],
      [9, 'box', '#b08a52', [0, -1.02, 0.1], [0.2, 0.08, 0.38], [0, 0, 0], 0, 1],
      [2, 'lowSphere', 'robe', [0, 0.6, 0], [0.98, 1.3, 0.74]],
      [2, 'lowCyl', 'sash', [0, 1.08, 0.02], [0.52, 0.1, 0.44], [0, 0, 0], 0.12, 1],
      [2, 'lowCyl', 'skin', [0, 1.15, 0], [0.26, 0.22, 0.26], [0, 0, 0], 0, 1],
      [3, 'lowSphere', 'skin', [0, 0.44, 0], [0.72, 0.84, 0.7]],
      [3, 'lowSphere', 'hair', [0, 0.6, -0.09], [0.78, 0.7, 0.72]],
      [3, 'tinySphere', '#1b1d22', [0.15, 0.46, 0.31], [0.11, 0.13, 0.06], [0, 0, 0], 0, 1],
      [3, 'tinySphere', '#1b1d22', [-0.15, 0.46, 0.31], [0.11, 0.13, 0.06], [0, 0, 0], 0, 1],
      [3, 'tinySphere', 'mouth', [0, 0.22, 0.33], [0.17, 0.07, 0.06], [0, 0, 0], 0, 1, null, 'mouth', 3.4],
      [3, 'haloRing', HALO, [0, 1.02, -0.04], [0.66, 0.66, 0.66], [0.22, 0, 0], 1.4, 0, null, 'halo'],
      [4, 'lowCyl', 'robe', [0, -0.3, 0], [0.27, 0.64, 0.27]],
      [5, 'lowCyl', 'robe', [0, -0.22, 0], [0.25, 0.48, 0.25]],
      [5, 'tinySphere', 'skin', [0, -0.56, 0], [0.2, 0.22, 0.18], [0, 0, 0], 0, 1],
      [6, 'lowCyl', 'robe', [0, -0.3, 0], [0.27, 0.64, 0.27]],
      [7, 'lowCyl', 'robe', [0, -0.22, 0], [0.25, 0.48, 0.25]],
      [7, 'tinySphere', 'skin', [0, -0.56, 0], [0.2, 0.22, 0.18], [0, 0, 0], 0, 1],
      [5, 'lowCyl', 'sash', [0, -0.45, 0], [0.27, 0.06, 0.27], [0, 0, 0], 0.12, 2],
      [7, 'lowCyl', 'sash', [0, -0.45, 0], [0.27, 0.06, 0.27], [0, 0, 0], 0.12, 2],
    ],
  });
  // Those killed on other worlds arrive here too, robed, with a halo over the head they had.
  function withHalo(sp) {
    if (!sp || sp.parts.some(p => p.dyn === 'halo')) return sp;
    const m = new Float32Array(16),
      top = (sp.dims.headTop || 0.9) + 0.14;
    trs(m, 0, 0, top, -0.04, 0.22, 0, 0, 0.62, 0.62, 0.62);
    sp.parts = sp.parts.concat([{ bone: 3, geo: 'haloRing', color: HALO, m, em: 1.4, lod: 0, big: false, half: 'u', dyn: 'halo', open: 2.4 }]);
    if (!sp.geos.includes('haloRing')) sp.geos = sp.geos.concat(['haloRing']);
    const c = rgb(HALO);
    sp.colors = sp.colors.map(list => list.concat([c]));
    sp.charred = sp.charred.map(list => list.concat([c]));
    return sp;
  }
  const ROBED = [
    ['eden', 'eden-robed', () => ({ robe: '#f7f4ec', accent: '#e6bf55' })],
    ['mycel', 'mycel-robed', () => ({ cap: '#f2efe6', spot: '#e3c25a', gill: '#fbf6ea' })],
    ['cinder', 'cinder-robed', () => ({ apron: '#f5f2e9', pants: '#e4ddcd' })],
    ['nacre', 'nacre-robed', () => ({ accent: '#e8c75e' })],
    ['subject', 'subject-robed', () => ({ cloth: '#f4f1e8', dark: '#d3cab6' })],
  ];
  function robedSpecies() {
    for (const [base, key, recolor] of ROBED) if (!K.Species?.[key] && K.Species?.[base]) withHalo(K.respecies(base, key, recolor));
  }

  /* ---------- shapes shared by every winged thing ---------- */
  // A wing in its own frame: root at the origin, reaching +X, long feathers fanning from up-and-out to down-and-out.
  function wing(parent, p, len, n, color, tip, em = 0) {
    const g = group(parent, p);
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1),
        a = 0.6 - k * 1.65,
        L = len * (1 - 0.45 * k),
        w = len * (0.17 - 0.05 * k),
        f = group(g, [0, 0, -k * 0.05 * len]);
      f.r[2] = a;
      mesh(f, 'feather', [L * 0.5, 0, 0], [L, w, w * 0.22], k < 0.3 ? tip : color, { em });
    }
    mesh(g, 'feather', [len * 0.2, len * 0.03, 0.02 * len], [len * 0.48, len * 0.28, len * 0.12], color, { em });
    return g;
  }
  // side 1 = right; the left wing is the right one seen in a mirror
  function wingPair(parent, p, len, n, color, tip, em) {
    const R = wing(parent, [p[0], p[1], p[2]], len, n, color, tip, em),
      L = wing(parent, [-p[0], p[1], p[2]], len, n, color, tip, em);
    L.s = [-1, 1, 1];
    return [R, L];
  }
  function setWing(w, side, rx, ry, rz) {
    w.r[0] = rx;
    w.r[1] = side * ry;
    w.r[2] = side * rz;
  }
  function tintAll(node, k, em = null) {
    if (node.geo) {
      node.color = node.color.map(c => c * k);
      if (em != null) node.em = em;
    }
    for (const c of node.children) tintAll(c, k, em);
  }

  /* ---------- the one on the throne ---------- */
  // A smooth face without eyes, nose or mouth, framed in hair and beard white like wool.
  // Built facing -Z in its own frame, the way every head in the archive faces.
  function godHead(g, lit) {
    const em = lit ? 0.32 : 0.03,
      wem = lit ? 0.16 : 0,
      parts = [];
    const add = (geo, p, sc, c, e, r = [0, 0, 0]) => {
      const n = mesh(g, geo, p, sc, c, { em: e });
      n.r = r;
      parts.push(n);
      return n;
    };
    // the face: one smooth oval, a jaw, nothing else
    add('sphere', [0, 0, 0], [1.48, 1.94, 1.46], FACE, em);
    add('sphere', [0, -0.6, -0.2], [1.12, 0.96, 1.1], FACE, em);
    add('sphere', [0, 0.16, -0.32], [1.26, 1.06, 0.98], FACE, em);
    // hair like wool, worn like a hood over the crown and the back of the head
    add('sphere', [0, 0.32, 0.26], [1.74, 1.76, 1.66], WOOL, wem);
    add('sphere', [0, 0.92, 0.05], [1.5, 0.66, 1.4], WOOL, wem);
    // a hairline over the brow, and locks down both cheeks: the face is framed, and bare
    for (let k = 0; k < 5; k++) {
      const t = (k / 4 - 0.5) * 1.8;
      add('lowSphere', [Math.sin(t) * 0.62, 0.8 + Math.cos(t) * 0.16, -0.4], [0.66, 0.42, 0.52], WOOL, wem, [0, 0, -t * 0.6]);
    }
    for (const sd of [-1, 1]) {
      add('lowSphere', [sd * 0.8, 0.02, -0.18], [0.48, 1.75, 0.52], WOOL, wem, [0, 0, sd * 0.05]);
      add('lowSphere', [sd * 0.66, -0.3, -0.42], [0.42, 1.3, 0.44], WOOL, wem, [0, 0, sd * 0.1]);
    }
    // long locks falling to the shoulders, at the sides and behind
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * 0.12 + (k / 8) * Math.PI * 0.76, // from one temple round the back to the other
        x = -Math.cos(a) * 0.84,
        z = Math.sin(a) * 0.64 + 0.18,
        L = 1.75 + ((k * 5) % 3) * 0.14;
      add('lowSphere', [x, -0.5 - L * 0.2, z], [0.56, L, 0.5], WOOL, wem, [-0.12 - z * 0.12, 0, x * 0.16]);
    }
    // a long beard from the jaw down; the mouth and chin above it stay bare
    add('lowSphere', [0, -1.38, -0.34], [1.22, 1.55, 0.92], WOOL, wem, [0.18, 0, 0]);
    for (let k = 0; k < 6; k++) {
      const t = (k / 5 - 0.5) * 1.9,
        x = Math.sin(t) * 0.62,
        z = -Math.cos(t) * 0.5;
      add('lowSphere', [x, -1.2 - (1 - Math.abs(t) * 0.3) * 0.5, z - 0.08], [0.46, 1.45 - Math.abs(t) * 0.22, 0.44], WOOL, wem, [0.22, 0, x * 0.25]);
    }
    return parts;
  }
  K.TrophyModels[ID + '-ruler'] = root => {
    const g = group(root, [0, 0.12, 0]);
    g.s = [0.75, 0.75, 0.75];
    godHead(g, false);
    // where it came off: no blood, a cut of light gone cold
    mesh(g, 'cylinder', [0, -1.5, 0.08], [1.0, 0.7, 0.96], FACE, { em: 0.02 });
    mesh(g, 'disc', [0, -1.86, 0.08], [1.04, 0.05, 1.0], '#cdb57c', { em: 0.15 });
    return g;
  };

  const T16 = new Float32Array(16);
  const COL = [0, 0, 0];

  class Heaven extends K.Surface {
    constructor(game, def) {
      const captured = game.save.data.trophies.some(t => t.id === def.rulerId);
      super(game, def, {
        seed: 181818,
        rulerName: '신',
        areaLabel: 'ALBA / 새 예루살렘',
        regionName: '보좌 앞',
        afterLabel: '빛이 꺼진 도시',
        rubble: MARBLE,
        accent: GOLD,
        spark: '#fff3c4',
        lifeColor: '#f7efd9',
        scorch: '#5e5034',
        stablePhase: true,
        environment: captured ? NIGHT : DAY,
        wind: captured ? 0.06 : 0.016,
        spawn: { p: [0, 14, 200], yaw: 0, pitch: -0.06 },
        rulerAim: '신 · Q로 머리 붙잡기',
        rulerGrab: ['신의 머리를 붙잡았습니다', 'S로 뒤로 물러나 끝까지 당기세요.'],
        pullRate: 0.06,
        pullRise: 9,
        arrival: ['전시 복도에 신의 머리가 도착했습니다.', '복도를 따라가면 새로 채워진 자리가 있습니다.'],
      });
      this.heaven = true;
      this.dark = captured; // the first night, once it has come, stays
      this.envMix = captured ? 1 : 0;
      this.nightAt = captured ? -100 : null;
      // what it keeps
      this.deadAngels = new Set();
      this.fellAt = new Map();
      this.deadTrees = new Set();
      this.brokenWalls = new Set();
      this.rainbowBroken = false;
      for (const t of this.destroyed) {
        if (t.startsWith('h.a.'))
          for (let i = 4; i + 2 <= t.length; i += 2) {
            const n = dec2(t, i);
            if (n >= 0) this.deadAngels.add(n);
          }
        else if (t.startsWith('h.p.'))
          for (let i = 4; i + 7 <= t.length; i += 7) {
            const n = dec2(t, i),
              x = dec2(t, i + 2),
              z = dec2(t, i + 4),
              y = B36.indexOf(t[i + 6]);
            if (n >= 0 && x >= 0 && z >= 0 && y >= 0) this.fellAt.set(n, { x: x * 1.25 - 810, z: z * 1.25 - 810, yaw: (y / 36) * TAU });
          }
        else if (t.startsWith('h.t.'))
          for (let i = 4; i + 2 <= t.length; i += 2) {
            const n = dec2(t, i);
            if (n >= 0) this.deadTrees.add(n);
          }
        else if (t.startsWith('h.w.'))
          for (let i = 4; i + 2 <= t.length; i += 2) {
            const n = dec2(t, i);
            if (n >= 0) this.brokenWalls.add(n);
          }
        else if (t === 'h.r.1') this.rainbowBroken = true;
      }
      robedSpecies();
      this.angels = [];
      this.trees = [];
      this.walls = [];
      this.solids = [];
      this.glowers = [];
      this.bolts = [];
      this.mists = [];
      this.flash = 0;
      this.boltClock = 6;
      this.provokeClock = 0;
      this.told = {};
      this.worship = null;
      this.pullPrev = 0;
      this.choirLv = 1;
      this.godBody = { kind: 'god', fixed: true, fixedNote: '움직이지 않습니다.', label: '신', alive: true, p: [CX, 20, CZ], radius: 8 };
      this.initialize();
      if (this.dark) this.applyNight(true);
    }

    /* ---------- the floor of heaven ---------- */
    onPlatform(x, z, pad = 0) {
      return Math.abs(x - CX) <= EDGE + pad && Math.abs(z - CZ) <= EDGE + pad;
    }
    // Where people stand and bodies lie. Off the edge there is nothing to land on.
    height(x, z) {
      return this.onPlatform(x, z) ? 0 : ABYSS;
    }
    // Where the ship and debris come to rest: the gold above, the clouds below and beyond.
    floor(x, z, y = 0) {
      if (!this.onPlatform(x, z) || y < -2) return CLOUD_Y;
      const d = Math.hypot(x - THRONE[0], z - THRONE[1]);
      return d < 13.5 ? 6 : d < 18 ? 4 : d < 22 ? 2 : 0;
    }
    glow(node, day, night) {
      this.glowers.push({ node, day, night });
      return node;
    }
    makeTerrain() {
      const root = this.root,
        w = EDGE * 2;
      // the street of the city was pure gold, as it were transparent glass
      this.ground = mesh(root, 'box', [CX, -0.05, CZ], [w, 0.1, w], '#ffffff', { type: 21, em: 0.12 });
      this.glow(this.ground, 0.12, 0);
      // twelve foundations, each a stone, stacked beneath the gold
      JEWELS.forEach((c, i) => {
        const inset = i % 2 ? 1.2 : 0;
        this.glow(mesh(root, 'box', [CX, -3.05 - i * 6, CZ], [w - inset, 5.96, w - inset], c, { type: 23, em: 0.14 }), 0.14, 0.015);
        if (i) mesh(root, 'box', [CX, -0.05 - i * 6, CZ], [w + 0.6, 0.5, w + 0.6], GOLD_DEEP);
      });
      // a gold lip at the edge
      for (const [x, z, sx, sz] of [
        [CX, CZ + EDGE, w + 2, 2],
        [CX, CZ - EDGE, w + 2, 2],
        [CX + EDGE, CZ, 2, w + 2],
        [CX - EDGE, CZ, 2, w + 2],
      ])
        mesh(root, 'box', [x, 0.35, z], [sx, 0.7, sz], GOLD);
      // a sea of cloud below, and towers of cloud far off
      this.cloudSea = mesh(root, 'disc', [CX, CLOUD_Y - 0.5, CZ], [7000, 1, 7000], '#ffffff', { type: 22 });
      const rng = M.rand(4407);
      this.cloudTowers = [];
      for (let i = 0; i < 10; i++) {
        const a = i * 0.628 + rng() * 0.35,
          d = 950 + rng() * 650,
          x = CX + Math.sin(a) * d,
          z = CZ + Math.cos(a) * d,
          g = group(root, [x, CLOUD_Y - 20, z]),
          H = 140 + rng() * 200,
          W = 150 + rng() * 90;
        // a broad foot of overlapping heads, narrowing as it climbs, a few heads on top
        for (let k = 0; k < 9; k++) {
          const up = Math.pow(k / 8, 0.8),
            t = k * 2.4 + rng(),
            r = (1 - up * 0.75) * W * (0.3 + rng() * 0.25),
            s2 = (1 - up * 0.55) * W * (0.42 + rng() * 0.2);
          this.cloudTowers.push(mesh(g, 'sphere', [Math.sin(t) * r, up * H + s2 * 0.2, Math.cos(t) * r], [s2 * 1.15, s2 * 0.95, s2 * 1.15], '#fffaf2', { type: 24 }));
        }
      }
      // the river of the water of life, clear as crystal, out of the throne and down the middle of the street
      const len = RIVER.z1 - RIVER.z0;
      this.river = mesh(root, 'box', [0, 0.03, RIVER.z0 + len / 2], [RIVER.w, 0.1, len], '#ffffff', { type: 7, detail: 0, em: 0.12 });
      this.glow(this.river, 0.12, 0);
      for (const s of [-1, 1]) mesh(root, 'box', [s * (RIVER.w / 2 + 0.3), 0.06, RIVER.z0 + len / 2], [0.6, 0.12, len], GOLD_DEEP);
      // over the edge it falls into the clouds
      this.fall = mesh(root, 'box', [0, CLOUD_Y / 2, RIVER.z1 + 0.6], [RIVER.w, -CLOUD_Y, 1.2], '#ffffff', { type: 7, detail: 2, alpha: 0.9, em: 0.1 });
      this.fallMist = 0;
      // the sea of glass before the throne, mingled with fire
      this.glass = mesh(root, 'disc', [SEA.x, 0.05, SEA.z], [SEA.r * 2, 0.1, SEA.r * 2], '#ffffff', { type: 7, detail: 1, em: 0.1 });
      mesh(root, 'disc', [SEA.x, 0.02, SEA.z], [SEA.r * 2 + 2.4, 0.06, SEA.r * 2 + 2.4], GOLD_DEEP);
    }

    /* ---------- walls, gates and mansions ---------- */
    makeCity() {
      const root = this.root;
      // sides: south (+z), east (+x), north (-z), west (-x); three gates each
      const sides = [
        { n: [0, 1], c: [CX, CZ + HALF] },
        { n: [1, 0], c: [CX + HALF, CZ] },
        { n: [0, -1], c: [CX, CZ - HALF] },
        { n: [-1, 0], c: [CX - HALF, CZ] },
      ];
      this.gates = [];
      let seg = 0;
      sides.forEach((side, si) => {
        const along = side.n[0] ? [0, 1] : [1, 0];
        const at = u => [side.c[0] + along[0] * u, side.c[1] + along[1] * u];
        // wall segments between the corners and the gates
        const spans = [
          [-HALF, -STREET - GATE_W / 2],
          [-STREET + GATE_W / 2, -GATE_W / 2],
          [GATE_W / 2, STREET - GATE_W / 2],
          [STREET + GATE_W / 2, HALF],
        ];
        for (const [u0, u1] of spans) this.wallSegment(seg++, at((u0 + u1) / 2), along, u1 - u0);
        for (let k = 0; k < 3; k++) {
          const u = (k - 1) * STREET,
            [x, z] = at(u);
          this.gates.push({ x, z, n: side.n, along, river: si === 0 && k === 1 });
          this.gate(x, z, along, side.n);
        }
      });
      // corner towers
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const x = CX + sx * HALF,
            z = CZ + sz * HALF;
          mesh(root, 'box', [x, WALL_H * 0.6, z], [18, WALL_H * 1.2, 18], JASPER, { type: 23, detail: 0.32, em: 0.08 });
          mesh(root, 'box', [x, WALL_H * 1.2 + 1, z], [20, 2, 20], GOLD);
          mesh(root, 'sphere', [x, WALL_H * 1.2 + 4.5, z], [6, 6, 6], PEARL, { em: 0.35 });
          this.solids.push({ min: [x - 9, 0, z - 9], max: [x + 9, WALL_H * 1.2 + 7, z + 9] });
        }
      // the mansions: four by four blocks between the streets, four by four houses in each
      const plan = this.mansionPlan(HALF, STREET, 4, 'n');
      // a save from the smaller city: a house broken there breaks the one standing where it stood, moved out with the walls
      const before = [...this.destroyed].filter(t => /^m\d+-\d$/.test(t));
      if (before.length) {
        const was = new Map(this.mansionPlan(300, 150, 3, 'm').map(m => [m.id, m]));
        for (const t of before) {
          this.destroyed.delete(t);
          const m = was.get(t);
          if (!m) continue;
          const x = CX + (m.x - CX) * (HALF / 300),
            z = CZ + (m.z - CZ) * (HALF / 300);
          let best = null,
            bd = 60;
          for (const n of plan) {
            const d = Math.hypot(n.x - x, n.z - z);
            if (d < bd && !this.destroyed.has(n.id)) {
              bd = d;
              best = n;
            }
          }
          if (best) this.destroyed.add(best.id);
        }
      }
      for (const m of plan) this.mansion(m.id, m.x, m.z, m.w, m.h, m.style, m.jewel, m.face);
    }
    // where the houses stand for a city of this size: blocks between the streets, per × per houses in each
    mansionPlan(half, g, per, prefix) {
      const xs = [
          [-half, -g],
          [-g, 0],
          [0, g],
          [g, half],
        ],
        zs = [
          [CZ - half, CZ - g],
          [CZ - g, CZ],
          [CZ, CZ + g],
          [CZ + g, CZ + half],
        ];
      const margin = (v, wall, main) => (v === wall ? 18 : v === main ? (main === 0 ? 38 : 22) : 15);
      const out = [];
      let bi = 0;
      for (const [z0, z1] of zs)
        for (const [x0, x1] of xs) {
          const mx0 = x0 + margin(x0, -half, 0),
            mx1 = x1 - margin(x1, half, 0),
            mz0 = z0 + margin(z0, CZ - half, CZ),
            mz1 = z1 - margin(z1, CZ + half, CZ);
          for (let r = 0; r < per; r++)
            for (let c = 0; c < per; c++) {
              const id = prefix + bi + '-' + (r * per + c),
                roll = this.idRoll(id, '/style'),
                style = roll < 0.42 ? 'house' : roll < 0.84 ? 'villa' : 'tower',
                w = style === 'tower' ? 11 + this.idRoll(id, '/w') * 4 : 14 + this.idRoll(id, '/w') * 8,
                h = style === 'tower' ? 34 + this.idRoll(id, '/h') * 16 : 13 + this.idRoll(id, '/h') * 15;
              const x = mx0 + ((c + 0.5) * (mx1 - mx0)) / per + (this.idRoll(id, '/x') - 0.5) * 5,
                z = mz0 + ((r + 0.5) * (mz1 - mz0)) / per + (this.idRoll(id, '/z') - 0.5) * 5;
              if (Math.hypot(x - THRONE[0], z - THRONE[1]) < 112 + w * 0.6) continue;
              // face the nearest street
              let face = 0,
                best = 1e9;
              for (const ax of [-g, 0, g])
                if (Math.abs(x - ax) < best) {
                  best = Math.abs(x - ax);
                  face = x > ax ? -Math.PI / 2 : Math.PI / 2;
                }
              for (const az of [CZ - g, CZ, CZ + g])
                if (Math.abs(z - az) < best) {
                  best = Math.abs(z - az);
                  face = z > az ? Math.PI : 0;
                }
              out.push({ id, x, z, w, h, style, jewel: JEWELS[(this.idRoll(id, '/j') * 12) | 0], face });
            }
          bi++;
        }
      return out;
    }
    wallSegment(i, [x, z], along, len) {
      const root = this.root,
        sx = along[0] ? len : WALL_T,
        sz = along[0] ? WALL_T : len,
        node = group(root, [x, 0, z]);
      mesh(node, 'box', [0, WALL_H / 2, 0], [sx, WALL_H, sz], JASPER, { type: 23, detail: 0.32, em: 0.08 });
      mesh(node, 'box', [0, WALL_H + 0.8, 0], [sx + (along[0] ? 0 : 2), 1.6, sz + (along[0] ? 2 : 0)], JASPER_PALE, { em: 0.08 });
      mesh(node, 'box', [0, 4, 0], [sx + (along[0] ? 0 : 1.2), 8, sz + (along[0] ? 1.2 : 0)], GOLD_DEEP);
      const n = Math.max(2, Math.floor(len / 18));
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n - 0.5;
        mesh(node, 'box', [along[0] * u * len, WALL_H + 3.6, along[1] * u * len], [along[0] ? 6 : WALL_T + 1, 4, along[0] ? WALL_T + 1 : 6], JASPER_PALE);
      }
      const box = { min: [x - sx / 2, 0, z - sz / 2], max: [x + sx / 2, WALL_H + 5.6, z + sz / 2], wall: i };
      const wall = {
        kind: 'wall',
        fixed: true,
        fixedNote: '도시를 두른 성벽입니다.',
        label: '벽옥 성벽',
        i,
        node,
        box,
        p: [x, WALL_H / 2, z],
        hp: 900,
        alive: true,
        along,
        len,
      };
      this.walls.push(wall);
      if (this.brokenWalls.has(i)) this.breakWall(wall, true);
      else this.solids.push(box);
    }
    gate(x, z, along, n) {
      const root = this.root;
      for (const s of [-1, 1]) {
        const tx = x + along[0] * s * (GATE_W / 2 + 6),
          tz = z + along[1] * s * (GATE_W / 2 + 6);
        mesh(root, 'box', [tx, (WALL_H + 8) / 2, tz], [along[0] ? 12 : 14, WALL_H + 8, along[0] ? 14 : 12], JASPER, { type: 23, detail: 0.32, em: 0.08 });
        mesh(root, 'box', [tx, WALL_H + 9, tz], [along[0] ? 14 : 16, 2, along[0] ? 16 : 14], GOLD);
        this.glow(mesh(root, 'sphere', [tx, WALL_H + 13, tz], [6.5, 6.5, 6.5], PEARL, { em: 0.4 }), 0.4, 0.03);
        this.solids.push({ min: [tx - 7, 0, tz - 7], max: [tx + 7, WALL_H + 16, tz + 7] });
      }
      // each gate a single pearl: a ring of it standing in the wall, a great pearl above
      const yaw = Math.atan2(n[0], n[1]),
        arch = mesh(root, 'torus', [x, 17, z], [21, 26, 21], PEARL, { em: 0.32 });
      arch.r = [Math.PI / 2, yaw, 0];
      this.glow(arch, 0.32, 0.02);
      const inner = mesh(root, 'torus', [x, 17, z], [19.2, 30, 19.2], '#fff7f2', { em: 0.5 });
      inner.r = [Math.PI / 2, yaw, 0];
      this.glow(inner, 0.5, 0.02);
      this.glow(mesh(root, 'sphere', [x, 37, z], [11, 11, 11], PEARL, { em: 0.45 }), 0.45, 0.03);
      mesh(root, 'box', [x, WALL_H - 2, z], [along[0] ? GATE_W + 2 : WALL_T + 2, 8, along[0] ? WALL_T + 2 : GATE_W + 2], JASPER);
      const hw = GATE_W / 2 + 1;
      this.solids.push({ min: [x - (along[0] ? hw : WALL_T / 2 + 1), WALL_H - 6, z - (along[0] ? WALL_T / 2 + 1 : hw)], max: [x + (along[0] ? hw : WALL_T / 2 + 1), WALL_H + 2, z + (along[0] ? WALL_T / 2 + 1 : hw)] });
    }
    mansion(id, x, z, w, h, style, jewel, face) {
      const b = this.building(id, [x, 0, z], w, h, style, style === 'tower' ? 230 : 140),
        node = b.node;
      node.r[1] = face;
      b.radius = w * 0.7;
      const win = (p, s, r = 0) => {
        const m = mesh(node, 'box', p, s, jewel, { em: 0.38 });
        m.r[1] = r;
        m.restEm = 0.38;
        b.glows.push(m);
      };
      if (style === 'house') {
        mesh(node, 'cylinder', [0, 0.6, 0], [w * 1.24, 1.2, w * 1.24], PEARL);
        this.glow(mesh(node, 'cylinder', [0, h * 0.42, 0], [w, h * 0.84, w], MARBLE, { em: 0.16 }), 0.16, 0.02);
        mesh(node, 'cylinder', [0, h * 0.84, 0], [w * 1.07, 0.8, w * 1.07], GOLD);
        mesh(node, 'dome', [0, h * 0.86, 0], [w * 0.98, h * 0.5, w * 0.98], GOLD);
        mesh(node, 'lowSphere', [0, h * 1.13, 0], [1.6, 1.6, 1.6], jewel, { em: 0.6 });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          win([Math.sin(a) * w * 0.505, h * 0.52, Math.cos(a) * w * 0.505], [w * 0.15, h * 0.3, 0.14], a);
        }
        mesh(node, 'box', [0, h * 0.2, w * 0.5], [w * 0.22, h * 0.36, 0.3], GOLD_DEEP);
      } else if (style === 'villa') {
        mesh(node, 'box', [0, 0.5, w * 0.06], [w * 1.25, 1, w * 1.22], PEARL);
        this.glow(mesh(node, 'box', [0, h * 0.4, -w * 0.04], [w, h * 0.8, w * 0.78], MARBLE, { em: 0.16 }), 0.16, 0.02);
        mesh(node, 'box', [0, h * 0.82, 0], [w * 1.08, 0.9, w * 1.0], GOLD);
        for (let i = 0; i < 5; i++) mesh(node, 'cylinder', [(-0.4 + i * 0.2) * w, h * 0.41, w * 0.46], [0.95, h * 0.8, 0.95], PEARL);
        mesh(node, 'box', [0, h * 0.86, w * 0.46], [w * 1.0, 1.1, 1.6], GOLD);
        mesh(node, 'dome', [0, h * 0.86, -w * 0.05], [w * 0.56, h * 0.42, w * 0.56], GOLD);
        win([0, h * 0.5, -w * 0.43], [w * 0.7, h * 0.14, 0.12]);
        win([w * 0.505, h * 0.5, -w * 0.04], [w * 0.5, h * 0.14, 0.12], Math.PI / 2);
        win([-w * 0.505, h * 0.5, -w * 0.04], [w * 0.5, h * 0.14, 0.12], Math.PI / 2);
        mesh(node, 'box', [0, h * 0.22, w * 0.36], [w * 0.2, h * 0.4, 0.3], GOLD_DEEP);
      } else {
        mesh(node, 'hex', [0, 1, 0], [w * 1.5, 2, w * 1.5], PEARL);
        this.glow(mesh(node, 'hex', [0, h * 0.45, 0], [w * 0.72, h * 0.9, w * 0.72], MARBLE, { em: 0.16 }), 0.16, 0.02);
        mesh(node, 'torus', [0, h * 0.68, 0], [w * 0.62, w * 0.62, w * 0.62], GOLD);
        mesh(node, 'cone', [0, h * 1.02, 0], [w * 0.86, h * 0.26, w * 0.86], GOLD);
        mesh(node, 'lowSphere', [0, h * 1.17, 0], [1.8, 1.8, 1.8], jewel, { em: 0.7 });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + Math.PI / 6;
          win([Math.sin(a) * w * 0.33, h * 0.78, Math.cos(a) * w * 0.33], [w * 0.16, h * 0.12, 0.12], a);
        }
      }
      return this.finishBuilding(b);
    }

    /* ---------- the throne, and the one on it ---------- */
    makeRuler() {
      const root = this.root,
        base = group(root, [THRONE[0], 0, THRONE[1]]);
      // dais: three steps of sapphire, rimmed with gold
      for (let i = 0; i < 3; i++) {
        mesh(base, 'cylinder', [0, 1 + i * 2, 0], [44 - i * 9, 2, 44 - i * 9], i % 2 ? SAPPHIRE_PALE : SAPPHIRE, { em: 0.1 });
        mesh(base, 'cylinder', [0, 2 + i * 2, 0], [44.6 - i * 9, 0.25, 44.6 - i * 9], GOLD);
      }
      // the throne, like a sapphire stone
      const th = group(base, [0, 6, 0]);
      mesh(th, 'box', [0, 4.5, -1], [19, 9, 15], SAPPHIRE, { em: 0.12 });
      mesh(th, 'box', [0, 9.2, -1], [19.6, 0.6, 15.6], GOLD);
      mesh(th, 'box', [0, 20, -8.5], [20, 32, 3], SAPPHIRE, { em: 0.12 });
      mesh(th, 'box', [0, 36.5, -8.5], [22, 1.6, 4], GOLD);
      mesh(th, 'sphere', [0, 39, -8.5], [4, 4, 4], JEWELS[0], { em: 0.8 });
      for (const s of [-1, 1]) {
        mesh(th, 'box', [s * 10.6, 11.2, -1], [3, 2.6, 15], SAPPHIRE_PALE, { em: 0.1 });
        mesh(th, 'box', [s * 10.6, 12.7, -1], [3.4, 0.5, 15.4], GOLD);
        mesh(th, 'cylinder', [s * 10.8, 20, -8.5], [2.2, 34, 2.2], GOLD);
        mesh(th, 'sphere', [s * 10.8, 37.6, -8.5], [3, 3, 3], JEWELS[5], { em: 0.7 });
      }
      mesh(base, 'box', [0, 6.8, 12], [12, 1.6, 6], GOLD);
      // the aureole behind it
      this.aureole = mesh(base, 'disc', [0, 30, -12], [64, 0.2, 64], '#fff3cf', { type: 6, em: 1.4, alpha: 0.55 });
      this.aureole.r[0] = Math.PI / 2;
      // the one sitting on it: clothed in a garment down to the foot, girt with a golden girdle
      const body = group(base, [0, 6, 0]),
        G = { em: 0.3 };
      this.godParts = [];
      const part = (geo, p, s, c, o = G) => {
        const n = mesh(body, geo, p, s, c, o);
        this.godParts.push(n);
        return n;
      };
      const IVORY = '#f6efdc',
        C = { em: 0.3, type: 25 };
      // breast and shoulders, a mantle falling behind to the seat
      part('frustum', [0, 21, -1.8], [13.5, 13, 8.4], ROBE, C).r[0] = Math.PI;
      part('sphere', [0, 27, -1.8], [12.6, 4.4, 7.6], ROBE, C);
      for (const s of [-1, 1]) part('sphere', [s * 5.6, 26.2, -1.6], [4.8, 4, 5.8], ROBE, C);
      part('frustum', [0, 17.5, -4.8], [19, 21, 6], IVORY, C);
      // girt about the breast with a golden girdle, a band of gold down the front
      part('torus', [0, 23.2, -1.6], [9.8, 10, 6.6], GOLD, { em: 0.45 });
      part('box', [0, 16, 4.6], [1.4, 11, 0.5], GOLD, { em: 0.35 });
      // the lap, the knees under the cloth, the garment down to the foot
      part('box', [0, 11.6, 3.2], [13.6, 4, 12.4], ROBE, C);
      part('cylinder', [0, 11, 9.2], [8.2, 14.4, 8.2], ROBE, C).r[2] = Math.PI / 2;
      part('frustum', [0, 4.9, 11.2], [16, 10.4, 9.6], ROBE, C);
      part('torus', [0, 0.35, 11.2], [11.2, 6, 6.8], GOLD, { em: 0.35 });
      for (const s of [-1, 1]) {
        part('sphere', [s * 3, 0.9, 15.6], [3.2, 1.9, 4.6], '#d1a752', { em: 0.35 });
        // sleeves wide at the wrist, the hands resting on the arms of the throne
        const up = K.beam(body, [s * 7.2, 25.6, -1.4], [s * 8.8, 17.2, 1.2], 3.8, ROBE, 0.3),
          fore = K.beam(body, [s * 8.8, 17.2, 1.2], [s * 9.4, 13.6, 7.6], 3.4, ROBE, 0.3),
          cuff = part('frustum', [s * 9.25, 14.5, 6], [5, 3.4, 5], ROBE, C);
        up.type = fore.type = 25;
        cuff.r = [-1.06, 0, 0];
        this.godParts.push(up, fore);
        part('sphere', [s * 9.5, 13.3, 9.2], [2.6, 2, 3.4], SKIN, { em: 0.35 });
      }
      this.neck = part('cylinder', [0, 30, -1.6], [3.4, 3, 3.4], FACE, { em: 0.45 });
      this.stump = mesh(body, 'disc', [0, 31.5, -1.5], [3.4, 0.2, 3.4], '#fff1c2', { em: 2.2, type: 1 });
      this.stump.visible = false;
      // the head: it turns to whatever comes near; the face looks out from inside its glare
      const head = group(base, [0, HEAD_Y, -1.5]),
        face = group(head);
      face.r[1] = Math.PI;
      face.s = [3.4, 3.4, 3.4];
      this.headParts = godHead(face, true);
      const halo = group(head, [0, 0.6, -2.4]);
      this.haloRing = mesh(halo, 'torus', [0, 0, 0], [8.5, 8.5, 8.5], '#fff3c8', { em: 2.4, type: 1 });
      this.haloRing.r[0] = Math.PI / 2;
      this.rays = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU,
          L = i % 2 ? 22 : 34,
          ray = mesh(halo, 'box', [Math.sin(a) * (6.5 + L / 2), Math.cos(a) * (6.5 + L / 2), -0.4], [1.1, L, 0.2], '#fff6d8', { em: 1.8, type: 1, alpha: 0.42 });
        ray.r[2] = -a;
        this.rays.push(ray);
      }
      this.glare = mesh(head, 'sphere', [0, 0, 0], [15, 15, 15], '#fff7e2', { em: 2.4, type: 1, alpha: 0.34 });
      this.setupRuler(base, body, head, halo, HEAD_Y, 400, 7);
      // round about the throne a rainbow, in sight like unto an emerald
      this.rainbow = [
        mesh(root, 'torus', [THRONE[0], 20, THRONE[1] - 6], [50, 10, 50], EMERALD, { em: 0.75, type: 1, alpha: 0.66 }),
        mesh(root, 'torus', [THRONE[0], 20, THRONE[1] - 6.3], [46.6, 6, 46.6], '#5fe0a4', { em: 0.5, type: 1, alpha: 0.5 }),
        mesh(root, 'torus', [THRONE[0], 20, THRONE[1] - 5.7], [53.4, 6, 53.4], '#138a52', { em: 0.6, type: 1, alpha: 0.55 }),
      ];
      for (const r of this.rainbow) r.r[0] = Math.PI / 2;
      this.rainbowEntity = { kind: 'rainbow', fixed: true, fixedNote: '빛으로 되어 있습니다.', label: '무지개', alive: !this.rainbowBroken, hp: 380, p: [THRONE[0], 20, THRONE[1] - 6], radius: 36 };
      if (this.rainbowBroken) for (const r of this.rainbow) r.visible = false;
      // seven lamps of fire burning before the throne
      this.lamps = [];
      for (let i = 0; i < 7; i++) {
        const a = (-36 + i * 12) * (Math.PI / 180),
          x = THRONE[0] + Math.sin(a) * 27,
          z = THRONE[1] + Math.cos(a) * 27,
          g = group(root, [x, 0, z]);
        mesh(g, 'cylinder', [0, 0.4, 0], [2.6, 0.8, 2.6], GOLD_DEEP);
        mesh(g, 'cylinder', [0, 4.2, 0], [0.7, 7.2, 0.7], GOLD);
        mesh(g, 'dome', [0, 7.6, 0], [2.6, -1.6, 2.6], GOLD);
        const flame = mesh(g, 'cone', [0, 8.9, 0], [1.5, 3, 1.5], '#ffd27a', { em: 2.6, type: 1 }),
          halo2 = mesh(g, 'sphere', [0, 8.8, 0], [5, 5, 5], '#ffc66b', { em: 1.6, type: 1, alpha: 0.28 });
        this.lamps.push({ flame, halo: halo2, phase: i * 1.7 });
      }
    }

    /* ---------- the host of heaven ---------- */
    makeCreatures() {
      // the twelve at the gates
      this.gates.forEach((g, i) => this.addAngel(this.gateAngel(i, g)));
      for (let i = 0; i < 6; i++) this.addAngel(this.seraph(12 + i));
      for (let i = 0; i < 4; i++) this.addAngel(this.creatureOf(20 + i));
      for (let i = 0; i < 4; i++) this.addAngel(this.wheel(24 + i));
      for (let i = 0; i < 24; i++) this.addAngel(this.elder(28 + i));
      const rng = M.rand(5252);
      for (let i = 0; i < 24; i++) this.addAngel(this.host(52 + i, rng));
      // more of the host, over the wider city
      for (let i = 0; i < 18; i++) this.addAngel(this.host(76 + i, rng));
    }
    addAngel(a) {
      a.kind = 'angel';
      a.alive = true;
      a.maxHp = a.hp;
      a.hit = a.hit || [];
      a.velocity = [0, 0, 0];
      a.thrown = false;
      a.t = 0;
      this.angels.push(a);
      if (this.deadAngels.has(a.i)) this.layDead(a, true);
      return a;
    }
    gateAngel(i, gt) {
      // standing just inside the gate, looking out
      const inward = [-gt.n[0], -gt.n[1]],
        off = gt.river ? 16 : 0,
        x = gt.x + inward[0] * 14 + gt.along[0] * off,
        z = gt.z + inward[1] * 14 + gt.along[1] * off,
        g = group(this.root, [x, 0, z]),
        yaw = Math.atan2(gt.n[0], gt.n[1]);
      g.r[1] = yaw;
      const body = group(g);
      mesh(body, 'cone', [0, 3.6, 0], [3.4, 7.4, 2.8], ROBE, { type: 25 });
      mesh(body, 'lowSphere', [0, 7.1, 0], [2.6, 3.4, 1.8], ROBE);
      mesh(body, 'lowCyl', [0, 6.0, 0], [2.3, 0.4, 1.7], GOLD, { em: 0.25 });
      mesh(body, 'lowSphere', [0, 9.25, 0.05], [1.25, 1.45, 1.25], SKIN);
      mesh(body, 'lowSphere', [0, 9.6, -0.18], [1.36, 1.25, 1.3], '#e2bd6e');
      const halo = mesh(body, 'haloRing', [0, 10.55, -0.15], [1.7, 1.7, 1.7], HALO, { em: 1.8 });
      halo.r[0] = 0.25;
      const armL = group(body, [-1.3, 8.1, 0]),
        armR = group(body, [1.3, 8.1, 0]);
      for (const arm of [armL, armR]) {
        mesh(arm, 'lowCyl', [0, -1.3, 0], [0.75, 2.6, 0.75], ROBE);
        mesh(arm, 'lowSphere', [0, -2.75, 0], [0.55, 0.6, 0.55], SKIN);
      }
      armL.r[2] = -0.12;
      const sword = group(armR, [0, -2.75, 0.1]);
      sword.r[0] = Math.PI / 2;
      mesh(sword, 'lowCyl', [0, 0, 0], [0.26, 1.1, 0.26], GOLD_DEEP);
      mesh(sword, 'box', [0, 0.6, 0], [1.5, 0.22, 0.3], GOLD);
      const blade = mesh(sword, 'box', [0, 3.6, 0], [0.42, 6, 0.12], '#fff1c8', { em: 2.2, type: 1 });
      const flames = [0, 1, 2].map(k => mesh(sword, 'lowCone', [0, 2 + k * 1.9, 0], [1.0, 2.2, 0.5], k ? '#ff9a3a' : '#ffd27a', { em: 2, type: 1, alpha: 0.75 }));
      const wings = wingPair(body, [0.55, 8.2, -0.8], 7.2, 8, FEATHER, FEATHER_TIP, 0.08);
      return {
        cls: 'gate',
        i,
        label: '문지기',
        fixed: true,
        fixedNote: '문 앞에서 움직이지 않습니다.',
        node: g,
        body,
        armR,
        sword,
        blade,
        flames,
        halo,
        wings,
        home: [x, z],
        yaw0: yaw,
        yaw,
        p: g.p,
        radius: 3,
        hp: 160,
        swing: 0,
        swingClock: 1 + i * 0.13,
      };
    }
    seraph(i) {
      const k = i - 12,
        g = group(this.root, [THRONE[0] + Math.sin((k / 6) * TAU) * 26, 54, THRONE[1] + Math.cos((k / 6) * TAU) * 26]);
      const body = group(g);
      mesh(body, 'cone', [0, -1.6, 0], [1.9, 4.6, 1.5], '#ffcf7a', { em: 0.7, type: 25 });
      mesh(body, 'lowSphere', [0, 0.4, 0], [1.6, 2.2, 1.2], '#ffd88a', { em: 0.7 });
      mesh(body, 'lowSphere', [0, 1.95, 0.1], [1.0, 1.1, 0.95], '#ffe7c0', { em: 0.5 });
      const fly = wingPair(body, [0.5, 0.9, -0.4], 7.4, 6, FIRE, FIRE_TIP, 0.65),
        face = wingPair(body, [0.42, 2.0, 0.25], 3.9, 5, FIRE, FIRE_TIP, 0.65),
        feet = wingPair(body, [0.42, -2.6, 0.2], 3.9, 5, FIRE, FIRE_TIP, 0.65);
      return {
        cls: 'seraph',
        i,
        label: '스랍 · Q 견인',
        node: g,
        body,
        fly,
        face,
        feet,
        p: g.p,
        radius: 3.2,
        hp: 140,
        angle: (k / 6) * TAU,
        phase: k * 1.3,
      };
    }
    creatureOf(i) {
      const k = i - 20,
        a = (45 + k * 90) * (Math.PI / 180),
        x = THRONE[0] + Math.sin(a) * 34,
        z = THRONE[1] + Math.cos(a) * 34,
        g = group(this.root, [x, 15, z]);
      g.r[1] = a; // faces outward from the throne
      const kind = ['lion', 'ox', 'man', 'eagle'][k],
        hide = { lion: '#c99446', ox: '#8f5434', man: '#e6d8c0', eagle: '#7a5534' }[kind];
      const body = group(g);
      mesh(body, 'sphere', [0, 0, 0], [4.2, 3.6, 5.6], hide);
      const head = group(body, [0, 2.4, 2.7]);
      this.creatureHead(head, kind, hide);
      const wA = wingPair(body, [1.3, 1.2, -0.7], 6, 7, FEATHER, FEATHER_TIP, 0.1),
        wB = wingPair(body, [1.8, 0.1, -0.9], 7, 7, FEATHER, FEATHER_TIP, 0.1),
        wC = wingPair(body, [1.3, -1.0, -0.5], 5, 6, FEATHER, FEATHER_TIP, 0.1);
      // full of eyes before and behind, and within
      const eyes = [],
        IRIS = ['#d99a1c', '#4fb4dc', '#79c255', '#c8352e', '#7c58d8', '#e6d377'];
      for (let n = 0, made = 0; n < 40 && made < 18; n++) {
        const y = 1 - (2 * (n + 0.5)) / 40,
          r = Math.sqrt(1 - y * y),
          t = n * 2.39996,
          nx = Math.cos(t) * r,
          nz = Math.sin(t) * r;
        if ((nz > 0.55 && y > -0.1) || y < -0.75) continue;
        const e = mesh(body, 'lowSphere', [nx * 2.05, y * 1.75, nz * 2.75], [0.9, 0.9, 0.9], IRIS[made % IRIS.length], { type: 20, em: 1, detail: 0.45, seed: i * 7 + made });
        e.pos = [nx * 2.05, y * 1.75, nz * 2.75];
        e.blink = 1 + ((made * 7) % 9);
        e.close = 0;
        eyes.push(e);
        made++;
      }
      for (const [w, base] of [
        [wA, [0, 0.35, 0.55]],
        [wB, [0, 0.55, 0.05]],
        [wC, [0, 0.4, -0.55]],
      ])
        for (const [side, n] of [
          [1, w[0]],
          [-1, w[1]],
        ])
          setWing(n, side, ...base);
      return {
        cls: 'creature',
        i,
        kind,
        label: { lion: '생물 · 사자 같은 얼굴', ox: '생물 · 송아지 같은 얼굴', man: '생물 · 사람 같은 얼굴', eagle: '생물 · 독수리 같은 얼굴' }[kind],
        fixed: true,
        fixedNote: '보좌에 매여 있습니다.',
        node: g,
        body,
        head,
        wings: [wA, wB, wC],
        eyes,
        home: [x, 15, z],
        yaw0: a,
        p: g.p,
        radius: 3.6,
        hp: 420,
        phase: k * 1.9,
      };
    }
    creatureHead(h, kind, hide) {
      if (kind === 'lion') {
        mesh(h, 'sphere', [0, 0, 0], [2.6, 2.5, 2.5], '#d9a24e');
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU;
          mesh(h, 'lowSphere', [Math.sin(a) * 1.55, Math.cos(a) * 1.55, -0.45], [1.5, 1.5, 1.2], i % 2 ? '#9c6a28' : '#b47c30');
        }
        mesh(h, 'lowSphere', [0, -0.45, 1.15], [1.5, 1.1, 1.3], '#eac283');
        mesh(h, 'tinySphere', [0, -0.15, 1.82], [0.5, 0.36, 0.3], '#3a2418');
        for (const s of [-1, 1]) mesh(h, 'tinySphere', [s * 0.55, 0.38, 1.12], [0.42, 0.32, 0.2], '#2a1a0e');
      } else if (kind === 'ox') {
        mesh(h, 'sphere', [0, 0, 0.2], [2.3, 2.5, 3.0], hide);
        mesh(h, 'lowSphere', [0, -0.7, 1.55], [1.9, 1.4, 1.4], '#c99080');
        for (const s of [-1, 1]) {
          mesh(h, 'tinySphere', [s * 0.45, -0.75, 2.2], [0.3, 0.3, 0.2], '#2a1612');
          mesh(h, 'tinySphere', [s * 0.75, 0.45, 1.1], [0.42, 0.34, 0.2], '#1d120e');
          const horn = K.beam(h, [s * 0.9, 1.0, 0.2], [s * 2.1, 1.7, 0.6], 0.55, '#efe3c4');
          horn.geo = 'lowCone';
          const tip = K.beam(h, [s * 2.1, 1.7, 0.6], [s * 2.5, 2.7, 0.9], 0.38, '#f6eedb');
          tip.geo = 'lowCone';
          const ear = mesh(h, 'lowSphere', [s * 1.35, 0.4, -0.1], [1.2, 0.5, 0.7], hide);
          ear.r[2] = s * 0.3;
        }
      } else if (kind === 'man') {
        mesh(h, 'sphere', [0, 0, 0], [2.0, 2.5, 2.1], '#e8c9a6');
        mesh(h, 'lowSphere', [0, 0.45, -0.3], [2.15, 2.0, 2.0], '#5a3b22');
        mesh(h, 'lowSphere', [0, -0.95, 0.55], [1.6, 1.2, 1.2], '#6b4a2c');
        mesh(h, 'tinySphere', [0, -0.05, 1.05], [0.32, 0.55, 0.3], '#dcb491');
        for (const s of [-1, 1]) mesh(h, 'tinySphere', [s * 0.42, 0.25, 0.94], [0.3, 0.22, 0.14], '#1d1a18');
      } else {
        mesh(h, 'sphere', [0, 0.2, 0], [1.9, 2.1, 2.2], '#f4efe4');
        const beak = mesh(h, 'cone', [0, -0.1, 1.55], [0.9, 1.8, 0.9], '#e9b43a');
        beak.r[0] = Math.PI / 2;
        mesh(h, 'lowSphere', [0, -0.45, 1.55], [0.75, 0.5, 0.8], '#d39a2a');
        for (const s of [-1, 1]) {
          mesh(h, 'tinySphere', [s * 0.62, 0.45, 0.82], [0.42, 0.42, 0.24], '#f2c032');
          mesh(h, 'tinySphere', [s * 0.66, 0.45, 0.92], [0.2, 0.22, 0.12], '#120c06');
        }
      }
    }
    wheel(i) {
      const k = i - 24,
        a = (45 + k * 90) * (Math.PI / 180),
        x = THRONE[0] + Math.sin(a) * 50,
        z = THRONE[1] + Math.cos(a) * 50,
        g = group(this.root, [x, 8, z]);
      // a wheel in the middle of a wheel; their rims were full of eyes round about
      const spinA = group(g),
        spinB = group(g);
      spinB.r[1] = Math.PI / 2;
      const ringsA = group(spinA),
        ringsB = group(spinB);
      for (const [rg, sc] of [
        [ringsA, 10.5],
        [ringsB, 9.6],
      ]) {
        const ring = mesh(rg, 'torus', [0, 0, 0], [sc, sc * 1.4, sc], BERYL, { em: 0.3 });
        ring.r[0] = Math.PI / 2;
        mesh(rg, 'torus', [0, 0, 0], [sc * 0.96, sc * 0.6, sc * 0.96], GOLD, { em: 0.2 }).r[0] = Math.PI / 2;
      }
      mesh(g, 'sphere', [0, 0, 0], [2.4, 2.4, 2.4], '#fff0c0', { em: 1.2, type: 1 });
      const eyes = [];
      for (const [rg, R, n] of [
        [ringsA, 7.9, 12],
        [ringsB, 7.2, 10],
      ])
        for (let e = 0; e < n; e++) {
          const t = (e / n) * TAU,
            dx = Math.cos(t),
            dy = Math.sin(t),
            eye = mesh(rg, 'lowSphere', [dx * R, dy * R, 0], [1.25, 1.25, 1.25], ['#d99a1c', '#4fb4dc', '#79c255'][e % 3], { type: 20, em: 1, detail: 0.4, seed: i * 11 + e });
          eye.r = [-Math.atan2(dy, Math.abs(dx)), Math.atan2(dx, 0.0001), 0];
          eye.blink = 1 + ((e * 5) % 8);
          eye.close = 0;
          eyes.push(eye);
        }
      return {
        cls: 'wheel',
        i,
        label: '바퀴',
        fixed: true,
        fixedNote: '바퀴는 생물을 따라 움직입니다.',
        node: g,
        spinA,
        spinB,
        eyes,
        home: [x, 8, z],
        p: g.p,
        radius: 7,
        hp: 300,
        phase: k * 2.2,
      };
    }
    elder(i) {
      const k = i - 28,
        east = k < 12,
        a = (east ? 1 : -1) * (35 + (k % 12) * 10) * (Math.PI / 180),
        x = THRONE[0] + Math.sin(a) * 78,
        z = THRONE[1] + Math.cos(a) * 78,
        yaw = Math.atan2(-Math.sin(a), -Math.cos(a)), // toward the throne
        seat = group(this.root, [x, 0, z]),
        g = group(this.root, [x, 0, z]);
      seat.r[1] = g.r[1] = yaw;
      // the seat stays where it is whatever happens to the one sitting on it
      mesh(seat, 'box', [0, 0.65, -0.2], [2.2, 1.3, 2.0], MARBLE);
      mesh(seat, 'box', [0, 2.1, -1.15], [2.2, 3.0, 0.35], MARBLE);
      mesh(seat, 'box', [0, 3.7, -1.15], [2.5, 0.3, 0.5], GOLD);
      for (const s of [-1, 1]) mesh(seat, 'box', [s * 1.05, 1.6, -0.2], [0.25, 0.6, 1.9], GOLD);
      // clothed in white raiment, with crowns of gold on their heads
      const fig = group(g, [0, 1.3, 0.75]);
      mesh(fig, 'lowSphere', [0, 0.05, -0.55], [1.5, 1.0, 1.9], ROBE);
      mesh(fig, 'lowCyl', [0, -0.6, 0.35], [1.4, 1.3, 0.9], ROBE);
      mesh(fig, 'lowSphere', [0, 1.2, -0.75], [1.3, 1.9, 1.0], ROBE);
      mesh(fig, 'lowSphere', [0, 2.65, -0.7], [0.72, 0.84, 0.7], SKIN);
      mesh(fig, 'lowSphere', [0, 2.85, -0.8], [0.78, 0.7, 0.72], '#ece9e2');
      mesh(fig, 'lowSphere', [0, 2.3, -0.45], [0.62, 0.72, 0.5], '#f2efe8');
      for (const s of [-1, 1]) {
        const arm = K.beam(fig, [s * 0.62, 1.85, -0.7], [s * 0.72, 0.65, 0.15], 0.32, ROBE);
        arm.geo = 'lowCyl';
      }
      const crown = group(this.root, [x, 4.6, z]);
      mesh(crown, 'lowCyl', [0, 0, 0], [0.85, 0.28, 0.85], GOLD, { em: 0.35 });
      for (let c = 0; c < 6; c++) {
        const t = (c / 6) * TAU;
        mesh(crown, 'lowCone', [Math.sin(t) * 0.36, 0.32, Math.cos(t) * 0.36], [0.18, 0.42, 0.18], GOLD, { em: 0.35 });
      }
      return {
        cls: 'elder',
        i,
        label: '장로 · Q 견인',
        node: g,
        fig,
        crown,
        seat: [x, z],
        yaw: g.r[1],
        p: g.p,
        radius: 1.6,
        hp: 1,
        worship: 'seated',
        wt: 0,
        crownFrom: null,
        crownTo: [THRONE[0] + Math.sin(a) * 25.5, 0.25, THRONE[1] + Math.cos(a) * 25.5],
      };
    }
    host(i, rng) {
      const g = group(this.root, [0, 100, 0]),
        body = group(g);
      mesh(body, 'cone', [0, -1.6, 0], [1.9, 4, 1.6], ROBE, { type: 25 });
      mesh(body, 'lowSphere', [0, 0.4, 0], [1.5, 2.0, 1.1], ROBE);
      mesh(body, 'lowSphere', [0, 1.9, 0.05], [0.8, 0.92, 0.8], SKIN);
      mesh(body, 'lowSphere', [0, 2.1, -0.12], [0.86, 0.8, 0.84], i % 3 ? '#e2bd6e' : '#5a3b22');
      const halo = mesh(body, 'haloRing', [0, 2.75, -0.12], [1.1, 1.1, 1.1], HALO, { em: 1.6 });
      halo.r[0] = 0.25;
      for (const s of [-1, 1]) {
        const arm = K.beam(body, [s * 0.8, 1.0, 0], [s * 1.0, -0.4, 0.5], 0.5, ROBE);
        arm.geo = 'lowCyl';
      }
      const wings = wingPair(body, [0.4, 0.9, -0.5], 5, 6, FEATHER, FEATHER_TIP, 0.08);
      return {
        cls: 'host',
        i,
        label: '천사 · Q 견인',
        node: g,
        body,
        wings,
        p: g.p,
        radius: 2.4,
        hp: 60,
        c: [CX + (rng() - 0.5) * 600, CZ + (rng() - 0.5) * 600],
        R: 70 + rng() * 110,
        alt: 75 + rng() * 95,
        w: (0.1 + rng() * 0.13) * (rng() < 0.5 ? -1 : 1),
        th: rng() * TAU,
        phase: rng() * TAU,
      };
    }

    /* ---------- the people ---------- */
    residentSpec() {
      return {
        species: 'saved',
        count: 1000,
        seed: 1818,
        center: [CX, CZ],
        radius: 430,
        maxR: 680,
        cap: 1100,
        minR: 104,
        road: { x: 30, z0: RIVER.z0 + 6, z1: CZ + HALF - 12 },
        throne: THRONE,
        throneR: 102,
        occupancy: b => 6 + b.w * b.h * 0.1,
        calm: () => !this.ruler.captured,
        mix: this.mixSpec(),
        clamp: p => this.clampPerson(p),
      };
    }
    // Who else is here: everyone killed on the worlds this ship has visited, in white, with the rest.
    mixSpec() {
      const save = this.game.save,
        u = this.game.universe,
        L = K.ResidentLedger;
      const src = ['eden', 'p0006', 'p0011', 'p0012'];
      const victims = src.map(id => {
        const st = L?.read(save, id),
          h = u.hits(id);
        if (!L || (!st && !h)) return 0;
        const pop = u.population(id);
        return Math.max(0, pop - L.planetAlive(save, id, pop, h));
      });
      victims.push(u.lost || 0);
      const V = victims.reduce((a, b) => a + b, 0),
        f = V > 0 ? Math.min(0.55, V / (V + 1500)) : 0;
      this.victimShare = f;
      return {
        slots: ['saved', 'eden-robed', 'mycel-robed', 'cinder-robed', 'nacre-robed', 'subject-robed'],
        weights: [1 - f].concat(victims.map(v => (V ? (f * v) / V : 0))),
      };
    }
    clampPerson(p) {
      const lim = HALF - 7;
      p[0] = M.clamp(p[0], CX - lim, CX + lim);
      p[2] = M.clamp(p[2], CZ - lim, CZ + lim);
      // around the trunks of the trees by the river
      if (p[2] > RIVER.z0 && Math.abs(Math.abs(p[0]) - 14.5) < 2.2) {
        const k = Math.round((p[2] - 66) / 15);
        if (k >= 0 && k < TREES) {
          const tz = 66 + k * 15,
            tx = Math.sign(p[0] || 1) * 14.5,
            dx = p[0] - tx,
            dz = p[2] - tz,
            d = Math.hypot(dx, dz);
          if (d < 1.9 && d > 0.001) {
            p[0] = tx + (dx / d) * 1.9;
            p[2] = tz + (dz / d) * 1.9;
          }
        }
      }
    }

    /* ---------- trees of life, feathers ---------- */
    makeScenery() {
      const all = this.residents.all,
        make = (geo, opts = {}) => {
          const b = this.game.engine.makeBatch(geo, { capacity: 128, dynamic: false, ...opts });
          all.push(b);
          return b;
        };
      this.treeStore = { taper: make('taper'), lowSphere: make('lowSphere'), tinySphere: make('tinySphere') };
      this.featherBatch = make('lowSphere', { capacity: 256 });
      this.markBatch = make('lowDisc', { transparent: true, capacity: 64 });
      // the first thirteen a side keep the numbers they always had; the river is longer now and more stand along it
      for (const side of [-1, 1])
        for (let k = 0; k < TREES; k++) {
          const i = k < 13 ? (side < 0 ? 0 : 13) + k : 26 + (side < 0 ? 0 : TREES - 13) + (k - 13),
            x = side * 14.5,
            z = 66 + k * 15;
          const t = {
            kind: 'tree',
            fixed: true,
            fixedNote: '뿌리가 내려 있습니다.',
            label: '생명나무',
            i,
            x,
            z,
            h: 11 + ((i * 7) % 5) * 0.5,
            hp: 110,
            alive: !this.deadTrees.has(i),
            p: [x, 12, z],
            radius: 7,
            seed: i * 13 + 5,
          };
          if (t.alive && this.ruinFrac > 0 && this.idRoll('tree-' + i, '/ruin') < this.ruinFrac) t.alive = false;
          this.trees.push(t);
        }
      this.drawTrees();
      // what fell before
      for (const a of this.angels) if (!a.alive && a.landed) this.feathersFor(a);
    }
    drawTrees() {
      const S = this.treeStore;
      for (const k in S) this.game.engine.resetBatch(S[k]);
      const put = (b, x, y, z, rx, ry, rz, sx, sy, sz, c, em = 0) => {
        const d = this.game.engine.growBatch(b, b.count + 1),
          o = b.count * 24;
        trs(d, o, x, y, z, rx, ry, rz, sx, sy, sz);
        d[o + 16] = c[0];
        d[o + 17] = c[1];
        d[o + 18] = c[2];
        d[o + 19] = 1;
        d[o + 20] = em;
        d[o + 21] = 0;
        d[o + 22] = 0;
        d[o + 23] = 0;
        b.count++;
      };
      const dark = this.dark,
        bark = rgb('#8a6a3e'),
        burnt = rgb('#2c2620'),
        leaves = [rgb('#2f9a48'), rgb('#4cbf5a'), rgb('#237f3f'), rgb('#7ad06a')];
      for (const t of this.trees) {
        const rng = M.rand(t.seed),
          h = t.h;
        put(S.lowSphere, t.x, 0.3, t.z, 0, 0, 0, 3.4, 1.4, 3.4, bark);
        if (!t.alive) {
          // a stump, the trunk on the ground beside it, the fruit spilled
          put(S.taper, t.x, 1.4, t.z, 0, 0, 0.08, 1.9, 2.8, 1.9, burnt);
          const a = rng() * TAU;
          put(S.taper, t.x + Math.sin(a) * h * 0.45, 0.9, t.z + Math.cos(a) * h * 0.45, Math.PI / 2, a, 0, 1.6, h * 0.8, 1.6, burnt);
          for (let k = 0; k < 4; k++) {
            const b = a + (rng() - 0.5) * 0.8,
              d = h * (0.6 + rng() * 0.5);
            put(S.lowSphere, t.x + Math.sin(b) * d, 0.8, t.z + Math.cos(b) * d, 0, rng() * 3, 0, 5 + rng() * 3, 1.6, 5 + rng() * 3, rgb('#3a3324'));
          }
          for (let f = 0; f < 12; f++) {
            const b = rng() * TAU,
              d = 2 + rng() * h * 0.9;
            put(S.tinySphere, t.x + Math.sin(b) * d, 0.35, t.z + Math.cos(b) * d, 0, 0, 0, 0.8, 0.7, 0.8, rgb(FRUIT[f]), 0);
          }
          continue;
        }
        // trunk and boughs
        put(S.taper, t.x, h * 0.28, t.z, 0, 0, (rng() - 0.5) * 0.06, 1.25, h * 0.56, 1.25, bark);
        for (let b = 0; b < 4; b++) {
          const a = (b / 4) * TAU + rng();
          put(S.taper, t.x + Math.sin(a) * 1.1, h * 0.47, t.z + Math.cos(a) * 1.1, Math.cos(a) * 0.8, 0, -Math.sin(a) * 0.8, 0.55, h * 0.32, 0.55, bark);
        }
        // the crown: a heap of leaf clumps, the twelve fruits hanging at its rim
        const top = h * 0.78,
          blobs = [[t.x, top + 0.4, t.z, 3.5]];
        for (let c = 0; c < 9; c++) {
          const a = (c / 9) * TAU + rng() * 0.4,
            d = 2.9 + rng() * 0.8;
          blobs.push([t.x + Math.sin(a) * d, top - 1 + (rng() - 0.5) * 1.4, t.z + Math.cos(a) * d, 2.4 + rng() * 0.9]);
        }
        for (let c = 0; c < 4; c++) {
          const a = (c / 4) * TAU + rng();
          blobs.push([t.x + Math.sin(a) * 1.7, top - 2.3, t.z + Math.cos(a) * 1.7, 2.3]);
        }
        const k = dark ? 0.3 : 1;
        blobs.forEach((bl, c) => {
          const col = leaves[(c + t.i) % 4];
          COL[0] = col[0] * k;
          COL[1] = col[1] * k;
          COL[2] = col[2] * k;
          put(S.lowSphere, bl[0], bl[1], bl[2], 0, rng() * 3, 0, bl[3] * 2.1, bl[3] * 1.7, bl[3] * 2.1, COL, dark ? 0 : 0.06);
        });
        for (let f = 0; f < 12; f++) {
          const a = (f / 12) * TAU + rng() * 0.3,
            d = 3.5 + rng() * 1.1;
          put(S.tinySphere, t.x + Math.sin(a) * d, top - 2.1 - rng() * 1.3, t.z + Math.cos(a) * d, 0, 0, 0, 1.15, 1.35, 1.15, rgb(FRUIT[f]), dark ? 0 : 0.5);
          if (f % 2) put(S.tinySphere, t.x + Math.sin(a + 0.3) * (d - 0.6), top + 0.6 + rng() * 1.6, t.z + Math.cos(a + 0.3) * (d - 0.6), 0, 0, 0, 1.0, 1.15, 1.0, rgb(FRUIT[(f + 5) % 12]), dark ? 0 : 0.5);
        }
      }
    }
    // feathers lie around whatever fell
    feathersFor(a) {
      const b = this.featherBatch,
        rng = M.rand(a.i * 977 + 3),
        n = a.cls === 'elder' ? 0 : a.cls === 'host' ? 14 : a.cls === 'wheel' ? 0 : 26,
        x = a.node.p[0],
        z = a.node.p[2];
      if (a.lost || !this.onPlatform(x, z)) return;
      const col = a.cls === 'seraph' ? rgb('#5a3a26') : rgb('#f4f0e6');
      for (let k = 0; k < n; k++) {
        const t = rng() * TAU,
          d = 1 + Math.pow(rng(), 0.6) * (a.cls === 'creature' ? 11 : 8),
          d2 = this.game.engine.growBatch(b, b.count + 1),
          o = b.count * 24;
        trs(d2, o, x + Math.sin(t) * d, 0.09, z + Math.cos(t) * d, (rng() - 0.5) * 0.15, rng() * TAU, 0, 0.42, 0.06, 1.5 + rng() * 0.9);
        d2[o + 16] = col[0];
        d2[o + 17] = col[1];
        d2[o + 18] = col[2];
        d2[o + 19] = 1;
        d2[o + 20] = 0;
        d2[o + 21] = 0;
        d2[o + 22] = 0;
        d2[o + 23] = 0;
        b.count++;
      }
      // where they lie, a little of what ran in them
      const m = this.markBatch,
        c = a.cls === 'elder' ? rgb('#6a1420') : rgb(ICHOR),
        d3 = this.game.engine.growBatch(m, m.count + 1),
        o = m.count * 24,
        r = a.cls === 'creature' ? 9 : a.cls === 'elder' ? 2.2 : a.cls === 'gate' ? 6 : 4.5;
      trs(d3, o, x, 0.12 + (a.i % 7) * 0.004, z, 0, rng() * TAU, 0, r, 0.02, r * 1.3);
      d3[o + 16] = c[0];
      d3[o + 17] = c[1];
      d3[o + 18] = c[2];
      d3[o + 19] = 0.7;
      d3[o + 20] = a.cls === 'elder' ? 0 : 0.25;
      d3[o + 21] = 6;
      d3[o + 22] = 0;
      d3[o + 23] = 0;
      m.count++;
    }

    /* ---------- death of the deathless ---------- */
    // Place a dead angel where it lies. `old` = it died on an earlier visit.
    layDead(a, old = false) {
      a.alive = false;
      a.dying = null;
      a.landed = true;
      const g = a.node;
      if (a.cls === 'gate') {
        g.p[1] = 0.9;
        g.r = [Math.PI / 2 - 0.08, old ? a.yaw0 : a.yaw, 0.05];
        this.droopWings(a.wings, 0.1);
        for (const f of a.flames) f.visible = false;
        a.blade.em = 0;
        a.blade.type = 0;
        a.blade.color = rgb('#8f8a7a');
        a.halo.visible = false;
      } else if (a.cls === 'seraph' || a.cls === 'host') {
        const at = this.fellAt.get(a.i);
        if (old && !at) {
          g.visible = false; // fell into the clouds
          a.lost = true;
          a.landed = false;
          return;
        }
        if (at) {
          g.p[0] = at.x;
          g.p[2] = at.z;
          g.r[1] = at.yaw;
        }
        g.p[1] = a.cls === 'seraph' ? 1.2 : 0.8;
        g.r[0] = Math.PI / 2 - 0.1;
        g.r[2] = 0.08;
        if (a.body) a.body.r = [0, 0, 0];
        if (a.cls === 'seraph') {
          for (const pair of [a.fly, a.face, a.feet]) this.droopWings(pair, 0.05);
          if (old) tintAll(g, 0.5, 0.05);
        } else {
          this.droopWings(a.wings, 0.12);
          a.node.children[0].children.forEach(n => n.geo === 'haloRing' && (n.visible = false));
        }
      } else if (a.cls === 'creature') {
        if (old) {
          g.p[0] = a.home[0];
          g.p[2] = a.home[2];
        }
        g.p[1] = 2.4;
        g.r = [0.05, a.yaw0, Math.PI / 2 - 0.25];
        for (const e of a.eyes) e.em = 0;
        for (const pair of a.wings) this.droopWings(pair, -0.2);
      } else if (a.cls === 'wheel') {
        g.p[1] = 1.4;
        g.r = [Math.PI / 2, g.r[1], 0];
        a.spinB.r[1] = 0.15;
        for (const e of a.eyes) e.em = 0;
        tintAll(g, 0.75);
      } else if (a.cls === 'elder') {
        // slumped where they sat, face down where they bowed, or where they were thrown
        const at = this.fellAt.get(a.i);
        if (at) {
          g.p[0] = at.x;
          g.p[1] = 0;
          g.p[2] = at.z;
          g.r = [0, at.yaw, 0];
          a.fig.p = [0, 0.45, 0];
          a.fig.r = [1.45, 0, 0.2];
        } else if (a.worship === 'prostrate' || a.worship === 'bow') a.fig.r[0] = 1.45;
        else {
          a.fig.r[0] = 0.55;
          a.fig.r[2] = 0.35;
        }
        if (a.worship === 'seated') a.crown.visible = false;
      }
      if (!old && this.featherBatch) this.feathersFor(a);
    }
    droopWings(pair, rz) {
      if (!pair) return;
      setWing(pair[0], 1, 0.05, 0.55, rz);
      setWing(pair[1], -1, 0.05, 0.55, rz);
    }
    killAngel(a, dir = [0, 1, 0], cause = 'beam') {
      if (!a.alive || a.dying) return;
      this.deadAngels.add(a.i);
      if (this.vehicle?.grab === a) this.vehicle.release();
      const p = a.node.p,
        [pan, gain] = this.where(p);
      this.game.audio.fallen(pan, Math.max(0.35, gain), a.cls === 'creature' || a.cls === 'wheel' || a.cls === 'gate' ? 1.6 : 1);
      if (a.cls !== 'elder') this.emit([p[0], p[1] + (a.cls === 'gate' ? 6 : 0), p[2]], a.cls === 'host' ? 8 : 16, a.cls === 'seraph' ? FIRE : FEATHER, 10, 2.2);
      if (a.cls === 'elder') {
        a.alive = false;
        this.emit([p[0], 2.2, p[2]], 4, '#7a1622', 6, 1);
        this.layDead(a);
        return;
      }
      if (a.cls === 'gate') {
        // he falls on his face, sword and all
        a.dying = { t: 0, kind: 'topple' };
        for (const f of a.flames) f.visible = false;
        a.halo.visible = false;
        return;
      }
      const drift = a.cls === 'creature' ? 1.5 : a.cls === 'wheel' ? 0 : 8;
      a.dying = {
        t: 0,
        kind: 'fall',
        v: [dir[0] * drift + (Math.random() - 0.5) * drift * 0.5, a.cls === 'wheel' ? 0 : 3, dir[2] * drift + (Math.random() - 0.5) * drift * 0.5],
        spin: a.cls === 'wheel' ? 0 : (Math.random() - 0.5) * 3,
      };
      if (a.cls === 'creature') for (const e of a.eyes) e.close = 99;
      if (a.cls === 'seraph') tintAll(a.node, 0.5, 0.05);
      this.provoke(p, 1.2);
      if (a.cls === 'creature') {
        const left = this.creaturesAlive();
        this.later(1.4, () => {
          if (this.disposed || this.ruler.captured) return;
          if (!left) this.game.ui.toast('네 생물이 모두 떨어졌습니다', '이제 신의 머리를 붙잡을 수 있습니다. 가까이 가서 Q.', 7);
          else this.game.ui.toast('생물 하나가 떨어졌습니다', '남은 생물 ' + left, 3);
        });
      }
    }
    creaturesAlive() {
      let n = 0;
      for (const a of this.angels) if (a.cls === 'creature' && a.alive && !a.dying) n++;
      return n;
    }
    guardText() {
      const n = this.creaturesAlive();
      return n ? '신 · 네 생물이 지키고 있습니다 · 남은 생물 ' + n : null;
    }
    lockedText() {
      return ['신에게 닿지 않습니다', '보좌 둘레의 네 생물을 먼저 떨어뜨리세요. 남은 생물 ' + this.creaturesAlive()];
    }

    /* ---------- weapons against it ---------- */
    grabCandidates() {
      const out = super.grabCandidates();
      for (const a of this.angels) if (a.alive && !a.dying && !a.fixed) out.push(a);
      return out;
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
      for (const a of this.angels) {
        if (!a.alive || a.dying) continue;
        for (const s of a.hit) consider(hit(s[0], s[1], s[2], s[3]), a);
      }
      for (const t of this.trees) {
        if (!t.alive) continue;
        consider(hit(t.x, t.h * 0.74, t.z, 6.2), t);
        consider(hit(t.x, t.h * 0.3, t.z, 1.3), t);
      }
      for (const w of this.walls) if (w.alive) consider(M.rayBox(origin, dir, w.box.min, w.box.max), w);
      if (this.rainbowEntity.alive && !this.dark)
        for (let k = 0; k < 20; k++) {
          const t = (k / 20) * TAU,
            y = 20 + Math.cos(t) * 36;
          if (y < 0) continue;
          consider(hit(THRONE[0] + Math.sin(t) * 36, y, THRONE[1] - 6, 3), this.rainbowEntity);
        }
      // the body on the throne: it takes the beam and nothing happens to it
      const bx = THRONE[0],
        bz = THRONE[1];
      consider(hit(bx, 25, bz - 1.5, 7.6), this.godBody);
      consider(hit(bx, 16.8, bz + 3.5, 6.6), this.godBody);
      consider(hit(bx, 10.6, bz + 10.5, 6), this.godBody);
      consider(M.rayBox(origin, dir, [bx - 10, 6, bz - 10], [bx + 10, 44, bz - 7]), this.godBody);
      return best ? { entity: best, distance: dist, point: M.add(origin, M.mul(dir, dist)) } : null;
    }
    damage(e, amount, dir, source) {
      if (!e || !Number.isFinite(amount) || amount <= 0) return;
      if (e.kind === 'angel') {
        if (!e.alive || e.dying) return;
        e.hp -= e.cls === 'elder' && source !== 'beam' && amount < 25 ? 0 : amount;
        e.hurt = 0.4;
        if (e.hp <= 0) this.killAngel(e, dir || [0, 1, 0], source);
        else if (Math.random() < 0.05) this.provoke(e.node.p, 0.7);
        return;
      }
      if (e.kind === 'tree') {
        if (!e.alive) return;
        e.hp -= amount;
        if (e.hp <= 0) this.fellTree(e);
        return;
      }
      if (e.kind === 'wall') {
        if (!e.alive) return;
        e.hp -= amount;
        e.node.p[1] = Math.sin(this.time * 60) * 0.06 * (1 - e.hp / 900);
        if (e.hp <= 0) this.breakWall(e);
        return;
      }
      if (e.kind === 'rainbow') {
        if (!e.alive) return;
        e.hp -= amount;
        if (e.hp <= 0) this.breakRainbow();
        return;
      }
      if (e.kind === 'god' || e === this.ruler) {
        if (!this.ruler.captured) this.provoke(this.vehicle.p, source === 'beam' ? 0.5 : 1);
        return;
      }
      super.damage(e, amount, dir, source);
    }
    fellTree(t) {
      t.alive = false;
      this.deadTrees.add(t.i);
      this.emit([t.x, t.h * 0.74, t.z], 20, '#4aa857', 14, 2.4);
      this.emit([t.x, t.h * 0.7, t.z], 10, FRUIT[t.i % 12], 9, 2);
      this.game.audio.impact(1.1);
      this.drawTrees();
      this.provoke([t.x, 0, t.z], 0.6);
      if (this.vehicle?.grab === t) this.vehicle.release();
    }
    breakWall(w, old = false) {
      w.alive = false;
      this.brokenWalls.add(w.i);
      w.node.visible = false;
      this.solids = this.solids.filter(s => s !== w.box);
      const rng = M.rand(w.i * 331 + 7),
        n = Math.round(w.len / 9);
      for (let k = 0; k < n; k++) {
        const u = (rng() - 0.5) * w.len,
          off = (rng() - 0.5) * 14,
          x = w.p[0] + w.along[0] * u + (w.along[0] ? 0 : off),
          z = w.p[2] + w.along[1] * u + (w.along[1] ? 0 : off),
          s = 3 + rng() * 6;
        const m = mesh(this.root, 'box', [x, s * 0.3, z], [s * 1.3, s * 0.7, s], k % 4 ? JASPER : JASPER_PALE);
        m.r = [rng() * 0.6, rng() * 3, rng() * 0.6];
      }
      if (old) return;
      for (let k = 0; k < 6; k++) {
        const u = (k / 5 - 0.5) * w.len;
        this.emit([w.p[0] + w.along[0] * u, WALL_H * 0.5, w.p[2] + w.along[1] * u], 6, JASPER, 18, 2.2);
      }
      this.game.audio.impact(2);
      if (this.vehicle) this.vehicle.shake = Math.max(this.vehicle.shake, 0.6);
      this.provoke(w.p, 1);
    }
    breakRainbow() {
      const e = this.rainbowEntity;
      e.alive = false;
      this.rainbowBroken = true;
      for (const r of this.rainbow) r.visible = false;
      for (let k = 0; k < 14; k++) {
        const t = (k / 14) * TAU,
          y = 20 + Math.cos(t) * 36;
        if (y > 0) this.emit([THRONE[0] + Math.sin(t) * 36, y, THRONE[1] - 6], 5, k % 2 ? EMERALD : '#a8ffd4', 12, 2.4, true);
      }
      this.game.audio.fallen(0, 1, 0.7);
      this.provoke(this.vehicle.p, 1.2);
      this.game.ui.toast('무지개가 깨졌습니다', '보좌를 두른 빛이 없어졌습니다.', 4);
    }
    shock(p, radius, force, opts) {
      super.shock(p, radius, force, opts);
      for (const a of this.angels) {
        if (!a.alive || a.dying) continue;
        const d = M.dist(a.node.p, p);
        if (d < radius + a.radius) this.damage(a, force * Math.max(0.3, 1 - d / (radius + a.radius)), M.norm(M.sub(a.node.p, p)), 'pulse');
      }
      for (const t of this.trees) if (t.alive && Math.hypot(t.x - p[0], t.z - p[2]) < radius + 6 && p[1] < t.h + radius) this.damage(t, force * 0.6, [0, 1, 0], 'pulse');
      for (const w of this.walls) if (w.alive && this.boxDist(w.box, p) < radius) this.damage(w, force * 0.8, [0, 1, 0], 'pulse');
    }
    boxDist(b, p) {
      const dx = Math.max(b.min[0] - p[0], 0, p[0] - b.max[0]),
        dy = Math.max(b.min[1] - p[1], 0, p[1] - b.max[1]),
        dz = Math.max(b.min[2] - p[2], 0, p[2] - b.max[2]);
      return Math.hypot(dx, dy, dz);
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
    collide(ship, dt) {
      super.collide(ship, dt);
      const speed = M.len(ship.velocity),
        ram = speed > 18 && ship.hitCooldown <= 0;
      const struck = (k = 0.7) => {
        ship.hitCooldown = 0.3;
        ship.shake = Math.max(ship.shake, k);
        this.game.audio.impact(0.9);
      };
      // the floor of the city is a slab of twelve stones: solid from below and from the side
      const px = ship.p[0] - CX,
        pz = ship.p[2] - CZ,
        y = ship.p[1],
        lim = EDGE + 2.6;
      if (Math.abs(px) < lim && Math.abs(pz) < lim && y < -2 && y > -DEPTH - 3.6) {
        const pens = [lim - Math.abs(px), lim - Math.abs(pz), y + DEPTH + 3.6];
        if (pens[2] <= pens[0] && pens[2] <= pens[1]) {
          ship.p[1] = -DEPTH - 3.6;
          ship.velocity[1] = Math.min(0, ship.velocity[1]);
        } else if (pens[0] < pens[1]) {
          ship.p[0] = CX + Math.sign(px || 1) * lim;
          ship.velocity[0] *= -0.2;
        } else {
          ship.p[2] = CZ + Math.sign(pz || 1) * lim;
          ship.velocity[2] *= -0.2;
        }
      }
      for (const b of this.solids)
        if (this.pushBox(ship, b) && ram && b.wall != null) {
          struck(0.8);
          const w = this.walls[b.wall];
          if (w) this.damage(w, 60 + speed * 3.1, M.norm(ship.velocity), 'ram');
        }
      for (const a of this.angels) {
        if (!a.alive || a.dying || this.vehicle.grab === a) continue;
        for (const s of a.hit)
          if (this.pushSphere(ship, s, s[3] + 2.4)) {
            if (ram) {
              struck(0.6);
              this.damage(a, speed * 2.2, M.norm(ship.velocity), 'ram');
              this.game.audio.clank(0, 0.8);
            }
            break;
          }
      }
      for (const t of this.trees)
        if (t.alive && this.pushSphere(ship, [t.x, t.h * 0.74, t.z], 8.4) && ram) {
          struck(0.5);
          this.damage(t, speed * 2.5, M.norm(ship.velocity), 'ram');
        }
      // the body on the throne does not move for the ship
      const bx = THRONE[0],
        bz = THRONE[1];
      let touched = this.pushSphere(ship, [bx, 25, bz - 1.5], 10.2) || this.pushSphere(ship, [bx, 16.8, bz + 3.5], 9.2) || this.pushSphere(ship, [bx, 10.6, bz + 10.5], 8.6);
      touched = this.pushBox(ship, { min: [bx - 10, 6, bz - 10], max: [bx + 10, 44, bz - 7] }) || touched;
      if (!this.ruler.captured && this.vehicle.grab !== this.ruler) touched = this.pushSphere(ship, this.ruler.p, 9.6) || touched;
      if (touched && ram && !this.ruler.captured) {
        struck(1);
        this.provoke(ship.p, 1.2);
      }
    }

    /* ---------- thunder ---------- */
    // Out of the throne proceed lightnings and thunderings. It never strikes the ship. It never needs to.
    provoke(near, k = 1) {
      if (this.dark || this.provokeClock > 0) return;
      this.provokeClock = 1.6 + Math.random() * 1.4;
      const v = this.vehicle?.p || near,
        a = Math.random() * TAU,
        d = 14 + Math.random() * 18,
        tx = v[0] + Math.sin(a) * d,
        tz = v[2] + Math.cos(a) * d,
        ty = this.onPlatform(tx, tz) ? this.floor(tx, tz) : Math.min(v[1] - 30, -10);
      this.strike([THRONE[0], 44, THRONE[1] - 8], [tx, ty, tz], k);
    }
    strike(a, b, k = 1) {
      const segs = 9,
        pts = [a];
      const len = M.dist(a, b);
      for (let i = 1; i < segs; i++) {
        const t = i / segs,
          j = len * 0.06 * (1 - Math.abs(t - 0.5));
        pts.push([a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * j * 2, a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * j, a[2] + (b[2] - a[2]) * t + (Math.random() - 0.5) * j * 2]);
      }
      pts.push(b);
      const nodes = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const n = K.beam(this.fxRoot, pts[i], pts[i + 1], 0.55 + k * 0.25, '#eef4ff', 3.2);
        n.type = 1;
        nodes.push(n);
      }
      // a branch
      const from = pts[3 + ((Math.random() * 3) | 0)],
        to = M.add(from, [(Math.random() - 0.5) * len * 0.35, -len * 0.12, (Math.random() - 0.5) * len * 0.35]);
      const br = K.beam(this.fxRoot, from, to, 0.35, '#dfe9ff', 2.6);
      br.type = 1;
      nodes.push(br);
      this.bolts.push({ nodes, t: 0, life: 0.26 });
      if (this.bolts.length > 6) for (const n of this.bolts.shift().nodes) this.fxRoot.remove(n);
      this.flash = Math.max(this.flash, 0.5 * k);
      const [pan, gain] = this.where(b),
        dist = M.dist(this.game.engine.camera.p, b);
      this.game.audio.thunder(Math.max(0.4, Math.min(1.4, k * (0.5 + gain))), pan, Math.min(1.6, dist / 340));
      if (gain > 0.3 && this.vehicle) this.vehicle.shake = Math.max(this.vehicle.shake, 0.25 * k);
    }
    where(p) {
      const cam = this.game.engine.camera,
        r = M.right(cam.yaw),
        dx = p[0] - cam.p[0],
        dy = p[1] - cam.p[1],
        dz = p[2] - cam.p[2],
        d = Math.hypot(dx, dy, dz) || 1;
      return [((dx * r[0] + dz * r[2]) / d) * 0.85, Math.pow(Math.max(0, 1 - d / 300), 1.3)];
    }

    /* ---------- life ---------- */
    updateWorld(dt) {
      const ship = this.vehicle.p,
        r = this.ruler,
        pulling = this.vehicle.grab === r,
        tension = pulling ? Math.min(1, this.vehicle.tension / 1.8) : 0;
      this.provokeClock = Math.max(0, this.provokeClock - dt);
      if (!r.captured) r.hp = this.creaturesAlive() * 100;
      // pulling the head off takes time however hard the ship pulls
      if (pulling) {
        const v = this.vehicle,
          d = M.sub(v.p, r.p),
          len = M.len(d) || 1,
          stretch = Math.max(0, len - v.grabStart);
        v.tension = Math.min(v.tension, this.pullPrev + dt * 0.32);
        const k = (Math.min(stretch, 60) * 0.4 * dt) / len;
        v.velocity = v.velocity.map((x, i) => x - d[i] * k);
        v.shake = Math.max(v.shake, tension * 0.55);
        if (Math.random() < dt * (1.2 + tension * 3)) {
          const a = Math.random() * TAU;
          this.strike([THRONE[0], 44, THRONE[1] - 8], [THRONE[0] + Math.sin(a) * 90, 160 + Math.random() * 120, THRONE[1] + Math.cos(a) * 90], 0.6 + tension);
        }
      }
      this.pullPrev = pulling ? this.vehicle.tension : 0;
      this.updateGod(dt, ship, pulling, tension);
      if (r.captured && !this.dark) this.beginNight();
      // light, and the first night
      if (this.nightAt != null && this.envMix < 1) this.envMix = Math.min(1, (this.time - this.nightAt) / 6.5);
      this.flash = Math.max(0, this.flash - dt * 3.2);
      this.applyEnvironment();
      // thunder from the throne now and then
      if (!this.dark) {
        this.boltClock -= dt;
        if (this.boltClock <= 0) {
          this.boltClock = 7 + Math.random() * 10;
          const a = Math.random() * TAU;
          this.strike([THRONE[0], 44, THRONE[1] - 8], [THRONE[0] + Math.sin(a) * 140, 190 + Math.random() * 140, THRONE[1] + Math.cos(a) * 140], 0.6);
        }
      }
      for (let i = this.bolts.length - 1; i >= 0; i--) {
        const b = this.bolts[i];
        b.t += dt;
        const on = b.t < b.life && (b.t < 0.07 || b.t > 0.12);
        for (const n of b.nodes) n.visible = on;
        if (b.t > b.life) {
          for (const n of b.nodes) this.fxRoot.remove(n);
          this.bolts.splice(i, 1);
        }
      }
      // the choir: everyone still alive is singing
      if (!this.dark) {
        const R = this.residents,
          out = R.v0 ? Math.min(1, R.outside() / R.v0) : 0,
          all = R.d0 ? Math.min(1, R.alive / R.d0) : 0,
          away = M.clamp((Math.hypot(ship[0] - CX, ship[2] - CZ) - 420) / 500, 0, 1) * 0.7 + M.clamp((ship[1] - 160) / 400, 0, 0.5);
        this.choirLv = M.damp(this.choirLv, M.clamp(0.68 * out + 0.32 * all, 0, 1) * (1 - tension * 0.55), 2, dt);
        this.game.audio.choir(this.choirLv * (1 - Math.min(0.85, away)));
      }
      // the first time the ship comes near the throne
      if (!this.dark && !this.told.throne && Math.hypot(ship[0] - THRONE[0], ship[2] - THRONE[1]) < 165 && this.creaturesAlive()) {
        this.told.throne = true;
        this.game.ui.toast('보좌', '네 생물이 신을 둘러싸고 있습니다. 넷을 모두 떨어뜨려야 머리에 닿습니다.', 7);
      }
      this.updateAngels(dt, ship);
      this.updateLamps(dt);
      this.updateFall(dt);
    }
    applyEnvironment() {
      const e = this.game.engine,
        k = this.envMix * this.envMix * (3 - 2 * this.envMix),
        L = (a, b) => a + (b - a) * k,
        V = (a, b) => [L(a[0], b[0]), L(a[1], b[1]), L(a[2], b[2])];
      e.fog = V(DAY.fog, NIGHT.fog);
      e.fogD = L(DAY.fogD, NIGHT.fogD);
      e.ambient = L(DAY.ambient, NIGHT.ambient) + this.flash * 0.7;
      e.tint = V(DAY.tint, NIGHT.tint).map(v => v + this.flash * 0.25);
      e.sunK = L(DAY.sunK, NIGHT.sunK);
      e.skyTop = V(DAY.skyTop, NIGHT.skyTop).map(v => v + this.flash * 0.3);
      e.skyHorizon = V(DAY.skyHorizon, NIGHT.skyHorizon).map(v => v + this.flash * 0.2);
      e.skyCloud = V(DAY.skyCloud, NIGHT.skyCloud);
      e.skyStyle = k > 0.5 ? 3 : 2;
      e.noShadows = true; // lit from everywhere, by day and by night: nothing here casts a shadow
      if (this.envDone === this.envMix && this.flash <= 0) return;
      this.envDone = this.envMix;
      for (const g of this.glowers) g.node.em = L(g.day, g.night);
      const cs = V([1, 1, 1], [0.2, 0.22, 0.3]);
      this.cloudSea.color = cs;
      for (const c of this.cloudTowers) c.color = V([1, 0.98, 0.95], [0.16, 0.17, 0.24]);
      this.ground.color = V([1, 1, 1], [0.27, 0.27, 0.36]);
      this.river.color = this.glass.color = this.fall.color = V([1, 1, 1], [0.3, 0.36, 0.5]);
      for (const b of this.buildings)
        for (const n of b.glows) {
          n.restEm = L(0.38, 0.16);
          if (b.hp >= b.maxHp) n.em = n.restEm;
        }
    }
    beginNight() {
      this.dark = true;
      this.nightAt = this.time;
      const audio = this.game.audio;
      audio.choirStop(0.12);
      audio.lightsOut();
      this.flash = 1.4;
      this.residents.haloOff = true;
      this.config.wind = 0.06;
      this.later(1.2, () => this.residents.awaken(THRONE[0], THRONE[1]));
      // what flew falls; the wheels stop; the lamps go out
      let n = 0;
      for (const a of this.angels) {
        if (!a.alive || a.dying) continue;
        if (a.cls === 'seraph' || a.cls === 'host' || a.cls === 'wheel')
          this.later(0.6 + (n++ % 24) * 0.22 + Math.random() * 0.4, () => {
            if (!this.disposed) this.killAngel(a, [Math.random() - 0.5, 0, Math.random() - 0.5], 'night');
          });
      }
      this.later(5.5, () => {
        if (!this.disposed) this.game.ui.toast('빛이 꺼졌습니다', '이 도시에 처음으로 밤이 왔습니다.', 7);
      });
    }
    // Night already fallen on an earlier visit (onLoad), or just now.
    applyNight(onLoad = false) {
      if (onLoad)
        for (const a of this.angels) {
          if (!a.alive || !(a.cls === 'seraph' || a.cls === 'host' || a.cls === 'wheel')) continue;
          this.deadAngels.add(a.i);
          if (a.cls === 'seraph') {
            const t = ((a.i - 12) / 6) * TAU;
            this.fellAt.set(a.i, { x: THRONE[0] + Math.sin(t) * 30, z: THRONE[1] + Math.cos(t) * 30, yaw: t });
          } else if (a.cls === 'host') {
            const x = a.c[0] + Math.sin(a.th) * a.R,
              z = a.c[1] + Math.cos(a.th) * a.R;
            if (this.onPlatform(x, z)) this.fellAt.set(a.i, { x, z, yaw: a.th });
          }
          this.layDead(a, true);
          if (a.landed) this.feathersFor(a);
        }
      this.residents.haloOff = true;
      for (const l of this.lamps) {
        l.flame.visible = false;
        l.halo.visible = false;
      }
      for (const r of this.rainbow) r.visible = false;
      this.rainbowEntity.alive = false;
      this.aureole.visible = false;
      this.glare.visible = false;
      this.haloRing.visible = false;
      for (const ray of this.rays) ray.visible = false;
      for (const n of this.godParts) n.em = 0;
      this.stump.visible = true;
      this.stump.em = 0.05;
      this.stump.color = rgb('#7d7460');
      this.ruler.body.r[0] = 0.06;
      if (this.residents.mode === 'first') this.residents.mode = 'wary';
      for (const a of this.angels) if (a.cls === 'gate' && a.alive) this.kneel(a);
      this.applyEnvironment();
      this.drawTrees();
    }
    kneel(a) {
      a.kneeling = true;
      for (const f of a.flames) f.visible = false;
      a.blade.em = 0;
      a.blade.type = 0;
      a.blade.color = rgb('#9b968a');
      a.halo.visible = false;
    }
    updateGod(dt, ship, pulling, tension) {
      const r = this.ruler,
        base = r.node,
        head = r.head;
      if (r.captured) {
        if (this.nightAt != null && this.time - this.nightAt < 8) {
          // the light goes out of the body from the neck down
          const k = Math.min(1, (this.time - this.nightAt) / 3);
          for (const n of this.godParts) n.em = 0.3 * (1 - k);
          this.stump.visible = true;
          this.stump.em = 2.2 * (1 - k) + 0.05;
          this.aureole.alpha = 0.55 * (1 - k);
          for (const l of this.lamps) {
            l.flame.visible = k < 0.6 && Math.random() > k;
            l.halo.visible = l.flame.visible;
          }
          for (const rb of this.rainbow) rb.alpha = 0.6 * (1 - k);
          this.glare.visible = this.haloRing.visible = false;
          for (const ray of this.rays) ray.visible = false;
          base.p[1] = 0;
          r.body.r[0] = 0.06 * k;
          if (k >= 1 && !this.nightSettled) {
            this.nightSettled = true;
            this.applyNight();
          }
        }
        return;
      }
      if (!pulling) head.p[1] = M.damp(head.p[1], r.headRestY, 1.4, dt);
      // it looks at the ship, though it has nothing to look with
      const hx = base.p[0],
        hz = base.p[2] - 1.5,
        want = M.clamp(Math.atan2(ship[0] - hx, ship[2] - hz), -0.7, 0.7);
      this.godYaw = (this.godYaw || 0) + (want - (this.godYaw || 0)) * Math.min(1, dt * (pulling ? 3 : 0.8));
      head.r[1] = this.godYaw;
      head.r[0] = pulling ? Math.sin(this.time * 23) * 0.03 * tension : 0;
      r.p = [base.p[0], base.p[1] + head.p[1], hz];
      // the glare thins as the head comes away
      const lift = Math.max(0, head.p[1] - r.headRestY),
        clear = Math.pow(1 - Math.min(1, lift / 14), 1.6);
      this.glare.alpha = 0.34 * clear;
      this.glare.visible = clear > 0.01;
      const pulse = 1 + Math.sin(this.time * 1.7) * 0.04;
      this.glare.s = [15 * pulse, 15 * pulse, 15 * pulse];
      for (const ray of this.rays) ray.alpha = 0.42 * clear;
      this.haloRing.em = 2.4 * (0.4 + 0.6 * clear);
      this.haloRing.r[2] = this.time * 0.05;
      for (const n of this.headParts) n.em = 0.32 * (0.3 + 0.7 * clear);
      // the neck stretches into threads of light
      const top = 28.5,
        bottom = head.p[1] - 6 - 3.2,
        len = Math.max(2, bottom - top),
        thin = 1 - Math.min(0.75, lift / 18);
      this.neck.p = [0, (top + bottom) / 2, -1.6];
      this.neck.s = [3.4 * thin, len, 3.4 * thin];
      this.neck.em = 0.45 + lift * 0.12;
      this.aureole.alpha = 0.55 * (0.6 + 0.4 * clear);
      for (let i = 0; i < this.rainbow.length; i++) this.rainbow[i].r[1] = Math.sin(this.time * 0.2 + i) * 0.02;
    }
    updateLamps(dt) {
      if (this.dark) return;
      for (const l of this.lamps) {
        const f = 1 + Math.sin(this.time * 9 + l.phase) * 0.12 + Math.sin(this.time * 23 + l.phase * 2) * 0.06;
        l.flame.s = [1.5 / f, 3 * f, 1.5 / f];
        l.halo.alpha = 0.24 + 0.06 * Math.sin(this.time * 7 + l.phase);
      }
    }
    updateFall(dt) {
      // the river goes over the edge, and the spray comes up from the clouds
      this.fallMist -= dt;
      const cam = this.game.engine.camera.p;
      if (this.fallMist <= 0 && Math.hypot(cam[0], cam[2] - RIVER.z1) < 700) {
        this.fallMist = 0.35;
        if (this.mists.length < 24) {
          const s = 10 + Math.random() * 8,
            n = mesh(this.fxRoot, 'lowSphere', [(Math.random() - 0.5) * 16, CLOUD_Y + 4, RIVER.z1 + 4 + Math.random() * 8], [s, s * 0.6, s], this.dark ? '#3a4254' : '#ffffff', { alpha: 0, em: this.dark ? 0 : 0.3 });
          this.mists.push({ node: n, t: 0, life: 4, s });
        }
      }
      for (let i = this.mists.length - 1; i >= 0; i--) {
        const m = this.mists[i];
        m.t += dt;
        if (m.t > m.life) {
          this.fxRoot.remove(m.node);
          this.mists.splice(i, 1);
          continue;
        }
        const k = m.t / m.life;
        m.node.p[1] += dt * 5;
        m.node.s = [m.s * (1 + k), m.s * 0.6 * (1 + k), m.s * (1 + k)];
        m.node.alpha = 0.5 * Math.min(1, m.t * 2) * (1 - k);
      }
    }

    /* ---------- the host, moving ---------- */
    updateAngels(dt, ship) {
      const t = this.time,
        near = Math.hypot(ship[0] - THRONE[0], ship[2] - THRONE[1]),
        headP = this.ruler.p;
      // the elders cast their crowns before the throne the first time the ship comes close
      if (!this.worship && near < 150 && !this.dark) this.worship = { t: 0 };
      if (this.worship) this.worship.t += dt;
      let si = 0;
      for (const a of this.angels) {
        a.t += dt;
        a.hurt = Math.max(0, (a.hurt || 0) - dt);
        if (a.dying) {
          this.updateDying(a, dt);
          continue;
        }
        if (!a.alive) continue;
        if (this.vehicle.grab === a) {
          a.node.p = a.p;
          if (a.cls === 'elder' && a.crown.visible && a.worship !== 'prostrate') {
            a.crown.p = [a.seat[0], 0.25, a.seat[1]];
            a.crown.r = [0.12, a.i, 0];
            a.worship = 'prostrate';
          }
          if (a.cls === 'host' || a.cls === 'seraph') {
            const ws = a.cls === 'host' ? a.wings : a.fly;
            setWing(ws[0], 1, 0, 0.3, Math.sin(t * 24) * 0.7);
            setWing(ws[1], -1, 0, 0.3, Math.sin(t * 24) * 0.7);
          }
          this.hitSpheres(a);
          continue;
        }
        if (a.thrown) {
          this.updateThrownAngel(a, dt);
          this.hitSpheres(a);
          continue;
        }
        if (a.cls === 'gate') this.updateGate(a, dt, ship);
        else if (a.cls === 'seraph') this.updateSeraph(a, dt, ship, near, headP, si++);
        else if (a.cls === 'creature') this.updateCreature(a, dt, ship);
        else if (a.cls === 'wheel') this.updateWheel(a, dt, ship);
        else if (a.cls === 'elder') this.updateElder(a, dt);
        else if (a.cls === 'host') this.updateHost(a, dt);
        this.hitSpheres(a);
      }
    }
    hitSpheres(a) {
      const p = a.node.p,
        h = (a.hit.length = 0, a.hit);
      if (a.cls === 'gate') {
        if (a.kneeling) h.push([p[0], 3.6, p[2], 3.2]);
        else h.push([p[0], 5, p[2], 3.2], [p[0], 9.4, p[2], 1.9]);
      } else if (a.cls === 'creature') {
        const y = a.node.r[1];
        h.push([p[0], p[1], p[2], 3.4], [p[0] + Math.sin(y) * 3.2, p[1] + 2.4, p[2] + Math.cos(y) * 3.2, 2]);
      } else if (a.cls === 'wheel') h.push([p[0], p[1], p[2], 7.4]);
      else if (a.cls === 'elder') h.push([p[0], 2.2, p[2], 1.5]);
      else h.push([p[0], p[1], p[2], a.radius]);
      a.p = p;
    }
    updateGate(a, dt, ship) {
      const g = a.node,
        dx = ship[0] - g.p[0],
        dy = ship[1] - 6 - g.p[1],
        dz = ship[2] - g.p[2],
        d = Math.hypot(dx, dy, dz),
        t = this.time;
      if (a.kneeling) {
        a.body.p[1] = M.damp(a.body.p[1], -2.4, 2, dt);
        a.body.r[0] = M.damp(a.body.r[0], 0.35, 2, dt);
        a.armR.r[0] = M.damp(a.armR.r[0], -0.3, 2, dt);
        this.droopWings(a.wings, 0.1);
        return;
      }
      // he turns toward what comes, and does not leave the gate
      const want = d < 130 ? Math.atan2(dx, dz) : a.yaw0;
      a.yaw += M.angle(a.yaw, want) * Math.min(1, dt * 1.6);
      g.r[1] = a.yaw;
      const br = Math.sin(t * 0.8 + a.i) * 0.04;
      setWing(a.wings[0], 1, 0, 0.42, 0.75 + br);
      setWing(a.wings[1], -1, 0, 0.42, 0.75 + br);
      a.swingClock -= dt;
      if (d < 30 && a.swingClock <= 0 && !a.swing) {
        a.swing = 0.001;
        a.swingClock = 1.2 + Math.random() * 0.5;
      }
      if (a.swing) {
        a.swing += dt;
        const k = a.swing / 0.55;
        a.armR.r[0] = k < 0.35 ? -1.6 - (k / 0.35) * 1.2 : -2.8 + Math.min(1, (k - 0.35) / 0.3) * 2.3;
        if (!a.struck && k > 0.55) {
          a.struck = true;
          if (d < 32) {
            // fire against the hull: sparks, a ringing, the ship pushed a little. Nothing more.
            const n = [dx / (d || 1), 0, dz / (d || 1)];
            this.emit(M.sub(ship, M.mul(n, 2.5)), 10, '#ffd27a', 14, 0.8, false);
            const [pan, gain] = this.where(ship);
            this.game.audio.clank(pan, Math.max(0.6, gain));
            this.vehicle.shake = Math.max(this.vehicle.shake, 0.55);
            this.vehicle.velocity = M.add(this.vehicle.velocity, M.mul(n, 9));
            if (!this.told.sword) {
              this.told.sword = true;
              this.game.ui.toast('문지기가 칼을 휘둘렀습니다', '불칼은 선체를 뚫지 못합니다.', 4);
            }
          }
        }
        if (k >= 1) {
          a.swing = 0;
          a.struck = false;
        }
      } else a.armR.r[0] = M.damp(a.armR.r[0], d < 60 ? -1.7 : -0.25, 3, dt);
      for (let k = 0; k < a.flames.length; k++) {
        const f = a.flames[k],
          fl = 1 + Math.sin(t * (11 + k * 3) + a.i) * 0.18;
        f.s = [1.0 / fl, 2.2 * fl, 0.5];
      }
    }
    updateSeraph(a, dt, ship, near, headP, k) {
      const g = a.node,
        t = this.time;
      a.angle += dt * 0.32;
      let tx = THRONE[0] + Math.sin(a.angle) * 26,
        ty = 54 + Math.sin(t * 0.9 + a.phase) * 2.2,
        tz = THRONE[1] + Math.cos(a.angle) * 26;
      if (near < 160 && !this.dark) {
        // they come between the ship and the face
        const d = M.sub(ship, headP),
          L = M.len(d) || 1,
          f = [d[0] / L, d[1] / L, d[2] / L],
          side = M.norm([f[2], 0, -f[0]]),
          u = (k - 2.5) * 6.5,
          v = (k % 2 ? 1 : -1) * 4;
        const at = Math.min(L * 0.45, 34);
        tx = headP[0] + f[0] * at + side[0] * u;
        ty = Math.max(16, headP[1] + f[1] * at + v);
        tz = headP[2] + f[2] * at + side[2] * u;
      }
      const sp = Math.min(1, dt * 1.6);
      g.p[0] += (tx - g.p[0]) * sp;
      g.p[1] += (ty - g.p[1]) * sp;
      g.p[2] += (tz - g.p[2]) * sp;
      g.r[1] = Math.atan2(ship[0] - g.p[0], ship[2] - g.p[2]);
      const flap = Math.sin(t * 6 + a.phase) * 0.55;
      setWing(a.fly[0], 1, 0, 0.25, 0.15 + flap);
      setWing(a.fly[1], -1, 0, 0.25, 0.15 + flap);
      const tr = Math.sin(t * 17 + a.phase) * 0.03;
      setWing(a.face[0], 1, 0.1, -1.25, 0.4 + tr);
      setWing(a.face[1], -1, 0.1, -1.25, 0.4 + tr);
      setWing(a.feet[0], 1, -0.2, -1.2, -0.75 - tr);
      setWing(a.feet[1], -1, -0.2, -1.2, -0.75 - tr);
      a.body.r[2] = Math.sin(t * 1.3 + a.phase) * 0.06;
    }
    updateCreature(a, dt, ship) {
      const g = a.node,
        t = this.time;
      g.p[1] = a.home[1] + Math.sin(t * 1.1 + a.phase) * 1.3;
      g.p[0] = a.home[0];
      g.p[2] = a.home[2];
      // they rest not, day and night
      a.wings.forEach((pair, k) => {
        const base = [0.55, 0.05, -0.55][k],
          sweep = [0.35, 0.55, 0.4][k],
          f = Math.sin(t * (3.2 + k * 0.4) + a.phase + k * 1.3) * (0.42 - k * 0.08) + (a.hurt ? Math.sin(t * 40) * 0.15 : 0);
        setWing(pair[0], 1, 0, sweep, base + f);
        setWing(pair[1], -1, 0, sweep, base + f);
      });
      // the head turns to the ship; every eye on the body follows it
      const yaw0 = a.yaw0,
        dx = ship[0] - g.p[0],
        dy = ship[1] - g.p[1],
        dz = ship[2] - g.p[2];
      const rel = M.clamp(M.angle(yaw0, Math.atan2(dx, dz)), -1.1, 1.1);
      a.head.r[1] += (rel - a.head.r[1]) * Math.min(1, dt * 2);
      a.head.r[0] = M.clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.5, 0.6) * 0.6;
      const c = Math.cos(-yaw0),
        s = Math.sin(-yaw0);
      for (const e of a.eyes) {
        const lx = dx * c + dz * s - e.pos[0],
          lz = -dx * s + dz * c - e.pos[2],
          ly = dy - e.pos[1];
        e.r[1] = Math.atan2(lx, lz);
        e.r[0] = -Math.atan2(ly, Math.hypot(lx, lz));
        e.blink -= dt;
        if (e.blink <= 0) {
          e.blink = 2 + Math.random() * 7;
          e.close = 0.16;
        }
        e.close = Math.max(0, e.close - dt);
        e.em = M.damp(e.em, e.close > 0 || a.hurt > 0.2 ? 0 : 1, e.close > 0 ? 22 : 8, dt);
        e.detail = M.clamp(1.1 - Math.hypot(dx, dy, dz) / 120, 0.2, 0.9);
      }
    }
    updateWheel(a, dt, ship) {
      const t = this.time;
      a.spinA.r[2] = t * 0.9 + a.phase;
      a.spinB.r[0] = t * 0.7 + a.phase;
      a.node.r[1] = t * 0.12 + a.phase;
      a.node.p[1] = a.home[1] + Math.sin(t * 0.8 + a.phase) * 0.6;
      for (const e of a.eyes) {
        e.blink -= dt;
        if (e.blink <= 0) {
          e.blink = 1.5 + Math.random() * 6;
          e.close = 0.14;
        }
        e.close = Math.max(0, e.close - dt);
        e.em = M.damp(e.em, e.close > 0 || a.hurt > 0.2 ? 0 : 1, e.close > 0 ? 22 : 8, dt);
      }
    }
    updateElder(a, dt) {
      const w = this.worship;
      if (!w || a.worship === 'prostrate') return;
      const k = a.i - 28,
        t = w.t - (k % 12) * 0.12 - (k >= 12 ? 0.06 : 0);
      if (t < 0) return;
      if (a.worship === 'seated') {
        a.worship = 'cast';
        a.wt = 0;
        a.crownFrom = a.crown.p.slice();
      }
      a.wt += dt;
      if (a.worship === 'cast') {
        // they cast their crowns before the throne
        const k2 = Math.min(1, a.wt / 1.4),
          from = a.crownFrom,
          to = a.crownTo;
        a.crown.p = [from[0] + (to[0] - from[0]) * k2, from[1] + (to[1] - from[1]) * k2 + Math.sin(k2 * Math.PI) * 7, from[2] + (to[2] - from[2]) * k2];
        a.crown.r = [k2 * 5, k2 * 3, 0];
        a.fig.r[0] = Math.sin(Math.min(1, a.wt / 0.5) * Math.PI) * -0.25;
        if (k2 >= 1) {
          a.crown.r = [0.12, a.i, 0];
          a.worship = 'bow';
          a.wt = 0;
          if (k === 0) {
            const [pan, gain] = this.where(to);
            this.game.audio.clank(pan, gain * 0.5);
          }
        }
      } else if (a.worship === 'bow') {
        // and fall down before him
        const k2 = Math.min(1, a.wt / 1.3),
          e = k2 * k2 * (3 - 2 * k2);
        a.fig.r[0] = 1.45 * e;
        a.fig.p[2] = 0.75 + e * 1.4;
        a.fig.p[1] = 1.3 - e * 0.9;
        if (k2 >= 1) a.worship = 'prostrate';
      }
    }
    updateHost(a, dt) {
      const g = a.node,
        t = this.time;
      a.th += a.w * dt;
      const x = a.c[0] + Math.sin(a.th) * a.R,
        z = a.c[1] + Math.cos(a.th) * a.R,
        y = a.alt + Math.sin(t * 0.6 + a.phase) * 4;
      // heading along the circle
      const hx = Math.cos(a.th) * Math.sign(a.w),
        hz = -Math.sin(a.th) * Math.sign(a.w);
      g.p[0] = x;
      g.p[1] = y;
      g.p[2] = z;
      g.r[1] = Math.atan2(hx, hz);
      g.r[0] = 1.05;
      g.r[2] = -Math.sign(a.w) * 0.25;
      const flap = Math.sin(t * 4.2 + a.phase) * 0.6;
      setWing(a.wings[0], 1, 0, 0.1, 0.1 + flap);
      setWing(a.wings[1], -1, 0, 0.1, 0.1 + flap);
    }
    updateThrownAngel(a, dt) {
      a.velocity[1] -= 22 * dt;
      a.node.p = a.node.p.map((v, i) => v + a.velocity[i] * dt);
      a.node.r[0] += dt * 3;
      a.node.r[2] += dt * 2;
      const fl = this.onPlatform(a.node.p[0], a.node.p[2]) ? 0.8 : CLOUD_Y;
      if (a.node.p[1] <= fl) {
        // cast down: whatever is thrown in heaven does not get up again
        a.thrown = false;
        a.node.p[1] = fl;
        this.deadAngels.add(a.i);
        const [pan, gain] = this.where(a.node.p);
        this.game.audio.fallen(pan, Math.max(0.3, gain), 1);
        this.game.audio.impact(0.5);
        if (fl === CLOUD_Y) {
          a.alive = false;
          a.node.visible = false;
          a.lost = true;
          this.fellAt.delete(a.i);
        } else {
          this.fellAt.set(a.i, { x: a.node.p[0], z: a.node.p[2], yaw: a.node.r[1] });
          this.layDead(a);
        }
      }
    }
    updateDying(a, dt) {
      const d = a.dying,
        g = a.node;
      d.t += dt;
      if (d.kind === 'topple') {
        // a gate angel falls forward on his face
        const k = Math.min(1, d.t / 1.1),
          e = k * k;
        g.r[0] = (Math.PI / 2 - 0.08) * e;
        g.p[1] = 0.9 * e;
        a.armR.r[0] = -1.6 + e * 1.2;
        this.droopWings(a.wings, 0.75 - e * 0.65);
        if (k >= 1) {
          this.layDead(a);
          this.game.audio.impact(1.1);
          this.emit([g.p[0] + Math.sin(a.yaw) * 7, 1, g.p[2] + Math.cos(a.yaw) * 7], 12, FEATHER, 10, 1.8);
          if (this.vehicle) this.vehicle.shake = Math.max(this.vehicle.shake, 0.35 * Math.max(0, 1 - M.dist(this.vehicle.p, g.p) / 120));
        }
        return;
      }
      d.v[1] -= 22 * dt;
      g.p[0] += d.v[0] * dt;
      g.p[1] += d.v[1] * dt;
      g.p[2] += d.v[2] * dt;
      g.r[2] += d.spin * dt;
      if (a.cls === 'seraph' || a.cls === 'host') {
        g.r[0] = M.damp(g.r[0], Math.PI / 2, 1.5, dt);
        const pair = a.cls === 'seraph' ? a.fly : a.wings;
        const f = Math.sin(d.t * 14) * 0.4 * Math.max(0, 1 - d.t);
        setWing(pair[0], 1, 0, 0.3, 0.8 + f);
        setWing(pair[1], -1, 0, 0.3, 0.8 + f);
      }
      const on = this.onPlatform(g.p[0], g.p[2]),
        rest = on ? (a.cls === 'creature' ? 2.4 : a.cls === 'wheel' ? 1.4 : 1) : CLOUD_Y - 30;
      if (g.p[1] <= rest) {
        if (!on) {
          g.visible = false;
          a.dying = null;
          a.alive = false;
          a.lost = true;
          return;
        }
        g.p[1] = rest;
        if (a.cls === 'seraph' || a.cls === 'host') this.fellAt.set(a.i, { x: g.p[0], z: g.p[2], yaw: g.r[1] });
        this.layDead(a);
        const [pan, gain] = this.where(g.p);
        this.game.audio.impact(a.cls === 'creature' || a.cls === 'wheel' ? 1.6 : 0.6);
        this.game.audio.gore('thud', pan, gain);
        this.emit([g.p[0], 1, g.p[2]], a.cls === 'host' ? 6 : 14, a.cls === 'seraph' ? '#7a4a2a' : FEATHER, 9, 1.8);
        if (this.vehicle && (a.cls === 'creature' || a.cls === 'wheel'))
          this.vehicle.shake = Math.max(this.vehicle.shake, 0.5 * Math.max(0, 1 - M.dist(this.vehicle.p, g.p) / 140));
      }
    }

    /* ---------- save ---------- */
    signalValue() {
      return this.residents.signal();
    }
    tokens() {
      const out = [];
      const dead = this.angels.filter(a => !a.alive || a.dying || this.deadAngels.has(a.i)).map(a => a.i);
      out.push(...pack('h.a.', dead.map(enc2)));
      const fell = [];
      for (const [i, f] of this.fellAt) fell.push(enc2(i) + enc2(qxz(f.x)) + enc2(qxz(f.z)) + B36[((Math.round((((f.yaw % TAU) + TAU) % TAU) / TAU * 36) % 36) + 36) % 36]);
      out.push(...pack('h.p.', fell));
      out.push(...pack('h.t.', this.trees.filter(t => !t.alive && this.deadTrees.has(t.i)).map(t => enc2(t.i))));
      out.push(...pack('h.w.', this.walls.filter(w => !w.alive).map(w => enc2(w.i))));
      if (this.rainbowBroken) out.push('h.r.1');
      return out;
    }
    snapshot() {
      if (this.disposed || !this.angels) return;
      this.destroyed = new Set([...this.destroyed].filter(t => !t.startsWith('h.')).concat(this.tokens()));
      super.snapshot();
    }
    dispose() {
      if (this.disposed) return;
      this.game.audio.choirStop(0.2);
      super.dispose();
    }
  }
  K.Planets[ID] = Heaven;
})((window.KO ||= {}));
