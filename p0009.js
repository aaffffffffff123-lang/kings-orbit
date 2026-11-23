/* @surface {"id":"p0009","name":"THAW","shortName":"THAW","description":"버려진 테라포밍 기지 · 온실 돔마다 호박색 벌레가 가득합니다.","rulerName":"대기 처리기 코어","trophyNote":"꺼진 뒤에도 진행률 63%를 띄우고 있다.","species":"bugs","inhabited":false,"thaw":true} */
/* p0009 THAW — an ice world people began to warm and then left. The machines still run: the processor in the middle
 * breathes out heat, the greenhouse domes are lit and wet. What lives here now came out of the ice to the warmth:
 * amber bugs, a hand long, in their thousands. They run from the ship's shadow and gather again once it has gone.
 * Take the core out of the processor and the heat stops; the domes frost over and the bugs stop where they are.
 * Save contract (planetStates.p0009.destroyed): shared building ids ("hab-<k>", "tank-<k>", ...)
 *   "x.b." losses per bug patch (patch 2 · dead 2) · "x.m." smears (x 2 · z 2 · kind 1) · "x.o." broken domes (index 1 each) */
(function (K) {
  'use strict';
  const { M, mesh, group } = K,
    ID = 'p0009',
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
      if (s.length + p.length > 56) {
        out.push(prefix + s);
        s = '';
      }
      s += p;
    }
    if (s) out.push(prefix + s);
    return out;
  }
  const C = {
    hull: '#dfe4e8',
    panel: '#a3aeb8',
    dark: '#2b323a',
    steel: '#66727e',
    warm: '#ffb45a',
    glow: '#ffdca6',
    glass: '#c8ecf4',
    frame: '#eef2f4',
    red: '#d0452c',
    pipe: '#8d99a5',
    rust: '#8f5f3e',
    soil: '#4a3524',
    plant: '#3f8a34',
    plant2: '#86b84a',
    leaf: '#2f6e2c',
    bug: '#e3912a',
    snow: '#f2f6fa',
    blue: '#2d4f86',
  };
  const THAW_R = 430,
    EDGE = 1700;
  // the greenhouses: angle and distance from the processor, radius; the airlock faces outward, the tunnel inward
  const DOMES = [
    { a: -0.36, R: 205, r: 56, kind: 'beds' },
    { a: 0.9, R: 220, r: 46, kind: 'racks' },
    { a: 2.06, R: 196, r: 52, kind: 'pond' },
    { a: 3.24, R: 232, r: 62, kind: 'forest' },
    { a: 4.46, R: 200, r: 48, kind: 'store' },
  ];
  const SQ = 0.74; // domes are a little flatter than half a sphere
  const DOOR = { half: 0.17, top: 0.3 }; // half-width (radians round the dome) and height (fraction of its radius)
  const CORE = [0, 9.5, 27]; // the core's bay, on the south face of the processor
  /* ---------- the core: the head this world gives up ---------- */
  function coreModel(g, lit) {
    const out = { glows: [] };
    mesh(g, 'cylinder', [0, 0, 0], [2.6, 5.2, 2.6], '#ffb24a', { em: lit ? 1.6 : 0.5, type: 1 });
    for (let i = 0; i < 4; i++) {
      const r = mesh(g, 'torus', [0, -1.9 + i * 1.27, 0], [2.2, 2.2, 2.2], '#3a434c');
      out.glows.push(r);
    }
    mesh(g, 'cylinder', [0, 3.1, 0], [3.2, 0.9, 3.2], C.steel);
    mesh(g, 'cylinder', [0, -3.1, 0], [3.2, 0.9, 3.2], C.steel);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      mesh(g, 'box', [Math.sin(a) * 1.55, 0, Math.cos(a) * 1.55], [0.22, 5.6, 0.22], C.dark).r[1] = a;
    }
    // the little readout on its collar: 63
    mesh(g, 'box', [0, 3.1, 1.62], [1.4, 0.5, 0.08], '#141a20');
    mesh(g, 'box', [-0.3, 3.1, 1.67], [0.35, 0.3, 0.04], '#7dffc8', { em: lit ? 1.4 : 0.5, type: 1 });
    mesh(g, 'box', [0.15, 3.1, 1.67], [0.35, 0.3, 0.04], '#7dffc8', { em: lit ? 1.4 : 0.5, type: 1 });
    return out;
  }
  K.TrophyModels[ID + '-ruler'] = root => {
    const g = group(root, [0, 0.2, 0]);
    g.s = [0.36, 0.36, 0.36];
    g.r[1] = Math.PI;
    coreModel(g, false);
    return g;
  };
  if (typeof document !== 'undefined' && !document.getElementById('thaw-css')) {
    const st = document.createElement('style');
    st.id = 'thaw-css';
    st.textContent =
      '.worldLabel.thawPanel{font:600 12px/1.5 Consolas,"SFMono-Regular",monospace;letter-spacing:3px;color:#9dffd2;text-shadow:0 0 10px rgba(80,255,180,.55),0 2px 3px #000;white-space:nowrap}' +
      '.worldLabel.thawPanel span{color:#d9fff0;font-family:Arial,sans-serif;letter-spacing:2px}';
    document.head.append(st);
  }
  /* ---------- light ---------- */
  const ENV = {
    fog: [0.67, 0.75, 0.83],
    fogD: 0.00095,
    ambient: 0.74,
    tint: [1, 1, 1],
    sun: [0.32, 0.5, 0.8],
    sunK: 1,
    skyTop: [0.24, 0.4, 0.64],
    skyHorizon: [0.88, 0.87, 0.85],
    skyCloud: [0.96, 0.95, 0.93],
  };
  const COLD = { fog: [0.62, 0.68, 0.76], fogD: 0.0011, ambient: 0.64, tint: [0.9, 0.96, 1.08] };
  (K.SurfaceAtmospheres ||= {})[ID] = ENV;

  class Thaw extends K.Surface {
    constructor(game, def) {
      const captured = game.save.data.trophies.some(t => t.id === def.rulerId);
      super(game, def, {
        seed: 90091,
        rulerName: '대기 처리기 코어',
        areaLabel: 'THAW / 이주 기지',
        regionName: '테라포밍 63%',
        afterLabel: '식어 가는 기지',
        rubble: '#b8c0c8',
        accent: '#ffb45a',
        spark: '#ffe2a6',
        lifeColor: '#d6862a',
        scorch: '#2a2018',
        stablePhase: true,
        environment: ENV,
        wind: 0.07,
        hover: 1.2,
        noInfest: true,
        spawn: { p: [0, 30, 440], yaw: 0, pitch: -0.1 },
        rulerBreak: ['보호 격자 파괴', '코어를 바라보고 Q로 붙잡으세요.'],
        rulerAim: '대기 처리기 코어 · Q로 붙잡기',
        rulerGrab: ['코어를 붙잡았습니다', 'S로 뒤로 물러나 끝까지 뽑으세요.'],
        pullRate: 0.022,
        pullRise: 3,
        arrival: ['전시 복도에 대기 처리기 코어가 도착했습니다.', '복도를 따라가면 새로 채워진 자리가 있습니다.'],
      });
      this.edge = EDGE;
      this.off = captured; // the heating, once the core is out
      this.offAt = captured ? -100 : null;
      this.losses = new Map();
      this.savedSmears = [];
      this.brokenDomes = new Set();
      for (const t of this.destroyed) {
        if (t.startsWith('x.b.'))
          for (let i = 4; i + 4 <= t.length; i += 4) {
            const k = dec2(t, i),
              n = dec2(t, i + 2);
            if (k >= 0 && n > 0) this.losses.set(k, n);
          }
        else if (t.startsWith('x.m.'))
          for (let i = 4; i + 5 <= t.length; i += 5) {
            const x = dec2(t, i),
              z = dec2(t, i + 2);
            if (x >= 0 && z >= 0) this.savedSmears.push([x * 1.5 - 972, z * 1.5 - 972, t[i + 4] === '1' ? 1 : 0]);
          }
        else if (t.startsWith('x.o.')) for (let i = 4; i < t.length; i++) this.brokenDomes.add(B36.indexOf(t[i]));
      }
      this.lights = [];
      this.fans = [];
      this.plumes = [];
      this.domes = [];
      this.told = {};
      this.squashTotal = 0;
      this.heat = captured ? 0 : 1;
      // the heater masts out on the ice; the ground is levelled round each
      const prng = M.rand(1234);
      this.pylons = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + prng() * 0.3,
          R = 500 + prng() * 650;
        this.pylons.push([Math.sin(a) * R, Math.cos(a) * R, 0, 110 + Math.round(prng() * 80)]);
      }
      this.initialize();
      if (this.off) this.applyOff(true);
    }
    /* ---------- the ground: an ice sheet, levelled round the base, rising to ridges far out ---------- */
    // the ground as it is drawn: once the mesh is made, heights come from its triangles, so nothing floats or sinks
    height(x, z) {
      const G = this.grid;
      if (!G) return this.rawHeight(x, z);
      const n = G.n,
        fx = M.clamp((x / G.size + 0.5) * n, 0, n - 1e-4),
        fz = M.clamp((z / G.size + 0.5) * n, 0, n - 1e-4),
        i = fx | 0,
        j = fz | 0,
        u = fx - i,
        v = fz - j,
        h = G.h,
        w = n + 1,
        h00 = h[j * w + i],
        h10 = h[j * w + i + 1],
        h01 = h[(j + 1) * w + i],
        h11 = h[(j + 1) * w + i + 1];
      return u + v < 1 ? h00 + (h10 - h00) * u + (h01 - h00) * v : h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
    }
    groundNormal(x, z) {
      const e = 1.5;
      return M.norm([this.height(x - e, z) - this.height(x + e, z), 2 * e, this.height(x, z - e) - this.height(x, z + e)]);
    }
    rawHeight(x, z) {
      const R = Math.hypot(x, z);
      if (R < 300) return 0;
      const flat = M.smooth(300, 560, R),
        n = vnoise(x * 0.0042, z * 0.0042),
        n2 = vnoise(x * 0.013 + 5, z * 0.013 - 3);
      let h = (n - 0.45) * 64 + (n2 - 0.5) * 16;
      h += Math.max(0, R - 950) * 0.11 * (0.45 + n);
      return h * flat;
    }
    // where things rest: the ground, or the top of a tunnel or of the processor's platform
    floor(x, z) {
      let y = this.height(x, z);
      const R = Math.hypot(x, z);
      if (R < 34) y = Math.max(y, 6);
      if (this.tunnels)
        for (const t of this.tunnels) {
          const d = segDist(x, z, t.a, t.b);
          if (d < t.r) y = Math.max(y, Math.sqrt(t.r * t.r - d * d) + t.y - 1);
        }
      return y;
    }
    makeTerrain() {
      const size = 4400,
        steps = 150,
        p = [],
        n = [],
        idx = [],
        H = new Float32Array((steps + 1) * (steps + 1));
      for (let zi = 0; zi <= steps; zi++)
        for (let xi = 0; xi <= steps; xi++) {
          const wx = (xi / steps - 0.5) * size,
            wz = (zi / steps - 0.5) * size,
            y = this.rawHeight(wx, wz);
          H[zi * (steps + 1) + xi] = y;
          p.push(wx, y, wz);
          n.push(...M.norm([this.rawHeight(wx - 1, wz) - this.rawHeight(wx + 1, wz), 2, this.rawHeight(wx, wz - 1) - this.rawHeight(wx, wz + 1)]));
        }
      this.grid = { n: steps, size, h: H };
      for (let zi = 0; zi < steps; zi++)
        for (let xi = 0; xi < steps; xi++) {
          const a = zi * (steps + 1) + xi,
            b = a + steps + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      this.game.engine.addGeometry(this.geometryName, { p, n, idx });
      this.ownedGeometries.add(this.geometryName);
      this.ground = mesh(this.root, this.geometryName, [0, 0, 0], [1, 1, 1], '#ffffff', { type: 38, detail: THAW_R });
      // the levelled pad of the base, swept and stained
      mesh(this.root, 'disc', [0, 0.05, 0], [330, 0.1, 330], '#5a5450', { alpha: 0.35 });
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
    putBasis(b, p, X, Y, Z, c, em = 0, type = 0, det = 0, seed = 0, alpha = 1) {
      const d = this.game.engine.growBatch(b, b.count + 1),
        o = b.count * 24,
        col = typeof c === 'string' ? rgb(c) : c;
      d.set([X[0], X[1], X[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, p[0], p[1], p[2], 1], o);
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
    lamp(parent, p, s, color = C.warm, em = 1.2) {
      const n = mesh(parent, 'sphere', p, s, color, { em, type: 1 });
      n.restEm = em;
      this.lights.push(n);
      return n;
    }
    /* ---------- the base ---------- */
    domeGeometry() {
      const engine = this.game.engine;
      if (engine.geometries['thaw-dome']) return;
      // a unit half-sphere with the airlock cut out of it at +z, low down
      const p = [],
        n = [],
        idx = [],
        U = 40,
        V = 12;
      for (let j = 0; j <= V; j++)
        for (let i = 0; i <= U; i++) {
          const az = (i / U) * TAU - Math.PI,
            el = (j / V) * (Math.PI / 2),
            x = Math.sin(az) * Math.cos(el),
            y = Math.sin(el),
            z = Math.cos(az) * Math.cos(el);
          p.push(x, y, z);
          n.push(x, y, z);
        }
      for (let j = 0; j < V; j++)
        for (let i = 0; i < U; i++) {
          const az = ((i + 0.5) / U) * TAU - Math.PI,
            el = ((j + 0.5) / V) * (Math.PI / 2);
          if (Math.abs(az) < DOOR.half && Math.sin(el) < DOOR.top) continue;
          const a = j * (U + 1) + i,
            b = a + U + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      engine.addGeometry('thaw-dome', { p, n, idx });
      this.ownedGeometries.add('thaw-dome');
    }
    // the struts of a dome, laid on the unit half-sphere: meridians and rings, broken at the airlock
    domeFrame(node, r) {
      const at = (az, el) => [Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r * SQ, Math.cos(az) * Math.cos(el) * r];
      const rod = (a, b, w) => K.beam(node, a, b, w, C.frame);
      for (let k = 0; k < 16; k++) {
        const az = (k / 16) * TAU - Math.PI;
        for (let j = 0; j < 6; j++) {
          const e0 = (j / 6) * (Math.PI / 2),
            e1 = ((j + 1) / 6) * (Math.PI / 2);
          if (Math.abs(az) < DOOR.half + 0.05 && Math.sin(e0) < DOOR.top) continue;
          rod(at(az, e0), at(az, e1), 0.32);
        }
      }
      for (const el of [0.25, 0.52, 0.8, 1.08]) {
        for (let k = 0; k < 32; k++) {
          const a0 = (k / 32) * TAU - Math.PI,
            a1 = ((k + 1) / 32) * TAU - Math.PI;
          if (Math.abs((a0 + a1) / 2) < DOOR.half && Math.sin(el) < DOOR.top) continue;
          rod(at(a0, el), at(a1, el), 0.26);
        }
      }
      // the airlock frame
      const dz = r * Math.cos(0.12),
        hw = Math.sin(DOOR.half) * r,
        top = DOOR.top * r * SQ;
      mesh(node, 'box', [-hw - 0.5, top / 2, dz], [1, top, 1.4], C.steel);
      mesh(node, 'box', [hw + 0.5, top / 2, dz], [1, top, 1.4], C.steel);
      mesh(node, 'box', [0, top + 0.5, dz], [hw * 2 + 2, 1, 1.4], C.steel);
      for (const s of [-1, 1]) {
        const l = mesh(node, 'box', [s * (hw + 0.5), top + 1.3, dz + 0.6], [0.6, 0.6, 0.3], C.red, { em: 1, type: 1 });
        l.restEm = 1;
        this.lights.push(l);
      }
    }
    makeDome(k, D) {
      const x = Math.sin(D.a) * D.R,
        z = Math.cos(D.a) * D.R,
        node = group(this.root, [x, 0, z]),
        r = D.r;
      node.r[1] = D.a; // +z of the dome (its airlock) faces away from the processor
      const glass = mesh(node, 'thaw-dome', [0, 0, 0], [r, r * SQ, r], C.glass, { alpha: 0.2, em: 0.05 });
      const frame = group(node);
      this.domeFrame(frame, r);
      // the floor inside: wet soil in beds, paths of grating
      mesh(node, 'disc', [0, 0.02, 0], [r * 1.96, 0.04, r * 1.96], '#4d3b2a');
      const inside = group(node),
        rng = M.rand(500 + k);
      const lampN = Math.round(r / 6);
      for (let i = 0; i < lampN; i++) {
        const a = (i / lampN) * TAU,
          rr = r * 0.55;
        const y = Math.sqrt(Math.max(0, 1 - (rr / r) ** 2)) * r * SQ - 3;
        K.beam(inside, [Math.sin(a) * rr, y + 3, Math.cos(a) * rr], [Math.sin(a) * rr, y, Math.cos(a) * rr], 0.12, C.dark);
        this.lamp(inside, [Math.sin(a) * rr, y - 0.4, Math.cos(a) * rr], [1.6, 0.9, 1.6], C.glow, 1.3);
      }
      this.lamp(inside, [0, r * SQ - 5, 0], [4, 2.2, 4], C.glow, 1.1);
      const PL = this.plants,
        STALK = this.stalks;
      if (D.kind === 'beds' || D.kind === 'store') {
        for (let row = -3; row <= 3; row++) {
          const len = Math.sqrt(Math.max(0, r * r * 0.72 - (row * 7) ** 2)) * 2;
          if (len < 8) continue;
          mesh(inside, 'box', [row * 7, 0.25, 0], [3.4, 0.5, len], '#5a4128');
          this.beds.push({ dome: k, x: row * 7, len, w: 3.4 });
          const nPl = Math.floor(len / (D.kind === 'store' ? 2.4 : 0.9));
          for (let i = 0; i < nPl; i++) {
            if (D.kind === 'store' && rng() < 0.5) continue;
            for (const side of [-0.85, 0.85]) {
              const pz = -len / 2 + (i + 0.5) * (len / nPl),
                s = 0.55 + rng() * 0.5,
                q = rotY([row * 7 + side + (rng() - 0.5) * 0.3, 0.55 + s * 0.2, pz], D.a, x, z);
              if (rng() < 0.75) this.put(PL, q, [0, rng() * 6, 0], [s * 0.95, s * 0.6, s * 0.95], rng() < 0.5 ? C.plant : C.plant2, 0.02);
              else {
                this.put(STALK, [q[0], q[1] + s * 0.5, q[2]], [0, 0, 0], [0.08, s * 1.4, 0.08], C.leaf);
                this.put(PL, [q[0], q[1] + s * 1.25, q[2]], [0, rng() * 6, 0], [s * 0.5, s * 0.5, s * 0.5], rng() < 0.4 ? '#e85a3a' : C.plant2, 0.02);
              }
            }
          }
        }
        if (D.kind === 'store')
          for (let i = 0; i < 22; i++) {
            const a = rng() * TAU,
              rr = r * (0.3 + rng() * 0.5),
              s = 1.4 + rng() * 1.6;
            const c = mesh(inside, 'box', [Math.sin(a) * rr, s / 2, Math.cos(a) * rr], [s, s, s * 0.8], rng() < 0.5 ? C.panel : C.rust);
            c.r[1] = rng() * 3;
          }
      } else if (D.kind === 'racks') {
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU,
            rr = r * (i % 2 ? 0.42 : 0.68);
          const px = Math.sin(a) * rr,
            pz = Math.cos(a) * rr;
          mesh(inside, 'box', [px, 4, pz], [1.2, 8, 1.2], C.steel);
          for (let l = 0; l < 4; l++) {
            for (let q = 0; q < 4; q++) this.put(PL, rotY([px + ((q & 1) - 0.5) * 1.2, 1.5 + l * 2, pz + ((q >> 1) - 0.5) * 1.2], D.a, x, z), [0, a + q, 0], [0.9, 0.55, 0.9], (l + q) % 2 ? C.plant : C.plant2, 0.05);
            const g = mesh(inside, 'box', [px, 2.1 + l * 2, pz], [2.6, 0.12, 2.6], '#ff9be0', { em: 0.9, type: 1 });
            g.restEm = 0.9;
            this.lights.push(g);
          }
        }
      } else if (D.kind === 'pond') {
        mesh(inside, 'disc', [0, 0.18, 0], [r * 1.1, 0.1, r * 0.9], '#2f6a7a', { alpha: 0.86, em: 0.04 });
        for (let i = 0; i < 90; i++) {
          const a = rng() * TAU,
            rr = r * (0.48 + rng() * 0.12);
          this.put(PL, rotY([Math.sin(a) * rr * 1.05, 1.2, Math.cos(a) * rr * 0.85], D.a, x, z), [rng() * 0.2, 0, rng() * 0.2], [0.35, 2.6 + rng() * 1.6, 0.35], C.leaf);
        }
      } else if (D.kind === 'forest') {
        for (let i = 0; i < 26; i++) {
          const a = rng() * TAU,
            rr = r * (0.2 + rng() * 0.62),
            h = 6 + rng() * 10,
            px = Math.sin(a) * rr,
            pz = Math.cos(a) * rr;
          mesh(inside, 'lowCyl', [px, h / 2, pz], [0.9, h, 0.9], '#5a3e28');
          mesh(inside, 'lowSphere', [px, h + 2, pz], [6 + rng() * 4, 5 + rng() * 3, 6 + rng() * 4], rng() < 0.5 ? C.leaf : C.plant);
        }
        // the heater column in the middle, warm to stand by
        mesh(inside, 'cylinder', [0, 7, 0], [4, 14, 4], C.steel);
        for (let i = 0; i < 5; i++) {
          const g = mesh(inside, 'torus', [0, 2 + i * 2.6, 0], [3.2, 3.2, 3.2], C.warm, { em: 1.2, type: 1 });
          g.restEm = 1.2;
          this.lights.push(g);
        }
      }
      // a tunnel back to the processor from the inner side
      const inner = [Math.sin(D.a) * (D.R - r * 0.92), Math.cos(D.a) * (D.R - r * 0.92)],
        toward = [Math.sin(D.a) * 36, Math.cos(D.a) * 36];
      this.tunnels.push({ a: toward, b: inner, r: 4.2, y: 1 });
      const dome = { k, kind: 'dome', alive: !this.brokenDomes.has(k), hp: 560, maxHp: 560, p: [x, 0, z], r, node, glass, frame, inside, label: '온실 돔', cold: 0, a: D.a, D };
      if (!dome.alive) this.shatterDome(dome, true);
      this.domes.push(dome);
      return dome;
    }
    makeTunnels() {
      for (const t of this.tunnels) {
        const a = [t.a[0], t.y, t.a[1]],
          b = [t.b[0], t.y, t.b[1]],
          tube = K.beam(this.root, a, b, t.r * 2, C.hull);
        tube.geo = 'cylinder';
        const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
        for (let s = 4; s < len; s += 7) {
          const p = M.add(a, M.mul(M.sub(b, a), s / len)),
            ring = mesh(this.root, 'torus', p, [t.r * 1.48, t.r * 1.48, t.r * 1.48], C.steel);
          ring.r = [Math.PI / 2, Math.atan2(b[0] - a[0], b[2] - a[2]), 0];
          if (s % 21 < 7) {
            const l = mesh(this.root, 'sphere', M.add(p, [0, t.r + 0.4, 0]), [0.5, 0.5, 0.5], C.warm, { em: 1, type: 1 });
            l.restEm = 1;
            this.lights.push(l);
          }
        }
      }
    }
    makeCity() {
      const rng = this.rng;
      this.tunnels = [];
      this.plants = this.stat('tinySphere', { capacity: 2400 });
      this.stalks = this.stat('lowCyl', { capacity: 600 });
      this.beds = [];
      this.domeGeometry();
      DOMES.forEach((D, k) => this.makeDome(k, D));
      this.makeTunnels();
      // living blocks between the domes, doors open, some windows still lit
      this.habs = [];
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU + 0.21,
          R = 112 + (k % 3) * 22 + rng() * 8,
          x = Math.sin(a) * R,
          z = Math.cos(a) * R;
        if (this.tunnels.some(t => segDist(x, z, t.a, t.b) < 14)) continue;
        const w = 14 + rng() * 8,
          h = 7 + rng() * 4,
          b = this.building('hab-' + k, [x, 0, z], w, h, 'hab', 150);
        b.node.r[1] = a + Math.PI;
        mesh(b.node, 'box', [0, h / 2, 0], [w, h, w * 0.6], C.hull);
        mesh(b.node, 'box', [0, h + 0.3, 0], [w * 1.04, 0.6, w * 0.64], C.panel);
        mesh(b.node, 'box', [0, 2.2, w * 0.3 + 0.05], [3, 4.4, 0.2], C.dark);
        for (let i = -2; i <= 2; i++) {
          if (i === 0) continue;
          const lit = rng() < 0.55,
            win = mesh(b.node, 'box', [i * w * 0.18, h * 0.62, w * 0.3 + 0.06], [w * 0.11, h * 0.22, 0.12], lit ? C.glow : '#30404c', { em: lit ? 0.9 : 0.05, type: lit ? 1 : 0 });
          if (lit) {
            win.restEm = 0.9;
            this.lights.push(win);
          }
        }
        mesh(b.node, 'cylinder', [w * 0.32, h + 1.4, 0], [1.2, 2.2, 1.2], C.steel);
        this.finishBuilding(b);
        this.habs.push(b);
      }
      // tanks and pumps round the processor
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + 0.5,
          R = 62 + (k % 2) * 10,
          x = Math.sin(a) * R,
          z = Math.cos(a) * R;
        if (Math.abs(x) < 14 && z > 0) continue;
        if (this.tunnels.some(t => segDist(x, z, t.a, t.b) < 11)) continue;
        const r = 6 + rng() * 3,
          h = 14 + rng() * 8,
          b = this.building('tank-' + k, [x, 0, z], r * 2, h, 'tank', 220);
        mesh(b.node, 'cylinder', [0, h / 2, 0], [r * 2, h, r * 2], k % 2 ? C.hull : C.panel);
        mesh(b.node, 'dome', [0, h, 0], [r * 2, r * 0.9, r * 2], k % 2 ? C.hull : C.panel);
        mesh(b.node, 'cylinder', [0, h * 0.3, 0], [r * 2.04, 0.6, r * 2.04], C.red);
        this.finishBuilding(b);
      }
      // the landing pad and what was left on it
      const pad = group(this.root, [300, 0.06, 70]);
      mesh(pad, 'disc', [0, 0, 0], [60, 0.12, 60], '#3c4249');
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        mesh(pad, 'box', [Math.sin(a) * 24, 0.08, Math.cos(a) * 24], [1.2, 0.1, 5], '#e8c650').r[1] = a;
      }
      mesh(pad, 'box', [0, 0.1, 0], [18, 0.1, 2], '#e8c650');
      mesh(pad, 'box', [0, 0.1, 0], [2, 0.1, 18], '#e8c650');
      // rovers left where they stopped
      const rovers = [
        [140, 330, 0.4],
        [-260, 180, 2.1],
        [380, -160, 1.2],
        [-120, -340, 3.6],
        [60, 420, 5.1],
        [-410, -40, 0.9],
      ];
      for (const [x, z, a] of rovers) this.rover(x, z, a);
      // solar fields east and west, dusted with snow
      const SOL = this.stat('box', { capacity: 400 }),
        SNOW = this.stat('box', { capacity: 400 });
      for (const side of [-1, 1])
        for (let row = 0; row < 7; row++)
          for (let i = 0; i < 12; i++) {
            const x = side * (300 + row * 12),
              z = -120 + i * 13 + (side > 0 ? 40 : -30),
              y = this.height(x, z);
            this.put(SOL, [x, y + 2.2, z], [-0.5, 0, 0], [9, 0.3, 5], C.blue, 0.02);
            this.put(SNOW, [x, y + 2.42, z - 0.3], [-0.5, 0, 0], [8.6, 0.12, 2.4], C.snow);
            this.put(SOL, [x, y + 1, z + 1.3], [0, 0, 0], [0.3, 2, 0.3], C.steel);
          }
      // the mast that talked to whoever was coming
      const mast = group(this.root, [-340, this.height(-340, -290), -290]);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.4;
        K.beam(mast, [Math.sin(a) * 6, 0, Math.cos(a) * 6], [Math.sin(a) * 1, 70, Math.cos(a) * 1], 0.5, C.steel);
      }
      for (let y = 8; y < 70; y += 8) mesh(mast, 'torus', [0, y, 0], [(6 - (y / 70) * 5) * 1.38, 1.38, (6 - (y / 70) * 5) * 1.38], C.steel);
      const dish = mesh(mast, 'dome', [0, 62, 3], [12, 4, 12], C.hull);
      dish.r[0] = -1.1;
      const beacon = mesh(mast, 'sphere', [0, 72, 0], [1.4, 1.4, 1.4], C.red, { em: 1.4, type: 1 });
      beacon.restEm = 1.4;
      this.lights.push(beacon);
      this.blink = [beacon];
    }
    rover(x, z, a) {
      const g = group(this.root, [x, this.height(x, z), z]);
      g.r[1] = a;
      mesh(g, 'box', [0, 2, 0], [4.4, 1.8, 8], '#d9a43a');
      mesh(g, 'box', [0, 3.4, 1.6], [3.6, 1.6, 3.2], C.hull);
      mesh(g, 'box', [0, 3.5, 3.25], [3.2, 1, 0.1], '#28323c');
      for (const s of [-1, 1]) for (const k of [-1, 0, 1]) mesh(g, 'cylinder', [s * 2.5, 1.1, k * 2.8], [2.2, 0.8, 2.2], C.dark).r[2] = Math.PI / 2;
      mesh(g, 'box', [0, 2.95, -2], [4.3, 0.2, 3.5], C.snow);
    }
    /* ---------- the processor and its core ---------- */
    makeRuler() {
      const base = group(this.root, [CORE[0], 0, CORE[2]]),
        body = group(base, [0, 0, -CORE[2]]);
      // the platform it stands on
      mesh(body, 'hex', [0, 3, 0], [68, 6, 68], C.steel);
      mesh(body, 'hex', [0, 6.1, 0], [62, 0.3, 62], '#525d68');
      // the tower: three drums, radiator fins, a crown of stacks
      const drum = (y, r, h, c) => mesh(body, 'cylinder', [0, y + h / 2, 0], [r * 2, h, r * 2], c);
      drum(6, 17, 58, C.hull);
      drum(64, 13, 38, C.panel);
      drum(102, 9.5, 26, C.hull);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        const fin = mesh(body, 'box', [Math.sin(a) * 18, 34, Math.cos(a) * 18], [0.6, 46, 3.4], C.steel);
        fin.r[1] = a;
      }
      for (const y of [22, 44, 62, 100]) mesh(body, 'cylinder', [0, y, 0], [y < 64 ? 35.6 : 27, 1.2, y < 64 ? 35.6 : 27], C.red);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.4,
          sx = Math.sin(a) * 6,
          sz = Math.cos(a) * 6;
        mesh(body, 'cylinder', [sx, 134, sz], [3.6, 16, 3.6], C.dark);
        this.plumes.push({ p: [sx, 142, sz - CORE[2]], next: 0 });
      }
      // fans on its flanks, turning
      for (const s of [-1, 1]) {
        const hub = group(body, [s * 18.5, 48, 0]);
        hub.r[2] = (s * Math.PI) / 2;
        mesh(hub, 'cylinder', [0, 0, 0], [12, 1.2, 12], C.dark);
        const rot = group(hub, [0, 0.8, 0]);
        for (let k = 0; k < 5; k++) {
          const blade = mesh(rot, 'box', [Math.sin((k / 5) * TAU) * 3, 0, Math.cos((k / 5) * TAU) * 3], [1.2, 0.2, 5.6], C.panel);
          blade.r[1] = (k / 5) * TAU;
        }
        this.fans.push({ node: rot, speed: 2.4 });
      }
      // the panel over the core bay, and the bay itself
      mesh(body, 'box', [0, 30, 17.4], [16, 9, 0.6], '#0f1418');
      this.panel = mesh(body, 'box', [0, 30, 17.75], [14.6, 7.6, 0.1], '#1c3a30', { em: 0.6, type: 1 });
      this.panel.restEm = 0.6;
      this.lights.push(this.panel);
      for (let i = 0; i < 6; i++) {
        const bar = mesh(body, 'box', [-5 + i * 2, 28.2 + (i % 2) * 0.6, 17.82], [1.4, 0.5, 0.06], '#7dffc8', { em: 1.2, type: 1 });
        bar.restEm = 1.2;
        this.lights.push(bar);
      }
      mesh(body, 'box', [0, 10, 17.2], [12, 10, 1.4], '#1a2026');
      // the core in its cage: the cage is what the beam has to cut first
      const core = group(base, [0, CORE[1], 0]);
      this.coreParts = coreModel(core, true);
      const cage = group(base, [0, CORE[1], 0]);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        mesh(cage, 'box', [Math.sin(a) * 3.4, 0, Math.cos(a) * 3.4], [0.36, 8, 0.36], C.dark);
      }
      for (const y of [-3.8, 0, 3.8]) mesh(cage, 'torus', [0, y, 0], [4.8, 4.8, 4.8], C.steel);
      this.cage = cage;
      this.setupRuler(base, body, core, cage, CORE[1], 420, 5);
      if (this.ruler.hp <= 0) cage.visible = false;
      this.ruler.p = [CORE[0], CORE[1], CORE[2]];
      this.towerR = 17.5;
    }
    guardText() {
      return '대기 처리기 코어 · 보호 격자를 광선으로 부수세요';
    }
    lockedText() {
      return ['보호 격자가 코어를 감싸고 있습니다', '광선으로 격자를 먼저 부수세요. 남은 격자 ' + Math.round((this.ruler.hp / 420) * 100) + '%'];
    }
    labels() {
      return [
        {
          id: 'panel',
          p: [0, 36.5, 18],
          en: this.off ? 'RESIDENTS 0 · TERRAFORMING HALTED — 63%' : 'RESIDENTS 0 · TERRAFORMING 63%',
          ko: this.off ? '거주자 0 · 테라포밍 정지 — 63%' : '거주자 0 · 테라포밍 진행률 63%',
          cls: 'thawPanel',
          range: 260,
        },
      ];
    }
    /* ---------- the bugs ---------- */
    makeCreatures() {
      const sw = (this.swarm = new K.Swarm(this, { capacity: 12000, seed: 63, color: C.bug }));
      this.patches = [];
      const add = (x, z, r, n, tag, yFn = null, spread = 0.62) => {
        const k = this.patches.length;
        this.patches.push(sw.addCluster({ x, z, r, n, dead: this.losses.get(k) || 0, tag, yFn, spread }));
      };
      // in every dome: a heap round the warm middle, a huddle under each lamp, wanderers over the floor and the beds
      DOMES.forEach((D, k) => {
        const cx = Math.sin(D.a) * D.R,
          cz = Math.cos(D.a) * D.R,
          r = D.r,
          dense = D.kind === 'forest' ? 1.35 : 1,
          yFn = this.domeFloor(k);
        const lampN = Math.round(r / 6);
        add(cx, cz, 6.5, Math.round(360 * dense), 'd' + k, yFn);
        for (let i = 0; i < lampN; i++) {
          const a = (i / lampN) * TAU + D.a,
            rr = r * 0.55;
          add(cx + Math.sin(a) * rr, cz + Math.cos(a) * rr, 3.6, Math.round(85 * dense), 'd' + k, yFn);
        }
        add(cx, cz, r * 0.82, Math.round(240 * dense), 'd' + k, yFn, 1.0);
      });
      // round the processor's foot, where it is warmest outside
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.3;
        add(Math.sin(a) * 41, Math.cos(a) * 41, 5, 130, 'p');
      }
      // at the doors of the living blocks
      for (const b of this.habs) {
        const a = Math.atan2(b.p[0], b.p[2]);
        add(b.p[0] - Math.sin(a) * (b.w * 0.45), b.p[2] - Math.cos(a) * (b.w * 0.45), 5, 70, 'h');
      }
      // along the tunnels, against the warm tubes
      for (const t of this.tunnels) {
        const mid = [(t.a[0] + t.b[0]) / 2, (t.a[1] + t.b[1]) / 2],
          d = [t.b[0] - t.a[0], t.b[1] - t.a[1]],
          l = Math.hypot(d[0], d[1]),
          side = [-d[1] / l, d[0] / l];
        add(mid[0] + side[0] * 6.5, mid[1] + side[1] * 6.5, 7, 60, 't');
      }
      // the heater masts out on the ice: each one a warm island
      for (const [x, z, , n] of this.pylons) add(x, z, 9, n, 'y');
      const rng = M.rand(1235);
      // stragglers in the thawed mud
      for (let i = 0; i < 18; i++) {
        const a = rng() * TAU,
          R = 260 + rng() * 150;
        add(Math.sin(a) * R, Math.cos(a) * R, 6, 20 + Math.round(rng() * 30), 's');
      }
      sw.onKill = () => {
        this.squashTotal++;
      };
      for (const [x, z, k] of this.savedSmears) sw.smear(x, this.floor(x, z) , z, k ? 'burn' : 'crush');
      this.startCount = sw.alive;
    }
    // a dome's floor: the soil, and up on the beds where there are beds
    domeFloor(k) {
      const D = DOMES[k],
        cx = Math.sin(D.a) * D.R,
        cz = Math.cos(D.a) * D.R,
        c = Math.cos(D.a),
        s = Math.sin(D.a),
        beds = this.beds.filter(b => b.dome === k);
      return (x, z) => {
        const dx = x - cx,
          dz = z - cz,
          lx = dx * c - dz * s,
          lz = dx * s + dz * c;
        for (const b of beds) if (Math.abs(lx - b.x) < b.w / 2 && Math.abs(lz) < b.len / 2) return 0.52;
        return 0.05;
      };
    }
    signalValue() {
      return this.swarm ? this.swarm.alive : 0;
    }
    onSquash(n, p, how) {
      if (!this.told.first) {
        this.told.first = true;
        this.later(0.6, () => this.game.ui.toast('짜부라졌습니다', '살아남은 벌레들은 그림자를 피해 흩어졌다가, 잠잠해지면 다시 모입니다.', 6));
      }
    }
    /* ---------- the scenery out on the ice ---------- */
    makeScenery() {
      const rng = M.rand(4242);
      // the heater masts
      for (const [x, z] of this.pylons) {
        const y = this.height(x, z),
          g = group(this.root, [x, y, z]);
        mesh(g, 'cylinder', [0, 12, 0], [1.4, 24, 1.4], C.steel);
        mesh(g, 'box', [0, 23, 0], [5, 1, 1], C.panel);
        const ring = mesh(g, 'torus', [0, 0.6, 0], [3.6, 3.6, 3.6], C.warm, { em: 0.9, type: 1 });
        ring.restEm = 0.9;
        this.lights.push(ring);
        const top = mesh(g, 'sphere', [0, 24.6, 0], [0.9, 0.9, 0.9], C.red, { em: 1.2, type: 1 });
        top.restEm = 1.2;
        this.lights.push(top);
        this.blink.push(top);
        // the snow melted round it to bare wet ground, the edge ragged, lying on the slope
        const nn = this.groundNormal(x, z),
          X = M.mul(M.norm(M.cross(nn, [0, 0, 1])), 30),
          Z = M.mul(M.norm(M.cross(X, nn)), 30);
        this.putBasis(this.melt || (this.melt = this.stat('lowDisc', { capacity: 16 })), [x, y + 0.08, z], X, M.mul(nn, 0.02), Z, '#3e2f22', 0, 37, 0, x * 0.1);
      }
      // rocks through the snow, and drifts
      const ROCK = this.stat('lowSphere', { capacity: 260 });
      for (let i = 0; i < 260; i++) {
        const a = rng() * TAU,
          R = 470 + Math.pow(rng(), 0.8) * 1200,
          x = Math.sin(a) * R,
          z = Math.cos(a) * R,
          s = 3 + Math.pow(rng(), 2) * 16;
        this.put(ROCK, [x, this.height(x, z) + s * 0.15, z], [rng(), rng() * 6, rng()], [s * 1.4, s * 0.7, s], rng() < 0.6 ? '#3b3f46' : '#545a62', 0);
      }
      // what was dropped when they left: crates, drums, fallen markers
      const JUNK = this.stat('box', { capacity: 400 }),
        DRUM = this.stat('lowCyl', { capacity: 200 });
      for (let i = 0; i < 260; i++) {
        const a = rng() * TAU,
          R = 60 + Math.pow(rng(), 0.7) * 520,
          x = Math.sin(a) * R,
          z = Math.cos(a) * R;
        if (this.inDome(x, z, 4) || Math.hypot(x, z) < 40) continue;
        const y = this.floor(x, z);
        if (i % 3)
          this.put(JUNK, [x, y + 0.7, z], [0, rng() * 6, 0], [1.2 + rng() * 2, 1.2 + rng(), 1.2 + rng() * 2], rng() < 0.5 ? C.panel : rng() < 0.5 ? '#c99a3c' : C.rust);
        else this.put(DRUM, [x, y + 0.9, z], [rng() < 0.3 ? Math.PI / 2 : 0, rng() * 6, 0], [1.2, 1.8, 1.2], rng() < 0.5 ? C.red : '#3a6aa0');
      }
      // stakes with flags out where the survey went: the furthest the warming was meant to reach
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU,
          R = 900,
          x = Math.sin(a) * R,
          z = Math.cos(a) * R,
          y = this.height(x, z);
        mesh(this.root, 'box', [x, y + 2, z], [0.2, 4, 0.2], C.steel);
        mesh(this.root, 'box', [x + 0.6, y + 3.6, z], [1.2, 0.7, 0.05], '#ff6a3c');
      }
      // steam over the processor drifts and is gone
      this.puffs = [];
    }
    inDome(x, z, pad = 0) {
      return DOMES.some(D => Math.hypot(x - Math.sin(D.a) * D.R, z - Math.cos(D.a) * D.R) < D.r + pad);
    }
    /* ---------- the domes: glass to see through, an airlock to fly in by, broken by the beam ---------- */
    raycast(origin, dir, max = 230) {
      const base = super.raycast(origin, dir, max);
      let dist = base ? base.distance : max,
        best = base ? base.entity : null;
      for (const d of this.domes) {
        if (!d.alive) continue;
        const t = this.rayDome(origin, dir, d, dist);
        if (t < dist) {
          dist = t;
          best = d;
        }
      }
      // the tower itself stops the beam
      const tt = rayCyl(origin, dir, [0, 0, 0], this.towerR, 128);
      if (tt < dist) {
        dist = tt;
        best = this.towerEnt || (this.towerEnt = { kind: 'tower', fixed: true, fixedNote: '대기 처리기 본체입니다.', label: '대기 처리기', alive: true, p: [0, 40, 0], radius: 18 });
      }
      return best ? { entity: best, distance: dist, point: M.add(origin, M.mul(dir, dist)) } : null;
    }
    // where a ray meets a dome's glass, coming in from outside or going out from inside; the airlock lets it through
    rayDome(o, dir, d, max) {
      const r = d.r,
        ox = (o[0] - d.p[0]) / r,
        oy = o[1] / (r * SQ),
        oz = (o[2] - d.p[2]) / r,
        dx = dir[0] / r,
        dy = dir[1] / (r * SQ),
        dz = dir[2] / r;
      const A = dx * dx + dy * dy + dz * dz,
        B = ox * dx + oy * dy + oz * dz,
        Cc = ox * ox + oy * oy + oz * oz - 1,
        disc = B * B - A * Cc;
      if (disc < 0) return Infinity;
      const s = Math.sqrt(disc);
      for (const t of [(-B - s) / A, (-B + s) / A]) {
        if (t <= 0 || t >= max) continue;
        const y = o[1] + dir[1] * t;
        if (y < 0) continue;
        const lx = o[0] + dir[0] * t - d.p[0],
          lz = o[2] + dir[2] * t - d.p[2];
        if (this.inDoor(d, lx, y, lz)) continue;
        return t;
      }
      return Infinity;
    }
    inDoor(d, lx, y, lz) {
      let az = Math.atan2(lx, lz) - d.a;
      az = ((az + Math.PI) % TAU + TAU) % TAU - Math.PI;
      return Math.abs(az) < DOOR.half && y < DOOR.top * d.r * SQ;
    }
    damage(e, amount, dir, source) {
      if (!e || !Number.isFinite(amount) || amount <= 0) return;
      if (e.kind === 'dome') {
        if (!e.alive) return;
        e.hp -= amount;
        e.glass.em = 0.05 + (1 - e.hp / e.maxHp) * 0.3;
        if (e.hp <= 0) this.shatterDome(e, false);
        return;
      }
      if (e.kind === 'tower') return;
      if (e.kind === 'ruler') {
        // the cage takes the cutting; the tower does not lurch
        const r = this.ruler;
        if (r.hp <= 0) return;
        r.hp = Math.max(0, r.hp - amount);
        this.cage.r[1] = Math.sin(this.time * 30) * 0.02;
        if (Math.random() < 0.2) this.emit(M.add(r.p, [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 3]), 2, this.config.spark, 10, 0.5);
        if (r.hp === 0) {
          this.cage.visible = false;
          this.emit(r.p, 30, this.config.spark, 22, 2);
          for (let i = 0; i < 10; i++) this.debris(M.add(r.p, [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 2]), C.dark);
          this.game.audio.impact(2);
          const [title, line] = this.config.rulerBreak;
          this.game.ui.toast(title, line, 6);
        }
        return;
      }
      super.damage(e, amount, dir, source);
    }
    debris(p, c) {
      this.emit(p, 1, c, 14, 1.6, true);
    }
    shatterDome(d, quiet) {
      d.alive = false;
      d.glass.visible = false;
      this.brokenDomes.add(d.k);
      // the struts sag and the glass lies in pieces on the floor
      d.frame.s = [1, 0.55, 1];
      d.frame.r[2] = 0.06;
      if (!quiet) {
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * TAU,
            el = Math.random() * 1.2;
          this.emit([d.p[0] + Math.sin(a) * Math.cos(el) * d.r, Math.sin(el) * d.r * SQ, d.p[2] + Math.cos(a) * Math.cos(el) * d.r], 1, C.glass, 16, 2.4, true);
        }
        this.game.audio.crack(0, 1);
        this.game.audio.impact(1.6);
        this.game.ui.toast('돔 유리가 깨졌습니다', '안의 온기가 빠져나갑니다. 그 안의 벌레들이 느려집니다.', 5);
      }
      const shards = this.shards || (this.shards = this.stat('box', { capacity: 300 })),
        rng = M.rand(77 + d.k);
      for (let i = 0; i < 60; i++) {
        const a = rng() * TAU,
          rr = d.r * (0.85 + rng() * 0.3),
          x = d.p[0] + Math.sin(a) * rr,
          z = d.p[2] + Math.cos(a) * rr;
        this.put(shards, [x, 0.15, z], [rng() * 0.4, rng() * 6, rng() * 0.4], [1 + rng() * 3, 0.1, 1 + rng() * 2], C.glass, 0.1, 0, 0, 0, 1);
      }
    }
    collide(ship, dt) {
      // the domes' glass, from either side; the airlock is the way in
      for (const d of this.domes) {
        if (!d.alive) continue;
        const lx = ship.p[0] - d.p[0],
          lz = ship.p[2] - d.p[2],
          y = ship.p[1],
          q = Math.hypot(lx / d.r, y / (d.r * SQ), lz / d.r);
        if (Math.abs(q - 1) * d.r > 3.4 || y < -1) continue;
        if (this.inDoor(d, lx, y, lz)) continue;
        const n = M.norm([lx / d.r, y / (d.r * SQ * SQ), lz / d.r]),
          side = q < 1 ? -1 : 1,
          want = (1 + (side * 3.4) / d.r) / q;
        ship.p = [d.p[0] + lx * want, Math.max(y * want, 0), d.p[2] + lz * want];
        const vn = ship.velocity[0] * n[0] + ship.velocity[1] * n[1] + ship.velocity[2] * n[2];
        if (vn * side < 0) {
          if (Math.abs(vn) > 18 && ship.hitCooldown <= 0) {
            this.damage(d, Math.abs(vn) * 4, n, 'ram');
            ship.hitCooldown = 0.4;
            ship.shake = 0.5;
            this.game.audio.impact(1);
          }
          ship.velocity = M.sub(ship.velocity, M.mul(n, vn * 1.2));
        }
      }
      // the tower
      const R = Math.hypot(ship.p[0], ship.p[2]),
        lim = (ship.p[1] < 64 ? 19 : ship.p[1] < 102 ? 15 : 11.5) + 2.6;
      if (R < lim && ship.p[1] < 136) {
        const k = lim / Math.max(R, 0.01);
        ship.p[0] *= k;
        ship.p[2] *= k;
        const vr = (ship.velocity[0] * ship.p[0] + ship.velocity[2] * ship.p[2]) / (R * k || 1);
        if (vr < 0) {
          ship.velocity[0] -= (vr * ship.p[0]) / (R * k || 1);
          ship.velocity[2] -= (vr * ship.p[2]) / (R * k || 1);
        }
      }
      super.collide(ship, dt);
    }
    /* ---------- running, and stopping ---------- */
    updateWorld(dt) {
      const t = this.time;
      for (const f of this.fans) f.node.r[1] += f.speed * dt;
      for (const b of this.blink || []) if (b.restEm) b.em = this.off ? 0 : Math.sin(t * 3 + b.p[0]) > 0.6 ? b.restEm : 0.15;
      // steam off the stacks, while it runs
      if (!this.off && t > (this.puffT || 0)) {
        this.puffT = t + 0.35;
        for (const pl of this.plumes) this.emit([pl.p[0], pl.p[1], pl.p[2] + CORE[2]], 1, '#f4f6f8', 4, 2.6, false);
      }
      // a dome left open to the cold: the bugs in it slow and stop
      for (const d of this.domes)
        if (!d.alive && d.cold < 1) {
          d.cold = Math.min(1, d.cold + dt / 45);
          for (const c of this.patches) if (c.tag === 'd' + d.k) c.cold = d.cold;
        }
      if (this.ruler.captured && !this.off) this.beginOff();
      if (this.off) this.updateOff(dt);
      // the sound of them: a dry rustle when many are running close by
      const sw = this.swarm;
      this.game.audio.skitter(sw ? Math.min(1, sw.running / 180) : 0);
    }
    beginOff() {
      this.off = true;
      this.offAt = this.time;
      this.game.audio.lightsOut();
      this.game.ui.toast('대기 처리기가 멈췄습니다', '돔의 난방이 꺼졌습니다. 온도가 내려갑니다.', 7);
      this.later(32, () => {
        if (!this.disposed) this.game.ui.toast('벌레들이 움직이지 않습니다', '추위에 웅크린 채 멈췄습니다.', 7);
      });
    }
    updateOff(dt) {
      const k = M.clamp((this.time - this.offAt) / 40, 0, 1);
      // lights go out one after another, flickering first
      this.lights.forEach((n, i) => {
        const at = (i % 17) * 0.35 + (i % 5) * 0.2;
        const tt = this.time - this.offAt - at;
        n.em = tt < 0 ? n.restEm : tt < 0.8 ? (Math.sin(tt * 40) > 0 ? n.restEm : 0.05) : 0;
      });
      for (const f of this.fans) f.speed = Math.max(0, f.speed - dt * 0.3);
      this.applyCold(k);
    }
    applyCold(k) {
      this.heat = 1 - k;
      if (this.swarm) this.swarm.cold = M.clamp((k - 0.12) / 0.75, 0, 1);
      if (this.ground) this.ground.detail = THAW_R - k * 300;
      for (const d of this.domes) {
        if (!d.alive) continue;
        d.glass.color = M.hex(C.glass).map((c, i) => c + ([0.95, 0.97, 1][i] - c) * k * 0.8);
        d.glass.alpha = 0.2 + k * 0.42;
      }
      if (this.panel) this.panel.em = 0.6 * (1 - k);
      const e = this.game.engine,
        mix = (a, b) => a.map((v, i) => v + (b[i] - v) * k);
      e.fog = mix(ENV.fog, COLD.fog);
      e.fogD = ENV.fogD + (COLD.fogD - ENV.fogD) * k;
      e.ambient = ENV.ambient + (COLD.ambient - ENV.ambient) * k;
      e.tint = mix(ENV.tint, COLD.tint);
    }
    applyOff(onLoad) {
      for (const n of this.lights) n.em = 0;
      for (const f of this.fans) f.speed = 0;
      this.coreParts && this.ruler.head && (this.ruler.head.visible = false);
      this.applyCold(1);
      if (this.swarm) {
        this.swarm.cold = 1;
        for (const c of this.patches) c.cold = 1;
      }
    }
    /* ---------- what it keeps ---------- */
    tokens() {
      const out = [];
      const losses = this.patches ? this.patches.filter(c => c.alive < c.n0).map(c => enc2(c.k) + enc2(Math.min(1295, c.n0 - c.alive))) : [];
      out.push(...pack('x.b.', losses));
      const sm = this.swarm ? this.swarm.saved.map(([x, z, k]) => enc2(M.clamp(Math.round((x + 972) / 1.5), 0, 1295)) + enc2(M.clamp(Math.round((z + 972) / 1.5), 0, 1295)) + (k ? '1' : '0')) : [];
      out.push(...pack('x.m.', sm));
      if (this.brokenDomes.size) out.push('x.o.' + [...this.brokenDomes].map(k => B36[k]).join(''));
      if (this.swarm) out.push('x.n.' + this.swarm.alive.toString(36));
      return out;
    }
    snapshot() {
      if (this.disposed || !this.patches) return;
      // keep the smears made before this visit too: they came in through the save, not through this visit's list
      if (this.swarm && this.savedSmears.length && !this.mergedSmears) {
        this.mergedSmears = true;
        this.swarm.saved = this.savedSmears.concat(this.swarm.saved).slice(-320);
      }
      this.destroyed = new Set([...this.destroyed].filter(t => !t.startsWith('x.')).concat(this.tokens()));
      super.snapshot();
    }
  }
  function segDist(x, z, a, b) {
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      l2 = dx * dx + dz * dz,
      t = M.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (l2 || 1), 0, 1);
    return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
  }
  function rotY(p, a, ox, oz) {
    const c = Math.cos(a),
      s = Math.sin(a);
    return [ox + p[0] * c + p[2] * s, p[1], oz - p[0] * s + p[2] * c];
  }
  function rayCyl(o, d, c, r, h) {
    const ox = o[0] - c[0],
      oz = o[2] - c[2],
      A = d[0] * d[0] + d[2] * d[2],
      B = ox * d[0] + oz * d[2],
      Cc = ox * ox + oz * oz - r * r,
      disc = B * B - A * Cc;
    if (A < 1e-6 || disc < 0) return Infinity;
    const t = (-B - Math.sqrt(disc)) / A;
    if (t <= 0) return Infinity;
    const y = o[1] + d[1] * t;
    return y >= 0 && y <= h ? t : Infinity;
  }
  K.Planets[ID] = Thaw;
})((window.KO ||= {}));
