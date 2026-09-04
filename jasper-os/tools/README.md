# Jasper OS — Build Tools & Test Harness Subsystem

## Purpose
The `tools/` component contains the automated tooling for assembling bootable Jasper OS ISO images, testing them safely in virtual machines (QEMU/VirtualBox), and preparing Live USB drives without touching the host's internal storage drives.

## Architecture
- **`build_live_iso.sh`**: Linux/WSL automated pipeline to debootstrap rootfs, install Jasper packages, compress into `filesystem.squashfs`, and generate an EFI-bootable ISO using `xorriso` and `grub-mkrescue`.
- **`build_live_iso.ps1`**: PowerShell orchestrator to coordinate builds via WSL or Docker from Windows.
- **`run_qemu_test.ps1`**: Safe VM runner that boots the generated Jasper OS ISO in QEMU with UEFI support (`OVMF`) and 4GB RAM allocation, allowing full interactive testing before any USB or disk write.
- **`write_usb_helper.ps1`**: Safety-guarded USB imaging script that verifies target drive is external/removable before writing.

## Dependencies
- `qemu-system-x86_64`, `xorriso`, `squashfs-tools`, `mtools`, `ovmf`

## Build Process
```bash
# Build the ISO image in Linux / WSL
chmod +x tools/build_live_iso.sh
./tools/build_live_iso.sh
```

## Configuration
- `tools/iso_config.json`: ISO volume label (`JASPER_OS_LIVE`), version, compression type (`zstd`).

## Testing
- Run test VM on Windows:
  ```powershell
  .\tools\run_qemu_test.ps1 -IsoPath "output\jasper-os-live-amd64.iso"
  ```

## Troubleshooting
- **OVMF Firmware Missing**: Ensure `qemu` and `ovmf` (UEFI firmware) are installed.
- **Permission Denied on Chroot**: Building a Linux rootfs requires root (`sudo`) within Linux/WSL.
