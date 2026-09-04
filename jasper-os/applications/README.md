# Jasper OS — Core Applications Subsystem

## Purpose
The `applications/` component contains the first-party desktop applications developed specifically for Jasper OS, offering a cohesive, modern user experience.

## Architecture
- **Jasper Files**: Multi-tabbed, dual-pane file explorer with integrated cloud storage, file previews, and search indexing.
- **Jasper Settings**: Modular system settings hub covering displays, audio, Bluetooth, Wi-Fi, battery health, AI permissions, and dual-boot preferences.
- **Jasper Monitor**: Hardware telemetry hub tracking CPU core loads, Iris Xe GPU utilization, RAM consumption, and process tree management.
- **Jasper Terminal**: GPU-accelerated terminal emulator with split tabs, search, and integrated Jasper AI command troubleshooting.

## Dependencies
- Modern UI toolkits (GTK4 / Libadwaita or Electron / WebKitGTK)
- `glib-2.0`, `gio-2.0`, `polkit-gobject-1`
- `vte-2.91` (for terminal subsystem)

## Build Process
```bash
# Example build for applications
for app in files settings monitor terminal; do
    cd applications/$app
    meson setup build && ninja -C build
    cd ../..
done
```

## Configuration
- Desktop entries placed in `/usr/share/applications/`:
  - `jasper-files.desktop`
  - `jasper-settings.desktop`
  - `jasper-monitor.desktop`
  - `jasper-terminal.desktop`

## Testing
- Automated UI tests checking IPC responsiveness and window lifecycle.
- Manual verification of file operations (copy, move, delete, trash, USB automount).
- Stress-testing Jasper Monitor under heavy system loads.

## Troubleshooting
- **File Manager Cannot Mount Drive**: Check `udisks2` service status with `systemctl status udisks2`.
- **Settings App Fails to Change Wi-Fi**: Confirm polkit rules allow NetworkManager modifications without password prompt for admin users.
