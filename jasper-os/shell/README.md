# Jasper OS — Shell Subsystem

## Purpose
The `shell/` component provides the visual identity and primary user interface of Jasper OS, including the taskbar/dock, start application launcher, system tray, quick settings flyout, notification center, and desktop workspace.

## Architecture
- **Framework**: Custom lightweight UI layer communicating via D-Bus and Wayland layer-shell protocol.
- **Core Elements**:
  - **Taskbar / Dock**: Centered or left-aligned with pinned applications, live window badges, and progress bars.
  - **Jasper Start Menu**: Instant fuzzy search across apps, system settings, files, and Jasper AI queries.
  - **Quick Settings**: Popover panel with Wi-Fi list, Bluetooth pairings, brightness/volume sliders, battery health, and Busy Mode toggle.
  - **Notification Center**: Grouped notifications with inline quick-reply buttons and quiet hours toggle.
  - **System Tray**: Status icons for background services, Jasper AI status, network, and audio.

## Dependencies
- Layer shell protocol (`wlr-layer-shell-unstable-v1`)
- Font packages (Inter / Outfit / Roboto), SVG icon sets (Lucide / Papirus)
- D-Bus client libraries

## Build Process
```bash
# Build shell binaries and asset bundles
npm install && npm run build
# Or native GTK/Qt/Rust shell build:
cargo build --release
```

## Configuration
- `theme.json`: Color schemes (Sleek Dark Mode / Vibrant Light Mode), glassmorphism blur intensity, border radii.
- `keybindings.conf`:
  - `Super`: Toggle Start Menu
  - `Super + J`: Open Jasper AI Assistant
  - `Super + E`: Open Jasper File Manager
  - `Super + L`: Lock Screen

## Testing
- Execute shell standalone in windowed mode: `./jasper-shell --debug`
- Verify responsive layout on varying resolutions (1080p, 1440p, 4K).
- Test hotkey responsiveness under CPU load.

## Troubleshooting
- **Missing System Tray Icons**: Ensure `status-notifier-watcher` is registered on D-Bus.
- **Blur Not Rendering**: Verify compositor has blur pipeline enabled in `desktop/compositor.ini`.
