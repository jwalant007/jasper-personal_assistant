# Jasper OS — Kernel Subsystem

## Purpose
The `kernel/` component defines the configuration, build manifests, and kernel module specifications for the Jasper OS Linux kernel. It targets the 11th Gen Intel Core i5-1135G7 processor and Iris Xe GPU, ensuring maximum power efficiency, thermal regulation, and peripheral support.

## Architecture
- **Upstream Base**: Linux Kernel 6.6 LTS (Long Term Support)
- **Subsystems**:
  - `CONFIG_DRM_I915`: Intel Iris Xe graphics driver with GuC/HuC firmware loading.
  - `CONFIG_X86_INTEL_PSTATE`: Hardware-guided CPU frequency scaling.
  - `CONFIG_NVME_CORE`: High-performance NVMe driver for Samsung SSDs.
  - `CONFIG_SND_SOC_INTEL_SOUNDWIRE`: Intel Tiger Lake digital audio bus.
  - `CONFIG_BT_INTEL`: Bluetooth 5.x interface controller.

## Dependencies
- `gcc` / `clang` (x86_64 target)
- `bison`, `flex`, `libssl-dev`, `libelf-dev`, `bc`
- Intel microcode and firmware packages (`intel-microcode`, `firmware-misc-nonfree`)

## Build Process
```bash
# In the build environment
make x86_64_defconfig
cat config-6.6-x86_64 >> .config
make olddefconfig
make -j$(nproc) bindeb-pkg
```

## Configuration
- `config-6.6-x86_64`: Kernel compilation flags and enabled modules.
- `cmdline.txt`: Default boot command line arguments:
  ```
  quiet splash i915.enable_guc=3 intel_pstate=active
  ```

## Testing
- Boot test in QEMU with `-enable-kvm -cpu host`.
- Verify `dmesg | grep -i "iris\|xe\|i915"` shows active hardware acceleration.
- Check thermal states via `turbostat` and `sensors`.

## Troubleshooting
- **Black Screen on Boot**: Append `nomodeset` to kernel parameters in GRUB to test basic framebuffer before diagnosing GPU driver.
- **Audio Stutter**: Verify `snd_hda_intel` or `snd_sof_pci_intel_tgl` module loading in `/etc/modprobe.d/audio.conf`.
