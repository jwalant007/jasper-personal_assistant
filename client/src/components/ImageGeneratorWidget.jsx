import React, { useState, useRef } from 'react';
import { Sparkles, Download, X, Loader, Image as ImageIcon, Wand2, RotateCcw, ZoomIn, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import geminiClient from '../utils/geminiClient';

const STYLE_PRESETS = [
  { id: 'none', label: 'Auto', icon: '✨' },
  { id: 'photorealistic', label: 'Photo', icon: '📸' },
  { id: 'digital-art', label: 'Digital Art', icon: '🎨' },
  { id: 'anime', label: 'Anime', icon: '🌸' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌆' },
  { id: 'oil-painting', label: 'Oil Paint', icon: '🖌️' },
  { id: 'watercolor', label: 'Watercolor', icon: '💧' },
  { id: 'pixel-art', label: 'Pixel Art', icon: '👾' },
  { id: '3d-render', label: '3D Render', icon: '💎' }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', desc: 'Square' },
  { id: '16:9', label: '16:9', desc: 'Wide' },
  { id: '9:16', label: '9:16', desc: 'Portrait' },
  { id: '4:3', label: '4:3', desc: 'Classic' },
  { id: '3:4', label: '3:4', desc: 'Tall' }
];

const PROMPT_SUGGESTIONS = [
  'A futuristic city floating in the clouds at sunset',
  'An ancient dragon perched on a crystal mountain',
  'A cyberpunk street market with neon signs in rain',
  'A serene Japanese zen garden with cherry blossoms',
  'An astronaut exploring an alien jungle planet',
  'A steampunk mechanical owl with glowing eyes'
];

export default function ImageGeneratorWidget({ onClose, onLog }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);
  const promptRef = useRef(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const result = await geminiClient.generateImage(
        prompt.trim(),
        style,
        aspectRatio,
        onLog
      );

      const newImage = {
        id: Date.now(),
        prompt: prompt.trim(),
        style,
        aspectRatio,
        dataUrl: `data:${result.mimeType};base64,${result.image}`,
        model: result.model,
        timestamp: new Date().toLocaleTimeString()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setCurrentImageIndex(0);
    } catch (err) {
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (image) => {
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = `jasper-gen-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSuggestion = (suggestion) => {
    setPrompt(suggestion);
    if (promptRef.current) {
      promptRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const currentImage = generatedImages[currentImageIndex];

  return (
    <div className="flex flex-col h-full imagen-widget">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 imagen-header select-none">
        <div className="flex items-center gap-1.5 font-orbitron font-bold text-sm imagen-title">
          <Sparkles size={16} className="imagen-icon-glow" />
          IMAGE SYNTHESIS LAB
        </div>
        <button
          onClick={onClose}
          className="imagen-close-btn"
        >
          [X] CLOSE
        </button>
      </div>

      {/* Prompt Input */}
      <div className="flex flex-col gap-2 mb-3">
        <label className="imagen-label">NEURAL PROMPT</label>
        <div className="relative">
          <textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image you want to create..."
            className="imagen-textarea"
            rows={3}
          />
          <div className="absolute right-2 bottom-2 imagen-char-count select-none">
            {prompt.length}/500
          </div>
        </div>

        {/* Quick Suggestions */}
        {!prompt && (
          <div className="flex flex-col gap-1">
            <span className="imagen-sublabel">QUICK PROMPTS</span>
            <div className="flex flex-col gap-1 imagen-suggestions-scroll">
              {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(suggestion)}
                  className="imagen-suggestion-chip"
                >
                  <Wand2 size={9} />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Style Presets */}
      <div className="flex flex-col gap-1.5 mb-3">
        <label className="imagen-label">STYLE PRESET</label>
        <div className="imagen-style-grid">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setStyle(preset.id)}
              className={`imagen-style-chip ${style === preset.id ? 'active' : ''}`}
            >
              <span className="imagen-style-icon">{preset.icon}</span>
              <span className="imagen-style-text">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="flex flex-col gap-1.5 mb-3">
        <label className="imagen-label">ASPECT RATIO</label>
        <div className="flex gap-1.5">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => setAspectRatio(ratio.id)}
              className={`imagen-ratio-chip ${aspectRatio === ratio.id ? 'active' : ''}`}
            >
              <span className="font-bold">{ratio.label}</span>
              <span className="imagen-ratio-desc">{ratio.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="imagen-generate-btn"
      >
        {isGenerating ? (
          <>
            <div className="imagen-spinner" />
            SYNTHESIZING NEURAL IMAGE...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            GENERATE IMAGE
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="imagen-error mt-2">
          <span className="font-bold">⚠ ERROR:</span> {error}
        </div>
      )}

      {/* Generated Image Display */}
      {generatedImages.length > 0 && (
        <div className="flex flex-col gap-2 mt-3 flex-1 overflow-hidden">
          <div className="flex items-center justify-between select-none">
            <label className="imagen-label">
              GENERATED OUTPUT ({generatedImages.length} image{generatedImages.length > 1 ? 's' : ''})
            </label>
            {generatedImages.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentImageIndex(Math.min(currentImageIndex + 1, generatedImages.length - 1))}
                  disabled={currentImageIndex >= generatedImages.length - 1}
                  className="imagen-nav-btn"
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="imagen-nav-counter">
                  {currentImageIndex + 1}/{generatedImages.length}
                </span>
                <button
                  onClick={() => setCurrentImageIndex(Math.max(currentImageIndex - 1, 0))}
                  disabled={currentImageIndex <= 0}
                  className="imagen-nav-btn"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>

          {currentImage && (
            <div className="imagen-result-card flex-1 overflow-hidden">
              {/* Image Container */}
              <div className="imagen-image-container relative">
                <img
                  src={currentImage.dataUrl}
                  alt={currentImage.prompt}
                  className="imagen-output-image"
                  onClick={() => setZoomedImage(currentImage)}
                />
                {/* Overlay Actions */}
                <div className="imagen-image-overlay">
                  <button
                    onClick={() => setZoomedImage(currentImage)}
                    className="imagen-overlay-btn"
                    title="Zoom"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => handleDownload(currentImage)}
                    className="imagen-overlay-btn"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>

              {/* Image Info */}
              <div className="imagen-image-info">
                <span className="truncate" style={{ maxWidth: '200px' }}>{currentImage.prompt}</span>
                <span className="imagen-image-meta">
                  {currentImage.timestamp} • {currentImage.model?.split('-').slice(0, 2).join(' ').toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* History Thumbnails */}
          {generatedImages.length > 1 && (
            <div className="imagen-history-strip">
              {generatedImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`imagen-thumb ${idx === currentImageIndex ? 'active' : ''}`}
                >
                  <img src={img.dataUrl} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="imagen-zoom-overlay"
          onClick={() => setZoomedImage(null)}
        >
          <div className="imagen-zoom-container" onClick={(e) => e.stopPropagation()}>
            <img
              src={zoomedImage.dataUrl}
              alt={zoomedImage.prompt}
              className="imagen-zoom-image"
            />
            <div className="imagen-zoom-actions">
              <button onClick={() => handleDownload(zoomedImage)} className="imagen-zoom-btn">
                <Download size={14} /> Download
              </button>
              <button onClick={() => setZoomedImage(null)} className="imagen-zoom-btn">
                <X size={14} /> Close
              </button>
            </div>
            <div className="imagen-zoom-prompt">
              {zoomedImage.prompt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
