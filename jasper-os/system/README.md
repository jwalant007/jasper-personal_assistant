# Jasper OS — System Subsystem

## Purpose
The `system/` component houses the core userspace init configurations, systemd services, udev device rules, sysctl performance tweaks, and security policies for Jasper OS.

## Architecture
- **Init System**: `systemd` (v254+)
- **Device Management**: `udev` rules for input devices, power events, and audio interfaces.
- **Resource Management**: `zram-tools` for compressed memory paging, eliminating the need for large physical swap partitions.
- **Security Framework**: AppArmor profiles and polkit authorization rules for Jasper AI.

## Dependencies
- `systemd`, `udev`, `dbus`, `polkitd`, `apparmor`
- `zram-tools`

## Build Process
System files are installed into rootfs targets during the image generation phase:
```bash
cp -r system/etc/* /target/etc/
cp -r system/lib/systemd/system/* /target/lib/systemd/system/
systemctl --root=/target enable jasper-agent.service
```

## Configuration
- `sysctl.d/99-jasper.conf`:
  ```ini
  vm.swappiness=10
  vm.vfs_cache_pressure=50
  fs.inotify.max_user_watches=524288
  ```
- `udev/90-jasper-power.rules`: Automatic power-saving toggles upon battery/AC transitions.

## Testing
- Verify all systemd units start cleanly: `systemctl --failed`
- Test zram creation: `swapon --show`
- Validate polkit authorization checks for non-root tool execution.

## Troubleshooting
- **Service Timeout**: Check detailed startup logs with `journalctl -xeu <service-name>`.
- **Permission Denied**: Inspect polkit rules in `/etc/polkit-1/rules.d/50-jasper.rules`.
