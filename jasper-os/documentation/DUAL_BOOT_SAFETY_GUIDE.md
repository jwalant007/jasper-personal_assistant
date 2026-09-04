# Jasper OS — Dual-Boot Safety & Recovery Guide

> [!IMPORTANT]
> **Safety Guarantee**: No destructive operations will ever be executed without explicit user consent. Your Windows 11 installation, recovery partition, and user files remain untouched.

---

## 1. Safety Principles

1. **Test-First Hierarchy**:
   - Level 1: Prototype components directly in development environment.
   - Level 2: Boot Jasper OS in a virtual machine (QEMU / VirtualBox).
   - Level 3: Boot Jasper OS from a Live USB without touching internal NVMe drives.
   - Level 4: Only after testing and user approval, perform dual-boot installation to the internal NVMe drive.
2. **Never Format or Delete Windows**:
   - The Windows NTFS partition (`C:`) is preserved.
   - The Windows Recovery Partition (`Partition 4`) is never touched.
   - The Microsoft Reserved Partition (`Partition 2`) is never touched.
3. **Coexist in the EFI System Partition**:
   - Windows uses `/EFI/Microsoft/Boot/bootmgfw.efi`.
   - Jasper OS uses `/EFI/jasper/grubx64.efi`.
   - Both coexist peacefully in the existing 260 MB EFI partition without conflict.

---

## 2. Recommended Partitioning Scheme (When Ready for Physical Install)

When you choose to install Jasper OS permanently alongside Windows:

```
[ Disk 0 - 512GB NVMe SAMSUNG MZVLQ512HALU-000H1 (GPT) ]
┌──────────────┬─────────────┬─────────────────────┬──────────────────┬──────────────┐
│ Part 1 (ESP) │ Part 2(MSR) │ Part 3 (Windows 11) │ Part 5 (JASPER)  │ Part 4 (WinRE│
│ 260 MB FAT32 │ 16 MB       │ ~445 GB NTFS        │ ~30 GB ext4/btrfs│ 1018 MB      │
│ (Shared EFI) │ (Preserved) │ (~10-15 GB free)    │ (Jasper OS Root) │ (Recovery)   │
└──────────────┴─────────────┴─────────────────────┴──────────────────┴──────────────┘
```

- **Shrink Source**: Windows Partition 3 (`C:`) shrunk by **30 GB**.
- **New Partition**: Partition 5 formatted as **ext4** (or **Btrfs** with zstd compression) mounted at `/`.
- **Swap**: Dynamic swap file at `/swapfile` (2 GB to 4 GB) or zram in RAM.

---

## 3. Pre-Installation Backup Checklist

Before applying any physical disk partition changes in Phase 9:
1. **Windows System Restore Point**:
   - Create an updated restore point in Windows System Protection.
2. **EFI Partition Backup**:
   - Backup the contents of Partition 1 (ESP) to an external USB or cloud folder:
     ```powershell
     # In elevated PowerShell
     mountvol S: /S
     robocopy S:\EFI C:\EFI_Backup /E
     mountvol S: /D
     ```
3. **Personal Files Backup**:
   - Keep vital files backed up to OneDrive, Google Drive, or an external drive.

---

## 4. Disaster Recovery Procedure

If the system ever boots directly into Windows or GRUB does not show:
1. **Access UEFI Boot Menu**:
   - Turn on the laptop and immediately tap `F12` (or `Esc` / `F2` depending on laptop manufacturer).
   - Select either **Windows Boot Manager** or **Jasper OS**.
2. **Restore Windows Bootloader Priority**:
   - If you ever wish to bypass Jasper OS and boot directly into Windows:
     ```cmd
     # In Windows Administrator Command Prompt
     bcdedit /set {bootmgr} path \EFI\Microsoft\Boot\bootmgfw.efi
     ```
3. **Remove Jasper OS Cleanly (If ever needed)**:
   - Boot into Windows.
   - Delete `/EFI/jasper` from the EFI System Partition.
   - Delete Partition 5 and extend Windows Partition 3 (`C:`) back to full size via Windows Disk Management (`diskmgmt.msc`).
