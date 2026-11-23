/* @surface {"id":"eden","name":"에덴","shortName":"EDEN","description":"정원 도시 · 황금 왕좌와 태양왕의 머리가 남아 있습니다.","rulerName":"태양왕 아우렐","trophyNote":"에덴의 일곱 번째 왕. 왕관은 여전히 머리에 붙어 있다.","species":"eden"} */
/* EDEN / 01: a tranquil garden-world, with a crown that can be taken.
 * Runs on the shared surface simulation. Building IDs and layout are unchanged from 0.1.x saves. */
(function (K) {
  'use strict';
  const { M, mesh, group } = K;
  const GREEN = '#477763',
    IVORY = '#cdd8bb',
    GOLD = '#bca05b',
    DARK = '#394e46';
  // 에덴인: long ears, big dark eyes, robes dyed in strong colors.
  K.defineSpecies('eden', {
    name: '에덴인',
    dims: {
      hipY: 1.15,
      hipX: 0.27,
      legLen: 1.12,
      shoulderX: 0.56,
      shoulderY: 1.0,
      neckY: 1.18,
      upperLen: 0.6,
      foreLen: 0.55,
      depth: 0.42,
      headTop: 1.05,
    },
    scale: [0.88, 1.08],
    child: 0.56,
    walk: 1.35,
    jog: 2.7,
    run: 6.6,
    radius: 1.35,
    voice: 'eden',
    blood: '#5a1621',
    scorch: '#1d1d1b',
    capColor: '#3a1d17',
    palettes: [
      { skin: '#e6ddbd', robe: '#e29d33', accent: '#f4e6b4', dark: '#3c4a44', eye: '#112c2b', mouth: '#5c1622', ear: '#e39b8f' },
      { skin: '#dae4c3', robe: '#23958a', accent: '#d9b456', dark: '#2f3f3b', eye: '#0f2526', mouth: '#5a1824', ear: '#df9c90' },
      { skin: '#ead7b9', robe: '#c9476a', accent: '#f2dba6', dark: '#3d3438', eye: '#1b2224', mouth: '#56131f', ear: '#e7a294' },
      { skin: '#dfe7c7', robe: '#f3ecd8', accent: '#3f9a8c', dark: '#41504a', eye: '#10292a', mouth: '#5f1a24', ear: '#dc988b' },
      { skin: '#e2d8b5', robe: '#3a63b6', accent: '#e8c871', dark: '#2c3550', eye: '#121f2b', mouth: '#561522', ear: '#e09d92' },
      { skin: '#d9e1bd', robe: '#6c9d35', accent: '#f1e2a6', dark: '#35432c', eye: '#14281f', mouth: '#58171f', ear: '#dd9a8c' },
    ],
    parts: [
      [1, 'lowCone', 'robe', [0, -0.42, 0], [1.42, 1.55, 1.2]],
      [1, 'lowCyl', 'accent', [0, 0.27, 0], [0.98, 0.2, 0.82]],
      [8, 'lowCyl', 'dark', [0, -0.55, 0], [0.22, 1.0, 0.22], [0, 0, 0], 0, 1],
      [9, 'lowCyl', 'dark', [0, -0.55, 0], [0.22, 1.0, 0.22], [0, 0, 0], 0, 1],
      [8, 'box', 'dark', [0, -1.07, 0.12], [0.27, 0.16, 0.5]],
      [9, 'box', 'dark', [0, -1.07, 0.12], [0.27, 0.16, 0.5]],
      [2, 'lowSphere', 'robe', [0, 0.62, 0], [1.08, 1.3, 0.82]],
      [2, 'lowCyl', 'accent', [0, 1.06, 0], [0.74, 0.17, 0.62], [0, 0, 0], 0, 1],
      [3, 'lowSphere', 'skin', [0, 0.52, 0], [1.08, 1.0, 0.96]],
      [3, 'lowCone', 'skin', [0.48, 0.98, -0.02], [0.3, 0.95, 0.22], [0, 0, -0.5]],
      [3, 'lowCone', 'skin', [-0.48, 0.98, -0.02], [0.3, 0.95, 0.22], [0, 0, 0.5]],
      [3, 'lowCone', 'ear', [0.5, 0.95, 0.07], [0.15, 0.62, 0.06], [0, 0, -0.5], 0, 2],
      [3, 'lowCone', 'ear', [-0.5, 0.95, 0.07], [0.15, 0.62, 0.06], [0, 0, 0.5], 0, 2],
      [3, 'tinySphere', 'eye', [0.24, 0.6, 0.42], [0.3, 0.38, 0.14], [0, 0, 0], 0, 1],
      [3, 'tinySphere', 'eye', [-0.24, 0.6, 0.42], [0.3, 0.38, 0.14], [0, 0, 0], 0, 1],
      [3, 'tinySphere', '#ffffff', [0.2, 0.69, 0.49], [0.08, 0.09, 0.04], [0, 0, 0], 0.5, 2],
      [3, 'tinySphere', '#ffffff', [-0.28, 0.69, 0.49], [0.08, 0.09, 0.04], [0, 0, 0], 0.5, 2],
      [3, 'tinySphere', 'mouth', [0, 0.27, 0.45], [0.28, 0.1, 0.08], [0, 0, 0], 0, 1, null, 'mouth', 3.2],
      [3, 'lowCyl', 'accent', [0, 0.93, 0], [0.86, 0.09, 0.8], [0, 0, 0], 0.15, 2],
      [4, 'lowCyl', 'robe', [0, -0.3, 0], [0.25, 0.62, 0.25]],
      [5, 'lowCyl', 'skin', [0, -0.26, 0], [0.17, 0.52, 0.17]],
      [5, 'tinySphere', 'skin', [0, -0.58, 0], [0.24, 0.27, 0.2], [0, 0, 0], 0, 1],
      [6, 'lowCyl', 'robe', [0, -0.3, 0], [0.25, 0.62, 0.25]],
      [7, 'lowCyl', 'skin', [0, -0.26, 0], [0.17, 0.52, 0.17]],
      [7, 'tinySphere', 'skin', [0, -0.58, 0], [0.24, 0.27, 0.2], [0, 0, 0], 0, 1],
    ],
  });
  class Eden extends K.Surface {
    constructor(game, def) {
      super(game, def, {
        seed: 20260817,
        edge: 2600,
        rulerName: '태양왕 아우렐',
        areaLabel: 'EDEN / 01 · SURFACE',
        regionName: '태양왕의 정원',
        afterLabel: '왕이 없는 대지',
        rubble: IVORY,
        accent: GOLD,
        spark: '#e8e5ab',
        lifeColor: '#aecba5',
        scorch: '#263d37',
        stablePhase: true,
        spawn: { p: [0, 12, 175], yaw: 0, pitch: -0.055 },
        rulerBreak: ['왕좌 붕괴', '왕의 머리를 바라보고 Q로 견인하세요.'],
      });
      this.initialize();
    }
    height(x, z) {
      const r = Math.hypot(x, z),
        blend = M.smooth(290, 620, r);
      const ridge =
        Math.pow(
          Math.abs(Math.sin(x * 0.0041 + 1.3) * Math.cos(z * 0.0034) + 0.45 * Math.sin(x * 0.012 + z * 0.005)),
          2,
        ) * 165;
      return (Math.sin(x * 0.007) * Math.cos(z * 0.005) * 36 + Math.sin(x * 0.018 + z * 0.005) * 12 + ridge) * blend;
    }
    makeTerrain() {
      this.terrain(GREEN, 6200, 200, 5);
      mesh(this.root, 'disc', [-460, -0.3, -130], [430, 0.2, 1600], '#427879', { alpha: 0.84 });
      for (let i = 0; i < 3; i++) {
        const a = -0.7 + i * 0.23;
        const p = [Math.sin(a) * 1200, 340 + i * 110, -900 - i * 190];
        mesh(this.root, 'sphere', p, [210 - i * 30, 210 - i * 30, 210 - i * 30], i === 0 ? '#b6b7a4' : '#799d98');
      }
      const ring = mesh(this.root, 'ring', [-980, 590, -1750], [740, 740, 740], '#d6c496', { alpha: 0.4, type: 3 });
      ring.r = [0.7, 0, 0.6];
    }
    home(id, p, w, h, kind = 'home') {
      const b = this.building(id, p, w, h, kind, kind === 'spire' ? 220 : 105),
        node = b.node;
      b.radius = w * 0.7;
      if (kind === 'home') {
        mesh(node, 'cylinder', [0, h * 0.43, 0], [w, h * 0.86, w], IVORY);
        mesh(node, 'dome', [0, h * 0.83, 0], [w * 1.09, h * 0.48, w * 1.09], GOLD);
        mesh(node, 'cylinder', [0, 0.5, 0], [w * 1.24, 1, w * 1.24], DARK);
        mesh(node, 'cylinder', [0, h * 0.26, 0], [w * 1.015, 0.36, w * 1.015], '#8aaf9b');
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const win = mesh(
            node,
            'box',
            [Math.sin(a) * (w * 0.505), h * 0.55, Math.cos(a) * (w * 0.505)],
            [w * 0.2, h * 0.25, 0.12],
            '#36645f',
            { em: 0.15 },
          );
          win.r[1] = a;
          win.restEm = 0.15;
          b.glows.push(win);
        }
      } else if (kind === 'spire') {
        mesh(node, 'hex', [0, h * 0.45, 0], [w * 0.68, h * 0.9, w * 0.68], IVORY);
        mesh(node, 'hex', [0, 1, 0], [w * 1.5, 2, w * 1.5], DARK);
        mesh(node, 'cone', [0, h * 0.98, 0], [w * 0.83, h * 0.25, w * 0.83], GOLD);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const n = mesh(
            node,
            'box',
            [Math.sin(a) * w * 0.35, h * 0.5, Math.cos(a) * w * 0.35],
            [0.2, h * 0.75, 0.2],
            '#acd8b9',
            { em: 0.4 },
          );
          n.restEm = 0.4;
          b.glows.push(n);
        }
        const halo = mesh(node, 'torus', [0, h * 0.8, 0], [w * 0.95, w * 0.95, w * 0.95], GOLD);
        halo.r[0] = 0.25;
        mesh(node, 'sphere', [0, h * 1.11, 0], [1.5, 1.5, 1.5], '#f2e5a4', { em: 0.8 });
      } else {
        mesh(node, 'box', [0, h * 0.4, 0], [w, h * 0.8, w * 0.78], IVORY);
        mesh(node, 'box', [0, h * 0.82, 0], [w * 1.1, 0.7, w * 0.85], GOLD);
        for (let i = -1; i <= 1; i++)
          mesh(node, 'box', [i * w * 0.28, h * 0.42, -w * 0.405], [w * 0.13, h * 0.52, 0.15], '#3b6e63');
        mesh(node, 'dome', [0, h * 0.87, 0], [w * 0.56, h * 0.6, w * 0.56], GOLD);
      }
      return this.finishBuilding(b);
    }
    makeCity() {
      const rng = this.rng;
      mesh(this.root, 'cylinder', [0, 0.04, -100], [115, 0.3, 115], '#678679');
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const n = mesh(this.root, 'box', [Math.sin(a) * 57, 0.27, Math.cos(a) * 57 - 100], [3, 0.2, 2], GOLD);
        n.r[1] = a;
      }
      for (let ring = 0; ring < 3; ring++) {
        const count = ring === 0 ? 13 : ring === 1 ? 21 : 28;
        const radius = 83 + ring * 53;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + 0.16 * ring;
          const x = Math.sin(a) * radius,
            z = Math.cos(a) * radius - 55;
          if (Math.abs(x) < 16 && z > 50) continue;
          const w = 9 + rng() * 9,
            h = 9 + rng() * 19;
          this.home(`home-${ring}-${i}`, [x, this.height(x, z), z], w, h, i % 4 === 0 ? 'temple' : 'home');
        }
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8,
          x = Math.sin(a) * 65,
          z = Math.cos(a) * 65 - 100;
        this.home(`spire-${i}`, [x, 0, z], 10, 48 + (i % 3) * 7, 'spire');
      }
      // An inviting approach, with tactile objects before the city's center.
      for (const s of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const x = s * (26 + i * 2),
            z = 130 - i * 24;
          this.home(`approach-${s}-${i}`, [x, 0, z], 9, 13 + i * 4, 'home');
        }
      for (let z = 160; z > -60; z -= 9) {
        mesh(this.root, 'box', [0, 0.08, z], [14, 0.13, 7], '#6d8b79');
        for (const s of [-1, 1]) mesh(this.root, 'box', [s * 7.2, 0.17, z], [0.22, 0.15, 6.4], '#b7bc83');
      }
      for (let i = 0; i < 25; i++) {
        const x = (rng() - 0.5) * 440,
          z = (rng() - 0.5) * 350;
        this.prop(
          [x, 0.4, z],
          g => {
            mesh(g, 'hex', [0, 1.1, 0], [2, 2.2, 2], GOLD);
            mesh(g, 'sphere', [0, 2.4, 0], [2.4, 2.4, 2.4], '#739b87');
          },
          1.8,
        );
      }
      // villages out past the ridges, where the garden city never reached: a spire in the middle of each
      this.outskirts({
        n: 7,
        seed: 7101,
        rMin: 560,
        rMax: 1500,
        plinth: '#4f6c62',
        build: (id, x, z, rng, i) =>
          i === 0
            ? this.home(id, [x, this.height(x, z), z], 9, 34 + rng() * 12, 'spire')
            : this.home(id, [x, this.height(x, z), z], 8 + rng() * 8, 8 + rng() * 14, i % 4 === 1 ? 'temple' : 'home'),
      });
    }
    makeRuler() {
      const base = group(this.root, [0, 0, -100]);
      mesh(base, 'cylinder', [0, 2, 0], [28, 4, 28], DARK);
      mesh(base, 'cylinder', [0, 4.2, 0], [23, 0.5, 23], GOLD);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        mesh(base, 'box', [Math.sin(a) * 11, 7, Math.cos(a) * 11], [2, 6, 2], IVORY);
      }
      const halo = mesh(base, 'torus', [0, 22, 6], [22, 22, 22], GOLD);
      halo.r[0] = Math.PI / 2;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const n = mesh(base, 'cone', [Math.sin(a) * 17, 22 + Math.cos(a) * 17, 6], [1.5, 6, 1.5], GOLD);
        n.r = [0, 0, -a];
      }
      const body = group(base);
      mesh(body, 'sphere', [0, 11.5, 0], [10, 15, 7], '#456f68');
      mesh(body, 'cone', [0, 9, 0.2], [18, 13, 11], GOLD);
      mesh(body, 'sphere', [0, 14.5, -2.7], [7, 8, 2], '#94bca5');
      for (const s of [-1, 1]) {
        const arm = mesh(body, 'cylinder', [s * 6.3, 11, -1], [2, 10, 2], '#6d9a85');
        arm.r[2] = s * 0.26;
        mesh(body, 'sphere', [s * 7.2, 7, -1.5], [3.8, 3, 3.8], '#85ad97');
        mesh(body, 'box', [s * 3.2, 5.2, -4], [3.5, 2.8, 6], GOLD);
      }
      // The crown sits on a pivot so the shared ruler animation sways it without turning it around.
      const pivot = group(base, [0, 18, 0]);
      const crown = K.Models.head(pivot, [0, 0, 0], 4.5);
      crown.r[1] = Math.PI; // face the approach (+Z)
      this.setupRuler(base, body, pivot, halo, 18, 370, 10);
    }
    makeCreatures() {
      // 0.1.x placed 66 creatures here; their random draws are kept so the trees stay where they were.
      for (let i = 0; i < 66; i++) {
        this.rng();
        this.rng();
        this.rng();
        if (this.ruinFrac > 0) this.rng();
        this.rng();
      }
    }
    residentSpec() {
      return {
        species: 'eden',
        count: 560,
        maxR: 1560,
        villages: this.villages,
        seed: 2081,
        center: [0, -40],
        radius: 235,
        minR: 18,
        road: { x: 9, z0: -60, z1: 165 },
        throne: [0, -100],
        throneR: 17,
        occupancy: b => 4 + b.w * b.h * 0.13,
      };
    }
    makeScenery() {
      const rng = this.rng;
      for (let i = 0; i < 130; i++) {
        const a = rng() * Math.PI * 2,
          r = 245 + rng() * 300,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r,
          h = 10 + rng() * 28;
        const node = group(this.root, [x, this.height(x, z), z]);
        mesh(node, 'cylinder', [0, h * 0.5, 0], [1.1, h, 1.1], '#405b52');
        const cap = mesh(node, 'dome', [0, h, 0], [11 + rng() * 16, 8, 11 + rng() * 16], '#829e83');
        cap.r[2] = (rng() - 0.5) * 0.25;
        mesh(node, 'dome', [1, h * 0.73, 0], [10, 4, 10], '#557e72');
      }
      // Distant suspended monoliths invite a detour without fake landable planets.
      for (let i = 0; i < 8; i++) {
        const a = i * 0.8 + 1,
          x = Math.sin(a) * 570,
          z = Math.cos(a) * 570;
        const g = group(this.root, [x, 85 + (i % 3) * 17, z]);
        mesh(g, 'hex', [0, 0, 0], [22, 60, 22], '#5c8478');
        mesh(g, 'cone', [0, -38, 0], [22, 25, 22], '#4b6e66').r[2] = Math.PI;
        mesh(g, 'torus', [0, 0, 0], [24, 24, 24], GOLD);
      }
      // the parkland goes on further now: more of the parasol trees, and a second ring of monoliths far out
      const r2 = M.rand(7202);
      for (let i = 0; i < 300; i++) {
        const a = r2() * Math.PI * 2,
          r = 600 + Math.sqrt(r2()) * 1900,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r;
        if (this.villages.some(v => Math.hypot(v.x - x, v.z - z) < 90)) continue;
        const h = 10 + r2() * 30,
          node = group(this.root, [x, this.height(x, z), z]);
        mesh(node, 'lowCyl', [0, h * 0.5, 0], [1.1, h, 1.1], '#405b52');
        mesh(node, 'lowDome', [0, h, 0], [11 + r2() * 16, 8, 11 + r2() * 16], r2() < 0.5 ? '#829e83' : '#6f9a7c');
      }
      for (let i = 0; i < 10; i++) {
        const a = i * 0.63 + 0.3,
          x = Math.sin(a) * 1650,
          z = Math.cos(a) * 1650;
        const g = group(this.root, [x, this.height(x, z) + 110 + (i % 3) * 30, z]);
        mesh(g, 'hex', [0, 0, 0], [26, 70, 26], '#5c8478');
        mesh(g, 'cone', [0, -45, 0], [26, 30, 26], '#4b6e66').r[2] = Math.PI;
        mesh(g, 'torus', [0, 0, 0], [28, 28, 28], GOLD);
      }
    }
    onCollapse() {
      if (this.stats.buildings === 1)
        this.game.ui.toast('붙잡아 뜯어낼 수도 있습니다.', 'Q로 견인한 뒤 뒤로 비행하세요. F는 근접 충격파입니다.', 5);
    }
    updateWorld() {
      if (this.ruler.alive && this.ruler.hp > 0) this.ruler.halo.r[2] = Math.sin(this.time * 0.15) * 0.025;
    }
  }
  K.Planets.eden = Eden;
})((window.KO ||= {}));
