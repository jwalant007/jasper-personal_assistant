import React, { useState, useEffect, useRef, useMemo } from 'react';
import Hologram3dCanvas from './Hologram3dCanvas';
import BlenderStudioModal from './BlenderStudioModal';
import { speakMessage } from '../utils/speakDeviceAudio';
import { getApiBase } from '../utils/apiConfig';
import { playJarvisBeep, playJarvisScan, playJarvisPowerUp } from '../utils/jarvisAudioSynth';
import { AirGestureTracker } from '../utils/gestureTracker';
import { HolographicVoiceCommander } from '../utils/voiceCommander';
import { 
  Box, 
  Sparkles, 
  Play, 
  Pause, 
  XCircle, 
  Send, 
  RotateCw,
  RotateCcw,
  Clock, 
  Cpu, 
  Globe, 
  Zap, 
  Atom, 
  Eye,
  ZoomIn,
  Maximize2,
  Sliders,
  Layers,
  Flame,
  Sun,
  RefreshCcw,
  Bot,
  Activity,
  Volume2,
  VolumeX,
  Target,
  Hand,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  FolderClock,
  Search,
  Plus,
  Bookmark,
  Trash2,
  Download,
  ExternalLink,
  ChevronRight,
  Settings2,
  Tv,
  Check,
  Star
} from 'lucide-react';

const STORAGE_KEY = 'jasper_hologram_projects_v2';

const DEFAULT_PRESETS = [
  {
    id: 'stark_mark85',
    title: 'Stark Mark LXXXV Armor',
    subtitle: 'Nanotech Anatomical Armor & Arc Housing',
    category: 'Stark Tech',
    mode: 'ironman',
    tags: ['MCU', 'Nanotech', 'Vibranium', 'Armor'],
    timestamp: 'Mark 85 Spec',
    icon: '⚡',
    isPreset: true
  },
  {
    id: 'stark_mark7',
    title: 'Stark Mark VII Blueprint',
    subtitle: 'Stealth Telemetry Wireframe Suit',
    category: 'Stark Tech',
    mode: 'ironman',
    tags: ['Workshop', 'Blueprint', 'Wireframe'],
    timestamp: 'Mark VII Spec',
    icon: '📐',
    isPreset: true
  },
  {
    id: 'arc_reactor_core',
    title: 'Stark Arc Reactor Core',
    subtitle: '10-Coil Segmented Toroid & Unibeam',
    category: 'Stark Tech',
    mode: 'arc_reactor',
    tags: ['Clean Energy', 'Palladium', 'Unibeam', '10-Coil'],
    timestamp: '3 GJ/sec Yield',
    icon: '⚛️',
    isPreset: true
  },
  {
    id: 'repulsor_engine',
    title: 'Repulsor Flight Engine',
    subtitle: 'High-Velocity Plasma Thruster Nozzle',
    category: 'Stark Tech',
    mode: 'repulsor',
    tags: ['Flight', 'Plasma', 'Electromagnetic'],
    timestamp: 'Mach 3 Thrust',
    icon: '🚀',
    isPreset: true
  },
  {
    id: 'synthetic_genome',
    title: 'Synthetic Genome DNA',
    subtitle: 'Double Helix with Nucleotide Base Pairs',
    category: 'Genetics & AI',
    mode: 'genome',
    tags: ['DNA', 'Biotech', 'Genetics', 'Matrix'],
    timestamp: 'Human Genome v4',
    icon: '🧬',
    isPreset: true
  },
  {
    id: 'spiderman_upgraded',
    title: 'Spider-Man Upgraded Suit',
    subtitle: 'Red & Black Micro-Carbon Nanoweb',
    category: 'Nano Armor',
    mode: 'spiderman',
    suit: 'upgraded',
    tags: ['Spider-Man', 'MCU', 'Web-Shooters'],
    timestamp: 'Far From Home',
    icon: '🕷️',
    isPreset: true
  },
  {
    id: 'spiderman_ironspider',
    title: 'Iron Spider Combat Waldo Suit',
    subtitle: 'Stark Golden Articulated Waldoes',
    category: 'Nano Armor',
    mode: 'spiderman',
    suit: 'ironspider',
    tags: ['Iron Spider', 'Waldoes', 'Gold Nanotech'],
    timestamp: 'Infinity War',
    icon: '🤖',
    isPreset: true
  },
  {
    id: 'tesseract_4d',
    title: '4D Tesseract Hypercube',
    subtitle: 'Perspective 4D-to-3D Spatial Rotation',
    category: 'Quantum & 4D',
    mode: 'quantumvortex',
    is4d: true,
    tags: ['4D Math', 'Hypercube', 'Temporal'],
    timestamp: 'Higher Dimension',
    icon: '🌌',
    isPreset: true
  },
  {
    id: 'v8_engine',
    title: 'V8 Twin-Turbo Engine',
    subtitle: 'Mechanical Block & Moving Pistons',
    category: 'Engineering',
    mode: 'v8engine',
    tags: ['Mechanical', 'Combustion', 'Twin-Turbo'],
    timestamp: '8-Cylinder',
    icon: '⚙️',
    isPreset: true
  },
  {
    id: 'cyberdrone_recon',
    title: 'Autonomous Cyber Drone',
    subtitle: 'Quad-Rotor Array & Sensor Lens',
    category: 'Robotics',
    mode: 'cyberdrone',
    tags: ['Drone', 'Recon', 'Autonomous'],
    timestamp: 'Aero Recon',
    icon: '🚁',
    isPreset: true
  },
  {
    id: 'blender_arc_torus',
    title: 'Stark Arc Torus (Blender)',
    subtitle: 'Headless Procedural GLB Torus Mesh',
    category: 'Blender 3D',
    mode: 'blender',
    objectType: 'torus',
    color: '#00f3ff',
    tags: ['Blender 3D', 'Procedural', 'GLB', 'Torus'],
    timestamp: 'Blender Geometry',
    icon: '🌀',
    isPreset: true
  },
  {
    id: 'blender_quantum_cube',
    title: 'Quantum Matrix Cube (Blender)',
    subtitle: 'Beveled Emission Subdivisions',
    category: 'Blender 3D',
    mode: 'blender',
    objectType: 'cube',
    color: '#a855f7',
    tags: ['Blender 3D', 'Quantum', 'GLB', 'Cube'],
    timestamp: 'Blender Geometry',
    icon: '🧊',
    isPreset: true
  },
  {
    id: 'blender_dna_helix',
    title: 'Stark DNA Toroid (Blender)',
    subtitle: 'Procedural Molecular Nanotech Model',
    category: 'Blender 3D',
    mode: 'blender',
    objectType: 'dna_helix',
    color: '#10b981',
    tags: ['Blender 3D', 'BioTech', 'GLB', 'Helix'],
    timestamp: 'Blender Geometry',
    icon: '🧬',
    isPreset: true
  }
];

export default function HolographicAnswerModal({ onClose, initialQuery = '' }) {
  // 1. Two-Part Navigation & Projects State
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_PRESETS, ...parsed.filter(p => !DEFAULT_PRESETS.some(d => d.id === p.id))];
      }
    } catch (e) {}
    return DEFAULT_PRESETS;
  });

  const [activeProjectId, setActiveProjectId] = useState('stark_mark85');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('viewport'); // 'viewport' | 'tools' | 'calibration'

  // 2. 3D Hologram Viewport States
  const [query, setQuery] = useState(initialQuery || '');
  const [active3dMode, setActive3dMode] = useState('ironman');
  const [spidermanSuit, setSpidermanSuit] = useState('upgraded');
  const [poseMode, setPoseMode] = useState('standing');
  const [bloomEnabled, setBloomEnabled] = useState(true);
  const [webFiring, setWebFiring] = useState(true);
  const [explodedView, setExplodedView] = useState(false);
  const [nanotechReassembling, setNanotechReassembling] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hudOverlay, setHudOverlay] = useState(true);
  const [cameraPreset, setCameraPresetState] = useState('full');
  const [starkReticles, setStarkReticles] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  // 3. Reel Feature: AR Webcam Background Layer
  const [arWebcamEnabled, setArWebcamEnabled] = useState(false);
  const [droidCamIp, setDroidCamIp] = useState('');
  const [useDroidCam, setUseDroidCam] = useState(false);

  // 4. Reel Feature: Real Air-Gesture MediaPipe Hand Tracking
  const [gestureMode, setGestureMode] = useState(false);
  const [gestureState, setGestureState] = useState({ status: 'IDLE', gesture: 'NONE', handCount: 0 });
  const [gestureFeedbackText, setGestureFeedbackText] = useState('Air Gestures Ready: Pinch to Rotate // Two-Hand Zoom // Swipe to Change');

  // 5. Reel Feature: Hands-Free Voice Command Listener
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastVoiceCommand, setLastVoiceCommand] = useState('');

  // 6. Reel Feature: Physical Projection Calibration (?w=15&h=8.5&s=)
  const [calibWidth, setCalibWidth] = useState(15);
  const [calibHeight, setCalibHeight] = useState(8.5);
  const [calibScale, setCalibScale] = useState(1.0);
  const [peppersGhostMode, setPeppersGhostMode] = useState(false);

  // 7. 4D Temporal Dynamics States
  const [is4dEnabled, setIs4dEnabled] = useState(false);
  const [time4d, setTime4d] = useState(0.0);
  const [timeSpeed4d, setTimeSpeed4d] = useState(1.0);
  const [is4dPlaying, setIs4dPlaying] = useState(true);

  // 8. AI & Blender Graphics Engine States
  const [responseText, setResponseText] = useState(
    'Sir, J.A.S.P.E.R. Holographic Workstation is online. Ready for air-gesture manipulation, 3D voice synthesis, and multi-layered nanotech blueprints.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [blenderModelUrl, setBlenderModelUrl] = useState(null);
  const [blenderPreviewUrl, setBlenderPreviewUrl] = useState(null);
  const [blenderDetails, setBlenderDetails] = useState(null);
  const [isBlenderSynthesizing, setIsBlenderSynthesizing] = useState(false);

  // DOM Refs
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const hudCanvasRef = useRef(null);
  const gestureTrackerRef = useRef(null);
  const voiceCommanderRef = useRef(null);

  // Categories list
  const categories = useMemo(() => ['All', 'Blender 3D', 'Stark Tech', 'Nano Armor', 'Genetics & AI', 'Quantum & 4D', 'Engineering', 'Custom Projects'], []);

  // Bridge Handler: Project synthesized or loaded Blender 3D model into holographic viewport
  const handleProjectBlenderModelToWorkstation = (modelData) => {
    if (!modelData) return;
    if (sfxEnabled) playJarvisPowerUp();
    
    const glb = modelData.glbUrl;
    const preview = modelData.previewUrl;
    const promptTitle = modelData.prompt || modelData.objectType || 'Blender 3D Model';
    
    setBlenderModelUrl(glb);
    if (preview) setBlenderPreviewUrl(preview);
    setActive3dMode('blender');
    setActiveTab('viewport');

    const newProject = {
      id: `blender_${Date.now()}`,
      title: promptTitle.slice(0, 32),
      subtitle: `Blender 3D: ${modelData.objectType || 'Procedural Mesh'}`,
      category: 'Blender 3D',
      mode: 'blender',
      glbUrl: glb,
      previewUrl: preview,
      tags: ['Blender 3D', modelData.objectType || 'Mesh', 'GLB'],
      timestamp: 'Just now',
      icon: '🎨',
      isPreset: false
    };

    saveCustomProjects([newProject, ...projects.filter(p => p.glbUrl !== glb)]);
    setActiveProjectId(newProject.id);
    setResponseText(`Projected Blender 3D asset "${promptTitle}" into holographic workstation. Ready for air-gesture manipulation.`);
    speakMessage(`Blender 3D model projected to holographic workstation, sir.`);
  };

  // Listen for external "jasper:project-to-hologram" events from Blender Studio
  useEffect(() => {
    const handleProjectEvent = (e) => {
      if (e.detail) {
        handleProjectBlenderModelToWorkstation(e.detail);
      }
    };
    window.addEventListener('jasper:project-to-hologram', handleProjectEvent);
    return () => window.removeEventListener('jasper:project-to-hologram', handleProjectEvent);
  }, [projects]);

  // Query latest Blender synthesized assets on load to populate workstation
  useEffect(() => {
    fetch(`${getApiBase()}/api/blender/latest`)
      .then(r => r.json())
      .then(data => {
        if (data?.latest?.glbUrl) {
          const latestAsset = {
            id: `blender_latest_${Date.now()}`,
            title: data.latest.prompt ? data.latest.prompt.slice(0, 30) : `Blender ${data.latest.objectType || 'Model'}`,
            subtitle: `Active GLB: ${data.latest.glbFileName || 'model.glb'}`,
            category: 'Blender 3D',
            mode: 'blender',
            glbUrl: data.latest.glbUrl,
            previewUrl: data.latest.previewUrl,
            tags: ['Blender 3D', data.latest.objectType || 'Mesh', 'Active'],
            timestamp: 'Latest Export',
            icon: '🎨',
            isPreset: false
          };
          setProjects(prev => {
            if (prev.some(p => p.glbUrl === data.latest.glbUrl)) return prev;
            return [latestAsset, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Custom Projects' && !p.isPreset);
      const matchSearch = !searchQuery.trim() || 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchCat && matchSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  // Persist user custom projects
  const saveCustomProjects = (updated) => {
    setProjects(updated);
    try {
      const customOnly = updated.filter(p => !p.isPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {}
  };

  // Initial load from query prop
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleAskQuery(initialQuery);
    }
  }, [initialQuery]);

  // 4D Temporal Time Slider Loop
  useEffect(() => {
    let interval;
    if (is4dEnabled && is4dPlaying) {
      interval = setInterval(() => {
        setTime4d(prev => (prev >= 10.0 ? 0 : Number((prev + 0.2 * timeSpeed4d).toFixed(2))));
      }, 200);
    }
    return () => clearInterval(interval);
  }, [is4dEnabled, is4dPlaying, timeSpeed4d]);

  // AIR-GESTURE TRACKER LIFECYCLE
  useEffect(() => {
    if (gestureMode) {
      if (!gestureTrackerRef.current && videoRef.current && hudCanvasRef.current) {
        gestureTrackerRef.current = new AirGestureTracker(videoRef.current, hudCanvasRef.current, {
          onRotate: (dx, dy) => {
            if (canvasRef.current && canvasRef.current.rotateBy) {
              canvasRef.current.rotateBy(dx, dy);
            }
          },
          onZoom: (factor) => {
            if (canvasRef.current && canvasRef.current.zoomBy) {
              canvasRef.current.zoomBy(factor);
            }
          },
          onSwipe: (dir) => {
            handleCycleProject(dir === 'NEXT' ? 1 : -1);
          },
          onPinchTap: () => {
            setExplodedView(prev => !prev);
            setGestureFeedbackText('Exploded View Toggled via Pinch-Tap');
            if (sfxEnabled) playJarvisBeep('confirm');
          },
          onFist: () => {
            if (canvasRef.current && canvasRef.current.resetView) {
              canvasRef.current.resetView();
            }
            setGestureFeedbackText('Camera Reset to Origin via Fist Lock');
          },
          onStateChange: (st) => {
            setGestureState(st);
            if (st.gesture && st.gesture !== 'NONE') {
              setGestureFeedbackText(st.gesture);
            }
          }
        });

        gestureTrackerRef.current.start();
        setArWebcamEnabled(true); // Automatically enable camera layer for gestures
      }
    } else {
      if (gestureTrackerRef.current) {
        gestureTrackerRef.current.stop();
        gestureTrackerRef.current = null;
      }
    }

    return () => {
      if (gestureTrackerRef.current) {
        gestureTrackerRef.current.stop();
        gestureTrackerRef.current = null;
      }
    };
  }, [gestureMode]);

  // VOICE COMMANDER LIFECYCLE
  useEffect(() => {
    if (voiceEnabled) {
      if (!voiceCommanderRef.current) {
        voiceCommanderRef.current = new HolographicVoiceCommander({
          onCommand: (cmd, raw) => {
            setLastVoiceCommand(`${cmd} ("${raw}")`);
            if (sfxEnabled) playJarvisBeep('command');
            handleExecuteVoiceCommand(cmd);
          },
          onTranscript: (txt) => {
            setVoiceTranscript(txt);
          },
          onStatusChange: (st) => {}
        });
        voiceCommanderRef.current.start();
      }
    } else {
      if (voiceCommanderRef.current) {
        voiceCommanderRef.current.stop();
        voiceCommanderRef.current = null;
      }
    }

    return () => {
      if (voiceCommanderRef.current) {
        voiceCommanderRef.current.stop();
        voiceCommanderRef.current = null;
      }
    };
  }, [voiceEnabled]);

  // Execute Voice Command
  const handleExecuteVoiceCommand = (cmd) => {
    if (cmd === 'NEXT') {
      handleCycleProject(1);
    } else if (cmd === 'PREV') {
      handleCycleProject(-1);
    } else if (cmd === 'ZOOM_IN') {
      if (canvasRef.current?.zoomBy) canvasRef.current.zoomBy(1.2);
    } else if (cmd === 'ZOOM_OUT') {
      if (canvasRef.current?.zoomBy) canvasRef.current.zoomBy(-1.2);
    } else if (cmd === 'EXPLODE') {
      setExplodedView(true);
    } else if (cmd === 'REASSEMBLE') {
      setExplodedView(false);
      triggerNanotechReassembly();
    } else if (cmd === 'SWITCH_REACTOR') {
      loadProjectById('arc_reactor_core');
    } else if (cmd === 'SWITCH_REPULSOR') {
      loadProjectById('repulsor_engine');
    } else if (cmd === 'SWITCH_GENOME') {
      loadProjectById('synthetic_genome');
    } else if (cmd === 'SWITCH_IRONMAN') {
      loadProjectById('stark_mark85');
    } else if (cmd === 'SWITCH_SPIDERMAN') {
      loadProjectById('spiderman_upgraded');
    } else if (cmd === 'SWITCH_TESSERACT') {
      loadProjectById('tesseract_4d');
    } else if (cmd === 'TOGGLE_AR') {
      setArWebcamEnabled(prev => !prev);
    } else if (cmd === 'RESET_VIEW') {
      if (canvasRef.current?.resetView) canvasRef.current.resetView();
    } else if (cmd === 'SWITCH_BLENDER') {
      setActiveTab('blender');
      setResponseText('Switching to integrated Blender 3D Graphics Studio, sir.');
    } else if (cmd === 'GENERATE_BLENDER') {
      setActiveTab('blender');
      setResponseText('Blender 3D procedural generator active.');
    } else if (cmd === 'PROJECT_BLENDER') {
      if (blenderModelUrl) {
        setActive3dMode('blender');
        setActiveTab('viewport');
        setResponseText('Projecting active Blender 3D model into holographic viewport.');
      } else {
        setActiveTab('blender');
        setResponseText('Please synthesize or select a Blender 3D model first.');
      }
    }
  };

  // Cycle project through list via Air-Gesture Swipe or Voice
  const handleCycleProject = (dir) => {
    const currentIndex = filteredProjects.findIndex(p => p.id === activeProjectId);
    if (currentIndex === -1) return;
    let nextIndex = currentIndex + dir;
    if (nextIndex >= filteredProjects.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = filteredProjects.length - 1;
    loadProject(filteredProjects[nextIndex]);
  };

  // Load project into 3D Viewport
  const loadProject = (project) => {
    setActiveProjectId(project.id);
    if (sfxEnabled) playJarvisBeep('select');

    if (project.mode) {
      setActive3dMode(project.mode);
    }
    if (project.suit) {
      setSpidermanSuit(project.suit);
    }
    if (project.is4d !== undefined) {
      setIs4dEnabled(project.is4d);
    }
    if (project.glbUrl) {
      setBlenderModelUrl(project.glbUrl);
    } else {
      setBlenderModelUrl(null);
    }
    if (project.previewUrl) {
      setBlenderPreviewUrl(project.previewUrl);
    } else {
      setBlenderPreviewUrl(null);
    }

    triggerNanotechReassembly();
    setResponseText(`Loaded Project: ${project.title} — ${project.subtitle}. Active in 3D holographic workspace.`);
  };

  const loadProjectById = (id) => {
    const found = projects.find(p => p.id === id);
    if (found) loadProject(found);
  };

  // Save Current Creation into User Projects History
  const handleSaveCurrentAsProject = () => {
    const titlePrompt = window.prompt('Enter project name for current 3D Hologram:', `Creation: ${query || active3dMode}`);
    if (!titlePrompt || !titlePrompt.trim()) return;

    const newProject = {
      id: `proj_${Date.now()}`,
      title: titlePrompt.trim(),
      subtitle: `Synthesized from: ${query || active3dMode}`,
      category: 'Custom Projects',
      mode: active3dMode,
      suit: spidermanSuit,
      is4d: is4dEnabled,
      glbUrl: blenderModelUrl,
      previewUrl: blenderPreviewUrl,
      tags: ['Custom', active3dMode, 'JASPER 3D'],
      timestamp: new Date().toLocaleDateString(),
      icon: '✨',
      isPreset: false
    };

    saveCustomProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    if (sfxEnabled) playJarvisPowerUp();
  };

  // Delete custom project from history
  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this project from your creations history?')) {
      const updated = projects.filter(p => p.id !== id);
      saveCustomProjects(updated);
    }
  };

  // Query & AI 3D Synthesis
  const handleAskQuery = async (queryText) => {
    const q = queryText || query;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setResponseText('Processing neural analysis and synthesizing 3D graphic model...');
    if (sfxEnabled) playJarvisScan();

    const lower = q.toLowerCase();
    let detectedMode = 'blender';

    if (lower.includes('arc reactor') || lower.includes('reactor core')) {
      detectedMode = 'arc_reactor';
      setActive3dMode('arc_reactor');
      setBlenderModelUrl(null);
    } else if (lower.includes('repulsor') || lower.includes('thruster')) {
      detectedMode = 'repulsor';
      setActive3dMode('repulsor');
      setBlenderModelUrl(null);
    } else if (lower.includes('genome') || lower.includes('dna')) {
      detectedMode = 'genome';
      setActive3dMode('genome');
      setBlenderModelUrl(null);
    } else if (lower.includes('iron man') || lower.includes('mark 85') || lower.includes('mark 7')) {
      detectedMode = 'ironman';
      setActive3dMode('ironman');
      setBlenderModelUrl(null);
    } else if (lower.includes('spider') || lower.includes('spiderman')) {
      detectedMode = 'spiderman';
      setActive3dMode('spiderman');
      setBlenderModelUrl(null);
    } else if (lower.includes('4d') || lower.includes('tesseract')) {
      setIs4dEnabled(true);
      detectedMode = 'quantumvortex';
      setActive3dMode('quantumvortex');
      setBlenderModelUrl(null);
    } else if (lower.includes('v8') || lower.includes('engine')) {
      detectedMode = 'v8engine';
      setActive3dMode('v8engine');
      setBlenderModelUrl(null);
    } else if (lower.includes('drone') || lower.includes('recon')) {
      detectedMode = 'cyberdrone';
      setActive3dMode('cyberdrone');
      setBlenderModelUrl(null);
    } else {
      // Engage Blender Procedural Engine for custom 3D synthesis
      setActive3dMode('blender');
      setIsBlenderSynthesizing(true);

      fetch(`${getApiBase()}/api/blender/generate-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          objectType: 'auto',
          color: '#00f3ff',
          metallic: 0.9,
          roughness: 0.15,
          renderPreview: true
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.glbUrl) setBlenderModelUrl(data.glbUrl);
        if (data.previewUrl) setBlenderPreviewUrl(data.previewUrl);
        setBlenderDetails(data);

        // Add to history automatically
        const autoProj = {
          id: `ai_${Date.now()}`,
          title: q.slice(0, 32),
          subtitle: `Blender 3D: ${data.objectType || 'Mesh'}`,
          category: 'Custom Projects',
          mode: 'blender',
          glbUrl: data.glbUrl,
          previewUrl: data.previewUrl,
          tags: ['AI Synthesized', 'Blender 3D'],
          timestamp: 'Just now',
          icon: '🎨',
          isPreset: false
        };
        saveCustomProjects([autoProj, ...projects]);
        setActiveProjectId(autoProj.id);
      })
      .catch(err => {
        console.warn('[Hologram] Blender synthesis notice:', err.message);
      })
      .finally(() => {
        setIsBlenderSynthesizing(false);
      });
    }

    try {
      const res = await fetch(`${getApiBase()}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.response) {
        setResponseText(data.response);
      }
    } catch (err) {
      setResponseText(`Sir, synthesized 3D holographic projection for "${q}". Telemetry metrics mapped into live viewport.`);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerNanotechReassembly = () => {
    setNanotechReassembling(true);
    setTimeout(() => setNanotechReassembling(false), 2400);
  };

  const toggleAudioReadout = () => {
    if (!isPlayingAudio) {
      speakMessage(responseText, () => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const switchCameraView = (preset) => {
    setCameraPresetState(preset);
    if (canvasRef.current && canvasRef.current.setCameraPreset) {
      canvasRef.current.setCameraPreset(preset);
    }
  };

  return (
    <div className="bg-neutral-950/95 border border-cyan-500/40 rounded-2xl text-neutral-100 backdrop-blur-3xl shadow-[0_0_60px_rgba(0,229,255,0.25)] max-w-7xl w-full mx-auto relative overflow-hidden font-sans flex flex-col max-h-[92vh]">
      {/* Subtle Cyan Hologram Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER & STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/25 px-5 py-3.5 bg-slate-950/80 backdrop-blur-md gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/15 border border-cyan-400/50 rounded-xl text-cyan-400">
            <Box className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-wider text-cyan-300 uppercase font-orbitron">
                J.A.S.P.E.R. 3D Hologram Workstation
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                JARVIS HUD v9.4
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-2">
              <span>Two-Part Workstation</span> • <span>MediaPipe Air Gestures</span> • <span>AR Camera</span> • <span>Voice Commander</span>
            </p>
          </div>
        </div>

        {/* WORKSTATION QUICK CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AR WEBCAM TOGGLE */}
          <button
            onClick={() => {
              if (sfxEnabled) playJarvisBeep('click');
              setArWebcamEnabled(!arWebcamEnabled);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              arWebcamEnabled 
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-500/20' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live AR Camera Background behind Hologram (Tony Stark Floating Effect)"
          >
            {arWebcamEnabled ? <Camera className="w-3.5 h-3.5 text-emerald-400" /> : <CameraOff className="w-3.5 h-3.5" />}
            <span>AR Camera: {arWebcamEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* AIR-GESTURES TOGGLE */}
          <button
            onClick={() => {
              if (sfxEnabled) playJarvisBeep('click');
              setGestureMode(!gestureMode);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              gestureMode 
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/20 animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Real-time Hand Skeletal Tracking & Mid-air Gestures"
          >
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>Air Gestures: {gestureMode ? 'ACTIVE' : 'OFF'}</span>
          </button>

          {/* VOICE COMMANDS TOGGLE */}
          <button
            onClick={() => {
              if (sfxEnabled) playJarvisBeep('click');
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              voiceEnabled 
                ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-sm shadow-rose-500/20' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Hands-Free Voice Commands (Say 'Jasper, next one', 'zoom in', 'explode view')"
          >
            {voiceEnabled ? <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>Voice: {voiceEnabled ? 'LISTENING' : 'OFF'}</span>
          </button>

          {/* SFX SOUND TOGGLE */}
          <button
            onClick={() => {
              const next = !sfxEnabled;
              setSfxEnabled(next);
              if (next) playJarvisBeep('click');
            }}
            className={`p-2 rounded-xl text-xs border transition-all ${
              sfxEnabled ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle JARVIS Audio SFX"
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* CLOSE BUTTON */}
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all ml-1"
              title="Close Hologram Studio"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TWO-PART MAIN BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* ========================================================= */}
        {/* PART 1: HISTORY OF CREATIONS & PROJECTS (LEFT PANEL: 4 COLS) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 border-r border-cyan-500/20 bg-slate-950/70 flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="p-4 border-b border-cyan-500/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase">
                <FolderClock className="w-4 h-4 text-cyan-400" />
                <span>Creations & Projects History</span>
              </div>
              <button
                onClick={handleSaveCurrentAsProject}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-lg text-[10px] font-mono text-cyan-200 flex items-center gap-1 transition-all"
                title="Save current 3D view and prompt as a project"
              >
                <Plus className="w-3 h-3" /> Save Current
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search creations or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Project List Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-mono text-xs">
                No creations found matching filters.
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = activeProjectId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => loadProject(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-850 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-base p-1 bg-slate-950 rounded border border-slate-800/80">
                          {p.icon || '📦'}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className={`text-xs font-bold font-mono tracking-tight ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                              {p.title}
                            </h4>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug line-clamp-1 mt-0.5">
                            {p.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Icons */}
                      <div className="flex items-center gap-1">
                        {!p.isPreset && (
                          <button
                            onClick={(e) => handleDeleteProject(e, p.id)}
                            className="p-1 hover:text-rose-400 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                      </div>
                    </div>

                    {/* Bottom Metadata & Tags */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 text-[9px] font-mono text-slate-500">
                      <span className="text-cyan-400/70">{p.timestamp || 'Ready'}</span>
                      <div className="flex gap-1">
                        {p.tags?.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 bg-slate-800/80 text-slate-400 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Summary Counter */}
          <div className="p-3 border-t border-cyan-500/15 bg-slate-950 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Total Projects: {projects.length}</span>
            <span className="text-cyan-400 font-bold">Active: {filteredProjects.find(p => p.id === activeProjectId)?.title || 'None'}</span>
          </div>
        </div>


        {/* ========================================================= */}
        {/* PART 2: HOLOGRAPHIC WORKSTATION & TOOLS (RIGHT PANEL: 8 COLS) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 flex flex-col overflow-hidden bg-slate-950/40">
          
          {/* SUB-HEADER TOOL TABS */}
          <div className="flex items-center justify-between border-b border-cyan-500/15 px-4 py-2 bg-slate-950/60 text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('viewport')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'viewport' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Viewport & HUD</span>
              </button>
              <button
                onClick={() => setActiveTab('blender')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'blender' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>Blender 3D Studio</span>
                {blenderModelUrl && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'tools' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Workstation Tools</span>
              </button>
              <button
                onClick={() => setActiveTab('calibration')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'calibration' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span>Projection Calibration (?w={calibWidth}&h={calibHeight})</span>
              </button>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2 text-[10px]">
              <button
                onClick={() => {
                  if (sfxEnabled) playJarvisBeep('click');
                  setExplodedView(!explodedView);
                }}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                  explodedView ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Layers className="w-3 h-3" />
                Exploded View: {explodedView ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => {
                  if (sfxEnabled) playJarvisBeep('click');
                  triggerNanotechReassembly();
                }}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-lg text-amber-300 flex items-center gap-1 transition-all"
              >
                <RefreshCcw className="w-3 h-3" />
                Reassemble
              </button>
            </div>
          </div>

          {/* MAIN 3D WORKSTATION VIEWPORT OR INTEGRATED BLENDER 3D STUDIO */}
          {activeTab === 'blender' ? (
            <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-950">
              <BlenderStudioModal
                embedded={true}
                isOpen={true}
                onProjectToHologram={handleProjectBlenderModelToWorkstation}
              />
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
            
            {/* 1. AR LIVE WEBCAM VIDEO LAYER (UNDERNEATH CANVAS) */}
            {arWebcamEnabled && (
              <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover opacity-75 filter contrast-125 brightness-90 ${peppersGhostMode ? 'scale-x-[-1] scale-y-[-1]' : 'scale-x-[-1]'}`}
                />
                <div className="absolute inset-0 bg-cyan-950/20 backdrop-filter" />
              </div>
            )}

            {/* 2. THREE.JS 3D CANVAS VIEWPORT */}
            <div 
              className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-300"
              style={{
                transform: `scale(${calibScale}) ${peppersGhostMode ? 'rotate(180deg)' : ''}`,
                aspectRatio: `${calibWidth} / ${calibHeight}`
              }}
            >
              <Hologram3dCanvas
                ref={canvasRef}
                mode={active3dMode}
                spidermanSuit={spidermanSuit}
                poseMode={poseMode}
                autoRotate={autoRotate}
                hudOverlay={hudOverlay}
                bloomEnabled={bloomEnabled}
                webFiring={webFiring}
                explodedView={explodedView}
                nanotechReassembling={nanotechReassembling}
                is4dEnabled={is4dEnabled}
                time4d={time4d}
                timeSpeed4d={timeSpeed4d}
                is4dPlaying={is4dPlaying}
                starkReticles={starkReticles}
                sfxEnabled={sfxEnabled}
                blenderModelUrl={blenderModelUrl}
              />

              {/* 3. AIR-GESTURE SKELETAL HUD CANVAS OVERLAY */}
              <canvas
                ref={hudCanvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full pointer-events-none z-20 object-cover"
              />

              {/* 4. LIVE AIR-GESTURE TELEMETRY BADGE */}
              {gestureMode && (
                <div className="absolute top-3 left-3 z-30 flex flex-col gap-1 pointer-events-none">
                  <div className="bg-slate-950/85 border border-amber-500/50 px-3 py-1.5 rounded-lg text-[10px] font-mono text-amber-300 flex items-center gap-2 shadow-lg shadow-amber-500/10">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="font-bold">GESTURE ENGINE: {gestureState.gesture || 'TRACKING'}</span>
                    <span className="text-slate-400">({gestureState.handCount || 0} HANDS)</span>
                  </div>
                  <div className="text-[9px] font-mono text-amber-200/80 bg-slate-950/70 px-2 py-0.5 rounded border border-amber-500/20">
                    {gestureFeedbackText}
                  </div>
                </div>
              )}

              {/* 5. VOICE COMMAND NOTIFIER */}
              {voiceEnabled && (
                <div className="absolute bottom-3 left-3 z-30 flex flex-col gap-1 pointer-events-none">
                  <div className="bg-slate-950/85 border border-rose-500/50 px-3 py-1.5 rounded-lg text-[10px] font-mono text-rose-300 flex items-center gap-2 shadow-lg shadow-rose-500/10">
                    <Mic className="w-3 h-3 text-rose-400 animate-pulse" />
                    <span>VOICE: {voiceTranscript ? `"${voiceTranscript}"` : 'Listening for "Jasper"...'}</span>
                  </div>
                  {lastVoiceCommand && (
                    <div className="text-[9px] font-mono text-rose-200 bg-slate-950/70 px-2 py-0.5 rounded border border-rose-500/20">
                      Executed: {lastVoiceCommand}
                    </div>
                  )}
                </div>
              )}

              {/* 6. HUD RETICLE BADGES AT CORNERS */}
              {starkReticles && (
                <div className="absolute top-3 right-3 z-30 pointer-events-none font-mono text-[9px] text-cyan-400 bg-slate-950/70 px-2.5 py-1 rounded border border-cyan-500/30 flex flex-col items-end">
                  <span>MARK 85 ARCHITECTURE</span>
                  <span className="text-emerald-400">FPS: 60 // SYNC 99.8%</span>
                </div>
              )}
            </div>

            {/* OVERLAY TABS: TOOLS & CALIBRATION DRAWERS */}
            {activeTab === 'tools' && (
              <div className="absolute inset-x-4 bottom-4 top-4 z-40 bg-slate-950/95 border border-cyan-500/40 rounded-xl p-5 overflow-y-auto space-y-4 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-300">
                    <Settings2 className="w-4 h-4 text-cyan-400" />
                    <span>Holographic Workstation Toolset</span>
                  </div>
                  <button onClick={() => setActiveTab('viewport')} className="p-1 text-slate-400 hover:text-slate-200">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Camera Inspector Presets */}
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5" /> Camera Inspector Presets
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'full', label: 'Full Model', icon: Maximize2 },
                        { id: 'texture', label: '4K Micro-Zoom', icon: ZoomIn },
                        { id: 'lens', label: 'Core / Lens Zoom', icon: Eye },
                        { id: 'shooter', label: 'Emitter Close-up', icon: Sliders }
                      ].map(cam => (
                        <button
                          key={cam.id}
                          onClick={() => switchCameraView(cam.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                            cameraPreset === cam.id
                              ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-100'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cam.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4D Temporal Dynamics Controls */}
                  <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 4D Temporal Slider (t = {time4d.toFixed(2)}s)
                      </span>
                      <button
                        onClick={() => setIs4dPlaying(!is4dPlaying)}
                        className="text-[10px] px-2 py-0.5 bg-purple-500/20 border border-purple-400/40 rounded text-purple-200"
                      >
                        {is4dPlaying ? 'Pause' : 'Play'}
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.05"
                      value={time4d}
                      onChange={(e) => setTime4d(parseFloat(e.target.value))}
                      className="w-full accent-purple-400 bg-slate-900 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* DroidCam / IP Camera Stream Config */}
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Remote Phone Camera (DroidCam / IP Webcam)
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Connect an external Android smartphone stream over Wi-Fi as seen in the reel.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="http://192.168.1.XX:4747/video"
                        value={droidCamIp}
                        onChange={(e) => setDroidCamIp(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono"
                      />
                      <button
                        onClick={() => {
                          if (droidCamIp && videoRef.current) {
                            videoRef.current.src = droidCamIp;
                            setArWebcamEnabled(true);
                          }
                        }}
                        className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 rounded-lg text-xs font-mono text-emerald-200"
                      >
                        Connect
                      </button>
                    </div>
                  </div>

                  {/* Blender 3D Export & Assets */}
                  <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-cyan-400" /> Blender 3D Engine & Assets
                      </span>
                      <button
                        onClick={() => setActiveTab('blender')}
                        className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-[10px] font-mono rounded-lg transition flex items-center gap-1 font-semibold"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-300" />
                        <span>Open Blender Studio</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {blenderModelUrl ? (
                        <>
                          <a
                            href={`${getApiBase()}${blenderModelUrl}`}
                            download="jasper_model.glb"
                            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-lg text-xs font-mono text-cyan-200 flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" /> Download GLB
                          </a>
                          <button
                            onClick={() => {
                              setActive3dMode('blender');
                              setActiveTab('viewport');
                            }}
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400 rounded-lg text-xs font-mono text-blue-200 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> View in Viewport
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-mono text-slate-500">No active Blender export loaded</span>
                          <button
                            onClick={() => setActiveTab('blender')}
                            className="text-[10px] font-mono text-cyan-400 hover:underline"
                          >
                            + Synthesize New Mesh
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OVERLAY TABS: CALIBRATION DRAWER (?w=&h=&s=) */}
            {activeTab === 'calibration' && (
              <div className="absolute inset-x-4 bottom-4 top-4 z-40 bg-slate-950/95 border border-cyan-500/40 rounded-xl p-5 overflow-y-auto space-y-4 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-300">
                    <Tv className="w-4 h-4 text-cyan-400" />
                    <span>Physical Hologram & Pepper's Ghost Calibration</span>
                  </div>
                  <button onClick={() => setActiveTab('viewport')} className="p-1 text-slate-400 hover:text-slate-200">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 font-mono">
                  Calibrate width, height, and scale to match your physical acrylic pyramid or angled glass reflector, as demonstrated in the reel.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-xs font-mono text-cyan-400">Width Aspect (w = {calibWidth})</span>
                    <input
                      type="range"
                      min="8"
                      max="24"
                      step="0.5"
                      value={calibWidth}
                      onChange={(e) => setCalibWidth(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-xs font-mono text-cyan-400">Height Aspect (h = {calibHeight})</span>
                    <input
                      type="range"
                      min="6"
                      max="18"
                      step="0.5"
                      value={calibHeight}
                      onChange={(e) => setCalibHeight(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-xs font-mono text-cyan-400">Scale Factor (s = {calibScale}x)</span>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={calibScale}
                      onChange={(e) => setCalibScale(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-950 h-1.5 rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setPeppersGhostMode(!peppersGhostMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
                      peppersGhostMode ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Pepper's Ghost Inverted Projection: {peppersGhostMode ? 'ACTIVE' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCalibWidth(15);
                      setCalibHeight(8.5);
                      setCalibScale(1.0);
                      setPeppersGhostMode(false);
                    }}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          {/* AI SPEECH COMMENTARY READOUT */}
          <div className="px-5 py-2 bg-slate-950/90 border-t border-cyan-500/15 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <p className="text-slate-300 truncate font-sans text-xs">
                {responseText}
              </p>
            </div>
            <button
              onClick={toggleAudioReadout}
              className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-all"
            >
              {isPlayingAudio ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-cyan-400" />}
              <span>{isPlayingAudio ? 'Pause Voice' : 'Listen'}</span>
            </button>
          </div>

          {/* PROMPT TYPING PLACE & WORKSTATION CONSOLE */}
          <div className="p-4 bg-slate-950/95 border-t border-cyan-500/25 space-y-2.5">
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono text-slate-400">
              <span className="shrink-0 text-cyan-400">Quick Synthesize:</span>
              {[
                'Quantum Arc Reactor Mark 2',
                'Stark Repulsor Flight Engine',
                'Synthetic Genome Double Helix',
                'Iron Spider Nanotech Waldo Armor',
                '4D Tesseract Temporal Hypercube',
                'Autonomous Cyber Recon Drone'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(chip);
                    handleAskQuery(chip);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 whitespace-nowrap transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Prompt Typing Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleAskQuery(); }} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Describe any 3D Holographic creation (e.g. Arc Reactor core, V8 engine, Nanotech armor, 4D warp)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none backdrop-blur-md shadow-inner font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-5 py-2.5 bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400 text-cyan-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-cyan-500/20 font-mono shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Synthesizing...' : 'Synthesize 3D'}</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
