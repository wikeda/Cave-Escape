class Game {
  constructor() {
    // DOM
    this.titleScreen = document.getElementById('titleScreen');
    this.gameScreen = document.getElementById('gameScreen');
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById('score');
    this.stageEl = document.getElementById('stage');

    // State
    this.gameState = 'title'; // title | playing | paused | gameOver
    this.lastTime = 0;
    this.distance = 0;
    this.stage = 1;
    this.isRunning = false;

    // Input
    this.keys = {};
    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); });
    document.addEventListener('keyup',   (e) => { this.keys[e.code] = false; });

    // UI handlers
    const startBtn = document.getElementById('startButton');
    if (startBtn) startBtn.addEventListener('click', () => this.startGame());

    // Initial draw
    this.showTitle();
    this.renderTitle();
  }

  showTitle() {
    this.gameState = 'title';
    this.isRunning = false;
    this.titleScreen.classList.remove('hidden');
    this.gameScreen.classList.add('hidden');
  }

  showGame() {
    this.titleScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
  }

  startGame() {
    this.distance = 0;
    this.stage = 1;
    this.updateUI();
    this.showGame();
    this.gameState = 'playing';
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    if (this.gameState !== 'playing') return;
    // simple auto-scroll distance (km)
    const speed = 50; // km/h equivalent scaled arbitrarily
    this.distance += (speed * dt) / 3600; // scale roughly
    this.updateUI();
  }

  updateUI() {
    if (this.scoreEl) this.scoreEl.textContent = `距離: ${Math.floor(this.distance)} km`;
    if (this.stageEl) this.stageEl.textContent = `ステージ: ${this.stage}`;
  }

  renderTitle() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Title not visible here; canvas is hidden on title screen
  }

  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw a simple moving star field replacement
    this.ctx.fillStyle = '#4ecdc4';
    const t = performance.now() * 0.002;
    for (let i = 0; i < 60; i++) {
      const x = (i * 13 + (t * 60)) % this.canvas.width;
      const y = (i * 29) % this.canvas.height;
      this.ctx.fillRect(x, y, 2, 2);
    }
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const dt = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

