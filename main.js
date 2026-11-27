/* FIRST CONTACTS — application lifecycle and actual playable loop. */
(function (K) {
  'use strict';
  const M = K.M;
  class Game {
    constructor() {
      this.started = false;
      this.paused = false;
      this.busy = false;
      this.mode = 'interior';
      this.time = 0;
      this.last = performance.now();
      this.saveElapsed = 0;
      this.descent = 0;
      this.planet = null;
      this.currentInteract = null;
      this.save = new K.SaveManager();
      this.settings = this.save.data.settings;
      this.engine = new K.Engine(document.getElementById('world'));
      this.engine.quality = this.settings.quality;
      this.engine.resize();
      this.input = new K.Input(this.engine.canvas);
      this.input.sensitivity = this.settings.sensitivity;
      this.audio = new K.AudioSystem();
      this.audio.volume = this.settings.volume;
      this.universe = new K.Universe(this.save);
      this.space = new K.Space(this);
      this.interior = new K.Interior(this);
      this.ui = new K.UI(this);
      this.cloud = new K.CloudSave(this);
      this.cloudUI = new K.CloudUI(this);
      this.input.onPause = () => {
        if (this.busy || this.ui.starting) return;
        if (this.interior.labPose?.table) this.interior.leaveTable();
        else if (this.paused) this.ui.close();
        else this.ui.menu();
      };
      this.input.onBlur = () => {
        if (this.started && !this.paused && !this.busy) this.ui.menu();
      };
      // Phones drop the GPU context in the background. Wait for it to come back and rebuild, instead of failing.
      this.contextLost = false;
      this.engine.canvas.addEventListener('webglcontextlost', e => {
        e.preventDefault();
        console.warn('WebGL context lost; waiting for the browser to restore it.');
        this.contextLost = true;
        this.audio.hold(true);
      });
      this.engine.canvas.addEventListener('webglcontextrestored', () => {
        try {
          this.engine.restore();
          console.warn('WebGL context restored.');
          this.contextLost = false;
          if (!this.paused && !document.hidden) this.audio.hold(false);
        } catch (e) {
          this.paused = true;
          this.ui.fatal(
            new Error('그래픽 연결이 중단되었습니다. 다른 탭을 닫은 뒤 다시 시도해 주세요. 저장된 트로피는 유지됩니다.'),
          );
        }
      });
      // Hidden tab or minimized window: every sound stops at once and resumes only when play resumes.
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.audio.hold(true);
        else {
          this.engine.resize();
          if (this.started && !this.paused && !this.contextLost) this.audio.hold(false);
        }
      });
      window.addEventListener('resize', () => this.engine.resize());
      window.addEventListener('pagehide', () => this.persist());
      window.addEventListener('beforeunload', () => this.persist());
      this.debugMode = new URLSearchParams(location.search).has('debug');
      this.frameTimes = [];
      this.fps = 0;
      this.qualityTimer = 0;
      this.setEnvironment();
      this.ui.updateStartLabel();
      if (this.debugMode) this.setupDebug();
      this.ui.loading(true);
      requestAnimationFrame(t => this.frame(t));
    }
    start() {
      if (this.started) return;
      this.started = true;
      this.paused = false;
      this.input.enabled = true;
      this.input.clear();
      this.audio.start();
      this.ui.start();
      this.interior.position = [0, 1.85, -5];
      this.interior.yaw = 0;
      this.interior.pitch = 0;
      this.ui.toast('NØMAD에 돌아왔습니다.', this.input.mobile
        ? '앉기를 누르면 모선을 조종합니다.'
        : 'E로 조종석에 앉기 · 마우스 고정이 안 되면 우클릭 드래그', 7);
      this.input.requestLock();
      if (!this.save.available)
        setTimeout(
          () => this.ui.toast('자동 저장을 사용할 수 없습니다.', '메뉴의 저장 내보내기를 사용하세요.', 6),
          7000,
        );
    }
    nearPlanet() {
      return (
        !this.universe.destroyed(this.space.target.id) &&
        this.universe.surfaceReady(this.space.target.id) &&
        this.space.distance() <= this.space.deployAltitude
      );
    }
    canDeploy() {
      return this.nearPlanet() && !this.space.auto && !this.space.weapons.inFlight(this.space.target.id);
    }
    flightAction() {
      if (this.mode !== 'space' || this.busy) return;
      if (this.canDeploy()) this.launch();
      else this.space.toggleAuto();
    }
    enterSpace() {
      if (this.busy) return;
      this.mode = 'space';
      this.ui.mode('space');
      this.input.clear();
      this.setEnvironment();
      this.audio.metal();
      this.ui.toast('조종 계통 연결', this.input.mobile
        ? '자동항해로 목적지에 접근하세요. 미사일을 누른 채 끌면 조준할 수 있습니다.'
        : 'M · 성도　/　T · 선택한 행성으로 항해　/　좌클릭 유지 · 미사일', 4);
    }
    enterInterior(where = 'bridge') {
      if (this.busy) return;
      // A manually piloted ship holds station when the pilot leaves the chair.
      if (!this.space.auto && (!this.space.warp || this.nearPlanet())) {
        this.space.velocity = [0, 0, 0];
        this.space.warp = false;
      }
      this.space.save();
      this.mode = 'interior';
      this.currentInteract = null;
      this.interior.spawn(where);
      this.ui.mode('interior');
      this.input.clear();
      this.setEnvironment();
      this.audio.stop();
    }
    interact() {
      if (!this.input.enabled) return;
      if (this.mode === 'space') this.enterInterior('bridge');
      else if (this.mode === 'interior') this.currentInteract?.action();
    }
    inspectTrophy(index) {
      this.ui.inspect(index);
    }
    setEnvironment() {
      const e = this.engine;
      K.applySkyPalette(e);
      e.atmosphere = 0;
      e.warp = 0;
      e.noShadows = false;
      e.tint = [1, 1, 1];
      e.sunK = 1;
      e.life.fill(0);
      e.wounds.fill(0);
      e.skyBasis = null;
      e.skyOffset = [0, 0, 0];
      if (this.mode === 'planet') {
        e.surface = 1;
        e.fog = [0.61, 0.75, 0.67];
        e.fogD = 0.0016;
        e.ambient = 0.65;
        e.sun = [-0.7, 0.85, 0.32];
        const env = this.planet?.environment;
        if (env) {
          e.fog = env.fog.slice();
          e.fogD = env.fogD;
          e.ambient = env.ambient;
          e.sun = env.sun.slice();
          e.noShadows = !!env.noShadows;
          if (env.tint) e.tint = env.tint.slice();
          if (env.sunK != null) e.sunK = env.sunK;
          K.applySkyPalette(e, env);
        }
      } else {
        e.surface = 0;
        e.fog = [0.003, 0.008, 0.014];
        e.fogD = 0;
        e.ambient = this.mode === 'space' ? 0.32 : 0.37;
        e.sun = [-0.55, 0.6, 0.65];
      }
      e.impact = 0;
    }
    async launch(force = false) {
      if (this.busy) return;
      const def = this.space.target,
        id = def.id;
      if (this.universe.destroyed(id)) {
        this.ui.toast('이미 소멸한 행성입니다.', '상륙하거나 왕을 회수할 수 없습니다.');
        return;
      }
      if (!this.universe.surfaceReady(id)) {
        this.ui.toast(def.name + ' · 고체 지표 없음', '내려설 곳이 없습니다. 궤도 탐사와 모선 포격은 가능합니다.');
        return;
      }
      if (this.space.weapons.inFlight(id)) {
        this.ui.toast('포격 중에는 출격할 수 없습니다.', '발사한 미사일이 모두 도착한 뒤 다시 탑승하세요.');
        return;
      }
      if (!force && !this.nearPlanet()) {
        this.ui.toast(
          '모선이 아직 행성에서 멉니다.',
          '성도에서 창공까지 접근을 선택하거나 모선으로 구름층까지 비행하세요.',
          4,
        );
        return;
      }
      this.busy = true;
      this.space.auto = false;
      this.space.warp = false;
      this.space.velocity = [0, 0, 0];
      this.input.clear();
      this.input.enabled = false;
      this.audio.stop();
      try {
        await this.ui.transition(
          def.name.toUpperCase() + ' / ' + id.toUpperCase(),
          '구름 위의 모선에서 출격 · 지표로 강하',
          async () => {
            const Planet = await K.loadPlanet(id);
            this.activePlanetId = id;
            this.planet = new Planet(this, def);
            if (this.universe.landingTarget === id) this.planet.useSettlementApproach?.();
            K.releaseSurvivors(this);
            this.mode = 'planet';
            this.ui.mode('planet');
            this.setEnvironment();
            this.descent = 3.6;
            this.input.enabled = true;
          },
          true,
        );
      } catch (e) {
        this.ui.fatal(e);
      } finally {
        this.busy = false;
        this.input.enabled = true;
      }
    }
    async returnHome() {
      if (this.busy || this.mode !== 'planet') return;
      this.busy = true;
      this.input.enabled = false;
      this.input.clear();
      this.audio.stop();
      const wasNew = this.planet.newCapture,
        wasBarren = this.planet.barren,
        arrival = this.planet.config?.arrival || ['전시 복도에 새 머리가 도착했습니다.', '파괴정 뒤쪽 전시 복도에 새로 채워진 자리가 있습니다.'];
      try {
        await this.ui.transition('NØMAD', this.space.target.name + ' 상공 · 모선 귀환', () => {
          this.planet.snapshot();
          this.planet.dispose();
          this.planet = null;
          this.mode = 'interior';
          this.descent = 0;
          this.interior.spawn('hangar', wasNew);
          this.ui.mode('interior');
          this.setEnvironment();
          this.persist('checkpoint');
        });
        if (!wasBarren)
          this.ui.toast(
            wasNew ? arrival[0] : '다시, 고요. ',
            wasNew ? arrival[1] : '원할 때 다시 내려갈 수 있습니다.',
            7,
          );
      } catch (e) {
        this.ui.fatal(e);
      } finally {
        this.busy = false;
        this.input.clear();
        this.input.enabled = true;
      }
    }
    // A fault in one world's own code sends the craft back up to the ship instead of stopping the whole game.
    // The message stays on screen so it can be reported. A second fault soon after is let through as fatal.
    recover(e) {
      const now = performance.now();
      if (this.mode !== 'planet' || !this.planet || now - (this.lastRecover ?? -1e9) < 20000) return false;
      this.lastRecover = now;
      const planet = this.planet;
      this.planet = null;
      try {
        planet.snapshot();
      } catch {}
      try {
        planet.dispose();
      } catch {}
      try {
        document.exitPointerLock?.();
        this.busy = false;
        this.descent = 0;
        this.mode = 'interior';
        this.interior.spawn('hangar');
        this.ui.mode('interior');
        this.setEnvironment();
        this.audio.stop();
        this.input.clear();
        this.input.enabled = true;
        this.persist('checkpoint');
        this.ui.toast('문제가 생겨 모선으로 돌아왔습니다', '오류: ' + String(e?.message || e).slice(0, 140), 10);
        return true;
      } catch {
        return false;
      }
    }
    persist(reason = 'auto') {
      // The file import has committed the replacement. Old scene snapshots
      // from visibilitychange, beforeunload and pagehide must leave it intact.
      if (this.reloadingSave) return;
      this.space?.save();
      if (this.planet) this.planet.snapshot();
      this.save.data.settings = this.settings;
      this.save.write(reason);
    }
    frame(now) {
      const raw = Math.max(0, (now - this.last) / 1000);
      this.last = now;
      if (this.contextLost) {
        requestAnimationFrame(t => this.frame(t));
        return;
      }
      this.engine.resize();
      let dt = Math.min(raw, 0.04);
      this.time += dt;
      try {
        if (!this.paused) {
          if (!this.started) {
            this.interior.syncOutside();
            this.engine.camera = {
              p: [-0.8, 2.6, -11.5],
              yaw: -0.19 + Math.sin(this.time * 0.1) * 0.035,
              pitch: 0.035,
              roll: 0,
              fov: 78,
            };
          } else if (this.mode === 'interior') {
            this.space.update(dt, this.input, true);
            if (!this.busy) this.interior.update(dt, this.input);
            this.ui.setStatus(
              this.space.auto ? '자동항해 중 · 선내 보행' : this.space.warp ? '도약 중 · 선내 보행' : '선내 보행',
              'NØMAD',
            );
          } else if (this.mode === 'space') {
            if (!this.busy) this.space.update(dt, this.input);
          } else if (this.mode === 'planet' && this.planet) {
            this.space.weapons.update(dt, this.input, false);
            if (this.descent > 0) {
              this.descent = Math.max(0, this.descent - dt);
              const t = 1 - this.descent / 3.6,
                q = t * t * (3 - 2 * t);
              const v = this.planet.vehicle;
              const spawn = this.planet.spawn || { p: [0, 12, 175], yaw: 0, pitch: -0.055 };
              v.p = [spawn.p[0] + 25 * (1 - q), spawn.p[1] + 113 * (1 - q), spawn.p[2] + 125 * (1 - q)];
              v.yaw = spawn.yaw;
              v.pitch = M.lerp(-0.36, spawn.pitch, q);
              this.planet.update(dt, this.descent > 0 ? this.input.idle : this.input);
              if (!this.descent && !this.planet.barren && this.ui.toastUntil < performance.now())
                this.ui.toast(this.space.target.name + ' · 강하 완료');
            } else if (!this.busy) this.planet.update(dt, this.input);
          }
          if (this.started && !this.busy) {
            const speed =
              this.mode === 'space'
                ? M.len(this.space.velocity)
                : this.mode === 'planet' && this.planet
                  ? M.len(this.planet.vehicle.velocity)
                  : 0;
            this.audio.tick(dt, speed, this.mode, this.mode === 'planet' && this.planet?.vehicle.firing);
          }
        }
        const root =
          this.mode === 'planet' && this.planet
            ? this.planet.root
            : this.mode === 'space'
              ? this.space.root
              : this.interior.root;
        const overlay =
          this.mode === 'planet' && this.planet
            ? this.planet.vehicle.rig.root
            : this.mode === 'space'
              ? this.space.cockpit
              : null;
        this.engine.render(root, this.time, overlay);
        this.ui.update();
        if (this.started && !this.paused) this.labels();
        this.input.end();
        this.saveElapsed += dt;
        if (this.saveElapsed > 12) {
          this.saveElapsed = 0;
          this.persist();
        }
        this.frameTimes.push(raw);
        if (this.frameTimes.length > 60) this.frameTimes.shift();
        this.fps = 1 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length || 0.016);
        this.qualityTimer += raw;
        if (this.qualityTimer > 4 && !this.paused && !this.busy) {
          this.qualityTimer = 0;
          if (this.settings.quality === 'balanced' && this.fps < 26 && this.engine.resolutionScale > 0.62) {
            this.engine.resolutionScale = Math.max(0.62, this.engine.resolutionScale - 0.12);
            this.engine.resize();
          }
        }
        if (this.debugMode) this.debugOverlay();
      } catch (e) {
        console.error(e);
        if (!this.recover(e)) {
          this.paused = true;
          this.audio.stop();
          this.ui.fatal(e);
          return;
        }
      }
      requestAnimationFrame(t => this.frame(t));
    }
    labels() {
      const root = document.getElementById('worldLabels');
      if (this.mode === 'planet' && this.planet?.labels) return this.planetLabels(root, this.planet.labels());
      if (this.mode !== 'interior' || this.interior.labPose) {
        if (root.childElementCount) root.innerHTML = '';
        return;
      }
      let items = [
        { id: 'bridge', p: [0, 4.6, -13], en: '01 / BRIDGE', ko: '조종실' },
        { id: 'hangar', p: [0, 4.9, 15], en: '02 / HANGAR', ko: '격납고' },
        { id: 'gallery', p: [0, 5.0, 27.1], en: '03 / ARCHIVE', ko: '전시 복도' },
        { id: 'lab', p: [0, 4.5, (this.interior.labStart || 40) - 1.6], en: '04 / LAB', ko: '실험실' },
      ];
      if (root.childElementCount !== items.length || !document.getElementById('lbl-lab')) {
        root.innerHTML = items
          .map(i => `<div class="worldLabel" id="lbl-${i.id}">${i.en}<span>${i.ko}</span></div>`)
          .join('');
      }
      for (const i of items) {
        const p = M.project(i.p, this.engine.vp, innerWidth, innerHeight);
        const el = document.getElementById('lbl-' + i.id);
        const dist = M.dist(this.engine.camera.p, i.p);
        el.style.display =
          p.front && dist < 34 && p.x > 50 && p.x < innerWidth - 50 && p.y > 85 && p.y < innerHeight - 100
            ? ''
            : 'none';
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
        el.style.opacity = M.clamp(1 - dist / 45, 0.15, 0.75);
      }
    }
    // Words fixed to a place in the world, seen only from near enough to read them.
    planetLabels(root, items) {
      const key = items.map(i => i.id).join('|');
      if (root.dataset.key !== key || (items.length && !document.getElementById('lbl-' + items[0].id))) {
        root.dataset.key = key;
        root.innerHTML = items
          .map(i => `<div class="worldLabel ${i.cls || ''}" id="lbl-${i.id}">${i.en}<span>${i.ko}</span></div>`)
          .join('');
      }
      for (const i of items) {
        const p = M.project(i.p, this.engine.vp, innerWidth, innerHeight);
        const el = document.getElementById('lbl-' + i.id);
        if (!el) continue;
        const dist = M.dist(this.engine.camera.p, i.p),
          far = i.range || 160;
        const show = p.front && dist < far && p.x > 30 && p.x < innerWidth - 30 && p.y > 60 && p.y < innerHeight - 80;
        el.style.display = show ? '' : 'none';
        if (!show) continue;
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
        el.style.opacity = M.clamp((1 - dist / far) * 1.6, 0, 0.95);
      }
    }
    setupDebug() {
      const g = this;
      window.__KO__ = {
        game: g,
        snapshot: () => ({
          mode: g.mode,
          started: g.started,
          paused: g.paused,
          busy: g.busy,
          position:
            g.mode === 'planet' ? g.planet?.vehicle.p : g.mode === 'space' ? g.space.position : g.interior.position,
          nearPlanet: g.nearPlanet(),
          distance: g.space.distance(),
          atmosphere: g.space.atmosphere(),
          autopilot: g.space.auto,
          target: g.space.target.id,
          worlds: g.universe.planets.length,
          annihilated: g.universe.countDestroyed(),
          missiles: g.space.weapons.missiles.length,
          burstCount: g.space.weapons.bursts.length,
          renderPosition: g.engine.camera.p,
          trophies: g.save.data.trophies.length,
          buildings: g.planet?.buildings.filter(x => x.alive).length,
          destroyed: g.planet?.destroyed.size,
          creatures: g.planet?.residents
            ? g.planet.residents.list.filter(x => x.alive).length
            : g.planet?.creatures.filter(x => x.alive).length,
          signal: g.planet?.residents?.signal() ?? null,
          corpses: g.planet?.residents?.corpses.length ?? 0,
          residentMode: g.planet?.residents?.mode,
          ruler: g.planet
            ? {
                hp: g.planet.ruler.hp,
                captured: g.planet.ruler.captured,
                grabbing: g.planet.vehicle.grab?.kind,
                tension: g.planet.vehicle.tension,
              }
            : null,
          geometries: Object.keys(g.engine.geometries).length,
          drawCalls: g.engine.drawCalls,
          triangles: g.engine.triangles,
          fps: Math.round(g.fps),
        }),
        goto: async mode => {
          if (!g.started) g.start();
          document.exitPointerLock?.();
          if (mode === 'planet') {
            await g.launch(true);
            g.descent = 0;
            g.planet.vehicle.p = (g.planet.spawn?.p || [0, 12, 175]).slice();
          } else if (mode === 'space') g.enterSpace();
          else g.enterInterior('bridge');
        },
        aim: p => {
          let v = g.mode === 'planet' ? g.planet.vehicle : g.mode === 'space' ? g.space : g.interior;
          const a = M.aim(v.p || v.position, p);
          v.yaw = a.yaw;
          v.pitch = a.pitch;
        },
        downloadSave: () => g.save.export(),
      };
      document.getElementById('debug').classList.remove('hidden');
    }
    debugOverlay() {
      const s = window.__KO__.snapshot();
      document.getElementById('debug').textContent =
        `${s.mode} / ${s.fps} FPS\n${s.drawCalls} draws / ${Math.round(s.triangles / 1000)}k tris\n${s.geometries} geometry buffers\nP ${s.position?.map(x => x.toFixed(1)).join(', ')}\n${s.destroyed ?? 0} buildings / ${s.trophies} trophies`;
    }
  }
  K.Game = Game;
  function fatal(e) {
    console.error(e);
    document.getElementById('loading')?.classList.add('hidden');
    document.getElementById('fatal')?.classList.remove('hidden');
    const text = document.getElementById('fatalText');
    if (text) text.textContent = String(e?.message || e);
  }
  window.addEventListener('unhandledrejection', e => fatal(e.reason));
  // A file named in manifest.js failed to load (release layout): say which, do not start half a game.
  if (K.LoadError) fatal(K.LoadError);
  else
    try {
      new Game();
    } catch (e) {
      fatal(e);
    }
})((window.KO ||= {}));
