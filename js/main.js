/**
 * Cave-Escape メイン初期化ファイル
 */

// ゲームの初期化とイベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cave-Escape を初期化中...');
    
    // ゲームインスタンスの作成
    window.game = new Game();
    
    // キーボードショートカットの設定
    setupKeyboardShortcuts();
    
    // 音声の初期化
    initializeAudio();
    
    // パフォーマンス監視の設定
    setupPerformanceMonitoring();
    
    console.log('Cave-Escape の初期化が完了しました');
});

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'KeyP':
                // 一時停止/再開
                if (window.game) {
                    if (window.game.gameState === 'playing') {
                        window.game.pauseGame();
                    } else if (window.game.gameState === 'paused') {
                        window.game.startGame();
                    }
                }
                break;
                
            case 'KeyM':
                // 音声ON/OFF
                if (window.game && window.game.audio) {
                    const isMuted = window.game.audio.toggleMute();
                    console.log('音声:', isMuted ? 'OFF' : 'ON');
                }
                break;
                
            case 'KeyR':
                // リスタート
                if (window.game && window.game.gameState === 'playing') {
                    window.game.restartGame();
                }
                break;
                
            case 'KeyH':
                // ヘルプ表示
                if (window.game && window.game.ui) {
                    window.game.ui.showControls();
                }
                break;
                
            case 'Escape':
                // タイトルに戻る
                if (window.game) {
                    window.game.showTitle();
                }
                break;
        }
    });
}

/**
 * 音声の初期化
 */
function initializeAudio() {
    // ユーザーの最初の操作で音声コンテキストを開始
    const startAudio = () => {
        if (window.game && window.game.audio) {
            window.game.audio.preloadSounds();
        }
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
}

/**
 * パフォーマンス監視の設定
 */
function setupPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const monitorPerformance = (currentTime) => {
        frameCount++;
        
        if (currentTime - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;
            
            // パフォーマンス情報を更新
            if (window.game && window.game.ui) {
                const particleCount = window.game.particles ? window.game.particles.length : 0;
                window.game.ui.showPerformanceInfo(fps, particleCount);
            }
        }
        
        requestAnimationFrame(monitorPerformance);
    };
    
    requestAnimationFrame(monitorPerformance);
}

/**
 * ゲームの統計情報を取得
 */
function getGameStats() {
    if (!window.game) return null;
    
    return {
        score: window.game.score,
        stage: window.game.currentStage,
        distance: window.game.distance,
        playTime: performance.now() - (window.game.startTime || performance.now()),
        highScore: localStorage.getItem('caveEscapeHighScore') || 0
    };
}

/**
 * ハイスコアの保存
 */
function saveHighScore(score) {
    const currentHighScore = parseInt(localStorage.getItem('caveEscapeHighScore') || '0');
    if (score > currentHighScore) {
        localStorage.setItem('caveEscapeHighScore', score.toString());
        return true;
    }
    return false;
}

/**
 * ゲームの設定を保存
 */
function saveGameSettings(settings) {
    localStorage.setItem('caveEscapeSettings', JSON.stringify(settings));
}

/**
 * ゲームの設定を読み込み
 */
function loadGameSettings() {
    const settings = localStorage.getItem('caveEscapeSettings');
    return settings ? JSON.parse(settings) : {
        volume: 0.7,
        musicVolume: 0.5,
        muted: false
    };
}

/**
 * デバッグ情報の表示
 */
function showDebugInfo() {
    if (!window.game) return;
    
    const debugInfo = `
        ゲーム状態: ${window.game.gameState}
        スコア: ${window.game.score}
        ステージ: ${window.game.currentStage}
        距離: ${window.game.distance}
        パーティクル数: ${window.game.particles ? window.game.particles.length : 0}
        ロケット位置: (${window.game.rocket ? Math.round(window.game.rocket.x) : 0}, ${window.game.rocket ? Math.round(window.game.rocket.y) : 0})
    `;
    
    console.log(debugInfo);
}

/**
 * ゲームのリセット
 */
function resetGame() {
    if (window.game) {
        window.game.resetGame();
        console.log('ゲームをリセットしました');
    }
}

/**
 * フルスクリーンモードの切り替え
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('フルスクリーンにできませんでした:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// グローバル関数として公開
window.getGameStats = getGameStats;
window.saveHighScore = saveHighScore;
window.showDebugInfo = showDebugInfo;
window.resetGame = resetGame;
window.toggleFullscreen = toggleFullscreen;

// 開発者向けのデバッグコマンド
if (typeof window !== 'undefined') {
    window.debug = {
        showInfo: showDebugInfo,
        reset: resetGame,
        stats: getGameStats,
        fullscreen: toggleFullscreen
    };
}
