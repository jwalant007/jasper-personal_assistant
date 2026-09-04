# Jasper OS — Native Jasper AI Assistant Subsystem

## Purpose
The `jasper-ai/` component is the OS-level intelligence backbone of Jasper OS. Jasper is not merely a chatbot; it is a system-integrated agent with natural-language understanding, secure tool/function execution, troubleshooting capabilities, and automated communication handling.

## Architecture
- **Daemon (`jasper-aid`)**: Runs as a user session service communicating over Unix domain sockets and D-Bus.
- **Controlled Tool Registry**:
  - `L0 (Read-Only / Ambient)`: System telemetry, battery, brightness, time, Wi-Fi status.
  - `L1 (Low Risk Actions)`: Launch applications, adjust audio volume, open URLs, set alarms.
  - `L2 (Configuration Changes)`: Connect to known Wi-Fi, change wallpaper, toggle Bluetooth.
  - `L3 (Critical / Potentially Destructive)`: Package installation, file deletion, partition operations, bootloader changes. **NEVER auto-executes; requires modal user confirmation**.
- **Context Reader**: Reads permitted active window state, error logs, and system notifications to provide contextual help.

## Dependencies
- Local or hybrid LLM inference engine (e.g., llama.cpp / Ollama / API gateway)
- D-Bus bindings (`dbus-python` or native C/Rust D-Bus client)
- Speech recognition and synthesis engine (Piper / Whisper.cpp)

## Build Process
```bash
# Build Jasper AI daemon and tool runner
cd jasper-ai
make all
sudo make install
```

## Configuration
- `config/permissions.json`: Per-tool permission levels, whitelist, and confirmation gates.
- `config/agent_settings.json`: Inference endpoint, context window size, speech synthesis voice.

## Testing
- Unit tests for permission validation: `pytest tests/test_permissions.py`
- Tool execution verification: Simulate command "Check battery" and assert `L0` direct execution.
- Security confirmation test: Simulate command "Delete file" and assert `L3` confirmation dialog is displayed.

## Troubleshooting
- **Daemon Fails to Connect**: Check socket status at `/run/user/$UID/jasper-ai.sock`.
- **Tool Execution Denied**: Inspect audit log at `~/.local/share/jasper-ai/audit.log` to review permission tier evaluation.
