# Jasper OS

**Jasper OS** is a custom Linux-based desktop operating system engineered for modern laptops with an intelligent, native OS-level AI assistant, hardware acceleration, and seamless dual-boot integration alongside Windows 11.

---

## Mission & Principles

1. **Safety First**: Zero unauthorized modifications to existing Windows installations, recovery partitions, or personal data.
2. **Reliable Base**: Built atop a tested Linux LTS foundation (Linux Kernel >= 6.6, systemd, Wayland) with out-of-the-box hardware acceleration for Intel 11th Gen Iris Xe graphics.
3. **Distinct Identity**: Modern, fluid desktop experience inspired by top-tier desktop usability without proprietary Microsoft branding, code, or assets.
4. **Native AI Integration**: The **Jasper AI** assistant is embedded directly into the OS shell and services layer with strict privilege tiers (`L0` to `L3`) and safety confirmation gates.
5. **Dual-Boot Harmony**: Clean UEFI bootloader configuration giving the user a 5-second graphical menu to choose between Jasper OS and Windows 11.

---

## Target Hardware (Inspected System)

- **CPU**: 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz (4 Cores, 8 Threads)
- **GPU**: Intel(R) Iris(R) Xe Graphics (Mesa `iris`, Linux `i915` / `xe` driver)
- **RAM**: 8.0 GB RAM
- **Storage**: 512 GB NVMe SSD (`SAMSUNG MZVLQ512HALU-000H1`), GPT
- **Firmware**: UEFI with GPT Partition Table

---

## Directory Structure

```
jasper-os/
├── kernel/            # Kernel configs, module lists, boot parameters
├── system/            # systemd services, udev rules, sysctl, security policies
├── desktop/           # Wayland / display compositor configuration and session management
├── shell/             # Jasper Custom Shell (Taskbar, App Launcher, System Tray, Widgets)
├── applications/      # Jasper Core Apps (File Manager, Settings, System Monitor, Terminal)
├── jasper-ai/         # Native AI daemon, tool registry, local LLM/IPC connector
├── services/          # Background daemons (Busy Mode engine, Power & Network managers)
├── installer/         # Live installer scripts, dual-boot partitioner, GRUB config
├── packages/          # Package manifests, package lists, rootfs build scripts
├── drivers/           # Hardware drivers, Intel Iris Xe firmware, Wi-Fi/BT definitions
├── tools/             # ISO builder scripts, QEMU runner, USB imaging helper
├── documentation/     # Architecture, hardware report, dual-boot safety & recovery guide
└── tests/             # Structural, build, and integration tests
```

---

## 10-Phase Development Roadmap

| Phase | Milestone | Focus |
| :--- | :--- | :--- |
| **Phase 1** | Bootable Prototype | Minimal live ISO / QEMU harness running Linux 6.6 LTS base |
| **Phase 2** | Desktop Environment | Wayland compositor, window management, display manager |
| **Phase 3** | System Applications | File Manager, Settings, System Monitor, Terminal launcher |
| **Phase 4** | Hardware & Drivers | Intel Iris Xe Mesa acceleration, Wi-Fi 6, PipeWire audio, Bluetooth |
| **Phase 5** | Application Framework | Shared styling tokens, IPC bus, application sandbox manifests |
| **Phase 6** | Jasper AI Assistant | OS-level AI assistant UI, system context queries, voice/text palette |
| **Phase 7** | Automation & Tools | Permission-tiered tool execution engine (`L0` to `L3`) |
| **Phase 8** | Security & Busy Mode | Automated communication rules, contact whitelist, snapshot recovery |
| **Phase 9** | Dual-Boot Installer | Safe partition shrinker, EFI dual-boot setup, rollback safeguards |
| **Phase 10**| Polish & Optimization | Boot time < 5s, thermald / intel-pstate battery optimization |

---

## Documentation Index

- [Hardware Report](documentation/HARDWARE_REPORT.md)
- [Dual-Boot Safety & Recovery Guide](documentation/DUAL_BOOT_SAFETY_GUIDE.md)
- [System Architecture Blueprint](documentation/ARCHITECTURE.md)
