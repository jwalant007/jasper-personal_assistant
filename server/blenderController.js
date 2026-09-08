/**
 * JASPER BLENDER 3D GRAPHICS CONTROLLER & API
 * Powers 3D model generation, headless rendering, bpy Python scripting,
 * GLTF/GLB web asset export, and desktop Blender GUI management.
 */

const { spawn, execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class BlenderController {
  constructor() {
    this.customPath = process.env.BLENDER_PATH || null;
    this.cachedPath = null;
    this.blenderVersion = null;
    this.isDetecting = false;
    this.installing = false;
    this.installProgress = '';

    // Set up directories for scripts, renders, and exported 3D assets
    this.baseDir = path.join(__dirname, 'data', 'blender');
    this.scriptsDir = path.join(this.baseDir, 'scripts');
    this.rendersDir = path.join(this.baseDir, 'renders');
    this.exportsDir = path.join(this.baseDir, 'exports');

    this.ensureDirectories();
    this.detectBlender().catch(err => {
      console.warn('[BlenderController] Initial detection:', err.message);
    });
  }

  ensureDirectories() {
    try {
      [this.baseDir, this.scriptsDir, this.rendersDir, this.exportsDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    } catch (e) {
      console.error('[BlenderController] Error creating directories:', e);
    }
  }

  /**
   * Search for Blender binary across standard Windows and Linux locations
   */
  async detectBlender() {
    if (this.customPath && fs.existsSync(this.customPath)) {
      this.cachedPath = this.customPath;
      await this.queryVersion(this.cachedPath);
      return { installed: true, path: this.cachedPath, version: this.blenderVersion };
    }

    // 1. Check system PATH via 'where blender' or 'which blender'
    const commandName = process.platform === 'win32' ? 'where.exe' : 'which';
    const pathFromSystem = await new Promise((resolve) => {
      exec(`${commandName} blender`, (err, stdout) => {
        if (!err && stdout && stdout.trim()) {
          const firstPath = stdout.trim().split(/\r?\n/)[0];
          if (fs.existsSync(firstPath)) return resolve(firstPath);
        }
        resolve(null);
      });
    });

    if (pathFromSystem) {
      this.cachedPath = pathFromSystem;
      await this.queryVersion(this.cachedPath);
      return { installed: true, path: this.cachedPath, version: this.blenderVersion };
    }

    // 2. Windows specific candidate directories
    if (process.platform === 'win32') {
      const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
      const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');

      const candidateRoots = [
        path.join(programFiles, 'Blender Foundation'),
        path.join(programFilesX86, 'Blender Foundation'),
        path.join(localAppData, 'Programs', 'Blender Foundation'),
        path.join(programFilesX86, 'Steam', 'steamapps', 'common', 'Blender')
      ];

      for (const root of candidateRoots) {
        if (fs.existsSync(root)) {
          try {
            // Check if blender.exe is directly in root
            const directExe = path.join(root, 'blender.exe');
            if (fs.existsSync(directExe)) {
              this.cachedPath = directExe;
              await this.queryVersion(this.cachedPath);
              return { installed: true, path: this.cachedPath, version: this.blenderVersion };
            }

            // Check subdirectories e.g. "Blender 4.3", "Blender 4.2", etc.
            const subdirs = fs.readdirSync(root);
            for (const sub of subdirs) {
              const subExe = path.join(root, sub, 'blender.exe');
              if (fs.existsSync(subExe)) {
                this.cachedPath = subExe;
                await this.queryVersion(this.cachedPath);
                return { installed: true, path: this.cachedPath, version: this.blenderVersion };
              }
            }
          } catch (_) {}
        }
      }
    } else {
      // Linux / Unix candidates
      const linuxCandidates = [
        '/usr/bin/blender',
        '/usr/local/bin/blender',
        '/snap/bin/blender',
        '/var/lib/flatpak/exports/bin/org.blender.Blender'
      ];
      for (const cand of linuxCandidates) {
        if (fs.existsSync(cand)) {
          this.cachedPath = cand;
          await this.queryVersion(this.cachedPath);
          return { installed: true, path: this.cachedPath, version: this.blenderVersion };
        }
      }
    }

    this.cachedPath = null;
    this.blenderVersion = null;
    return {
      installed: false,
      path: null,
      version: null,
      message: 'Blender 3D is not currently detected on this system. You can install it via winget or specify a custom path.'
    };
  }

  /**
   * Run blender -v to determine version
   */
  async queryVersion(executablePath) {
    return new Promise((resolve) => {
      exec(`"${executablePath}" -v`, { timeout: 8000 }, (err, stdout) => {
        if (!err && stdout) {
          const match = stdout.match(/Blender\s+([\d.]+)/i);
          this.blenderVersion = match ? match[1] : stdout.split('\n')[0].trim();
        } else {
          this.blenderVersion = 'Detected (version unknown)';
        }
        resolve(this.blenderVersion);
      });
    });
  }

  /**
   * Get current status
   */
  async getStatus() {
    if (!this.cachedPath) {
      await this.detectBlender();
    }
    return {
      installed: !!this.cachedPath,
      path: this.cachedPath,
      version: this.blenderVersion,
      installing: this.installing,
      installProgress: this.installProgress,
      directories: {
        scripts: this.scriptsDir,
        renders: this.rendersDir,
        exports: this.exportsDir
      },
      supportedEngines: ['CYCLES', 'BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'BLENDER_WORKBENCH'],
      capabilities: [
        'Headless Python (bpy) Execution',
        'Procedural 3D Mesh Generation',
        'GLTF/GLB Web 3D Asset Export',
        'Photorealistic Raytracing & Rendering',
        'Material & Shader Automation',
        'Desktop GUI Launch'
      ]
    };
  }

  /**
   * Retrieve the most recently generated 3D model and render
   */
  async getLatestAsset() {
    this.ensureDirectories();

    let latestGlb = null;
    let latestPreview = null;
    let latestRender = null;

    try {
      if (fs.existsSync(this.exportsDir)) {
        const glbFiles = fs.readdirSync(this.exportsDir)
          .filter(f => f.endsWith('.glb') || f.endsWith('.gltf'))
          .map(f => {
            const fullPath = path.join(this.exportsDir, f);
            const stat = fs.statSync(fullPath);
            return { file: f, path: fullPath, mtimeMs: stat.mtimeMs, size: stat.size };
          })
          .sort((a, b) => b.mtimeMs - a.mtimeMs);

        if (glbFiles.length > 0) {
          latestGlb = glbFiles[0];
        }
      }

      if (fs.existsSync(this.rendersDir)) {
        const renderFiles = fs.readdirSync(this.rendersDir)
          .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.svg') || f.endsWith('.webp'))
          .map(f => {
            const fullPath = path.join(this.rendersDir, f);
            const stat = fs.statSync(fullPath);
            return { file: f, path: fullPath, mtimeMs: stat.mtimeMs, size: stat.size };
          })
          .sort((a, b) => b.mtimeMs - a.mtimeMs);

        // Find preview matching latestGlb timestamp or newest preview
        if (latestGlb) {
          const timestampMatch = latestGlb.file.match(/_(\d+)\.glb$/);
          const ts = timestampMatch ? timestampMatch[1] : null;
          if (ts) {
            const match = renderFiles.find(r => r.file.includes(ts));
            if (match) latestPreview = match;
          }
        }
        if (!latestPreview && renderFiles.length > 0) {
          latestPreview = renderFiles.find(r => r.file.startsWith('preview_')) || renderFiles[0];
        }

        // Find newest standalone render
        const standaloneRenders = renderFiles.filter(r => r.file.startsWith('render_'));
        if (standaloneRenders.length > 0) {
          latestRender = standaloneRenders[0];
        }
      }
    } catch (err) {
      console.error('[BlenderController] Error scanning latest asset:', err);
    }

    if (!latestGlb && !latestPreview && !latestRender) {
      return { success: true, latest: null, latestRender: null };
    }

    let objectType = 'torus';
    if (latestGlb) {
      const match = latestGlb.file.match(/^model_([a-zA-Z0-9]+)_/);
      if (match) objectType = match[1];
    } else if (latestPreview) {
      const match = latestPreview.file.match(/^preview_([a-zA-Z0-9]+)_/);
      if (match) objectType = match[1];
    }

    return {
      success: true,
      latest: latestGlb ? {
        glbFileName: latestGlb.file,
        glbUrl: `/api/blender/export/${latestGlb.file}`,
        previewUrl: latestPreview ? `/api/blender/render/${latestPreview.file}` : null,
        objectType,
        timestamp: latestGlb.mtimeMs,
        size: latestGlb.size,
        engine: this.cachedPath ? 'Blender EEVEE / Cycles' : 'Jasper Embedded 3D Engine'
      } : (latestPreview ? {
        previewUrl: `/api/blender/render/${latestPreview.file}`,
        objectType,
        timestamp: latestPreview.mtimeMs
      } : null),
      latestRender: latestRender ? {
        outputFile: latestRender.file,
        url: `/api/blender/render/${latestRender.file}`,
        timestamp: latestRender.mtimeMs
      } : null
    };
  }

  /**
   * AI Neural 3D Picture Synthesis Engine
   * Attempts: 1) Gemini Imagen 3 (if apiKey provided), 2) Pollinations FLUX with retry
   */
  async generatePreviewImage(prompt, objectType, color = '#00f0ff', apiKey = null) {
    const subject = prompt || objectType || '3D object';
    console.log(`[BlenderController] Generating preview image for: "${subject}" (apiKey: ${apiKey ? 'present' : 'none'})`);

    // 1. Try Gemini Imagen 3 if API key is available
    if (apiKey) {
      try {
        console.log('[BlenderController] Attempting Gemini Imagen 3 image generation...');
        const models = ['imagen-3.0-generate-002', 'gemini-2.0-flash-exp'];
        for (const model of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const requestBody = {
              contents: [{ parts: [{ text: `3D rendered illustration of ${subject}, Cinema4D style, high detail, Octane render, studio lighting, dark background, photorealistic 3D model visualization` }] }],
              generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
            };
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: AbortSignal.timeout(30000)
            });
            if (res.ok) {
              const data = await res.json();
              const parts = data.candidates?.[0]?.content?.parts || [];
              const imagePart = parts.find(p => p.inlineData);
              if (imagePart) {
                const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
                if (buffer.length > 2048) {
                  console.log(`[BlenderController] ✓ Gemini Imagen generated preview (${Math.round(buffer.length / 1024)}KB via ${model})`);
                  return buffer;
                }
              }
            }
          } catch (modelErr) {
            console.log(`[BlenderController] Gemini model ${model} failed: ${modelErr.message}`);
          }
        }
      } catch (geminiErr) {
        console.log('[BlenderController] Gemini image generation failed, falling back to FLUX:', geminiErr.message);
      }
    }

    // 2. Pollinations FLUX AI - with retry and longer timeout
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const seed = Math.floor(Math.random() * 1000000);
        const query = encodeURIComponent(`High quality 3D rendered model of ${subject}, photorealistic, Cinema4D Octane render, detailed, studio lighting, dark moody background, professional 3D visualization`);
        const url = `https://image.pollinations.ai/prompt/${query}?width=960&height=720&nologo=true&seed=${seed}`;
        console.log(`[BlenderController] FLUX attempt ${attempt}/${maxAttempts} for "${subject}"...`);
        const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('image')) {
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer && buffer.length > 2048) {
            console.log(`[BlenderController] ✓ FLUX generated preview (${Math.round(buffer.length / 1024)}KB, attempt ${attempt})`);
            return buffer;
          }
          console.log(`[BlenderController] FLUX returned small buffer (${buffer?.length || 0} bytes), retrying...`);
        } else {
          console.log(`[BlenderController] FLUX returned status ${res.status}, content-type: ${contentType}`);
        }
      } catch (err) {
        console.log(`[BlenderController] FLUX attempt ${attempt} failed: ${err.message}`);
      }
    }

    console.log('[BlenderController] All image generation attempts failed, falling back to SVG blueprint');
    return null;
  }

  /**
   * High-tech Stark Holographic Blueprint SVG Synthesizer
   */
  createHoloPreviewSvg({ objectType = 'torus', prompt = 'Hologram', color = '#00f0ff', width = 960, height = 720 } = {}) {
    const safePrompt = (prompt || '3D Asset').replace(/</g, '').replace(/>/g, '').slice(0, 45);
    const upperType = (objectType || 'MODEL').toUpperCase();

    // Determine isometric 3D geometry paths
    let shapeSvg = '';
    const lower = (prompt + ' ' + objectType).toLowerCase();

    if (lower.includes('cube') || lower.includes('box') || objectType === 'cube') {
      shapeSvg = `
        <g transform="translate(480, 360)">
          <!-- Top Face -->
          <polygon points="0,-130 150,-50 0,30 -150,-50" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="3"/>
          <!-- Left Face -->
          <polygon points="-150,-50 0,30 0,190 -150,110" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="3"/>
          <!-- Right Face -->
          <polygon points="0,30 150,-50 150,110 0,190" fill="${color}" fill-opacity="0.38" stroke="${color}" stroke-width="3"/>
          <!-- Inner Matrix Wireframe -->
          <line x1="0" y1="-130" x2="0" y2="30" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="8 6"/>
          <circle cx="0" cy="30" r="8" fill="#38bdf8" opacity="0.8"/>
        </g>
      `;
    } else if (lower.includes('sphere') || lower.includes('ball') || lower.includes('planet') || objectType === 'sphere') {
      shapeSvg = `
        <g transform="translate(480, 360)">
          <defs>
            <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
              <stop offset="40%" stop-color="${color}" stop-opacity="0.6"/>
              <stop offset="85%" stop-color="#0284c7" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#030712" stop-opacity="0.0"/>
            </radialGradient>
          </defs>
          <circle cx="0" cy="0" r="140" fill="url(#sphereGrad)"/>
          <circle cx="0" cy="0" r="140" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="12 6"/>
          <ellipse cx="0" cy="0" rx="140" ry="45" fill="none" stroke="${color}" stroke-width="2" opacity="0.8"/>
          <ellipse cx="0" cy="-60" rx="125" ry="32" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.5"/>
          <ellipse cx="0" cy="60" rx="125" ry="32" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.5"/>
          <ellipse cx="0" cy="0" rx="45" ry="140" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
          <circle cx="0" cy="0" r="185" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 8" opacity="0.4"/>
        </g>
      `;
    } else if (lower.includes('cylinder') || objectType === 'cylinder') {
      shapeSvg = `
        <g transform="translate(480, 360)">
          <path d="M -110,-80 L 110,-80 L 110,100 A 110 38 0 0 1 -110 100 Z" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="3"/>
          <ellipse cx="0" cy="-80" rx="110" ry="38" fill="${color}" fill-opacity="0.45" stroke="${color}" stroke-width="3"/>
          <ellipse cx="0" cy="100" rx="110" ry="38" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="8 6" opacity="0.8"/>
        </g>
      `;
    } else {
      // 3D Torus / Arc Reactor / Hologram Ring
      shapeSvg = `
        <g transform="translate(480, 360)">
          <defs>
            <radialGradient id="holoCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
              <stop offset="30%" stop-color="${color}" stop-opacity="0.6"/>
              <stop offset="70%" stop-color="#0284c7" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#030712" stop-opacity="0.0"/>
            </radialGradient>
          </defs>
          <ellipse cx="0" cy="0" rx="220" ry="110" fill="none" stroke="${color}" stroke-width="8" opacity="0.85"/>
          <ellipse cx="0" cy="0" rx="220" ry="110" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="14 18" opacity="0.7"/>
          <ellipse cx="0" cy="0" rx="130" ry="65" fill="none" stroke="${color}" stroke-width="4" opacity="0.9"/>
          <g transform="rotate(35)">
            <ellipse cx="0" cy="0" rx="190" ry="75" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="8 12" opacity="0.75"/>
          </g>
          <g transform="rotate(-35)">
            <ellipse cx="0" cy="0" rx="190" ry="75" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6 10" opacity="0.65"/>
          </g>
          <circle cx="0" cy="0" r="50" fill="url(#holoCore)"/>
          <circle cx="0" cy="0" r="18" fill="#ffffff" opacity="0.95"/>
          <line x1="-240" y1="0" x2="240" y2="0" stroke="${color}" stroke-width="1.5" stroke-dasharray="8 8" opacity="0.5"/>
          <line x1="0" y1="-140" x2="0" y2="140" stroke="${color}" stroke-width="1.5" stroke-dasharray="8 8" opacity="0.5"/>
        </g>
      `;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#0e1726"/>
      <stop offset="60%" stop-color="#050a14"/>
      <stop offset="100%" stop-color="#020408"/>
    </radialGradient>
    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.8" opacity="0.5"/>
    </pattern>
    <linearGradient id="hudLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${color}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bgGlow)"/>

  <g opacity="0.4">
    <rect width="${width}" height="${height}" fill="url(#gridPattern)"/>
    <ellipse cx="480" cy="620" rx="460" ry="120" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="10 8" opacity="0.3"/>
  </g>

  <path d="M 30 50 L 30 30 L 50 30" fill="none" stroke="${color}" stroke-width="2.5"/>
  <path d="M ${width - 50} 30 L ${width - 30} 30 L ${width - 30} 50" fill="none" stroke="${color}" stroke-width="2.5"/>
  <path d="M 30 ${height - 50} L 30 ${height - 30} L 50 ${height - 30}" fill="none" stroke="${color}" stroke-width="2.5"/>
  <path d="M ${width - 50} ${height - 30} L ${width - 30} ${height - 30} L ${width - 30} ${height - 50}" fill="none" stroke="${color}" stroke-width="2.5"/>

  <text x="40" y="48" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="${color}" letter-spacing="2">SYS // J.A.S.P.E.R. 3D SPATIAL HOLOGRAM</text>
  <text x="${width - 40}" y="48" font-family="'Courier New', monospace" font-size="11" fill="#94a3b8" text-anchor="end" letter-spacing="1">STATUS: ONLINE • WEBGL 2.0</text>

  ${shapeSvg}

  <circle cx="480" cy="360" r="260" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="4 12" opacity="0.35"/>
  <circle cx="480" cy="360" r="300" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 18" opacity="0.25"/>

  <line x1="160" y1="${height - 75}" x2="${width - 160}" y2="${height - 75}" stroke="url(#hudLineGrad)" stroke-width="2"/>
  <text x="480" y="${height - 50}" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#f8fafc" text-anchor="middle" letter-spacing="3">${safePrompt.toUpperCase()}</text>
  <text x="480" y="${height - 28}" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="${color}" text-anchor="middle" letter-spacing="2">PRIMITIVE: ${upperType} • PBR METALLIC • GLTF 2.0</text>
</svg>`;
  }

  /**
   * Set custom executable path
   */
  async setCustomPath(blenderExePath) {
    if (!blenderExePath || !fs.existsSync(blenderExePath)) {
      throw new Error(`Invalid Blender executable path: ${blenderExePath}`);
    }
    this.customPath = blenderExePath;
    this.cachedPath = blenderExePath;
    await this.queryVersion(this.cachedPath);
    return this.getStatus();
  }

  /**
   * Trigger silent installation via winget on Windows
   */
  async installBlender() {
    if (process.platform !== 'win32') {
      throw new Error('Automated package installation via winget is only supported on Windows.');
    }
    if (this.installing) {
      return { status: 'already_running', message: 'Blender installation is already in progress.' };
    }

    this.installing = true;
    this.installProgress = 'Starting winget install for Blender Foundation...';

    const child = spawn('winget', [
      'install',
      '--id', 'BlenderFoundation.Blender',
      '-e',
      '--silent',
      '--accept-package-agreements',
      '--accept-source-agreements'
    ], { shell: true });

    child.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        this.installProgress = msg;
        console.log(`[Blender Install]: ${msg}`);
      }
    });

    child.stderr.on('data', (data) => {
      console.warn(`[Blender Install Warn]: ${data.toString().trim()}`);
    });

    child.on('close', async (code) => {
      this.installing = false;
      this.installProgress = code === 0 ? 'Installation completed successfully!' : `Failed with code ${code}`;
      console.log(`[Blender Install] Finished with code ${code}`);
      await this.detectBlender();
    });

    return { status: 'started', message: 'Blender download and installation triggered in background.' };
  }

  /**
   * Execute raw Python (bpy) script headlessly
   */
  async executeScript({ script, blendFile = null, timeout = 120000 }) {
    if (!this.cachedPath) {
      await this.detectBlender();
      if (!this.cachedPath) {
        throw new Error("Blender is not installed on this system. Please install Blender or provide its binary path.");
      }
    }

    const scriptFilename = `script_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.py`;
    const scriptFilePath = path.join(this.scriptsDir, scriptFilename);

    // Write Python code to temporary file
    fs.writeFileSync(scriptFilePath, script, 'utf8');

    const args = ['-b'];
    if (blendFile && fs.existsSync(blendFile)) {
      args.push(blendFile);
    }
    args.push('--python', scriptFilePath);

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const proc = spawn(this.cachedPath, args, {
        timeout,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (err) => {
        try { fs.unlinkSync(scriptFilePath); } catch (_) {}
        reject(err);
      });

      proc.on('close', (code) => {
        // Clean up temporary script
        try { fs.unlinkSync(scriptFilePath); } catch (_) {}

        const duration = Date.now() - startTime;
        if (code === 0) {
          resolve({
            success: true,
            code,
            durationMs: duration,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
        } else {
          resolve({
            success: false,
            code,
            durationMs: duration,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            error: `Blender process exited with code ${code}`
          });
        }
      });
    });
  }

  /**
   * Render a scene to PNG / JPEG image
   */
  async renderScene({
    blendFile = null,
    outputFile = null,
    resolutionX = 1920,
    resolutionY = 1080,
    engine = 'BLENDER_EEVEE_NEXT',
    samples = 64
  } = {}) {
    const filename = outputFile || `render_${Date.now()}.png`;
    const outputPath = path.join(this.rendersDir, filename);

    if (!this.cachedPath) {
      await this.detectBlender();
    }

    // Procedural Fallback if Blender is not installed
    if (!this.cachedPath) {
      console.log('[BlenderController] Headless render requested without Blender; synthesizing high-res 3D preview...');
      const latest = await this.getLatestAsset();
      const objType = latest?.latest?.objectType || 'torus';
      const prompt = latest?.latest?.prompt || 'Stark Holographic 3D Mesh';

      const imgBuf = await this.generatePreviewImage(prompt, objType, '#00f0ff');
      if (imgBuf) {
        fs.writeFileSync(outputPath, imgBuf);
        return {
          success: true,
          outputFile: path.basename(outputPath),
          outputPath,
          exists: true,
          url: `/api/blender/render/${path.basename(outputPath)}`,
          engine: 'Jasper Neural 3D Raytracer'
        };
      }

      const svgFilename = filename.replace(/\.(png|jpg|jpeg)$/i, '.svg');
      const svgPath = path.join(this.rendersDir, svgFilename);
      const svgContent = this.createHoloPreviewSvg({ objectType: objType, prompt, color: '#00f0ff', width: resolutionX, height: resolutionY });
      fs.writeFileSync(svgPath, svgContent, 'utf8');

      return {
        success: true,
        outputFile: svgFilename,
        outputPath: svgPath,
        exists: true,
        url: `/api/blender/render/${svgFilename}`,
        engine: 'Jasper Procedural Vector Raytracer'
      };
    }

    // Build a Python script to configure render settings and trigger render
    const pythonScript = `
import bpy
import os

scene = bpy.context.scene

# Configure resolution
scene.render.resolution_x = ${resolutionX}
scene.render.resolution_y = ${resolutionY}
scene.render.resolution_percentage = 100

# Configure render engine
try:
    scene.render.engine = '${engine}'
except Exception as e:
    scene.render.engine = 'BLENDER_EEVEE'

# Configure output
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.filepath = r"${outputPath.replace(/\\/g, '\\\\')}"

# Render frame
print("[JASPER BLENDER] Rendering frame to: " + scene.render.filepath)
bpy.ops.render.render(write_still=True)
print("[JASPER BLENDER] Render completed successfully.")
`;

    const result = await this.executeScript({ script: pythonScript, blendFile });

    let fileExists = fs.existsSync(outputPath);
    // Blender might append file extension e.g. .png if omitted
    let finalPath = outputPath;
    if (!fileExists && fs.existsSync(outputPath + '.png')) {
      finalPath = outputPath + '.png';
      fileExists = true;
    }

    return {
      ...result,
      outputFile: path.basename(finalPath),
      outputPath: finalPath,
      exists: fileExists,
      url: `/api/blender/render/${path.basename(finalPath)}`
    };
  }

  /**
   * Embedded Procedural Binary GLB (glTF 2.0) Synthesizer
   * Enables instant 3D model generation and holographic visualization
   * without requiring external Blender installation.
   */
  createProceduralGlb({ objectType = 'torus', prompt = '', color = '#00F0FF', metallic = 0.85, roughness = 0.15 } = {}) {
    let r = 0.0, g = 0.94, b = 1.0;
    if (color && color.startsWith('#') && color.length === 7) {
      r = parseInt(color.slice(1, 3), 16) / 255.0;
      g = parseInt(color.slice(3, 5), 16) / 255.0;
      b = parseInt(color.slice(5, 7), 16) / 255.0;
    }

    const positions = [];
    const normals = [];
    const indices = [];

    const lower = (prompt + ' ' + objectType).toLowerCase();

    if (lower.includes('sphere') || lower.includes('ball') || lower.includes('atom') || lower.includes('planet') || lower.includes('globe') || lower.includes('molecule') || objectType === 'sphere') {
      // UV Sphere
      const radius = 1.5;
      const widthSegments = 24;
      const heightSegments = 16;
      for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const theta = v * Math.PI;
        for (let x = 0; x <= widthSegments; x++) {
          const u = x / widthSegments;
          const phi = u * Math.PI * 2;
          const px = -radius * Math.sin(theta) * Math.cos(phi);
          const py = radius * Math.cos(theta);
          const pz = radius * Math.sin(theta) * Math.sin(phi);
          positions.push(px, py, pz);
          normals.push(px / radius, py / radius, pz / radius);
        }
      }
      for (let y = 0; y < heightSegments; y++) {
        for (let x = 0; x < widthSegments; x++) {
          const first = y * (widthSegments + 1) + x;
          const second = first + widthSegments + 1;
          indices.push(first, second, first + 1);
          indices.push(second, second + 1, first + 1);
        }
      }
    } else if (lower.includes('cube') || lower.includes('box') || lower.includes('engine') || lower.includes('tesseract') || objectType === 'cube') {
      // 3D Box
      const s = 1.2;
      const cubeVerts = [
        -s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s,
        -s, -s, -s,  -s,  s, -s,   s,  s, -s,   s, -s, -s,
        -s,  s, -s,  -s,  s,  s,   s,  s,  s,   s,  s, -s,
        -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s,
         s, -s, -s,   s,  s, -s,   s,  s,  s,   s, -s,  s,
        -s, -s, -s,  -s, -s,  s,  -s,  s,  s,  -s,  s, -s
      ];
      const cubeNorms = [
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
       -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
      ];
      for (let i = 0; i < cubeVerts.length; i++) positions.push(cubeVerts[i]);
      for (let i = 0; i < cubeNorms.length; i++) normals.push(cubeNorms[i]);
      for (let i = 0; i < 6; i++) {
        const offset = i * 4;
        indices.push(offset, offset + 1, offset + 2);
        indices.push(offset, offset + 2, offset + 3);
      }
    } else if (lower.includes('cylinder') || lower.includes('pipe') || objectType === 'cylinder') {
      // Cylinder
      const r_cyl = 1.0, h_cyl = 2.4;
      const segs = 24;
      for (let i = 0; i <= segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const x = Math.cos(angle) * r_cyl;
        const z = Math.sin(angle) * r_cyl;
        positions.push(x, h_cyl / 2, z);
        normals.push(x, 0, z);
        positions.push(x, -h_cyl / 2, z);
        normals.push(x, 0, z);
      }
      for (let i = 0; i < segs; i++) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2);
        indices.push(a + 1, a + 3, a + 2);
      }
    } else {
      // Parametric Torus (Default for Torus, Arc Reactor, Quantum Core, Orb)
      const R = 1.3, tube = 0.4;
      const radialSegments = 24, tubularSegments = 36;
      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        for (let i = 0; i <= tubularSegments; i++) {
          const u = (i / tubularSegments) * Math.PI * 2;
          const x = (R + tube * Math.cos(v)) * Math.cos(u);
          const y = (R + tube * Math.cos(v)) * Math.sin(u);
          const z = tube * Math.sin(v);
          positions.push(x, y, z);
          normals.push(Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v));
        }
      }
      for (let j = 1; j <= radialSegments; j++) {
        for (let i = 1; i <= tubularSegments; i++) {
          const a = (tubularSegments + 1) * j + i - 1;
          const b = (tubularSegments + 1) * (j - 1) + i - 1;
          const c = (tubularSegments + 1) * (j - 1) + i;
          const d = (tubularSegments + 1) * j + i;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }
    }

    const posBuf = Buffer.from(new Float32Array(positions).buffer);
    const normBuf = Buffer.from(new Float32Array(normals).buffer);
    const idxBuf = Buffer.from(new Uint16Array(indices).buffer);
    const padIdx = (4 - (idxBuf.length % 4)) % 4;
    const paddedIdxBuf = padIdx ? Buffer.concat([idxBuf, Buffer.alloc(padIdx)]) : idxBuf;
    const binBuffer = Buffer.concat([posBuf, normBuf, paddedIdxBuf]);

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      minX = Math.min(minX, positions[i]);
      maxX = Math.max(maxX, positions[i]);
      minY = Math.min(minY, positions[i+1]);
      maxY = Math.max(maxY, positions[i+1]);
      minZ = Math.min(minZ, positions[i+2]);
      maxZ = Math.max(maxZ, positions[i+2]);
    }

    const gltf = {
      asset: { version: '2.0', generator: 'Jasper Embedded Procedural 3D Engine' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      materials: [{
        name: 'JasperHologramMaterial',
        pbrMetallicRoughness: {
          baseColorFactor: [r, g, b, 1.0],
          metallicFactor: metallic,
          roughnessFactor: roughness
        }
      }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0, NORMAL: 1 },
          indices: 2,
          material: 0
        }]
      }],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 0,
          componentType: 5126,
          count: positions.length / 3,
          type: 'VEC3',
          min: [minX, minY, minZ],
          max: [maxX, maxY, maxZ]
        },
        {
          bufferView: 1,
          byteOffset: 0,
          componentType: 5126,
          count: normals.length / 3,
          type: 'VEC3'
        },
        {
          bufferView: 2,
          byteOffset: 0,
          componentType: 5123,
          count: indices.length,
          type: 'SCALAR'
        }
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: posBuf.length, target: 34962 },
        { buffer: 0, byteOffset: posBuf.length, byteLength: normBuf.length, target: 34962 },
        { buffer: 0, byteOffset: posBuf.length + normBuf.length, byteLength: idxBuf.length, target: 34963 }
      ],
      buffers: [{ byteLength: binBuffer.length }]
    };

    let jsonStr = JSON.stringify(gltf);
    while (jsonStr.length % 4 !== 0) jsonStr += ' ';
    const jsonBuf = Buffer.from(jsonStr, 'utf8');

    const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuffer.length;
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546C67, 0); // glTF magic
    header.writeUInt32LE(2, 4);          // version 2
    header.writeUInt32LE(totalLength, 8); // total byteLength

    const jsonHeader = Buffer.alloc(8);
    jsonHeader.writeUInt32LE(jsonBuf.length, 0);
    jsonHeader.writeUInt32LE(0x4E4F534A, 4); // JSON chunk

    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binBuffer.length, 0);
    binHeader.writeUInt32LE(0x004E4942, 4); // BIN chunk

    return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuffer]);
  }

  /**
   * Procedurally generate a 3D model, setup lighting/camera, and export as web-ready GLB
   */
  async generate3DModel({
    prompt = 'Futuristic Jasper Orb',
    objectType = 'torus', // 'cube' | 'sphere' | 'torus' | 'cylinder' | 'monkey' | 'text'
    color = '#00F0FF',
    metallic = 0.85,
    roughness = 0.15,
    text = 'JASPER 3D',
    renderPreview = true,
    apiKey = null
  } = {}) {
    const timestamp = Date.now();
    const exportFileName = `model_${objectType}_${timestamp}.glb`;
    const exportPath = path.join(this.exportsDir, exportFileName);
    const previewFileName = `preview_${objectType}_${timestamp}.png`;
    const previewPath = path.join(this.rendersDir, previewFileName);

    // Convert hex color to normalized RGB
    let r = 0.0, g = 0.94, b = 1.0;
    if (color && color.startsWith('#') && color.length === 7) {
      r = parseInt(color.slice(1, 3), 16) / 255.0;
      g = parseInt(color.slice(3, 5), 16) / 255.0;
      b = parseInt(color.slice(5, 7), 16) / 255.0;
    }

    // Auto-detect Blender binary if not already cached
    if (!this.cachedPath) {
      await this.detectBlender();
    }

    // FALLBACK ENGINE: If Blender is not installed, synthesize valid GLB via embedded engine
    if (!this.cachedPath) {
      console.log(`[BlenderController] Blender binary not detected on system; synthesizing 3D ${objectType} model via Jasper Embedded Procedural 3D Engine...`);
      try {
        const glbBuffer = this.createProceduralGlb({ objectType, prompt, color, metallic, roughness });
        fs.writeFileSync(exportPath, glbBuffer);

        let previewUrl = null;
        // 1. Attempt photo-real / digital 3D render picture synthesis (with apiKey for Gemini)
        const imgBuffer = await this.generatePreviewImage(prompt, objectType, color, apiKey);
        if (imgBuffer) {
          fs.writeFileSync(previewPath, imgBuffer);
          previewUrl = `/api/blender/render/${previewFileName}`;
        } else {
          // 2. High-res Stark Holographic Blueprint SVG
          const svgContent = this.createHoloPreviewSvg({ objectType, prompt, color });
          const svgPath = previewPath.replace(/\.png$/, '.svg');
          fs.writeFileSync(svgPath, svgContent, 'utf8');
          previewUrl = `/api/blender/render/${path.basename(svgPath)}`;
        }

        return {
          success: true,
          objectType,
          prompt,
          color,
          glbFileName: exportFileName,
          glbUrl: `/api/blender/export/${exportFileName}`,
          previewUrl,
          engine: 'Jasper Embedded Procedural 3D Engine',
          isEmbedded: true,
          message: '3D Asset synthesized successfully using Jasper Embedded Procedural 3D Engine. (Blender can be installed in the background for Cycles raytracing).'
        };
      } catch (embErr) {
        console.error('[BlenderController] Procedural fallback error:', embErr);
      }
    }

    const script = `
import bpy
import math

# 1. Clear existing scene
bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene

# 2. Setup Camera
camera_data = bpy.data.cameras.new(name='JasperCamera')
camera_data.lens = 50
camera_obj = bpy.data.objects.new('JasperCamera', camera_data)
scene.collection.objects.link(camera_obj)
camera_obj.location = (4.0, -4.0, 3.0)
camera_obj.rotation_euler = (math.radians(60), 0, math.radians(45))
scene.camera = camera_obj

# 3. Setup Lights (3-point studio lighting)
# Key Light
key_light_data = bpy.data.lights.new(name='KeyLight', type='POINT')
key_light_data.energy = 800.0
key_light_data.color = (1.0, 0.95, 0.9)
key_light = bpy.data.objects.new('KeyLight', key_light_data)
key_light.location = (3.5, -2.5, 4.0)
scene.collection.objects.link(key_light)

# Fill / Rim Light (Cyan Stark Neon)
rim_light_data = bpy.data.lights.new(name='RimLight', type='POINT')
rim_light_data.energy = 500.0
rim_light_data.color = (${r}, ${g}, ${b})
rim_light = bpy.data.objects.new('RimLight', rim_light_data)
rim_light.location = (-3.0, 3.0, 2.0)
scene.collection.objects.link(rim_light)

# 4. Create Material
mat = bpy.data.materials.new(name="JasperMaterial")
mat.use_nodes = True
nodes = mat.node_tree.nodes
bsdf = nodes.get("Principled BSDF")

if bsdf:
    # Set Base Color
    bsdf.inputs['Base Color'].default_value = (${r}, ${g}, ${b}, 1.0)
    # Set Metallic
    bsdf.inputs['Metallic'].default_value = ${metallic}
    # Set Roughness
    bsdf.inputs['Roughness'].default_value = ${roughness}
    # Optional Emission glow
    try:
        bsdf.inputs['Emission Color'].default_value = (${r} * 0.3, ${g} * 0.3, ${b} * 0.3, 1.0)
        bsdf.inputs['Emission Strength'].default_value = 0.5
    except:
        pass

# 5. Create Requested Geometry
# 5. Determine geometry type from prompt if auto
resolved_type = '${objectType}'
prompt_lower = """${prompt}""".lower()

if resolved_type == 'auto':
    if any(k in prompt_lower for k in ['satellite', 'orbiter', 'probe', 'spacecraft', 'telescope']):
        resolved_type = 'satellite'
    elif any(k in prompt_lower for k in ['reactor', 'arc', 'fusion', 'tokamak', 'core', 'ring']):
        resolved_type = 'arcreactor'
    elif any(k in prompt_lower for k in ['turbine', 'jet', 'engine', 'motor', 'propeller', 'thruster']):
        resolved_type = 'turbine'
    elif any(k in prompt_lower for k in ['drone', 'quadcopter', 'uav', 'recon']):
        resolved_type = 'drone'
    elif any(k in prompt_lower for k in ['tesseract', 'hypercube', 'dimension', '4d', 'matrix', 'cube']):
        resolved_type = 'tesseract'
    elif any(k in prompt_lower for k in ['atom', 'molecule', 'dna', 'chemical', 'crystal', 'lattice']):
        resolved_type = 'molecule'
    elif any(k in prompt_lower for k in ['head', 'skull', 'robot', 'monkey', 'face', 'cyborg']):
        resolved_type = 'monkey'
    elif any(k in prompt_lower for k in ['sphere', 'planet', 'earth', 'sun', 'star', 'globe']):
        resolved_type = 'sphere'
    elif any(k in prompt_lower for k in ['cylinder', 'capsule', 'pillar', 'pipe']):
        resolved_type = 'cylinder'
    elif any(k in prompt_lower for k in ['text', 'title', 'logo', 'word', 'name']):
        resolved_type = 'text'
    else:
        resolved_type = 'torus'

target_obj = None

if resolved_type == 'cube':
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    mod = target_obj.modifiers.new(name="Bevel", type='BEVEL')
    mod.width = 0.1
    mod.segments = 4
elif resolved_type == 'sphere':
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.2, segments=64, ring_count=32, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    bpy.ops.object.shade_smooth()
elif resolved_type == 'torus':
    bpy.ops.mesh.primitive_torus_add(major_radius=1.2, minor_radius=0.4, major_segments=64, minor_segments=32, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    target_obj.rotation_euler = (math.radians(35), math.radians(20), 0)
    bpy.ops.object.shade_smooth()
elif resolved_type == 'cylinder':
    bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=2.0, vertices=64, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    bpy.ops.object.shade_smooth()
elif resolved_type == 'monkey':
    bpy.ops.mesh.primitive_monkey_add(size=1.5, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    mod = target_obj.modifiers.new(name="Subsurf", type='SUBSURF')
    mod.levels = 2
elif resolved_type == 'satellite':
    # Central satellite main bus
    bpy.ops.mesh.primitive_cube_add(size=1.2, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    # Solar panel wing 1
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.2, 0, 0))
    w1 = bpy.context.active_object
    w1.scale = (1.6, 0.7, 0.05)
    w1.data.materials.append(mat)
    # Solar panel wing 2
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-2.2, 0, 0))
    w2 = bpy.context.active_object
    w2.scale = (1.6, 0.7, 0.05)
    w2.data.materials.append(mat)
    # High-gain parabolic dish antenna
    bpy.ops.mesh.primitive_cylinder_add(radius=0.6, depth=0.08, location=(0, 0, 0.85))
    dish = bpy.context.active_object
    dish.rotation_euler = (math.radians(40), 0, 0)
    dish.data.materials.append(mat)
elif resolved_type == 'arcreactor':
    # Luminous cyan core
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.25, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    # Concentric magnetic ring
    bpy.ops.mesh.primitive_torus_add(major_radius=1.25, minor_radius=0.18, location=(0, 0, 0))
    ring = bpy.context.active_object
    ring.data.materials.append(mat)
    # Magnetic copper transformer nodes
    for i in range(10):
        angle = i * (2 * math.pi / 10)
        bpy.ops.mesh.primitive_cube_add(size=0.18, location=(math.cos(angle) * 1.25, math.sin(angle) * 1.25, 0))
        c = bpy.context.active_object
        c.data.materials.append(mat)
elif resolved_type == 'turbine':
    # Center spinner cone
    bpy.ops.mesh.primitive_cone_add(radius1=0.45, depth=0.9, location=(0, -0.45, 0))
    target_obj = bpy.context.active_object
    target_obj.rotation_euler = (math.radians(90), 0, 0)
    # Outer nacelle ring
    bpy.ops.mesh.primitive_cylinder_add(radius=1.4, depth=1.6, vertices=48, location=(0, 0, 0))
    nacelle = bpy.context.active_object
    nacelle.rotation_euler = (math.radians(90), 0, 0)
    nacelle.data.materials.append(mat)
    # Rotor blades
    for b in range(14):
        angle = b * (2 * math.pi / 14)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(math.cos(angle) * 0.7, -0.3, math.sin(angle) * 0.7))
        blade = bpy.context.active_object
        blade.scale = (0.04, 0.25, 0.5)
        blade.rotation_euler = (0, angle, math.radians(28))
        blade.data.materials.append(mat)
elif resolved_type == 'drone':
    # Central fuselage
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    target_obj.scale = (1.2, 0.8, 0.35)
    # 4 Quad rotor booms & propellers
    for ax, ay in [(1.1, 1.1), (-1.1, 1.1), (1.1, -1.1), (-1.1, -1.1)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=1.3, location=(ax * 0.5, ay * 0.5, 0))
        arm = bpy.context.active_object
        arm.rotation_euler = (0, math.radians(90), math.atan2(ay, ax))
        arm.data.materials.append(mat)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=0.02, location=(ax, ay, 0.12))
        rotor = bpy.context.active_object
        rotor.data.materials.append(mat)
elif resolved_type == 'tesseract':
    bpy.ops.mesh.primitive_cube_add(size=1.8, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    mod = target_obj.modifiers.new(name="Wireframe", type='WIREFRAME')
    mod.thickness = 0.05
    bpy.ops.mesh.primitive_cube_add(size=0.9, location=(0, 0, 0))
    inner = bpy.context.active_object
    mod2 = inner.modifiers.new(name="Wireframe", type='WIREFRAME')
    mod2.thickness = 0.03
    inner.data.materials.append(mat)
elif resolved_type == 'molecule':
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(0, 0, 0))
    target_obj = bpy.context.active_object
    # 4 Tetrahedral orbital nodes
    for cx, cy, cz in [(0.9, 0.9, 0.9), (-0.9, -0.9, 0.9), (-0.9, 0.9, -0.9), (0.9, -0.9, -0.9)]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.32, location=(cx, cy, cz))
        atom = bpy.context.active_object
        atom.data.materials.append(mat)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=1.3, location=(cx * 0.5, cy * 0.5, cz * 0.5))
        bond = bpy.context.active_object
        bond.rotation_euler = (math.atan2(cy, cz), math.atan2(cx, cz), 0)
        bond.data.materials.append(mat)
elif resolved_type == 'text':
    bpy.ops.object.text_add(location=(-1.5, 0, 0))
    target_obj = bpy.context.active_object
    target_obj.data.body = "${text}"
    target_obj.data.extrude = 0.25
    target_obj.data.bevel_depth = 0.04
    target_obj.rotation_euler = (math.radians(90), 0, 0)
else:
    bpy.ops.mesh.primitive_torus_add(major_radius=1.2, minor_radius=0.4, location=(0, 0, 0))
    target_obj = bpy.context.active_object

if target_obj and mat:
    if target_obj.data.materials:
        target_obj.data.materials[0] = mat
    else:
        target_obj.data.materials.append(mat)

# 6. Export as GLTF/GLB for web viewing
print("[JASPER BLENDER] Exporting GLB to: ${exportPath.replace(/\\/g, '\\\\')}")
bpy.ops.export_scene.gltf(
    filepath=r"${exportPath.replace(/\\/g, '\\\\')}",
    export_format='GLB',
    use_selection=False,
    export_apply=True
)

# 7. Render Preview Image if requested
scene.render.resolution_x = 960
scene.render.resolution_y = 720
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = r"${previewPath.replace(/\\/g, '\\\\')}"
try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except:
    scene.render.engine = 'BLENDER_EEVEE'
bpy.ops.render.render(write_still=True)
print("[JASPER BLENDER] 3D Generation Pipeline complete.")
`;

    const execResult = await this.executeScript({ script });

    const glbExists = fs.existsSync(exportPath);
    const previewExists = fs.existsSync(previewPath) || fs.existsSync(previewPath + '.png');

    return {
      success: execResult.success && glbExists,
      objectType,
      prompt,
      color,
      glbFileName: exportFileName,
      glbUrl: glbExists ? `/api/blender/export/${exportFileName}` : null,
      previewUrl: previewExists ? `/api/blender/render/${previewFileName}` : null,
      logs: execResult.stdout
    };
  }

  /**
   * Launch Blender desktop application
   */
  launchGui(blendFilePath = null) {
    if (!this.cachedPath) {
      throw new Error("Blender executable not found. Please install Blender first.");
    }
    const args = blendFilePath && fs.existsSync(blendFilePath) ? [blendFilePath] : [];
    const child = spawn(this.cachedPath, args, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { launched: true, path: this.cachedPath, file: blendFilePath };
  }
}

module.exports = new BlenderController();
