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
    
    // 機体の基本形状（右向き、左がベース）
    this.hull = [
      { x: 24, y: 0 },    // 先端
      { x: 10, y: -10 },  // 上側
      { x: -12, y: -10 }, // 上側ベース
      { x: -18, y: 0 },   // ベース中央
      { x: -12, y: 10 },  // 下側ベース
      { x: 10, y: 10 },   // 下側
    ];
    
    // 窓の形状（コックピット）
    this.windows = [
      { x: 8, y: -6, width: 8, height: 6, type: 'main' },    // メイン窓
      { x: 8, y: 0, width: 6, height: 4, type: 'side' },     // サイド窓
      { x: 12, y: -3, width: 4, height: 3, type: 'small' }   // 小窓
    ];
    
    // 翼の形状
    this.wings = [
      { x: -8, y: -12, width: 16, height: 6, type: 'top' },     // 上翼
      { x: -8, y: 6, width: 16, height: 6, type: 'bottom' },    // 下翼
      { x: -15, y: -8, width: 8, height: 4, type: 'side' },     // サイド翼
      { x: -15, y: 4, width: 8, height: 4, type: 'side' }       // サイド翼
    ];
    
    // エンジン部分の形状
    this.engines = [
      { x: -20, y: -4, width: 8, height: 3, type: 'main' },     // メインエンジン
      { x: -20, y: 1, width: 8, height: 3, type: 'main' },      // メインエンジン
      { x: -16, y: -8, width: 4, height: 2, type: 'side' },     // サイドエンジン
      { x: -16, y: 6, width: 4, height: 2, type: 'side' }       // サイドエンジン
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
   * 窓を描画
   */
  drawWindows(ctx) {
    ctx.save();
    
    this.windows.forEach(window => {
      const x = this.x + window.x;
      const y = this.y + window.y;
      
      // 窓のフレーム
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x - 1, y - 1, window.width + 2, window.height + 2);
      
      // 窓ガラス
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(x, y, window.width, window.height);
      
      // 窓のハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, y, window.width * 0.3, window.height);
    });
    
    ctx.restore();
  }

  /**
   * 翼を描画
   */
  drawWings(ctx) {
    ctx.save();
    
    this.wings.forEach(wing => {
      const x = this.x + wing.x;
      const y = this.y + wing.y;
      
      // 翼の基本色
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x, y, wing.width, wing.height);
      
      // 翼のハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(x, y, wing.width * 0.4, wing.height);
      
      // 翼のエッジ
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, wing.width, wing.height);
    });
    
    ctx.restore();
  }

  /**
   * エンジン部分を描画
   */
  drawEngines(ctx) {
    ctx.save();
    
    this.engines.forEach(engine => {
      const x = this.x + engine.x;
      const y = this.y + engine.y;
      
      // エンジンの基本色
      ctx.fillStyle = '#34495e';
      ctx.fillRect(x, y, engine.width, engine.height);
      
      // エンジンのハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(x, y, engine.width * 0.3, engine.height);
      
      // エンジンのエッジ
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, engine.width, engine.height);
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
