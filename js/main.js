import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './stage.js';
import { Game } from './game.js';
import { UI } from './ui.js';

// DOM要素の取得
const canvas = document.getElementById('game');
const overlay = document.getElementById('overlay');
const hudExtra = document.getElementById('hud-extra');

// キャンバスサイズの設定
canvas.width = LOGICAL_WIDTH;
canvas.height = LOGICAL_HEIGHT;

// ゲームインスタンスの作成
const game = new Game(canvas);
const ui = new UI(canvas);

function setOverlay(lines, options = {}) {
  const { interactive = false } = options;
  if (!lines) {
    overlay.classList.add('hidden');
    overlay.classList.remove('interactive');
    overlay.textContent = '';
    return;
  }
  overlay.classList.remove('hidden');
  overlay.classList.toggle('interactive', interactive);
  overlay.innerHTML = lines.map((l) => `<div>${l}</div>`).join('');
}

function setHudExtra(lines) {
  if (!hudExtra) return;
  if (!lines || lines.length === 0) {
    hudExtra.classList.add('hidden');
    hudExtra.innerHTML = '';
    return;
  }
  hudExtra.classList.remove('hidden');
  hudExtra.innerHTML = lines.map((l) => `<div>${l}</div>`).join('');
}

function inputDown() { game.setThrust(true); }
function inputUp() { game.setThrust(false); }

canvas.addEventListener('mousedown', (e) => { inputDown(); if (game.state === 'title') game.start(); });
canvas.addEventListener('mouseup', inputUp);
canvas.addEventListener('mouseleave', inputUp);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); inputDown(); if (game.state === 'title') game.start(); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); inputUp(); }, { passive: false });
canvas.addEventListener('touchcancel', (e) => { e.preventDefault(); inputUp(); }, { passive: false });


overlay.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('.overlay-button');
  if (btn) btn.classList.add('active');
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => {
  overlay.addEventListener(evt, (e) => {
    const btn = e.target.closest('.overlay-button');
    if (btn) btn.classList.remove('active');
  });
});

// X投稿機能
function shareToTwitter() {
  const distance = game.formattedCurrentDistance();
  const stage = game.stageIndex + 1;
  const isGameClear = game.state === 'gameclear';
  
  let text;
  if (isGameClear) {
    text = `🚀 Cave Escape 全ステージクリア！\nクリア距離: ${distance} km\n\n#CaveEscape #ゲーム`;
  } else {
    text = `🚀 Cave Escape で ${distance} km 到達！\nステージ ${stage} でゲームオーバー\n\n#CaveEscape #ゲーム`;
  }
  
  const url = 'https://github.com/wikeda/Cave-Escape';
  const hashtags = 'CaveEscape,ゲーム,アクションゲーム';
  
  // XのWeb Intent URLを作成
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
  
  // 新しいタブでX投稿画面を開く
  window.open(twitterUrl, '_blank', 'width=600,height=400');
}

function handleAction(action) {
  switch (action) {
    case 'start':
      if (game.state === 'title') game.start();
      break;
    case 'restart':
      game.restart();
      break;
    case 'continue':
      game.nextStageOrClear();
      break;
    case 'tweet':
      shareToTwitter();
      break;
    default:
      break;
  }
}

overlay.addEventListener('pointerup', (e) => {
  const button = e.target.closest('[data-action]');
  if (button) {
    e.preventDefault();
    handleAction(button.getAttribute('data-action'));
    return;
  }
  if (!overlay.classList.contains('interactive')) return;
  if (game.state === 'title') {
    handleAction('start');
  }
});

overlay.addEventListener('click', (e) => {
  const button = e.target.closest('[data-action]');
  if (!button) return;
  e.preventDefault();
  handleAction(button.getAttribute('data-action'));
});

let last = performance.now();
let acc = 0;
const dt = 1 / 60;

function frame(now) {
  if (game.needsClockReset) {
    last = now;
    acc = 0;
    game.needsClockReset = false;
  }

  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += elapsed;

  // ui.clear(); // この行をコメントアウト

  if (game.state === 'title') {
    game.draw();
    setOverlay([
      `<div class="overlay-panel intro">
        <h1>Cave Escape</h1>
        <p class="tagline">危険な洞窟を抜け出す反重力ロケット・アクション</p>
        <ul>
          <li>タップ / クリック長押しで上昇、離して下降</li>
          <li>ステージ目標距離に到達すると自動で次へ進みます</li>
          <li>ベスト距離は端末に保存されます</li>
        </ul>
        <button class="overlay-button" data-action="start">タップでスタート</button>
      </div>`
    ], { interactive: true });
    setHudExtra([
      '操作: 画面をタップ/クリックで上昇・離して下降',
      `ベスト距離: ${game.formattedBestDistance()} km`
    ]);
  } else if (game.state === 'playing') {
    while (acc >= dt) { game.updateFrame(dt); acc -= dt; }
    game.draw();
    ui.hud(game.distancePx, game.stageIndex);
    setOverlay(null);
    setHudExtra([
      '操作: 画面をタップ/クリックで上昇・離して下降',
      `累計距離: ${game.formattedCurrentDistance()} km`,
      `ベスト距離: ${game.formattedBestDistance()} km`
    ]);
  } else if (game.state === 'gameover') {
    game.draw();
    const distance = game.formattedCurrentDistance();
    const stage = game.stageIndex + 1;
    setOverlay([
      `<div class="overlay-panel">
        <h1>ゲームオーバー</h1>
        <p>到達距離: ${distance} km</p>
        <p>ステージ: ${stage}</p>
        <div class="overlay-button-group">
          <button class="overlay-button" data-action="restart">タイトルへ戻る</button>
          <button class="overlay-button twitter-button" data-action="tweet">Xに投稿</button>
        </div>
      </div>`
    ], { interactive: true });
    setHudExtra([
      `今回の距離: ${distance} km`,
      `ベスト距離: ${game.formattedBestDistance()} km`
    ]);
  } else if (game.state === 'gameclear') {
    game.draw();
    const distance = game.formattedCurrentDistance();
    
    // パーティクルをオーバーレイの上に描画
    const ctx = game.ctx;
    ctx.save();
    ctx.globalAlpha = 0.8;  // 少し透明にして背景が見えるように
    game.particles.draw(ctx);
    ctx.restore();
    
    setOverlay([
      `<div class="overlay-panel">
        <h1>🎉 全ステージクリア！ 🎉</h1>
        <p>おめでとうございます！</p>
        <p>クリア距離: ${distance} km</p>
        <div class="overlay-button-group">
          <button class="overlay-button" data-action="restart">タイトルへ戻る</button>
          <button class="overlay-button twitter-button" data-action="tweet">Xに投稿</button>
        </div>
      </div>`
    ], { interactive: true });
    setHudExtra([
      `クリア距離: ${game.formattedCurrentDistance()} km`,
      `ベスト距離: ${game.formattedBestDistance()} km`
    ]);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

