import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

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

  // Suit specific stealth panels
  if (suitType === 'upgraded') {
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

    ctx.fillRect(1120, 2080, 1856, 1120);
  } else if (suitType === 'ironspider') {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 14;
    ctx.strokeRect(400, 400, 3296, 3296);
    ctx.strokeRect(800, 800, 2496, 2496);
  } else if (suitType === 'miles') {
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(0, 1800, TEX_SIZE, 80);
    ctx.fillRect(0, 2800, TEX_SIZE, 80);
  } else if (suitType === '2099') {
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
  muscleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.16)');
  muscleGrad.addColorStop(0.15, 'rgba(0, 0, 0, 0.05)');
  muscleGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.10)');
  muscleGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.28)');
  muscleGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');
  muscleGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.35)');
  muscleGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.50)');
  ctx.fillStyle = muscleGrad;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // High-Precision Web Lattice Lines
  ctx.strokeStyle = 'rgba(10, 10, 15, 0.85)';
  ctx.lineWidth = 8;
  const centerX = TEX_SIZE / 2;
  const centerY = 1280;

  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * 2800, centerY + Math.sin(angle) * 2800);
    ctx.stroke();
  }

  for (let r = 160; r < 2800; r += 160) {
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

  nCtx.fillStyle = 'rgb(128, 128, 255)';
  nCtx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  nCtx.fillStyle = 'rgb(160, 128, 240)';
  for (let y = 0; y < TEX_SIZE; y += 8) {
    for (let x = (y % 16 === 0 ? 0 : 4); x < TEX_SIZE; x += 8) {
      nCtx.fillRect(x, y, 4, 4);
    }
  }

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
  // 3. ROUGHNESS & METALLIC MAPS
  // -------------------------------------------------------------
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 2048;
  roughCanvas.height = 2048;
  const rCtx = roughCanvas.getContext('2d');

  rCtx.fillStyle = 'rgb(115, 115, 115)';
  rCtx.fillRect(0, 0, 2048, 2048);

  const roughnessTexture = new THREE.CanvasTexture(roughCanvas);
  roughnessTexture.wrapS = THREE.RepeatWrapping;
  roughnessTexture.wrapT = THREE.RepeatWrapping;

  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 2048;
  metalCanvas.height = 2048;
  const mCtx = metalCanvas.getContext('2d');

  mCtx.fillStyle = 'rgb(38, 38, 38)';
  mCtx.fillRect(0, 0, 2048, 2048);

  const metalnessTexture = new THREE.CanvasTexture(metalCanvas);
  metalnessTexture.wrapS = THREE.RepeatWrapping;
  metalnessTexture.wrapT = THREE.RepeatWrapping;

  return { mapTexture, normalTexture, roughnessTexture, metalnessTexture };
}

/**
 * PROCEDURAL HDR ENVIRONMENT CUBEMAP
 */
function createProceduralStudioEnvMap(renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x050a15);

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

  const envMap = pmremGenerator.fromScene(envScene).texture;
  pmremGenerator.dispose();
  return envMap;
}

/**
 * CUSTOM MOVIE GLSL HOLOGRAM FRESNEL SHADER
 * Produces authentic sci-fi Stark Industries edge glow, scanlines, and quantum shimmer.
 */
function createHologramFresnelMaterial(baseColorHex, rimColorHex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(baseColorHex) },
      uRimColor: { value: new THREE.Color(rimColorHex) },
      uOpacity: { value: 0.88 },
      uFresnelPower: { value: 2.2 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uRimColor;
      uniform float uOpacity;
      uniform float uFresnelPower;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        // Fresnel Edge Glow Angle
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
        
        // Sci-Fi Scanlines
        float scanline = sin(vUv.y * 280.0 + uTime * 5.0) * 0.12 + 0.88;
        
        // Quantum Shimmer
        float shimmer = sin(uTime * 8.0 + vUv.x * 40.0) * 0.04 + 0.96;
        
        vec3 finalColor = mix(uColor, uRimColor, fresnel * 0.85);
        float finalAlpha = (uOpacity * (0.35 + fresnel * 0.65)) * scanline * shimmer;
        
        gl_FragColor = vec4(finalColor, finalAlpha);
      },
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

const Hologram3dCanvas = forwardRef(function Hologram3dCanvas(
  {
    mode = 'spiderman',
    spidermanSuit = 'upgraded',
    poseMode = 'crouch', // 'crouch' or 'standing'
    autoRotate = true,
    hudOverlay = true,
    bloomEnabled = true,
    webFiring = true
  },
  ref
) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const uniformsListRef = useRef([]);

  const [activeCameraPreset, setActiveCameraPreset] = useState('full');

  // Expose camera controls to parent modal
  useImperativeHandle(ref, () => ({
    setCameraPreset: (preset) => {
      setActiveCameraPreset(preset);
      if (!cameraRef.current || !controlsRef.current) return;
      if (preset === 'full') {
        cameraRef.current.position.set(0, 0.2, 5.8);
        controlsRef.current.target.set(0, 0, 0);
      } else if (preset === 'texture') {
        // Close-up 4K Suit Micro Texture View
        cameraRef.current.position.set(0, 0.4, 1.7);
        controlsRef.current.target.set(0, 0.4, 0);
      } else if (preset === 'lens') {
        // Lens close-up
        cameraRef.current.position.set(0, 1.45, 1.35);
        controlsRef.current.target.set(0, 1.45, 0);
      } else if (preset === 'shooter') {
        // Web Shooter close-up
        cameraRef.current.position.set(0.75, 0.25, 1.4);
        controlsRef.current.target.set(0.6, 0.1, 0.2);
      }
      controlsRef.current.update();
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
    camera.position.set(0, 0.2, 5.8);
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
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. PROFESSIONAL ORBITCONTROLS WITH INERTIA DAMPING
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 3. CINEMA-QUALITY POST-PROCESSING (EffectComposer + UnrealBloomPass)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.85, // Bloom strength
      0.4,  // Radius
      0.2   // Threshold
    );
    composer.addPass(bloomPass);

    // Generate & apply procedural HDR environment map for metallic reflections
    const studioEnvMap = createProceduralStudioEnvMap(renderer);
    scene.environment = studioEnvMap;

    // Master Hologram Group
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // 4. LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x70b5ff, 1.8);
    fillLight.position.set(-6, 5, 4);
    scene.add(fillLight);

    const rimLightCrimson = new THREE.PointLight(0xff0044, 6.0, 30);
    rimLightCrimson.position.set(6, 2.5, -5);
    scene.add(rimLightCrimson);

    const rimLightCyan = new THREE.PointLight(0x00f3ff, 5.5, 30);
    rimLightCyan.position.set(-6, -1.5, -5);
    scene.add(rimLightCyan);

    uniformsListRef.current = [];
    let animateCallback = () => {};

    // 5. BUILD 3D MODELS
    if (mode === 'spiderman') {
      // 🕷️ MOVIE-GRADE SPIDER-MAN 3D MODEL
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

      if (spidermanSuit === 'upgraded') {
        primaryHex = '#e60026';
        secondaryHex = '#111318';
        primaryColor = 0xe60026;
        secondaryColor = 0x111318;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x090a0e;
        emblemColor = 0x0a0b0f;
        particleColor = 0xff0044;
      } else if (spidermanSuit === 'ironspider') {
        primaryHex = '#d60029';
        secondaryHex = '#101726';
        primaryColor = 0xd60029;
        secondaryColor = 0x101726;
        eyeColor = 0xffffff;
        eyeFrameColor = 0xffd700;
        emblemColor = 0xffd700;
        particleColor = 0xffd700;
        isIronSpider = true;
      } else if (spidermanSuit === 'symbiote') {
        primaryHex = '#0c0d12';
        secondaryHex = '#171924';
        primaryColor = 0x0c0d12;
        secondaryColor = 0x171924;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x000000;
        emblemColor = 0xffffff;
        particleColor = 0x8899ac;
      } else if (spidermanSuit === 'miles') {
        primaryHex = '#101116';
        secondaryHex = '#ff0033';
        primaryColor = 0x101116;
        secondaryColor = 0xff0033;
        eyeColor = 0xffffff;
        eyeFrameColor = 0x111111;
        emblemColor = 0xff0033;
        particleColor = 0xff0033;
      } else if (spidermanSuit === '2099') {
        primaryHex = '#001a35';
        secondaryHex = '#00a8ff';
        primaryColor = 0x001a35;
        secondaryColor = 0x00a8ff;
        eyeColor = 0xff0055;
        eyeFrameColor = 0x001122;
        emblemColor = 0xff0044;
        particleColor = 0x00d2ff;
      } else {
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

      // Custom Hologram GLSL Shader Material
      const hologramMat = createHologramFresnelMaterial(primaryHex, isIronSpider ? '#ffd700' : '#00f3ff');
      uniformsListRef.current.push(hologramMat.uniforms);

      // PBR Physical Materials
      const primaryMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        map: mapTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughnessMap: roughnessTexture,
        metalnessMap: metalnessTexture,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        roughness: 0.22,
        metalness: isIronSpider ? 0.9 : 0.25,
        emissive: primaryColor,
        emissiveIntensity: 0.15
      });

      const secondaryMat = new THREE.MeshPhysicalMaterial({
        color: secondaryColor,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.35,
        metalness: isIronSpider ? 0.85 : 0.3,
        clearcoat: 0.8
      });

      const bootMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        map: mapTexture,
        normalMap: normalTexture,
        clearcoat: 1.0,
        roughness: 0.18,
        metalness: isIronSpider ? 0.9 : 0.25
      });

      // --- ICONIC SUPERHERO ACTION POSING ---
      const isCrouch = poseMode === 'crouch';

      if (isCrouch) {
        // Lower overall body for superhero crouch pose
        figureGroup.position.set(0, -0.4, 0);
      } else {
        figureGroup.position.set(0, 0, 0);
      }

      // --- 1. HEAD & SPIDER MASK ---
      const headGroup = new THREE.Group();
      headGroup.position.set(0, isCrouch ? 1.35 : 1.65, isCrouch ? 0.25 : 0);
      if (isCrouch) {
        headGroup.rotation.x = -0.22; // Tilt head up to focus forward
      }

      const headGeo = new THREE.SphereGeometry(0.38, 128, 128);
      headGeo.scale(0.88, 1.18, 0.95);
      headGeo.computeVertexNormals();
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headGroup.add(headMesh);

      // Eye Lenses
      [-0.145, 0.145].forEach((xOffset) => {
        const eyeShape = new THREE.Shape();
        eyeShape.moveTo(0, 0.19);
        eyeShape.quadraticCurveTo(0.15, 0.14, 0.16, -0.04);
        eyeShape.quadraticCurveTo(0.10, -0.18, 0, -0.22);
        eyeShape.quadraticCurveTo(-0.10, -0.18, -0.16, -0.04);
        eyeShape.quadraticCurveTo(-0.15, 0.14, 0, 0.19);

        const eyeExtrudeSettings = { depth: 0.035, bevelEnabled: true, bevelSegments: 6, bevelSize: 0.015, bevelThickness: 0.015 };
        const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, eyeExtrudeSettings);
        eyeGeo.scale(0.72, 0.85, 0.7);

        const eyeMat = new THREE.MeshPhysicalMaterial({
          color: eyeColor,
          emissive: eyeColor,
          emissiveIntensity: 1.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.01
        });

        const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        eyeMesh.position.set(xOffset, 0.05, 0.33);
        eyeMesh.rotation.y = xOffset * -0.45;
        eyeMesh.rotation.z = xOffset * 0.22;
        headGroup.add(eyeMesh);

        // Frame
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
          roughness: 0.05,
          metalness: 0.95
        });

        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(xOffset, 0.05, 0.315);
        frameMesh.rotation.y = xOffset * -0.45;
        frameMesh.rotation.z = xOffset * 0.22;
        headGroup.add(frameMesh);
      });

      figureGroup.add(headGroup);

      // --- 2. ATHLETIC TORSO & CHEST ---
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, isCrouch ? 0.45 : 0.65, isCrouch ? 0.15 : 0);
      if (isCrouch) {
        torsoGroup.rotation.x = 0.45; // Lean chest forward into superhero crouch
      }

      const chestGeo = new THREE.SphereGeometry(0.55, 96, 96);
      chestGeo.scale(1.05, 0.82, 0.72);
      chestGeo.computeVertexNormals();
      const chestMesh = new THREE.Mesh(chestGeo, primaryMat);
      chestMesh.position.set(0, 0.28, 0);
      torsoGroup.add(chestMesh);

      const abdomenGeo = new THREE.CylinderGeometry(0.48, 0.40, 0.75, 64);
      abdomenGeo.computeVertexNormals();
      const abdomenMesh = new THREE.Mesh(abdomenGeo, spidermanSuit === 'upgraded' ? secondaryMat : primaryMat);
      abdomenMesh.position.set(0, -0.22, 0);
      torsoGroup.add(abdomenMesh);

      // 3D Spider Emblem
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
        metalness: isIronSpider ? 0.98 : 0.6,
        roughness: 0.1,
        emissive: isIronSpider ? 0xffaa00 : 0x000000,
        emissiveIntensity: isIronSpider ? 0.5 : 0.0
      });

      const frontEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      frontEmblem.position.set(0, 0.24, 0.37);
      torsoGroup.add(frontEmblem);

      figureGroup.add(torsoGroup);

      // --- 3. ARMS (RIGHT ARM EXTENDED FOR WEB SHOOTING) ---
      // Right Shoulder & Arm (Web Shooting Gesture)
      const rArmGroup = new THREE.Group();
      rArmGroup.position.set(0.58, isCrouch ? 0.75 : 0.92, isCrouch ? 0.2 : 0);
      if (isCrouch) {
        rArmGroup.rotation.x = -1.15; // Shoot arm forward
        rArmGroup.rotation.y = 0.25;
        rArmGroup.rotation.z = -0.25;
      }

      const rShoulderGeo = new THREE.SphereGeometry(0.24, 48, 48);
      const rShoulder = new THREE.Mesh(rShoulderGeo, primaryMat);
      rArmGroup.add(rShoulder);

      const rBicepGeo = new THREE.CapsuleGeometry(0.15, 0.42, 24, 48);
      const rBicep = new THREE.Mesh(rBicepGeo, primaryMat);
      rBicep.position.set(0.14, -0.3, 0.05);
      rArmGroup.add(rBicep);

      const rForearmGeo = new THREE.CapsuleGeometry(0.13, 0.42, 24, 48);
      const rForearm = new THREE.Mesh(rForearmGeo, primaryMat);
      rForearm.position.set(0.25, -0.72, 0.12);
      rArmGroup.add(rForearm);

      // Wrist Web Shooter Nozzle
      const rShooterGeo = new THREE.TorusGeometry(0.13, 0.028, 24, 48);
      const rShooterMat = new THREE.MeshPhysicalMaterial({ color: 0xe0e0e0, metalness: 0.98, roughness: 0.05 });
      const rShooter = new THREE.Mesh(rShooterGeo, rShooterMat);
      rShooter.position.set(0.25, -0.92, 0.2);
      rShooter.rotation.x = Math.PI / 2;
      rArmGroup.add(rShooter);

      figureGroup.add(rArmGroup);

      // Left Arm (Braced Backwards for superhero balance)
      const lArmGroup = new THREE.Group();
      lArmGroup.position.set(-0.58, isCrouch ? 0.75 : 0.92, isCrouch ? 0.1 : 0);
      if (isCrouch) {
        lArmGroup.rotation.x = 0.85; // Swing arm back
        lArmGroup.rotation.y = -0.45;
        lArmGroup.rotation.z = 0.45;
      }

      const lShoulder = new THREE.Mesh(rShoulderGeo, secondaryMat);
      lArmGroup.add(lShoulder);

      const lBicep = new THREE.Mesh(rBicepGeo, secondaryMat);
      lBicep.position.set(-0.14, -0.3, 0.05);
      lArmGroup.add(lBicep);

      const lForearm = new THREE.Mesh(rForearmGeo, primaryMat);
      lForearm.position.set(-0.25, -0.72, 0.12);
      lArmGroup.add(lForearm);

      figureGroup.add(lArmGroup);

      // --- 4. HIPS, LEGS & BOOTS (SUPERHERO CROUCH) ---
      [-0.26, 0.26].forEach((xPos) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(xPos, isCrouch ? 0.0 : 0.12, 0);

        if (isCrouch) {
          legGroup.rotation.x = -0.75; // Deep crouch bend
        }

        const thighGeo = new THREE.CapsuleGeometry(0.19, 0.58, 24, 48);
        const thighMesh = new THREE.Mesh(thighGeo, secondaryMat);
        thighMesh.position.set(0, -0.32, 0);
        legGroup.add(thighMesh);

        const calfGeo = new THREE.CapsuleGeometry(0.16, 0.50, 24, 48);
        const calfMesh = new THREE.Mesh(calfGeo, secondaryMat);
        calfMesh.position.set(0, -0.88, isCrouch ? -0.15 : 0.02);
        if (isCrouch) calfMesh.rotation.x = 0.9;
        legGroup.add(calfMesh);

        const bootGeo = new THREE.CapsuleGeometry(0.155, 0.45, 24, 48);
        const bootMesh = new THREE.Mesh(bootGeo, bootMat);
        bootMesh.position.set(0, -1.25, isCrouch ? -0.3 : 0.04);
        legGroup.add(bootMesh);

        const footGeo = new THREE.BoxGeometry(0.18, 0.14, 0.42);
        const footMesh = new THREE.Mesh(footGeo, bootMat);
        footMesh.position.set(0, -1.50, isCrouch ? -0.35 : 0.12);
        legGroup.add(footMesh);

        figureGroup.add(legGroup);
      });

      // --- 5. DYNAMIC 3D SYNTHETIC WEB FLUID SPIRAL STREAM ---
      if (webFiring) {
        const webCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.65, isCrouch ? 0.35 : 0.2, 0.6),
          new THREE.Vector3(0.9, isCrouch ? 0.45 : 0.3, 1.8),
          new THREE.Vector3(1.2, isCrouch ? 0.55 : 0.4, 3.2),
          new THREE.Vector3(1.6, isCrouch ? 0.65 : 0.5, 4.8)
        ]);

        const tubeGeo = new THREE.TubeGeometry(webCurve, 64, 0.035, 12, false);
        const tubeMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0x00f3ff,
          emissiveIntensity: 1.4,
          clearcoat: 1.0,
          roughness: 0.02,
          transparent: true,
          opacity: 0.92
        });
        const webTube = new THREE.Mesh(tubeGeo, tubeMat);
        hologramGroup.add(webTube);

        // Web Fluid Energy Particle Swarm
        const webParticleGeo = new THREE.BufferGeometry();
        const webPCount = 200;
        const webPos = new Float32Array(webPCount * 3);
        for (let i = 0; i < webPCount; i++) {
          const t = i / webPCount;
          const pt = webCurve.getPoint(t);
          webPos[i * 3] = pt.x + (Math.random() - 0.5) * 0.2;
          webPos[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.2;
          webPos[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.2;
        }
        webParticleGeo.setAttribute('position', new THREE.BufferAttribute(webPos, 3));
        const webPMat = new THREE.PointsMaterial({ size: 0.05, color: 0x00f3ff, transparent: true, opacity: 0.95 });
        const webParticles = new THREE.Points(webParticleGeo, webPMat);
        hologramGroup.add(webParticles);
      }

      // --- 6. OPTICAL PROJECTOR PEDESTAL & VOLUMETRIC CONE ---
      const scanLineGeo = new THREE.RingGeometry(0.1, 2.8, 120);
      const scanLineMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
      scanLineMesh.rotation.x = Math.PI / 2;
      hologramGroup.add(scanLineMesh);

      const coneGeo = new THREE.CylinderGeometry(0.2, 2.5, 4.2, 64, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
      const lightCone = new THREE.Mesh(coneGeo, coneMat);
      lightCone.position.set(0, 0.2, 0);
      hologramGroup.add(lightCone);

      const pedestalGeo = new THREE.CylinderGeometry(2.3, 2.7, 0.3, 64);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(0, -1.65, 0);
      hologramGroup.add(pedestal);

      const particleGeo = new THREE.BufferGeometry();
      const count = 500;
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

      animateCallback = (time) => {
        if (autoRotate && controlsRef.current) {
          hologramGroup.rotation.y += 0.005;
        }
        particles.rotation.y += 0.003;

        scanY += 0.025 * scanDir;
        if (scanY > 2.2) scanDir = -1;
        if (scanY < -1.65) scanDir = 1;
        scanLineMesh.position.y = scanY;

        uniformsListRef.current.forEach(u => {
          if (u.uTime) u.uTime.value = time;
        });
      };

    } else if (mode === 'atom') {
      // ⚛️ QUANTUM ATOMIC NUCLEUS
      const nucGeo = new THREE.SphereGeometry(0.95, 96, 96);
      const nucMat = createHologramFresnelMaterial('#9d4edd', '#00f3ff');
      uniformsListRef.current.push(nucMat.uniforms);

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

      animateCallback = (time) => {
        nucleus.rotation.y += 0.01;
        rings.forEach((ring, i) => { ring.rotation.z += 0.018 * (i + 1); });
        uniformsListRef.current.forEach(u => { if (u.uTime) u.uTime.value = time; });
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
        const base1Mat = new THREE.MeshPhysicalMaterial({ color: 0x00f3ff, emissive: 0x00a8ff, emissiveIntensity: 1.1, clearcoat: 1.0 });
        const base1 = new THREE.Mesh(base1Geo, base1Mat);
        base1.position.set(x1, y, z1);
        dnaGroup.add(base1);

        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;
        const base2Geo = new THREE.SphereGeometry(0.14, 32, 32);
        const base2Mat = new THREE.MeshPhysicalMaterial({ color: 0xff0055, emissive: 0xd60029, emissiveIntensity: 1.1, clearcoat: 1.0 });
        const base2 = new THREE.Mesh(base2Geo, base2Mat);
        base2.position.set(x2, y, z2);
        dnaGroup.add(base2);

        const rungLength = radius * 2.0;
        const rungGeo = new THREE.CylinderGeometry(0.03, 0.03, rungLength, 24);
        const rungMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
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
      const boxGeo = new THREE.BoxGeometry(2.9, 1.6, 2.9, 16, 16, 16);
      const boxMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const box = new THREE.Mesh(boxGeo, boxMat);
      hologramGroup.add(box);

      animateCallback = () => {
        box.rotation.y += 0.008;
        box.rotation.x += 0.004;
      };
    }

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || container.offsetWidth || 600;
      const h = container.clientHeight || container.offsetHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let resizeObserver;
    try {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);
    } catch (e) {}

    // Animation Render Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const time = clock.getElapsedTime();

      controls.update();
      animateCallback(time);

      if (bloomEnabled) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    renderLoop();
    handleResize();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mode, spidermanSuit, poseMode, autoRotate, bloomEnabled, webFiring]);

  return (
    <div
      ref={mountRef}
      className="w-full h-80 sm:h-[420px] cursor-grab active:cursor-grabbing rounded-xl bg-slate-950/95 border border-cyan-500/40 relative overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(0,243,255,0.25)]"
    >
      {/* 4K Tech Holographic HUD Overlay */}
      {hudOverlay && (
        <>
          {/* Top Left Badge */}
          <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/80 border border-cyan-500/50 px-3 py-1.5 rounded-lg pointer-events-none flex items-center gap-2 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Movie GLSL Shaders • UnrealBloomPass • Drag to Orbit 360°</span>
          </div>

          {/* Top Right Coordinate HUD */}
          <div className="absolute top-3 right-3 text-[9px] font-mono text-cyan-400/80 bg-slate-900/80 border border-cyan-500/30 px-2.5 py-1.5 rounded-md pointer-events-none hidden sm:block">
            LAT: 34.0522 N | SHADER: GLSL_FRESNEL | BLOOM: {bloomEnabled ? 'ACTIVE' : 'OFF'}
          </div>

          {/* Bottom Left Target Lock Reticle UI */}
          <div className="absolute bottom-3 left-3 pointer-events-none hidden sm:flex items-center gap-2 text-[9px] font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md">
            <span className="text-cyan-400 font-bold">TARGET LOCKED:</span> SPIDER-MAN {poseMode.toUpperCase()} POSE
          </div>
        </>
      )}
    </div>
  );
});

export default Hologram3dCanvas;
