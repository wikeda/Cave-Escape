/**
 * 値を指定範囲内にクランプする
 * @param {number} v - 値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number} クランプされた値
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * 線形補間
 * @param {number} a - 開始値
 * @param {number} b - 終了値
 * @param {number} t - 補間係数（0-1）
 * @returns {number} 補間された値
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lineIntersect(a, b, c, d) {
  // segment AB vs CD
  const dxa = b.x - a.x;
  const dya = b.y - a.y;
  const dxb = d.x - c.x;
  const dyb = d.y - c.y;
  const denom = dxa * dyb - dya * dxb;
  if (denom === 0) return false;
  const t = ((c.x - a.x) * dyb - (c.y - a.y) * dxb) / denom;
  const u = ((c.x - a.x) * dya - (c.y - a.y) * dxa) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function polygonEdges(poly) {
  const edges = [];
  for (let i = 0; i < poly.length; i++) {
    edges.push([poly[i], poly[(i + 1) % poly.length]]);
  }
  return edges;
}

export function polylineYAtX(points, x) {
  // assumes points sorted by x and spanning x
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const q = points[i + 1];
    if ((x >= p.x && x <= q.x) || (x >= q.x && x <= p.x)) {
      const t = (x - p.x) / (q.x - p.x);
      return lerp(p.y, q.y, t);
    }
  }
  // fallback: clamp to first/last segment
  if (x < points[0].x) return points[0].y;
  return points[points.length - 1].y;
}

export function formatKm(px) {
  const km = px / 100; // 1km = 100px (1px=10m)
  return km.toFixed(1);
}

