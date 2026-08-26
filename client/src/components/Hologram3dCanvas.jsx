import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { playJarvisPowerUp, setJarvisPlasmaHum } from '../utils/jarvisAudioSynth';

/**
 * 4K ULTRA-HIGH RESOLUTION PBR TEXTURE GENERATOR (4096 x 4096)
 */
function createPhotorealistic4kSuitTextures(suitType, primaryHex, secondaryHex) {
  const TEX_SIZE = 4096;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_SIZE;
  colorCanvas.height = TEX_SIZE;
  const ctx = colorCanvas.getContext('2d');

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

  // Specular Shading
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

  // Web Lattice
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

  // 2. NORMAL BUMP MAP
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

  const normalTexture = new THREE.CanvasTexture(normalCanvas);
  normalTexture.wrapS = THREE.RepeatWrapping;
  normalTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.anisotropy = 16;

  // 3. ROUGHNESS & METALLIC MAPS
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 2048;
  roughCanvas.height = 2048;
  const rCtx = roughCanvas.getContext('2d');
  rCtx.fillStyle = 'rgb(115, 115, 115)';
  rCtx.fillRect(0, 0, 2048, 2048);
  const roughnessTexture = new THREE.CanvasTexture(roughCanvas);

  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 2048;
  metalCanvas.height = 2048;
  const mCtx = metalCanvas.getContext('2d');
  mCtx.fillStyle = 'rgb(38, 38, 38)';
  mCtx.fillRect(0, 0, 2048, 2048);
  const metalnessTexture = new THREE.CanvasTexture(metalCanvas);

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
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
        float scanline = sin(vUv.y * 280.0 + uTime * 5.0) * 0.12 + 0.88;
        float shimmer = sin(uTime * 8.0 + vUv.x * 40.0) * 0.04 + 0.96;
        vec3 finalColor = mix(uColor, uRimColor, fresnel * 0.85);
        float finalAlpha = (uOpacity * (0.35 + fresnel * 0.65)) * scanline * shimmer;
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

/**
 * 4D TESSERACT HYPERCUBE GEOMETRY & ROTATION MATRIX
 * Projects 4D vertices (x,y,z,w) into 3D Euclidean space (X,Y,Z) using perspective 4D projection
 */
function create4dTesseractGroup(timeVal) {
  const group = new THREE.Group();

  const vertices4D = [];
  for (let i = 0; i < 16; i++) {
    vertices4D.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1
    ]);
  }

  const angleXW = timeVal * 0.9;
  const angleZW = timeVal * 0.7;

  const cosXW = Math.cos(angleXW), sinXW = Math.sin(angleXW);
  const cosZW = Math.cos(angleZW), sinZW = Math.sin(angleZW);

  const projected3D = vertices4D.map(([x, y, z, w]) => {
    let x1 = x * cosXW - w * sinXW;
    let w1 = x * sinXW + w * cosXW;

    let z2 = z * cosZW - w1 * sinZW;
    let w2 = z * sinZW + w1 * cosZW;

    const distance4D = 2.8;
    const factor = 1.6 / (distance4D - w2);

    return new THREE.Vector3(x1 * factor * 1.5, y * factor * 1.5, z2 * factor * 1.5);
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.85
  });

  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const diff = (i ^ j);
      if ((diff & (diff - 1)) === 0) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([projected3D[i], projected3D[j]]);
        const lineMesh = new THREE.Line(lineGeo, lineMat);
        group.add(lineMesh);
      }
    }
  }

  const nodeGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  projected3D.forEach(pt => {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.copy(pt);
    group.add(node);
  });

  return group;
}

/**
 * STARK TARGET LOCK RETICLES (J.A.R.V.I.S. HUD RINGS)
 */
function createStarkTargetLockReticleGroup() {
  const group = new THREE.Group();

  // Primary Outer Ring
  const ring1Geo = new THREE.RingGeometry(1.8, 1.84, 64);
  const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
  const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
  group.add(ring1);

  // Inner Segmented Reticle Ring
  const ring2Geo = new THREE.RingGeometry(1.2, 1.25, 32, 1, 0, Math.PI * 1.5);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xffa500, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  group.add(ring2);

  // Target Crosshairs
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.5 });
  const points = [
    [new THREE.Vector3(-2.1, 0, 0), new THREE.Vector3(-1.4, 0, 0)],
    [new THREE.Vector3(1.4, 0, 0), new THREE.Vector3(2.1, 0, 0)],
    [new THREE.Vector3(0, -2.1, 0), new THREE.Vector3(0, -1.4, 0)],
    [new THREE.Vector3(0, 1.4, 0), new THREE.Vector3(0, 2.1, 0)]
  ];
  points.forEach(pts => {
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(lineGeo, lineMat));
  });

  return { group, ring1, ring2 };
}

const Hologram3dCanvas = forwardRef(function Hologram3dCanvas(
  {
    mode = 'spiderman',
    spidermanSuit = 'upgraded',
    poseMode = 'crouch',
    autoRotate = true,
    hudOverlay = true,
    bloomEnabled = true,
    webFiring = true,
    explodedView = false,
    nanotechReassembling = false,
    is4dEnabled = false,
    time4d = 0,
    timeSpeed4d = 1.0,
    is4dPlaying = true,
    starkReticles = true,
    sfxEnabled = true
  },
  ref
) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const uniformsListRef = useRef([]);

  const [activeCameraPreset, setActiveCameraPreset] = useState('full');

  useImperativeHandle(ref, () => ({
    setCameraPreset: (preset) => {
      setActiveCameraPreset(preset);
      if (!cameraRef.current || !controlsRef.current) return;
      if (preset === 'full') {
        cameraRef.current.position.set(0, 0.2, 5.8);
        controlsRef.current.target.set(0, 0, 0);
      } else if (preset === 'texture') {
        cameraRef.current.position.set(0, 0.4, 1.7);
        controlsRef.current.target.set(0, 0.4, 0);
      } else if (preset === 'lens') {
        cameraRef.current.position.set(0, 1.45, 1.35);
        controlsRef.current.target.set(0, 1.45, 0);
      } else if (preset === 'shooter') {
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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.85,
      0.4,
      0.2
    );
    composer.addPass(bloomPass);

    const studioEnvMap = createProceduralStudioEnvMap(renderer);
    scene.environment = studioEnvMap;

    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // STARK TARGET LOCK RETICLES (J.A.R.V.I.S. HUD RINGS)
    let starkReticleObj = null;
    if (starkReticles) {
      starkReticleObj = createStarkTargetLockReticleGroup();
      starkReticleObj.group.position.set(0, 0, 0);
      scene.add(starkReticleObj.group);
    }

    // AUDIO SFX POWER UP & AMBIENT HUM
    if (sfxEnabled) {
      playJarvisPowerUp();
      setJarvisPlasmaHum(true);
    }

    // 4D TEMPORAL DYNAMICS: TESSERACT HYPERCUBE MESH
    let tesseractGroup = null;
    if (is4dEnabled) {
      tesseractGroup = create4dTesseractGroup(time4d);
      tesseractGroup.position.set(0, 0, 0);
      scene.add(tesseractGroup);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLightCrimson = new THREE.PointLight(0xff0044, 6.0, 30);
    rimLightCrimson.position.set(6, 2.5, -5);
    scene.add(rimLightCrimson);

    const rimLightCyan = new THREE.PointLight(0x00f3ff, 5.5, 30);
    rimLightCyan.position.set(-6, -1.5, -5);
    scene.add(rimLightCyan);

    uniformsListRef.current = [];
    let animateCallback = () => {};

    if (mode === 'spiderman') {
      const figureGroup = new THREE.Group();
      hologramGroup.add(figureGroup);

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
      } else if (spidermanSuit === 'ironspider') {
        primaryHex = '#d60029';
        secondaryHex = '#101726';
        primaryColor = 0xd60029;
        secondaryColor = 0x101726;
        eyeFrameColor = 0xffd700;
        emblemColor = 0xffd700;
        particleColor = 0xffd700;
        isIronSpider = true;
      } else if (spidermanSuit === 'symbiote') {
        primaryHex = '#0c0d12';
        secondaryHex = '#171924';
        primaryColor = 0x0c0d12;
        secondaryColor = 0x171924;
        emblemColor = 0xffffff;
        particleColor = 0x8899ac;
      } else if (spidermanSuit === 'miles') {
        primaryHex = '#101116';
        secondaryHex = '#ff0033';
        primaryColor = 0x101116;
        secondaryColor = 0xff0033;
        emblemColor = 0xff0033;
        particleColor = 0xff0033;
      } else if (spidermanSuit === '2099') {
        primaryHex = '#001a35';
        secondaryHex = '#00a8ff';
        primaryColor = 0x001a35;
        secondaryColor = 0x00a8ff;
        eyeColor = 0xff0055;
        emblemColor = 0xff0044;
        particleColor = 0x00d2ff;
      }

      const { mapTexture, normalTexture, roughnessTexture, metalnessTexture } = createPhotorealistic4kSuitTextures(
        spidermanSuit,
        primaryHex,
        secondaryHex
      );

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

      const isCrouch = poseMode === 'crouch';
      figureGroup.position.set(0, isCrouch ? -0.4 : 0, 0);

      // --- EXPLODED BLUEPRINT VIEW OFFSET FACTORS ---
      const expOffset = explodedView ? 0.85 : 0.0;

      // 1. HEAD
      const headGroup = new THREE.Group();
      headGroup.position.set(0, (isCrouch ? 1.35 : 1.65) + expOffset * 0.9, (isCrouch ? 0.25 : 0) + expOffset * 0.3);
      if (isCrouch) headGroup.rotation.x = -0.22;

      const headGeo = new THREE.SphereGeometry(0.38, 128, 128);
      headGeo.scale(0.88, 1.18, 0.95);
      headGeo.computeVertexNormals();
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headGroup.add(headMesh);

      // Lenses
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
          clearcoat: 1.0
        });

        const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        eyeMesh.position.set(xOffset, 0.05, 0.33);
        eyeMesh.rotation.y = xOffset * -0.45;
        eyeMesh.rotation.z = xOffset * 0.22;
        headGroup.add(eyeMesh);
      });

      figureGroup.add(headGroup);

      // 2. TORSO
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, isCrouch ? 0.45 : 0.65, isCrouch ? 0.15 : 0);
      if (isCrouch) torsoGroup.rotation.x = 0.45;

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

      figureGroup.add(torsoGroup);

      // 3. ARMS
      const rArmGroup = new THREE.Group();
      rArmGroup.position.set(0.58 + expOffset * 0.8, (isCrouch ? 0.75 : 0.92) + expOffset * 0.2, (isCrouch ? 0.2 : 0) + expOffset * 0.5);
      if (isCrouch) {
        rArmGroup.rotation.x = -1.15;
        rArmGroup.rotation.y = 0.25;
        rArmGroup.rotation.z = -0.25;
      }

      const rShoulderGeo = new THREE.SphereGeometry(0.24, 48, 48);
      const rShoulder = new THREE.Mesh(rShoulderGeo, primaryMat);
      rArmGroup.add(rShoulder);

      const rForearmGeo = new THREE.CapsuleGeometry(0.13, 0.42, 24, 48);
      const rForearm = new THREE.Mesh(rForearmGeo, primaryMat);
      rForearm.position.set(0.25, -0.72, 0.12);
      rArmGroup.add(rForearm);

      figureGroup.add(rArmGroup);

      const lArmGroup = new THREE.Group();
      lArmGroup.position.set(-0.58 - expOffset * 0.8, (isCrouch ? 0.75 : 0.92) + expOffset * 0.2, (isCrouch ? 0.1 : 0) + expOffset * 0.5);
      if (isCrouch) {
        lArmGroup.rotation.x = 0.85;
        lArmGroup.rotation.y = -0.45;
        lArmGroup.rotation.z = 0.45;
      }

      const lShoulder = new THREE.Mesh(rShoulderGeo, secondaryMat);
      lArmGroup.add(lShoulder);

      const lForearm = new THREE.Mesh(rForearmGeo, primaryMat);
      lForearm.position.set(-0.25, -0.72, 0.12);
      lArmGroup.add(lForearm);

      figureGroup.add(lArmGroup);

      // 4. LEGS
      [-0.26, 0.26].forEach((xPos, idx) => {
        const sideMult = idx === 0 ? -1 : 1;
        const legGroup = new THREE.Group();
        legGroup.position.set(xPos + sideMult * expOffset * 0.6, (isCrouch ? 0.0 : 0.12) - expOffset * 0.6, 0);

        if (isCrouch) legGroup.rotation.x = -0.75;

        const thighGeo = new THREE.CapsuleGeometry(0.19, 0.58, 24, 48);
        const thighMesh = new THREE.Mesh(thighGeo, secondaryMat);
        thighMesh.position.set(0, -0.32, 0);
        legGroup.add(thighMesh);

        const bootGeo = new THREE.CapsuleGeometry(0.155, 0.45, 24, 48);
        const bootMesh = new THREE.Mesh(bootGeo, bootMat);
        bootMesh.position.set(0, -1.25, isCrouch ? -0.3 : 0.04);
        legGroup.add(bootMesh);

        figureGroup.add(legGroup);
      });

      // --- EXPLODED BLUEPRINT TELEMETRY CONNECTING LINES ---
      if (explodedView) {
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.75 });

        // Lines connecting limbs to torso
        const points1 = [new THREE.Vector3(0, 0.65, 0), new THREE.Vector3(0, 2.4, 0)]; // Head
        const points2 = [new THREE.Vector3(0, 0.65, 0), new THREE.Vector3(1.4, 0.9, 0.5)]; // R Arm
        const points3 = [new THREE.Vector3(0, 0.65, 0), new THREE.Vector3(-1.4, 0.9, 0.5)]; // L Arm

        [points1, points2, points3].forEach(pts => {
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const lineMesh = new THREE.Line(lineGeo, lineMat);
          figureGroup.add(lineMesh);
        });
      }

      // --- NANOTECH REASSEMBLY PARTICLES ---
      if (nanotechReassembling) {
        const nanoPGeo = new THREE.BufferGeometry();
        const nanoCount = 400;
        const nanoPos = new Float32Array(nanoCount * 3);
        for (let i = 0; i < nanoCount * 3; i++) {
          nanoPos[i] = (Math.random() - 0.5) * 5;
        }
        nanoPGeo.setAttribute('position', new THREE.BufferAttribute(nanoPos, 3));
        const nanoPMat = new THREE.PointsMaterial({ size: 0.06, color: 0xffd700, transparent: true, opacity: 0.9 });
        const nanoParticles = new THREE.Points(nanoPGeo, nanoPMat);
        hologramGroup.add(nanoParticles);
      }

      // 5. 3D WEB FLUID STREAM
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
          transparent: true,
          opacity: 0.92
        });
        const webTube = new THREE.Mesh(tubeGeo, tubeMat);
        hologramGroup.add(webTube);
      }

      const scanLineGeo = new THREE.RingGeometry(0.1, 2.8, 120);
      const scanLineMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
      scanLineMesh.rotation.x = Math.PI / 2;
      hologramGroup.add(scanLineMesh);

      const pedestalGeo = new THREE.CylinderGeometry(2.3, 2.7, 0.3, 64);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(0, -1.65, 0);
      hologramGroup.add(pedestal);

      let scanY = -1.65;
      let scanDir = 1;

      animateCallback = (time) => {
        if (autoRotate && controlsRef.current) {
          hologramGroup.rotation.y += 0.005;
        }

        scanY += 0.025 * scanDir;
        if (scanY > 2.2) scanDir = -1;
        if (scanY < -1.65) scanDir = 1;
        scanLineMesh.position.y = scanY;

        uniformsListRef.current.forEach(u => {
          if (u.uTime) u.uTime.value = time;
        });
      };

    } else if (mode === 'ironman') {
      // ⚡ IRON MAN MARK 85 ARC CORE & NANOTECH ARMOR SEGMENTS
      const coreGroup = new THREE.Group();
      hologramGroup.add(coreGroup);

      const arcGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 64);
      const arcMat = new THREE.MeshPhysicalMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 2.0, clearcoat: 1.0 });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      coreGroup.add(arcMesh);

      const ring1Geo = new THREE.TorusGeometry(1.6, 0.08, 32, 120);
      const ring1Mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.98, roughness: 0.05 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      coreGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(2.4, 0.09, 32, 120);
      const ring2Mat = new THREE.MeshStandardMaterial({ color: 0xd60029, metalness: 0.95, roughness: 0.08 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      coreGroup.add(ring2);

      animateCallback = () => {
        ring1.rotation.z += 0.015;
        ring2.rotation.z -= 0.012;
        ring2.rotation.x += 0.008;
      };

    } else if (mode === 'v8engine') {
      // ⚙️ 3D V8 ENGINE BLUEPRINT & PISTONS
      const engineGroup = new THREE.Group();
      hologramGroup.add(engineGroup);

      const blockGeo = new THREE.BoxGeometry(2.8, 1.8, 2.2, 12, 12, 12);
      const blockMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const blockMesh = new THREE.Mesh(blockGeo, blockMat);
      engineGroup.add(blockMesh);

      const pistons = [];
      for (let p = 0; p < 8; p++) {
        const pGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 24);
        const pMat = new THREE.MeshStandardMaterial({ color: 0xffa500, metalness: 0.9, roughness: 0.1 });
        const piston = new THREE.Mesh(pGeo, pMat);
        const side = p % 2 === 0 ? 0.8 : -0.8;
        const zPos = (Math.floor(p / 2) - 1.5) * 0.6;
        piston.position.set(side, 0, zPos);
        engineGroup.add(piston);
        pistons.push({ mesh: piston, initialY: 0, phase: p * Math.PI / 4 });
      }

      animateCallback = (time) => {
        engineGroup.rotation.y += 0.006;
        pistons.forEach(p => {
          p.mesh.position.y = Math.sin(time * 6.0 + p.phase) * 0.35;
        });
      };

    } else if (mode === 'cyberdrone') {
      // 🚁 AUTONOMOUS RECON CYBER DRONE
      const droneGroup = new THREE.Group();
      hologramGroup.add(droneGroup);

      const chassisGeo = new THREE.SphereGeometry(0.7, 48, 48);
      chassisGeo.scale(1.2, 0.5, 1.0);
      const chassisMat = new THREE.MeshPhysicalMaterial({ color: 0x111827, metalness: 0.95, roughness: 0.1, clearcoat: 1.0 });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      droneGroup.add(chassis);

      const lensGeo = new THREE.SphereGeometry(0.25, 32, 32);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0, -0.15, 0.6);
      droneGroup.add(lens);

      const props = [];
      [[-1.2, 1.2], [1.2, 1.2], [-1.2, -1.2], [1.2, -1.2]].forEach(([x, z]) => {
        const propGeo = new THREE.BoxGeometry(0.8, 0.03, 0.08);
        const propMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const prop = new THREE.Mesh(propGeo, propMat);
        prop.position.set(x, 0.2, z);
        droneGroup.add(prop);
        props.push(prop);
      });

      animateCallback = () => {
        droneGroup.rotation.y += 0.008;
        props.forEach(p => p.rotation.y += 0.35);
      };

    } else if (mode === 'quantumvortex') {
      // 🌀 QUANTUM PARTICLE VORTEX
      const vortexGroup = new THREE.Group();
      hologramGroup.add(vortexGroup);

      const count = 800;
      const vPos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = (i / count) * 3.0;
        const angle = i * 0.15;
        vPos[i * 3] = Math.cos(angle) * r;
        vPos[i * 3 + 1] = (i / count) * 4.0 - 2.0;
        vPos[i * 3 + 2] = Math.sin(angle) * r;
      }
      const vGeo = new THREE.BufferGeometry();
      vGeo.setAttribute('position', new THREE.BufferAttribute(vPos, 3));
      const vMat = new THREE.PointsMaterial({ size: 0.06, color: 0x00f3ff, transparent: true, opacity: 0.95 });
      const vortex = new THREE.Points(vGeo, vMat);
      vortexGroup.add(vortex);

      animateCallback = () => {
        vortexGroup.rotation.y += 0.025;
      };

    } else if (mode === 'atom') {
      const nucGeo = new THREE.SphereGeometry(0.95, 96, 96);
      const nucMat = createHologramFresnelMaterial('#9d4edd', '#00f3ff');
      uniformsListRef.current.push(nucMat.uniforms);
      const nucleus = new THREE.Mesh(nucGeo, nucMat);
      hologramGroup.add(nucleus);

      animateCallback = (time) => {
        nucleus.rotation.y += 0.01;
        uniformsListRef.current.forEach(u => { if (u.uTime) u.uTime.value = time; });
      };

    } else if (mode === 'dna') {
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
      }

      animateCallback = () => {
        dnaGroup.rotation.y += 0.012;
      };

    } else if (mode === 'planet') {
      const planetGeo = new THREE.SphereGeometry(1.9, 96, 96);
      const planetMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, wireframe: true, emissive: 0x03045e });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      hologramGroup.add(planet);

      animateCallback = () => {
        planet.rotation.y += 0.005;
      };

    } else if (mode === 'reactor') {
      const coreGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.45, 96);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const core = new THREE.Mesh(coreGeo, coreMat);
      hologramGroup.add(core);

      animateCallback = () => {
        core.rotation.y += 0.018;
      };

    } else {
      const boxGeo = new THREE.BoxGeometry(2.9, 1.6, 2.9, 16, 16, 16);
      const boxMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const box = new THREE.Mesh(boxGeo, boxMat);
      hologramGroup.add(box);

      animateCallback = () => {
        box.rotation.y += 0.008;
      };
    }

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

    let animationFrameId;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const time = clock.getElapsedTime();

      controls.update();
      animateCallback(time);

      if (starkReticleObj) {
        starkReticleObj.ring1.rotation.z += 0.01;
        starkReticleObj.ring2.rotation.z -= 0.015;
      }

      if (is4dEnabled && tesseractGroup) {
        const effective4dTime = is4dPlaying ? time * timeSpeed4d + time4d : time4d;
        tesseractGroup.rotation.y = effective4dTime * 0.4;
        tesseractGroup.rotation.x = effective4dTime * 0.25;
        tesseractGroup.rotation.z = Math.sin(effective4dTime * 0.5) * 0.2;
        
        hologramGroup.position.y = Math.sin(effective4dTime * 1.5) * 0.08;
      }

      if (bloomEnabled) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    renderLoop();
    handleResize();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      controls.dispose();
      setJarvisPlasmaHum(false);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mode, spidermanSuit, poseMode, autoRotate, bloomEnabled, webFiring, explodedView, nanotechReassembling, is4dEnabled, time4d, timeSpeed4d, is4dPlaying, starkReticles, sfxEnabled]);

  return (
    <div
      ref={mountRef}
      className="w-full h-80 sm:h-[420px] cursor-grab active:cursor-grabbing rounded-xl bg-cyan-950/20 border border-cyan-500/40 relative overflow-hidden flex items-center justify-center backdrop-blur-xl shadow-[0_0_40px_rgba(0,243,255,0.2)]"
    >
      {hudOverlay && (
        <>
          <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-300 uppercase tracking-widest bg-cyan-950/50 border border-cyan-500/50 px-3 py-1.5 rounded-lg pointer-events-none flex items-center gap-2 backdrop-blur-xl shadow-lg">
            <span className={`w-2 h-2 rounded-full ${is4dEnabled ? 'bg-purple-400 animate-ping' : 'bg-cyan-400 animate-ping'}`} />
            <span>
              {is4dEnabled
                ? `🌌 4D TEMPORAL DYNAMICS: T=${time4d.toFixed(1)}s (4D HYPERCUBE ACTIVE)`
                : explodedView
                ? '💥 3D EXPLODED BLUEPRINT ACTIVE'
                : 'Movie GLSL Shaders • Orbit 360°'}
            </span>
          </div>

          <div className="absolute top-3 right-3 text-[9px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 px-2.5 py-1.5 rounded-md pointer-events-none hidden sm:block backdrop-blur-md">
            {is4dEnabled ? `4D PHASE: ${((time4d * 36) % 360).toFixed(0)}° | ` : ''}MODE: {mode.toUpperCase()} | BLOOM: {bloomEnabled ? 'ACTIVE' : 'OFF'}
          </div>

          <div className="absolute bottom-3 left-3 pointer-events-none hidden sm:flex items-center gap-2 text-[9px] font-mono text-slate-300 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 rounded-md backdrop-blur-md">
            <span className="text-cyan-400 font-bold">TARGET:</span> {mode.toUpperCase()} {is4dEnabled ? '(4D TEMPORAL)' : explodedView ? '(EXPLODED)' : ''}
          </div>
        </>
      )}
    </div>
  );
});

export default Hologram3dCanvas;
