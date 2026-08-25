import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function Hologram3dCanvas({ mode = 'spiderman', spidermanSuit = 'classic', autoRotate = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold all 3D objects for rotation
    const hologramGroup = new THREE.Group();
    scene.add(hologramGroup);

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0x00f3ff, 1.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x9d4edd, 3, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let animateCallback = () => {};

    if (mode === 'spiderman') {
      // 🕸️ Spider-Man Holographic Figure & Suit Customization Engine
      let primaryColor = 0xee0033; // Mask & Chest Red
      let secondaryColor = 0x0066cc; // Suit Blue Accent
      let eyeColor = 0xffffff; // Lenses White Glow
      let emblemColor = 0x111111; // Chest Spider Logo
      let particleColor = 0x00f3ff;
      let hasSpiderLegs = false;

      let isIronSpider = false;
      if (spidermanSuit === 'ironspider') {
        // MCU Integrated / Iron Spider Gold Nanotech (Crimson, Dark Metallic Navy & Massive Gold Spider)
        primaryColor = 0xd60029; // Crimson Red Mask, Upper Chest, Boots
        secondaryColor = 0x111624; // Dark Metallic Navy Body Weave
        eyeColor = 0xffffff; // Glowing White Lenses
        emblemColor = 0xffd700; // Giant Metallic Gold Spider Emblem
        particleColor = 0xffd700;
        hasSpiderLegs = true;
        isIronSpider = true;
      } else if (spidermanSuit === 'symbiote') {
        // Symbiote Black Suit
        primaryColor = 0x111625; // Dark Symbiote Black
        secondaryColor = 0x222b40; // Deep Navy Accent
        eyeColor = 0xffffff; // White Jagged Lenses
        emblemColor = 0xffffff; // Iconic Large White Spider Emblem
        particleColor = 0x8899ac;
      } else if (spidermanSuit === 'miles') {
        // Miles Morales (Black & Red Spray Paint Spider)
        primaryColor = 0x121216; // Matte Black
        secondaryColor = 0xff0033; // Spray Red Accents
        eyeColor = 0xffffff; // White Lenses with Red Outline
        emblemColor = 0xff0033; // Red Spray Spider
        particleColor = 0xff0033;
      } else if (spidermanSuit === '2099') {
        // Spider-Man 2099 Cyberpunk (Neon Blue & Cyber Crimson)
        primaryColor = 0x002244; // Cyber Midnight Blue
        secondaryColor = 0x00d2ff; // Neon Blue Energy Weave
        eyeColor = 0xff0055; // Cyber Red Lenses
        emblemColor = 0xff0044; // Crimson Skull Spider Logo
        particleColor = 0x00d2ff;
      } else {
        // Classic Peter Parker (Red & Blue)
        primaryColor = 0xee0033; // Mask/Chest Red
        secondaryColor = 0x0066cc; // Suit Blue
        eyeColor = 0xffffff; // Glowing White Lenses
        emblemColor = 0x111111; // Black Chest Spider
        particleColor = 0x00f3ff;
      }

      const figureGroup = new THREE.Group();
      hologramGroup.add(figureGroup);

      // 1. ANATOMICAL SMOOTH CURVED HEAD MASK
      const headPoints = [
        new THREE.Vector2(0, 0.75),
        new THREE.Vector2(0.42, 0.65),
        new THREE.Vector2(0.48, 0.35),
        new THREE.Vector2(0.45, 0.0),
        new THREE.Vector2(0.38, -0.35),
        new THREE.Vector2(0.24, -0.65),
        new THREE.Vector2(0.0, -0.72)
      ];

      const headGeo = new THREE.LatheGeometry(headPoints, 32);
      const headMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
        roughness: 0.25,
        metalness: isIronSpider ? 0.85 : 0.35,
        emissive: primaryColor,
        emissiveIntensity: 0.2
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 1.8, 0);
      figureGroup.add(headMesh);

      // Smooth Neck Collar
      const neckPoints = [
        new THREE.Vector2(0.25, 0.0),
        new THREE.Vector2(0.30, 0.2),
        new THREE.Vector2(0.36, 0.4)
      ];
      const neckGeo = new THREE.LatheGeometry(neckPoints, 24);
      const neckMat = new THREE.MeshPhysicalMaterial({
        color: isIronSpider ? 0xffd700 : primaryColor,
        clearcoat: 0.8,
        metalness: isIronSpider ? 0.9 : 0.3,
        roughness: 0.2
      });
      const neckMesh = new THREE.Mesh(neckGeo, neckMat);
      neckMesh.position.set(0, 1.15, 0);
      figureGroup.add(neckMesh);

      // Web Lattice Line Grid on Head Mask
      const headWebGeo = new THREE.SphereGeometry(0.72, 24, 16);
      headWebGeo.scale(0.88, 1.12, 0.95);
      const headWebMat = new THREE.MeshBasicMaterial({
        color: isIronSpider ? 0xffd700 : secondaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.55
      });
      const headWebMesh = new THREE.Mesh(headWebGeo, headWebMat);
      headWebMesh.position.set(0, 1.8, 0);
      figureGroup.add(headWebMesh);

      // 2. MOVIE-ACCURATE EXPRESSIVE 3D SPIDER EYES / LENSES
      [-0.22, 0.22].forEach(xOffset => {
        const eyeShape = new THREE.Shape();
        eyeShape.moveTo(0, 0.28);
        eyeShape.quadraticCurveTo(0.22, 0.20, 0.24, -0.05);
        eyeShape.quadraticCurveTo(0.15, -0.26, 0, -0.32);
        eyeShape.quadraticCurveTo(-0.15, -0.26, -0.24, -0.05);
        eyeShape.quadraticCurveTo(-0.22, 0.20, 0, 0.28);

        const eyeExtrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        const eyeGeo = new THREE.ExtrudeGeometry(eyeShape, eyeExtrudeSettings);
        eyeGeo.scale(0.75, 0.9, 0.8);

        // White Glowing Lens Surface
        const eyeMat = new THREE.MeshPhysicalMaterial({
          color: eyeColor,
          emissive: eyeColor,
          emissiveIntensity: 1.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05
        });
        const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        eyeMesh.position.set(xOffset, 1.88, 0.58);
        eyeMesh.rotation.y = xOffset * -0.58;
        eyeMesh.rotation.z = xOffset * 0.3;
        figureGroup.add(eyeMesh);

        // Dark Lens Outer Contour Frame
        const frameShape = new THREE.Shape();
        frameShape.moveTo(0, 0.32);
        frameShape.quadraticCurveTo(0.26, 0.24, 0.28, -0.05);
        frameShape.quadraticCurveTo(0.18, -0.30, 0, -0.36);
        frameShape.quadraticCurveTo(-0.18, -0.30, -0.28, -0.05);
        frameShape.quadraticCurveTo(-0.26, 0.24, 0, 0.32);

        const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.04, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.01, bevelThickness: 0.01 });
        frameGeo.scale(0.78, 0.92, 0.8);
        const frameMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(xOffset, 1.88, 0.56);
        frameMesh.rotation.y = xOffset * -0.58;
        frameMesh.rotation.z = xOffset * 0.3;
        figureGroup.add(frameMesh);
      });

      // 3. ORGANIC MUSCULAR CHEST & WAIST (Lathe Profile Curve)
      const torsoPoints = [
        new THREE.Vector2(0.55, 0.0),   // Waist
        new THREE.Vector2(0.64, 0.25),  // Lower Abs
        new THREE.Vector2(0.78, 0.65),  // Mid Chest
        new THREE.Vector2(0.92, 1.05),  // Upper Pectorals
        new THREE.Vector2(0.88, 1.35)   // Shoulders / Base of Neck
      ];

      const torsoGeo = new THREE.LatheGeometry(torsoPoints, 32);
      const torsoMat = new THREE.MeshPhysicalMaterial({
        color: primaryColor,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        roughness: 0.3,
        metalness: isIronSpider ? 0.85 : 0.3,
        emissive: primaryColor,
        emissiveIntensity: 0.15
      });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.set(0, 0.0, 0);
      figureGroup.add(torsoMesh);

      // Dark Navy / Black Lat Side Panels (for MCU Integrated Suit)
      [-0.46, 0.46].forEach(side => {
        const latPoints = [
          new THREE.Vector2(0.22, 0.0),
          new THREE.Vector2(0.28, 0.5),
          new THREE.Vector2(0.24, 1.1)
        ];
        const latGeo = new THREE.LatheGeometry(latPoints, 20);
        const latMat = new THREE.MeshPhysicalMaterial({ color: secondaryColor, roughness: 0.4, metalness: 0.4 });
        const latMesh = new THREE.Mesh(latGeo, latMat);
        latMesh.position.set(side * 0.42, 0.0, -0.05);
        figureGroup.add(latMesh);
      });

      // Suit Web Grid on Torso
      const torsoWebGeo = new THREE.LatheGeometry(torsoPoints, 16);
      const torsoWebMat = new THREE.MeshBasicMaterial({
        color: isIronSpider ? 0xffd700 : secondaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      const torsoWebMesh = new THREE.Mesh(torsoWebGeo, torsoWebMat);
      torsoWebMesh.position.set(0, 0.0, 0);
      figureGroup.add(torsoWebMesh);

      // 4. GIANT METALLIC GOLD SPIDER EMBLEM & HARNESS (MCU No Way Home Integrated Suit)
      const emblemShape = new THREE.Shape();
      emblemShape.moveTo(0, 0.38);
      emblemShape.lineTo(0.18, 0.18);
      emblemShape.lineTo(0.35, 0.28);
      emblemShape.lineTo(0.22, -0.05);
      emblemShape.lineTo(0.42, -0.22);
      emblemShape.lineTo(0.12, -0.28);
      emblemShape.lineTo(0, -0.42);
      emblemShape.lineTo(-0.12, -0.28);
      emblemShape.lineTo(-0.42, -0.22);
      emblemShape.lineTo(-0.22, -0.05);
      emblemShape.lineTo(-0.35, 0.28);
      emblemShape.lineTo(-0.18, 0.18);
      emblemShape.closePath();

      const emblemExtrude = { depth: 0.08, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.02, bevelThickness: 0.02 };
      const emblemGeo = new THREE.ExtrudeGeometry(emblemShape, emblemExtrude);
      emblemGeo.scale(1.2, 1.2, 1.0);

      const emblemMat = new THREE.MeshPhysicalMaterial({
        color: emblemColor,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        metalness: isIronSpider ? 0.95 : 0.3,
        roughness: isIronSpider ? 0.1 : 0.5,
        emissive: isIronSpider ? 0xffaa00 : 0x000000,
        emissiveIntensity: isIronSpider ? 0.4 : 0.0
      });

      // Front Gold Spider Emblem
      const frontEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      frontEmblem.position.set(0, 0.72, 0.65);
      figureGroup.add(frontEmblem);

      // Rear Gold Spider Emblem
      const backEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      backEmblem.position.set(0, 0.72, -0.65);
      backEmblem.rotation.y = Math.PI;
      figureGroup.add(backEmblem);

      // Gold Shoulder Armor Caps for Integrated Suit
      if (isIronSpider) {
        [-0.85, 0.85].forEach(x => {
          const armorCapGeo = new THREE.SphereGeometry(0.36, 16, 16);
          armorCapGeo.scale(1.1, 0.8, 1.0);
          const armorCapMat = new THREE.MeshPhysicalMaterial({
            color: 0xffd700,
            clearcoat: 1.0,
            metalness: 0.95,
            roughness: 0.15,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
          });
          const armorCap = new THREE.Mesh(armorCapGeo, armorCapMat);
          armorCap.position.set(x, 1.25, 0);
          figureGroup.add(armorCap);
        });
      }

      // 5. SMOOTH ORGANIC ARMS & WEB-SHOOTERS
      // Right Arm (Flexed Stance)
      const armPoints = [
        new THREE.Vector2(0.24, 0.0),
        new THREE.Vector2(0.28, 0.4),
        new THREE.Vector2(0.22, 0.85)
      ];
      const armGeo = new THREE.LatheGeometry(armPoints, 20);
      const rArmMat = new THREE.MeshPhysicalMaterial({ color: secondaryColor, clearcoat: 0.8, metalness: 0.4, roughness: 0.3 });
      const rArm = new THREE.Mesh(armGeo, rArmMat);
      rArm.position.set(1.15, 0.4, 0);
      rArm.rotation.z = -0.32;
      figureGroup.add(rArm);

      const forearmPoints = [
        new THREE.Vector2(0.18, 0.0),
        new THREE.Vector2(0.22, 0.4),
        new THREE.Vector2(0.19, 0.8)
      ];
      const forearmGeo = new THREE.LatheGeometry(forearmPoints, 20);
      const forearmMat = new THREE.MeshPhysicalMaterial({ color: primaryColor, clearcoat: 0.8, metalness: 0.4, roughness: 0.3 });
      const rForearm = new THREE.Mesh(forearmGeo, forearmMat);
      rForearm.position.set(1.32, -0.3, 0.1);
      rForearm.rotation.z = -0.18;
      figureGroup.add(rForearm);

      // Left Arm (Extended Forward Web Gesture)
      const lArm = new THREE.Mesh(armGeo, rArmMat);
      lArm.position.set(-1.15, 0.55, 0.3);
      lArm.rotation.x = -0.85;
      lArm.rotation.z = 0.25;
      figureGroup.add(lArm);

      const lForearm = new THREE.Mesh(forearmGeo, forearmMat);
      lForearm.position.set(-1.24, 0.25, 0.95);
      lForearm.rotation.x = -1.15;
      figureGroup.add(lForearm);

      // Silver Metallic Web-Shooter Wrist Gauntlet
      const webShooterGeo = new THREE.TorusGeometry(0.19, 0.045, 16, 28);
      const webShooterMat = new THREE.MeshPhysicalMaterial({ color: 0xdddddd, metalness: 0.95, clearcoat: 1.0, roughness: 0.15 });
      const webShooter = new THREE.Mesh(webShooterGeo, webShooterMat);
      webShooter.position.set(-1.24, 0.05, 1.35);
      webShooter.rotation.x = Math.PI / 2;
      figureGroup.add(webShooter);

      // Laser Web Strand Line
      const webStrandGeo = new THREE.CylinderGeometry(0.015, 0.005, 3.5, 8);
      const webStrandMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      const webStrand = new THREE.Mesh(webStrandGeo, webStrandMat);
      webStrand.position.set(-1.24, 0.05, 3.1);
      webStrand.rotation.x = Math.PI / 2;
      figureGroup.add(webStrand);

      // 6. WAIST & ATHLETIC LEGS (Smooth Thighs & Boots)
      const thighPoints = [
        new THREE.Vector2(0.20, 0.0),
        new THREE.Vector2(0.28, 0.5),
        new THREE.Vector2(0.24, 1.0)
      ];
      const thighGeo = new THREE.LatheGeometry(thighPoints, 20);
      const thighMat = new THREE.MeshPhysicalMaterial({ color: secondaryColor, clearcoat: 0.8, metalness: 0.4, roughness: 0.3 });

      const bootPoints = [
        new THREE.Vector2(0.16, 0.0),
        new THREE.Vector2(0.22, 0.5),
        new THREE.Vector2(0.20, 1.0)
      ];
      const bootGeo = new THREE.LatheGeometry(bootPoints, 20);
      const bootMat = new THREE.MeshPhysicalMaterial({ color: primaryColor, clearcoat: 0.8, metalness: 0.4, roughness: 0.3 });

      [-0.35, 0.35].forEach(xPos => {
        const thigh = new THREE.Mesh(thighGeo, thighMat);
        thigh.position.set(xPos, -1.0, 0);
        figureGroup.add(thigh);

        const boot = new THREE.Mesh(bootGeo, bootMat);
        boot.position.set(xPos, -2.0, 0.05);
        figureGroup.add(boot);
      });

      // 7. ARTICULATED GOLD NANOTECH MECHANICAL WALPER ARMS
      if (hasSpiderLegs) {
        for (let l = 0; l < 4; l++) {
          const side = l % 2 === 0 ? 1 : -1;
          const isUpper = l < 2;

          const armLegGroup = new THREE.Group();
          armLegGroup.position.set(side * 0.3, 0.9, -0.3);

          const seg1Geo = new THREE.CylinderGeometry(0.045, 0.045, 1.8, 12);
          const seg1Mat = new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 0.95, clearcoat: 1.0, roughness: 0.1, emissive: 0xffa500, emissiveIntensity: 0.35 });
          const seg1 = new THREE.Mesh(seg1Geo, seg1Mat);
          seg1.position.set(side * 0.75, isUpper ? 0.85 : -0.45, -0.5);
          seg1.rotation.z = side * (isUpper ? -0.8 : -0.4);
          seg1.rotation.x = isUpper ? 0.6 : -0.6;

          const clawGeo = new THREE.ConeGeometry(0.07, 0.65, 8);
          const clawMat = new THREE.MeshPhysicalMaterial({ color: 0xff0033, metalness: 0.95, clearcoat: 1.0, roughness: 0.1 });
          const claw = new THREE.Mesh(clawGeo, clawMat);
          claw.position.set(side * 1.35, isUpper ? 1.45 : -0.95, -0.8);
          claw.rotation.z = side * -1.2;

          armLegGroup.add(seg1);
          armLegGroup.add(claw);
          figureGroup.add(armLegGroup);
        }
      }

      // 8. CINEMATIC STARK HUD HOLOGRAM SCANNER & PEDESTAL
      const scanLineGeo = new THREE.RingGeometry(0.1, 2.7, 40);
      const scanLineMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
      scanLineMesh.rotation.x = Math.PI / 2;
      scanLineMesh.position.y = 0;
      hologramGroup.add(scanLineMesh);

      const ring1Geo = new THREE.TorusGeometry(2.9, 0.015, 16, 100);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.65 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 2.2;
      hologramGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(3.3, 0.012, 16, 100);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.55 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = Math.PI / 1.8;
      hologramGroup.add(ring2);

      const pedestalGeo = new THREE.CylinderGeometry(2.5, 2.8, 0.25, 36);
      const pedestalMat = new THREE.MeshBasicMaterial({ color: isIronSpider ? 0xffd700 : secondaryColor, wireframe: true, transparent: true, opacity: 0.65 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(0, -2.5, 0);
      hologramGroup.add(pedestal);

      const particleGeo = new THREE.BufferGeometry();
      const count = 500;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 8;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const particleMat = new THREE.PointsMaterial({ size: 0.05, color: particleColor, transparent: true, opacity: 0.85 });
      const particles = new THREE.Points(particleGeo, particleMat);
      hologramGroup.add(particles);

      let scanY = -2.5;
      let scanDirection = 1;

      animateCallback = () => {
        figureGroup.rotation.y += 0.008;
        pedestal.rotation.y -= 0.005;
        particles.rotation.y += 0.003;
        ring1.rotation.z += 0.006;
        ring2.rotation.z -= 0.008;

        scanY += 0.035 * scanDirection;
        if (scanY > 2.7) scanDirection = -1;
        if (scanY < -2.5) scanDirection = 1;
        scanLineMesh.position.y = scanY;
      };
    } else if (mode === 'atom') {
      // ⚛️ Atomic Nucleus & Electron Orbits
      const nucGeo = new THREE.SphereGeometry(0.9, 32, 32);
      const nucMat = new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x5a189a, roughness: 0.2 });
      const nucleus = new THREE.Mesh(nucGeo, nucMat);
      hologramGroup.add(nucleus);

      const rings = [];
      for (let r = 0; r < 3; r++) {
        const ringGeo = new THREE.TorusGeometry(2.2 + r * 0.4, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: r === 0 ? 0x00f3ff : (r === 1 ? 0xff0055 : 0x7209b7) });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / (r + 1);
        ring.rotation.y = Math.PI / (r + 2);
        hologramGroup.add(ring);
        rings.push(ring);
      }

      animateCallback = () => {
        nucleus.rotation.y += 0.01;
        rings.forEach((ring, i) => {
          ring.rotation.z += 0.02 * (i + 1);
        });
      };
    } else if (mode === 'planet') {
      // 🪐 Solar System & Planetary Globe
      const planetGeo = new THREE.SphereGeometry(2, 32, 32);
      const planetMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, wireframe: true, emissive: 0x03045e });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      hologramGroup.add(planet);

      const ringGeo = new THREE.RingGeometry(2.6, 3.8, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.5, wireframe: true });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      hologramGroup.add(ring);

      animateCallback = () => {
        planet.rotation.y += 0.006;
        ring.rotation.z += 0.003;
      };
    } else if (mode === 'reactor') {
      // ⚡ Stark Arc Reactor Core
      const coreGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const core = new THREE.Mesh(coreGeo, coreMat);
      hologramGroup.add(core);

      const outerRingGeo = new THREE.TorusGeometry(2.6, 0.1, 16, 100);
      const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      hologramGroup.add(outerRing);

      animateCallback = () => {
        core.rotation.y += 0.02;
        outerRing.rotation.z -= 0.015;
      };
    } else {
      // 🏎️ Engineering Chassis Wireframe
      const boxGeo = new THREE.BoxGeometry(3, 1.5, 3, 8, 8, 8);
      const boxMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
      const box = new THREE.Mesh(boxGeo, boxMat);
      hologramGroup.add(box);

      animateCallback = () => {
        box.rotation.y += 0.01;
        box.rotation.x += 0.005;
      };
    }

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
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    } catch (e) {}

    // Interactive Drag to Rotate
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      hologramGroup.rotation.y += deltaX * 0.01;
      hologramGroup.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animationFrameId;
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      if (autoRotate && !isDragging) {
        animateCallback();
      }
      renderer.render(scene, camera);
    };

    renderLoop();
    handleResize(); // Initial sizing check after DOM attachment

    // Cleanup on unmount
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
      className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing rounded-xl bg-slate-950/80 border border-cyan-500/30 relative overflow-hidden flex items-center justify-center shadow-inner"
    >
      <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded pointer-events-none">
        3D Holographic Rendering • Drag to Rotate 360°
      </div>
    </div>
  );
}
