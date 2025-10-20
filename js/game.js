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
    this.nightSkyMode = false;  // 夜空モードフラグ
    this.invincibleMode = false;  // 無敵モードフラグ
    this.speedSlowdownMode = false;  // スピード減速モードフラグ

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

  /**
   * 無敵モードを設定（デバッグ用）
   * @param {boolean} enabled - 無敵モードの有効/無効
   */
  setInvincibleMode(enabled) {
    this.invincibleMode = enabled;
  }

  /**
   * スピード減速モードを設定
   * @param {boolean} enabled - スピード減速モードの有効/無効
   */
  setSpeedSlowdownMode(enabled) {
    this.speedSlowdownMode = enabled;
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
    
    // デバッグ用：無敵モードを有効にする
    this.setInvincibleMode(true);
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

    let speed = STAGES[this.stageIndex].speed;
    
    // ステージ5の最後20kmでスピード減速
    if (this.stageIndex === 4 && this.speedSlowdownMode) {
      const stage5Total = STAGES[4].distancePx;  // 150km
      const slowdownStart = stage5Total - 20000;  // 130km以降
      const remainingDistance = stage5Total - this.distancePx;
      
      if (remainingDistance <= 20000) {  // 最後の20km
        const slowdownProgress = (20000 - remainingDistance) / 20000;  // 0-1の進行度
        const originalSpeed = STAGES[4].speed;  // 800
        const finalSpeed = 100;
        
        // 徐々にスピードを落とす（線形補間）
        speed = originalSpeed - (originalSpeed - finalSpeed) * slowdownProgress;
      }
    }
    
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
    if (!inGrace && !this.invincibleMode && this.cave.collides(this.rocket.polygon())) {
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

    // ステージ5の最後20kmで夜空モードとスピード減速モードに切り替え
    if (this.stageIndex === 4 && this.distancePx >= 5000) {  // ステージ5（インデックス4）で50km以降（デバッグ用）
      if (!this.nightSkyMode) {
        this.nightSkyMode = true;
        this.cave.setNightSkyMode(true);
      }
      if (!this.speedSlowdownMode) {
        this.speedSlowdownMode = true;
      }
    } else if (this.nightSkyMode) {
      this.nightSkyMode = false;
      this.cave.setNightSkyMode(false);
      this.speedSlowdownMode = false;
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
