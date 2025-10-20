/**
 * パーティクルシステムクラス
 * 爆発エフェクトなどのパーティクルを管理
 */
export class ParticleSystem {
  constructor() {
    this.ps = [];  // パーティクル配列
  }

  clear() { this.ps.length = 0; }

  explosion(x, y) {
    const N = 80;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 420; // px/s
      const vx = Math.cos(a) * sp;
      const vy = Math.sin(a) * sp;
      const life = 0.6 + Math.random() * 0.6;
      const size = 2 + Math.random() * 3;
      const hue = 20 + Math.random() * 15; // orange-yellow
      const sat = 90 + Math.random() * 10;
      const light = 50 + Math.random() * 20;
      this.ps.push({ x, y, vx, vy, life, age: 0, size, hue, sat, light, type: 'explosion' });
    }
  }

  /**
   * 花火エフェクト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  fireworks(x, y) {
    const N = 120;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 200 + Math.random() * 600; // px/s
      const vx = Math.cos(a) * sp;
      const vy = Math.sin(a) * sp;
      const life = 1.5 + Math.random() * 1.0;
      const size = 3 + Math.random() * 4;
      // 花火の色（赤、青、緑、黄、紫）
      const colors = [
        { hue: 0, sat: 100, light: 60 },    // 赤
        { hue: 240, sat: 100, light: 60 },  // 青
        { hue: 120, sat: 100, light: 60 },  // 緑
        { hue: 60, sat: 100, light: 60 },   // 黄
        { hue: 300, sat: 100, light: 60 }   // 紫
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.ps.push({ 
        x, y, vx, vy, life, age: 0, size, 
        hue: color.hue, sat: color.sat, light: color.light, 
        type: 'fireworks' 
      });
    }
  }

  /**
   * キラキラエフェクト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  sparkles(x, y) {
    const N = 60;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 150; // px/s
      const vx = Math.cos(a) * sp;
      const vy = Math.sin(a) * sp;
      const life = 2.0 + Math.random() * 1.5;
      const size = 1 + Math.random() * 2;
      const hue = 45 + Math.random() * 30; // 金色系
      const sat = 80 + Math.random() * 20;
      const light = 70 + Math.random() * 30;
      this.ps.push({ 
        x, y, vx, vy, life, age: 0, size, 
        hue, sat, light, 
        type: 'sparkles' 
      });
    }
  }

  update(dt) {
    for (const p of this.ps) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // simple drag and gravity-like pull
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 300 * dt;
    }
    // remove dead
    this.ps = this.ps.filter(p => p.age < p.life);
  }

  draw(ctx) {
    for (const p of this.ps) {
      const t = p.age / p.life;
      const alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (p.type === 'sparkles') {
        // キラキラエフェクト：星形を描画
        this._drawStar(ctx, p.x, p.y, p.size, p.hue, p.sat, p.light);
      } else {
        // 通常の爆発・花火エフェクト：円形を描画
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  /**
   * 星形を描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} size - サイズ
   * @param {number} hue - 色相
   * @param {number} sat - 彩度
   * @param {number} light - 明度
   */
  _drawStar(ctx, x, y, size, hue, sat, light) {
    ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 1)`;
    ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, 0.8)`;
    ctx.shadowBlur = size * 2;
    
    ctx.beginPath();
    const spikes = 4;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
}

