/* @surface {"id":"p0006","name":"MYCEL","shortName":"MYCEL","description":"균사 군락 · 포자낭을 터뜨려 생명체와 잔해를 날려 보낼 수 있습니다.","rulerName":"균사 여왕","trophyNote":"군락에서 떨어진 머리. 작은 눈들이 안쪽에 여러 개 남아 있다.","species":"mycel"} */
/* MYCEL — a breathing fungal settlement, hanging veils, luminous gills and spore pressure. */
(function (K) {
  'use strict';
  const { M, mesh, group } = K,
    ID = 'p0006';
  const C = {
    soil: '#303e40',
    stem: '#66877b',
    cap: '#74566f',
    light: '#aedbad',
    gill: '#91b5bb',
    dark: '#293f45',
    rose: '#c2a1a0',
  };
  function head(root) {
    const g = group(root);
    mesh(g, 'sphere', [0, -0.05, 0], [1.72, 1.45, 1.35], C.stem);
    const cap = mesh(g, 'dome', [0, 0.28, 0], [2.1, 1.35, 1.8], C.cap);
    cap.r[2] = 0.07;
    mesh(g, 'sphere', [0, -0.58, 0.15], [1.3, 0.65, 1.12], C.rose);
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.3,
        y = 0.14 - Math.abs(i - 2) * 0.13;
      mesh(g, 'sphere', [x, y, 0.62], [0.26, 0.24, 0.12], C.dark);
      mesh(g, 'sphere', [x, y, 0.7], [0.12, 0.11, 0.06], C.light, { em: 0.75 });
    }
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const a = s * (0.6 + i * 0.23);
        const n = mesh(g, 'cone', [a, 0.84 - i * 0.18, -0.07], [0.32, 1.1, 0.3], C.gill);
        n.r[2] = -s * (0.28 + i * 0.2);
      }
      mesh(g, 'cylinder', [s * 0.47, -0.88, 0.17], [0.13, 0.56, 0.13], C.stem).r[2] = s * 0.25;
    }
    return g;
  }
  K.TrophyModels[ID + '-ruler'] = root => {
    const n = head(root);
    n.r[1] = Math.PI;
    return n;
  };
  const ENV = {
    fog: [0.13, 0.23, 0.235],
    fogD: 0.002,
    ambient: 0.66,
    sun: [0.3, 0.65, -0.5],
    skyTop: [0.027, 0.05, 0.12],
    skyHorizon: [0.24, 0.37, 0.37],
    skyCloud: [0.34, 0.43, 0.39],
    skyStyle: 3,
  };
  (K.SurfaceAtmospheres ||= {})[ID] = ENV;
  // 균사인: a stalk body under a cap, three glowing eyes, a vertical mouth.
  K.defineSpecies('mycel', {
    name: '균사인',
    dims: {
      hipY: 0.9,
      hipX: 0.3,
      legLen: 0.88,
      shoulderX: 0.62,
      shoulderY: 0.82,
      neckY: 1.02,
      upperLen: 0.56,
      foreLen: 0.5,
      depth: 0.5,
      headTop: 0.98,
    },
    scale: [0.88, 1.08],
    child: 0.58,
    walk: 1.2,
    jog: 2.3,
    run: 5.5,
    radius: 1.45,
    voice: 'mycel',
    blood: '#4a173c',
    scorch: '#1c1a1d',
    capColor: '#3a2131',
    palettes: [
      { stem: '#cdd6bf', stemDark: '#6e7d6c', cap: '#b83f7f', gill: '#dcf3c9', spot: '#f6e7d2', glow: '#c6ffb0', mouth: '#3a1430' },
      { stem: '#c2cdb7', stemDark: '#64735f', cap: '#7a4cb8', gill: '#d1ead9', spot: '#f1e6f7', glow: '#b4fff0', mouth: '#2e1236' },
      { stem: '#d6cfb6', stemDark: '#726b5e', cap: '#dc7136', gill: '#f6e8c6', spot: '#fff2d6', glow: '#ffe8a2', mouth: '#3d1a12' },
      { stem: '#c6d1c0', stemDark: '#65735f', cap: '#ead9b0', gill: '#d2eab8', spot: '#a77b58', glow: '#d2ff98', mouth: '#352215' },
      { stem: '#d0d7c5', stemDark: '#6a7468', cap: '#a8293f', gill: '#f2d6d6', spot: '#f7e9de', glow: '#ffcbd6', mouth: '#2b0d14' },
      { stem: '#c7d1b9', stemDark: '#647262', cap: '#5a9a40', gill: '#e3f5c8', spot: '#ecf5da', glow: '#e4ffa8', mouth: '#1f2a14' },
    ],
    parts: [
      [8, 'lowCyl', 'stem', [0, -0.44, 0], [0.34, 0.88, 0.34]],
      [9, 'lowCyl', 'stem', [0, -0.44, 0], [0.34, 0.88, 0.34]],
      [8, 'lowSphere', 'stemDark', [0, -0.86, 0.08], [0.46, 0.22, 0.58], [0, 0, 0], 0, 1],
      [9, 'lowSphere', 'stemDark', [0, -0.86, 0.08], [0.46, 0.22, 0.58], [0, 0, 0], 0, 1],
      [1, 'lowSphere', 'stem', [0, 0.1, 0], [1.15, 0.7, 1.0]],
      [2, 'lowSphere', 'stem', [0, 0.52, 0], [1.3, 1.15, 1.08]],
      [2, 'tinySphere', 'spot', [0.26, 0.6, 0.49], [0.24, 0.22, 0.08], [0, 0, 0], 0, 2],
      [2, 'tinySphere', 'spot', [-0.2, 0.36, 0.5], [0.18, 0.16, 0.07], [0, 0, 0], 0, 2],
      [2, 'lowCyl', 'stem', [0, 0.98, 0], [0.48, 0.42, 0.46], [0, 0, 0], 0, 1],
      [3, 'lowSphere', 'stem', [0, 0.18, 0], [0.98, 0.78, 0.88]],
      [3, 'lowDome', 'cap', [0, 0.34, 0], [2.15, 1.3, 1.95]],
      [3, 'lowCyl', 'gill', [0, 0.36, 0], [1.88, 0.07, 1.72], [0, 0, 0], 0.25, 1],
      [3, 'tinySphere', 'spot', [0.42, 0.82, 0.3], [0.36, 0.13, 0.3], [0, 0, 0], 0, 2],
      [3, 'tinySphere', 'spot', [-0.36, 0.78, -0.26], [0.3, 0.12, 0.28], [0, 0, 0], 0, 2],
      [3, 'tinySphere', 'spot', [0.04, 0.95, -0.36], [0.26, 0.1, 0.24], [0, 0, 0], 0, 2],
      [3, 'tinySphere', 'glow', [-0.22, 0.24, 0.4], [0.17, 0.17, 0.09], [0, 0, 0], 0.95, 0],
      [3, 'tinySphere', 'glow', [0.22, 0.24, 0.4], [0.17, 0.17, 0.09], [0, 0, 0], 0.95, 0],
      [3, 'tinySphere', 'glow', [0, 0.33, 0.43], [0.12, 0.12, 0.07], [0, 0, 0], 0.95, 1],
      [3, 'tinySphere', 'mouth', [0, -0.05, 0.42], [0.13, 0.16, 0.07], [0, 0, 0], 0, 1, null, 'mouth', 2.6],
      [4, 'lowCyl', 'stem', [0, -0.28, 0], [0.2, 0.56, 0.2]],
      [5, 'lowCyl', 'stem', [0, -0.25, 0], [0.16, 0.5, 0.16]],
      [5, 'lowCone', 'gill', [0, -0.58, 0], [0.3, 0.26, 0.26], [Math.PI, 0, 0], 0.2, 1],
      [6, 'lowCyl', 'stem', [0, -0.28, 0], [0.2, 0.56, 0.2]],
      [7, 'lowCyl', 'stem', [0, -0.25, 0], [0.16, 0.5, 0.16]],
      [7, 'lowCone', 'gill', [0, -0.58, 0], [0.3, 0.26, 0.26], [Math.PI, 0, 0], 0.2, 1],
    ],
  });
  class Mycel extends K.Surface {
    constructor(game, def) {
      super(game, def, {
        seed: 61180,
        rulerName: '균사 여왕',
        areaLabel: 'MYCEL / SURFACE',
        regionName: '살아 있는 군락',
        afterLabel: '여왕이 없는 군락',
        rubble: C.stem,
        rubbleGeo: 'lowSphere',
        accent: C.cap,
        spark: C.light,
        lifeColor: C.rose,
        fallMode: 'wilt',
        hover: 1.05,
        runSpeed: 7,
        scorch: '#1f2a2c',
        environment: ENV,
      });
      this.floating = [];
      this.initialize();
    }
    makeTerrain() {
      this.terrain(C.soil);
      for (let i = 0; i < 14; i++) {
        const x = (this.rng() - 0.5) * 950,
          z = (this.rng() - 0.5) * 870;
        mesh(
          this.root,
          'disc',
          [x, this.height(x, z) + 0.04, z],
          [80 + this.rng() * 100, 0.03, 60 + this.rng() * 130],
          '#395e61',
          { em: 0.08 },
        );
      }
      mesh(this.root, 'sphere', [540, 360, -1700], [430, 430, 430], '#889997');
      const ring = mesh(this.root, 'ring', [540, 360, -1700], [450, 450, 450], '#6b897e', { type: 3, alpha: 0.3 });
      ring.r = [0.28, 0, 0.8];
    }
    fungus(id, x, z, w, h, style = 'home') {
      const b = this.building(
          id,
          [x, this.height(x, z), z],
          w,
          h,
          style,
          style === 'spore' ? 68 : style === 'elder' ? 180 : 105,
        ),
        n = b.node;
      if (style === 'spore') {
        mesh(n, 'cylinder', [0, h * 0.2, 0], [w * 0.2, h * 0.4, w * 0.2], C.stem);
        const sac = mesh(n, 'sphere', [0, h * 0.57, 0], [w, h * 0.8, w * 0.94], C.rose);
        b.breath = sac;
        b.breathY = sac.s[1];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * 6.283;
          const seam = mesh(
            n,
            'cylinder',
            [Math.sin(a) * w * 0.47, h * 0.58, Math.cos(a) * w * 0.44],
            [0.26, h * 0.54, 0.26],
            C.light,
            { em: 0.16 },
          );
          b.glows.push(seam);
        }
        mesh(n, 'cone', [0, h * 0.98, 0], [w * 0.33, h * 0.24, w * 0.32], C.cap);
      } else {
        mesh(n, 'cylinder', [0, h * 0.43, 0], [w * 0.23, h * 0.86, w * 0.23], C.stem);
        mesh(n, 'cylinder', [0, h * 0.5, 0], [w * 0.14, h * 0.76, w * 0.14], C.gill, { em: 0.05 });
        const cap = mesh(n, 'dome', [0, h * 0.69, 0], [w * 1.06, h * 0.54, w * 1.02], C.cap);
        b.breath = cap;
        b.breathY = cap.s[1];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * 6.283;
          const root = mesh(
            n,
            'cone',
            [Math.sin(a) * w * 0.18, h * 0.22, Math.cos(a) * w * 0.18],
            [w * 0.22, h * 0.49, w * 0.2],
            C.stem,
          );
          root.r = [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4];
        }
        const rim = mesh(n, 'torus', [0, h * 0.69, 0], [w * 0.61, w * 0.61, w * 0.61], C.light, { em: 0.32 });
        b.glows.push(rim);
        rim.restEm = 0.32;
        for (let j = 0; j < 5; j++) {
          const a = (j / 5) * 6.283;
          const gill = mesh(
            n,
            'cylinder',
            [Math.sin(a) * w * 0.34, h * 0.53, Math.cos(a) * w * 0.34],
            [0.2, h * 0.29, 0.2],
            C.gill,
            { em: 0.25 },
          );
          b.glows.push(gill);
        }
        if (style === 'elder') mesh(n, 'dome', [w * 0.25, h * 0.42, 0], [w * 0.7, h * 0.25, w * 0.68], C.stem);
      }
      return this.finishBuilding(b);
    }
    makeCity() {
      for (let ring = 0; ring < 3; ring++) {
        const count = 12 + ring * 7,
          rad = 90 + ring * 70;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * 6.283 + ring * 0.22,
            x = Math.sin(a) * rad,
            z = Math.cos(a) * rad - 60;
          if (Math.hypot(x, z + 145) < 52 || (Math.abs(x) < 25 && z > 5)) continue;
          this.fungus(
            'colony-' + ring + '-' + i,
            x,
            z,
            18 + this.rng() * 17,
            24 + this.rng() * 32,
            i % 5 === 0 ? 'elder' : 'home',
          );
        }
      }
      for (const s of [-1, 1])
        for (let i = 0; i < 4; i++)
          this.fungus(
            'sac-' + s + '-' + i,
            s * (32 + i * 12),
            170 - i * 54,
            11 + this.rng() * 3,
            14 + this.rng() * 4,
            'spore',
          );
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.283;
        this.fungus('inner-sac-' + i, Math.sin(a) * 53, -145 + Math.cos(a) * 46, 10, 15, 'spore');
      }
      for (let z = 210; z > -100; z -= 15)
        for (const s of [-1, 1]) {
          const n = mesh(this.root, 'lowSphere', [s * (11 + Math.sin(z * 0.04) * 2), 0.2, z], [3, 0.4, 7], C.light, {
            em: 0.12,
          });
          n.r[1] = s * 0.2;
        }
      for (let i = 0; i < 18; i++) {
        const x = (this.rng() - 0.5) * 425,
          z = (this.rng() - 0.5) * 380;
        this.prop([x, this.height(x, z) + 0.7, z], n => {
          mesh(n, 'sphere', [0, 1, 0], [2.7, 3, 2.7], C.rose);
          mesh(n, 'torus', [0, 1, 0], [1.7, 1.7, 1.7], C.stem);
        });
      }
    }
    makeRuler() {
      const base = group(this.root, [0, 0, -150]),
        body = group(base);
      mesh(base, 'sphere', [0, 2, 0], [39, 5, 32], C.stem);
      mesh(body, 'sphere', [0, 12, 0], [21, 22, 15], C.cap);
      mesh(body, 'sphere', [0, 11, 6], [14, 18, 7], C.rose);
      for (const s of [-1, 1])
        for (let i = 0; i < 3; i++) {
          const limb = mesh(body, 'cylinder', [s * (9 + i * 3), 8 - i, 0], [1.7, 20 - i * 3, 1.7], C.stem);
          limb.r[2] = -s * (0.35 + i * 0.22);
          mesh(body, 'sphere', [s * (13 + i * 3), 2, 2], [5, 3, 6], C.gill);
        }
      const crown = group(base, [0, 27, 0]);
      crown.s = [4.8, 4.8, 4.8];
      head(crown);
      // Ribbed canopy, open towards the player; a recognizable organic throne rather than Eden's halo.
      const halo = group(base);
      for (let i = 0; i < 9; i++) {
        const a = (i / 8 - 0.5) * Math.PI * 1.25,
          x = Math.sin(a) * 28,
          z = -Math.cos(a) * 20 - 7;
        const rib = mesh(halo, 'cylinder', [x, 20, z], [2.5, 43, 2.5], C.stem);
        rib.r[2] = -Math.sin(a) * 0.32;
        mesh(halo, 'dome', [x * 0.8, 41, z], [19, 9, 18], C.cap);
        mesh(halo, 'sphere', [x * 0.9, 33, z], [1.4, 2.5, 1.4], C.light, { em: 0.75 });
      }
      this.setupRuler(base, body, crown, halo, 27, 400, 10);
    }
    makeCreatures() {
      // 0.1.x placed 58 creatures here (4 random draws each); kept so the forest stays where it was.
      for (let i = 0; i < 58 * 4; i++) this.rng();
    }
    residentSpec() {
      return {
        species: 'mycel',
        count: 300,
        seed: 6118,
        center: [0, -60],
        radius: 240,
        minR: 20,
        road: { x: 12, z0: -100, z1: 210 },
        throne: [0, -150],
        throneR: 22,
        occupancy: b => (b.style === 'spore' ? 0 : 4 + b.w * b.h * (b.style === 'elder' ? 0.06 : 0.045)),
      };
    }
    makeScenery() {
      for (let i = 0; i < 62; i++) {
        const a = this.rng() * 6.283,
          r = 340 + this.rng() * 480,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r,
          h = 75 + this.rng() * 135;
        const n = group(this.root, [x, this.height(x, z), z]);
        mesh(n, 'cylinder', [0, h * 0.5, 0], [10, h, 10], C.stem);
        mesh(n, 'dome', [0, h * 0.91, 0], [75 + this.rng() * 40, h * 0.23, 80], i % 3 ? C.cap : C.dark);
        for (let j = 0; j < 3; j++)
          mesh(n, 'cylinder', [(j - 1) * 18, h * 0.7, 0], [0.65, h * 0.39, 0.65], C.gill, { em: 0.08 });
      }
      for (let i = 0; i < 62; i++) {
        const x = (this.rng() - 0.5) * 750,
          z = (this.rng() - 0.5) * 700,
          y = 8 + this.rng() * 110,
          n = mesh(this.root, 'lowSphere', [x, y, z], [0.5, 0.65, 0.5], C.light, { em: 0.7 });
        this.floating.push({ node: n, base: n.p.slice(), phase: this.rng() * 6.283 });
      }
    }
    onCollapse(b) {
      if (b.style !== 'spore') return;
      this.later(0.12, () => {
        const p = M.add(b.p, [0, b.h * 0.52, 0]);
        this.emit(p, 34, C.light, 29, 3.8, false);
        this.emit(p, 14, C.rose, 19, 2.6);
        this.wave(p, C.gill, 64, 0.7);
        this.shock(p, 43, 62);
        this.game.audio.noiseHit(0.46, 0.14, 280);
        const d = M.dist(this.vehicle.p, p);
        if (d < 35) {
          this.vehicle.velocity = M.add(this.vehicle.velocity, M.mul(M.norm(M.sub(this.vehicle.p, p)), 13));
          this.vehicle.shake = Math.max(this.vehicle.shake, 0.24);
        }
      });
    }
    updateWorld(dt) {
      for (const b of this.buildings)
        if (b.alive && b.breath) b.breath.s[1] = b.breathY * (1 + Math.sin(this.time * 0.95 + b.phase) * 0.023);
      for (const s of this.floating) {
        s.node.p[1] = s.base[1] + Math.sin(this.time * 0.27 + s.phase) * 4;
        s.node.p[0] = s.base[0] + Math.sin(this.time * 0.14 + s.phase) * 6;
      }
    }
    dispose() {
      super.dispose();
      this.floating.length = 0;
    }
  }
  K.Planets[ID] = Mycel;
})((window.KO ||= {}));
