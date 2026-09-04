# Jasper OS — Drivers & Hardware Firmware Subsystem

## Purpose
The `drivers/` component curates the kernel modules, hardware firmware, and configuration quirks for optimal operation on the target laptop hardware (11th Gen Intel i5-1135G7, Intel Iris Xe, Realtek/Intel Wi-Fi and Bluetooth, audio codec).

## Architecture
- **Graphics Firmware**:
  - `i915/tgl_guc_70.bin`: Intel Tiger Lake Graphics Microcontroller (GuC).
  - `i915/tgl_huc_7.bin`: Intel Tiger Lake Hardware Update Controller (HuC).
  - `i915/tgl_dmc_ver2_12.bin`: Display Microcontroller for power gating.
- **Audio Codec**:
  - `intel/sof/sof-tgl.ri`: Sound Open Firmware for Intel Tiger Lake digital audio bus.
- **Wireless & Bluetooth**:
  - Intel Wi-Fi / Realtek 802.11ax firmware blobs.
  - Bluetooth HCI USB firmware loader.
- **Thermal & Power**:
  - `thermald`: Intel Thermal Daemon configuration for preventing thermal throttling.

## Dependencies
- `firmware-misc-nonfree`, `firmware-iwlwifi`, `firmware-realtek`, `intel-media-va-driver-non-free`

## Build Process
```bash
# Package firmware into Jasper driver bundle
mkdir -p drivers/lib/firmware/
rsync -av /lib/firmware/i915/ drivers/lib/firmware/i915/
rsync -av /lib/firmware/intel/sof/ drivers/lib/firmware/intel/sof/
```

## Configuration
- `/etc/modprobe.d/i915.conf`:
  ```ini
  options i915 enable_guc=3 enable_fbc=1 fastboot=1
  ```
- `/etc/modprobe.d/audio_powersave.conf`:
  ```ini
  options snd_hda_intel power_save=1
  ```

## Testing
- Execute `dmesg | grep -i firmware` to confirm all blobs loaded successfully without missing firmware warnings.
- Run `vainfo` to test Intel Iris Xe hardware video decode.

## Troubleshooting
- **Missing GuC/HuC Warning**: Confirm `firmware-misc-nonfree` package is installed and `i915.enable_guc=3` is in kernel parameters.
- **No Sound from Built-in Speakers**: Verify SOF firmware installation and check `alsamixer` channels.
