/* @surface {"id":"p0011","name":"CINDER","shortName":"CINDER","description":"주조 도시 · 압력조를 터뜨리면 주변 시설까지 폭발에 휩쓸립니다.","rulerName":"용광로 군주","trophyNote":"냉각 장치를 꺼도, 얼굴 안쪽에서 열이 새어 나온다.","species":"cinder"} */
/* CINDER — foundries, pressure vessels and black basalt above incandescent fissures. */
(function (K) {
  'use strict';
  const { M, mesh, group } = K,
    ID = 'p0011';
  const C = { ground: '#413c3a', hull: '#655951', dark: '#242b31', rust: '#96664d', hot: '#ffad50', light: '#ffe2ab' };
  function head(root) {
    const g = group(root);
    mesh(g, 'box', [0, 0.02, 0], [1.7, 1.65, 1.4], C.dark);
    mesh(g, 'box', [0, -0.46, 0.22], [1.95, 0.66, 1.25], C.hull);
    mesh(g, 'box', [0, 0.17, 0.71], [1.3, 0.56, 0.07], '#381d12');
    for (let i = -2; i <= 2; i++) {
      mesh(g, 'box', [i * 0.22, 0.17, 0.76], [0.105, 0.42, 0.055], C.hot, { em: 1.0 });
      mesh(g, 'box', [i * 0.23, -0.58, 0.87], [0.07, 0.36, 0.1], C.rust);
    }
    for (const s of [-1, 1]) {
      mesh(g, 'hex', [s * 0.86, 0.71, 0], [0.47, 1.8, 0.47], C.rust);
      mesh(g, 'hex', [s * 0.86, 1.6, 0], [0.52, 0.15, 0.52], C.dark);
      mesh(g, 'sphere', [s * 0.81, -0.13, 0.77], [0.19, 0.19, 0.08], C.hot, { em: 0.5 });
    }
    mesh(g, 'hex', [0, 1.08, 0], [0.53, 0.76, 0.53], C.hull);
    mesh(g, 'box', [0, 0.62, 0.75], [1.8, 0.24, 0.16], C.rust);
    return g;
  }
  K.TrophyModels[ID + '-ruler'] = root => {
    const n = head(root);
    n.r[1] = Math.PI;
    return n;
  };
  const ENV = {
    fog: [0.29, 0.19, 0.17],
    fogD: 0.00155,
    ambient: 0.6,
    sun: [-0.48, 0.69, -0.22],
    skyTop: [0.06, 0.065, 0.095],
    skyHorizon: [0.48, 0.27, 0.19],
    skyCloud: [0.35, 0.24, 0.22],
    skyStyle: 2,
  };
  (K.SurfaceAtmospheres ||= {})[ID] = ENV;
  // 주조인: soot-dark stocky workers, a glowing visor and a mouth that glows when it opens.
  K.defineSpecies('cinder', {
    name: '주조인',
    dims: {
      hipY: 1.0,
      hipX: 0.32,
      legLen: 1.0,
      shoulderX: 0.8,
      shoulderY: 1.05,
      neckY: 1.28,
      upperLen: 0.62,
      foreLen: 0.58,
      depth: 0.5,
      headTop: 1.1,
    },
    scale: [0.9, 1.1],
    child: 0.58,
    walk: 1.25,
    jog: 2.5,
    run: 5.9,
    radius: 1.5,
    voice: 'cinder',
    blood: '#47200f',
    scorch: '#151312',
    capColor: '#5a2810',
    palettes: [
      { skin: '#54463e', apron: '#c4572a', pants: '#3a3633', metal: '#a2a6ab', hot: '#ffb347', mouth: '#ff7a2a' },
      { skin: '#5f4c41', apron: '#d8a332', pants: '#33302e', metal: '#8d8272', hot: '#ffc05a', mouth: '#ff8a32' },
      { skin: '#463b36', apron: '#4c74a6', pants: '#2f3236', metal: '#b3b7bd', hot: '#ffa840', mouth: '#ff6e26' },
      { skin: '#655247', apron: '#bb3229', pants: '#3b3330', metal: '#9c9088', hot: '#ffb64c', mouth: '#ff7d2c' },
      { skin: '#4c4039', apron: '#7f8f37', pants: '#363431', metal: '#a49c8c', hot: '#ffbd55', mouth: '#ff842e' },
    ],
    parts: [
      [8, 'box', 'pants', [0, -0.48, 0], [0.42, 0.96, 0.46]],
      [9, 'box', 'pants', [0, -0.48, 0], [0.42, 0.96, 0.46]],
      [8, 'box', '#262220', [0, -0.95, 0.08], [0.5, 0.26, 0.66]],
      [9, 'box', '#262220', [0, -0.95, 0.08], [0.5, 0.26, 0.66]],
      [1, 'box', '#2a2522', [0, 0.08, 0], [1.34, 0.28, 0.96]],
      [2, 'box', 'skin', [0, 0.64, 0], [1.36, 1.12, 0.92]],
      [2, 'box', 'apron', [0, 0.42, 0.47], [1.12, 1.32, 0.09]],
      [2, 'box', 'metal', [0.72, 1.12, 0], [0.5, 0.22, 0.7], [0, 0, 0], 0, 1],
      [2, 'box', 'metal', [-0.72, 1.12, 0], [0.5, 0.22, 0.7], [0, 0, 0], 0, 1],
      [3, 'hex', 'skin', [0, 0.42, 0], [0.98, 0.86, 0.92]],
      [3, 'lowDome', 'metal', [0, 0.66, 0], [1.2, 0.9, 1.14]],
      [3, 'box', 'hot', [0, 0.5, 0.47], [0.82, 0.17, 0.08], [0, 0, 0], 1.3, 0],
      [3, 'box', 'mouth', [0, 0.18, 0.47], [0.42, 0.09, 0.07], [0, 0, 0], 0.9, 1, null, 'mouth', 3.6],
      [4, 'box', 'skin', [0, -0.31, 0], [0.36, 0.66, 0.38]],
      [5, 'box', 'skin', [0, -0.28, 0], [0.32, 0.58, 0.34]],
      [5, 'box', '#2f2a27', [0, -0.66, 0], [0.44, 0.38, 0.44]],
      [6, 'box', 'skin', [0, -0.31, 0], [0.36, 0.66, 0.38]],
      [7, 'box', 'skin', [0, -0.28, 0], [0.32, 0.58, 0.34]],
      [7, 'box', '#2f2a27', [0, -0.66, 0], [0.44, 0.38, 0.44]],
    ],
  });
  class Cinder extends K.Surface {
    constructor(game, def) {
      super(game, def, {
        seed: 90241,
        edge: 2600,
        rulerName: '용광로 군주',
        areaLabel: 'CINDER / SURFACE',
        regionName: '주조 지대',
        afterLabel: '군주가 없는 주조 지대',
        rubble: C.hull,
        accent: C.rust,
        spark: C.hot,
        lifeColor: '#bca075',
        scorch: '#1b1716',
        environment: ENV,
      });
      this.steam = [];
      this.initialize();
    }
    height(x, z) {
      return super.height(x, z) * 1.4;
    }
    makeTerrain() {
      this.terrain(C.ground, 6200, 200);
      for (const s of [-1, 1])
        for (let i = 0; i < 21; i++) {
          const z = 530 - i * 55,
            x = s * (260 + Math.sin(i * 0.62) * 32),
            y = this.height(x, z) + 0.12;
          const n = mesh(this.root, 'box', [x, y, z], [24, 0.12, 68], i % 3 ? C.hot : '#ff7629', { em: 0.45, type: 1 });
          n.r[1] = Math.sin(i * 0.62) * 0.13;
          mesh(this.root, 'box', [x, y + 0.03, z], [7, 0.05, 70], C.light, { em: 0.3, type: 1 });
        }
      mesh(this.root, 'sphere', [-930, 720, -2000], [620, 620, 620], '#8f7667');
      const ring = mesh(this.root, 'ring', [-930, 720, -2000], [690, 690, 690], C.rust, { alpha: 0.48, type: 3 });
      ring.r = [0.72, 0.15, 0.48];
    }
    facility(id, x, z, w, h, style = 'furnace') {
      const b = this.building(
          id,
          [x, this.height(x, z), z],
          w,
          h,
          style,
          style === 'tank' ? 120 : style === 'pipe' ? 58 : 155,
        ),
        n = b.node;
      mesh(n, 'box', [0, 1, 0], [w * 1.14, 2, w * 1.08], C.dark);
      if (style === 'tank') {
        mesh(n, 'cylinder', [0, h * 0.44, 0], [w * 0.94, h * 0.88, w * 0.94], C.rust);
        mesh(n, 'dome', [0, h * 0.86, 0], [w, h * 0.27, w], C.hull);
        for (let j = 0; j < 3; j++)
          mesh(n, 'cylinder', [0, h * (0.18 + j * 0.27), 0], [w * 1.01, 0.75, w * 1.01], C.dark);
        const core = mesh(n, 'box', [0, h * 0.45, w * 0.475], [w * 0.27, h * 0.5, 0.12], C.hot, { em: 0.45 });
        b.glows.push(core);
        core.restEm = 0.45;
        mesh(n, 'box', [0, h * 0.98, 0], [w * 0.26, h * 0.18, w * 0.24], C.dark);
      } else if (style === 'pipe') {
        mesh(n, 'cylinder', [0, h * 0.5, 0], [w * 0.65, h, w * 0.65], C.hull);
        mesh(n, 'cylinder', [0, h * 0.85, 0], [w, 0.8, w], C.rust);
        mesh(n, 'disc', [0, h + 0.06, 0], [w * 0.51, 0.02, w * 0.51], C.hot, { em: 0.6 });
      } else {
        mesh(n, 'box', [0, h * 0.4, 0], [w, h * 0.8, w * 0.8], C.hull);
        mesh(n, 'box', [0, h * 0.42, w * 0.41], [w * 0.69, h * 0.47, 0.16], C.dark);
        for (let j = -2; j <= 2; j++)
          mesh(n, 'box', [j * w * 0.13, h * 0.41, w * 0.425], [w * 0.075, h * 0.35, 0.13], C.hot, { em: 0.8 });
        mesh(n, 'box', [0, h * 0.84, 0], [w * 1.07, 1.8, w * 0.93], C.rust);
        for (const s of [-1, 1])
          mesh(n, 'cylinder', [s * w * 0.31, h * 0.92, -w * 0.12], [w * 0.2, h * 0.3, w * 0.2], C.dark);
        mesh(n, 'box', [0, h * 0.75, w * 0.48], [w * 0.9, 0.45, 0.5], C.hot, { em: 0.25 });
      }
      return this.finishBuilding(b);
    }
    makeCity() {
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 7; col++) {
          const x = (col - 3) * 53,
            z = 112 - row * 76;
          if (Math.abs(x) < 24) continue;
          this.facility('foundry-' + row + '-' + col, x, z, 23 + this.rng() * 7, 23 + this.rng() * 27);
        }
      for (const s of [-1, 1])
        for (let j = 0; j < 3; j++) {
          const cx = s * (81 + j * 26),
            cz = 185 - j * 135;
          this.facility('pressure-' + s + '-' + j, cx, cz, 17, 25, 'tank');
          for (let i = 0; i < 3; i++)
            this.facility('vent-' + s + '-' + j + '-' + i, cx + s * (23 + i * 15), cz + 18, 7, 12 + i * 3, 'pipe');
        }
      // Tall industrial skyline, also destructible rather than distant painted silhouettes.
      for (const s of [-1, 1])
        for (let i = 0; i < 3; i++)
          this.facility('stack-' + s + '-' + i, s * (104 + i * 45), -230 - i * 8, 13, 74 + i * 13, 'pipe');
      for (let z = 225; z > -125; z -= 16) {
        mesh(this.root, 'box', [0, 0.1, z], [22, 0.15, 14], C.hull);
        for (const s of [-1, 1]) mesh(this.root, 'box', [s * 9.6, 0.24, z], [0.35, 0.13, 11], C.hot, { em: 0.12 });
      }
      for (let i = 0; i < 22; i++) {
        const x = (this.rng() - 0.5) * 360,
          z = (this.rng() - 0.5) * 375;
        this.prop([x, this.height(x, z) + 1, z], n => {
          mesh(n, 'cylinder', [0, 1, 0], [3, 3, 3], C.rust);
          mesh(n, 'cylinder', [0, 1, 0], [3.1, 0.4, 3.1], C.dark);
        });
      }
      // outlying works: a pressure vessel in the middle of each, foundries round it, vents between
      this.outskirts({
        n: 7,
        seed: 1107,
        rMin: 560,
        rMax: 1500,
        plinth: C.dark,
        build: (id, x, z, rng, i) =>
          i === 0
            ? this.facility(id, x, z, 17, 25, 'tank')
            : i % 4 === 2
              ? this.facility(id, x, z, 7, 12 + rng() * 8, 'pipe')
              : this.facility(id, x, z, 18 + rng() * 8, 18 + rng() * 20),
      });
    }
    makeRuler() {
      const base = group(this.root, [0, 0, -153]),
        body = group(base);
      mesh(base, 'box', [0, 2, 0], [36, 4, 25], C.dark);
      mesh(body, 'box', [0, 12, 0], [16, 19, 12], C.hull);
      mesh(body, 'box', [0, 10, 6.1], [11, 11, 0.24], '#361f17');
      for (let i = -3; i <= 3; i++) mesh(body, 'box', [i * 1.4, 10, 6.3], [0.9, 8, 0.12], C.hot, { em: 0.85 });
      for (const s of [-1, 1]) {
        mesh(body, 'cylinder', [s * 11, 12, 0], [4, 20, 4], C.rust);
        mesh(body, 'sphere', [s * 11, 4, 1], [7, 5, 7], C.dark);
        mesh(base, 'hex', [s * 20, 22, -9], [9, 44, 9], C.dark);
        mesh(base, 'hex', [s * 20, 44, -9], [10, 2, 10], C.hot, { em: 0.3 });
      }
      const crown = group(base, [0, 27, 1]);
      crown.s = [4.5, 4.5, 4.5];
      head(crown);
      const halo = mesh(base, 'box', [0, 45, -10], [48, 3, 4], C.rust);
      for (let i = -3; i <= 3; i++) mesh(base, 'box', [i * 6, 41.5, -10], [2, 6, 3], C.hull);
      this.setupRuler(base, body, crown, halo, 27, 460, 10);
    }
    makeCreatures() {
      // 0.1.x placed 48 creatures here (4 random draws each); kept so the basalt skyline stays put.
      for (let i = 0; i < 48 * 4; i++) this.rng();
    }
    residentSpec() {
      return {
        species: 'cinder',
        count: 480,
        maxR: 1560,
        villages: this.villages,
        seed: 9024,
        center: [0, -30],
        radius: 220,
        minR: 20,
        road: { x: 12, z0: -125, z1: 225 },
        throne: [0, -153],
        throneR: 22,
        occupancy: b => (b.style === 'tank' || b.style === 'pipe' ? 0 : 4 + b.w * b.h * 0.1),
      };
    }
    makeScenery() {
      for (let i = 0; i < 74; i++) {
        const a = this.rng() * 6.283,
          r = 390 + this.rng() * 550,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r,
          h = 35 + this.rng() * 100;
        const n = mesh(
          this.root,
          'hex',
          [x, this.height(x, z) + h * 0.5, z],
          [25 + this.rng() * 30, h, 25 + this.rng() * 30],
          i % 3 ? C.dark : C.hull,
        );
        n.r[1] = this.rng() * 6.283;
      }
      for (let i = 0; i < 34; i++) {
        const x = (this.rng() - 0.5) * 1100,
          z = (this.rng() - 0.5) * 1000;
        const n = mesh(this.root, 'lowSphere', [x, 70 + this.rng() * 220, z], [0.5, 0.5, 0.5], C.hot, { em: 0.8 });
        this.animated.push({ node: n, base: n.p.slice(), phase: this.rng() * 6.283 });
      }
      // basalt columns out to the horizon
      const r2 = M.rand(1203);
      for (let i = 0; i < 160; i++) {
        const a = r2() * 6.283,
          r = 950 + Math.sqrt(r2()) * 1450,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r;
        if (this.villages.some(v => Math.hypot(v.x - x, v.z - z) < 110)) continue;
        const h = 35 + r2() * 110,
          n = mesh(this.root, 'hex', [x, this.height(x, z) + h * 0.5, z], [25 + r2() * 30, h, 25 + r2() * 30], i % 3 ? C.dark : C.hull);
        n.r[1] = r2() * 6.283;
      }
    }
    onCollapse(b) {
      if (b.style !== 'tank') return;
      this.later(0.42, () => {
        const p = M.add(b.p, [0, b.h * 0.5, 0]);
        this.emit(p, 42, C.hot, 50, 2.2, false);
        this.wave(p, C.hot, 115, 0.6);
        this.shock(p, 61, 235, { ruler: true });
        this.game.audio.impact(2.7);
        if (this.vehicle) {
          const d = M.dist(this.vehicle.p, p);
          this.vehicle.shake = Math.max(this.vehicle.shake, 0.8 * Math.max(0, 1 - d / 130));
        }
        this.steam.push({ p: b.p.slice(), until: this.time + 4, next: 0 });
      });
    }
    updateWorld(dt) {
      for (let i = this.steam.length - 1; i >= 0; i--) {
        const s = this.steam[i];
        if (this.time > s.until) {
          this.steam.splice(i, 1);
          continue;
        }
        if (this.time > s.next) {
          s.next = this.time + 0.14;
          this.emit(M.add(s.p, [0, 4, 0]), 2, C.rust, 9, 2, false);
        }
      }
      for (const f of this.animated) {
        f.node.p[1] = f.base[1] + Math.sin(this.time * 0.2 + f.phase) * 12;
        f.node.p[0] = f.base[0] + Math.sin(this.time * 0.1 + f.phase) * 7;
      }
    }
    dispose() {
      super.dispose();
      this.steam.length = 0;
    }
  }
  K.Planets[ID] = Cinder;
})((window.KO ||= {}));
