/**
 * J.A.S.P.E.R. AIR-GESTURE TRACKER SERVICE
 * Real-time hand skeletal tracking via MediaPipe Hands CDN.
 * Advanced Spatial Computing Gestures for OS & Holographic Workspace:
 * - Air Scroll (Up / Down): Fast vertical palm or index swipe
 * - Peace Sign (V-Sign): Maximize / Restore active app window
 * - Thumbs Up: Confirm / Action / Unmute
 * - Thumbs Down: Cancel / Minimize / Mute
 * - Open Palm (Repulsor Beam): Show Desktop / Pause
 * - Pointing Finger (Air Cursor): Holographic laser cursor with pinch-click
 * - OK Sign: Wake Jarvis Voice Commander
 * - Three-Finger Swipe: Cycle between open OS windows
 * - Fist: Minimize active window / Reset 3D camera
 * - Pinch-Drag: 3D rotate active model
 * - Two-Hand Spread / Contract: 3D zoom in / out
 * - Horizontal Swipe: Next / Previous creation
 */

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
 * AirGestureTracker Controller
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

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.lastPinchPos = null;
      this.lastTwoHandDist = null;
      this.lastGestureName = 'NONE';
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'NONE', handCount: 0 });
      return;
    }

    const landmarksList = results.multiHandLandmarks;
    const handCount = landmarksList.length;

    // Draw Skeletal Joints & Connections
    landmarksList.forEach((landmarks, idx) => {
      this.drawHandSkeleton(landmarks, idx);
    });

    const now = Date.now();

    // -------------------------------------------------------------
    // 1. TWO-HAND GESTURES
    // -------------------------------------------------------------
    if (handCount >= 2) {
      const hand1 = landmarksList[0];
      const hand2 = landmarksList[1];
      const p1 = hand1[0]; // Wrist 1
      const p2 = hand2[0]; // Wrist 2
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      // Check if both hands are in fists (Crossed / Double Fist -> Close App)
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
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'TWO-HAND ZOOM', handCount: 2 });
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
    const isPeaceSign = isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt;
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
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'FIST (MINIMIZE WINDOW)', handCount: 1 });
      this.lastPinchPos = null;
      return;
    }

    // -------------------------------------------------------------
    // GESTURE: POINTING FINGER (AIR CURSOR & LASER RETICLE)
    // -------------------------------------------------------------
    const isOnlyIndex = isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt;
    if (isOnlyIndex) {
      // Mirrored X for natural screen pointer
      const targetX = 1 - indexTip.x;
      const targetY = indexTip.y;

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
        gesture: isAirClicking ? 'AIR CLICK (TAP)' : 'AIR CURSOR (POINT)',
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
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'PINCH-DRAG (ROTATE)', handCount: 1 });
        }
      }

      this.lastPinchPos = { x: pinchCenterX, y: pinchCenterY };
    } else {
      if (this.isCurrentlyPinching) {
        const pinchDuration = now - this.pinchStartTime;
        if (pinchDuration < 320 && now - this.lastPinchTapTime > 600) {
          this.lastPinchTapTime = now;
          this.callbacks.onPinchTap();
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'PINCH-TAP (ACTION)', handCount: 1 });
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
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: `SWIPE ${dir}`, handCount: 1 });
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
    // GESTURE: PALM STOP (OPEN HAND REPULSOR BEAM -> SHOW DESKTOP)
    // -------------------------------------------------------------
    const allFiveExtended = isIndexExt && isMiddleExt && isRingExt && isPinkyExt;
    if (allFiveExtended && !isPinching) {
      if (now - this.lastDiscreteGestureTime > 1200) {
        this.lastDiscreteGestureTime = now;
        this.callbacks.onPalmStop();
      }
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'OPEN PALM (SHOW DESKTOP)', handCount: 1 });
      return;
    }

    if (!isPinching && !isFist) {
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'HAND ACTIVE (READY)', handCount: 1 });
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

  drawHandSkeleton(landmarks, handIndex) {
    if (!this.ctx || !this.canvasElement) return;
    const { width, height } = this.canvasElement;
    const ctx = this.ctx;

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20],
      [0, 17]
    ];

    const strokeColor = handIndex === 0 ? '#00e5ff' : '#ffd700';
    const glowColor = handIndex === 0 ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 215, 0, 0.45)';

    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;

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

    landmarks.forEach((pt, i) => {
      const x = (1 - pt.x) * width;
      const y = pt.y * height;
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const radius = isTip ? 5.5 : 3.5;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#ffffff' : strokeColor;
      ctx.fill();

      if (isTip) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    ctx.restore();
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
    this.callbacks.onStateChange({ status: 'STOPPED', gesture: 'NONE' });
  }
}
