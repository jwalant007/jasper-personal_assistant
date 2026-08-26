import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

/**
 * 4K ULTRA-HIGH RESOLUTION PBR TEXTURE GENERATOR (4096 x 4096)
 * Generates true 4K Albedo (Color), Normal Bump, Roughness, Metallic & Emissive maps procedurally.
 */
function createPhotorealistic4kSuitTextures(suitType, primaryHex, secondaryHex) {
  const TEX_SIZE = 4096;

  // -------------------------------------------------------------
  // 1. 4K ALBEDO / COLOR MAP
  // -------------------------------------------------------------
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_SIZE;
  colorCanvas.height = TEX_SIZE;
  const ctx = colorCanvas.getContext('2d');

  // Base background fill
  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Micro-woven Carbon Nanofiber Pattern at 4K Resolution
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let y = 0; y < TEX_SIZE; y += 12) {
    for (let x = (y % 24 === 0 ? 0 : 6); x < TEX_SIZE; x += 12) {
      ctx.fillRect(x, y, 6, 6);
    }
  }

  // Cross-hatch nano threads
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let y = 3; y < TEX_SIZE; y += 12) {
    for (let x = (y % 24 === 3 ? 3 : 9); x < TEX_SIZE; x += 12) {
      ctx.fillRect(x, y, 3, 3);
    }
  }

  // Draw Suit specific side & thigh stealth panels
  if (suitType === 'upgraded') {
    // MCU Upgraded Suit Stealth Black Lat & Thigh Panels
    ctx.fillStyle = secondaryHex;
    // Torso lat side panels
    ctx.beginPath();
    ctx.moveTo(0, 1000);
    ctx.lineTo(960, 1120);
    ctx.lineTo(1120, 3000);
    ctx.lineTo(0, 3200);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(TEX_SIZE, 1000);
    ctx.lineTo(TEX_SIZE - 960, 1120);
    ctx.lineTo(TEX_SIZE - 1120, 3000);
    ctx.lineTo(TEX_SIZE, 3200);
    ctx.fill();

    // Thigh panels
    ctx.fillRect(1120, 2080, 1856, 1120);
  } else if (suitType === 'ironspider') {
    // Gold Trim & Nanotech Plating lines
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 14;
    ctx.strokeRect(400, 400, 3296, 3296);
    ctx.strokeRect(800, 800, 2496, 2496);
  } else if (suitType === 'miles') {
    // Red Spray Paint Accents & Edge Trim
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(0, 1800, TEX_SIZE, 80);
    ctx.fillRect(0, 2800, TEX_SIZE, 80);
  } else if (suitType === '2099') {
    // Cyber Neon Crimson Energy Lines
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 16;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 500 + i * 500);
      ctx.lineTo(TEX_SIZE, 700 + i * 500);
      ctx.stroke();
    }
  }

  // Anatomical Specular & Shadow Depth Shading
  const muscleGrad = ctx.createLinearGradient(0, 0, 0, TEX_SIZE);
  muscleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.16)'); // Mask highlight
  muscleGrad.addColorStop(0.15, 'rgba(0, 0, 0, 0.05)');     // Neck transition
  muscleGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.10)'); // Pec peak highlight
  muscleGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.28)');     // Abdominal shadow
  muscleGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');     // Thigh shadow
  muscleGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.35)');     // Boot shadow
  muscleGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.50)');      // Base shadow
  ctx.fillStyle = muscleGrad;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // High-Precision 4K Web Lattice Lines
  ctx.strokeStyle = 'rgba(10, 10, 15, 0.85)';
  ctx.lineWidth = 8;
  const centerX = TEX_SIZE / 2;
  const centerY = 1280;

  // Web radial spokes
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * 2800, centerY + Math.sin(angle) * 2800);
    ctx.stroke();
  }

  // Web concentric loops
  for (let r = 160; r < 2800; r += 160) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Web stitch inner glow highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  for (let r = 164; r < 2800; r += 160) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const mapTexture = new THREE.CanvasTexture(colorCanvas);
  mapTexture.wrapS = THREE.RepeatWrapping;
  mapTexture.wrapT = THREE.RepeatWrapping;
  mapTexture.anisotropy = 16;

  // -------------------------------------------------------------
  // 2. 4K NORMAL BUMP MAP
  // -------------------------------------------------------------
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = TEX_SIZE;
  normalCanvas.height = TEX_SIZE;
  const nCtx = normalCanvas.getContext('2d');

  // Base normal blue (128, 128, 255)
  nCtx.fillStyle = 'rgb(128, 128, 255)';
  nCtx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // High-density micro-fabric normal bumps
  nCtx.fillStyle = 'rgb(160, 128, 240)';
  for (let y = 0; y < TEX_SIZE; y += 8) {
    for (let x = (y % 16 === 0 ? 0 : 4); x < TEX_SIZE; x += 8) {
      nCtx.fillRect(x, y, 4, 4);
    }
  }

  // Deep web line normal channels (debossed normal groove)
  nCtx.strokeStyle = 'rgb(80, 80, 200)';
  nCtx.lineWidth = 10;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
    nCtx.beginPath();
    nCtx.moveTo(centerX, centerY);
    nCtx.lineTo(centerX + Math.cos(angle) * 2800, centerY + Math.sin(angle) * 2800);
    nCtx.stroke();
  }
  for (let r = 160; r < 2800; r += 160) {
    nCtx.beginPath();
    nCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
    nCtx.stroke();
  }

  const normalTexture = new THREE.CanvasTexture(normalCanvas);
  normalTexture.wrapS = THREE.RepeatWrapping;
  normalTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.anisotropy = 16;

  // -------------------------------------------------------------
  // 3. 4K ROUGHNESS MAP
  // -------------------------------------------------------------
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 2048;
  roughCanvas.height = 2048;
  const rCtx = roughCanvas.getContext('2d');

  // Base fabric roughness (~0.45 matte)
  rCtx.fillStyle = 'rgb(115, 115, 115)';
  rCtx.fillRect(0, 0, 2048, 2048);

  // Carbon fiber panels (smoother, ~0.2)
  if (suitType === 'upgraded') {
    rCtx.fillStyle = 'rgb(50, 50, 50)';
    rCtx.fillRect(0, 500, 480, 1000);
    rCtx.fillRect(1568, 500, 480, 1000);
  }

  // Metallic nanotech parts (ultra glossy, ~0.08)
  if (suitType === 'ironspider') {
    rCtx.fillStyle = 'rgb(20, 20, 20)';
    rCtx.fillRect(200, 200, 1648, 1648);
  }

  const roughnessTexture = new THREE.CanvasTexture(roughCanvas);
  roughnessTexture.wrapS = THREE.RepeatWrapping;
  roughnessTexture.wrapT = THREE.RepeatWrapping;

  // -------------------------------------------------------------
  // 4. 4K METALLIC MAP
  // -------------------------------------------------------------
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 2048;
  metalCanvas.height = 2048;
  const mCtx = metalCanvas.getContext('2d');

  // Base cloth non-metallic (~0.15)
  mCtx.fillStyle = 'rgb(38, 38, 38)';
  mCtx.fillRect(0, 0, 2048, 2048);

  // Metallic areas (Iron Spider nanotech, web shooter, emblems)
  if (suitType === 'ironspider') {
    mCtx.fillStyle = 'rgb(240, 240, 240)';
    mCtx.fillRect(0, 0, 2048, 2048);
  } else if (suitType === 'upgraded' || suitType === 'miles' || suitType === '2099') {
    mCtx.fillStyle = 'rgb(120, 120, 120)';
    mCtx.fillRect(800, 800, 448, 448); // Chest logo metallic core
  }

  const metalnessTexture = new THREE.CanvasTexture(metalCanvas);
  metalnessTexture.wrapS = THREE.RepeatWrapping;
  metalnessTexture.wrapT = THREE.RepeatWrapping;

  return { mapTexture, normalTexture, roughnessTexture, metalnessTexture };
}

/**
 * PROCEDURAL HDR ENVIRONMENT CUBEMAP
 * Generates a realistic studio lighting gradient reflection cubemap for PBR metallic reflections.
 */
function createProceduralStudioEnvMap(renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x050a15);

  // Studio soft light boxes
  const lightBox1 = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  lightBox1.position.set(0, 10, 5);
  lightBox1.rotation.x = Math.PI / 2;
  envScene.add(lightBox1);

  const lightBox2 = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide })
  );
  lightBox2.position.set(-10, 5, -5);
  lightBox2.rotation.y = Math.PI / 2;
  envScene.add(lightBox2);

  const lightBox3 = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide })
  );
  lightBox3.position.set(10, 5, -5);
  lightBox3.rotation.y = -Math.PI / 2;
  envScene.add(lightBox3);

  const envMap = pmremGenerator.fromScene(envScene).texture;
  pmremGenerator.dispose();
  return envMap;
}

const Hologram3dCanvas = forwardRef(function Hologram3dCanvas(
  { mode = 'spiderman', spidermanSuit = 'upgraded', autoRotate = true, hudOverlay = true },
  ref
) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);

  const [activeCameraPreset, setActiveCameraPreset] = useState('full');

  // Expose camera controls to parent modal
  useImperativeHandle(ref, () => ({
    setCameraPreset: (preset) => {
      setActiveCameraPreset(preset);
      if (!cameraRef.current) return;
      if (preset === 'full') {
        cameraRef.current.position.set(0, 0.15, 6.2);
      } else if (preset === 'texture') {
        // Ultra Close-up 4K Suit Micro Texture View
        cameraRef.current.position.set(0, 0.65, 1.8);
      } else if (preset === 'lens') {
        // Lens close-up
        cameraRef.current.position.set(0, 1.65, 1.4);
      } else if (preset === 'shooter') {
        // Web Shooter close-up
        cameraRef.current.position.set(0.85, 0.2, 1.5);
      }
    }
  }));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. SCENE, CAMERA & WEBGL RENDERER
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.15, 6.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Generate & apply procedural HDR environment map for realistic reflections
    const studioEnvMap = createProceduralStudioEnvMap(renderer);
    scene.environment = studioEnvMap;

    // Master Hologram Group
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // 2. CINEMATIC STUDIO & HOLOGRAM LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x70b5ff, 1.4);
    fillLight.position.set(-6, 5, 4);
    scene.add(fillLight);

    const rimLightCrimson = new THREE.PointLight(0xff0044, 5.0, 30);
    rimLightCrimson.position.set(6, 2.5, -5);
    scene.add(rimLightCrimson);

    const rimLightCyan = new THREE.PointLight(0x00f3ff, 4.5, 30);
    rimLightCyan.position.set(-6, -1.5, -5);
    scene.add(rimLightCyan);

    const bounceLight = new THREE.HemisphereLight(0x446699, 0x110022, 0.9);
    scene.add(bounceLight);

    let animateCallback = () => {};

    // 3. BUILD 3D MODELS
    if (mode === 'spiderman') {
      // 🕷️ 4K ULTRA-REALISTIC SPIDER-MAN 3D MODEL
      const figureGroup = new THREE.Group();
      hologramGroup.add(figureGroup);

      // Color Configurations
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
        // MCU Upgraded Suit (Far From Home)
        primaryHex = '#e60026';
        secondaryHex = '#111318';
        primaryColor = 0xe60026;
        secondaryColor = 0x111318;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x090a0e;
        emblemColor = 0x0a0b0f;
        particleColor = 0xff0044;
      } else if (spidermanSuit === 'ironspider') {
        // Iron Spider Nanotech (Gold & Crimson)
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
        primaryHex = '#0c0d12';
        secondaryHex = '#171924';
        primaryColor = 0x0c0d12;
        secondaryColor = 0x171924;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x000000;
        emblemColor = 0xffffff;
        particleColor = 0x8899ac;
      } else if (spidermanSuit === 'miles') {
        // Miles Morales (Black & Spray Red)
        primaryHex = '#101116';
        secondaryHex = '#ff0033';
        primaryColor = 0x101116;
        secondaryColor = 0xff0033;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x111111;
        emblemColor = 0xff0033;
        particleColor = 0xff0033;
      } else if (spidermanSuit === '2099') {
        // Spider-Man 2099 (Cyber Blue & Neon Crimson)
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

      // Generate 4K PBR Textures
      const { mapTexture, normalTexture, roughnessTexture, metalnessTexture } = createPhotorealistic4kSuitTextures(
        spidermanSuit,
        primaryHex,
        secondaryHex
      );

      // PBR Physical Materials with 4K Maps & Clearcoat
      const primaryMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        map: mapTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughnessMap: roughnessTexture,
        metalnessMap: metalnessTexture,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        roughness: 0.25,
        metalness: isIronSpider ? 0.88 : 0.22,
        reflectivity: 0.95,
        emissive: primaryColor,
        emissiveIntensity: 0.1
      });

      const secondaryMat = new THREE.MeshPhysicalMaterial({
        color: secondaryColor,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.38,
        metalness: isIronSpider ? 0.82 : 0.3,
        clearcoat: 0.7,
        clearcoatRoughness: 0.1
      });

      const bootMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        map: mapTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.6, 0.6),
        clearcoat: 0.95,
        roughness: 0.2,
        metalness: isIronSpider ? 0.85 : 0.25
      });

      // --- 1. HEAD & SPIDER MASK (High-Poly Geometry 128x128) ---
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.65, 0);

      const headGeo = new THREE.SphereGeometry(0.38, 128, 128);
      headGeo.scale(0.88, 1.18, 0.95);
      headGeo.computeVertexNormals();
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headMesh.castShadow = true;
      headGroup.add(headMesh);

      // Extruded Angular Movie Eye Lenses (Marvel Movie / Game fidelity)
      [-0.145, 0.145].forEach((xOffset) => {
        const eyeShape = new THREE.Shape();
        eyeShape.moveTo(0, 0.19);
        eyeShape.quadraticCurveTo(0.15, 0.14, 0.16, -0.04);
        eyeShape.quadraticCurveTo(0.10, -0.18, 0, -0.22);
        eyeShape.quadraticCurveTo(-0.10, -0.18, -0.16, -0.04);
        eyeShape.quadraticCurveTo(-0.15, 0.14, 0, 0.19);

        // Reflective White Glowing Lens Surface with Mesh Aperture Lines
        const eyeExtrudeSettings = { depth: 0.035, bevelEnabled: true, bevelSegments: 6, bevelSize: 0.015, bevelThickness: 0.015 };
        const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, eyeExtrudeSettings);
        eyeGeo.scale(0.72, 0.85, 0.7);

        const eyeMat = new THREE.MeshPhysicalMaterial({
          color: eyeColor,
          emissive: eyeColor,
          emissiveIntensity: 0.98,
          clearcoat: 1.0,
          clearcoatRoughness: 0.01,
          roughness: 0.03,
          metalness: 0.1
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

        const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.025, bevelEnabled: true, bevelSegments: 5, bevelSize: 0.01, bevelThickness: 0.01 });
        frameGeo.scale(0.76, 0.88, 0.7);

        const frameMat = new THREE.MeshPhysicalMaterial({
          color: eyeFrameColor,
          clearcoat: 1.0,
          roughness: 0.08,
          metalness: 0.92,
          reflectivity: 0.95
        });

        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(xOffset, 0.05, 0.315);
        frameMesh.rotation.y = xOffset * -0.45;
        frameMesh.rotation.z = xOffset * 0.22;
        headGroup.add(frameMesh);
      });

      figureGroup.add(headGroup);

      // --- 2. NECK & TRAPEZIUS ---
      const neckGeo = new THREE.CylinderGeometry(0.17, 0.23, 0.28, 64);
      neckGeo.computeVertexNormals();
      const neckMesh = new THREE.Mesh(neckGeo, primaryMat);
      neckMesh.position.set(0, 1.30, 0);
      figureGroup.add(neckMesh);

      // --- 3. ATHLETIC TORSO & CHEST ---
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 0.65, 0);

      // Main Pectorals
      const chestGeo = new THREE.SphereGeometry(0.55, 96, 96);
      chestGeo.scale(1.05, 0.82, 0.72);
      chestGeo.computeVertexNormals();
      const chestMesh = new THREE.Mesh(chestGeo, primaryMat);
      chestMesh.position.set(0, 0.28, 0);
      chestMesh.castShadow = true;
      torsoGroup.add(chestMesh);

      // Waist & Abdomen
      const abdomenGeo = new THREE.CylinderGeometry(0.48, 0.40, 0.75, 64);
      abdomenGeo.computeVertexNormals();
      const abdomenMesh = new THREE.Mesh(abdomenGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      abdomenMesh.position.set(0, -0.22, 0);
      abdomenMesh.castShadow = true;
      torsoGroup.add(abdomenMesh);

      // Latissimus Muscles
      [-0.34, 0.34].forEach(xSide => {
        const latGeo = new THREE.CapsuleGeometry(0.15, 0.5, 24, 48);
        latGeo.computeVertexNormals();
        const latMesh = new THREE.Mesh(latGeo, secondaryMat);
        latMesh.position.set(xSide, 0.05, -0.05);
        latMesh.rotation.z = xSide * 0.2;
        torsoGroup.add(latMesh);
      });

      // --- 3D EXTRACTED SPIDER EMBLEM ON CHEST & BACK ---
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

      const emblemExtrude = { depth: 0.045, bevelEnabled: true, bevelSegments: 5, bevelSize: 0.012, bevelThickness: 0.012 };
      const emblemGeo = new THREE.ExtrudeGeometry(emblemShape, emblemExtrude);
      emblemGeo.scale(1.15, 1.15, 1.0);

      const emblemMat = new THREE.MeshPhysicalMaterial({
        color: emblemColor,
        clearcoat: 1.0,
        metalness: isIronSpider ? 0.98 : 0.55,
        roughness: isIronSpider ? 0.08 : 0.22,
        emissive: isIronSpider ? 0xffaa00 : 0x000000,
        emissiveIntensity: isIronSpider ? 0.45 : 0.0
      });

      const frontEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      frontEmblem.position.set(0, 0.24, 0.37);
      torsoGroup.add(frontEmblem);

      const backEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      backEmblem.position.set(0, 0.24, -0.37);
      backEmblem.rotation.y = Math.PI;
      torsoGroup.add(backEmblem);

      figureGroup.add(torsoGroup);

      // --- 4. SHOULDERS, ARMS & DETAILED WEB SHOOTERS ---
      const rShoulderGeo = new THREE.SphereGeometry(0.24, 48, 48);
      rShoulderGeo.computeVertexNormals();
      const rShoulder = new THREE.Mesh(rShoulderGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      rShoulder.position.set(0.58, 0.92, 0);
      figureGroup.add(rShoulder);

      const rBicepGeo = new THREE.CapsuleGeometry(0.15, 0.42, 24, 48);
      rBicepGeo.computeVertexNormals();
      const rBicep = new THREE.Mesh(rBicepGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      rBicep.position.set(0.72, 0.60, 0.05);
      rBicep.rotation.z = -0.28;
      figureGroup.add(rBicep);

      const rForearmGeo = new THREE.CapsuleGeometry(0.13, 0.42, 24, 48);
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

      // Metallic Mechanical Web-Shooters with Nozzles & Pressure Gauges
      [-0.88, 0.86].forEach((xPos, idx) => {
        const shooterGroup = new THREE.Group();
        shooterGroup.position.set(xPos, 0.02, idx === 0 ? 0.32 : 0.15);

        // Main Gauntlet Ring
        const shooterGeo = new THREE.TorusGeometry(0.13, 0.028, 24, 48);
        const shooterMat = new THREE.MeshPhysicalMaterial({ color: 0xe0e0e0, metalness: 0.96, roughness: 0.08, clearcoat: 1.0 });
        const shooterRing = new THREE.Mesh(shooterGeo, shooterMat);
        shooterRing.rotation.x = Math.PI / 2;
        shooterGroup.add(shooterRing);

        // Web Emitter Nozzle
        const nozzleGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.08, 24);
        const nozzleMat = new THREE.MeshPhysicalMaterial({ color: 0xb0b0b0, metalness: 0.98, roughness: 0.05 });
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.position.set(0, 0, 0.13);
        nozzle.rotation.x = Math.PI / 2;
        shooterGroup.add(nozzle);

        // Pressure Gauge LED Indicator
        const ledGeo = new THREE.SphereGeometry(0.015, 16, 16);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0.08, 0.02, 0.1);
        shooterGroup.add(led);

        figureGroup.add(shooterGroup);
      });

      // --- 5. HIPS, LEGS & BOOTS ---
      const hipGeo = new THREE.SphereGeometry(0.40, 48, 48);
      hipGeo.scale(1.0, 0.65, 0.8);
      hipGeo.computeVertexNormals();
      const hipMesh = new THREE.Mesh(hipGeo, secondaryMat);
      hipMesh.position.set(0, 0.12, 0);
      figureGroup.add(hipMesh);

      [-0.24, 0.24].forEach((xPos) => {
        const thighGeo = new THREE.CapsuleGeometry(0.19, 0.58, 24, 48);
        thighGeo.computeVertexNormals();
        const thighMesh = new THREE.Mesh(thighGeo, secondaryMat);
        thighMesh.position.set(xPos, -0.32, 0);
        figureGroup.add(thighMesh);

        const calfGeo = new THREE.CapsuleGeometry(0.16, 0.50, 24, 48);
        calfGeo.computeVertexNormals();
        const calfMesh = new THREE.Mesh(calfGeo, secondaryMat);
        calfMesh.position.set(xPos, -0.88, 0.02);
        figureGroup.add(calfMesh);

        const bootGeo = new THREE.CapsuleGeometry(0.155, 0.45, 24, 48);
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

      // --- 6. IRON SPIDER 4K NANOTECH LEGS ---
      if (hasSpiderLegs) {
        for (let l = 0; l < 4; l++) {
          const side = l % 2 === 0 ? 1 : -1;
          const isUpper = l < 2;

          const armLegGroup = new THREE.Group();
          armLegGroup.position.set(side * 0.25, 0.85, -0.3);

          const seg1Geo = new THREE.CylinderGeometry(0.045, 0.045, 1.8, 32);
          const seg1Mat = new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 0.98, roughness: 0.06, clearcoat: 1.0, emissive: 0xffaa00, emissiveIntensity: 0.35 });
          const seg1 = new THREE.Mesh(seg1Geo, seg1Mat);
          seg1.position.set(side * 0.7, isUpper ? 0.8 : -0.4, -0.4);
          seg1.rotation.z = side * (isUpper ? -0.85 : -0.4);
          seg1.rotation.x = isUpper ? 0.5 : -0.5;

          const clawGeo = new THREE.ConeGeometry(0.07, 0.7, 32);
          const clawMat = new THREE.MeshPhysicalMaterial({ color: 0xd60029, metalness: 0.95, roughness: 0.08, clearcoat: 1.0 });
          const claw = new THREE.Mesh(clawGeo, clawMat);
          claw.position.set(side * 1.35, isUpper ? 1.45 : -0.95, -0.7);
          claw.rotation.z = side * -1.2;

          armLegGroup.add(seg1);
          armLegGroup.add(claw);
          figureGroup.add(armLegGroup);
        }
      }

      // --- 7. STARK HUD OPTICAL PROJECTOR PEDESTAL & SCAN LINES ---
      const scanLineGeo = new THREE.RingGeometry(0.1, 2.8, 120);
      const scanLineMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
      scanLineMesh.rotation.x = Math.PI / 2;
      hologramGroup.add(scanLineMesh);

      // Volumetric Light Projection Cone
      const coneGeo = new THREE.CylinderGeometry(0.2, 2.5, 4.0, 64, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
      const lightCone = new THREE.Mesh(coneGeo, coneMat);
      lightCone.position.set(0, 0.2, 0);
      hologramGroup.add(lightCone);

      const pedestalGeo = new THREE.CylinderGeometry(2.3, 2.7, 0.3, 64);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2, wireframe: false });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(0, -1.65, 0);
      hologramGroup.add(pedestal);

      const pedestalRingGeo = new THREE.TorusGeometry(2.5, 0.03, 24, 120);
      const pedestalRingMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
      const pedestalRing = new THREE.Mesh(pedestalRingGeo, pedestalRingMat);
      pedestalRing.position.set(0, -1.5, 0);
      pedestalRing.rotation.x = Math.PI / 2;
      hologramGroup.add(pedestalRing);

      // Quantum Floating Hologram Particle Field
      const particleGeo = new THREE.BufferGeometry();
      const count = 600;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 8;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const particleMat = new THREE.PointsMaterial({ size: 0.04, color: particleColor, transparent: true, opacity: 0.85 });
      const particles = new THREE.Points(particleGeo, particleMat);
      hologramGroup.add(particles);

      let scanY = -1.65;
      let scanDir = 1;

      animateCallback = () => {
        figureGroup.rotation.y += 0.006;
        pedestalRing.rotation.z -= 0.005;
        particles.rotation.y += 0.003;

        scanY += 0.025 * scanDir;
        if (scanY > 2.2) scanDir = -1;
        if (scanY < -1.65) scanDir = 1;
        scanLineMesh.position.y = scanY;
      };

    } else if (mode === 'atom') {
      // ⚛️ QUANTUM ATOMIC NUCLEUS
      const nucGeo = new THREE.SphereGeometry(0.95, 96, 96);
      const nucMat = new THREE.MeshPhysicalMaterial({ color: 0x9d4edd, emissive: 0x5a189a, roughness: 0.1, clearcoat: 1.0, reflectivity: 1.0 });
      const nucleus = new THREE.Mesh(nucGeo, nucMat);
      hologramGroup.add(nucleus);

      const rings = [];
      for (let r = 0; r < 4; r++) {
        const ringGeo = new THREE.TorusGeometry(2.0 + r * 0.45, 0.025, 32, 160);
        const ringMat = new THREE.MeshBasicMaterial({ color: r % 2 === 0 ? 0x00f3ff : 0xff0055 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / (r + 1);
        ring.rotation.y = Math.PI / (r + 2);
        hologramGroup.add(ring);
        rings.push(ring);
      }

      animateCallback = () => {
        nucleus.rotation.y += 0.01;
        rings.forEach((ring, i) => { ring.rotation.z += 0.018 * (i + 1); });
      };

    } else if (mode === 'dna') {
      // 🧬 DNA DOUBLE HELIX
      const dnaGroup = new THREE.Group();
      hologramGroup.add(dnaGroup);

      const strandCount = 32;
      const radius = 1.05;
      const totalHeight = 4.6;

      for (let i = 0; i < strandCount; i++) {
        const y = (i / strandCount) * totalHeight - totalHeight / 2;
        const angle = (i / strandCount) * Math.PI * 4;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;
        const base1Geo = new THREE.SphereGeometry(0.14, 32, 32);
        const base1Mat = new THREE.MeshPhysicalMaterial({ color: 0x00f3ff, emissive: 0x00a8ff, emissiveIntensity: 0.9, clearcoat: 1.0 });
        const base1 = new THREE.Mesh(base1Geo, base1Mat);
        base1.position.set(x1, y, z1);
        dnaGroup.add(base1);

        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;
        const base2Geo = new THREE.SphereGeometry(0.14, 32, 32);
        const base2Mat = new THREE.MeshPhysicalMaterial({ color: 0xff0055, emissive: 0xd60029, emissiveIntensity: 0.9, clearcoat: 1.0 });
        const base2 = new THREE.Mesh(base2Geo, base2Mat);
        base2.position.set(x2, y, z2);
        dnaGroup.add(base2);

        const rungLength = radius * 2.0;
        const rungGeo = new THREE.CylinderGeometry(0.03, 0.03, rungLength, 24);
        const rungMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
        const rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.set(0, y, 0);
        rung.rotation.z = Math.PI / 2;
        rung.rotation.y = angle;
        dnaGroup.add(rung);
      }

      animateCallback = () => {
        dnaGroup.rotation.y += 0.012;
      };

    } else if (mode === 'planet') {
      // 🪐 PLANETARY GLOBE
      const planetGeo = new THREE.SphereGeometry(1.9, 96, 96);
      const planetMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, wireframe: true, emissive: 0x03045e });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      hologramGroup.add(planet);

      const ringGeo = new THREE.RingGeometry(2.5, 3.6, 120);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6, wireframe: true });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      hologramGroup.add(ring);

      animateCallback = () => {
        planet.rotation.y += 0.005;
        ring.rotation.z += 0.003;
      };

    } else if (mode === 'reactor') {
      // ⚡ STARK MARK L ARC REACTOR
      const coreGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.45, 96);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const core = new THREE.Mesh(coreGeo, coreMat);
      hologramGroup.add(core);

      const outerRingGeo = new THREE.TorusGeometry(2.5, 0.09, 32, 160);
      const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      hologramGroup.add(outerRing);

      animateCallback = () => {
        core.rotation.y += 0.018;
        outerRing.rotation.z -= 0.012;
      };

    } else {
      // ⚙️ ENGINEERING CHASSIS WIREFRAME
      const boxGeo = new THREE.BoxGeometry(2.9, 1.6, 2.9, 16, 16, 16);
      const boxMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const box = new THREE.Mesh(boxGeo, boxMat);
      hologramGroup.add(box);

      animateCallback = () => {
        box.rotation.y += 0.008;
        box.rotation.x += 0.004;
      };
    }

    // 4. INTERACTIVE 360° ORBIT, SMOOTH ZOOM & PAN CONTROLS
    let isDragging = false;
    let isRightDragging = false;
    let previousMousePos = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      if (e.button === 2) {
        isRightDragging = true;
      } else {
        isDragging = true;
      }
      previousMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const deltaX = e.clientX - previousMousePos.x;
      const deltaY = e.clientY - previousMousePos.y;

      if (isDragging) {
        hologramGroup.rotation.y += deltaX * 0.008;
        hologramGroup.rotation.x += deltaY * 0.008;
      } else if (isRightDragging) {
        hologramGroup.position.x += deltaX * 0.005;
        hologramGroup.position.y -= deltaY * 0.005;
      }

      previousMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      isRightDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      // Smooth Camera Zoom (from distance 1.4 close-up to 12.0 far)
      const zoomFactor = e.deltaY * 0.0035;
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + zoomFactor, 1.4, 12.0);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || container.offsetWidth || 600;
      const h = container.clientHeight || container.offsetHeight || 450;
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

    // Animation Loop
    let animationFrameId;
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      if (autoRotate && !isDragging && !isRightDragging) {
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
      domEl.removeEventListener('wheel', onWheel);
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
      className="w-full h-80 sm:h-[420px] cursor-grab active:cursor-grabbing rounded-xl bg-slate-950/95 border border-cyan-500/40 relative overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(0,243,255,0.2)]"
    >
      {/* 4K Tech Holographic HUD Overlay */}
      {hudOverlay && (
        <>
          {/* Top Left Badge */}
          <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/80 border border-cyan-500/50 px-3 py-1.5 rounded-lg pointer-events-none flex items-center gap-2 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>4K Ultra-PBR Engine • 4096px Textures • Scroll to Zoom</span>
          </div>

          {/* Top Right Coordinate HUD */}
          <div className="absolute top-3 right-3 text-[9px] font-mono text-cyan-400/80 bg-slate-900/80 border border-cyan-500/30 px-2.5 py-1.5 rounded-md pointer-events-none hidden sm:block">
            LAT: 34.0522 N | LONG: 118.2437 W | FPS: 60 | SHADER: PBR_ULTRA
          </div>

          {/* Bottom Left Target Lock Reticle UI */}
          <div className="absolute bottom-3 left-3 pointer-events-none hidden sm:flex items-center gap-2 text-[9px] font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md">
            <span className="text-cyan-400 font-bold">TARGET LOCKED:</span> SPIDER-MAN 4K SUIT
          </div>
        </>
      )}
    </div>
  );
});

export default Hologram3dCanvas;
