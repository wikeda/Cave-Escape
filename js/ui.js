import { formatKm } from './util.js';
import { LOGICAL_WIDTH } from './stage.js';

/**
 * UI管理クラス
 * ゲーム内のUI表示を担当
 */
export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * キャンバスをクリア
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 角丸矩形を描画
   * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {number} radius - 角の半径
   */
  _drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * ゲーム内HUDを表示（中央配置、1行表示）
   * @param {number} distancePx - 現在の距離（ピクセル）
   * @param {number} stageIndex - ステージインデックス
   */
  hud(distancePx, stageIndex) {
    const ctx = this.ctx;
    ctx.save();
    
    // 1行のテキストを作成
    const text = `Stage: ${stageIndex + 1} Dist: ${formatKm(distancePx)} km`;
    
    // テキストサイズを設定
    ctx.font = 'bold 18px system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // テキストサイズを測定
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 20;
    const paddingX = 20;
    const paddingY = 12;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = textHeight + paddingY * 2;
    
    // 中央位置を計算
    const x = (this.canvas.width - boxWidth) / 2;
    const y = 20; // 上部から20px
    const radius = 8;
    
    // 角丸の背景ボックス
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this._drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);
    ctx.fill();
    
    // ボーダー効果
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    this._drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);
    ctx.stroke();
    
    // テキストの描画
    ctx.fillStyle = '#ffffff';
    
    // テキストに影を追加
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(text, this.canvas.width / 2, y + paddingY);
    
    ctx.restore();
  }

  /**
   * 中央にテキストを表示
   * @param {string[]} lines - 表示するテキスト行の配列
   */
  centerText(lines) {
    const ctx = this.ctx;
    ctx.save();
    
    // テキストサイズを測って黒いラウンドボックスを作成
    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    const metrics = lines.map(t => ctx.measureText(t));
    const maxWidth = Math.max(...metrics.map(m => m.width));
    const paddingX = 28, paddingY = 18, lineGap = 12, lineHeight = 32;
    const boxWidth = maxWidth + paddingX * 2;
    const boxHeight = lines.length * lineHeight + (lines.length - 1) * lineGap + paddingY * 2;
    const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
    const x = Math.round(cx - boxWidth / 2), y0 = Math.round(cy - boxHeight / 2);
    
    // 角丸矩形の描画
    const r = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.moveTo(x + r, y0);
    ctx.arcTo(x + boxWidth, y0, x + boxWidth, y0 + boxHeight, r);
    ctx.arcTo(x + boxWidth, y0 + boxHeight, x, y0 + boxHeight, r);
    ctx.arcTo(x, y0 + boxHeight, x, y0, r);
    ctx.arcTo(x, y0, x + boxWidth, y0, r);
    ctx.closePath();
    ctx.fill();

    // 白文字をボックス中央に描画
    ctx.fillStyle = '#ffffff';
    let y = y0 + paddingY + lineHeight;
    for (const line of lines) {
      ctx.fillText(line, cx, y);
      y += lineHeight + lineGap;
    }
    ctx.restore();
  }
}

