/**
 * J.A.S.P.E.R. AIR-GESTURE TRACKER SERVICE
 * Real-time hand skeletal tracking via MediaPipe Hands CDN
 * Classifies gestures matching the JARVIS holographic reel:
 * - Swipe Left/Right: Select next/previous creation
 * - Pinch-Drag: 3D rotate hologram
 * - Two-Hand Spread/Contract: 3D zoom in/out
 * - Pinch-Tap: Explode view / open component
 * - Fist: Reset camera / Back
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
        resolve(); // resolve so camera can still work
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
      onPinchTap: callbacks.onPinchTap || (() => {}),
      onFist: callbacks.onFist || (() => {}),
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
    this.lastPinchTapTime = 0;
    this.isCurrentlyPinching = false;
    this.pinchStartTime = 0;
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

    // 1. TWO-HAND GESTURE: ZOOM
    if (handCount >= 2) {
      const hand1 = landmarksList[0];
      const hand2 = landmarksList[1];
      const p1 = hand1[0]; // Wrist/base of palm 1
      const p2 = hand2[0]; // Wrist/base of palm 2
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

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

    // SINGLE-HAND GESTURES
    const hand = landmarksList[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const ringTip = hand[16];
    const pinkyTip = hand[20];
    const wrist = hand[0];
    const palmCenter = hand[9];

    // Distance between thumb and index tips
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const isPinching = pinchDist < 0.085;

    // FIST DETECTION: all 4 fingertips closer to wrist than their respective PIP joints
    const isFist = 
      Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y) < Math.hypot(hand[6].x - wrist.x, hand[6].y - wrist.y) &&
      Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y) < Math.hypot(hand[10].x - wrist.x, hand[10].y - wrist.y) &&
      Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y) < Math.hypot(hand[14].x - wrist.x, hand[14].y - wrist.y) &&
      Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y) < Math.hypot(hand[18].x - wrist.x, hand[18].y - wrist.y);

    if (isFist) {
      this.callbacks.onFist();
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'FIST (RESET VIEW)', handCount: 1 });
      this.lastPinchPos = null;
      return;
    }

    // PINCH GESTURES: PINCH-DRAG (ROTATE) & PINCH-TAP (EXPLODE / SELECT)
    if (isPinching) {
      const pinchCenterX = (thumbTip.x + indexTip.x) / 2;
      const pinchCenterY = (thumbTip.y + indexTip.y) / 2;

      if (!this.isCurrentlyPinching) {
        this.isCurrentlyPinching = true;
        this.pinchStartTime = now;
      }

      if (this.lastPinchPos) {
        // Mirrored coordinate delta for intuitive natural interaction
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
          this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'PINCH-TAP (EXPLODE/OPEN)', handCount: 1 });
        }
        this.isCurrentlyPinching = false;
      }
      this.lastPinchPos = null;
    }

    // SWIPE DETECTION: Fast horizontal velocity of palm
    this.palmHistory.push({ x: palmCenter.x, y: palmCenter.y, t: now });
    if (this.palmHistory.length > 8) this.palmHistory.shift();

    if (!isPinching && this.palmHistory.length >= 4 && now - this.lastSwipeTime > 750) {
      const oldest = this.palmHistory[0];
      const newest = this.palmHistory[this.palmHistory.length - 1];
      const dt = (newest.t - oldest.t) / 1000;
      const vx = (newest.x - oldest.x) / dt;

      if (Math.abs(vx) > 1.8) {
        const dir = vx < 0 ? 'NEXT' : 'PREV';
        this.lastSwipeTime = now;
        this.callbacks.onSwipe(dir);
        this.callbacks.onStateChange({ status: 'TRACKING', gesture: `SWIPE ${dir}`, handCount: 1 });
        return;
      }
    }

    if (!isPinching && !isFist) {
      this.callbacks.onStateChange({ status: 'TRACKING', gesture: 'OPEN HAND (READY)', handCount: 1 });
    }
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
    const glowColor = handIndex === 0 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(255, 215, 0, 0.4)';

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
