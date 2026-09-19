/**
 * J.A.S.P.E.R. AIR-GESTURE TRACKER SERVICE - DOCTOR STRANGE ELDRITCH SPELL ENGINE
 * Real-time hand skeletal tracking via MediaPipe Hands CDN with authentic Doctor Strange visual effects:
 * - Rotating Tao Mandalas (Sacred Geometry Spell Shields on wrists & palms)
 * - Fiery Eldritch Sparks & Embers Particle Physics
 * - Finger Snap Detection ("Thanos / Doctor Strange Snap") to close all open OS applications
 * - Tao Shield (Open Palm Repulsor / Shield)
 * - Sling Ring Portal generation during circular gestures
 * - Mystic Energy Ray & Mudras for pointing & interaction
 * - Pinch-Drag Mirror Dimension rotation
 */

import { playMysticSnap, playDoctorStrangeSpell } from './jarvisAudioSynth';

let scriptLoadPromise = null;

// Dynamically inject MediaPipe scripts from CDN
export function loadMediaPipeHandsScripts() {
  if (window.Hands && window.Camera) {
    return Promise.resolve();
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    const loadScript = (src) => {
      return new Promise((res, rej) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) return res();
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => res();
        script.onerror = (e) => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'))
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.warn('[AirGestures] CDN load notice:', err.message);
        resolve(); // resolve so camera can still work in fallback
      });
  });

  return scriptLoadPromise;
}

/**
 * Doctor Strange AirGestureTracker Controller
 */
export class AirGestureTracker {
  constructor(videoElement, canvasElement, callbacks = {}) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.callbacks = {
      onRotate: callbacks.onRotate || (() => {}),
      onZoom: callbacks.onZoom || (() => {}),
      onSwipe: callbacks.onSwipe || (() => {}),
      onScroll: callbacks.onScroll || (() => {}),
      onPinchTap: callbacks.onPinchTap || (() => {}),
      onFist: callbacks.onFist || (() => {}),
      onPeaceSign: callbacks.onPeaceSign || (() => {}),
      onThumbsUp: callbacks.onThumbsUp || (() => {}),
      onThumbsDown: callbacks.onThumbsDown || (() => {}),
      onPalmStop: callbacks.onPalmStop || (() => {}),
      onOkSign: callbacks.onOkSign || (() => {}),
      onAirCursor: callbacks.onAirCursor || (() => {}),
      onWindowCycle: callbacks.onWindowCycle || (() => {}),
      onCloseApp: callbacks.onCloseApp || (() => {}),
      onFingerSnap: callbacks.onFingerSnap || (() => {}),
      onStateChange: callbacks.onStateChange || (() => {}),
      ...callbacks
    };

    this.isActive = false;
    this.handsInstance = null;
    this.cameraInstance = null;
    this.localStream = null;

    // Gesture Tracking State
    this.lastPinchPos = null;
    this.lastTwoHandDist = null;
    this.palmHistory = [];
    this.lastSwipeTime = 0;
    this.lastScrollTime = 0;
    this.lastPinchTapTime = 0;
    this.lastDiscreteGestureTime = 0;
    this.lastGestureName = 'NONE';
    this.isCurrentlyPinching = false;
    this.pinchStartTime = 0;

    // Finger Snap Detection State ("Doctor Strange / Thanos Snap")
    this.snapArmed = false;
    this.snapArmedTime = 0;
    this.snapArmedPos = null;
    this.snapArmedThumb = null;
    this.snapArmedMiddle = null;
    this.lastSnapTime = 0;

    // Doctor Strange Mystical Visual Engine
    this.spellAngle = 0;
    this.particles = [];
    this.shockwaves = [];
    this.portalTrail = [];

    // Smoothed Air Cursor
    this.cursorPos = { x: 0.5, y: 0.5 };
  }

  async start(customStream = null) {
    if (this.isActive) return;
    this.isActive = true;

    try {
      await loadMediaPipeHandsScripts();

      if (window.Hands) {
        this.handsInstance = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.65
        });

        this.handsInstance.onResults((results) => this.handleResults(results));

        if (customStream) {
          this.localStream = customStream;
          this.videoElement.srcObject = customStream;
          await this.videoElement.play();
          this.startFrameLoop();
        } else if (window.Camera && this.videoElement) {
          this.cameraInstance = new window.Camera(this.videoElement, {
            onFrame: async () => {
              if (this.isActive && this.handsInstance && this.videoElement) {
                try {
                  await this.handsInstance.send({ image: this.videoElement });
                } catch (e) {}
              }
            },
            width: 640,
            height: 480
          });
          await this.cameraInstance.start();
        }
      } else {
        // Fallback: start standard webcam without MediaPipe if CDN blocked
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        this.localStream = stream;
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
      }

      this.callbacks.onStateChange({ status: 'ACTIVE', gesture: 'IDLE' });
    } catch (err) {
      console.warn('[AirGestures] Failed to initialize camera hand tracker:', err);
      this.callbacks.onStateChange({ status: 'ERROR', message: err.message });
    }
  }

  startFrameLoop() {
    const process = async () => {
      if (!this.isActive) return;
      if (this.handsInstance && this.videoElement && this.videoElement.readyState >= 2) {
        try {
          await this.handsInstance.send({ image: this.videoElement });
        } catch (e) {}
      }
      requestAnimationFrame(process);
    };
    requestAnimationFrame(process);
  }

  handleResults(results) {
    if (!this.canvasElement || !this.ctx) return;
    const { width, height } = this.canvasElement;
    this.ctx.clearRect(0, 0, width, height);

    // Update global spell rotation angle for Tao Mandalas
    this.spellAngle += 0.045;

    // Render active background particles & shockwaves
    this.updateAndDrawParticles(width, height);
    this.updateAndDrawShockwaves();

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.lastPinchPos = null;
      this.lastTwoHandDist = null;
      this.lastGestureName = 'NONE';
      this.snapArmed = false;
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'NONE', handCount: 0 });
      return;
    }

    const landmarksList = results.multiHandLandmarks;
    const handCount = landmarksList.length;

    // Draw Doctor Strange Eldritch Skeletal Joints & Tao Mandalas
    landmarksList.forEach((landmarks, idx) => {
      this.drawDoctorStrangeHand(landmarks, idx, width, height);
    });

    const now = Date.now();

    // -------------------------------------------------------------
    // 0. FINGER SNAP DETECTION (CLOSE ALL APPS - DOCTOR STRANGE / THANOS SNAP)
    // -------------------------------------------------------------
    for (let hIdx = 0; hIdx < landmarksList.length; hIdx++) {
      const hLandmarks = landmarksList[hIdx];
      const thumb = hLandmarks[4];
      const middle = hLandmarks[12];
      const index = hLandmarks[8];
      const wrist = hLandmarks[0];
      const palmMcp = hLandmarks[9];

      // Distance between thumb and middle fingertip
      const distThumbMiddle = Math.hypot(thumb.x - middle.x, thumb.y - middle.y);
      const distThumbIndex = Math.hypot(thumb.x - index.x, thumb.y - index.y);

      // Phase 1: Priming / Touching thumb to middle (or index) finger with tension
      if (distThumbMiddle < 0.055 || distThumbIndex < 0.05) {
        if (!this.snapArmed) {
          this.snapArmed = true;
          this.snapArmedTime = now;
          this.snapArmedPos = {
            x: (1 - (thumb.x + middle.x) / 2) * width,
            y: ((thumb.y + middle.y) / 2) * height
          };
          this.snapArmedThumb = { ...thumb };
          this.snapArmedMiddle = { ...middle };
        }
      } else if (this.snapArmed) {
        const timeSinceArmed = now - this.snapArmedTime;
        // Snap release window: 45ms to 380ms
        if (timeSinceArmed >= 45 && timeSinceArmed <= 400) {
          // Check if fingers flicked apart violently and middle finger curled down
          const separation = Math.hypot(thumb.x - middle.x, thumb.y - middle.y);
          const middleCurled = middle.y > palmMcp.y - 0.02 || Math.hypot(middle.x - wrist.x, middle.y - wrist.y) < 0.28;
          const highVelocity = (separation - 0.05) / (timeSinceArmed / 1000) > 0.35;

          if ((separation > 0.11 || highVelocity) && (now - this.lastSnapTime > 900)) {
            // FINGER SNAP TRIGGERED!
            this.lastSnapTime = now;
            this.snapArmed = false;
            this.triggerMysticSnap(this.snapArmedPos.x, this.snapArmedPos.y);
            playMysticSnap();

            this.callbacks.onFingerSnap();
            this.callbacks.onStateChange({
              status: 'TRACKING',
              gesture: '✦ ELDRITCH SNAP (CLOSE ALL APPS) ✦',
              handCount
            });
            return;
          }
        } else if (timeSinceArmed > 400) {
          this.snapArmed = false;
        }
      }
    }

    // -------------------------------------------------------------
    // 1. TWO-HAND GESTURES
    // -------------------------------------------------------------
    if (handCount >= 2) {
      const hand1 = landmarksList[0];
      const hand2 = landmarksList[1];
      const p1 = hand1[0]; // Wrist 1
      const p2 = hand2[0]; // Wrist 2
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      // Check if both hands are in fists (Crossed / Double Fist -> Close Current App)
      const h1Fist = this.isFistLandmarks(hand1);
      const h2Fist = this.isFistLandmarks(hand2);
      if (h1Fist && h2Fist && now - this.lastDiscreteGestureTime > 1200) {
        this.lastDiscreteGestureTime = now;
        this.callbacks.onCloseApp();
        this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'DOUBLE FIST (CLOSE APP)', handCount: 2 });
        return;
      }

      if (this.lastTwoHandDist !== null) {
        const delta = dist - this.lastTwoHandDist;
        if (Math.abs(delta) > 0.008) {
          const zoomFactor = delta * 4.0;
          this.callbacks.onZoom(zoomFactor);
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'TWO-HAND MIRROR ZOOM', handCount: 2 });
        }
      }
      this.lastTwoHandDist = dist;
      this.lastPinchPos = null;
      return;
    } else {
      this.lastTwoHandDist = null;
    }

    // -------------------------------------------------------------
    // 2. SINGLE-HAND SKELETAL CLASSIFICATION
    // -------------------------------------------------------------
    const hand = landmarksList[0];
    const wrist = hand[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const ringTip = hand[16];
    const pinkyTip = hand[20];
    const palmCenter = hand[9];

    // Distance between thumb and index tips
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const isPinching = pinchDist < 0.075;

    // Finger extensions
    const isIndexExt = this.isFingerExtended(hand, 8, 6, wrist);
    const isMiddleExt = this.isFingerExtended(hand, 12, 10, wrist);
    const isRingExt = this.isFingerExtended(hand, 16, 14, wrist);
    const isPinkyExt = this.isFingerExtended(hand, 20, 18, wrist);

    // Thumb orientation
    const thumbMcp = hand[2];
    const isThumbUp = !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt && (thumbTip.y < thumbMcp.y - 0.07);
    const isThumbDown = !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt && (thumbTip.y > thumbMcp.y + 0.07);

    // Fist check
    const isFist = !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt && !isThumbUp && !isThumbDown;

    // -------------------------------------------------------------
    // GESTURE: THUMBS UP (CONFIRM / APPROVE)
    // -------------------------------------------------------------
    if (isThumbUp && now - this.lastDiscreteGestureTime > 900) {
      this.lastDiscreteGestureTime = now;
      this.callbacks.onThumbsUp();
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'THUMBS UP (CONFIRM)', handCount: 1 });
      return;
    }

    // -------------------------------------------------------------
    // GESTURE: THUMBS DOWN (CANCEL / REJECT)
    // -------------------------------------------------------------
    if (isThumbDown && now - this.lastDiscreteGestureTime > 900) {
      this.lastDiscreteGestureTime = now;
      this.callbacks.onThumbsDown();
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'THUMBS DOWN (CANCEL)', handCount: 1 });
      return;
    }

    // -------------------------------------------------------------
    // GESTURE: PEACE SIGN (V-SIGN -> MAXIMIZE / RESTORE WINDOW)
    // -------------------------------------------------------------
    const isPeaceSign = isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt && Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y) > 0.06;
    if (isPeaceSign && now - this.lastDiscreteGestureTime > 900) {
      this.lastDiscreteGestureTime = now;
      this.callbacks.onPeaceSign();
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'PEACE SIGN (MAXIMIZE / RESTORE)', handCount: 1 });
      return;
    }

    // -------------------------------------------------------------
    // GESTURE: OK SIGN (INDEX+THUMB RING, OTHER 3 EXTENDED)
    // -------------------------------------------------------------
    const isOkSign = pinchDist < 0.06 && isMiddleExt && isRingExt && isPinkyExt;
    if (isOkSign && now - this.lastDiscreteGestureTime > 900) {
      this.lastDiscreteGestureTime = now;
      this.callbacks.onOkSign();
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'OK SIGN (JARVIS MIC ACTIVE)', handCount: 1 });
      return;
    }

    // -------------------------------------------------------------
    // GESTURE: FIST (MINIMIZE WINDOW / RESET CAMERA)
    // -------------------------------------------------------------
    if (isFist) {
      if (now - this.lastDiscreteGestureTime > 900) {
        this.lastDiscreteGestureTime = now;
        this.callbacks.onFist();
      }
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'ELDRITCH FIST (MINIMIZE)', handCount: 1 });
      this.lastPinchPos = null;
      return;
    }

    // -------------------------------------------------------------
    // GESTURE: POINTING FINGER / TWO-FINGER MYSTIC BEAM
    // -------------------------------------------------------------
    const isOnlyIndex = isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt;
    const isTwoFingerMudra = isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt && Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y) <= 0.06;

    if (isOnlyIndex || isTwoFingerMudra) {
      const activeTip = isTwoFingerMudra ? { x: (indexTip.x + middleTip.x) / 2, y: (indexTip.y + middleTip.y) / 2 } : indexTip;
      // Mirrored X for natural screen pointer
      const targetX = 1 - activeTip.x;
      const targetY = activeTip.y;

      // Exponential moving average smoothing for steady pointing
      this.cursorPos.x += (targetX - this.cursorPos.x) * 0.45;
      this.cursorPos.y += (targetY - this.cursorPos.y) * 0.45;

      const isAirClicking = isPinching;
      this.callbacks.onAirCursor({
        x: this.cursorPos.x,
        y: this.cursorPos.y,
        isClicking: isAirClicking
      });

      if (isAirClicking && now - this.lastPinchTapTime > 500) {
        this.lastPinchTapTime = now;
        this.callbacks.onPinchTap();
      }

      this.callbacks.onStateChange({
        status: 'TRACKING',
        gesture: isAirClicking ? 'MYSTIC AIR CLICK' : (isTwoFingerMudra ? 'DOCTOR STRANGE ENERGY BEAM' : 'MYSTIC AIR CURSOR'),
        handCount: 1,
        cursor: this.cursorPos
      });
      return;
    }

    // -------------------------------------------------------------
    // GESTURE: PINCH-DRAG (3D ROTATE) & PINCH-TAP
    // -------------------------------------------------------------
    if (isPinching) {
      const pinchCenterX = (thumbTip.x + indexTip.x) / 2;
      const pinchCenterY = (thumbTip.y + indexTip.y) / 2;

      if (!this.isCurrentlyPinching) {
        this.isCurrentlyPinching = true;
        this.pinchStartTime = now;
      }

      if (this.lastPinchPos) {
        const dx = (pinchCenterX - this.lastPinchPos.x) * -12.0;
        const dy = (pinchCenterY - this.lastPinchPos.y) * 12.0;

        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
          this.callbacks.onRotate(dx, dy);
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'SPELL-WEAVING (ROTATE)', handCount: 1 });
        }
      }

      this.lastPinchPos = { x: pinchCenterX, y: pinchCenterY };
    } else {
      if (this.isCurrentlyPinching) {
        const pinchDuration = now - this.pinchStartTime;
        if (pinchDuration < 320 && now - this.lastPinchTapTime > 600) {
          this.lastPinchTapTime = now;
          this.callbacks.onPinchTap();
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'MYSTIC PINCH-TAP', handCount: 1 });
        }
        this.isCurrentlyPinching = false;
      }
      this.lastPinchPos = null;
    }

    // -------------------------------------------------------------
    // GESTURE: PALM VELOCITY SWIPE & VERTICAL AIR SCROLL
    // -------------------------------------------------------------
    this.palmHistory.push({ x: palmCenter.x, y: palmCenter.y, t: now });
    if (this.palmHistory.length > 8) this.palmHistory.shift();

    if (!isPinching && this.palmHistory.length >= 4) {
      const oldest = this.palmHistory[0];
      const newest = this.palmHistory[this.palmHistory.length - 1];
      const dt = (newest.t - oldest.t) / 1000;
      if (dt > 0.03) {
        const vx = (newest.x - oldest.x) / dt;
        const vy = (newest.y - oldest.y) / dt;

        // 3-Finger Swipe (App Switcher Cycle)
        const is3Finger = isIndexExt && isMiddleExt && isRingExt && !isPinkyExt;
        if (is3Finger && Math.abs(vx) > 1.6 && now - this.lastDiscreteGestureTime > 750) {
          const dir = vx < 0 ? 'NEXT' : 'PREV';
          this.lastDiscreteGestureTime = now;
          this.callbacks.onWindowCycle(dir);
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: `WINDOW CYCLE (${dir})`, handCount: 1 });
          return;
        }

        // Horizontal Swipe (Next / Prev creation)
        if (Math.abs(vx) > 1.8 && Math.abs(vx) > Math.abs(vy) * 1.5 && now - this.lastSwipeTime > 750) {
          const dir = vx < 0 ? 'NEXT' : 'PREV';
          this.lastSwipeTime = now;
          this.callbacks.onSwipe(dir);
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: `SPELL SWIPE ${dir}`, handCount: 1 });
          return;
        }

        // Vertical Air Scroll (Active window up / down)
        if (Math.abs(vy) > 1.4 && now - this.lastScrollTime > 160) {
          const dir = vy < 0 ? 'UP' : 'DOWN';
          const scrollSpeed = Math.min(320, Math.round(Math.abs(vy) * 90));
          this.lastScrollTime = now;
          this.callbacks.onScroll(dir, scrollSpeed);
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: `AIR SCROLL ${dir}`, handCount: 1 });
          return;
        }
      }
    }

    // -------------------------------------------------------------
    // GESTURE: DOCTOR STRANGE TAO MANDALA SHIELD (OPEN PALM)
    // -------------------------------------------------------------
    const allFiveExtended = isIndexExt && isMiddleExt && isRingExt && isPinkyExt;
    if (allFiveExtended && !isPinching) {
      if (now - this.lastDiscreteGestureTime > 1200) {
        this.lastDiscreteGestureTime = now;
        this.callbacks.onPalmStop();
        playDoctorStrangeSpell('shield');
      }
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'TAO MANDALA SHIELD (SHOW DESKTOP)', handCount: 1 });
      return;
    }

    if (!isPinching && !isFist) {
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'ELDRITCH SPELLCASTING READY', handCount: 1 });
    }
  }

  isFingerExtended(hand, tipIdx, pipIdx, wrist) {
    const tip = hand[tipIdx];
    const pip = hand[pipIdx];
    const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
    return distTip > distPip * 1.18;
  }

  isFistLandmarks(hand) {
    const wrist = hand[0];
    return (
      Math.hypot(hand[8].x - wrist.x, hand[8].y - wrist.y) < Math.hypot(hand[6].x - wrist.x, hand[6].y - wrist.y) &&
      Math.hypot(hand[12].x - wrist.x, hand[12].y - wrist.y) < Math.hypot(hand[10].x - wrist.x, hand[10].y - wrist.y) &&
      Math.hypot(hand[16].x - wrist.x, hand[16].y - wrist.y) < Math.hypot(hand[14].x - wrist.x, hand[14].y - wrist.y) &&
      Math.hypot(hand[20].x - wrist.x, hand[20].y - wrist.y) < Math.hypot(hand[18].x - wrist.x, hand[18].y - wrist.y)
    );
  }

  // ---------------------------------------------------------------
  // DOCTOR STRANGE VISUAL RENDERING: TAO MANDALAS & ELDRITCH SPARKS
  // ---------------------------------------------------------------
  drawDoctorStrangeHand(landmarks, handIndex, width, height) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Skeletal Connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20],
      [0, 17]
    ];

    // Fiery Eldritch Gold & Orange Palettes
    const fieryGold = '#ffaa00';
    const intenseOrange = '#ff5500';
    const coreWhite = '#ffffff';

    ctx.save();

    // 1. Draw Eldritch Energy Bones with Intense Golden Glow
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = fieryGold;
    ctx.shadowColor = intenseOrange;
    ctx.shadowBlur = 12;

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      const x1 = (1 - p1.x) * width;
      const y1 = p1.y * height;
      const x2 = (1 - p2.x) * width;
      const y2 = p2.y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // 2. Draw Fingertip Nodes & Emit Glowing Embers
    landmarks.forEach((pt, i) => {
      const x = (1 - pt.x) * width;
      const y = pt.y * height;
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const radius = isTip ? 5 : 3;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? coreWhite : fieryGold;
      ctx.shadowColor = fieryGold;
      ctx.shadowBlur = 8;
      ctx.fill();

      // Emit Eldritch spark embers randomly from moving fingertips
      if (isTip && Math.random() < 0.35) {
        this.spawnEldritchSpark(x, y);
      }
    });

    // 3. Draw Doctor Strange Tao Mandala on Wrist / Palm
    const wrist = landmarks[0];
    const palm = landmarks[9];
    const wx = (1 - wrist.x) * width;
    const wy = wrist.y * height;
    const px = (1 - palm.x) * width;
    const py = palm.y * height;

    // Center the mandala between wrist and palm
    const mandalaX = (wx + px) / 2;
    const mandalaY = (wy + py) / 2;

    // Check if hand is open (Tao Shield defense)
    const isHandSpread = Math.hypot(landmarks[4].x - landmarks[20].x, landmarks[4].y - landmarks[20].y) > 0.26;
    const baseRadius = isHandSpread ? 42 : 24;

    this.drawTaoMandala(mandalaX, mandalaY, baseRadius, this.spellAngle * (handIndex === 0 ? 1 : -1));

    // 4. If Snap is Armed, draw crackling energy tension between thumb and middle finger
    if (this.snapArmed) {
      const thumb = landmarks[4];
      const middle = landmarks[12];
      const tx = (1 - thumb.x) * width;
      const ty = thumb.y * height;
      const mx = (1 - middle.x) * width;
      const my = middle.y * height;

      ctx.beginPath();
      ctx.moveTo(tx, ty);
      // Zigzag crackling arc
      const midX = (tx + mx) / 2 + (Math.random() - 0.5) * 8;
      const midY = (ty + my) / 2 + (Math.random() - 0.5) * 8;
      ctx.lineTo(midX, midY);
      ctx.lineTo(mx, my);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Small warning spark ring around snap point
      ctx.beginPath();
      ctx.arc(midX, midY, 6 + Math.sin(Date.now() / 60) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff9900';
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw authentic rotating Doctor Strange Tao Mandala (Sacred Octagram, Rune Ticks, Concentric Rings)
   */
  drawTaoMandala(cx, cy, r, angle) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(cx, cy);

    // Primary Glowing Colors
    const gold = '#ffaa00';
    const orange = '#ff4400';
    const yellow = '#ffe855';

    ctx.shadowColor = orange;
    ctx.shadowBlur = 10;

    // Ring 1: Outer Rune Perimeter Ring
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Outer Sanskrit / Mystic Ticks around perimeter (Rotating)
    const tickCount = 16;
    for (let i = 0; i < tickCount; i++) {
      const a = angle + (i * Math.PI * 2) / tickCount;
      const x1 = Math.cos(a) * (r - 3);
      const y1 = Math.sin(a) * (r - 3);
      const x2 = Math.cos(a) * (r + 4);
      const y2 = Math.sin(a) * (r + 4);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = yellow;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Ring 2: Concentric Middle Ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = orange;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Sacred Octagram: Two Intersecting Squares (Rotating clockwise & counter-clockwise)
    ctx.save();
    ctx.rotate(angle);
    const sqSize = r * 0.56;
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);

    // Second square rotated 45 degrees
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = yellow;
    ctx.strokeRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);
    ctx.restore();

    // Ring 3: Inner Core Ring & Radiant Star
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inner glowing core
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = gold;
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.restore();
  }

  /**
   * Spawn Eldritch floating spark particles
   */
  spawnEldritchSpark(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2 - 0.8, // subtle upward drift like fiery embers
        size: Math.random() * 2.5 + 1.2,
        alpha: 1.0,
        decay: Math.random() * 0.035 + 0.02,
        color: Math.random() > 0.3 ? '#ffaa00' : '#ff5500'
      });
    }
  }

  /**
   * Trigger Finger Snap Cosmic Shockwave & Spark Explosion
   */
  triggerMysticSnap(x, y) {
    // 1. Add expanding shockwave rings
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius: 180,
      alpha: 1.0,
      color: '#ff9900'
    });
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: 220,
      alpha: 1.0,
      color: '#ffd700'
    });

    // 2. Spawn 60 radial eldritch spark particles
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.2;
      const speed = Math.random() * 6.5 + 2.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        color: i % 2 === 0 ? '#ffea00' : '#ff4400'
      });
    }
  }

  /**
   * Update and draw Eldritch spark particles
   */
  updateAndDrawParticles(width, height) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Update and draw expanding mystical shockwaves
   */
  updateAndDrawShockwaves() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.14 + 1.5;
      sw.alpha -= 0.035;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer concentric rune pulse ring
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.restore();
    }
  }

  stop() {
    this.isActive = false;
    if (this.cameraInstance) {
      try { this.cameraInstance.stop(); } catch (e) {}
      this.cameraInstance = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    if (this.ctx && this.canvasElement) {
      this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    this.particles = [];
    this.shockwaves = [];
    this.callbacks.onStateChange({ status: 'STOPPED', gesture: 'NONE' });
  }
}
