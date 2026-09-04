import React, { useState, useEffect } from 'react';
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
  FolderOpen
} from 'lucide-react';

export default function BlenderStudioModal({ isOpen = true, onClose, embedded = false }) {
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
          <div className="p-4 flex flex-col justify-between bg-slate-950/40 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>VIEWPORT PREVIEW</span>
                </span>
                {lastGenerated?.objectType && (
                  <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    {lastGenerated.objectType}
                  </span>
                )}
              </div>

              {/* Preview Display Window */}
              <div className="w-full aspect-video bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg border border-slate-800 flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
                {lastRender?.url ? (
                  <img
                    src={`${getApiBase()}${lastRender.url}`}
                    alt="Blender Render"
                    className="w-full h-full object-cover"
                  />
                ) : lastGenerated?.previewUrl ? (
                  <img
                    src={`${getApiBase()}${lastGenerated.previewUrl}`}
                    alt="3D Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2 text-slate-500">
                    <Box className="w-10 h-10 mx-auto opacity-30 text-cyan-400" />
                    <p className="text-xs font-mono">No render yet generated</p>
                    <p className="text-[10px] text-slate-600">Generate a 3D model or run a render above</p>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Actions */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              {lastGenerated?.glbUrl && (
                <a
                  href={`${getApiBase()}${lastGenerated.glbUrl}`}
                  download={lastGenerated.glbFileName || 'model.glb'}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs rounded transition flex items-center justify-center space-x-2 border border-cyan-500/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download GLB 3D File</span>
                </a>
              )}

              {lastRender?.url && (
                <a
                  href={`${getApiBase()}${lastRender.url}`}
                  download={lastRender.outputFile || 'render.png'}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded transition flex items-center justify-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Rendered PNG</span>
                </a>
              )}

              <div className="text-[10px] font-mono text-slate-500 text-center">
                AI Prompting via ChatGPT Astra & Gemini active
              </div>
            </div>

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

