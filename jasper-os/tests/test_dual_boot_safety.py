#!/usr/bin/env python3
"""
Unit tests for Dual-Boot Partition & Disk Safety Engine.
"""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "installer"))
from dual_boot_installer import DualBootInstaller

class TestDualBootSafety(unittest.TestCase):
    def setUp(self):
        # Laptop detected specs: 512GB NVMe SSD, 475GB Windows, 40.2GB free
        self.installer = DualBootInstaller(disk_size_gb=512, win_size_gb=475, win_free_gb=40.2)

    def test_safe_shrink_calculation(self):
        """Shrinking by 25GB with 40.2GB free leaves >15GB buffer and is safe."""
        plan = self.installer.calculate_shrink_plan(25.0)
        self.assertTrue(plan["safe"])
        self.assertAlmostEqual(plan["windows_partition"]["remaining_free_space_gb"], 15.2, places=1)
        self.assertEqual(plan["efi_partition"]["action"], "PRESERVE_AND_SHARE")
        self.assertIn("bootmgfw.efi", plan["efi_partition"]["windows_efi"])

    def test_excessive_shrink_rejected(self):
        """Attempting to shrink by 35GB when only 40.2GB is free leaves <10GB and MUST be rejected."""
        plan = self.installer.calculate_shrink_plan(35.0)
        self.assertFalse(plan["safe"])
        self.assertIn("exceeds safe limit", plan["error"])

    def test_recovery_partition_preserved(self):
        """Windows Recovery partition must never be modified."""
        plan = self.installer.calculate_shrink_plan(20.0)
        self.assertEqual(plan["recovery_partition"]["action"], "TOUCH_NOTHING")

if __name__ == "__main__":
    unittest.main()
