/**
 * 音声管理クラス
 * Web Audio APIを使用して効果音を生成・再生
 */
class SoundManager {
  constructor() {
    this.ctx = null;  // オーディオコンテキスト
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

  playStart() {
    this.ensureContext();
    this.playTone(440, 0.12, 'triangle', 0.15);
    this.playTone(660, 0.16, 'triangle', 0.1);
  }

  playStageClear() {
    this.ensureContext();
    this.playTone(523, 0.10, 'sine', 0.15);
    this.playTone(659, 0.12, 'sine', 0.12);
    this.playTone(784, 0.16, 'sine', 0.1);
  }

  playGameOver() {
    this.ensureContext();
    this.playTone(220, 0.25, 'sawtooth', 0.18);
    this.playTone(155, 0.35, 'sawtooth', 0.12);
  }
}

export const soundManager = new SoundManager();
