# Jasper OS — Desktop & Compositor Subsystem

## Purpose
The `desktop/` component manages the display server, Wayland compositor, window management, screen scaling, multi-monitor topology, and session startup for Jasper OS.

## Architecture
- **Protocol**: Wayland
- **Compositor Engine**: Lightweight, hardware-accelerated compositor (Mesa Iris Xe OpenGL/Vulkan rendering).
- **Features**:
  - Smooth 60Hz+ rendering with zero tearing.
  - Interactive window snapping (left, right, top quadrants, maximize).
  - Virtual workspaces with touchpad swipe gestures (3-finger horizontal).
  - Fractional display scaling (100%, 125%, 150%) tailored for high-DPI laptop screens.
  - Night light / blue light filter via gamma control.

## Dependencies
- `wayland`, `wayland-protocols`, `libinput`, `mesa-vulkan-drivers`, `xwayland` (for legacy compatibility).

## Build Process
```bash
# Build desktop session targets
meson setup build/
ninja -C build/
ninja -C build/ install
```

## Configuration
- `compositor.ini`: Output resolutions, scale factors, input acceleration profiles, and window rules.
- `wayland-sessions/jasper-desktop.desktop`: Session descriptor for display managers.

## Testing
- Launch nested session inside an existing display: `jasper-compositor --nested`
- Test window tiling hotkeys (`Super + Arrow Keys`).
- Verify FPS and frame times with `vkcube` or `glmark2-wayland`.

## Troubleshooting
- **Cursor lag / Frame Drops**: Verify hardware acceleration is active (`vulkaninfo --summary`).
- **Touchpad Not Responding**: Confirm user is in `input` group and check `libinput list-devices`.
