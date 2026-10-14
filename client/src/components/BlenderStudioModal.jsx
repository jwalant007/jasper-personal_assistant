import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import DraggableModalWrapper from './DraggableModalWrapper';
import { getApiBase } from '../utils/apiConfig';
import { 
  Box, 
  Layers, 
  Play, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Terminal, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Settings,
  FolderOpen,
  RotateCcw,
  Eye,
  EyeOff,
  Sliders,
  Plus,
  Trash2,
  Copy,
  Save,
  Camera,
  Code,
  Sun,
  Wand2,
  Palette
} from 'lucide-react';

function Blender3dCanvas({ glbUrl, objectType = 'torus', color = '#00f0ff', autoRotate = true, wireframe = false }) {
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const [modelLoading, setModelLoading] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3.5, 2.5, 4.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 1;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const hexColor = parseInt((color || '#00f0ff').replace('#', '0x'), 16) || 0x00f0ff;
    const pointLight = new THREE.PointLight(hexColor, 2.5, 10);
    pointLight.position.set(-3, -2, -3);
    scene.add(pointLight);

    // Floor Grid
    const gridHelper = new THREE.GridHelper(8, 20, hexColor, 0x1e293b);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let currentModel = null;
    let fallbackMesh = null;

    const createPlaceholder = () => {
      let geo;
      const lowerType = (objectType || 'torus').toLowerCase();
      if (lowerType.includes('sphere')) geo = new THREE.SphereGeometry(1.2, 32, 16);
      else if (lowerType.includes('cube')) geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      else if (lowerType.includes('spider') || lowerType.includes('suit') || lowerType.includes('hero')) geo = new THREE.CapsuleGeometry(0.8, 1.6, 16, 32);
      else geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);

      const mat = new THREE.MeshStandardMaterial({
        color: hexColor,
        metalness: 0.85,
        roughness: 0.2,
        wireframe: wireframe
      });
      fallbackMesh = new THREE.Mesh(geo, mat);

      const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
      const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireMat);
      fallbackMesh.add(wire);
      modelGroup.add(fallbackMesh);
    };

    createPlaceholder();

    if (glbUrl) {
      setModelLoading(true);
      const fullUrl = glbUrl.startsWith('http') ? glbUrl : `${getApiBase()}${glbUrl}`;
      const loader = new GLTFLoader();
      loader.load(
        fullUrl,
        (gltf) => {
          if (fallbackMesh) {
            modelGroup.remove(fallbackMesh);
            fallbackMesh = null;
          }
          currentModel = gltf.scene;

          currentModel.traverse((child) => {
            if (child.isMesh) {
              child.material.wireframe = wireframe;
              try {
                const wireGeo = new THREE.WireframeGeometry(child.geometry);
                const wireMat = new THREE.LineBasicMaterial({
                  color: hexColor,
                  transparent: true,
                  opacity: 0.4
                });
                child.add(new THREE.LineSegments(wireGeo, wireMat));
              } catch (_) {}
            }
          });

          const box = new THREE.Box3().setFromObject(currentModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 2.4 / maxDim;

          currentModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          currentModel.scale.setScalar(scale);
          modelGroup.add(currentModel);
          setModelLoading(false);
        },
        undefined,
        (err) => {
          console.warn('[Blender3dCanvas] GLB load fallback to procedural mesh:', err.message);
          setModelLoading(false);
        }
      );
    }

    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (autoRotate) {
        modelGroup.rotation.y += 0.008;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [glbUrl, objectType, color, autoRotate, wireframe]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs pointer-events-none">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>SYNTHESIZING 3D SPATIAL MODEL...</span>
          </div>
        </div>
      )}

      <div className="absolute top-2 left-2 pointer-events-none text-[9px] font-mono text-cyan-400/80 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>WEBGL THREE.JS • 60 FPS</span>
      </div>

      <div className="absolute top-2 right-2 pointer-events-none text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
        DRAG: ORBIT • SCROLL: ZOOM
      </div>

      <div className="absolute bottom-2 right-2 flex items-center space-x-1 bg-slate-950/80 p-1 rounded-md border border-slate-800 text-[10px] font-mono">
        <button
          onClick={handleResetCamera}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
          title="Reset Camera Angle"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 3D GRAPHIC CREATOR CONSTANTS, UTILITIES & PRESETS
// ============================================================================

const CREATOR_PRESETS = [
  {
    id: 'arc_reactor',
    name: 'Stark Arc Reactor',
    desc: 'Concentric energy toruses with hyper-dense plasma core',
    objects: [
      {
        id: 'arc_core_1',
        name: 'Inner Core Ring',
        type: 'torus',
        color: '#00f0ff',
        materialType: 'neon',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1.2, 1.2, 1.2],
        roughness: 0.1,
        metalness: 0.2,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: true
      },
      {
        id: 'arc_outer_ring',
        name: 'Magnetic Housing Ring',
        type: 'torus',
        color: '#38bdf8',
        materialType: 'metallic',
        position: [0, 0, 0],
        rotation: [70, 45, 0],
        scale: [1.7, 1.7, 1.7],
        roughness: 0.15,
        metalness: 0.95,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: true
      },
      {
        id: 'arc_plasma_orb',
        name: 'Singularity Orb',
        type: 'sphere',
        color: '#ffffff',
        materialType: 'neon',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.45, 0.45, 0.45],
        roughness: 0.05,
        metalness: 0.1,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      },
      {
        id: 'arc_pylon_top',
        name: 'Top Anode Pillar',
        type: 'cylinder',
        color: '#1e293b',
        materialType: 'metallic',
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [0.25, 0.45, 0.25],
        roughness: 0.3,
        metalness: 0.9,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      },
      {
        id: 'arc_pylon_bottom',
        name: 'Bottom Cathode Pillar',
        type: 'cylinder',
        color: '#1e293b',
        materialType: 'metallic',
        position: [0, -1.5, 0],
        rotation: [0, 0, 0],
        scale: [0.25, 0.45, 0.25],
        roughness: 0.3,
        metalness: 0.9,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      }
    ]
  },
  {
    id: 'quantum_hyperdrive',
    name: 'Quantum Hyperdrive Core',
    desc: 'Torus knot singularity enclosed in polyhedral lattice cage',
    objects: [
      {
        id: 'q_knot',
        name: 'Singularity Knot',
        type: 'torusknot',
        color: '#a855f7',
        materialType: 'neon',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.9, 0.9, 0.9],
        roughness: 0.1,
        metalness: 0.3,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: true
      },
      {
        id: 'q_cage',
        name: 'Containment Lattice',
        type: 'icosahedron',
        color: '#00f0ff',
        materialType: 'wireframe',
        position: [0, 0, 0],
        rotation: [20, 30, 45],
        scale: [1.8, 1.8, 1.8],
        roughness: 0.2,
        metalness: 0.8,
        opacity: 0.8,
        visible: true,
        wireframe: true,
        spin: true
      },
      {
        id: 'q_shield_ring',
        name: 'Equatorial Shield Ring',
        type: 'ring',
        color: '#ec4899',
        materialType: 'neon',
        position: [0, 0, 0],
        rotation: [90, 0, 0],
        scale: [1.6, 1.6, 1.6],
        roughness: 0.1,
        metalness: 0.4,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      }
    ]
  },
  {
    id: 'cyber_monolith',
    name: 'Cybernetic Monolith',
    desc: 'Futuristic obsidian obelisk with pulsing twin data halos',
    objects: [
      {
        id: 'mono_pylon',
        name: 'Obsidian Monolith',
        type: 'cube',
        color: '#0f172a',
        materialType: 'metallic',
        position: [0, 0, 0],
        rotation: [0, 45, 0],
        scale: [0.75, 2.4, 0.75],
        roughness: 0.1,
        metalness: 0.95,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      },
      {
        id: 'mono_halo_top',
        name: 'Upper Beacon Ring',
        type: 'torus',
        color: '#00f0ff',
        materialType: 'neon',
        position: [0, 1.15, 0],
        rotation: [90, 0, 0],
        scale: [0.85, 0.85, 0.85],
        roughness: 0.1,
        metalness: 0.2,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: true
      },
      {
        id: 'mono_halo_bot',
        name: 'Lower Beacon Ring',
        type: 'torus',
        color: '#10b981',
        materialType: 'neon',
        position: [0, -1.15, 0],
        rotation: [90, 0, 0],
        scale: [0.85, 0.85, 0.85],
        roughness: 0.1,
        metalness: 0.2,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: true
      },
      {
        id: 'mono_core',
        name: 'Hyper Crystal Gem',
        type: 'octahedron',
        color: '#f59e0b',
        materialType: 'neon',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.55, 0.55, 0.55],
        roughness: 0.05,
        metalness: 0.1,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: true
      }
    ]
  },
  {
    id: 'deep_space_probe',
    name: 'Deep Space Satellite',
    desc: 'Autonomous orbital probe with sensor cone and dual solar panels',
    objects: [
      {
        id: 'probe_chassis',
        name: 'Avionics Core',
        type: 'dodecahedron',
        color: '#334155',
        materialType: 'metallic',
        position: [0, 0, 0],
        rotation: [15, 25, 0],
        scale: [0.95, 0.95, 0.95],
        roughness: 0.25,
        metalness: 0.9,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      },
      {
        id: 'probe_dish',
        name: 'High-Gain Dish',
        type: 'cone',
        color: '#38bdf8',
        materialType: 'metallic',
        position: [0, 1.35, 0],
        rotation: [180, 0, 0],
        scale: [0.85, 0.5, 0.85],
        roughness: 0.2,
        metalness: 0.85,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      },
      {
        id: 'probe_solar_l',
        name: 'Port Solar Wing',
        type: 'cube',
        color: '#0284c7',
        materialType: 'glass',
        position: [-1.8, 0, 0],
        rotation: [0, 0, 0],
        scale: [1.3, 0.06, 0.65],
        roughness: 0.1,
        metalness: 0.5,
        opacity: 0.75,
        visible: true,
        wireframe: false,
        spin: false
      },
      {
        id: 'probe_solar_r',
        name: 'Starboard Solar Wing',
        type: 'cube',
        color: '#0284c7',
        materialType: 'glass',
        position: [1.8, 0, 0],
        rotation: [0, 0, 0],
        scale: [1.3, 0.06, 0.65],
        roughness: 0.1,
        metalness: 0.5,
        opacity: 0.75,
        visible: true,
        wireframe: false,
        spin: false
      },
      {
        id: 'probe_sensor',
        name: 'Telemetry Beacon',
        type: 'sphere',
        color: '#ef4444',
        materialType: 'neon',
        position: [0, -1.15, 0],
        rotation: [0, 0, 0],
        scale: [0.28, 0.28, 0.28],
        roughness: 0.1,
        metalness: 0.2,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: false
      }
    ]
  },
  {
    id: 'blank_canvas',
    name: 'Blank Canvas',
    desc: 'Clean workspace starting with a single configurable primitive',
    objects: [
      {
        id: 'obj_custom_1',
        name: 'Root Primitive',
        type: 'torus',
        color: '#00f0ff',
        materialType: 'neon',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1.2, 1.2, 1.2],
        roughness: 0.1,
        metalness: 0.2,
        opacity: 1,
        visible: true,
        wireframe: false,
        spin: true
      }
    ]
  }
];

function createNewObject(type = 'cube') {
  const id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const colors = ['#00f0ff', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#38bdf8', '#ef4444'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const shapeNames = {
    torus: 'Arc Ring',
    torusknot: 'Energy Knot',
    sphere: 'Orb Sphere',
    cube: 'Tech Cube',
    cylinder: 'Power Column',
    cone: 'Spike Cone',
    icosahedron: 'Poly Core',
    dodecahedron: 'Lattice Node',
    octahedron: 'Prism Gem',
    ring: 'Planar Disk',
    capsule: 'Nanotech Capsule'
  };
  return {
    id,
    name: shapeNames[type] || 'New Shape',
    type,
    color: randomColor,
    materialType: 'metallic',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    roughness: 0.2,
    metalness: 0.85,
    opacity: 1,
    visible: true,
    wireframe: false,
    spin: false
  };
}

function generateBlenderPythonScript(title, objects = [], sceneSettings = {}) {
  const hexToRgb = (hex) => {
    const clean = (hex || '#00f0ff').replace('#', '');
    const num = parseInt(clean, 16) || 0x00f0ff;
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  };

  let py = `import bpy\nimport math\n\n`;
  py += `# ==============================================================================\n`;
  py += `# J.A.S.P.E.R. 3D Engine - Auto-Generated Blender bpy Scene\n`;
  py += `# Title: ${title || 'Custom 3D Graphic'}\n`;
  py += `# Generated: ${new Date().toISOString()}\n`;
  py += `# Elements: ${objects.length}\n`;
  py += `# ==============================================================================\n\n`;
  py += `# 1. Clear existing scene\n`;
  py += `bpy.ops.wm.read_factory_settings(use_empty=True)\n\n`;
  py += `# 2. Setup Context & Engine\n`;
  py += `scene = bpy.context.scene\n`;
  py += `try:\n`;
  py += `    scene.render.engine = 'BLENDER_EEVEE_NEXT'\n`;
  py += `except Exception:\n`;
  py += `    scene.render.engine = 'BLENDER_EEVEE'\n\n`;
  py += `# 3. Setup Camera & 3-Point Cyber Studio Lighting\n`;
  py += `bpy.ops.object.camera_add(location=(4.0, -4.5, 3.5), rotation=(math.radians(60), 0, math.radians(45)))\n`;
  py += `scene.camera = bpy.context.active_object\n\n`;
  py += `# Key Light\n`;
  py += `bpy.ops.object.light_add(type='POINT', radius=1.0, location=(4.0, 3.0, 5.0))\n`;
  py += `key_light = bpy.context.active_object\n`;
  py += `key_light.data.energy = 800\n`;
  py += `key_light.data.color = (1.0, 1.0, 1.0)\n\n`;
  py += `# Cyber Rim Light\n`;
  py += `bpy.ops.object.light_add(type='POINT', radius=1.5, location=(-4.0, -3.0, -2.0))\n`;
  py += `rim_light = bpy.context.active_object\n`;
  py += `rim_light.data.energy = 600\n`;
  py += `rim_light.data.color = (0.0, 0.94, 1.0)\n\n`;

  objects.forEach((obj, idx) => {
    const safeName = (obj.name || `Object_${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, '_');
    const [r, g, b] = hexToRgb(obj.color);
    const px = obj.position?.[0] || 0;
    const pyPos = -(obj.position?.[2] || 0);
    const pz = obj.position?.[1] || 0;
    const rx = obj.rotation?.[0] || 0;
    const ry = obj.rotation?.[2] || 0;
    const rz = obj.rotation?.[1] || 0;
    const sx = obj.scale?.[0] || 1;
    const sy = obj.scale?.[2] || 1;
    const sz = obj.scale?.[1] || 1;

    py += `# --- Mesh ${idx + 1}: ${obj.name} (${obj.type}) ---\n`;
    switch (obj.type) {
      case 'torus':
        py += `bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.28, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        break;
      case 'sphere':
        py += `bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        break;
      case 'cube':
        py += `bpy.ops.mesh.primitive_cube_add(size=1.5, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        break;
      case 'cylinder':
        py += `bpy.ops.mesh.primitive_cylinder_add(radius=0.7, depth=2.0, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        break;
      case 'cone':
        py += `bpy.ops.mesh.primitive_cone_add(radius1=0.9, depth=2.0, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        break;
      case 'icosahedron':
        py += `bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.1, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        break;
      case 'torusknot':
        py += `try:\n`;
        py += `    bpy.ops.mesh.primitive_torus_add(major_radius=0.8, minor_radius=0.25, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        py += `except Exception:\n`;
        py += `    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
        break;
      default:
        py += `bpy.ops.mesh.primitive_cube_add(size=1.2, location=(${px.toFixed(3)}, ${pyPos.toFixed(3)}, ${pz.toFixed(3)}))\n`;
    }
    py += `mesh_obj = bpy.context.active_object\n`;
    py += `mesh_obj.name = "${safeName}"\n`;
    py += `mesh_obj.rotation_euler = (math.radians(${rx.toFixed(1)}), math.radians(${ry.toFixed(1)}), math.radians(${rz.toFixed(1)}))\n`;
    py += `mesh_obj.scale = (${sx.toFixed(3)}, ${sy.toFixed(3)}, ${sz.toFixed(3)})\n\n`;

    py += `mat_${idx} = bpy.data.materials.new(name="Mat_${safeName}")\n`;
    py += `mat_${idx}.use_nodes = True\n`;
    py += `nodes_${idx} = mat_${idx}.node_tree.nodes\n`;
    py += `bsdf_${idx} = nodes_${idx}.get("Principled BSDF")\n`;
    py += `if bsdf_${idx}:\n`;
    py += `    bsdf_${idx}.inputs['Base Color'].default_value = (${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}, 1.0)\n`;
    if (obj.materialType === 'neon') {
      py += `    try:\n`;
      py += `        bsdf_${idx}.inputs['Emission Color'].default_value = (${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}, 1.0)\n`;
      py += `        bsdf_${idx}.inputs['Emission Strength'].default_value = 5.0\n`;
      py += `    except Exception:\n`;
      py += `        bsdf_${idx}.inputs['Emission'].default_value = (${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}, 1.0)\n`;
    } else if (obj.materialType === 'metallic') {
      py += `    bsdf_${idx}.inputs['Metallic'].default_value = ${(obj.metalness ?? 0.9).toFixed(2)}\n`;
      py += `    bsdf_${idx}.inputs['Roughness'].default_value = ${(obj.roughness ?? 0.15).toFixed(2)}\n`;
    } else if (obj.materialType === 'glass') {
      py += `    try:\n`;
      py += `        bsdf_${idx}.inputs['Transmission Weight'].default_value = 0.85\n`;
      py += `        bsdf_${idx}.inputs['Roughness'].default_value = 0.1\n`;
      py += `    except Exception:\n`;
      py += `        bsdf_${idx}.inputs['Metallic'].default_value = 0.1\n`;
    } else {
      py += `    bsdf_${idx}.inputs['Roughness'].default_value = ${(obj.roughness ?? 0.6).toFixed(2)}\n`;
    }
    py += `mesh_obj.data.materials.append(mat_${idx})\n\n`;
  });

  py += `print("[JASPER 3D] Scene '${title || 'Scene'}' constructed with ${objects.length} meshes successfully.")\n`;
  return py;
}

const Creator3dCanvas = React.forwardRef(function Creator3dCanvas({
  objects = [],
  selectedId = null,
  onSelectObject,
  sceneSettings = {}
}, ref) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const objectsGroupRef = useRef(null);
  const particlesRef = useRef(null);
  const gridRef = useRef(null);
  const sceneSettingsRef = useRef(sceneSettings);
  sceneSettingsRef.current = sceneSettings;

  React.useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
      try {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      } catch (err) {
        console.warn('Snapshot capture failed:', err);
        return null;
      }
    },
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(3.5, 2.5, 4.0);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }), []);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3.5, 2.5, 4.0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 20;
    controls.minDistance = 1;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 2.5, 12);
    pointLight.position.set(-3, -2, -3);
    scene.add(pointLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(12, 24, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);
    gridRef.current = gridHelper;

    // Cosmic Particle Cloud
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = (Math.random() - 0.5) * 18;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.55
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Objects Group
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);
    objectsGroupRef.current = objectsGroup;

    // Pointer down handler for raycasting selection
    const handlePointerDown = (e) => {
      if (!containerRef.current || !cameraRef.current || !objectsGroupRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(objectsGroupRef.current.children, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.id && hit.parent && hit.parent !== objectsGroupRef.current) {
          hit = hit.parent;
        }
        if (hit?.userData?.id && onSelectObject) {
          onSelectObject(hit.userData.id);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (sceneSettingsRef.current?.autoRotate && objectsGroupRef.current) {
        objectsGroupRef.current.rotation.y += sceneSettingsRef.current?.rotateSpeed || 0.008;
      }

      if (objectsGroupRef.current) {
        objectsGroupRef.current.children.forEach(child => {
          if (child.userData?.spin) {
            child.rotation.y += 0.02;
          }
        });
      }

      if (particlesRef.current && sceneSettingsRef.current?.particles !== false) {
        particlesRef.current.rotation.y += 0.0008;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(reqId);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Grid & Particle Visibility
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = sceneSettings.grid !== false;
    }
    if (particlesRef.current) {
      particlesRef.current.visible = sceneSettings.particles !== false;
    }
    if (sceneRef.current && sceneSettings.bgColor) {
      sceneRef.current.background = new THREE.Color(sceneSettings.bgColor);
    }
  }, [sceneSettings.grid, sceneSettings.particles, sceneSettings.bgColor]);

  // Rebuild 3D Meshes when objects, selectedId, or wireframeAll changes
  useEffect(() => {
    const group = objectsGroupRef.current;
    if (!group) return;

    // Clear previous meshes
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    objects.forEach(obj => {
      let geo;
      switch (obj.type) {
        case 'torus':
          geo = new THREE.TorusGeometry(1.0, 0.28, 24, 48);
          break;
        case 'torusknot':
          geo = new THREE.TorusKnotGeometry(0.8, 0.25, 64, 16);
          break;
        case 'sphere':
          geo = new THREE.SphereGeometry(1.0, 32, 24);
          break;
        case 'cube':
          geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
          break;
        case 'cylinder':
          geo = new THREE.CylinderGeometry(0.7, 0.7, 2.0, 32);
          break;
        case 'cone':
          geo = new THREE.ConeGeometry(0.9, 2.0, 32);
          break;
        case 'icosahedron':
          geo = new THREE.IcosahedronGeometry(1.1, 0);
          break;
        case 'dodecahedron':
          geo = new THREE.DodecahedronGeometry(1.1, 0);
          break;
        case 'octahedron':
          geo = new THREE.OctahedronGeometry(1.1, 0);
          break;
        case 'ring':
          geo = new THREE.RingGeometry(0.6, 1.4, 32);
          break;
        case 'capsule':
          geo = new THREE.CapsuleGeometry(0.6, 1.2, 16, 24);
          break;
        default:
          geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      }

      const hexColor = parseInt((obj.color || '#00f0ff').replace('#', '0x'), 16) || 0x00f0ff;
      const isWire = sceneSettings.wireframeAll || !!obj.wireframe;
      let mat;

      if (obj.materialType === 'neon') {
        mat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: 0.85,
          roughness: 0.1,
          metalness: 0.2,
          wireframe: isWire
        });
      } else if (obj.materialType === 'glass') {
        mat = new THREE.MeshPhysicalMaterial({
          color: hexColor,
          roughness: 0.1,
          transmission: 0.85,
          thickness: 1.2,
          transparent: true,
          opacity: obj.opacity ?? 0.65,
          wireframe: isWire
        });
      } else if (obj.materialType === 'wireframe') {
        mat = new THREE.MeshBasicMaterial({
          color: hexColor,
          wireframe: true
        });
      } else if (obj.materialType === 'matte') {
        mat = new THREE.MeshStandardMaterial({
          color: hexColor,
          roughness: 0.85,
          metalness: 0.05,
          wireframe: isWire
        });
      } else {
        // Metallic
        mat = new THREE.MeshStandardMaterial({
          color: hexColor,
          roughness: obj.roughness ?? 0.18,
          metalness: obj.metalness ?? 0.9,
          wireframe: isWire
        });
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(obj.position?.[0] || 0, obj.position?.[1] || 0, obj.position?.[2] || 0);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(obj.rotation?.[0] || 0),
        THREE.MathUtils.degToRad(obj.rotation?.[1] || 0),
        THREE.MathUtils.degToRad(obj.rotation?.[2] || 0)
      );
      mesh.scale.set(obj.scale?.[0] || 1, obj.scale?.[1] || 1, obj.scale?.[2] || 1);
      mesh.visible = obj.visible !== false;
      mesh.userData = { id: obj.id, spin: !!obj.spin };

      // Selection Ring / Wireframe Halo
      if (obj.id === selectedId) {
        try {
          const wireGeo = new THREE.WireframeGeometry(geo);
          const wireMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85
          });
          const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
          wireMesh.scale.multiplyScalar(1.02);
          mesh.add(wireMesh);
        } catch (_) {}
      }

      group.add(mesh);
    });
  }, [objects, selectedId, sceneSettings.wireframeAll]);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      <div className="absolute top-2 left-2 pointer-events-none text-[9px] font-mono text-cyan-400/80 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>3D CANVAS • REALTIME ENGINE</span>
      </div>

      <div className="absolute top-2 right-2 pointer-events-none text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
        DRAG: ORBIT • SCROLL: ZOOM • CLICK: SELECT
      </div>
    </div>
  );
});

export default function BlenderStudioModal({ isOpen = true, onClose, embedded = false, onProjectToHologram = null }) {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'python' | 'render' | 'settings'
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Generator State
  const [prompt, setPrompt] = useState('Futuristic Stark Arc Core Ring');
  const [objectType, setObjectType] = useState('torus');
  const [color, setColor] = useState('#00f0ff');
  const [metallic, setMetallic] = useState(0.85);
  const [roughness, setRoughness] = useState(0.18);
  const [customText, setCustomText] = useState('JASPER 3D');
  const [lastGenerated, setLastGenerated] = useState(null);

  // Viewport Control State
  const [viewportMode, setViewportMode] = useState('3d'); // '3d' | 'render'
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Python IDE State
  const [pythonScript, setPythonScript] = useState(`import bpy
import math

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Add metallic torus
bpy.ops.mesh.primitive_torus_add(major_radius=1.5, minor_radius=0.3, location=(0,0,0))
torus = bpy.context.active_object
torus.rotation_euler = (math.radians(45), math.radians(30), 0)

# Create Stark Cyan Emission Material
mat = bpy.data.materials.new(name="StarkHolo")
mat.use_nodes = True
nodes = mat.node_tree.nodes
bsdf = nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.0, 0.94, 1.0, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.9
    bsdf.inputs['Roughness'].default_value = 0.1
torus.data.materials.append(mat)
print("[Blender Script] Holographic torus generated successfully.")
`);

  // Render State
  const [renderEngine, setRenderEngine] = useState('BLENDER_EEVEE_NEXT');
  const [resolution, setResolution] = useState('1920x1080');
  const [samples, setSamples] = useState(64);
  const [lastRender, setLastRender] = useState(null);

  // Settings State
  const [customPath, setCustomPath] = useState('');

  // 3D Graphic Creator State
  const [creatorObjects, setCreatorObjects] = useState(() => CREATOR_PRESETS[0].objects);
  const [selectedObjectId, setSelectedObjectId] = useState(() => CREATOR_PRESETS[0].objects[0]?.id || null);
  const [creatorPresetId, setCreatorPresetId] = useState('arc_reactor');
  const [creatorGraphicTitle, setCreatorGraphicTitle] = useState('Stark Arc Reactor');
  const [creatorToolTab, setCreatorToolTab] = useState('shapes'); // 'shapes' | 'transform' | 'scene' | 'code'
  const [creatorSettings, setCreatorSettings] = useState({
    grid: true,
    particles: true,
    autoRotate: true,
    rotateSpeed: 0.008,
    lightIntensity: 1.5,
    bgColor: '#020617',
    wireframeAll: false
  });
  const [savedCreations, setSavedCreations] = useState([]);
  const [showSavedVault, setShowSavedVault] = useState(false);
  const creatorCanvasRef = useRef(null);

  // Active Selected Object
  const activeCreatorObject = creatorObjects.find(o => o.id === selectedObjectId) || creatorObjects[0] || null;

  // Load saved creations from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jasper_saved_3d_creations');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedCreations(parsed);
      }
    } catch (_) {}
  }, []);

  const handleSelectPreset = (presetId) => {
    const found = CREATOR_PRESETS.find(p => p.id === presetId);
    if (!found) return;
    setCreatorPresetId(presetId);
    setCreatorObjects(found.objects.map(o => ({ ...o, position: [...o.position], rotation: [...o.rotation], scale: [...o.scale] })));
    setCreatorGraphicTitle(found.name);
    setSelectedObjectId(found.objects[0]?.id || null);
    addLog(`Loaded 3D Blueprint preset: ${found.name}`, 'info');
  };

  const handleAddShape = (type) => {
    const newObj = createNewObject(type);
    setCreatorObjects(prev => [...prev, newObj]);
    setSelectedObjectId(newObj.id);
    setCreatorToolTab('transform');
    addLog(`Synthesized new 3D shape element: ${newObj.name} (${type})`, 'success');
  };

  const handleDuplicateObject = (id) => {
    const target = creatorObjects.find(o => o.id === id);
    if (!target) return;
    const clone = {
      ...target,
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${target.name} Copy`,
      position: [target.position[0] + 0.3, target.position[1] + 0.2, target.position[2] + 0.2],
      rotation: [...target.rotation],
      scale: [...target.scale]
    };
    setCreatorObjects(prev => [...prev, clone]);
    setSelectedObjectId(clone.id);
    addLog(`Duplicated element: ${clone.name}`, 'info');
  };

  const handleDeleteObject = (id) => {
    setCreatorObjects(prev => {
      const filtered = prev.filter(o => o.id !== id);
      if (selectedObjectId === id) {
        setSelectedObjectId(filtered[0]?.id || null);
      }
      return filtered;
    });
    addLog('Removed shape element from 3D scene.', 'warning');
  };

  const handleToggleVisibility = (id) => {
    setCreatorObjects(prev => prev.map(o => o.id === id ? { ...o, visible: o.visible === false ? true : false } : o));
  };

  const handleUpdateActiveObject = (updates) => {
    if (!selectedObjectId) return;
    setCreatorObjects(prev => prev.map(o => o.id === selectedObjectId ? { ...o, ...updates } : o));
  };

  const handleCaptureCreatorSnapshot = () => {
    const dataUrl = creatorCanvasRef.current?.getSnapshot();
    if (!dataUrl) {
      addLog('Could not capture canvas render snapshot.', 'error');
      return;
    }
    const a = document.createElement('a');
    a.download = `${(creatorGraphicTitle || 'jasper_3d_graphic').toLowerCase().replace(/[^a-z0-9]/g, '_')}_render.png`;
    a.href = dataUrl;
    a.click();
    addLog(`Captured and saved 3D graphic snapshot: ${a.download}`, 'success');
  };

  const handleBeamCreatorToHologram = () => {
    const snapshotUrl = creatorCanvasRef.current?.getSnapshot();
    const activeObj = activeCreatorObject;
    const hologramPayload = {
      name: creatorGraphicTitle || 'Custom 3D Graphic',
      prompt: `Custom User-Created 3D Graphic: ${creatorGraphicTitle} (${creatorObjects.length} procedural elements)`,
      objectType: activeObj?.type || 'composite_3d',
      color: activeObj?.color || '#00f0ff',
      previewUrl: snapshotUrl || null,
      source: 'blender_studio_creator',
      elementCount: creatorObjects.length,
      timestamp: new Date().toISOString()
    };
    if (onProjectToHologram) onProjectToHologram(hologramPayload);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jasper:project-to-hologram', { detail: hologramPayload }));
    }
    addLog(`Projected "${creatorGraphicTitle}" to 3D Hologram Workstation!`, 'success');
  };

  const handleExportCreatorToPython = () => {
    const script = generateBlenderPythonScript(creatorGraphicTitle, creatorObjects, creatorSettings);
    setPythonScript(script);
    setActiveTab('python');
    addLog(`Generated Blender bpy Python script for "${creatorGraphicTitle}". Switched to IDE.`, 'success');
  };

  const handleSaveCreation = () => {
    const newEntry = {
      id: `creation_${Date.now()}`,
      title: creatorGraphicTitle || 'Untitled Graphic',
      objects: creatorObjects,
      settings: creatorSettings,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newEntry, ...savedCreations.filter(c => c.title !== newEntry.title)].slice(0, 25);
    setSavedCreations(updated);
    try {
      localStorage.setItem('jasper_saved_3d_creations', JSON.stringify(updated));
    } catch (_) {}
    addLog(`Saved "${newEntry.title}" to your 3D Creations Vault.`, 'success');
  };

  const handleLoadSavedCreation = (item) => {
    setCreatorGraphicTitle(item.title);
    setCreatorObjects(item.objects);
    if (item.settings) setCreatorSettings(item.settings);
    setSelectedObjectId(item.objects[0]?.id || null);
    setShowSavedVault(false);
    addLog(`Loaded saved graphic from vault: ${item.title}`, 'info');
  };

  const handleDeleteSavedCreation = (id, e) => {
    if (e) e.stopPropagation();
    const updated = savedCreations.filter(c => c.id !== id);
    setSavedCreations(updated);
    try {
      localStorage.setItem('jasper_saved_3d_creations', JSON.stringify(updated));
    } catch (_) {}
    addLog('Removed creation from vault.', 'warning');
  };

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-30), { time, msg, type }]);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/blender/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.warn('Blender status fetch failed:', e);
    }

    try {
      const resLatest = await fetch(`${getApiBase()}/api/blender/latest`);
      if (resLatest.ok) {
        const dataLatest = await resLatest.json();
        if (dataLatest.latest) {
          setLastGenerated(dataLatest.latest);
          if (dataLatest.latest.objectType) setObjectType(dataLatest.latest.objectType);
          if (dataLatest.latest.prompt) setPrompt(dataLatest.latest.prompt);
          addLog(`Auto-loaded active 3D model: ${dataLatest.latest.glbFileName}`, 'success');
        }
        if (dataLatest.latestRender) {
          setLastRender(dataLatest.latestRender);
        }
      }
    } catch (e) {
      console.warn('Blender latest asset fetch failed:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      addLog('Blender 3D Graphics API connected to Jasper Core.', 'success');
    }
  }, [isOpen]);

  const handleGenerate3D = async () => {
    setLoading(true);
    addLog(`Initiating procedural 3D model generation: ${objectType} (${color})...`, 'info');
    try {
      const res = await fetch(`${getApiBase()}/api/blender/generate-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          objectType,
          color,
          metallic: parseFloat(metallic),
          roughness: parseFloat(roughness),
          text: customText,
          renderPreview: true
        })
      });
      const data = await res.json();
      if (data.success || data.glbUrl) {
        setLastGenerated(data);
        setViewportMode('3d');
        setImageError(false);
        addLog(`3D Asset synthesized: ${data.glbFileName || 'model.glb'}`, 'success');
      } else {
        addLog(`3D Generation notice: ${data.error || data.logs || 'Completed'}`, 'warning');
      }
    } catch (e) {
      addLog(`Generation error: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteScript = async () => {
    setLoading(true);
    addLog('Executing custom Python bpy script in headless Blender engine...', 'info');
    try {
      const res = await fetch(`${getApiBase()}/api/blender/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: pythonScript })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Script executed in ${data.durationMs}ms with code ${data.code}`, 'success');
        if (data.stdout) addLog(data.stdout, 'info');
      } else {
        addLog(`Execution warning: ${data.error || data.stderr || 'Code ' + data.code}`, 'warning');
      }
    } catch (e) {
      addLog(`Execution failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenderScene = async () => {
    setLoading(true);
    const [w, h] = resolution.split('x').map(Number);
    addLog(`Rendering 3D viewport via ${renderEngine} at ${w}x${h}...`, 'info');
    try {
      const res = await fetch(`${getApiBase()}/api/blender/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: renderEngine,
          resolutionX: w,
          resolutionY: h,
          samples: parseInt(samples, 10)
        })
      });
      const data = await res.json();
      if (data.exists || data.url) {
        setLastRender(data);
        setViewportMode('render');
        setImageError(false);
        addLog(`Render completed: ${data.outputFile}`, 'success');
      } else {
        addLog(`Render output: ${data.error || 'Finished'}`, 'warning');
      }
    } catch (e) {
      addLog(`Render failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchGui = async () => {
    addLog('Launching Blender desktop application window...', 'info');
    try {
      const res = await fetch(`${getApiBase()}/api/blender/launch`, { method: 'POST' });
      const data = await res.json();
      if (data.launched) {
        addLog(`Blender GUI spawned: ${data.path}`, 'success');
      } else {
        addLog(`Launch status: ${data.error}`, 'warning');
      }
    } catch (e) {
      addLog(`Launch failed: ${e.message}`, 'error');
    }
  };

  const handleInstallWinget = async () => {
    addLog('Triggering silent Blender installation via winget package manager...', 'info');
    try {
      const res = await fetch(`${getApiBase()}/api/blender/install`, { method: 'POST' });
      const data = await res.json();
      addLog(data.message || 'Installation started in background.', 'info');
      fetchStatus();
    } catch (e) {
      addLog(`Install trigger failed: ${e.message}`, 'error');
    }
  };

  const handleSaveCustomPath = async () => {
    if (!customPath.trim()) return;
    try {
      const res = await fetch(`${getApiBase()}/api/blender/path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: customPath.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        addLog(`Blender path updated: ${customPath}`, 'success');
      }
    } catch (e) {
      addLog(`Path update failed: ${e.message}`, 'error');
    }
  };

  const content = (
    <div className={`flex flex-col ${embedded ? 'h-full w-full' : 'h-[75vh] max-h-[850px]'} text-slate-200 bg-[#090d16]/95 select-none`}>
        
        {/* Top Header & Status Bar */}
        <div className="flex items-center justify-between p-3 px-4 border-b border-cyan-500/30 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-white tracking-wider">BLENDER 3D ENGINE</span>
                {status?.installed ? (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>v{status.version || 'Active'}</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" />
                    <span>API Simulation Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {status?.path ? status.path : 'Standalone Web API Mode (Host executable optional)'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!status?.installed && (
              <button
                onClick={handleInstallWinget}
                className="px-2.5 py-1 text-xs font-mono bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded transition flex items-center space-x-1"
                title="Install Blender automatically via winget"
              >
                <Download className="w-3 h-3" />
                <span>Auto-Install</span>
              </button>
            )}
            <button
              onClick={handleLaunchGui}
              disabled={!status?.installed}
              className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 rounded transition flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Launch Desktop GUI</span>
            </button>
            {lastGenerated?.glbUrl && (
              <button
                onClick={() => {
                  if (onProjectToHologram) onProjectToHologram(lastGenerated);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('jasper:project-to-hologram', { detail: lastGenerated }));
                  }
                }}
                className="px-2.5 py-1 text-xs font-mono bg-gradient-to-r from-cyan-500/30 to-blue-500/30 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-200 border border-cyan-400/60 rounded transition flex items-center space-x-1 font-semibold shadow-sm animate-pulse cursor-pointer"
                title="Project this 3D model into the Hologram Workstation"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Beam to Hologram</span>
              </button>
            )}
            <button
              onClick={fetchStatus}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 space-x-2 pt-2">
          {[
            { id: 'generate', label: '3D Generator', icon: Sparkles },
            { id: 'creator', label: '3D Graphic Creator', icon: Palette },
            { id: 'python', label: 'bpy Python IDE', icon: Terminal },
            { id: 'render', label: 'Render Studio', icon: ImageIcon },
            { id: 'settings', label: 'Config & Paths', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-mono border-b-2 transition ${
                  isActive 
                    ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-500/10' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left / Middle Controls Panel (2 columns) */}
          <div className="lg:col-span-2 overflow-y-auto p-4 space-y-4">
            
            {activeTab === 'creator' && (
              <div className="space-y-4">
                {/* Creator Header Bar */}
                <div className="p-3 bg-slate-900/80 rounded-lg border border-cyan-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1">
                        3D Graphic Title & Blueprint
                      </label>
                      <input
                        type="text"
                        value={creatorGraphicTitle}
                        onChange={(e) => setCreatorGraphicTitle(e.target.value)}
                        placeholder="Graphic Name..."
                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1.5 text-sm font-mono text-white outline-none"
                      />
                    </div>

                    <div className="w-full sm:w-56">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                        Preset Blueprint
                      </label>
                      <select
                        value={creatorPresetId}
                        onChange={(e) => handleSelectPreset(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1.5 text-xs font-mono text-cyan-300 outline-none"
                      >
                        {CREATOR_PRESETS.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end space-x-1.5 pt-1 sm:pt-0">
                      <button
                        onClick={handleSaveCreation}
                        className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono flex items-center space-x-1 transition shadow-xs cursor-pointer"
                        title="Save this 3D graphic to your browser vault"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>

                      <button
                        onClick={() => setShowSavedVault(!showSavedVault)}
                        className={`px-3 py-1.5 rounded text-xs font-mono flex items-center space-x-1 border transition cursor-pointer ${
                          showSavedVault 
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="View your saved 3D creations"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Vault ({savedCreations.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Saved Creations Vault Drawer */}
                  {showSavedVault && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>YOUR SAVED 3D CREATIONS VAULT</span>
                        <span className="text-[10px] text-slate-500">{savedCreations.length} saved</span>
                      </div>
                      {savedCreations.length === 0 ? (
                        <p className="text-xs font-mono text-slate-500 italic py-2">
                          No saved creations yet. Click "Save" above to bookmark your 3D models.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                          {savedCreations.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleLoadSavedCreation(item)}
                              className="p-2 bg-slate-950/70 hover:bg-cyan-950/30 rounded border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition flex items-center justify-between group"
                            >
                              <div className="overflow-hidden pr-2">
                                <div className="text-xs font-mono font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                                  {item.title}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  {item.objects?.length || 0} shapes • {item.date}
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleDeleteSavedCreation(item.id, e)}
                                className="p-1 text-slate-600 hover:text-rose-400 hover:bg-slate-900 rounded transition"
                                title="Delete from vault"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-Navigation Pill Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 rounded-lg space-x-1">
                  {[
                    { id: 'shapes', label: 'Hierarchy & Shapes', icon: Layers },
                    { id: 'transform', label: 'Transform & Shader', icon: Sliders },
                    { id: 'scene', label: 'Atmosphere & Scene', icon: Sun },
                    { id: 'code', label: 'Python & bpy Code', icon: Code }
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    const isTabActive = creatorToolTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setCreatorToolTab(tab.id)}
                        className={`flex-1 py-1.5 px-2 text-xs font-mono rounded flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                          isTabActive
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: Hierarchy & Shapes */}
                {creatorToolTab === 'shapes' && (
                  <div className="space-y-4">
                    {/* Add Primitive Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                          <Plus className="w-3.5 h-3.5 text-cyan-400" />
                          <span>SYNTHESIZE NEW 3D PRIMITIVE</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">1-click procedural mesh</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                        {[
                          { type: 'torus', label: 'Torus Ring' },
                          { type: 'torusknot', label: 'Quantum Knot' },
                          { type: 'sphere', label: 'Crystal Orb' },
                          { type: 'cube', label: 'Tech Cube' },
                          { type: 'cylinder', label: 'Column' },
                          { type: 'cone', label: 'Vector Cone' },
                          { type: 'icosahedron', label: 'Poly Lattice' },
                          { type: 'dodecahedron', label: 'Dodeca Node' },
                          { type: 'octahedron', label: 'Prism Gem' },
                          { type: 'ring', label: 'Planar Disk' },
                          { type: 'capsule', label: 'Nano Capsule' }
                        ].map(shape => (
                          <button
                            key={shape.type}
                            onClick={() => handleAddShape(shape.type)}
                            className="px-2 py-1.5 bg-slate-900 hover:bg-cyan-950/40 hover:border-cyan-500/50 border border-slate-800 rounded text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition text-left flex items-center justify-between group cursor-pointer"
                          >
                            <span className="truncate">{shape.label}</span>
                            <Plus className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 shrink-0 ml-1" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scene Shapes Hierarchy List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>SCENE OBJECT HIERARCHY ({creatorObjects.length})</span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">Click to select & fine-tune</span>
                      </div>

                      {creatorObjects.length === 0 ? (
                        <div className="p-4 bg-slate-900/40 rounded border border-slate-800 text-center space-y-1">
                          <p className="text-xs font-mono text-slate-400">Scene has no objects</p>
                          <p className="text-[10px] font-mono text-slate-500">Click a primitive above or choose a preset blueprint</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                          {creatorObjects.map((obj) => {
                            const isSelected = obj.id === selectedObjectId;
                            return (
                              <div
                                key={obj.id}
                                onClick={() => setSelectedObjectId(obj.id)}
                                className={`p-2.5 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                  <div
                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/20"
                                    style={{ backgroundColor: obj.color }}
                                  />
                                  <div className="truncate">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono text-xs font-semibold">{obj.name}</span>
                                      {isSelected && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                                          ACTIVE
                                        </span>
                                      )}
                                      {obj.spin && (
                                        <span className="text-[9px] font-mono text-amber-400">
                                          💫 spin
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500">
                                      {obj.type} • {obj.materialType} • pos: [{obj.position?.map(v => v.toFixed(1)).join(', ')}]
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleToggleVisibility(obj.id)}
                                    className={`p-1.5 rounded transition ${
                                      obj.visible !== false ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                                    }`}
                                    title={obj.visible !== false ? 'Hide object' : 'Show object'}
                                  >
                                    {obj.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedObjectId(obj.id);
                                      setCreatorToolTab('transform');
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition"
                                    title="Edit Transforms & Shaders"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDuplicateObject(obj.id)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition"
                                    title="Duplicate shape"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteObject(obj.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                                    title="Delete shape"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Transform & Shader */}
                {creatorToolTab === 'transform' && (
                  <div className="space-y-4">
                    {!activeCreatorObject ? (
                      <div className="p-4 bg-slate-900/40 rounded border border-slate-800 text-center">
                        <p className="text-xs font-mono text-slate-400">No shape currently selected</p>
                        <p className="text-[10px] font-mono text-slate-500">Select a shape from the Hierarchy tab or click on the 3D canvas</p>
                      </div>
                    ) : (
                      <>
                        {/* Object Identity Card */}
                        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-mono text-slate-400 block mb-1">Shape Name</label>
                            <input
                              type="text"
                              value={activeCreatorObject.name}
                              onChange={(e) => handleUpdateActiveObject({ name: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-white outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="w-full sm:w-44">
                            <label className="text-[10px] font-mono text-slate-400 block mb-1">Geometry Primitive</label>
                            <select
                              value={activeCreatorObject.type}
                              onChange={(e) => handleUpdateActiveObject({ type: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
                            >
                              <option value="torus">Torus Ring</option>
                              <option value="torusknot">Torus Knot</option>
                              <option value="sphere">UV Sphere</option>
                              <option value="cube">Tech Cube</option>
                              <option value="cylinder">Cylinder</option>
                              <option value="cone">Vector Cone</option>
                              <option value="icosahedron">Icosahedron</option>
                              <option value="dodecahedron">Dodecahedron</option>
                              <option value="octahedron">Octahedron</option>
                              <option value="ring">Planar Ring</option>
                              <option value="capsule">Capsule</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              onClick={() => handleUpdateActiveObject({ spin: !activeCreatorObject.spin })}
                              className={`px-2.5 py-1 text-xs font-mono rounded border transition cursor-pointer ${
                                activeCreatorObject.spin
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                              title="Continuously rotate this shape element like a spinning rotor"
                            >
                              {activeCreatorObject.spin ? '💫 Rotor Spin ON' : '⏸ Rotor Spin OFF'}
                            </button>
                          </div>
                        </div>

                        {/* Position (X, Y, Z) */}
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-300">Spatial Position (X, Y, Z)</span>
                            <button
                              onClick={() => handleUpdateActiveObject({ position: [0, 0, 0] })}
                              className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                            >
                              Center (0,0,0)
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {['X', 'Y', 'Z'].map((axis, i) => (
                              <div key={axis} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                  <span>{axis}</span>
                                  <span>{(activeCreatorObject.position?.[i] || 0).toFixed(2)}</span>
                                </div>
                                <input
                                  type="range"
                                  min="-4"
                                  max="4"
                                  step="0.05"
                                  value={activeCreatorObject.position?.[i] || 0}
                                  onChange={(e) => {
                                    const next = [...(activeCreatorObject.position || [0, 0, 0])];
                                    next[i] = parseFloat(e.target.value);
                                    handleUpdateActiveObject({ position: next });
                                  }}
                                  className="w-full accent-cyan-400 cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Rotation (Pitch, Yaw, Roll) */}
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-300">Euler Rotation (Degrees)</span>
                            <button
                              onClick={() => handleUpdateActiveObject({ rotation: [0, 0, 0] })}
                              className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                            >
                              Reset Angles
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Pitch (X)', idx: 0 },
                              { label: 'Yaw (Y)', idx: 1 },
                              { label: 'Roll (Z)', idx: 2 }
                            ].map(({ label, idx }) => (
                              <div key={label} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                  <span>{label}</span>
                                  <span>{Math.round(activeCreatorObject.rotation?.[idx] || 0)}°</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  step="1"
                                  value={activeCreatorObject.rotation?.[idx] || 0}
                                  onChange={(e) => {
                                    const next = [...(activeCreatorObject.rotation || [0, 0, 0])];
                                    next[idx] = parseFloat(e.target.value);
                                    handleUpdateActiveObject({ rotation: next });
                                  }}
                                  className="w-full accent-cyan-400 cursor-pointer"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Scale Dimensions */}
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-300">Mesh Scale & Proportions</span>
                            <button
                              onClick={() => handleUpdateActiveObject({ scale: [1, 1, 1] })}
                              className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                            >
                              Reset (1.0x)
                            </button>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono text-slate-400">
                              <span>Uniform Scale Multiplier</span>
                              <span>{(activeCreatorObject.scale?.[0] || 1).toFixed(2)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="3.5"
                              step="0.05"
                              value={activeCreatorObject.scale?.[0] || 1}
                              onChange={(e) => {
                                const s = parseFloat(e.target.value);
                                handleUpdateActiveObject({ scale: [s, s, s] });
                              }}
                              className="w-full accent-cyan-400 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Material Shading & Color Palette */}
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 space-y-3">
                          <span className="text-xs font-mono font-bold text-slate-300 block">
                            Material Shaders & Cyber Color
                          </span>

                          {/* Shading Style Buttons */}
                          <div className="grid grid-cols-5 gap-1 text-[11px] font-mono">
                            {[
                              { id: 'neon', label: 'Neon Glow' },
                              { id: 'metallic', label: 'Metallic' },
                              { id: 'glass', label: 'Glass' },
                              { id: 'wireframe', label: 'Wireframe' },
                              { id: 'matte', label: 'Matte Solid' }
                            ].map(style => (
                              <button
                                key={style.id}
                                onClick={() => handleUpdateActiveObject({ materialType: style.id })}
                                className={`py-1.5 px-1 rounded border text-center transition cursor-pointer ${
                                  activeCreatorObject.materialType === style.id
                                    ? 'bg-cyan-500/25 border-cyan-400 text-white font-bold'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>

                          {/* Cyber Neon Swatches */}
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">Color Swatches:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { hex: '#00f0ff', label: 'Stark Cyan' },
                                { hex: '#a855f7', label: 'Neon Purple' },
                                { hex: '#ec4899', label: 'Laser Pink' },
                                { hex: '#10b981', label: 'Matrix Emerald' },
                                { hex: '#f59e0b', label: 'Arc Amber' },
                                { hex: '#ef4444', label: 'Crimson' },
                                { hex: '#38bdf8', label: 'Plasma Blue' },
                                { hex: '#ffffff', label: 'Platinum' },
                                { hex: '#1e293b', label: 'Obsidian' }
                              ].map(swatch => (
                                <button
                                  key={swatch.hex}
                                  onClick={() => handleUpdateActiveObject({ color: swatch.hex })}
                                  className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 shadow-xs cursor-pointer ${
                                    activeCreatorObject.color?.toLowerCase() === swatch.hex.toLowerCase()
                                      ? 'border-white scale-110'
                                      : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: swatch.hex }}
                                  title={swatch.label}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={activeCreatorObject.color || '#00f0ff'}
                              onChange={(e) => handleUpdateActiveObject({ color: e.target.value })}
                              className="w-7 h-7 p-0 bg-transparent rounded border border-slate-700 cursor-pointer ml-auto"
                              title="Custom Color Picker"
                            />
                          </div>

                          {/* Roughness, Metalness, Opacity */}
                          <div className="grid grid-cols-3 gap-3 pt-1">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Roughness</span>
                                <span>{(activeCreatorObject.roughness ?? 0.2).toFixed(2)}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={activeCreatorObject.roughness ?? 0.2}
                                onChange={(e) => handleUpdateActiveObject({ roughness: parseFloat(e.target.value) })}
                                className="w-full accent-cyan-400 cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Metalness</span>
                                <span>{(activeCreatorObject.metalness ?? 0.85).toFixed(2)}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={activeCreatorObject.metalness ?? 0.85}
                                onChange={(e) => handleUpdateActiveObject({ metalness: parseFloat(e.target.value) })}
                                className="w-full accent-cyan-400 cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Opacity</span>
                                <span>{(activeCreatorObject.opacity ?? 1).toFixed(2)}</span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={activeCreatorObject.opacity ?? 1}
                                onChange={(e) => handleUpdateActiveObject({ opacity: parseFloat(e.target.value) })}
                                className="w-full accent-cyan-400 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 3: Atmosphere & Scene */}
                {creatorToolTab === 'scene' && (
                  <div className="space-y-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                      Scene Lighting & Spatial Environment
                    </span>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => setCreatorSettings(s => ({ ...s, autoRotate: !s.autoRotate }))}
                        className={`p-3 rounded-lg border text-left font-mono transition cursor-pointer ${
                          creatorSettings.autoRotate
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">Continuous Auto-Spin</div>
                        <div className="text-[10px] text-slate-500">
                          {creatorSettings.autoRotate ? 'Active (60 FPS smooth spin)' : 'Paused (static camera)'}
                        </div>
                      </button>

                      <button
                        onClick={() => setCreatorSettings(s => ({ ...s, grid: !s.grid }))}
                        className={`p-3 rounded-lg border text-left font-mono transition cursor-pointer ${
                          creatorSettings.grid
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">Cyber Spatial Grid</div>
                        <div className="text-[10px] text-slate-500">
                          {creatorSettings.grid ? 'Grid Floor Enabled' : 'Hidden'}
                        </div>
                      </button>

                      <button
                        onClick={() => setCreatorSettings(s => ({ ...s, particles: !s.particles }))}
                        className={`p-3 rounded-lg border text-left font-mono transition cursor-pointer ${
                          creatorSettings.particles
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">Cosmic Stardust Cloud</div>
                        <div className="text-[10px] text-slate-500">
                          {creatorSettings.particles ? 'Starfield Floating Particles' : 'Disabled'}
                        </div>
                      </button>

                      <button
                        onClick={() => setCreatorSettings(s => ({ ...s, wireframeAll: !s.wireframeAll }))}
                        className={`p-3 rounded-lg border text-left font-mono transition cursor-pointer ${
                          creatorSettings.wireframeAll
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">Global Wireframe Override</div>
                        <div className="text-[10px] text-slate-500">
                          {creatorSettings.wireframeAll ? 'Full Wireframe Cage' : 'Solid Shaded'}
                        </div>
                      </button>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs font-mono text-slate-300">
                        <span>Auto-Rotation Speed</span>
                        <span>{(creatorSettings.rotateSpeed * 1000).toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.002"
                        max="0.025"
                        step="0.001"
                        value={creatorSettings.rotateSpeed}
                        onChange={(e) => setCreatorSettings(s => ({ ...s, rotateSpeed: parseFloat(e.target.value) }))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: Python & bpy Code */}
                {creatorToolTab === 'code' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        Auto-Generated Blender bpy Script
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const script = generateBlenderPythonScript(creatorGraphicTitle, creatorObjects, creatorSettings);
                            navigator.clipboard?.writeText(script);
                            addLog('Blender script copied to clipboard.', 'success');
                          }}
                          className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                        >
                          Copy Script
                        </button>
                        <button
                          onClick={handleExportCreatorToPython}
                          className="px-2.5 py-1 text-xs font-mono bg-cyan-600/30 hover:bg-cyan-600/45 text-cyan-300 border border-cyan-500/50 rounded transition font-bold cursor-pointer"
                        >
                          Open in bpy IDE →
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-black/80 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400/90 h-64 overflow-y-auto whitespace-pre leading-relaxed select-text shadow-inner">
                      {generateBlenderPythonScript(creatorGraphicTitle, creatorObjects, creatorSettings)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'generate' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Procedural 3D Mesh Synthesis
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Exports to web-ready .GLB & .PNG</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Concept Prompt</label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Glowing Stark Arc Reactor Torus"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded p-2 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Primitive Geometry</label>
                    <select
                      value={objectType}
                      onChange={(e) => setObjectType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-cyan-300 outline-none"
                    >
                      <option value="torus">Torus (Ring/Arc)</option>
                      <option value="sphere">UV Sphere</option>
                      <option value="cube">Beveled Cube</option>
                      <option value="cylinder">Cylinder</option>
                      <option value="monkey">Suzanne Monkey</option>
                      <option value="text">3D Extruded Text</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Shader Hue</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs font-mono text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Preset Palette</label>
                    <div className="flex space-x-1.5 pt-1">
                      {[
                        { name: 'Stark Cyan', hex: '#00f0ff' },
                        { name: 'Iron Gold', hex: '#ffb800' },
                        { name: 'Neon Purple', hex: '#b026ff' },
                        { name: 'Reactor Red', hex: '#ff0055' },
                        { name: 'Matrix Green', hex: '#00ff66' }
                      ].map(p => (
                        <button
                          key={p.hex}
                          onClick={() => setColor(p.hex)}
                          className="w-6 h-6 rounded-full border border-slate-700 hover:scale-110 transition"
                          style={{ backgroundColor: p.hex }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {objectType === 'text' && (
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400">3D Text Content</label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-white outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Metallic Finish</span>
                      <span className="text-cyan-400">{Math.round(metallic * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={metallic}
                      onChange={(e) => setMetallic(e.target.value)}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Roughness</span>
                      <span className="text-cyan-400">{Math.round(roughness * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={roughness}
                      onChange={(e) => setRoughness(e.target.value)}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate3D}
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded transition flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing in Blender Engine...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate & Export 3D Model</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'python' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Headless Blender Python (bpy) Scripting
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Executes directly via blender -b</span>
                </div>

                <div className="relative">
                  <textarea
                    value={pythonScript}
                    onChange={(e) => setPythonScript(e.target.value)}
                    rows={13}
                    className="w-full bg-[#050811] text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-700 outline-none focus:border-cyan-500 resize-none"
                    spellCheck="false"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPythonScript(`import bpy\nbpy.ops.mesh.primitive_monkey_add(size=2.0)\nobj = bpy.context.active_object\nmod = obj.modifiers.new(name="Subsurf", type='SUBSURF')\nmod.levels = 2\nbpy.ops.object.shade_smooth()\nprint("Suzanne monkey smoothed.")`)}
                      className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
                    >
                      Preset: Smooth Monkey
                    </button>
                    <button
                      onClick={() => setPythonScript(`import bpy\nscene = bpy.context.scene\nscene.render.resolution_x = 1280\nscene.render.resolution_y = 720\nscene.render.image_settings.file_format = 'PNG'\nprint("Render settings applied: 720p PNG")`)}
                      className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
                    >
                      Preset: Render Settings
                    </button>
                  </div>

                  <button
                    onClick={handleExecuteScript}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs rounded transition flex items-center space-x-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Script</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'render' && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Blender Headless Render Studio
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Render Engine</label>
                    <select
                      value={renderEngine}
                      onChange={(e) => setRenderEngine(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-cyan-300 outline-none"
                    >
                      <option value="BLENDER_EEVEE_NEXT">EEVEE Next (Fast)</option>
                      <option value="CYCLES">Cycles (Raytracing)</option>
                      <option value="BLENDER_WORKBENCH">Workbench (Clay/Wire)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-cyan-300 outline-none"
                    >
                      <option value="1920x1080">1080p FHD (1920x1080)</option>
                      <option value="2560x1440">1440p QHD (2560x1440)</option>
                      <option value="1280x720">720p HD (1280x720)</option>
                      <option value="1080x1080">1:1 Square (1080x1080)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Quality Samples</label>
                    <select
                      value={samples}
                      onChange={(e) => setSamples(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-cyan-300 outline-none"
                    >
                      <option value="32">32 (Draft)</option>
                      <option value="64">64 (Standard)</option>
                      <option value="128">128 (High)</option>
                      <option value="256">256 (Ultra)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleRenderScene}
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs rounded transition flex items-center justify-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Execute Headless Render</span>
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Blender Binary Path & Engine Configuration
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Custom Blender Binary Executable Path</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customPath}
                      onChange={(e) => setCustomPath(e.target.value)}
                      placeholder="C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={handleSaveCustomPath}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded"
                    >
                      Save Path
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-xs font-mono space-y-2">
                  <div className="text-cyan-400 font-bold">Storage Directories:</div>
                  <div className="text-slate-400 truncate">Scripts: {status?.directories?.scripts || 'server/data/blender/scripts'}</div>
                  <div className="text-slate-400 truncate">Renders: {status?.directories?.renders || 'server/data/blender/renders'}</div>
                  <div className="text-slate-400 truncate">Exports: {status?.directories?.exports || 'server/data/blender/exports'}</div>
                </div>
              </div>
            )}

            {/* Live Console Output Bar */}
            <div className="bg-black/60 rounded border border-slate-800 p-2.5 font-mono text-[11px] h-36 overflow-y-auto space-y-1">
              <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 flex justify-between">
                <span>TERMINAL & EVENT STREAM</span>
                <span>{logs.length} events</span>
              </div>
              {logs.map((l, i) => (
                <div key={i} className="flex space-x-2">
                  <span className="text-slate-600">[{l.time}]</span>
                  <span className={
                    l.type === 'error' ? 'text-rose-400' :
                    l.type === 'warning' ? 'text-amber-400' :
                    l.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
                  }>
                    {l.msg}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Preview & Asset Viewport (1 column) */}
          <div className="p-4 flex flex-col justify-between bg-slate-950/40 space-y-3">
            {activeTab === 'creator' ? (
              <div className="h-full flex flex-col justify-between space-y-3">
                <div>
                  {/* Viewport Top Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>REALTIME VIEWPORT</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {creatorObjects.length} {creatorObjects.length === 1 ? 'shape' : 'shapes'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-mono">
                      <button
                        onClick={() => setCreatorSettings(s => ({ ...s, autoRotate: !s.autoRotate }))}
                        className={`px-2 py-0.5 rounded border text-[10px] transition cursor-pointer ${
                          creatorSettings.autoRotate ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                        title="Toggle Continuous 3D Rotation"
                      >
                        {creatorSettings.autoRotate ? '💫 Spin ON' : '⏸ Spin OFF'}
                      </button>
                      <button
                        onClick={() => setCreatorSettings(s => ({ ...s, grid: !s.grid }))}
                        className={`px-2 py-0.5 rounded border text-[10px] transition cursor-pointer ${
                          creatorSettings.grid ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                        title="Toggle Cyber Grid Floor"
                      >
                        🔲 Grid
                      </button>
                      <button
                        onClick={() => creatorCanvasRef.current?.resetCamera?.()}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] transition cursor-pointer"
                        title="Reset Camera View Angle"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" />
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* 3D Creator Canvas Container */}
                  <div className="w-full aspect-video min-h-[290px] bg-slate-950 rounded-lg border border-cyan-500/30 flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                    <Creator3dCanvas
                      ref={creatorCanvasRef}
                      objects={creatorObjects}
                      selectedId={selectedObjectId}
                      onSelectObject={(id) => {
                        setSelectedObjectId(id);
                        setCreatorToolTab('transform');
                      }}
                      sceneSettings={creatorSettings}
                    />
                  </div>

                  {/* Active Object Pill & Viewport Tips */}
                  <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center space-x-2">
                      {activeCreatorObject ? (
                        <span className="flex items-center space-x-1.5 text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCreatorObject.color }} />
                          <span className="font-semibold">{activeCreatorObject.name}</span>
                          <span className="text-slate-500">({activeCreatorObject.type})</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">No shape selected</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Click shape in 3D to edit
                    </div>
                  </div>
                </div>

                {/* Export Actions for Creator */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={handleBeamCreatorToHologram}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500/30 via-cyan-400/20 to-blue-600/30 hover:from-cyan-500/45 hover:to-blue-600/45 text-cyan-100 font-mono text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 border border-cyan-400/70 shadow-[0_0_15px_rgba(0,240,255,0.25)] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Beam to Hologram Workstation</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCaptureCreatorSnapshot}
                      className="py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-mono text-xs rounded transition flex items-center justify-center space-x-1.5 border border-cyan-500/40 shadow-sm cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Save PNG Snapshot</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCreatorToPython}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded transition flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
                      title="Convert this 3D graphic into Blender bpy Python script"
                    >
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Send to bpy IDE</span>
                    </button>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 text-center flex items-center justify-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Realtime 3D Mesh Composition • Ready to Export</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Viewport Top Header & Mode Switcher */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setViewportMode('3d')}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded flex items-center space-x-1.5 transition ${
                        viewportMode === '3d'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>3D Model</span>
                    </button>
                    <button
                      onClick={() => {
                        setViewportMode('render');
                        setImageError(false);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded flex items-center space-x-1.5 transition ${
                        viewportMode === 'render'
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>3D Picture</span>
                    </button>
                  </div>

                  {lastGenerated?.objectType && (
                    <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {lastGenerated.objectType}
                    </span>
                  )}
                </div>

                {/* Viewport Display Window */}
                <div className="w-full aspect-video min-h-[260px] bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                  {viewportMode === '3d' ? (
                    <Blender3dCanvas
                      glbUrl={lastGenerated?.glbUrl}
                      objectType={lastGenerated?.objectType || objectType}
                      color={color}
                      autoRotate={autoRotate}
                      wireframe={wireframeMode}
                    />
                  ) : (
                    (() => {
                      const imgSrc = !imageError && lastRender?.url
                        ? `${getApiBase()}${lastRender.url}`
                        : (lastGenerated?.previewUrl ? `${getApiBase()}${lastGenerated.previewUrl}` : null);

                      if (imgSrc) {
                        return (
                          <div className="w-full h-full relative flex items-center justify-center bg-slate-950 p-2">
                            <img
                              src={imgSrc}
                              alt="3D Render"
                              onError={() => {
                                if (!imageError && lastGenerated?.previewUrl && lastRender?.url) {
                                  setImageError(true);
                                }
                              }}
                              className="max-h-full max-w-full object-contain rounded shadow-lg"
                            />
                            <a
                              href={imgSrc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition"
                              title="Open full resolution"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        );
                      }

                      return (
                        <div className="text-center p-4 space-y-2 text-slate-500">
                          <Box className="w-10 h-10 mx-auto opacity-30 text-cyan-400" />
                          <p className="text-xs font-mono">No 3D picture yet loaded</p>
                          <p className="text-[10px] text-slate-600">Generate a 3D model or run a render to visualize</p>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Viewport Utility Controls */}
                {viewportMode === '3d' && (
                  <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setAutoRotate(!autoRotate)}
                        className={`px-2 py-0.5 rounded border text-[10px] transition ${
                          autoRotate ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {autoRotate ? '🔄 Rotation ON' : '⏸ Rotation OFF'}
                      </button>
                      <button
                        onClick={() => setWireframeMode(!wireframeMode)}
                        className={`px-2 py-0.5 rounded border text-[10px] transition ${
                          wireframeMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {wireframeMode ? '🕸️ Wireframe' : '🧊 Shaded'}
                      </button>
                    </div>
                    {lastGenerated?.size && (
                      <span className="text-[10px] text-slate-500">
                        {Math.round(lastGenerated.size / 1024)} KB GLB
                      </span>
                    )}
                  </div>
                )}

                {/* Asset Actions */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  {lastGenerated?.glbUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onProjectToHologram) onProjectToHologram(lastGenerated);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('jasper:project-to-hologram', { detail: lastGenerated }));
                        }
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-500/30 via-cyan-400/20 to-blue-600/30 hover:from-cyan-500/45 hover:to-blue-600/45 text-cyan-100 font-mono text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 border border-cyan-400/70 shadow-[0_0_15px_rgba(0,240,255,0.25)] cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>Project in 3D Hologram Workstation</span>
                    </button>
                  )}

                  {lastGenerated?.glbUrl && (
                    <a
                      href={`${getApiBase()}${lastGenerated.glbUrl}`}
                      download={lastGenerated.glbFileName || 'model.glb'}
                      className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-mono text-xs rounded transition flex items-center justify-center space-x-2 border border-cyan-500/40 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download 3D Model (.GLB)</span>
                    </a>
                  )}

                  {(lastRender?.url || lastGenerated?.previewUrl) && (
                    <a
                      href={`${getApiBase()}${lastRender?.url || lastGenerated?.previewUrl}`}
                      download={lastRender?.outputFile || '3d_preview.svg'}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded transition flex items-center justify-center space-x-2 border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download 3D Picture Preview</span>
                    </a>
                  )}

                  <div className="text-[10px] font-mono text-slate-500 text-center flex items-center justify-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Jasper Spatial 3D Engine • WebGL Three.js Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <DraggableModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="J.A.S.P.E.R. 3D GRAPHICS & BLENDER STUDIO"
      maxWidth="max-w-5xl"
    >
      {content}
    </DraggableModalWrapper>
  );
}

