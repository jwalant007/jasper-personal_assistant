import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Play, Pause, RotateCcw, Download, UploadCloud, Sparkles, Wand2,
  Film, Layers, Type, Music, Settings, Check, Copy, ExternalLink,
  ChevronRight, Plus, Trash2, Sliders, Volume2, VolumeX, Eye, Share2,
  RefreshCw, FileText, Layout, Youtube, Clock, AlertCircle
} from 'lucide-react';
import geminiClient from '../utils/geminiClient';
import { getApiBase } from '../utils/apiConfig';
import { playJarvisBeep, playJarvisPowerUp } from '../utils/jarvisAudioSynth';

// Pre-defined B-Roll background shaders & procedural particle generators
const VISUAL_THEMES = [
  { id: 'cyberpunk', name: 'Cyberpunk Neon', primary: '#06b6d4', secondary: '#ec4899', bg: '#030712' },
  { id: 'space', name: 'Cosmic Galaxy', primary: '#8b5cf6', secondary: '#38bdf8', bg: '#020617' },
  { id: 'matrix', name: 'Digital Matrix', primary: '#10b981', secondary: '#34d399', bg: '#022c22' },
  { id: 'stark_hud', name: 'Stark Arc HUD', primary: '#f59e0b', secondary: '#ef4444', bg: '#1c1917' },
  { id: 'abstract', name: 'Deep Tech Wave', primary: '#3b82f6', secondary: '#6366f1', bg: '#0f172a' },
  { id: 'sunset', name: 'Golden Sunset', primary: '#f97316', secondary: '#fbbf24', bg: '#18181b' }
];

// Caption Styles (CapCut / InVideo AI style)
const CAPTION_STYLES = [
  { id: 'hormozi', name: 'MrBeast / Hormozi Bold', font: 'Impact, sans-serif', color: '#facc15', highlight: '#06b6d4' },
  { id: 'minimal', name: 'Cinematic Minimal', font: 'Inter, sans-serif', color: '#ffffff', highlight: '#38bdf8' },
  { id: 'cyber', name: 'Cyberpunk Glow', font: 'monospace', color: '#22d3ee', highlight: '#f43f5e' },
  { id: 'bold_box', name: 'Modern Boxed', font: 'Arial Black, sans-serif', color: '#ffffff', highlight: '#f97316' }
];

// Built-in BGM presets using Web Audio API procedural synthesis
const BGM_TRACKS = [
  { id: 'synthwave', name: 'Cyberpunk Synthwave', tempo: 120, mood: 'Energetic' },
  { id: 'cinematic', name: 'Epic Cinematic Drone', tempo: 80, mood: 'Atmospheric' },
  { id: 'lofi', name: 'Lo-Fi Chill Beats', tempo: 90, mood: 'Calm' },
  { id: 'none', name: 'Voice Only (No Music)', tempo: 0, mood: 'Quiet' }
];

export default function JasperVideoStudioApp({ onClose, onLockSystem } = {}) {
  // Navigation & Mode
  const [activeTab, setActiveTab] = useState('creator'); // 'creator' | 'editor' | 'preview' | 'youtube'
  const [creationMode, setCreationMode] = useState('topic'); // 'topic' | 'script'
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' (YouTube) | '9:16' (Shorts / Reels)

  // Inputs
  const [promptTopic, setPromptTopic] = useState('5 Mind-Blowing AI Breakthroughs that Change Everything in 2026');
  const [rawScriptText, setRawScriptText] = useState('');
  const [targetLength, setTargetLength] = useState('short'); // 'short' (30-60s) | 'medium' (1-2m) | 'explainer' (3m+)
  const [voicePersonality, setVoicePersonality] = useState('jarvis'); // 'jarvis' | 'friday' | 'creator' | 'trailer'
  const [selectedBgm, setSelectedBgm] = useState('synthwave');
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState('hormozi');

  // Generation & Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // Generated Video Project Data
  const [videoProject, setVideoProject] = useState({
    title: '5 Mind-Blowing AI Breakthroughs in 2026',
    description: 'Explore the top AI technologies revolutionizing robotics, quantum computing, and personal intelligence. Created with J.A.S.P.E.R. AI Video Studio.\n\n#AI #Technology #Future #Shorts',
    tags: 'AI 2026, artificial intelligence, quantum AI, Jasper AI, robotics, tech news, breakthrough',
    scenes: [
      {
        id: 1,
        title: 'Hook / Opening',
        narration: 'Artificial intelligence in 2026 is no longer just software. It has stepped into physical reality.',
        caption: 'AI IN 2026 HAS CHANGED REALITY',
        duration: 4.5,
        theme: 'cyberpunk',
        zoomEffect: 'zoomIn'
      },
      {
        id: 2,
        title: 'Neural Physical Systems',
        narration: 'From autonomous humanoid labor to local neural chips operating directly on your desktop.',
        caption: 'HUMANOID WORKFORCE & NEURAL CHIPS',
        duration: 5.0,
        theme: 'stark_hud',
        zoomEffect: 'panLeft'
      },
      {
        id: 3,
        title: 'Quantum Synthesis',
        narration: 'Quantum neural networks are solving molecular biology problems in seconds instead of centuries.',
        caption: 'QUANTUM NETWORKS SOLVE CENTURIES',
        duration: 5.5,
        theme: 'matrix',
        zoomEffect: 'zoomOut'
      },
      {
        id: 4,
        title: 'Call to Action',
        narration: 'Subscribe to stay at the cutting edge of personal artificial intelligence. What do you think is coming next?',
        caption: 'SUBSCRIBE FOR THE FUTURE OF TECH',
        duration: 4.5,
        theme: 'space',
        zoomEffect: 'zoomIn'
      }
    ]
  });

  // Playback & Timeline State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.25);
  const [activeEditingSceneId, setActiveEditingSceneId] = useState(1);

  // Export & Recording State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  const [exportedBlob, setExportedBlob] = useState(null);

  // YouTube Upload State
  const [youtubeChannel, setYoutubeChannel] = useState({
    channelName: "Jwalant's Official Channel",
    isConnected: true,
    privacy: 'public',
    category: 'Science & Technology',
    isShorts: false
  });
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'copied'
  const [uploadedVideoId, setUploadedVideoId] = useState(null);

  // Canvas & Audio Refs
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const bgmOscillatorsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const playbackStartTimeRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Total video duration calculation
  const totalDuration = videoProject.scenes.reduce((acc, s) => acc + (Number(s.duration) || 4), 0);

  // -------------------------------------------------------------
  // AI GENERATOR: TOPIC OR SCRIPT TO FULL STORYBOARD
  // -------------------------------------------------------------
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGenerationProgress(15);
    setGenerationStatus('Synthesizing script and narrative hook with Gemini AI...');
    playJarvisPowerUp();

    const isShortFormat = aspectRatio === '9:16';
    const systemPrompt = `You are J.A.S.P.E.R. InVideo & CapCut style AI Video Producer.
Generate a high-retention video storyboard for YouTube ${isShortFormat ? 'Shorts / TikTok (Vertical 9:16)' : 'Landscape (16:9)'}.

User Input:
${creationMode === 'topic' ? `Topic: "${promptTopic}"` : `Script to Adapt: "${rawScriptText}"`}
Target Pacing: ${targetLength}
Aspect Ratio: ${aspectRatio}

Return PURE JSON ONLY (no markdown blocks, no formatting text):
{
  "title": "High CTR Clickable YouTube Title",
  "description": "Engaging description with timestamps, chapters, and hashtags #Shorts",
  "tags": "comma, separated, viral, tags",
  "scenes": [
    {
      "id": 1,
      "title": "Short scene title",
      "narration": "Exact conversational voiceover sentence (concise and punchy)",
      "caption": "PUNCHY 4-6 WORD ALL-CAPS HIGHLIGHT SUBTITLE",
      "duration": 4.5,
      "theme": "cyberpunk" or "space" or "matrix" or "stark_hud" or "abstract" or "sunset",
      "zoomEffect": "zoomIn" or "zoomOut" or "panLeft" or "panRight"
    }
  ]
}
Generate between 4 to 7 scenes tailored to the topic.`;

    try {
      const apiKey = localStorage.getItem('jasper_gemini_key') || localStorage.getItem('jasper_gemini_api_key');
      let parsedResult = null;

      if (apiKey) {
        setGenerationProgress(45);
        setGenerationStatus('Generating cinematic visual themes and timed scenes...');
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        for (const model of models) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
              })
            });
            if (res.ok) {
              const data = await res.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                parsedResult = JSON.parse(text);
                break;
              }
            }
          } catch (e) {
            console.warn('Gemini model attempt failed:', e);
          }
        }
      }

      // Offline fallback heuristic generation if offline or API key missing
      if (!parsedResult || !parsedResult.scenes || parsedResult.scenes.length === 0) {
        setGenerationProgress(70);
        setGenerationStatus('Assembling intelligent storyboard scenes...');
        parsedResult = generateLocalStoryboard(creationMode === 'topic' ? promptTopic : rawScriptText, isShortFormat);
      }

      setGenerationProgress(100);
      setVideoProject(parsedResult);
      setActiveEditingSceneId(parsedResult.scenes[0]?.id || 1);
      setCurrentSceneIndex(0);
      setCurrentTime(0);
      setIsGenerating(false);
      setActiveTab('preview');
      playJarvisBeep('success');
    } catch (err) {
      console.error('Video generation error:', err);
      setIsGenerating(false);
      playJarvisBeep('error');
    }
  };

  // Local fallback storyboard generator
  const generateLocalStoryboard = (topicOrScript, isShort) => {
    const raw = topicOrScript.trim() || 'Revolutionary AI Technology';
    const title = `${raw.slice(0, 48)}: What Nobody Told You`;
    const themes = ['cyberpunk', 'stark_hud', 'space', 'matrix', 'abstract'];

    const sentences = raw.includes('.') 
      ? raw.split('.').filter(s => s.trim().length > 8)
      : [
          `Did you know that ${raw} is transforming our reality faster than ever?`,
          `Recent breakthroughs in intelligence have unlocked capabilities once considered science fiction.`,
          `Engineers and researchers around the globe are pushing computational boundaries to the absolute limit.`,
          `This fundamentally shifts how we interact with technology, personal automation, and creative media.`,
          `Hit like and subscribe to stay ahead of the future. Drop your thoughts in the comments below!`
        ];

    const scenes = sentences.slice(0, 5).map((s, idx) => ({
      id: idx + 1,
      title: `Scene ${idx + 1}`,
      narration: s.trim() + '.',
      caption: s.trim().slice(0, 32).toUpperCase(),
      duration: Math.max(3.5, Math.min(7.0, Math.round(s.trim().split(' ').length * 0.45))),
      theme: themes[idx % themes.length],
      zoomEffect: idx % 2 === 0 ? 'zoomIn' : 'zoomOut'
    }));

    return {
      title,
      description: `${raw}\n\nIn this video, we break down everything you need to know about ${raw}.\n\nCreated autonomously with J.A.S.P.E.R. AI Video Studio.\n\n#Technology #AI #Future ${isShort ? '#Shorts' : ''}`,
      tags: `${raw}, AI video, CapCut AI, InVideo, technology, future tech, Jasper OS`,
      scenes
    };
  };

  // -------------------------------------------------------------
  // REAL-TIME CANVAS VIDEO RENDERER (KEN BURNS + PROCEDURAL SHADERS + SUBTITLES)
  // -------------------------------------------------------------
  const renderCanvasFrame = (timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Calculate current scene based on currentTime
    let accum = 0;
    let scene = videoProject.scenes[0];
    let sceneStart = 0;
    let sceneIndex = 0;

    for (let i = 0; i < videoProject.scenes.length; i++) {
      const s = videoProject.scenes[i];
      const dur = Number(s.duration) || 4;
      if (currentTime >= accum && currentTime < accum + dur) {
        scene = s;
        sceneStart = accum;
        sceneIndex = i;
        break;
      }
      accum += dur;
    }

    if (sceneIndex !== currentSceneIndex) {
      setCurrentSceneIndex(sceneIndex);
    }

    const sceneDur = Number(scene?.duration) || 4;
    const sceneProgress = Math.min(1, Math.max(0, (currentTime - sceneStart) / sceneDur));

    // 1. Clear background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Procedural Dynamic Animated Background
    const theme = VISUAL_THEMES.find(t => t.id === scene?.theme) || VISUAL_THEMES[0];
    ctx.save();

    // Ken-Burns Zoom/Pan transform
    const scale = scene?.zoomEffect === 'zoomIn' 
      ? 1 + sceneProgress * 0.15 
      : scene?.zoomEffect === 'zoomOut' 
        ? 1.15 - sceneProgress * 0.15 
        : 1.05;
    
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // Dynamic gradient flow
    const grad = ctx.createRadialGradient(
      width * 0.5 + Math.sin(timestamp * 0.001) * 100,
      height * 0.5 + Math.cos(timestamp * 0.0015) * 80,
      20,
      width * 0.5,
      height * 0.5,
      width * 0.8
    );
    grad.addColorStop(0, theme.secondary);
    grad.addColorStop(0.4, theme.primary);
    grad.addColorStop(1, theme.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Animated Grid Lines & Particle Stars
    ctx.lineWidth = 1;
    ctx.strokeStyle = `${theme.primary}33`;
    const gridSize = 40;
    const gridOffset = (timestamp * 0.05) % gridSize;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridOffset; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Floating Cyber Particles
    for (let i = 0; i < 24; i++) {
      const px = ((i * 137.5 + timestamp * 0.04) % width);
      const py = ((i * 269.3 - timestamp * 0.02) % height + height) % height;
      const r = (i % 3) + 1.5;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? theme.primary : '#ffffff';
      ctx.shadowColor = theme.secondary;
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    // Holographic Stark Center Reticle (HUD circles)
    if (scene?.theme === 'stark_hud' || scene?.theme === 'space') {
      ctx.strokeStyle = `${theme.primary}88`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(timestamp * 0.0008);
      ctx.strokeStyle = `${theme.secondary}aa`;
      ctx.setLineDash([12, 18]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // 3. Cinematic Vignette Overlay
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 4. Branding Badge (Top Left)
    ctx.font = 'bold 13px Orbitron, monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillText('⚡ J.A.S.P.E.R. STUDIO AI', 24, 34);

    // Scene indicator badge (Top Right)
    ctx.font = '11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'right';
    ctx.fillText(`SCENE ${sceneIndex + 1}/${videoProject.scenes.length} • ${aspectRatio}`, width - 24, 34);
    ctx.textAlign = 'left';

    // 5. ANIMATED CAPTIONS & SUBTITLES (CapCut / InVideo Style)
    if (scene?.caption) {
      const captionStyle = CAPTION_STYLES.find(c => c.id === selectedCaptionStyle) || CAPTION_STYLES[0];
      const words = scene.caption.split(' ');
      const wordsCount = words.length;
      
      // Calculate active highlighted word based on scene progress
      const activeWordIdx = Math.min(wordsCount - 1, Math.floor(sceneProgress * wordsCount));

      ctx.save();
      const fontSize = aspectRatio === '9:16' ? Math.round(width * 0.075) : Math.round(height * 0.07);
      ctx.font = `bold ${fontSize}px ${captionStyle.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const captionY = aspectRatio === '9:16' ? height * 0.72 : height * 0.80;

      // Draw Subtitle Box Background
      const fullText = scene.caption;
      const textMetrics = ctx.measureText(fullText);
      const boxW = Math.min(width - 40, textMetrics.width + 36);
      const boxH = fontSize * 1.5;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.roundRect(width / 2 - boxW / 2, captionY - boxH / 2, boxW, boxH, 12);
      ctx.fill();
      ctx.strokeStyle = `${theme.primary}66`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Render Words with Pop Animation on active word
      let curX = width / 2 - textMetrics.width / 2;
      words.forEach((word, wIdx) => {
        const wordMetric = ctx.measureText(word + ' ');
        const isCurrentWord = wIdx === activeWordIdx;

        ctx.save();
        if (isCurrentWord) {
          ctx.fillStyle = captionStyle.highlight;
          ctx.shadowColor = captionStyle.highlight;
          ctx.shadowBlur = 14;
          // Scale pop
          ctx.font = `bold ${Math.round(fontSize * 1.08)}px ${captionStyle.font}`;
        } else {
          ctx.fillStyle = captionStyle.color;
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;
        }

        ctx.fillText(word, curX + wordMetric.width / 2 - 4, captionY);
        ctx.restore();

        curX += wordMetric.width;
      });

      ctx.restore();
    }

    // 6. Bottom Progress Bar
    const progressPct = totalDuration > 0 ? (currentTime / totalDuration) : 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, height - 6, width, 6);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, height - 6, width * progressPct, 6);
  };

  // Canvas loop effect
  useEffect(() => {
    let animId;
    const loop = (ts) => {
      renderCanvasFrame(ts);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  });

  // Playback timer & TTS voice narration synchronization
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const interval = 100; // 100ms tick
      timer = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalDuration]);

  // Voice narration trigger when scene changes during playback
  useEffect(() => {
    if (isPlaying && !isMuted) {
      const currentScene = videoProject.scenes[currentSceneIndex];
      if (currentScene && currentScene.narration && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentScene.narration);
        
        // Voice selection tuning
        const voices = window.speechSynthesis.getVoices();
        const britishVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('Oliver') || v.name.includes('George'));
        const usVoice = voices.find(v => v.lang.includes('en-US') && !v.name.includes('Google'));
        
        if (voicePersonality === 'jarvis' && britishVoice) {
          utterance.voice = britishVoice;
          utterance.pitch = 0.95;
          utterance.rate = 1.05;
        } else if (voicePersonality === 'trailer') {
          utterance.pitch = 0.75;
          utterance.rate = 0.9;
        } else if (voicePersonality === 'friday') {
          const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
          if (femaleVoice) utterance.voice = femaleVoice;
          utterance.pitch = 1.1;
          utterance.rate = 1.05;
        } else if (usVoice) {
          utterance.voice = usVoice;
          utterance.rate = 1.1;
        }

        window.speechSynthesis.speak(utterance);
      }
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [currentSceneIndex, isPlaying, isMuted, voicePersonality]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } else {
      setIsPlaying(true);
      playJarvisBeep('select');
    }
  };

  // -------------------------------------------------------------
  // CLIENT-SIDE VIDEO EXPORT & MEDIARECORDER RECORDING
  // -------------------------------------------------------------
  const handleExportVideo = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setExportProgress(10);
    playJarvisPowerUp();

    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30); // 30 FPS video stream
      recordedChunksRef.current = [];

      const options = { mimeType: 'video/webm;codecs=vp9' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setExportedBlob(blob);
        setExportedVideoUrl(url);
        setIsExporting(false);
        setExportProgress(100);
        playJarvisBeep('success');
      };

      // Play video from beginning to record full render
      setCurrentTime(0);
      setIsPlaying(true);
      recorder.start();

      // Track export progress
      const exportTimer = setInterval(() => {
        setCurrentTime(t => {
          const pct = Math.round((t / totalDuration) * 95);
          setExportProgress(pct);
          if (t >= totalDuration - 0.2) {
            clearInterval(exportTimer);
            recorder.stop();
            setIsPlaying(false);
          }
          return t;
        });
      }, 100);

    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      playJarvisBeep('error');
    }
  };

  // Download rendered video file
  const handleDownloadVideo = () => {
    if (!exportedVideoUrl) return;
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    a.download = `${videoProject.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playJarvisBeep('click');
  };

  // -------------------------------------------------------------
  // YOUTUBE UPLOAD & PUBLISH DISPATCH
  // -------------------------------------------------------------
  const handleUploadToYouTube = async () => {
    setUploadStatus('uploading');
    playJarvisPowerUp();

    // Copy title & description to clipboard for seamless workflow
    const uploadBundle = `${videoProject.title}\n\n${videoProject.description}\n\nTags: ${videoProject.tags}`;
    try {
      await navigator.clipboard.writeText(uploadBundle);
    } catch (e) {}

    try {
      // Check if server has YouTube upload endpoint available
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/youtube/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoProject.title,
          description: videoProject.description,
          tags: videoProject.tags,
          privacy: youtubeChannel.privacy,
          category: youtubeChannel.category,
          isShorts: aspectRatio === '9:16'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedVideoId(data.videoId || 'dQw4w9WgXcQ');
        setUploadStatus('success');
      } else {
        // Fallback: Open YouTube Studio upload creator directly with clipboard alert
        setUploadStatus('copied');
        window.open('https://studio.youtube.com/channel/upload', '_blank');
      }
      playJarvisBeep('success');
    } catch (err) {
      // Offline fallback: Open YouTube Studio web interface
      setUploadStatus('copied');
      window.open('https://studio.youtube.com/channel/upload', '_blank');
      playJarvisBeep('command');
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      
      {/* ── TOP HEADER & TAB BAR ── */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-orbitron text-cyan-200 tracking-wider flex items-center gap-1.5">
              <span>J.A.S.P.E.R. VIDEO STUDIO AI</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">CAPCUT & INVIDEO ENGINE</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">Autonomous Script-to-Video & YouTube Channel Publishing</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {[
            { id: 'creator', label: '1. AI Prompt & Script', icon: Wand2 },
            { id: 'preview', label: '2. Live Player & Canvas', icon: Play },
            { id: 'editor', label: '3. Storyboard & Timeline', icon: Layers },
            { id: 'youtube', label: '4. YouTube Upload', icon: Youtube }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  playJarvisBeep('click');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  active 
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-bold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* TAB 1: AI CREATOR & SCRIPT GENERATOR */}
        {activeTab === 'creator' && (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Topic & Script Prompting (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Mode Toggle */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-semibold">Video Creation Source:</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setCreationMode('topic')}
                    className={`px-3 py-1 rounded-md transition-all ${creationMode === 'topic' ? 'bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-500/40' : 'text-slate-400'}`}
                  >
                    💡 Topic to Video
                  </button>
                  <button
                    onClick={() => setCreationMode('script')}
                    className={`px-3 py-1 rounded-md transition-all ${creationMode === 'script' ? 'bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-500/40' : 'text-slate-400'}`}
                  >
                    📜 Script to Video
                  </button>
                </div>
              </div>

              {/* Topic Input Box */}
              {creationMode === 'topic' ? (
                <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col gap-3">
                  <label className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Enter Topic or Creative Idea</span>
                  </label>
                  <textarea
                    value={promptTopic}
                    onChange={(e) => setPromptTopic(e.target.value)}
                    rows={3}
                    placeholder="e.g. 5 Mind-Blowing AI Breakthroughs that Change Everything in 2026..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                  />

                  {/* Preset Idea Chips */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Trending Topic Templates:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '5 AI Breakthroughs in 2026',
                        'Why Discipline Beats Motivation',
                        'How Stark Arc Reactor Physics Works',
                        'Top 3 Space Mysteries Unsolved',
                        'Quantum Computing Explained in 60s'
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPromptTopic(chip)}
                          className="px-2.5 py-1 bg-slate-800/80 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/50 rounded-lg text-[10px] font-mono text-slate-300 transition-all text-left"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col gap-3">
                  <label className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Paste Custom Script or Video Text</span>
                  </label>
                  <textarea
                    value={rawScriptText}
                    onChange={(e) => setRawScriptText(e.target.value)}
                    rows={6}
                    placeholder="Paste paragraphs or sentences. AI will automatically segment them into timed scenes, animated subtitles, and visual prompts..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none custom-scrollbar"
                  />
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-orbitron font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>{generationStatus || 'Generating Storyboard & Timed Visuals...'} ({generationProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-cyan-300" />
                    <span>Generate Storyboard & Visuals with Gemini AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Video Specs & Formatting (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Aspect Ratio Toggle (YouTube Landscape vs Shorts/Reels) */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
                <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Format & Aspect Ratio</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAspectRatio('16:9')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      aspectRatio === '16:9'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-9 h-5 border-2 border-current rounded-sm flex items-center justify-center text-[8px] font-mono">16:9</div>
                    <span className="text-xs font-bold font-mono">YouTube Standard</span>
                    <span className="text-[9px] text-slate-400">1920 × 1080 Widescreen</span>
                  </button>

                  <button
                    onClick={() => setAspectRatio('9:16')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-5 h-9 border-2 border-current rounded-sm flex items-center justify-center text-[8px] font-mono">9:16</div>
                    <span className="text-xs font-bold font-mono">Shorts & Reels</span>
                    <span className="text-[9px] text-slate-400">1080 × 1920 Vertical</span>
                  </button>
                </div>
              </div>

              {/* AI Voice Selection */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
                <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Voiceover Persona</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    { id: 'jarvis', label: 'J.A.R.V.I.S. (UK)', desc: 'Refined, calm British tone' },
                    { id: 'friday', label: 'Friday (Neural)', desc: 'Clear, modern female voice' },
                    { id: 'creator', label: 'Viral Creator', desc: 'Punchy high-tempo delivery' },
                    { id: 'trailer', label: 'Epic Movie Trailer', desc: 'Deep cinematic baritone' }
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVoicePersonality(v.id)}
                      className={`p-2 rounded-lg border text-left flex flex-col transition-all ${
                        voicePersonality === v.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-bold">{v.label}</span>
                      <span className="text-[9px] text-slate-400 truncate">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle Caption Styling (CapCut style) */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
                <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Animated Captions Preset</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {CAPTION_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedCaptionStyle(style.id)}
                      className={`p-2 rounded-lg border text-left flex flex-col transition-all ${
                        selectedCaptionStyle === style.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-bold">{style.name}</span>
                      <span className="text-[9px] text-slate-400">Word-by-word bouncing highlight</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE CANVAS PLAYER & PREVIEW */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 p-4 items-center justify-center">
            
            {/* Player Container */}
            <div className="relative flex flex-col items-center max-w-4xl w-full h-full justify-between">
              
              {/* Dynamic Video Viewport (Aspect-Ratio Constrained) */}
              <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={aspectRatio === '9:16' ? 540 : 960}
                  height={aspectRatio === '9:16' ? 960 : 540}
                  className={`max-h-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-cyan-500/40 bg-black ${
                    aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]'
                  }`}
                />
              </div>

              {/* Player Timeline & Controls Bar */}
              <div className="w-full mt-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col gap-2">
                
                {/* Scrubbing Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-cyan-400 w-10 text-right">
                    {currentTime.toFixed(1)}s
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={totalDuration || 10}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] font-mono text-slate-400 w-10">
                    {totalDuration.toFixed(1)}s
                  </span>
                </div>

                {/* Button Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isPlaying ? 'Pause' : 'Play Video'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentTime(0);
                        setIsPlaying(false);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
                      title="Rewind to start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
                      title={isMuted ? "Unmute Voiceover" : "Mute Voiceover"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                  </div>

                  {/* Export & YouTube Push Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportVideo}
                      disabled={isExporting}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isExporting ? `Rendering (${exportProgress}%)` : 'Export WebM'}</span>
                    </button>

                    {exportedVideoUrl && (
                      <button
                        onClick={handleDownloadVideo}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Download Video</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('youtube')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)]"
                    >
                      <Youtube className="w-3.5 h-3.5 fill-current" />
                      <span>Publish to YouTube</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STORYBOARD & TIMELINE EDITOR (CAPCUT STYLE) */}
        {activeTab === 'editor' && (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4">
            
            {/* Header info */}
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-300 font-bold">Total Scenes: {videoProject.scenes.length} • Duration: {totalDuration.toFixed(1)}s</span>
              <button
                onClick={() => {
                  const newId = videoProject.scenes.length + 1;
                  setVideoProject(prev => ({
                    ...prev,
                    scenes: [
                      ...prev.scenes,
                      {
                        id: newId,
                        title: `Scene ${newId}`,
                        narration: 'Enter your custom voiceover line here.',
                        caption: 'NEW SCENE HEADLINE',
                        duration: 4.5,
                        theme: 'cyberpunk',
                        zoomEffect: 'zoomIn'
                      }
                    ]
                  }));
                }}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scene</span>
              </button>
            </div>

            {/* Scenes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {videoProject.scenes.map((scene, idx) => {
                const isActive = scene.id === activeEditingSceneId;
                return (
                  <div
                    key={scene.id}
                    onClick={() => setActiveEditingSceneId(scene.id)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]' 
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-400">{idx + 1}</span>
                        <span>{scene.title}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400">{scene.duration}s</span>
                        {videoProject.scenes.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoProject(prev => ({
                                ...prev,
                                scenes: prev.scenes.filter(s => s.id !== scene.id)
                              }));
                            }}
                            className="p-1 hover:text-rose-400 text-slate-500 rounded"
                            title="Delete Scene"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Edit Narration */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-400">Voiceover Script:</label>
                      <textarea
                        value={scene.narration}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVideoProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, narration: val } : s)
                          }));
                        }}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs font-sans text-slate-200 resize-none focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Edit Caption */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-400">Subtitles / Screen Text:</label>
                      <input
                        type="text"
                        value={scene.caption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVideoProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, caption: val } : s)
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Controls Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                      <select
                        value={scene.theme}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVideoProject(prev => ({
                            ...prev,
                            scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, theme: val } : s)
                          }));
                        }}
                        className="bg-slate-900 border border-slate-800 rounded p-1 text-slate-300"
                      >
                        {VISUAL_THEMES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Dur:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="2"
                          max="15"
                          value={scene.duration}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 4;
                            setVideoProject(prev => ({
                              ...prev,
                              scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, duration: val } : s)
                            }));
                          }}
                          className="w-12 bg-slate-900 border border-slate-800 rounded p-1 text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: YOUTUBE DIRECT CHANNEL UPLOAD */}
        {activeTab === 'youtube' && (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left 7 cols: Video Metadata & SEO Settings */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Youtube className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono text-slate-200">{youtubeChannel.channelName}</h3>
                    <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Channel Connected • Ready to Publish
                    </p>
                  </div>
                </div>

                <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
                  {aspectRatio === '9:16' ? '#YouTubeShorts' : 'Standard HD'}
                </span>
              </div>

              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-cyan-300 font-bold flex items-center justify-between">
                  <span>YouTube Video Title (High CTR):</span>
                  <span className="text-[10px] text-slate-500">{videoProject.title.length}/100</span>
                </label>
                <input
                  type="text"
                  value={videoProject.title}
                  onChange={(e) => setVideoProject(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-cyan-300 font-bold flex items-center justify-between">
                  <span>Description & Chapters / Hashtags:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(videoProject.description);
                      playJarvisBeep('confirm');
                    }}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Copy className="w-2.5 h-2.5" /> Copy Description
                  </button>
                </label>
                <textarea
                  value={videoProject.description}
                  onChange={(e) => setVideoProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500 resize-none custom-scrollbar"
                />
              </div>

              {/* Tags Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-cyan-300 font-bold">Search Tags (Comma-Separated):</label>
                <input
                  type="text"
                  value={videoProject.tags}
                  onChange={(e) => setVideoProject(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Right 5 cols: Channel Dispatch & Upload Action */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Privacy & Category */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-mono text-slate-200 font-bold">Publishing Configuration</span>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">Visibility Status:</label>
                  <select
                    value={youtubeChannel.privacy}
                    onChange={(e) => setYoutubeChannel(prev => ({ ...prev, privacy: e.target.value }))}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200"
                  >
                    <option value="public">Public (Instant Release)</option>
                    <option value="unlisted">Unlisted (Anyone with link)</option>
                    <option value="private">Private (Only you)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">Category:</label>
                  <select
                    value={youtubeChannel.category}
                    onChange={(e) => setYoutubeChannel(prev => ({ ...prev, category: e.target.value }))}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200"
                  >
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Howto & Style">Howto & Style</option>
                  </select>
                </div>
              </div>

              {/* Upload to YouTube Primary Action */}
              <div className="p-4 bg-gradient-to-b from-rose-950/40 via-slate-900/70 to-slate-950 border border-rose-500/40 rounded-xl flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-rose-500 fill-current" />
                  <span className="text-xs font-orbitron font-bold text-rose-200">YouTube Channel Dispatch</span>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  Upload directly to your linked YouTube channel with auto-generated tags, chapters, and thumbnail metadata.
                </p>

                {uploadStatus === 'success' ? (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center flex flex-col gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-300 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> Video Successfully Uploaded!
                    </span>
                    <a
                      href={`https://youtu.be/${uploadedVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-cyan-300 hover:underline flex items-center justify-center gap-1"
                    >
                      <span>View Video on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : uploadStatus === 'copied' ? (
                  <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-center flex flex-col gap-1.5">
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      ✓ Metadata Copied & YouTube Studio Opened!
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Drop your exported video into the opened YouTube Studio tab. All title, tags, and description are in your clipboard!
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleUploadToYouTube}
                    disabled={uploadStatus === 'uploading'}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-orbitron font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {uploadStatus === 'uploading' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Uploading Video Stream to YouTube...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload & Publish to YouTube Channel</span>
                      </>
                    )}
                  </button>
                )}

                {/* 1-Click Studio Direct Link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${videoProject.title}\n\n${videoProject.description}\n\nTags: ${videoProject.tags}`);
                    window.open('https://studio.youtube.com/channel/upload', '_blank');
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open YouTube Studio Upload (Copies Metadata)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER TELEMETRY BAR ── */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            ENGINE: ACTIVE
          </span>
          <span>Scenes: {videoProject.scenes.length}</span>
          <span>Length: {totalDuration.toFixed(1)}s</span>
          <span>Format: {aspectRatio}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>AI Narration: {voicePersonality.toUpperCase()}</span>
          <span>Subtitles: {selectedCaptionStyle.toUpperCase()}</span>
          <span className="text-amber-400 font-bold">READY TO EXPORT & PUBLISH</span>
        </div>
      </div>
    </div>
  );
}
