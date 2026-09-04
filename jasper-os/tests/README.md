# Jasper OS — Tests Subsystem

## Purpose
The `tests/` component provides unit tests, integration validations, safety checks, and syntax verifications across all Jasper OS components.

## Architecture
- **Structure Tests (`test_structure.ps1`)**: Validates that all required OS subdirectories, manifests, and documentation files exist.
- **Safety Audit Tests (`test_safety_rules.py`)**: Asserts that partition shrink rules protect Windows partitions, EFI boot entries, and minimum free space thresholds.
- **Bootloader Verification (`test_grub_syntax.sh`)**: Validates GRUB 2 configuration syntax and entry chains.
- **AI Permission Gate Tests (`test_agent_permissions.py`)**: Ensures `L3` commands (file deletion, formatting, partition editing) are never executed without user confirmation.

## Dependencies
- PowerShell 7+ or Python 3.10+
- `grub-emu` (for GRUB testing)

## Build Process
No build required for test harness.

## Configuration
- `test_config.json`: Test thresholds, expected directory counts, and mock disk sizes.

## Testing
```powershell
# Run the structural integrity test
.\tests\test_structure.ps1
```

## Troubleshooting
- **Missing File Error**: Re-run the generation tool or check git status.
