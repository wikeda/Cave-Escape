/**
 * ロケットクラス
 */
class Rocket {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        
        // 物理特性
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 0.3;
        this.thrust = 0.5;
        this.maxVelocity = 8;
        
        // 状態
        this.isThrusting = false;
        this.angle = 0;
        this.engineParticles = [];
        
        // アニメーション
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isThrusting = false;
        this.angle = 0;
        this.engineParticles = [];
    }
    
    update(deltaTime, isThrusting) {
        this.isThrusting = isThrusting;
        
        // 推力の適用
        if (isThrusting) {
            this.velocityY -= this.thrust * deltaTime / 16.67; // 60FPS基準で正規化
            this.createEngineParticles();
        }
        
        // 重力の適用
        this.velocityY += this.gravity * deltaTime / 16.67;
        
        // 速度制限
        this.velocityY = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocityY));
        
        // 位置の更新
        this.x += this.velocityX * deltaTime / 16.67;
        this.y += this.velocityY * deltaTime / 16.67;
        
        // 角度の計算（速度に基づく）
        this.angle = Math.atan2(this.velocityY, Math.abs(this.velocityX)) * 0.3;
        
        // エンジンパーティクルの更新
        this.updateEngineParticles(deltaTime);
        
        // アニメーション
        this.animationFrame += this.animationSpeed * deltaTime / 16.67;
    }
    
    createEngineParticles() {
        // エンジンパーティクルを生成
        if (Math.random() < 0.7) {
            this.engineParticles.push(new EngineParticle(
                this.x + (Math.random() - 0.5) * 10,
                this.y + this.height / 2,
                (Math.random() - 0.5) * 2,
                Math.random() * 3 + 2,
                '#ff6b6b',
                0.8,
                30
            ));
        }
    }
    
    updateEngineParticles(deltaTime) {
        this.engineParticles = this.engineParticles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
    
    render(ctx) {
        ctx.save();
        
        // ロケットの位置に移動
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // ロケット本体を描画
        this.renderBody(ctx);
        
        // エンジン炎を描画
        if (this.isThrusting) {
            this.renderEngineFlame(ctx);
        }
        
        ctx.restore();
        
        // エンジンパーティクルを描画
        this.engineParticles.forEach(particle => {
            particle.render(ctx);
        });
    }
    
    renderBody(ctx) {
        const width = this.width;
        const height = this.height;
        
        // ロケット本体（グラデーション）
        const gradient = ctx.createLinearGradient(0, -height/2, 0, height/2);
        gradient.addColorStop(0, '#4ecdc4');
        gradient.addColorStop(0.5, '#45b7b8');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-width/2, -height/2, width, height);
        
        // ロケットの先端
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(0, -height/2);
        ctx.lineTo(-width/3, -height/2 + 8);
        ctx.lineTo(width/3, -height/2 + 8);
        ctx.closePath();
        ctx.fill();
        
        // 窓
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.arc(0, -height/4, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // ボディライン
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.strokeRect(-width/2, -height/2, width, height);
    }
    
    renderEngineFlame(ctx) {
        const width = this.width;
        const height = this.height;
        const flameHeight = 15 + Math.sin(this.animationFrame * 2) * 5;
        
        // 炎のグラデーション
        const gradient = ctx.createLinearGradient(0, height/2, 0, height/2 + flameHeight);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#ff8e53');
        gradient.addColorStop(1, '#ffa726');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-width/3, height/2);
        ctx.lineTo(0, height/2 + flameHeight);
        ctx.lineTo(width/3, height/2);
        ctx.closePath();
        ctx.fill();
        
        // 外側の炎
        ctx.fillStyle = '#ffeb3b';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(-width/4, height/2);
        ctx.lineTo(0, height/2 + flameHeight * 0.8);
        ctx.lineTo(width/4, height/2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * エンジンパーティクルクラス
 */
class EngineParticle {
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
    }
    
    update(deltaTime) {
        this.x += this.velocityX * deltaTime / 16.67;
        this.y += this.velocityY * deltaTime / 16.67;
        this.life -= deltaTime / 16.67;
        this.alpha = this.life / this.maxLife;
        this.size *= 0.98; // 徐々に小さくなる
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
}
