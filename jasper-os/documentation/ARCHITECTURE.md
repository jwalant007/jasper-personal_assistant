# Jasper OS — System Architecture Blueprint

This document details the complete 10-tier architecture of Jasper OS, from the Linux kernel up through the user-facing desktop shell and the native Jasper AI assistant.

---

## 1. Architectural Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Jasper Custom Desktop Shell                 │
│  (Taskbar · App Launcher · Quick Settings · Notifications)  │
├──────────────────────────────┬──────────────────────────────┤
│      Jasper System Apps      │       Jasper AI Agent        │
│  (Files · Settings · Term)   │ (L0-L3 Tools · Busy Mode)    │
├──────────────────────────────┴──────────────────────────────┤
│               Jasper OS Services & D-Bus Bus                │
│    (Powerd · NetworkWatcher · BluetoothDaemon · AgentIPC)   │
├─────────────────────────────────────────────────────────────┤
│                 Wayland Display Compositor                  │
│       (Hardware Accelerated Rendering · Window Snapping)    │
├─────────────────────────────────────────────────────────────┤
│                     Audio & Media Engine                    │
│                 (PipeWire · WirePlumber · ALSA)             │
├─────────────────────────────────────────────────────────────┤
│                    Hardware & Drivers Subsystem             │
│            (Intel Iris Xe Mesa / i915 · Wi-Fi · BlueZ)      │
├─────────────────────────────────────────────────────────────┤
│                Base System & Init (systemd)                 │
│             (udev · journald · logind · security)           │
├─────────────────────────────────────────────────────────────┤
│                    Linux Kernel (6.6+ LTS)                  │
├─────────────────────────────────────────────────────────────┤
│               Dual-Boot Bootloader (GRUB 2 EFI)             │
│                 [Jasper OS]  |  [Windows 11]                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Descriptions

### Tier 1: Dual-Boot Bootloader (`installer/dual_boot_grub.cfg`)
- Standard GRUB 2 EFI x86_64 installation.
- Configured with `os-prober` to detect `Windows Boot Manager` on `/dev/nvme0n1p1`.
- Clean 5-second countdown with custom graphical Jasper OS theme.

### Tier 2: Linux Kernel & Hardware Abstraction (`kernel/`)
- Linux 6.6 LTS with Tiger Lake (Intel 11th Gen) optimizations.
- Built-in modules for NVMe, Intel Iris Xe graphics (`i915`), USB-C / Thunderbolt, and Wi-Fi.

### Tier 3: Base System & Services (`system/` and `services/`)
- Standard systemd init system.
- Custom units for `jasper-agent.service`, `jasper-busymode.service`, and `jasper-power.service`.
- Dynamic resource management and zram compressed memory swap.

### Tier 4: Wayland Compositor (`desktop/`)
- Hardware-accelerated compositor providing tear-free 60+ FPS window rendering.
- Multi-monitor support, fractional display scaling, and workspace switcher.
- Window snapping (Left, Right, Quadrant, Maximize).

### Tier 5: Jasper Desktop Shell (`shell/`)
- **Taskbar / Dock**: Active running apps, pinned launchers, window thumbnail previews.
- **Start / App Launcher**: Fuzzy search, categorized app catalog, recent documents.
- **Quick Settings Tray**: Wi-Fi network selector, Bluetooth toggle, volume slider, brightness control, battery profile.
- **Notification Center**: Actionable notifications, do-not-disturb toggle, calendar widget.
- **Context Menus & Hotkeys**: Customizable keyboard shortcuts (`Super`, `Super+A`, `Super+E`).

### Tier 6: Native Core Applications (`applications/`)
- **Jasper Files**: File manager with dual-pane layout, bookmarks, file tags, and search.
- **Jasper Settings**: Unified control center for displays, sounds, themes, users, and networks.
- **Jasper Monitor**: Real-time CPU, GPU, memory, process tree, and disk I/O monitor.
- **Jasper Terminal**: Modern GPU-accelerated terminal emulator with custom Jasper prompt.

### Tier 7: Jasper AI Assistant (`jasper-ai/`)
- OS-level native background assistant.
- Local command interpretation and function-calling engine.
- Strict security tiers:
  - `L0` (Safe/Read-Only): System status, battery, brightness, time.
  - `L1` (Low Risk): Launch apps, adjust volume, toggle Bluetooth.
  - `L2` (Configuration): Network settings, display modes.
  - `L3` (Critical/Restricted): Partition modification, package installation, file deletion. Always requires explicit UI confirmation.

### Tier 8: Communication & Busy Mode (`services/`)
- Configurable auto-responder for incoming messages and communications.
- Priority contact whitelist and do-not-disturb integration.
- Full activity and audit log recorded to encrypted storage.
