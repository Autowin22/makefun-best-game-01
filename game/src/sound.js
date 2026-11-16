// WebAudio oscillator sound effects for Bloom Bastion.
export function createSound() {
  let ctx = null;
  let muted = false;

  function init() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freqStart, freqEnd, duration, type = 'sine', volume = 0.15) {
    if (muted) return;
    init();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio blocked or not allowed
    }
  }

  return {
    get muted() { return muted; },
    setMuted(val) { muted = val; },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    shoot() {
      playTone(600, 200, 0.08, 'triangle', 0.1);
    },
    hit() {
      playTone(180, 80, 0.12, 'sawtooth', 0.15);
    },
    bloomHit() {
      playTone(120, 50, 0.2, 'square', 0.2);
    },
    explode() {
      playTone(150, 40, 0.3, 'sawtooth', 0.2);
    },
    upgrade() {
      playTone(300, 880, 0.25, 'sine', 0.18);
    },
    gameOver() {
      playTone(300, 100, 0.6, 'sawtooth', 0.25);
    },
    victory() {
      playTone(440, 880, 0.5, 'triangle', 0.2);
    }
  };
}
