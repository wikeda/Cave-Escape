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
   * ゲーム内HUDを表示（宇宙船コックピット風）
   * @param {number} distancePx - 現在の距離（ピクセル）
   * @param {number} stageIndex - ステージインデックス
   */
  hud(distancePx, stageIndex) {
    const ctx = this.ctx;
    ctx.save();
    
    // 小さなサイズでコンパクトに
    const hudWidth = 300;
    const hudHeight = 40;
    const y = 8; // 画面上部から少し下
    const x = (this.canvas.width - hudWidth) / 2; // 中央配置
    
    // HUDの座標を原点(0, 0)に設定
    ctx.translate(x, y);
    
    // 宇宙船コックピット風の背景
    this._drawCockpitBackground(ctx, 0, 0, hudWidth, hudHeight);
    
    // スキャンライン効果
    this._drawScanLines(ctx, 0, 0, hudWidth, hudHeight);
    
    // 青いグロー効果
    this._drawGlowEffect(ctx, 0, 0, hudWidth, hudHeight);
    
    // テキストの描画（宇宙船の計器盤風）
    this._drawCockpitText(ctx, stageIndex, distancePx, hudWidth, hudHeight);
    
    ctx.restore();
  }

  /**
   * 宇宙船コックピット風の背景を描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} width - 幅
   * @param {number} height - 高さ
   */
  _drawCockpitBackground(ctx, x, y, width, height) {
    // メインの背景（半透明の黒）
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(0, 20, 20, 0.95)');
    gradient.addColorStop(0.5, 'rgba(0, 30, 30, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 40, 40, 0.85)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // 上部の境界線（緑のグロー）
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    
    // 微細なグリッドパターン
    this._drawGridPattern(ctx, x, y, width, height);
  }

  /**
   * グリッドパターンを描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} width - 幅
   * @param {number} height - 高さ
   */
  _drawGridPattern(ctx, x, y, width, height) {
    ctx.strokeStyle = 'rgba(0, 100, 0, 0.1)';
    ctx.lineWidth = 0.5;
    
    // 縦線
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i, y + height);
      ctx.stroke();
    }
    
    // 横線
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(x, y + i);
      ctx.lineTo(x + width, y + i);
      ctx.stroke();
    }
  }

  /**
   * スキャンライン効果を描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} width - 幅
   * @param {number} height - 高さ
   */
  _drawScanLines(ctx, x, y, width, height) {
    const time = Date.now() * 0.001;
    const scanLineY = y + (time * 12.5) % height;  // 元の50から12.5に変更（4倍遅く）
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, scanLineY);
    ctx.lineTo(x + width, scanLineY);
    ctx.stroke();
  }

  /**
   * 青いグロー効果を描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} width - 幅
   * @param {number} height - 高さ
   */
  _drawGlowEffect(ctx, x, y, width, height) {
    // 外側のグロー
    ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, width, height);
    
    // 内側のグロー
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
  }

  /**
   * 宇宙船の計器盤風テキストを描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} stageIndex - ステージインデックス
   * @param {number} distancePx - 距離（ピクセル）
   * @param {number} width - 幅
   * @param {number} height - 高さ
   */
  _drawCockpitText(ctx, stageIndex, distancePx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // フォント設定（より小さいサイズ）
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // コンソール風の緑色（#00FF00）
    const consoleGreen = 'rgba(0, 255, 0, 0.95)';
    const shadowGreen = 'rgba(0, 255, 0, 0.4)';
    
    // ステージ表示
    ctx.fillStyle = consoleGreen;
    ctx.shadowColor = shadowGreen;
    ctx.shadowBlur = 2;
    ctx.fillText(`ST${stageIndex + 1}`, centerX - 45, centerY);
    
    // 距離表示
    ctx.fillStyle = consoleGreen;
    ctx.shadowColor = shadowGreen;
    ctx.shadowBlur = 2;
    ctx.fillText(`${formatKm(distancePx)}Km`, centerX + 45, centerY);
    
    // 中央の区切り線
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX, centerY + 10);
    ctx.stroke();
    
    // ステータスインジケーター
    this._drawStatusIndicators(ctx, centerX, centerY);
  }

  /**
   * ステータスインジケーターを描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} centerX - 中央X座標
   * @param {number} centerY - 中央Y座標
   */
  _drawStatusIndicators(ctx, centerX, centerY) {
    // 左側のインジケーター（緑）
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(centerX - 70, centerY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 右側のインジケーター（緑）
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX + 70, centerY, 1.5, 0, Math.PI * 2);
    ctx.fill();
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

