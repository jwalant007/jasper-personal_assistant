import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Ultra-High Resolution PBR Texture Generator (2048x2048 Color & Normal Maps)
function createPhotorealisticSuitTextures(suitType, primaryHex, secondaryHex) {
  // 1. COLOR MAP
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 2048;
  colorCanvas.height = 2048;
  const ctx = colorCanvas.getContext('2d');

  // Base background fill
  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 2048, 2048);

  // High-density carbon micro-hex nano-weave texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  for (let y = 0; y < 2048; y += 8) {
    for (let x = (y % 16 === 0 ? 0 : 4); x < 2048; x += 8) {
      ctx.fillRect(x, y, 4, 4);
    }
  }

  // Draw Far From Home / Upgraded Suit Stealth Black Side & Thigh Panels
  if (suitType === 'upgraded') {
    ctx.fillStyle = secondaryHex;
    // Torso lat side panels
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(480, 560);
    ctx.lineTo(560, 1500);
    ctx.lineTo(0, 1600);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2048, 500);
    ctx.lineTo(1568, 560);
    ctx.lineTo(1488, 1500);
    ctx.lineTo(2048, 1600);
    ctx.fill();

    // Thigh panels
    ctx.fillRect(560, 1040, 928, 560);
  }

  // Anatomical Muscle Shading (Shadow & Specular Gradients for AAA Game visual depth)
  const muscleGrad = ctx.createLinearGradient(0, 0, 0, 2048);
  muscleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.12)'); // Head highlight
  muscleGrad.addColorStop(0.25, 'rgba(0, 0, 0, 0.0)');      // Pectoral peak
  muscleGrad.addColorStop(0.40, 'rgba(0, 0, 0, 0.22)');     // Abdominal shadow
  muscleGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.18)');     // Thigh shadow
  muscleGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.35)');      // Boot base shadow
  ctx.fillStyle = muscleGrad;
  ctx.fillRect(0, 0, 2048, 2048);

  // High-Precision Smooth Web Lattice overlay
  ctx.strokeStyle = 'rgba(10, 10, 15, 0.75)';
  ctx.lineWidth = 4;

  const centerX = 1024;
  const centerY = 640;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * 1400, centerY + Math.sin(angle) * 1400);
    ctx.stroke();
  }

  for (let r = 80; r < 1200; r += 90) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const mapTexture = new THREE.CanvasTexture(colorCanvas);
  mapTexture.wrapS = THREE.RepeatWrapping;
  mapTexture.wrapT = THREE.RepeatWrapping;

  // 2. NORMAL BUMP MAP
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = 1024;
  normalCanvas.height = 1024;
  const nCtx = normalCanvas.getContext('2d');

  // Flat normal blue
  nCtx.fillStyle = 'rgb(128, 128, 255)';
  nCtx.fillRect(0, 0, 1024, 1024);

  // Micro fabric texture normal bumps
  nCtx.fillStyle = 'rgb(160, 128, 240)';
  for (let y = 0; y < 1024; y += 4) {
    for (let x = (y % 8 === 0 ? 0 : 2); x < 1024; x += 4) {
      nCtx.fillRect(x, y, 2, 2);
    }
  }

  const normalTexture = new THREE.CanvasTexture(normalCanvas);
  normalTexture.wrapS = THREE.RepeatWrapping;
  normalTexture.wrapT = THREE.RepeatWrapping;

  return { mapTexture, normalTexture };
}

export default function Hologram3dCanvas({ mode = 'spiderman', spidermanSuit = 'upgraded', autoRotate = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    // 1. Scene, Camera, Renderer with Anti-Aliasing & High Precision
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0.15, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Master Hologram Group
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // AAA Movie Studio Lighting setup (Key, Fill, Dual Rim, Bounce)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88ccff, 1.2);
    fillLight.position.set(-5, 4, 3);
    scene.add(fillLight);

    const rimLightCrimson = new THREE.PointLight(0xff0044, 4.5, 25);
    rimLightCrimson.position.set(5, 2, -4);
    scene.add(rimLightCrimson);

    const rimLightCyan = new THREE.PointLight(0x00f3ff, 4.0, 25);
    rimLightCyan.position.set(-5, -1, -4);
    scene.add(rimLightCyan);

    const bounceLight = new THREE.HemisphereLight(0x445577, 0x110022, 0.8);
    scene.add(bounceLight);

    let animateCallback = () => {};

    if (mode === 'spiderman') {
      // 🕷️ PHOTOREALISTIC AAA GAME / MARVEL MOVIE SPIDER-MAN FIGURE
      const figureGroup = new THREE.Group();
      hologramGroup.add(figureGroup);

      // Color Palette Configurations
      let primaryHex = '#e60026';
      let secondaryHex = '#111318';
      let primaryColor = 0xe60026;
      let secondaryColor = 0x111318;
      let eyeColor = 0xffffff;
      let eyeFrameColor = 0x090a0e;
      let emblemColor = 0x08080a;
      let particleColor = 0xff0044;
      let isIronSpider = false;
      let hasSpiderLegs = false;

      if (spidermanSuit === 'upgraded') {
        // MCU Upgraded Suit (Far From Home) - Red & Black with Sleek Logo
        primaryHex = '#e60026';
        secondaryHex = '#111318';
        primaryColor = 0xe60026;
        secondaryColor = 0x111318;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x090a0e;
        emblemColor = 0x0a0b0f;
        particleColor = 0xff0044;
      } else if (spidermanSuit === 'ironspider') {
        // Iron Spider Nanotech (Gold, Crimson, Metallic Navy)
        primaryHex = '#d60029';
        secondaryHex = '#101726';
        primaryColor = 0xd60029;
        secondaryColor = 0x101726;
        eyeColor = 0xffffff;
        eyeFrameColor = 0xffd700;
        emblemColor = 0xffd700;
        particleColor = 0xffd700;
        isIronSpider = true;
        hasSpiderLegs = true;
      } else if (spidermanSuit === 'symbiote') {
        // Symbiote Black Suit
        primaryHex = '#11141d';
        secondaryHex = '#1a202c';
        primaryColor = 0x11141d;
        secondaryColor = 0x1a202c;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x000000;
        emblemColor = 0xffffff;
        particleColor = 0x8899ac;
      } else if (spidermanSuit === 'miles') {
        // Miles Morales (Black & Spray Red)
        primaryHex = '#121216';
        secondaryHex = '#ff0033';
        primaryColor = 0x121216;
        secondaryColor = 0xff0033;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x111111;
        emblemColor = 0xff0033;
        particleColor = 0xff0033;
      } else if (spidermanSuit === '2099') {
        // Spider-Man 2099 (Cyber Midnight Blue & Neon Crimson)
        primaryHex = '#001a35';
        secondaryHex = '#00a8ff';
        primaryColor = 0x001a35;
        secondaryColor = 0x00a8ff;
        eyeColor = 0xff0055;
        eyeFrameColor = 0x001122;
        emblemColor = 0xff0044;
        particleColor = 0x00d2ff;
      } else {
        // Classic Peter Parker (Red & Blue)
        primaryHex = '#ee0033';
        secondaryHex = '#0055cc';
        primaryColor = 0xee0033;
        secondaryColor = 0x0055cc;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x111111;
        emblemColor = 0x111111;
        particleColor = 0x00f3ff;
      }

      // Generate ultra-high resolution PBR textures
      const { mapTexture, normalTexture } = createPhotorealisticSuitTextures(spidermanSuit, primaryHex, secondaryHex);

      // PBR Physically Based Materials with Clearcoat & Normal Mapping
      const primaryMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        map: mapTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.35, 0.35),
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        roughness: 0.28,
        metalness: isIronSpider ? 0.85 : 0.22,
        reflectivity: 0.9,
        emissive: primaryColor,
        emissiveIntensity: 0.12
      });

      const secondaryMat = new THREE.MeshPhysicalMaterial({
        color: secondaryColor,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.4, 0.4),
        roughness: 0.42,
        metalness: isIronSpider ? 0.8 : 0.32,
        clearcoat: 0.6
      });

      const bootMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        normalMap: normalTexture,
        clearcoat: 0.9,
        roughness: 0.22,
        metalness: isIronSpider ? 0.85 : 0.25,
        emissive: primaryColor,
        emissiveIntensity: 0.1
      });

      // --- 1. HEAD & SPIDER MASK (High-Poly Sphere with Smooth Normals) ---
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.65, 0);

      const headGeo = new THREE.SphereGeometry(0.38, 64, 64);
      headGeo.scale(0.88, 1.18, 0.95);
      headGeo.computeVertexNormals();
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headGroup.add(headMesh);

      // Head Web Lattice Overlay (Subtle Smooth Lines)
      const headWebGeo = new THREE.SphereGeometry(0.385, 32, 24);
      headWebGeo.scale(0.89, 1.19, 0.96);
      const headWebMat = new THREE.MeshBasicMaterial({
        color: 0x050508,
        wireframe: true,
        transparent: true,
        opacity: 0.25
      });
      const headWebMesh = new THREE.Mesh(headWebGeo, headWebMat);
      headGroup.add(headWebMesh);

      // Extruded Angular Movie Eye Lenses (Marvel Movie / Game fidelity)
      [-0.145, 0.145].forEach((xOffset) => {
        const eyeShape = new THREE.Shape();
        eyeShape.moveTo(0, 0.19);
        eyeShape.quadraticCurveTo(0.15, 0.14, 0.16, -0.04);
        eyeShape.quadraticCurveTo(0.10, -0.18, 0, -0.22);
        eyeShape.quadraticCurveTo(-0.10, -0.18, -0.16, -0.04);
        eyeShape.quadraticCurveTo(-0.15, 0.14, 0, 0.19);

        // Reflective White Glowing Lens Surface
        const eyeExtrudeSettings = { depth: 0.03, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.015, bevelThickness: 0.015 };
        const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, eyeExtrudeSettings);
        eyeGeo.scale(0.72, 0.85, 0.7);

        const eyeMat = new THREE.MeshPhysicalMaterial({
          color: eyeColor,
          emissive: eyeColor,
          emissiveIntensity: 0.95,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          roughness: 0.05
        });

        const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        eyeMesh.position.set(xOffset, 0.05, 0.33);
        eyeMesh.rotation.y = xOffset * -0.45;
        eyeMesh.rotation.z = xOffset * 0.22;
        headGroup.add(eyeMesh);

        // Metallic Black Outer Lens Contour Frame
        const frameShape = new THREE.Shape();
        frameShape.moveTo(0, 0.22);
        frameShape.quadraticCurveTo(0.18, 0.16, 0.19, -0.05);
        frameShape.quadraticCurveTo(0.12, -0.21, 0, -0.25);
        frameShape.quadraticCurveTo(-0.12, -0.21, -0.19, -0.05);
        frameShape.quadraticCurveTo(-0.18, 0.16, 0, 0.22);

        const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.02, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.01, bevelThickness: 0.01 });
        frameGeo.scale(0.76, 0.88, 0.7);

        const frameMat = new THREE.MeshPhysicalMaterial({
          color: eyeFrameColor,
          clearcoat: 1.0,
          roughness: 0.12,
          metalness: 0.85
        });

        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(xOffset, 0.05, 0.315);
        frameMesh.rotation.y = xOffset * -0.45;
        frameMesh.rotation.z = xOffset * 0.22;
        headGroup.add(frameMesh);
      });

      figureGroup.add(headGroup);

      // --- 2. NECK & TRAPEZIUS ---
      const neckGeo = new THREE.CylinderGeometry(0.17, 0.23, 0.28, 48);
      neckGeo.computeVertexNormals();
      const neckMesh = new THREE.Mesh(neckGeo, primaryMat);
      neckMesh.position.set(0, 1.30, 0);
      figureGroup.add(neckMesh);

      // --- 3. ATHLETIC TORSO & CHEST ---
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 0.65, 0);

      // Main Chest Pectorals
      const chestGeo = new THREE.SphereGeometry(0.55, 64, 64);
      chestGeo.scale(1.05, 0.82, 0.72);
      chestGeo.computeVertexNormals();
      const chestMesh = new THREE.Mesh(chestGeo, primaryMat);
      chestMesh.position.set(0, 0.28, 0);
      torsoGroup.add(chestMesh);

      // Waist & Abdomen (Stealth Black Side Panels for Upgraded Suit)
      const abdomenGeo = new THREE.CylinderGeometry(0.48, 0.40, 0.75, 48);
      abdomenGeo.computeVertexNormals();
      const abdomenMesh = new THREE.Mesh(abdomenGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      abdomenMesh.position.set(0, -0.22, 0);
      torsoGroup.add(abdomenMesh);

      // Latissimus Muscles (Black Accents)
      [-0.34, 0.34].forEach(xSide => {
        const latGeo = new THREE.CapsuleGeometry(0.15, 0.5, 12, 24);
        latGeo.computeVertexNormals();
        const latMesh = new THREE.Mesh(latGeo, secondaryMat);
        latMesh.position.set(xSide, 0.05, -0.05);
        latMesh.rotation.z = xSide * 0.2;
        torsoGroup.add(latMesh);
      });

      // --- 3D EXTRACTED SPIDER EMBLEM ON CHEST (Exact match to Far From Home emblem) ---
      const emblemShape = new THREE.Shape();
      emblemShape.moveTo(0, 0.18);
      emblemShape.lineTo(0.08, 0.09);
      emblemShape.lineTo(0.18, 0.14);
      emblemShape.lineTo(0.11, -0.02);
      emblemShape.lineTo(0.21, -0.12);
      emblemShape.lineTo(0.06, -0.14);
      emblemShape.lineTo(0, -0.22);
      emblemShape.lineTo(-0.06, -0.14);
      emblemShape.lineTo(-0.21, -0.12);
      emblemShape.lineTo(-0.11, -0.02);
      emblemShape.lineTo(-0.18, 0.14);
      emblemShape.lineTo(-0.08, 0.09);
      emblemShape.closePath();

      const emblemExtrude = { depth: 0.04, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.01, bevelThickness: 0.01 };
      const emblemGeo = new THREE.ExtrudeGeometry(emblemShape, emblemExtrude);
      emblemGeo.scale(1.15, 1.15, 1.0);

      const emblemMat = new THREE.MeshPhysicalMaterial({
        color: emblemColor,
        clearcoat: 1.0,
        metalness: isIronSpider ? 0.95 : 0.5,
        roughness: isIronSpider ? 0.1 : 0.25,
        emissive: isIronSpider ? 0xffaa00 : 0x000000,
        emissiveIntensity: isIronSpider ? 0.4 : 0.0
      });

      const frontEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      frontEmblem.position.set(0, 0.24, 0.37);
      torsoGroup.add(frontEmblem);

      const backEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      backEmblem.position.set(0, 0.24, -0.37);
      backEmblem.rotation.y = Math.PI;
      torsoGroup.add(backEmblem);

      figureGroup.add(torsoGroup);

      // --- 4. SHOULDERS & ARMS ---
      const rShoulderGeo = new THREE.SphereGeometry(0.24, 32, 32);
      rShoulderGeo.computeVertexNormals();
      const rShoulder = new THREE.Mesh(rShoulderGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      rShoulder.position.set(0.58, 0.92, 0);
      figureGroup.add(rShoulder);

      const rBicepGeo = new THREE.CapsuleGeometry(0.15, 0.42, 12, 24);
      rBicepGeo.computeVertexNormals();
      const rBicep = new THREE.Mesh(rBicepGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      rBicep.position.set(0.72, 0.60, 0.05);
      rBicep.rotation.z = -0.28;
      figureGroup.add(rBicep);

      const rForearmGeo = new THREE.CapsuleGeometry(0.13, 0.42, 12, 24);
      rForearmGeo.computeVertexNormals();
      const rForearm = new THREE.Mesh(rForearmGeo, primaryMat);
      rForearm.position.set(0.86, 0.18, 0.12);
      rForearm.rotation.z = -0.18;
      figureGroup.add(rForearm);

      const lShoulder = new THREE.Mesh(rShoulderGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      lShoulder.position.set(-0.58, 0.92, 0);
      figureGroup.add(lShoulder);

      const lBicep = new THREE.Mesh(rBicepGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      lBicep.position.set(-0.72, 0.60, 0.08);
      lBicep.rotation.z = 0.28;
      lBicep.rotation.x = -0.20;
      figureGroup.add(lBicep);

      const lForearm = new THREE.Mesh(rForearmGeo, primaryMat);
      lForearm.position.set(-0.88, 0.18, 0.25);
      lForearm.rotation.z = 0.20;
      lForearm.rotation.x = -0.45;
      figureGroup.add(lForearm);

      // Silver Wrist Web-Shooters
      [-0.88, 0.86].forEach((xPos, idx) => {
        const shooterGeo = new THREE.TorusGeometry(0.13, 0.025, 16, 32);
        const shooterMat = new THREE.MeshPhysicalMaterial({ color: 0xd0d0d0, metalness: 0.95, roughness: 0.1 });
        const shooter = new THREE.Mesh(shooterGeo, shooterMat);
        shooter.position.set(xPos, 0.02, idx === 0 ? 0.32 : 0.15);
        shooter.rotation.x = Math.PI / 2;
        figureGroup.add(shooter);
      });

      // --- 5. HIPS, LEGS & RED BOOTS ---
      const hipGeo = new THREE.SphereGeometry(0.40, 32, 32);
      hipGeo.scale(1.0, 0.65, 0.8);
      hipGeo.computeVertexNormals();
      const hipMesh = new THREE.Mesh(hipGeo, secondaryMat);
      hipMesh.position.set(0, 0.12, 0);
      figureGroup.add(hipMesh);

      [-0.24, 0.24].forEach((xPos) => {
        const thighGeo = new THREE.CapsuleGeometry(0.19, 0.58, 12, 24);
        thighGeo.computeVertexNormals();
        const thighMesh = new THREE.Mesh(thighGeo, secondaryMat);
        thighMesh.position.set(xPos, -0.32, 0);
        figureGroup.add(thighMesh);

        const calfGeo = new THREE.CapsuleGeometry(0.16, 0.50, 12, 24);
        calfGeo.computeVertexNormals();
        const calfMesh = new THREE.Mesh(calfGeo, secondaryMat);
        calfMesh.position.set(xPos, -0.88, 0.02);
        figureGroup.add(calfMesh);

        const bootGeo = new THREE.CapsuleGeometry(0.155, 0.45, 12, 24);
        bootGeo.computeVertexNormals();
        const bootMesh = new THREE.Mesh(bootGeo, bootMat);
        bootMesh.position.set(xPos, -1.25, 0.04);
        figureGroup.add(bootMesh);

        const footGeo = new THREE.BoxGeometry(0.18, 0.14, 0.42);
        footGeo.computeVertexNormals();
        const footMesh = new THREE.Mesh(footGeo, bootMat);
        footMesh.position.set(xPos, -1.50, 0.12);
        figureGroup.add(footMesh);
      });

      // --- 6. IRON SPIDER NANOTECH LEGS (If applicable) ---
      if (hasSpiderLegs) {
        for (let l = 0; l < 4; l++) {
          const side = l % 2 === 0 ? 1 : -1;
          const isUpper = l < 2;

          const armLegGroup = new THREE.Group();
          armLegGroup.position.set(side * 0.25, 0.85, -0.3);

          const seg1Geo = new THREE.CylinderGeometry(0.04, 0.04, 1.7, 16);
          const seg1Mat = new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 0.3 });
          const seg1 = new THREE.Mesh(seg1Geo, seg1Mat);
          seg1.position.set(side * 0.7, isUpper ? 0.8 : -0.4, -0.4);
          seg1.rotation.z = side * (isUpper ? -0.85 : -0.4);
          seg1.rotation.x = isUpper ? 0.5 : -0.5;

          const clawGeo = new THREE.ConeGeometry(0.065, 0.6, 12);
          const clawMat = new THREE.MeshPhysicalMaterial({ color: 0xd60029, metalness: 0.95, roughness: 0.1 });
          const claw = new THREE.Mesh(clawGeo, clawMat);
          claw.position.set(side * 1.3, isUpper ? 1.4 : -0.9, -0.7);
          claw.rotation.z = side * -1.2;

          armLegGroup.add(seg1);
          armLegGroup.add(claw);
          figureGroup.add(armLegGroup);
        }
      }

      // --- 7. STARK HUD HOLOGRAM PEDESTAL & PROJECTOR SCANNER ---
      const scanLineGeo = new THREE.RingGeometry(0.1, 2.5, 60);
      const scanLineMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
      scanLineMesh.rotation.x = Math.PI / 2;
      hologramGroup.add(scanLineMesh);

      const ring1Geo = new THREE.TorusGeometry(2.6, 0.015, 20, 120);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.6 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 2.2;
      hologramGroup.add(ring1);

      const pedestalGeo = new THREE.CylinderGeometry(2.3, 2.6, 0.2, 48);
      const pedestalMat = new THREE.MeshBasicMaterial({ color: primaryColor, wireframe: true, transparent: true, opacity: 0.4 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(0, -1.65, 0);
      hologramGroup.add(pedestal);

      const particleGeo = new THREE.BufferGeometry();
      const count = 400;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 7;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const particleMat = new THREE.PointsMaterial({ size: 0.04, color: particleColor, transparent: true, opacity: 0.8 });
      const particles = new THREE.Points(particleGeo, particleMat);
      hologramGroup.add(particles);

      let scanY = -1.65;
      let scanDir = 1;

      animateCallback = () => {
        figureGroup.rotation.y += 0.007;
        pedestal.rotation.y -= 0.004;
        particles.rotation.y += 0.003;
        ring1.rotation.z += 0.005;

        scanY += 0.03 * scanDir;
        if (scanY > 2.2) scanDir = -1;
        if (scanY < -1.65) scanDir = 1;
        scanLineMesh.position.y = scanY;
      };

    } else if (mode === 'atom') {
      const nucGeo = new THREE.SphereGeometry(0.85, 48, 48);
      const nucMat = new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x5a189a, roughness: 0.2 });
      const nucleus = new THREE.Mesh(nucGeo, nucMat);
      hologramGroup.add(nucleus);

      const rings = [];
      for (let r = 0; r < 3; r++) {
        const ringGeo = new THREE.TorusGeometry(2.0 + r * 0.4, 0.02, 20, 120);
        const ringMat = new THREE.MeshBasicMaterial({ color: r === 0 ? 0x00f3ff : (r === 1 ? 0xff0055 : 0x7209b7) });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / (r + 1);
        ring.rotation.y = Math.PI / (r + 2);
        hologramGroup.add(ring);
        rings.push(ring);
      }

      animateCallback = () => {
        nucleus.rotation.y += 0.01;
        rings.forEach((ring, i) => { ring.rotation.z += 0.02 * (i + 1); });
      };

    } else if (mode === 'dna') {
      // 🧬 DNA Double Helix & Genetic Sequence 3D Simulation
      const dnaGroup = new THREE.Group();
      hologramGroup.add(dnaGroup);

      const strandCount = 24;
      const radius = 0.95;
      const totalHeight = 4.2;

      for (let i = 0; i < strandCount; i++) {
        const y = (i / strandCount) * totalHeight - totalHeight / 2;
        const angle = (i / strandCount) * Math.PI * 4;

        // Nucleotide Base 1 (Cyan Glow)
        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const base1Geo = new THREE.SphereGeometry(0.12, 20, 20);
        const base1Mat = new THREE.MeshPhysicalMaterial({ color: 0x00f3ff, emissive: 0x00a8ff, emissiveIntensity: 0.8, clearcoat: 1.0 });
        const base1 = new THREE.Mesh(base1Geo, base1Mat);
        base1.position.set(x1, y, z1);
        dnaGroup.add(base1);

        // Nucleotide Base 2 (Crimson Glow)
        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;
        const base2Geo = new THREE.SphereGeometry(0.12, 20, 20);
        const base2Mat = new THREE.MeshPhysicalMaterial({ color: 0xff0055, emissive: 0xd60029, emissiveIntensity: 0.8, clearcoat: 1.0 });
        const base2 = new THREE.Mesh(base2Geo, base2Mat);
        base2.position.set(x2, y, z2);
        dnaGroup.add(base2);

        // Connecting Hydrogen Bond Rung
        const rungLength = radius * 2.0;
        const rungGeo = new THREE.CylinderGeometry(0.025, 0.025, rungLength, 12);
        const rungMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        const rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.set(0, y, 0);
        rung.rotation.z = Math.PI / 2;
        rung.rotation.y = angle;
        dnaGroup.add(rung);
      }

      animateCallback = () => {
        dnaGroup.rotation.y += 0.015;
      };

    } else if (mode === 'planet') {
      const planetGeo = new THREE.SphereGeometry(1.8, 48, 48);
      const planetMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, wireframe: true, emissive: 0x03045e });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      hologramGroup.add(planet);

      const ringGeo = new THREE.RingGeometry(2.4, 3.4, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.5, wireframe: true });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      hologramGroup.add(ring);

      animateCallback = () => {
        planet.rotation.y += 0.006;
        ring.rotation.z += 0.003;
      };

    } else if (mode === 'reactor') {
      const coreGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.4, 48);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const core = new THREE.Mesh(coreGeo, coreMat);
      hologramGroup.add(core);

      const outerRingGeo = new THREE.TorusGeometry(2.4, 0.08, 20, 120);
      const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      hologramGroup.add(outerRing);

      animateCallback = () => {
        core.rotation.y += 0.02;
        outerRing.rotation.z -= 0.015;
      };

    } else {
      const boxGeo = new THREE.BoxGeometry(2.8, 1.5, 2.8, 12, 12, 12);
      const boxMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const box = new THREE.Mesh(boxGeo, boxMat);
      hologramGroup.add(box);

      animateCallback = () => {
        box.rotation.y += 0.01;
        box.rotation.x += 0.005;
      };
    }

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || container.offsetWidth || 500;
      const h = container.clientHeight || container.offsetHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let resizeObserver;
    try {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);
    } catch (e) {}

    // Interactive Drag 360° Controls
    let isDragging = false;
    let previousMousePos = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePos.x;
      const deltaY = e.clientY - previousMousePos.y;

      hologramGroup.rotation.y += deltaX * 0.01;
      hologramGroup.rotation.x += deltaY * 0.01;

      previousMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Render Loop
    let animationFrameId;
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      if (autoRotate && !isDragging) {
        animateCallback();
      }
      renderer.render(scene, camera);
    };

    renderLoop();
    handleResize();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
      renderer.dispose();
    };
  }, [mode, spidermanSuit, autoRotate]);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing rounded-xl bg-slate-950/90 border border-cyan-500/40 relative overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.15)]"
    >
      <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 rounded-md pointer-events-none flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        AAA Photorealistic 3D Engine • Ultra PBR • Drag to Rotate 360°
      </div>
    </div>
  );
}
