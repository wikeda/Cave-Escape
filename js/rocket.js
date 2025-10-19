import { clamp } from './util.js';

/**
 * ロケットクラス
 * 物理演算と描画を担当
 */
export class Rocket {
  constructor(x, y) {
    this.x = x;  // X座標
    this.y = y;  // Y座標
    this.vy = 0;  // Y方向の速度
    this.thrusting = false;  // 推力状態
    this.thrustStartTime = 0;  // 推力開始時刻
    
    // 機体の基本形状（細長い円柱形）
    this.hull = [
      { x: 20, y: 0 },     // 先端（やや丸みを帯びた尖り）
      { x: 6, y: -6 },     // 上側（コックピット部分）
      { x: -2, y: -8 },    // 上側（機体中央）
      { x: -10, y: -6 },   // 上側（エンジン接続部）
      { x: -16, y: 0 },    // 後端中央
      { x: -10, y: 6 },    // 下側（エンジン接続部）
      { x: -2, y: 8 },     // 下側（機体中央）
      { x: 6, y: 6 },      // 下側（コックピット部分）
    ];
    
    // 窓の形状（小さな窓1つ）
    this.windows = [
      { x: 8, y: -3, width: 6, height: 4, type: 'main' },      // 小さな窓
    ];
    
    // エンジン部分の形状（四角形2つ、上下配置）
    this.engines = [
      { x: -14, y: -8, width: 6, height: 4, type: 'top' },     // 上エンジン
      { x: -14, y: 4, width: 6, height: 4, type: 'bottom' },   // 下エンジン
    ];
    
    // 物理パラメータ
    this.maxVy = 700;  // 最大速度（ピクセル/秒）
    this.g = 900;      // 重力（ピクセル/秒²）
    this.a = 1200;     // 推力（ピクセル/秒²）
  }

  setThrust(on) {
    if (on && !this.thrusting) {
      // 推力開始時：時刻を記録
      this.thrustStartTime = Date.now() * 0.001;
    }
    this.thrusting = on;
  }

  update(dt) {
    const ay = this.thrusting ? -this.a : this.g;
    this.vy += ay * dt;
    this.vy = clamp(this.vy, -this.maxVy, this.maxVy);
    this.y += this.vy * dt;
  }

  polygon() {
    return this.hull.map((p) => ({ x: p.x + this.x, y: p.y + this.y }));
  }

  /**
   * 機体の基本形状を描画（シンプルな銀色）
   */
  drawBody(ctx) {
    const poly = this.polygon();
    ctx.save();
    
    if (this.thrusting) {
      ctx.shadowColor = 'rgba(255, 150, 80, 0.55)';
      ctx.shadowBlur = 10;
    }
    
    // 機体の基本色（銀色）
    ctx.fillStyle = this.thrusting ? '#b0b0b0' : '#a0a0a0';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // 機体のエッジ
    ctx.strokeStyle = this.thrusting ? '#808080' : '#707070';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * 窓を描画（シンプルな四角形）
   */
  drawWindows(ctx) {
    ctx.save();
    
    this.windows.forEach(window => {
      const x = this.x + window.x;
      const y = this.y + window.y;
      
      // 窓のフレーム
      ctx.fillStyle = '#404040';
      ctx.fillRect(x - 1, y - 1, window.width + 2, window.height + 2);
      
      // 窓ガラス
      ctx.fillStyle = '#202020';
      ctx.fillRect(x, y, window.width, window.height);
    });
    
    ctx.restore();
  }


  /**
   * エンジン部分を描画（シンプルな四角形、暗いグレー）
   */
  drawEngines(ctx) {
    ctx.save();
    
    this.engines.forEach(engine => {
      const x = this.x + engine.x;
      const y = this.y + engine.y;
      
      // エンジンの基本色（暗いグレー）
      ctx.fillStyle = '#606060';
      ctx.fillRect(x, y, engine.width, engine.height);
      
      // エンジンのエッジ
      ctx.strokeStyle = '#404040';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, engine.width, engine.height);
    });
    
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();
    
    // 描画順序（シンプル）
    // 1. 機体の基本形状を描画
    this.drawBody(ctx);
    
    // 2. 窓を描画
    this.drawWindows(ctx);
    
    // 3. エンジン部分を描画
    this.drawEngines(ctx);
    
    // 4. 炎エフェクト（推力時）
    if (this.thrusting) {
      this.drawFlame(ctx);
    }
    
    ctx.restore();
  }

  /**
   * 炎エフェクトを描画（クリック中のみ色変化：赤→オレンジ→黄→青、離すと赤にリセット）
   */
  drawFlame(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;
    
    let r, g, b;
    
    if (this.thrusting) {
      // クリック中：推力開始からの経過時間で色変化
      const currentTime = Date.now() * 0.001;
      const thrustDuration = currentTime - this.thrustStartTime;
      const colorPhase = Math.min(thrustDuration / 1.0, 1.0); // 0-1の範囲で1.0秒で完了、その後1.0で固定
      
      // 色の補間計算
      // 0.0-0.3秒: 赤 → オレンジ
      // 0.3-0.6秒: オレンジ → 黄
      // 0.6-1.0秒: 黄 → 青
      // 1.0秒以降: 青のまま
      
      if (colorPhase < 0.3) {
        // 赤 → オレンジ (0.0-0.3秒)
        const t = colorPhase / 0.3;
        r = Math.floor(255 * (1 - t) + 255 * t);
        g = Math.floor(0 * (1 - t) + 140 * t);
        b = Math.floor(0 * (1 - t) + 0 * t);
      } else if (colorPhase < 0.6) {
        // オレンジ → 黄 (0.3-0.6秒)
        const t = (colorPhase - 0.3) / 0.3;
        r = Math.floor(255 * (1 - t) + 255 * t);
        g = Math.floor(140 * (1 - t) + 255 * t);
        b = Math.floor(0 * (1 - t) + 0 * t);
      } else {
        // 黄 → 青 (0.6-1.0秒、その後青のまま)
        const t = (colorPhase - 0.6) / 0.4;
        r = Math.floor(255 * (1 - t) + 0 * t);
        g = Math.floor(255 * (1 - t) + 0 * t);
        b = Math.floor(0 * (1 - t) + 255 * t);
      }
    } else {
      // クリックしていない時：赤色（デフォルト）
      r = 255;
      g = 0;
      b = 0;
    }
    
    const gradient = ctx.createLinearGradient(this.x - 36, this.y, this.x - 10, this.y);
    gradient.addColorStop(0, `rgba(${r},${g},${b},0.05)`);
    gradient.addColorStop(0.6, `rgba(${r},${Math.floor(g * 1.2)},${Math.floor(b * 1.2)},0.75)`);
    gradient.addColorStop(1, `rgba(${r},${Math.floor(g * 1.3)},${Math.floor(b * 1.3)},0.95)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.x - 18, this.y - 7);
    ctx.lineTo(this.x - 36, this.y);
    ctx.lineTo(this.x - 18, this.y + 7);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}
