# Jasper OS — Documentation Subsystem

## Purpose
The `documentation/` component provides the authoritative specifications, architecture blueprints, hardware compatibility matrix, and safety guidelines for Jasper OS.

## Architecture
- **Hardware Audit**: [`HARDWARE_REPORT.md`](HARDWARE_REPORT.md) details host laptop specifications (Intel i5-1135G7, Intel Iris Xe, 8GB RAM, NVMe 512GB) and Linux driver mappings.
- **Safety & Dual-Boot**: [`DUAL_BOOT_SAFETY_GUIDE.md`](DUAL_BOOT_SAFETY_GUIDE.md) establishes non-destructive partition rules, EFI coexistence, backup procedures, and disaster recovery.
- **System Architecture**: [`ARCHITECTURE.md`](ARCHITECTURE.md) outlines the 10-tier architecture from the Linux 6.6 LTS kernel to the Jasper AI assistant.

## Dependencies
- Standard Markdown readers / GitHub viewer.

## Build Process
Documentation is built and maintained as GitHub Flavored Markdown. Can optionally be rendered into HTML via MkDocs / mdBook:
```bash
# Optional local web documentation server
pip install mkdocs-material
mkdocs serve
```

## Configuration
- `mkdocs.yml` (optional navigation map).

## Testing
- Automated Markdown link checker and validation tools.

## Troubleshooting
- **Broken File Links**: Verify relative file paths match current repository tree.
