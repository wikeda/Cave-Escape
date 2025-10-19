import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './stage.js';
import { Game } from './game.js';
import { UI } from './ui.js';

// DOM要素の取得
const canvas = document.getElementById('game');
const overlay = document.getElementById('overlay');
const hudExtra = document.getElementById('hud-extra');
const pauseBtn = document.getElementById('pause-btn');

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

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    if (game.state === 'playing') game.togglePause();
  });
}

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

function handleAction(action) {
  switch (action) {
    case 'start':
      if (game.state === 'title') game.start();
      break;
    case 'resume':
      if (game.state === 'paused') game.togglePause();
      break;
    case 'restart':
      game.restart();
      break;
    case 'continue':
      game.nextStageOrClear();
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
  } else if (game.state === 'paused') {
    handleAction('resume');
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
    pauseBtn?.classList.add('hidden');
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
    pauseBtn?.classList.remove('hidden');
  } else if (game.state === 'paused') {
    game.draw();
    setOverlay([
      `<div class="overlay-panel">
        <h1>一時停止中</h1>
        <p>再開するかタイトルへ戻るか選択してください。</p>
        <div class="overlay-button-group">
          <button class="overlay-button" data-action="resume">再開</button>
          <button class="overlay-button" data-action="restart">タイトルへ戻る</button>
        </div>
      </div>`
    ], { interactive: true });
    setHudExtra([
      `累計距離: ${game.formattedCurrentDistance()} km`,
      `ベスト距離: ${game.formattedBestDistance()} km`
    ]);
    pauseBtn?.classList.add('hidden');
  } else if (game.state === 'gameover') {
    game.draw();
    const distance = game.formattedCurrentDistance();
    setOverlay([
      `<div class="overlay-panel">
        <h1>ゲームオーバー</h1>
        <p>到達距離: ${distance} km</p>
        <button class="overlay-button" data-action="restart">タイトルへ戻る</button>
      </div>`
    ], { interactive: true });
    setHudExtra([
      `今回の距離: ${distance} km`,
      `ベスト距離: ${game.formattedBestDistance()} km`
    ]);
    pauseBtn?.classList.add('hidden');
  } else if (game.state === 'gameclear') {
    game.draw();
    setOverlay([
      `<div class="overlay-panel">
        <h1>全ステージクリア！</h1>
        <p>おめでとうございます！</p>
        <p>クリア距離: ${game.formattedCurrentDistance()} km</p>
        <button class="overlay-button" data-action="restart">タイトルへ戻る</button>
      </div>`
    ], { interactive: true });
    setHudExtra([
      `クリア距離: ${game.formattedCurrentDistance()} km`,
      `ベスト距離: ${game.formattedBestDistance()} km`
    ]);
    pauseBtn?.classList.add('hidden');
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

