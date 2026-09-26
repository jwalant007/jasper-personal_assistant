// -------------------------------------------------------------
// J.A.S.P.E.R. PROCEDURAL MOTION SHADERS & CINEMATIC FX ENGINE
// High-performance, 60 FPS zero-latency canvas procedural video backgrounds
// -------------------------------------------------------------

/**
 * Renders procedural motion background onto canvas
 */
export function renderProceduralMotionShader(ctx, shaderId, width, height, timestamp, theme, sceneProgress = 0) {
  ctx.save();

  switch (shaderId) {
    case 'cyber_city':
      renderCyberCity(ctx, width, height, timestamp, theme);
      break;
    case 'quantum_matrix':
      renderMatrixRain(ctx, width, height, timestamp, theme);
      break;
    case 'hyperspace_warp':
      renderHyperspaceWarp(ctx, width, height, timestamp, theme);
      break;
    case 'stark_reactor':
      renderStarkReactor(ctx, width, height, timestamp, theme);
      break;
    case 'neural_synapse':
      renderNeuralSynapse(ctx, width, height, timestamp, theme);
      break;
    case 'sunset_horizon':
      renderSunsetHorizon(ctx, width, height, timestamp, theme);
      break;
    case 'football_stadium':
      renderFootballStadium(ctx, width, height, timestamp, theme);
      break;
    default:
      renderDynamicGradient(ctx, width, height, timestamp, theme);
      break;
  }

  ctx.restore();
}

/**
 * 1. CYBERPUNK 3D PERSPECTIVE NEON GRID & HORIZON
 */
function renderCyberCity(ctx, width, height, timestamp, theme) {
  // Deep night sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#030712');
  skyGrad.addColorStop(0.55, '#1e1b4b');
  skyGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  const horizonY = height * 0.58;

  // Distant glowing retro-neon sun on horizon
  const sunRadius = Math.min(width, height) * 0.22;
  const sunGrad = ctx.createRadialGradient(width / 2, horizonY, 5, width / 2, horizonY, sunRadius);
  sunGrad.addColorStop(0, '#facc15');
  sunGrad.addColorStop(0.4, '#f43f5e');
  sunGrad.addColorStop(0.8, '#8b5cf6');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(width / 2, horizonY, sunRadius, Math.PI, 0, false);
  ctx.fill();

  // Horizontal sun cut lines (synthwave sun)
  for (let l = 1; l <= 6; l++) {
    const cutY = horizonY - sunRadius * (l * 0.14);
    ctx.fillStyle = '#030712';
    ctx.fillRect(width / 2 - sunRadius, cutY, sunRadius * 2, l * 1.8);
  }

  // 3D Perspective Ground Grid
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  groundGrad.addColorStop(0, '#020617');
  groundGrad.addColorStop(1, '#180a33');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#06b6d4';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 8;

  // Perspective vertical lines receding to center horizon
  const linesCount = 18;
  const fovSpread = width * 1.4;
  for (let i = 0; i <= linesCount; i++) {
    const bottomX = (width - fovSpread) / 2 + (fovSpread / linesCount) * i;
    ctx.beginPath();
    ctx.moveTo(width / 2, horizonY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }

  // Perspective horizontal moving grid lines
  const speed = (timestamp * 0.08) % 1;
  for (let j = 0; j < 9; j++) {
    const p = Math.pow((j + speed) / 9, 2.2);
    const lineY = horizonY + p * (height - horizonY);
    ctx.strokeStyle = `rgba(236, 72, 153, ${Math.min(1, p * 1.2)})`;
    ctx.shadowColor = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(width, lineY);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  // Cyber city silhouette towers on edges
  ctx.fillStyle = '#050510';
  const buildings = [
    { x: 20, w: 45, h: height * 0.35 },
    { x: 75, w: 60, h: height * 0.42 },
    { x: 145, w: 50, h: height * 0.3 },
    { x: width - 85, w: 65, h: height * 0.38 },
    { x: width - 160, w: 55, h: height * 0.46 },
    { x: width - 225, w: 45, h: height * 0.32 }
  ];
  buildings.forEach(b => {
    ctx.fillRect(b.x, horizonY - b.h, b.w, b.h);
    // Glowing window dots
    ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
    for (let wy = horizonY - b.h + 12; wy < horizonY - 10; wy += 14) {
      for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 10) {
        if ((wx + wy + Math.floor(timestamp * 0.002)) % 3 === 0) {
          ctx.fillRect(wx, wy, 4, 6);
        }
      }
    }
    ctx.fillStyle = '#050510';
  });
}

/**
 * 2. QUANTUM MATRIX DIGITAL DATA STREAM
 */
function renderMatrixRain(ctx, width, height, timestamp, theme) {
  // Deep black digital background
  ctx.fillStyle = '#021810';
  ctx.fillRect(0, 0, width, height);

  const colWidth = 22;
  const cols = Math.floor(width / colWidth);
  const chars = '0123456789ABCDEF∆Ω∑πλ01010101XYZ';

  ctx.font = 'bold 15px monospace';

  for (let c = 0; c < cols; c++) {
    const colX = c * colWidth + 4;
    const colSpeed = 0.12 + (c % 7) * 0.035;
    const offset = (c * 97.3);
    const headY = ((timestamp * colSpeed + offset) % (height + 250)) - 50;

    const trailLength = 14;
    for (let t = 0; t < trailLength; t++) {
      const charY = headY - t * 18;
      if (charY < 0 || charY > height) continue;

      const charIdx = (c * 13 + t + Math.floor(timestamp * 0.005)) % chars.length;
      const ch = chars[charIdx];

      if (t === 0) {
        // Bright white glowing lead head
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 10;
      } else if (t < 4) {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 5;
      } else {
        const alpha = Math.max(0.08, 1 - (t / trailLength));
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
        ctx.shadowBlur = 0;
      }

      ctx.fillText(ch, colX, charY);
    }
  }

  // Faint cyber grid line overlay
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.08)';
  ctx.shadowBlur = 0;
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

/**
 * 3. COSMIC HYPERSPACE WARP DRIVE & NEBULA
 */
function renderHyperspaceWarp(ctx, width, height, timestamp, theme) {
  // Deep space with colorful nebula cloud
  const spaceGrad = ctx.createRadialGradient(
    width * 0.5 + Math.sin(timestamp * 0.001) * 80,
    height * 0.5 + Math.cos(timestamp * 0.001) * 60,
    30,
    width * 0.5,
    height * 0.5,
    width * 0.75
  );
  spaceGrad.addColorStop(0, '#1e1035');
  spaceGrad.addColorStop(0.4, '#0f172a');
  spaceGrad.addColorStop(1, '#020617');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const starCount = 140;

  ctx.lineWidth = 2;

  for (let i = 0; i < starCount; i++) {
    // Unique deterministic angle & distance per star
    const angle = (i * 2.39996); // Golden ratio angle
    const speedMultiplier = 0.0006 + (i % 5) * 0.0002;
    const progress = ((timestamp * speedMultiplier + (i / starCount)) % 1);
    
    const dist = Math.pow(progress, 2.5) * (Math.max(width, height) * 0.75);
    const prevDist = Math.max(0, dist - (progress * 55 + 8));

    const x1 = cx + Math.cos(angle) * prevDist;
    const y1 = cy + Math.sin(angle) * prevDist;
    const x2 = cx + Math.cos(angle) * dist;
    const y2 = cy + Math.sin(angle) * dist;

    const alpha = Math.min(1, progress * 1.8);
    const starColor = i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#c084fc' : '#ffffff';

    ctx.strokeStyle = starColor;
    ctx.shadowColor = starColor;
    ctx.shadowBlur = 6;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Central event horizon pulse
  const centerPulse = 18 + Math.sin(timestamp * 0.005) * 6;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerPulse * 2.5);
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  coreGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.6)');
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, centerPulse * 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 4. STARK ARC REACTOR HUD CORE
 */
function renderStarkReactor(ctx, width, height, timestamp, theme) {
  ctx.fillStyle = '#0a0908';
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.38;

  // Background radial ambient glow
  const amb = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxR * 1.4);
  amb.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
  amb.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
  amb.addColorStop(1, 'transparent');
  ctx.fillStyle = amb;
  ctx.fillRect(0, 0, width, height);

  // Concentric rotating rings
  const rings = [
    { r: maxR * 0.95, speed: 0.0004, dash: [20, 10, 5, 10], color: '#f59e0b', width: 2 },
    { r: maxR * 0.82, speed: -0.0007, dash: [40, 15, 80, 15], color: '#ef4444', width: 2.5 },
    { r: maxR * 0.68, speed: 0.0011, dash: [8, 8], color: '#fbbf24', width: 1.5 },
    { r: maxR * 0.52, speed: -0.0014, dash: [30, 20], color: '#f97316', width: 2 }
  ];

  rings.forEach(ring => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(timestamp * ring.speed);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width;
    ctx.shadowColor = ring.color;
    ctx.shadowBlur = 10;
    ctx.setLineDash(ring.dash);
    ctx.beginPath();
    ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Plasma core triangle / hexagon
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(timestamp * 0.0008);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  const sides = 6;
  const hexR = maxR * 0.32;
  for (let s = 0; s < sides; s++) {
    const a = (s * Math.PI * 2) / sides;
    const px = Math.cos(a) * hexR;
    const py = Math.sin(a) * hexR;
    if (s === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Energy Core Center
  const coreG = ctx.createRadialGradient(0, 0, 0, 0, 0, hexR * 0.7);
  coreG.addColorStop(0, '#ffffff');
  coreG.addColorStop(0.3, '#fef08a');
  coreG.addColorStop(0.8, '#f59e0b');
  coreG.addColorStop(1, 'rgba(239, 68, 68, 0.4)');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.arc(0, 0, hexR * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Crosshair HUD lines
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(cx - maxR * 1.15, cy);
  ctx.lineTo(cx + maxR * 1.15, cy);
  ctx.moveTo(cx, cy - maxR * 1.15);
  ctx.lineTo(cx, cy + maxR * 1.15);
  ctx.stroke();
}

/**
 * 5. NEURAL SYNAPSE & AI BRAIN IMPULSES
 */
function renderNeuralSynapse(ctx, width, height, timestamp, theme) {
  ctx.fillStyle = '#040714';
  ctx.fillRect(0, 0, width, height);

  // Nodes positions
  const nodes = [
    { x: width * 0.2, y: height * 0.3 },
    { x: width * 0.35, y: height * 0.65 },
    { x: width * 0.5, y: height * 0.25 },
    { x: width * 0.65, y: height * 0.7 },
    { x: width * 0.8, y: height * 0.35 },
    { x: width * 0.5, y: height * 0.5 },
    { x: width * 0.28, y: height * 0.45 },
    { x: width * 0.72, y: height * 0.52 }
  ];

  // Draw connecting synapses
  ctx.lineWidth = 1.8;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < width * 0.45) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();

        // Traveling electrical action potential impulse
        const impulseProgress = ((timestamp * 0.0012 + (i + j) * 0.2) % 1);
        const ix = nodes[i].x + (nodes[j].x - nodes[i].x) * impulseProgress;
        const iy = nodes[i].y + (nodes[j].y - nodes[i].y) * impulseProgress;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(ix, iy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // Draw neural soma bodies
  nodes.forEach((n, idx) => {
    const pulse = 1 + Math.sin(timestamp * 0.004 + idx) * 0.25;
    const r = 8 * pulse;

    const nGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
    nGrad.addColorStop(0, '#ffffff');
    nGrad.addColorStop(0.3, '#38bdf8');
    nGrad.addColorStop(0.8, '#8b5cf6');
    nGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = nGrad;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * 6. ATMOSPHERIC SUNSET & GOLDEN TWILIGHT
 */
function renderSunsetHorizon(ctx, width, height, timestamp, theme) {
  // Rich golden sunset gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#1c1917');
  grad.addColorStop(0.3, '#431407');
  grad.addColorStop(0.65, '#ea580c');
  grad.addColorStop(0.88, '#f59e0b');
  grad.addColorStop(1, '#fef08a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Big gentle sun
  const sunY = height * 0.72;
  const sG = ctx.createRadialGradient(width / 2, sunY, 10, width / 2, sunY, width * 0.35);
  sG.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  sG.addColorStop(0.2, 'rgba(254, 240, 138, 0.7)');
  sG.addColorStop(0.6, 'rgba(249, 115, 22, 0.3)');
  sG.addColorStop(1, 'transparent');
  ctx.fillStyle = sG;
  ctx.fillRect(0, 0, width, height);

  // Floating ambient light particles / dust motes
  for (let p = 0; p < 25; p++) {
    const px = ((p * 153.2 + timestamp * 0.02) % width);
    const py = ((p * 271.7 - timestamp * 0.04) % height + height) % height;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 7. DEATH REAPER FOOTBALL STADIUM NIGHT & FLOODLIGHTS
 */
function renderFootballStadium(ctx, width, height, timestamp, theme) {
  // Midnight Champions League sky
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#020617');
  sky.addColorStop(0.4, '#091e3a');
  sky.addColorStop(0.65, '#042f1a');
  sky.addColorStop(1, '#022012');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const pitchY = height * 0.58;

  // 1. Dual Overhead Volumetric Floodlights (Stadium Arcs)
  const leftLight = ctx.createRadialGradient(width * 0.15, height * 0.08, 10, width * 0.35, height * 0.65, width * 0.6);
  leftLight.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  leftLight.addColorStop(0.25, 'rgba(224, 242, 254, 0.45)');
  leftLight.addColorStop(0.6, 'rgba(56, 189, 248, 0.15)');
  leftLight.addColorStop(1, 'transparent');
  ctx.fillStyle = leftLight;
  ctx.fillRect(0, 0, width, height);

  const rightLight = ctx.createRadialGradient(width * 0.85, height * 0.08, 10, width * 0.65, height * 0.65, width * 0.6);
  rightLight.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  rightLight.addColorStop(0.25, 'rgba(224, 242, 254, 0.45)');
  rightLight.addColorStop(0.6, 'rgba(56, 189, 248, 0.15)');
  rightLight.addColorStop(1, 'transparent');
  ctx.fillStyle = rightLight;
  ctx.fillRect(0, 0, width, height);

  // Stadium Floodlight Towers (Silhouettes)
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 15;
  for (let l = 0; l < 4; l++) {
    ctx.fillRect(width * 0.12 + l * 8, height * 0.06, 6, 6);
    ctx.fillRect(width * 0.82 + l * 8, height * 0.06, 6, 6);
  }
  ctx.shadowBlur = 0;

  // 2. Football Pitch Surface (Grass Gradient)
  const grassGrad = ctx.createLinearGradient(0, pitchY, 0, height);
  grassGrad.addColorStop(0, '#044222');
  grassGrad.addColorStop(0.5, '#065f32');
  grassGrad.addColorStop(1, '#022c16');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, pitchY, width, height - pitchY);

  // Striped grass mowing lines
  const stripes = 7;
  for (let s = 0; s < stripes; s++) {
    if (s % 2 === 0) {
      const sy = pitchY + (s / stripes) * (height - pitchY);
      const sh = (height - pitchY) / stripes;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, sy, width, sh);
    }
  }

  // 3. 3D Perspective Pitch White Chalk Markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2.5;

  // Center line
  ctx.beginPath();
  ctx.moveTo(0, pitchY + 4);
  ctx.lineTo(width, pitchY + 4);
  ctx.stroke();

  // Center Circle (perspective ellipse)
  ctx.save();
  ctx.translate(width / 2, pitchY + (height - pitchY) * 0.4);
  ctx.scale(1, 0.38);
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.22, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Touchline perspective sidelines
  ctx.beginPath();
  ctx.moveTo(width * 0.15, pitchY);
  ctx.lineTo(0, height);
  ctx.moveTo(width * 0.85, pitchY);
  ctx.lineTo(width, height);
  ctx.stroke();

  // 4. Floating Stadium Light Embers & Pitch Dust
  for (let e = 0; e < 30; e++) {
    const ex = ((e * 179.3 + timestamp * 0.035) % width);
    const ey = ((e * 283.7 - timestamp * 0.05) % height + height) % height;
    ctx.fillStyle = e % 3 === 0 ? 'rgba(254, 240, 138, 0.75)' : 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(ex, ey, (e % 2) + 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Fallback dynamic radial gradient
 */
function renderDynamicGradient(ctx, width, height, timestamp, theme) {
  const grad = ctx.createRadialGradient(
    width * 0.5 + Math.sin(timestamp * 0.001) * 100,
    height * 0.5 + Math.cos(timestamp * 0.0015) * 80,
    20,
    width * 0.5,
    height * 0.5,
    width * 0.85
  );
  grad.addColorStop(0, theme?.secondary || '#ec4899');
  grad.addColorStop(0.4, theme?.primary || '#06b6d4');
  grad.addColorStop(1, theme?.bg || '#030712');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

/**
 * -------------------------------------------------------------
 * CINEMATIC VISUAL FX & OVERLAYS APPLIED ON CANVAS
 * -------------------------------------------------------------
 */
export function applyCinematicVisualFilter(ctx, width, height, filterType, timestamp, theme) {
  if (!filterType || filterType === 'none') return;

  ctx.save();

  if (filterType === 'film_grain') {
    // 35mm Organic Film Noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let n = 0; n < 90; n++) {
      const nx = ((n * 137.9 + timestamp * 0.07) % width);
      const ny = ((n * 263.1 + timestamp * 0.11) % height);
      ctx.fillRect(nx, ny, 2.5, 2.5);
    }
  } else if (filterType === 'vhs_glitch') {
    // CRT Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = (timestamp * 0.06) % 6; y < height; y += 6) {
      ctx.fillRect(0, y, width, 2);
    }
    // Glitch bands occasionally
    if (Math.sin(timestamp * 0.003) > 0.82) {
      const bandY = ((timestamp * 0.08) % height);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.16)';
      ctx.fillRect(0, bandY, width, 22);
    }
  } else if (filterType === 'lens_flare') {
    // Anamorphic horizontal blue flare
    const flareY = height * 0.2;
    const streak = ctx.createLinearGradient(0, flareY, width, flareY);
    streak.addColorStop(0, 'rgba(56, 189, 248, 0)');
    streak.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
    streak.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = streak;
    ctx.fillRect(0, flareY - 3, width, 6);

    const fG = ctx.createRadialGradient(width * 0.7, flareY, 5, width * 0.7, flareY, width * 0.35);
    fG.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
    fG.addColorStop(0.4, 'rgba(56, 189, 248, 0.15)');
    fG.addColorStop(1, 'transparent');
    ctx.fillStyle = fG;
    ctx.fillRect(0, 0, width, height);
  } else if (filterType === 'cinematic') {
    // Teal & Orange Hollywood Color Grade
    const tealOrange = ctx.createLinearGradient(0, 0, width, height);
    tealOrange.addColorStop(0, 'rgba(6, 182, 212, 0.08)'); // Teal shadows
    tealOrange.addColorStop(1, 'rgba(249, 115, 22, 0.08)'); // Orange highlights
    ctx.fillStyle = tealOrange;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}
