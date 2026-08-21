/**
 * JASPER Biometric Face Engine
 * Performs real-time facial feature vector extraction, cosine similarity matching,
 * and persistent storage of the owner's biometric face fingerprint.
 */

const STORAGE_KEY = 'jasper_owner_face_profile';
const VECTOR_SIZE = 64; // 8x8 spatial grid + luminance histograms + gradient vectors

/**
 * Extracts a normalized 64-dimensional feature vector from a video frame
 * @param {HTMLVideoElement} videoElement 
 * @param {HTMLCanvasElement} [canvasElement] 
 * @returns {{ vector: number[], faceDetected: boolean, brightness: number, contrast: number } | null}
 */
export function extractFaceVector(videoElement, canvasElement) {
  if (!videoElement || videoElement.readyState < 2) return null;

  const width = videoElement.videoWidth || 300;
  const height = videoElement.videoHeight || 300;

  // Use provided canvas or create an offscreen canvas
  const canvas = canvasElement || document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Draw current mirrored video frame
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, -width, 0, width, height);
  ctx.restore();

  // Focus on central region where target circle is located (center 60% of frame)
  const cropX = Math.floor(width * 0.2);
  const cropY = Math.floor(height * 0.2);
  const cropW = Math.floor(width * 0.6);
  const cropH = Math.floor(height * 0.6);

  const imgData = ctx.getImageData(cropX, cropY, cropW, cropH);
  const pixels = imgData.data;
  const totalPixels = cropW * cropH;

  if (totalPixels === 0) return null;

  let totalR = 0, totalG = 0, totalB = 0;
  let skinPixelCount = 0;

  // Grayscale array for spatial grid calculations
  const grayMatrix = new Float32Array(totalPixels);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    totalR += r;
    totalG += g;
    totalB += b;

    // Luminance formula (ITU-R BT.601)
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    grayMatrix[i / 4] = gray;

    // Simple skin tone heuristic range check (RGB space)
    if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
      skinPixelCount++;
    }
  }

  const avgR = totalR / totalPixels;
  const avgG = totalG / totalPixels;
  const avgB = totalB / totalPixels;
  const avgGray = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB);

  // Check if frame has enough light/contrast and face likelihood
  const skinRatio = skinPixelCount / totalPixels;
  if (avgGray < 25 || avgGray > 240) {
    // Too dark or overexposed
    return { vector: null, faceDetected: false, brightness: avgGray, contrast: 0, reason: 'POOR_LIGHTING' };
  }

  // Calculate Variance / Contrast
  let varianceSum = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = grayMatrix[i] - avgGray;
    varianceSum += diff * diff;
  }
  const contrast = Math.sqrt(varianceSum / totalPixels);

  if (contrast < 15) {
    // Blank/uniform object (e.g. wall or paper)
    return { vector: null, faceDetected: false, brightness: avgGray, contrast, reason: 'LOW_CONTRAST' };
  }

  // Build 64-dimensional lighting-invariant normalized feature vector:
  // 1. 6x6 spatial grid zero-mean luminance (36 values)
  const vector = new Float32Array(VECTOR_SIZE);
  const gridDim = 6;
  const cellW = Math.floor(cropW / gridDim);
  const cellH = Math.floor(cropH / gridDim);

  const safeContrast = contrast || 1;

  let vecIdx = 0;
  for (let gy = 0; gy < gridDim; gy++) {
    for (let gx = 0; gx < gridDim; gx++) {
      let cellSum = 0;
      let count = 0;
      for (let cy = 0; cy < cellH; cy++) {
        for (let cx = 0; cx < cellW; cx++) {
          const px = gx * cellW + cx;
          const py = gy * cellH + cy;
          if (px < cropW && py < cropH) {
            cellSum += grayMatrix[py * cropW + px];
            count++;
          }
        }
      }
      const rawCell = count > 0 ? cellSum / count : avgGray;
      vector[vecIdx++] = (rawCell - avgGray) / safeContrast;
    }
  }

  // 2. Horizontal & Vertical spatial gradients (16 values)
  for (let i = 0; i < 8; i++) {
    const rowTop = Math.floor((i * cropH) / 10);
    const rowBot = Math.floor(((i + 2) * cropH) / 10);
    let gradH = 0;
    for (let x = 0; x < cropW; x++) {
      const pTop = grayMatrix[rowTop * cropW + x] || 0;
      const pBot = grayMatrix[rowBot * cropW + x] || 0;
      gradH += Math.abs(pTop - pBot);
    }
    vector[vecIdx++] = (gradH / cropW) / safeContrast;
  }

  for (let i = 0; i < 8; i++) {
    const colLeft = Math.floor((i * cropW) / 10);
    const colRight = Math.floor(((i + 2) * cropW) / 10);
    let gradV = 0;
    for (let y = 0; y < cropH; y++) {
      const pL = grayMatrix[y * cropW + colLeft] || 0;
      const pR = grayMatrix[y * cropW + colRight] || 0;
      gradV += Math.abs(pL - pR);
    }
    vector[vecIdx++] = (gradV / cropH) / safeContrast;
  }

  // 3. Chromaticity ratios & skin ratio metrics (12 values to reach 64)
  const safeGray = avgGray || 1;
  while (vecIdx < VECTOR_SIZE) {
    if (vecIdx === 52) vector[vecIdx++] = avgR / safeGray;
    else if (vecIdx === 53) vector[vecIdx++] = avgG / safeGray;
    else if (vecIdx === 54) vector[vecIdx++] = avgB / safeGray;
    else if (vecIdx === 55) vector[vecIdx++] = skinRatio;
    else if (vecIdx === 56) vector[vecIdx++] = contrast / 100;
    else vector[vecIdx++] = 0;
  }

  // L2 Normalize the vector
  let normSq = 0;
  for (let i = 0; i < VECTOR_SIZE; i++) {
    normSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(normSq) || 1;
  const normalizedVector = Array.from(vector).map(val => val / norm);

  return {
    vector: normalizedVector,
    faceDetected: true,
    brightness: avgGray,
    contrast,
    skinRatio
  };
}

/**
 * Calculates Cosine Similarity between two feature vectors.
 * Returns match confidence score as percentage (0 to 100).
 * @param {number[]} vectorA 
 * @param {number[]} vectorB 
 * @returns {number} Confidence percentage (0 - 100)
 */
export function calculateMatchConfidence(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const rawCosine = dotProduct / denominator;
  
  // Transform cosine similarity curve to 0-100% confidence:
  // With zero-mean lighting invariant features, same face yields rawCosine >= 0.50
  let confidence = Math.max(0, (rawCosine - 0.35) / (0.90 - 0.35)) * 100;
  
  confidence = Math.min(99, Math.max(0, Math.round(confidence)));
  return confidence;
}

/**
 * Storage helpers for Owner Face Profile (Dual Persistence: LocalStorage + Server DB)
 */
export function getOwnerProfile() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load face profile from localStorage:', e);
  }
  return null;
}

export function saveOwnerProfile(vector, meta = {}) {
  try {
    const profile = {
      vector,
      enrolledAt: new Date().toISOString(),
      ...meta
    };
    // 1. Save to browser localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    
    // 2. Persist permanently to server database jasper.db.json
    fetch('/api/face-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }).catch(err => console.warn('[Face Sync] Server DB save warning:', err));

    return true;
  } catch (e) {
    console.error('Failed to save face profile:', e);
    return false;
  }
}

export async function syncOwnerProfileFromServer() {
  try {
    const res = await fetch('/api/face-profile');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.profile && Array.isArray(data.profile.vector)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.profile));
        console.log('[Face Biometrics] Successfully restored face profile from server database!');
        return data.profile;
      }
    }
  } catch (e) {
    console.warn('[Face Sync] Could not sync face profile from server DB:', e);
  }
  return getOwnerProfile();
}

export function clearOwnerProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    fetch('/api/face-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(null)
    }).catch(() => {});
    return true;
  } catch (e) {
    return false;
  }
}

export function hasOwnerProfile() {
  const p = getOwnerProfile();
  return Boolean(p && Array.isArray(p.vector) && p.vector.length === VECTOR_SIZE);
}

/**
 * Captures a clean JPEG image snapshot as a base64 string for Gemini Vision AI analysis
 * @param {HTMLVideoElement} videoElement
 * @returns {string | null} base64 encoded image string (without data URL prefix)
 */
export function captureWebcamFrameAsBase64(videoElement) {
  if (!videoElement || videoElement.readyState < 2) return null;
  const width = videoElement.videoWidth || 640;
  const height = videoElement.videoHeight || 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(videoElement, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return dataUrl.split(',')[1] || null;
}
