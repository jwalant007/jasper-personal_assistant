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
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && typeof AudioContextClass === 'function') {
        audioCtx = new AudioContextClass();
      }
    } catch (e) {
      return null;
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

/**
 * Play Doctor Strange / Thanos Mystical Finger Snap
 * Synthesizes a crisp acoustic skin/flesh snap transient + cosmic disintegration sub-bass boom
 */
export function playMysticSnap() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Transient click / noise impulse (the skin snap crack)
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.12));
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800, now);
    noiseFilter.Q.setValueAtTime(3.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.38, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);

    // 2. Harmonic body resonance of the finger snap
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(1600, now);
    oscBody.frequency.exponentialRampToValueAtTime(320, now + 0.06);
    gainBody.gain.setValueAtTime(0.32, now);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    oscBody.connect(gainBody);
    gainBody.connect(ctx.destination);
    oscBody.start(now);
    oscBody.stop(now + 0.08);

    // 3. Low-frequency Cosmic Dissolution Boom (sub-bass ripple across dimensions)
    const oscSub = ctx.createOscillator();
    const gainSub = ctx.createGain();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(95, now);
    oscSub.frequency.exponentialRampToValueAtTime(38, now + 0.65);
    gainSub.gain.setValueAtTime(0.28, now);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    oscSub.connect(gainSub);
    gainSub.connect(ctx.destination);
    oscSub.start(now);
    oscSub.stop(now + 0.72);

    // 4. Mystical crystalline Eldritch shimmer
    const oscShimmer = ctx.createOscillator();
    const gainShimmer = ctx.createGain();
    oscShimmer.type = 'sine';
    oscShimmer.frequency.setValueAtTime(3800, now + 0.02);
    oscShimmer.frequency.exponentialRampToValueAtTime(5400, now + 0.45);
    gainShimmer.gain.setValueAtTime(0.001, now);
    gainShimmer.gain.linearRampToValueAtTime(0.09, now + 0.05);
    gainShimmer.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    oscShimmer.connect(gainShimmer);
    gainShimmer.connect(ctx.destination);
    oscShimmer.start(now + 0.02);
    oscShimmer.stop(now + 0.52);
  } catch (e) {}
}

/**
 * Play Doctor Strange Spell Casting Sound
 */
export function playDoctorStrangeSpell(spell = 'mandala') {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    
    if (spell === 'shield' || spell === 'mandala') {
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.linearRampToValueAtTime(760, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    } else if (spell === 'portal') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {}
}

