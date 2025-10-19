/**
 * 洞窟生成クラス
 */
class CaveGenerator {
    constructor(width, height, config) {
        this.width = width;
        this.height = height;
        this.config = config;
        
        // 洞窟の壁データ
        this.walls = [];
        this.scrollX = 0;
        this.wallSpacing = this.getWallSpacing();
        this.lastWallX = 0;
        
        // 背景
        this.backgroundOffset = 0;
        this.stars = this.generateStars();
        
        // 洞窟の色（ステージごと）
        this.caveColors = [
            '#2c3e50', // ステージ1: 深い青
            '#34495e', // ステージ2: ダークグレー
            '#8e44ad', // ステージ3: 紫
            '#e67e22', // ステージ4: オレンジ
            '#c0392b'  // ステージ5: 赤
        ];
    }
    
    updateConfig(config) {
        this.config = config;
        this.wallSpacing = this.getWallSpacing();
    }
    
    getWallSpacing() {
        const spacingMap = {
            'とても広い': 200,
            '広い': 150,
            '狭い': 100,
            'とても狭い': 60
        };
        return spacingMap[this.config.wallSpacing] || 150;
    }
    
    generateStars() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * this.width * 2,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.8 + 0.2
            });
        }
        return stars;
    }
    
    generateWall(x) {
        const heightLimit = this.config.heightLimit;
        const maxHeight = this.height * 0.8; // 画面の80%を最大高さとする
        const minHeight = this.height * 0.2; // 画面の20%を最小高さとする
        
        // 高さ制限に基づいて壁の高さを決定
        const availableHeight = maxHeight - minHeight;
        const wallHeight = minHeight + (availableHeight / 5) * heightLimit;
        
        // ランダムな壁の形状を生成
        const wall = {
            x: x,
            top: this.generateWallShape(x, 0, wallHeight, 'top'),
            bottom: this.generateWallShape(x, this.height - wallHeight, this.height, 'bottom'),
            height: wallHeight
        };
        
        return wall;
    }
    
    generateWallShape(x, startY, endY, type) {
        const points = [];
        const segmentCount = 10;
        const segmentWidth = this.wallSpacing / segmentCount;
        
        for (let i = 0; i <= segmentCount; i++) {
            const segmentX = x + i * segmentWidth;
            let segmentY;
            
            if (type === 'top') {
                // 天井の壁
                const baseY = startY;
                const variation = (endY - startY) * 0.3;
                segmentY = baseY + Math.sin(i * 0.5) * variation + Math.random() * 20 - 10;
            } else {
                // 床の壁
                const baseY = endY;
                const variation = (endY - startY) * 0.3;
                segmentY = baseY + Math.sin(i * 0.5) * variation + Math.random() * 20 - 10;
            }
            
            points.push({ x: segmentX, y: segmentY });
        }
        
        return points;
    }
    
    update(deltaTime) {
        const scrollSpeed = this.config.speed * 50; // ピクセル/秒に変換
        this.scrollX += scrollSpeed * deltaTime / 1000;
        this.backgroundOffset += scrollSpeed * 0.5 * deltaTime / 1000;
        
        // 新しい壁を生成
        const currentX = this.scrollX;
        if (currentX - this.lastWallX > this.wallSpacing) {
            this.walls.push(this.generateWall(currentX + this.width));
            this.lastWallX = currentX;
        }
        
        // 画面外の壁を削除
        this.walls = this.walls.filter(wall => wall.x > this.scrollX - this.width);
        
        // 星の位置を更新
        this.stars.forEach(star => {
            star.x -= scrollSpeed * 0.3 * deltaTime / 1000;
            if (star.x < -50) {
                star.x = this.width + Math.random() * 100;
                star.y = Math.random() * this.height;
            }
        });
    }
    
    checkCollision(rocket) {
        const rocketBounds = rocket.getBounds();
        
        for (let wall of this.walls) {
            // 壁が画面内にあるかチェック
            if (wall.x > this.scrollX - 50 && wall.x < this.scrollX + this.width + 50) {
                const wallX = wall.x - this.scrollX;
                
                // ロケットが壁の範囲内にあるかチェック
                if (rocketBounds.x < wallX + this.wallSpacing && 
                    rocketBounds.x + rocketBounds.width > wallX) {
                    
                    // 天井との衝突チェック
                    if (this.checkWallCollision(rocketBounds, wall.top, wallX)) {
                        return true;
                    }
                    
                    // 床との衝突チェック
                    if (this.checkWallCollision(rocketBounds, wall.bottom, wallX)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    checkWallCollision(rocketBounds, wallPoints, wallX) {
        const rocketLeft = rocketBounds.x;
        const rocketRight = rocketBounds.x + rocketBounds.width;
        const rocketTop = rocketBounds.y;
        const rocketBottom = rocketBounds.y + rocketBounds.height;
        
        for (let i = 0; i < wallPoints.length - 1; i++) {
            const p1 = wallPoints[i];
            const p2 = wallPoints[i + 1];
            
            const wallLeft = wallX + p1.x;
            const wallRight = wallX + p2.x;
            
            // ロケットと壁のセグメントが重なっているかチェック
            if (rocketRight > wallLeft && rocketLeft < wallRight) {
                // 線形補間で壁の高さを計算
                const t = (rocketLeft - wallLeft) / (wallRight - wallLeft);
                const wallY = p1.y + t * (p2.y - p1.y);
                
                if (rocketTop < wallY && rocketBottom > wallY) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    renderBackground(ctx) {
        // 星空の背景
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 星を描画
        ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            ctx.globalAlpha = star.brightness;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // 洞窟の奥行き感を演出するグラデーション
        const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    render(ctx) {
        // 洞窟の壁を描画
        const caveColor = this.caveColors[Math.min(this.config.stage - 1, this.caveColors.length - 1)];
        
        for (let wall of this.walls) {
            const wallX = wall.x - this.scrollX;
            
            // 画面内の壁のみ描画
            if (wallX > -100 && wallX < this.width + 100) {
                this.renderWall(ctx, wall, wallX, caveColor);
            }
        }
    }
    
    renderWall(ctx, wall, wallX, color) {
        // 天井の壁
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(wallX + wall.top[0].x, wall.top[0].y);
        for (let i = 1; i < wall.top.length; i++) {
            ctx.lineTo(wallX + wall.top[i].x, wall.top[i].y);
        }
        ctx.lineTo(wallX + wall.top[wall.top.length - 1].x, 0);
        ctx.lineTo(wallX + wall.top[0].x, 0);
        ctx.closePath();
        ctx.fill();
        
        // 床の壁
        ctx.beginPath();
        ctx.moveTo(wallX + wall.bottom[0].x, wall.bottom[0].y);
        for (let i = 1; i < wall.bottom.length; i++) {
            ctx.lineTo(wallX + wall.bottom[i].x, wall.bottom[i].y);
        }
        ctx.lineTo(wallX + wall.bottom[wall.bottom.length - 1].x, this.height);
        ctx.lineTo(wallX + wall.bottom[0].x, this.height);
        ctx.closePath();
        ctx.fill();
        
        // 壁の縁を描画
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wallX + wall.top[0].x, wall.top[0].y);
        for (let i = 1; i < wall.top.length; i++) {
            ctx.lineTo(wallX + wall.top[i].x, wall.top[i].y);
        }
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(wallX + wall.bottom[0].x, wall.bottom[0].y);
        for (let i = 1; i < wall.bottom.length; i++) {
            ctx.lineTo(wallX + wall.bottom[i].x, wall.bottom[i].y);
        }
        ctx.stroke();
    }
}
