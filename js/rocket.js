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
    
    // ロケットの形状（凸多角形：右向き、左がベース）
    this.hull = [
      { x: 24, y: 0 },    // 先端
      { x: 10, y: -10 },  // 上側
      { x: -12, y: -10 }, // 上側ベース
      { x: -18, y: 0 },   // ベース中央
      { x: -12, y: 10 },  // 下側ベース
      { x: 10, y: 10 },   // 下側
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

  draw(ctx) {
    const poly = this.polygon();
    ctx.save();
    if (this.thrusting) {
      ctx.shadowColor = 'rgba(255, 150, 80, 0.55)';
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = this.thrusting ? '#ff6363' : '#ff3b3b';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();

    if (this.thrusting) {
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
    }
    ctx.restore();
  }
}
