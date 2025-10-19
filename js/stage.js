/**
 * ステージ管理クラス
 */
class StageManager {
    constructor() {
        this.currentStage = 1;
        this.stageConfigs = {
            1: {
                stage: 1,
                speed: 1,
                heightLimit: 1,
                wallSpacing: 'とても広い',
                description: 'チュートリアル',
                bgColor: '#2c3e50',
                wallColor: '#34495e'
            },
            2: {
                stage: 2,
                speed: 1,
                heightLimit: 2,
                wallSpacing: '広い',
                description: '高さ制限追加',
                bgColor: '#34495e',
                wallColor: '#2c3e50'
            },
            3: {
                stage: 3,
                speed: 4,
                heightLimit: 2,
                wallSpacing: '広い',
                description: '高速スクロール',
                bgColor: '#8e44ad',
                wallColor: '#9b59b6'
            },
            4: {
                stage: 4,
                speed: 2,
                heightLimit: 4,
                wallSpacing: '狭い',
                description: '複雑な壁パターン',
                bgColor: '#e67e22',
                wallColor: '#f39c12'
            },
            5: {
                stage: 5,
                speed: 3,
                heightLimit: 5,
                wallSpacing: 'とても狭い',
                description: '最終ステージ',
                bgColor: '#c0392b',
                wallColor: '#e74c3c'
            }
        };
    }
    
    setStage(stageNumber) {
        if (stageNumber >= 1 && stageNumber <= 5) {
            this.currentStage = stageNumber;
        }
    }
    
    getConfig() {
        return this.stageConfigs[this.currentStage] || this.stageConfigs[1];
    }
    
    getCurrentStage() {
        return this.currentStage;
    }
    
    getStageDescription() {
        return this.getConfig().description;
    }
    
    getStageColor() {
        return this.getConfig().bgColor;
    }
    
    getWallColor() {
        return this.getConfig().wallColor;
    }
    
    isLastStage() {
        return this.currentStage >= 5;
    }
    
    getNextStage() {
        if (this.currentStage < 5) {
            return this.currentStage + 1;
        }
        return null;
    }
    
    getStageProgress(currentDistance) {
        const targetDistance = 2000; // 各ステージの目標距離
        return Math.min(currentDistance / targetDistance, 1);
    }
    
    getStageInfo() {
        const config = this.getConfig();
        return {
            stage: config.stage,
            speed: config.speed,
            heightLimit: config.heightLimit,
            wallSpacing: config.wallSpacing,
            description: config.description,
            bgColor: config.bgColor,
            wallColor: config.wallColor
        };
    }
    
    // ステージの難易度に基づく追加の設定
    getDifficultyMultiplier() {
        const multipliers = {
            1: 1.0,   // チュートリアル
            2: 1.2,   // 少し難しく
            3: 1.5,   // 中程度
            4: 2.0,   // 難しい
            5: 2.5    // 最難関
        };
        return multipliers[this.currentStage] || 1.0;
    }
    
    // ステージごとの特別な効果
    getSpecialEffects() {
        const effects = {
            1: [], // チュートリアル：特別な効果なし
            2: ['height_warning'], // 高さ警告
            3: ['speed_lines'], // 速度線エフェクト
            4: ['complex_patterns'], // 複雑なパターン
            5: ['final_boss_effect'] // 最終ボス効果
        };
        return effects[this.currentStage] || [];
    }
    
    // ステージクリア条件のチェック
    checkStageClear(distance) {
        return distance >= 2000;
    }
    
    // 全ステージクリアのチェック
    checkAllClear() {
        return this.currentStage >= 5;
    }
    
    // ステージの統計情報
    getStageStats() {
        const config = this.getConfig();
        return {
            stage: config.stage,
            difficulty: this.getDifficultyMultiplier(),
            speed: config.speed,
            heightLimit: config.heightLimit,
            wallSpacing: config.wallSpacing,
            specialEffects: this.getSpecialEffects(),
            targetDistance: 2000
        };
    }
}
