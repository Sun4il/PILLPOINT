import { spawn } from 'node:child_process';

const backendHealthUrl = 'http://127.0.0.1:5001/api/health';
const npmCommand = 'npm';
const viteCommand = 'vite';

let backendProcess = null;
let frontendProcess = null;
let shuttingDown = false;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const isBackendHealthy = async () => {
  try {
    const response = await fetch(backendHealthUrl);
    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    return payload?.ok === true;
  } catch {
    return false;
  }
};

const shutdown = (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of [frontendProcess, backendProcess]) {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  }

  process.exitCode = exitCode;
};

const startProcess = (name, command, args) => {
  const child = spawn(command, args, {
    env: process.env,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (error) => {
    if (shuttingDown) {
      return;
    }

    console.error(`[${name}] failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (code !== 0) {
      const signalSuffix = signal ? ` (signal ${signal})` : '';
      console.error(`[${name}] exited with code ${code}${signalSuffix}`);
      shutdown(code || 1);
    }
  });

  return child;
};

const waitForBackend = async () => {
  const timeoutAt = Date.now() + 60000;

  while (Date.now() < timeoutAt) {
    if (await isBackendHealthy()) {
      return;
    }

    await sleep(500);
  }

  throw new Error('Backend did not become healthy within 60 seconds.');
};

const main = async () => {
  const backendAlreadyRunning = await isBackendHealthy();

  if (!backendAlreadyRunning) {
    backendProcess = startProcess('backend', npmCommand, ['run', 'backend']);
    await waitForBackend();
  } else {
    console.log('Backend already healthy on http://localhost:5001, reusing it.');
  }

  frontendProcess = startProcess('frontend', viteCommand, []);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((error) => {
  console.error(error.message);
  shutdown(1);
});