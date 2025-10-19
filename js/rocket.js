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
    
    // 機体の基本形状（流線形のロケット）- サイズを2倍に拡大
    this.hull = [
      { x: 40, y: 0 },     // 先端
      { x: 16, y: -16 },   // 上側（コックピット部分）
      { x: 4, y: -20 },    // 上側（機体中央）
      { x: -16, y: -16 },  // 上側（翼接続部）
      { x: -30, y: -8 },   // 上側（エンジン部）
      { x: -36, y: 0 },    // 後端中央
      { x: -30, y: 8 },    // 下側（エンジン部）
      { x: -16, y: 16 },   // 下側（翼接続部）
      { x: 4, y: 20 },     // 下側（機体中央）
      { x: 16, y: 16 },    // 下側（コックピット部分）
    ];
    
    // 窓の形状（楕円形のコックピット）- サイズを2倍に拡大
    this.windows = [
      { x: 12, y: -12, width: 16, height: 12, type: 'main' },   // メインコックピット
      { x: 20, y: -4, width: 8, height: 6, type: 'side' },      // サイド窓
    ];
    
    // 翼の形状（流線形）- サイズを2倍に拡大
    this.wings = [
      { x: -12, y: -24, width: 24, height: 16, type: 'top' },   // 上翼
      { x: -12, y: 8, width: 24, height: 16, type: 'bottom' },  // 下翼
    ];
    
    // エンジン部分の形状（円形）- サイズを2倍に拡大
    this.engines = [
      { x: -36, y: -6, width: 12, height: 12, type: 'main' },   // メインエンジン
      { x: -36, y: -6, width: 12, height: 12, type: 'main' },   // メインエンジン（重複して見えるように）
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
   * 機体の基本形状を描画（グラデーション付き）
   */
  drawBody(ctx) {
    const poly = this.polygon();
    ctx.save();
    
    if (this.thrusting) {
      ctx.shadowColor = 'rgba(255, 150, 80, 0.55)';
      ctx.shadowBlur = 15;
    }
    
    // 機体のグラデーション
    const gradient = ctx.createLinearGradient(
      this.x - 20, this.y - 20, 
      this.x + 20, this.y + 20
    );
    gradient.addColorStop(0, this.thrusting ? '#ff8a80' : '#ff6b6b');  // 明るい部分
    gradient.addColorStop(0.5, this.thrusting ? '#ff5252' : '#e53935'); // 中央
    gradient.addColorStop(1, this.thrusting ? '#d32f2f' : '#c62828');   // 暗い部分
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // 機体のハイライト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    ctx.lineTo(poly[1].x, poly[1].y);
    ctx.lineTo(poly[2].x, poly[2].y);
    ctx.lineTo(poly[3].x, poly[3].y);
    ctx.closePath();
    ctx.fill();
    
    // 機体のエッジ
    ctx.strokeStyle = this.thrusting ? '#ff1744' : '#d32f2f';
    ctx.lineWidth = 2;
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
   * 翼を描画（流線形、グラデーション付き）
   */
  drawWings(ctx) {
    ctx.save();
    
    this.wings.forEach(wing => {
      const x = this.x + wing.x;
      const y = this.y + wing.y;
      const radiusX = wing.width / 2;
      const radiusY = wing.height / 2;
      
      // 翼のグラデーション
      const gradient = ctx.createRadialGradient(
        x + radiusX * 0.3, y + radiusY * 0.3, 0,
        x + radiusX, y + radiusY, radiusX
      );
      gradient.addColorStop(0, '#ff6b6b');  // 中心（明るい）
      gradient.addColorStop(0.7, '#e74c3c'); // 中間
      gradient.addColorStop(1, '#c0392b');   // 外側（暗い）
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 翼のハイライト（楕円形）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x + radiusX * 0.2, y + radiusY * 0.2, radiusX * 0.6, radiusY * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 翼のエッジ（楕円形）
      ctx.strokeStyle = '#a93226';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    ctx.restore();
  }

  /**
   * エンジン部分を描画（円形、金属質感）
   */
  drawEngines(ctx) {
    ctx.save();
    
    this.engines.forEach(engine => {
      const x = this.x + engine.x;
      const y = this.y + engine.y;
      const radius = engine.width / 2;
      
      // エンジンの金属質感グラデーション
      const gradient = ctx.createRadialGradient(
        x + radius * 0.3, y + radius * 0.3, 0,
        x + radius, y + radius, radius
      );
      gradient.addColorStop(0, '#5d6d7e');  // 中心（明るい金属）
      gradient.addColorStop(0.5, '#34495e'); // 中間
      gradient.addColorStop(1, '#2c3e50');   // 外側（暗い金属）
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // エンジンのハイライト（円形）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x + radius * 0.2, y + radius * 0.2, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // エンジンのエッジ（円形）
      ctx.strokeStyle = '#1b2631';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // エンジンの内部構造
      ctx.strokeStyle = '#566573';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius * 0.6, 0, Math.PI * 2);
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
   * 炎エフェクトを描画（サイズを2倍に拡大）
   */
  drawFlame(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;
    
    const gradient = ctx.createLinearGradient(this.x - 72, this.y, this.x - 20, this.y);
    gradient.addColorStop(0, 'rgba(255,180,70,0.05)');
    gradient.addColorStop(0.6, 'rgba(255,210,110,0.75)');
    gradient.addColorStop(1, 'rgba(255,230,150,0.95)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.x - 36, this.y - 14);
    ctx.lineTo(this.x - 72, this.y);
    ctx.lineTo(this.x - 36, this.y + 14);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}
