import { clamp, lineIntersect } from './util.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, TOP_BOTTOM_MARGIN } from './stage.js';

/**
 * 洞窟生成クラス
 * ランダムな洞窟の壁を生成し、当たり判定を管理
 */
export class Cave {
  constructor(params, safeDistPx = 600) {
    this.params = params;  // { minGap, period, slopePer100 } 洞窟パラメータ
    this.segment = 10;  // 点間の距離（ピクセル）
    this.top = [];  // 天井の壁データ
    this.bot = [];  // 床の壁データ
    this.rightX = 0;  // 右端のX座標
    this.total = 0;  // ノイズ位相用の総距離（ピクセル）
    this.seed = Math.random() * 10000;  // ランダムシード
    this.safeDistPx = safeDistPx;  // 初期距離での中心をまっすぐに保つ
    this.nightSkyMode = false;  // 夜空モードフラグ
    this.stars = [];  // 星のデータ
    this.scrollOffset = 0;  // スクロールオフセット
    const pat = this._createRockPattern();
    this.pattern = pat.pattern;
    this.patternSize = pat.size;
    
    // 洞窟のギザギザパラメータ（鍾乳石・石筍のような）
    this.cellW = 24;       // 水平セル幅（ステップ変更用）
    this.stepY = 12;       // 垂直量子化ステップ
    this.spikeProb = 0.20; // セルごとの突起発生確率
    this.spikeMax = 72;    // 最大突起高さ（ピクセル、片側）
    this.reset();
  }

  reset() {
    this.top.length = 0;
    this.bot.length = 0;
    this.rightX = 0;
    this.total = 0;
    // Initialize spanning the screen
    while (this.rightX <= LOGICAL_WIDTH + this.segment) {
      this._pushPoint();
    }
  }

  setParams(params) { this.params = params; }

  /**
   * スクロールオフセットを設定
   * @param {number} offset - スクロールオフセット
   */
  setScrollOffset(offset) {
    this.scrollOffset = offset;
  }

  /**
   * 夜空モードを設定
   * @param {boolean} enabled - 夜空モードの有効/無効
   */
  setNightSkyMode(enabled) {
    this.nightSkyMode = enabled;
    if (enabled && this.stars.length === 0) {
      this._generateStars();
    }
  }

  /**
   * 星を初期化（夜空モード用）
   */
  _generateStars() {
    this.stars = [];
    const numStars = 150;  // 星の数を増加
    for (let i = 0; i < numStars; i++) {
      // スクロールオフセットを考慮してワールド座標で配置
      const worldX = this.scrollOffset + Math.random() * LOGICAL_WIDTH;
      this.stars.push({
        x: worldX,  // ワールド座標
        y: Math.random() * LOGICAL_HEIGHT,  // 上下全体に配置
        size: Math.random() * 2 + 0.5,  // 0.5-2.5ピクセル
        brightness: Math.random() * 0.8 + 0.2,  // 0.2-1.0の明度
        twinklePhase: Math.random() * Math.PI * 2  // 瞬きの位相
      });
    }
  }

  _centerYAt(x) {
    const travel = this.total + x;
    // Safe corridor at start: keep center in the middle
    if (travel < this.safeDistPx) {
      const margin = TOP_BOTTOM_MARGIN + this.params.minGap / 2;
      return clamp(LOGICAL_HEIGHT / 2, margin, LOGICAL_HEIGHT - margin);
    }
    const t = travel / this.params.period;
    // Two sine components with slight detune + seeded offset
    const y0 = LOGICAL_HEIGHT / 2;
    const a1 = 60, a2 = 30;
    const w1 = 2 * Math.PI;
    const w2 = 2 * Math.PI * 1.37;
    const phase = this.seed;
    let y = y0 + a1 * Math.sin(w1 * t + phase) + a2 * Math.sin(w2 * t * 0.6 + phase * 0.31);
    // Clamp slope: limit delta per 100px to slopePer100
    if (this.top.length >= 2) {
      const prev = (this.top[this.top.length - 1].y + this.bot[this.bot.length - 1].y) / 2;
      const maxDelta = this.params.slopePer100 * (this.segment / 100);
      y = clamp(y, prev - maxDelta, prev + maxDelta);
    }
    const margin = TOP_BOTTOM_MARGIN + this.params.minGap / 2;
    y = clamp(y, margin, LOGICAL_HEIGHT - margin);
    return y;
  }

  _pushPoint() {
    const x = this.rightX;
    const travel = this.total + x;
    const margin = TOP_BOTTOM_MARGIN;

    // Base center from smooth noise, then make it blocky by quantization
    let centerY = this._centerYAt(x);
    centerY = Math.round(centerY / this.stepY) * this.stepY;

    // Base gap (keep minimum), quantized a bit so edges look flatter
    let gap = this.params.minGap;
    gap = Math.round(gap / this.stepY) * this.stepY;

    let topY = centerY - gap / 2;
    let botY = centerY + gap / 2;

    // Add stalactite/stalagmite spikes per horizontal cell deterministically
    const cellIndex = Math.floor(travel / this.cellW);
    const rTop = this._rand(cellIndex * 2 + 1);
    const rBot = this._rand(cellIndex * 2 + 2);
    const spikeShape = (t) => {
      // simple flat-topped spike inside a cell (rect-like)
      const u = (travel % this.cellW) / this.cellW; // 0..1 within cell at this x
      return (u > 0.15 && u < 0.85) ? 1 : 0.6; // slightly beveled edges
    };
    if (travel >= this.safeDistPx) {
      if (rTop < this.spikeProb) {
        const h = this.stepY * (1 + Math.floor(this._rand(cellIndex * 13 + 7) * (this.spikeMax / this.stepY)));
        topY -= h * spikeShape();
      }
      if (rBot < this.spikeProb) {
        const h = this.stepY * (1 + Math.floor(this._rand(cellIndex * 17 + 9) * (this.spikeMax / this.stepY)));
        botY += h * spikeShape();
      }
    }

    // Keep constraints: margins and min gap
    topY = clamp(topY, margin, LOGICAL_HEIGHT - margin - this.params.minGap);
    botY = clamp(botY, topY + this.params.minGap, LOGICAL_HEIGHT - margin);

    // Quantize again after clamps to keep edges straight-ish
    topY = Math.round(topY / this.stepY) * this.stepY;
    botY = Math.round(botY / this.stepY) * this.stepY;

    this.top.push({ x, y: topY });
    this.bot.push({ x, y: botY });
    this.rightX += this.segment;
  }

  _rand(i) {
    // deterministic pseudo-random in [0,1)
    const s = Math.sin(i * 12.9898 + this.seed * 0.123) * 43758.5453;
    return s - Math.floor(s);
  }

  update(dx) {
    // Scroll points left by dx, generate more to the right
    this.total += dx;
    for (const p of this.top) p.x -= dx;
    for (const p of this.bot) p.x -= dx;
    // keep the logical right-edge tracker in screen space
    this.rightX -= dx;
    // remove left segments
    while (this.top.length > 2 && this.top[1].x < -this.segment) {
      this.top.shift();
      this.bot.shift();
    }
    // add right segments
    while (this.rightX <= LOGICAL_WIDTH + this.segment) {
      this._pushPoint();
    }
  }

  draw(ctx) {
    ctx.save();
    
    if (this.nightSkyMode) {
      // 夜空モード：壁を描画せず、夜空の背景と星を描画
      this._drawNightSky(ctx);
    } else {
      // 通常モード：洞窟の壁を描画
      const baseTop = this.params.colorTop || '#2c425c';
      const baseBot = this.params.colorBot || '#273b53';

      this._fillArea(ctx, true, baseTop);
      this._fillArea(ctx, false, baseBot);

      // エッジの線を描画
      this._strokeEdge(ctx, this.top, baseTop);  // 上の壁のエッジ線
      this._strokeEdge(ctx, this.bot, baseBot);  // 下の壁のエッジ線（上の壁と同じ明るさ）

      this._drawInnerShadow(ctx);
    }
    
    ctx.restore();
  }

  /**
   * 夜空を描画
   */
  _drawNightSky(ctx) {
    // 夜空の背景（紺色のグラデーション）
    const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    gradient.addColorStop(0, '#0a0a2e');  // 濃い紺
    gradient.addColorStop(0.5, '#16213e');  // 中間の紺
    gradient.addColorStop(1, '#0f3460');  // やや明るい紺
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    // 星を描画
    this._drawStars(ctx);
  }

  /**
   * 星を描画（瞬き効果付き）
   */
  _drawStars(ctx) {
    const time = Date.now() * 0.001;  // 現在時刻（秒）
    
    // 星の無限スクロールを実装
    this._updateStars();
    
    this.stars.forEach(star => {
      ctx.save();
      
      // より強い瞬き効果（複数の正弦波を組み合わせてキラキラ効果を強化）
      const twinkle1 = Math.sin(time * 2 + star.twinklePhase) * 0.4 + 0.6;  // 0.2-1.0の振動
      const twinkle2 = Math.sin(time * 3.5 + star.twinklePhase * 0.7) * 0.3 + 0.5;  // 別の周波数
      const twinkle = Math.max(twinkle1, twinkle2);  // より明るい方を選択
      const alpha = star.brightness * twinkle;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = star.size * 3;  // グロー効果を強化
      
      // 星を描画（十字形）- スクロールオフセットを考慮
      const x = star.x - this.scrollOffset;
      const y = star.y;
      const size = star.size;
      
      // 画面内にある星のみ描画
      if (x > -50 && x < LOGICAL_WIDTH + 50) {
        ctx.beginPath();
        // 横線
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        // 縦線
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.lineWidth = 1.5;  // 線を少し太く
        ctx.stroke();
        
        // 中心の点（より明るく）
        ctx.globalAlpha = alpha * 1.2;  // さらに明るく
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);  // 中心をやや大きく
        ctx.fill();
      }
      
      ctx.restore();
    });
  }

  /**
   * 星の位置を更新（無限スクロール用）
   */
  _updateStars() {
    // 画面左端から出た星を画面全体に再配置
    this.stars.forEach(star => {
      const screenX = star.x - this.scrollOffset;
      if (screenX < -100) {
        // 星をワールド座標で画面全体の右側に撒き直す
        star.x = this.scrollOffset + Math.random() * (LOGICAL_WIDTH + 200);
        star.y = Math.random() * LOGICAL_HEIGHT;
        star.brightness = Math.random() * 0.8 + 0.2;
        star.twinklePhase = Math.random() * Math.PI * 2;
      }
    });
  }

  _fillArea(ctx, isTop, baseColor) {
    if (isTop) this._pathTop(ctx); else this._pathBottom(ctx);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = this.pattern;
    ctx.save();
    ctx.translate(- (this.total % this.patternSize), 0);
    ctx.fillRect(-this.patternSize, 0, LOGICAL_WIDTH + this.patternSize * 2, LOGICAL_HEIGHT);
    ctx.restore();
    ctx.restore();
  }

  _strokeEdge(ctx, isTop, color) {
    const path = isTop ? this.top : this.bot;
    ctx.save();
    ctx.lineWidth = 1;  // 1ピクセルの線
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 下の壁専用のエッジ線を描画（より目立つように）
   * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
   * @param {string} color - 線の色
   */
  _strokeBottomEdge(ctx, color) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(this.bot[0].x, this.bot[0].y);
    for (const p of this.bot) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 色を明るくするヘルパーメソッド
   * @param {string} hexColor - 16進数カラーコード
   * @param {number} factor - 明るさの係数（0-1）
   * @returns {string} 明るくなった色
   */
  _brightenColor(hexColor, factor) {
    // #を除去
    const hex = hexColor.replace('#', '');
    
    // RGBに変換
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 明るくする
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    // 16進数に戻す
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  _strokeHighlight(ctx, isTop, color) {
    const path = isTop ? this.top : this.bot;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (const p of path) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  _drawInnerShadow(ctx) {
    ctx.save();
    this._pathCorridor(ctx);
    ctx.clip();

    const gradTop = ctx.createLinearGradient(0, 0, 0, 16);
    gradTop.addColorStop(0, 'rgba(0,0,0,0.25)');
    gradTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, 16);

    const gradBot = ctx.createLinearGradient(0, LOGICAL_HEIGHT, 0, LOGICAL_HEIGHT - 16);
    gradBot.addColorStop(0, 'rgba(0,0,0,0.25)');
    gradBot.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradBot;
    ctx.fillRect(0, LOGICAL_HEIGHT - 16, LOGICAL_WIDTH, 16);

    ctx.restore();
  }
  _pathTop(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.top[0].x, 0);
    for (const p of this.top) ctx.lineTo(p.x, p.y);
    ctx.lineTo(this.top[this.top.length - 1].x, 0);
    ctx.closePath();
  }

  _pathBottom(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.bot[0].x, LOGICAL_HEIGHT);
    for (const p of this.bot) ctx.lineTo(p.x, p.y);
    ctx.lineTo(this.bot[this.bot.length - 1].x, LOGICAL_HEIGHT);
    ctx.closePath();
  }

  _createRockPattern() {
    const c = document.createElement('canvas');
    const size = 256;
    c.width = size; c.height = size;
    const g = c.getContext('2d');
    // base tint
    g.fillStyle = '#1f3347';
    g.fillRect(0, 0, size, size);
    // speckles
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 0.7 + Math.random() * 2.0;
      const a = 0.08 + Math.random() * 0.12;
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // darker blotches
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = 10 + Math.random() * 36;
      const h = 8 + Math.random() * 26;
      const a = 0.08 + Math.random() * 0.12;
      g.fillStyle = `rgba(0,0,0,${a})`;
      g.beginPath(); g.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2); g.fill();
    }
    // subtle veins
    g.strokeStyle = 'rgba(200,220,255,0.05)';
    g.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const y0 = Math.random() * size;
      g.beginPath();
      g.moveTo(0, y0);
      for (let x = 0; x <= size; x += 10) {
        const y = y0 + Math.sin((x / size) * Math.PI * 2 + i) * 8 + (Math.random() - 0.5) * 5;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    return { pattern: g.createPattern(c, 'repeat'), size };
  }

  _drawRim(ctx, poly, inwardSign, thickness, baseColor) {
    const inner = this._offsetPolyline(poly, inwardSign, thickness);
    // Create band polygon: outer along original poly, back along inner reversed
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i].x, inner[i].y);
    ctx.closePath();
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = this.pattern;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.restore();
  }

  _offsetPolyline(points, inwardSign, thickness) {
    const out = new Array(points.length);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const pPrev = points[Math.max(0, i - 1)];
      const pNext = points[Math.min(points.length - 1, i + 1)];
      const n = this._normalDown(pPrev, pNext);
      const nx = n.x;
      const ny = n.y;
      // inwardSign: +1 for top (downwards), -1 for bottom (upwards)
      out[i] = { x: p.x + nx * thickness * inwardSign, y: p.y + ny * thickness * inwardSign };
    }
    return out;
  }

  _normalDown(a, b) {
    // normal pointing roughly downwards relative to segment a->b
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Right-hand normal (dx,dy) -> (dy,-dx) points downward when dx>0
    return { x: dy / len, y: -dx / len };
  }

  _pathCorridor(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.top[0].x, this.top[0].y);
    for (const p of this.top) ctx.lineTo(p.x, p.y);
    for (let i = this.bot.length - 1; i >= 0; i--) {
      const p = this.bot[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
  }

  _drawInnerShadow(ctx) {
    ctx.save();
    // Clip to corridor only
    this._pathCorridor(ctx);
    ctx.clip();
    // Shadow along top
    const gradTop = ctx.createLinearGradient(0, 0, 0, 16);
    gradTop.addColorStop(0, 'rgba(0,0,0,0.25)');
    gradTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, 24);
    // Shadow along bottom
    const gradBot = ctx.createLinearGradient(0, LOGICAL_HEIGHT, 0, LOGICAL_HEIGHT - 16);
    gradBot.addColorStop(0, 'rgba(0,0,0,0.25)');
    gradBot.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradBot;
    ctx.fillRect(0, LOGICAL_HEIGHT - 16, LOGICAL_WIDTH, 16);
    ctx.restore();
  }

  // Collision: rocket polygon vs top/bottom polylines
  collides(rocketPoly) {
    // Quick reject: vertex outside corridor test
    for (const v of rocketPoly) {
      const topY = this._yAtX(this.top, v.x);
      const botY = this._yAtX(this.bot, v.x);
      if (v.y < topY || v.y > botY) return true;
    }
    // Edge intersections
    for (let i = 0; i < rocketPoly.length; i++) {
      const a = rocketPoly[i];
      const b = rocketPoly[(i + 1) % rocketPoly.length];
      if (this._polylineIntersects(a, b, this.top)) return true;
      if (this._polylineIntersects(a, b, this.bot)) return true;
    }
    return false;
  }

  centerAtX(x) {
    const ty = this._yAtX(this.top, x);
    const by = this._yAtX(this.bot, x);
    return (ty + by) / 2;
  }

  _polylineIntersects(a, b, line) {
    for (let i = 0; i < line.length - 1; i++) {
      const c = line[i];
      const d = line[i + 1];
      if (lineIntersect(a, b, c, d)) return true;
    }
    return false;
  }

  _yAtX(line, x) {
    // find y at x using segment interpolation
    for (let i = 0; i < line.length - 1; i++) {
      const p = line[i];
      const q = line[i + 1];
      if ((x >= p.x && x <= q.x) || (x >= q.x && x <= p.x)) {
        const t = (x - p.x) / (q.x - p.x);
        return p.y + (q.y - p.y) * t;
      }
    }
    // extrapolate
    if (x < line[0].x) return line[0].y;
    return line[line.length - 1].y;
  }
}



