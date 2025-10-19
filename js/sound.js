/**
 * 音声管理クラス
 * Web Audio APIを使用して効果音を生成・再生
 */
class SoundManager {
  constructor() {
    this.ctx = null;  // オーディオコンテキスト
    this.engineOsc = null;  // エンジン音のオシレーター
    this.engineGain = null;  // エンジン音のゲイン
    this.modulationOsc = null;  // 変調オシレーター
    this.noiseSource = null;  // ノイズソース
    this.isEngineRunning = false;  // エンジン音の状態
  }

  ensureContext() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', gainValue = 0.2) {
    if (!this.ctx) return;
    const start = this.ctx.currentTime;
    const end = start + duration;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(start);
    osc.stop(end);
  }

  /**
   * スタート時の音楽的な音を再生
   */
  playStart() {
    this.ensureContext();
    if (!this.ctx) return;
    
    const start = this.ctx.currentTime;
    
    // メロディックなスタート音（ドレミファソ）
    const melody = [523.25, 587.33, 659.25, 698.46, 783.99]; // C5, D5, E5, F5, G5
    const durations = [0.15, 0.12, 0.12, 0.12, 0.2];
    
    melody.forEach((freq, index) => {
      const noteStart = start + index * 0.1;
      const noteEnd = noteStart + durations[index];
      
      // メインの音
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, noteStart);
      gain1.gain.setValueAtTime(0.15, noteStart);
      gain1.gain.exponentialRampToValueAtTime(0.001, noteEnd);
      osc1.connect(gain1).connect(this.ctx.destination);
      osc1.start(noteStart);
      osc1.stop(noteEnd);
      
      // ハーモニー（オクターブ上）
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, noteStart);
      gain2.gain.setValueAtTime(0.08, noteStart);
      gain2.gain.exponentialRampToValueAtTime(0.001, noteEnd);
      osc2.connect(gain2).connect(this.ctx.destination);
      osc2.start(noteStart);
      osc2.stop(noteEnd);
    });
  }

  playStageClear() {
    this.ensureContext();
    this.playTone(523, 0.10, 'sine', 0.15);
    this.playTone(659, 0.12, 'sine', 0.12);
    this.playTone(784, 0.16, 'sine', 0.1);
  }

  /**
   * エンジン音を開始（低周波ハム音 - 宇宙船エンジン音）
   */
  startEngine() {
    this.ensureContext();
    if (!this.ctx || this.isEngineRunning) return;
    
    // 既存のエンジン音があれば停止
    this.stopEngine();
    
    this.isEngineRunning = true;
    
    // メインのエンジン音（低周波ハム音）
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    
    this.engineOsc.type = 'sine'; // より滑らかなハム音
    this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime); // 少し高い周波数
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime); // 開始時は無音
    this.engineGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.1); // 滑らかなフェードイン
    
    // ハム音の変調（ゆっくりとした変調）
    this.modulationOsc = this.ctx.createOscillator();
    const modulationGain = this.ctx.createGain();
    this.modulationOsc.type = 'sine';
    this.modulationOsc.frequency.setValueAtTime(1.2, this.ctx.currentTime); // ゆっくりとした変調
    modulationGain.gain.setValueAtTime(8, this.ctx.currentTime); // 控えめな変調
    
    this.modulationOsc.connect(modulationGain);
    modulationGain.connect(this.engineOsc.frequency);
    
    // 低周波ノイズ生成（ハム音に質感を追加）
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.12; // 控えめなノイズ
    }
    
    this.noiseSource = this.ctx.createBufferSource();
    const noiseGain = this.ctx.createGain();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true; // ループ再生
    noiseGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // 控えめなノイズ音量
    
    // 低周波ノイズ用フィルタ
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(80, this.ctx.currentTime); // 低周波に制限
    noiseFilter.Q.setValueAtTime(0.5, this.ctx.currentTime);
    
    // 低周波ハム音らしいフィルタ設定
    const lowpassFilter = this.ctx.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.setValueAtTime(120, this.ctx.currentTime); // 低周波に制限
    lowpassFilter.Q.setValueAtTime(0.3, this.ctx.currentTime);
    
    // 音源の接続
    this.engineOsc.connect(lowpassFilter);
    
    this.noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    // ミキサー（エンジン音とノイズを混合）
    const mixer = this.ctx.createGain();
    mixer.gain.setValueAtTime(1.0, this.ctx.currentTime);
    
    lowpassFilter.connect(mixer);
    noiseGain.connect(mixer);
    mixer.connect(this.engineGain).connect(this.ctx.destination);
    
    this.engineOsc.start();
    this.modulationOsc.start();
    this.noiseSource.start();
  }

  /**
   * エンジン音を停止
   */
  stopEngine() {
    if (!this.isEngineRunning) return;
    
    this.isEngineRunning = false;
    
    if (this.ctx) {
      const now = this.ctx.currentTime;
      
      // メインのエンジン音を滑らかに停止
      if (this.engineOsc && this.engineGain) {
        // より長いフェードアウトで変な音を防ぐ
        this.engineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        this.engineOsc.stop(now + 0.3);
        this.engineOsc = null;
        this.engineGain = null;
      }
      
      // 変調オシレーターを滑らかに停止
      if (this.modulationOsc) {
        this.modulationOsc.stop(now + 0.3);
        this.modulationOsc = null;
      }
      
      // ノイズソースを滑らかに停止
      if (this.noiseSource) {
        this.noiseSource.stop(now + 0.3);
        this.noiseSource = null;
      }
    }
  }

  /**
   * クラッシュ音を再生（ボカーン）
   */
  playGameOver() {
    this.ensureContext();
    if (!this.ctx) return;
    
    const start = this.ctx.currentTime;
    
    // メインの爆発音（ボカーン効果）
    const explosionBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.8, this.ctx.sampleRate);
    const explosionData = explosionBuffer.getChannelData(0);
    for (let i = 0; i < explosionData.length; i++) {
      explosionData[i] = (Math.random() * 2 - 1) * 0.4; // より強いノイズ
    }
    
    const explosionSource = this.ctx.createBufferSource();
    const explosionGain = this.ctx.createGain();
    const explosionFilter = this.ctx.createBiquadFilter();
    
    explosionSource.buffer = explosionBuffer;
    explosionFilter.type = 'lowpass';
    explosionFilter.frequency.setValueAtTime(150, start); // より低い周波数で爆発音らしく
    explosionFilter.Q.setValueAtTime(0.8, start);
    
    explosionGain.gain.setValueAtTime(0.5, start); // より大きな音量
    explosionGain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
    
    explosionSource.connect(explosionFilter).connect(explosionGain).connect(this.ctx.destination);
    explosionSource.start(start);
    
    // 低音の爆発音（ボカーン効果）
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sawtooth';
    boomOsc.frequency.setValueAtTime(80, start); // より高い周波数で「ボ」音
    boomOsc.frequency.exponentialRampToValueAtTime(30, start + 0.4); // より長い時間で「カーン」効果
    boomGain.gain.setValueAtTime(0.6, start); // より大きな音量
    boomGain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    
    boomOsc.connect(boomGain).connect(this.ctx.destination);
    boomOsc.start(start);
    boomOsc.stop(start + 0.4);
    
    // 中音の爆発音（カーン効果）
    const midBoomOsc = this.ctx.createOscillator();
    const midBoomGain = this.ctx.createGain();
    midBoomOsc.type = 'square';
    midBoomOsc.frequency.setValueAtTime(200, start);
    midBoomOsc.frequency.exponentialRampToValueAtTime(80, start + 0.3);
    midBoomGain.gain.setValueAtTime(0.3, start);
    midBoomGain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    
    midBoomOsc.connect(midBoomGain).connect(this.ctx.destination);
    midBoomOsc.start(start);
    midBoomOsc.stop(start + 0.3);
    
    // 高音の金属音（カーン効果）
    const metalOsc = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();
    metalOsc.type = 'square';
    metalOsc.frequency.setValueAtTime(600, start); // より低い周波数で金属音
    metalOsc.frequency.exponentialRampToValueAtTime(150, start + 0.25);
    metalGain.gain.setValueAtTime(0.25, start);
    metalGain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    
    metalOsc.connect(metalGain).connect(this.ctx.destination);
    metalOsc.start(start);
    metalOsc.stop(start + 0.25);
  }
}

export const soundManager = new SoundManager();
