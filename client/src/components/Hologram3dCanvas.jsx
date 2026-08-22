import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hologram3dCanvas({ mode = 'spiderman', autoRotate = true }) {
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

    // Objects depending on mode
    let animateCallback = () => {};

    if (mode === 'spiderman') {
      // 🕸️ Spider-Man Web & Cyber Lattice
      const geo = new THREE.IcosahedronGeometry(2.5, 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        wireframe: true,
        transparent: true,
        opacity: 0.65
      });
      const webMesh = new THREE.Mesh(geo, mat);
      hologramGroup.add(webMesh);

      // Inner Core Node
      const coreGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      hologramGroup.add(coreMesh);

      // Outer Web Particles
      const particleGeo = new THREE.BufferGeometry();
      const count = 300;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 8;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const particleMat = new THREE.PointsMaterial({ size: 0.05, color: 0x00f3ff, transparent: true, opacity: 0.8 });
      const particles = new THREE.Points(particleGeo, particleMat);
      hologramGroup.add(particles);

      animateCallback = () => {
        webMesh.rotation.y += 0.008;
        webMesh.rotation.x += 0.004;
        coreMesh.rotation.y -= 0.015;
        particles.rotation.y += 0.002;
      };
    } else if (mode === 'atom') {
      // ⚛️ Atomic Nucleus & Electron Orbits
      const nucGeo = new THREE.SphereGeometry(0.9, 32, 32);
      const nucMat = new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x5a189a, roughness: 0.2 });
      const nucleus = new THREE.Mesh(nucGeo, nucMat);
      hologramGroup.add(nucleus);

      // 3 Electron Ring Orbits
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
      const planetMat = new THREE.MeshStandardMaterial({
        color: 0x0077b6,
        wireframe: true,
        emissive: 0x03045e,
        wireframeLinewidth: 1.5
      });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      hologramGroup.add(planet);

      // Saturn-like Atmosphere Ring
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

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
      renderer.dispose();
    };
  }, [mode, autoRotate]);

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
