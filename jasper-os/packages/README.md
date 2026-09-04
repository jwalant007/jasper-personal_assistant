# Jasper OS — Packages & Rootfs Subsystem

## Purpose
The `packages/` component maintains the package lists, repository sources, custom package definitions, and rootfs composition manifests for building Jasper OS.

## Architecture
- **Rootfs Engine**: `debootstrap` / `live-build` configured for Debian Bookworm / Ubuntu LTS base.
- **Custom Packaging**: `.deb` packaging for Jasper-specific components:
  - `jasper-shell`
  - `jasper-desktop`
  - `jasper-ai`
  - `jasper-themes`
- **Package Tiers**:
  - `core.list`: Essential boot packages (kernel, systemd, udev, networkmanager).
  - `desktop.list`: Wayland, Mesa Iris Xe drivers, PipeWire, fonts, icons.
  - `apps.list`: Core applications, utilities, text editors.
  - `ai.list`: Jasper AI daemon, IPC libraries, speech modules.

## Dependencies
- `debootstrap`, `dpkg-dev`, `debhelper`, `apt-utils`, `squashfs-tools`

## Build Process
```bash
# Generate base rootfs
sudo debootstrap --arch=amd64 bookworm ./chroot http://deb.debian.org/debian
# Apply Jasper package manifests
./packages/apply_manifest.sh ./chroot
```

## Configuration
- `sources.list`: Official package repositories and Jasper OS local repository.
- `package_manifest.json`: Complete bill of materials (BOM) with exact package versions.

## Testing
- Chroot verification: Verify all dependencies resolve cleanly inside the chroot environment without broken packages (`apt --fix-broken install`).

## Troubleshooting
- **Missing GPG Key**: Ensure Jasper OS repository public key is added to `/etc/apt/trusted.gpg.d/jasper.gpg`.
- **Dependency Conflicts**: Audit package version pins in `packages/preferences`.
