#!/usr/bin/env python3
"""
Jasper OS — Dual-Boot Partition & Installer Safety Engine
Enforces strict non-destructive constraints when preparing the disk for dual-boot.
"""

import sys
import json

class DualBootInstaller:
    def __init__(self, disk_size_gb=512, win_size_gb=475, win_free_gb=40.2):
        self.disk_size_gb = disk_size_gb
        self.win_size_gb = win_size_gb
        self.win_free_gb = win_free_gb
        self.min_win_free_buffer_gb = 10.0  # Must preserve at least 10GB for Windows

    def calculate_shrink_plan(self, requested_jasper_size_gb=30.0):
        max_allowable_shrink = self.win_free_gb - self.min_win_free_buffer_gb
        if requested_jasper_size_gb > max_allowable_shrink:
            return {
                "safe": False,
                "error": f"Requested shrink of {requested_jasper_size_gb}GB exceeds safe limit of {max_allowable_shrink:.1f}GB. Windows needs at least {self.min_win_free_buffer_gb}GB free buffer."
            }

        new_win_size = self.win_size_gb - requested_jasper_size_gb
        remaining_win_free = self.win_free_gb - requested_jasper_size_gb

        return {
            "safe": True,
            "target_disk": "NVMe SAMSUNG MZVLQ512HALU-000H1 (512 GB)",
            "efi_partition": {
                "number": 1,
                "size_mb": 260,
                "action": "PRESERVE_AND_SHARE",
                "windows_efi": "/EFI/Microsoft/Boot/bootmgfw.efi (Preserved)",
                "jasper_efi": "/EFI/jasper/grubx64.efi (New Entry)"
            },
            "windows_partition": {
                "number": 3,
                "current_size_gb": self.win_size_gb,
                "shrink_by_gb": requested_jasper_size_gb,
                "new_size_gb": new_win_size,
                "remaining_free_space_gb": remaining_win_free
            },
            "jasper_partition": {
                "number": 5,
                "size_gb": requested_jasper_size_gb,
                "filesystem": "ext4 / btrfs (zstd)",
                "mount_point": "/"
            },
            "recovery_partition": {
                "number": 4,
                "action": "TOUCH_NOTHING"
            }
        }

if __name__ == "__main__":
    installer = DualBootInstaller()
    plan = installer.calculate_shrink_plan(30.0)
    print("=== Jasper OS Dual-Boot Partition Safety Plan ===")
    print(json.dumps(plan, indent=2))
