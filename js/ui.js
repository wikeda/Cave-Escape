/**
 * UI Manager
 * Rewritten to remove garbled text and syntax errors.
 */
class UIManager {
    constructor() {
        this.screens = {
            title: document.getElementById('titleScreen'),
            game: document.getElementById('gameScreen'),
            gameOver: document.getElementById('gameOverScreen'),
            stageClear: document.getElementById('stageClearScreen'),
            allClear: document.getElementById('allClearScreen')
        };

        this.elements = {
            score: document.getElementById('score'),
            stage: document.getElementById('stage'),
            finalScore: document.getElementById('finalScore'),
            finalStage: document.getElementById('finalStage'),
            clearScore: document.getElementById('clearScore'),
            clearStage: document.getElementById('clearStage'),
            totalScore: document.getElementById('totalScore'),
            performanceInfo: document.getElementById('performanceInfo')
        };

        this.currentScreen = 'title';
        this.showScreen('title');
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(s => s && s.classList.add('hidden'));
        const target = this.screens[screenName];
        if (target) {
            target.classList.remove('hidden');
            this.currentScreen = screenName;
        }
    }

    showTitle() { this.showScreen('title'); }
    showGame() { this.showScreen('game'); }

    showGameOver(score, stage) {
        if (this.elements.finalScore) this.elements.finalScore.textContent = `最終スコア: ${score} km`;
        if (this.elements.finalStage) this.elements.finalStage.textContent = `到達ステージ: ${stage}`;
        this.showScreen('gameOver');
    }

    showStageClear(score, stage) {
        if (this.elements.clearScore) this.elements.clearScore.textContent = `スコア: ${score} km`;
        if (this.elements.clearStage) this.elements.clearStage.textContent = `クリアステージ: ${stage}`;
        this.showScreen('stageClear');
    }

    showAllClear(score) {
        if (this.elements.totalScore) this.elements.totalScore.textContent = `総合スコア: ${score} km`;
        this.showScreen('allClear');
    }

    updateScore(score) {
        if (this.elements.score) this.elements.score.textContent = `距離: ${score} km`;
    }

    updateStage(stage) {
        if (this.elements.stage) this.elements.stage.textContent = `ステージ: ${stage}`;
    }

    showMessage(text, type = 'info', duration = 2000) {
        const existing = document.querySelector('.game-message');
        if (existing) existing.remove();
        const message = document.createElement('div');
        message.className = `game-message ${type}`;
        message.textContent = text;
        const gameScreen = this.screens.game;
        if (gameScreen) {
            gameScreen.appendChild(message);
            setTimeout(() => message.remove(), duration);
        }
    }

    showStageProgress(progress) {
        const bar = document.getElementById('stageProgress');
        if (bar) bar.style.width = `${progress * 100}%`;
    }

    showWarning(text) { this.showMessage(text, 'warning', 1000); }
    showSuccess(text) { this.showMessage(text, 'success', 1500); }

    showCountdown(count, callback) {
        if (count <= 0) { callback && callback(); return; }
        this.showMessage(count.toString(), 'info', 1000);
        setTimeout(() => this.showCountdown(count - 1, callback), 1000);
    }

    animateScore(newScore, oldScore) {
        if (newScore <= oldScore) return;
        const el = this.elements.score; if (!el) return;
        const steps = 20; const step = (newScore - oldScore) / steps;
        let cur = oldScore;
        const tick = () => {
            cur += step;
            if (cur >= newScore) cur = newScore; else requestAnimationFrame(tick);
            el.textContent = `距離: ${Math.floor(cur)} km`;
        };
        tick();
    }

    showStageInfo(stageInfo) {
        const info = `ステージ ${stageInfo.stage}: ${stageInfo.description}\n速度:${stageInfo.speed}x 高さ制限:${stageInfo.heightLimit} 壁間隔:${stageInfo.wallSpacing}`;
        this.showMessage(info, 'info', 3000);
    }

    showGameStats(stats) {
        const t = `プレイ時間: ${Math.floor(stats.playTime/1000)}秒\n最高スコア: ${stats.highScore} km`;
        this.showMessage(t, 'info', 4000);
    }

    showTutorial() {
        const steps = [
            'スペースキーで上昇します',
            '壁に当たらないように進みましょう',
            '2000kmでステージクリア'
        ];
        let i = 0;
        const next = () => { if (i < steps.length) { this.showMessage(steps[i++], 'info', 1800); setTimeout(next, 2000); } };
        next();
    }

    showPerformanceInfo(fps, particleCount) {
        if (this.elements.performanceInfo) this.elements.performanceInfo.textContent = `FPS: ${fps} | 粒子: ${particleCount}`;
    }

    showControls() {
        const controls = '操作: [Space] 上昇 / [P] 一時停止 / [M] ミュート / [R] リスタート';
        this.showMessage(controls, 'info', 5000);
    }

    fadeIn(screenName, duration = 500) {
        const screen = this.screens[screenName];
        if (!screen) return;
        screen.style.opacity = '0';
        screen.classList.remove('hidden');
        let o = 0; const step = 16.67 / duration;
        const loop = () => { o += step; screen.style.opacity = Math.min(o, 1); if (o < 1) requestAnimationFrame(loop); };
        loop();
    }

    fadeOut(screenName, duration = 500) {
        const screen = this.screens[screenName];
        if (!screen) return;
        let o = 1; const step = 16.67 / duration;
        const loop = () => { o -= step; screen.style.opacity = Math.max(o, 0); if (o > 0) requestAnimationFrame(loop); else screen.classList.add('hidden'); };
        loop();
    }
}

