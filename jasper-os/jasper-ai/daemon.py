#!/usr/bin/env python3
"""
Jasper OS — Native OS-Level AI Assistant Daemon
Provides tool dispatch, privilege tier enforcement (L0-L3), safety confirmations,
and telemetry integration.
"""

import sys
import json
import os
import time
import argparse
from pathlib import Path

CONFIG_PATH = Path(__file__).parent / "config" / "permissions.json"
AUDIT_LOG = Path(__file__).parent / "audit.log"

class JasperAgentDaemon:
    def __init__(self, config_file=CONFIG_PATH):
        with open(config_file, "r") as f:
            self.config = json.load(f)
        self.tiers = self.config["permission_tiers"]
        self.tools = self.config["tools"]

    def log_activity(self, tool_name, status, details):
        entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "tool": tool_name,
            "status": status,
            "details": details
        }
        with open(AUDIT_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def execute_tool(self, tool_name, params=None, confirmed=False):
        if params is None:
            params = {}

        if tool_name not in self.tools:
            return {"status": "error", "message": f"Unknown tool: {tool_name}"}

        tool_meta = self.tools[tool_name]
        tier = tool_meta["tier"]
        tier_info = self.tiers[tier]

        # Safety Gate Check: L2 and L3 require explicit confirmation
        if tier_info["requires_confirmation"] and not confirmed:
            self.log_activity(tool_name, "CONFIRMATION_REQUIRED", {"tier": tier, "params": params})
            return {
                "status": "CONFIRMATION_REQUIRED",
                "tool": tool_name,
                "tier": tier,
                "tier_name": tier_info["name"],
                "message": f"Action '{tool_name}' requires explicit user confirmation before execution ({tier}: {tier_info['name']}).",
                "params": params
            }

        # Simulated Tool Handlers
        result = None
        if tool_name == "get_battery_status":
            result = {"percentage": 88, "charging": False, "source": "Battery"}
        elif tool_name == "get_system_stats":
            result = {"cpu_usage_pct": 14.2, "ram_used_mb": 3420, "ram_total_mb": 8022, "gpu": "Intel Iris Xe"}
        elif tool_name == "get_wifi_status":
            result = {"connected": True, "ssid": "Home-5G", "signal_pct": 92}
        elif tool_name == "launch_application":
            app = params.get("app", "jasper-terminal")
            result = {"launched": app, "pid": 4120}
        elif tool_name == "set_volume":
            vol = params.get("volume", 50)
            result = {"volume_set": vol}
        elif tool_name == "delete_file":
            filepath = params.get("path")
            result = {"deleted": filepath, "simulated": True}
        elif tool_name == "modify_partitions":
            result = {"action": "partition_edit", "simulated": True, "status": "executed_safely"}
        else:
            result = {"executed": tool_name, "params": params}

        self.log_activity(tool_name, "EXECUTED", {"tier": tier, "result": result})
        return {
            "status": "SUCCESS",
            "tool": tool_name,
            "tier": tier,
            "result": result
        }

def main():
    parser = argparse.ArgumentParser(description="Jasper OS AI Daemon")
    parser.add_argument("--tool", type=str, help="Tool to execute")
    parser.add_argument("--params", type=str, default="{}", help="JSON parameters")
    parser.add_argument("--confirmed", action="store_true", help="Explicit user confirmation flag")
    args = parser.parse_args()

    daemon = JasperAgentDaemon()

    if args.tool:
        try:
            params = json.loads(args.params)
        except Exception:
            params = {}
        res = daemon.execute_tool(args.tool, params, confirmed=args.confirmed)
        print(json.dumps(res, indent=2))
    else:
        print("Jasper AI Daemon initialized. Use --tool <name> to execute, or run tests.")

if __name__ == "__main__":
    main()
