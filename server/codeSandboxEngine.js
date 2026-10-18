/**
 * J.A.S.P.E.R. Code Sandbox Engine
 * 
 * Provides secure interface to dedicated per-job container runner controllers:
 * - Fail-closed by design: Host arbitrary code execution is strictly and permanently disabled.
 * - Legacy in-process execution has been completely removed.
 * - Routes all code execution strictly to authenticated external container runner controllers.
 * - Validates input schemas, code size caps, timeouts, and language allowlists.
 * - Explicitly rejects PowerShell (cannot be sandboxed without Hyper-V isolation).
 * - Enforces server-derived identity and strict job ownership on cancellation.
 * - Zero secrets or host paths leaked in errors.
 */

const crypto = require('crypto');

// Configuration Constants
const MAX_CODE_LENGTH = 65536; // 64 KB
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 10000;

class CodeSandboxEngine {
  constructor() {
    this._activeRunnerJobs = new Map(); // executionId -> { controller, startTime, ownerId }
  }

  /**
   * Returns current sandbox capability and status without exposing sensitive infrastructure.
   */
  getStatus() {
    const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
    const externalRunnerUrl = process.env.JASPER_SANDBOX_RUNNER_URL;

    let mode = 'disabled';
    let enabled = false;
    let message = '';

    if (externalRunnerUrl) {
      if (!process.env.JASPER_SANDBOX_RUNNER_KEY || process.env.JASPER_SANDBOX_RUNNER_KEY.trim().length < 8) {
        mode = 'misconfigured_runner';
        enabled = false;
        message = 'External sandbox runner URL is configured but JASPER_SANDBOX_RUNNER_KEY is missing or invalid. Code execution is disabled fail-closed.';
      } else {
        mode = 'external_runner';
        enabled = true;
        message = 'Connected to dedicated isolated sandbox runner service.';
      }
    } else if (isProduction) {
      // In production without external runner, host execution is strictly disabled.
      // Setting ALLOW_HOST_CODE_EXECUTION=true alone is INSUFFICIENT to authorize execution.
      mode = 'disabled_in_production';
      enabled = false;
      message = 'Arbitrary code execution is disabled in production cloud environments. A dedicated container or microVM isolation runner (JASPER_SANDBOX_RUNNER_URL) is required.';
    } else {
      // In local development without external runner, arbitrary code execution on the host is disabled.
      // Process-level monkey-patching does not provide a real security boundary against untrusted code.
      mode = 'disabled_no_runner';
      enabled = false;
      message = 'Arbitrary code execution is disabled: No isolated sandbox runner (container or microVM) is configured. Direct host execution is blocked because process-level shims do not provide a real security boundary against untrusted code.';
    }

    return {
      enabled,
      mode,
      message,
      supportedLanguages: ['javascript', 'python'],
      disabledLanguages: {
        powershell: 'PowerShell execution on the host machine is disabled for security isolation: PowerShell cannot be safely sandboxed without Hyper-V container isolation. Please use isolated JavaScript or Python.'
      },
      network: 'disabled',
      maxTimeoutMs: MAX_TIMEOUT_MS,
      maxCodeBytes: MAX_CODE_LENGTH,
      activeJobs: this._activeRunnerJobs.size
    };
  }

  /**
   * Validates code execution request before launching execution.
   */
  validateRequest(reqBody) {
    const { code, language = 'javascript', timeoutMs } = reqBody || {};

    if (!code || typeof code !== 'string') {
      return { valid: false, status: 400, error: 'No code provided for execution.' };
    }

    if (code.length > MAX_CODE_LENGTH) {
      return { 
        valid: false, 
        status: 400, 
        error: `Code payload exceeds maximum permitted length of ${MAX_CODE_LENGTH} characters (received ${code.length}).` 
      };
    }

    const cleanLang = String(language).toLowerCase().trim();

    if (cleanLang === 'powershell' || cleanLang === 'pwsh') {
      return {
        valid: false,
        status: 400,
        error: 'PowerShell execution is disabled for security isolation: PowerShell cannot be safely sandboxed without Hyper-V container isolation. Please use isolated JavaScript or Python.',
        language: 'powershell'
      };
    }

    if (cleanLang !== 'javascript' && cleanLang !== 'python') {
      return {
        valid: false,
        status: 400,
        error: `Unsupported language '${language}'. Supported sandboxed languages: javascript, python.`,
        language: cleanLang
      };
    }

    const cleanTimeout = Math.max(1000, Math.min(MAX_TIMEOUT_MS, parseInt(timeoutMs, 10) || DEFAULT_TIMEOUT_MS));

    return {
      valid: true,
      cleanCode: code,
      cleanLang,
      cleanTimeout
    };
  }

  /**
   * Cancels an active execution on the isolated runner controller.
   * Requires authenticated user identity matching the job's recorded owner.
   */
  async cancelExecution(executionId, requesterId) {
    if (!requesterId || typeof requesterId !== 'string') {
      return {
        success: false,
        status: 401,
        error: 'Authenticated user identity required for cancellation.'
      };
    }

    const runnerJob = this._activeRunnerJobs.get(executionId);
    if (!runnerJob) {
      return { success: false, status: 404, error: 'Execution job not found or already completed.' };
    }

    // Strict ownership verification: ordinary callers cannot cancel other users' jobs
    if (runnerJob.ownerId && runnerJob.ownerId !== requesterId) {
      return {
        success: false,
        status: 403,
        error: "Access denied: You do not have permission to cancel another user's execution job."
      };
    }

    if (runnerJob.controller) {
      try { runnerJob.controller.abort(); } catch (_) {}
    }
    this._activeRunnerJobs.delete(executionId);

    const runnerUrl = process.env.JASPER_SANDBOX_RUNNER_URL;
    if (runnerUrl) {
      try {
        const cancelEndpoint = runnerUrl.endsWith('/') ? `${runnerUrl}cancel` : `${runnerUrl}/cancel`;
        fetch(cancelEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.JASPER_SANDBOX_RUNNER_KEY ? { 'Authorization': `Bearer ${process.env.JASPER_SANDBOX_RUNNER_KEY}` } : {})
          },
          body: JSON.stringify({ executionId, requesterId })
        }).catch(() => {});
      } catch (_) {}
    }

    return {
      success: true,
      message: `Execution ${executionId} cancellation requested.`,
      executionId
    };
  }

  /**
   * Main execution entry point.
   * Fails closed if isolated external runner is not configured.
   * Never falls back to host execution.
   */
  async execute(params, metadata = {}) {
    const status = this.getStatus();
    if (!status.enabled) {
      return {
        success: false,
        error: status.message,
        executionId: null,
        exitCode: 1,
        stdout: '',
        stderr: '',
        durationMs: 0,
        sandboxMode: status.mode
      };
    }

    // Only supported execution mode is external container runner controller
    return this._executeExternalRunner(process.env.JASPER_SANDBOX_RUNNER_URL, params, metadata);
  }

  /**
   * Dispatches code execution request to the external container runner controller.
   */
  async _executeExternalRunner(runnerUrl, params, metadata = {}) {
    const { cleanCode, cleanLang, cleanTimeout } = params;
    const { userId = 'jwalant' } = metadata;
    const startTime = Date.now();
    const executionId = `ext_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const controller = new AbortController();
    this._activeRunnerJobs.set(executionId, { controller, startTime, ownerId: userId });

    const runnerKey = process.env.JASPER_SANDBOX_RUNNER_KEY;
    if (!runnerKey || runnerKey.trim().length < 8) {
      this._activeRunnerJobs.delete(executionId);
      return {
        success: false,
        error: 'Runner authentication key is missing or invalid. Execution aborted fail-closed.',
        stdout: '',
        stderr: '',
        durationMs: 0,
        sandboxMode: 'misconfigured_runner'
      };
    }

    try {
      const timer = setTimeout(() => controller.abort(), cleanTimeout + 3000);
      const runnerEndpoint = runnerUrl.endsWith('/') ? `${runnerUrl}run` : `${runnerUrl}/run`;
      const res = await fetch(runnerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${runnerKey.trim()}`
        },
        body: JSON.stringify({
          code: cleanCode,
          language: cleanLang,
          timeoutMs: cleanTimeout,
          executionId,
          ownerId: userId
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      this._activeRunnerJobs.delete(executionId);

      if (!res.ok) {
        let errorMsg = `External sandbox runner returned status ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch (_) {}

        return {
          success: false,
          error: errorMsg,
          stdout: '',
          stderr: '',
          durationMs: Date.now() - startTime,
          sandboxMode: 'external_runner'
        };
      }

      const data = await res.json();
      return {
        success: Boolean(data.success),
        stdout: String(data.stdout || '').trim(),
        stderr: String(data.stderr || '').trim(),
        output: data.output || (data.stdout ? String(data.stdout).trim() : ''),
        exitCode: data.exitCode || 0,
        executionId: data.executionId || executionId,
        durationMs: data.durationMs || (Date.now() - startTime),
        timedOut: Boolean(data.timedOut),
        cancelled: Boolean(data.cancelled),
        language: cleanLang,
        sandboxMode: 'external_runner'
      };
    } catch (err) {
      this._activeRunnerJobs.delete(executionId);
      if (controller.signal.aborted) {
        return {
          success: false,
          cancelled: true,
          error: 'Execution cancelled by user request.',
          stdout: '',
          stderr: '',
          exitCode: 130,
          executionId,
          durationMs: Date.now() - startTime,
          sandboxMode: 'external_runner'
        };
      }
      return {
        success: false,
        error: 'Unable to reach configured external sandbox runner service.',
        stdout: '',
        stderr: '',
        durationMs: Date.now() - startTime,
        sandboxMode: 'external_runner'
      };
    }
  }
}

module.exports = new CodeSandboxEngine();
