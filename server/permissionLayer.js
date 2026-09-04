/**
 * JASPER Permission Layer
 * Enforces the 4-level AI action permission system:
 *   L0 - Read-only (auto-execute, no confirm)
 *   L1 - Low-risk actions (auto-execute, no confirm)
 *   L2 - External communication (user-configured, optional confirm)
 *   L3 - Sensitive actions (always require explicit confirmation)
 */

const fs = require('fs');
const path = require('path');

const PERMISSIONS_FILE = path.join(__dirname, 'data', 'agent_permissions.json');

class PermissionLayer {
  constructor() {
    this._pendingConfirmations = new Map(); // id -> { toolCall, resolve, reject, timer }
    this._broadcastFn = null; // injected by server
    this._confirmTimeoutMs = 30000;
  }

  /** Inject the WebSocket broadcast function from server */
  setBroadcastFn(fn) {
    this._broadcastFn = fn;
  }

  _loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(PERMISSIONS_FILE, 'utf8'));
    } catch {
      return { tool_overrides: {}, global_settings: { maxAutoExecuteLevel: 1, logAllActions: true, confirmationTimeoutSeconds: 30 } };
    }
  }

  _saveConfig(cfg) {
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(cfg, null, 2));
  }

  getConfig() {
    return this._loadConfig();
  }

  updateToolOverride(toolName, override) {
    const cfg = this._loadConfig();
    cfg.tool_overrides = cfg.tool_overrides || {};
    cfg.tool_overrides[toolName] = { ...(cfg.tool_overrides[toolName] || {}), ...override };
    this._saveConfig(cfg);
    return cfg;
  }

  updateGlobalSettings(settings) {
    const cfg = this._loadConfig();
    cfg.global_settings = { ...(cfg.global_settings || {}), ...settings };
    this._saveConfig(cfg);
    return cfg;
  }

  /**
   * Check if a tool can be executed.
   * @param {string} toolName
   * @param {number} permissionLevel - 0,1,2,3
   * @returns {{ allowed: boolean, requiresConfirmation: boolean, reason: string }}
   */
  checkPermission(toolName, permissionLevel) {
    const cfg = this._loadConfig();
    const override = (cfg.tool_overrides || {})[toolName] || {};
    const globalMax = (cfg.global_settings || {}).maxAutoExecuteLevel ?? 1;

    // Disabled tools are never allowed
    if (override.enabled === false) {
      return { allowed: false, requiresConfirmation: false, reason: `Tool '${toolName}' is disabled by user policy.` };
    }

    // L3 always requires confirmation regardless of overrides
    if (permissionLevel === 3) {
      return { allowed: true, requiresConfirmation: true, reason: 'Level 3 (Sensitive) — explicit confirmation required.' };
    }

    // L2 — external communication
    if (permissionLevel === 2) {
      const requireConfirm = override.requireConfirmation !== false; // default true for L2
      return {
        allowed: true,
        requiresConfirmation: requireConfirm,
        reason: requireConfirm
          ? 'Level 2 (External Communication) — user confirmation required.'
          : 'Level 2 — auto-execute allowed by user config.'
      };
    }

    // L0 / L1 — auto-execute if within global max
    if (permissionLevel <= globalMax) {
      return { allowed: true, requiresConfirmation: false, reason: 'Auto-execute permitted.' };
    }

    return { allowed: true, requiresConfirmation: false, reason: 'Auto-execute permitted.' };
  }

  /**
   * Request user confirmation via WebSocket.
   * Returns a Promise that resolves with { approved: bool, reason: string }
   */
  requestConfirmation(confirmationId, toolCall, broadcastFn) {
    const fn = broadcastFn || this._broadcastFn;
    return new Promise((resolve) => {
      // Broadcast to client
      if (fn) {
        fn({
          type: 'PERMISSION_REQUEST',
          id: confirmationId,
          tool: toolCall.tool,
          args: toolCall.args,
          level: toolCall.permissionLevel,
          description: toolCall.description || `Execute ${toolCall.tool}`,
          timestamp: new Date().toISOString()
        });
      }

      const timer = setTimeout(() => {
        this._pendingConfirmations.delete(confirmationId);
        resolve({ approved: false, reason: 'Confirmation timed out after 30 seconds.' });
      }, this._confirmTimeoutMs);

      this._pendingConfirmations.set(confirmationId, { toolCall, resolve, timer });
    });
  }

  /**
   * Called when client sends PERMISSION_RESPONSE
   */
  handleConfirmationResponse(confirmationId, approved, reason) {
    const pending = this._pendingConfirmations.get(confirmationId);
    if (!pending) return false;

    clearTimeout(pending.timer);
    this._pendingConfirmations.delete(confirmationId);
    pending.resolve({ approved, reason: reason || (approved ? 'User approved.' : 'User denied.') });
    return true;
  }

  getPendingConfirmations() {
    const result = [];
    this._pendingConfirmations.forEach((val, id) => {
      result.push({ id, tool: val.toolCall.tool, args: val.toolCall.args, description: val.toolCall.description });
    });
    return result;
  }
}

module.exports = new PermissionLayer();
