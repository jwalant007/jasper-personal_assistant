import React, { useState, useEffect } from 'react';
import {
  Sparkles, Wand2, Film, Layers, Image as ImageIcon, Video, UploadCloud,
  Check, X, RefreshCw, Sliders, Play, Camera, Eye, Zap, Palette, FileVideo,
  Monitor, ExternalLink, ArrowRight, ShieldCheck, Flame, Stars
} from 'lucide-react';

export const AI_IMAGE_STYLES = [
  {
    id: 'flux_realism',
    name: 'Flux 8K Photorealism',
    badge: '👑 FLUX AI',
    model: 'flux',
    suffix: 'photorealistic 8k, cinematic photography, shot on 35mm Arri Alexa, depth of field, dramatic atmospheric lighting, hyperrealistic, masterwork'
  },
  {
    id: 'octane_3d',
    name: 'Cinematic 3D Octane',
    badge: '⚡ 3D ENGINE',
    model: 'flux',
    suffix: 'cinematic 8k octane render, volumetric lighting, Unreal Engine 5, raytraced reflections, highly detailed, sci-fi concept art'
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon Horizon',
    badge: '🌆 CYBERPUNK',
    model: 'flux',
    suffix: 'cyberpunk aesthetic, vibrant neon reflections, rain drenched city streets, atmospheric volumetric fog, holographic signs, highly detailed'
  },
  {
    id: 'nature_aerial',
    name: 'Aerial Vista & Nature',
    badge: '🦅 DRONE 4K',
    model: 'flux',
    suffix: 'national geographic award winning aerial drone shot, Hasselblad camera, golden hour sunlight, 8k crisp details, breathtaking landscape'
  },
  {
    id: 'minimal_tech',
    name: 'Minimal Tech Studio',
    badge: '🍎 TECH MINIMAL',
    model: 'flux',
    suffix: 'apple design minimalist aesthetic, soft studio illumination, clean matte materials, sleek geometric industrial design, ultra-crisp'
  },
  {
    id: 'anime_makoto',
    name: 'Anime Cinematic Glow',
    badge: '✨ ANIME ART',
    model: 'turbo',
    suffix: 'makoto shinkai cinematic anime style, beautiful sky, glowing stars, high detailed background art, vibrant colors, studio ghibli lighting'
  }
];

export const MOTION_CLIP_PRESETS = [
  {
    id: 'cyber_city',
    name: 'Cyberpunk Neon City',
    category: 'Sci-Fi & Cyber',
    type: 'procedural',
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80',
    description: '3D perspective neon grid with skyscrapers and forward motion'
  },
  {
    id: 'quantum_matrix',
    name: 'Matrix Data Stream',
    category: 'Tech & Code',
    type: 'procedural',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    description: 'Real-time cascading digital matrix code and green binary rain'
  },
  {
    id: 'hyperspace_warp',
    name: 'Cosmic Hyperspace Warp',
    category: 'Space & Cosmos',
    type: 'procedural',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
    description: 'Hyper-speed starfield warp drive with glowing nebula dust'
  },
  {
    id: 'stark_reactor',
    name: 'Stark Arc Reactor HUD',
    category: 'Iron Man & Stark',
    type: 'procedural',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80',
    description: 'Rotating multi-ring holographic HUD with plasma arcs'
  },
  {
    id: 'neural_synapse',
    name: 'Pulsing Neural Synapse',
    category: 'AI & Biology',
    type: 'procedural',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    description: 'Connecting neural dendrites with firing electrical signals'
  },
  {
    id: 'sunset_horizon',
    name: 'Atmospheric Sunset Flight',
    category: 'Cinematic Nature',
    type: 'procedural',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    description: 'Golden hour twilight glow and rising light particles'
  },
  {
    id: 'sample_motion_flower',
    name: '4K Macro Botanical Motion',
    category: 'Stock Video',
    type: 'video',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    description: 'Natural high-definition macro motion video clip'
  },
  {
    id: 'sample_motion_bbb',
    name: '3D High-Speed Animation',
    category: 'Stock Video',
    type: 'video',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    description: 'Smooth animated 3D character motion video sequence'
  }
];

export const CINEMATIC_FILTERS = [
  { id: 'none', name: 'Standard / Neutral', desc: 'No color grading or overlays' },
  { id: 'film_grain', name: '35mm Film Grain', desc: 'Organic analog cinematic texture' },
  { id: 'vhs_glitch', name: 'Cyberpunk VHS Glitch', desc: 'CRT scanlines and digital distortion' },
  { id: 'lens_flare', name: 'Anamorphic Lens Flare', desc: 'Horizontal blue flare & glow' },
  { id: 'cinematic', name: 'Teal & Orange Grade', desc: 'Hollywood blockbuster color grade' }
];

export const MOTION_EFFECTS = [
  { id: 'zoomIn', name: 'Cinematic Zoom In', desc: 'Subtle slow zoom into center' },
  { id: 'zoomOut', name: 'Reveal Zoom Out', desc: 'Dramatic widening perspective' },
  { id: 'panLeft', name: 'Cinematic Pan Left', desc: 'Horizontal camera glide' },
  { id: 'panRight', name: 'Cinematic Pan Right', desc: 'Glide camera to the right' },
  { id: 'static', name: 'Static Locked Tripod', desc: 'Locked frame with zero motion' }
];

export default function JasperVisualMediaStudioModal({
  isOpen,
  onClose,
  scene,
  onUpdateScene,
  onApplyToAllScenes,
  aspectRatio = '16:9',
  onPlayBeep
}) {
  if (!isOpen || !scene) return null;

  // Active studio tabs: 'ai_image' | 'motion_clips' | 'upload' | 'fx'
  const [activeTab, setActiveTab] = useState('ai_image');

  // AI Image Generator State
  const [selectedStyle, setSelectedStyle] = useState('flux_realism');
  const [promptText, setPromptText] = useState(scene.imagePrompt || scene.title || 'Futuristic cybernetic AI');
  const [customImageUrl, setCustomImageUrl] = useState(scene.imageUrl || '');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState([]);

  // Motion Clips State
  const [selectedClipId, setSelectedClipId] = useState(scene.motionClipId || 'cyber_city');
  const [customVideoUrl, setCustomVideoUrl] = useState(scene.videoUrl || '');

  // Custom Upload State
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedMediaType, setUploadedMediaType] = useState('image');

  // Visual FX State
  const [selectedFilter, setSelectedFilter] = useState(scene.filterEffect || 'none');
  const [selectedMotion, setSelectedMotion] = useState(scene.zoomEffect || 'zoomIn');

  // Initialize state when scene opens
  useEffect(() => {
    if (scene) {
      setPromptText(scene.imagePrompt || `${scene.title} futuristic cinematic 8k`);
      setCustomImageUrl(scene.imageUrl || '');
      setSelectedClipId(scene.motionClipId || 'cyber_city');
      setCustomVideoUrl(scene.videoUrl || '');
      setSelectedFilter(scene.filterEffect || 'none');
      setSelectedMotion(scene.zoomEffect || 'zoomIn');
      if (scene.mediaType === 'motion') setActiveTab('motion_clips');
      else if (scene.mediaType === 'video') setActiveTab('motion_clips');
      else setActiveTab('ai_image');
    }
  }, [scene]);

  // Generate Pollinations URL
  const buildPollinationsUrl = (prompt, styleId, seed) => {
    const style = AI_IMAGE_STYLES.find(s => s.id === styleId) || AI_IMAGE_STYLES[0];
    const full = `${prompt.trim()}, ${style.suffix}`;
    const clean = encodeURIComponent(full);
    const s = seed || Math.floor(Math.random() * 999999);
    const w = aspectRatio === '9:16' ? 720 : 1280;
    const h = aspectRatio === '9:16' ? 1280 : 720;
    return `https://image.pollinations.ai/prompt/${clean}?model=${style.model}&width=${w}&height=${h}&nologo=true&seed=${s}`;
  };

  // 1-Click Generate AI Image with Flux
  const handleGenerateAiImage = () => {
    setIsGenerating(true);
    if (onPlayBeep) onPlayBeep('select');

    const seed = Math.floor(Math.random() * 999999);
    const url = buildPollinationsUrl(promptText, selectedStyle, seed);

    setCustomImageUrl(url);

    // Also populate 3 variations for choice
    const vars = [seed, seed + 101, seed + 202].map((s, idx) => ({
      id: idx + 1,
      seed: s,
      url: buildPollinationsUrl(promptText, selectedStyle, s)
    }));
    setVariations(vars);

    setTimeout(() => {
      setIsGenerating(false);
      if (onPlayBeep) onPlayBeep('success');
    }, 400);
  };

  // Magic AI Prompt Enhancer (Cinematography Wizard)
  const handleEnhancePrompt = async () => {
    setIsEnhancingPrompt(true);
    if (onPlayBeep) onPlayBeep('command');

    const apiKey = localStorage.getItem('jasper_gemini_key') || localStorage.getItem('jasper_gemini_api_key');
    let enhanced = null;

    if (apiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an elite Hollywood Director of Photography and AI visual prompt engineer.
Convert this basic topic or visual idea into an award-winning cinematic prompt (1-2 punchy sentences). Specify camera angle, 35mm lens, atmospheric volumetric lighting, rich color grading, textures, and depth of field:
Idea: "${promptText}"
Return ONLY the raw prompt text without quotation marks or explanations.`
              }]
            }]
          })
        });
        if (res.ok) {
          const data = await res.json();
          enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        }
      } catch (e) {
        console.warn('Gemini prompt enhancement warning:', e);
      }
    }

    // Heuristic cinematography expansion if offline
    if (!enhanced) {
      const styles = [
        'shot on 35mm Arri Alexa with anamorphic lens',
        'dramatic volumetric lighting with subtle atmospheric haze',
        'extreme cinematic photorealism with shallow depth of field',
        '8k octane render with raytraced reflections',
        'award-winning Hollywood cinematography'
      ];
      enhanced = `${promptText.trim()}, ${styles.slice(0, 3).join(', ')}`;
    }

    setPromptText(enhanced);
    setIsEnhancingPrompt(false);
    if (onPlayBeep) onPlayBeep('success');
  };

  // Handle local file upload (images and videos)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) return;

    const objUrl = URL.createObjectURL(file);
    setUploadedPreview(objUrl);
    setUploadedFileName(file.name);
    setUploadedMediaType(isVideo ? 'video' : 'image');

    if (isVideo) {
      setCustomVideoUrl(objUrl);
    } else {
      setCustomImageUrl(objUrl);
    }

    if (onPlayBeep) onPlayBeep('confirm');
  };

  // Apply Changes to Current Scene
  const handleApplyToScene = () => {
    let updates = {
      filterEffect: selectedFilter,
      zoomEffect: selectedMotion
    };

    if (activeTab === 'ai_image') {
      updates = {
        ...updates,
        mediaType: 'image',
        imageUrl: customImageUrl || buildPollinationsUrl(promptText, selectedStyle),
        imagePrompt: promptText,
        videoUrl: null,
        motionClipId: null
      };
    } else if (activeTab === 'motion_clips') {
      const clip = MOTION_CLIP_PRESETS.find(c => c.id === selectedClipId) || MOTION_CLIP_PRESETS[0];
      if (clip.type === 'video' || customVideoUrl) {
        updates = {
          ...updates,
          mediaType: 'video',
          videoUrl: customVideoUrl || clip.videoUrl,
          imageUrl: clip.thumbnail || scene.imageUrl,
          motionClipId: clip.id
        };
      } else {
        updates = {
          ...updates,
          mediaType: 'motion',
          motionClipId: clip.id,
          imageUrl: clip.thumbnail || scene.imageUrl,
          videoUrl: null
        };
      }
    } else if (activeTab === 'upload') {
      if (uploadedPreview) {
        if (uploadedMediaType === 'video') {
          updates = {
            ...updates,
            mediaType: 'video',
            videoUrl: uploadedPreview,
            imageUrl: scene.imageUrl,
            mediaName: uploadedFileName
          };
        } else {
          updates = {
            ...updates,
            mediaType: 'image',
            imageUrl: uploadedPreview,
            videoUrl: null,
            mediaName: uploadedFileName
          };
        }
      }
    }

    onUpdateScene(scene.id, updates);
    if (onPlayBeep) onPlayBeep('success');
    onClose();
  };

  // Apply visual style / filter to all scenes in video
  const handleApplyToAll = () => {
    onApplyToAllScenes({
      filterEffect: selectedFilter,
      zoomEffect: selectedMotion
    });
    if (onPlayBeep) onPlayBeep('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden font-sans">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-orbitron text-cyan-200 tracking-wider flex items-center gap-2">
                <span>AI B-ROLL &amp; MOTION CLIPS STUDIO</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  SCENE {scene.id}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Flux 8K AI Imagery • 60 FPS Procedural Shaders • Real Stock Video Clips • Custom Uploads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1.5 flex-shrink-0 text-xs font-mono">
          {[
            { id: 'ai_image', label: '1. Flux AI Image Studio', icon: Wand2 },
            { id: 'motion_clips', label: '2. Motion Video & B-Roll Clips', icon: Film },
            { id: 'upload', label: '3. Upload My Media', icon: UploadCloud },
            { id: 'fx', label: '4. Cinematic FX & Color Grade', icon: Palette }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (onPlayBeep) onPlayBeep('click');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  active 
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">

          {/* TAB 1: FLUX AI IMAGE STUDIO */}
          {activeTab === 'ai_image' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left 7 cols: Prompting & Style Tuning */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                
                {/* AI Style Model Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-cyan-300 font-bold flex items-center justify-between">
                    <span>AI Visual Art Style / Rendering Engine:</span>
                    <span className="text-[10px] text-amber-400 font-normal">State of the Art Photorealism</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AI_IMAGE_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          selectedStyle === style.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-cyan-300 w-max font-mono font-bold">
                          {style.badge}
                        </span>
                        <span className="text-xs font-bold leading-tight">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input & Magic AI Enhancer */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-300 font-bold">
                      Cinematic Scene Visual Prompt:
                    </label>
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancingPrompt}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-[10px] font-orbitron font-bold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <Sparkles className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                      <span>{isEnhancingPrompt ? 'Enhancing with AI...' : '🪄 Magic Prompt Enhancer'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Describe the cinematic shot in high detail..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 resize-none custom-scrollbar"
                  />
                </div>

                {/* Primary Generate Action */}
                <button
                  onClick={handleGenerateAiImage}
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Generating 8K AI Image...' : 'Synthesize New 8K AI Image (Flux)'}</span>
                </button>

                {/* Direct Image URL input */}
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-800">
                  <label className="text-[10px] font-mono text-slate-400">Or Paste Direct Image URL:</label>
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Right 5 cols: Live Preview & Candidate Variations Strip */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <span className="text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
                  <span>Image Preview ({aspectRatio})</span>
                  <span className="text-[10px] text-emerald-400 font-mono">● High Definition</span>
                </span>

                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-cyan-500/30 flex items-center justify-center shadow-lg">
                  {customImageUrl ? (
                    <img
                      src={customImageUrl}
                      alt="AI generated background"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs font-mono text-slate-500 flex flex-col items-center gap-1.5 p-4 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                      <span>Click 'Synthesize New 8K AI Image' to render photorealistic visual</span>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                      <span className="text-xs font-orbitron text-cyan-300 font-bold">Rendering Flux Model...</span>
                    </div>
                  )}
                </div>

                {/* Variations Gallery Strip */}
                {variations.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-[10px] font-mono text-slate-400">Click a variation to select:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {variations.map(v => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setCustomImageUrl(v.url);
                            if (onPlayBeep) onPlayBeep('select');
                          }}
                          className={`aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all ${
                            customImageUrl === v.url
                              ? 'border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500'
                              : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={v.url} alt={`Variation ${v.id}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MOTION VIDEO & B-ROLL CLIPS */}
          {activeTab === 'motion_clips' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-orbitron font-bold text-cyan-200">
                    Curated Motion Video &amp; Procedural Shader Clips
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">
                    Smooth 60 FPS animated loops • Zero latency • Perfect for high-retention YouTube B-roll
                  </p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  {MOTION_CLIP_PRESETS.length} CLIPS AVAILABLE
                </span>
              </div>

              {/* Clips Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {MOTION_CLIP_PRESETS.map(clip => {
                  const isSelected = selectedClipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => {
                        setSelectedClipId(clip.id);
                        if (clip.videoUrl) setCustomVideoUrl(clip.videoUrl);
                        if (onPlayBeep) onPlayBeep('select');
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800">
                        <img
                          src={clip.thumbnail}
                          alt={clip.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-mono font-bold text-cyan-300">
                          {clip.type === 'video' ? '🎬 STOCK VIDEO' : '⚡ 60FPS SHADER'}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-slate-950">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">{clip.name}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{clip.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Direct Video URL Input */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-mono text-cyan-300 font-bold">
                  Or Paste External Direct Video URL (.MP4 / .WebM):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVideoUrl}
                    onChange={(e) => setCustomVideoUrl(e.target.value)}
                    placeholder="https://example.com/broll-video.mp4"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  {customVideoUrl && (
                    <button
                      onClick={() => setCustomVideoUrl('')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD CUSTOM MEDIA */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl bg-slate-950/60 transition-all gap-4 text-center">
              
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="flex flex-col gap-1 max-w-md">
                <h4 className="text-sm font-bold font-orbitron text-slate-100">
                  Upload Custom Video or Image B-Roll
                </h4>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  Drop your MP4, WebM, PNG, or JPG footage here. Plays with zero latency directly in your canvas video editor!
                </p>
              </div>

              <label className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer transition-all flex items-center gap-2">
                <FileVideo className="w-4 h-4" />
                <span>Select Video / Image from Computer</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Item Preview */}
              {uploadedPreview && (
                <div className="w-full max-w-md p-3 bg-slate-900 border border-cyan-500/40 rounded-xl flex items-center gap-3 mt-2 text-left">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                    {uploadedMediaType === 'video' ? (
                      <video src={uploadedPreview} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                    ) : (
                      <img src={uploadedPreview} alt="Uploaded" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-200 block truncate">{uploadedFileName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase">
                      ✓ Ready ({uploadedMediaType})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CINEMATIC FX & COLOR GRADE */}
          {activeTab === 'fx' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Visual Overlay Filter */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Cinematic Visual Overlay &amp; Grade</span>
                </span>
                <div className="flex flex-col gap-1.5">
                  {CINEMATIC_FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedFilter === filter.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs">{filter.name}</span>
                        <span className="text-[10px] text-slate-400">{filter.desc}</span>
                      </div>
                      {selectedFilter === filter.id && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ken-Burns Dynamic Camera Motion */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-orbitron font-bold text-amber-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Camera Motion (Ken Burns 2.0)</span>
                </span>
                <div className="flex flex-col gap-1.5">
                  {MOTION_EFFECTS.map(motion => (
                    <button
                      key={motion.id}
                      onClick={() => setSelectedMotion(motion.id)}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedMotion === motion.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs">{motion.name}</span>
                        <span className="text-[10px] text-slate-400">{motion.desc}</span>
                      </div>
                      {selectedMotion === motion.id && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyToAll}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-all cursor-pointer"
              title="Apply selected visual filter and motion to all scenes"
            >
              Apply Filter/Motion to All Scenes
            </button>

            <button
              onClick={handleApplyToScene}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Apply to Scene {scene.id}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
