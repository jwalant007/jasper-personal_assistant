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

      if (spidermanSuit === 'ironspider') {
        // Iron Spider Nanotech (Gold & Crimson)
        primaryColor = 0xcc0022; // Metallic Crimson
        secondaryColor = 0xffd700; // Gold Web Trim
        eyeColor = 0x00f3ff; // Glowing Blue Nanotech Lenses
        emblemColor = 0xffd700; // Giant Gold Spider Emblem
        particleColor = 0xffd700;
        hasSpiderLegs = true;
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

      // 1. HEAD MASK (Anatomical Mask Head)
      const headGeo = new THREE.SphereGeometry(0.7, 32, 24);
      headGeo.scale(0.85, 1.1, 0.9);
      const headMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: 0.4,
        emissive: primaryColor,
        emissiveIntensity: 0.2
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 1.8, 0);
      figureGroup.add(headMesh);

      // Wireframe overlay on head for suit web texture
      const headWebGeo = new THREE.SphereGeometry(0.71, 16, 12);
      headWebGeo.scale(0.85, 1.1, 0.9);
      const headWebMat = new THREE.MeshBasicMaterial({ color: secondaryColor, wireframe: true, transparent: true, opacity: 0.6 });
      const headWebMesh = new THREE.Mesh(headWebGeo, headWebMat);
      headWebMesh.position.set(0, 1.8, 0);
      figureGroup.add(headWebMesh);

      // 2. SPIDER-MAN EYES / LENSES (Left & Right Glowing Angular Lenses)
      [-0.22, 0.22].forEach(xOffset => {
        const eyeGeo = new THREE.CircleGeometry(0.18, 16);
        eyeGeo.scale(0.8, 1.3, 1);
        const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor, side: THREE.DoubleSide });
        const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
        eyeMesh.position.set(xOffset, 1.88, 0.58);
        eyeMesh.rotation.y = xOffset * -0.6;
        eyeMesh.rotation.z = xOffset * 0.4;
        figureGroup.add(eyeMesh);

        // Dark Lens Frame Trim
        const eyeFrameGeo = new THREE.RingGeometry(0.18, 0.24, 16);
        eyeFrameGeo.scale(0.8, 1.3, 1);
        const eyeFrameMat = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide });
        const eyeFrameMesh = new THREE.Mesh(eyeFrameGeo, eyeFrameMat);
        eyeFrameMesh.position.set(xOffset, 1.88, 0.575);
        eyeFrameMesh.rotation.y = xOffset * -0.6;
        eyeFrameMesh.rotation.z = xOffset * 0.4;
        figureGroup.add(eyeFrameMesh);
      });

      // 3. TORSO / CHEST (Muscular Tapered Upper Body)
      const chestGeo = new THREE.CylinderGeometry(0.9, 0.65, 1.4, 16);
      const chestMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.4,
        metalness: 0.3,
        emissive: primaryColor,
        emissiveIntensity: 0.15
      });
      const chestMesh = new THREE.Mesh(chestGeo, chestMat);
      chestMesh.position.set(0, 0.7, 0);
      figureGroup.add(chestMesh);

      // Suit Web Grid on Chest
      const chestWebGeo = new THREE.CylinderGeometry(0.91, 0.66, 1.41, 12, 6);
      const chestWebMat = new THREE.MeshBasicMaterial({ color: secondaryColor, wireframe: true, transparent: true, opacity: 0.5 });
      const chestWebMesh = new THREE.Mesh(chestWebGeo, chestWebMat);
      chestWebMesh.position.set(0, 0.7, 0);
      figureGroup.add(chestWebMesh);

      // 4. SPIDER EMBLEM ON CHEST (Iconic Spider Logo)
      const emblemGeo = new THREE.OctahedronGeometry(0.28, 1);
      emblemGeo.scale(1.2, 0.6, 0.2);
      const emblemMat = new THREE.MeshBasicMaterial({ color: emblemColor });
      const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
      emblemMesh.position.set(0, 0.82, 0.62);
      figureGroup.add(emblemMesh);

      // Spider Legs Extending from Chest Emblem
      for (let side = -1; side <= 1; side += 2) {
        for (let legIdx = 0; legIdx < 4; legIdx++) {
          const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6);
          const legMat = new THREE.MeshBasicMaterial({ color: emblemColor });
          const leg = new THREE.Mesh(legGeo, legMat);
          const angle = (legIdx - 1.5) * 0.35;
          leg.position.set(side * (0.2 + legIdx * 0.05), 0.85 + side * angle * 0.2, 0.6);
          leg.rotation.z = side * (angle + Math.PI / 4);
          figureGroup.add(leg);
        }
      }

      // 5. SHOULDERS & ARMS (Left & Right Biceps & Forearms)
      [-1, 1].forEach(side => {
        // Shoulder Joint
        const shoulderGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const shoulderMat = new THREE.MeshStandardMaterial({ color: primaryColor });
        const shoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
        shoulder.position.set(side * 1.05, 1.25, 0);
        figureGroup.add(shoulder);

        // Biceps
        const armGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.9, 12);
        const armMat = new THREE.MeshStandardMaterial({ color: secondaryColor });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(side * 1.2, 0.75, 0);
        arm.rotation.z = side * -0.25;
        figureGroup.add(arm);

        // Web-Shooter Forearm / Gloves (Red)
        const forearmGeo = new THREE.CylinderGeometry(0.2, 0.16, 0.8, 12);
        const forearmMat = new THREE.MeshStandardMaterial({ color: primaryColor });
        const forearm = new THREE.Mesh(forearmGeo, forearmMat);
        forearm.position.set(side * 1.35, 0.05, 0.1);
        forearm.rotation.z = side * -0.15;
        figureGroup.add(forearm);
      });

      // 6. WAIST & LEGS (Hips, Thighs & Boots)
      const waistGeo = new THREE.CylinderGeometry(0.62, 0.58, 0.5, 16);
      const waistMat = new THREE.MeshStandardMaterial({ color: secondaryColor });
      const waist = new THREE.Mesh(waistGeo, waistMat);
      waist.position.set(0, -0.15, 0);
      figureGroup.add(waist);

      [-0.32, 0.32].forEach(xPos => {
        // Thigh (Blue)
        const thighGeo = new THREE.CylinderGeometry(0.26, 0.22, 1.1, 12);
        const thighMat = new THREE.MeshStandardMaterial({ color: secondaryColor });
        const thigh = new THREE.Mesh(thighGeo, thighMat);
        thigh.position.set(xPos, -0.85, 0);
        figureGroup.add(thigh);

        // Boots (Red)
        const bootGeo = new THREE.CylinderGeometry(0.21, 0.16, 1.1, 12);
        const bootMat = new THREE.MeshStandardMaterial({ color: primaryColor });
        const boot = new THREE.Mesh(bootGeo, bootMat);
        boot.position.set(xPos, -1.85, 0.05);
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
          const seg1Mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2, emissive: 0xffa500, emissiveIntensity: 0.3 });
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

      // 8. HOLOGRAPHIC CYBER PEDESTAL & WEB PARTICLES
      const pedestalGeo = new THREE.CylinderGeometry(2.2, 2.5, 0.2, 32);
      const pedestalMat = new THREE.MeshBasicMaterial({ color: secondaryColor, wireframe: true, transparent: true, opacity: 0.6 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(0, -2.4, 0);
      hologramGroup.add(pedestal);

      const particleGeo = new THREE.BufferGeometry();
      const count = 400;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 7;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const particleMat = new THREE.PointsMaterial({ size: 0.05, color: particleColor, transparent: true, opacity: 0.8 });
      const particles = new THREE.Points(particleGeo, particleMat);
      hologramGroup.add(particles);

      animateCallback = () => {
        figureGroup.rotation.y += 0.008;
        pedestal.rotation.y -= 0.005;
        particles.rotation.y += 0.003;
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
