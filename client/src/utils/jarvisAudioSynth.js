/**
 * J.A.R.V.I.S. / F.R.I.D.A.Y. WEB AUDIO SYNTHESIZER
 * Pure Web Audio API procedural sound engine for Stark UI audio effects
 */

let isMuted = true; // SILENCE ALL BACKGROUND CLICK & HUM SOUND EFFECTS BY DEFAULT

export function setJarvisAudioMuted(muted) {
  isMuted = muted;
  if (muted) {
    setJarvisPlasmaHum(false);
  }
}

export function isJarvisAudioMuted() {
  return isMuted;
}

function getAudioContext() {
  if (isMuted) return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play futuristic Stark Glass Beep / Click Sound
 */
export function playJarvisBeep(type = 'click') {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(3200, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'mode') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch (e) {
    // Silent catch if audio blocked
  }
}

/**
 * Play Hologram Power-Up Sweep Sound
 */
export function playJarvisPowerUp() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {}
}

/**
 * Play High-Frequency Holographic Sonar Scan Sweep
 */
export function playJarvisScan() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.setValueAtTime(4400, now + 0.08);
    osc.frequency.setValueAtTime(3300, now + 0.16);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

/**
 * Toggle Low Ambient Plasma Hum Loop
 */
export function setJarvisPlasmaHum(enable) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (enable) {
      if (humOscillator) return;

      humOscillator = ctx.createOscillator();
      humGain = ctx.createGain();

      humOscillator.type = 'sine';
      humOscillator.frequency.value = 65; // Low 65Hz hum

      humGain.gain.setValueAtTime(0.001, ctx.currentTime);
      humGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);

      humOscillator.connect(humGain);
      humGain.connect(ctx.destination);

      humOscillator.start();
    } else {
      if (humOscillator && humGain) {
        humGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        setTimeout(() => {
          if (humOscillator) {
            humOscillator.stop();
            humOscillator.disconnect();
            humOscillator = null;
            humGain = null;
          }
        }, 300);
      }
    }
  } catch (e) {}
}
