#!/usr/bin/env node
/**
 * J.A.S.P.E.R. Dedicated Runner Verification Script
 * 
 * Verifies connectivity, health, authentication, execution, timeout,
 * and isolation boundaries against a local or remote runner instance.
 * 
 * Usage:
 *   node runner/verify-runner.js <RUNNER_URL> <RUNNER_SECRET>
 * Example:
 *   node runner/verify-runner.js https://runner.example.com supersecretkey123
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const targetUrl = process.argv[2] || process.env.JASPER_SANDBOX_RUNNER_URL;
const runnerKey = process.argv[3] || process.env.JASPER_SANDBOX_RUNNER_KEY;

if (!targetUrl || !runnerKey) {
  console.error('Usage: node runner/verify-runner.js <RUNNER_URL> <RUNNER_SECRET>');
  console.error('   or: Set JASPER_SANDBOX_RUNNER_URL and JASPER_SANDBOX_RUNNER_KEY');
  process.exit(1);
}

function request(urlStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(parsed, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json || data });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('===============================================================');
  console.log(' J.A.S.P.E.R. Dedicated Sandbox Runner End-to-End Verification');
  console.log(' Target:', targetUrl);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name, testFn) {
    process.stdout.write(`• ${name}... `);
    try {
      await testFn();
      console.log('[\x1b[32mPASS\x1b[0m]');
      passed++;
    } catch (err) {
      console.log('[\x1b[31mFAIL\x1b[0m]');
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  }

  const base = targetUrl.replace(/\/+$/, '');

  // 1. Health check probe
  await check('GET /health unauthenticated status probe', async () => {
    const res = await request(`${base}/health`);
    if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
    if (res.body.status !== 'healthy') throw new Error(`Status not healthy: ${JSON.stringify(res.body)}`);
    if (res.body.isolation !== 'container_per_job') throw new Error(`Expected container_per_job isolation`);
    if (res.body.nodeImageImmutable !== true) throw new Error(`Node image is not immutable SHA-256 digest`);
    if (res.body.pythonImageImmutable !== true) throw new Error(`Python image is not immutable SHA-256 digest`);
  });

  // 2. Unauthenticated POST /run MUST be rejected
  await check('POST /run without credentials fails closed (HTTP 401)', async () => {
    const res = await request(`${base}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { code: 'console.log(1);', language: 'javascript', ownerId: 'test' });
    if (res.statusCode !== 401) throw new Error(`Expected HTTP 401, got ${res.statusCode}`);
  });

  // 3. Invalid Bearer token MUST be rejected
  await check('POST /run with invalid Bearer token fails closed (HTTP 401)', async () => {
    const res = await request(`${base}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_secret_token_value_here'
      }
    }, { code: 'console.log(1);', language: 'javascript', ownerId: 'test' });
    if (res.statusCode !== 401) throw new Error(`Expected HTTP 401, got ${res.statusCode}`);
  });

  // 4. Missing ownerId MUST return HTTP 400
  await check('POST /run with missing ownerId fails closed (HTTP 400)', async () => {
    const res = await request(`${base}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runnerKey}`
      }
    }, { code: 'console.log(1);', language: 'javascript' });
    if (res.statusCode !== 400) throw new Error(`Expected HTTP 400, got ${res.statusCode}`);
  });

  // 5. JavaScript execution inside isolated container
  await check('POST /run executes JavaScript in container and returns output', async () => {
    const res = await request(`${base}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runnerKey}`
      }
    }, {
      code: 'console.log(JSON.stringify({ calculated: 6 * 7 }));',
      language: 'javascript',
      ownerId: 'verification_tester'
    });
    if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (!res.body.success) throw new Error(`Execution was not successful: ${JSON.stringify(res.body)}`);
    if (!res.body.stdout.includes('"calculated":42')) throw new Error(`Expected output 42, got: ${res.body.stdout}`);
  });

  // 6. Python execution inside isolated container
  await check('POST /run executes Python in container and returns output', async () => {
    const res = await request(`${base}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runnerKey}`
      }
    }, {
      code: 'print("py_verified_" + str(2026))',
      language: 'python',
      ownerId: 'verification_tester'
    });
    if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (!res.body.success) throw new Error(`Execution was not successful`);
    if (!res.body.stdout.includes('py_verified_2026')) throw new Error(`Expected output py_verified_2026, got: ${res.body.stdout}`);
  });

  // 7. Network isolation test
  await check('Container network isolation (--network none verified)', async () => {
    const res = await request(`${base}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runnerKey}`
      }
    }, {
      code: `
        const https = require('https');
        const req = https.get('https://1.1.1.1', { timeout: 1000 }, () => {
          console.log('NETWORK_ACCESSIBLE');
        });
        req.on('error', (e) => {
          console.log('NETWORK_BLOCKED_' + e.code);
        });
      `,
      language: 'javascript',
      ownerId: 'verification_tester'
    });
    if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
    if (res.body.stdout.includes('NETWORK_ACCESSIBLE')) throw new Error(`Container had network access!`);
    if (!res.body.stdout.includes('NETWORK_BLOCKED')) throw new Error(`Expected network blocked confirmation`);
  });

  console.log('\n---------------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('---------------------------------------------------------------');
  if (failed > 0) process.exit(1);
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err.message);
  process.exit(1);
});
