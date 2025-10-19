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
      this.ps.push({ x, y, vx, vy, life, age: 0, size, hue, sat, light });
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
      ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

