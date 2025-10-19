import { STAGES, LOGICAL_WIDTH, LOGICAL_HEIGHT, TOP_BOTTOM_MARGIN } from './stage.js';
import { Rocket } from './rocket.js';
import { Cave } from './cave.js';
import { clamp, formatKm } from './util.js';
import { ParticleSystem } from './particle.js';
import { soundManager } from './sound.js';

// ゲームの基本設定
const BASE_SETTLE_TIME = 3.0;  // 基本安定時間
const STAGE_GRACE_TIME = 3.0;  // ステージ開始時の無敵時間
const BEST_KEY = 'caveEscapeBestPx';  // ローカルストレージのキー
const corridorPattern = createCorridorPattern();  // 洞窟の背景パターン

/**
 * メインゲームクラス
 * ゲーム全体の状態管理と更新処理を担当
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // ゲーム状態
    this.state = 'title';
    this.stageIndex = 0;
    this.distancePx = 0;  // 現在のステージでの距離
    this.totalDistancePx = 0;  // 累計距離
    this.bestDistancePx = Number(window.localStorage?.getItem(BEST_KEY) || 0);  // ベストスコア

    // 時間管理
    this.accum = 0;
    this.lastTime = 0;
    this.fixedDt = 1 / 60;  // 固定時間ステップ
    this.inputThrust = false;  // 推力入力状態

    // ゲームタイマー
    this.timeSinceStart = 0;  // ゲーム開始からの経過時間
    this.sinceStageStart = 0;  // ステージ開始からの経過時間
    this.settleTimeBase = BASE_SETTLE_TIME;  // 基本安定時間
    this.settleTimeCurrent = this.settleTimeBase;  // 現在の安定時間
    this.graceTime = STAGE_GRACE_TIME;  // 無敵時間
    this.autoThrustTime = 0.0;  // 自動推力時間
    this.needsClockReset = false;  // 時計リセットフラグ

    // エフェクト
    this.particles = new ParticleSystem();  // パーティクルシステム
    this.hitFlash = 0;  // ヒットフラッシュ
    this.rocketVisible = true;  // ロケット表示フラグ

    // ゲームオブジェクト
    this.rocket = null;
    this.cave = null;
    this._setupStage({ keepRocket: false, resetRun: true });
  }

  _stageParams() {
    const s = STAGES[this.stageIndex];
    return {
      minGap: s.minGap,
      period: s.period,
      slopePer100: s.slopePer100,
      colorTop: s.colorTop,
      colorBot: s.colorBot,
      colorCorridor: s.colorCorridor,
    };
  }

  _setupStage({ keepRocket, resetRun }) {
    if (resetRun) {
      this.totalDistancePx = 0;
    }

    this.distancePx = 0;
    this.cave = new Cave(this._stageParams());

    this.timeSinceStart = 0;
    this.sinceStageStart = 0;
    this.hitFlash = 0;
    this.rocketVisible = true;
    this.particles.clear();

    if (keepRocket && this.rocket) {
      const y = Math.round(this.cave.centerAtX(this.rocket.x));
      this.rocket.y = y;
      this.rocket.vy = 0;
      this.settleTimeCurrent = 0;
    } else {
      const spawnX = 120;
      const spawnY = Math.round(this.cave.centerAtX(spawnX));
      this.rocket = new Rocket(spawnX, spawnY);
      this.settleTimeCurrent = this.settleTimeBase;
    }
  }

  currentRunDistancePx() {
    return this.totalDistancePx + this.distancePx;
  }

  recordBestDistance() {
    const runPx = this.currentRunDistancePx();
    if (runPx > this.bestDistancePx) {
      this.bestDistancePx = runPx;
      try {
        window.localStorage?.setItem(BEST_KEY, String(runPx));
      } catch {
        /* ignore storage errors */
      }
    }
  }

  setThrust(on) {
    this.inputThrust = on;
    this.rocket.setThrust(on);
    
    // エンジン音の制御
    if (on && this.state === 'playing') {
      soundManager.startEngine();
    } else {
      soundManager.stopEngine();
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      soundManager.stopEngine();  // 一時停止時にエンジン音を停止
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.needsClockReset = true;
    }
  }

  start() {
    this.stageIndex = 0;
    this._setupStage({ keepRocket: false, resetRun: true });
    this.rocket.setThrust(false);
    this.state = 'playing';
    this.needsClockReset = true;
    soundManager.stopEngine();  // ゲーム開始時にエンジン音を確実に停止
    soundManager.playStart();
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  }

  restart() {
    this.state = 'title';
    this.stageIndex = 0;
    soundManager.stopEngine();  // エンジン音を停止
    this._setupStage({ keepRocket: false, resetRun: true });
  }

  nextStageOrClear() {
    const currentStage = STAGES[this.stageIndex];
    this.totalDistancePx += currentStage.distancePx;

    if (this.stageIndex + 1 >= STAGES.length) {
      this.state = 'gameclear';
      this.rocketVisible = true;
      this.particles.clear();
      this.recordBestDistance();
      soundManager.stopEngine();  // エンジン音を停止
      soundManager.playStageClear();
      if (navigator.vibrate) navigator.vibrate([20, 40, 80]);
      return;
    }

    this.stageIndex += 1;
    this._setupStage({ keepRocket: true, resetRun: false });
    this.state = 'playing';
    this.needsClockReset = true;
    soundManager.playStageClear();
    if (navigator.vibrate) navigator.vibrate([15, 30, 20]);
  }

  updateFrame(dt) {
    if (this.state !== 'playing') return;

    this.timeSinceStart += dt;
    this.sinceStageStart += dt;

    const speed = STAGES[this.stageIndex].speed;
    const dx = speed * dt;
    this.distancePx += dx;
    this.cave.update(dx);

    const thrustAuto = this.timeSinceStart < this.autoThrustTime;
    const inSettle = this.timeSinceStart < this.settleTimeCurrent;
    this.rocket.setThrust(!inSettle && (this.inputThrust || thrustAuto));

    if (inSettle) {
      const cy = this.cave.centerAtX(this.rocket.x);
      this.rocket.y = cy;
      this.rocket.vy = 0;
    } else {
      this.rocket.update(dt);
    }

    this.particles.update(dt);

    this.rocket.y = clamp(
      this.rocket.y,
      TOP_BOTTOM_MARGIN + 10,
      LOGICAL_HEIGHT - TOP_BOTTOM_MARGIN - 10,
    );

    const inGrace = this.sinceStageStart < this.graceTime;
    if (!inGrace && this.cave.collides(this.rocket.polygon())) {
      this.state = 'gameover';
      if (this.rocketVisible) {
        this.particles.explosion(this.rocket.x, this.rocket.y);
        this.hitFlash = 1.0;
        this.rocketVisible = false;
      }
      this.recordBestDistance();
      soundManager.stopEngine();  // エンジン音を停止
      soundManager.playGameOver();
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      return;
    }

    const clearPx = STAGES[this.stageIndex].distancePx;
    if (this.distancePx >= clearPx) {
      const prevState = this.state;
      this.nextStageOrClear();
      if (prevState === 'playing' && this.state === 'gameclear') {
        return;
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // ステージごとの通路色を使用
    const corridorColor = this.cave.params.colorCorridor || '#f3f4f8';
    ctx.fillStyle = corridorColor;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    if (corridorPattern) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = corridorPattern;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      ctx.restore();
    }

    this.cave.draw(ctx);
    if (this.rocketVisible) this.rocket.draw(ctx);
    this.particles.draw(ctx);

    if (this.hitFlash > 0) {
      const alpha = Math.min(0.7, this.hitFlash);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.hitFlash = Math.max(0, this.hitFlash - 2.5 * (1 / 60));
    }
  }

  formattedBestDistance() {
    return formatKm(this.bestDistancePx);
  }

  formattedCurrentDistance() {
    return formatKm(this.currentRunDistancePx());
  }
}
function createCorridorPattern() {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3f4f8';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(90, 100, 120, 0.06)';
  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.6 + 0.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(130, 140, 160, 0.05)';
  for (let i = 0; i < 80; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = Math.random() * 6 + 2;
    const h = Math.random() * 3 + 1;
    ctx.fillRect(x, y, w, h);
  }

  return ctx.createPattern(canvas, 'repeat');
}
