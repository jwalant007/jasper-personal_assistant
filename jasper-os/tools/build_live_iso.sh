#!/usr/bin/env bash
# ==============================================================================
# Jasper OS — Phase 1 Live ISO Builder
# Generates a bootable hybrid UEFI/BIOS ISO image based on Debian 12 Bookworm
# ==============================================================================
set -euo pipefail

WORK_DIR="$(pwd)/build_iso"
ROOTFS_DIR="${WORK_DIR}/chroot"
IMAGE_DIR="${WORK_DIR}/image"
OUTPUT_DIR="$(pwd)/output"
ISO_NAME="jasper-os-live-amd64.iso"

echo "=== [1/6] Preparing Build Environment ==="
mkdir -p "${WORK_DIR}" "${IMAGE_DIR}" "${OUTPUT_DIR}"

# Check prerequisites
for cmd in debootstrap xorriso mksquashfs grub-mkrescue; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "Error: Required command '$cmd' is not installed."
        echo "Run: sudo apt update && sudo apt install -y debootstrap xorriso squashfs-tools grub-pc-bin grub-efi-amd64-bin mtools"
        exit 1
    fi
done

echo "=== [2/6] Bootstrapping Base System (Debian 12 Bookworm) ==="
if [ ! -d "${ROOTFS_DIR}" ]; then
    sudo debootstrap --arch=amd64 --variant=minbase bookworm "${ROOTFS_DIR}" http://deb.debian.org/debian/
fi

echo "=== [3/6] Configuring Jasper OS Environment & Kernel ==="
sudo chroot "${ROOTFS_DIR}" /bin/bash <<'CHROOT_EOF'
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
    linux-image-amd64 \
    live-boot \
    systemd-sysv \
    udev \
    network-manager \
    pipewire \
    sudo \
    curl \
    ca-certificates \
    pciutils \
    usbutils

# Setup hostname and user
echo "jasper-os" > /etc/hostname
echo "127.0.0.1 localhost jasper-os" > /etc/hosts
useradd -m -s /bin/bash -G sudo jasper || true
echo "jasper:jasper" | chpasswd

apt-get clean
rm -rf /var/lib/apt/lists/*
CHROOT_EOF

echo "=== [4/6] Creating SquashFS Filesystem ==="
mkdir -p "${IMAGE_DIR}/live"
sudo mksquashfs "${ROOTFS_DIR}" "${IMAGE_DIR}/live/filesystem.squashfs" -comp zstd -Xcompression-level 15 -noappend

# Copy Kernel & Initramfs
KERNEL_PATH=$(ls -t "${ROOTFS_DIR}/boot/vmlinuz-"* | head -1)
INITRD_PATH=$(ls -t "${ROOTFS_DIR}/boot/initrd.img-"* | head -1)
cp "${KERNEL_PATH}" "${IMAGE_DIR}/live/vmlinuz"
cp "${INITRD_PATH}" "${IMAGE_DIR}/live/initrd.img"

echo "=== [5/6] Generating Dual-Boot GRUB Configuration ==="
mkdir -p "${IMAGE_DIR}/boot/grub"
cat << 'EOF' > "${IMAGE_DIR}/boot/grub/grub.cfg"
set default="0"
set timeout=5

menuentry "Jasper OS (Live Environment)" {
    linux /live/vmlinuz boot=live quiet splash
    initrd /live/initrd.img
}

menuentry "Jasper OS (Safe Framebuffer Mode)" {
    linux /live/vmlinuz boot=live nomodeset
    initrd /live/initrd.img
}
EOF

echo "=== [6/6] Generating Bootable Hybrid ISO ==="
grub-mkrescue -o "${OUTPUT_DIR}/${ISO_NAME}" "${IMAGE_DIR}"

echo "================================================================="
echo " SUCCESS: Jasper OS Bootable ISO built at:"
echo " ${OUTPUT_DIR}/${ISO_NAME}"
echo " Test safely in QEMU using tools/run_qemu_test.ps1"
echo "================================================================="
