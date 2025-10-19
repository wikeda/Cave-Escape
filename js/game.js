/**
 * Cave-Escape メインゲームクラス
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // ゲーム状態
        this.gameState = 'title'; // title, playing, paused, gameOver, stageClear, allClear
        this.score = 0;
        this.currentStage = 1;
        this.distance = 0;
        
        // ゲームオブジェクト
        this.rocket = null;
        this.cave = null;
        this.stage = null;
        this.particles = [];
        this.audio = null;
        this.ui = null;
        
        // ゲームループ
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        
        // 入力管理
        this.keys = {};
        this.setupEventListeners();
        
        // 初期化
        this.init();
    }
    
    init() {
        // ゲームオブジェクトの初期化
        this.audio = new AudioManager();
        this.ui = new UIManager();
        this.stage = new StageManager();
        
        // ゲーム開始時の初期化
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.currentStage = 1;
        this.distance = 0;
        this.particles = [];
        
        // ステージ設定を適用
        this.stage.setStage(this.currentStage);
        
        // ロケットと洞窟を初期化
        this.rocket = new Rocket(this.width * 0.2, this.height / 2);
        this.cave = new CaveGenerator(this.width, this.height, this.stage.getConfig());
        
        this.ui.updateScore(this.score);
        this.ui.updateStage(this.currentStage);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        this.audio.playEngine();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.isRunning = false;
        this.audio.stopEngine();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.isRunning = false;
        this.audio.stopEngine();
        this.audio.playExplosion();
        this.createExplosionParticles();
        this.ui.showGameOver(this.score, this.currentStage);
    }
    
    stageClear() {
        this.gameState = 'stageClear';
        this.isRunning = false;
        this.audio.stopEngine();
        this.ui.showStageClear(this.score, this.currentStage);
    }
    
    allClear() {
        this.gameState = 'allClear';
        this.isRunning = false;
        this.audio.stopEngine();
        this.ui.showAllClear(this.score);
    }
    
    nextStage() {
        this.currentStage++;
        if (this.currentStage > 5) {
            this.allClear();
            return;
        }
        
        this.stage.setStage(this.currentStage);
        this.cave.updateConfig(this.stage.getConfig());
        this.rocket.reset(this.width * 0.2, this.height / 2);
        this.particles = [];
        
        this.gameState = 'playing';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.ui.updateStage(this.currentStage);
        this.audio.playEngine();
    }
    
    restartGame() {
        this.resetGame();
        this.startGame();
    }
    
    setupEventListeners() {
        // キーボード入力
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // ボタンイベント
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('nextStageButton').addEventListener('click', () => {
            this.nextStage();
        });
        
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // タイトルに戻るボタン
        document.getElementById('titleButton').addEventListener('click', () => {
            this.showTitle();
        });
        
        document.getElementById('titleButton2').addEventListener('click', () => {
            this.showTitle();
        });
        
        document.getElementById('titleButton3').addEventListener('click', () => {
            this.showTitle();
        });
    }
    
    showTitle() {
        this.gameState = 'title';
        this.isRunning = false;
        this.audio.stopEngine();
        this.ui.showTitle();
    }
    
    createExplosionParticles() {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(
                this.rocket.x,
                this.rocket.y,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                '#ff6b6b',
                1,
                60
            ));
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // 距離を更新（スクロール速度に基づく）
        const scrollSpeed = this.stage.getConfig().speed;
        this.distance += scrollSpeed * deltaTime / 1000; // km/s
        this.score = Math.floor(this.distance);
        
        // ロケットの更新
        this.rocket.update(deltaTime, this.keys['Space']);
        
        // 洞窟の更新
        this.cave.update(deltaTime);
        
        // パーティクルの更新
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
        
        // 当たり判定
        if (this.cave.checkCollision(this.rocket)) {
            this.gameOver();
            return;
        }
        
        // ステージクリア判定
        if (this.distance >= 2000) {
            this.stageClear();
            return;
        }
        
        // UI更新
        this.ui.updateScore(this.score);
    }
    
    render() {
        // 画面をクリア
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState !== 'playing') return;
        
        // 背景を描画
        this.cave.renderBackground(this.ctx);
        
        // 洞窟の壁を描画
        this.cave.render(this.ctx);
        
        // ロケットを描画
        this.rocket.render(this.ctx);
        
        // パーティクルを描画
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        // デバッグ情報（開発時のみ）
        if (this.gameState === 'playing') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`FPS: ${Math.round(1000 / this.deltaTime)}`, 10, this.height - 20);
        }
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新と描画
        this.update(this.deltaTime);
        this.render();
        
        // 次のフレームを要求
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// ゲームインスタンスを作成（DOM読み込み後）
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
