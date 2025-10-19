/**
 * パーティクルシステム
 */
class Particle {
    constructor(x, y, velocityX, velocityY, color, size, life) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.alpha = 1;
        this.gravity = 0.1;
        this.friction = 0.98;
    }
    
    update(deltaTime) {
        // 位置の更新
        this.x += this.velocityX * deltaTime / 16.67;
        this.y += this.velocityY * deltaTime / 16.67;
        
        // 重力の適用
        this.velocityY += this.gravity * deltaTime / 16.67;
        
        // 摩擦の適用
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
        
        // ライフの減少
        this.life -= deltaTime / 16.67;
        this.alpha = this.life / this.maxLife;
        
        // サイズの減少
        this.size *= 0.99;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isAlive() {
        return this.life > 0;
    }
}

/**
 * 爆発パーティクルクラス
 */
class ExplosionParticle extends Particle {
    constructor(x, y, velocityX, velocityY, color, size, life) {
        super(x, y, velocityX, velocityY, color, size, life);
        this.sparkle = Math.random() > 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        this.rotation += this.rotationSpeed * deltaTime / 16.67;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.sparkle) {
            // 星型のスパークル
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const x1 = Math.cos(angle) * this.size;
                const y1 = Math.sin(angle) * this.size;
                const x2 = Math.cos(angle + Math.PI / 5) * (this.size * 0.4);
                const y2 = Math.sin(angle + Math.PI / 5) * (this.size * 0.4);
                
                if (i === 0) {
                    ctx.moveTo(x1, y1);
                } else {
                    ctx.lineTo(x1, y1);
                }
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            // 円形のパーティクル
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

/**
 * パーティクルシステム管理クラス
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addParticle(particle) {
        this.particles.push(particle);
    }
    
    createExplosion(x, y, particleCount = 20) {
        const colors = ['#ff6b6b', '#ff8e53', '#ffa726', '#ffeb3b', '#ffffff'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = Math.random() * 8 + 2;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 60 + 30;
            
            this.particles.push(new ExplosionParticle(
                x, y, velocityX, velocityY, color, size, life
            ));
        }
    }
    
    createEngineParticles(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            const velocityX = (Math.random() - 0.5) * 2;
            const velocityY = Math.random() * 3 + 2;
            const color = '#ff6b6b';
            const size = Math.random() * 2 + 1;
            const life = Math.random() * 20 + 10;
            
            this.particles.push(new Particle(
                x, y, velocityX, velocityY, color, size, life
            ));
        }
    }
    
    createSmoke(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const velocityX = (Math.random() - 0.5) * 1;
            const velocityY = -Math.random() * 2 - 1;
            const color = `rgba(100, 100, 100, ${Math.random() * 0.5 + 0.3})`;
            const size = Math.random() * 3 + 2;
            const life = Math.random() * 40 + 20;
            
            this.particles.push(new Particle(
                x, y, velocityX, velocityY, color, size, life
            ));
        }
    }
    
    update(deltaTime) {
        // パーティクルの更新
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.isAlive();
        });
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            particle.render(ctx);
        });
    }
    
    clear() {
        this.particles = [];
    }
    
    getParticleCount() {
        return this.particles.length;
    }
}
