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
   * Procedurally generate a 3D model, setup lighting/camera, and export as web-ready GLB
   */
  async generate3DModel({
    prompt = 'Futuristic Jasper Orb',
    objectType = 'torus', // 'cube' | 'sphere' | 'torus' | 'cylinder' | 'monkey' | 'text'
    color = '#00F0FF',
    metallic = 0.85,
    roughness = 0.15,
    text = 'JASPER 3D',
    renderPreview = true
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
