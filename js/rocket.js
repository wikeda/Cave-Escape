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
    
    // 機体の基本形状（流線形のロケット）
    this.hull = [
      { x: 20, y: 0 },     // 先端
      { x: 8, y: -8 },     // 上側（コックピット部分）
      { x: 2, y: -10 },    // 上側（機体中央）
      { x: -8, y: -8 },    // 上側（翼接続部）
      { x: -15, y: -4 },   // 上側（エンジン部）
      { x: -18, y: 0 },    // 後端中央
      { x: -15, y: 4 },    // 下側（エンジン部）
      { x: -8, y: 8 },     // 下側（翼接続部）
      { x: 2, y: 10 },     // 下側（機体中央）
      { x: 8, y: 8 },      // 下側（コックピット部分）
    ];
    
    // 窓の形状（楕円形のコックピット）
    this.windows = [
      { x: 6, y: -6, width: 8, height: 6, type: 'main' },      // メインコックピット
      { x: 10, y: -2, width: 4, height: 3, type: 'side' },     // サイド窓
    ];
    
    // 翼の形状（流線形）
    this.wings = [
      { x: -6, y: -12, width: 12, height: 8, type: 'top' },     // 上翼
      { x: -6, y: 4, width: 12, height: 8, type: 'bottom' },    // 下翼
    ];
    
    // エンジン部分の形状（円形）
    this.engines = [
      { x: -18, y: -3, width: 6, height: 6, type: 'main' },     // メインエンジン
      { x: -18, y: -3, width: 6, height: 6, type: 'main' },     // メインエンジン（重複して見えるように）
    ];
    
    // 物理パラメータ
    this.maxVy = 700;  // 最大速度（ピクセル/秒）
    this.g = 900;      // 重力（ピクセル/秒²）
    this.a = 1200;     // 推力（ピクセル/秒²）
  }

  setThrust(on) {
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
   * 機体の基本形状を描画
   */
  drawBody(ctx) {
    const poly = this.polygon();
    ctx.save();
    
    if (this.thrusting) {
      ctx.shadowColor = 'rgba(255, 150, 80, 0.55)';
      ctx.shadowBlur = 10;
    }
    
    // 機体の基本色
    ctx.fillStyle = this.thrusting ? '#ff6363' : '#ff3b3b';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * 窓を描画（楕円形のコックピット）
   */
  drawWindows(ctx) {
    ctx.save();
    
    this.windows.forEach(window => {
      const x = this.x + window.x;
      const y = this.y + window.y;
      const radiusX = window.width / 2;
      const radiusY = window.height / 2;
      
      // 窓のフレーム（楕円形）
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.ellipse(x + radiusX, y + radiusY, radiusX + 1, radiusY + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 窓ガラス（楕円形）
      ctx.fillStyle = '#87ceeb';
      ctx.beginPath();
      ctx.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 窓のハイライト（楕円形）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x + radiusX * 0.3, y + radiusY * 0.3, radiusX * 0.6, radiusY * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }

  /**
   * 翼を描画（流線形）
   */
  drawWings(ctx) {
    ctx.save();
    
    this.wings.forEach(wing => {
      const x = this.x + wing.x;
      const y = this.y + wing.y;
      const radiusX = wing.width / 2;
      const radiusY = wing.height / 2;
      
      // 翼の基本色（楕円形）
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 翼のハイライト（楕円形）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x + radiusX * 0.3, y + radiusY * 0.3, radiusX * 0.7, radiusY * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 翼のエッジ（楕円形）
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    ctx.restore();
  }

  /**
   * エンジン部分を描画（円形）
   */
  drawEngines(ctx) {
    ctx.save();
    
    this.engines.forEach(engine => {
      const x = this.x + engine.x;
      const y = this.y + engine.y;
      const radius = engine.width / 2;
      
      // エンジンの基本色（円形）
      ctx.fillStyle = '#34495e';
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // エンジンのハイライト（円形）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x + radius * 0.3, y + radius * 0.3, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      // エンジンのエッジ（円形）
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();
    
    // 描画順序を制御（後ろから前へ）
    // 1. 翼を描画（機体の後ろ）
    this.drawWings(ctx);
    
    // 2. エンジン部分を描画
    this.drawEngines(ctx);
    
    // 3. 機体の基本形状を描画
    this.drawBody(ctx);
    
    // 4. 窓を描画（機体の上）
    this.drawWindows(ctx);
    
    // 5. 炎エフェクト（推力時）
    if (this.thrusting) {
      this.drawFlame(ctx);
    }
    
    ctx.restore();
  }

  /**
   * 炎エフェクトを描画
   */
  drawFlame(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;
    
    const gradient = ctx.createLinearGradient(this.x - 36, this.y, this.x - 10, this.y);
    gradient.addColorStop(0, 'rgba(255,180,70,0.05)');
    gradient.addColorStop(0.6, 'rgba(255,210,110,0.75)');
    gradient.addColorStop(1, 'rgba(255,230,150,0.95)');
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
