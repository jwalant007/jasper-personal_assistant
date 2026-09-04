#!/usr/bin/env python3
"""
Unit tests for Jasper OS AI Assistant privilege levels and confirmation gates.
"""

import unittest
import sys
from pathlib import Path

# Add jasper-ai to path
sys.path.insert(0, str(Path(__file__).parent.parent / "jasper-ai"))
from daemon import JasperAgentDaemon

class TestJasperAgentPermissions(unittest.TestCase):
    def setUp(self):
        self.daemon = JasperAgentDaemon()

    def test_l0_ambient_execution_allowed(self):
        """L0 tools should execute directly without confirmation."""
        res = self.daemon.execute_tool("get_battery_status")
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["tier"], "L0")
        self.assertIn("percentage", res["result"])

    def test_l1_low_risk_execution_allowed(self):
        """L1 tools should execute directly."""
        res = self.daemon.execute_tool("set_volume", {"volume": 75})
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["tier"], "L1")

    def test_l2_requires_confirmation(self):
        """L2 tools must block without confirmation flag."""
        res = self.daemon.execute_tool("connect_wifi", {"ssid": "TestNet"})
        self.assertEqual(res["status"], "CONFIRMATION_REQUIRED")
        self.assertEqual(res["tier"], "L2")

    def test_l3_destructive_blocked_without_confirmation(self):
        """L3 destructive tools (delete_file, modify_partitions) must be blocked without confirmation."""
        res = self.daemon.execute_tool("delete_file", {"path": "/etc/shadow"})
        self.assertEqual(res["status"], "CONFIRMATION_REQUIRED")
        self.assertEqual(res["tier"], "L3")

    def test_l3_destructive_allowed_with_explicit_confirmation(self):
        """L3 tools can only execute when explicitly confirmed by user."""
        res = self.daemon.execute_tool("delete_file", {"path": "/tmp/test.txt"}, confirmed=True)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["tier"], "L3")

if __name__ == "__main__":
    unittest.main()
