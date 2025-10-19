/**
 * UI管理クラス
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
            totalScore: document.getElementById('totalScore')
        };
        
        this.currentScreen = 'title';
        this.init();
    }
    
    init() {
        // 初期状態を設定
        this.showScreen('title');
    }
    
    showScreen(screenName) {
        // 全ての画面を非表示
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // 指定された画面を表示
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.currentScreen = screenName;
        }
    }
    
    showTitle() {
        this.showScreen('title');
    }
    
    showGame() {
        this.showScreen('game');
    }
    
    showGameOver(score, stage) {
        this.elements.finalScore.textContent = `最終スコア: ${score} km`;
        this.elements.finalStage.textContent = `到達ステージ: ${stage}`;
        this.showScreen('gameOver');
    }
    
    showStageClear(score, stage) {
        this.elements.clearScore.textContent = `スコア: ${score} km`;
        this.elements.clearStage.textContent = `クリアステージ: ${stage}`;
        this.showScreen('stageClear');
    }
    
    showAllClear(score) {
        this.elements.totalScore.textContent = `総合スコア: ${score} km`;
        this.showScreen('allClear');
    }
    
    updateScore(score) {
        if (this.elements.score) {
            this.elements.score.textContent = `距離: ${score} km`;
        }
    }
    
    updateStage(stage) {
        if (this.elements.stage) {
            this.elements.stage.textContent = `ステージ: ${stage}`;
        }
    }
    
    // ゲーム内メッセージの表示
    showMessage(text, type = 'info', duration = 2000) {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.game-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 新しいメッセージを作成
        const message = document.createElement('div');
        message.className = `game-message ${type}`;
        message.textContent = text;
        
        // ゲーム画面に追加
        const gameScreen = this.screens.game;
        if (gameScreen) {
            gameScreen.appendChild(message);
            
            // 指定時間後に削除
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, duration);
        }
    }
    
    // ステージ進行の表示
    showStageProgress(progress) {
        const progressBar = document.getElementById('stageProgress');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    }
    
    // 警告メッセージの表示
    showWarning(text) {
        this.showMessage(text, 'warning', 1000);
    }
    
    // 成功メッセージの表示
    showSuccess(text) {
        this.showMessage(text, 'success', 1500);
    }
    
    // カウントダウンの表示
    showCountdown(count, callback) {
        if (count <= 0) {
            if (callback) callback();
            return;
        }
        
        this.showMessage(count.toString(), 'info', 1000);
        setTimeout(() => {
            this.showCountdown(count - 1, callback);
        }, 1000);
    }
    
    // スコアアニメーション
    animateScore(newScore, oldScore) {
        if (newScore <= oldScore) return;
        
        const scoreElement = this.elements.score;
        if (!scoreElement) return;
        
        const difference = newScore - oldScore;
        const steps = 20;
        const stepSize = difference / steps;
        let currentScore = oldScore;
        
        const animate = () => {
            currentScore += stepSize;
            if (currentScore >= newScore) {
                currentScore = newScore;
            } else {
                requestAnimationFrame(animate);
            }
            
            scoreElement.textContent = `距離: ${Math.floor(currentScore)} km`;
        };
        
        animate();
    }
    
    // ステージ情報の表示
    showStageInfo(stageInfo) {
        const info = `
            ステージ ${stageInfo.stage}: ${stageInfo.description}
            速度: ${stageInfo.speed}x | 高さ制限: ${stageInfo.heightLimit} | 壁の間隔: ${stageInfo.wallSpacing}
        `;
        this.showMessage(info, 'info', 3000);
    }
    
    // ゲーム統計の表示
    showGameStats(stats) {
        const statsText = `
            プレイ時間: ${Math.floor(stats.playTime / 1000)}秒
            最高スコア: ${stats.highScore} km
            クリアステージ: ${stats.clearedStages}/5
        `;
        this.showMessage(statsText, 'info', 4000);
    }
    
    // チュートリアルの表示
    showTutorial() {
        const tutorialSteps = [
            'スペースキーを押してロケットを上昇させましょう',
            '壁に当たらないように注意してください',
            '2000km進むとステージクリアです',
            '準備はいいですか？'
        ];
        
        let currentStep = 0;
        const showNextStep = () => {
            if (currentStep < tutorialSteps.length) {
                this.showMessage(tutorialSteps[currentStep], 'info', 2000);
                currentStep++;
                setTimeout(showNextStep, 2500);
            }
        };
        
        showNextStep();
    }
    
    // パフォーマンス情報の表示（デバッグ用）
    showPerformanceInfo(fps, particleCount) {
        const perfElement = document.getElementById('performanceInfo');
        if (perfElement) {
            perfElement.textContent = `FPS: ${fps} | パーティクル: ${particleCount}`;
        }
    }
    
    // キーボードショートカットの表示
    showControls() {
        const controls = `
            操作方法:
            [スペース] - ロケット上昇
            [P] - 一時停止
            [M] - 音声ON/OFF
            [R] - リスタート
        `;
        this.showMessage(controls, 'info', 5000);
    }
    
    // 画面のフェード効果
    fadeIn(screenName, duration = 500) {
        const screen = this.screens[screenName];
        if (!screen) return;
        
        screen.style.opacity = '0';
        screen.classList.remove('hidden');
        
        let opacity = 0;
        const fadeStep = 16.67 / duration; // 60FPS基準
        
        const fade = () => {
            opacity += fadeStep;
            screen.style.opacity = Math.min(opacity, 1);
            
            if (opacity < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }
    
    fadeOut(screenName, duration = 500) {
        const screen = this.screens[screenName];
        if (!screen) return;
        
        let opacity = 1;
        const fadeStep = 16.67 / duration; // 60FPS基準
        
        const fade = () => {
            opacity -= fadeStep;
            screen.style.opacity = Math.max(opacity, 0);
            
            if (opacity > 0) {
                requestAnimationFrame(fade);
            } else {
                screen.classList.add('hidden');
            }
        };
        
        fade();
    }
}
