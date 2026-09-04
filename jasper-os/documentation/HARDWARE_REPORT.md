# Jasper OS — Hardware Audit & Driver Compatibility Report

This document records the exact hardware audit performed on the user's host laptop and outlines the driver requirements for Jasper OS.

---

## 1. System Specifications Audit

| Component | Detected Specification | Linux Support Level | Recommended Driver / Subsystem |
| :--- | :--- | :--- | :--- |
| **Processor (CPU)** | 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz (4 cores / 8 threads) | Tier 1 (Native) | Kernel x86_64, `intel-pstate` frequency scaling, `turbostat` |
| **Architecture** | x86_64 (Tiger Lake family) with AVX-512 support | Native | Standard Linux 64-bit ABI |
| **Graphics (GPU)** | Intel(R) Iris(R) Xe Graphics (Gen 12) | Tier 1 (Excellent) | Open-source Mesa `iris` OpenGL 4.6 / Vulkan (`anv`), Linux `i915` / `xe` driver |
| **Physical Memory** | 8.0 GB RAM (Visible: ~7.65 GiB) | Native | Linux `zram` compressed RAM swap + 2GB swapfile |
| **Internal SSD** | 512 GB NVMe (`SAMSUNG MZVLQ512HALU-000H1`) | Native | Linux `nvme` kernel subsystem, NVMe 1.4 |
| **Firmware Mode** | UEFI (GPT Partition Scheme) | Native | GRUB 2 EFI x86_64 (`grub-efi-amd64`) |
| **Display Acceleration** | Intel Gen12 Video Engine | Native | VA-API hardware decode/encode (`intel-media-driver`) |

---

## 2. Existing Partition Table (Disk 0)

| Partition | Size | Type / Format | Role | Safety Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Partition 1** | 260 MB | FAT32 (EFI System Partition) | Windows Boot Manager (`bootmgfw.efi`) | **REUSE ESP SAFELY**: Place Jasper OS bootloader at `/EFI/jasper/grubx64.efi`. **DO NOT FORMAT**. |
| **Partition 2** | 16 MB | Microsoft Reserved (MSR) | Windows Internal Use | **NEVER TOUCH**. Preserve exactly as-is. |
| **Partition 3** | ~475.6 GB | NTFS (`C:`) | Windows 11 System & Data | **PRESERVE**. Has ~40.2 GB free. Can be safely shrunk by 25-30 GB during Phase 9 installation, leaving 10-15 GB for Windows. |
| **Partition 4** | ~1018 MB | Recovery Partition (WinRE) | Windows Recovery Tools | **NEVER TOUCH**. Preserve for Windows repair. |

---

## 3. Recommended Linux Foundation & Toolchain

1. **Base Distribution**: **Debian 12 Bookworm (or Ubuntu 24.04 LTS base)**
   - *Why*: Unrivaled stability, massive software repository, complete hardware compatibility for Intel 11th Gen, proven live-boot tools (`live-build`, `debootstrap`).
2. **Kernel Version**: **Linux 6.6+ LTS (or 6.8+ HWE)**
   - *Why*: Crucial for stable Intel Iris Xe Gen12 display initialization, energy-efficient idle C-states, and robust suspend/resume cycles.
3. **Display Server / Compositor**: **Wayland** with a tailored compositor (Wayfire / Weston / Sway-based)
   - *Why*: Wayland provides tear-free rendering, fractional scaling, touchpad gesture support, and hardware acceleration on Intel Iris Xe.
4. **Audio Subsystem**: **PipeWire** with WirePlumber
   - *Why*: Low latency, seamless Bluetooth audio profiles (LDAC, AAC, SBC), automatic fallback for laptop speakers and headphone jacks.
5. **Networking & Bluetooth**: **NetworkManager** + **BlueZ 5.x**
   - *Why*: Standard D-Bus API, easily scriptable and integrated into the custom Jasper OS shell.
