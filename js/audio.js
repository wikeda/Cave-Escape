/**
 * 音声管理クラス
 */
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.isMuted = false;
        this.volume = 0.7;
        this.musicVolume = 0.5;
        
        this.init();
    }
    
    init() {
        // 音声ファイルの読み込み
        this.loadSound('explosion', 'assets/sounds/explosion.wav');
        this.loadSound('engine', 'assets/sounds/engine.wav');
        
        // デフォルトの音声を生成（ファイルが存在しない場合）
        this.generateDefaultSounds();
    }
    
    loadSound(name, src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        audio.volume = this.volume;
        
        // エラーハンドリング
        audio.addEventListener('error', () => {
            console.warn(`音声ファイルの読み込みに失敗しました: ${src}`);
            // デフォルト音声を使用
            this.generateDefaultSound(name);
        });
        
        this.sounds[name] = audio;
    }
    
    generateDefaultSounds() {
        // 爆発音を生成
        this.generateDefaultSound('explosion');
        
        // エンジン音を生成
        this.generateDefaultSound('engine');
    }
    
    generateDefaultSound(name) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        if (name === 'explosion') {
            this.sounds[name] = this.createExplosionSound(audioContext);
        } else if (name === 'engine') {
            this.sounds[name] = this.createEngineSound(audioContext);
        }
    }
    
    createExplosionSound(audioContext) {
        const duration = 0.5;
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        // ノイズベースの爆発音を生成
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 8); // 指数減衰
            const noise = (Math.random() * 2 - 1) * envelope;
            const frequency = 200 * Math.exp(-t * 10); // 周波数が下がる
            const tone = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
            data[i] = (noise + tone) * 0.5;
        }
        
        return { buffer, audioContext };
    }
    
    createEngineSound(audioContext) {
        const duration = 2.0;
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        // エンジン音を生成
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const baseFreq = 80 + Math.sin(t * 2) * 10; // 基本周波数
            const harmonic1 = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
            const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.2;
            const harmonic3 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.1;
            const noise = (Math.random() * 2 - 1) * 0.1;
            
            data[i] = (harmonic1 + harmonic2 + harmonic3 + noise) * 0.3;
        }
        
        return { buffer, audioContext };
    }
    
    playSound(name, volume = 1) {
        if (this.isMuted) return;
        
        const sound = this.sounds[name];
        if (!sound) return;
        
        try {
            if (sound.buffer) {
                // 生成された音声を再生
                this.playGeneratedSound(sound, volume);
            } else {
                // 通常の音声ファイルを再生
                sound.volume = this.volume * volume;
                sound.currentTime = 0;
                sound.play().catch(e => console.warn('音声再生エラー:', e));
            }
        } catch (error) {
            console.warn('音声再生エラー:', error);
        }
    }
    
    playGeneratedSound(sound, volume) {
        const source = sound.audioContext.createBufferSource();
        const gainNode = sound.audioContext.createGain();
        
        source.buffer = sound.buffer;
        gainNode.gain.value = this.volume * volume;
        
        source.connect(gainNode);
        gainNode.connect(sound.audioContext.destination);
        
        source.start();
    }
    
    playEngine() {
        if (this.isMuted) return;
        
        const engine = this.sounds['engine'];
        if (engine && !engine.looping) {
            if (engine.buffer) {
                this.loopGeneratedSound(engine);
            } else {
                engine.loop = true;
                engine.volume = this.volume * 0.5;
                engine.play().catch(e => console.warn('エンジン音再生エラー:', e));
            }
            engine.looping = true;
        }
    }
    
    stopEngine() {
        const engine = this.sounds['engine'];
        if (engine) {
            if (engine.buffer) {
                // 生成された音声のループを停止
                if (engine.loopSource) {
                    engine.loopSource.stop();
                    engine.loopSource = null;
                }
            } else {
                engine.pause();
                engine.currentTime = 0;
            }
            engine.looping = false;
        }
    }
    
    loopGeneratedSound(sound) {
        const playLoop = () => {
            if (!sound.looping) return;
            
            const source = sound.audioContext.createBufferSource();
            const gainNode = sound.audioContext.createGain();
            
            source.buffer = sound.buffer;
            gainNode.gain.value = this.volume * 0.5;
            
            source.connect(gainNode);
            gainNode.connect(sound.audioContext.destination);
            
            source.onended = () => {
                if (sound.looping) {
                    setTimeout(playLoop, 100);
                }
            };
            
            source.start();
            sound.loopSource = source;
        };
        
        playLoop();
    }
    
    playExplosion() {
        this.playSound('explosion', 1.0);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // 既存の音声の音量を更新
        Object.values(this.sounds).forEach(sound => {
            if (sound.volume !== undefined) {
                sound.volume = this.volume;
            }
        });
    }
    
    setMuted(muted) {
        this.isMuted = muted;
        
        if (muted) {
            // 全ての音声を停止
            Object.values(this.sounds).forEach(sound => {
                if (sound.pause) {
                    sound.pause();
                }
            });
        }
    }
    
    toggleMute() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }
    
    // 音声のプリロード
    preloadSounds() {
        Object.values(this.sounds).forEach(sound => {
            if (sound.load) {
                sound.load();
            }
        });
    }
    
    // 音声の破棄
    dispose() {
        Object.values(this.sounds).forEach(sound => {
            if (sound.pause) {
                sound.pause();
            }
            if (sound.src) {
                sound.src = '';
            }
        });
        this.sounds = {};
    }
}
