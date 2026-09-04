# Jasper OS — Installer & Dual-Boot Subsystem

## Purpose
The `installer/` component provides the deployment scripts, disk partitioning logic, and dual-boot bootloader setup for installing Jasper OS alongside an existing Windows 11 installation.

## Architecture
- **Safety Engine**:
  - Validates partition table before any disk write.
  - Verifies presence of Windows EFI files (`bootmgfw.efi`).
  - Ensures a minimum of 10-15 GB free space remains on Windows `C:`.
- **Non-Destructive Partitioning**:
  - Safely shrinks Windows NTFS partition using `ntfsresize` / `parted`.
  - Creates Jasper OS root partition (ext4/btrfs) in the newly freed unallocated space.
- **Dual-Boot Bootloader Setup**:
  - Installs GRUB 2 EFI x86_64 to `/EFI/jasper/grubx64.efi` on the existing EFI System Partition.
  - Automatically executes `os-prober` to configure Windows Boot Manager as an option.
  - Sets a 5-second countdown with a sleek Jasper OS graphical boot menu.

## Dependencies
- `parted`, `dosfstools`, `e2fsprogs`, `ntfs-3g`
- `grub-efi-amd64`, `os-prober`, `efibootmgr`

## Build Process
```bash
# Build installer binary / script package
cd installer
make
```

## Configuration
- `dual_boot_grub.cfg`: Master GRUB 2 dual-boot template with automated OS probing.
- `installer_rules.json`: Strict partition safety limits and minimum disk thresholds.

## Testing
- Execute dry-run partition shrink in virtual disk: `python3 -m unittest tests/test_partition_safety.py`
- Test GRUB configuration generation against virtual EFI partitions.

## Troubleshooting
- **Windows Missing from GRUB**: Mount EFI partition and verify `/EFI/Microsoft/Boot/bootmgfw.efi` exists, then run `update-grub`.
- **System Boots Straight to Windows**: Boot into Windows, open Administrator PowerShell and run `bcdedit /set {bootmgr} path \EFI\jasper\grubx64.efi`.
