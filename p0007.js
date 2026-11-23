/* @surface {"id":"p0007","shortName":"에덴 08","rulerName":"눈","trophyNote":"분류 불명. 살아 있음.","living":true,"inhabited":false} */
/* p0007 — a world that is one body. It does not chase. It breathes, watches, flinches, and keeps every wound.
 * Save contract (planetStates.p0007.destroyed):
 *   "y.w." wounds opened from orbit (lat/lon, 4 chars each) · "y.e." burst eyes (index, 2 chars)
 *   "y.t." cut tentacles (index 2 + remaining segments 1) · "y.s." beam scars (x/z, 4 chars) · "y.f." scars past 808 m (x/z, 6 chars) */
(function (K) {
  'use strict';
  const { M, mesh, group } = K,
    ID = 'p0007',
    TAU = Math.PI * 2;
  const { trs, mul } = K.Mat;
  const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  const SKIN = '#cf7f86',
    RIM = '#a34a5a',
    RAW = '#7d0c19',
    JELLY = '#efe6d6',
    NERVE = '#c35866',
    MAIN_IRIS = '#e0a019';
  const IRIS = ['#d99a1c', '#79c255', '#7c58d8', '#4fb4dc', '#c8352e', '#e6d377', '#d86fb0'];
  const EYE = [0, 50],
    EYE_R = 17;
  const rgb = h => M.hex(h).slice();
  const enc2 = n => B36[Math.floor(n / 36) % 36] + B36[n % 36];
  const dec2 = (s, i) => {
    const a = B36.indexOf(s[i]),
      b = B36.indexOf(s[i + 1]);
    return a < 0 || b < 0 ? -1 : a * 36 + b;
  };
  const qxz = v => M.clamp(Math.round((v + 810) / 1.25), 0, 1295);
  const enc3 = n => B36[Math.floor(n / 1296) % 36] + B36[Math.floor(n / 36) % 36] + B36[n % 36];
  const qfar = v => M.clamp(Math.round((v + 5832) * 4), 0, 46655);
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

  /* ---------- what orbit can see and write: wounds on the globe ---------- */
  const cache = { key: '', normals: [] };
  function tokensOf(save, id = ID) {
    const st = save.data.planetStates?.[id];
    return Array.isArray(st?.destroyed) ? st.destroyed.filter(t => typeof t === 'string') : [];
  }
  function readWounds(tokens) {
    const out = [];
    for (const t of tokens)
      if (t.startsWith('y.w.'))
        for (let i = 4; i + 4 <= t.length; i += 4) {
          const a = dec2(t, i),
            b = dec2(t, i + 2);
          if (a < 0 || b < 0) continue;
          const lat = (a / 1295 - 0.5) * Math.PI,
            lon = (b / 1295 - 0.5) * TAU;
          out.push([Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]);
        }
    return out;
  }
  const woundTokens = list =>
    pack(
      'y.w.',
      list.slice(-24).map(n => {
        const lat = Math.asin(M.clamp(n[1], -1, 1)),
          lon = Math.atan2(n[0], n[2]);
        return enc2(Math.round((lat / Math.PI + 0.5) * 1295)) + enc2(Math.round((lon / TAU + 0.5) * 1295));
      }),
    );
  K.Living = {
    normals(save, id = ID) {
      const tokens = tokensOf(save, id),
        key = tokens.filter(t => t.startsWith('y.w.')).join('|');
      if (key !== cache.key) {
        cache.key = key;
        cache.normals = readWounds(tokens);
      }
      return cache.normals;
    },
    wound(game, def, normal) {
      const st = (game.save.data.planetStates[def.id] ||= { destroyed: [], visited: false });
      const tokens = (st.destroyed || []).filter(t => typeof t === 'string');
      st.destroyed = tokens.filter(t => !t.startsWith('y.w.')).concat(woundTokens(readWounds(tokens).concat([normal])));
      game.save.write('checkpoint');
    },
    harmed(save, id = ID) {
      return tokensOf(save, id).some(t => t.startsWith('y.')) || save.data.trophies.some(t => t.planet === id);
    },
  };

  /* ---------- the trophy: an eye that keeps looking ---------- */
  K.TrophyModels[ID + '-ruler'] = (root, game, interior) => {
    const g = group(root, [0, 0.55, 0]),
      pivot = group(g);
    pivot.r[1] = Math.PI; // faces -Z like the heads; it turns toward whoever is near
    const ball = mesh(pivot, 'sphere', [0, 0, 0], [1.7, 1.7, 1.7], MAIN_IRIS, { type: 20, em: 1, detail: 0.5, seed: 2.31 });
    const strand = group(g, [0, -0.5, 0.45]);
    // the optic nerve hangs from under the eye and lies on the pedestal in its own blood
    [
      [0, -0.2, 0.04, 0.34, 0.5, 0.15],
      [0, -0.62, 0.12, 0.29, 0.5, 0.32],
      [0, -1.0, 0.25, 0.25, 0.45, 0.45],
      [0, -1.32, 0.42, 0.21, 0.34, 1.0],
    ].forEach(([x, y, z, w, h, tilt]) => {
      const n = mesh(strand, 'cylinder', [x, y, z], [w, h, w], NERVE);
      n.r[0] = tilt;
    });
    mesh(strand, 'lowSphere', [0, -1.45, 0.58], [0.34, 0.15, 0.42], '#9c2f40');
    mesh(g, 'lowDisc', [0, -1.97, 0.4], [1.25, 0.02, 1.05], '#5a0912', { alpha: 0.9 });
    const st = { open: 1, close: 0, blink: 2 + Math.random() * 4, t: 0 };
    g.tick = (dt, target) => {
      const w = g.world;
      st.t += dt;
      const dx = target[0] - w[12],
        dy = target[1] - w[13],
        dz = target[2] - w[14];
      const sx = w[0] * w[0] + w[1] * w[1] + w[2] * w[2] || 1,
        sy = w[4] * w[4] + w[5] * w[5] + w[6] * w[6] || 1,
        sz = w[8] * w[8] + w[9] * w[9] + w[10] * w[10] || 1;
      const lx = (dx * w[0] + dy * w[1] + dz * w[2]) / sx,
        ly = (dx * w[4] + dy * w[5] + dz * w[6]) / sy,
        lz = (dx * w[8] + dy * w[9] + dz * w[10]) / sz;
      const k = Math.min(1, dt * 4.5);
      pivot.r[1] += M.angle(pivot.r[1], Math.atan2(lx, lz)) * k;
      pivot.r[0] += (M.clamp(-Math.atan2(ly, Math.hypot(lx, lz)), -0.9, 0.9) - pivot.r[0]) * k;
      st.blink -= dt;
      if (st.blink <= 0) {
        st.blink = 2.5 + Math.random() * 6;
        st.close = 0.16;
      }
      st.close = Math.max(0, st.close - dt);
      st.open = M.damp(st.open, st.close > 0 ? 0 : 1, st.close > 0 ? 24 : 7, dt);
      ball.em = st.open;
      const d = Math.hypot(dx, dy, dz);
      ball.detail = M.damp(ball.detail, M.clamp(1.15 - d / 8, 0.2, 0.95), 1.6, dt);
      strand.r[2] = Math.sin(st.t * 1.1) * 0.04;
    };
    if (interior?.animators) interior.animators.push(dt => g.tick(dt, game.engine.camera.p));
    return g;
  };

  const ENV = {
    fog: [0.78, 0.33, 0.35],
    fogD: 0.0014,
    ambient: 0.72,
    tint: [1.2, 0.84, 0.86],
    sun: [-0.45, 0.78, 0.25],
    skyTop: [0.55, 0.1, 0.22],
    skyHorizon: [1, 0.55, 0.48],
    skyCloud: [1, 0.72, 0.62],
    skyStyle: 3,
    noShadows: true,
  };
  (K.SurfaceAtmospheres ||= {})[ID] = ENV;

  const CLS = {
    giant: { geo: 'midSphere', turn: 0.7, blink: [9, 18], hp: 260, rim: true, far: 640 },
    large: { geo: 'sphere', turn: 1.3, blink: [6, 14], hp: 70, rim: true, far: 600 },
    medium: { geo: 'lowSphere', turn: 2.6, blink: [4, 10], hp: 14, rim: false, far: 460 },
    small: { geo: 'lowSphere', turn: 5.5, blink: [2.5, 8], hp: 3, rim: false, far: 290 },
  };
  const TCLS = {
    giant: { n: 14, len: [50, 74], r0: [6, 8.5], hp: 240, amp: 0.12, freq: 0.45, reach: 2.2, keep: 20, far: 660, curl: [0.5, 1.3], joint: 99999 },
    medium: { n: 10, len: [10, 18], r0: [1.3, 2.2], hp: 60, amp: 0.19, freq: 0.9, reach: 2.6, keep: 10, far: 470, curl: [0.8, 1.9], joint: 130 },
    small: { n: 6, len: [2.4, 4.6], r0: [0.28, 0.45], hp: 6, amp: 0.3, freq: 1.7, reach: 3.2, keep: 5, far: 270, curl: [0.6, 1.6], joint: 70 },
  };
  const C = {
    sac: rgb('#7a2433'),
    rim: rgb(RIM),
    base: rgb('#8a3150'),
    tip: rgb('#e4919a'),
    raw: rgb(RAW),
    sucker: rgb('#f3c8bd'),
    root: rgb('#7b2a44'),
    socket: rgb('#5c1424'),
    poreLip: rgb('#b05463'),
    poreMound: rgb('#c46d78'),
    poreHole: rgb('#2a0309'),
    pool: rgb('#4a0610'),
    scarHot: rgb('#ff3d14'),
    scar: rgb('#4a070d'),
  };
  const T = new Float32Array(16),
    A = new Float32Array(16),
    Bm = new Float32Array(16),
    COL = [0, 0, 0];

  class Living extends K.Surface {
    constructor(game, def) {
      super(game, def, {
        seed: 70707,
        edge: 2600,
        rulerName: '눈',
        areaLabel: (def.name || ID).toUpperCase() + ' / SURFACE',
        regionName: '지표',
        afterLabel: '지표',
        rubble: SKIN,
        accent: RIM,
        spark: '#ff5a5f',
        lifeColor: RAW,
        scorch: '#3a0d14',
        environment: ENV,
        wind: 0.03,
        rulerAim: '눈 · Q로 붙잡아 뽑기',
        rulerGrab: ['눈을 붙잡았습니다', 'S로 뒤로 물러나 끝까지 당기세요.'],
        pullRate: 0.05,
        pullRise: 20,
        arrival: ['전시 복도에 눈이 도착했습니다.', '복도를 따라가면 새로 채워진 자리가 있습니다.'],
      });
      this.living = true;
      // what it remembers
      const mine = [...this.destroyed].filter(t => t.startsWith('y.'));
      this.burstSaved = new Set();
      this.cutSaved = new Map();
      this.marks = [];
      this.scars = [];
      for (const t of mine) {
        if (t.startsWith('y.e.'))
          for (let i = 4; i + 2 <= t.length; i += 2) {
            const n = dec2(t, i);
            if (n >= 0) this.burstSaved.add(n);
          }
        else if (t.startsWith('y.t.'))
          for (let i = 4; i + 3 <= t.length; i += 3) {
            const n = dec2(t, i),
              k = B36.indexOf(t[i + 2]);
            if (n >= 0 && k >= 0) this.cutSaved.set(n, k);
          }
        else if (t.startsWith('y.s.'))
          for (let i = 4; i + 4 <= t.length; i += 4) {
            const a = dec2(t, i),
              b = dec2(t, i + 2);
            if (a >= 0 && b >= 0) this.scars.push({ x: a * 1.25 - 810, z: b * 1.25 - 810 });
          }
        else if (t.startsWith('y.f.'))
          for (let i = 4; i + 6 <= t.length; i += 6) {
            const a = dec2(t, i) * 36 + B36.indexOf(t[i + 2]),
              b = dec2(t, i + 3) * 36 + B36.indexOf(t[i + 5]);
            if (a >= 0 && b >= 0 && B36.indexOf(t[i + 2]) >= 0 && B36.indexOf(t[i + 5]) >= 0) this.scars.push({ x: a / 4 - 5832, z: b / 4 - 5832 });
          }
      }
      // orbital wounds become open craters; a world bombed before it was known to be alive keeps those too
      const count = Math.min(24, Math.max(readWounds(mine).length, game.universe.hits(ID)));
      this.craters = [];
      for (let i = 0; i < count; i++) {
        const a = i * 2.39996 + 0.7;
        let d = 175 + ((i * 97) % 5) * 88 + (i % 3) * 24,
          x = Math.sin(a) * d,
          z = Math.cos(a) * d - 40;
        for (let k = 0; k < 4 && (Math.hypot(x - EYE[0], z - EYE[1]) < 120 || Math.hypot(x, z - 215) < 110); k++) {
          d += 120;
          x = Math.sin(a) * d;
          z = Math.cos(a) * d - 40;
        }
        this.craters.push({ x, z, r: 40 + (i % 4) * 9, depth: 9 + (i % 3) * 3 });
      }
      this.breathPh = 0;
      this.beatPh = 0;
      this.breathRate = 0.84;
      this.pain = 0;
      this.jolt = 0;
      this.quake = 0;
      this.lastBeat = 0;
      this.lastBreath = 0;
      this.gurgle = 4;
      this.drips = [];
      this.pieces = [];
      this.mists = [];
      this.snapped = false;
      this.lastScar = null;
      this.scarClock = 0;
      this.skin = {
        kind: 'skin',
        fixed: true,
        fixedNote: '붙잡을 곳이 없습니다.',
        label: '',
        alive: true,
        p: [0, 0, 0],
        radius: 1,
      };
      this.initialize();
      for (const s of this.scars) this.addScar(s.x, s.z, true);
    }
    /* ---------- body ---------- */
    height(x, z) {
      const r = Math.hypot(x, z),
        m = M.smooth(130, 560, r);
      let h =
        13 * Math.sin(x * 0.0062 + 1.1) * Math.cos(z * 0.0051 - 0.4) +
        6 * Math.sin((x * 0.7 + z) * 0.013 + 2) -
        10 * Math.pow(1 - Math.abs(Math.sin(x * 0.0085 + Math.sin(z * 0.0041) * 1.7)), 6);
      h = h * (0.42 + 0.58 * m) + 3.2 * Math.sin(x * 0.045 + Math.sin(z * 0.03) * 1.4) * Math.cos(z * 0.038 - 0.6);
      h -= 7 * (1 - M.smooth(0, 52, Math.hypot(x - EYE[0], z - EYE[1])));
      for (const c of this.craters || []) {
        const d = Math.hypot(x - c.x, z - c.z) / c.r;
        if (d < 1.4) h += -c.depth * (1 - M.smooth(0, 1, d)) + c.depth * 0.25 * Math.exp(-((d - 1.05) ** 2) * 28);
      }
      return h;
    }
    // Same displacement the flesh-ground shader applies: breath, the slow swell, the heartbeat, the shiver.
    swell(x, z) {
      const L = this.game.engine.life,
        b = L[1],
        f1 = b - Math.floor(b),
        f2 = b - 0.27 - Math.floor(b - 0.27);
      return (
        Math.sin(x * 0.011 + L[0]) * Math.cos(z * 0.009 - L[0] * 0.71) * 1.6 +
        Math.sin(L[0]) * 1.25 +
        (Math.exp(-f1 * 9) + 0.55 * Math.exp(-f2 * 9)) * L[2] +
        Math.sin(x * 0.37 + L[0] * 47) * Math.sin(z * 0.31 - L[1] * 41) * L[3]
      );
    }
    ground(x, z) {
      return this.height(x, z) + this.swell(x, z);
    }
    floor(x, z) {
      return this.ground(x, z);
    }
    // Finer grid near the landing area, coarser toward the fogged edge.
    makeTerrain() {
      const N = 200,
        S = 2900,
        p = [],
        n = [],
        idx = [];
      const warp = u => S * (0.36 * u + 0.64 * u * u * u);
      for (let j = 0; j <= N; j++)
        for (let i = 0; i <= N; i++) {
          const x = warp((i / N) * 2 - 1),
            z = warp((j / N) * 2 - 1);
          p.push(x, this.height(x, z), z);
          n.push(...M.norm([this.height(x - 1.5, z) - this.height(x + 1.5, z), 3, this.height(x, z - 1.5) - this.height(x, z + 1.5)]));
        }
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const a = j * (N + 1) + i,
            b = a + N + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      this.game.engine.addGeometry(this.geometryName, { p, n, idx });
      this.ownedGeometries.add(this.geometryName);
      mesh(this.root, this.geometryName, [0, 0, 0], [1, 1, 1], SKIN, { type: 9 });
    }
    makeCity() {}
    makeRuler() {
      const [ex, ez] = EYE,
        r = EYE_R;
      const base = group(this.root, [ex, this.height(ex, ez), ez]);
      this.mainRim = mesh(base, 'torus', [0, r * 0.08, 0], [r * 1.55, r * 2.7, r * 1.55], RIM);
      this.socket = mesh(base, 'disc', [0, 0.25, 0], [r * 2.05, 0.4, r * 2.05], '#3d0912');
      this.socketPool = mesh(base, 'disc', [0, 0.5, 0], [r * 1.4, 0.2, r * 1.4], '#6a0a16', { em: 0.08 });
      this.socketPool.visible = false;
      const head = group(base, [0, r * 0.25, 0]);
      this.mainBall = mesh(head, 'planet', [0, 0, 0], [r * 2, r * 2, r * 2], MAIN_IRIS, {
        type: 20,
        em: 1,
        detail: 0.4,
        seed: 2.31,
      });
      this.nerve = mesh(base, 'cylinder', [0, -r * 0.3, 0], [r * 0.3, 1, r * 0.3], NERVE);
      this.vessels = [0, 1].map(k => mesh(base, 'cylinder', [0, -r * 0.3, 0], [r * 0.07, 1, r * 0.07], k ? '#8f1f37' : '#a3304a'));
      this.stumpTop = mesh(base, 'disc', [0, r * 0.33, 0], [r * 0.29, 0.3, r * 0.29], RAW, { em: 0.12 });
      this.stumpTop.visible = false;
      const body = group(base),
        halo = group(base);
      this.setupRuler(base, body, head, halo, r * 0.25, 0, r * 1.02);
      this.mainEye = { yaw: 0, pitch: 0, open: 1, close: 0, blink: 12, dil: 0.4 };
      if (this.ruler.captured) this.snapped = true;
    }
    makeCreatures() {}
    makeScenery() {
      const rng = this.rng,
        spawn = this.spawn.p;
      this.eyes = [];
      this.tentacles = [];
      this.pores = [];
      const taken = [];
      // Placement depends only on the seed, never on wounds: eye and tentacle numbers stay the same between visits.
      const free = (x, z, r) => {
        if (Math.hypot(x - spawn[0], z - spawn[2]) < 30 + r) return false;
        if (Math.hypot(x - EYE[0], z - EYE[1]) < EYE_R * 1.7 + r) return false;
        if (Math.hypot(x, z) > 640) return false;
        for (const t of taken) if (Math.hypot(x - t[0], z - t[1]) < t[2] + r) return false;
        return true;
      };
      const place = (n, dmin, dmax, rmin, rmax, fn, around = null) => {
        let made = 0;
        for (let k = 0; made < n && k < n * 60; k++) {
          let x, z;
          const r = rmin + rng() * (rmax - rmin);
          if (around && around.length && rng() < 0.55) {
            const o = around[(rng() * around.length) | 0],
              a = rng() * TAU,
              d = o.r * 1.6 + 2 + rng() * 14;
            x = o.x + Math.sin(a) * d;
            z = o.z + Math.cos(a) * d;
          } else {
            const a = rng() * TAU,
              d = dmin + Math.pow(rng(), 0.75) * (dmax - dmin);
            x = Math.sin(a) * d;
            z = Math.cos(a) * d - 20;
          }
          if (!free(x, z, r * 1.25)) continue;
          taken.push([x, z, r * 1.15]);
          fn(x, z, r);
          made++;
        }
      };
      const eye = cls => (x, z, r) => {
        const i = this.eyes.length;
        this.eyes.push({
          kind: 'eye',
          fixed: true,
          fixedNote: '땅에 박혀 있습니다.',
          label: '',
          i,
          cls,
          c: CLS[cls],
          x,
          z,
          r,
          h: this.height(x, z),
          rise: r * (0.12 + rng() * 0.22),
          p: [x, this.height(x, z) + r * 0.2, z],
          radius: r,
          alive: true,
          burst: false,
          yaw: rng() * TAU,
          pitch: 0,
          open: 1,
          close: 0,
          blink: 1 + rng() * 12,
          dil: 0.4,
          iris: rgb(IRIS[(rng() * IRIS.length) | 0]),
          seed: rng() * 40,
          sacc: 0,
          offY: 0,
          offP: 0,
          hp: CLS[cls].hp,
        });
      };
      const tentacle = cls => (x, z) => {
        const c = TCLS[cls],
          len = c.len[0] + rng() * (c.len[1] - c.len[0]);
        this.tentacles.push({
          kind: 'tentacle',
          fixed: true,
          fixedNote: '땅에 박혀 있습니다.',
          label: '',
          i: this.tentacles.length,
          cls,
          c,
          x,
          z,
          h: this.height(x, z),
          n: c.n,
          len,
          seg: len / c.n,
          r0: c.r0[0] + rng() * (c.r0[1] - c.r0[0]),
          phase: rng() * TAU,
          freq: c.freq * (0.8 + rng() * 0.4),
          amp: c.amp * (0.8 + rng() * 0.5),
          tilt: (rng() - 0.5) * 0.3,
          curl: c.curl[0] + rng() * (c.curl[1] - c.curl[0]),
          yaw: rng() * TAU,
          lean: 0,
          recoil: 0,
          hurt: 0,
          cut: c.n,
          hp: c.hp,
          maxHp: c.hp,
          hitSeg: 0,
          alive: true,
          p: [x, 0, z],
          mids: new Float32Array(c.n * 3),
          tone: 0.85 + rng() * 0.3,
        });
      };
      const pore = (x, z, r) => this.pores.push({ x, z, r, h: this.height(x, z), phase: rng() * TAU, gone: false });
      place(4, 230, 470, 10, 15, eye('giant'));
      place(44, 45, 440, 3.5, 7, eye('large'));
      place(9, 80, 420, 6, 13, pore);
      place(8, 150, 480, 7, 9, tentacle('giant'));
      const bigEyes = this.eyes.slice();
      place(100, 35, 460, 1.8, 2.6, tentacle('medium'), bigEyes);
      place(200, 25, 450, 1.2, 2.6, eye('medium'), bigEyes);
      // frog-spawn clusters of small eyes
      for (let k = 0; k < 60; k++) {
        const a = rng() * TAU,
          d = 30 + Math.sqrt(rng()) * 400,
          cx = Math.sin(a) * d,
          cz = Math.cos(a) * d - 20;
        const n = 7 + ((rng() * 5) | 0);
        for (let j = 0; j < n; j++) {
          const r = 0.35 + rng() * 0.55,
            b = rng() * TAU,
            q = rng() * 4.5,
            x = cx + Math.sin(b) * q,
            z = cz + Math.cos(b) * q;
          if (!free(x, z, r)) continue;
          taken.push([x, z, r * 1.05]);
          eye('small')(x, z, r);
        }
      }
      // the first thing seen on landing: small clusters just ahead of the landing point, all turning at once
      for (let k = 0; k < 9; k++) {
        const a = -1.2 + (k / 8) * 2.4 + (rng() - 0.5) * 0.25,
          d = 38 + rng() * 55,
          cx = spawn[0] + Math.sin(a) * d,
          cz = spawn[2] - Math.cos(a) * d,
          worms = k % 3 === 1,
          n = worms ? 6 + ((rng() * 4) | 0) : 5 + ((rng() * 5) | 0);
        for (let j = 0; j < n; j++) {
          const b = rng() * TAU,
            q = 0.8 + rng() * 4,
            r = 0.4 + rng() * 0.6,
            x = cx + Math.sin(b) * q,
            z = cz + Math.cos(b) * q;
          if (!free(x, z, worms ? 0.5 : r)) continue;
          taken.push([x, z, worms ? 0.55 : r * 1.05]);
          if (worms) tentacle('small')(x, z);
          else eye('small')(x, z, r);
        }
      }
      place(60, 20, 470, 0.25, 0.4, tentacle('small'), this.eyes.filter(e => e.cls === 'large' || e.cls === 'giant').concat(this.pores));
      // patches of small ones swaying together, like a field of worms
      for (let k = 0; k < 34; k++) {
        const a = rng() * TAU,
          d = 35 + Math.pow(rng(), 0.75) * 380,
          cx = Math.sin(a) * d,
          cz = Math.cos(a) * d - 20,
          n = 7 + ((rng() * 6) | 0);
        for (let j = 0; j < n; j++) {
          const b = rng() * TAU,
            q = 1 + rng() * 5.5,
            x = cx + Math.sin(b) * q,
            z = cz + Math.cos(b) * q;
          if (!free(x, z, 0.5)) continue;
          taken.push([x, z, 0.55]);
          tentacle('small')(x, z);
        }
      }
      // the body goes on past where it was first looked at: more of it, watching, further out
      // (its own random stream, after everything above, so the numbering of what was there before is kept)
      {
        const r2 = M.rand(70077),
          far = (x, z, r) => {
            const R = Math.hypot(x, z);
            if (R < 620 || R > 1550) return false;
            for (const t of taken) if (Math.hypot(x - t[0], z - t[1]) < t[2] + r) return false;
            return true;
          };
        const scatter = (n, r0, r1, fn, around = null) => {
          let made = 0;
          for (let k = 0; made < n && k < n * 50; k++) {
            const r = r0 + r2() * (r1 - r0);
            let x, z;
            if (around && around.length && r2() < 0.55) {
              const o = around[(r2() * around.length) | 0],
                a = r2() * TAU,
                d = o.r * 1.6 + 2 + r2() * 14;
              x = o.x + Math.sin(a) * d;
              z = o.z + Math.cos(a) * d;
            } else {
              const a = r2() * TAU,
                d = 640 + Math.sqrt(r2()) * 900;
              x = Math.sin(a) * d;
              z = Math.cos(a) * d;
            }
            if (!far(x, z, r * 1.25)) continue;
            taken.push([x, z, r * 1.15]);
            fn(x, z, r);
            made++;
          }
        };
        const outer = () => this.eyes.filter(e => (e.cls === 'large' || e.cls === 'giant') && Math.hypot(e.x, e.z) > 620);
        scatter(9, 11, 16, eye('giant'));
        scatter(90, 3.5, 7, eye('large'));
        scatter(16, 6, 13, pore);
        scatter(14, 7, 9, tentacle('giant'));
        scatter(170, 1.8, 2.6, tentacle('medium'), outer());
        scatter(320, 1.2, 2.6, eye('medium'), outer());
        for (let k = 0; k < 110; k++) {
          const a = r2() * TAU,
            d = 650 + Math.sqrt(r2()) * 880,
            cx = Math.sin(a) * d,
            cz = Math.cos(a) * d,
            worms = k % 2 === 1,
            n = 6 + ((r2() * 6) | 0);
          for (let j = 0; j < n; j++) {
            const b = r2() * TAU,
              q = 0.8 + r2() * 5,
              r = 0.35 + r2() * 0.6,
              x = cx + Math.sin(b) * q,
              z = cz + Math.cos(b) * q;
            if (!far(x, z, worms ? 0.5 : r)) continue;
            taken.push([x, z, worms ? 0.55 : r * 1.05]);
            if (worms) tentacle('small')(x, z);
            else eye('small')(x, z, r);
          }
        }
      }
      // what the missiles opened took whatever stood there; what the beam burst stays burst
      const inCrater = (x, z) => this.craters.some(c => Math.hypot(x - c.x, z - c.z) < c.r * 0.95);
      for (const e of this.eyes)
        if (this.burstSaved.has(e.i) || inCrater(e.x, e.z)) {
          e.burst = true;
          e.alive = false;
          e.close = 0;
          this.addPool(e.x, e.z, e.r * 1.4);
        }
      for (const t of this.tentacles) {
        const saved = this.cutSaved.get(t.i);
        if (inCrater(t.x, t.z)) t.cut = 1;
        else if (saved != null && saved >= 1 && saved < t.n) {
          this.addPiece(t, saved, t.n, null);
          t.cut = saved;
          t.hurt = 0.4;
        }
      }
      for (const p of this.pores) p.gone = inCrater(p.x, p.z);
      // instanced stores, drawn with the scene and freed with it
      const all = this.residents.all,
        make = (geo, opts = {}) => {
          const b = this.game.engine.makeBatch(geo, { capacity: 256, ...opts });
          all.push(b);
          return b;
        };
      this.store = {};
      for (const g of ['midSphere', 'sphere', 'lowSphere', 'tinySphere', 'torus', 'lowTorus', 'taper', 'lowCone', 'lowDisc'])
        this.store[g] = make(g);
      this.wet = make('lowDisc', { transparent: true, capacity: 128 });
      // settle positions once so the first frame's aim and collisions see the real shapes
      this.updateEyes(0, spawn, false);
      this.updateTentacles(0, spawn, 0);
    }
    /* ---------- marks it keeps ---------- */
    mark(x, z, r, yaw = 0) {
      // a flat mark lying on the local slope, turned by yaw
      const e = 1.5,
        gx = (this.height(x + e, z) - this.height(x - e, z)) / (2 * e),
        gz = (this.height(x, z + e) - this.height(x, z - e)) / (2 * e),
        l = Math.hypot(gx, 1, gz),
        nx = -gx / l,
        nz = -gz / l,
        c = Math.cos(yaw),
        sn = Math.sin(yaw),
        lx = nx * c - nz * sn,
        lz = nx * sn + nz * c;
      return { x, z, r, yaw, h: this.height(x, z), rz: -Math.asin(M.clamp(lx, -1, 1)), rx: Math.atan2(lz, 1 / l) };
    }
    addPool(x, z, r) {
      this.marks.push(this.mark(x, z, r));
    }
    addScar(x, z, old = false, yaw = Math.random() * TAU) {
      const s = this.mark(x, z, 0.7 + Math.random() * 0.4, yaw);
      s.born = old ? -100 : this.time;
      this.scarList ||= [];
      this.scarList.push(s);
      if (this.scarList.length > 112) this.scarList.shift();
    }
    addPiece(t, k, end, at) {
      // the part above the cut falls and lies beside the stump
      const a = t.yaw + 0.9 + (((t.i * 37) % 10) / 10) * 1.6,
        x = t.x + Math.sin(a) * t.seg * 1.5,
        z = t.z + Math.cos(a) * t.seg * 1.5;
      this.pieces.push({
        t,
        k,
        n: end - k,
        x,
        z,
        yaw: a,
        born: at ? this.time : -100,
        y0: at ? at[1] : 0,
        x0: at ? at[0] : x,
        z0: at ? at[2] : z,
      });
    }
    hurt(x, z, amount, groan = true) {
      this.pain = Math.min(1, this.pain + amount);
      this.jolt = Math.min(0.35, this.jolt + amount * 0.3);
      if (this.vehicle) this.vehicle.shake = Math.max(this.vehicle.shake, amount * 0.9);
      for (const e of this.eyes)
        if (!e.burst && Math.hypot(e.x - x, e.z - z) < 150) e.close = Math.max(e.close, 0.5 + Math.random() * 0.9);
      if (Math.hypot(EYE[0] - x, EYE[1] - z) < 200 && this.vehicle?.grab !== this.ruler)
        this.mainEye.close = Math.max(this.mainEye.close, 0.7);
      for (const t of this.tentacles) if (Math.hypot(t.x - x, t.z - z) < 90) t.recoil = Math.max(t.recoil, 0.8);
      if (groan) this.game.audio.groan(0.5 + amount, this.where(x, this.height(x, z), z)[0]);
    }
    where(x, y, z) {
      const cam = this.game.engine.camera,
        r = M.right(cam.yaw),
        dx = x - cam.p[0],
        dy = y - cam.p[1],
        dz = z - cam.p[2],
        d = Math.hypot(dx, dy, dz) || 1;
      return [((dx * r[0] + dz * r[2]) / d) * 0.85, Math.pow(Math.max(0, 1 - d / 260), 1.4)];
    }
    burstEye(e) {
      if (e.burst) return;
      e.burst = true;
      e.alive = false;
      const y = e.p[1];
      this.emit([e.x, y + e.r * 0.4, e.z], Math.min(26, 6 + e.r * 3), JELLY, 8 + e.r * 2, 1.6);
      this.emit([e.x, y + e.r * 0.3, e.z], Math.min(18, 4 + e.r * 2), RAW, 7 + e.r * 1.5, 1.4);
      this.addPool(e.x, e.z, e.r * 1.4);
      const [pan, gain] = this.where(e.x, y, e.z);
      this.game.audio.squelch('pop', pan, Math.min(1, gain * (0.7 + e.r * 0.1)));
      this.hurt(e.x, e.z, e.cls === 'small' ? 0.05 : e.cls === 'medium' ? 0.15 : e.cls === 'large' ? 0.4 : 0.8, e.r > 1.5);
      if (e.r > 2) this.drips.push({ x: e.x, y, z: e.z, until: this.time + 25, next: 0 });
      if (this.vehicle?.grab === e) this.vehicle.release();
    }
    cutTentacle(t, k) {
      if (t.cut <= 1) return;
      k = M.clamp(k, 1, t.cut - 1);
      const m = t.mids,
        at = [m[k * 3], m[k * 3 + 1] - t.seg * 0.5, m[k * 3 + 2]];
      this.addPiece(t, k, t.cut, at);
      t.cut = k;
      t.hp = t.maxHp * 0.6;
      t.hurt = 1;
      t.recoil = 1;
      this.emit(at, t.cls === 'giant' ? 24 : 9, RAW, 9, 1.6);
      this.emit(at, 6, '#3d0710', 6, 1.2);
      const [pan, gain] = this.where(at[0], at[1], at[2]);
      this.game.audio.squelch('slice', pan, gain);
      this.hurt(t.x, t.z, t.cls === 'giant' ? 0.75 : t.cls === 'medium' ? 0.3 : 0.06, t.cls !== 'small');
      this.drips.push({ t, until: this.time + (t.cls === 'small' ? 6 : 30), next: 0 });
    }
    /* ---------- weapons against it ---------- */
    groundHit(origin, dir, max) {
      if (dir[1] > 0.25) return Infinity;
      const step = 2.5;
      if (origin[1] - this.ground(origin[0], origin[2]) < 0) return 0;
      for (let t = step; t <= max; t += step) {
        if (origin[1] + dir[1] * t - this.ground(origin[0] + dir[0] * t, origin[2] + dir[2] * t) >= 0) continue;
        let a = t - step,
          b = t;
        for (let k = 0; k < 7; k++) {
          const m = (a + b) / 2;
          if (origin[1] + dir[1] * m - this.ground(origin[0] + dir[0] * m, origin[2] + dir[2] * m) < 0) b = m;
          else a = m;
        }
        return b;
      }
      return Infinity;
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
      for (const e of this.eyes) {
        if (e.burst) continue;
        const d = hit(e.x, e.p[1], e.z, Math.max(e.r, 0.7));
        if (d < dist) {
          dist = d;
          best = e;
        }
      }
      for (const t of this.tentacles) {
        const reach = t.seg * t.cut;
        if (hit(t.x, t.p[1] + reach * 0.5, t.z, reach * 0.75 + t.r0 + 2) === Infinity) continue;
        for (let i = 0; i < t.cut; i++) {
          const rr = Math.max(t.r0 * (1 - (0.82 * i) / t.n) * 1.4, 0.7),
            d = hit(t.mids[i * 3], t.mids[i * 3 + 1], t.mids[i * 3 + 2], rr);
          if (d < dist) {
            dist = d;
            best = t;
            t.hitSeg = i;
          }
        }
      }
      const g = this.groundHit(origin, dir, dist);
      if (g < dist) {
        dist = g;
        best = this.skin;
        this.skin.p = M.add(origin, M.mul(dir, g));
      }
      return best ? { entity: best, distance: dist, point: M.add(origin, M.mul(dir, dist)) } : null;
    }
    damage(e, amount, dir, source) {
      if (!Number.isFinite(amount) || amount <= 0) return;
      if (e?.kind === 'eye') {
        if (e.burst) return;
        e.close = Math.max(e.close, 0.6);
        e.hp -= amount;
        if (e.hp <= 0) this.burstEye(e);
        return;
      }
      if (e?.kind === 'tentacle') {
        e.recoil = 1;
        e.hurt = Math.max(e.hurt, 0.5);
        e.hp -= amount;
        if (e.hp <= 0) this.cutTentacle(e, Math.max(1, e.hitSeg));
        return;
      }
      if (e?.kind === 'skin') {
        // the beam sears; the skin shivers and the nearest eyes shut
        const p = e.p;
        this.pain = Math.min(1, this.pain + amount * 0.0016);
        this.jolt = Math.min(0.2, this.jolt + amount * 0.0008);
        for (const o of this.eyes)
          if (!o.burst && Math.abs(o.x - p[0]) < 45 && Math.abs(o.z - p[2]) < 45) o.close = Math.max(o.close, 0.25);
        for (const t of this.tentacles)
          if (Math.abs(t.x - p[0]) < 30 && Math.abs(t.z - p[2]) < 30) t.recoil = Math.max(t.recoil, 0.6);
        if (source === 'beam') {
          this.scarClock += amount;
          const last = this.lastScar;
          if (this.scarClock > 9 && (!last || Math.hypot(last[0] - p[0], last[1] - p[2]) > 1.4)) {
            this.scarClock = 0;
            this.lastScar = [p[0], p[2]];
            this.addScar(p[0], p[2], false, last ? Math.atan2(p[0] - last[0], p[2] - last[1]) : Math.random() * TAU);
            if (Math.random() < 0.3) this.emit(p, 2, RAW, 5, 1);
          }
          if (Math.random() < amount * 0.012) this.hurt(p[0], p[2], 0.08, true);
        }
        return;
      }
      if (e === this.ruler && !this.ruler.captured) {
        // the great eye cannot be burst; it shuts, and the ground shudders
        this.mainEye.close = Math.max(this.mainEye.close, 0.9);
        if (source !== 'beam' || Math.random() < 0.05) this.hurt(EYE[0], EYE[1], source === 'beam' ? 0.12 : 0.3);
        return;
      }
      super.damage(e, amount, dir, source);
    }
    shock(p, radius, force, opts) {
      super.shock(p, radius, force, opts);
      let hurtAmt = 0;
      for (const e of this.eyes) {
        if (e.burst) continue;
        const d = Math.hypot(e.x - p[0], e.p[1] - p[1], e.z - p[2]);
        if (d > radius + e.r) continue;
        if (e.r < 2.7 && d < radius * 0.6) this.burstEye(e);
        else {
          e.close = Math.max(e.close, 1.2);
          hurtAmt += 0.04;
        }
      }
      for (const t of this.tentacles) {
        const d = Math.hypot(t.x - p[0], t.z - p[2]);
        if (d > radius + t.len * 0.5) continue;
        t.recoil = 1;
        if (t.cls === 'small' && d < radius * 0.45 && t.cut > 1) this.cutTentacle(t, 1);
      }
      const alt = p[1] - this.ground(p[0], p[2]);
      if (alt < radius) hurtAmt += 0.22 * (1 - Math.max(0, alt) / radius);
      if (hurtAmt) this.hurt(p[0], p[2], Math.min(0.5, hurtAmt), true);
    }
    collide(ship, dt) {
      super.collide(ship, dt);
      const speed = M.len(ship.velocity);
      const push = (cx, cy, cz, lim) => {
        const dx = ship.p[0] - cx,
          dy = ship.p[1] - cy,
          dz = ship.p[2] - cz,
          d = Math.hypot(dx, dy, dz);
        if (d >= lim) return false;
        const n = [dx / (d || 1), dy / (d || 1), dz / (d || 1)];
        ship.p = [cx + n[0] * lim, cy + n[1] * lim, cz + n[2] * lim];
        const vn = ship.velocity[0] * n[0] + ship.velocity[1] * n[1] + ship.velocity[2] * n[2];
        if (vn < 0) ship.velocity = ship.velocity.map((v, k) => (v - vn * n[k] * 1.6) * 0.6);
        return true;
      };
      const ram = speed > 18 && ship.hitCooldown <= 0;
      const struck = () => {
        ship.hitCooldown = 0.3;
        ship.shake = 0.7;
        this.game.audio.impact(0.9);
      };
      for (const e of this.eyes) {
        if (e.burst || Math.abs(ship.p[0] - e.x) > e.r + 4 || Math.abs(ship.p[2] - e.z) > e.r + 4) continue;
        if (e.r <= 1.2) {
          if (speed > 10 && Math.hypot(ship.p[0] - e.x, ship.p[2] - e.z) < 3.2 && ship.p[1] - e.p[1] < 4) this.burstEye(e);
          continue;
        }
        if (push(e.x, e.p[1], e.z, e.r + 2.6) && ram) {
          struck();
          if (e.cls !== 'giant' || speed > 45) this.burstEye(e);
          else e.close = Math.max(e.close, 1.5);
        }
      }
      for (const t of this.tentacles) {
        if (t.cls === 'small' || Math.hypot(ship.p[0] - t.x, ship.p[2] - t.z) > t.seg * t.cut + 8) continue;
        for (let i = 0; i < t.cut; i++) {
          const rr = t.r0 * (1 - (0.82 * i) / t.n) * 1.2;
          if (!push(t.mids[i * 3], t.mids[i * 3 + 1], t.mids[i * 3 + 2], rr + 2.6)) continue;
          t.recoil = 1;
          if (ram) {
            struck();
            t.hitSeg = i;
            this.damage(t, speed * 2.4, M.norm(ship.velocity), 'ram');
          }
          break;
        }
      }
      if (!this.ruler.captured) push(EYE[0], this.ruler.p[1], EYE[1], EYE_R + 2.6);
    }
    /* ---------- life ---------- */
    updateWorld(dt) {
      const ship = this.vehicle.p,
        engine = this.game.engine,
        pulling = this.vehicle.grab === this.ruler,
        tension = pulling ? Math.min(1, this.vehicle.tension / 1.8) : 0;
      this.pain = Math.max(0, this.pain - dt * 0.1);
      this.jolt = Math.max(0, this.jolt - dt * 0.45);
      if (pulling) {
        const v = this.vehicle,
          d = M.sub(v.p, this.ruler.p),
          len = M.len(d) || 1,
          stretch = Math.max(0, len - v.grabStart);
        v.tension = Math.min(v.tension, (this.pullTension ?? 0) + dt * 0.36);
        const k = (Math.min(stretch, 60) * 0.42 * dt) / len;
        v.velocity = v.velocity.map((x, i) => x - d[i] * k);
      }
      this.pullTension = pulling ? this.vehicle.tension : 0;
      const stress = Math.max(this.pain, tension);
      this.breathRate = 0.84 * (1 + stress * 0.9);
      this.breathPh += dt * this.breathRate;
      this.beatPh += dt * 0.93 * (1 + stress * 1.3 + (this.ruler.captured ? 0.18 : 0));
      this.quake = M.damp(this.quake, tension > 0.2 ? 0.05 + tension * 0.2 : 0, 3, dt);
      engine.life[0] = this.breathPh;
      engine.life[1] = this.beatPh;
      engine.life[2] = 0.18 + stress * 0.34;
      engine.life[3] = this.quake + this.jolt * 0.6;
      if (tension > 0.2) this.vehicle.shake = Math.max(this.vehicle.shake, tension * 0.5);
      // the missile wounds, drawn as raw open ground
      engine.wounds.fill(0);
      this.craters.slice(0, 12).forEach((c, i) => engine.wounds.set([c.x, c.z, c.r, c.depth], i * 4));
      // one heart, one breath, and what moves inside
      const beat = Math.floor(this.beatPh);
      if (beat !== this.lastBeat) {
        this.lastBeat = beat;
        this.game.audio.heartbeat(0.5 + stress * 0.8);
      }
      const half = Math.floor((this.breathPh + Math.PI / 2) / Math.PI);
      if (half !== this.lastBreath) {
        this.lastBreath = half;
        const inhale = half % 2 === 0;
        this.game.audio.breath(inhale, Math.PI / this.breathRate, 0.8 + stress * 0.6);
        if (!inhale) this.exhale();
      }
      this.gurgle -= dt;
      if (this.gurgle <= 0) {
        this.gurgle = 5 + Math.random() * 9;
        this.game.audio.squelch('gurgle', Math.random() * 1.4 - 0.7, 0.55 + stress * 0.4);
      }
      if (pulling && Math.random() < dt * (0.4 + tension * 1.4)) this.hurt(EYE[0], EYE[1], 0.06 + tension * 0.1);
      this.updateMainEye(dt, ship, pulling);
      if (this.ruler.captured && this.vehicle.rig.carry.visible)
        for (const c of this.vehicle.rig.carry.children) c.tick?.(dt, engine.camera.p);
      for (const g in this.store) this.store[g].count = 0;
      this.wet.count = 0;
      this.updateEyes(dt, ship, pulling);
      this.updateTentacles(dt, ship, stress);
      this.drawPieces();
      this.drawPores();
      this.drawMarks();
      this.updateDrips(dt);
      this.updateMists(dt);
    }
    updateMainEye(dt, ship, pulling) {
      const r = this.ruler,
        m = this.mainEye,
        base = r.node,
        head = r.head;
      base.p[1] = this.ground(EYE[0], EYE[1]);
      r.p[1] = base.p[1] + head.p[1];
      if (r.captured) {
        if (!this.snapped) {
          this.snapped = true;
          this.snapTime = this.time;
          this.hurt(EYE[0], EYE[1], 1);
          this.jolt = 0.35;
          const top = [EYE[0], base.p[1] + EYE_R * 0.4, EYE[1]];
          this.emit(top, 30, RAW, 16, 2.4);
          this.emit(top, 12, '#3d0710', 10, 2);
          const [pan, gain] = this.where(top[0], top[1], top[2]);
          this.game.audio.squelch('tear', pan, Math.max(0.6, gain));
          for (const e of this.eyes) e.close = Math.max(e.close, 2.2 + Math.random());
          this.drips.push({ x: EYE[0], y: base.p[1] + 2, z: EYE[1], until: this.time + 60, next: 0, big: true });
        }
        // what is left of the nerve still moves
        this.socketPool.visible = true;
        const sway = Math.max(0.15, Math.exp(-(this.time - (this.snapTime ?? -100)) / 9));
        this.nerve.s = [EYE_R * 0.3, EYE_R * 0.42, EYE_R * 0.3];
        this.nerve.p = [0, EYE_R * 0.12, 0];
        this.nerve.r = [Math.sin(this.time * 2.1) * 0.3 * sway, 0, Math.cos(this.time * 1.7) * 0.3 * sway];
        this.stumpTop.visible = true;
        this.stumpTop.p = [Math.sin(this.nerve.r[2]) * -EYE_R * 0.42, EYE_R * 0.33, Math.sin(this.nerve.r[0]) * EYE_R * 0.42];
        this.stumpTop.r = [this.nerve.r[0], 0, this.nerve.r[2]];
        this.vessels.forEach((v, k) => {
          const side = k ? -1 : 1;
          v.s = [EYE_R * 0.05, EYE_R * 0.55, EYE_R * 0.05];
          v.p = [side * EYE_R * 0.42, EYE_R * 0.04, EYE_R * 0.12 * side];
          v.r = [Math.sin(this.time * (2.4 + k) + k) * 0.08 * sway, side * 0.35, side * -(1.5 + Math.sin(this.time * 1.9 + k) * 0.05 * sway)];
        });
        return;
      }
      if (!pulling) head.p[1] = M.damp(head.p[1], r.headRestY, 1.4, dt);
      const hy = base.p[1] + head.p[1],
        dx = ship[0] - EYE[0],
        dy = ship[1] - hy,
        dz = ship[2] - EYE[1],
        dist = Math.hypot(dx, dy, dz);
      const k = Math.min(1, dt * (pulling ? 2.2 : 0.9));
      m.yaw += M.angle(m.yaw, Math.atan2(dx, dz)) * k;
      m.pitch += (-M.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.3, 1.2) - m.pitch) * k;
      head.r[0] = m.pitch;
      head.r[1] = m.yaw;
      m.blink -= dt;
      if (m.blink <= 0 && !pulling) {
        m.blink = 10 + Math.random() * 12;
        m.close = 0.3;
      }
      m.close = Math.max(0, m.close - dt);
      const want = m.close > 0 ? 0 : pulling ? 1 : dist < 40 ? 0.55 : 1;
      m.open = M.damp(m.open, want, m.close > 0 ? 16 : 5, dt);
      m.dil = M.damp(m.dil, pulling ? 0.95 : M.clamp(1 - dist / 260, 0.15, 0.85), 2, dt);
      this.mainBall.em = m.open;
      this.mainBall.detail = m.dil;
      // the optic nerve and its vessels stretch as the eye comes out
      const lift = Math.max(0, head.p[1] - r.headRestY),
        top = head.p[1] - EYE_R * 0.75,
        bottom = -EYE_R * 0.75,
        len = Math.max(0.5, top - bottom),
        thin = 1 - Math.min(0.55, lift / 45);
      this.nerve.p = [0, (top + bottom) / 2, 0];
      this.nerve.s = [EYE_R * 0.4 * thin, len, EYE_R * 0.4 * thin];
      this.nerve.r = [0, 0, Math.sin(this.time * 31) * 0.01 * Math.min(1, lift / 10)];
      this.vessels.forEach((v, k) => {
        const side = k ? -1 : 1,
          ox = side * EYE_R * 0.2 * thin;
        v.p = [ox, (top + bottom) / 2, EYE_R * 0.08];
        v.s = [EYE_R * 0.07 * thin, len * 1.01, EYE_R * 0.07 * thin];
        v.r = [0, 0, side * Math.min(0.12, lift * 0.004)];
      });
    }
    updateEyes(dt, ship, pulling) {
      const S = this.store,
        cam = this.game.engine.camera.p,
        lod = this.game.settings.quality === 'low' ? 0.6 : 1;
      for (const e of this.eyes) {
        const far = Math.hypot(e.x - cam[0], e.z - cam[2]);
        if (e.burst) {
          if (far > e.c.far * lod) continue;
          const gy = e.h + this.swell(e.x, e.z);
          this.inst(S.lowSphere, e.x, gy + e.r * 0.04, e.z, 0, e.yaw, 0, e.r * 2.1, e.r * 0.5, e.r * 2.1, C.sac, 0, 0, 0, 0);
          if (e.c.rim) this.inst(S[e.cls === 'giant' ? 'torus' : 'lowTorus'], e.x, gy + e.r * 0.05, e.z, 0, 0, 0, e.r * 1.5, e.r * 2.2, e.r * 1.5, C.rim, 0, 0, 0, 0);
          continue;
        }
        e.p[1] = e.h + this.swell(e.x, e.z) + e.rise;
        const dx = ship[0] - e.x,
          dy = ship[1] - e.p[1],
          dz = ship[2] - e.z,
          dist = Math.hypot(dx, dy, dz);
        // they glance away and come back; while the great eye is being pulled, none of them look away
        e.sacc -= dt;
        if (e.sacc <= 0) {
          // a glance away is short; they always come back to the ship
          const away = !pulling && !e.offY && Math.random() < (e.cls === 'small' ? 0.3 : 0.1);
          e.offY = away ? (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9) : 0;
          e.offP = away ? (Math.random() - 0.5) * 0.5 : 0;
          e.sacc = away ? 0.3 + Math.random() * 0.7 : e.cls === 'small' ? 1.2 + Math.random() * 3.5 : 2.5 + Math.random() * 6;
        }
        const k = Math.min(1, dt * e.c.turn * (dist < 120 ? 1.5 : 1));
        e.yaw += M.angle(e.yaw, Math.atan2(dx, dz) + e.offY) * k;
        e.pitch += (-M.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.35, 1.25) + e.offP - e.pitch) * k;
        e.blink -= dt;
        if (e.blink <= 0) {
          e.blink = e.c.blink[0] + Math.random() * (e.c.blink[1] - e.c.blink[0]);
          if (!pulling) e.close = Math.max(e.close, 0.22);
        }
        e.close = Math.max(0, e.close - dt);
        const squint = dist < e.r * 2 + 10 ? 0.45 : 1;
        e.open = M.damp(e.open, e.close > 0 ? 0 : squint, e.close > 0 ? 20 : 6, dt);
        e.dil = M.damp(e.dil, M.clamp(1 - dist / 240, 0.15, 0.9) + this.pain * 0.2, 2, dt);
        if (far > e.c.far * lod) continue;
        const geo = far > 300 && e.c.geo === 'midSphere' ? 'sphere' : e.cls === 'small' && far > 90 ? 'tinySphere' : e.c.geo;
        this.inst(S[geo], e.x, e.p[1], e.z, e.pitch, e.yaw, 0, e.r * 2, e.r * 2, e.r * 2, e.iris, e.open, 20, e.dil, e.seed);
        if (e.c.rim)
          this.inst(S[e.cls === 'giant' ? 'torus' : 'lowTorus'], e.x, e.p[1] - e.rise + e.r * 0.05, e.z, 0, 0, 0, e.r * 1.5, e.r * 2.2, e.r * 1.5, C.rim, 0, 0, 0, 0);
        else if (e.cls === 'medium' && far < 300)
          this.inst(S.lowDisc, e.x, e.p[1] - e.rise + 0.06, e.z, 0, 0, 0, e.r * 2.5, 0.12, e.r * 2.5, C.socket, 0, 0, 0, 0);
      }
    }
    updateTentacles(dt, ship, stress) {
      const S = this.store,
        cam = this.game.engine.camera.p,
        t0 = this.time;
      for (const t of this.tentacles) {
        const gy = t.h + this.swell(t.x, t.z);
        t.p[1] = gy;
        const dx = ship[0] - t.x,
          dz = ship[2] - t.z,
          hd = Math.hypot(dx, dz),
          reach = t.len * t.c.reach;
        // lean toward the ship, never onto it
        let want = hd < reach ? (1 - hd / reach) * 1.15 : 0;
        if (want > 0) t.yaw += M.angle(t.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 0.9);
        else t.yaw += dt * 0.05 * Math.sin(t.phase);
        t.recoil = Math.max(0, t.recoil - dt * 0.7);
        t.hurt = Math.max(0, t.hurt - dt * 0.04);
        want = want * (1 - t.recoil) - t.recoil * 0.7;
        t.lean = M.damp(t.lean, want, 2.2, dt);
        const far = Math.hypot(t.x - cam[0], t.z - cam[2]),
          draw = far < t.c.far * (this.game.settings.quality === 'low' ? 0.6 : 1);
        if (!draw && far > 260) continue; // out of sight and out of reach: nothing to pose
        const n = t.cut,
          seg = t.seg,
          leanSeg = t.lean / t.n,
          amp = t.amp * (1 + stress * 1.6 + t.hurt * 2),
          ft = t0 * t.freq * (1 + stress * 0.8 + t.hurt),
          curl = (t.curl * (0.8 + 0.28 * Math.sin(t0 * t.freq * 0.45 + t.phase * 2.3)) * 2) / (t.n * t.n);
        if (draw && t.cls !== 'small')
          this.inst(S.lowSphere, t.x, gy - t.r0 * 0.2, t.z, 0, t.yaw, 0, t.r0 * 3.3, t.r0 * 1.25, t.r0 * 3.3, C.root, 0, 0, 0, 0);
        trs(A, 0, t.x, gy - t.r0 * 0.3, t.z, t.tilt, t.yaw, 0, 1, 1, 1);
        const joints = far < t.c.joint;
        for (let i = 0; i < n; i++) {
          const w = (i + 1) / t.n,
            ax = amp * Math.sin(ft + t.phase - i * 0.6) * w + leanSeg + curl * (i + 1),
            az =
              amp * 0.65 * Math.cos(ft * 0.8 + t.phase * 1.7 - i * 0.5) * w +
              (t.hurt > 0.5 ? Math.sin(t0 * 31 + i) * 0.05 : 0);
          trs(T, 0, 0, i ? seg : 0, 0, ax, 0, az, 1, 1, 1);
          mul(Bm, 0, A, 0, T, 0);
          A.set(Bm);
          t.mids[i * 3] = A[12] + A[4] * seg * 0.5;
          t.mids[i * 3 + 1] = A[13] + A[5] * seg * 0.5;
          t.mids[i * 3 + 2] = A[14] + A[6] * seg * 0.5;
          if (draw) this.segment(t, i, A, seg, 1, joints, far);
        }
        // a raw end where it was cut
        if (n < t.n && draw) {
          trs(T, 0, 0, seg, 0, 0, 0, 0, t.r0 * (1 - (0.82 * (n - 1)) / t.n) * 1.65, 0.25, t.r0 * (1 - (0.82 * (n - 1)) / t.n) * 1.65);
          this.instM(S.lowDisc, A, T, C.raw, 0.15);
        }
        // the tip keeps its distance from the ship
        const tx = A[12] + A[4] * seg,
          ty = A[13] + A[5] * seg,
          tz = A[14] + A[6] * seg;
        if (Math.hypot(tx - ship[0], ty - ship[1], tz - ship[2]) < t.c.keep) t.recoil = Math.max(t.recoil, 0.55);
      }
    }
    segment(t, i, P, seg, shade, joints = true, far = 0) {
      const S = this.store,
        ri = t.r0 * (1 - (0.82 * i) / t.n),
        f = i / t.n,
        last = i === t.n - 1;
      COL[0] = (C.base[0] + (C.tip[0] - C.base[0]) * f) * t.tone * shade;
      COL[1] = (C.base[1] + (C.tip[1] - C.base[1]) * f) * t.tone * shade;
      COL[2] = (C.base[2] + (C.tip[2] - C.base[2]) * f) * t.tone * shade;
      trs(T, 0, 0, seg * (last ? 0.62 : 0.5), 0, 0, 0, 0, ri * 2, seg * (last ? 1.25 : 1), ri * 2);
      this.instM(last ? S.lowCone : S.taper, P, T, COL, 0);
      if (joints) {
        trs(T, 0, 0, 0, 0, 0, 0, 0, ri * 2.05, ri * 2.05, ri * 2.05);
        this.instM(t.cls === 'giant' ? S.lowSphere : S.tinySphere, P, T, COL, 0);
      }
      if (!last && ((t.cls === 'giant' && far < 360) || (t.cls === 'medium' && i % 2 === 0 && far < 110)))
        for (const side of t.cls === 'giant' ? [-0.42, 0.42] : [0]) {
          trs(T, 0, ri * side, seg * 0.5, ri * 0.86, 0, 0, 0, ri * 0.5, ri * 0.5, ri * 0.28);
          this.instM(S.tinySphere, P, T, C.sucker, 0);
        }
    }
    drawPieces() {
      const cam = this.game.engine.camera.p;
      for (const p of this.pieces) {
        const t = p.t;
        if (Math.hypot(p.x - cam[0], p.z - cam[2]) > t.c.far) continue;
        const age = this.time - p.born,
          fall = M.clamp(age / 0.55, 0, 1),
          twitch = age < 40 ? Math.exp(-age / 7) : 0,
          r0 = t.r0 * (1 - (0.82 * p.k) / t.n),
          gx = p.x0 + (p.x - p.x0) * fall,
          gz = p.z0 + (p.z - p.z0) * fall,
          gy = this.ground(gx, gz) + r0 * 0.8,
          y = p.born < 0 ? gy : p.y0 + (gy - p.y0) * fall * fall;
        trs(A, 0, gx, y, gz, (Math.PI / 2) * fall, p.yaw, 0, 1, 1, 1);
        for (let j = 0; j < p.n; j++) {
          const ax = Math.sin(this.time * 13 + j * 1.1) * 0.06 * twitch,
            az = Math.sin(this.time * 9 + j * 0.9 + t.phase) * 0.32 * twitch + 0.08 * Math.sin(j + t.phase);
          trs(T, 0, 0, j ? t.seg : 0, 0, ax, 0, az, 1, 1, 1);
          mul(Bm, 0, A, 0, T, 0);
          A.set(Bm);
          this.segment(t, p.k + j, A, t.seg, 0.9);
          if (j === 0) {
            trs(T, 0, 0, -0.05, 0, 0, 0, 0, r0 * 1.9, 0.2, r0 * 1.9);
            this.instM(this.store.lowDisc, A, T, C.raw, 0.1);
          }
        }
      }
    }
    exhale() {
      const cam = this.game.engine.camera.p;
      for (const p of this.pores) {
        if (p.gone || Math.hypot(p.x - cam[0], p.z - cam[2]) > 330) continue;
        const y = this.ground(p.x, p.z) + 1;
        for (let k = 0; k < 3; k++) {
          if (this.mists.length > 40) break;
          const s = p.r * (0.45 + Math.random() * 0.25),
            n = mesh(this.fxRoot, 'lowSphere', [p.x + (Math.random() - 0.5) * p.r, y, p.z + (Math.random() - 0.5) * p.r], [s, s, s], '#f6c2b8', {
              alpha: 0,
            });
          this.mists.push({ node: n, t: -k * 0.35, life: 3.4, vy: 2.4 + Math.random() * 1.6, s });
        }
      }
    }
    updateMists(dt) {
      for (let i = this.mists.length - 1; i >= 0; i--) {
        const m = this.mists[i];
        m.t += dt;
        if (m.t < 0) continue;
        if (m.t > m.life) {
          this.fxRoot.remove(m.node);
          this.mists.splice(i, 1);
          continue;
        }
        const k = m.t / m.life,
          s = m.s * (1 + k * 1.6);
        m.node.p[1] += m.vy * dt * (1 - k * 0.6);
        m.node.s = [s, s * 0.8, s];
        m.node.alpha = 0.34 * Math.min(1, m.t / 0.35) * (1 - k);
      }
    }
    drawPores() {
      const S = this.store,
        cam = this.game.engine.camera.p;
      for (const p of this.pores) {
        if (p.gone || Math.hypot(p.x - cam[0], p.z - cam[2]) > 600) continue;
        const gy = p.h + this.swell(p.x, p.z),
          o = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.breathPh + p.phase * 0.2 - Math.PI / 2));
        this.inst(S.torus, p.x, gy + 0.2, p.z, 0, p.phase, 0, p.r * 1.45, p.r * 3.4, p.r * 1.45, C.poreLip, 0, 0, 0, 0);
        this.inst(S.lowSphere, p.x, gy - p.r * 0.05, p.z, 0, 0, 0, p.r * 2.1, p.r * 0.55, p.r * 2.1, C.poreMound, 0, 0, 0, 0);
        this.inst(S.lowDisc, p.x, gy + p.r * 0.21, p.z, 0, 0, 0, p.r * 1.5 * o, 0.2, p.r * 1.5 * o, C.poreHole, 0, 0, 0, 0);
      }
    }
    drawMarks() {
      const W = this.wet,
        cam = this.game.engine.camera.p;
      for (const m of this.marks) {
        if (Math.hypot(m.x - cam[0], m.z - cam[2]) > 520) continue;
        this.inst(W, m.x, m.h + this.swell(m.x, m.z) + 0.3, m.z, m.rx, 0, m.rz, m.r * 2, 0.04, m.r * 2, C.pool, 0.04, 0, 0, 0, 0.82);
      }
      for (const s of this.scarList || []) {
        if (Math.hypot(s.x - cam[0], s.z - cam[2]) > 360) continue;
        const age = this.time - s.born,
          hot = s.born < 0 ? 0 : Math.exp(-age / 1.6);
        COL[0] = C.scar[0] + (C.scarHot[0] - C.scar[0]) * hot;
        COL[1] = C.scar[1] + (C.scarHot[1] - C.scar[1]) * hot;
        COL[2] = C.scar[2] + (C.scarHot[2] - C.scar[2]) * hot;
        // a seared groove: dark and wet, glowing at first, along the direction the beam moved
        this.inst(W, s.x, s.h + this.swell(s.x, s.z) + 0.22, s.z, s.rx, s.yaw, s.rz, s.r * 1.5, 0.04, s.r * 3.4, COL, hot * 1.1, 0, 0, 0, 0.9);
      }
    }
    updateDrips(dt) {
      for (let i = this.drips.length - 1; i >= 0; i--) {
        const d = this.drips[i];
        if (this.time > d.until) {
          this.drips.splice(i, 1);
          continue;
        }
        d.next -= dt;
        if (d.next > 0) continue;
        d.next = d.big ? 0.12 : 0.9 + Math.random() * 1.6;
        const m = d.t?.mids,
          k = d.t ? (d.t.cut - 1) * 3 : 0,
          p = d.t ? [m[k], m[k + 1] + d.t.seg * 0.5, m[k + 2]] : [d.x, d.y, d.z];
        this.emit(p, d.big ? 3 : 1, RAW, d.big ? 7 : 2, 1.2);
        if (!d.big && Math.random() < 0.5) {
          const [pan, gain] = this.where(p[0], p[1], p[2]);
          this.game.audio.squelch('drip', pan, gain * 0.8);
        }
      }
    }
    inst(b, x, y, z, rx, ry, rz, sx, sy, sz, c, em, type, detail, seed, alpha = 1) {
      const d = b.data.length < (b.count + 1) * 24 ? this.game.engine.growBatch(b, b.count + 1) : b.data,
        o = b.count * 24;
      trs(d, o, x, y, z, rx, ry, rz, sx, sy, sz);
      d[o + 16] = c[0];
      d[o + 17] = c[1];
      d[o + 18] = c[2];
      d[o + 19] = alpha;
      d[o + 20] = em;
      d[o + 21] = type;
      d[o + 22] = detail;
      d[o + 23] = seed;
      b.count++;
    }
    instM(b, P, L, c, em) {
      const d = b.data.length < (b.count + 1) * 24 ? this.game.engine.growBatch(b, b.count + 1) : b.data,
        o = b.count * 24;
      mul(d, o, P, 0, L, 0);
      d[o + 16] = c[0];
      d[o + 17] = c[1];
      d[o + 18] = c[2];
      d[o + 19] = 1;
      d[o + 20] = em;
      d[o + 21] = 0;
      d[o + 22] = 0;
      d[o + 23] = 0;
      b.count++;
    }
    // One life on the whole world: the world. Anyone set down here would be counted with it.
    signalValue() {
      return 1;
    }
    tokens() {
      const out = [];
      out.push(...pack('y.e.', this.eyes.filter(e => e.burst && !this.inCrater(e)).map(e => enc2(e.i))));
      out.push(...pack('y.t.', this.tentacles.filter(t => t.cut < t.n && !this.inCrater(t)).map(t => enc2(t.i) + B36[t.cut])));
      const scars = (this.scarList || []).slice(-112),
        near = s => Math.abs(s.x) <= 808 && Math.abs(s.z) <= 808;
      out.push(...pack('y.s.', scars.filter(near).map(s => enc2(qxz(s.x)) + enc2(qxz(s.z)))));
      // the wider ground: scars past 808 m keep three characters a coordinate
      out.push(...pack('y.f.', scars.filter(s => !near(s)).map(s => enc3(qfar(s.x)) + enc3(qfar(s.z)))));
      const st = this.game.save.data.planetStates[ID];
      for (const t of st?.destroyed || []) if (typeof t === 'string' && t.startsWith('y.w.')) out.push(t);
      return out;
    }
    inCrater(o) {
      return this.craters.some(c => Math.hypot(o.x - c.x, o.z - c.z) < c.r * 0.95);
    }
    snapshot() {
      if (this.disposed || !this.eyes) return;
      this.destroyed = new Set([...this.destroyed].filter(t => !t.startsWith('y.')).concat(this.tokens()));
      super.snapshot();
    }
  }
  K.Planets[ID] = Living;
})((window.KO ||= {}));
