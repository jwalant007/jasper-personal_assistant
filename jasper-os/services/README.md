# Jasper OS — Services Subsystem

## Purpose
The `services/` component hosts core background daemons that run continuously to manage system policies, power states, network switching, and communication automation.

## Architecture
- **Busy Mode Service (`jasper-busymode`)**:
  - Automatically intercepts supported incoming messages (email, chat, notifications).
  - Matches sender against priority whitelist (`family`, `team`, `urgent`).
  - Drafts and sends customizable polite auto-replies when user is busy.
  - Keeps full encrypted audit log of all automated communications.
- **Power Optimization Daemon (`jasper-powerd`)**:
  - Dynamically adjusts Intel Iris Xe GPU frequency and CPU `intel-pstate` profiles based on battery level.
  - Configures idle timeouts, screen dimming, and deep suspend (`s2idle`).
- **Network Watcher (`jasper-networkd`)**:
  - Monitors connection quality, auto-reconnects to priority Wi-Fi, and handles captive portals.

## Dependencies
- `systemd`, `dbus`, `glib-2.0`
- `libnotify`, `upower`

## Build Process
```bash
# Build background services
cd services
cmake -B build -S .
cmake --build build
sudo cmake --install build
```

## Configuration
- `etc/jasper-busymode.conf`:
  ```ini
  [General]
  enabled=false
  auto_reply_message="I am currently in focus mode. Jasper will notify me of urgent messages."
  working_hours=09:00-18:00
  ```
- `etc/jasper-power.conf`: Battery thresholds for low-power mode (default: 20%).

## Testing
- Test busy mode simulation: `jasper-busymode-ctl test-incoming --sender "boss@work.com" --message "urgent update"`
- Verify power state transitions: `upower -d`

## Troubleshooting
- **Auto-Reply Not Sending**: Ensure Busy Mode is toggled to ON and contact is not in the mute list.
- **Laptop Doesn't Sleep on Lid Close**: Verify `systemd-logind.conf` has `HandleLidSwitch=suspend`.
