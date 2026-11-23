/* @surface {"id":"p0012","name":"NACRE","shortName":"NACRE","description":"결정 도시 · 공명탑을 부수면 이웃 결정이 연쇄 파열합니다.","rulerName":"수정 섭정","trophyNote":"소리는 멎었지만, 결정 내부의 빛은 남아 있다.","species":"nacre"} */
/* NACRE — brittle resonant architecture over a pale mineral basin. */
(function (K) {
  'use strict';
  const { M, mesh, group } = K,
    ID = 'p0012';
  const C = {
    ground: '#7d969e',
    stone: '#bed4d9',
    dark: '#354f69',
    accent: '#9bdded',
    violet: '#8986bb',
    light: '#cdf6fb',
  };
  function head(root) {
    const g = group(root);
    mesh(g, 'hex', [0, 0.08, 0], [1.28, 1.78, 1.13], C.stone).r[1] = Math.PI / 6;
    mesh(g, 'cone', [0, -0.76, 0], [1.15, 0.85, 0.97], C.dark).r[2] = Math.PI;
    for (const s of [-1, 1]) {
      mesh(g, 'box', [s * 0.34, 0.16, 0.51], [0.44, 0.11, 0.16], C.dark);
      mesh(g, 'box', [s * 0.34, 0.17, 0.6], [0.24, 0.045, 0.04], C.light, { em: 1.1 });
      for (let i = 0; i < 3; i++) {
        const x = s * (0.53 + i * 0.21),
          y = 0.86 - i * 0.19;
        const n = mesh(g, 'cone', [x, y, 0], [0.31, 1.15 - i * 0.15, 0.35], i % 2 ? C.violet : C.accent);
        n.r[2] = -s * (0.27 + i * 0.15);
      }
    }
    mesh(g, 'cone', [0, 1.13, 0], [0.35, 1.11, 0.36], C.light, { em: 0.12 });
    mesh(g, 'box', [0, -0.39, 0.52], [0.32, 0.045, 0.05], C.dark);
    mesh(g, 'hex', [0, 0.56, 0.51], [0.2, 0.39, 0.12], C.violet, { em: 0.35 });
    return g;
  }
  K.TrophyModels[ID + '-ruler'] = root => {
    const n = head(root);
    n.r[1] = Math.PI;
    return n;
  };
  const ENV = {
    fog: [0.38, 0.5, 0.63],
    fogD: 0.00125,
    ambient: 0.71,
    sun: [-0.65, 0.72, 0.32],
    skyTop: [0.075, 0.16, 0.32],
    skyHorizon: [0.58, 0.68, 0.77],
    skyCloud: [0.78, 0.84, 0.93],
    skyStyle: 1,
  };
  (K.SurfaceAtmospheres ||= {})[ID] = ENV;
  // 결정인: tall and narrow, a light bar for eyes, a mouth that opens as a slit of light.
  K.defineSpecies('nacre', {
    name: '결정인',
    dims: {
      hipY: 1.5,
      hipX: 0.24,
      legLen: 1.48,
      shoulderX: 0.5,
      shoulderY: 1.08,
      neckY: 1.22,
      upperLen: 0.72,
      foreLen: 0.68,
      depth: 0.36,
      headTop: 1.3,
    },
    scale: [0.82, 1.0],
    child: 0.58,
    walk: 1.5,
    jog: 3.0,
    run: 7.6,
    radius: 1.25,
    voice: 'nacre',
    blood: '#245c69',
    scorch: '#1a1d22',
    capColor: '#22404b',
    palettes: [
      { body: '#dceaf0', accent: '#7a62d8', light: '#eafdff' },
      { body: '#d0dded', accent: '#1fbcd6', light: '#f0ffff' },
      { body: '#e7e2f1', accent: '#d877af', light: '#fff0fb' },
      { body: '#d4ebe7', accent: '#3a5cd2', light: '#e6f3ff' },
      { body: '#e1e9e4', accent: '#36c896', light: '#eafff6' },
    ],
    parts: [
      [8, 'hex', 'body', [0, -0.72, 0], [0.24, 1.44, 0.24]],
      [9, 'hex', 'body', [0, -0.72, 0], [0.24, 1.44, 0.24]],
      [8, 'lowCone', 'accent', [0, -1.42, 0.03], [0.32, 0.32, 0.36], [Math.PI, 0, 0], 0.2, 1],
      [9, 'lowCone', 'accent', [0, -1.42, 0.03], [0.32, 0.32, 0.36], [Math.PI, 0, 0], 0.2, 1],
      [1, 'hex', 'accent', [0, 0.05, 0], [0.74, 0.42, 0.58]],
      [2, 'hex', 'accent', [0, 0.62, 0], [0.9, 1.22, 0.64], [0, Math.PI / 6, 0]],
      [2, 'hex', 'light', [0, 0.66, 0.31], [0.18, 0.52, 0.08], [0, 0, 0], 0.9, 1],
      [2, 'lowCone', 'body', [0.48, 1.18, 0], [0.25, 0.64, 0.25], [0, 0, -0.55], 0, 1],
      [2, 'lowCone', 'body', [-0.48, 1.18, 0], [0.25, 0.64, 0.25], [0, 0, 0.55], 0, 1],
      [3, 'lowCone', 'body', [0, 0.62, 0], [0.9, 1.32, 0.76]],
      [3, 'lowCone', 'accent', [0, 0.78, -0.2], [0.42, 1.1, 0.3], [-0.25, 0, 0], 0.2, 2],
      [3, 'box', 'light', [0, 0.52, 0.3], [0.52, 0.1, 0.1], [0, 0, 0], 1.25, 0],
      [3, 'box', 'light', [0, 0.22, 0.34], [0.26, 0.05, 0.06], [0, 0, 0], 0.8, 1, null, 'mouth', 4.2],
      [4, 'hex', 'body', [0, -0.36, 0], [0.17, 0.72, 0.17]],
      [5, 'hex', 'accent', [0, -0.34, 0], [0.15, 0.68, 0.15]],
      [5, 'lowCone', 'light', [0, -0.84, 0], [0.21, 0.36, 0.21], [Math.PI, 0, 0], 0.5, 1],
      [6, 'hex', 'body', [0, -0.36, 0], [0.17, 0.72, 0.17]],
      [7, 'hex', 'accent', [0, -0.34, 0], [0.15, 0.68, 0.15]],
      [7, 'lowCone', 'light', [0, -0.84, 0], [0.21, 0.36, 0.21], [Math.PI, 0, 0], 0.5, 1],
    ],
  });
  class Nacre extends K.Surface {
    constructor(game, def) {
      super(game, def, {
        seed: 71293,
        rulerName: '수정 섭정',
        areaLabel: 'NACRE / SURFACE',
        regionName: '공명 도시',
        afterLabel: '섭정이 없는 결정 도시',
        rubble: C.stone,
        rubbleGeo: 'hex',
        accent: C.violet,
        spark: C.light,
        lifeColor: '#a4ddea',
        fallMode: 'shatter',
        hover: 1.9,
        runSpeed: 11,
        scorch: '#2a3542',
        environment: ENV,
      });
      this.initialize();
    }
    makeTerrain() {
      this.terrain(C.ground);
      // Opaque shallow mineral sheets, not a full-screen transparent plane.
      for (let i = 0; i < 9; i++) {
        const x = ((i % 3) - 1) * 255 - 40,
          z = Math.floor(i / 3) * 260 - 380;
        mesh(this.root, 'disc', [x, this.height(x, z) + 0.06, z], [190, 0.07, 155], i % 2 ? '#597b96' : '#8ca4b2', {
          em: 0.06,
        });
      }
      for (let i = 0; i < 3; i++) {
        const n = mesh(
          this.root,
          'sphere',
          [-650 + i * 260, 540 + i * 160, -1700],
          [240 + i * 55, 240 + i * 55, 240 + i * 55],
          i === 1 ? '#8190b2' : '#ccdbdd',
        );
        n.r[0] = 0.4;
      }
      const ring = mesh(this.root, 'ring', [-650, 540, -1700], [530, 530, 530], C.violet, { type: 3, alpha: 0.43 });
      ring.r = [0.55, 0, 0.75];
    }
    crystal(id, x, z, w, h, style = 'crystal') {
      const b = this.building(
          id,
          [x, this.height(x, z), z],
          w,
          h,
          style,
          style === 'resonator' ? 180 : style === 'shard' ? 48 : 92,
        ),
        n = b.node;
      mesh(n, 'hex', [0, 1, 0], [w * 1.15, 2, w * 1.15], C.dark);
      mesh(n, 'hex', [0, h * 0.36, 0], [w * 0.8, h * 0.72, w * 0.8], style === 'resonator' ? C.violet : C.stone).r[1] =
        Math.PI / 6;
      mesh(n, 'cone', [0, h * 0.83, 0], [w * 0.96, h * 0.44, w * 0.96], C.accent);
      for (const s of [-1, 1]) {
        const side = mesh(
          n,
          'cone',
          [s * w * 0.33, h * 0.49, 0],
          [w * 0.33, h * 0.85, w * 0.38],
          s > 0 ? C.violet : C.stone,
        );
        side.r[2] = -s * 0.14;
      }
      const light = mesh(n, 'box', [0, h * 0.39, w * 0.4], [w * 0.15, h * 0.65, 0.13], C.light, { em: 0.25 });
      light.restEm = 0.25;
      b.glows.push(light);
      if (style === 'resonator') {
        const hoop = mesh(n, 'torus', [0, h * 0.65, 0], [w * 1.2, w * 1.2, w * 1.2], C.light, { em: 0.45 });
        hoop.r[0] = 0.3;
        b.hoop = hoop;
        mesh(n, 'hex', [0, h * 0.43, 0], [w * 0.13, h * 0.81, w * 0.13], C.light, { em: 0.75 });
      }
      return this.finishBuilding(b);
    }
    makeCity() {
      mesh(this.root, 'hex', [0, 0.06, -145], [92, 0.16, 92], C.dark);
      for (let r = 0; r < 3; r++) {
        const count = 14 + r * 6,
          rad = 87 + r * 63;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + r * 0.13,
            x = Math.sin(a) * rad,
            z = Math.cos(a) * rad - 60;
          if (Math.hypot(x, z + 145) < 52 || (Math.abs(x) < 19 && z > 20)) continue;
          this.crystal('spire-' + r + '-' + i, x, z, 10 + this.rng() * 8, 22 + this.rng() * 36);
        }
      }
      for (const s of [-1, 1])
        for (let i = 0; i < 4; i++)
          this.crystal(
            'gate-' + s + '-' + i,
            s * (32 + i * 3),
            166 - i * 29,
            11,
            19 + i * 6,
            i % 2 ? 'crystal' : 'resonator',
          );
      // Three compact, actually linked clusters. Breaking a mast fractures its low-HP satellites.
      for (let j = 0; j < 3; j++) {
        const cx = [-143, 137, -35][j],
          cz = [-40, -63, -245][j];
        this.crystal('resonator-' + j, cx, cz, 14, 63, 'resonator');
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * 6.283;
          this.crystal(
            'satellite-' + j + '-' + i,
            cx + Math.sin(a) * 23,
            cz + Math.cos(a) * 23,
            7,
            13 + this.rng() * 7,
            'shard',
          );
        }
      }
      for (let z = 195; z > -120; z -= 10) {
        mesh(this.root, 'hex', [0, 0.12, z], [13, 0.17, 7], C.stone);
        for (const s of [-1, 1]) mesh(this.root, 'box', [s * 7.2, 0.23, z], [0.16, 0.1, 6.5], C.accent, { em: 0.15 });
      }
      for (let i = 0; i < 16; i++) {
        const x = (this.rng() - 0.5) * 430,
          z = (this.rng() - 0.5) * 350;
        this.prop([x, this.height(x, z) + 1, z], n => {
          mesh(n, 'hex', [0, 0.5, 0], [2, 2, 2], C.violet);
          mesh(n, 'cone', [0, 2, 0], [2.2, 2, 2.2], C.accent);
        });
      }
    }
    makeRuler() {
      const base = group(this.root, [0, this.height(0, -145), -145]),
        body = group(base);
      mesh(base, 'hex', [0, 1.6, 0], [30, 3.2, 30], C.dark);
      mesh(base, 'hex', [0, 3.4, 0], [24, 0.5, 24], C.accent);
      mesh(body, 'hex', [0, 11.5, 0], [10, 16, 8], C.violet);
      mesh(body, 'cone', [0, 11, 0], [18, 15, 12], C.stone);
      for (const s of [-1, 1]) {
        mesh(body, 'hex', [s * 6, 10, 0], [2, 13, 2], C.dark).r[2] = s * 0.18;
        mesh(body, 'cone', [s * 7.5, 4, 1], [5, 6, 5], C.accent);
      }
      const crown = group(base, [0, 22, 0]);
      crown.s = [4.7, 4.7, 4.7];
      head(crown);
      const halo = mesh(base, 'torus', [0, 24, -7], [24, 24, 24], C.accent, { em: 0.2 });
      halo.r[0] = Math.PI / 2;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.283,
          n = mesh(base, 'cone', [Math.sin(a) * 19, 24 + Math.cos(a) * 19, -7], [2.5, 11, 2.5], C.violet);
        n.r[2] = -a;
      }
      this.setupRuler(base, body, crown, halo, 22, 410, 9.5);
    }
    makeCreatures() {
      // 0.1.x placed 50 creatures here (4 random draws each); kept so the outer crystals stay put.
      for (let i = 0; i < 50 * 4; i++) this.rng();
    }
    residentSpec() {
      return {
        species: 'nacre',
        count: 310,
        seed: 7129,
        center: [0, -60],
        radius: 230,
        minR: 20,
        road: { x: 8, z0: -120, z1: 195 },
        throne: [0, -145],
        throneR: 19,
        occupancy: b => (b.style === 'resonator' || b.style === 'shard' ? 0 : 4 + b.w * b.h * 0.1),
      };
    }
    makeScenery() {
      for (let i = 0; i < 95; i++) {
        const a = this.rng() * 6.283,
          r = 330 + this.rng() * 430,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r,
          h = 24 + this.rng() * 95;
        const g = group(this.root, [x, this.height(x, z), z]);
        g.r[2] = (this.rng() - 0.5) * 0.35;
        mesh(g, 'hex', [0, h * 0.3, 0], [12 + this.rng() * 15, h * 0.6, 15], i % 2 ? C.dark : C.violet);
        mesh(g, 'cone', [0, h * 0.78, 0], [23, h * 0.65, 20], C.stone);
      }
    }
    onCollapse(b) {
      if (b.style !== 'resonator' && b.style !== 'shard') return;
      this.later(0.2, () => {
        const p = M.add(b.p, [0, b.h * 0.3, 0]);
        this.wave(p, C.accent, 86, 0.65);
        this.emit(p, 27, C.light, 34, 1.7);
        this.shock(p, b.style === 'resonator' ? 55 : 26, b.style === 'resonator' ? 120 : 42);
        this.game.audio.noiseHit(0.35, 0.1, 2100);
      });
    }
    updateWorld(dt) {
      for (const b of this.buildings) if (b.alive && b.hoop) b.hoop.r[1] += dt * 0.3;
    }
  }
  K.Planets[ID] = Nacre;
})((window.KO ||= {}));
