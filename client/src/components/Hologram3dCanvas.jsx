import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

      // 1. HEAD MASK (Anatomical Mask Head with Tapered Neck)
      const headGeo = new THREE.SphereGeometry(0.72, 32, 24);
      headGeo.scale(0.85, 1.15, 0.92);
      const headMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.25,
        metalness: 0.4,
        emissive: primaryColor,
        emissiveIntensity: 0.25
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 1.85, 0);
      figureGroup.add(headMesh);

      // Neck Collar
      const neckGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.4, 16);
      const neckMat = new THREE.MeshStandardMaterial({ color: isIronSpider ? 0xffd700 : primaryColor, roughness: 0.2, metalness: isIronSpider ? 0.8 : 0.3 });
      const neckMesh = new THREE.Mesh(neckGeo, neckMat);
      neckMesh.position.set(0, 1.35, 0);
      figureGroup.add(neckMesh);

      // Detailed Web Grid Texture Overlay on Mask Head
      const headWebGeo = new THREE.SphereGeometry(0.73, 20, 14);
      headWebGeo.scale(0.85, 1.15, 0.92);
      const headWebMat = new THREE.MeshBasicMaterial({ color: isIronSpider ? 0xffd700 : secondaryColor, wireframe: true, transparent: true, opacity: 0.65 });
      const headWebMesh = new THREE.Mesh(headWebGeo, headWebMat);
      headWebMesh.position.set(0, 1.85, 0);
      figureGroup.add(headWebMesh);

      // 2. SPIDER-MAN EYES / LENSES (Left & Right 3D Angular Expressive Lenses)
      [-0.22, 0.22].forEach(xOffset => {
        // Glowing White Eye Lens
        const eyeGeo = new THREE.CircleGeometry(0.2, 20);
        eyeGeo.scale(0.75, 1.35, 1);
        const eyeMat = new THREE.MeshStandardMaterial({
          color: eyeColor,
          emissive: eyeColor,
          emissiveIntensity: 0.9,
          side: THREE.DoubleSide
        });
        const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        eyeMesh.position.set(xOffset, 1.94, 0.61);
        eyeMesh.rotation.y = xOffset * -0.62;
        eyeMesh.rotation.z = xOffset * 0.35;
        figureGroup.add(eyeMesh);

        // Dark Lens Frame Trim
        const eyeFrameGeo = new THREE.RingGeometry(0.2, 0.27, 20);
        eyeFrameGeo.scale(0.75, 1.35, 1);
        const eyeFrameMat = new THREE.MeshBasicMaterial({ color: 0x020202, side: THREE.DoubleSide });
        const eyeFrameMesh = new THREE.Mesh(eyeFrameGeo, eyeFrameMat);
        eyeFrameMesh.position.set(xOffset, 1.94, 0.605);
        eyeFrameMesh.rotation.y = xOffset * -0.62;
        eyeFrameMesh.rotation.z = xOffset * 0.35;
        figureGroup.add(eyeFrameMesh);
      });

      // 3. TORSO / CHEST & ABS (Muscular Anatomical Chest Plate)
      const chestGeo = new THREE.CylinderGeometry(0.92, 0.68, 1.35, 16);
      const chestMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: isIronSpider ? 0.6 : 0.35,
        emissive: primaryColor,
        emissiveIntensity: 0.15
      });
      const chestMesh = new THREE.Mesh(chestGeo, chestMat);
      chestMesh.position.set(0, 0.65, 0);
      figureGroup.add(chestMesh);

      // Abdominal Muscle Contours (Blue/Navy Lat Side Panels)
      [-0.45, 0.45].forEach(side => {
        const latGeo = new THREE.CylinderGeometry(0.28, 0.22, 1.2, 12);
        const latMat = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.4 });
        const latMesh = new THREE.Mesh(latGeo, latMat);
        latMesh.position.set(side * 0.42, 0.65, -0.05);
        figureGroup.add(latMesh);
      });

      // Suit Web Grid on Chest
      const chestWebGeo = new THREE.CylinderGeometry(0.93, 0.69, 1.36, 14, 6);
      const chestWebMat = new THREE.MeshBasicMaterial({ color: isIronSpider ? 0xffd700 : secondaryColor, wireframe: true, transparent: true, opacity: 0.55 });
      const chestWebMesh = new THREE.Mesh(chestWebGeo, chestWebMat);
      chestWebMesh.position.set(0, 0.65, 0);
      figureGroup.add(chestWebMesh);

      // 4. SPIDER EMBLEM ON CHEST & BACK (Giant Metallic Gold Spider Logo for Iron Spider)
      const emblemGeo = new THREE.OctahedronGeometry(isIronSpider ? 0.45 : 0.3, 1);
      emblemGeo.scale(1.35, 0.75, 0.22);
      const emblemMat = new THREE.MeshStandardMaterial({
        color: emblemColor,
        metalness: isIronSpider ? 0.95 : 0.2,
        roughness: isIronSpider ? 0.1 : 0.5,
        emissive: isIronSpider ? 0xffa500 : 0x000000,
        emissiveIntensity: isIronSpider ? 0.35 : 0.0
      });
      
      // Front Spider Emblem
      const frontEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      frontEmblem.position.set(0, 0.78, 0.64);
      figureGroup.add(frontEmblem);

      // Back Spider Emblem
      const backEmblem = new THREE.Mesh(emblemGeo, emblemMat);
      backEmblem.position.set(0, 0.78, -0.64);
      backEmblem.rotation.y = Math.PI;
      figureGroup.add(backEmblem);

      // Gold Spider Harness Straps stretching over shoulders & ribs for Iron Spider
      if (isIronSpider) {
        [-0.48, 0.48].forEach(x => {
          const strapGeo = new THREE.BoxGeometry(0.18, 0.85, 0.1);
          const strapMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.15, emissive: 0xffaa00, emissiveIntensity: 0.3 });
          const strap = new THREE.Mesh(strapGeo, strapMat);
          strap.position.set(x, 0.85, 0.55);
          strap.rotation.z = x > 0 ? -0.35 : 0.35;
          figureGroup.add(strap);
        });
      }

      // Front Spider Legs
      for (let side = -1; side <= 1; side += 2) {
        for (let legIdx = 0; legIdx < 4; legIdx++) {
          const legGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6);
          const legMat = new THREE.MeshBasicMaterial({ color: emblemColor });
          const leg = new THREE.Mesh(legGeo, legMat);
          const angle = (legIdx - 1.5) * 0.38;
          leg.position.set(side * (0.22 + legIdx * 0.05), 0.82 + side * angle * 0.2, 0.62);
          leg.rotation.z = side * (angle + Math.PI / 4);
          figureGroup.add(leg);
        }
      }

      // 5. HEROIC ARMS & WEB-SHOOTERS (Left Arm Extended in "Thwip" Web Gesture!)
      // Right Shoulder & Arm (Cocked Athletic Stance)
      const rShoulderGeo = new THREE.SphereGeometry(0.34, 16, 16);
      const rShoulderMat = new THREE.MeshStandardMaterial({ color: primaryColor });
      const rShoulder = new THREE.Mesh(rShoulderGeo, rShoulderMat);
      rShoulder.position.set(1.08, 1.2, 0);
      figureGroup.add(rShoulder);

      const rArmGeo = new THREE.CylinderGeometry(0.25, 0.21, 0.85, 12);
      const rArmMat = new THREE.MeshStandardMaterial({ color: secondaryColor });
      const rArm = new THREE.Mesh(rArmGeo, rArmMat);
      rArm.position.set(1.22, 0.7, 0);
      rArm.rotation.z = -0.3;
      figureGroup.add(rArm);

      const rForearmGeo = new THREE.CylinderGeometry(0.21, 0.17, 0.8, 12);
      const rForearmMat = new THREE.MeshStandardMaterial({ color: primaryColor });
      const rForearm = new THREE.Mesh(rForearmGeo, rForearmMat);
      rForearm.position.set(1.35, 0.0, 0.1);
      rForearm.rotation.z = -0.15;
      figureGroup.add(rForearm);

      // Left Shoulder & Arm (Extended Forward in Web-Shooting Gesture)
      const lShoulder = new THREE.Mesh(rShoulderGeo, rShoulderMat);
      lShoulder.position.set(-1.08, 1.2, 0);
      figureGroup.add(lShoulder);

      const lArm = new THREE.Mesh(rArmGeo, rArmMat);
      lArm.position.set(-1.18, 0.85, 0.35);
      lArm.rotation.x = -0.8; // Arm raised forward
      lArm.rotation.z = 0.2;
      figureGroup.add(lArm);

      const lForearm = new THREE.Mesh(rForearmGeo, rForearmMat);
      lForearm.position.set(-1.25, 0.55, 1.0);
      lForearm.rotation.x = -1.1; // Forearm pointing straight out!
      figureGroup.add(lForearm);

      // Silver Metallic Web-Shooter Wrist Gauntlet on Left Hand
      const webShooterGeo = new THREE.TorusGeometry(0.18, 0.04, 12, 24);
      const webShooterMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
      const webShooter = new THREE.Mesh(webShooterGeo, webShooterMat);
      webShooter.position.set(-1.25, 0.35, 1.35);
      webShooter.rotation.x = Math.PI / 2;
      figureGroup.add(webShooter);

      // Laser Web Strand Fired from Web-Shooter Wrist!
      const webStrandGeo = new THREE.CylinderGeometry(0.015, 0.005, 3.5, 8);
      const webStrandMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      const webStrand = new THREE.Mesh(webStrandGeo, webStrandMat);
      webStrand.position.set(-1.25, 0.35, 3.1);
      webStrand.rotation.x = Math.PI / 2;
      figureGroup.add(webStrand);

      // 6. WAIST & LEGS (Athletic Stance with Boots & Knee Pads)
      const waistGeo = new THREE.CylinderGeometry(0.64, 0.58, 0.45, 16);
      const waistMat = new THREE.MeshStandardMaterial({ color: secondaryColor });
      const waist = new THREE.Mesh(waistGeo, waistMat);
      waist.position.set(0, -0.2, 0);
      figureGroup.add(waist);

      [-0.34, 0.34].forEach(xPos => {
        // Thigh (Blue Suit)
        const thighGeo = new THREE.CylinderGeometry(0.27, 0.22, 1.1, 12);
        const thighMat = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.4 });
        const thigh = new THREE.Mesh(thighGeo, thighMat);
        thigh.position.set(xPos, -0.9, 0);
        figureGroup.add(thigh);

        // Knee Pad (Red)
        const kneeGeo = new THREE.SphereGeometry(0.21, 12, 12);
        const kneeMat = new THREE.MeshStandardMaterial({ color: primaryColor });
        const knee = new THREE.Mesh(kneeGeo, kneeMat);
        knee.position.set(xPos, -1.45, 0.1);
        figureGroup.add(knee);

        // Spider Boots (Red)
        const bootGeo = new THREE.CylinderGeometry(0.22, 0.17, 1.0, 12);
        const bootMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.3 });
        const boot = new THREE.Mesh(bootGeo, bootMat);
        boot.position.set(xPos, -1.95, 0.05);
        figureGroup.add(boot);
      });

      // 7. IRON SPIDER NANOTECH MECHANICAL ARMS / WALPERS
      if (hasSpiderLegs) {
        for (let l = 0; l < 4; l++) {
          const side = l % 2 === 0 ? 1 : -1;
          const isUpper = l < 2;

          const armLegGroup = new THREE.Group();
          armLegGroup.position.set(side * 0.3, 0.9, -0.3);

          const seg1Geo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
          const seg1Mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.15, emissive: 0xffa500, emissiveIntensity: 0.35 });
          const seg1 = new THREE.Mesh(seg1Geo, seg1Mat);
          seg1.position.set(side * 0.7, isUpper ? 0.8 : -0.4, -0.5);
          seg1.rotation.z = side * (isUpper ? -0.8 : -0.4);
          seg1.rotation.x = isUpper ? 0.6 : -0.6;

          const clawGeo = new THREE.ConeGeometry(0.06, 0.6, 6);
          const clawMat = new THREE.MeshStandardMaterial({ color: 0xff0033, metalness: 0.9, roughness: 0.1 });
          const claw = new THREE.Mesh(clawGeo, clawMat);
          claw.position.set(side * 1.3, isUpper ? 1.4 : -0.9, -0.8);
          claw.rotation.z = side * -1.2;

          armLegGroup.add(seg1);
          armLegGroup.add(claw);
          figureGroup.add(armLegGroup);
        }
      }

      // 8. SCI-FI STARK HUD LASER SCAN LINE & HOLO-RINGS
      // Laser Scan Line moving up and down body
      const scanLineGeo = new THREE.RingGeometry(0.1, 2.6, 32);
      const scanLineMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
      scanLineMesh.rotation.x = Math.PI / 2;
      scanLineMesh.position.y = 0;
      hologramGroup.add(scanLineMesh);

      // Concentric Orbiting Stark HUD Telemetry Rings
      const ring1Geo = new THREE.TorusGeometry(2.8, 0.015, 16, 80);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.6 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 2.2;
      hologramGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(3.2, 0.012, 16, 80);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.5 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = Math.PI / 1.8;
      hologramGroup.add(ring2);

      // Holographic Cyber Base Pedestal
      const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.25, 32);
      const pedestalMat = new THREE.MeshBasicMaterial({ color: secondaryColor, wireframe: true, transparent: true, opacity: 0.65 });
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

      // Animation Loop for Hero & Laser Scan Line
      let scanY = -2.5;
      let scanDirection = 1;

      animateCallback = () => {
        figureGroup.rotation.y += 0.008;
        pedestal.rotation.y -= 0.005;
        particles.rotation.y += 0.003;
        ring1.rotation.z += 0.006;
        ring2.rotation.z -= 0.008;

        // Laser scan line vertical animation
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
