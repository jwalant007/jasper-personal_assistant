import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Play, Pause, RotateCcw, Download, UploadCloud, Sparkles, Wand2,
  Film, Layers, Type, Music, Settings, Check, Copy, ExternalLink,
  ChevronRight, Plus, Trash2, Sliders, Volume2, VolumeX, Eye, Share2,
  RefreshCw, FileText, Layout, Youtube, Clock, AlertCircle, Image as ImageIcon,
  Flame, Scissors, Palette, Zap, Star, Camera, Filter
} from 'lucide-react';
import geminiClient from '../utils/geminiClient';
import { getApiBase } from '../utils/apiConfig';
import { playJarvisBeep, playJarvisPowerUp } from '../utils/jarvisAudioSynth';
import JasperVisualMediaStudioModal, {
  AI_IMAGE_STYLES,
  MOTION_CLIP_PRESETS,
  CINEMATIC_FILTERS,
  MOTION_EFFECTS
} from './JasperVisualMediaStudioModal';
import {
  renderProceduralMotionShader,
  applyCinematicVisualFilter
} from '../utils/videoProceduralShaders';

// Pre-defined visual styles & color accents
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

// Built-in BGM presets
const BGM_TRACKS = [
  { id: 'synthwave', name: 'Cyberpunk Synthwave', tempo: 120, mood: 'Energetic & Driving' },
  { id: 'cinematic', name: 'Epic Cinematic Drone', tempo: 80, mood: 'Atmospheric & Deep' },
  { id: 'lofi', name: 'Lo-Fi Chill Beats', tempo: 90, mood: 'Mellow & Focus' },
  { id: 'none', name: 'Voice Only (No Music)', tempo: 0, mood: 'Pure Voiceover' }
];

// Thumbnail Badge Presets
const THUMBNAIL_BADGES = [
  { id: 'football_goal', label: '⚽ INSANE GOAL', bg: '#10b981' },
  { id: 'football_transfer', label: '🔥 SHOCK TRANSFER', bg: '#ef4444' },
  { id: 'goat', label: '🐐 GOAT DEBATE', bg: '#f59e0b' },
  { id: 'viral', label: '⚡ VIRAL SHORTS', bg: '#8b5cf6' },
  { id: 'shocking', label: '😱 RECORD BROKEN', bg: '#ec4899' },
  { id: 'secret', label: '🔒 SECRET DISCLOSED', bg: '#06b6d4' }
];

export default function JasperVideoStudioApp({ onClose, onLockSystem } = {}) {
  // Navigation & Mode
  const [activeTab, setActiveTab] = useState('creator'); // 'creator' | 'editor' | 'preview' | 'thumbnail' | 'youtube'
  const [creationMode, setCreationMode] = useState('topic'); // 'topic' | 'script'
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' (Shorts / Reels) | '16:9' (YouTube)

  // Inputs - Configured for Death Reaper Football (@death-reaper577)
  const [promptTopic, setPromptTopic] = useState('5 Football Records That Will NEVER Be Broken ⚽');
  const [rawScriptText, setRawScriptText] = useState('');
  const [targetLength, setTargetLength] = useState('short'); // 'short' (30-60s) | 'medium' (1-2m) | 'explainer' (3m+)
  const [voicePersonality, setVoicePersonality] = useState('creator'); // 'creator' (high energy) | 'jarvis' | 'friday' | 'trailer'
  const [selectedBgm, setSelectedBgm] = useState('synthwave');
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState('hormozi');
  const [showSubscribeBadge, setShowSubscribeBadge] = useState(true);
  const [showAudioVisualizer, setShowAudioVisualizer] = useState(true);

  // Cinematic Visual FX Overlays
  const [globalFilter, setGlobalFilter] = useState('cinematic'); // 'none' | 'cinematic' | 'film_grain' | 'vhs_glitch' | 'lens_flare'
  const [cinematicLetterbox, setCinematicLetterbox] = useState(false); // Default off for 9:16 Shorts

  // Visual Media Studio Modal State
  const [isMediaStudioOpen, setIsMediaStudioOpen] = useState(false);
  const [activeMediaSceneId, setActiveMediaSceneId] = useState(null);

  // Generation & Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // Viral Title & Hook Optimizer State (Death Reaper Football Presets)
  const [isOptimizingHooks, setIsOptimizingHooks] = useState(false);
  const [hookSuggestions, setHookSuggestions] = useState([
    { title: '5 Football Records That Defy Human Science (#1 is Impossible)', ctr: '98% Ultra Viral', style: 'Shock & Awe' },
    { title: 'The Real Reason Nobody Will EVER Break Messi’s 91-Goal Record', ctr: '96% High CTR', style: 'Controversy & Proof' },
    { title: 'Why Football Officials Tried to Hide This Insane Match Incident', ctr: '94% High CTR', style: 'Curiosity Gap' }
  ]);

  // Generated Video Project Data with AI Images & Timed Storyboard
  const [videoProject, setVideoProject] = useState({
    title: '5 Football Records That Will NEVER Be Broken ⚽ #Shorts',
    description: 'Welcome back to Death Reaper Football – the ultimate destination for every football fan!\n\nToday we break down the top 5 most untouchable records in football history. From Champions League glory to World Cup milestones that will stand forever.\n\n👉 Subscribe now to join one of the fastest-growing football communities on YouTube!\nContact: jwalantjbhatt@gmail.com\n\n#Football #Shorts #Soccer #ChampionsLeague #PremierLeague #DeathReaper #Messi #Ronaldo',
    tags: 'Death Reaper Football, football shorts, soccer highlights, champions league, premier league, messi, ronaldo, haaland, mbappe, football records, best goals',
    scenes: [
      {
        id: 1,
        title: 'Hook / The Impossible Feats',
        narration: 'In the history of football, thousands of records have fallen. But these five? They will literally NEVER be broken.',
        caption: '5 UNTOUCHABLE FOOTBALL RECORDS',
        duration: 4.5,
        theme: 'sunset',
        mediaType: 'motion',
        motionClipId: 'football_stadium',
        zoomEffect: 'zoomIn',
        filterEffect: 'cinematic',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1280&q=80',
        imagePrompt: 'Epic illuminated football stadium night with roaring crowd, UEFA Champions League floodlights, cinematic sports photography'
      },
      {
        id: 2,
        title: 'Messi 91 Goals in a Year',
        narration: 'Number one. Lionel Messi scoring 91 goals in a single calendar year. Modern sports science calls it statistically impossible to repeat.',
        caption: 'MESSI 91 GOALS IN ONE YEAR',
        duration: 5.0,
        theme: 'cyberpunk',
        mediaType: 'image',
        zoomEffect: 'zoomOut',
        filterEffect: 'film_grain',
        imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1280&q=80',
        imagePrompt: 'Professional football player celebrating iconic goal under golden stadium floodlights with ball in goal net, 8k'
      },
      {
        id: 3,
        title: 'Fastest World Cup Goal',
        narration: 'Number two. The fastest World Cup goal in history. Just 10.8 seconds after kickoff, shocking millions of viewers across the globe.',
        caption: 'GOAL IN JUST 10.8 SECONDS',
        duration: 5.0,
        theme: 'stark_hud',
        mediaType: 'image',
        zoomEffect: 'panLeft',
        filterEffect: 'lens_flare',
        imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1280&q=80',
        imagePrompt: 'Football player striking ball at supersonic speed towards top corner of goal in crowded stadium, cinematic 8k'
      },
      {
        id: 4,
        title: 'Subscribe to Death Reaper',
        narration: 'Which of these records is your favorite? Subscribe to Death Reaper Football for daily football news and viral shorts!',
        caption: 'SUBSCRIBE FOR DAILY FOOTBALL SHORTS',
        duration: 4.5,
        theme: 'space',
        mediaType: 'motion',
        motionClipId: 'football_stadium',
        zoomEffect: 'zoomIn',
        filterEffect: 'cinematic',
        imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1280&q=80',
        imagePrompt: 'Golden football trophy on pitch under dramatic atmospheric lights with football and stadium floodlights'
      }
    ]
  });

  // Playback & Timeline State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.3);
  const [activeEditingSceneId, setActiveEditingSceneId] = useState(1);

  // Thumbnail Studio State - High CTR Football Style
  const [thumbnailHeadline, setThumbnailHeadline] = useState('THEY RIGGED THIS MATCH?!');
  const [thumbnailSubhead, setThumbnailSubhead] = useState('DEATH REAPER FOOTBALL');
  const [selectedBadge, setSelectedBadge] = useState('football_goal');
  const [thumbnailTheme, setThumbnailTheme] = useState('sunset');
  const [thumbnailDownloaded, setThumbnailDownloaded] = useState(false);

  // Export & Recording State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  const [exportedBlob, setExportedBlob] = useState(null);

  // YouTube Upload State - Connected to @death-reaper577
  const [youtubeChannel, setYoutubeChannel] = useState({
    channelName: "Death Reaper Football",
    handle: "@death-reaper577",
    channelUrl: "https://youtube.com/@death-reaper577",
    contactEmail: "jwalantjbhatt@gmail.com",
    isConnected: true,
    privacy: 'public',
    category: 'Sports',
    isShorts: true
  });
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'copied'
  const [uploadedVideoId, setUploadedVideoId] = useState(null);

  // Canvas & Audio & Video Refs
  const canvasRef = useRef(null);
  const thumbnailCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioDestinationRef = useRef(null);
  const bgmGainNodeRef = useRef(null);
  const bgmIntervalRef = useRef(null);
  const imageCacheRef = useRef({});
  const videoCacheRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Total video duration calculation
  const totalDuration = videoProject.scenes.reduce((acc, s) => acc + (Number(s.duration) || 4), 0);

  // Pre-load scene images and motion videos into cache for stutter-free canvas rendering
  useEffect(() => {
    videoProject.scenes.forEach(scene => {
      // Preload image
      if (scene.imageUrl && !imageCacheRef.current[scene.imageUrl] && scene.mediaType !== 'video') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = scene.imageUrl;
        img.onload = () => {
          imageCacheRef.current[scene.imageUrl] = img;
        };
      }
      // Preload video
      const videoSrc = scene.videoUrl || (scene.mediaType === 'video' ? scene.imageUrl : null);
      if (videoSrc && !videoCacheRef.current[videoSrc]) {
        const vid = document.createElement('video');
        vid.crossOrigin = 'anonymous';
        vid.src = videoSrc;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = 'auto';
        vid.oncanplay = () => {
          videoCacheRef.current[videoSrc] = vid;
        };
        videoCacheRef.current[videoSrc] = vid;
      }
    });
  }, [videoProject.scenes]);

  // Synchronize HTML5 video playback with video player state
  useEffect(() => {
    const scene = videoProject.scenes[currentSceneIndex];
    if (!scene) return;
    const videoSrc = scene.videoUrl || (scene.mediaType === 'video' ? scene.imageUrl : null);

    Object.entries(videoCacheRef.current).forEach(([url, vid]) => {
      if (url === videoSrc) {
        if (isPlaying) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      } else {
        if (!vid.paused) vid.pause();
      }
    });
  }, [currentSceneIndex, isPlaying, videoProject.scenes]);

  // -------------------------------------------------------------
  // PROCEDURAL WEB AUDIO SYNTHESIZER ENGINE (SYNTHWAVE / CINEMATIC / LO-FI)
  // -------------------------------------------------------------
  const initAudioEngine = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        audioDestinationRef.current = ctx.createMediaStreamDestination();
        const gain = ctx.createGain();
        gain.gain.value = bgmVolume;
        gain.connect(ctx.destination);
        gain.connect(audioDestinationRef.current);
        bgmGainNodeRef.current = gain;
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const startBgmPlayback = () => {
    if (selectedBgm === 'none' || isMuted) return;
    initAudioEngine();
    const ctx = audioContextRef.current;
    if (!ctx || !bgmGainNodeRef.current) return;

    stopBgmPlayback();

    // Notes frequencies
    const synthNotes = selectedBgm === 'synthwave'
      ? [110, 130.81, 146.83, 164.81, 196] // A2 minor pentatonic
      : selectedBgm === 'cinematic'
        ? [55, 82.41, 110, 123.47] // Deep Drone A1
        : [130.81, 164.81, 196, 246.94]; // Lo-Fi C major 7th

    let step = 0;
    const intervalTime = selectedBgm === 'cinematic' ? 1200 : selectedBgm === 'synthwave' ? 350 : 600;

    bgmIntervalRef.current = setInterval(() => {
      if (!ctx || ctx.state === 'closed') return;
      try {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = selectedBgm === 'synthwave' ? 'sawtooth' : selectedBgm === 'cinematic' ? 'sine' : 'triangle';
        const baseFreq = synthNotes[step % synthNotes.length];
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(selectedBgm === 'synthwave' ? 900 : 450, ctx.currentTime);

        noteGain.gain.setValueAtTime(0.001, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (intervalTime / 1000) * 0.95);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(bgmGainNodeRef.current);

        osc.start();
        osc.stop(ctx.currentTime + (intervalTime / 1000));
        step++;
      } catch (e) {}
    }, intervalTime);
  };

  const stopBgmPlayback = () => {
    if (bgmIntervalRef.current) {
      clearInterval(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
  };

  // Sync BGM with Playback
  useEffect(() => {
    if (isPlaying && !isMuted && selectedBgm !== 'none') {
      startBgmPlayback();
    } else {
      stopBgmPlayback();
    }
    return () => stopBgmPlayback();
  }, [isPlaying, isMuted, selectedBgm]);

  // Adjust volume
  useEffect(() => {
    if (bgmGainNodeRef.current) {
      bgmGainNodeRef.current.gain.value = isMuted ? 0 : bgmVolume;
    }
  }, [bgmVolume, isMuted]);

  // -------------------------------------------------------------
  // TEST VOICE SAMPLE PREVIEW
  // -------------------------------------------------------------
  const handleTestVoiceSample = (voiceId) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    playJarvisBeep('select');

    let text = 'Greetings, Sir. This is your J.A.S.P.E.R. artificial intelligence narrator, locked and calibrated.';
    if (voiceId === 'friday') text = 'Systems fully operational. I will deliver clear, modern narration for your audience.';
    if (voiceId === 'creator') text = 'What is up guys! Today we are revealing five insane breakthroughs that will blow your mind!';
    if (voiceId === 'trailer') text = 'In a world altered by technology... one breakthrough changed reality forever.';

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('Oliver') || v.name.includes('George'));
    const usVoice = voices.find(v => v.lang.includes('en-US') && !v.name.includes('Google'));

    if (voiceId === 'jarvis' && britishVoice) {
      utterance.voice = britishVoice;
      utterance.pitch = 0.95;
      utterance.rate = 1.05;
    } else if (voiceId === 'trailer') {
      utterance.pitch = 0.72;
      utterance.rate = 0.88;
    } else if (voiceId === 'friday') {
      const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.1;
      utterance.rate = 1.05;
    } else if (usVoice) {
      utterance.voice = usVoice;
      utterance.rate = 1.15;
    }
    window.speechSynthesis.speak(utterance);
  };

  // -------------------------------------------------------------
  // AI GENERATOR: TOPIC OR SCRIPT TO FULL STORYBOARD
  // -------------------------------------------------------------
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGenerationProgress(15);
    setGenerationStatus('Synthesizing script, retention hooks, and timed scenes with Gemini AI...');
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
      "zoomEffect": "zoomIn" or "zoomOut" or "panLeft" or "panRight",
      "imagePrompt": "Specific photorealistic descriptive visual prompt for AI image generator"
    }
  ]
}
Generate between 4 to 6 scenes tailored to the topic.`;

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
        setGenerationStatus('Assembling intelligent storyboard scenes and B-roll prompts...');
        parsedResult = generateLocalStoryboard(creationMode === 'topic' ? promptTopic : rawScriptText, isShortFormat);
      }

      // Automatically attach cinema-grade FLUX 8K AI B-Roll image URLs via Pollinations AI
      const isShort = aspectRatio === '9:16';
      const genW = isShort ? 720 : 1280;
      const genH = isShort ? 1280 : 720;
      parsedResult.scenes = parsedResult.scenes.map((s, idx) => {
        const fullPrompt = `${s.imagePrompt || `${s.title} futuristic technology`}, cinematic photography, 8k, photorealistic, shot on 35mm lens, atmospheric lighting, Unreal Engine 5 render`;
        const cleanPrompt = encodeURIComponent(fullPrompt);
        const imgUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?model=flux&width=${genW}&height=${genH}&nologo=true&seed=${idx + 100}`;
        return {
          ...s,
          mediaType: 'image',
          imageUrl: s.imageUrl || imgUrl,
          filterEffect: 'cinematic',
          zoomEffect: s.zoomEffect || (idx % 2 === 0 ? 'zoomIn' : 'zoomOut')
        };
      });

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
      zoomEffect: idx % 2 === 0 ? 'zoomIn' : 'zoomOut',
      imagePrompt: `${raw} futuristic cinematic scene ${idx + 1} hyperrealistic 8k octane render`
    }));

    return {
      title,
      description: `${raw}\n\nIn this video, we break down everything you need to know about ${raw}.\n\n0:00 - Hook & Overview\n0:05 - The Core Discovery\n0:12 - Future Implications\n0:18 - Final Verdict & Subscribe\n\nCreated autonomously with J.A.S.P.E.R. AI Video Studio.\n\n#Technology #AI #Future ${isShort ? '#Shorts' : ''}`,
      tags: `${raw}, AI video, CapCut AI, InVideo, technology, future tech, Jasper OS`,
      scenes
    };
  };

  // 1-Click Regenerate AI B-Roll Image for a Scene with Flux 8K
  const handleRegenerateSceneImage = (sceneId, customPrompt) => {
    playJarvisBeep('click');
    const randomSeed = Math.floor(Math.random() * 99999);
    const isShort = aspectRatio === '9:16';
    const genW = isShort ? 720 : 1280;
    const genH = isShort ? 1280 : 720;
    setVideoProject(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => {
        if (s.id === sceneId) {
          const prompt = customPrompt || s.imagePrompt || `${s.title} futuristic technology, cinematic lighting, 8k photorealistic, 35mm lens, Unreal Engine 5`;
          const clean = encodeURIComponent(prompt);
          const newUrl = `https://image.pollinations.ai/prompt/${clean}?model=flux&width=${genW}&height=${genH}&nologo=true&seed=${randomSeed}`;
          return {
            ...s,
            mediaType: 'image',
            imageUrl: newUrl,
            imagePrompt: prompt,
            videoUrl: null,
            motionClipId: null
          };
        }
        return s;
      })
    }));
  };

  // -------------------------------------------------------------
  // REAL-TIME CANVAS VIDEO RENDERER (KEN BURNS + IMAGES + MOTION CLIPS + HUD + SUBTITLES)
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

    // 2. Draw B-Roll Background: Procedural Motion Shader OR Real Video Clip OR Cached Image
    const theme = VISUAL_THEMES.find(t => t.id === scene?.theme) || VISUAL_THEMES[0];
    const isVideo = scene?.mediaType === 'video' || (scene?.videoUrl && scene.videoUrl.length > 0);
    const videoKey = scene?.videoUrl || (scene?.mediaType === 'video' ? scene?.imageUrl : null);
    const cachedVideo = videoKey ? videoCacheRef.current[videoKey] : null;
    const isProceduralMotion = scene?.mediaType === 'motion' || (scene?.motionClipId && !isVideo);
    const cachedImg = scene?.imageUrl ? imageCacheRef.current[scene.imageUrl] : null;

    ctx.save();

    // Ken-Burns Dynamic Zoom/Pan transform
    const scale = scene?.zoomEffect === 'zoomIn' 
      ? 1 + sceneProgress * 0.16 
      : scene?.zoomEffect === 'zoomOut' 
        ? 1.16 - sceneProgress * 0.16 
        : scene?.zoomEffect === 'panLeft' || scene?.zoomEffect === 'panRight'
          ? 1.08
          : 1.0;

    const panX = scene?.zoomEffect === 'panLeft' 
      ? (sceneProgress - 0.5) * 35 
      : scene?.zoomEffect === 'panRight'
        ? (0.5 - sceneProgress) * 35
        : 0;

    ctx.translate(width / 2 + panX, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    let mediaRendered = false;

    if (isProceduralMotion) {
      renderProceduralMotionShader(ctx, scene.motionClipId || 'cyber_city', width, height, timestamp, theme, sceneProgress);
      mediaRendered = true;
    } else if (isVideo && cachedVideo && cachedVideo.readyState >= 2) {
      // Draw live video frame
      const vAspect = (cachedVideo.videoWidth || 16) / (cachedVideo.videoHeight || 9);
      const canvasAspect = width / height;
      let drawW, drawH, drawX, drawY;

      if (vAspect > canvasAspect) {
        drawH = height;
        drawW = height * vAspect;
        drawX = (width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = width;
        drawH = width / vAspect;
        drawX = 0;
        drawY = (height - drawH) / 2;
      }

      ctx.drawImage(cachedVideo, drawX, drawY, drawW, drawH);
      ctx.fillStyle = `${theme.bg}44`;
      ctx.fillRect(0, 0, width, height);
      mediaRendered = true;
    } else if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
      // Draw Cover Image
      const imgAspect = cachedImg.naturalWidth / cachedImg.naturalHeight;
      const canvasAspect = width / height;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = width;
        drawH = width / imgAspect;
        drawX = 0;
        drawY = (height - drawH) / 2;
      }

      ctx.drawImage(cachedImg, drawX, drawY, drawW, drawH);

      // Cyber Holographic Color Tint
      ctx.fillStyle = `${theme.bg}66`;
      ctx.fillRect(0, 0, width, height);
      mediaRendered = true;
    }

    if (!mediaRendered) {
      renderProceduralMotionShader(ctx, 'cyber_city', width, height, timestamp, theme, sceneProgress);
    }

    // Animated Grid Lines (for Cyber and Stark themes)
    if (scene?.theme === 'cyberpunk' || scene?.theme === 'matrix' || scene?.theme === 'stark_hud') {
      ctx.lineWidth = 1;
      ctx.strokeStyle = `${theme.primary}22`;
      const gridSize = 45;
      const gridOffset = (timestamp * 0.04) % gridSize;

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
    }

    // Floating Cyber Energy Particles
    for (let i = 0; i < 18; i++) {
      const px = ((i * 137.5 + timestamp * 0.03) % width);
      const py = ((i * 269.3 - timestamp * 0.015) % height + height) % height;
      const r = (i % 3) + 1.2;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? theme.primary : '#ffffff';
      ctx.shadowColor = theme.secondary;
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    // Holographic Stark Center Reticle (HUD circles)
    if (scene?.theme === 'stark_hud' || scene?.theme === 'space') {
      ctx.strokeStyle = `${theme.primary}66`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(timestamp * 0.0008);
      ctx.strokeStyle = `${theme.secondary}88`;
      ctx.setLineDash([12, 18]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // 3. Cinematic Visual Filter Overlay (Film Grain, VHS Glitch, Lens Flare, Teal & Orange)
    const activeFilter = scene?.filterEffect || globalFilter;
    applyCinematicVisualFilter(ctx, width, height, activeFilter, timestamp, theme);

    // 4. Cinematic Vignette Overlay
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.76);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 5. 2.35:1 Anamorphic Widescreen Letterbox Bars
    if (cinematicLetterbox && aspectRatio === '16:9') {
      const barH = Math.round(height * 0.08);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, barH);
      ctx.fillRect(0, height - barH, width, barH);
    }

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

    // 5. Sound Wave Audio Visualizer (Bottom Center)
    if (showAudioVisualizer && isPlaying) {
      const bars = 16;
      const barW = 3.5;
      const spacing = 3;
      const totalW = bars * (barW + spacing);
      const startX = width / 2 - totalW / 2;
      const startY = aspectRatio === '9:16' ? height * 0.88 : height * 0.92;

      for (let b = 0; b < bars; b++) {
        const barH = 4 + Math.abs(Math.sin(timestamp * 0.006 + b * 0.4)) * 18;
        ctx.fillStyle = b % 2 === 0 ? theme.primary : theme.secondary;
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 6;
        ctx.fillRect(startX + b * (barW + spacing), startY - barH / 2, barW, barH);
      }
      ctx.shadowBlur = 0;
    }

    // 6. YouTube Animated "SUBSCRIBE" Pill (Appears in Scene 1 and Final Scene)
    if (showSubscribeBadge && (sceneIndex === 0 || sceneIndex === videoProject.scenes.length - 1)) {
      const subX = width / 2;
      const subY = aspectRatio === '9:16' ? height * 0.16 : height * 0.18;
      const pulseScale = 1 + Math.sin(timestamp * 0.005) * 0.04;

      ctx.save();
      ctx.translate(subX, subY);
      ctx.scale(pulseScale, pulseScale);
      
      ctx.fillStyle = '#dc2626'; // YouTube Red
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.roundRect(-75, -16, 150, 32, 16);
      ctx.fill();

      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('▶ SUBSCRIBE 🔔', 0, 0);
      ctx.restore();
    }

    // 7. ANIMATED CAPTIONS & SUBTITLES (CapCut / InVideo Style)
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

      const captionY = aspectRatio === '9:16' ? height * 0.72 : height * 0.78;

      // Draw Subtitle Box Background
      const fullText = scene.caption;
      const textMetrics = ctx.measureText(fullText);
      const boxW = Math.min(width - 40, textMetrics.width + 36);
      const boxH = fontSize * 1.5;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.roundRect(width / 2 - boxW / 2, captionY - boxH / 2, boxW, boxH, 12);
      ctx.fill();
      ctx.strokeStyle = `${theme.primary}77`;
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
          ctx.shadowBlur = 16;
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

    // 8. Bottom Progress Bar
    const progressPct = totalDuration > 0 ? (currentTime / totalDuration) : 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
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
          utterance.rate = 1.12;
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
  // CLIENT-SIDE VIDEO EXPORT WITH SOUNDTRACK AUDIO MIXING
  // -------------------------------------------------------------
  const handleExportVideo = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setExportProgress(10);
    playJarvisPowerUp();

    try {
      const canvas = canvasRef.current;
      const videoStream = canvas.captureStream(30); // 30 FPS video stream
      recordedChunksRef.current = [];

      // Mix procedural audio destination if available
      let combinedStream = videoStream;
      if (audioDestinationRef.current && audioDestinationRef.current.stream) {
        const audioTracks = audioDestinationRef.current.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...audioTracks
          ]);
        }
      }

      const options = { mimeType: 'video/webm;codecs=vp9' };
      let recorder;
      try {
        recorder = new MediaRecorder(combinedStream, options);
      } catch (e) {
        recorder = new MediaRecorder(combinedStream);
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
  // YOUTUBE THUMBNAIL STUDIO RENDERER & EXPORT
  // -------------------------------------------------------------
  const renderThumbnailCanvas = () => {
    const canvas = thumbnailCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const theme = VISUAL_THEMES.find(t => t.id === thumbnailTheme) || VISUAL_THEMES[0];

    // 1. Background image or dynamic radial glow
    const firstSceneImg = videoProject.scenes[0]?.imageUrl ? imageCacheRef.current[videoProject.scenes[0].imageUrl] : null;
    if (firstSceneImg && firstSceneImg.complete && firstSceneImg.naturalWidth > 0) {
      ctx.drawImage(firstSceneImg, 0, 0, width, height);
      // Dark vignette & colored lighting
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, 'rgba(0,0,0,0.65)');
      grad.addColorStop(1, `${theme.bg}cc`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      const grad = ctx.createRadialGradient(width * 0.7, height * 0.3, 50, width / 2, height / 2, width * 0.8);
      grad.addColorStop(0, theme.secondary);
      grad.addColorStop(0.5, theme.primary);
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // High Contrast Neon Border
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ef4444'; // MrBeast Red Outer
    ctx.strokeRect(0, 0, width, height);

    // Selected Badge (Top Right)
    const badge = THUMBNAIL_BADGES.find(b => b.id === selectedBadge) || THUMBNAIL_BADGES[0];
    ctx.save();
    ctx.translate(width - 170, 50);
    ctx.rotate(0.04);
    ctx.fillStyle = badge.bg;
    ctx.shadowColor = badge.bg;
    ctx.shadowBlur = 20;
    ctx.roundRect(-100, -22, 200, 44, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.label, 0, 0);
    ctx.restore();

    // High-CTR Giant Headline Subtitle (Yellow with thick black stroke)
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Subhead
    ctx.font = '900 32px Orbitron, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;
    ctx.fillText(thumbnailSubhead.toUpperCase(), 50, height * 0.48);

    // Main Headline (Impact bold yellow)
    ctx.font = '900 68px Impact, sans-serif';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(thumbnailHeadline.toUpperCase(), 50, height * 0.65);
    ctx.fillStyle = '#facc15';
    ctx.fillText(thumbnailHeadline.toUpperCase(), 50, height * 0.65);

    // Stark HUD Icon Badge (Bottom Right)
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('⚡ 4K 60FPS • J.A.S.P.E.R. STUDIO', 50, height - 40);

    ctx.restore();
  };

  useEffect(() => {
    if (activeTab === 'thumbnail') {
      renderThumbnailCanvas();
    }
  }, [activeTab, thumbnailHeadline, thumbnailSubhead, selectedBadge, thumbnailTheme, videoProject]);

  const handleDownloadThumbnail = () => {
    const canvas = thumbnailCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `youtube_thumbnail_${videoProject.title.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setThumbnailDownloaded(true);
    playJarvisBeep('success');
    setTimeout(() => setThumbnailDownloaded(false), 3000);
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
        setUploadStatus('copied');
        window.open('https://studio.youtube.com/channel/upload', '_blank');
      }
      playJarvisBeep('success');
    } catch (err) {
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
              <span>J.A.S.P.E.R. VIDEO STUDIO PRO</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">CAPCUT & INVIDEO AI CLASS</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">Autonomous Script-to-Video, B-Roll Synthesis & YouTube Publishing</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {[
            { id: 'creator', label: '1. AI Script', icon: Wand2 },
            { id: 'preview', label: '2. Live Player', icon: Play },
            { id: 'editor', label: '3. Storyboard & B-Roll', icon: Layers },
            { id: 'thumbnail', label: '4. Thumbnail Studio', icon: ImageIcon },
            { id: 'youtube', label: '5. YouTube Upload', icon: Youtube }
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
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
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

        {/* TAB 1: AI CREATOR & VIRAL SCRIPT GENERATOR */}
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

                  {/* Death Reaper Football Trending Templates */}
                  <div className="flex flex-col gap-1.5 p-3 bg-gradient-to-r from-red-950/40 to-slate-900/80 border border-red-500/30 rounded-xl">
                    <span className="text-[10px] font-mono text-red-300 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">⚽</span>
                        <span>Death Reaper Football Viral Shorts Templates:</span>
                      </span>
                      <span className="text-[9px] text-cyan-400 font-mono">@death-reaper577</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '5 Football Records That Will NEVER Be Broken',
                        'The Real Reason Mbappé Stunned Real Madrid & UCL',
                        'Erling Haaland vs Prime Ronaldo: Insane Goal Stats',
                        'Top 5 Most Expensive Football Transfers of All Time',
                        'The Darkest Controversy in El Clásico History',
                        'Jude Bellingham Journey: World Domination in 60s'
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPromptTopic(chip);
                            setAspectRatio('9:16');
                            setVoicePersonality('creator');
                            playJarvisBeep('select');
                          }}
                          className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 hover:border-red-400 rounded-lg text-[10px] font-mono text-red-200 transition-all text-left cursor-pointer"
                        >
                          ⚽ {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* General Preset Idea Chips */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Other Trending Templates:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '5 AI Breakthroughs in 2026',
                        'Why Discipline Beats Motivation',
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
                    <span>Generate Storyboard &amp; AI B-Roll with Gemini</span>
                  </>
                )}
              </button>

              {/* Viral Retention & Hook Optimizer Tool */}
              <div className="p-4 bg-slate-900/60 border border-amber-500/30 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Viral Retention &amp; High-CTR Title Optimizer</span>
                  </span>
                  <span className="text-[9px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ALGORITHM BOOSTER
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {hookSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setVideoProject(prev => ({ ...prev, title: item.title }));
                        setThumbnailHeadline(item.title.slice(0, 26).toUpperCase());
                        playJarvisBeep('select');
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-400 flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-slate-900"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-sans font-semibold text-slate-200 truncate">{item.title}</span>
                        <span className="text-[9px] font-mono text-slate-400">{item.style}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                        {item.ctr}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Video Specs & Formatting (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Aspect Ratio Toggle (YouTube Landscape vs Shorts/Reels) */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
                <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Format &amp; Aspect Ratio</span>
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
                    <span className="text-xs font-bold font-mono">Shorts &amp; Reels</span>
                    <span className="text-[9px] text-slate-400">1080 × 1920 Vertical</span>
                  </button>
                </div>
              </div>

              {/* AI Voice Selection with Live Voice Test Previews */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
                <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Voiceover Persona (with Live Preview)</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    { id: 'jarvis', label: 'J.A.R.V.I.S. (UK)', desc: 'Refined British tone' },
                    { id: 'friday', label: 'Friday (Neural)', desc: 'Clear modern female voice' },
                    { id: 'creator', label: 'Viral Creator', desc: 'Punchy high-tempo delivery' },
                    { id: 'trailer', label: 'Epic Movie Trailer', desc: 'Deep cinematic baritone' }
                  ].map(v => (
                    <div
                      key={v.id}
                      onClick={() => setVoicePersonality(v.id)}
                      className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        voicePersonality === v.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">{v.label}</span>
                        <span className="text-[9px] text-slate-400 truncate block">{v.desc}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoiceSample(v.id);
                        }}
                        className="mt-1.5 py-0.5 px-2 bg-slate-800 hover:bg-cyan-900 text-[9px] text-cyan-300 rounded border border-slate-700 flex items-center justify-center gap-1 font-bold"
                        title="Click to test voice"
                      >
                        <Volume2 className="w-2.5 h-2.5" /> Test Voice
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Procedural BGM Soundtrack Selector */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Background Soundtrack (Synth)</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">Vol: {Math.round(bgmVolume * 100)}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {BGM_TRACKS.map(track => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedBgm(track.id)}
                      className={`p-2 rounded-lg border text-left flex flex-col transition-all ${
                        selectedBgm === track.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <span className="font-bold">{track.name}</span>
                      <span className="text-[9px] text-slate-400 truncate">{track.mood}</span>
                    </button>
                  ))}
                </div>
                {/* Volume slider */}
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400 mt-1"
                />
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
                      className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isPlaying ? 'Pause' : 'Play Video'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentTime(0);
                        setIsPlaying(false);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                      title="Rewind to start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                      title={isMuted ? "Unmute Voiceover & Music" : "Mute Voiceover & Music"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>

                    <button
                      onClick={() => setShowSubscribeBadge(!showSubscribeBadge)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono border cursor-pointer ${
                        showSubscribeBadge ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                      title="Toggle YouTube Subscribe Animation"
                    >
                      🔔 Subscribe
                    </button>

                    <button
                      onClick={() => setCinematicLetterbox(!cinematicLetterbox)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono border cursor-pointer ${
                        cinematicLetterbox ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                      title="Toggle 2.35:1 Widescreen Anamorphic Letterbox Bars"
                    >
                      🖤 2.35:1
                    </button>

                    <button
                      onClick={() => {
                        const nextFilter = globalFilter === 'none' ? 'film_grain' : globalFilter === 'film_grain' ? 'vhs_glitch' : globalFilter === 'vhs_glitch' ? 'lens_flare' : globalFilter === 'lens_flare' ? 'cinematic' : 'none';
                        setGlobalFilter(nextFilter);
                        playJarvisBeep('select');
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono border cursor-pointer ${
                        globalFilter !== 'none' ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                      title="Cycle Global Cinematic Filter: Film Grain, VHS Glitch, Lens Flare, Teal & Orange"
                    >
                      ✨ FX: {globalFilter.toUpperCase()}
                    </button>

                    <button
                      onClick={() => {
                        const curScene = videoProject.scenes[currentSceneIndex] || videoProject.scenes[0];
                        if (curScene) {
                          setActiveMediaSceneId(curScene.id);
                          setIsMediaStudioOpen(true);
                        }
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 shadow cursor-pointer"
                      title="Open Visual Background & Motion Clips Studio"
                    >
                      <Camera className="w-3 h-3" />
                      <span>B-Roll Studio</span>
                    </button>
                  </div>

                  {/* Export & YouTube Push Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportVideo}
                      disabled={isExporting}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isExporting ? `Rendering (${exportProgress}%)` : 'Export Video & Audio'}</span>
                    </button>

                    {exportedVideoUrl && (
                      <button
                        onClick={handleDownloadVideo}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Download .WebM</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('thumbnail')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Thumbnail Studio</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('youtube')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(225,29,72,0.3)] cursor-pointer"
                    >
                      <Youtube className="w-3.5 h-3.5 fill-current" />
                      <span>Publish</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STORYBOARD & TIMELINE & B-ROLL EDITOR (CAPCUT STYLE) */}
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
                        zoomEffect: 'zoomIn',
                        imagePrompt: 'Futuristic quantum computer server room glowing cyan'
                      }
                    ]
                  }));
                }}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1 font-bold text-xs cursor-pointer"
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
                            className="p-1 hover:text-rose-400 text-slate-500 rounded cursor-pointer"
                            title="Delete Scene"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scene B-Roll Preview Thumbnail */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center group">
                      {scene.mediaType === 'video' || scene.videoUrl ? (
                        <div className="relative w-full h-full">
                          <video src={scene.videoUrl || scene.imageUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-cyan-300 flex items-center gap-1 border border-cyan-500/40">
                            <Film className="w-2.5 h-2.5" /> VIDEO CLIP
                          </span>
                        </div>
                      ) : scene.mediaType === 'motion' ? (
                        <div className="relative w-full h-full">
                          <img src={scene.imageUrl || 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80'} alt={scene.title} className="w-full h-full object-cover" />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-indigo-300 flex items-center gap-1 border border-indigo-500/40">
                            <Zap className="w-2.5 h-2.5" /> 60FPS SHADER
                          </span>
                        </div>
                      ) : scene.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-amber-300 flex items-center gap-1 border border-amber-500/40">
                            <Sparkles className="w-2.5 h-2.5" /> FLUX 8K
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Procedural Background
                        </div>
                      )}

                      {/* Hover action to open B-Roll Studio */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMediaSceneId(scene.id);
                          setIsMediaStudioOpen(true);
                        }}
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[1px] cursor-pointer"
                        title="Open Visual Background & Motion Clips Studio"
                      >
                        <span className="px-2.5 py-1 bg-cyan-500 text-slate-950 font-orbitron font-bold text-[10px] rounded-lg shadow-lg flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Customize B-Roll
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateSceneImage(scene.id);
                        }}
                        className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 hover:bg-cyan-950 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 flex items-center gap-1 shadow cursor-pointer"
                        title="Regenerate Flux 8K AI Image"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> 8K Flux
                      </button>
                    </div>

                    {/* Narration Preview */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-400">Voiceover Narration:</span>
                      <p className="text-xs text-slate-200 line-clamp-2 italic font-sans leading-tight">
                        "{scene.narration}"
                      </p>
                    </div>

                    {/* Animated Caption */}
                    <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/80 pt-2 text-slate-400">
                      <span className="text-amber-300 font-bold truncate max-w-[160px]">{scene.caption}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] uppercase">{scene.theme}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Scene Detailed Editor Panel */}
            {activeEditingSceneId && (
              <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded-2xl flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Editing Scene {videoProject.scenes.findIndex(s => s.id === activeEditingSceneId) + 1} Properties</span>
                  </span>

                  <button
                    onClick={() => {
                      setActiveMediaSceneId(activeEditingSceneId);
                      setIsMediaStudioOpen(true);
                    }}
                    className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-orbitron font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>B-Roll &amp; Motion Clips Studio</span>
                  </button>
                </div>

                {(() => {
                  const scene = videoProject.scenes.find(s => s.id === activeEditingSceneId);
                  if (!scene) return null;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="flex flex-col gap-1">
                        <label className="text-slate-400">Scene Headline Caption:</label>
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
                          className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-slate-400">Duration (Seconds):</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="20"
                          value={scene.duration}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 4;
                            setVideoProject(prev => ({
                              ...prev,
                              scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, duration: val } : s)
                            }));
                          }}
                          className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-slate-400">Visual Theme / Shader:</label>
                        <select
                          value={scene.theme}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVideoProject(prev => ({
                              ...prev,
                              scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, theme: val } : s)
                            }));
                          }}
                          className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                        >
                          {VISUAL_THEMES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 flex flex-col gap-1">
                        <label className="text-slate-400">Exact Voiceover Narration:</label>
                        <textarea
                          rows={2}
                          value={scene.narration}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVideoProject(prev => ({
                              ...prev,
                              scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, narration: val } : s)
                            }));
                          }}
                          className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 resize-none focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-slate-400">B-Roll Prompt / AI Image:</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={scene.imagePrompt || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVideoProject(prev => ({
                                ...prev,
                                scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, imagePrompt: val } : s)
                              }));
                            }}
                            placeholder="AI image prompt..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={() => handleRegenerateSceneImage(scene.id, scene.imagePrompt)}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
                          >
                            Gen
                          </button>
                        </div>
                      </div>

                      {/* Visual & B-Roll Summary Strip */}
                      <div className="md:col-span-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">Current Visual:</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase font-bold border border-cyan-500/30">
                            {scene.mediaType === 'video' ? '🎬 Video Clip' : scene.mediaType === 'motion' ? '⚡ 60FPS Shader' : '👑 Flux 8K Image'}
                          </span>
                          {scene.filterEffect && scene.filterEffect !== 'none' && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              FX: {scene.filterEffect.toUpperCase()}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            Motion: {scene.zoomEffect || 'zoomIn'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setActiveMediaSceneId(scene.id);
                            setIsMediaStudioOpen(true);
                          }}
                          className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Visual Inspector &amp; Stock Clips</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: YOUTUBE THUMBNAIL STUDIO */}
        {activeTab === 'thumbnail' && (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 cols: Live Thumbnail Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center gap-3">
              <div className="relative w-full aspect-video max-w-2xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-amber-500/50 bg-black flex items-center justify-center">
                <canvas
                  ref={thumbnailCanvasRef}
                  width={1280}
                  height={720}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-3 w-full max-w-2xl justify-between">
                <span className="text-xs font-mono text-slate-400">Resolution: 1280 × 720 High-Res YouTube Thumbnail</span>
                <button
                  onClick={handleDownloadThumbnail}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-orbitron font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer transition-all"
                >
                  {thumbnailDownloaded ? <Check className="w-4 h-4 text-emerald-950" /> : <Download className="w-4 h-4" />}
                  <span>{thumbnailDownloaded ? 'Downloaded PNG!' : 'Download Thumbnail (.PNG)'}</span>
                </button>
              </div>
            </div>

            {/* Right 5 cols: Thumbnail Customization Controls */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-orbitron font-bold text-amber-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>High-CTR Thumbnail Designer</span>
                </span>

                {/* Headline Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">Bold Punchline Headline (Yellow Text):</label>
                  <input
                    type="text"
                    value={thumbnailHeadline}
                    onChange={(e) => setThumbnailHeadline(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Subhead Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">Subheader / Category (Cyan Glow):</label>
                  <input
                    type="text"
                    value={thumbnailSubhead}
                    onChange={(e) => setThumbnailSubhead(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Badge Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400">Viral Sticker / Badge:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {THUMBNAIL_BADGES.map(badge => (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge.id)}
                        className={`p-2 rounded-lg border text-xs font-mono font-bold transition-all text-left flex items-center justify-between ${
                          selectedBadge === badge.id
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <span>{badge.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Theme */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400">Thumbnail Color Palette:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {VISUAL_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setThumbnailTheme(theme.id)}
                        className={`p-1.5 rounded-lg border text-[10px] font-mono transition-all text-center ${
                          thumbnailTheme === theme.id
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {theme.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: YOUTUBE PUBLISHING CENTER */}
        {activeTab === 'youtube' && (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left 7 cols: Video Metadata Configuration */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Channel Connect Status */}
              <div className="p-3.5 bg-gradient-to-r from-red-950/40 via-slate-900/80 to-slate-950 border border-red-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white font-bold text-base shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-400">
                    ⚽
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-100">{youtubeChannel.channelName}</span>
                      <span className="text-[10px] text-red-400 font-mono font-bold">{youtubeChannel.handle}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Channel Linked
                      </span>
                      <a
                        href={youtubeChannel.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-cyan-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View Channel</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
                    {aspectRatio === '9:16' ? '#YouTubeShorts' : 'Standard HD'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Category: {youtubeChannel.category}</span>
                </div>
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
                  <span>Description &amp; Chapters / Hashtags:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(videoProject.description);
                      playJarvisBeep('confirm');
                    }}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-normal cursor-pointer"
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
                    <option value="Science & Technology">Science &amp; Technology</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Howto & Style">Howto &amp; Style</option>
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
                      ✓ Metadata Copied &amp; YouTube Studio Opened!
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
                        <span>Upload &amp; Publish to YouTube Channel</span>
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
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
          <span>BGM: {selectedBgm.toUpperCase()}</span>
          <span>Subtitles: {selectedCaptionStyle.toUpperCase()}</span>
          <span className="text-amber-400 font-bold">READY TO EXPORT &amp; PUBLISH</span>
        </div>
      </div>

      {/* ── MODAL: AI B-ROLL & MOTION CLIPS STUDIO ── */}
      {isMediaStudioOpen && (
        <JasperVisualMediaStudioModal
          isOpen={isMediaStudioOpen}
          onClose={() => setIsMediaStudioOpen(false)}
          scene={videoProject.scenes.find(s => s.id === activeMediaSceneId) || videoProject.scenes[0]}
          onUpdateScene={(sceneId, updates) => {
            setVideoProject(prev => ({
              ...prev,
              scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
            }));
          }}
          onApplyToAllScenes={(updates) => {
            setVideoProject(prev => ({
              ...prev,
              scenes: prev.scenes.map(s => ({ ...s, ...updates }))
            }));
          }}
          aspectRatio={aspectRatio}
          onPlayBeep={playJarvisBeep}
        />
      )}
    </div>
  );
}

