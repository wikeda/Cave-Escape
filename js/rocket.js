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
    
    // 機体の基本形状（流線形のロケット）- 元のサイズに戻す
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
    
    // 窓の形状（楕円形のコックピット）- 1つだけ
    this.windows = [
      { x: 6, y: -4, width: 8, height: 6, type: 'main' },      // メインコックピットのみ
    ];
    
    // エンジン部分の形状（台形）- 縦向き（短い辺がロケット側、長い辺が炎側）
    this.engines = [
      { x: -20, y: -6, width: 12, height: 12, type: 'main' },  // メインエンジン（台形）
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
    
    // 機体のグラデーション（暗い銀色）
    const gradient = ctx.createLinearGradient(
      this.x - 10, this.y - 10, 
      this.x + 10, this.y + 10
    );
    gradient.addColorStop(0, this.thrusting ? '#d1d5db' : '#9ca3af');  // 明るい銀色
    gradient.addColorStop(0.5, this.thrusting ? '#6b7280' : '#4b5563'); // 中央の銀色
    gradient.addColorStop(1, this.thrusting ? '#374151' : '#1f2937');   // 暗い銀色
    
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
    
    // 機体のエッジ（暗い銀色系）
    ctx.strokeStyle = this.thrusting ? '#6b7280' : '#4b5563';
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
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.ellipse(x + radiusX, y + radiusY, radiusX + 1, radiusY + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 窓ガラス（楕円形）- 暗い紺色
      ctx.fillStyle = '#16213e';
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
   * エンジン部分を描画（台形、金属質感）
   */
  drawEngines(ctx) {
    ctx.save();
    
    this.engines.forEach(engine => {
      const x = this.x + engine.x;
      const y = this.y + engine.y;
      const width = engine.width;
      const height = engine.height;
      
      // エンジンの金属質感グラデーション（台形）
      const gradient = ctx.createLinearGradient(
        x, y, x + width, y + height
      );
      gradient.addColorStop(0, '#5d6d7e');  // 明るい金属
      gradient.addColorStop(0.5, '#34495e'); // 中間
      gradient.addColorStop(1, '#2c3e50');   // 暗い金属
      
      // 台形の描画（90度回転：短い辺がロケット側、長い辺が炎側）
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x, y);                    // 左上
      ctx.lineTo(x + width * 0.2, y + height * 0.2); // 右上（短い辺）
      ctx.lineTo(x + width * 0.8, y + height * 0.8); // 右下（長い辺）
      ctx.lineTo(x, y + height);           // 左下
      ctx.closePath();
      ctx.fill();
      
      // エンジンのハイライト（台形）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + width * 0.3, y + height * 0.3);
      ctx.lineTo(x + width * 0.6, y + height * 0.6);
      ctx.lineTo(x + 2, y + height * 0.8);
      ctx.closePath();
      ctx.fill();
      
      // エンジンのエッジ（台形）
      ctx.strokeStyle = '#1b2631';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width * 0.2, y + height * 0.2);
      ctx.lineTo(x + width * 0.8, y + height * 0.8);
      ctx.lineTo(x, y + height);
      ctx.closePath();
      ctx.stroke();
    });
    
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();
    
    // 描画順序を制御（後ろから前へ）
    // 1. 機体の基本形状を描画
    this.drawBody(ctx);
    
    // 2. 窓を描画（機体の上）
    this.drawWindows(ctx);
    
    // 3. エンジン部分を描画（機体の前面）
    this.drawEngines(ctx);
    
    // 4. 炎エフェクト（推力時）
    if (this.thrusting) {
      this.drawFlame(ctx);
    }
    
    ctx.restore();
  }

  /**
   * 炎エフェクトを描画（元のサイズに戻す）
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
