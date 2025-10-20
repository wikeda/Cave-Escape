/**
 * ステージ設定データ
 * distancePx: 1km = 100px (1px = 10m)
 */
//  { speed: 175, minGap: 340, slopePer100: 25, period: 600, distancePx: 5_000,  colorTop: '#2c425c', colorBot: '#273b53' },
export const STAGES = [
  // ステージ1: 40km - チュートリアル（暖色系）
  { 
    speed: 175, 
    minGap: 340, 
    slopePer100: 25, 
    period: 600, 
    distancePx: 5_000,  
    colorTop: '#235913', 
    colorBot: '#235913',
    colorCorridor: '#d1e8ce'  // 薄い緑の通路
  },
  // ステージ2: 75km - 高さ制限追加（黄色系）
  { 
    speed: 200, 
    minGap: 300, 
    slopePer100: 35, 
    period: 520, 
    distancePx: 7_500,  
    colorTop: '#968700', 
    colorBot: '#968700',
    colorCorridor: '#efecc2'  // 薄い緑の通路
  },
  // ステージ3: 100km - 高速スクロール（赤系）
  { 
    speed: 300, 
    minGap: 260, 
    slopePer100: 45, 
    period: 450, 
    distancePx: 10_000, 
    colorTop: '#600f10', 
    colorBot: '#600f10',
    colorCorridor: '#b77c7c'  // 薄い赤の通路
  },
  // ステージ4: 40km - 複雑な壁パターン（灰色）
  { 
    speed: 100, 
    minGap: 200, 
    slopePer100: 55, 
    period: 390, 
    distancePx: 4_000, 
    colorTop: '#4a3a2f', 
    colorBot: '#433426',
    colorCorridor: '#666666'  // 明るい通路
  },
  // ステージ5: 150km - 最終ステージ（神秘的な紫系）
  { 
    speed: 800, 
    minGap: 250, 
    slopePer100: 700, 
    period: 900, 
    distancePx: 15_000,  
    colorTop: '#470093', 
    colorBot: '#470093',
    colorCorridor: '#6f4399'  // 薄い紫の通路
  },
];

// ゲーム画面の論理サイズ
export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 450;
export const TOP_BOTTOM_MARGIN = 20;  // 上下マージン（ピクセル）
